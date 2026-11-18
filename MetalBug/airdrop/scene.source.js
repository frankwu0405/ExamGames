// Same CC0 Kenney/Quaternius props as the gate game; see ../gate/props/CREDITS.txt.
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import {clone as cloneModel} from 'three/addons/utils/SkeletonUtils.js';
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const parentOrigin=location.origin;
const send=message=>parent.postMessage({airdrop:message},parentOrigin);
let renderer;
// Some tablets and preview browsers cannot create a WebGL context. This CPU
// path still projects the actual glTF meshes, rather than drawing a pretend box.
class MeshCanvasRenderer{
 constructor(){this.domElement=document.createElement('canvas');this.ctx=this.domElement.getContext('2d');this.shadowMap={};this.textures=new WeakMap();this.software=true;}
 setPixelRatio(){}setClearColor(color){this.clear=new THREE.Color(color);}dispose(){}
 setSize(w,h){this.w=w;this.h=h;this.domElement.width=w;this.domElement.height=h;}
 texture(map){if(!map?.image)return null;if(this.textures.has(map))return this.textures.get(map);try{const c=document.createElement('canvas');c.width=map.image.width;c.height=map.image.height;const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(map.image,0,0);const data=x.getImageData(0,0,c.width,c.height);this.textures.set(map,data);return data;}catch{this.textures.set(map,null);return null;}}
 render(scene,camera){
  const ctx=this.ctx;ctx.fillStyle='#0b1424';ctx.fillRect(0,0,this.w,this.h);scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);
  const faces=[],sun=new THREE.Vector3(.4,.8,.6).normalize(),view=new THREE.Vector3(),p=new THREE.Vector3(),a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3(),normal=new THREE.Vector3();
  scene.traverseVisible(mesh=>{if(!mesh.isMesh||!mesh.geometry.attributes.position)return;const g=mesh.geometry,attr=g.attributes.position,uv=g.attributes.uv,idx=g.index,matrices=mesh.matrixWorld,screen=[],world=[];
   for(let i=0;i<attr.count;i++){mesh.getVertexPosition(i,p);p.applyMatrix4(matrices);world.push(p.clone());p.project(camera);screen.push([this.w*(p.x*.5+.5),this.h*(-p.y*.5+.5),p.z]);}
   const count=idx?idx.count:attr.count;
   for(let i=0;i<count;i+=3){const ia=idx?idx.getX(i):i,ib=idx?idx.getX(i+1):i+1,ic=idx?idx.getX(i+2):i+2,A=screen[ia],B=screen[ib],C=screen[ic];if(!A||!B||!C||[A,B,C].some(v=>v[2]>1||v[2]<-1))continue;
    if(Math.max(A[0],B[0],C[0])<0||Math.min(A[0],B[0],C[0])>this.w||Math.max(A[1],B[1],C[1])<0||Math.min(A[1],B[1],C[1])>this.h)continue;
    let material=mesh.material;if(Array.isArray(material)){const group=g.groups.find(x=>i>=x.start&&i<x.start+x.count);material=material[group?.materialIndex||0];}if(!material||material.opacity===0)continue;
    a.copy(world[ia]);b.copy(world[ib]);c.copy(world[ic]);normal.crossVectors(b.sub(a),c.sub(a)).normalize();view.subVectors(camera.position,a);if(material.side===THREE.FrontSide&&normal.dot(view)<0)continue;
    const color=material.color?.clone()||new THREE.Color(0x8096a0),tex=this.texture(material.map);
    const colors=g.attributes.color;if(colors)color.multiply(new THREE.Color((colors.getX(ia)+colors.getX(ib)+colors.getX(ic))/3,(colors.getY(ia)+colors.getY(ib)+colors.getY(ic))/3,(colors.getZ(ia)+colors.getZ(ib)+colors.getZ(ic))/3));
    if(tex&&uv){const u=(uv.getX(ia)+uv.getX(ib)+uv.getX(ic))/3,v=(uv.getY(ia)+uv.getY(ib)+uv.getY(ic))/3;const x=Math.max(0,Math.min(tex.width-1,Math.floor(u*tex.width))),y=Math.max(0,Math.min(tex.height-1,Math.floor((material.map.flipY?1-v:v)*tex.height))),offset=(y*tex.width+x)*4;color.multiply(new THREE.Color(tex.data[offset]/255,tex.data[offset+1]/255,tex.data[offset+2]/255));}
    const light=material.isMeshBasicMaterial?1:.58+.42*Math.max(0,normal.dot(sun));color.multiplyScalar(light);faces.push({A,B,C,z:(A[2]+B[2]+C[2])/3,fill:color.getStyle(),alpha:material.opacity??1});
   }
  });
  faces.sort((a,b)=>b.z-a.z);for(const f of faces){ctx.globalAlpha=f.alpha;ctx.fillStyle=f.fill;ctx.beginPath();ctx.moveTo(f.A[0],f.A[1]);ctx.lineTo(f.B[0],f.B[1]);ctx.lineTo(f.C[0],f.C[1]);ctx.closePath();ctx.fill();}ctx.globalAlpha=1;
 }
}
try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:false});}catch{renderer=new MeshCanvasRenderer();}
if(renderer){
renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.setClearColor(0x0b1424);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.2;document.body.prepend(renderer.domElement);
const scene=new THREE.Scene();scene.fog=new THREE.Fog(0x0b1424,12,30);
const camera=new THREE.PerspectiveCamera(38,1,.1,60);camera.position.set(5.7,4.3,7.5);camera.lookAt(0,.5,0);
scene.add(new THREE.HemisphereLight(0x9ed8ff,0x26303d,3));const sun=new THREE.DirectionalLight(0xffe8c0,4);sun.position.set(4,7,4);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-6;sun.shadow.camera.right=6;sun.shadow.camera.top=6;sun.shadow.camera.bottom=-6;scene.add(sun);
const rim=new THREE.DirectionalLight(0x5ffff0,3);rim.position.set(-4,3,-4);scene.add(rim);
const pad=new THREE.Mesh(new THREE.CylinderGeometry(4.6,4.8,.25,8),new THREE.MeshToonMaterial({color:0x263b50}));pad.position.y=-.15;pad.receiveShadow=true;scene.add(pad);
const ground=new THREE.Mesh(new THREE.PlaneGeometry(100,100),new THREE.MeshToonMaterial({color:0x101d2b}));ground.rotation.x=-Math.PI/2;ground.position.y=-.3;ground.receiveShadow=true;scene.add(ground);
const grid=new THREE.GridHelper(16,16,0x325263,0x1b3446);grid.position.y=-.285;scene.add(grid);
const ring=new THREE.Mesh(new THREE.TorusGeometry(2.75,.025,6,80),new THREE.MeshBasicMaterial({color:0x66ffe1}));ring.rotation.x=-Math.PI/2;ring.position.y=.012;scene.add(ring);
const world=new THREE.Group();scene.add(world);
const loader=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder),cache=new Map();
async function model(name,height=1){
 if(!cache.has(name))cache.set(name,loader.loadAsync('../gate/props/'+name+'.glb'));
 const gltf=await cache.get(name),root=cloneModel(gltf.scene);
 const box=new THREE.Box3().setFromObject(root),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3());
 const factor=height/Math.max(size.x,size.y,size.z,.01);root.scale.setScalar(factor);root.position.set(-center.x*factor,-box.min.y*factor,-center.z*factor);
 root.traverse(mesh=>{if(mesh.isMesh){mesh.castShadow=true;mesh.receiveShadow=true;const list=Array.isArray(mesh.material)?mesh.material:[mesh.material];mesh.material=list.map(mat=>new THREE.MeshToonMaterial({color:name==='crate'?(mesh.name.includes('lid')?0xf2bc48:0x438d99):mat.color,map:name==='crate'?null:mat.map,vertexColors:name!=='crate'&&!!mesh.geometry.attributes.color,transparent:mat.transparent,opacity:mat.opacity}));if(mesh.material.length===1)mesh.material=mesh.material[0];}});
 const group=new THREE.Group();group.add(root);return group;
}
const targets=[],labels=document.getElementById('labels');
let mode='menu',selected=10,progress=0,opened=false,landing=0,arrival=0,streak=0,celebration=0,lastTime=performance.now(),drag=null,yaw=0,wantedYaw=0;
const crates=[],bits=[],beams=[];let drone=null,central=null,chest=null;
function label(text,cls,group,action){const b=document.createElement('button');b.className=cls;b.textContent=text;b.onclick=action;labels.append(b);return {button:b,group};}
const tags=[];
function placeLabels(){const rect=renderer.domElement.getBoundingClientRect();for(const {button,group} of tags){const p=group.getWorldPosition(new THREE.Vector3());p.y+=1.35;p.project(camera);button.style.left=(p.x*.5+.5)*rect.width+'px';button.style.top=(-p.y*.5+.5)*rect.height+'px';}}
function setMode(data){mode=data.mode||mode;selected=data.size||selected;progress=data.progress??progress;opened=!!data.open;streak=data.streak||0;
 crates.forEach((g,i)=>{g.visible=mode==='menu';tags[i].button.hidden=mode!=='menu';});
 if(central)central.visible=mode!=='menu';if(chest)chest.visible=mode==='reward';
 if(central&&mode==='reward')central.visible=false;
 document.getElementById('drag').hidden=mode!=='menu';
 if(data.arrive){arrival=performance.now();landing=1;}
}
function particles(n=25,color=0x65ffe2){for(let i=0;i<n;i++){const mesh=new THREE.Mesh(new THREE.BoxGeometry(.065,.065,.065),new THREE.MeshBasicMaterial({color}));mesh.position.set((Math.random()-.5)*.7,1.05,(Math.random()-.5)*.5);scene.add(mesh);bits.push({mesh,v:new THREE.Vector3((Math.random()-.5)*3,Math.random()*3+.7,(Math.random()-.5)*3),life:1.4});}}
function impact(){const mat=new THREE.MeshBasicMaterial({color:0x65ffe2,transparent:true,opacity:.9});const mesh=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,4,6),mat);mesh.rotation.z=-Math.PI/4;mesh.position.set(1.3,2.3,0);scene.add(mesh);beams.push({mesh,life:.22});}
function celebrate(){celebration=performance.now();particles(42,0xffd23f);opened=true;}
addEventListener('message',e=>{if(e.source!==parent||e.origin!==parentOrigin||!e.data?.airdrop)return;const d=e.data.airdrop;if(d.type==='view')setMode(d);if(d.type==='snap')impact();if(d.type==='correct'){impact();particles(14);streak=d.streak||0;if(central)central.userData.bounce=performance.now();}if(d.type==='launch')celebrate();});
const ray=new THREE.Raycaster(),pointer=new THREE.Vector2();
renderer.domElement.onpointerdown=e=>{drag={x:e.clientX,start:e.clientX};renderer.domElement.setPointerCapture(e.pointerId);};
renderer.domElement.onpointermove=e=>{if(!drag)return;wantedYaw+=(e.clientX-drag.x)*.006;drag.x=e.clientX;};
renderer.domElement.onpointerup=e=>{if(!drag)return;const tapped=Math.abs(e.clientX-drag.start)<8;drag=null;if(tapped){if(mode==='menu'){const r=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(pointer,camera);const hits=ray.intersectObjects(crates,true);if(hits.length){let g=hits[0].object;while(g&&!g.userData.drop)g=g.parent;if(g)send({choose:g.userData.drop});}}else{particles(12);if(mode==='reward')celebrate();}}};renderer.domElement.onpointercancel=()=>drag=null;
function resize(){const w=innerWidth,h=innerHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.position.set(4.9,3.2,6.1);camera.lookAt(0,.8,0);camera.fov=w/h<1.3?47:40;camera.updateProjectionMatrix();placeLabels();}addEventListener('resize',resize);resize();
Promise.allSettled([
 model('crate',1.7).then(template=>{[10,30,60].forEach((size,i)=>{const g=template.clone(true);g.position.set((i-1)*2.2,.02,0);g.rotation.y=i===1?-.15:.2;g.scale.setScalar([.85,1.03,1.2][i]);g.userData.drop=size;world.add(g);crates.push(g);const tag=label(String(size),'drop',g,()=>send({choose:size}));tags.push(tag);});central=template.clone(true);central.visible=false;central.scale.setScalar(1.45);central.position.set(0,.02,0);world.add(central);}),
 model('speeder_a',1.4).then(g=>{drone=g;g.position.set(1.8,1.25,-.5);world.add(g);}),
 model('chest',1).then(g=>{chest=g;g.visible=false;world.add(g);}),
 model('generator',.7).then(g=>{g.position.set(-3.1,0,-1.4);world.add(g);}),
 model('barrel',.75).then(g=>{g.position.set(2.9,0,-1.5);world.add(g);})
]).then(results=>{for(const result of results)if(result.status==='rejected')console.warn('Airdrop model:',result.reason);const failed=results[0].status==='rejected';document.getElementById('loading').hidden=true;if(failed){document.getElementById('fallback').hidden=false;send({ready:false});}else{setMode({mode});send({ready:true});}resize();});
let raf;
function tick(now){raf=requestAnimationFrame(tick);if(document.hidden||renderer.software&&now-lastTime<65)return;const dt=Math.min(.08,(now-lastTime)/1000);lastTime=now;
 yaw+=(wantedYaw-yaw)*.08;world.rotation.y=yaw;
 if(drone){drone.position.y=1.25+(reduced?0:Math.sin(now*.0018)*.1);drone.rotation.y=-.4+Math.sin(now*.0006)*.08;if(celebration&&now-celebration<1800){const f=(now-celebration)/1800;drone.position.y+=Math.sin(f*Math.PI)*2.5;drone.rotation.y+=f*Math.PI*2;}}
 if(central){const bounce=central.userData.bounce||0;central.position.y=.02+(now-bounce<450&&!reduced?Math.sin((now-bounce)/450*Math.PI)*.22:0);if(landing){const f=Math.min(1,(now-arrival)/1100);central.position.y+=(1-f)*(1-f)*4.5;if(f===1){landing=0;particles(18,0xe3dbb1);}}central.rotation.y=.15+Math.sin(now*.0005)*.04;}
 if(chest&&chest.visible)chest.rotation.y=Math.sin(now*.0006)*.15;
 for(let i=bits.length-1;i>=0;i--){const p=bits[i];p.life-=dt;p.v.y-=dt*3;p.mesh.position.addScaledVector(p.v,dt);p.mesh.rotation.x+=dt*4;p.mesh.scale.setScalar(Math.max(0,p.life/1.4));if(p.life<=0){scene.remove(p.mesh);p.mesh.geometry.dispose();p.mesh.material.dispose();bits.splice(i,1);}}
 for(let i=beams.length-1;i>=0;i--){const b=beams[i];b.life-=dt;b.mesh.material.opacity=Math.max(0,b.life/.22);if(b.life<=0){scene.remove(b.mesh);b.mesh.geometry.dispose();b.mesh.material.dispose();beams.splice(i,1);}}
 ring.material.color.setHex(streak>=5?0xffd23f:0x66ffe1);ring.scale.setScalar(1+(reduced?0:Math.sin(now*.002)*.015));placeLabels();renderer.render(scene,camera);
}requestAnimationFrame(tick);
addEventListener('pagehide',()=>{cancelAnimationFrame(raf);renderer.dispose();});
}
