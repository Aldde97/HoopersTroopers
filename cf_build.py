# Cloudflare Pages build: assembles the website from this repo into dist/.
#   landing page (site/) at /, the game at /play/.
# Cloudflare settings: build command "python3 cf_build.py", output directory "dist", root directory empty.
# Only the files the game's index.html actually loads are copied, plus the sprites and logos they use.
# Cloud accounts are switched on only when the environment variables BM_CLOUD_URL and BM_CLOUD_ANON are set
# (Cloudflare: Settings > Variables); without them the game runs with saves in the browser, like the artifact.
import os, re, shutil, json, hashlib

ROOT = os.path.dirname(os.path.abspath(__file__)) + '/'
OUT = ROOT + 'dist/'
if os.path.exists(OUT):
    shutil.rmtree(OUT)
shutil.copytree(ROOT + 'site', OUT)
P = OUT + 'play/'
os.makedirs(P)

h = open(ROOT + 'index.html', encoding='utf-8').read()
files = {'index.html'} | set(re.findall(r'<script src="([^"?]+)', h))
for f in sorted(files):
    shutil.copy(ROOT + f, P + f)

# sprites: everything the scripts point at (sprites/*.jpg|png|webp)
refs = set()
for f in files:
    s = open(ROOT + f, encoding='utf-8', errors='ignore').read()
    refs |= set(re.findall(r'sprites/[\w.-]+\.(?:jpg|png|webp)', s))
os.makedirs(P + 'sprites')
miss = []
for r in sorted(refs):
    if os.path.exists(ROOT + r):
        shutil.copy(ROOT + r, P + r)
    else:
        miss.append(r)
# club crests: some paths are built in code ('logos/'+code+'.png'), so the whole folder goes along
shutil.copytree(ROOT + 'logos', P + 'logos')

# accounts and cloud saves (optional)
url, anon = os.environ.get('BM_CLOUD_URL', ''), os.environ.get('BM_CLOUD_ANON', '')
if url and anon and os.path.exists(ROOT + 'cloud/cloud.js'):
    js = open(ROOT + 'cloud/cloud.js', encoding='utf-8').read()
    shutil.copy(ROOT + 'cloud/cloud.js', P + 'cloud.js')
    v = hashlib.sha1(js.encode()).hexdigest()[:8]
    ph = open(P + 'index.html', encoding='utf-8').read()
    cfg = {'url': url, 'anon': anon}
    if os.environ.get('BM_TURNSTILE_SITE'):   # public Turnstile site key: turns on the bot check in the sign-in screens
        cfg['turnstile'] = os.environ['BM_TURNSTILE_SITE']
    inj = ('<script>window.BM_CLOUD=' + json.dumps(cfg) + ';</script>\n'
           '<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js"></script>\n'
           f'<script src="cloud.js?v={v}"></script>\n')
    i = ph.rfind('</body>')
    ph = ph[:i] + inj + ph[i:] if i >= 0 else ph + inj
    open(P + 'index.html', 'w', encoding='utf-8').write(ph)
    print('cloud: on' + (' · bot check on' if cfg.get('turnstile') else ''))
else:
    print('cloud: off')

# long cache for versioned game files and images, short for the HTML
open(OUT + '_headers', 'w').write("""/play/*.js
  Cache-Control: public, max-age=31536000, immutable
/play/sprites/*
  Cache-Control: public, max-age=31536000, immutable
/play/logos/*
  Cache-Control: public, max-age=2592000
/assets/*
  Cache-Control: public, max-age=604800
/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  X-Frame-Options: SAMEORIGIN
  Content-Security-Policy: frame-ancestors 'self'
  Strict-Transport-Security: max-age=31536000; includeSubDomains
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()
""")
# frame headers stop other sites from embedding the game (clickjacking); HSTS keeps browsers on HTTPS;
# the permissions list switches off device features the game never uses (share and clipboard stay allowed)

if os.path.exists(ROOT + 'tools/career/runtime.js'):
    shutil.copy(ROOT + 'tools/career/runtime.js', P + 'career-runtime.js')
if os.environ.get('BM_ARCHIVE_ONLY') != '1':
    from tools.career.releases import package
    package(ROOT, P)

size = sum(os.path.getsize(os.path.join(d, f)) for d, _, fs in os.walk(OUT) for f in fs)
n = sum(len(fs) for _, _, fs in os.walk(OUT))
big = [os.path.join(d, f) for d, _, fs in os.walk(OUT) for f in fs if os.path.getsize(os.path.join(d, f)) > 25 * 1024 * 1024]
print(f'dist: {n} files, {size/1e6:.1f} MB; game scripts {len(files)-1}, sprites {len(refs)-len(miss)}; missing {miss[:8]}')
if miss or big or n > 20000:
    raise SystemExit(f'build problem: missing {miss[:8]}, files over 25 MB {big[:3]}, file count {n}')
