/* =========================================================
   Episode 9 · The Cage of Light · drill engine + parts 1-3
   Loaded before the main script. Everything below only touches
   the main script's globals (el, S, play, cam, earn, sprint…)
   from inside functions, after the page has booted.
   ========================================================= */
var E9ON=false;

/* ---------- content ---------- */
const E9_CH=[
 {name:'THE TOWER',hook:['Who watches from the ','tower','?'],shot:'e9_tower'},
 {name:'THE LIFT',hook:['What waits at the ','top','?'],shot:'e9_lift'},
 {name:'THE CAGE',hook:['Who is in the ','cage','?'],shot:'e9_gate3'},
 {name:'THE CROWN',hook:['Who steps out of the ','door','?'],shot:'e9_bang'}
];
const E9_SLOW=2.6;/* slow reader: every timer is stretched */
const E9_MUST=[['city','face'],['city','giant'],['cage','face'],['giant','cage']];
const E9_SHOT={
 e9_tower:[4,62,42,1240,1330], e9_guards:[4,1190,42,1310,1330],
 e9_lift:[5,62,42,1110,1330], e9_door:[5,1110,42,1390,580], e9_gate:[5,995,625,1505,750],
 e9_gate3:[6,62,42,2440,680], e9_cage:[6,62,690,1290,680], e9_face:[6,1280,620,1220,750],
 e9_bang:[7,60,40,1295,680], e9_bug:[7,1380,40,1115,680], e9_red:[7,60,700,1250,680], e9_king:[7,1250,700,1260,680]
};
const E9_BANK=[
 ["A red light burns on top of the tall tower.","Finn looks up at the dark city.","Nara holds up a glowing card.","Two guards stand by the big door.","The guards stare at her face.","Kip and Toby stay close to Finn.","The door opens and warm light spills out.","Nara says, Come with me and do not stop.","The tower is the tallest thing in the city.","Finn feels the cold air on his face."],
 ["They step into a glass lift.","The lift goes up, up, up.","Finn sees the whole city below him.","Sky ships race past like birds.","The lift stops and the doors open.","A dark hall waits at the top.","A giant gate stands in the hall.","It looks just like the gate in the woods.","Toby presses his nose on the glass.","Kip holds the rail with both hands."],
 ["Thick vines curl all over the giant gate.","Nara walks in front and does not look back.","A tiny red bug sits on her back.","A cage of blue light glows in the dark.","A man sits inside the cage with his head down.","The man looks up, and he has Finn's face.","His face is stern, and his eyes say, Go back.","Finn grips the bars of the cage.","Kip hides behind a big pipe.","Toby gives one low growl."]
,
 ["BANG! A giant door slams shut.","Finn spins around to face the sound.","Nara pulls them close to the wall.","Finn finds a tiny blue bug in his hand.","Kip looks scared and his eyes go wide.","The bug glows like a little star.","Toby turns his face to the dark hall.","The red gate hums and the cage glows.","A tall man with a crown steps in.","His red bugs fly across to his hand.","Soldiers march out and fill the place.","He rules the whole city from the tower."]
];
/* sound pools: soft c = /s/, hard c = /k/, soft g = /j/, hard g = /g/ */
const E9W={
 cS:['city','face','ice','nice','rice','mice','race','place','space','dance','cent','cell','fence','pencil','lace'],
 cH:['cat','cup','cap','cold','cake','camp','car','corn','cut','can','coat','cow','candy','comb','cost'],
 gS:['giant','cage','page','gem','huge','stage','age','gym','magic','large','change','germ','giraffe','gentle','energy'],
 gH:['go','get','goat','gift','game','gate','girl','give','gum','gas','bag','dog','pig','flag','green'],
 tricky:['get','give','girl','gift','begin']
};
const E9_SPOTS={
 0:[
  {q:'the red light',shot:'e9_tower',spots:[[683,150,100]]},
  {q:'the city',w:'city',shot:'e9_tower',spots:[[330,520,210],[1090,610,180]]},
  {q:"Kip's purple head",shot:'e9_tower',spots:[[690,1180,85]]},
  {q:'the dog',shot:'e9_tower',spots:[[830,1130,140]]},
  {q:'the two guards',shot:'e9_guards',spots:[[1440,840,175],[1600,850,175]]},
  {q:"Nara's face",w:'face',shot:'e9_guards',spots:[[2010,760,85]]},
  {q:'the glowing card',shot:'e9_guards',spots:[[1840,790,75]]},
  {q:'the warm light',shot:'e9_guards',spots:[[2010,560,200]]}],
 2:[
  {q:'the red bug on Nara',shot:'e9_gate3',spots:[[764,416,75]]},
  {q:'the giant gate',w:'giant',shot:'e9_gate3',spots:[[1290,330,260]]},
  {q:'the cage',w:'cage',shot:'e9_cage',spots:[[1000,1040,330]]},
  {q:'the man in the cage',shot:'e9_cage',spots:[[1010,980,150]]},
  {q:'the dog',shot:'e9_cage',spots:[[620,1190,120]]},
  {q:"Kip's yellow eyes",shot:'e9_cage',spots:[[280,1120,110]]},
  {q:"the man's face",w:'face',shot:'e9_face',spots:[[1790,950,190]]},
  {q:'the red bug again',shot:'e9_face',spots:[[2380,1085,100]]}],
3:[
  {q:'the giant door',w:'giant',shot:'e9_bang',spots:[[580,380,230]]},
  {q:"Nara's face",w:'face',shot:'e9_bang',spots:[[830,360,75]]},
  {q:"Kip's purple head",shot:'e9_bang',spots:[[705,505,65]]},
  {q:'the dog',shot:'e9_bang',spots:[[610,600,95]]},
  {q:'the glowing blue bug',shot:'e9_bug',spots:[[1950,390,95]]},
  {q:"Finn's face",w:'face',shot:'e9_bug',spots:[[1690,184,115]]},
  {q:"Kip's yellow eye",shot:'e9_bug',spots:[[2130,250,100]]},
  {q:'the giant red gate',w:'giant',shot:'e9_red',spots:[[500,890,220]]},
  {q:'the red cage',w:'cage',shot:'e9_red',spots:[[860,1000,150]]},
  {q:'the man with the crown',shot:'e9_king',spots:[[1960,880,130]]},
  {q:'the red bugs',shot:'e9_king',spots:[[1600,870,85],[1775,880,65]]},
  {q:'the soldiers',shot:'e9_king',spots:[[2300,990,200]]}]
};
const E9_ORDER=[
 ["They step into a glass lift.","The lift goes up, up, up.","The doors open at the top."],
 ["Finn sees the city get small.","A sky ship flies past the glass.","The lift stops with a bump."],
 ["The doors open on a dark hall.","Finn sees a giant gate.","Finn says it looks just like their gate."]
];
const E9_FILL=[
 {s:'From the lift, Finn sees the whole ___.',w:'city',f:['cat','cup']},
 {s:'A ___ gate stands at the end of the hall.',w:'giant',f:['green','gray']},
 {s:'Sky ships ___ past the glass.',w:'race',f:['rock','rope']},
 {s:'A tiny blue ___ glows on the wall.',w:'gem',f:['gum','game']},
 {s:"Finn's ___ is full of surprise.",w:'face',f:['fan','fog']},
 {s:'The lift is like a tall glass ___.',w:'cage',f:['cake','cap']},
 {s:'The lift is a big, strong, ___ box.',w:'huge',f:['hug','hut']},
 {s:'Kip makes a funny ___ at Toby.',w:'face',f:['fat','fog']}
];

