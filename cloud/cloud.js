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
  function viewSignIn(){S.view='in';show(`<form class="ba" novalidate data-f="in">${brand}<h1>Sign in</h1><p>Your account keeps your careers safe in the cloud, so you can continue on any device.</p>
    ${okBox()}${emField()}${pwField('bmPw','Password','current-password')}<button type="button" class="bl br" data-a="forgot">Forgot password?</button>${capBox()}${errBox()}
    <button type="submit" class="bp" id="bmGo" disabled>${S.busy?'Signing in…':'Sign in'}</button>
    <div class="bor">or</div><button type="button" class="bg" data-a="google">${G_ICON}Continue with Google</button>
    <p class="bsw">New here? <button type="button" class="bl" data-a="toup">Create an account</button></p>${legal}</form>`);}
  function viewSignUp(){S.view='up';show(`<form class="ba" novalidate data-f="up">${brand}<h1>Create account</h1><p>Free. Your careers are saved in the cloud and follow you to every device.</p>
    ${emField()}${pwField('bmPw','Password (at least 8 characters)','new-password')}<div class="bhint" id="bmHint">At least 8 characters</div>${consentBox}${capBox()}${errBox()}
    <button type="submit" class="bp" id="bmGo" disabled>${S.busy?'Creating account…':'Create account'}</button>
    <div class="bor">or</div><button type="button" class="bg" id="bmGoogle" data-a="google" disabled>${G_ICON}Continue with Google</button>
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
      if(data&&data.session)return;   // email confirmation is off: signed in right away (onAuthStateChange takes over)
      S.resend={type:'signup',email:em};viewMail('Confirm your email',`We sent a link to <b>${esc(em)}</b>. Open it to activate your account; then you are signed in.`);return;}
    if(f==='fg'){const {error}=await sb.auth.resetPasswordForEmail(em,Object.assign({redirectTo:back()+'?reset=1'},capOpt()));S.busy=false;
      if(error&&error.status===429){S.err='Too many requests. Wait a minute and try again.';viewForgot();return;}
      S.resend=null;viewMail('Check your inbox',`If an account exists for <b>${esc(em)}</b>, we sent a link to set a new password. The link works once and expires after an hour.`);return;}
    if(f==='np'){const {data,error}=await sb.auth.updateUser({password:pw});S.busy=false;
      if(error){const m=(error.message||'').toLowerCase();S.err=error.code==='same_password'||m.includes('different')?'Choose a password you have not used before.':error.code==='weak_password'||m.includes('weak')?'This password is too easy to guess.':'The password could not be saved. Try again.';viewNewPw();return;}
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
  async function onUser(u){if(switching||identityChanged(u))return;S.user=u;if(!u){if(S.view!=='mail')viewSignIn();return;}
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
    boundUser=id;
    try{await syncPaid();}catch(e){console.error('purchase check',e);}
    try{await pull();}catch(e){console.error('cloud pull',e);}
    if(switching || S.user?.id!==id)return;
    hide();try{if(typeof render==='function')render();}catch(e){}payReturn();}
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
  async function upload(force){if(switching||!boundUser||S.user?.id!==boundUser||S.upBusy)return;const ids=Object.keys(S.dirty);if(!ids.length)return;if(!force&&Date.now()-S.last<180000)return;
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
  setInterval(()=>{upload(false).catch(()=>{});},30000);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')upload(true).catch(()=>{});});
  // ---------- Settings > Account ----------
  const ago=t=>{if(!t)return 'not yet';const m=Math.round((Date.now()-t)/60000);return m<1?'just now':m<60?`${m} min ago`:m<1440?`${Math.round(m/60)} h ago`:new Date(t).toLocaleDateString('en-GB');};
  function accountHTML(){if(!S.user)return '';const n=Object.keys(S.dirty).length;
    return `<div class="bmacc"><b>Account</b><small>Signed in as ${esc(S.user.email||'Google account')}</small><small>Last cloud save: ${ago(S.lastOk)}${n?' · changes waiting to upload':''}${S.err?` · ${esc(S.err)}`:''}</small>
      <div class="btns"><button class="btn sm" data-act="cloudnow">Save to cloud now</button><button class="btn sm" data-act="cloudpw">Change password</button><button class="btn sm" data-act="cloudout">Sign out</button>${UI.accDel?`<button class="btn sm" data-act="clouddel:0">Keep my account</button><button class="btn sm set-x" data-act="clouddel:2">Delete account and all cloud saves</button>`:`<button class="btn sm" data-act="clouddel:1">Delete account…</button>`}</div>
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
  // ---------- start ----------
  try{const q=new URLSearchParams(location.search);if(q.get('reset')==='1'){S.recovery=true;q.delete('reset');history.replaceState(null,'',location.pathname+(q.toString()?'?'+q:'')+location.hash);}}catch(e){}
  viewLoading('Loading…');
  sb.auth.onAuthStateChange((ev,session)=>{if(switching||identityChanged(session?.user))return;if(ev==='PASSWORD_RECOVERY'){S.recovery=true;S.user=session&&session.user;viewNewPw();return;}if(ev==='INITIAL_SESSION')return;if(ev==='SIGNED_IN'&&S.user&&session&&session.user&&session.user.id===S.user.id)return;if(ev==='TOKEN_REFRESHED'||ev==='USER_UPDATED')return;onUser(session?session.user:null);});
  sb.auth.getSession().then(({data})=>onUser(data&&data.session?data.session.user:null)).catch(()=>viewSignIn());
})();
