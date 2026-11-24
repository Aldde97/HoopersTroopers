/* Basketball Manager · accounts and cloud saves (web version only).
   Loaded after the game by the deployed site, with window.BM_CLOUD = {url, anon} (Supabase project URL and public anon key) and
   the supabase-js client. Without both it does nothing and the game plays as before.
   - Gate: a sign-in screen covers the game until the player is signed in and has accepted the terms (16+).
   - Sign-in: a link by email (no password) or Google.
   - Cloud saves: every career slot is uploaded as its gzip file (at most every 3 minutes while playing, and when the tab is hidden);
     after signing in, careers that are newer in the cloud are downloaded into this browser.
   - Settings > Account: email, last cloud save, Save to cloud now, Sign out, Delete account (files, rows and the account). */
(function(){
  const C=window.BM_CLOUD||{};if(!C.url||!C.anon||!window.supabase||!window.supabase.createClient)return;
  const sb=window.supabase.createClient(C.url,C.anon,{auth:{flowType:'pkce',persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  const S={user:null,busy:false,sent:null,err:'',up:{},last:0,lastOk:null,dirty:{},consentNeeded:false};
  window.BM_CLOUD_STATE=S;
  const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
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
#bmAuth .be{color:#ff6b6b;font-size:14px}#bmAuth .bk{padding:14px 16px;border-radius:8px;background:#151a21;border:1px solid #2c333d}
#bmAuth .bf{font-size:12.5px;color:#6b7380;display:flex;gap:14px;flex-wrap:wrap}
.bmacc{display:grid;gap:6px;padding:14px 22px;border-top:1px solid var(--line,#e1e4e8)}.bmacc b{font-size:14px}.bmacc small{color:var(--mut,#6b7380);font-size:12.5px}.bmacc .btns{flex-wrap:wrap}`;
  const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
  const G_ICON='<svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C36.9 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>';
  let gate=null;
  function show(html){if(!gate){gate=document.createElement('div');gate.id='bmAuth';gate.setAttribute('role','dialog');gate.setAttribute('aria-modal','true');gate.setAttribute('aria-label','Sign in');document.body.appendChild(gate);gate.addEventListener('click',onClick);gate.addEventListener('submit',e=>{e.preventDefault();sendLink();});gate.addEventListener('change',syncBtns);}gate.innerHTML=html;syncBtns();}
  function hide(){if(gate){gate.remove();gate=null;}}
  const legal=`<div class="bf"><a href="/terms/" target="_blank" rel="noopener">Terms</a><a href="/privacy/" target="_blank" rel="noopener">Privacy</a><a href="/legal/" target="_blank" rel="noopener">Legal notice</a></div>`;
  const consentBox=`<label class="bc"><input type="checkbox" id="bmOk"><span>I am 16 or older and accept the <a href="/terms/" target="_blank" rel="noopener">terms</a> and the <a href="/privacy/" target="_blank" rel="noopener">privacy policy</a>.</span></label>`;
  function viewSignIn(){show(`<form class="ba" novalidate><div class="bt">Basketball Manager</div><h1>Sign in to play</h1><p>Your account keeps your careers safe in the cloud, so you can continue on any device.</p>
    <input type="email" id="bmEmail" placeholder="you@example.com" autocomplete="email" inputmode="email" aria-label="Email address" value="${esc(S.email||'')}">
    ${consentBox}${S.err?`<div class="be" role="alert">${esc(S.err)}</div>`:''}
    <button type="submit" class="bp" id="bmSend" disabled>${S.busy?'Sending…':'Email me a sign-in link'}</button>
    <div class="bor">or</div><button type="button" class="bg" id="bmGoogle" data-a="google" disabled>${G_ICON}Continue with Google</button>${legal}</form>`);}
  function viewSent(){show(`<div class="ba"><div class="bt">Basketball Manager</div><h1>Check your inbox</h1><div class="bk">We sent a sign-in link to <b>${esc(S.sent)}</b>. Open it on this device to start playing. The link works once and expires after an hour.</div>
    <p>Nothing there? Look in your spam folder, or try again in a minute.</p>${S.err?`<div class="be" role="alert">${esc(S.err)}</div>`:''}<button type="button" class="bl" data-a="back">Use another email address</button>${legal}</div>`);}
  function viewConsent(){show(`<div class="ba"><div class="bt">Basketball Manager</div><h1>One more step</h1><p>Signed in as <b>${esc(S.user&&S.user.email)}</b>.</p>${consentBox}${S.err?`<div class="be" role="alert">${esc(S.err)}</div>`:''}
    <button type="button" class="bp" id="bmAgree" data-a="agree" disabled>Start playing</button><button type="button" class="bl" data-a="signout">Sign out</button>${legal}</div>`);}
  function viewLoading(t){show(`<div class="ba"><div class="bt">Basketball Manager</div><h1>${esc(t)}</h1></div>`);}
  function syncBtns(){if(!gate)return;const ok=!!(gate.querySelector('#bmOk')||{}).checked,em=gate.querySelector('#bmEmail'),valid=em&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em.value.trim());
    const s=gate.querySelector('#bmSend');if(s)s.disabled=!ok||!valid||S.busy;const g=gate.querySelector('#bmGoogle');if(g)g.disabled=!ok||S.busy;const a=gate.querySelector('#bmAgree');if(a)a.disabled=!ok||S.busy;}
  document.addEventListener('input',e=>{if(e.target&&e.target.id==='bmEmail'){S.email=e.target.value;syncBtns();}});
  function onClick(e){const b=e.target.closest('[data-a]');if(!b)return;const a=b.dataset.a;
    if(a==='google')google();else if(a==='back'){S.sent=null;S.err='';viewSignIn();}else if(a==='agree')agree();else if(a==='signout')signOut();}
  const back=()=>location.origin+location.pathname;
  async function sendLink(){const em=(S.email||'').trim();if(!em)return;S.busy=true;S.err='';viewSignIn();
    const {error}=await sb.auth.signInWithOtp({email:em,options:{emailRedirectTo:back(),data:{consent_at:new Date().toISOString(),age16:true}}});
    S.busy=false;if(error){S.err=error.status===429?'Too many requests. Wait a minute and try again.':'The email could not be sent. Check the address and try again.';viewSignIn();return;}S.sent=em;viewSent();}
  async function google(){S.busy=true;S.err='';try{localStorage.setItem('bm-consent-pending','1');}catch(e){}
    const {error}=await sb.auth.signInWithOAuth({provider:'google',options:{redirectTo:back()}});if(error){S.busy=false;S.err='Google sign-in is not available right now.';viewSignIn();}}
  async function agree(){S.busy=true;syncBtns();const {data,error}=await sb.auth.updateUser({data:{consent_at:new Date().toISOString(),age16:true}});S.busy=false;
    if(error){S.err='That did not work. Try again.';viewConsent();return;}S.user=data.user;enter();}
  async function signOut(){try{await upload(true);}catch(e){}await sb.auth.signOut();S.user=null;S.sent=null;viewSignIn();}
  const hasConsent=u=>!!(u&&u.user_metadata&&u.user_metadata.consent_at);
  async function onUser(u){S.user=u;if(!u){viewSignIn();return;}
    if(!hasConsent(u)){let pend=false;try{pend=localStorage.getItem('bm-consent-pending')==='1';}catch(e){}
      if(pend){try{localStorage.removeItem('bm-consent-pending');}catch(e){}const {data}=await sb.auth.updateUser({data:{consent_at:new Date().toISOString(),age16:true}});if(data&&data.user){S.user=data.user;return enter();}}
      viewConsent();return;}
    enter();}
  async function enter(){viewLoading('Loading your careers…');try{await pull();}catch(e){console.error('cloud pull',e);}hide();try{if(typeof render==='function')render();}catch(e){}}
  // ---------- cloud saves ----------
  const path=id=>`${S.user.id}/${id}.gz`;
  async function pull(){if(typeof SAVE_READY!=='undefined')await SAVE_READY;if(typeof IDB_OK==='undefined'||!IDB_OK)return;
    const {data:rows,error}=await sb.from('saves').select('slot_id,meta,updated_at').order('updated_at',{ascending:false});if(error||!rows)return;
    let newest=null;
    for(const r of rows){const loc=(SVL||[]).find(s=>s.id===r.slot_id),cs=(r.meta&&r.meta.savedAt)||Date.parse(r.updated_at);
      if(loc&&loc.savedAt>=cs-2000){continue;}
      const {data:blob,error:e2}=await sb.storage.from('saves').download(path(r.slot_id));if(e2||!blob)continue;
      const z=new Uint8Array(await blob.arrayBuffer());await slotPut(r.slot_id,{z},Object.assign({},r.meta||{},{id:r.slot_id,savedAt:cs}));
      if(!newest)newest=r.slot_id;}
    if(newest&&(!SLOT_ID||!G)){SLOT_ID=newest;lsSet(SLOT_ACT,newest);try{SAVE_TXT=await slotTxt(newest);}catch(e){}}
    for(const r of rows)S.up[r.slot_id]=(r.meta&&r.meta.savedAt)||Date.parse(r.updated_at);S.lastOk=rows.length?Date.parse(rows[0].updated_at):S.lastOk;}
  async function upload(force){if(!S.user||S.upBusy)return;const ids=Object.keys(S.dirty);if(!ids.length)return;if(!force&&Date.now()-S.last<180000)return;
    S.upBusy=true;S.last=Date.now();
    try{for(const id of ids){const meta=S.dirty[id];delete S.dirty[id];const rec=await idbTx(['data'],'readonly',d=>d.get(id));if(!rec)continue;
        const z=rec.z||(rec.txt?await gz(rec.txt):null);if(!z)continue;
        const {error}=await sb.storage.from('saves').upload(path(id),new Blob([z],{type:'application/gzip'}),{upsert:true,contentType:'application/gzip',cacheControl:'0'});
        if(error){S.dirty[id]=meta;S.err='Cloud save failed. It will try again.';continue;}
        const m=Object.assign({},meta||{});const {error:e2}=await sb.from('saves').upsert({user_id:S.user.id,slot_id:id,meta:m,size:z.byteLength||z.length,updated_at:new Date().toISOString()});
        if(e2){S.dirty[id]=meta;S.err=/10 careers/.test(e2.message||'')?'Cloud limit: at most 10 careers.':'Cloud save failed. It will try again.';continue;}
        S.up[id]=m.savedAt||Date.now();S.lastOk=Date.now();S.err='';}}
    finally{S.upBusy=false;}}
  // every local save marks its slot; uploads follow on a timer, on Save to cloud now, and when the tab is hidden
  if(typeof saveZ==='function'){const z0=saveZ;saveZ=async function(txt,id,meta){const r=await z0.apply(this,arguments);if(S.user&&id&&typeof IDB_OK!=='undefined'&&IDB_OK)S.dirty[id]=meta||S.dirty[id]||null;return r;};}
  if(typeof slotDelete==='function'){const d0=slotDelete;slotDelete=async function(id){const r=await d0.apply(this,arguments);if(S.user&&id){delete S.dirty[id];try{await sb.storage.from('saves').remove([path(id)]);await sb.from('saves').delete().eq('slot_id',id);}catch(e){}}return r;};}
  setInterval(()=>{upload(false).catch(()=>{});},30000);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')upload(true).catch(()=>{});});
  // ---------- Settings > Account ----------
  const ago=t=>{if(!t)return 'not yet';const m=Math.round((Date.now()-t)/60000);return m<1?'just now':m<60?`${m} min ago`:m<1440?`${Math.round(m/60)} h ago`:new Date(t).toLocaleDateString('en-GB');};
  function accountHTML(){if(!S.user)return '';const n=Object.keys(S.dirty).length;
    return `<div class="bmacc"><b>Account</b><small>Signed in as ${esc(S.user.email||'Google account')}</small><small>Last cloud save: ${ago(S.lastOk)}${n?' · changes waiting to upload':''}${S.err?` · ${esc(S.err)}`:''}</small>
      <div class="btns"><button class="btn sm" data-act="cloudnow">Save to cloud now</button><button class="btn sm" data-act="cloudout">Sign out</button>${UI.accDel?`<button class="btn sm" data-act="clouddel:0">Keep my account</button><button class="btn sm set-x" data-act="clouddel:2">Delete account and all cloud saves</button>`:`<button class="btn sm" data-act="clouddel:1">Delete account…</button>`}</div>
      ${UI.accDel?'<small>This deletes your account and every career stored in the cloud. Careers saved in this browser stay here. This cannot be undone.</small>':''}</div>`;}
  if(typeof settingsModal==='function'){const m0=settingsModal;settingsModal=function(){const h=m0.apply(this,arguments);return h.replace('<p class="set-n">',accountHTML()+'<p class="set-n">');};}
  async function deleteAccount(){try{const ids=(await sb.from('saves').select('slot_id')).data||[];if(ids.length)await sb.storage.from('saves').remove(ids.map(r=>path(r.slot_id)));
      const {error}=await sb.rpc('delete_my_account');if(error)throw error;}catch(e){if(typeof toast==='function')toast('The account could not be deleted. Try again later.');return;}
    S.dirty={};await sb.auth.signOut();S.user=null;UI.accDel=0;UI.modal=null;if(typeof toast==='function')toast('Your account and cloud saves are deleted.');viewSignIn();}
  if(typeof ACT==='object')Object.assign(ACT,{
    async cloudnow(){if(typeof save==='function'&&G&&!G.demo){save();await new Promise(r=>setTimeout(r,400));}if(typeof SLOT_ID!=='undefined'&&SLOT_ID&&!S.dirty[SLOT_ID])S.dirty[SLOT_ID]=SVL.find(s=>s.id===SLOT_ID)||null;await upload(true);if(typeof toast==='function')toast(S.err?S.err:'Saved to the cloud.');render();},
    async cloudout(){UI.modal=null;await signOut();},
    clouddel(k){k=+k;if(k===2){deleteAccount();return;}UI.accDel=k;render();}});
  // ---------- start ----------
  viewLoading('Loading…');
  sb.auth.onAuthStateChange((ev,session)=>{if(ev==='INITIAL_SESSION')return;if(ev==='SIGNED_IN'&&S.user&&session&&session.user&&session.user.id===S.user.id)return;if(ev==='TOKEN_REFRESHED'||ev==='USER_UPDATED')return;onUser(session?session.user:null);});
  sb.auth.getSession().then(({data})=>onUser(data&&data.session?data.session.user:null)).catch(()=>viewSignIn());
})();