/* ---------- css ---------- */
(function(){const s=document.createElement('style');s.textContent=`
.e9hud{display:flex;align-items:center;gap:8px;font:700 11px var(--bd);letter-spacing:.12em;text-transform:uppercase;color:var(--teal)}
.e9hud .pips{display:flex;gap:3px;flex:1}.e9hud .pip{height:8px;flex:1;background:#27304f;border:1px solid #000}.e9hud .pip.on{background:var(--good)}.e9hud .pip.bad{background:var(--red)}.e9hud .pip.cur{background:var(--yellow)}
.e9hud .st{color:var(--yellow);min-width:44px;text-align:right}
.e9tag{font:400 22px var(--hd);letter-spacing:.05em;color:var(--ink);background:var(--yellow);align-self:flex-start;padding:1px 12px 1px 9px;clip-path:polygon(0 0,100% 0,calc(100% - 8px) 100%,0 100%)}
.e9sub{font:700 13px var(--bd);color:#9aa7d6;margin-top:-4px}
.e9ring{height:7px;background:#27304f;overflow:hidden;border:1px solid #000;flex:none}.e9ring i{display:block;height:100%;background:var(--yellow);transform-origin:left;animation:e9r linear forwards}
@keyframes e9r{from{transform:scaleX(1)}to{transform:scaleX(0)}}
.e9ring.hot i{background:var(--red)}
.e9word{align-self:center;font:800 clamp(44px,15vw,64px)/1 var(--bd);color:var(--paper);background:#10162c;border:3px solid #000;box-shadow:5px 5px 0 #000;padding:12px 26px 14px;margin:6px 0;letter-spacing:.01em;touch-action:none;user-select:none}
.e9word.shake,.e9opt.shake{animation:e9sh .35s}
@keyframes e9sh{20%{transform:translateX(-9px)}40%{transform:translateX(9px)}60%{transform:translateX(-6px)}80%{transform:translateX(5px)}}
.e9bins{display:flex;gap:10px;margin-top:auto}
.e9bin{flex:1;font:400 26px var(--hd);letter-spacing:.04em;color:var(--ink);background:var(--paper);border:3px solid #000;box-shadow:4px 4px 0 #000;padding:10px 6px 12px;line-height:1.05}
.e9bin small{display:block;font:700 12px var(--bd);letter-spacing:.06em;margin-top:4px;opacity:.7}
.e9bin.s{background:#9be8ff}.e9bin.h{background:#ffd23f}.e9bin.good{background:#c9ffcf;animation:hit .3s}.e9bin.bad{background:#ff8f98}
.e9opts{display:flex;flex-direction:column;gap:9px;margin-top:2px}
.e9opts.row{flex-direction:row;flex-wrap:wrap}.e9opts.row .e9opt{flex:1 1 42%}
.e9opt{font:800 clamp(22px,6.4vw,30px)/1.15 var(--bd);color:var(--ink);background:var(--paper);border:3px solid #000;box-shadow:4px 4px 0 #000;padding:11px 12px 12px;text-align:center}
.e9opt.good{background:#c9ffcf;animation:hit .3s}.e9opt.bad{background:#ff8f98;color:#5a0010}.e9opt.dim{opacity:.4}
.e9msg{min-height:22px;font:700 15px var(--bd);color:var(--yellow)}
.e9say{align-self:center;font:700 16px var(--bd);color:var(--paper);background:none;border:2px dashed #55618f;padding:8px 18px}
.e9jam{position:absolute;inset:0;z-index:5;background:rgba(13,18,32,.9);display:flex;align-items:center;justify-content:center;text-align:center;font:400 34px/1.1 var(--hd);color:var(--red);letter-spacing:.04em;padding:20px}
.e9res{display:flex;flex-direction:column;gap:10px;align-items:stretch}
.e9stars{font:400 64px/1 var(--hd);letter-spacing:.1em;color:var(--yellow);-webkit-text-stroke:3px #000;paint-order:stroke fill;text-shadow:4px 4px 0 #000;text-align:center}
.e9stars s{text-decoration:none;color:#2a3354}
.e9stat{display:flex;justify-content:space-between;font:700 15px var(--bd);color:var(--paper);border-bottom:2px dashed #2a3354;padding:4px 0}
.e9stat b{color:var(--yellow)}
.e9big{font:400 26px var(--hd);letter-spacing:.04em;color:var(--paper);text-align:center}
.e9row{display:flex;gap:10px}.e9row .go{margin-top:0;flex:1;padding:10px 10px;font-size:24px}
.e9lane{position:relative;flex:1;min-height:230px;border:3px solid #000;background:linear-gradient(180deg,#0a1226,#17224a);overflow:hidden;touch-action:none}
.e9chip{position:absolute;top:0;left:0;font:800 22px var(--bd);color:var(--ink);background:var(--paper);border:3px solid #000;box-shadow:3px 3px 0 #000;padding:6px 12px;white-space:nowrap;will-change:transform;user-select:none}
.e9chip.hit{background:#c9ffcf}.e9chip.bad{background:#ff8f98}
.e9floor{position:absolute;right:6px;top:6px;font:400 22px var(--hd);color:var(--yellow);-webkit-text-stroke:2px #000;paint-order:stroke fill;z-index:2}
.e9bars{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
.e9bar{font:800 clamp(17px,5vw,23px)/1.1 var(--bd);color:#dff8ff;background:linear-gradient(180deg,rgba(60,200,255,.55),rgba(30,120,200,.35));border:3px solid #8fe6ff;box-shadow:0 0 12px rgba(90,210,255,.7);padding:26px 4px;text-align:center;min-height:86px;display:flex;align-items:center;justify-content:center}
.e9bar.off{opacity:.18;box-shadow:none;border-color:#234;pointer-events:none}
.e9bar.bad{border-color:var(--red);background:rgba(255,59,78,.5);color:#fff}
.e9bar.show{border-color:var(--yellow);box-shadow:0 0 14px var(--yellow)}
.e9tiles{display:flex;gap:7px;justify-content:center;flex-wrap:wrap}
.e9tile{font:800 30px var(--bd);width:48px;height:54px;color:var(--ink);background:var(--paper);border:3px solid #000;box-shadow:3px 3px 0 #000;padding:0}
.e9tile.used{opacity:.25;pointer-events:none}.e9tile.shake{animation:e9sh .35s}
.e9slots{display:flex;gap:6px;justify-content:center;margin:6px 0}
.e9slot{width:46px;height:56px;border-bottom:5px solid var(--yellow);font:800 36px/56px var(--bd);text-align:center;color:var(--good)}
.e9strip{font:700 clamp(17px,5vw,21px)/1.25 var(--bd);text-align:left;color:var(--ink);background:var(--paper);border:3px solid #000;box-shadow:4px 4px 0 #000;padding:10px 12px;position:relative}
.e9strip b{position:absolute;right:8px;top:6px;font:400 26px var(--hd);color:#0b8a2d}
.e9strip.done{background:#c9ffcf}
.e9ping{position:absolute;width:70px;height:70px;margin:-35px 0 0 -35px;border-radius:50%;border:6px solid var(--red);pointer-events:none;animation:e9p .5s ease-out forwards}
.e9ping.ok{border-color:var(--good)}.e9ping.hint{border-color:var(--yellow);animation-iteration-count:3}
@keyframes e9p{from{transform:scale(.4);opacity:1}to{transform:scale(1.5);opacity:0}}
.e9card{flex:1;background:var(--paper);color:var(--ink);border:3px solid #000;box-shadow:5px 5px 0 #000;padding:16px 6px;text-align:center;font:400 38px var(--hd);transform:rotate(-2deg)}
.e9card small{display:block;font:700 11px var(--bd);letter-spacing:.12em;color:#0a8f84;margin-top:4px}
`;document.head.append(s);})();

