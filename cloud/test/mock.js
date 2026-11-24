window.supabase={createClient(){const db=window.__mock=window.__mock||{rows:{},files:{},user:null,listeners:[],calls:[]};
 const fire=ev=>db.listeners.forEach(f=>f(ev,db.user?{user:db.user}:null));
 const auth={getSession:async()=>({data:{session:db.user?{user:db.user}:null}}),onAuthStateChange(f){db.listeners.push(f);return {data:{subscription:{unsubscribe(){}}}};},
  signInWithOtp:async({email,options})=>{db.calls.push(['otp',email,options.emailRedirectTo]);db.pendingEmail=email;db.pendingData=options.data;return {error:null};},
  signInWithOAuth:async(o)=>{db.calls.push(['oauth',o.provider]);return {error:null};},
  updateUser:async({data})=>{db.user.user_metadata=Object.assign({},db.user.user_metadata,data);return {data:{user:db.user},error:null};},
  signOut:async()=>{db.user=null;fire('SIGNED_OUT');return {error:null};}};
 window.__mockClickLink=()=>{db.user={id:'11111111-2222-3333-4444-555555555555',email:db.pendingEmail,user_metadata:Object.assign({},db.pendingData)};fire('SIGNED_IN');};
 window.__mockGoogle=()=>{db.user={id:'99999999-2222-3333-4444-555555555555',email:'g@example.com',user_metadata:{}};fire('SIGNED_IN');};
 const from=table=>{const st={filters:[]};const api={select(){st.op='select';return api;},order(){return api;},eq(k,v){st.filters.push([k,v]);return api;},delete(){st.op='delete';return api;},
   upsert(row){db.rows[row.slot_id]=JSON.parse(JSON.stringify(row));return Promise.resolve({error:null});},
   then(res,rej){let out;if(st.op==='select')out={data:Object.values(db.rows).sort((a,b)=>b.updated_at.localeCompare(a.updated_at)),error:null};else{for(const [k,v] of st.filters)if(k==='slot_id')delete db.rows[v];out={error:null};}return Promise.resolve(out).then(res,rej);}};return api;};
 return {auth,from,rpc:async n=>{db.calls.push(['rpc',n]);db.rows={};return {error:null};},
  storage:{from:()=>({upload:async(p,blob)=>{db.files[p]=new Uint8Array(await blob.arrayBuffer());return {error:null};},download:async p=>db.files[p]?{data:new Blob([db.files[p]]),error:null}:{data:null,error:{message:'not found'}},remove:async ps=>{ps.forEach(p=>delete db.files[p]);return {error:null};}})}};}};
