/* =========================================================
   Through the gate: replay a scene from an episode.
   He and Kip take turns reading the beats aloud (his lines by voice),
   then a short find-it job, then a find goes on his shelf.
   Beat speakers: K = Kip (read to him), F = Finn (he reads it).
   ========================================================= */
const GATE_SCENES={
 shed:{ep:8,thumb:'deadBug',loot:'gear',beats:[
   ['deadBug','K','The dirty bug is dark and still.'],
   ['deadBug','F','Kip turns the dirty bug over.'],
   ['repairL','K','Kip opens his box of tools first.'],
   ['tap','F','Kip taps it three times, and it turns on.'],
   ['buzz','K','A loud buzz fills the dirty shed.'],
   ['buzz','F','The bug turns in a happy circle.']]},
 lift:{ep:9,thumb:'e9_lift',loot:'key',beats:[
   ['e9_lift','K','They step into a glass lift.'],
   ['e9_lift','F','Finn sees the whole city below him.'],
   ['e9_door','K','The doors open on a dark hall.'],
   ['e9_gate','F','It looks just like the gate in the woods.'],
   ['e9_gate','K','A giant gate stands at the end of the hall.']],
   find:{q:'the giant gate',w:'giant',shot:'e9_gate',spots:[[1600,950,330]]}}
};
const GATE_LOOT={gear:'M12 2l2 3 3.5-.5.8 3.4 3.2 1.6-1.6 3.1 1.6 3.1-3.2 1.6-.8 3.4L14 21l-2 3-2-3-3.5.5-.8-3.4-3.2-1.6 1.6-3.1L2.5 10.8l3.2-1.6.8-3.4L10 6.3 12 2zm0 7a3.6 3.6 0 100 7.2A3.6 3.6 0 0012 9z',
 key:'M8 10a5 5 0 119.6 2H27v4h-3v3h-3v-3h-3.4A5 5 0 118 10zm4-1.5a1.7 1.7 0 100 3.4 1.7 1.7 0 000-3.4z'};
(function(){const s=document.createElement('style');s.textContent=`
.scn{display:flex;gap:8px;flex:none}
.scn button{flex:1;position:relative;aspect-ratio:16/10;border:3px solid #000;box-shadow:3px 3px 0 #000;padding:0;overflow:hidden;background:#10162c}
.scn button i{position:absolute;inset:0;background-repeat:no-repeat}
.scn button b{position:absolute;left:0;right:0;bottom:0;padding:3px 0 5px;font:400 19px var(--hd);letter-spacing:.05em;color:var(--ink);background:var(--yellow);text-align:center}
.scn button.lock{filter:grayscale(1) brightness(.35);pointer-events:none}
.shelf{display:flex;gap:10px;justify-content:center;flex:none}
.shelf svg{width:44px;height:44px;padding:6px;border:3px solid #000;background:#1a2347;box-shadow:3px 3px 0 #000}
.shelf svg path{fill:#2e3a6a}.shelf svg.on{background:var(--paper)}.shelf svg.on path{fill:var(--ink)}
.lootcard{align-self:center;width:130px;height:130px;background:var(--paper);border:4px solid #000;box-shadow:6px 6px 0 #000;display:flex;align-items:center;justify-content:center;animation:flip .7s}
.lootcard svg{width:84px;height:84px}.lootcard svg path{fill:var(--ink)}
`;document.head.append(s);})();

function gateLoot(){const g=gateState();if(!g.loot)g.loot={};return g.loot;}
function thumbEl(key,w=150){
  if(!SHOT[key])Object.assign(SHOT,E9_SHOT);
  const [pg,x,y,sw,sh]=SHOT[key],sc=w/sw,i=el('i');
  i.style.backgroundImage=`url(assets/p${pg+1}.jpg)`;i.style.backgroundSize=`${IW*sc}px ${IH*sc}px`;i.style.backgroundPosition=`${-x*sc}px ${-y*sc}px`;return i;
}
/* row of scene buttons (unlocked once that episode's cards are all lit) + the shelf of finds */
function sceneRow(sets,lit,leave){
  const wrap=el('div','');wrap.style.cssText='display:flex;flex-direction:column;gap:10px;flex:none';
  const row=el('div','scn');
  Object.entries(GATE_SCENES).forEach(([id,sc])=>{
    const set=sets.find(x=>x.ep===sc.ep);
    const open=/[?&]force=1/.test(location.search)||(set&&set.words.every(w=>lit(w)===2));
    const b=el('button',open?'':'lock');b.append(thumbEl(sc.thumb));b.append(el('b','',open?'Step through ▸':'🔒'));
    b.onclick=()=>{sfx('whoosh');leave();runScene(id);};row.append(b);
  });
  const shelf=el('div','shelf'),L=gateLoot();
  Object.values(GATE_SCENES).forEach(sc=>{
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 28 28');
    const p=document.createElementNS('http://www.w3.org/2000/svg','path');p.setAttribute('d',GATE_LOOT[sc.loot]);svg.append(p);
    if(L[sc.loot])svg.classList.add('on');shelf.append(svg);
  });
  wrap.append(row,shelf);return wrap;
}
async function runScene(id){
  const sc=GATE_SCENES[id];
  $('#title')?.remove();stage.style.touchAction='';
  RUN++;Mic.off();Snd.theme(false);setStatic(0);panelView=null;$('#ret').style.display='none';
  if(!SHOT.e9_tower)Object.assign(SHOT,E9_SHOT);
  S.checkpoint={chapter:'scene:'+id,events:[]};checkpointCursor=0;replayUntil=0;
  const run=RUN;
  try{
    Snd.music(false);stageH(46);cam(sc.beats[0][0]);cap(`Through the gate · Gate ${sc.ep}`);
    play.replaceChildren(el('div','sm','Through the gate'),P_KIP());sfx('whoosh');
    await waitGo('Step in ▸');
    for(const [shot,who,text] of sc.beats){
      if(run!==RUN)return;
      stageH(46);cam(shot,{dur:900});
      if(who==='K'){
        play.replaceChildren(el('div','sm','Kip reads'),P_KIP());
        const t=el('div','');t.style.cssText='font:700 22px/1.3 var(--bd);color:var(--paper)';t.textContent=text;play.append(t);
        await new Promise(r=>{let n=0;const fin=()=>{if(n++)return;r();};speak(text,()=>setTimeout(fin,350));setTimeout(fin,6000);});
      }else{
        await readOne({t:text,tries:0,assisted:false,again:0},0);
      }
    }
    if(sc.find){
      const cfg=e9SpotCfg('gs.'+id,{list:[sc.find],n:1,title:'FIND IT',sub:'Look through the gate.'});
      for(;;){const o=await e9Once(cfg);if(o!=='again')break;}
    }
    const L=gateLoot(),first=!L[sc.loot];L[sc.loot]=1;save();
    play.replaceChildren(el('div','sm',first?'You found something':'Found again'));
    const lc=el('div','lootcard');const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 28 28');
    const p=document.createElementNS('http://www.w3.org/2000/svg','path');p.setAttribute('d',GATE_LOOT[sc.loot]);svg.append(p);lc.append(svg);play.append(lc);
    sfx('card');if(first){burst(18);earn(2);}
    await waitGo('Back to the gate ▸');
  }catch(e){if(e!=='cancel')console.error(e);}
  if(run===RUN){S.checkpoint=null;save();title();openDash();}
}
