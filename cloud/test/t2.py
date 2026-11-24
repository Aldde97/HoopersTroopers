from playwright.sync_api import sync_playwright
import sys,os,mimetypes
eng=sys.argv[1];ROOT='/Users/aldin/bm-work/cloud/dist-test';SP='/private/tmp/claude-501/-Users-aldin/6a287a93-4826-4577-bcfe-855ab946d3d3/scratchpad/'
MOCK=open('/Users/aldin/bm-work/cloud/mock.js').read()
def serve(route):
    u=route.request.url
    if 'cdn.jsdelivr.net/npm/@supabase' in u:return route.fulfill(status=200,body=MOCK,content_type='application/javascript')
    if u.startswith('http://bm.test/'):
        p=u[len('http://bm.test'):].split('?')[0];p=p+'index.html' if p.endswith('/') else p;f=ROOT+p
        if os.path.exists(f):return route.fulfill(status=200,path=f,content_type=mimetypes.guess_type(f)[0] or 'application/octet-stream')
        return route.fulfill(status=404,body='nf')
    return route.continue_()
J=lambda pg,js:pg.evaluate(js)
with sync_playwright() as pw:
    b=(pw.chromium.launch(channel='chrome',headless=True) if eng=='chrome' else pw.webkit.launch(headless=True));ctx=b.new_context(viewport={'width':1280,'height':860});ctx.route('**/*',serve);pg=ctx.new_page()
    err=[];pg.on('pageerror',lambda e:err.append(str(e)))
    pg.goto('http://bm.test/play/',timeout=120000);pg.wait_for_timeout(6000)
    H="()=>(document.querySelector('#bmAuth h1')||{}).textContent"
    print('1',J(pg,H),J(pg,"()=>document.getElementById('bmGo').disabled"))
    pg.screenshot(path=SP+f'in_{eng}.png')
    pg.click('[data-a=toup]');pg.fill('#bmEmail','coach@example.com');pg.fill('#bmPw','short')
    print('2 up',J(pg,H),J(pg,"()=>[document.getElementById('bmGo').disabled,document.getElementById('bmHint').textContent]"))
    pg.fill('#bmPw','hoops2027!');print('3 no consent',J(pg,"()=>[document.getElementById('bmGo').disabled,document.getElementById('bmHint').textContent]"))
    pg.click('[data-a=eye]');print('3b eye',J(pg,"()=>document.getElementById('bmPw').type"))
    pg.check('#bmOk');print('4 ready',not J(pg,"()=>document.getElementById('bmGo').disabled"))
    pg.screenshot(path=SP+f'up_{eng}.png')
    pg.click('#bmGo');pg.wait_for_timeout(400);print('5 sent',J(pg,H))
    J(pg,"()=>__mockConfirm('coach@example.com')");pg.wait_for_timeout(1500);print('6 in',J(pg,"()=>!document.getElementById('bmAuth')"))
    print('7 save',J(pg,"""async()=>{splashHide();startCareerAt('UCLA','T');if(preOn())preSkip();for(let i=0;i<3;i++)simStep();save();await new Promise(r=>setTimeout(r,1200));await ACT.cloudnow();return Object.keys(window.__mock.files).length}"""))
    J(pg,"""async()=>{const id=SLOT_ID;window.__day=G.day;await idbTx(['meta','data'],'readwrite',(m,d)=>{m.delete(id);d.delete(id);});SVL=[];SLOT_ID=null;SAVE_TXT=null;G=null;await ACT.cloudout();}""");pg.wait_for_timeout(400)
    pg.fill('#bmEmail','coach@example.com');pg.fill('#bmPw','wrongpass1');pg.click('#bmGo');pg.wait_for_timeout(400);print('8 wrong',J(pg,"()=>(document.querySelector('#bmAuth .be')||{}).textContent"))
    pg.fill('#bmPw','hoops2027!');pg.click('#bmGo');pg.wait_for_timeout(2500);print('9 restored',J(pg,"()=>({gate:!!document.getElementById('bmAuth'),slots:SVL.length,day:SAVE_TXT&&JSON.parse(SAVE_TXT).day,exp:window.__day})"))
    J(pg,"async()=>{await ACT.cloudout();}");pg.wait_for_timeout(300);pg.click('[data-a=forgot]');pg.fill('#bmEmail','coach@example.com');pg.click('#bmGo');pg.wait_for_timeout(400)
    print('10 forgot',J(pg,H),J(pg,"()=>window.__mock.calls.find(c=>c[0]==='reset')"))
    J(pg,"()=>__mockRecovery('coach@example.com')");pg.wait_for_timeout(300);print('11 recovery',J(pg,H))
    pg.fill('#bmPw','newpass2028');pg.click('#bmGo');pg.wait_for_timeout(1500);print('12 new pw',J(pg,"()=>({in:!document.getElementById('bmAuth'),pw:window.__mock.users['coach@example.com'].pw})"))
    J(pg,"()=>{UI.modal={kind:'settings'};render();}");pg.wait_for_timeout(300);pg.screenshot(path=SP+f'acc2_{eng}.png');J(pg,"()=>ACT.cloudpw()");pg.wait_for_timeout(300)
    print('13 change',J(pg,H),J(pg,"()=>!!document.querySelector('[data-a=cancelpw]')"))
    pg.fill('#bmPw','newpass2028');pg.click('#bmGo');pg.wait_for_timeout(500);print('14 same pw',J(pg,"()=>(document.querySelector('#bmAuth .be')||{}).textContent"))
    pg.fill('#bmPw','third-pass-29');pg.click('#bmGo');pg.wait_for_timeout(500);print('15 changed',J(pg,"()=>({gate:!!document.getElementById('bmAuth'),pw:window.__mock.users['coach@example.com'].pw})"))
    J(pg,"async()=>{await ACT.cloudout();}");pg.wait_for_timeout(300);pg.click('[data-a=toup]');pg.fill('#bmEmail','coach@example.com');pg.fill('#bmPw','another123');pg.check('#bmOk');pg.click('#bmGo');pg.wait_for_timeout(400)
    print('16 exists',J(pg,H),J(pg,"()=>(document.querySelector('#bmAuth .be')||{}).textContent"))
    pg.set_viewport_size({'width':390,'height':844});pg.click('[data-a=toup]');pg.wait_for_timeout(300);pg.screenshot(path=SP+f'up_m_{eng}.png');print('sw',J(pg,"()=>document.documentElement.scrollWidth"))
    print('errors',err[:5]);b.close()
