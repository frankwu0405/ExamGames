const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(__dirname+'/airdrop.js','utf8');new vm.Script(source);
const pure=source.slice(0,source.indexOf('const style='))+'})();';
const sandbox={window:{},Intl,Date};vm.runInNewContext(pure,sandbox);
const A=sandbox.window.GateAirdrop;
assert.equal(A.ALL.length,60);assert.equal(new Set(A.ALL).size,60);assert.equal(Object.keys(A.WORDS).length,60);
for(const word of A.ALL){assert.ok(A.WORDS[word].sentence.toLowerCase().includes(word));assert.notEqual(A.WORDS[word].damaged,word);}
for(const size of [10,30,60]){
 const r=A.newRun(size,-1,{});assert.equal(r.words.length,size);assert.equal(new Set(r.words).size,size);
 if(size===30)for(const group of A.SETS)assert.equal(r.words.filter(w=>group.includes(w)).length,5);
 if(size===60)assert.ok(r.queue.every(t=>t.kind==='recall'));
 const state=A.freshState();let parts=0,attempts=0;
 while(!r.completed){const t=r.queue[r.cursor],independent=['recall','dispatch'].includes(t.kind)&&!t.assisted;if(independent)parts+=A.rewardWord(state,t.w,'2026-11-18');A.advance(r,true,independent);assert.ok(++attempts<200);}
 assert.equal(r.verified.length,size);assert.equal(parts,size/10);assert.equal(new Set(r.verified).size,size);
 assert.equal(A.rewardWord(state,r.words[0],'2026-11-18'),0);
 const copy=JSON.parse(JSON.stringify(r));assert.equal(copy.cursor,copy.queue.length);
}
for(let group=0;group<6;group++){const r=A.newRun(10,group,{});assert.deepEqual([...r.words].sort(),[...A.SETS[group]].sort());}
const daily=A.freshState();let gain=0;for(let repeat=0;repeat<10;repeat++)for(const w of A.ALL)gain+=A.rewardWord(daily,w,'2026-11-18');assert.equal(gain,6);assert.equal(daily.daily.paid,6);
let next=0;for(const w of A.ALL)next+=A.rewardWord(daily,w,'2026-11-19');assert.equal(next,6);
assert.equal(A.rewardWord(daily,'invented','2026-11-19'),0);
const fail=A.newRun(10,0,{});let attempts=0;while(!fail.completed){A.advance(fail,false,false);assert.ok(++attempts<=30);}assert.equal(fail.verified.length,0);assert.equal(fail.parked.length,10);
const resume=A.newRun(60,-1,{});for(let i=0;i<13;i++)A.advance(resume,true,true);const restored=JSON.parse(JSON.stringify(resume));assert.equal(restored.cursor,13);assert.equal(restored.verified.length,13);assert.equal(restored.queue[restored.cursor].w,resume.queue[13].w);
const assisted=A.newRun(60,-1,{}),w=assisted.queue[0].w;assisted.queue[0].assisted=true;A.advance(assisted,true,false);assert.equal(assisted.verified.length,0);assert.ok(assisted.queue.slice(assisted.cursor).some(t=>t.w===w));
assert.throws(()=>A.newRun(20,-1,{}));assert.throws(()=>A.newRun(10,9,{}));
const html=fs.readFileSync(__dirname+'/index.html','utf8');for(const m of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))if(m[1].trim())new vm.Script(m[1]);
assert.ok(html.includes('src="airdrop.js?v=1"'));
console.log('PASS: all 60 words; set coverage; 10/30/60 completion; delayed recalls; bounded retries; JSON resume; duplicate rewards; daily six-part cap; next-day reset; script syntax.');
