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
with sync_playwright() as pw:
    b=(pw.chromium.launch(channel='chrome',headless=True) if eng=='chrome' else pw.webkit.launch(headless=True));ctx=b.new_context(viewport={'width':1280,'height':860});ctx.route('**/*',serve);pg=ctx.new_page()
    err=[];pg.on('pageerror',lambda e:err.append(str(e)))
    pg.goto('http://bm.test/play/',timeout=120000);pg.wait_for_timeout(6000)
    print('1 gate',pg.evaluate("()=>({gate:!!document.getElementById('bmAuth'),h:(document.querySelector('#bmAuth h1')||{}).textContent,send:document.getElementById('bmSend').disabled})"))
    pg.screenshot(path=SP+f'auth_{eng}.png')
    pg.fill('#bmEmail','coach@example.com');print('2 no consent, send disabled:',pg.evaluate("()=>document.getElementById('bmSend').disabled"))
    pg.check('#bmOk');print('3 send enabled:',not pg.evaluate("()=>document.getElementById('bmSend').disabled"))
    pg.click('#bmSend');pg.wait_for_timeout(500);print('4',pg.evaluate("()=>({h:document.querySelector('#bmAuth h1').textContent,call:window.__mock.calls[0]})"))
    pg.evaluate("()=>__mockClickLink()");pg.wait_for_timeout(1500)
    print('5 in',pg.evaluate("()=>({gate:!!document.getElementById('bmAuth'),consent:window.__mock.user.user_metadata.age16,start:!!document.querySelector('.cs-grid')})"))
    print('6 upload',pg.evaluate("""async()=>{splashHide();startCareerAt('UCLA','T');if(preOn())preSkip();for(let i=0;i<4;i++)simStep();save();await new Promise(r=>setTimeout(r,1500));await ACT.cloudnow();const M=window.__mock;
      return {files:Object.keys(M.files),bytes:Object.values(M.files)[0]&&Object.values(M.files)[0].length,row:Object.values(M.rows).map(r=>r.meta.name+' day '+r.meta.day),slot:SLOT_ID}}"""))
    pg.evaluate("()=>{UI.modal={kind:'settings'};render();}");pg.wait_for_timeout(400)
    print('7 account panel',pg.evaluate("()=>(document.querySelector('.bmacc')||{}).textContent"))
    pg.screenshot(path=SP+f'acc_{eng}.png')
    print('8 new device',pg.evaluate("""async()=>{const id=SLOT_ID,day=G.day;await idbTx(['meta','data'],'readwrite',(m,d)=>{m.delete(id);d.delete(id);});SVL=[];SLOT_ID=null;SAVE_TXT=null;G=null;UI.modal=null;
      await window.__mock.auth?0:0;await ACT.cloudout();await new Promise(r=>setTimeout(r,300));const gate=!!document.getElementById('bmAuth');
      document.getElementById('bmEmail').value='coach@example.com';document.getElementById('bmEmail').dispatchEvent(new Event('input',{bubbles:true}));document.getElementById('bmOk').click();document.getElementById('bmSend').click();
      await new Promise(r=>setTimeout(r,300));__mockClickLink();await new Promise(r=>setTimeout(r,2500));const g=SAVE_TXT?JSON.parse(SAVE_TXT):null;
      return {gateAfterSignOut:gate,restoredSlots:SVL.length,active:SLOT_ID===id,day:g&&g.day,expected:day,club:g&&g.teams[g.user].name,gate2:!!document.getElementById('bmAuth')}}"""))
    print('9 google consent',pg.evaluate("""async()=>{await ACT.cloudout();await new Promise(r=>setTimeout(r,200));__mockGoogle();await new Promise(r=>setTimeout(r,500));const h=document.querySelector('#bmAuth h1').textContent,dis=document.getElementById('bmAgree').disabled;
      document.getElementById('bmOk').click();document.getElementById('bmAgree').click();await new Promise(r=>setTimeout(r,1500));return {h,agreeDisabledBefore:dis,in:!document.getElementById('bmAuth'),meta:window.__mock.user.user_metadata.age16}}"""))
    print('10 delete',pg.evaluate("""async()=>{UI.modal={kind:'settings'};render();ACT.clouddel(1);const warn=!!document.querySelector('.bmacc .set-x');ACT.clouddel(2);await new Promise(r=>setTimeout(r,800));
      return {warn,rpc:window.__mock.calls.some(c=>c[1]==='delete_my_account'),gate:!!document.getElementById('bmAuth'),h:(document.querySelector('#bmAuth h1')||{}).textContent}}"""))
    pg.set_viewport_size({'width':390,'height':844});pg.wait_for_timeout(300);pg.screenshot(path=SP+f'auth_m_{eng}.png');print('sw',pg.evaluate("()=>document.documentElement.scrollWidth"))
    print('errors',err[:5]);b.close()
