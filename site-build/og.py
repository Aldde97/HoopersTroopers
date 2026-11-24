from playwright.sync_api import sync_playwright
html='''<html><head><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,800;1,800&family=Barlow:wght@500&display=swap">
<style>body{margin:0;width:1200px;height:630px;background:#0b0d12;color:#f2f4f8;font-family:Barlow;overflow:hidden;position:relative}
.g{position:absolute;inset:-30% -10% auto 40%;height:900px;background:radial-gradient(closest-side,#ff6b0033,transparent)}
.t{position:absolute;left:64px;top:60px;width:600px}.e{font:800 22px 'Barlow Condensed';letter-spacing:.16em;color:#ff8a2e;text-transform:uppercase}
h1{font:800 92px/.92 'Barlow Condensed';text-transform:uppercase;margin:18px 0 22px}h1 em{color:#ff6b00}
p{font-size:26px;color:#cfd5df;margin:0 0 30px;line-height:1.35}.b{display:inline-block;background:#ff6b00;padding:16px 30px;border-radius:10px;font:800 26px 'Barlow Condensed';letter-spacing:.07em;text-transform:uppercase}
.i{position:absolute;right:56px;top:46px;width:400px;border-radius:16px;overflow:hidden;box-shadow:0 30px 80px #000c,0 0 0 1px #ffffff1a;transform:rotate(2deg)}.i img{width:100%;display:block}</style></head>
<body><div class="g"></div><div class="t"><div class="e">Free browser game · 2026/27</div><h1>Coach any basketball club <em>in the world.</em></h1><p>1,013 real clubs · 13,900+ real players · 60 leagues</p><span class="b">Play free</span></div>
<div class="i"><img src="file:///Users/aldin/Basketball-Manager-Euroleague/site/assets/w/rotation.jpg"></div></body></html>'''
open('og.html','w').write(html)
with sync_playwright() as pw:
    b=pw.chromium.launch(channel='chrome',headless=True);pg=b.new_page(viewport={'width':1200,'height':630})
    pg.goto('file:///Users/aldin/bm-work/web2/og.html');pg.wait_for_timeout(2500)
    pg.screenshot(path='/Users/aldin/Basketball-Manager-Euroleague/site/assets/og.jpg',type='jpeg',quality=88);b.close()
