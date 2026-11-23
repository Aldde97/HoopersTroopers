# Builds the launch landing page (design 1 "Matchday") from the demo source in site-src into
# ~/Basketball-Manager-Euroleague/site/ (index.html + assets/ + legal stubs). The game goes to /play/ at deploy time
# (see build_dist.py). Numbers come from the game (nums: 2026-11-21 run of nums.py / nums2.py / lx.py).
import re,os,shutil,json
SRC='/Users/aldin/Basketball-Manager-Euroleague/site-src/'
OUT='/Users/aldin/Basketball-Manager-Euroleague/site/'
s=open(SRC+'index.html',encoding='utf-8').read()
css=s[s.index('<style>\n/* Three'):s.index('</style>',s.index('<style>\n/* Three'))+8]
css=css.replace('/* Three landing concepts behind one switcher, all built on real in-game screenshots and player portraits.\n   Each demo commits to one look of its own, so colours are explicit per demo rather than following the viewer theme. */',
                '/* Basketball Manager launch page (design "Matchday"): one committed dark look built on in-game screenshots and portraits. */')
fonts='<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,600;0,700;0,800;1,800&family=Barlow:wght@400;500;600;700&display=swap">'
sc=s[s.index('<script'):]
P=sc[sc.index('var P={'):sc.index('};',sc.index('var P={'))+2]
card=sc[sc.index('function card(k,last)'):sc.index('// 1: player strip')]
lxfun=sc[sc.index('var tierLbl'):sc.index('// routing')]
N=dict(clubs='1,013',players='13,900+',comps='76',leagues='60',countries='53',nts='94')
# ---- leagues by country, generated from the game's league table (tier from the promotion links) ----
LX=[
 ['eur','Europe',[
  ['ger','Germany',124,[['easyCredit BBL',1],['BARMER ProA',2],['BARMER ProB',3],['1. Regionalliga',4]]],
  ['ita','Italy',70,[['LBA Serie A',1],['Serie A2',2],['Serie B Nazionale',3]]],
  ['esp','Spain',60,[['Liga Endesa',1],['Primera FEB',2],['Segunda FEB',3]]],
  ['fra','France',34,[['Betclic Élite',1],['Élite 2',2]]],
  ['tur','Türkiye',30,[['Türkiye Sigorta BSL',1],['Türkiye Basketbol Ligi',2]]],
  ['gre','Greece',28,[['Stoiximan GBL',1],['Elite League',2]]],
  ['isr','Israel',27,[['Ligat Winner',1],['Liga Leumit',2]]],
  ['cro','Croatia',27,[['SuperSport Premijer liga',1],['Prva muška liga',2]]],
  ['ned','Netherlands',23,[['BNXT League',1],['Promotiedivisie',2]]],
  ['srb','Serbia',22,[['KLS Super League',1],['KLS First League',2]]],
  ['bih','Bosnia and Herzegovina',16,[['Prvenstvo BiH',1],['Liga 14',2]]],
  ['pol','Poland',16,[['Orlen Basket Liga',1]]],
  ['rou','Romania',14,[['Liga Națională de Baschet',1]]],
  ['mne','Montenegro',14,[['Crnogorska košarkaška liga',1]]],
  ['cze','Czechia',12,[['Kooperativa NBL',1]]],
  ['por','Portugal',12,[['Liga Betclic',1]]],
  ['slo','Slovenia',11,[['Liga OTP banka',1]]],
  ['aut','Austria',11,[['win2day Basketball Superliga',1]]],
  ['bel','Belgium',11,[['BNXT League',1]]],
  ['geo','Georgia',11,[['Georgian Superleague',1]]],
  ['swe','Sweden',11,[['Basketligan',1]]],
  ['rus','Russia',11,[['VTB United League',1]]],
  ['ltu','Lithuania',10,[['LKL',1]]],
  ['mkd','North Macedonia',10,[['MTEL Super Liga',1]]],
  ['gbr','Great Britain',10,[['Super League Basketball',1]]],
  ['sui','Switzerland',10,[['Swiss Basketball League',1]]],
  ['kos','Kosovo',8,[['ProCredit Superliga',1]]]]],
 ['ame','Americas',[
  ['usa','United States',137,[['NBA',1],['NBA G League',2],['NCAA Division I',0]]],
  ['bra','Brazil',18,[['Novo Basquete Brasil',1]]],
  ['arg','Argentina',18,[['Liga Nacional de Básquetbol',1]]],
  ['pur','Puerto Rico',12,[['Baloncesto Superior Nacional',1]]],
  ['dom','Dominican Republic',9,[['Liga Nacional de Baloncesto',1]]],
  ['can','Canada',2,[['NBA',1],['NBA G League',2]]],
  ['mex','Mexico',1,[['NBA G League',2]]]]],
 ['asi','Asia & Oceania',[
  ['jpn','Japan',26,[['B.League Premier',1]]],
  ['chn','China',20,[['CBA',1]]],
  ['phi','Philippines',12,[['PBA',1]]],
  ['nzl','New Zealand',12,[["Sal's NBL",1]]],
  ['tpe','Taiwan',11,[['TPBL',1],['P. League+',1]]],
  ['idn','Indonesia',10,[['Indonesian Basketball League',1]]],
  ['aus','Australia',9,[['NBL',1]]]]],
 ['mea','Middle East',[
  ['ksa','Saudi Arabia',13,[['Saudi Basketball League',1]]],
  ['lbn','Lebanon',11,[['Lebanese Basketball League',1]]],
  ['qat','Qatar',9,[['Qatar Basketball League',1]]]]],
 ['int','International',[
  [['eu'],'European cups',None,[['EuroLeague',1],['EuroCup',2],['Basketball Champions League',2],['FIBA Europe Cup',3]]],
  [['srb','cro','slo','bih','mne','mkd'],'Adriatic region',33,[['ABA League',1],['ABA League 2',2]]]]]]
