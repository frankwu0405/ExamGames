const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(__dirname+'/airdrop.js','utf8');new vm.Script(source);
const pure=source.slice(0,source.indexOf('// DOM begins here.'))+'})();';
const sandbox={window:{},Intl,Date};vm.runInNewContext(pure,sandbox);
const A=sandbox.window.GateAirdrop;
assert.equal(A.ALL.length,60);assert.equal(new Set(A.ALL).size,60);assert.equal(Object.keys(A.WORDS).length,60);
for(const word of A.ALL){assert.ok(A.WORDS[word].sentence.toLowerCase().includes(word));assert.notEqual(A.WORDS[word].damaged,word);}
for(const size of [10,30,60]){
 const r=A.newRun(size,-1,{});assert.equal(r.words.length,size);assert.equal(new Set(r.words).size,size);
 if(size===30)for(const group of A.SETS)assert.equal(r.words.filter(w=>group.includes(w)).length,5);
 if(size===60)assert.ok(r.queue.every(t=>['ink','ink_context','scramble'].includes(t.kind)));
 const state=A.freshState();let parts=0,attempts=0;
 while(!r.completed){const t=r.queue[r.cursor],independent=['ink','ink_context','scramble'].includes(t.kind)&&!t.assisted;parts+=A.settleWord(state,t,!t.assisted&&!t.errors);A.advance(r,true,independent);assert.ok(++attempts<200);}
 assert.equal(r.verified.length,size);assert.equal(parts,Math.floor(attempts/3)*2);assert.equal(state.combo.count,attempts%3);assert.equal(new Set(r.verified).size,size);
 assert.equal(A.settleWord(state,r.queue[0],true),0);
 const copy=JSON.parse(JSON.stringify(r));assert.equal(copy.cursor,copy.queue.length);
}
for(let group=0;group<6;group++){const r=A.newRun(10,group,{});assert.deepEqual([...r.words].sort(),[...A.SETS[group]].sort());}
const combo=A.freshState();let gain=0;
for(let i=0;i<12;i++)gain+=A.settleWord(combo,{w:A.ALL[i],assisted:false},true);
assert.equal(gain,8);assert.equal(combo.combo.count,0); // no old daily cap
const receipt={w:'moving',assisted:false};A.settleWord(combo,receipt,true);assert.equal(A.settleWord(combo,receipt,true),0);assert.equal(combo.combo.count,1);
A.settleWord(combo,{w:'using'},true);assert.equal(combo.combo.count,2);
const bad={w:'begged'},badRun={streak:2};A.recordError(combo,badRun,bad);assert.equal(combo.combo.count,0);assert.equal(badRun.incorrect,1);assert.equal(combo.stats.begged.misses,1);assert.equal(A.settleWord(combo,bad,true),0);
const guided={w:'easier',assisted:false};assert.equal(A.settleWord(combo,guided,false),0);assert.equal(combo.combo.count,0);
A.settleWord(combo,{w:'using'},true);const comboRestored=JSON.parse(JSON.stringify(combo));A.ensureCombo(comboRestored);assert.equal(comboRestored.combo.count,1);
A.settleWord(comboRestored,{w:'moving'},true);assert.equal(comboRestored.combo.count,2);A.settleWord(comboRestored,{w:'easier'},false);assert.equal(comboRestored.combo.count,2);A.breakCombo(comboRestored);assert.equal(comboRestored.combo.count,0);
const oldPolicy={stats:{},daily:{paid:6},run:{tokens:4}};A.ensureCombo(oldPolicy);assert.equal(oldPolicy.run.tokens,4);assert.equal(oldPolicy.daily.paid,6);assert.equal(oldPolicy.combo.count,0);
assert.equal(A.settleWord(combo,{w:'invented'},true),0);
const fail=A.newRun(10,0,{});let attempts=0;while(!fail.completed){A.advance(fail,false,false);assert.ok(++attempts<=200);}assert.equal(fail.verified.length,0);assert.equal(fail.parked.length,10);
const resume=A.newRun(60,-1,{});for(let i=0;i<13;i++)A.advance(resume,true,true);const restored=JSON.parse(JSON.stringify(resume));assert.equal(restored.cursor,13);assert.equal(restored.verified.length,13);assert.equal(restored.queue[restored.cursor].w,resume.queue[13].w);
const assisted=A.newRun(60,-1,{}),w=assisted.queue[0].w;assisted.queue[0].assisted=true;A.advance(assisted,true,false);assert.equal(assisted.verified.length,0);assert.ok(assisted.queue.slice(assisted.cursor).some(t=>t.w===w));
const tail=A.newRun(10,0,{});tail.cursor=tail.queue.length-1;const tailWord=tail.queue.at(-1).w;A.advance(tail,true,false);assert.equal(tail.queue[tail.cursor+3].w,tailWord);assert.ok(tail.queue.slice(tail.cursor,tail.cursor+3).every(t=>t.w!==tailWord));
const old=JSON.parse(JSON.stringify(A.newRun(30,-1,{})));delete old.engine;old.verified=old.words.slice(0,4);old.tokens=2;old.cursor=6;old.queue[6].kind='repair';const migrated=A.migrateRun(old);assert.equal(migrated.engine,5);assert.equal(migrated.verified.length,4);assert.equal(migrated.tokens,2);assert.equal(migrated.queue.length,26);assert.ok(migrated.queue.every(t=>!migrated.verified.includes(t.w)));assert.equal(A.migrateRun(migrated),migrated);
const bank=A.letterTray('beginning',false);for(const ch of new Set('beginning'))assert.ok(bank.filter(t=>t.text===ch).length>='beginning'.split('').filter(x=>x===ch).length);assert.equal(new Set(bank.map(t=>t.id)).size,bank.length);assert.equal(A.letterTray('begged',true).map(t=>t.text).join(''),'abcdefghijklmnopqrstuvwxyz');
assert.equal(source.includes("node('input'"),false);assert.equal(source.includes("inputMode"),false);
assert.throws(()=>A.newRun(20,-1,{}));assert.throws(()=>A.newRun(10,9,{}));
const html=fs.readFileSync(__dirname+'/index.html','utf8');for(const m of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))if(m[1].trim())new vm.Script(m[1]);
assert.ok(html.includes('src="airdrop.js?v=8"'));
console.log('PASS: all 60 words; set coverage; 10/30/60 completion; delayed recalls; bounded retries; JSON resume; combo payouts; duplicate settlement; mistake resets; no obsolete cap; script syntax.');