/* ---------- state ---------- */
const w9=ms=>{const t=RUN;return new Promise((res,rej)=>setTimeout(()=>t===RUN?res():rej('cancel'),ms));};
const e9pick=a=>a[Math.floor(Math.random()*a.length)];
function e9S(){if(!S.e9)S.e9={ch:0,earned:[],best:{},words:{},open:null,done:{}};if(!S.e9.done)S.e9.done={};return S.e9;}
function e9Rec(w,ok,type){if(!w)return;const E=e9S(),m=E.words[w]||(E.words[w]={a:0,c:0,t:[],last:null});m.a++;if(ok){m.c++;if(!m.t.includes(type))m.t.push(type);}m.last=ok;}
/* weak words first: unseen=2, last-missed=3, shaky=1, mastered(3 right in 2+ drill types)=0 */
function e9Weak(w){const m=e9S().words[w];if(!m)return 2;if(m.last===false)return 3;return m.c>=3&&m.t.length>=2?0:1;}
function e9Pick(pool,n,rev=[]){
  let a=pool.map(w=>({w,k:e9Weak(w)+Math.random()*1.4})).sort((x,y)=>y.k-x.k).slice(0,n).map(x=>x.w);
  rev.forEach(w=>{if(!a.includes(w)&&e9Weak(w)>=3)a[a.length-1]=w;});
  return shuffle(a);
}
const e9stars=n=>'★'.repeat(n)+'<s>'+'★'.repeat(3-n)+'</s>';
function e9Mast(words){const E=e9S();return words.filter(w=>{const m=E.words[w];return m&&m.c>=3&&m.t.length>=2;}).length;}