CUPC=[['bul','Bulgaria'],['lat','Latvia'],['aze','Azerbaijan'],['hun','Hungary'],['fin','Finland'],['den','Denmark'],['est','Estonia'],['svk','Slovakia'],['cyp','Cyprus']]
lxfun=lxfun.replace("Cup clubs from 12 more countries:","Cup clubs from '+CUPC.length+' more countries:")
tick=lambda L:'<ul class="ticks">'+''.join(f'<li>{x}</li>' for x in L)+'</ul>'
def frame(img,w,h,alt,bar=None):return f'<div class="frame">{f"""<div class="bar"><i></i><i></i><i></i><span>{bar}</span></div>""" if bar else ""}<img src="assets/{img}" width="{w}" height="{h}" alt="{alt}" loading="lazy"></div>'
def split(kick,h2,body,ticks,img,rev=False,bg=False,sid=''):
    return f'''<section class="md-sec gut"{f' id="{sid}"' if sid else ''}{' style="background:#0f1218"' if bg else ''}><div class="wrap md-split{' rev' if rev else ''}">
    <div class="txt"><span class="md-kick">{kick}</span><h2>{h2}</h2><p class="body">{body}</p>{tick(ticks)}</div>
    {img}
  </div></section>'''
PLAY='/play/'
main=f'''<main class="demo md" id="top">
  <header class="md-nav gut"><div class="wrap">
    <a class="md-logo" href="#top" aria-label="Basketball Manager">Basketball<span>Manager</span></a>
    <a class="btn ghost" href="{PLAY}">Play free in your browser</a>
  </div></header>

  <section class="md-hero gut"><div class="wrap">
    <div>
      <span class="md-kick">Season 2026/27 · real rosters</span>
      <h1>You call the <em>timeout.</em></h1>
      <p class="md-lead">Coach Vezenkov at Olympiacos, Shai at OKC, a freshman class at Duke, or climb from Spain's third tier to the ACB. Real players, real leagues, a live game you change from the bench. No download.</p>
      <div class="md-cta">
        <a class="btn pri" href="{PLAY}">Play free</a>
        <a class="btn ghost" href="#md-feat">See the game ↓</a>
      </div>
      <div class="md-proof">
        <div><b>{N['clubs']}</b><span>Clubs</span></div>
        <div><b>{N['players']}</b><span>Players</span></div>
        <div><b>{N['comps']}</b><span>Leagues &amp; cups</span></div>
        <div><b>{N['nts']}</b><span>National teams</span></div>
      </div>
    </div>
    <div class="md-shot">
      <div class="frame"><div class="bar"><i></i><i></i><i></i><span>Live · Olympiacos v Iraklis · Q2 08:09</span></div><img src="assets/s-match.jpg" width="1440" height="900" alt="Live match screen: scoreboard, shot map, play-by-play and bench controls"></div>
      <div class="md-float a pc"><img src="assets/p-sasha-vezenkov.jpg" alt="Sasha Vezenkov"><span class="ov">88<small>OVR</small></span><div class="nm"><b>Vezenkov</b><small>PF · Olympiacos</small></div></div>
      <div class="md-float b pc"><img src="assets/p-kendrick-nunn.jpg" alt="Kendrick Nunn"><span class="ov">85<small>OVR</small></span><div class="nm"><b>Nunn</b><small>SG · Panathinaikos</small></div></div>
    </div>
  </div></section>

  <section class="md-strip" aria-label="Some of the real players in the game">
    <div class="wrap gut"><div class="lbl">{N['players']} real players. A few you know.</div></div>
    <div class="row" id="mdrow"></div>
  </section>

  {split('On the bench','Call the <em>play.</em>',"Build a playbook from eight real sets: pick and roll, horns, flex, Spain pick and roll and more. Each one fits your roster differently and beats a different defense. Your team runs them on its own, and you call them live when the game is on the line.",
         ['Fit from your own players: the right play for the roster you have','Counters: flex beats man, overload kills a zone','Call it too often and the defense reads it'],
         frame('s-playbook.jpg',1440,900,'Playbook with court diagrams, fit bars, practice dots and counters','Tactics · Playbook'),sid='md-feat')}

  {split('Before tip-off','Scout them. <em>Then beat them.</em>',"Your scouting staff reads the opponent: their top scorer, how fast they play, how often they shoot threes, who can't defend. Pick one focus and the simulation plays it out.",
         ['Seven game-plan focuses, each rated for this opponent','Double-team their best scorer and watch the others get open shots','A weak scouting staff misses things'],
         frame('s-scout.jpg',1392,530,'Scouting report: tendencies and seven game-plan focuses with fit ratings','Scouting report'),rev=True,bg=True)}

  {split('After the buzzer','The press <em>never forgets.</em>',"Journalists ask about the game you just played: the 2/11 shooting night, the free-throw count, the rival coach's comments. Your tone moves the dressing room, the fans and the board.",
         ['Provoke a rival and his team comes out fired up','Criticise a sensitive player and he takes it badly','Make a bold promise and you will be held to it'],
         frame('s-press.jpg',720,550,'Press conference chat with journalists and tone-labelled answers','Post-game press conference'))}

  {split('All week long','The whole league is <em>talking.</em>',"Fans celebrate a derby win and turn on you after a losing streak. Insiders leak which club wants your best player. Journalists break down every result, and the trending players are the ones everybody is talking about.",
         ['Fan mood for the ultras and the families','Transfer rumours with a reliability meter','Every result, signing and injury gets a reaction'],
         frame('s-social.jpg',1440,900,'Social feed with fan and press posts, result cards, fan mood meters and trending players','Social'),rev=True,bg=True)}

  <section class="md-sec gut"><div class="wrap">
    <span class="md-kick">Everything around the 40 minutes</span>
    <h2>Run the <em>whole</em> club.</h2>
    <div class="md-quad">
      <figure>{frame('s-squad.jpg',1440,900,'Rotation builder with player photos on a court')}<figcaption><b>Rotation builder.</b> Minutes, roles, team chemistry.</figcaption></figure>
      <figure>{frame('s-arena.jpg',1440,650,'3D arena with fan groups, seat expansion and fan shop')}<figcaption><b>Your arena in 3D.</b> Seats, VIP boxes, the fan shop.</figcaption></figure>
      <figure>{frame('s-nba.jpg',1440,900,'Oklahoma City Thunder squad with Shai Gilgeous-Alexander')}<figcaption><b>The NBA.</b> Cap, aprons, draft, trades.</figcaption></figure>
      <figure>{frame('s-home.jpg',1440,900,'Club home screen with rumour mill, league table and inbox')}<figcaption><b>Your desk.</b> Offers, rumours, a dressing-room fight.</figcaption></figure>
    </div>
  </div></section>

  <section class="md-sec gut" id="md-leagues" style="background:#0f1218"><div class="wrap">
    <span class="md-kick">Where you can coach</span>
    <h2>{N['leagues']} leagues. <em>Clubs from {N['countries']} countries.</em></h2>
    <div class="lgx"></div>
  </div></section>

  <section class="md-sec gut"><div class="wrap">
    <span class="md-kick">Built from the real thing</span>
    <h2>Realism you can <em>check.</em></h2>
    <div class="md-real">
      <div><b>2026/27 rosters</b><p>Players, numbers, heights, portraits and head coaches from club and league sites.</p></div>
      <div><b>Real formats</b><p>ABA Play-In, EuroCup groups, Selection Sunday, national cups and Final Fours.</p></div>
      <div><b>Promotion and relegation</b><p>Climb from the Segunda FEB to the ACB, or from the Regionalliga to the BBL.</p></div>
      <div><b>The NBA rulebook</b><p>Aprons, supermax, rookie scale, protected picks, swaps, the Stepien rule.</p></div>
      <div><b>College in 2026</b><p>NIL collectives, revenue sharing, the portal, 15-man rosters.</p></div>
      <div><b>{N['nts']} national teams</b><p>World Cup and EuroBasket qualifiers, and federations that offer you their bench.</p></div>
      <div><b>Club money</b><p>Sponsors, ticket prices, debts, owners who step in. Or don't.</p></div>
      <div><b>Agents</b><p>Greedy, loyal, or playing two clubs against each other.</p></div>
    </div>
  </div></section>

  <section class="md-sec gut" id="md-price" style="background:#0f1218"><div class="wrap md-price">
    <div><span class="md-kick">Price</span><h2>First season free. <em>Then $9, once.</em></h2>
      <p class="body">Play a whole season with any club before you pay anything. If you want to keep going, unlock the full game with one payment. No subscription, no ads, no coins.</p></div>
    <div class="md-plans">
      <div class="pl"><small>Free</small><b>$0</b><ul><li>One full season, every league</li><li>Live games and the whole club</li><li>One save slot</li></ul><a class="btn ghost" href="{PLAY}">Play free</a></div>
      <div class="pl on"><small>Full game</small><b>$9<i>one-time</i></b><ul><li>Every season after the first</li><li>Every league, including new ones</li><li>Three save slots</li><li>Every update, free</li></ul><a class="btn pri" href="{PLAY}">Start free, unlock later</a></div>
    </div>
  </div></section>

  <section class="md-sec gut" id="md-faq"><div class="wrap md-faq">
    <span class="md-kick">Questions</span><h2>Before you <em>tip off.</em></h2>
    <details><summary>Do I need to download anything?</summary><p>No. The game runs in your browser on a laptop, tablet or phone. The first start loads the leagues and rosters, then you play.</p></details>
    <details><summary>Are the players real?</summary><p>Yes: {N['players']} players and coaches from the 2026/27 season, with their numbers, positions and heights, and portraits for most of them. Ratings are our own estimates.</p></details>
    <details><summary>What do I get for free?</summary><p>A complete first season with the club of your choice, in any league, with every feature. After the season you can unlock the full game for $9.</p></details>
    <details><summary>How are my careers saved?</summary><p>Your career saves automatically as you play, and you can export it as a file to keep a backup.</p></details>
    <details><summary>Is this an official league game?</summary><p>No. It's an independent game, not affiliated with or endorsed by any league, club or player.</p></details>
  </div></section>

  <section class="md-end gut"><div class="wrap">
    <h2>Your first game is ten seconds away.</h2>
    <a class="btn pri" href="{PLAY}">Choose your club</a>
  </div></section>
  <footer class="md-foot gut"><div class="wrap">
    <span>Independent game. Not affiliated with or endorsed by any league, club or player.</span>
    <nav aria-label="Legal"><a href="/privacy/">Privacy</a><a href="/terms/">Terms</a><a href="/legal/">Legal notice</a></nav>
  </div></footer>
</main>'''
extra_css='''
/* launch additions */
.md-logo{text-decoration:none;color:inherit}
.md-price{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.2fr);gap:32px;align-items:center}
.md-plans{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
.md-plans .pl{display:flex;flex-direction:column;gap:10px;padding:22px;border:1px solid var(--md-line);border-radius:4px;background:var(--md-panel)}
.md-plans .pl.on{border-color:var(--or);box-shadow:0 18px 50px #ff6b0a22,inset 0 3px var(--or)}
.md-plans small{font:800 13px 'Barlow Condensed',sans-serif;letter-spacing:.2em;text-transform:uppercase;color:var(--or2)}
.md-plans b{font:italic 800 54px/1 'Barlow Condensed',sans-serif}
.md-plans b i{font:600 15px 'Barlow',sans-serif;font-style:normal;color:var(--md-mut);margin-left:8px}
.md-plans ul{margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:6px;flex:1}
.md-plans li{padding-left:22px;position:relative;color:#cfd3dc}
.md-plans li::before{content:"";position:absolute;left:2px;top:.55em;width:10px;height:6px;border:solid var(--or);border-width:0 0 2px 2px;transform:rotate(-45deg)}
.md-faq{max-width:820px}
.md-faq details{border-top:1px solid var(--md-line);padding:16px 0}
.md-faq details:last-of-type{border-bottom:1px solid var(--md-line)}
.md-faq summary{cursor:pointer;font:700 19px 'Barlow',sans-serif;list-style:none;display:flex;justify-content:space-between;gap:16px}
.md-faq summary::-webkit-details-marker{display:none}
.md-faq summary::after{content:"+";font:800 24px/1 'Barlow Condensed',sans-serif;color:var(--or)}
.md-faq details[open] summary::after{content:"\\2013"}
.md-faq p{margin:10px 0 0;color:var(--md-mut);max-width:65ch}
.md-foot .wrap{display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;align-items:center}
.md-foot nav{display:flex;gap:18px}.md-foot nav a{color:var(--md-mut);text-decoration:none}.md-foot nav a:hover{color:#fff}
@media (max-width:860px){.md-price{grid-template-columns:minmax(0,1fr)}.md-plans{grid-template-columns:minmax(0,1fr)}}
'''
css=css.replace('</style>',extra_css+'</style>')
js=('<script>\n(function(){\n  '+P+'\n  '+card+
    "\n  var order=['jokic','vez','sga','tav','luka','nunn','wemby','camp','giannis','mj','punter','toko','larkin','slou'];\n"
    "  var row=order.map(function(k){return card(k);}).join('');document.getElementById('mdrow').innerHTML=row+row;\n"
    '  var LX='+json.dumps(LX,ensure_ascii=False)+';\n  var CUPC='+json.dumps(CUPC)+';\n  '+lxfun+'\n})();\n</script>')
