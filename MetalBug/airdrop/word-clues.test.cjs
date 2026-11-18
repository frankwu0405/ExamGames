const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const s=fs.readFileSync(__dirname+'/../airdrop.js','utf8'),sandbox={window:{},Intl,Date};vm.runInNewContext(s.slice(0,s.indexOf('// DOM begins here.'))+'})();',sandbox);const words=sandbox.window.GateAirdrop.ALL;
vm.runInNewContext(fs.readFileSync(__dirname+'/word-clues.js','utf8'),sandbox);const {DATA,SPRITES}=sandbox.window.AirdropClues;
assert.deepEqual(Object.keys(DATA).sort(),[...words].sort());
const credits=fs.readFileSync(__dirname+'/clues/CREDITS.md','utf8');
for(const word of words){const [images,caption]=DATA[word];assert.ok(images.length);assert.ok(caption.length<65);assert.equal(new RegExp('\\b'+word+'\\b','i').test(caption),false);
 for(const id of images){const p=SPRITES.images[id];assert.ok(p,id);const [cols,rows]=SPRITES.sheets[p.sheet];assert.ok(p.x>=0&&p.x<cols&&p.y>=0&&p.y<rows);assert.ok(credits.includes(id),id);}}
for(const file of ['objects.webp','photos.webp']){const bytes=fs.readFileSync(__dirname+'/clues/'+file);assert.equal(bytes.subarray(0,4).toString(),'RIFF');assert.equal(bytes.subarray(8,12).toString(),'WEBP');}
assert.ok(credits.includes('https://www.pexels.com/license/'));assert.ok(fs.readFileSync(__dirname+'/clues/LICENSE-Microsoft.txt','utf8').includes('Microsoft Corporation'));
console.log('PASS: picture clues for all 60 words; no caption reveals target spelling; valid sprite frames; local images; per-image credits and licenses.');
