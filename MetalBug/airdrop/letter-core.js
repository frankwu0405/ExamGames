/* Pure letter decisions shared by the worker, game and regression tests.
   The classifier never receives the word or the expected letter. */
(function(root){
'use strict';
const mapping='0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabdefghnqrt';
const MIN_CONFIDENCE=.65,MIN_MARGIN=.20;
function rank(values){
 if(values.length!==mapping.length||!Array.from(values).every(v=>Number.isFinite(v)&&v>=0))return null;
 const folded={};values.forEach((p,i)=>{let letter=mapping[i].toLowerCase();if(letter==='0')letter='o';folded[letter]=(folded[letter]||0)+p;});
 const sorted=Object.entries(folded).sort((a,b)=>b[1]-a[1]);
 return {letter:sorted[0][0],confidence:sorted[0][1],margin:sorted[0][1]-sorted[1][1],model:'emnist-cnn-1'};
}
function reliable(p){return !!p&&/^[a-z]$/.test(p.letter)&&p.model==='emnist-cnn-1'&&Number.isFinite(p.confidence)&&p.confidence>=MIN_CONFIDENCE&&p.confidence<=1.001&&Number.isFinite(p.margin)&&p.margin>=MIN_MARGIN&&p.margin<=1.001;}
function receipts(task,word){
 const out=[];for(const p of Array.isArray(task.letters)?task.letters:[]){if(out.length>=word.length||!reliable(p)||p.letter!==word[out.length])break;out.push(p);}return out;
}
function record(task,word,p){
 const prior=receipts(task,word);if(prior.length>=word.length||!reliable(p)||p.letter!==word[prior.length])return false;
 task.letters=prior.concat([{letter:p.letter,confidence:p.confidence,margin:p.margin,model:p.model}]);return true;
}
function complete(task,word){return word.length>0&&receipts(task,word).length===word.length;}
const api={mapping,rank,reliable,receipts,record,complete,MIN_CONFIDENCE,MIN_MARGIN};root.AirdropLetters=api;if(typeof module!=='undefined')module.exports=api;
})(typeof self!=='undefined'?self:globalThis);