head=f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Basketball Manager</title>
<meta name="description" content="Coach any of {N['clubs']} real clubs in {N['leagues']} leagues with {N['players']} real players. Play live games, call the plays, run the whole club. In your browser, first season free.">
<meta property="og:type" content="website">
<meta property="og:title" content="Basketball Manager: you call the timeout">
<meta property="og:description" content="Real clubs. Real rosters. Your bench. First season free, in your browser.">
<meta property="og:image" content="/assets/og.jpg">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#0c0e13">
<link rel="icon" href="/assets/icon.svg" type="image/svg+xml">
{fonts}
{css}
</head>
<body>
'''
html=head+main+'\n'+js+'\n</body>\n</html>\n'
assert 'wbpins' not in html and 'Game link goes here' not in html
os.makedirs(OUT+'assets/flags',exist_ok=True)
used=set(re.findall(r'assets/([\w./-]+\.(?:jpg|svg|png))',html))|{'p-'+x for x in re.findall(r"'p-([\w-]+\.jpg)'",P)}
for f in os.listdir(SRC+'assets'):
    if f.endswith('.jpg'):shutil.copy(SRC+'assets/'+f,OUT+'assets/'+f)
for f in os.listdir(SRC+'assets/flags'):shutil.copy(SRC+'assets/flags/'+f,OUT+'assets/flags/'+f)
open(OUT+'index.html','w',encoding='utf-8').write(html)
print('ok',len(html),'bytes')