/* ---------- the engine ---------- */
/* cfg: {id,title,sub,items(),render(it,box,st,api),limit,fast,ladder,hardItems()} */
async function e9Run(cfg){
  const E=e9S();
  if(E.done[cfg.id])return;
  for(;;){
    const out=await e9Once(cfg);
    if(out!=='again')break;
  }
  E.done[cfg.id]=1;save();
}
async function e9Once(cfg){
  const E=e9S();
  const tr=$('#tray');if(tr)tr.style.visibility='hidden';
  let st=E.open&&E.open.id===cfg.id?E.open:null;
  if(!st){
    st={id:cfg.id,q:cfg.items().map(x=>({...x})),total:0,h:0,m:0,streak:0,best:0,rush:0,ass:false,ms:0,n:0,pts:0,hard:false,flip:Math.random()<.5,cm:0,lockUntil:0,idle:0};
    st.total=st.q.length;E.open=st;save();
  }
  play.replaceChildren();
  const tag=el('div','e9tag',cfg.title);play.append(tag);
  if(cfg.sub)play.append(el('div','e9sub',cfg.sub));
  const hud=el('div','e9hud'),pips=el('div','pips'),stEl=el('div','st','');hud.append(pips,stEl);play.append(hud);
  const box=el('div','');box.style.cssText='position:relative;flex:1;display:flex;flex-direction:column;gap:10px;min-height:0;padding-bottom:6px';play.append(box);
  const paint=()=>{pips.replaceChildren();const done=st.total-st.q.length;for(let i=0;i<st.total;i++){const p=el('div','pip'+(i<done?' on':''));pips.append(p);}
    stEl.textContent=(st.streak>=3?'🔥'+st.streak:'')+(st.hard?' ⚡':'')+(st.ass?' 🛟':'');};
  const api={cfg,st,box,
    locked:()=>Date.now()<st.lockUntil,
    lock(ms,msg){st.lockUntil=Date.now()+ms;const j=el('div','e9jam',msg);box.append(j);setTimeout(()=>j.remove(),ms);sfx('zap');},
    /* a wrong answer given suspiciously fast, twice in a row = random tapping */
    judgeRush(ms,ok){if(ok){st.rush=0;return;}if(ms<380){st.rush++;if(st.rush>=2){st.rush=0;api.lock(2600,'LOOK FIRST!\nTap again slowly');}}else st.rush=0;},
    ring(ms,onEnd){ms=Math.round(ms*E9_SLOW);const r=el('div','e9ring');const i=el('i');i.style.animationDuration=ms+'ms';r.append(i);box.prepend(r);let t=setTimeout(()=>{r.classList.add('hot');},ms*.65);let t2=setTimeout(()=>onEnd&&onEnd(),ms);return()=>{clearTimeout(t);clearTimeout(t2);r.remove();};}
  };
  const t0all=Date.now();
  while(st.q.length){
    paint();box.replaceChildren();
    const it=st.q.shift();window.E9CUR=it;
    let r;
    try{r=await cfg.render(it,box,st,api);}catch(e){if(e==='cancel')throw e;console.error(e);r={h:0,m:0,ms:0};}
    st.h+=r.h||0;st.m+=r.m||0;st.ms+=r.ms||0;st.n++;
    (r.words||[]).forEach(([w,ok])=>e9Rec(w,ok,cfg.type));
    const clean=(r.m||0)===0;
    if(clean){st.streak++;st.best=Math.max(st.best,st.streak);st.cm=0;
      const lim=cfg.limit||8000;st.pts+=Math.round((100+Math.min(st.streak,10)*10+Math.max(0,(lim-(r.ms||lim))/lim*50))*(st.hard?1.5:1));}
    else{st.streak=0;st.cm++;
      if(st.cm>=3&&!st.ass){st.ass=true;pop('EASIER MODE','#9be8ff');}
      if((it.rep||0)<2&&!r.noRepeat){it.rep=(it.rep||0)+1;st.q.splice(Math.min(st.q.length,2+Math.floor(Math.random()*2)),0,it);st.total++;}
    }
    /* the arrogance ladder: five clean, quick answers in a row unlocks HARD for the rest */
    if(cfg.ladder&&!st.hard&&!st.ass&&st.n>=5&&st.streak>=5&&st.ms/st.n<(cfg.fast||3000)*.8&&cfg.hardItems){
      st.hard=true;const extra=cfg.hardItems().map(x=>({...x,hard:1}));st.q.push(...extra);st.total+=extra.length;pop('HARD MODE ⚡','#ff9a4a');sfx('whoosh');}
    E.open=st;save();
  }
  /* settle */
  const judged=st.h+st.m,acc=judged?st.h/judged:0,avg=st.n?st.ms/st.n:0;
  let stars=acc>=.95?3:acc>=.85?2:acc>=.6?1:0;
  if(stars===3&&cfg.fast&&avg>cfg.fast)stars=2;
  if(st.ass)stars=Math.min(stars,1);
  const prev=E.best[cfg.id]||{stars:0,pts:0};
  const gain=Math.max(0,stars-prev.stars),bestPts=Math.max(prev.pts,st.pts),newBest=st.pts>prev.pts&&prev.pts>0;
  E.best[cfg.id]={stars:Math.max(stars,prev.stars),pts:bestPts};
  E.open=null;save();
  if(stars===3&&prev.stars<3)earn(1);
  return await e9Result(cfg,{st,stars,acc,gain,prev,newBest,avg});
}
function e9Result(cfg,R){
  return new Promise(res=>{
    const tr=$('#tray');if(tr)tr.style.visibility='hidden';
    play.replaceChildren();
    const {st,stars,acc}=R;
    play.append(el('div','e9tag',cfg.title+' · done'));
    const s=el('div','e9stars');s.innerHTML=e9stars(stars);play.append(s);
    if(stars>=2){sfx('good');burst(18);}else sfx('tick');
    const wrap=el('div','e9res');
    const row=(a,b)=>{const r=el('div','e9stat');r.append(el('span','',a));r.append(el('b','',b));wrap.append(r);};
    row('Right first time',st.h+' of '+(st.h+st.m)+' ('+Math.round(acc*100)+'%)');
    row('Best streak',String(st.best));
    row('Score',st.pts.toLocaleString()+(R.newBest?' · NEW BEST!':R.prev.pts?' · best '+R.prev.pts.toLocaleString():''));
    if(R.gain)row('New stars',('+'+R.gain+' ★'));
    play.append(wrap);
    let msg='';
    if(st.ass)msg='Easier mode was on, so 1 star is the most. Go again and beat it clean.';
    else if(stars===3)msg='Clean! Words you got wrong will come back in the next drill.';
    else if(stars===2)msg='So close. 95% right and fast earns 3 stars.';
    else if(stars===1)msg='These words need more reps. Go again, it is quick.';
    else msg='Not yet. Go again: the same words come back until they stick.';
    const m=el('div','e9msg',msg);m.style.minHeight='40px';play.append(m);
    const btns=el('div','e9row');
    const again=el('button','go alt',stars<3?'Go again ↻':'Practice ↻'),next=el('button','go','Next ▸');
    again.onclick=()=>{sfx('tick');res('again');};
    next.onclick=()=>{sfx('tick');res('next');};
    if(stars<3){btns.append(again,next);}else{btns.append(next,again);}
    play.append(btns);
  });
}

/* ---------- reusable choose-one item ---------- */
/* o: {head:Node, opts:[{t,ok,w}], cls, limit, why(opt) -> string, say} */
function e9Choose(box,api,o){
  return new Promise(res=>{
    const st=api.st,t0=performance.now();let done=false,wrongs=0;
    if(o.head)box.append(o.head);
    let opts=o.opts;
    if(st.ass&&opts.length>2){const wi=opts.findIndex(x=>!x.ok);opts=opts.filter((_,i)=>i!==wi);}
    opts=opts.slice();
    const msg=el('div','e9msg','');
    const list=el('div',o.cls||'e9opts');
    const els=opts.map(op=>{const b=el('button','e9opt',op.t);b.onclick=()=>pick(op,b);return b;});
    els.forEach(b=>list.append(b));
    if(o.say){const sb=el('button','e9say','🔊 Hear it');sb.onclick=()=>speak(o.say);box.append(sb);}
    box.append(list,msg);
    const lim=(o.limit||8000)*(st.ass?1.6:1)*(st.hard?.7:1);
    const stop=api.ring(lim,()=>finish(null,true));
    function finish(op,timeout){
      if(done)return;done=true;stop();
      const ms=Math.round(performance.now()-t0);
      const ok=!!op&&op.ok;
      if(timeout)st.idle++;
      api.judgeRush(ms,ok);
      els.forEach((b,i)=>{b.disabled=true;if(opts[i].ok)b.classList.add('good');else if(opts[i]===op)b.classList.add('bad');else b.classList.add('dim');});
      if(ok){sfx('good');burst(6);}else{sfx('zap');if(timeout)msg.textContent="Too slow. Here it is:";else if(o.why)msg.textContent=o.why(op);}
      const words=[[o.w||(opts.find(x=>x.ok)||{}).w,ok]];
      setTimeout(()=>res({h:ok?1:0,m:ok?0:1,ms,words,timeout}),ok?380:1500);
    }
    function pick(op,b){
      if(done||api.locked())return;
      finish(op,false);
    }
  });
}

