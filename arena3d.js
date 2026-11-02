'use strict';
/* ===================== 3D arena (Club tab) ===================== */
// A diorama of the user's arena drawn with three.js: court, stands sized by capacity, fans by expected attendance,
// VIP boxes, catering kiosks, video cube and LED ribbon by facility level, and a construction site for the running project.
// Drag to rotate, wheel or pinch to zoom. Orange markers in the scene start a building project.
const A3D={el:null,r:null,scene:null,cam:null,root:null,sig:'',anchors:[],t0:0,yaw:.75,pitch:.62,dist:0,tdist:0,drag:null,auto:true,anim:[],loading:false};
function a3dLoad(cb){if(window.THREE)return cb();if(A3D.loading){A3D.cbs.push(cb);return;}A3D.loading=true;A3D.cbs=[cb];
  const s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
  s.onload=()=>{A3D.cbs.forEach(f=>f());A3D.cbs=[];};s.onerror=()=>{const el=document.getElementById('a3d');if(el)el.innerHTML='<div class="empty"><p class="mut">The 3D view could not be loaded.</p></div>';};document.head.appendChild(s);}
function arena3dMount(){const el=document.getElementById('a3d');if(!el)return;a3dLoad(()=>{a3dAttach(el);});}
function a3dSig(){const t=G.teams[G.user],F=fac(t);return [t.id,t.cap,F.VIP,F.CAT,F.SCR,F.proj?F.proj.k:'',Math.round(attendance()/50),t.c1,G.fin.bal>=0].join('|');}
function a3dAttach(el){const T=THREE;
  if(!A3D.r){A3D.r=new T.WebGLRenderer({antialias:true,alpha:false});A3D.r.setPixelRatio(Math.min(2,window.devicePixelRatio||1));A3D.r.shadowMap.enabled=true;
    A3D.cam=new T.PerspectiveCamera(42,1,.5,800);A3D.scene=new T.Scene();a3dEvents(A3D.r.domElement);requestAnimationFrame(a3dLoop);}
  A3D.el=el;el.querySelector('.a3d-c').appendChild(A3D.r.domElement);a3dSize();
  const sig=a3dSig();if(sig!==A3D.sig){A3D.sig=sig;a3dBuild(A3D);}a3dHot();}
function a3dSize(){const el=A3D.el;if(!el)return;const w=el.clientWidth||600,h=el.clientHeight||380;A3D.r.setSize(w,h,false);A3D.r.domElement.style.width='100%';A3D.r.domElement.style.height='100%';A3D.cam.aspect=w/h;A3D.cam.updateProjectionMatrix();}
window.addEventListener('resize',()=>{if(A3D.r&&A3D.el&&A3D.el.isConnected)a3dSize();});

// geometry of the bowl: rows of seats around a 28 x 15 m court, a lower tier and (for big arenas) an upper tier
function a3dBowl(cap){const rows=[];let seats=0,d=2.2,h=.4,tier=0,n=0;
  while(seats<cap&&rows.length<60){if(tier===0&&n>=16){tier=1;d+=1.6;h+=3.4;n=0;}
    const L=28+2*d,W=15+2*d,per=2*(L+W),s=Math.floor(per/.52);rows.push({d,h,L,W,s,tier});seats+=s;d+=.85;h+=.46;n++;}
  return rows;}
