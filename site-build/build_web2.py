# Builds the new landing page (simpler, clearer) into ~/Basketball-Manager-Euroleague/site/index.html.
# Images come from ~/bm-work/web2 (shots cropped to site/assets/w/*.webp|jpg, crests in site/assets/w/crest/).
import os
OUT='/Users/aldin/Basketball-Manager-Euroleague/site/index.html'
C='/Users/aldin/Basketball-Manager-Euroleague/site/assets/w/crest/'
crests=sorted(os.listdir(C),key=lambda f:['RMB','LAL','DUKE','OLY','BOS','FCB','PAO','GSW','FEN','UNC','EFS','CHI','ZAL','UCLA','PAR','NYK','CZV','MIA','MTA','KU','BAY','DAL','VIR','UK','MIL','OKC','ASV','CONN','VAL','DEN','UNI','MSU','TOR','PHX'].index(f.split('.')[0]) if f.split('.')[0] in ['RMB','LAL','DUKE','OLY','BOS','FCB','PAO','GSW','FEN','UNC','EFS','CHI','ZAL','UCLA','PAR','NYK','CZV','MIA','MTA','KU','BAY','DAL','VIR','UK','MIL','OKC','ASV','CONN','VAL','DEN','UNI','MSU','TOR','PHX'] else 99)
row=''.join(f'<li><img src="/assets/w/crest/{f}" alt="" width="64" height="64" loading="lazy" decoding="async"></li>' for f in crests)
LZ=' loading="lazy"'
pic=lambda n,alt,w,h,cls='',lazy=True:f'<picture><source srcset="/assets/w/{n}.webp" type="image/webp"><img src="/assets/w/{n}.jpg" alt="{alt}" width="{w}" height="{h}" class="{cls}"{LZ if lazy else ""} decoding="async"></picture>'
LG=[('Europe',['EuroLeague','EuroCup','Liga Endesa','Türkiye BSL','Greek GBL','Lega A','easyCredit BBL','Betclic Élite','ABA League','LKL','BNXT','+ 20 more']),
    ('North America',['NBA','NBA G League','NCAA Division I','BSN Puerto Rico']),
    ('The rest of the world',['B.League','CBA','NBL Australia','PBA','Liga Nacional','NBB','+ more'])]