/* ---------- drill: sort (swipe or tap a bin) ---------- */
function e9SortCfg(id,{soft,hard,labS,labH,egS,egH,n=12,title,sub,limit=5200,fast=2600,extraHard}){
  const mk=()=>{
    const a=e9Pick(soft,Math.ceil(n/2)).map(w=>({w,s:1})),b=e9Pick(hard,Math.floor(n/2)).map(w=>({w,s:0}));
    return shuffle(a.concat(b));
  };
  return {id,type:'sort',title,sub,limit,fast,ladder:true,
    items:mk,
    hardItems:()=>shuffle(e9Pick(soft,2).map(w=>({w,s:1})).concat(e9Pick(hard,2).map(w=>({w,s:0})))),
    async render(it,box,st,api){
      const flip=st.flip;
      const word=el('div','e9word',it.w);
      const bs=el('button','e9bin s',labS);bs.append(el('small','',egS));
      const bh=el('button','e9bin h',labH);bh.append(el('small','',egH));
      const bins=el('div','e9bins');bins.append(...(flip?[bh,bs]:[bs,bh]));
      const msg=el('div','e9msg','');
      box.append(word,msg,bins);
      return new Promise(res=>{
        let done=false;const t0=performance.now();
        const lim=limit*(st.ass?1.6:1)*(st.hard?.65:1);
        const stop=api.ring(lim,()=>finish(null,true));
        function finish(sideSoft,timeout){
          if(done)return;done=true;stop();
          const ms=Math.round(performance.now()-t0),ok=!timeout&&(sideSoft===!!it.s);
          api.judgeRush(ms,ok);
          (it.s?bs:bh).classList.add('good');
          if(!ok&&!timeout)(sideSoft?bs:bh).classList.add('bad');
          if(ok){sfx('good');burst(5);word.style.background='#c9ffcf';word.style.color='#0d1220';}
          else{sfx('zap');word.classList.add('shake');msg.textContent=timeout?'Too slow. It goes here:':it.w+' → '+(it.s?egS:egH);}
          setTimeout(()=>res({h:ok?1:0,m:ok?0:1,ms,words:[[it.w,ok]],timeout}),ok?330:1500);
        }
        const go=side=>{if(done||api.locked())return;finish(side,false);};
        bs.onclick=()=>go(true);bh.onclick=()=>go(false);
        let x0=null;
        word.addEventListener('pointerdown',e=>{x0=e.clientX;try{word.setPointerCapture(e.pointerId);}catch(_){}});
        word.addEventListener('pointerup',e=>{if(x0==null)return;const dx=e.clientX-x0;x0=null;if(Math.abs(dx)>50){const leftBin=flip?false:true;go(dx<0?leftBin:!leftBin);}});
      });
    }};
}

/* ---------- drill: hear it, pick the spelling ---------- */
function e9Foils(w){
  const f=new Set(),i=w.search(/[cg]/),L=w[i],after=w[i+1]||'';
  const soft=/[eiy]/.test(after);
  const sub=r=>w.slice(0,i)+r+w.slice(i+1);
  if(L==='c'){f.add(sub('k'));f.add(soft?sub('s'):sub('s'));}
  else{f.add(sub('j'));f.add(soft?sub('gh'):sub('k'));}
  f.delete(w);return [...f];
}
function e9HearCfg(id,{pool,n=8,title,sub}){
  return {id,type:'hear',title,sub,limit:9000,fast:8000,
    items:()=>e9Pick(pool,n).map(w=>({w})),
    async render(it,box,st,api){
      const head=el('div','e9big','Listen, then tap the right spelling');
      const opts=[{t:it.w,ok:1,w:it.w},...e9Foils(it.w).slice(0,2).map(t=>({t,ok:0}))];
      const out=e9Choose(box,api,{head,opts:shuffle(opts),cls:'e9opts',limit:9000,say:it.w,w:it.w,
        why:op=>'It sounds like “'+it.w+'”. See the letters.'});
      setTimeout(()=>speak(it.w),250);
      return out;
    }};
}

/* ---------- drill: fill the blank ---------- */
function e9FillCfg(id,{items,title,sub}){
  return {id,type:'fill',title,sub,limit:10000,fast:9000,
    items:()=>shuffle(items).slice(0,6),
    async render(it,box,st,api){
      const head=el('div','e9big',it.s.replace('___','______'));head.style.cssText+=';font:700 clamp(20px,6vw,26px)/1.3 var(--bd);text-align:left;color:var(--paper)';
      const opts=shuffle([{t:it.w,ok:1,w:it.w},...it.f.map(t=>({t,ok:0}))]);
      return e9Choose(box,api,{head,opts,limit:10000,w:it.w,why:()=>'“'+it.w+'” fits best.'});
    }};
}

/* ---------- drill: odd one out ---------- */
function e9OddCfg(id,{a,b,title,sub,n=6,ruleA,ruleB}){
  /* three from A + one from B; tap the odd one */
  return {id,type:'odd',title,sub,limit:9000,fast:8000,
    items:()=>Array.from({length:n},(_,i)=>{const flip=i%2?1:0,A=flip?b:a,B=flip?a:b;const as=e9Pick(A,3),od=e9Pick(B.filter(x=>!as.includes(x)),1)[0];return{as,od,rule:flip?ruleB:ruleA};}),
    async render(it,box,st,api){
      const head=el('div','e9big','Three say '+it.rule+'.\nTap the odd one out.');head.style.whiteSpace='pre-line';
      const opts=shuffle([...it.as.map(t=>({t,ok:0,w:t})),{t:it.od,ok:1,w:it.od}]);
      return e9Choose(box,api,{head,opts,cls:'e9opts row',limit:9000,w:it.od,why:()=>'“'+it.od+'” does not say '+it.rule+'.'});
    }};
}

/* ---------- drill: order the beats ---------- */
function e9OrderCfg(id,{sets,title,sub}){
  return {id,type:'order',title,sub,limit:22000,fast:22000,
    items:()=>shuffle(sets.map((lines,i)=>({lines,i}))),
    async render(it,box,st,api){
      const head=el('div','e9big','Tap the story in order');box.append(head);
      const list=el('div','e9opts');box.append(list);
      const msg=el('div','e9msg','');box.append(msg);
      return new Promise(res=>{
        let next=0,wrong=0,done=false;const t0=performance.now();
        const stop=api.ring((it.lim||22000)*(st.ass?1.6:1),()=>finish(true));
        const strips=shuffle(it.lines.map((t,i)=>({t,i}))).map(x=>{const b=el('button','e9strip',x.t);b.onclick=()=>{
          if(done||api.locked()||b.classList.contains('done'))return;
          if(x.i===next){next++;b.classList.add('done');b.append(el('b','',String(next)));sfx('pin');if(next===it.lines.length)finish(false);}
          else{wrong++;b.classList.add('shake');setTimeout(()=>b.classList.remove('shake'),400);sfx('zap');msg.textContent='Not yet. What happens first?';api.judgeRush(Math.round(performance.now()-t0)/Math.max(1,next+wrong),false);}
        };list.append(b);return b;});
        function finish(timeout){if(done)return;done=true;stop();const ms=Math.round(performance.now()-t0);
          if(timeout){strips.forEach((b,i)=>{});msg.textContent='Too slow. This is the order:';}
          const clean=!timeout&&wrong===0;if(clean){sfx('good');burst(8);}
          setTimeout(()=>res({h:clean?1:0,m:clean?0:1,ms,words:[],timeout,noRepeat:false}),clean?500:1400);}
      });
    }};
}

