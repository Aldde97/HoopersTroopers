/* Basketball Manager · accounts and cloud saves (web version only).
   Loaded after the game by the deployed site, with window.BM_CLOUD = {url, anon} (Supabase project URL and public anon key) and
   the supabase-js client. Without both it does nothing and the game plays as before.
   - Gate: a sign-in screen covers the game until the player is signed in and has accepted the terms (16+).
   - Sign-in: email and password (sign up, sign in, forgot password by email link) or Google.
   - Cloud saves: every career slot is uploaded as its gzip file (at most every 3 minutes while playing, and when the tab is hidden);
     after signing in, careers that are newer in the cloud are downloaded into this browser.
   - Bot check: with C.turnstile (a Cloudflare Turnstile site key) sign-up, sign-in, reset and resend send a captchaToken;
     Supabase checks it once CAPTCHA protection is switched on there. Without the key nothing changes.
   - Settings > Account: email, last cloud save, Save to cloud now, Sign out, Delete account (files, rows and the account). */
(function(){
  const C=window.BM_CLOUD||{};if(!C.url||!C.anon||!window.supabase||!window.supabase.createClient)return;
  const sb=window.supabase.createClient(C.url,C.anon,{auth:{flowType:'pkce',persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  const S={user:null,busy:false,sent:null,err:'',up:{},last:0,lastOk:null,dirty:{},consentNeeded:false};
  window.BM_CLOUD_STATE=S;
  const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  // ---------- bot check (Cloudflare Turnstile) ----------
  const TS=C.turnstile||'';let tsReady=null,tsId=null,tsDead=false;
  function tsLoad(){if(!TS)return Promise.resolve(false);if(tsReady)return tsReady;
    tsReady=new Promise(res=>{const sc=document.createElement('script');sc.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';sc.async=true;
      const t=setTimeout(()=>{tsDead=true;res(false);syncBtns();},10000);
      sc.onload=()=>{clearTimeout(t);res(!!window.turnstile);};sc.onerror=()=>{clearTimeout(t);tsDead=true;res(false);syncBtns();};document.head.appendChild(sc);});
    return tsReady;}
  const capNeeded=()=>!!TS&&!tsDead&&(['in','up','fg'].includes(S.view)||(S.view==='mail'&&!!S.resend));
  async function capMount(){S.cap=null;syncBtns();if(!TS)return;const ok=await tsLoad();const box=gate&&gate.querySelector('#bmCap');if(!ok||!box||!window.turnstile)return;
    try{if(tsId!=null)window.turnstile.remove(tsId);}catch(e){}
    tsId=window.turnstile.render(box,{sitekey:TS,theme:'dark',appearance:'interaction-only',action:S.view,
      callback:t=>{S.cap=t;syncBtns();},'expired-callback':()=>{S.cap=null;syncBtns();},'error-callback':()=>{S.cap=null;syncBtns();const h=gate&&gate.querySelector('#bmCapH');if(h){h.textContent='The bot check could not confirm this browser. Reload the page, or try another browser or network.';h.classList.add('bad');}return true;}});
    const h=gate&&gate.querySelector('#bmCapH');if(h){h.classList.remove('bad');setTimeout(()=>{if(h.isConnected&&!S.cap&&!h.classList.contains('bad'))h.textContent='Still checking… this can take a few seconds on slow connections.';},8000);}}
  const capBox=()=>TS?'<div class="bcap" id="bmCap"></div><div class="bhint" id="bmCapH">Checking that you are not a bot…</div>':'';
  const capOpt=()=>S.cap?{captchaToken:S.cap}:{};
  const capErr=e=>/captcha/i.test((e&&(e.message||e.code))||'');
  const css=`#bmAuth{position:fixed;inset:0;z-index:9999;background:#0c0e13;color:#e9ecef;display:flex;align-items:center;justify-content:center;padding:max(16px,env(safe-area-inset-top)) max(16px,env(safe-area-inset-right)) max(16px,env(safe-area-inset-bottom)) max(16px,env(safe-area-inset-left));overflow:auto;font:15px/1.5 "Barlow",system-ui,sans-serif}
#bmAuth .ba{width:100%;max-width:420px;display:grid;gap:16px}
#bmAuth .bt{font:800 13px/1 "Barlow Condensed",sans-serif;letter-spacing:.18em;color:#ff6b00;text-transform:uppercase}
#bmAuth h1{margin:0;font:800 44px/0.95 "Barlow Condensed","Arial Narrow",sans-serif;text-transform:uppercase;letter-spacing:.01em}
#bmAuth p{margin:0;color:#aab2bd}#bmAuth a{color:#ff8a1f}
#bmAuth input[type=email]{width:100%;box-sizing:border-box;height:50px;border-radius:8px;border:1px solid #2c333d;background:#151a21;color:#fff;font:16px system-ui,sans-serif;padding:0 14px}
#bmAuth input[type=email]:focus{outline:2px solid #ff6b00;border-color:transparent}
#bmAuth .bc{display:flex;gap:10px;align-items:flex-start;font-size:13.5px;color:#c4cbd4;cursor:pointer}#bmAuth .bc input{width:20px;height:20px;margin:1px 0 0;accent-color:#ff6b00;flex:none}
#bmAuth button{height:52px;border-radius:8px;border:0;font:800 17px "Barlow Condensed",sans-serif;letter-spacing:.08em;text-transform:uppercase;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px}
#bmAuth .bp{background:#ff6b00;color:#fff}#bmAuth .bp:disabled{opacity:.45;cursor:default}
#bmAuth .bg{background:#fff;color:#14171c}#bmAuth .bg:disabled{opacity:.45;cursor:default}#bmAuth .bl{background:none;color:#aab2bd;height:auto;font:500 14px system-ui,sans-serif;text-transform:none;letter-spacing:0;text-decoration:underline}
#bmAuth .bor{display:flex;align-items:center;gap:12px;color:#6b7380;font-size:12px;text-transform:uppercase;letter-spacing:.12em}#bmAuth .bor:before,#bmAuth .bor:after{content:"";flex:1;height:1px;background:#2c333d}
#bmAuth .be{color:#ff6b6b;font-size:14px}#bmAuth .bcap:empty{display:none}#bmAuth .bcap{display:flex;justify-content:center}#bmAuth #bmCapH[hidden]{display:none}#bmAuth #bmCapH.bad{color:#ff6b6b}#bmAuth .bk{padding:14px 16px;border-radius:8px;background:#151a21;border:1px solid #2c333d}
#bmAuth .bpw{position:relative}#bmAuth .bpw input{width:100%;box-sizing:border-box;height:50px;border-radius:8px;border:1px solid #2c333d;background:#151a21;color:#fff;font:16px system-ui,sans-serif;padding:0 70px 0 14px}#bmAuth .bpw input:focus{outline:2px solid #ff6b00;border-color:transparent}
#bmAuth .bey{position:absolute;right:6px;top:7px;height:36px;padding:0 12px;background:none;color:#aab2bd;font:600 13px system-ui,sans-serif;text-transform:none;letter-spacing:0}
#bmAuth .bhint{font-size:12.5px;color:#8a939e;margin-top:-8px}#bmAuth .bhint.ok{color:#5fd38d}#bmAuth .br{justify-self:end;margin-top:-8px}#bmAuth .bsw{text-align:center;font-size:14px}#bmAuth .bsw .bl{display:inline;font-size:14px;color:#ff8a1f}
#bmAuth .bf{font-size:12.5px;color:#6b7380;display:flex;gap:14px;flex-wrap:wrap}
.bmacc{display:grid;gap:6px;padding:14px 22px;border-top:1px solid var(--line,#e1e4e8)}.bmacc b{font-size:14px}.bmacc small{color:var(--mut,#6b7380);font-size:12.5px}.bmacc .btns{flex-wrap:wrap}`;
  const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
  const G_ICON='<svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C36.9 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>';
  let gate=null;
  function show(html){if(!gate){gate=document.createElement('div');gate.id='bmAuth';gate.setAttribute('role','dialog');gate.setAttribute('aria-modal','true');gate.setAttribute('aria-label','Sign in');document.body.appendChild(gate);gate.addEventListener('click',onClick);gate.addEventListener('submit',e=>{e.preventDefault();submit(e.target.dataset.f);});gate.addEventListener('change',syncBtns);}gate.innerHTML=html;syncBtns();if(gate.querySelector('#bmCap'))capMount();}
  function hide(){if(gate){gate.remove();gate=null;}}
  const legal=`<div class="bf"><a href="/terms/" target="_blank" rel="noopener">Terms</a><a href="/privacy/" target="_blank" rel="noopener">Privacy</a><a href="/legal/" target="_blank" rel="noopener">Legal notice</a></div>`;
  const consentBox=`<label class="bc"><input type="checkbox" id="bmOk"><span>I am 16 or older and accept the <a href="/terms/" target="_blank" rel="noopener">terms</a> and the <a href="/privacy/" target="_blank" rel="noopener">privacy policy</a>.</span></label>`;
  const pwField=(id,ph,ac)=>`<div class="bpw"><input type="password" id="${id}" placeholder="${ph}" autocomplete="${ac}" aria-label="${ph}" minlength="8"><button type="button" class="bey" data-a="eye" aria-label="Show password">Show</button></div>`;
  const emField=()=>`<input type="email" id="bmEmail" placeholder="Email address" autocomplete="email" inputmode="email" aria-label="Email address" value="${esc(S.email||'')}">`;
  const errBox=()=>S.err?`<div class="be" role="alert">${esc(S.err)}</div>`:'';
  const okBox=()=>S.ok?`<div class="bk">${esc(S.ok)}</div>`:'';
  const brand='<div class="bt">Basketball Manager</div>';
  const SEEN='bm-has-account';
  const seen=()=>{try{return localStorage.getItem(SEEN)==='1';}catch(e){return false;}};
  const markSeen=()=>{try{localStorage.setItem(SEEN,'1');}catch(e){}};
  function viewEntry(){if(seen())viewSignIn();else viewSignUp();}   // first screen when nobody is signed in
  function viewSignIn(){S.view='in';show(`<form class="ba" novalidate data-f="in">${brand}<h1>Sign in</h1><p>Your account keeps your careers safe in the cloud, so you can continue on any device.</p>
    ${okBox()}${emField()}${pwField('bmPw','Password','current-password')}<button type="button" class="bl br" data-a="forgot">Forgot password?</button>${capBox()}${errBox()}
    <button type="submit" class="bp" id="bmGo" disabled>${S.busy?'Signing in…':'Sign in'}</button>
    ${C.google?'<div class="bor">or</div><button type="button" class="bg" data-a="google">${G_ICON}Continue with Google</button>':''}
    <p class="bsw">New here? <button type="button" class="bl" data-a="toup">Create an account</button></p>${legal}</form>`);}
  function viewSignUp(){S.view='up';show(`<form class="ba" novalidate data-f="up">${brand}<h1>Create account</h1><p>Free. Your careers are saved in the cloud and follow you to every device.</p>
    ${emField()}${pwField('bmPw','Password (at least 8 characters)','new-password')}<div class="bhint" id="bmHint">At least 8 characters</div>${consentBox}${capBox()}${errBox()}
    <button type="submit" class="bp" id="bmGo" disabled>${S.busy?'Creating account…':'Create account'}</button>
    ${C.google?'<div class="bor">or</div><button type="button" class="bg" id="bmGoogle" data-a="google" disabled>${G_ICON}Continue with Google</button>':''}
    <p class="bsw">Already have an account? <button type="button" class="bl" data-a="toin">Sign in</button></p>${legal}</form>`);}
  function viewForgot(){S.view='fg';show(`<form class="ba" novalidate data-f="fg">${brand}<h1>Reset password</h1><p>Enter your email address and we send you a link to set a new password.</p>
    ${emField()}${capBox()}${errBox()}<button type="submit" class="bp" id="bmGo" disabled>${S.busy?'Sending…':'Send reset link'}</button><button type="button" class="bl" data-a="toin">Back to sign in</button>${legal}</form>`);}
  function viewMail(h,t){S.view='mail';show(`<div class="ba">${brand}<h1>${esc(h)}</h1><div class="bk">${t}</div><p>Nothing there? Look in your spam folder.</p>${S.resend?capBox():''}${errBox()}
    ${S.resend?'<button type="button" class="bl" data-a="resend">Send the email again</button>':''}<button type="button" class="bl" data-a="toin">Back to sign in</button>${legal}</div>`);}
  function viewNewPw(){S.view='np';show(`<form class="ba" novalidate data-f="np">${brand}<h1>New password</h1><p>${S.user?`For <b>${esc(S.user.email||'')}</b>.`:''} Choose a new password with at least 8 characters.</p>
    ${pwField('bmPw','New password','new-password')}<div class="bhint" id="bmHint">At least 8 characters</div>${errBox()}<button type="submit" class="bp" id="bmGo" disabled>${S.busy?'Saving…':'Save password'}</button>
    ${S.pwFromGame?'<button type="button" class="bl" data-a="cancelpw">Cancel</button>':''}</form>`);}
  function viewConsent(){S.view='cs';show(`<div class="ba">${brand}<h1>One more step</h1><p>Signed in as <b>${esc(S.user&&S.user.email)}</b>.</p>${consentBox}${errBox()}
    <button type="button" class="bp" id="bmAgree" data-a="agree" disabled>Start playing</button><button type="button" class="bl" data-a="signout">Sign out</button>${legal}</div>`);}
  function viewLoading(t){show(`<div class="ba">${brand}<h1>${esc(t)}</h1></div>`);}
  const val=id=>{const e=gate&&gate.querySelector('#'+id);return e?e.value:'';};
  const emailOk=()=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val('bmEmail').trim());
  function syncBtns(){if(!gate)return;const ok=!!(gate.querySelector('#bmOk')||{}).checked,pw=val('bmPw'),v=S.view,go=gate.querySelector('#bmGo');
    const h=gate.querySelector('#bmHint');if(h){h.textContent=pw.length>=8?'✓ Long enough':`At least 8 characters${pw.length?` (${8-pw.length} more)`:''}`;h.classList.toggle('ok',pw.length>=8);}
    if(go)go.disabled=S.busy||(v==='in'?!(emailOk()&&pw.length>0):v==='up'?!(emailOk()&&pw.length>=8&&ok):v==='fg'?!emailOk():v==='np'?pw.length<8:true);
    const need=capNeeded()&&!S.cap,ch=gate.querySelector('#bmCapH');if(ch)ch.hidden=!need;
    if(go&&need&&v!=='np')go.disabled=true;const rs=gate.querySelector('[data-a="resend"]');if(rs)rs.disabled=need;
    const g=gate.querySelector('#bmGoogle');if(g)g.disabled=S.busy||(v==='up'&&!ok);const a=gate.querySelector('#bmAgree');if(a)a.disabled=!ok||S.busy;}
  document.addEventListener('input',e=>{if(e.target&&e.target.id==='bmEmail')S.email=e.target.value;if(gate&&gate.contains(e.target))syncBtns();});
  function onClick(e){const b=e.target.closest('[data-a]');if(!b)return;const a=b.dataset.a;
    if(a==='eye'){const i=b.previousElementSibling;i.type=i.type==='password'?'text':'password';b.textContent=i.type==='password'?'Show':'Hide';b.setAttribute('aria-label',i.type==='password'?'Show password':'Hide password');return;}
    S.err='';S.ok='';
    if(a==='google')google();else if(a==='toup')viewSignUp();else if(a==='toin'){S.resend=null;viewSignIn();}else if(a==='forgot')viewForgot();
    else if(a==='resend')resend();else if(a==='agree')agree();else if(a==='signout')signOut();else if(a==='cancelpw'){S.pwFromGame=false;hide();}}
  const back=()=>location.origin+location.pathname;
  async function submit(f){if(S.busy)return;S.err='';S.ok='';const em=val('bmEmail').trim(),pw=val('bmPw');
    const busy=on=>{S.busy=on;const g=gate&&gate.querySelector('#bmGo');if(g){g.disabled=on;if(on)g.textContent={in:'Signing in…',up:'Creating account…',fg:'Sending…',np:'Saving…'}[f];}};
    busy(true);
    if(f==='in'){const {data,error}=await sb.auth.signInWithPassword({email:em,password:pw,options:capOpt()});S.busy=false;
      if(error){const c=error.code||'',m=(error.message||'').toLowerCase();
        if(c==='email_not_confirmed'||m.includes('not confirmed')){S.resend={type:'signup',email:em};S.err='';viewMail('Confirm your email',`Your account is not confirmed yet. Open the link we sent to <b>${esc(em)}</b>.`);return;}
        S.err=capErr(error)?'The bot check failed. Wait a moment and try again.':c==='invalid_credentials'||m.includes('invalid login')?'Wrong email or password.':error.status===429?'Too many attempts. Wait a minute and try again.':'Sign-in failed. Try again.';viewSignIn();return;}
      return;}
    if(f==='up'){const {data,error}=await sb.auth.signUp({email:em,password:pw,options:Object.assign({emailRedirectTo:back(),data:{consent_at:new Date().toISOString(),age16:true}},capOpt())});S.busy=false;
      if(error){const c=error.code||'',m=(error.message||'').toLowerCase();S.err=capErr(error)?'The bot check failed. Wait a moment and try again.':c==='weak_password'||m.includes('weak')?'This password is too easy to guess. Choose a longer or less common one.':c==='user_already_exists'||m.includes('already registered')?'An account with this email already exists. Sign in instead.':error.status===429?'Too many attempts. Wait a minute and try again.':'The account could not be created. Try again.';viewSignUp();return;}
      if(data&&data.user&&Array.isArray(data.user.identities)&&data.user.identities.length===0){S.err='An account with this email already exists. Sign in instead.';viewSignIn();return;}
      markSeen();if(data&&data.session)return;   // email confirmation is off: signed in right away (onAuthStateChange takes over)
      S.resend={type:'signup',email:em};viewMail('Confirm your email',`We sent a link to <b>${esc(em)}</b>. Open it to activate your account; then you are signed in.`);return;}
    if(f==='fg'){const {error}=await sb.auth.resetPasswordForEmail(em,Object.assign({redirectTo:back()+'?reset=1'},capOpt()));S.busy=false;
      if(error&&error.status===429){S.err='Too many requests. Wait a minute and try again.';viewForgot();return;}
      S.resend=null;viewMail('Check your inbox',`If an account exists for <b>${esc(em)}</b>, we sent a link to set a new password. The link works once and expires after an hour.`);return;}
    if(f==='np'){const {data,error}=await sb.auth.updateUser({password:pw});S.busy=false;
      if(error){const m=(error.message||'').toLowerCase();S.err=error.code==='reauthentication_needed'||m.includes('reauthenticat')?'For your security, a password can only be changed within 24 hours of signing in. Sign out, sign back in, then change it (or use Forgot password).':S.err=error.code==='same_password'||m.includes('different')?'Choose a password you have not used before.':error.code==='weak_password'||m.includes('weak')?'This password is too easy to guess.':'The password could not be saved. Try again.';viewNewPw();return;}
      S.recovery=false;const fromGame=S.pwFromGame;S.pwFromGame=false;if(data&&data.user)S.user=data.user;if(fromGame){hide();if(typeof toast==='function')toast('Password changed.');return;}S.ok='';enter();}}
  async function resend(){const R=S.resend;if(!R)return;const {error}=await sb.auth.resend({type:R.type,email:R.email,options:Object.assign({emailRedirectTo:back()},capOpt())});if(gate&&gate.querySelector('#bmCap'))capMount();S.err=error?(error.status===429?'Wait a minute before asking again.':'The email could not be sent.'):'';
    if(!error&&gate){const k=gate.querySelector('.bk');if(k)k.insertAdjacentHTML('beforeend','<br><b>Sent again.</b>');}else viewMail('Confirm your email',`We sent a link to <b>${esc(R.email)}</b>.`);}
  async function google(){S.busy=true;S.err='';try{if(S.view==='up')localStorage.setItem('bm-consent-pending','1');}catch(e){}
    const {error}=await sb.auth.signInWithOAuth({provider:'google',options:{redirectTo:back()}});if(error){S.busy=false;S.err='Google sign-in is not available right now.';S.view==='up'?viewSignUp():viewSignIn();}}
  async function agree(){S.busy=true;syncBtns();const {data,error}=await sb.auth.updateUser({data:{consent_at:new Date().toISOString(),age16:true}});S.busy=false;
    if(error){S.err='That did not work. Try again.';viewConsent();return;}S.user=data.user;enter();}
  // A document may bind to exactly one authenticated account. Switching identities
  // drops all in-memory game state by navigating before the next account can play.
  let boundUser = null;
  let switching = false;
  function identityChanged(user) {
    if (!boundUser || boundUser === user?.id) return false;
    switching = true;
    S.user = null;
    S.dirty = {};
    viewLoading('Switching account…');
    location.reload();
    return true;
  }
  async function wipeLocal(){try{if(typeof SAVE_READY!=='undefined')await SAVE_READY;}catch(e){}
    try{if(typeof IDB_OK!=='undefined'&&IDB_OK)await idbTx(['meta','data'],'readwrite',(m,d)=>{m.clear();d.clear();});}catch(e){}
    try{SVL=[];SLOT_ID=null;SAVE_TXT=null;G=null;}catch(e){}
    for(const k of [SLOT_ACT,KEY,KEYZ])try{localStorage.removeItem(k);}catch(e){}
    S.dirty={};S.up={};S.lastOk=null;}
  async function flush(){if(G&&!G.demo&&typeof save==='function'){try{save();}catch(e){}await new Promise(r=>setTimeout(r,500));}
    try{if(typeof SLOT_ID!=='undefined'&&SLOT_ID&&!S.dirty[SLOT_ID]&&S.user)S.dirty[SLOT_ID]=(SVL||[]).find(x=>x.id===SLOT_ID)||null;}catch(e){}
    for(let i=0;i<40&&S.upBusy;i++)await new Promise(r=>setTimeout(r,250));
    try{await upload(true);}catch(e){}return !Object.keys(S.dirty).length;}
  async function signOut(){closeMenu();
    if(S.user&&!(await flush())){if(typeof toast==='function')toast('Your latest progress is not in the cloud yet. Check your connection and try again.');return;}
    const {error}=await sb.auth.signOut();
    if(error){viewLoading('Sign-out failed. Reload to try again.');return;}
    location.reload();}
  const hasConsent=u=>!!(u&&u.user_metadata&&u.user_metadata.consent_at);
  async function onUser(u){if(switching||identityChanged(u))return;S.user=u;if(!u){if(S.view!=='mail')viewEntry();return;}
    if(S.recovery){viewNewPw();return;}
    if(!hasConsent(u)){let pend=false;try{pend=localStorage.getItem('bm-consent-pending')==='1';}catch(e){}
      if(pend){try{localStorage.removeItem('bm-consent-pending');}catch(e){}const {data}=await sb.auth.updateUser({data:{consent_at:new Date().toISOString(),age16:true}});if(data&&data.user){S.user=data.user;return enter();}}
      viewConsent();return;}
    enter();}
  async function enter(){viewLoading('Loading your careers…');
    if(!S.user || switching)return;
    const id=S.user.id;
    if(typeof openAccountStorage!=='function' || !openAccountStorage(id)){
      viewLoading('Please reopen the game from /play/ to load secure account storage.');return;
    }
    boundUser=id;markSeen();
    try{await syncPaid();}catch(e){console.error('purchase check',e);}
    try{await pull();}catch(e){console.error('cloud pull',e);}
    // the title screen picked its buttons before the cloud careers arrived: show Continue career now that they are here
    try{if(document.getElementById('splash')&&typeof splashReady==='function')splashReady();}catch(e){}
    if(switching || S.user?.id!==id)return;
    hide();try{if(typeof render==='function')render();}catch(e){}payReturn();newCareerResume();}
  // ---------- cloud saves ----------
  const path=id=>`${boundUser}/${id}.gz`;
  async function pull(){if(typeof SAVE_READY!=='undefined')await SAVE_READY;if(typeof IDB_OK==='undefined'||!IDB_OK)return;
    const {data:rows,error}=await sb.from('saves').select('slot_id,meta,updated_at').eq('user_id',boundUser).order('updated_at',{ascending:false});if(error||!rows)return;
    let newest=null;
    for(const r of rows){const loc=(SVL||[]).find(s=>s.id===r.slot_id),cs=(r.meta&&r.meta.savedAt)||Date.parse(r.updated_at);
      if(loc&&loc.savedAt>=cs-2000){continue;}
      const {data:blob,error:e2}=await sb.storage.from('saves').download(path(r.slot_id));if(e2||!blob)continue;
      const z=new Uint8Array(await blob.arrayBuffer());await slotPut(r.slot_id,{z},Object.assign({},r.meta||{},{id:r.slot_id,savedAt:cs}));
      if(!newest)newest=r.slot_id;}
    if(newest&&(!SLOT_ID||!G)){SLOT_ID=newest;lsSet(SLOT_ACT,newest);try{SAVE_TXT=await slotTxt(newest);}catch(e){}}
    for(const r of rows)S.up[r.slot_id]=(r.meta&&r.meta.savedAt)||Date.parse(r.updated_at);S.lastOk=rows.length?Date.parse(rows[0].updated_at):S.lastOk;}
  async function upload(force){if(switching||!boundUser||S.user?.id!==boundUser||S.upBusy)return;const ids=Object.keys(S.dirty);if(!ids.length)return;if(!force&&Date.now()-S.last<60000)return;
    S.upBusy=true;S.last=Date.now();
    try{for(const id of ids){const meta=S.dirty[id];delete S.dirty[id];const rec=await idbTx(['data'],'readonly',d=>d.get(id));if(!rec)continue;
        const z=rec.z||(rec.txt?await gz(rec.txt):null);if(!z)continue;
        const {error}=await sb.storage.from('saves').upload(path(id),new Blob([z],{type:'application/gzip'}),{upsert:true,contentType:'application/gzip',cacheControl:'0'});
        if(error){S.dirty[id]=meta;S.err='Cloud save failed. It will try again.';continue;}
        const m=Object.assign({},meta||{});const {error:e2}=await sb.from('saves').upsert({user_id:boundUser,slot_id:id,meta:m,size:z.byteLength||z.length,updated_at:new Date().toISOString()});
        if(e2){S.dirty[id]=meta;S.err=/10 careers/.test(e2.message||'')?'Cloud limit: at most 10 careers.':'Cloud save failed. It will try again.';continue;}
        S.up[id]=m.savedAt||Date.now();S.lastOk=Date.now();S.err='';}}
    finally{S.upBusy=false;}}
  // every local save marks its slot; uploads follow on a timer, on Save to cloud now, and when the tab is hidden
  if(typeof saveZ==='function'){const z0=saveZ;saveZ=async function(txt,id,meta){const r=await z0.apply(this,arguments);if(S.user&&id&&typeof IDB_OK!=='undefined'&&IDB_OK)S.dirty[id]=meta||S.dirty[id]||null;return r;};}
  if(typeof slotDelete==='function'){const d0=slotDelete;slotDelete=async function(id){const r=await d0.apply(this,arguments);if(S.user&&id){delete S.dirty[id];try{await sb.storage.from('saves').remove([path(id)]);await sb.from('saves').delete().eq('user_id',boundUser).eq('slot_id',id);}catch(e){}}return r;};}
  setInterval(()=>{upload(false).catch(()=>{});},10000);
  // closing the app or switching away on a phone uploads right away, so nobody has to think about saving
  window.addEventListener('pagehide',()=>{upload(true).catch(()=>{});});
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')upload(true).catch(()=>{});});
  // ---------- Settings > Account ----------
  const ago=t=>{if(!t)return 'not yet';const m=Math.round((Date.now()-t)/60000);return m<1?'just now':m<60?`${m} min ago`:m<1440?`${Math.round(m/60)} h ago`:new Date(t).toLocaleDateString('en-GB');};
  function accountHTML(){if(!S.user)return '';const n=Object.keys(S.dirty).length;
    return `<div class="bmacc"><b>Account</b><small>Signed in as ${esc(S.user.email||'Google account')}</small><small>Your careers save automatically to your account${S.lastOk?` · last backup ${ago(S.lastOk)}`:''}${S.err?` · ${esc(S.err)}`:''}</small>
      <div class="btns">${S.err?'<button class="btn sm" data-act="cloudnow">Try again now</button>':''}<button class="btn sm" data-act="cloudpw">Change password</button><button class="btn sm" data-act="cloudout">Sign out</button>${UI.accDel?`<button class="btn sm" data-act="clouddel:0">Keep my account</button><button class="btn sm set-x" data-act="clouddel:2">Delete account and all cloud saves</button>`:`<button class="btn sm" data-act="clouddel:1">Delete account…</button>`}</div>
      ${UI.accDel?'<small>This deletes your account and every career stored in the cloud. Careers saved in this browser stay here. This cannot be undone.</small>':''}</div>`;}
  if(typeof settingsModal==='function'){const m0=settingsModal;settingsModal=function(){const h=m0.apply(this,arguments);const a=accountHTML();if(!a)return h;const k=h.indexOf('</div>',h.indexOf('<h3>Settings</h3>'));return k<0?h.replace('<p class="set-n">',a+'<p class="set-n">'):h.slice(0,k+6)+a+h.slice(k+6);};}
  // ---------- account button in the top bar, Sign out in the phone menu ----------
  const OUT_IC='<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l-5-5 5-5M5 12h11"/></svg>';
  const initial=()=>{const e=(S.user&&S.user.email)||'';return esc((e[0]||'?').toUpperCase());};
  if(typeof topbTools==='function'){const t0=topbTools;topbTools=function(){const h=t0.apply(this,arguments);if(!S.user)return h;
    return h.replace('<div class="topb-tl">',`<div class="topb-tl"><button class="topb-b bmav" data-act="cloudmenu" title="Account · ${esc(S.user.email||'')}" aria-label="Account and sign out"><i>${initial()}</i></button>`);};}
  if(typeof bnavHTML==='function'){const b0=bnavHTML;bnavHTML=function(){const h=b0.apply(this,arguments);if(!S.user)return h;
    return h.replace('<span>Settings</span></button>',`<span>Settings</span></button><button class="more-b bmout" data-act="cloudout">${OUT_IC}<span>Sign out</span></button>`);};}
  function closeMenu(){const m=document.getElementById('bmMenu');if(m)m.remove();document.removeEventListener('pointerdown',outside,true);}
  function outside(e){const m=document.getElementById('bmMenu');if(m&&!m.contains(e.target)&&!e.target.closest('.bmav'))closeMenu();}
  function openMenu(){if(document.getElementById('bmMenu')){closeMenu();return;}const b=document.querySelector('.bmav');if(!b)return;const r=b.getBoundingClientRect();
    const m=document.createElement('div');m.id='bmMenu';m.setAttribute('role','menu');
    m.innerHTML=`<div class="bmm-h"><i>${initial()}</i><div><b>Signed in</b><small>${esc(S.user.email||'Google account')}</small><small>Last cloud save: ${ago(S.lastOk)}</small></div></div>
      <button data-m="save">Save to cloud now</button><button data-m="set">Account settings</button><button data-m="out" class="bmm-out">${OUT_IC}<span>Sign out</span></button>`;
    document.body.appendChild(m);const w=m.offsetWidth;m.style.top=Math.round(r.bottom+8)+'px';m.style.left=Math.max(8,Math.min(window.innerWidth-w-8,Math.round(r.right-w)))+'px';
    m.addEventListener('click',e=>{const x=e.target.closest('[data-m]');if(!x)return;const k=x.dataset.m;closeMenu();
      if(k==='out')ACT.cloudout();else if(k==='save')ACT.cloudnow();else{UI.modal={kind:'settings'};render();}});
    setTimeout(()=>document.addEventListener('pointerdown',outside,true),0);}
  window.addEventListener('resize',closeMenu);
  const st2=document.createElement('style');st2.textContent=`
.bmav i{display:grid;place-items:center;width:30px;height:30px;border-radius:50%;background:#ff6b00;color:#fff;font:800 15px 'Barlow Condensed',system-ui,sans-serif;font-style:normal}
#bmMenu{position:fixed;z-index:9999;width:260px;max-width:calc(100vw - 16px);background:var(--card,#fff);color:var(--fg,#121417);border:1px solid var(--line,#e1e4e8);border-radius:12px;box-shadow:0 12px 32px rgba(0,0,0,.28);padding:8px;display:grid;gap:2px}
#bmMenu .bmm-h{display:flex;gap:10px;align-items:center;padding:8px 8px 12px;border-bottom:1px solid var(--line,#e1e4e8);margin-bottom:4px}
#bmMenu .bmm-h i{flex:none;display:grid;place-items:center;width:38px;height:38px;border-radius:50%;background:#ff6b00;color:#fff;font:800 18px 'Barlow Condensed',system-ui,sans-serif;font-style:normal}
#bmMenu .bmm-h div{min-width:0;display:grid}#bmMenu .bmm-h small{font-size:12.5px;color:var(--mut,#6b7380);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#bmMenu button{display:flex;align-items:center;gap:8px;width:100%;text-align:left;background:none;border:0;border-radius:8px;padding:11px 10px;color:inherit;font:600 14.5px system-ui,sans-serif;text-transform:none;letter-spacing:0;cursor:pointer}
#bmMenu button:hover{background:rgba(127,127,127,.12)}
#bmMenu .bmm-out{color:#d32f2f}
.more-b.bmout{color:#e04848}
.bmacc{border-top:0;border-bottom:1px solid var(--line,#e1e4e8);background:rgba(255,107,0,.06)}
.bmacc [data-act="cloudout"]{border-color:#d32f2f;color:#d32f2f}`;document.head.appendChild(st2);
  async function deleteAccount(){try{const ids=(await sb.from('saves').select('slot_id')).data||[];if(ids.length)await sb.storage.from('saves').remove(ids.map(r=>path(r.slot_id)));
      const {error}=await sb.rpc('delete_my_account');if(error)throw error;}catch(e){if(typeof toast==='function')toast('The account could not be deleted. Try again later.');return;}
    S.dirty={};await wipeLocal();await sb.auth.signOut();S.user=null;UI.accDel=0;UI.modal=null;if(typeof toast==='function')toast('Your account and cloud saves are deleted.');setTimeout(()=>location.reload(),1500);}
  if(typeof ACT==='object')Object.assign(ACT,{
    async cloudnow(){if(typeof save==='function'&&G&&!G.demo){save();await new Promise(r=>setTimeout(r,400));}if(typeof SLOT_ID!=='undefined'&&SLOT_ID&&!S.dirty[SLOT_ID])S.dirty[SLOT_ID]=SVL.find(s=>s.id===SLOT_ID)||null;await upload(true);if(typeof toast==='function')toast(S.err?S.err:'Saved to the cloud.');render();},
    async cloudout(){UI.modal=null;await signOut();},
    cloudmenu(){openMenu();},
    cloudpw(){UI.modal=null;render();S.pwFromGame=true;S.err='';viewNewPw();},
    clouddel(k){k=+k;if(k===2){deleteAccount();return;}UI.accDel=k;render();}});
  // ---------- full game purchase (Stripe Checkout through the bm-checkout Edge Function; the webhook records it) ----------
  // The account is the source of truth: after sign-in gamePaid() is set from the purchases table.
  async function ownsGame(){const {data,error}=await sb.from('purchases').select('product').eq('user_id',boundUser).maybeSingle();if(error)throw error;return !!data;}
  async function syncPaid(){if(!S.user||typeof gamePaid!=='function')return;gamePaid(await ownsGame());}
  async function payReturn(){let q;try{q=new URLSearchParams(location.search);}catch(e){return;}const v=q.get('paid');if(v==null)return;
    q.delete('paid');try{history.replaceState(null,'',location.pathname+(q.toString()?'?'+q:'')+location.hash);}catch(e){}
    if(v!=='1'){if(typeof toast==='function')toast('Payment cancelled. Nothing was charged.');return;}
    if(typeof toast==='function')toast('Confirming your payment…');
    for(let i=0;i<20;i++){try{if(await ownsGame()){gamePaid(true);try{UI.modal=null;}catch(e){}if(typeof render==='function')render();if(typeof toast==='function')toast('Full game unlocked. Thank you!');return;}}catch(e){}
      await new Promise(r=>setTimeout(r,1500));}
    if(typeof toast==='function')toast('Payment received. The unlock can take a minute: reopen the game or use Restore purchase.');}
  window.BM_PAY={label:'Secure payment with Stripe · Apple Pay · Google Pay · Card',
    async buy(){if(!S.user)return false;const {data,error}=await sb.functions.invoke('bm-checkout',{body:{}});
      if(error||!data){if(typeof toast==='function')toast('The payment page could not be opened. Try again in a moment.');return false;}
      if(data.paid)return true;if(data.url){location.href=data.url;return new Promise(()=>{});}return false;},
    async restore(){try{return await ownsGame();}catch(e){return false;}}};
  // ---------- deleting the last-played career from the start screen ----------
  // The game refused to delete the active slot (the career shown on the start screen) and said nothing.
  // On the start screen it is detached first; inside that career the player gets a clear message.
  if(typeof ACT==='object'&&typeof ACT.sldelok==='function'&&typeof slotDelete==='function'){
    ACT.sldelok=async function(id){
      if(typeof SLOT_ID!=='undefined'&&id===SLOT_ID){
        if(typeof G!=='undefined'&&G&&!G.demo&&UI.view!=='start'){UI.slDel=null;slOpen({t:'You are playing this career. Open the start screen first, then delete it.',bad:1});return;}
        try{if(typeof slotDetach==='function')slotDetach();G=null;}catch(e){}}
      await slotDelete(id);UI.slDel=null;
      if(UI.view==='start'||typeof G==='undefined'||!G){try{UI.modal=null;render();}catch(e){}if(typeof toast==='function')toast('Career deleted');}
      else slOpen({t:'Career deleted.'});};}
  // ---------- Start career across a version switch ----------
  // An older release sends "Start career" to the newest release (/play/?new=1) and the chosen club was lost.
  // The choice is kept in sessionStorage for a minute; the newest release starts that career right after sign-in.
  const NC='bm-newcareer';
  // The note is written when the button is tapped (capture phase), because the release runtime wraps ACT.startgame
  // from the outside and redirects before any inner wrapper runs.
  document.addEventListener('click',e=>{const b=e.target&&e.target.closest&&e.target.closest('[data-act="startgame"]');if(!b)return;
    try{const inp=document.getElementById('mgrName');sessionStorage.setItem(NC,JSON.stringify({club:UI.csSel,mgr:inp?inp.value.trim():'',t:Date.now()}));}catch(e){}},true);
  // the inner start ran here, so this release did not redirect: the note is not needed any more
  if(typeof ACT==='object'&&typeof ACT.startgame==='function'){const st0=ACT.startgame;
    ACT.startgame=async function(...a){try{return await st0.apply(this,a);}finally{try{sessionStorage.removeItem(NC);}catch(e){}}};}
  function newCareerResume(){let p=null;try{p=JSON.parse(sessionStorage.getItem(NC)||'null');sessionStorage.removeItem(NC);}catch(e){}
    if(!p||!p.club||Date.now()-p.t>60000)return;if(typeof G!=='undefined'&&G&&!G.demo&&UI.view!=='start')return;   // only from the start screen
    try{if(typeof csData==='function')csData();if(!(UI.cc||[]).some(c=>c.short===p.club))return;const inp=document.getElementById('mgrName');if(inp&&p.mgr)inp.value=p.mgr;if(p.mgr)UI.mgr=p.mgr;
      UI.csSel=p.club;ACT.startgame();   /* no render in between: redrawing the start screen resets the selection */}catch(e){console.error('new career resume',e);}}
  // ---------- paywall safety net for older game versions ----------
  // Careers stay on the game release they started with. Releases from before the paywall (ui.js v458) have no paywallHTML,
  // so this installs the same paywall (copied from ui.js) into them; newer releases keep their own.
  function installPaywallFallback(){if(typeof window.paywallHTML==='function'||typeof seasonHTML!=='function'||typeof modalHTML!=='function'||typeof ACT!=='object'||typeof gamePaid!=='function')return;
/* ===== Paywall after the free season (v458) · design: "Basketball Manager Paywall" artifact (Locked, Main, PhoneReview, PhonePaywall) =====
   The free version plays one season. "Start next season" opens the unlock screen until gamePaid() is true.
   Real payment plugs in through window.BM_PAY = {buy():Promise<boolean>, restore():Promise<boolean>, label:'…'}; without it the
   button is a test unlock (no money involved), so the flow can be tried before a payment provider exists. */
const PW_PRICE='$9';
const PW_IC={
  trophy:'<path d="M7 4h10v5a5 5 0 01-10 0z"/><path d="M7 6H4c0 3 1.5 4.5 3.5 4.5M17 6h3c0 3-1.5 4.5-3.5 4.5M12 14v3M8 21h8M9.5 17h5v4h-5z"/>',
  cup:'<path d="M7 4h10v5a5 5 0 01-10 0z"/><path d="M12 14v3M8 21h8M9.5 17h5v4h-5z"/>',
  loop:'<path d="M4 12a8 8 0 108-8 8 8 0 00-6 2.7M4 4v3.5h3.5"/>',
  shield:'<path d="M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6z"/>',
  flag:'<path d="M5 21V4M5 5h13l-2.5 4L18 13H5"/>',
  globe:'<circle cx="12" cy="12" r="9"/><path d="M5.6 5.6c3.5 3 3.5 9.8 0 12.8M18.4 5.6c-3.5 3-3.5 9.8 0 12.8M3 12h18"/>',
  save:'<path d="M5 3h11l3 3v15H5z"/><path d="M8 3v5h7V3M8 21v-7h8v7"/>',
  lock:'<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/>',
  lockdot:'<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/><circle cx="12" cy="16" r="1.4"/>',
  ok:'<path d="M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
  chev:'<path d="M8 4l8 8-8 8"/>',x:'<path d="M6 6l12 12M18 6L6 18"/>'
};
const pwI=(k,s,c,w)=>`<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c||'currentColor'}" stroke-width="${w||1.9}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${PW_IC[k]}</svg>`;
const pwNext=()=>`${G.season+1}/${String(G.season+2).slice(2)}`;
function pwSeasonFacts(){const h=(G.history||[])[0]||{},T=G.teams[G.user];
  const champ=h.dom?h.dom.champ===G.user:h.champ===G.user;const fin=(h.dom&&h.dom.finish)||h.finish||'';
  return {h,T,champ,fin,season:h.season||seasonStr()};}
function pwStats(){let clubs=0;for(const t of G.teams)if(t&&!t.nt)clubs++;const leagues=Object.keys(typeof NLCFG==='object'?NLCFG:{}).length+1;   // national leagues + the EuroLeague (matches the landing page)
  return {clubs:clubs>=100?Math.floor(clubs/50)*50+'+':String(clubs),leagues};}
/* season review: the locked next-season card (design 1 and 3) */
function pwLockCard(){const F=pwSeasonFacts(),nx=pwNext();
  const head=F.champ?`Defend the title in ${nx} with Pro`:`Take ${esc(F.T.name)} into ${nx} with Pro`;
  return `<section class="pw-lock" aria-label="Next season"><div class="pw-li">${pwI('lockdot',38,'#ffcf5a')}</div>
    <div class="pw-lt"><span class="pw-k">Your free season is complete</span><h2>${head}</h2><span class="pw-ls">Your career, squad and save stay exactly as they are.</span></div>
    <div class="pw-la"><button class="pw-cta" data-act="newseason">${pwI('lock',18,'currentColor',2.6)}Start ${nx} season</button><span class="pw-ls2">Unlock the full game · ${PW_PRICE} once</span></div></section>`;}
const _seasonHTMLv458=seasonHTML;
seasonHTML=function(){const h=_seasonHTMLv458.apply(this,arguments);if(gamePaid())return h;
  const b=h.indexOf('<button class="btn p" data-act="newseason">');if(b<0)return h;const e=h.indexOf('</button>',b)+9;
  const wrap=h.lastIndexOf('<div class="btns"',b);
  return h.slice(0,wrap)+pwLockCard()+h.slice(wrap,b)+h.slice(e);};
/* the unlock screen (design 2 and 4) */
function paywallHTML(){const F=pwSeasonFacts(),S=pwStats(),pay=window.BM_PAY;
  const tile=(ic,b,s)=>`<div class="pw-f">${pwI(ic,26,'#ff8a1f')}<div><b>${b}</b><span>${s}</span></div></div>`;
  const what=F.champ?'won the title':F.fin?`finished ${esc(String(F.fin).replace(/<[^>]+>/g,''))}`:'finished the season';
  return `<div class="ovl pw-ovl" data-act="ovl"><section class="pw" role="dialog" aria-modal="true" aria-label="Unlock the full game">
    <button class="pw-x" data-act="pwclose" aria-label="Close">${pwI('x',18,'currentColor',2.4)}</button>
    <div class="pw-l">
      <span class="pw-k">Season ${esc(F.season)} complete</span>
      <div class="pw-hd"><div class="pw-tr">${pwI('trophy',46,'#ffcf5a',1.8)}</div><h1>Your career is just getting started</h1></div>
      <p class="pw-p">${esc(F.T.name)} ${what}. Keep the squad, the staff and your save, and play on with everything below.</p>
      <div class="pw-fs">${tile('loop','Unlimited','seasons')}${tile('cup',S.leagues,'leagues')}${tile('shield',S.clubs,'playable clubs')}${tile('flag','National teams','EuroBasket and World Cup')}${tile('globe','NBA and NCAA','draft, cap, NIL')}${tile('save','3 save slots','plus export')}</div>
      <div class="pw-safe">${pwI('ok',26,'#5fe08f',2)}<span>Your free career stays saved. Come back any time.</span></div>
    </div>
    <div class="pw-r">
      <h2>Unlock the full game</h2>
      <div class="pw-price"><div class="pw-pr"><b>${PW_PRICE}</b><span><em>One-time</em><small>No subscription. Yours for good.</small></span></div>
        <div class="pw-pt"><div><b>Every season</b><span>no limit</span></div><div><b>Every league</b><span>incl. new ones</span></div><div><b>Every update</b><span>free</span></div></div></div>
      <div class="pw-buy"><button class="pw-cta pw-big" data-act="pwbuy"${UI.pwBusy?' disabled':''}>${UI.pwBusy?'Opening payment…':`Unlock full game · ${PW_PRICE}`}${pwI('chev',20,'currentColor',3)}</button>
        <p class="pw-pay">${pwI('lock',14,'currentColor',2.4)}${pay?esc(pay.label||'Secure payment'):'Test mode: payment is not connected yet, the button unlocks for free'}</p>
        <div class="pw-ft">${pay&&pay.restore?'<button class="pw-lnk" data-act="pwrestore">Restore purchase</button>':'<span></span>'}<button class="pw-lnk pw-mut" data-act="pwclose">Not now, back to the season review</button></div></div>
    </div></section></div>`;}
const _modalHTMLv458=modalHTML;
modalHTML=function(){if(UI.modal&&UI.modal.kind==='paywall')return paywallHTML();return _modalHTMLv458.apply(this,arguments);};
const _newseasonv458=ACT.newseason;
Object.assign(ACT,{
  newseason(){if(!gamePaid()&&G&&!G.demo){UI.modal={kind:'paywall'};render();return;}return _newseasonv458.apply(this,arguments);},
  pwclose(){UI.modal=null;UI.pwBusy=0;render();},
  async pwbuy(){if(UI.pwBusy)return;const pay=window.BM_PAY;let ok=false;
    if(pay&&pay.buy){UI.pwBusy=1;render();try{ok=await pay.buy();}catch(e){console.error('pay',e);}UI.pwBusy=0;}
    else ok=true;
    if(!ok){render();toast('The payment did not go through. Nothing was charged.');return;}
    gamePaid(true);UI.modal=null;render();toast(pay?'Full game unlocked. Thank you!':'Unlocked (test mode, no payment)');},
  async pwrestore(){const pay=window.BM_PAY;if(!pay||!pay.restore)return;let ok=false;try{ok=await pay.restore();}catch(e){}
    if(ok){gamePaid(true);UI.modal=null;render();toast('Purchase restored');}else toast('No purchase found for this account.');}
});
(function(){const st=document.createElement('style');st.textContent=`
.pw-k{font:800 13px 'Barlow Condensed',sans-serif;letter-spacing:.2em;text-transform:uppercase;color:#ff8a1f}
.pw-lock{display:flex;align-items:center;gap:28px;padding:26px 30px;border-radius:10px;background:#121417;color:#e9ecef;box-shadow:0 16px 40px rgba(0,0,0,.18);max-width:960px;margin:0 auto 14px;width:100%;box-sizing:border-box}
.pw-li{width:72px;height:72px;border-radius:16px;background:#22262c;display:flex;align-items:center;justify-content:center;flex:none}
.pw-lt{flex:1;min-width:0;display:flex;flex-direction:column;gap:6px}
.pw-lock h2{margin:0;font:italic 900 34px/1 'Barlow Condensed',sans-serif;text-transform:uppercase;color:#fff;text-wrap:balance}
.pw-ls{font-size:15px;color:#b9c0c8}.pw-ls2{font-size:13px;color:#9aa3ad}
.pw-la{display:flex;flex-direction:column;align-items:flex-end;gap:10px;flex:none}
.pw-cta{height:58px;display:inline-flex;align-items:center;justify-content:center;gap:12px;padding:0 28px;border:0;border-radius:8px;background:#ff6b00;color:#fff;font:800 23px 'Barlow Condensed',sans-serif;letter-spacing:.1em;text-transform:uppercase;cursor:pointer}
.pw-cta:hover{filter:brightness(1.08)}.pw-cta[disabled]{opacity:.6;cursor:default}
@media (max-width:760px){.pw-lock{flex-direction:column;align-items:stretch;gap:12px;padding:18px 16px}.pw-lock .pw-li{display:none}.pw-lock h2{font-size:24px}.pw-ls{font-size:14px}.pw-la{align-items:stretch}.pw-cta{height:52px;font-size:18px;letter-spacing:.06em;padding:0 14px;gap:8px;white-space:nowrap}.pw-ls2{text-align:center;font-size:12px}}
.pw-ovl{align-items:center;z-index:10000}
.pw{position:relative;width:min(1200px,calc(100vw - 48px));max-height:calc(100vh - 48px);overflow:auto;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);background:#15181d;border-radius:14px;box-shadow:0 40px 120px rgba(0,0,0,.6);color:#e9ecef;font-family:Barlow,'Helvetica Neue',Arial,sans-serif;text-align:left}
.pw-l{padding:48px 48px 40px;display:flex;flex-direction:column;gap:24px;background:#101317}
.pw-r{padding:48px 48px 40px;display:flex;flex-direction:column;gap:16px}
.pw-x{position:absolute;top:18px;right:18px;width:44px;height:44px;border-radius:50%;border:0;background:#22262c;color:#b9c0c8;display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:2;padding:0}
.pw-hd{display:flex;align-items:center;gap:20px}
.pw-tr{width:84px;height:84px;border-radius:50%;background:#1e2228;display:flex;align-items:center;justify-content:center;flex:none}
.pw h1{margin:0;font:italic 900 46px/.95 'Barlow Condensed',sans-serif;text-transform:uppercase;letter-spacing:.01em;color:#fff;text-wrap:balance}
.pw-p{margin:0;font-size:16px;line-height:1.5;color:#b9c0c8;max-width:440px}
.pw-fs{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.pw-f{display:flex;align-items:center;gap:12px;padding:14px;border-radius:10px;background:#1a1e24}.pw-f svg{flex:none}
.pw-f b{display:block;font:800 22px/1 'Barlow Condensed',sans-serif;color:#fff}.pw-f span{font-size:13px;color:#9aa3ad}
.pw-safe{margin-top:auto;display:flex;align-items:center;gap:14px;padding-top:18px;border-top:1px solid #262b32;font-size:14px;color:#9aa3ad}.pw-safe svg{flex:none}
.pw-r h2{margin:0;font:800 26px 'Barlow Condensed',sans-serif;letter-spacing:.06em;text-transform:uppercase;color:#fff}
.pw-price{padding:26px 24px;border-radius:12px;background:#22180f;border:2px solid #ff6b00;display:flex;flex-direction:column;gap:14px}
.pw-pr{display:flex;align-items:baseline;gap:14px}.pw-pr>b{font:italic 900 88px/.9 'Barlow Condensed',sans-serif;color:#fff}
.pw-pr>span{display:flex;flex-direction:column;gap:2px}.pw-pr em{font:800 20px 'Barlow Condensed',sans-serif;font-style:normal;letter-spacing:.08em;text-transform:uppercase;color:#ff8a1f}.pw-pr small{font-size:14px;color:#b9c0c8}
.pw-pt{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.pw-pt>div{padding:10px;border-radius:8px;background:#2a1f14;text-align:center}
.pw-pt b{display:block;font:800 18px/1 'Barlow Condensed',sans-serif;color:#fff}.pw-pt span{font-size:12px;color:#b9c0c8}
.pw-buy{display:flex;flex-direction:column;gap:12px;flex:1}
.pw-big{width:100%;height:60px;margin-top:8px;font-size:24px}
.pw-pay{margin:0;display:flex;justify-content:center;align-items:center;gap:8px;font-size:13px;color:#9aa3ad;text-align:center}.pw-pay svg{flex:none}
.pw-ft{margin-top:auto;display:flex;justify-content:space-between;align-items:center;gap:12px;padding-top:18px;border-top:1px solid #262b32}
.pw-lnk{background:none;border:0;padding:0;min-height:44px;font:500 14px Barlow,system-ui,sans-serif;color:#ff8a1f;cursor:pointer;text-transform:none;letter-spacing:0}.pw-lnk:hover{color:#ffb066}.pw-mut{color:#b9c0c8}
@media (max-width:760px){
 .pw-ovl{padding:0!important;align-items:stretch}
 .pw{width:100vw;max-height:none;height:100dvh;border-radius:0;grid-template-columns:minmax(0,1fr);overflow:auto;display:flex;flex-direction:column}
 .pw-l{order:1;padding:calc(18px + env(safe-area-inset-top,0px)) max(18px,env(safe-area-inset-right,0px)) 0 max(18px,env(safe-area-inset-left,0px));gap:14px;background:#101317}
 .pw-r{order:2;padding:14px max(18px,env(safe-area-inset-right,0px)) 0 max(18px,env(safe-area-inset-left,0px));gap:14px;background:#101317;flex:1}
 .pw-r h2{display:none}
 .pw-x{top:calc(10px + env(safe-area-inset-top,0px));right:10px}
 .pw-l>.pw-k{padding-right:52px}
 .pw-tr{width:60px;height:60px}.pw-tr svg{width:34px;height:34px}
 .pw h1{font-size:32px}.pw-p{font-size:14px}
 .pw-fs{gap:8px}.pw-f{padding:10px;gap:10px}.pw-f svg{width:22px;height:22px}.pw-f b{font-size:17px}.pw-f span{font-size:11px}
 .pw-fs .pw-f:nth-child(n+5){display:none}
 .pw-safe{order:3;margin-top:0;padding-top:0;border-top:0;font-size:12.5px}.pw-safe svg{width:18px;height:18px}
 .pw-l{display:flex}.pw-l .pw-fs{order:2}.pw-l .pw-safe{order:4}
 .pw-price{padding:16px;gap:12px}.pw-pr>b{font-size:64px}.pw-pr em{font-size:17px}.pw-pr small{font-size:13px}
 .pw-pt{gap:6px}.pw-pt>div{padding:8px 4px}.pw-pt b{font-size:15px}.pw-pt span{font-size:11px}
 .pw-buy{position:sticky;bottom:0;margin:0 calc(-1 * max(18px,env(safe-area-inset-left,0px)));padding:14px max(18px,env(safe-area-inset-right,0px)) calc(14px + env(safe-area-inset-bottom,0px)) max(18px,env(safe-area-inset-left,0px));background:#15181d;border-top:1px solid #262b32;box-shadow:0 -12px 30px rgba(0,0,0,.35);gap:10px;flex:none;margin-top:auto}
 .pw-big{height:56px;font-size:21px;margin-top:0}.pw-pay{font-size:11.5px}
 .pw-ft{padding-top:0;border-top:0;margin-top:0}
}`;document.head.appendChild(st);})();
  window.paywallHTML=paywallHTML;}
  try{installPaywallFallback();}catch(e){console.error('paywall fallback',e);}
  // ---------- start ----------
  try{const q=new URLSearchParams(location.search);if(q.get('reset')==='1'){S.recovery=true;q.delete('reset');history.replaceState(null,'',location.pathname+(q.toString()?'?'+q:'')+location.hash);}}catch(e){}
  viewLoading('Loading…');
  sb.auth.onAuthStateChange((ev,session)=>{if(switching||identityChanged(session?.user))return;if(ev==='PASSWORD_RECOVERY'){S.recovery=true;S.user=session&&session.user;viewNewPw();return;}if(ev==='INITIAL_SESSION')return;if(ev==='SIGNED_IN'&&S.user&&session&&session.user&&session.user.id===S.user.id)return;if(ev==='TOKEN_REFRESHED'||ev==='USER_UPDATED')return;onUser(session?session.user:null);});
  sb.auth.getSession().then(({data})=>onUser(data&&data.session?data.session.user:null)).catch(()=>viewEntry());
})();
