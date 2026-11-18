const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(__dirname+'/airdrop.js','utf8');new vm.Script(source);
const sandbox={window:{},Intl,Date};vm.runInNewContext(source.slice(0,source.indexOf('// DOM begins here.'))+'})();',sandbox);const A=sandbox.window.GateAirdrop;
assert.equal(A.ALL.length,60);assert.equal(new Set(A.ALL).size,60);
for(const size of [10,30,60]){
 const r=A.newRun(size,-1,{}),state=A.freshState();assert.equal(r.words.length,size);assert.equal(new Set(r.words).size,size);assert.ok(r.queue.every(t=>t.kind==='scramble'));
 if(size===30)for(const group of A.SETS)assert.equal(r.words.filter(w=>group.includes(w)).length,5);
 let total=0;while(!r.completed){const t=r.queue[r.cursor];total+=A.settleWord(state,t,true);A.advance(r,true,true);}assert.equal(r.verified.length,size);assert.equal(total,Math.floor(size/3)*2);assert.equal(state.combo.count,size%3);assert.equal(A.settleWord(state,r.queue[0],true),0);
}
for(const word of A.ALL){
 const tray=A.letterTray(word,false);assert.ok(A.validTray(tray,word));assert.equal(tray.length,word.length+4);assert.equal(new Set(tray.filter(o=>!word.includes(o.text)).map(o=>o.text)).size,4);
 assert.notEqual(tray.slice(0,word.length).map(o=>o.text).join(''),word);
 const t={options:tray,selected:[]};for(const ch of word)t.selected.push(tray.find(o=>o.text===ch&&!t.selected.includes(o.id)).id);assert.equal(A.tileAnswer(t),word);assert.equal(A.tileAnswer(JSON.parse(JSON.stringify(t))),word);t.selected[1]=t.selected[0];assert.equal(A.tileAnswer(t),'');
}
const state=A.freshState();for(let i=0;i<12;i++)A.settleWord(state,{w:A.ALL[i]},true);assert.equal(state.combo.earned,8);A.settleWord(state,{w:'moving'},true);A.settleWord(state,{w:'using'},true);const dirty={w:'begged'},run={};A.recordError(state,run,dirty);assert.equal(state.combo.count,0);assert.equal(run.incorrect,1);assert.equal(state.stats.begged.misses,1);assert.equal(A.settleWord(state,dirty,true),0);
const legacy=A.newRun(30,-1,{});legacy.engine=5;legacy.cursor=2;legacy.tokens=8;legacy.verified=[legacy.words[0]];legacy.queue[2].w='beginning';legacy.queue[2].kind='ink';legacy.queue[2].letters=[{letter:'b'},{letter:'e'},{letter:'g'}];legacy.queue[2].letterHint=3;legacy.queue[2].assisted=true;
const activeWord=legacy.queue[2].w;A.migrateRun(legacy);assert.equal(legacy.engine,6);assert.equal(legacy.cursor,2);assert.equal(legacy.queue[2].w,activeWord);assert.equal(A.tileAnswer(legacy.queue[2]),'beg');assert.equal(legacy.queue[2].tileHints[0],3);assert.ok(legacy.queue.slice(2).every(t=>t.kind==='scramble'));assert.equal(legacy.tokens,8);assert.equal(legacy.verified.length,1);assert.equal(legacy.queue[2].assisted,true);
const saved=JSON.parse(JSON.stringify(legacy));assert.equal(A.migrateRun(saved),saved);assert.equal(A.tileAnswer(saved.queue[2]),'beg');
const tiles=A.newRun(10,0,{});tiles.engine=5;const t=tiles.queue[0];t.options=A.letterTray(t.w,false);t.selected=[t.options[0].id];t.tileHints=[1];const original=JSON.stringify(t);A.migrateRun(tiles);assert.equal(JSON.stringify(t),original);
const failed=A.newRun(10,0,{});let tries=0;while(!failed.completed){A.advance(failed,false,false);assert.ok(++tries<200);}assert.equal(failed.parked.length,10);assert.ok(failed.queue.every(t=>t.kind==='scramble'));
for(let i=0;i<6;i++)assert.deepEqual([...A.newRun(10,i,{}).words].sort(),[...A.SETS[i]].sort());
const html=fs.readFileSync(__dirname+'/index.html','utf8');for(const m of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))if(m[1].trim())new vm.Script(m[1]);assert.ok(html.includes('airdrop.js?v=10'));assert.equal(/(?:ink-reader|letter-core)\.js/.test(html),false);assert.equal(/AirdropInk|AirdropLetters|createPad|canvas/.test(source),false);
console.log('PASS: all sizes and all reviews are scrambled pools; 60 solvable words with four distinct extras; repeated letters and strict grading; three-word payouts and error reset; partial-ink migration; exact tile resume; no handwriting imports or runtime.');