/* ---------- drill: build the word from tiles ---------- */
function e9BuildCfg(id,{pool,n=6,title,sub}){
  return {id,type:'build',title,sub,limit:26000,fast:22000,
    items:()=>e9Pick(pool,n).map(w=>({w})),
    async render(it,box,st,api){
      const w=it.w,letters=[...w];
      const dec=new Set();const i=w.search(/[cg]/),L=w[i];
      (L==='c'?['k','s']:['j','k']).forEach(x=>{if(!w.includes(x))dec.add(x);});
      const tiles=shuffle(letters.concat([...dec]).map((c,k)=>({c,k})));
      box.append(el('div','e9big','Hear it. Spell it.'));
      const sb=el('button','e9say','🔊 Hear it');sb.onclick=()=>speak(w);box.append(sb);
      const slots=el('div','e9slots');letters.forEach(()=>slots.append(el('div','e9slot','')));box.append(slots);
      const tray=el('div','e9tiles');box.append(tray);
      const msg=el('div','e9msg','');box.append(msg);
      setTimeout(()=>speak(w),250);
      return new Promise(res=>{
        let pos=0,wrong=0,done=false;const t0=performance.now();
        const stop=api.ring(26000*(st.ass?1.6:1),()=>finish(true));
        const tel=tiles.map(t=>{const b=el('button','e9tile',t.c);b.onclick=()=>{
          if(done||api.locked()||b.classList.contains('used'))return;
          if(t.c===letters[pos]){slots.children[pos].textContent=t.c;pos++;b.classList.add('used');sfx('tick');
            if(st.ass&&false){}
            if(pos===letters.length)finish(false);}
          else{wrong++;b.classList.add('shake');setTimeout(()=>b.classList.remove('shake'),400);sfx('zap');msg.textContent='Listen again. Which sound is next?';api.judgeRush(Math.round(performance.now()-t0)/Math.max(1,pos+wrong),false);}
        };tray.append(b);return b;});
        function finish(timeout){if(done)return;done=true;stop();const ms=Math.round(performance.now()-t0);
          if(timeout){[...w].forEach((c,k)=>{slots.children[k].textContent=c;slots.children[k].style.color='var(--yellow)';});msg.textContent='Too slow. It is spelled '+w+'.';}
          const clean=!timeout&&wrong===0;if(clean){sfx('good');burst(8);}
          setTimeout(()=>res({h:clean?1:0,m:clean?0:1,ms,words:[[w,clean]],timeout}),clean?500:1700);}
      });
    }};
}

/* ---------- drill: spot it in the picture ---------- */
function e9SpotCfg(id,{list,n=6,title,sub}){
  return {id,type:'spot',title,sub,limit:11000,fast:9000,
    items:()=>{const must=list.filter(x=>x.w),rest=list.filter(x=>!x.w);return shuffle(shuffle(must).concat(shuffle(rest)).slice(0,n)).map(x=>({q:x.q,w:x.w,shot:x.shot,spots:x.spots}));},
    async render(it,box,st,api){
      stageH(46);cam(it.shot,{dur:700});
      const head=el('div','e9big','');head.append('Tap ');const q=el('span','',it.q);q.style.color=it.w?'var(--yellow)':'var(--paper)';head.append(q);box.append(head);
      const msg=el('div','e9msg','Look at the picture above.');box.append(msg);
      return new Promise(res=>{
        let done=false,wrong=0;const t0=performance.now();
        const lim=limit(st);
        function limit(s){return 11000*(s.ass?1.6:1)*(s.hard?.7:1);}
        const stop=api.ring(lim,()=>finish(null,true));
        const hint=setTimeout(()=>{if(done)return;const c=it.spots[0];ping(c[0],c[1],'hint');st.hinted=1;},14000);
        const pt=e=>{const r=world.getBoundingClientRect(),sc=r.width/IW;return [(e.clientX-r.left)/sc,(e.clientY-r.top)/sc];};
        const sr=()=>stage.getBoundingClientRect();
        function ping(ax,ay,cls){const r=world.getBoundingClientRect(),sc=r.width/IW,s0=sr();const p=el('div','e9ping '+(cls||''));p.style.left=(r.left-s0.left+ax*sc)+'px';p.style.top=(r.top-s0.top+ay*sc)+'px';$('#fx').append(p);setTimeout(()=>p.remove(),1600);}
        const onDown=e=>{
          if(done)return;if(api.locked())return;
          const [ax,ay]=pt(e);const hit=it.spots.some(([x,y,r])=>Math.hypot(ax-x,ay-y)<=r);
          if(hit){ping(ax,ay,'ok');finish(true,false);}
          else{wrong++;ping(ax,ay);sfx('zap');msg.textContent=wrong>=2?'Look at the picture again.':'Not there.';api.judgeRush(Math.round(performance.now()-t0),false);
            if(wrong>=3)finish(false,false);}
        };
        stage.addEventListener('pointerdown',onDown);
        function finish(ok,timeout){
          if(done)return;done=true;stop();clearTimeout(hint);stage.removeEventListener('pointerdown',onDown);
          const ms=Math.round(performance.now()-t0),clean=ok&&wrong===0;
          if(ok&&wrong>0){msg.textContent='Found it, but you missed first.';}
          if(!ok){const c=it.spots[0];ping(c[0],c[1],'hint');msg.textContent=timeout?'Too slow. It was here:':'It was here:';sfx('zap');}
          else if(clean){sfx('good');burst(8);}
          setTimeout(()=>res({h:clean?1:0,m:clean?0:1,ms,words:it.w?[[it.w,clean]]:[],timeout}),clean?420:1600);
        }
      });
    }};
}

