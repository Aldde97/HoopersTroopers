# Assembles the deployable site: landing page at /, the game at /play/.
# Only the files the game's index.html actually loads are copied (no pre_* build copies).
# Usage: python3 build_dist.py [out_dir]   (default ~/bm-work/dist)
import os,re,shutil,sys
G='/Users/aldin/Basketball-Manager-Euroleague/'
OUT=sys.argv[1] if len(sys.argv)>1 else '/Users/aldin/bm-work/dist/'
if os.path.exists(OUT):shutil.rmtree(OUT)
shutil.copytree(G+'site',OUT)
P=OUT+'play/';os.makedirs(P)
h=open(G+'index.html',encoding='utf-8').read()
files={'index.html'}|set(re.findall(r'<script src="([^"?]+)',h))
for f in sorted(files):shutil.copy(G+f,P+f)
# sprites: everything the scripts point at (sprites/*.jpg|png), checked against the files on disk
refs=set()
for f in files:
    s=open(G+f,encoding='utf-8',errors='ignore').read()
    refs|=set(re.findall(r'sprites/[\w.-]+\.(?:jpg|png|webp)',s))
os.makedirs(P+'sprites')
miss=[]
for r in sorted(refs):
    if os.path.exists(G+r):shutil.copy(G+r,P+r)
    else:miss.append(r)
size=sum(os.path.getsize(os.path.join(d,f)) for d,_,fs in os.walk(OUT) for f in fs)
n=sum(len(fs) for _,_,fs in os.walk(OUT))
print(f'dist: {n} files, {size/1e6:.1f} MB; game scripts {len(files)-1}, sprites {len(refs)-len(miss)}; missing {miss[:8]}')
# Cloudflare Pages: long cache for versioned game files and images, short for the HTML
open(OUT+'_headers','w').write("""/play/*.js
  Cache-Control: public, max-age=31536000, immutable
/play/sprites/*
  Cache-Control: public, max-age=31536000, immutable
/assets/*
  Cache-Control: public, max-age=604800
/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
""")
