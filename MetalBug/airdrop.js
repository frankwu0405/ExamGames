/* Incoming cargo: a self-contained spelling side mission.
   Only S.airdrop and modest S.parts rewards are written; episode state is untouched.
   All 60 school words are available immediately. No microphone gatekeeping. */
(function(){
'use strict';
const SETS=[
 ['moving','beginning','carried','easier','begged','noisier','using','angriest','dragging','emptied'],
 ['basket','subject','lesson','traffic','mustard','compact','absent','cosmic','disgust','fantastic'],
 ['thousand','shower','power','enjoy','bounce','avoid','appoint','annoy','proud','fountain'],
 ['owner','peaches','asleep','display','shadow','dream','braided','charcoal','agree','maintain'],
 ['total','digit','talent','human','minus','defend','finish','equal','salad','famous'],
 ['inches','pitches','dishes','glasses','spies','fries','cities','pennies','families','faxes']
];
// [word, a spoken context sentence, base word where useful, damaged spelling, learning chunks]
const DATA=[
 ['moving','The cargo drone is moving toward our base.','move','moveing','mov·ing'],
 ['beginning','This is the beginning of our mission.','begin','begining','be·gin·ning'],
 ['carried','Kip carried the box inside.','carry','carryed','car·ried'],
 ['easier','This small box is easier to lift.','easy','easyer','eas·i·er'],
 ['begged','The dog begged for a snack.','beg','beged','begged'],
 ['noisier','The engine is noisier than before.','noisy','noisyer','nois·i·er'],
 ['using','Nara is using the scanner.','use','useing','us·ing'],
 ['angriest','That guard looks the angriest of them all.','angry','angryest','an·gri·est'],
 ['dragging','Finn is dragging the heavy box.','drag','draging','drag·ging'],
 ['emptied','Kip emptied the basket.','empty','emptyed','emp·tied'],
 ['basket','Put the small parts in the basket.','','baskit','bas·ket'],
 ['subject','The subject of this message is a missing drone.','','subjet','sub·ject'],
 ['lesson','Kip learned a lesson about loose wires.','','leson','les·son'],
 ['traffic','Heavy traffic blocked the city road.','','trafic','traf·fic'],
 ['mustard','Someone packed mustard with the sandwiches.','','musterd','mus·tard'],
 ['compact','The compact scanner fits in a pocket.','','compackt','com·pact'],
 ['absent','One crew member is absent today.','','abcent','ab·sent'],
 ['cosmic','The cosmic signal came from deep space.','','cozmic','cos·mic'],
 ['disgust','Finn looked at the rotten food in disgust.','','disgustt','dis·gust'],
 ['fantastic','You did a fantastic job with that repair.','','fantasic','fan·tas·tic'],
 ['thousand','The crate contains a thousand tiny screws.','','thousend','thou·sand'],
 ['shower','A sudden shower soaked the landing pad.','','showr','show·er'],
 ['power','The gate needs more power.','','powar','pow·er'],
 ['enjoy','The team will enjoy a quiet evening.','','enjoj','en·joy'],
 ['bounce','Watch the ball bounce off the wall.','','bounse','bounce'],
 ['avoid','Avoid the broken glass on the floor.','','avoyd','a·void'],
 ['appoint','They will appoint Nara as their captain.','','apoint','ap·point'],
 ['annoy','That buzzing noise will annoy the guard.','','anoy','an·noy'],
 ['proud','Kip felt proud of his new invention.','','prowd','proud'],
 ['fountain','They stopped beside the old fountain.','','fountin','foun·tain'],
 ['owner','The owner of the drone left a message.','','oner','own·er'],
 ['peaches','The basket is full of peaches.','peach','peachs','peach·es'],
 ['asleep','The dog is asleep by the gate.','','asleap','a·sleep'],
 ['display','The display shows the drone approaching.','','displai','dis·play'],
 ['shadow','A shadow moved across the landing pad.','','shaddow','shad·ow'],
 ['dream','Finn had a strange dream last night.','','dreem','dream'],
 ['braided','Nara braided the loose cords together.','braid','braidded','braid·ed'],
 ['charcoal','Kip drew a map with charcoal.','','charcole','char·coal'],
 ['agree','We all agree that this is a good plan.','','agre','a·gree'],
 ['maintain','We must maintain the gate to keep it working.','','mantain','main·tain'],
 ['total','The total weight is ten kilograms.','','totel','to·tal'],
 ['digit','One digit is missing from the code.','','dijit','dig·it'],
 ['talent','Nara has a talent for fixing machines.','','tallent','tal·ent'],
 ['human','Finn is a human boy.','','humen','hu·man'],
 ['minus','Ten minus three is seven.','','minas','mi·nus'],
 ['defend','The team will defend their base.','','deffend','de·fend'],
 ['finish','We can finish the repairs before dark.','','finnish','fin·ish'],
 ['equal','The two boxes have equal weight.','','equall','e·qual'],
 ['salad','Kip made a salad for lunch.','','sallad','sal·ad'],
 ['famous','The famous pilot signed the crate.','','famus','fa·mous'],
 ['inches','The gap is only three inches wide.','inch','inchs','inch·es'],
 ['pitches','The player pitches the ball.','pitch','pitchs','pitch·es'],
 ['dishes','Wash the dishes after dinner.','dish','dishs','dish·es'],
 ['glasses','Kip needs his glasses to read the label.','glass','glasss','glass·es'],
 ['spies','The spies watched the tower.','spy','spys','spies'],
 ['fries','Finn shared his fries with Kip.','fry','frys','fries'],
 ['cities','The drone flies between two cities.','city','citys','cit·ies'],
 ['pennies','The jar contains a few pennies.','penny','pennys','pen·nies'],
 ['families','The families waited for the next ship.','family','familys','fam·i·lies'],
 ['faxes','The office received two faxes.','fax','faxs','fax·es']
];
const WORDS=Object.fromEntries(DATA.map(([word,sentence,base,damaged,chunks])=>[word,{word,sentence,base,damaged,chunks}]));
const ALL=SETS.flat();
function freshState(){return {version:1,stats:{},daily:{day:'',words:[],paid:0},completed:{},run:null};}
function taipeiDay(now=new Date()){const parts=new Intl.DateTimeFormat('en',{timeZone:'Asia/Taipei',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);const value=k=>parts.find(p=>p.type===k).value;return value('year')+'-'+value('month')+'-'+value('day');}
function rewardWord(state,word,day){
  if(!WORDS[word])return 0;
  if(state.daily.day!==day)state.daily={day,words:[],paid:0};
  const daily=state.daily;
  if(!daily.words.includes(word))daily.words.push(word);
  const due=Math.min(6,Math.floor(daily.words.length/10));
  const gain=Math.max(0,due-daily.paid);daily.paid+=gain;
  return gain;
}
function randomized(items,random=Math.random){
  const out=items.slice();for(let i=out.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;
}
function pickWords(size,set,stats,random=Math.random){
  if(size===10&&set>=0)return randomized(SETS[set],random);
  if(size===60)return randomized(ALL,random);
  // Weighted sampling without replacement: recent problems get priority,
  // but mastered words still appear. Thirty words covers all six school sets.
  const sample=(pool,count)=>pool.map(word=>({word,score:Math.pow(random(),1/(1+Math.min(4,stats[word]?.misses||0)))})).sort((a,b)=>b.score-a.score).slice(0,count).map(x=>x.word);
  return randomized(size===30?SETS.flatMap(group=>sample(group,5)):sample(ALL,10),random);
}
function newRun(size,set,stats,random=Math.random){
  if(![10,30,60].includes(size)||!Number.isInteger(set)||set< -1||set>5)throw Error('Invalid drop');
  const words=pickWords(size,set,stats,random);
  const queue=words.map((w,i)=>({w,kind:size===60?'recall':i%4===0&&WORDS[w].base?'forge':i%4===1?'repair':i%4===2?'memory':i%4===3?'dispatch':'recall',assisted:false,attempts:0,retry:0}));
  return {size,set,words,queue,cursor:0,verified:[],parked:[],latch:0,tokens:0,started:Date.now(),completed:false};
}
function advance(run,passed,independent){
  const task=run.queue[run.cursor];if(!task)return;
  if(passed&&independent){
    if(!run.verified.includes(task.w))run.verified.push(task.w);
    run.parked=run.parked.filter(w=>w!==task.w);
  }else if(task.retry<2){
    const next={w:task.w,kind:'recall',assisted:false,attempts:0,retry:task.retry+1};
    run.queue.splice(Math.min(run.queue.length,run.cursor+4),0,next);
  }else if(!run.parked.includes(task.w))run.parked.push(task.w);
  run.cursor++;
  if(run.cursor>=run.queue.length)run.completed=true;
}
const clean=text=>text.trim().toLowerCase();
// Small pure surface for regression tests; does not touch the main game.
window.GateAirdrop={SETS,WORDS,ALL,freshState,rewardWord,pickWords,newRun,advance,clean};

const style=document.createElement('style');style.textContent=`
.airdrop-entry{border:0;border-top:1px dashed #44516e;background:transparent;color:var(--teal);display:flex;gap:10px;align-items:center;text-align:left;padding:9px 4px 3px;cursor:pointer;font:700 13px var(--bd)}
.airdrop-entry .ad-icon{width:27px;height:27px;flex:none}.airdrop-entry span{flex:1}.airdrop-entry small{font:400 22px var(--hd);color:var(--yellow)}
#airdrop{--ad-accent:#65eedb;position:fixed;inset:0;z-index:65;max-width:560px;margin:auto;background:#080e18;color:var(--paper);font-family:var(--bd);display:flex;flex-direction:column;isolation:isolate;overflow:hidden}
#airdrop *{box-sizing:border-box}#airdrop button{cursor:pointer;font-family:var(--bd);touch-action:manipulation}#airdrop button:focus-visible,#airdrop input:focus-visible,#airdrop select:focus-visible{outline:3px solid var(--yellow);outline-offset:3px}
#airdrop .ad-top{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:calc(12px + env(safe-area-inset-top)) 16px 10px;z-index:3;background:#080e18}
#airdrop .ad-top small{font:700 10px var(--bd);letter-spacing:.18em;color:#89a6b8}#airdrop .ad-back,#airdrop .ad-sound{border:1px solid #47546a;color:var(--paper);background:transparent;padding:8px 10px;font-size:12px;min-height:36px}
#airdrop .ad-back{border:0;padding-left:0}#airdrop .ad-balance{font:400 23px var(--hd);letter-spacing:.04em;color:var(--yellow);margin-left:auto}
#airdrop .ad-scroll{overflow-y:auto;min-height:0;flex:1;padding-bottom:calc(22px + env(safe-area-inset-bottom));scrollbar-width:thin}
#airdrop .ad-scene{height:235px;position:relative;overflow:hidden;perspective:650px;background:radial-gradient(ellipse at 50% 85%,#193342 0,transparent 60%),linear-gradient(#09111f,#101c2a)}
#airdrop .ad-scene:before{content:'';position:absolute;inset:0;background:radial-gradient(#7de2dd88 1px,transparent 1px) 0 0/67px 43px;opacity:.4;pointer-events:none}
#airdrop .ad-ground{position:absolute;left:-50%;right:-50%;bottom:-70px;height:170px;background:repeating-linear-gradient(0deg,transparent 0 25px,#31636a44 26px 27px),repeating-linear-gradient(90deg,transparent 0 35px,#31636a44 36px 37px);transform:rotateX(62deg);border-top:1px solid #56bcb766}
#airdrop .ad-orbit{position:absolute;width:230px;height:68px;border:1px solid #58e1cf55;border-radius:50%;left:50%;bottom:15px;transform:translateX(-50%);box-shadow:0 0 24px #24caba22,inset 0 0 20px #24caba22}
#airdrop .ad-scan{position:absolute;inset:0;background:linear-gradient(transparent 45%,#7df4e41a 50%,transparent 55%);background-size:100% 200%;animation:adScan 5s linear infinite;pointer-events:none}
@keyframes adScan{to{background-position:0 200%}}
#airdrop .ad-freq{position:absolute;left:17px;top:15px;font:700 9px/1.7 var(--bd);letter-spacing:.18em;color:#6c9baf}#airdrop .ad-freq i{display:inline-block;width:5px;height:5px;background:var(--ad-accent);border-radius:50%;margin-right:5px;box-shadow:0 0 10px var(--ad-accent)}
#airdrop .ad-altitude{position:absolute;right:17px;top:15px;text-align:right;font:700 9px/1.7 var(--bd);letter-spacing:.14em;color:#6c9baf}
#airdrop .ad-cargo{position:absolute;width:126px;height:108px;left:calc(50% - 63px);bottom:38px;transform-style:preserve-3d;transform:rotateX(-12deg) rotateY(-25deg);animation:adFloat 4s ease-in-out infinite;touch-action:none;cursor:grab}
#airdrop .ad-cargo.dragging{animation:none}#airdrop .ad-cargo:before{content:'';position:absolute;left:0;top:-24px;width:126px;height:25px;background:repeating-linear-gradient(90deg,#344d58 0 25px,#151e2c 26px 31px);transform-origin:bottom;transform:skewX(-40deg);border:3px solid #050a12}
#airdrop .ad-cargo:after{content:'';position:absolute;right:-24px;top:-12px;width:25px;height:108px;background:linear-gradient(90deg,#152332,#263e49);transform:skewY(-43deg);border:3px solid #050a12;z-index:-1}
#airdrop .ad-face{position:absolute;inset:0;background:linear-gradient(125deg,#526672,#253745 55%,#172636);border:4px solid #050a12;box-shadow:inset 0 0 0 3px #7f96a144,0 10px 25px #0008;border-radius:5px;display:flex;align-items:center;justify-content:center}
#airdrop .ad-face:before,#airdrop .ad-face:after{content:'';position:absolute;width:13px;top:-3px;bottom:-3px;background:repeating-linear-gradient(135deg,#deb354 0 8px,#1b2635 9px 16px);border-left:2px solid #080e18;border-right:2px solid #080e18}#airdrop .ad-face:before{left:10px}#airdrop .ad-face:after{right:10px}
#airdrop .ad-core{width:46px;height:46px;background:#06121d;border:3px solid #09101a;transform:rotate(45deg);box-shadow:0 0 0 2px var(--ad-accent),0 0 22px #65eedb55;display:grid;place-items:center}#airdrop .ad-core b{transform:rotate(-45deg);font:400 29px var(--hd);color:var(--ad-accent)}
#airdrop .ad-cargo.open .ad-face{transform:translateY(-22px) rotate(-8deg);transition:transform .6s}#airdrop .ad-cargo.open{filter:drop-shadow(0 0 22px #6ff3d5)}
@keyframes adFloat{0%,100%{transform:translateY(0) rotateX(-12deg) rotateY(-25deg)}50%{transform:translateY(-8px) rotateX(-10deg) rotateY(-15deg)}}
#airdrop .ad-title{font:400 52px/.9 var(--hd);letter-spacing:.035em;margin:0;transform:rotate(-2deg);text-shadow:3px 3px #000}#airdrop .ad-title em{font-style:normal;color:var(--ad-accent)}
#airdrop .ad-copy{padding:0 20px;margin-top:-6px;position:relative}#airdrop .ad-eyebrow{font:700 10px var(--bd);letter-spacing:.18em;color:#8fa3ba;margin:0 0 10px}
#airdrop .ad-radio{margin:18px 0;display:flex;gap:9px;align-items:center}#airdrop .ad-portrait{width:42px;height:42px;flex:none;border:2px solid #000;border-radius:50%;object-fit:cover;background:#27374b}#airdrop .ad-radio p{margin:0;font:500 13px/1.5 var(--bd);color:#c3d0dc}#airdrop .ad-radio b{display:block;color:var(--ad-accent);font-size:9px;letter-spacing:.16em;margin-bottom:2px}
#airdrop .ad-manifest{padding:0 18px;display:grid;gap:10px}#airdrop .ad-drop{position:relative;display:grid;grid-template-columns:55px 1fr auto;align-items:center;text-align:left;gap:10px;border:2px solid #000;border-left:5px solid var(--tone);padding:13px 14px;background:linear-gradient(115deg,#1e2b3c,#14202f);color:var(--paper);box-shadow:4px 4px #000;transform:rotate(-.6deg)}
#airdrop .ad-drop:nth-child(2){transform:rotate(.5deg)}#airdrop .ad-drop:nth-child(3){transform:rotate(-.3deg)}#airdrop .ad-drop .ad-num{font:400 43px/1 var(--hd);color:var(--tone)}#airdrop .ad-drop strong{font:400 24px/1 var(--hd);letter-spacing:.055em;display:block}#airdrop .ad-drop small{display:block;color:#b2c1d0;font-size:10px;margin-top:5px}#airdrop .ad-drop .ad-arrow{font:400 25px system-ui,sans-serif;color:var(--tone)}
#airdrop .ad-foot{padding:17px 20px 0;font:500 11px/1.6 var(--bd);color:#90a5ba}#airdrop .ad-foot button{border:0;background:none;color:var(--ad-accent);padding:0;text-decoration:underline dotted;font-size:inherit}
#airdrop .ad-primary{display:block;width:100%;border:3px solid #000;padding:12px 15px;background:var(--yellow);color:#0d1220;box-shadow:4px 4px #000;font:400 25px var(--hd);letter-spacing:.05em;text-align:left;clip-path:polygon(0 0,100% 0,calc(100% - 12px) 100%,0 100%)}
#airdrop .ad-secondary{display:block;width:100%;border:1px dashed #52627b;background:transparent;color:var(--paper);padding:11px 13px;font:700 13px var(--bd);margin-top:12px;text-align:left}
#airdrop .ad-setup{padding:20px}#airdrop .ad-setup p{font:500 13px/1.6 var(--bd);color:#b2c1d0}#airdrop .ad-select{display:block;width:100%;border:1px solid #476071;background:#122333;color:#fff;padding:13px 10px;font:500 14px var(--bd);margin:18px 0}
#airdrop .ad-wordlist{display:flex;gap:6px;flex-wrap:wrap;margin:15px 0 22px}#airdrop .ad-wordlist span{font:500 11px var(--bd);padding:4px 7px;background:#1b2b3b;color:#b9ccd9;border:1px solid #33485a}
#airdrop .ad-mission{display:flex;flex-direction:column;min-height:0;flex:1;overflow-y:auto;padding-bottom:env(safe-area-inset-bottom)}
#airdrop .ad-mission .ad-scene{height:148px;min-height:148px;flex:none}#airdrop .ad-mission .ad-cargo{transform:scale(.7);bottom:15px;animation:adFloatSmall 4s ease-in-out infinite}#airdrop .ad-mission .ad-orbit{bottom:3px;width:180px;height:40px}
@keyframes adFloatSmall{0%,100%{transform:scale(.7) translateY(0) rotateY(-20deg)}50%{transform:scale(.7) translateY(-7px) rotateY(-10deg)}}
#airdrop .ad-progress{position:absolute;bottom:12px;left:16px;color:#a9bfcf;font:700 11px var(--bd)}#airdrop .ad-progress strong{display:block;font:400 28px var(--hd);color:var(--ad-accent);margin-bottom:3px}#airdrop .ad-latches{position:absolute;right:15px;bottom:16px;display:flex;gap:4px;align-items:flex-end}#airdrop .ad-latches i{display:block;width:6px;height:14px;background:#263b4d;border:1px solid #416071;transform:skewY(-20deg)}#airdrop .ad-latches i.on{background:var(--ad-accent);box-shadow:0 0 8px #65eedb77}
#airdrop .ad-prompt{padding:10px 18px 0;flex:none}#airdrop .ad-taskhead{display:flex;align-items:center;justify-content:space-between;gap:6px}#airdrop .ad-mode{color:var(--yellow);font:400 23px var(--hd);letter-spacing:.05em}#airdrop .ad-count{font:700 9px var(--bd);letter-spacing:.12em;color:#8fa3ba}
#airdrop .ad-clue{font:500 16px/1.5 var(--bd);margin:10px 0;color:var(--paper);min-height:44px}#airdrop .ad-clue u{color:var(--ad-accent);text-underline-offset:5px}
#airdrop .ad-base{font:700 25px/1.4 var(--bd);letter-spacing:.07em;color:#b8cad7;background:#142333;padding:10px 12px;border-bottom:3px solid #476173;display:block;width:fit-content;transform:rotate(-1deg)}
#airdrop .ad-memory{font:700 25px/1.4 var(--bd);color:var(--ad-accent);padding:6px 0;overflow-wrap:anywhere}
#airdrop .ad-inputrow{display:flex;align-items:center;gap:8px}#airdrop .ad-input{width:100%;min-width:0;min-height:52px;border:0;border-bottom:3px solid var(--ad-accent);border-radius:0;background:#152638;color:#fff;font:700 25px var(--bd);padding:8px 10px;letter-spacing:.04em;appearance:none;caret-color:var(--yellow)}#airdrop .ad-input::placeholder{font-size:14px;letter-spacing:.04em;color:#7691aa}
#airdrop .ad-listen{min-width:44px;height:44px;border:1px solid #496576;color:var(--ad-accent);background:#122333;font-size:20px;display:grid;place-items:center}#airdrop .ad-listen svg{width:23px;height:23px}
#airdrop .ad-feedback{font:700 13px/1.5 var(--bd);min-height:26px;padding:6px 0;color:var(--yellow)}#airdrop .ad-feedback.ad-good{color:#7dff8a}#airdrop .ad-correction{font:700 21px/1.6 var(--bd);letter-spacing:.05em;overflow-wrap:anywhere;color:#b8c6d3}#airdrop .ad-correction mark{background:#ffd23f;color:#0d1220;padding:0 2px;border-radius:2px}
#airdrop .ad-tools{display:flex;gap:14px;justify-content:space-between;align-items:center;min-height:27px}#airdrop .ad-tools button{border:0;background:transparent;color:#a4b6cb;font:500 11px var(--bd);padding:4px 0;text-decoration:underline dotted}
#airdrop .ad-keyboard{padding:10px 7px 12px;margin-top:auto;flex:none;background:#0b1421}#airdrop .ad-keyrow{display:flex;justify-content:center;gap:4px;margin:0 0 5px}#airdrop .ad-keyrow button{flex:1;min-width:0;max-width:48px;height:43px;border:1px solid #43556b;border-bottom:3px solid #060d17;border-radius:4px;background:#243448;color:#edf5ff;font:700 17px var(--bd);padding:0;box-shadow:0 2px #0003}#airdrop .ad-keyrow button:active{background:#44667b;transform:translateY(1px)}#airdrop .ad-keyrow .ad-delete{flex:1.5;max-width:65px;background:#172737;font-size:19px}#airdrop .ad-submit{width:100%;border:2px solid #000;min-height:46px;background:var(--yellow);color:#0d1220;font:400 23px var(--hd);letter-spacing:.07em;box-shadow:2px 2px #000}#airdrop button:disabled{opacity:.45;cursor:default}
#airdrop .ad-note{padding:18px 20px;font:500 13px/1.7 var(--bd);color:#b7c9d8}#airdrop .ad-stamp{display:inline-block;margin:16px 0 10px;border:3px solid var(--ad-accent);color:var(--ad-accent);padding:5px 11px;font:400 28px var(--hd);letter-spacing:.12em;transform:rotate(-8deg)}
#airdrop .ad-stats{display:flex;gap:20px;margin:18px 0}#airdrop .ad-stats b{display:block;font:400 33px var(--hd);color:var(--yellow)}#airdrop .ad-stats small{font:500 10px var(--bd);color:#a3b5c7}
#airdrop .ad-toast{position:absolute;left:50%;bottom:25px;transform:translateX(-50%);padding:10px 15px;background:var(--yellow);color:#0d1220;z-index:8;box-shadow:4px 4px #000;border:2px solid #000;font:700 13px var(--bd);white-space:nowrap;pointer-events:none}
@media(max-height:710px){#airdrop .ad-mission .ad-scene{height:105px;min-height:105px}#airdrop .ad-keyrow button{height:37px}#airdrop .ad-clue{margin:5px 0;min-height:32px;font-size:15px}#airdrop .ad-prompt{padding-top:6px}#airdrop .ad-keyboard{padding-top:7px}#airdrop .ad-feedback{padding:4px 0;min-height:23px}#airdrop .ad-cargo{bottom:25px}}
@media(prefers-reduced-motion:reduce){#airdrop *,#airdrop *:before,#airdrop *:after{animation:none!important;transition:none!important}}
`;document.head.append(style);
const cargoIcon='<svg class="ad-icon" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M3 10Q16-5 29 10L16 21ZM3 10h26M10 10l6 11 6-11M10 22h12v8H10zM16 21v9"/></svg>';
const speakerIcon='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 9h4l5-4v14l-5-4H3zM16 8q5 4 0 8M19 5q8 7 0 14"/></svg>';
function node(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;}
function button(text,cls,action){const b=node('button',cls,text);b.type='button';b.onclick=action;return b;}
function state(){if(!S.airdrop||S.airdrop.version!==1)S.airdrop=freshState();return S.airdrop;}
window.airdropButton=function(){
  const b=button('','airdrop-entry',async()=>{
    if(!student){document.querySelector('.student-input')?.focus();return;}
    if(b.disabled)return;b.disabled=true;
    try{await syncStudent();openAirdrop();}catch(error){cloudFailure(error);}finally{b.disabled=false;}
  });
  b.innerHTML=cargoIcon;const tx=node('span','','Incoming airdrop');tx.append(node('small','','10 / 30 / 60'));b.append(tx,node('b','','↗'));
  return b;
};
function openAirdrop(){
  if(document.getElementById('airdrop'))return;
  const a=state(),player=student.id,wasTheme=Snd.themeWant,previous=document.activeElement;
  Snd.init();Snd.resume();Snd.theme(false);
  const shell=node('section');shell.id='airdrop';shell.setAttribute('role','dialog');shell.setAttribute('aria-modal','true');shell.setAttribute('aria-label','Incoming airdrop spelling mission');shell.tabIndex=-1;
  const app=document.getElementById('app'),wasInert=app.inert;app.inert=true;
  document.body.append(shell);shell.focus();
  let screen='menu',epoch=0,feedbackTimer=null,speechTimer=null,currentInput=null,submitAction=null,closeAction=null;
  const live=()=>shell.isConnected&&student?.id===player;
  const persist=()=>{if(live())save();};
  function sound(name){if(live())sfx(name);}
  function stopSpeech(){clearTimeout(speechTimer);try{window.speechSynthesis?.cancel();}catch(_){}}
  function say(text){
    stopSpeech();if(S.muted)return;
    if(!window.speechSynthesis||!window.SpeechSynthesisUtterance){toast('Ask your teacher to read this prompt.');return;}
    const u=new SpeechSynthesisUtterance(text);u.lang='en-US';u.rate=.82;window.speechSynthesis.speak(u);
  }
  function laterSpeech(text){const token=epoch;speechTimer=setTimeout(()=>{if(live()&&epoch===token)say(text);},180);}
  function reset(next){epoch++;clearTimeout(feedbackTimer);stopSpeech();screen=next;currentInput=null;submitAction=null;closeAction=null;shell.replaceChildren();}
  function close(){
    persist();reset('closed');shell.remove();app.inert=wasInert;document.removeEventListener('keydown',onKey);
    if(wasTheme)Snd.theme(true);if(previous?.isConnected)previous.focus();
  }
  function header(back=close,label='Back to game'){
    const top=node('header','ad-top');const b=button('‹ '+label,'ad-back',back);top.append(b,node('small','','KIP / AIR FREIGHT'));
    const bal=node('b','ad-balance','◆ '+(S.parts||0));bal.setAttribute('aria-label',(S.parts||0)+' parts');top.append(bal);
    const mute=button(S.muted?'♪ off':'♪ on','ad-sound',()=>{Snd.setMuted(!S.muted);mute.textContent=S.muted?'♪ off':'♪ on';if(S.muted)stopSpeech();});mute.setAttribute('aria-label','Toggle sound');top.append(mute);shell.append(top);return top;
  }
  function scene(size=10,opened=false,run=null){
    const sc=node('div','ad-scene');sc.append(node('div','ad-ground'),node('div','ad-orbit'));
    const freq=node('div','ad-freq');freq.append(node('i'),document.createTextNode('CARGO LINK / 08'),node('br'),document.createTextNode('SIGNAL ACQUIRED'));
    const alt=node('div','ad-altitude','SUPPLY DROP');alt.append(node('br'),document.createTextNode(size+' CODES'));sc.append(freq,alt);
    const crate=node('div','ad-cargo'+(opened?' open':'')),face=node('div','ad-face'),core=node('div','ad-core');core.append(node('b','',opened?'✓':String(size)));face.append(core);crate.append(face);sc.append(crate,node('div','ad-scan'));
    // The supply is an object to inspect, rather than a static questionnaire header.
    let drag=null;crate.onpointerdown=e=>{drag={x:e.clientX};crate.classList.add('dragging');crate.setPointerCapture?.(e.pointerId);};
    crate.onpointermove=e=>{if(drag)crate.style.transform='rotateY('+Math.max(-65,Math.min(65,(e.clientX-drag.x)*.6))+'deg) scale('+(run?.7:1)+')';};
    const release=()=>{drag=null;crate.classList.remove('dragging');crate.style.transform='';};crate.onpointerup=crate.onpointercancel=release;
    if(run){const p=node('div','ad-progress');p.append(node('strong','',run.verified.length+' / '+run.size),document.createTextNode('codes restored'));sc.append(p);
      const latches=node('div','ad-latches');for(let i=0;i<Math.ceil(run.size/10);i++)latches.append(node('i',run.verified.length>=(i+1)*10?'on':''));sc.append(latches);}
    return sc;
  }
  function radio(parent,text){const r=node('div','ad-radio'),portrait=node('div','ad-portrait');portrait.style.cssText='background:url(assets/p1.jpg) 56% 82%/700% auto;border-radius:50%;';const tx=node('p');tx.append(node('b','','KIP · RADIO'),document.createTextNode(text));r.append(portrait,tx);parent.append(r);}
  function toast(text){shell.querySelector('.ad-toast')?.remove();const n=node('div','ad-toast',text);n.setAttribute('role','status');shell.append(n);setTimeout(()=>n.remove(),1800);}
  function menu(){
    reset('menu');header();const body=node('div','ad-scroll');shell.append(body);body.append(scene(60));
    const copy=node('div','ad-copy');copy.append(node('p','ad-eyebrow','AN UNMARKED SHIPMENT HAS ARRIVED'));
    const title=node('h1','ad-title');title.append('SPECIAL ',node('em','','DELIVERY'));copy.append(title);radio(copy,'Delivery’s here. Codes are scrambled. Pick a crate.');body.append(copy);
    const manifest=node('div','ad-manifest');
    if(a.run&&!a.run.completed){const resume=button('Continue your '+a.run.size+'-word drop ▸','ad-primary',()=>mission());manifest.append(resume);}
    const specs=[[10,'SCOUT DROP','A quick practice packet','#65eedb'],[30,'CARGO DROP','Mixed practice · six school sets','#ffd23f'],[60,'HEAVY DROP','Every word · spelling-bee challenge','#bca2ff']];
    specs.forEach(([n,name,desc,tone])=>{const b=button('','ad-drop',()=>setup(n));b.style.setProperty('--tone',tone);b.append(node('span','ad-num',String(n)));const tx=node('span');tx.append(node('strong','',name),node('small','',desc+(a.completed[n]?' · CLEARED ✓':'')));b.append(tx,node('span','ad-arrow','↗'));manifest.append(b);});body.append(manifest);
    const foot=node('div','ad-foot');const d=a.daily.day===taipeiDay()?a.daily:{paid:0,words:[]};foot.append(document.createTextNode('Today: '+d.paid+' / 6 parts · '),button('How payouts work','',()=>rules()));body.append(foot);
  }
  function rules(){reset('rules');header(menu,'Airdrops');const body=node('div','ad-scroll'),note=node('div','ad-note');note.append(node('h1','ad-title','SMALL CARGO. REAL PRACTICE.'),node('p','','Every 10 different words spelled without help earns 1 part. Up to 6 parts per day, across all drops. Repeating the same words today does not pay again.'),node('p','','Fixing a label helps you learn it. That word comes back later with its answer hidden. Hints, repairs and mistakes never take parts away.'),node('p','','All 60 words are available. Thirty-word drops include five words from each school set. Sixty-word drops include every word.'),node('p','','Progress saves after every answer. Pause whenever you need. There is no countdown and no microphone requirement.'),button('Choose a drop ▸','ad-primary',menu));body.append(note);shell.append(body);}
  function setup(size){
    reset('setup');header(menu,'Airdrops');const body=node('div','ad-scroll');body.append(scene(size));const box=node('div','ad-setup');box.append(node('h1','ad-title',size+' WORD DROP'),node('p','',size===60?'Every word. Shuffled. Hear it, then spell it.':'Build, repair, remember. Then spell each code without help.'));
    let set=-1;
    if(size===10){const label=node('label','ad-eyebrow','CHOOSE YOUR PACKET');const select=node('select','ad-select');select.setAttribute('aria-label','Ten-word practice set');select.append(new Option('Mixed · choose for me','-1'));SETS.forEach((words,i)=>select.append(new Option('Set '+(i+1)+' · '+words[0]+' … '+words.at(-1),String(i))));label.append(select);box.append(label);
      const preview=node('div','ad-wordlist');preview.setAttribute('aria-label','Words in this school set');const paint=()=>{set=Number(select.value);preview.replaceChildren(...(set<0?[]:SETS[set].map(w=>node('span','',w))));};select.onchange=paint;box.append(preview);}
    if(a.run&&!a.run.completed){box.append(node('p','','Your current '+a.run.size+'-word drop is paused. Starting a new one replaces that run; word practice records and parts stay saved.'));box.append(button('Continue current drop','ad-secondary',()=>mission()));}
    box.append(button('Receive drop ▸','ad-primary',()=>{a.run=newRun(size,set,a.stats);persist();sound('whoosh');mission();}));body.append(box);shell.append(body);
  }
  function keyboard(parent,input,submit){
    const kb=node('div','ad-keyboard');parent.append(kb);
    function insert(text){if(input.disabled)return;input.focus({preventScroll:true});const start=input.selectionStart??input.value.length,end=input.selectionEnd??start;if(text==='⌫'){input.setRangeText('',start===end?Math.max(0,start-1):start,end,'end');}else if(input.value.length<24)input.setRangeText(text,start,end,'end');input.dispatchEvent(new Event('input'));sound('tick');}
    ['qwertyuiop','asdfghjkl','zxcvbnm'].forEach((letters,i)=>{const row=node('div','ad-keyrow');if(i===1)row.style.padding='0 14px';[...letters].forEach(letter=>row.append(button(letter,'',()=>insert(letter))));if(i===2){const del=button('⌫','ad-delete',()=>insert('⌫'));del.setAttribute('aria-label','Backspace');row.append(del);}kb.append(row);});
    const check=button('CHECK CODE ▸','ad-submit',submit);kb.append(check);return check;
  }
  function mission(){
    const run=a.run;if(!run){menu();return;}if(run.completed){result();return;}
    // A paid latch is checkpointed separately, so refresh cannot repeat rewards.
    const latch=Math.floor(run.verified.length/10);
    if(latch>run.latch&&!run.completed){run.latch=latch;persist();checkpoint();return;}
    reset('mission');const token=epoch;header(()=>pause(),'Pause');
    const task=run.queue[run.cursor],entry=WORDS[task.w];
    const area=node('div','ad-mission');area.append(scene(run.size,false,run));shell.append(area);
    const prompt=node('div','ad-prompt'),heading=node('div','ad-taskhead');heading.append(node('span','ad-mode',{forge:'WORD FORGE',repair:'DAMAGED LABEL',memory:'ECHO SCANNER',dispatch:'CARGO DISPATCH',recall:task.retry?'SIGNAL RETRY':'DECODE BY EAR'}[task.kind]),node('span','ad-count',task.retry?'BACK FROM THE REPAIR BELT':'NO TIMER'));prompt.append(heading);
    const clue=node('div','ad-clue');
    if(task.kind==='forge'){clue.append(node('span','ad-base',entry.base+' → ?'));}
    else if(task.kind==='repair'){clue.textContent='Fix the damaged label.';}
    else if(task.kind==='dispatch'){const bits=entry.sentence.split(new RegExp('('+entry.word+')','i'));bits.forEach((bit,i)=>clue.append(i%2?node('u','','_____'):document.createTextNode(bit)));}
    else clue.textContent=task.kind==='memory'?'Scan it. Hide it. Remember it.':'Listen. Spell the code.';
    prompt.append(clue);
    const row=node('div','ad-inputrow'),input=node('input','ad-input');input.type='text';input.inputMode='none';input.autocomplete='off';input.autocapitalize='none';input.spellcheck=false;input.maxLength=24;input.setAttribute('autocorrect','off');input.setAttribute('aria-label','Spell the code');input.placeholder='type the code';
    input.value=task.draft??(task.kind==='forge'?entry.base:task.kind==='repair'?entry.damaged:'');
    const listen=button('','ad-listen',()=>say(entry.word));listen.innerHTML=speakerIcon;listen.setAttribute('aria-label','Hear the word again');row.append(input,listen);prompt.append(row);
    const feedback=node('div','ad-feedback');feedback.setAttribute('role','status');feedback.setAttribute('aria-live','polite');prompt.append(feedback);
    const tools=node('div','ad-tools');const example=button('Use it in a sentence','',()=>say(entry.sentence));tools.append(example);
    const hint=button('Show the spelling','',()=>reveal());tools.append(hint);prompt.append(tools);area.append(prompt);
    let locked=false,scanVisible=task.kind==='memory'&&!task.scanned;
    const submit=()=>{
      if(locked||scanVisible||!live()||token!==epoch)return;
      const answer=clean(input.value);if(!answer){feedback.textContent='Listen, then enter a code.';say(entry.word);return;}
      if(answer===entry.word){
        locked=true;input.disabled=true;check.disabled=true;feedback.classList.add('ad-good');sound('pin');
        const independent=(task.kind==='recall'||task.kind==='dispatch')&&!task.assisted;
        feedback.textContent=independent?'CODE RESTORED ✓':'LABEL REPAIRED · recall it again later';
        const stat=a.stats[task.w]||(a.stats[task.w]={exact:0,misses:0,helped:0});
        if(independent)stat.exact++;else stat.helped++;
        let gain=0;
        if(independent){gain=rewardWord(a,task.w,taipeiDay());run.tokens+=gain;S.parts=(S.parts||0)+gain;}
        advance(run,true,independent);
        if(run.completed&&run.verified.length===run.size&&!run.stamped){a.completed[run.size]=(a.completed[run.size]||0)+1;run.stamped=true;}
        persist();
        if(gain){partsEl.lastChild.textContent=S.parts;shell.querySelector('.ad-balance').textContent='◆ '+S.parts;toast('+1 part · 10 different codes');sound('coin');}
        feedbackTimer=setTimeout(()=>{if(live()&&token===epoch)mission();},500);
      }else{
        task.attempts++;task.assisted=true;task.draft=input.value;
        const stat=a.stats[task.w]||(a.stats[task.w]={exact:0,misses:0,helped:0});stat.misses++;persist();
        sound('tap');feedback.classList.remove('ad-good');feedback.replaceChildren(node('span','','Compare, then repair: '));
        const correction=node('div','ad-correction');[...entry.word].forEach((letter,i)=>correction.append(node(answer[i]===letter?'span':'mark','',letter)));feedback.append(correction);
        if(answer.length>entry.word.length)feedback.append(node('span','','Remove the extra letters, too.'));
        hint.textContent='Read the word again';
        if(task.attempts>=2&&!tools.querySelector('.ad-park'))tools.append(button('Practise later','ad-park',()=>{if(locked)return;locked=true;advance(run,false,false);persist();mission();}));
      }
    };
    const check=keyboard(area,input,submit);currentInput=input;submitAction=submit;
    input.oninput=()=>{input.value=input.value.replace(/[^a-zA-Z]/g,'').toLowerCase().slice(0,24);task.draft=input.value;persist();};
    function reveal(){
      if(locked)return;task.assisted=true;persist();feedback.textContent=entry.chunks.replaceAll('·',' · ');say(entry.word);hint.textContent='Spelling shown · try it';
    }
    if(scanVisible){
      task.assisted=true;input.disabled=true;check.disabled=true;
      const memory=node('div','ad-memory',entry.chunks.replaceAll('·',' · '));clue.append(memory);
      const hide=button('HIDE SIGNAL ▸','ad-secondary',()=>{memory.remove();hide.remove();clue.textContent='Signal hidden. Spell it from memory.';task.scanned=true;scanVisible=false;input.disabled=false;check.disabled=false;persist();input.focus({preventScroll:true});});clue.append(hide);
    }
    closeAction=pause;
    laterSpeech(entry.word);
  }
  function checkpoint(){
    reset('checkpoint');header(()=>pause(),'Pause');const run=a.run,body=node('div','ad-scroll');body.append(scene(run.size,true,run));const box=node('div','ad-setup');box.append(node('p','ad-eyebrow','LATCH '+Math.floor(run.verified.length/10)+' RELEASED'),node('h1','ad-title','SIGNAL STRONGER.'),node('p','',run.verified.length+' codes restored. Take a breath. The next packet is ready.'),button('Keep decoding ▸','ad-primary',()=>mission()),button('Save & return to airdrops','ad-secondary',menu));body.append(box);shell.append(body);sound('card');
  }
  function pause(){
    reset('pause');header(menu,'Airdrops');const body=node('div','ad-scroll');body.append(scene(a.run.size,false,a.run));const box=node('div','ad-setup');box.append(node('h1','ad-title','CARGO SECURED.'),node('p','','Your exact place is saved. No rush.'),button('Continue decoding ▸','ad-primary',()=>mission()),button('Back to game','ad-secondary',close));body.append(box);shell.append(body);persist();
  }
  function result(){
    reset('result');const run=a.run;if(!run)return menu();
    if(run.verified.length===run.size&&!run.stamped){a.completed[run.size]=(a.completed[run.size]||0)+1;run.stamped=true;persist();}
    header(menu,'Airdrops');const body=node('div','ad-scroll');body.append(scene(run.size,true,run));const box=node('div','ad-setup');box.append(node('span','ad-stamp',run.parked.length?'CARGO RECOVERED':'CLEARED ✓'),node('h1','ad-title','GOOD DELIVERY.'));
    const stats=node('div','ad-stats');[[run.verified.length+'/'+run.size,'codes recalled'],['+'+run.tokens,'parts earned']].forEach(([n,t])=>{const cell=node('div');cell.append(node('b','',n),node('small','',t));stats.append(cell);});box.append(stats);
    if(run.parked.length){box.append(node('p','',run.parked.length+' labels need another look. They are saved on the repair belt.'),button('Retry those labels ▸','ad-primary',()=>{const words=run.parked.slice();run.queue.push(...randomized(words).map(w=>({w,kind:'recall',assisted:false,attempts:0,retry:0})));run.completed=false;persist();mission();}));}
    else box.append(node('p','','The lock is open. The shipment is yours.'));
    box.append(button('Choose another drop ▸',run.parked.length?'ad-secondary':'ad-primary',menu),button('Back to game','ad-secondary',close));body.append(box);shell.append(body);sound('card');
  }
  function onKey(e){
    if(!live())return;
    if(e.key==='Escape'){e.preventDefault();(closeAction||close)();return;}
    if(e.key==='Tab'){
      const controls=[...shell.querySelectorAll('button:not(:disabled),input:not(:disabled),select')].filter(n=>n.offsetParent!==null);
      const first=controls[0],last=controls.at(-1);if(!first)return;
      if(e.shiftKey&&(document.activeElement===first||document.activeElement===shell)){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}return;
    }
    if(screen==='mission'&&e.key==='Enter'&&document.activeElement===currentInput){e.preventDefault();submitAction?.();}
  }
  document.addEventListener('keydown',onKey);menu();
}
})();
