// Actual ink rasterization → actual WASM classifier → real Airdrop DOM handlers.
const {JSDOM}=require('jsdom'),{createCanvas}=require('@napi-rs/canvas'),ort=require('onnxruntime-web/wasm'),fs=require('fs'),assert=require('node:assert/strict');
const path=require('path');const root=path.resolve(__dirname,'..');const strokes=JSON.parse(fs.readFileSync(path.join(__dirname,'letter-fixtures.json')));
(async()=>{
ort.env.wasm.numThreads=1;const modelFile=process.env.AIRDROP_LETTER_MODEL||path.join(__dirname,'.cache-letter-model.onnx');
if(!fs.existsSync(modelFile)){const response=await fetch('https://raw.githubusercontent.com/BryanDhaniel/Handwriting-Recognition-with-EMNIST-and-CNN/6f3456cad42cd56c987d367fa225285619c92e47/model.onnx');if(!response.ok)throw Error('Model download failed');fs.writeFileSync(modelFile,Buffer.from(await response.arrayBuffer()));}
const session=await ort.InferenceSession.create(fs.readFileSync(modelFile),{executionProviders:['wasm']});
const dom=new JSDOM('<head></head><body><div id="dash" class="air"><iframe></iframe><div class="dp"></div></div></body>',{url:'https://example.test/MetalBug/',runScripts:'outside-only'}),w=dom.window;
const backs=new WeakMap();w.HTMLCanvasElement.prototype.getContext=function(){let back=backs.get(this);if(!back){back=createCanvas(this.width,this.height);backs.set(this,back);}if(back.width!==this.width)back.width=this.width;if(back.height!==this.height)back.height=this.height;return back.getContext('2d');};w.HTMLCanvasElement.prototype.getBoundingClientRect=()=>({left:0,top:0,width:220,height:220});
Object.defineProperty(w.HTMLCanvasElement.prototype,'clientWidth',{get:()=>220});Object.defineProperty(w.HTMLCanvasElement.prototype,'clientHeight',{get:()=>220});
w.ResizeObserver=class{observe(){}disconnect(){}};w.S={parts:0,muted:false};w.Snd={themeWant:false,theme(){}};w.student={id:'test'};w.save=()=>{};w.sfx=()=>{};w.partsEl=w.document.createElement('div');w.partsEl.append(w.document.createTextNode('0'));w.speechSynthesis={cancel(){},speak(){}};w.SpeechSynthesisUtterance=class{};
let posted=[];w.Worker=class{postMessage(m){posted.push(m);if(m.type==='load'){queueMicrotask(()=>this.onmessage({data:{type:'ready'}}));return;}queueMicrotask(async()=>{const out=await session.run({[session.inputNames[0]]:new ort.Tensor('float32',new Float32Array(m.pixels),[1,28,28,1])});this.onmessage({data:{type:'result',id:m.id,prediction:w.AirdropLetters.rank(out[session.outputNames[0]].data)}});});}terminate(){}};
for(const file of ['airdrop/word-clues.js','airdrop/letter-core.js','airdrop/ink-reader.js','airdrop.js']){Object.defineProperty(w.document,'currentScript',{configurable:true,get:()=>({src:'https://example.test/MetalBug/'+file})});w.eval(fs.readFileSync(path.join(root,file),'utf8'));}
const d=w.document.querySelector('#dash'),dp=d.querySelector('.dp'),host={d,dp,fr:d.querySelector('iframe'),head:()=>w.document.createElement('div'),talk(){},setBack(){},close(){}};let cleanup=w.mountAirdrop(host);
dp.querySelectorAll('.air-size')[2].click();dp.querySelector('.air-go').click();await new Promise(r=>setTimeout(r,15));
const run=w.S.airdrop.run;let task=run.queue[0];task.w='moving';task.letters=[];cleanup();cleanup=w.mountAirdrop(host);dp.querySelector('.air-resume').click();await new Promise(r=>setTimeout(r,10));
function event(x,y){return {pointerId:1,pointerType:'mouse',button:0,clientX:x*220,clientY:y*220,preventDefault(){}};}
function draw(paths){const canvas=dp.querySelector('canvas');for(const path of paths){canvas.onpointerdown(event(...path[0]));for(let i=1;i<path.length;i++){const a=path[i-1],b=path[i];for(let j=1;j<=10;j++)canvas.onpointermove(event(a[0]+(b[0]-a[0])*j/10,a[1]+(b[1]-a[1])*j/10));}canvas.onpointerup(event(...path.at(-1)));}}
async function read(){dp.querySelector('.air-stamp').click();await new Promise(r=>setTimeout(r,35));}
const q=run.cursor;
// Blank, dot and the wrong letter cannot advance the word or its first slot.
await read();assert.equal(run.cursor,q);assert.equal(task.letters.length,0);
draw([[[.5,.5],[.501,.501]]]);await new Promise(r=>setTimeout(r,1100));assert.equal(task.letters.length,0);assert.equal(run.incorrect,1);
draw([Array.from({length:60},(_,i)=>[i%2?.85:.15,.15+i*.011])]);await read();await new Promise(r=>setTimeout(r,500));assert.equal(task.letters.length,0);assert.equal(run.incorrect,2);
w.S.airdrop.combo.count=2;draw(strokes.b);await read();assert.equal(run.cursor,q);assert.equal(task.letters.length,0);assert.match(dp.querySelector('.air-inkpreview').textContent,/I read B/);await read();await new Promise(r=>setTimeout(r,500));assert.equal(task.assisted,true);assert.equal(run.incorrect,3);assert.equal(w.S.airdrop.combo.count,0);assert.equal(JSON.parse(w.localStorage.getItem('gate-airdrop-ink-draft')).strokes.length,0);
// True letter-by-letter classification: a partial word never counts as success.
for(const [i,ch]of [...'moving'].entries()){draw(strokes[ch]);if(i===0)await new Promise(r=>setTimeout(r,650));else await read();assert.equal(task.letters.length,i+1);if(i<5)assert.equal(run.cursor,q);}
assert.equal(run.cursor,q+1);assert.equal(run.verified.length,0);assert.equal(w.S.parts,0);assert.ok(run.queue.slice(run.cursor).some(t=>t.w==='moving'));assert.ok(posted.filter(m=>m.type==='read').every(m=>Object.keys(m).sort().join(',')==='height,id,pixels,type,width'));
cleanup();task=run.queue[run.cursor];task.w='begged';task.kind='ink_context';task.letters=[];cleanup=w.mountAirdrop(host);dp.querySelector('.air-resume').click();await new Promise(r=>setTimeout(r,10));
draw([[[.25,.85],[.25,.15]]]);await read();draw([strokes.b[0].slice(1),strokes.b[1]]);await read();assert.equal(task.letters.length,1);assert.equal(run.incorrect,3);for(const ch of 'eg'){draw(strokes[ch]);await read();}assert.equal(task.letters.length,3);const savedCursor=run.cursor;cleanup();cleanup=w.mountAirdrop(host);dp.querySelector('.air-resume').click();assert.equal(dp.querySelectorAll('.air-wordslots .done').length,3);assert.equal(run.cursor,savedCursor);
for(const ch of 'ged'){draw(strokes[ch]);await read();}assert.equal(task.letters.length,6);assert.equal(run.cursor,savedCursor+1);assert.equal(run.verified.includes('begged'),true);assert.equal(w.S.airdrop.combo.count,1);cleanup();
for(const word of ['owner','power']){
 task=run.queue[run.cursor];task.w=word;task.kind='ink';task.letters=[];cleanup=w.mountAirdrop(host);dp.querySelector('.air-resume').click();for(const ch of word){draw(strokes[ch]);await read();}assert.ok(run.verified.includes(word));cleanup();
}
assert.equal(w.S.parts,2);assert.equal(w.S.airdrop.combo.count,0);
// One-letter hints charge exactly once, persist across refresh, and never pass ink.
task=run.queue[run.cursor];task.w='moving';task.kind='ink';task.letters=[];cleanup=w.mountAirdrop(host);dp.querySelector('.air-resume').click();
const beforeHint=run.incorrect;w.S.airdrop.combo.count=2;
draw(strokes.b);await read(); // A pending rejection must not double-charge the hint.
let hint=dp.querySelector('[aria-label="Hint one letter (+1 error)"]');hint.click();
assert.equal(run.incorrect,beforeHint+1);assert.equal(w.S.airdrop.combo.count,0);assert.equal(task.letters.length,0);assert.equal(dp.querySelector('.air-modelword').textContent,'');assert.equal(dp.querySelector('.air-inkghost').textContent,'m');assert.equal(dp.querySelector('.air-wordslots .current').textContent,'m');
hint.click();assert.equal(run.incorrect,beforeHint+1);await new Promise(r=>setTimeout(r,500));assert.equal(run.incorrect,beforeHint+1);
cleanup();cleanup=w.mountAirdrop(host);dp.querySelector('.air-resume').click();hint=dp.querySelector('[aria-label="Hint one letter (+1 error)"]');assert.equal(hint.disabled,true);assert.equal(dp.querySelector('.air-inkghost').textContent,'m');hint.click();assert.equal(run.incorrect,beforeHint+1);
draw(strokes.m);await read();assert.equal(task.letters.length,1);assert.equal(dp.querySelector('.air-inkghost').textContent,'');assert.equal(hint.disabled,false);hint.click();assert.equal(run.incorrect,beforeHint+2);assert.equal(dp.querySelector('.air-inkghost').textContent,'o');
for(const ch of 'oving'){draw(strokes[ch]);await read();}assert.equal(w.S.parts,2);assert.equal(w.S.airdrop.combo.count,0);assert.equal(run.verified.includes('moving'),false);cleanup();
cleanup=w.mountAirdrop(host);dp.querySelector('.air-resume').click();w.S.airdrop.combo.count=2;const beforeSkip=run.cursor;dp.querySelector('[aria-label="Practise this word later"]').click();assert.equal(w.S.airdrop.combo.count,0);assert.equal(run.cursor,beforeSkip+1);assert.equal(w.S.parts,2);cleanup();
// Scrambled spelling uses exact tile identities, extra letters and a real answer check.
function tileTask(word){task=run.queue[run.cursor];Object.assign(task,{w:word,kind:'scramble',assisted:false,errors:0,options:undefined,selected:[],tileHints:[]});delete task.comboSettled;cleanup=w.mountAirdrop(host);dp.querySelector('.air-resume').click();assert.equal(dp.querySelector('canvas'),null);}
function pick(ch){const button=[...dp.querySelectorAll('.air-salvage button')].find(b=>b.textContent===ch&&!b.disabled);assert.ok(button,'Available tile '+ch);button.click();}
tileTask('beginning');const tileCursor=run.cursor,badCount=run.incorrect;assert.equal(task.options.length,13);assert.equal(dp.querySelector('[aria-label="Check spelling"]').disabled,true);
w.S.airdrop.combo.count=2;const wrongIds=task.options.filter(o=>!task.w.includes(o.text)).map(o=>o.id).concat(task.options.filter(o=>task.w.includes(o.text)).map(o=>o.id)).slice(0,task.w.length);
for(const id of wrongIds)dp.querySelector('.air-salvage [data-id="'+id+'"]').click();dp.querySelector('[aria-label="Check spelling"]').click();assert.equal(run.cursor,tileCursor);assert.equal(run.incorrect,badCount+1);assert.equal(task.selected.length,0);assert.equal(w.S.airdrop.combo.count,0);
const tileHint=dp.querySelector('[aria-label="Hint one letter (+1 error)"]');tileHint.click();tileHint.click();assert.equal(run.incorrect,badCount+2);assert.equal(task.selected.length,0);assert.equal(dp.querySelector('.air-tileports button').textContent,'b');
for(const ch of 'begi')pick(ch);const savedOptions=JSON.stringify(task.options),savedIds=JSON.stringify(task.selected);cleanup();cleanup=w.mountAirdrop(host);dp.querySelector('.air-resume').click();assert.equal(JSON.stringify(task.options),savedOptions);assert.equal(JSON.stringify(task.selected),savedIds);assert.equal(w.GateAirdrop.tileAnswer(task),'begi');
dp.querySelector('[aria-label="Undo last letter"]').click();assert.equal(w.GateAirdrop.tileAnswer(task),'beg');for(const ch of 'inning')pick(ch);assert.equal(w.GateAirdrop.tileAnswer(task),'beginning');dp.querySelector('[aria-label="Check spelling"]').click();assert.equal(run.cursor,tileCursor+1);assert.equal(w.S.parts,2);cleanup();
for(const word of ['using','basket','fries']){tileTask(word);for(const ch of word)pick(ch);dp.querySelector('[aria-label="Check spelling"]').click();assert.ok(run.verified.includes(word));cleanup();}assert.equal(w.S.parts,4);assert.equal(w.S.airdrop.combo.count,0);
dom.window.close();console.log('PASS: real rendered strokes → WASM → UI: automatic wrong-ink clearing and one error per attempt; three clean words pay two; full matching sequence required; helped word queued for recall; one-letter hints charge once, survive refresh and require real writing; scrambled tile distractors, correction, repeated letters, hints, resume and combo payouts; no target sent to model.');
})().catch(e=>{console.error(e);process.exitCode=1;});