function a3dBuild(V,spec){V=V||A3D;const T=THREE,S=V.scene,t=spec?spec.t:G.teams[G.user],F=spec?spec.F:fac(t);
  if(V.root)S.remove(V.root);const R=new T.Group();V.root=R;S.add(R);V.anim=[];V.anchors=[];
  S.background=new T.Color(0x14171c);S.fog=new T.Fog(0x14171c,120,320);
  S.children.filter(c=>c.isLight).forEach(c=>S.remove(c));
  S.add(new T.HemisphereLight(0xdfe8ff,0x2a2018,.75));const sun=new T.DirectionalLight(0xffffff,.8);sun.position.set(30,60,25);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);
  Object.assign(sun.shadow.camera,{left:-60,right:60,top:60,bottom:-60});S.add(sun);
  const c1=new T.Color(t.c1||'#1f3b73'),c2=new T.Color(t.c2&&t.c2.toLowerCase()!==String(t.c1).toLowerCase()?t.c2:'#ffffff');
  const M=(c,o={})=>new T.MeshStandardMaterial(Object.assign({color:c,roughness:.8,metalness:.05},o));
  // ground and court
  const ground=new T.Mesh(new T.PlaneGeometry(400,400),M(0x22262d));ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;R.add(ground);
  const cv=document.createElement('canvas');cv.width=1024;cv.height=550;const g=cv.getContext('2d');
  g.fillStyle='#c98d4e';g.fillRect(0,0,1024,550);for(let i=0;i<40;i++){g.fillStyle=i%2?'rgba(120,70,30,.08)':'rgba(255,230,190,.07)';g.fillRect(0,i*14,1024,14);}
  g.strokeStyle='#fff';g.lineWidth=5;const X=x=>x/28*1024,Y=y=>y/15*550;g.strokeRect(X(.5),Y(.5),X(27),Y(14));g.beginPath();g.moveTo(512,Y(.5));g.lineTo(512,Y(14.5));g.stroke();
  g.beginPath();g.arc(512,275,Y(1.8),0,7);g.stroke();g.fillStyle=t.c1||'#1f3b73';g.globalAlpha=.85;g.beginPath();g.arc(512,275,Y(1.8)-3,0,7);g.fill();g.globalAlpha=1;
  g.fillStyle=String(t.c1).toLowerCase()==='#ffffff'?'#222':'#fff';g.font='900 52px Arial Narrow, Arial';g.textAlign='center';g.textBaseline='middle';g.fillText(t.short,512,277);
  for(const s of [1,-1]){const bx=s>0?X(.5):X(27.5);g.fillStyle=t.c1||'#1f3b73';g.globalAlpha=.4;g.fillRect(s>0?bx:bx-X(5.8),Y(5.05),X(5.8),Y(4.9));g.globalAlpha=1;g.strokeRect(s>0?bx:bx-X(5.8),Y(5.05),X(5.8),Y(4.9));
    g.beginPath();g.arc(s>0?X(1.575):X(26.425),275,Y(6.75),s>0?-Math.PI/2+.2:Math.PI/2+.2,s>0?Math.PI/2-.2:-Math.PI/2-.2+Math.PI*2*0);g.stroke();}
  const court=new T.Mesh(new T.PlaneGeometry(30,17),[M(0x9a6a3a)][0]);court.rotation.x=-Math.PI/2;court.position.y=.02;court.receiveShadow=true;R.add(court);
  const floor=new T.Mesh(new T.PlaneGeometry(28,15),new T.MeshStandardMaterial({map:new T.CanvasTexture(cv),roughness:.45}));floor.rotation.x=-Math.PI/2;floor.position.y=.04;floor.receiveShadow=true;R.add(floor);
  for(const s of [1,-1]){const gm=M(0x2f3338);const pole=new T.Mesh(new T.BoxGeometry(.3,3.7,.3),gm);pole.position.set(s*15.4,1.85,0);pole.castShadow=true;R.add(pole);
    const arm=new T.Mesh(new T.BoxGeometry(2.6,.2,.2),gm);arm.position.set(s*14.1,3.55,0);R.add(arm);
    const bb=new T.Mesh(new T.BoxGeometry(.06,1.05,1.8),new T.MeshStandardMaterial({color:0xffffff,transparent:true,opacity:.7,roughness:.1}));bb.position.set(s*12.8,3.45,0);R.add(bb);
    const sq=new T.Mesh(new T.BoxGeometry(.07,.45,.59),M(0xd03030));sq.position.set(s*12.8,3.25,0);R.add(sq);
    const rim=new T.Mesh(new T.TorusGeometry(.23,.025,8,20),M(0xff5500));rim.rotation.x=Math.PI/2;rim.position.set(s*12.5,3.05,0);R.add(rim);}
  // stands and fans
  const rows=a3dBowl(t.cap),seatM=M(c1.clone().multiplyScalar(.75)),stepM=M(0x3a3f48),fan=[];
  for(const r of rows){for(const [w,dep,x,z] of [[r.L,.85,0,r.W/2+.42],[r.L,.85,0,-r.W/2-.42],[.85,r.W+1.7,r.L/2+.42,0],[.85,r.W+1.7,-r.L/2-.42,0]]){
      const b=new T.Mesh(new T.BoxGeometry(w,r.h,dep),stepM);b.position.set(x,r.h/2,z);b.castShadow=b.receiveShadow=true;R.add(b);
      const sb=new T.Mesh(new T.BoxGeometry(w,.12,dep*.55),seatM);sb.position.set(x,r.h+.06,z+(dep<w?0:0));R.add(sb);}
    fan.push(r);}
  const top=rows[rows.length-1],topH=top.h,topD=top.d;
  // outer wall
  const wallM=M(0x2d323a);for(const [w,dep,x,z] of [[top.L+4,1,0,top.W/2+1.4],[top.L+4,1,0,-top.W/2-1.4],[1,top.W+3.8,top.L/2+1.4,0],[1,top.W+3.8,-top.L/2-1.4,0]]){const b=new T.Mesh(new T.BoxGeometry(w,topH+1.4,dep),wallM);b.position.set(x,(topH+1.4)/2,z);b.castShadow=true;R.add(b);}
  const att=Math.min(t.cap,spec?spec.att:attendance()),fill=att/Math.max(1,t.cap),total=rows.reduce((a,r)=>a+r.s,0),N=Math.min(9000,Math.round(total*fill*.5));
  if(N>0){const geo=new T.BoxGeometry(.32,.55,.28),im=new T.InstancedMesh(geo,new T.MeshStandardMaterial({roughness:.9}),N),m4=new T.Matrix4(),col=new T.Color();let k=0;
    const pal=[c1,c2,new T.Color(0x2b2b2b),new T.Color(0xd9d9d9),new T.Color(0x3d5a80),new T.Color(0x9b2226)];
    while(k<N){const r=rows[Math.floor(Math.random()*rows.length)],side=Math.floor(Math.random()*4),u=Math.random()-.5;let x,z;
      if(side<2){x=u*(r.L-.6);z=(side?1:-1)*(r.W/2+.42);}else{z=u*(r.W+1.2);x=(side===2?1:-1)*(r.L/2+.42);}
      m4.makeTranslation(x,r.h+.4,z);im.setMatrixAt(k,m4);col.copy(pal[Math.random()<.55?(Math.random()<.6?0:1):2+Math.floor(Math.random()*4)]);im.setColorAt(k,col);k++;}
    im.instanceMatrix.needsUpdate=true;if(im.instanceColor)im.instanceColor.needsUpdate=true;R.add(im);V.anim.push(tt=>{im.position.y=Math.sin(tt*6)*.03*fill;});}
  // VIP boxes: glass lodges along both long sides above the lower tier
  const lower=rows.filter(r=>r.tier===0),lt=lower[lower.length-1],vipY=lt.h+1.2,vipZ=lt.W/2+1.6;
  const vipN=F.VIP*4;for(let i=0;i<vipN;i++)for(const s of [1,-1]){const x=(i-(vipN-1)/2)*(lt.L/(vipN+1));
    const v=new T.Mesh(new T.BoxGeometry(lt.L/(vipN+1)-.3,1.6,1.6),new T.MeshStandardMaterial({color:0x9fd8ff,transparent:true,opacity:.55,emissive:0xffd28a,emissiveIntensity:.35,roughness:.1,metalness:.3}));
    v.position.set(x,vipY,s*vipZ);R.add(v);const fr=new T.Mesh(new T.BoxGeometry(lt.L/(vipN+1)-.2,.12,1.7),M(c1));fr.position.set(x,vipY+.86,s*vipZ);R.add(fr);}
  V.anchors.push({k:'VIP',p:new T.Vector3(0,vipY+1.4,vipZ),label:'VIP'});
  // catering kiosks on the concourse behind the stands
  const kio=(x,z,rot)=>{const k=new T.Group();const b=new T.Mesh(new T.BoxGeometry(3,2.2,2),M(0xf1e6d0));b.position.y=1.1;b.castShadow=true;k.add(b);
    const aw=new T.Mesh(new T.BoxGeometry(3.4,.18,2.6),M(c1));aw.position.set(0,2.35,.3);k.add(aw);const sign=new T.Mesh(new T.BoxGeometry(2.6,.5,.08),new T.MeshStandardMaterial({color:0xffc94d,emissive:0xffa000,emissiveIntensity:.6}));sign.position.set(0,2.8,1.05);k.add(sign);
    k.position.set(x,0,z);k.rotation.y=rot;R.add(k);return k;};
  const cz=top.W/2+4.6,cx=top.L/2+4.6,spots=[[-top.L/4,cz,0],[top.L/4,-cz,Math.PI],[cx,top.W/4,Math.PI/2],[-cx,-top.W/4,-Math.PI/2],[top.L/4,cz,0],[-top.L/4,-cz,Math.PI]];
  for(let i=0;i<F.CAT*2;i++)kio(...spots[i]);
  V.anchors.push({k:'CAT',p:new T.Vector3(-top.L/4,3.5,cz),label:'Catering'});
  // video cube over centre court, LED ribbon on the fascia at level 2
  const cubeY=Math.max(10,Math.min(topH*.75+6,24));
  if(F.SCR>=1){const sc=document.createElement('canvas');sc.width=512;sc.height=320;const q=sc.getContext('2d');q.fillStyle='#05070a';q.fillRect(0,0,512,320);q.fillStyle=t.c1||'#1f3b73';q.fillRect(0,0,512,70);
      q.fillStyle='#fff';q.font='900 54px Arial Narrow, Arial';q.textAlign='center';q.fillText(t.short,256,54);q.fillStyle='#ffb300';q.font='900 110px Arial Narrow, Arial';q.fillText('0 : 0',256,200);q.fillStyle='#9fd8ff';q.font='700 34px Arial';q.fillText((t.arena||'').slice(0,22),256,280);
      const tx=new T.CanvasTexture(sc),sm=new T.MeshStandardMaterial({map:tx,emissive:0xffffff,emissiveMap:tx,emissiveIntensity:.9}),cube=new T.Group();
      const cs=clamp(top.L/9,5,11);const box=new T.Mesh(new T.BoxGeometry(cs,cs*.64,cs),[sm,sm,M(0x111111),M(0x111111),sm,sm]);cube.add(box);for(const x of [-cs*.4,cs*.4])for(const z of [-cs*.4,cs*.4]){const c=new T.Mesh(new T.CylinderGeometry(.04,.04,40),M(0x777777));c.position.set(x,20+cs*.32,z);cube.add(c);}
      cube.position.y=cubeY;R.add(cube);V.anim.push(tt=>{cube.rotation.y=tt*.15;});}
  if(F.SCR>=2){const lc=document.createElement('canvas');lc.width=512;lc.height=32;const q=lc.getContext('2d');q.fillStyle='#000';q.fillRect(0,0,512,32);q.font='900 24px Arial';q.fillStyle='#ffb300';q.fillText(`${t.name.toUpperCase()}  •  ${t.short}  •  DEFENSE!  •  `,4,24);
      const tx=new T.CanvasTexture(lc);tx.wrapS=T.RepeatWrapping;tx.repeat.set(4,1);const lm=new T.MeshBasicMaterial({map:tx});const f0=lower[0];
      for(const [w,x,z,ry] of [[f0.L,0,f0.W/2,0],[f0.L,0,-f0.W/2,Math.PI],[f0.W,f0.L/2,0,Math.PI/2],[f0.W,-f0.L/2,0,-Math.PI/2]]){const b=new T.Mesh(new T.PlaneGeometry(w,.5),lm);b.position.set(x*.995,.7,z*.995);b.rotation.y=ry+Math.PI;R.add(b);}
      V.anim.push(tt=>{tx.offset.x=-tt*.08;});}
  V.anchors.push({k:'SCR',p:new T.Vector3(0,cubeY+2.6,0),label:'Video cube'});
  V.anchors.push({k:'SEAT',p:new T.Vector3(top.L/2+1.4,topH+1.8,0),label:'Seats'});
  // construction site for the running project: orange ghost, scaffolding and a crane
  const P=F.proj;if(P){const gm=new T.MeshBasicMaterial({color:0xff6b00,wireframe:true,transparent:true,opacity:.7});let ghost;
    if(P.k==='SEAT'){const rr=a3dBowl(t.cap+P.add).slice(rows.length);ghost=new T.Group();for(const r of rr)for(const [w,dep,x,z] of [[r.L,.85,0,r.W/2+.42],[r.L,.85,0,-r.W/2-.42],[.85,r.W+1.7,r.L/2+.42,0],[.85,r.W+1.7,-r.L/2-.42,0]]){const b=new T.Mesh(new T.BoxGeometry(w,r.h,dep),gm);b.position.set(x,r.h/2,z);ghost.add(b);}}
    else if(P.k==='VIP'){ghost=new T.Mesh(new T.BoxGeometry(lt.L*.8,1.6,1.6),gm);ghost.position.set(0,vipY,vipZ);}
    else if(P.k==='CAT'){ghost=new T.Mesh(new T.BoxGeometry(3,2.4,2),gm);const s=spots[Math.min(5,F.CAT*2)];ghost.position.set(s[0],1.2,s[1]);}
    else{ghost=new T.Mesh(new T.BoxGeometry(5,3.2,5),gm);ghost.position.y=cubeY;}
    R.add(ghost);V.anim.push(tt=>{gm.opacity=.35+.35*Math.abs(Math.sin(tt*2.5));});
    const cr=new T.Group(),yel=M(0xf2b705,{roughness:.5});const mast=new T.Mesh(new T.BoxGeometry(.8,topH+14,.8),yel);mast.position.y=(topH+14)/2;cr.add(mast);
    const jib=new T.Group();const boom=new T.Mesh(new T.BoxGeometry(22,.6,.6),yel);boom.position.x=7;jib.add(boom);const cw=new T.Mesh(new T.BoxGeometry(2,1.4,1.2),M(0x555555));cw.position.x=-3.5;jib.add(cw);
    const line=new T.Mesh(new T.CylinderGeometry(.03,.03,8),M(0x222222));line.position.set(14,-4,0);jib.add(line);const hook=new T.Mesh(new T.BoxGeometry(1.2,.8,1.2),M(0x8d99ae));hook.position.set(14,-8.2,0);jib.add(hook);
    jib.position.y=topH+14;cr.add(jib);cr.position.set(top.L/2+7,0,top.W/2+7);R.add(cr);V.anim.push(tt=>{jib.rotation.y=Math.sin(tt*.35)*1.2+2.4;});}
  // light towers and camera framing
  for(const [x,z] of [[1,1],[1,-1],[-1,1],[-1,-1]]){const l=new T.PointLight(0xfff1d6,.35,90);l.position.set(x*10,cubeY+8,z*6);R.add(l);}
  V.tdist=V.dist=Math.max(48,topD*2.6+30);
}
function a3dHot(){const el=A3D.el;if(!el)return;const box=el.querySelector('.a3d-h');if(!box)return;const t=G.teams[G.user],F=fac(t),offers=arenaOffers(t),P=F.proj;
  box.innerHTML=A3D.anchors.map((a,i)=>{const o=offers.find(x=>x.k===a.k),lv=a.k==='SEAT'?null:F[a.k],busy=P&&P.k===a.k;
    const txt=busy?`${a.label}: building`:o?`+ ${a.label} · ${eur(o.cost)}`:`${a.label}: max`;
    return `<button class="a3d-b${busy?' busy':o&&!P&&G.fin.bal>=o.cost?' ok':''}" data-i="${i}" ${o&&!P&&!busy?`data-act="arenaask:${a.k}"`:'disabled'} title="${esc(o?o.name+' – '+o.fx:a.label)}">${txt}${lv!=null?` <small>${lv}/${FACMAX[a.k]}</small>`:''}</button>`;}).join('');}