lg=''.join(f'<div class="lg"><h3>{t}</h3><ul>{"".join(f"<li>{x}</li>" for x in L)}</ul></div>' for t,L in LG)
html=f'''<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Basketball Manager · Coach any club in the world</title>
<meta name="description" content="A free basketball manager game in your browser. Pick any of 1,013 real clubs, from Real Madrid to the Lakers to Duke, build your team and coach every game live.">
<meta property="og:type" content="website"><meta property="og:title" content="Basketball Manager: coach any club in the world">
<meta property="og:description" content="Real clubs. Real players. You call the plays. Free in your browser.">
<meta property="og:image" content="/assets/og.jpg"><meta name="twitter:card" content="summary_large_image"><meta name="theme-color" content="#0b0d12">
<link rel="icon" href="/assets/icon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,700;0,800;1,800&family=Barlow:wght@400;500;600;700&display=swap">
<style>
/* Basketball Manager landing: one dark sports look, big close-up game moments, few words. */
:root{{--bg:#0b0d12;--panel:#141821;--line:#232937;--fg:#f2f4f8;--mut:#a3abb9;--or:#ff6b00;--or2:#ff8a2e;--g:#2fbf71;color-scheme:dark}}
*{{box-sizing:border-box}}html{{scroll-behavior:smooth}}
body{{margin:0;background:var(--bg);color:var(--fg);font:17px/1.6 'Barlow',system-ui,-apple-system,sans-serif;-webkit-font-smoothing:antialiased}}
img{{display:block;max-width:100%;height:auto}}a{{color:inherit}}
:focus-visible{{outline:3px solid var(--or);outline-offset:3px}}
.gut{{padding-left:max(20px,env(safe-area-inset-left,0px));padding-right:max(20px,env(safe-area-inset-right,0px))}}
.wrap{{max-width:1200px;margin-inline:auto}}
.d{{font-family:'Barlow Condensed','Arial Narrow',sans-serif;font-weight:800;text-transform:uppercase;letter-spacing:.01em;line-height:.95}}
.btn{{display:inline-flex;align-items:center;justify-content:center;gap:10px;height:56px;padding:0 30px;border-radius:10px;font:800 20px/1 'Barlow Condensed',sans-serif;letter-spacing:.07em;text-transform:uppercase;text-decoration:none;transition:transform .15s,background .15s}}
.btn.p{{background:var(--or);color:#fff;box-shadow:0 10px 30px #ff6b0040}}.btn.p:hover{{background:var(--or2);transform:translateY(-1px)}}
.btn.s{{color:var(--fg);border:2px solid var(--line)}}.btn.s:hover{{border-color:var(--mut)}}
/* header */
.hd{{position:sticky;top:0;z-index:20;background:#0b0d12e6;backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border-bottom:1px solid var(--line);padding-top:env(safe-area-inset-top,0px)}}
.hd .wrap{{display:flex;align-items:center;justify-content:space-between;height:64px}}
.logo{{display:flex;align-items:center;gap:10px;text-decoration:none}}.logo img{{width:30px;height:30px}}.logo b{{font:800 22px/1 'Barlow Condensed',sans-serif;letter-spacing:.04em;text-transform:uppercase}}.logo b span{{color:var(--or)}}
.hd .btn{{height:42px;padding:0 20px;font-size:17px}}
/* hero */
.hero{{position:relative;overflow:hidden;padding-block:64px 40px}}
.hero::before{{content:"";position:absolute;inset:-20% -10% auto 35%;height:900px;background:radial-gradient(closest-side,#ff6b0026,transparent);pointer-events:none}}
.hero .wrap{{position:relative;display:grid;grid-template-columns:minmax(0,1.05fr) minmax(0,1fr);gap:48px;align-items:center}}
.eb{{display:inline-flex;gap:8px;align-items:center;font:700 14px/1 'Barlow Condensed',sans-serif;letter-spacing:.16em;text-transform:uppercase;color:var(--or2)}}
.eb i{{width:8px;height:8px;border-radius:50%;background:var(--g);box-shadow:0 0 0 4px #2fbf7133}}
h1{{font-size:clamp(46px,6.4vw,86px);margin:16px 0 20px;text-wrap:balance}}h1 em{{font-style:italic;color:var(--or)}}
.lead{{font-size:clamp(18px,1.6vw,21px);color:#cfd5df;max-width:34em;margin:0 0 30px}}
.cta{{display:flex;gap:14px;flex-wrap:wrap;align-items:center}}
.facts{{display:flex;gap:28px;flex-wrap:wrap;margin-top:34px;padding-top:26px;border-top:1px solid var(--line)}}
.facts div b{{display:block;font:800 34px/1 'Barlow Condensed',sans-serif}}.facts div span{{font-size:13px;letter-spacing:.1em;text-transform:uppercase;color:var(--mut)}}
.shot{{position:relative;max-width:560px;justify-self:end;width:100%}}
.shot{{margin-top:30px}}.shot .main{{border-radius:18px;overflow:hidden;box-shadow:0 30px 80px #000a,0 0 0 1px #ffffff14;transform:rotate(1.5deg)}}
.sb{{position:absolute;left:-40px;top:-30px;display:flex;align-items:center;gap:14px;padding:14px 18px;border-radius:14px;background:#101319;box-shadow:0 20px 50px #000c,0 0 0 1px #ffffff1a;transform:rotate(-2deg)}}
.sb img{{width:44px;height:44px;object-fit:contain}}.sb .n{{font:800 44px/1 'Barlow Condensed',sans-serif}}.sb .clk{{display:flex;flex-direction:column;align-items:center;gap:4px}}
.sb .clk b{{background:#000;color:#ffd27a;border-radius:6px;padding:4px 10px;font:800 24px/1 'Barlow Condensed',sans-serif;letter-spacing:.04em}}.sb .clk small{{font:700 12px/1 'Barlow Condensed',sans-serif;letter-spacing:.14em;color:var(--or2)}}
.sb .live{{width:8px;height:8px;border-radius:50%;background:#ff3b30;display:inline-block;margin-right:4px;animation:pu 1.4s infinite}}
@keyframes pu{{50%{{opacity:.3}}}}
.ac{{position:absolute;right:-30px;bottom:-34px;width:min(330px,62%);border-radius:14px;overflow:hidden;box-shadow:0 20px 50px #000c,0 0 0 1px #ffffff1a;transform:rotate(-1deg)}}
/* crest marquee */
.clubs{{padding-block:44px 30px;border-block:1px solid var(--line);background:#0e1117}}
.clubs p{{text-align:center;margin:0 0 22px;font:800 clamp(24px,2.6vw,32px)/1.1 'Barlow Condensed',sans-serif;text-transform:uppercase}}.clubs p span{{color:var(--or)}}
.mq{{overflow:hidden;-webkit-mask-image:linear-gradient(90deg,transparent,#000 8%,#000 92%,transparent);mask-image:linear-gradient(90deg,transparent,#000 8%,#000 92%,transparent)}}
.mq ul{{display:flex;gap:34px;list-style:none;margin:0;padding:6px 0;width:max-content;animation:mq 55s linear infinite}}
.mq:hover ul{{animation-play-state:paused}}.mq li img{{width:64px;height:64px;object-fit:contain;filter:drop-shadow(0 4px 10px #0008)}}
@keyframes mq{{to{{transform:translateX(-50%)}}}}
@media (prefers-reduced-motion:reduce){{.mq ul{{animation:none;flex-wrap:wrap;justify-content:center;width:auto}}.sb .live{{animation:none}}}}
/* steps */
.how{{padding-block:96px 40px}}
.how>.wrap>h2,.sec-h{{font-size:clamp(38px,4.8vw,62px);margin:0 0 12px;text-align:center}}
.sub{{text-align:center;color:var(--mut);margin:0 auto 64px;max-width:32em}}
.step{{display:grid;grid-template-columns:minmax(0,.85fr) minmax(0,1.15fr);gap:56px;align-items:center;margin-bottom:110px}}
.step:nth-of-type(even){{grid-template-columns:minmax(0,1.15fr) minmax(0,.85fr)}}.step:nth-of-type(even) .tx{{order:2}}
.num{{display:inline-grid;place-items:center;width:48px;height:48px;border-radius:50%;background:var(--or);font:800 24px/1 'Barlow Condensed',sans-serif;margin-bottom:18px}}
.tx h3{{font-size:clamp(38px,4.2vw,56px);margin:0 0 16px}}.tx p{{margin:0 0 18px;color:#cfd5df;font-size:19px;max-width:26em}}
.tx ul{{list-style:none;padding:0;margin:0;display:grid;gap:10px}}.tx li{{display:flex;gap:10px;color:var(--mut)}}.tx li::before{{content:"";flex:none;width:18px;height:18px;margin-top:4px;border-radius:50%;background:var(--g) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z' fill='%23fff'/%3E%3C/svg%3E") center/12px no-repeat}}
.vis{{position:relative}}.vis .f{{border-radius:16px;overflow:hidden;box-shadow:0 26px 70px #000b,0 0 0 1px #ffffff14}}
.vis .o{{position:absolute;border-radius:14px;overflow:hidden;box-shadow:0 20px 50px #000c,0 0 0 1px #ffffff1a}}
.v2 .f{{max-width:400px;margin-left:auto}}.v2 .o{{left:0;bottom:-30px;width:min(300px,52%)}}
.v3 .o{{right:-24px;bottom:-40px;width:min(380px,58%)}}
/* leagues */
.lgs{{padding-block:40px 100px}}.lgs .grid{{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px;margin-top:40px}}
.lg{{background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:24px}}.lg h3{{margin:0 0 14px;font:800 22px/1 'Barlow Condensed',sans-serif;text-transform:uppercase;letter-spacing:.04em;color:var(--or2)}}
.lg ul{{list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;gap:8px}}.lg li{{padding:6px 12px;border-radius:999px;background:#1d2230;font-size:15px}}
/* price */
.price{{padding-block:90px;background:#0e1117;border-block:1px solid var(--line)}}
.plans{{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px;max-width:820px;margin:44px auto 0}}
.plan{{background:var(--panel);border:1px solid var(--line);border-radius:18px;padding:30px}}.plan.hi{{border:2px solid var(--or)}}
.plan small{{font:700 14px/1 'Barlow Condensed',sans-serif;letter-spacing:.14em;text-transform:uppercase;color:var(--mut)}}.plan b{{display:block;font:800 60px/1 'Barlow Condensed',sans-serif;margin:10px 0 16px}}.plan b span{{font-size:20px;color:var(--mut);letter-spacing:.04em}}
.plan ul{{list-style:none;padding:0;margin:0;display:grid;gap:8px;color:#cfd5df}}.plan li::before{{content:"✓";color:var(--g);font-weight:700;margin-right:10px}}
/* faq + end */
.faq{{padding-block:90px 40px;max-width:760px;margin-inline:auto}}.faq h2{{text-align:center;font-size:clamp(34px,4vw,48px);margin:0 0 30px}}
details{{border-bottom:1px solid var(--line);padding:18px 0}}summary{{cursor:pointer;font-weight:600;font-size:18px;list-style:none;display:flex;justify-content:space-between;gap:16px}}summary::after{{content:"+";color:var(--or);font-size:24px;line-height:1}}details[open] summary::after{{content:"–"}}details p{{margin:12px 0 0;color:var(--mut)}}
.end{{text-align:center;padding-block:80px 90px}}.end h2{{font-size:clamp(40px,5.4vw,70px);margin:0 0 26px}}
footer{{border-top:1px solid var(--line);padding-block:26px calc(26px + env(safe-area-inset-bottom,0px));color:var(--mut);font-size:14px}}footer .wrap{{display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap}}footer nav{{display:flex;gap:18px}}
@media (max-width:900px){{
 .hero{{padding-block:40px 70px}}.hero .wrap,.step,.step:nth-of-type(even){{grid-template-columns:minmax(0,1fr);gap:40px}}.step:nth-of-type(even) .tx{{order:0}}
 .shot{{justify-self:center;max-width:440px}}.sb{{left:-10px}}.ac{{right:-10px}}
 .lgs .grid,.plans{{grid-template-columns:minmax(0,1fr)}}.step{{margin-bottom:90px}}.v3 .o{{right:-8px}}
}}
@media (max-width:520px){{.logo b{{font-size:19px;white-space:nowrap}}.hd .btn{{white-space:nowrap;height:40px;padding:0 16px;font-size:16px}}.facts{{display:grid;grid-template-columns:1fr 1fr}}.sb{{gap:10px;padding:10px 12px}}.sb img{{width:32px;height:32px}}.sb .n{{font-size:32px}}.sb .clk b{{font-size:18px}}.facts{{gap:20px}}.facts div b{{font-size:28px}}.btn{{width:100%}}.hd .btn{{width:auto}}}}
</style></head>
<body>
<header class="hd gut"><div class="wrap"><a class="logo" href="/"><img src="/assets/icon.svg" alt=""><b>Basketball <span>Manager</span></b></a><a class="btn p" href="/play/">Play free</a></div></header>
<main>
<section class="hero gut"><div class="wrap">
 <div>
  <span class="eb"><i></i>Free browser game · Season 2026/27</span>
  <h1 class="d">Coach any basketball club <em>in the world.</em></h1>
  <p class="lead">Pick a real club, from Real Madrid to the Lakers to Duke. Build your team, set the rotation and call the plays in live games. Win the title.</p>
  <div class="cta"><a class="btn p" href="/play/">Play free</a><a class="btn s" href="#how">How it works</a></div>
  <div class="facts"><div><b>1,013</b><span>real clubs</span></div><div><b>13,900+</b><span>real players</span></div><div><b>60</b><span>leagues</span></div><div><b>0</b><span>downloads</span></div></div>
 </div>
 <div class="shot">
  <div class="main">{pic('rotation','The rotation builder: Real Madrid starters with portraits and ratings on a court',960,1328,lazy=False)}</div>
  <div class="sb" aria-label="Live score: Real Madrid 47, Crvena Zvezda 37, third quarter"><img src="/assets/w/crest/RMB.png" alt=""><span class="n">47</span><span class="clk"><small><span class="live"></span>Q3 LIVE</small><b>06:56</b></span><span class="n">37</span><img src="/assets/w/crest/CZV.svg" alt=""></div>
 </div>
</div></section>
<section class="clubs"><p>1,013 real clubs. <span>Pick yours.</span></p><div class="mq" aria-label="Some of the clubs in the game"><ul>{row}{row.replace('<li>','<li aria-hidden="true">')}</ul></div></section>
<section class="how gut" id="how"><div class="wrap">
 <h2 class="d">How it works</h2><p class="sub">Three steps. Your first game is a minute away.</p>
 <div class="step"><div class="tx"><span class="num">1</span><h3 class="d">Pick your club</h3><p>Any club in 60 leagues: a EuroLeague giant, an NBA franchise, a college program or a small team in the third division.</p><ul><li>Real rosters for the 2026/27 season</li><li>Every club has its own budget and goals</li></ul></div>
  <div class="vis"><div class="f">{pic('club','Club selection: Real Madrid with stadium, coach and best players',1600,545)}</div></div></div>
 <div class="step"><div class="tx"><span class="num">2</span><h3 class="d">Build your team</h3><p>Sign players, set the starting five and decide who plays how many minutes. Every player has real strengths and weaknesses.</p><ul><li>Transfers, free agents and contracts</li><li>Rotation, tactics and plays</li></ul></div>
  <div class="vis v2"><div class="f">{pic('player','Facundo Campazzo: rating 85, minutes, attributes, salary and morale',660,1170)}</div></div></div>
 <div class="step"><div class="tx"><span class="num">3</span><h3 class="d">Coach every game live</h3><p>Watch the game unfold, call timeouts, change the line-up and react when a player gets hot or picks up fouls.</p><ul><li>Live court with every shot</li><li>Your assistant tells you what is happening</li></ul></div>
  <div class="vis v3"><div class="f">{pic('court','Live court: every made and missed shot of both teams',1100,723)}</div><div class="o">{pic('coach','The assistant coach suggests moves during the game',708,449)}</div></div></div>
</div></section>
<section class="lgs gut"><div class="wrap"><h2 class="d sec-h">60 leagues. One game.</h2><p class="sub" style="margin-bottom:0">Plus 94 national teams, the EuroLeague and EuroCup, March Madness and the NBA Draft.</p><div class="grid">{lg}</div></div></section>
<section class="price gut"><div class="wrap"><h2 class="d sec-h">Start free</h2><p class="sub" style="margin-bottom:0">Play a full season with any club. Keep going for one payment. No subscription, no ads.</p>
 <div class="plans"><div class="plan"><small>Free</small><b>$0</b><ul><li>One full season, any club</li><li>Every league and every feature</li><li>Live games</li></ul></div>
 <div class="plan hi"><small>Full game</small><b>$9 <span>once</span></b><ul><li>Every season after the first</li><li>More save slots</li><li>All future updates</li></ul></div></div>
 <p style="text-align:center;margin-top:34px"><a class="btn p" href="/play/">Play free</a></p></div></section>
<section class="faq gut"><h2 class="d">Questions</h2>
 <details><summary>Do I need to download anything?</summary><p>No. It runs in your browser on a laptop, tablet or phone.</p></details>
 <details><summary>Are the players real?</summary><p>Yes: 13,900+ players and coaches from the 2026/27 season, most with portraits. Ratings are our own estimates.</p></details>
 <details><summary>How is my career saved?</summary><p>Automatically, while you play. You can also export a career as a file.</p></details>
 <details><summary>Is this an official league game?</summary><p>No. It's an independent game, not affiliated with or endorsed by any league, club or player.</p></details>
</section>
<section class="end gut"><h2 class="d">Your first game is a minute away.</h2><a class="btn p" href="/play/">Pick your club</a></section>
</main>
<footer class="gut"><div class="wrap"><span>Independent game. Not affiliated with or endorsed by any league, club or player.</span><nav><a href="/privacy/">Privacy</a><a href="/terms/">Terms</a><a href="/legal/">Legal notice</a></nav></div></footer>
</body></html>'''
open(OUT,'w',encoding='utf-8').write(html);print('written',len(html))
