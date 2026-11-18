const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(__dirname+'/ink-reader.js','utf8');new vm.Script(source);new vm.Script(fs.readFileSync(__dirname+'/ink.worker.js','utf8'));
class Element{
 constructor(tag){this.tag=tag;this.children=[];this.style={};this.clientWidth=400;this.clientHeight=200;this.classList={toggle(){}};}
 append(...children){this.children.push(...children);}setAttribute(){}setPointerCapture(){}
 getBoundingClientRect(){return {width:400,height:200,left:0,top:0};}
 getContext(){return new Proxy({getImageData(){return {data:new Uint8ClampedArray(640*160*4)};}},{get(t,k){return t[k]||(()=>{});}});}
}
const storage=new Map(),timers=new Map();let tid=0,worker;
class WorkerMock{constructor(){worker=this;this.sent=[];}postMessage(m){this.sent.push(m);}terminate(){}message(m){this.onmessage({data:m});}}
const sandbox={window:{},document:{currentScript:{src:'https://example.test/MetalBug/airdrop/ink-reader.js'},createElement:t=>new Element(t)},URL,localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},Worker:WorkerMock,ResizeObserver:class{observe(){}disconnect(){}},devicePixelRatio:2,performance:{now:()=>10000},setTimeout:(f)=>{timers.set(++tid,f);return tid;},clearTimeout:id=>timers.delete(id),Uint8ClampedArray};
vm.runInNewContext(source,sandbox);const A=sandbox.window.AirdropInk;
assert.equal(A.bounds([]),null);assert.equal(A.bounds([[[.5,.5],[.5,.5],[.5,.5]]]),null);
const host=new Element('div');let ink=false;const pad=A.createPad(host,{key:'student:run:question',onChange:v=>ink=v});const canvas=host.children[0].children[1];
function event(id,x,y){return {pointerId:id,pointerType:'touch',button:0,clientX:x,clientY:y,preventDefault(){}};}
canvas.onpointerdown(event(0,20,50));canvas.onpointermove(event(0,60,100));canvas.onpointermove(event(0,120,40));canvas.onpointerup(event(0,120,40));assert.ok(ink);assert.ok(pad.hasInk());
// Undo restores the complete previous stroke state; a blank pad cannot pass.
pad.undo();assert.equal(pad.hasInk(),false);
canvas.onpointerdown(event(0,20,50));canvas.onpointerdown(event(1,40,50));canvas.onpointermove(event(0,60,100));canvas.onpointermove(event(0,120,40));canvas.onpointerup(event(0,120,40));assert.ok(pad.hasInk());
const saved=JSON.parse(storage.get('gate-airdrop-ink-draft'));assert.equal(saved.strokes.length,1);assert.equal(saved.key,'student:run:question');
const second=new Element('div'),restored=A.createPad(second,{key:'student:run:question'});assert.ok(restored.hasInk());restored.destroy();
const third=new Element('div'),other=A.createPad(third,{key:'different-player'});assert.equal(other.hasInk(),false);other.destroy();
pad.finish();assert.equal(storage.has('gate-airdrop-ink-draft'),false);pad.destroy();
(async()=>{
 A.enable();assert.equal(worker.sent[0].type,'load');worker.message({type:'ready'});
 const image=()=>({pixels:new ArrayBuffer(4),width:1,height:1});
 const p1=A.recognize(image()),p2=A.recognize(image()).catch(e=>e.message),p3=A.recognize(image());
 assert.equal(worker.sent.length,2);assert.equal(await p2,'Superseded');
 worker.message({type:'result',id:1,prediction:{letter:'b'}});assert.equal((await p1).letter,'b');assert.equal(worker.sent.length,3);
 assert.deepEqual(Object.keys(worker.sent[2]).sort(),['height','id','pixels','type','width']);
 worker.message({type:'result',id:3,prediction:{letter:'c'}});assert.equal((await p3).letter,'c');
 const p4=A.recognize(image()).catch(e=>e.message),p5=A.recognize(image()).catch(e=>e.message);worker.onerror();assert.equal(await p4,'Reader unavailable');assert.equal(await p5,'Reader unavailable');assert.equal(A.reader.state,'error');
 A.enable();worker.message({type:'ready'});let results=[];const staleHost=new Element('div'),stale=A.createPad(staleHost,{key:'stale',onRead:p=>{if(p)results.push(p);}}),c=staleHost.children[0].children[1];
 c.onpointerdown(event(0,20,50));c.onpointermove(event(0,60,100));c.onpointermove(event(0,120,40));c.onpointerup(event(0,120,40));const inFlight=stale.read(),id=worker.sent.at(-1).id;stale.next('new-letter');worker.message({type:'result',id,prediction:{letter:'b'}});await inFlight;assert.equal(results.length,0);stale.destroy();
 console.log('PASS: real stroke capture, pointer ID zero, multi-touch guard, undo, question-scoped drafts, blank rejection, one active inference, newest queued inference, no target leakage, worker failure recovery.');
})().catch(e=>{console.error(e);process.exitCode=1;});
