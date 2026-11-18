const assert=require('node:assert/strict'),_load=require('./letter-core.js');const L=globalThis.AirdropLetters;
const valid=letter=>({letter,confidence:.95,margin:.90,model:'emnist-cnn-1'});
let t={};assert.equal(L.complete(t,'begged'),false);
for(const letter of 'begged')assert.equal(L.record(t,'begged',valid(letter)),true);assert.ok(L.complete(t,'begged'));assert.equal(L.record(t,'begged',valid('x')),false);
for(const p of [null,{},valid('x'),{...valid('b'),confidence:.1},{...valid('b'),margin:.01},{...valid('b'),confidence:NaN},{...valid('b'),model:'manual'},{...valid('b'),letter:'begged'}]){const task={};assert.equal(L.record(task,'begged',p),false);assert.equal(L.complete(task,'begged'),false);}
assert.equal(L.complete({letters:[valid('m'),valid('o')]},'moving'),false);
assert.equal(L.complete({letters:Array(6).fill(valid('m'))},'moving'),false);
assert.equal(L.complete({letters:'moving'.split('').map(letter=>({letter}))},'moving'),false);
const repeated={};for(const ch of 'beg')L.record(repeated,'begged',valid(ch));assert.equal(L.receipts(repeated,'begged').length,3);assert.equal(L.record(repeated,'begged',valid('e')),false);assert.equal(L.record(repeated,'begged',valid('g')),true);
const restored=JSON.parse(JSON.stringify(repeated));assert.equal(L.receipts(restored,'begged').length,4);for(const ch of 'ed')L.record(restored,'begged',valid(ch));assert.ok(L.complete(restored,'begged'));
const probabilities=new Float32Array(47);probabilities[11]=.6;probabilities[37]=.3;probabilities[12]=.1;const folded=L.rank(probabilities);assert.equal(folded.letter,'b');assert.ok(L.reliable(folded));
assert.equal(L.rank(new Float32Array(3)),null);assert.equal(L.reliable(L.rank(new Float32Array(47))),false);
const zero=new Float32Array(47);zero[0]=.95;zero[24]=.05;assert.equal(L.rank(zero).letter,'o');
console.log('PASS: wrong letter/low confidence/ambiguous/blank/manual bypass rejected; all letters required; double letters; exact-letter JSON resume; case folding.');