function a3dEvents(cv){const P=e=>e.touches?{x:e.touches[0].clientX,y:e.touches[0].clientY}:{x:e.clientX,y:e.clientY};
  const down=e=>{A3D.drag=P(e);A3D.auto=false;if(e.touches&&e.touches.length===2)A3D.pinch=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);};
  const move=e=>{if(!A3D.drag)return;if(e.touches&&e.touches.length===2&&A3D.pinch){const d=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);A3D.tdist=clamp(A3D.tdist*A3D.pinch/d,25,260);A3D.pinch=d;e.preventDefault();return;}
    const p=P(e);A3D.yaw-=(p.x-A3D.drag.x)*.006;A3D.pitch=clamp(A3D.pitch+(p.y-A3D.drag.y)*.004,.18,1.35);A3D.drag=p;if(e.cancelable)e.preventDefault();};
  const up=()=>{A3D.drag=null;A3D.pinch=null;};
  cv.addEventListener('mousedown',down);window.addEventListener('mousemove',move);window.addEventListener('mouseup',up);
  cv.addEventListener('touchstart',down,{passive:true});cv.addEventListener('touchmove',move,{passive:false});cv.addEventListener('touchend',up);
  cv.addEventListener('wheel',e=>{A3D.tdist=clamp(A3D.tdist*(e.deltaY>0?1.1:.9),25,260);e.preventDefault();},{passive:false});
  cv.addEventListener('dblclick',()=>{A3D.auto=true;});}
