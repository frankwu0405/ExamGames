/* Step through the gate: an overlay with the 3D peek scene (gate/index.html?embed=1&peek=tower).
   Watch the story from far away, then explore it for hidden finds. Best count is saved in S.gate.loot.peek. */
(function(){const s=document.createElement('style');s.textContent=`
.scn{display:flex;gap:10px;justify-content:center}
.scn button{position:relative;width:150px;height:96px;padding:0;border:4px solid #000;box-shadow:5px 5px 0 #000;overflow:hidden;background:#222;cursor:pointer}
.scn button i{position:absolute;inset:0;display:block}
.scn button b{position:absolute;left:0;right:0;bottom:0;background:#000;color:#fff;font:700 13px/1.6 inherit;text-align:center}
.scn button.lock{filter:grayscale(1) brightness(.5)}
.shelf{display:flex;gap:6px;justify-content:center;align-items:center;color:#fff;font:700 13px inherit}
.peekov{position:fixed;inset:0;z-index:9000;background:#000}
.peekov iframe{width:100%;height:100%;border:0;display:block}
.peekov .hud{position:absolute;top:10px;left:10px;right:10px;display:flex;justify-content:space-between;pointer-events:none}
.peekov .hud b,.peekov .hud button{pointer-events:auto;background:#fff;border:3px solid #000;box-shadow:3px 3px 0 #000;font:700 15px inherit;padding:6px 12px}
`;document.head.append(s);})();
const GATE_SCENES={tower:{ep:9,thumb:'e9_lift',name:'The tower door'}};
function gateLoot(){const g=gateState();if(!g.loot)g.loot={};return g.loot;}
function thumbEl(key,w=150){
  if(!SHOT[key])Object.assign(SHOT,E9_SHOT);
  const [pg,x,y,sw,sh]=SHOT[key],sc=w/sw,i=el('i');
  i.style.backgroundImage=`url(assets/p${pg+1}.jpg)`;i.style.backgroundSize=`${IW*sc}px ${IH*sc}px`;i.style.backgroundPosition=`${-x*sc}px ${-y*sc}px`;return i;
}
function sceneRow(sets,lit,leave){
  const wrap=el('div','');wrap.style.cssText='display:flex;flex-direction:column;gap:10px;flex:none';
  const row=el('div','scn'),L=gateLoot();
  Object.entries(GATE_SCENES).forEach(([id,sc])=>{
    const set=sets.find(x=>x.ep===sc.ep);
    const open=/[?&]force=1/.test(location.search)||(set&&set.words.every(w=>lit(w)===2));
    const b=el('button',open?'':'lock');b.append(thumbEl(sc.thumb));b.append(el('b','',open?'Peek through ▸':'🔒'));
    b.onclick=()=>{if(!open){sfx('buzz');return;}sfx('whoosh');leave();runScene(id);};row.append(b);
  });
  const shelf=el('div','shelf');shelf.textContent='Finds: '+(L.peek||0)+' / 8';
  wrap.append(row,shelf);return wrap;
}
function runScene(id){
  const ov=el('div','peekov'),fr=document.createElement('iframe');
  fr.src='gate/index.html?embed=1&peek='+id+'&v=1';ov.append(fr);
  const hud=el('div','hud'),cnt=el('b','','Finds 0 / 8'),out=el('button','','✕ Leave');hud.append(cnt,out);ov.append(hud);document.body.append(ov);
  const L=gateLoot();let best=0;
  const done=()=>{window.removeEventListener('message',onm);ov.remove();if(typeof S!=='undefined'&&best>(L.peek||0)){const gain=best-(L.peek||0);L.peek=best;save();if(typeof earn==='function')earn(gain);}
    if(typeof openDash==='function')try{openDash();}catch(_){}};
  const onm=e=>{const d=e.data||{};
    if(d.peekCollected){sfx('ding');best=Math.max(best,d.n);cnt.textContent='Finds '+d.n+' / '+d.total;}
    if(d.peekDone!=null&&d.peekDone>=best){best=d.peekDone;}};
  window.addEventListener('message',onm);out.onclick=done;
}