/* ---------- drill: lift climb (falling words) ---------- */
function e9CatchCfg(id,{soft,hard,n=16,title,sub}){
  return {id,type:'catch',title,sub,limit:60000,fast:0,
    items:()=>{const a=e9Pick(soft,n/2).map(w=>({w,t:1})),b=e9Pick(hard,n/2).map(w=>({w,t:0}));return [{words:shuffle(a.concat(b))}];},
    async render(it,box,st,api){
      stageH(36);cam('e9_lift',{dur:700});
      box.append(el('div','e9big','Tap only SOFT words: c = S or g = J'));
      const lane=el('div','e9lane');box.append(lane);
      const fl=el('div','e9floor','FLOOR 0');lane.append(fl);
      const msg=el('div','e9msg','Ignore the hard ones.');box.append(msg);
      return new Promise(res=>{
        const words=it.words.slice(),total=words.length;let h=0,m=0,floor=0,spawned=0,resolved=0,last=performance.now(),acc=0,over=false;
        const chips=[];let decoyTaps=[];const W=()=>lane.clientWidth||320,H=()=>lane.clientHeight||260;
        const speed=()=>((st.ass?85:st.hard?150:112)+floor*2.2)*.55;
        const words2=[];const mk=w=>{const c=el('div','e9chip',w.w);c.dataset.t=w.t;lane.append(c);const x=8+Math.random()*Math.max(10,W()-110);c._x=x;c._y=-40;c._w=w;c.style.transform=`translate(${x}px,-40px)`;
          const hit=ev=>{ev.preventDefault();if(c._d||api.locked()||over)return;c._d=1;
            if(w.t){h++;floor++;fl.textContent='FLOOR '+floor;c.classList.add('hit');sfx('tick');e9Rec(w.w,true,'catch');pop('+1');}
            else{m++;c.classList.add('bad');sfx('zap');e9Rec(w.w,false,'catch');msg.textContent=w.w+' is a hard word. Let it go.';
              const now=Date.now();decoyTaps=decoyTaps.filter(t=>now-t<2200);decoyTaps.push(now);if(decoyTaps.length>=3){decoyTaps=[];api.lock(2400,'ONLY SOFT WORDS!\nLook first');}}
            resolved++;setTimeout(()=>c.remove(),260);};
          c.addEventListener('pointerdown',hit);chips.push(c);return c;};
        const spawn=setInterval(()=>{if(over)return;if(api.locked())return;if(words.length){mk(words.shift());spawned++;}},(st.ass?1200:st.hard?760:950)*1.7);
        let raf;const tick=now=>{
          if(over)return;const dt=Math.min(.05,(now-last)/1000);last=now;
          if(!api.locked())chips.forEach(c=>{if(c._d)return;c._y+=speed()*dt;c.style.transform=`translate(${c._x}px,${c._y}px)`;
            if(c._y>H()-26){c._d=1;resolved++;
              if(c._w.t){m++;e9Rec(c._w.w,false,'catch');c.classList.add('bad');msg.textContent='You missed '+c._w.w+'. It is soft.';sfx('zap');}
              else{h++;e9Rec(c._w.w,true,'catch');}
              setTimeout(()=>c.remove(),200);}});
          if(spawned===total&&resolved>=total){over=true;clearInterval(spawn);setTimeout(()=>res({h,m,ms:20000,words:[],noRepeat:true}),700);return;}
          raf=requestAnimationFrame(tick);};
        raf=requestAnimationFrame(tick);
        /* cancelled run: stop everything */
        const guard=setInterval(()=>{if(over){clearInterval(guard);return;}if(!document.body.contains(lane)){over=true;clearInterval(spawn);clearInterval(guard);cancelAnimationFrame(raf);}},500);
      });
    }};
}

/* ---------- drill: crack the cage (tap the soft bars) ---------- */
function e9GridCfg(id,{soft,hard,rounds=3,title,sub}){
  return {id,type:'grid',title,sub,limit:16000,fast:0,
    items:()=>Array.from({length:rounds},()=>{const s=e9Pick(soft,4),h=e9Pick(hard,4);return{bars:shuffle(s.map(w=>({w,t:1})).concat(h.map(w=>({w,t:0}))))};}),
    async render(it,box,st,api){
      stageH(36);cam('e9_cage',{dur:700});
      box.append(el('div','e9big','Switch off the SOFT bars: c = S, g = J'));
      const grid=el('div','e9bars');box.append(grid);
      const msg=el('div','e9msg','Leave the hard ones glowing.');box.append(msg);
      const row=el('div','e9row');const doneB=el('button','go','Done ▸');doneB.style.cssText+=';margin-top:4px';row.append(doneB);box.append(row);
      return new Promise(res=>{
        let h=0,m=0,left=it.bars.filter(b=>b.t).length,done=false;const t0=performance.now();
        const lim=16000*(st.ass?1.6:1)*(st.hard?.7:1);
        const stop=api.ring(lim,()=>finish(true));
        const els=it.bars.map(b=>{const d=el('button','e9bar',b.w);d.onclick=()=>{
          if(done||api.locked()||d.classList.contains('off')||d.classList.contains('bad'))return;
          if(b.t){d.classList.add('off');h++;left--;sfx('tick');e9Rec(b.w,true,'grid');if(!left)finish(false);}
          else{d.classList.add('bad');m++;sfx('zap');e9Rec(b.w,false,'grid');msg.textContent=b.w+' is a hard word.';api.judgeRush(Math.round(performance.now()-t0)/Math.max(1,h+m),false);}
        };grid.append(d);return d;});
        doneB.onclick=()=>{if(!done)finish(false);};
        function finish(timeout){if(done)return;done=true;stop();
          /* untapped soft bars are misses; untouched hard bars are correct rejections */
          els.forEach((d,i)=>{const b=it.bars[i];if(b.t&&!d.classList.contains('off')){m++;d.classList.add('show');e9Rec(b.w,false,'grid');}else if(!b.t&&!d.classList.contains('bad')){h++;e9Rec(b.w,true,'grid');}});
          if(left>0)msg.textContent=(timeout?'Time up. ':'')+left+' soft bar'+(left>1?'s':'')+' stayed on:';
          else if(!m){sfx('good');burst(14);msg.textContent='The bars go dark!';}
          const clean=m===0;setTimeout(()=>res({h,m:Math.min(m,8),ms:Math.round(performance.now()-t0),words:[],noRepeat:clean}),clean?700:1900);}
      });
    }};
}