function a3dLoop(ms){requestAnimationFrame(a3dLoop);if(!A3D.r||!A3D.el||!A3D.el.isConnected)return;const tt=ms/1000;
  if(A3D.auto)A3D.yaw+=.0018;A3D.dist+=(A3D.tdist-A3D.dist)*.12;
  const c=A3D.cam,d=A3D.dist;c.position.set(Math.cos(A3D.yaw)*Math.cos(A3D.pitch)*d,Math.sin(A3D.pitch)*d,Math.sin(A3D.yaw)*Math.cos(A3D.pitch)*d);c.lookAt(0,2,0);
  for(const f of A3D.anim)f(tt);A3D.r.render(A3D.scene,c);
  const box=A3D.el.querySelector('.a3d-h');if(!box)return;const w=A3D.el.clientWidth,h=A3D.el.clientHeight;
  for(const b of box.children){const a=A3D.anchors[+b.dataset.i];if(!a)continue;const v=a.p.clone().project(c);const vis=v.z<1;b.style.display=vis?'':'none';
    b.style.transform=`translate(${clamp((v.x*.5+.5)*w,50,w-50)}px,${clamp((-v.y*.5+.5)*h,18,h-18)}px) translate(-50%,-50%)`;}}

/* ===================== Blurred arena behind the club chooser ===================== */
// The start screen shows the selected club's arena from courtside, slowly panning and blurred, like a broadcast backdrop.
const BG3D={r:null,scene:null,cam:null,root:null,anim:[],anchors:[],sig:'',el:null,yaw:0};
function csBgMount(){const el=document.getElementById('csBg');if(!el)return;a3dLoad(()=>{const T=THREE;
  if(!BG3D.r){BG3D.r=new T.WebGLRenderer({antialias:false,alpha:false,powerPreference:'low-power'});BG3D.r.setPixelRatio(.6);BG3D.cam=new T.PerspectiveCamera(58,1,.5,900);BG3D.scene=new T.Scene();requestAnimationFrame(csBgLoop);}
  BG3D.el=el;el.appendChild(BG3D.r.domElement);csBgSize();
  const c=(UI.cc||[]).find(x=>x.short===UI.csSel);if(!c)return;const sig=c.short;if(sig===BG3D.sig)return;BG3D.sig=sig;
  const cap=Math.max(2500,c.cap||3000),t={short:c.short,name:c.name,c1:c.c1,c2:c.c2,cap,arena:c.arena};
  a3dBuild(BG3D,{t,F:{VIP:cap>6000?2:1,CAT:2,SCR:cap>4000?2:1,proj:null},att:cap*.92});
  // a ring of floodlights above the court that blurs into bokeh
  const R=BG3D.root,rows=a3dBowl(cap),top=rows[rows.length-1],y=Math.max(14,top.h+8),lm=new T.MeshBasicMaterial({color:0xfff4d8});
  for(let k=0;k<28;k++){const a=k/28*Math.PI*2,m=new T.Mesh(new T.SphereGeometry(.7,8,8),lm);m.position.set(Math.cos(a)*top.L*.42,y+Math.sin(k*1.7)*.6,Math.sin(a)*top.W*.42);R.add(m);}
  BG3D.scene.fog=new T.Fog(0x0d1118,40,top.L*1.6+60);BG3D.scene.background=new T.Color(0x0d1118);BG3D.top=top;});}
function csBgSize(){const el=BG3D.el;if(!el||!BG3D.r)return;const w=el.clientWidth||1200,h=el.clientHeight||800;BG3D.r.setSize(w,h,false);BG3D.r.domElement.style.width='100%';BG3D.r.domElement.style.height='100%';BG3D.cam.aspect=w/h;BG3D.cam.updateProjectionMatrix();}
window.addEventListener('resize',()=>{if(BG3D.el&&BG3D.el.isConnected)csBgSize();});
let csBgLast=0;
function csBgLoop(ms){requestAnimationFrame(csBgLoop);if(!BG3D.r||!BG3D.el||!BG3D.el.isConnected||!BG3D.top)return;if(ms-csBgLast<40)return;csBgLast=ms;
  const tt=ms/1000,top=BG3D.top,c=BG3D.cam,a=tt*.035;c.position.set(Math.cos(a)*9,2.4+Math.sin(tt*.2)*.4,Math.sin(a)*7.6);c.lookAt(-Math.cos(a+.5)*top.L*.45,top.h*.35+2,-Math.sin(a+.5)*top.W*.45);
  for(const f of BG3D.anim)f(tt);BG3D.r.render(BG3D.scene,c);}
