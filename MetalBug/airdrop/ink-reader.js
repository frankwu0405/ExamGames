/* One-letter ink capture. Recognition emits a target-independent prediction. */
(function(){
'use strict';
const directory=new URL('.',document.currentScript.src);
const pointLimit=1800;
function bounds(strokes){
 const points=strokes.flat();if(points.length<2)return null;
 let left=1,top=1,right=0,bottom=0,length=0;
 for(const stroke of strokes)for(let i=0;i<stroke.length;i++){
  const [x,y]=stroke[i];left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);
  if(i)length+=Math.hypot(x-stroke[i-1][0],y-stroke[i-1][1]);
 }
 return length<.015?null:{left,top,right,bottom};
}
function compact(strokes){
 let total=strokes.reduce((n,s)=>n+s.length,0),stride=Math.max(1,Math.ceil(total/pointLimit));
 return strokes.map(stroke=>stroke.filter((_,i)=>i===0||i===stroke.length-1||i%stride===0).map(([x,y])=>[Math.round(x*10000)/10000,Math.round(y*10000)/10000]));
}
const reader={state:'off',progress:0,worker:null,next:0,pending:new Map(),listeners:new Set(),busy:false,waiting:null};
const emit=()=>reader.listeners.forEach(fn=>fn(reader.state,reader.progress));
function storageGet(key){try{return localStorage.getItem(key);}catch{return null;}}
function storageSet(key,value){try{localStorage.setItem(key,value);}catch{}}
function finishPending(error){for(const job of reader.pending.values())job.reject(error);reader.pending.clear();reader.busy=false;if(reader.waiting)reader.waiting.reject(error);reader.waiting=null;}
function enable(force=false){
 if(force){reader.worker?.terminate();reader.worker=null;finishPending(new Error('Reader restarted'));}
 storageSet('gate-airdrop-ink-enabled','1');
 if(reader.worker)return;
 reader.state='loading';emit();
 try{
  const worker=new Worker(new URL('ink.worker.js?v=2',directory));reader.worker=worker;
  worker.onmessage=e=>{
   const data=e.data;
   if(data.type==='progress'){reader.progress=Math.round(data.progress||0);emit();}
   if(data.type==='ready'){reader.state='ready';reader.progress=100;emit();}
   if(data.type==='result'||data.type==='error'){
    if(data.id!==undefined){const job=reader.pending.get(data.id);reader.pending.delete(data.id);reader.busy=false;
     if(job){if(data.type==='result')job.resolve(data.prediction);else job.reject(new Error(data.message));}
     const next=reader.waiting;reader.waiting=null;if(next)send(next);
    }else if(data.type==='error'){reader.state='error';reader.worker?.terminate();reader.worker=null;finishPending(new Error(data.message));emit();}
   }
  };
  worker.onerror=()=>{reader.state='error';reader.worker?.terminate();reader.worker=null;finishPending(new Error('Reader unavailable'));emit();};
  worker.postMessage({type:'load'});
 }catch(error){reader.state='error';reader.worker=null;emit();}
}
function send(job){reader.busy=true;reader.pending.set(job.id,job);reader.worker.postMessage({type:'read',id:job.id,...job.image},[job.image.pixels]);}
function recognize(image){
 if(reader.state!=='ready')return Promise.reject(new Error('Reader not ready'));
 return new Promise((resolve,reject)=>{
  const job={id:++reader.next,image,resolve,reject};
  if(reader.busy){if(reader.waiting)reader.waiting.reject(new Error('Superseded'));reader.waiting=job;}else send(job);
 });
}
function subscribe(fn){reader.listeners.add(fn);fn(reader.state,reader.progress);return ()=>reader.listeners.delete(fn);}
function createPad(container,{key,ghost='',onChange=()=>{},onRead=()=>{},onState=()=>{},onActivity=()=>{}}){
 const wrap=document.createElement('div');wrap.className='air-inkpaper';
 const guide=document.createElement('span');guide.className='air-inkghost';guide.textContent=ghost;guide.setAttribute('aria-hidden','true');
 const canvas=document.createElement('canvas');canvas.className='air-inkcanvas';canvas.setAttribute('aria-label','Write one letter here');canvas.setAttribute('role','img');
 wrap.append(guide,canvas);container.append(wrap);
 const ctx=canvas.getContext('2d');let strokes=[],history=[],current=null,active=null,erasing=false,revision=0,timer=null,destroyed=false,lastPen=-Infinity;
 try{const saved=JSON.parse(storageGet('gate-airdrop-ink-draft')||'null');if(saved?.key===key&&Array.isArray(saved.strokes))strokes=saved.strokes.filter(s=>Array.isArray(s)&&s.every(p=>Array.isArray(p)&&p.length===2&&p.every(v=>Number.isFinite(v)&&v>=0&&v<=1)));}catch{}
 function saveDraft(){storageSet('gate-airdrop-ink-draft',JSON.stringify({key,strokes:compact(strokes)}));}
 function draw(){
  const rect=canvas.getBoundingClientRect(),scale=Math.min(devicePixelRatio||1,2);
  const width=Math.max(1,Math.round(rect.width*scale)),height=Math.max(1,Math.round(rect.height*scale));
  if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;}
  ctx.clearRect(0,0,width,height);ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle='#18243b';ctx.lineWidth=Math.max(2.6,rect.width*.014)*scale;
  for(const stroke of strokes){if(!stroke.length)continue;ctx.beginPath();ctx.moveTo(stroke[0][0]*width,stroke[0][1]*height);for(const [x,y]of stroke.slice(1))ctx.lineTo(x*width,y*height);if(stroke.length===1)ctx.lineTo(stroke[0][0]*width+.2,stroke[0][1]*height+.2);ctx.stroke();}
 }
 function changed(){revision++;clearTimeout(timer);draw();saveDraft();onChange(!!bounds(strokes));if(reader.state==='ready'&&bounds(strokes))timer=setTimeout(read,550);}
 function snapshot(){history.push(strokes.map(s=>s.map(p=>p.slice())));if(history.length>20)history.shift();}
 function locationFor(e){const r=canvas.getBoundingClientRect();return [Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)),Math.max(0,Math.min(1,(e.clientY-r.top)/r.height))];}
 function erase(point){strokes=strokes.filter(stroke=>!stroke.some(([x,y])=>Math.hypot((x-point[0])*canvas.clientWidth,(y-point[1])*canvas.clientHeight)<17));}
 canvas.onpointerdown=e=>{
  if(e.button&&e.button!==0)return;
  if(e.pointerType==='pen')lastPen=performance.now();
  if(e.pointerType==='touch'&&performance.now()-lastPen<500)return;
  if(active!==null)return;e.preventDefault();active=e.pointerId;clearTimeout(timer);snapshot();canvas.setPointerCapture?.(e.pointerId);
  const p=locationFor(e);if(erasing)erase(p);else{current=[p];strokes.push(current);}revision++;onActivity();onRead(null);draw();
 };
 canvas.onpointermove=e=>{if(active!==e.pointerId)return;e.preventDefault();const events=e.getCoalescedEvents?.()||[e];for(const event of events){const p=locationFor(event);if(erasing)erase(p);else if(current){const last=current.at(-1);if(Math.hypot((p[0]-last[0])*canvas.clientWidth,(p[1]-last[1])*canvas.clientHeight)>.6)current.push(p);}}revision++;draw();};
 const end=e=>{if(active!==e.pointerId)return;e.preventDefault();if(current&&e.type!=='pointercancel'){const p=locationFor(e),last=current.at(-1);if(Math.hypot((p[0]-last[0])*canvas.clientWidth,(p[1]-last[1])*canvas.clientHeight)>.6)current.push(p);}active=null;current=null;changed();};
 canvas.onpointerup=end;canvas.onpointercancel=end;
 function image(){
  const box=bounds(strokes);if(!box)return null;
  // Only actual ink is exported. Guides, trace letters and expected words
  // are deliberately excluded from the model's input image.
  const out=document.createElement('canvas');out.width=28;out.height=28;const c=out.getContext('2d');c.fillStyle='#000';c.fillRect(0,0,28,28);
  const sourceW=(box.right-box.left)*canvas.clientWidth,sourceH=(box.bottom-box.top)*canvas.clientHeight;
  let path=0;for(const stroke of strokes)for(let i=1;i<stroke.length;i++)path+=Math.hypot((stroke[i][0]-stroke[i-1][0])*canvas.clientWidth,(stroke[i][1]-stroke[i-1][1])*canvas.clientHeight);
  // Reject taps, tiny marks and dense scribbling before classification.
  if(sourceW/Math.max(1,sourceH)>3.2||Math.max(sourceW,sourceH)<18||path<22||strokes.length>12||path/Math.max(1,sourceW,sourceH)>12)return null;
  const width=Math.max(2,sourceW),height=Math.max(2,sourceH),factor=20/Math.max(width,height),x0=(28-sourceW*factor)/2,y0=(28-sourceH*factor)/2;
  c.strokeStyle='#fff';c.lineCap='round';c.lineJoin='round';c.lineWidth=Math.min(3,Math.max(1.4,canvas.clientWidth*.014*factor));
  for(const stroke of strokes){if(!stroke.length)continue;c.beginPath();stroke.forEach(([x,y],i)=>{const X=x0+(x-box.left)*canvas.clientWidth*factor,Y=y0+(y-box.top)*canvas.clientHeight*factor;if(i)c.lineTo(X,Y);else c.moveTo(X,Y);});if(stroke.length===1)c.lineTo(x0+(stroke[0][0]-box.left)*canvas.clientWidth*factor+.2,y0+(stroke[0][1]-box.top)*canvas.clientHeight*factor+.2);c.stroke();}
  const rgba=c.getImageData(0,0,28,28).data,pixels=new Float32Array(784);for(let i=0;i<784;i++)pixels[i]=rgba[i*4]/255;
  return {pixels:pixels.buffer,width:28,height:28};
 }
 async function read(){
  const data=image(),version=revision;if(destroyed||active!==null)return;if(!data){onRead(null);onState('unclear');return;}if(reader.state!=='ready'){onState(reader.state);return;}
  onState('reading');
  try{const prediction=await recognize(data);if(!destroyed&&version===revision&&active===null){onState('ready');onRead(prediction);}}
  catch(error){if(!destroyed&&version===revision){onRead(null);onState('error');}}
 }
 const unsubscribe=subscribe(state=>{if(destroyed)return;onState(state);if(state==='ready'&&bounds(strokes)){clearTimeout(timer);timer=setTimeout(read,150);}});
 const resize=new ResizeObserver(draw);resize.observe(wrap);draw();onChange(!!bounds(strokes));
 return {
  hasInk:()=>!!bounds(strokes),
  read,
  next(nextKey,text=''){key=nextKey;revision++;clearTimeout(timer);strokes=[];history=[];guide.textContent=text;onRead(null);draw();saveDraft();onChange(false);},
  undo(){if(!history.length)return;strokes=history.pop();changed();onRead(null);},
  eraser(){erasing=!erasing;wrap.classList.toggle('erasing',erasing);return erasing;},
  setGhost(text){guide.textContent=text;},
  clear(){snapshot();strokes=[];changed();onActivity();onRead(null);},
  finish(){destroyed=true;clearTimeout(timer);canvas.style.pointerEvents='none';try{localStorage.removeItem('gate-airdrop-ink-draft');}catch{}},
  destroy(){destroyed=true;clearTimeout(timer);resize.disconnect();unsubscribe();}
 };
}
window.AirdropInk={createPad,enable,subscribe,reader,bounds,compact,recognize};

})();