// Version 2 upgrades keep the exact pending question and reward receipts.
const v2=JSON.parse(JSON.stringify(A.newRun(30,-1,{})));v2.engine=2;v2.cursor=7;v2.queue[7].kind='echo';v2.tokens=2;v2.verified=v2.words.slice(0,4);const pending=v2.queue[7].w;v2.queue[7].selected=[1,2];v2.queue[7].options=['old'];A.migrateRun(v2);assert.equal(v2.cursor,7);assert.equal(v2.queue[7].w,pending);assert.equal(v2.tokens,2);assert.equal(v2.queue[7].selected,undefined);assert.equal(v2.verified.length,4);
const mixed=A.newRun(30,-1,{});assert.equal(mixed.queue.filter(t=>t.kind.startsWith('ink')).length,12);
assert.ok(source.includes("check.disabled=locked||!hasInk"));assert.ok(source.includes("!AirdropLetters.complete(t,w.word)"));
assert.ok(html.indexOf('ink-reader.js')<html.indexOf('src="airdrop.js'));
console.log('PASS: handwriting majority, exact-question migration, empty ink guard, reader load order.');

for(const word of A.ALL){
 const tray=A.letterTray(word,false);assert.equal(tray.length,word.length+4);assert.ok(A.validTray(tray,word));
 assert.equal(new Set(tray.filter(o=>!word.includes(o.text)).map(o=>o.text)).size,4);
 const t={options:tray,selected:[]};for(const ch of word){const o=tray.find(o=>o.text===ch&&!t.selected.includes(o.id));assert.ok(o);t.selected.push(o.id);}
 assert.equal(A.tileAnswer(t),word);assert.equal(A.tileAnswer(JSON.parse(JSON.stringify(t))),word);
 t.selected[1]=t.selected[0];assert.equal(A.tileAnswer(t),'');
 assert.notEqual(tray.slice(0,word.length).map(o=>o.text).join(''),word);
}
for(const size of [10,30,60]){const r=A.newRun(size,-1,{});assert.ok(r.queue.some(t=>t.kind==='scramble'));assert.ok(r.queue.every(t=>!['ink_copy','ink_memory'].includes(t.kind)));}
const legacy=A.newRun(30,-1,{});legacy.engine=4;legacy.cursor=1;legacy.tokens=8;legacy.verified=[legacy.words[0]];const pendingWord=legacy.queue[1].w;legacy.queue[1].kind='ink_copy';legacy.queue[2].kind='ink_memory';A.migrateRun(legacy);assert.equal(legacy.cursor,1);assert.equal(legacy.queue[1].w,pendingWord);assert.equal(legacy.queue[1].kind,'scramble');assert.equal(legacy.queue[2].kind,'scramble');assert.equal(legacy.tokens,8);assert.equal(legacy.verified.length,1);
console.log('PASS: all words have solvable scrambled pools plus four distinct extras; repeated-letter quantities; strict tile answers; all package sizes; saved tracing/memory questions migrate without losing word/progress/tokens.');
