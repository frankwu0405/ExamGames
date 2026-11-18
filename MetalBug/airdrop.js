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
 ['shower','A warm shower washed the dirt away.','','showr','show·er'],
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
function freshState(){return {version:1,stats:{},daily:{day:'',words:[],paid:0},completed:{},run:null,combo:{scheme:1,count:0,earned:0}};}
function taipeiDay(now=new Date()){const parts=new Intl.DateTimeFormat('en',{timeZone:'Asia/Taipei',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);const value=k=>parts.find(p=>p.type===k).value;return value('year')+'-'+value('month')+'-'+value('day');}
function ensureCombo(state){
 if(state.combo?.scheme!==1)state.combo={scheme:1,count:0,earned:0};
 if(!Number.isInteger(state.combo.count)||state.combo.count<0||state.combo.count>2)state.combo.count=0;
 return state.combo;
}
function breakCombo(state){ensureCombo(state).count=0;}
function settleWord(state,task,eligible){
 if(!WORDS[task.w]||task.comboSettled===1)return 0;
 task.comboSettled=1;const combo=ensureCombo(state);
 if(!eligible||task.assisted||task.errors)return 0;
 combo.count++;if(combo.count<3)return 0;
 combo.count=0;combo.earned=(combo.earned||0)+2;return 2;
}
function recordError(state,run,task){
 if(!WORDS[task.w])return;
 task.errors=(task.errors||0)+1;task.assisted=true;run.incorrect=(run.incorrect||0)+1;run.streak=0;breakCombo(state);
 const stat=state.stats[task.w]||(state.stats[task.w]={exact:0,misses:0,helped:0});stat.misses++;
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
function kindFor(word,index,size){return size===60?'ink':['ink','ink_copy','ink_context','ink_memory','hunt'][index%5];}
function newRun(size,set,stats,random=Math.random){
 if(![10,30,60].includes(size)||!Number.isInteger(set)||set< -1||set>5)throw Error('Invalid drop');
 const words=pickWords(size,set,stats,random);
 return {engine:4,size,set,words,queue:words.map((w,i)=>({w,kind:kindFor(w,i,size),assisted:false,attempts:0,retry:0})),cursor:0,verified:[],parked:[],latch:0,tokens:0,streak:0,started:Date.now(),completed:false};
}
function advance(run,passed,independent){
 const task=run.queue[run.cursor];if(!task)return;
 if(passed&&independent){if(!run.verified.includes(task.w))run.verified.push(task.w);run.parked=run.parked.filter(w=>w!==task.w);}
 else if(!task.filler&&task.retry<2){
  const tail=run.queue.slice(run.cursor+1),need=Math.max(0,3-tail.length);
  if(need)run.queue.push(...run.words.filter(w=>w!==task.w&&!tail.some(t=>t.w===w)).slice(0,need).map(w=>({w,kind:'ink',assisted:false,attempts:0,retry:2,filler:true})));
  run.queue.splice(Math.min(run.queue.length,run.cursor+4),0,{w:task.w,kind:'ink',assisted:false,attempts:0,retry:task.retry+1});
 }
 else if(!task.filler&&!run.verified.includes(task.w)&&!run.parked.includes(task.w))run.parked.push(task.w);
 run.cursor++;run.completed=run.cursor>=run.queue.length;
}
function migrateRun(run){
 if(!run||run.engine===4||run.completed)return run;
 // Preserve the exact pending word, completed work and reward receipts.
 if([2,3].includes(run.engine)){
  run.queue.slice(run.cursor).forEach((t,i)=>{t.kind=t.retry||t.filler?'ink':kindFor(t.w,i,run.size);delete t.options;delete t.selected;});
 }else{
  const remaining=run.words.filter(w=>!run.verified.includes(w));
  run.queue=remaining.map((w,i)=>({w,kind:kindFor(w,i,run.size),assisted:false,attempts:0,retry:0}));run.cursor=0;run.parked=[];
 }
 run.engine=4;run.streak=0;return run;
}
function letterTray(word,echo,random=Math.random){
 if(echo)return 'abcdefghijklmnopqrstuvwxyz'.split('').map((text,i)=>({id:i,text}));
 const letters=word.split('');const distractors='aeioubdmpst';for(let i=0;i<3;i++)letters.push(distractors[Math.floor(random()*distractors.length)]);
 return randomized(letters,random).map((text,id)=>({text,id}));
}
const clean=s=>s.trim().toLowerCase();
window.GateAirdrop={SETS,WORDS,ALL,freshState,ensureCombo,breakCombo,settleWord,recordError,pickWords,newRun,advance,migrateRun,letterTray,clean};
// DOM begins here. The same workshop shell, back arrow, portrait and tabs own navigation.
const assets=new URL('airdrop/',document.currentScript.src);
const link=document.createElement('link');link.rel='stylesheet';link.href=new URL('airdrop.css?v=6',assets);document.head.append(link);
const ICON={
 speaker:'<path d="M3 9h4l5-4v14l-5-4H3zM16 8q5 4 0 8M19 5q8 7 0 14"/>',
 play:'<path d="m8 4 13 8-13 8z"/>',back:'<path d="m15 5-8 7 8 7"/>',
 undo:'<path d="M7 8h9a6 6 0 1 1-5 10M7 3 2 8l5 5"/>',
 eye:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
 check:'<path d="m4 12 5 5L21 5"/>',pause:'<path d="M8 4v16M16 4v16"/>',
 home:'<path d="m2 11 10-9 10 9M5 9v12h14V9M10 21v-8h4v8"/>',
 bolt:'<path d="m14 2-9 12h6l-1 8 9-12h-6z"/>',
 settings:'<path d="M4 6h16M4 12h16M4 18h16"/><circle cx="9" cy="6" r="2"/><circle cx="15" cy="12" r="2"/><circle cx="10" cy="18" r="2"/>',
 retry:'<path d="M4 10a8 8 0 1 1 1 8M4 3v7h7"/>',
 eraser:'<path d="m15 3 7 7-11 11H6L2 17zM8 11l7 7M11 21h11"/>',
 clock:'<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 3"/>'
};
const svg=name=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+ICON[name]+'</svg>';
function n(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;}
function b(text,cls,fn){const e=n('button',cls,text);e.type='button';e.onclick=fn;return e;}
function ib(name,label,fn,cls=''){const e=b('','air-icon '+cls,fn);e.innerHTML=svg(name);e.setAttribute('aria-label',label);return e;}
window.mountAirdrop=function(host){
 const {d,dp,fr,head,talk,setBack}=host;
 if(!S.airdrop||S.airdrop.version!==1)S.airdrop=freshState();
 const a=S.airdrop;ensureCombo(a);migrateRun(a.run);
 const wasTheme=Snd.themeWant;Snd.theme(false);
 let active=true,page='menu',epoch=0,taskCleanup=null,speechTimer=null,taskTimer=null,selectedSize=10,selectedSet=-1;
 const player=student?.id;let sceneReady=false,sceneState={type:'view',mode:'menu',size:10};
 const live=()=>active&&d.isConnected&&student?.id===player;
 const persist=()=>{if(live())save();};
 const post=payload=>{if(sceneReady)fr.contentWindow?.postMessage({airdrop:payload},location.origin);};
 const view=payload=>{sceneState={...sceneState,...payload,type:'view'};post(sceneState);};
 const onMessage=e=>{if(!live()||e.source!==fr.contentWindow||e.origin!==location.origin||!e.data?.airdrop)return;const m=e.data.airdrop;if('ready'in m){sceneReady=m.ready;if(m.ready)post(sceneState);}if(m.choose&&page==='menu')setup(m.choose);};
 window.addEventListener('message',onMessage);
 fr.title='3D airdrop landing pad';fr.src=new URL('index.html?v=2',assets).href;
 function stopSpeech(){clearTimeout(speechTimer);try{speechSynthesis.cancel();}catch{}}
 function say(text,force=false){stopSpeech();if((S.muted&&!force)||!window.speechSynthesis)return;const u=new SpeechSynthesisUtterance(text);u.lang='en-US';u.rate=.83;speechSynthesis.speak(u);}
 function voice(text){const stamp=epoch;speechTimer=setTimeout(()=>{if(live()&&epoch===stamp)say(text);},160);}
 function reset(next){epoch++;clearTimeout(taskTimer);stopSpeech();taskCleanup?.();taskCleanup=null;page=next;d.querySelector('.air-clue')?.remove();dp.replaceChildren();dp.scrollTop=0;d.classList.toggle('pw',next==='task');d.classList.toggle('air-task',next==='task');setBack(next==='menu'?host.close:menu);}
 function intro(text){dp.append(head(true));talk(text);}
 function littleStatus(text){const e=n('div','air-status',text);e.setAttribute('role','status');e.setAttribute('aria-live','polite');return e;}
 function menu(){
  reset('menu');view({mode:'menu',open:false,arrive:false});intro('Pick a drop. Let’s crack it.');
  const title=n('div','air-heading');title.append(n('span','','AIR DROP'),ib('settings','Practice settings',settings));dp.append(title);
  const row=n('div','air-sizes');[[10,'QUICK'],[30,'MIX'],[60,'CHALLENGE']].forEach(([size,label])=>{const e=b('','air-size',()=>setup(size));e.append(n('strong','',String(size)),n('small','',label));if(a.completed[size])e.append(n('i','','✓'));row.append(e);});dp.append(row);
  if(a.run&&!a.run.completed){const resume=b('','air-resume',()=>task());resume.append(ibPlaceholder('play'),n('strong','',a.run.verified.length+' / '+a.run.size),n('span','','CONTINUE'));dp.append(resume);}
  const foot=n('div','air-allowance');foot.append(n('span','','⚡ '+a.combo.count+' / 3'),n('span','','3 CLEAN = +2 🔧'));dp.append(foot);
 }
 function ibPlaceholder(name){const e=n('span','air-symbol');e.innerHTML=svg(name);return e;}
 function settings(){reset('settings');intro('Ready when you are.');view({mode:'menu'});
  const detail=n('div','air-settings');
  detail.append(n('h3','','INK READER'),n('p','','One letter at a time. Correct letters lock in automatically. ✓ reads your letter; it cannot skip it.'));
  const status=littleStatus(''),enable=b('LOAD READER','air-go',()=>AirdropInk.enable());detail.append(enable,status,n('p','','Three clean words earn two parts, then the combo restarts. Errors, skips and revealed answers reset it.'),b('Back','air-outline',menu));const credits=n('a','air-picturecredits','Picture credits');credits.href=new URL('clues/CREDITS.md',assets);credits.target='_blank';credits.rel='noopener';detail.append(credits);dp.append(detail);
  taskCleanup=AirdropInk.subscribe((state,progress)=>{status.textContent=state==='ready'?'✓ Ready':state==='loading'?'Downloading… '+progress+'%':state==='error'?'Reader unavailable. Retry to continue.':'';enable.hidden=state==='ready'||state==='loading';enable.textContent=state==='error'?'TRY AGAIN':'LOAD READER';});

 }
 function setup(size){
  if(![10,30,60].includes(size))return;selectedSize=size;selectedSet=-1;reset('setup');view({mode:'task',size,open:false,arrive:true});intro('Hear it. Write it. Ship it.');
  const title=n('div','air-heading',size+' WORDS');dp.append(title);

  if(size===10){const sets=n('div','air-setpick');const groupLabel=n('div','air-micro','PACKET');sets.append(groupLabel);[-1,0,1,2,3,4,5].forEach(i=>{const e=b(i<0?'↻':String(i+1),i<0?'on':'',()=>{selectedSet=i;[...sets.querySelectorAll('button')].forEach(btn=>btn.classList.toggle('on',btn===e));preview.textContent=i<0?'':SETS[i].slice(0,3).join(' · ')+' …';});e.setAttribute('aria-label',i<0?'Mixed words':'School set '+(i+1));sets.append(e);});const preview=n('div','air-setpreview');dp.append(sets,preview);}
  if(a.run&&!a.run.completed)dp.append(n('div','air-micro','New drop replaces your paused run. Parts stay.'));
  const go=b('','air-go',()=>{if(a.run&&!a.run.completed)breakCombo(a);a.run=newRun(selectedSize,selectedSet,a.stats);persist();sfx('whoosh');view({mode:'task',size:selectedSize,arrive:true,progress:0});task();});go.append(ibPlaceholder('play'),n('span','','LET’S GO'));dp.append(go);
 }
 function reward(run,t,independent){
  const stat=a.stats[t.w]||(a.stats[t.w]={exact:0,misses:0,helped:0});if(independent)stat.exact++;else stat.helped++;
  const gain=settleWord(a,t,!t.assisted&&!t.errors);S.parts=(S.parts||0)+gain;run.tokens+=gain;partsEl.lastChild.textContent=S.parts;return gain;
 }

 function task(){
  const run=a.run;if(!run)return menu();if(run.completed)return result();
  const latch=Math.floor(run.verified.length/10);if(latch>run.latch){run.latch=latch;persist();return checkpoint();}
  reset('task');const stamp=epoch,t=run.queue[run.cursor],w=WORDS[t.w];view({mode:'task',size:run.size,progress:run.verified.length/run.size,streak:run.streak,open:false,arrive:false});
  if(window.AirdropClues)d.append(AirdropClues.render(t.w,assets));
  const top=n('div','air-tasktop');top.append(ib('pause','Pause drop',pause),n('strong','',run.verified.length+' / '+run.size));const charge=n('div','air-charge');for(let i=0;i<3;i++)charge.append(n('i',i<a.combo.count?'on':''));const misses=n('span','air-errorcount','× '+(run.incorrect||0));misses.setAttribute('aria-label','Incorrect attempts: '+(run.incorrect||0));top.append(charge,misses,ib('speaker','Hear the word',()=>say(w.word,true)));dp.append(top);
  const name=n('div','air-taskname',({hunt:'FIND THE SIGNAL',ink:'WRITE THE CODE',ink_context:'MESSAGE INCOMING',ink_copy:'TRACE THE CODE',ink_memory:'REMEMBER IT'})[t.kind]);dp.append(name);
  const feedback=littleStatus('');feedback.classList.add('air-feedback');
  let locked=false,chosen=t.selected||[],options=t.options;
  function paintErrors(){[...charge.children].forEach((bar,i)=>bar.classList.toggle('on',i<a.combo.count));misses.textContent='× '+(run.incorrect||0);misses.setAttribute('aria-label','Incorrect attempts: '+(run.incorrect||0));}
  const independent=()=>['ink','ink_context'].includes(t.kind)&&!t.assisted;
  function success(){
   if(locked||!live()||stamp!==epoch)return;
   if(t.kind!=='hunt'&&!AirdropLetters.complete(t,w.word))return;
   locked=true;
   const exact=independent(),gain=reward(run,t,exact);run.streak=exact?(run.streak||0)+1:run.streak||0;
   advance(run,true,exact);if(run.completed&&run.verified.length===run.size&&!run.stamped){a.completed[run.size]=(a.completed[run.size]||0)+1;run.stamped=true;}persist();
   top.querySelector('strong').textContent=run.verified.length+' / '+run.size;
   [...charge.children].forEach((bar,i)=>bar.classList.toggle('on',i<(gain?3:a.combo.count)));
   name.textContent=exact?'LOCKED IN!':'NICE!';feedback.textContent=gain?'+2 🔧':exact?'✓':'↻';feedback.classList.add('good');post({type:'correct',streak:run.streak});if(gain){post({type:'launch'});name.textContent='COMBO!';feedback.textContent='+2 🔧';}sfx(exact?'good':'pin');
   dp.classList.add('air-win');taskTimer=setTimeout(()=>{dp.classList.remove('air-win');if(live()&&stamp===epoch)task();},650);
  }
  function wrong(){
   if(locked)return;t.attempts++;recordError(a,run,t);paintErrors();persist();sfx('tap');feedback.classList.remove('good');feedback.textContent='Try again';name.classList.remove('air-nudge');void name.offsetWidth;name.classList.add('air-nudge');
   if(t.attempts>=2)showWord();
  }
  function showWord(){t.assisted=true;breakCombo(a);paintErrors();persist();feedback.replaceChildren(n('strong','air-answer',w.word));voice(w.word);}
  function helpRow(){const row=n('div','air-help');row.append(ib('eye','Show the word',showWord),ib('speaker','Hear a sentence',()=>say(w.sentence,true)),ib('clock','Practise this word later',()=>{if(locked)return;locked=true;breakCombo(a);run.streak=0;advance(run,false,false);persist();task();}));dp.append(row);}
  if(t.kind==='hunt'){
   if(!options){options=randomized([w.word,w.damaged,ALL.find(other=>other!==w.word&&other.length===w.word.length)||'signal']);if(new Set(options).size!==3)options=[w.word,w.damaged,'signal'];t.options=options;persist();}
   const arena=n('div','air-hunt');const cross=n('span','air-cross','⌖');arena.append(cross);
   options.forEach((word,i)=>{const pod=b(word,'air-pod pod'+i,()=>{if(locked)return;post({type:'snap'});if(word===w.word){pod.classList.add('hit');success();}else{pod.classList.add('miss');wrong();}});pod.setAttribute('aria-label','Target '+word);arena.append(pod);});dp.append(arena,feedback);helpRow();
  }else{
   AirdropInk.enable();
   t.letters=AirdropLetters.receipts(t,w.word);persist();
   let pad,hasInk=false,rejectionTimer=null,pendingBad=null,readerState=AirdropInk.reader.state;
   const trace=t.kind==='ink_copy';let hintLetter;
   name.textContent=trace?'TRACE EACH LETTER':'SPELL IT';
   dp.append(n('div','air-writeprompt','Tap 🔊. Write one letter at a time.'));
   const modelWord=n('div','air-modelword',trace||t.kind==='ink_memory'?w.word:'');dp.append(modelWord);
   const slots=n('div','air-wordslots');slots.setAttribute('aria-label','Your spelling');dp.append(slots);
   const arena=n('div','air-inkarea'),preview=littleStatus('');preview.classList.add('air-inkpreview');dp.append(arena,preview);
   const actions=n('div','air-inkactions');
   const check=ib('check','Read this letter',()=>{if(!locked)pad.read();},'air-stamp');check.disabled=true;
   const retryReader=b('RETRY READER','air-outline',()=>AirdropInk.enable(true));retryReader.hidden=true;
   const index=()=>t.letters.length;
   const key=()=>player+':'+run.started+':'+run.cursor+':'+t.w+':letter:'+index();
   const ghost=()=>trace||t.letterHint===index()?w.word[index()]||'':'';
   function paintSlots(){
    slots.replaceChildren();for(let i=0;i<w.word.length;i++){const tile=n('span',i<index()?'done':i===index()?'current':'',i<index()?t.letters[i].letter:i===index()&&t.letterHint===i?w.word[i]:'');tile.setAttribute('aria-label',i<index()?'Letter '+(i+1)+': '+t.letters[i].letter:i===index()?'Write letter '+(i+1):'Letter '+(i+1));slots.append(tile);}
    if(hintLetter)hintLetter.disabled=locked||trace||index()>=w.word.length||t.letterHint===index();
   }
   function updateCheck(){check.disabled=locked||!hasInk||readerState!=='ready';}

   function rejectNow(){
    clearTimeout(rejectionTimer);rejectionTimer=null;
    if(!pendingBad||locked||!live()||stamp!==epoch)return;
    const label=pendingBad.letter;pendingBad=null;recordError(a,run,t);persist();paintErrors();
    pad.next(key(),ghost());feedback.classList.remove('good');feedback.textContent=t.errors>=2?'Try a capital letter':label?'↻ '+label.toUpperCase():'↻ Try again';sfx('tap');
   }
   function rejectSoon(prediction){
    clearTimeout(rejectionTimer);pendingBad=prediction||{};
    preview.textContent=prediction?.letter?'I read '+prediction.letter.toUpperCase(): 'Try again';
    // Briefly allow another stroke (dot/crossbar). New ink cancels this result.
    rejectionTimer=setTimeout(rejectNow,450);
   }
   pad=AirdropInk.createPad(arena,{
    key:key(),ghost:ghost(),
    onChange:ink=>{hasInk=ink;if(readerState==='unclear'&&AirdropInk.reader.state==='ready')readerState='ready';updateCheck();},
    onRead:prediction=>{
     if(locked||!live()||stamp!==epoch)return;
     if(!prediction){clearTimeout(rejectionTimer);rejectionTimer=null;pendingBad=null;if(readerState==='ready')preview.textContent='';return;}
     if(!AirdropLetters.reliable(prediction)){rejectSoon(null);return;}
     if(!AirdropLetters.record(t,w.word,prediction)){rejectSoon(prediction);return;}
     persist();paintSlots();sfx('tick');post({type:'snap'});
     feedback.textContent='✓ '+prediction.letter.toUpperCase();feedback.classList.add('good');
     if(AirdropLetters.complete(t,w.word)){pad.finish();success();return;}
     pad.next(key(),ghost());
    },
    onState:state=>{
     readerState=state;updateCheck();preview.classList.toggle('reading',state==='reading');
     preview.setAttribute('aria-busy',String(state==='reading'||state==='loading'));retryReader.hidden=state!=='error';
     if(state==='loading')preview.textContent='Loading letter reader…';
     if(state==='error')preview.textContent='Reader unavailable. Tap retry.';
     if(state==='unclear'&&pad)rejectSoon(null);
     if(state==='ready'&&!hasInk)preview.textContent='';
    }
   });
   actions.append(ib('undo','Undo stroke',()=>{if(!locked)pad.undo();}),ib('eraser','Clear this letter',()=>{if(locked)return;if(pendingBad)rejectNow();else pad.clear();}),check);dp.append(actions,retryReader,feedback);
   const hint=n('div','air-inkhelp');hintLetter=ib('eye','Hint one letter (+1 error)',()=>{
    if(locked||trace||t.letterHint===index()||index()>=w.word.length)return;
    clearTimeout(rejectionTimer);rejectionTimer=null;pendingBad=null;
    t.letterHint=index();recordError(a,run,t);pad.next(key(),ghost());paintSlots();paintErrors();persist();
    feedback.classList.remove('good');feedback.textContent='Hint: '+w.word[index()].toUpperCase()+' · +1 ×';sfx('tap');
   });hint.append(hintLetter,ib('speaker','Hear a sentence',()=>say(w.sentence,true)),ib('clock','Practise this word later',()=>{
    if(locked)return;locked=true;pad.finish();t.assisted=true;run.streak=0;breakCombo(a);advance(run,false,false);persist();task();
   }));dp.append(hint);paintSlots();
   taskCleanup=()=>{clearTimeout(rejectionTimer);pad.destroy();};
   if(t.kind==='ink_memory')taskTimer=setTimeout(()=>{if(live()&&stamp===epoch&&!trace)modelWord.textContent='';},2200);
   // A refresh after the last validated letter can safely finish the saved word.
   if(AirdropLetters.complete(t,w.word)){pad.finish();success();}

  }

  setBack(pause);voice(t.kind==='ink_context'?w.sentence+' '+w.word:w.word);
 }
 function checkpoint(){
  reset('checkpoint');view({mode:'reward',size:a.run.size,open:true,arrive:false});post({type:'launch'});intro('Latch open! Send the next packet?');
  const rings=n('div','air-checkpoint');rings.append(n('strong','',a.run.verified.length+' / '+a.run.size),n('span','','✓'));dp.append(rings);
  const go=b('','air-go',task);go.append(ibPlaceholder('play'),n('span','','NEXT PACKET'));dp.append(go,ib('home','Pause and return to drops',menu));sfx('card');
 }
 function pause(){reset('pause');view({mode:'task',size:a.run.size});intro('Saved. Your cargo can wait.');const p=n('div','air-checkpoint');p.append(ibPlaceholder('pause'),n('strong','',a.run.verified.length+' / '+a.run.size));dp.append(p);const go=b('','air-go',task);go.append(ibPlaceholder('play'),n('span','','CONTINUE'));dp.append(go,b('AIR DROPS','air-outline',menu));persist();}
 function result(){
  reset('result');const r=a.run;view({mode:'reward',size:r.size,open:true,arrive:false});post({type:'launch'});intro(r.parked.length?'Good work. A few codes need another look.':'That’s our delivery!');
  dp.append(n('div','air-resultstamp',r.parked.length?'RECOVERED':'CLEARED!'));
  const row=n('div','air-resultstats');[[r.verified.length+'/'+r.size,'✓'],['+'+r.tokens,'🔧'],[r.incorrect||0,'×']].forEach(([v,icon])=>{const cell=n('div');cell.append(n('strong','',v),n('span','',icon));row.append(cell);});dp.append(row);
  if(r.parked.length)dp.append(b('↻ '+r.parked.length,'air-outline',()=>{r.queue.push(...randomized(r.parked).map(w=>({w,kind:'ink',assisted:false,attempts:0,retry:0})));r.completed=false;persist();task();}));
  const go=b('','air-go',menu);go.append(ibPlaceholder('play'),n('span','','ANOTHER DROP'));dp.append(go);sfx('card');
 }
 persist();menu();
 return ()=>{active=false;epoch++;clearTimeout(taskTimer);stopSpeech();taskCleanup?.();window.removeEventListener('message',onMessage);d.querySelector('.air-clue')?.remove();dp.classList.remove('air-win');d.classList.remove('air-task');fr.title='3D gate';if(wasTheme)Snd.theme(true);};
};
})();
