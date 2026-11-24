window.supabase={createClient(){const db=window.__mock=window.__mock||{rows:{},files:{},users:{},user:null,listeners:[],calls:[]};
 const fire=ev=>db.listeners.forEach(f=>f(ev,db.user?{user:db.user}:null));const err=(code,message,status)=>({code,message,status:status||400});
 const auth={getSession:async()=>({data:{session:db.user?{user:db.user}:null}}),onAuthStateChange(f){db.listeners.push(f);return {data:{subscription:{unsubscribe(){}}}};},
  signUp:async({email,password,options})=>{db.calls.push(['signUp',email]);if(db.users[email])return {data:{user:{identities:[]},session:null},error:null};if(password.length<8)return {data:{},error:err('weak_password','weak')};
    db.users[email]={id:'u'+Object.keys(db.users).length+'-2222-3333-4444-555555555555',pw:password,confirmed:false,meta:Object.assign({},options.data)};return {data:{user:{identities:[{}]},session:null},error:null};},
  signInWithPassword:async({email,password})=>{const u=db.users[email];if(!u||u.pw!==password)return {data:{},error:err('invalid_credentials','Invalid login credentials')};if(!u.confirmed)return {data:{},error:err('email_not_confirmed','Email not confirmed')};
    db.user={id:u.id,email,user_metadata:u.meta};fire('SIGNED_IN');return {data:{user:db.user,session:{}},error:null};},
  resetPasswordForEmail:async(email,o)=>{db.calls.push(['reset',email,o.redirectTo]);return {error:null};},
  resend:async(o)=>{db.calls.push(['resend',o.email]);return {error:null};},
  signInWithOAuth:async(o)=>{db.calls.push(['oauth',o.provider]);return {error:null};},
  updateUser:async(o)=>{if(o.password){const u=Object.values(db.users).find(x=>x.id===db.user.id);if(u&&u.pw===o.password)return {data:{},error:err('same_password','New password should be different')};if(u)u.pw=o.password;db.calls.push(['pw']);}
    if(o.data){db.user.user_metadata=Object.assign({},db.user.user_metadata,o.data);}return {data:{user:db.user},error:null};},
  signOut:async()=>{db.user=null;fire('SIGNED_OUT');return {error:null};}};
 window.__mockConfirm=email=>{const u=db.users[email];u.confirmed=true;db.user={id:u.id,email,user_metadata:u.meta};fire('SIGNED_IN');};
 window.__mockRecovery=email=>{const u=db.users[email];db.user={id:u.id,email,user_metadata:u.meta};db.listeners.forEach(f=>f('PASSWORD_RECOVERY',{user:db.user}));};
 window.__mockGoogle=()=>{db.user={id:'99999999-2222-3333-4444-555555555555',email:'g@example.com',user_metadata:{}};fire('SIGNED_IN');};
 const from=table=>{const st={filters:[]};const api={select(){st.op='select';return api;},order(){return api;},eq(k,v){st.filters.push([k,v]);return api;},delete(){st.op='delete';return api;},
   upsert(row){db.rows[row.slot_id]=JSON.parse(JSON.stringify(row));return Promise.resolve({error:null});},
   then(res,rej){let out;if(st.op==='select')out={data:Object.values(db.rows).sort((a,b)=>b.updated_at.localeCompare(a.updated_at)),error:null};else{for(const [k,v] of st.filters)if(k==='slot_id')delete db.rows[v];out={error:null};}return Promise.resolve(out).then(res,rej);}};return api;};
 return {auth,from,rpc:async n=>{db.calls.push(['rpc',n]);db.rows={};return {error:null};},
  storage:{from:()=>({upload:async(p,blob)=>{db.files[p]=new Uint8Array(await blob.arrayBuffer());return {error:null};},download:async p=>db.files[p]?{data:new Blob([db.files[p]]),error:null}:{data:null,error:{message:'not found'}},remove:async ps=>{ps.forEach(p=>delete db.files[p]);return {error:null};}})}};}};
