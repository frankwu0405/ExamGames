const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm');
const {JSDOM}=require('jsdom');
const dom=new JSDOM('<body><button id="start">Start</button></body>',{runScripts:'outside-only'}),w=dom.window;
let saved=null,saves=0;
w.S={parts:12,e9:{ch:2}};w.student={id:'frank'};
w.save=()=>{saved=JSON.parse(JSON.stringify(w.S));saves++;};
w.el=(tag,cls='',text='')=>{const n=w.document.createElement(tag);n.className=cls;n.textContent=text;return n;};
const src=fs.readFileSync('ep9.js','utf8');
w.eval(src.slice(src.indexOf('let e9UnlockPending='),src.indexOf('function startEp9(')));
function submit(value){const input=w.document.querySelector('input');input.value=value;w.document.querySelector('form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));}
(async()=>{
assert.equal(w.ep9Unlocked(),false);
const p=w.requestEp9Unlock();assert.equal(w.requestEp9Unlock(),p);assert.equal(w.document.querySelectorAll('[role=dialog]').length,1);
submit('wrong');assert.equal(saves,0);assert.equal(w.ep9Unlocked(),false);assert.equal(w.document.querySelector('[role=status]').textContent,'Try again.');
submit('thegateep9');assert.equal(await p,true);assert.equal(w.document.querySelector('[role=dialog]'),null);assert.equal(saves,1);assert.equal(saved.episodeUnlocks.ep9,true);assert.equal(saved.parts,12);assert.equal(saved.e9.ch,2);
assert.equal(await w.requestEp9Unlock(),true);assert.equal(saves,1);
w.S=JSON.parse(JSON.stringify(saved));assert.equal(w.ep9Unlocked(),true,'restored cloud/profile state stays unlocked');
w.student={id:'other'};w.S={};assert.equal(w.ep9Unlocked(),false);
const cancel=w.requestEp9Unlock();w.document.querySelector('.save-cancel').click();assert.equal(await cancel,false);assert.equal(saves,1);
const switcher=w.requestEp9Unlock();w.student={id:'third'};submit('thegateep9');assert.equal(await switcher,false);assert.equal(w.ep9Unlocked(),false);
w.student=null;assert.equal(await w.requestEp9Unlock(),false);
assert.match(src,/function startEp9\(i,resume=false\)\{\s*if\(!ep9Unlocked\(\)\)/);
const html=fs.readFileSync('index.html','utf8');assert.match(html,/await syncStudent\(\);[\s\S]*?await requestEp9Unlock\(\)/);
for(const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi))new vm.Script(match[1]);
console.log('PASS: wrong password, one popup, successful persistent unlock, account isolation, cancellation, account-switch protection, guarded episode entry, inline syntax.');
})().catch(e=>{console.error(e);process.exitCode=1;});