/* ---------- story plumbing ---------- */
function e9intro(i){
  return (async()=>{
    Mic.off();Snd.music(true);
    stageH(44);cam(E9_CH[i].shot);cap(`${i+1} · ${E9_CH[i].name}`);setStatic(0);
    play.replaceChildren(el('div','sm',`Paragraph ${i+1}`),hookEl(E9_CH[i].hook));
    const sp=el('div','sm','Read it together first');sp.style.color='#9aa7d6';play.append(sp);
    await waitGo('We read it ▸');
  })();
}
async function e9Hand(words){
  {const tr=$('#tray');if(tr)tr.style.visibility='';}
  Mic.off();Snd.music(true);
  play.replaceChildren(el('div','sm','You earned'));
  const row=el('div','e9row');words.forEach(w=>{const c=el('div','e9card',w);c.append(el('small','','soft sound'));row.append(c);});play.append(row);
  sfx('card');
  const note=el('div','sm','Teacher hands over the real cards');note.style.textAlign='center';play.append(note);
  await waitGo('Cards handed over ✓');
  const E=e9S();words.forEach(w=>{if(!E.earned.includes(w))E.earned.push(w);});save();
}
async function e9outro(i){
  Mic.off();Snd.music(true);save();
  const E=e9S();
  const mine=Object.keys(E.best).filter(k=>k.startsWith('p'+i+'.'));
  const got=mine.reduce((a,k)=>a+E.best[k].stars,0);
  play.replaceChildren(el('div','sm',`Paragraph ${i+1} done`));
  const s=el('div','e9big',got+' of '+mine.length*3+' stars');play.append(s);
  const next=E9_CH[i+1];
  if(next){const h=el('div','hook');h.append('Next: ');h.append(el('em','',next.name.toLowerCase()));play.append(h);cam(next.shot,{dur:1600});sfx('whoosh');}
  await waitGo(next?'Next paragraph ▸':'Finish ▸');
}
async function e9p1(){
  await e9intro(0);
  Snd.music(false);stageH(46);cap('1 · THE TOWER');
  await e9Run(e9SpotCfg('p0.spot',{list:E9_SPOTS[0],n:6,title:'SPOT IT',sub:'Tap it in the picture. Fast and right.'}));
  await e9Run(e9SortCfg('p0.sort',{soft:E9W.cS,hard:E9W.cH,labS:'c says S',labH:'c says K',egS:'like city',egH:'like cat',title:'SORT IT',sub:'Swipe the word or tap a bin.'}));
  await e9Run(e9HearCfg('p0.hear',{pool:E9W.cS.concat(E9W.cH),n:8,title:'HEAR IT',sub:'Which spelling matches the sound?'}));
  stageH(40);cap('1 · READ IT');cam('e9_tower');
  Snd.music(false);await sprint(E9_BANK[0],['e9_tower','e9_guards'],8);
  await e9Hand(['city']);
  await e9outro(0);
}
async function e9p2(){
  await e9intro(1);
  Snd.music(false);stageH(36);cap('2 · THE LIFT');
  await e9Run(e9CatchCfg('p1.catch',{soft:E9W.cS.concat(E9W.gS),hard:E9W.cH.concat(E9W.gH),n:16,title:'LIFT CLIMB',sub:'Soft words lift you up a floor.'}));
  await e9Run(e9OrderCfg('p1.order',{sets:E9_ORDER,title:'IN ORDER',sub:'Tap the story in order.'}));
  await e9Run(e9FillCfg('p1.fill',{items:E9_FILL,title:'FILL IT',sub:'Which word fits?'}));
  stageH(40);cap('2 · READ IT');cam('e9_lift');
  Snd.music(false);await sprint(E9_BANK[1],['e9_lift','e9_door','e9_gate'],8);
  await e9Hand(['giant']);
  await e9outro(1);
}
async function e9p3(){
  await e9intro(2);
  Snd.music(false);stageH(46);cap('3 · THE CAGE');
  await e9Run(e9SpotCfg('p2.spot',{list:E9_SPOTS[2],n:6,title:'SPOT IT',sub:'Find the clue. Find the red bug!'}));
  await e9Run(e9GridCfg('p2.grid',{soft:E9W.cS.concat(E9W.gS),hard:E9W.cH.concat(E9W.gH),rounds:3,title:'CRACK THE CAGE',sub:'Soft bars go dark. Hard ones stay lit.'}));
  await e9Run(e9BuildCfg('p2.build',{pool:['city','giant','cage','face','nice','race','gem','huge','page','ice'],n:6,title:'BUILD IT',sub:'Hear it. Tap the letters in order.'}));
  await e9Run(e9OddCfg('p2.odd',{a:E9W.cS.concat(E9W.gS),b:E9W.cH.concat(E9W.gH),ruleA:'a soft sound',ruleB:'a hard sound',n:6,title:'ODD ONE OUT',sub:'One word has the other sound.'}));
  stageH(40);cap('3 · READ IT');cam('e9_gate3');
  Snd.music(false);await sprint(E9_BANK[2],['e9_gate3','e9_cage','e9_face'],8);
  await e9Hand(['cage','face']);
  await e9outro(2);
}
async function e9p4(){
  await e9intro(3);
  Snd.music(false);stageH(46);cap('4 · THE CROWN');
  await e9Run(e9SpotCfg('p3.spot',{list:E9_SPOTS[3],n:6,title:'SPOT IT',sub:'Find it in the picture. Fast and right.'}));
  await e9Run(e9GridCfg('p3.grid',{soft:E9W.cS.concat(E9W.gS),hard:E9W.cH.concat(E9W.gH),rounds:3,title:'CRACK THE CAGE',sub:'Soft bars go dark. Hard ones stay lit.'}));
  await e9Run(e9SortCfg('p3.sort',{soft:E9W.cS.concat(E9W.gS),hard:E9W.cH.concat(E9W.gH),labS:'soft sound',labH:'hard sound',egS:'city, giant',egH:'cat, goat',title:'LAST SORT',sub:'c and g. Soft or hard?'}));
  await e9Run(e9BuildCfg('p3.build',{pool:['city','giant','cage','face','nice','race','gem','huge','page','ice'],n:6,title:'BUILD IT',sub:'Hear it. Tap the letters in order.'}));
  stageH(40);cap('4 · READ IT');cam('e9_bang');
  Snd.music(false);await sprint(E9_BANK[3],['e9_bang','e9_bug','e9_red','e9_king'],8);
  await e9outro(3);
}
async function e9end(){
  Mic.off();Snd.music(true);stageH(44);cam('e9_king');cap('TO BE CONTINUED…');setStatic(0);
  const E=e9S();const stars=Object.values(E.best).reduce((a,b)=>a+b.stars,0);
  play.replaceChildren(el('div','sm','Paragraph 5 is coming'),el('div','e9big','⭐ '+stars+' stars · 🔧 '+(S.parts||0)+' parts'));
  const h=el('div','hook');h.append('Who is ');h.append(el('em','','the man with the crown'));h.append('?');play.append(h);
  const b=el('button','go','Home ▸');b.onclick=()=>{Snd.init();title();};play.append(b);
}
function startEp9(i,resume=false){
  E9ON=true;trayEpisode=9;renderTray();
  if(!SHOT.e9_tower)Object.assign(SHOT,E9_SHOT);
  e9S();
  T.skipChoice=null;T.force=null;practiceAgain=[];
  const t=$('#title');if(t)t.remove();stage.style.touchAction='';
  RUN++;Mic.off();Snd.theme(false);setStatic(0);panelView=null;$('#ret').style.display='none';document.querySelectorAll('.pin').forEach(p=>p.remove());Snd.humOff();
  const cpId='e9:'+i;
  if(!resume||S.checkpoint?.chapter!==cpId||!Array.isArray(S.checkpoint.events)){
    S.checkpoint={chapter:cpId,events:[]};
    Object.keys(S.e9.done).forEach(k=>{if(k.startsWith('p'+i+'.'))delete S.e9.done[k];});
    if(S.e9.open&&S.e9.open.id.startsWith('p'+i+'.'))S.e9.open=null;
  }
  checkpointCursor=0;replayUntil=S.checkpoint.events.length;
  S.e9.ch=i;save();
  const flows=[e9p1,e9p2,e9p3,e9p4,e9end];const run=RUN;
  flows[i]().then(()=>{if(run!==RUN)return;if(i<4){S.e9.ch=i+1;save();startEp9(i+1);}}).catch(e=>{if(e!=='cancel')console.error(e);});
}
