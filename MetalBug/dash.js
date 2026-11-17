/* =========================================================
   Gate workshop. Two stages:
   1) BUILD: Kip sells the gate's parts for bug parts. Shown as
      silhouettes on a blueprint, not as a text list.
   2) POWER: the gate runs on memory. Recall words with no options.
   The 3D gate is gate/index.html?embed=1 in an iframe, driven by
   postMessage. Charge is kept between visits.
   ========================================================= */
const GATE_COST=[6,10,10,14,14,18,22,16];  /* total 110 · tune here */
const GATE_SAY={
 hello:['Fix the gate? I sell the parts. You bring bug parts.','Parts for parts. Fair trade.'],
 short:['Not enough yet. Go earn some.','Too light. Come back with more.'],
 bought:['Heavy. Mind your toes.','That fits.','Look at that. Hand-cut.','Better.','Keep going.','Solid.'],
 done:['That is all of it. But she is cold. She runs on memory.'],
 cold:['Cold and dark. Wake her. Remember.','She needs power.'],
 hint:['Fine. One letter. It costs you.'],
 good:['Yes!','That is it.','She hummed.','Right.','Spot on.'],
 bad:['Not quite. Listen again.','Close. Check each sound.','Careful now.'],
 reveal:['It was this one.'],
 open:['She is open! Look at that!'],
 rest:['She is still warm. Come back later.'],
 full:['Fully charged. Nice memory.']
};
const gPick=a=>a[Math.floor(Math.random()*a.length)];
(function(){const s=document.createElement('style');s.textContent=`
#dash{position:fixed;inset:0;z-index:60;background:#05070e;display:flex;flex-direction:column}
#dash iframe{border:0;width:100%;height:44dvh;flex:none;background:#05070e;transition:height .4s}
#dash.pw iframe{height:36dvh}
#dash.wake iframe{height:100dvh;position:absolute;inset:0}
#dash.wake .dp{display:none}
#dash .wk{position:absolute;left:0;right:0;bottom:calc(26px + env(safe-area-inset-bottom));text-align:center;z-index:3;pointer-events:none;font:400 24px var(--hd);letter-spacing:.08em;color:#fff;text-shadow:0 2px 0 #000,0 0 14px #2cc8ff;animation:wkp 1.6s ease-in-out infinite}
@keyframes wkp{50%{opacity:.35}}
#dash .wkb{position:absolute;top:12px;z-index:4;z-index:3;border:3px solid #000;background:var(--paper);color:var(--ink);font:700 14px var(--bd);padding:5px 10px;box-shadow:3px 3px 0 #000}
#dash .dts{position:absolute;top:18px;left:0;right:0;display:flex;justify-content:center;gap:10px;z-index:3}
#dash .dt{width:14px;height:14px;border:2px solid #000;background:#222;transform:rotate(45deg);opacity:.7}
#dash .dt.on{background:#7fe3ff}#dash .dt.cur{opacity:1;box-shadow:0 0 0 3px #fff}
#dash .swh{pointer-events:auto;padding:30px 14px;top:40%;z-index:3;cursor:pointer}
#dash .arw{position:absolute;top:44%;z-index:3;width:46px;height:64px;border:3px solid #000;background:var(--paper);color:var(--ink);font:400 22px var(--hd);box-shadow:3px 3px 0 #000;padding:0;display:flex;align-items:center;justify-content:center}
#dash .arw.l{left:8px}#dash .arw.r{right:8px}
#dash .rlc{position:absolute;left:0;right:0;bottom:calc(74px + env(safe-area-inset-bottom));display:flex;justify-content:center;gap:8px;z-index:3;pointer-events:none}
#dash .rs{width:40px;height:40px;border:3px solid #000;background:#0b1a22 center/cover;box-shadow:3px 3px 0 #000;opacity:.55}
#dash .rs.on{opacity:1;border-color:#7fe3ff}
#dash .grab{align-self:center;flex:none;border:0;background:none;color:#9aa7d6;font:400 26px/1 var(--hd);padding:0 40px 2px;margin-top:-16px}
#dash .flash{position:fixed;inset:0;z-index:70;background:#fff;opacity:0;pointer-events:none;transition:opacity .5s}
#dash .dp{flex:1;min-height:0;overflow:auto;padding:26px 12px 14px;display:flex;flex-direction:column;gap:10px;background:var(--ink) radial-gradient(rgba(255,255,255,.045) 1.4px,transparent 1.6px) 0 0/11px 11px;clip-path:polygon(0 14px,100% 0,100% 100%,0 100%);margin-top:-14px}
#dash .kip{display:flex;gap:8px;align-items:center;flex:none}
#dash .kip .pt i{width:60px;height:60px}
#dash .kip .pt span{display:none}
#dash .say{flex:1;font:700 15px/1.25 var(--bd);color:var(--ink);background:var(--paper);border:3px solid #000;box-shadow:3px 3px 0 #000;padding:7px 10px;position:relative;min-height:22px}
#dash .say:before{content:'';position:absolute;left:-12px;top:14px;border:8px solid transparent;border-right:10px solid #000}
#dash .bal{margin-left:auto;font:400 26px var(--hd);color:var(--yellow);letter-spacing:.04em;flex:none}
#dash .bp{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;flex:none}
#dash .slot{position:relative;aspect-ratio:160/224;border:2px dashed #2a3560;background:rgba(30,42,90,.35);padding:0;overflow:hidden}
#dash .slot i{position:absolute;inset:3px;-webkit-mask:var(--m) center/contain no-repeat;mask:var(--m) center/contain no-repeat;pointer-events:none}
#dash .slot i.b{background:#1a2347}
#dash .slot i.p{background:#2e3a6a}
#dash .slot.own{border:2px solid #000;background:#1b2547}
#dash .slot.own i.p{background:var(--paper)}
#dash .slot.next{border:3px solid var(--yellow);animation:dnx 1.2s ease-in-out infinite}
#dash .slot.next i.p{background:var(--yellow)}
#dash .slot.next.poor i.p{background:#8a7a2a}
@keyframes dnx{50%{box-shadow:0 0 14px var(--yellow)}}
#dash .slot b{position:absolute;left:0;right:0;bottom:2px;font:400 19px var(--hd);letter-spacing:.04em;color:#fff;-webkit-text-stroke:3px #000;paint-order:stroke fill;text-align:center}
#dash .slot.own b{display:none}
#dash .slot.shake{animation:e9sh .35s}
#dash .bk{align-self:flex-start;font:700 13px var(--bd);color:#9aa7d6;background:none;border:2px dashed #55618f;padding:5px 12px;margin-top:auto;flex:none}
#dash .pwr{font:400 34px var(--hd);letter-spacing:.05em;color:var(--ink);background:var(--yellow);border:4px solid #000;box-shadow:5px 5px 0 #000;padding:12px 10px 14px;flex:none}
#dash .plate{display:flex;gap:6px;justify-content:center;flex:none}
#dash .plate i{width:18px;height:18px;border:3px solid #000;background:#27304f;transform:rotate(45deg)}
#dash .plate i.on{background:var(--teal);box-shadow:0 0 8px var(--teal)}
#dash .plate i.bad{background:var(--red)}
#dash .kcs{display:flex;flex-direction:column;gap:10px;flex:none}
#dash .kcr{display:flex;align-items:center;gap:8px}
#dash .kcr .ep{font:400 20px var(--hd);color:var(--yellow);letter-spacing:.05em;width:58px;flex:none;line-height:1}
#dash .kl{display:flex;gap:8px;flex:1}
#dash .kslot{position:relative;flex:1;aspect-ratio:992/1440;padding:0;border:2px dashed #2a3560;background:rgba(30,42,90,.35);display:flex;align-items:center;justify-content:center}
#dash .kslot.none{background:url(assets/card-back.webp?v=5) center/100% 100% no-repeat;border:2px solid #000;opacity:.5}
#dash .kslot .q{font:400 26px var(--hd);color:#3a4676}
#dash .kslot .kc{position:absolute;inset:0}
#dash .kslot img{width:100%;height:100%;display:block;filter:brightness(0) opacity(.55)}
#dash .kslot.full img,#dash .kslot.dim img{filter:none}
#dash .kslot.dim img{filter:saturate(.5) brightness(.8)}
#dash .kslot .kc.ph{background:#1a2347;border:2px solid #000}
#dash .kslot .kc.ph.on{background:var(--paper)}
#dash .kslot .kc.ph span{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font:400 16px var(--hd);color:var(--ink)}
#dash .kslot.ready{border:3px solid var(--teal)}
#dash .kslot.pulse{animation:dnx 1.2s ease-in-out infinite}
#dash .kslot.full{border:3px solid var(--good);box-shadow:0 0 10px rgba(125,255,138,.6)}
#dash .kslot.dim{border:3px solid var(--yellow)}
#dash .kslot b{position:absolute;right:2px;top:2px;font:400 16px var(--hd);color:var(--yellow);-webkit-text-stroke:2px #000;paint-order:stroke fill}
#dash .silver{align-self:center;width:84px;aspect-ratio:992/1440;border:3px dashed #3a4676;background:#1a2347;color:#3a4676;font:400 24px var(--hd);display:flex;align-items:center;justify-content:center;padding:0}
#dash .silver.on{border:3px solid #000;background:linear-gradient(135deg,#f4f7fb,#9aa4b8 55%,#e8edf5);color:var(--ink);box-shadow:0 0 14px rgba(220,230,255,.8);animation:dnx 1.4s ease-in-out infinite}
#dash .rc{display:flex;flex-direction:column;align-items:center;gap:8px;flex:none}
#dash .spk{font:400 26px var(--hd);color:var(--ink);background:var(--paper);border:3px solid #000;box-shadow:4px 4px 0 #000;padding:8px 22px 10px;letter-spacing:.04em}
#dash .sent{font:700 17px/1.3 var(--bd);color:var(--paper);text-align:center}
#dash .sent u{display:inline-block;min-width:76px;border-bottom:3px solid var(--yellow);text-decoration:none;color:var(--yellow)}
#dash .lett{display:flex;gap:5px;justify-content:center;flex-wrap:wrap}
#dash .lett div{width:36px;height:46px;border-bottom:4px solid var(--yellow);font:800 30px/46px var(--bd);color:var(--good);text-align:center}
#dash .lett div.bad{color:var(--red);border-color:var(--red)}
#dash .kb{display:flex;flex-direction:column;gap:5px;margin-top:auto;flex:none}
#dash .kr{display:flex;gap:4px;justify-content:center}
#dash .kb button{flex:1;max-width:36px;height:42px;font:800 20px var(--bd);color:var(--ink);background:var(--paper);border:2px solid #000;box-shadow:2px 2px 0 #000;padding:0}
#dash .kb button.w{max-width:56px;flex:1.6}
#dash .kb button.ok{background:var(--good)}#dash .kb button.hint{background:#9be8ff}
#dash .kb button:active{transform:translate(2px,2px);box-shadow:none}
`;document.head.append(s);})();

function gateState(){if(!S.gate)S.gate={mask:0};const g=S.gate;if(g.energy==null){g.energy=0;g.t=Date.now();}if(!g.wl)g.wl={};if(!g.opens)g.opens=0;return g;}
function gateNext(){const m=gateState().mask;for(let i=0;i<8;i++)if(!(m&(1<<i)))return i;return -1;}
/* charge is kept: he will not play every day */
function gateEnergy(){return gateState().energy;}
function gateSetEnergy(v){const g=gateState();g.energy=Math.max(0,Math.min(1,v));g.t=Date.now();save();}

function dashButton(){
  const b=el('button','go alt','🔧 Gate workshop');b.style.cssText+=';font-size:22px;padding:8px 10px';
  b.onclick=()=>{Snd.init();Snd.resume();openDash();};return b;
}
function openDash(){
  document.querySelector('#dash')?.remove();
  const G=gateState();
  const d=el('div','');d.id='dash';
  const fr=document.createElement('iframe');
  fr.src='gate/index.html?embed=1&loc=woods&beyond=city&parts=0&charge='+gateEnergy().toFixed(2)+'&v=10';
  const dp=el('div','dp');d.append(fr,dp);document.body.append(d);
  const post=o=>{try{fr.contentWindow.postMessage(o,'*');}catch(_){}};
  let thumbs=null,ready=false,tk=0,say,curE=0;
  const now=()=>Date.now();
  const onMsg=e=>{
    if(e.source!==fr.contentWindow)return;
    if(e.data==='gate-ready'&&!ready){ready=true;post({mask:G.mask,anim:false,charge:curE,color:'cyan'});if(d.classList.contains('wake'))wake();if(afterExit){const f=afterExit;afterExit=null;setTimeout(()=>{f.style.opacity=0;setTimeout(()=>f.remove(),600);},350);}}
    else if(e.data==='gate-tap'){if(d.classList.contains('wake'))stepThrough();}
    else if(e.data==='gate-entered'){arrive();}
    else if(e.data&&e.data.swipe){swipe(e.data.swipe);}
    else if(e.data&&e.data.thumbs){thumbs=e.data.thumbs;if(gateNext()>=0)drawBuild();}
  };
  addEventListener('message',onMsg);
  new MutationObserver((_,o)=>{if(!d.isConnected){removeEventListener('message',onMsg);o.disconnect();}}).observe(document.body,{childList:true});
  const talk=t=>{if(!say)return;const id=++tk,t0=performance.now();say.textContent='';(function f(){if(!d.isConnected||id!==tk)return;const n=Math.min(t.length,Math.ceil((performance.now()-t0)/22));say.textContent=t.slice(0,n);if(n<t.length)requestAnimationFrame(f);})();};
  const head=(withBal)=>{const k=el('div','kip');k.append(P_KIP());say=el('div','say','');k.append(say);if(withBal)k.append(el('div','bal','🔧 '+(S.parts||0)));return k;};
  let backFn=()=>d.remove();
  const pb=el('button','wkb pb','◂');pb.style.left='12px';pb.onclick=()=>backFn();d.append(pb);
  const rampCharge=(from,to,ms=900)=>{curE=to;const t0=performance.now();(function f(){if(!d.isConnected)return;const k=Math.min(1,(performance.now()-t0)/ms);post({charge:from+(to-from)*k});if(k<1)requestAnimationFrame(f);})();};

  /* ---------- 1 · BUILD ---------- */
  function drawBuild(msg){
    backFn=()=>d.remove();d.classList.remove('pw');dp.replaceChildren();
    dp.append(head(true));
    const grid=el('div','bp');dp.append(grid);
    const nx=gateNext();
    GATE_COST.forEach((cost,i)=>{
      const own=!!(G.mask&(1<<i));
      const sl=el('button','slot'+(own?' own':i===nx?' next'+((S.parts||0)<cost?' poor':''):''));
      if(thumbs){const b=el('i','b');b.style.setProperty('--m',`url(${thumbs[0]})`);const p=el('i','p');p.style.setProperty('--m',`url(${thumbs[i+1]})`);sl.append(b,p);}
      if(!own)sl.append(el('b','',String(cost)));
      sl.onclick=()=>{if(i===nx)buy(i,sl);else if(!own){sl.classList.add('shake');setTimeout(()=>sl.classList.remove('shake'),400);sfx('buzz');talk('One at a time. The glowing one.');}};
      grid.append(sl);
    });
    talk(msg||(G.mask===0?GATE_SAY.hello[0]:'Next part is glowing.'));
  }
  function buy(i,sl){
    if((S.parts||0)<GATE_COST[i]){sl.classList.add('shake');setTimeout(()=>sl.classList.remove('shake'),400);sfx('buzz');talk(gPick(GATE_SAY.short));return;}
    S.parts-=GATE_COST[i];G.mask|=1<<i;save();
    partsEl.lastChild.textContent=S.parts;
    sfx('card');post({mask:G.mask,anim:true});setTimeout(()=>sfx('pin'),950);
    if(gateNext()<0){drawBuild();talk(GATE_SAY.done[0]);setTimeout(drawPower,2600);}
    else drawBuild(gPick(GATE_SAY.bought));
  }

  /* ---------- 2 · POWER: cards are the keys ---------- */
  const SETS=[
    {ep:8,words:CARDS.slice(),have:w=>(S.earned||[]).includes(w),tint:'cyan',img:w=>CARD[w]},
    {ep:9,words:['city','giant','cage','face'],have:w=>!!(S.e9&&S.e9.earned&&S.e9.earned.includes(w)),tint:'violet',img:null}
  ];
  const lit=w=>(G.cards&&G.cards[w])||0;                 /* 2 = from memory, 1 = needed a hint */
  const total=()=>SETS.reduce((a,x)=>a+x.words.reduce((b,w)=>b+(lit(w)===2?1:lit(w)===1?.5:0),0),0)/8;
  const cardFace=(set,w,on)=>{
    const c=el('div','kc'+(on?' on':''));
    if(set.img){const im=el('img');im.src=set.img(w);im.alt='';im.draggable=false;c.append(im);}
    else{c.classList.add('ph');c.append(el('span','',on?w:''));}
    return c;
  };
  function drawPower(msg){
    backFn=()=>{if(awake())wake();else d.remove();};d.classList.remove('pw');dp.replaceChildren();G.cards=G.cards||{};
    {const gb=el('button','grab','▾');gb.onclick=()=>backFn();dp.append(gb);let y0=null;dp.onpointerdown=e=>{y0=dp.scrollTop<=0?e.clientY:null;};dp.onpointerup=e=>{if(y0!=null&&e.clientY-y0>70)backFn();y0=null;};}
    dp.append(head(false));
    const rows=el('div','kcs');dp.append(rows);
    let next=null;
    SETS.forEach(set=>{
      const row=el('div','kcr');row.append(el('div','ep','Gate '+set.ep));
      const line=el('div','kl');
      set.words.forEach(w=>{
        const own=set.have(w),st=lit(w),slot=el('button','kslot'+(st===2?' full':st===1?' dim':own?' ready':' none'));
        if(own){slot.append(cardFace(set,w,st>0));
          if(st===1)slot.append(el('b','','½'));
          slot.onclick=()=>{if(st===2){speak(w);sfx('tick');}else{recallCard(set,w);}};
          if(!next&&st<2)next=slot;
        }else{}
        line.append(slot);
      });
      row.append(line);rows.append(row);
    });
    /* Nara's silver card: the reward for lighting every card */
    const all=SETS.every(x=>x.words.every(w=>lit(w)===2));
    const sv=el('button','silver'+(all?' on':G.silver?' on':''));sv.append(el('span','',all||G.silver?'NARA':'?'));
    sv.onclick=()=>{if(!all&&!G.silver){sfx('buzz');talk('Light every card first.');return;}if(!G.silver){G.silver=1;save();}openGateShow('Nara\'s silver card. It opens the tower.');};
    rows.append(sv);
    const t=total();
    talk(msg||(t>=1?'All lit. Take the silver card!':!SETS.some(x=>x.words.some(w=>x.have(w)))?'Earn some cards first.':'Tap a glowing card. Hear it. Spell it.'));
    if(next)next.classList.add('pulse');
  }
  const fillFor=w=>(typeof E9_FILL!=='undefined'?E9_FILL:[]).find(x=>x.w===w);
  async function openGateShow(line){
    talk(line);sfx('whoosh');
    const t0=performance.now();
    await new Promise(r=>{(function f(){const k=Math.min(1,(performance.now()-t0)/3000);post({reveal:k});if(k<1)requestAnimationFrame(f);else r();})();});
    await new Promise(r=>setTimeout(r,3200));
    const t1=performance.now();(function f(){const k=Math.min(1,(performance.now()-t1)/1500);post({reveal:1-k});if(k<1)requestAnimationFrame(f);})();
  }
  async function recallCard(set,w){
    backFn=()=>drawPower();
    d.classList.add('pw');dp.replaceChildren();dp.append(head(false));
    const body=el('div','rc'),kb=el('div','kb');dp.append(body,kb);
    talk('Listen. Spell it. No help from me.');
    const res=await recall(w,body,kb);
    if(!d.isConnected)return;
    if(typeof e9Rec==='function')e9Rec(w,res.ok,'recall');
    const before=lit(w),setBefore=set.words.every(x=>lit(x)===2);
    if(res.ok){G.cards[w]=res.hint?Math.max(before,1):2;sfx('good');if(typeof burst==='function')burst(8);}else sfx('zap');
    save();
    const e0=curE,e1=total();rampCharge(e0,e1,1200);
    if(set.tint)post({color:set.tint});
    const doneSet=set.words.every(x=>lit(x)===2);
    await new Promise(r=>setTimeout(r,res.ok?900:1500));
    if(res.ok&&doneSet&&!setBefore){drawPower();await openGateShow('Gate '+set.ep+' is awake!');drawPower('Gate '+set.ep+' is awake!');return;}
    drawPower(res.ok?(res.hint?'Half lit. Try again with no help.':gPick(GATE_SAY.good)):'Not yet. Tap it to try again.');
  }
  /* one word, typed from memory. 3 tries. a hint costs charge. */
  function recall(w,body,kb){
    return new Promise(res=>{
      body.replaceChildren();kb.replaceChildren();
      const fl=fillFor(w),useSent=fl&&Math.random()<.5;
      let buf='',tries=0,hint=false,done=false;
      const lett=el('div','lett');const cells=[...w].map(()=>el('div','',''));cells.forEach(c=>lett.append(c));
      const spk=el('button','spk','🔊');spk.onclick=()=>speak(w);
      if(useSent){const s=el('div','sent','');const parts=fl.s.split('___');s.append(parts[0]);s.append(el('u','',' '));s.append(parts[1]||'');body.append(s,lett);}
      else{body.append(spk,lett);setTimeout(()=>speak(w),300);}
      const paint=()=>cells.forEach((c,i)=>{c.textContent=(buf[i]||'').toUpperCase();});
      const key=(t,cls,fn)=>{const b=el('button',cls||'',t);b.onclick=()=>{if(!done)fn();};return b;};
      ['qwertyuiop','asdfghjkl','zxcvbnm'].forEach((r,ri)=>{const row=el('div','kr');
        if(ri===2)row.append(key('?','w hint',()=>{if(hint||buf.length)return;hint=true;buf=w[0];paint();talk(GATE_SAY.hint[0]);}));
        [...r].forEach(ch=>row.append(key(ch,'',()=>{if(buf.length<w.length){buf+=ch;paint();sfx('tick');}})));
        if(ri===2)row.append(key('⌫','w',()=>{if(hint&&buf.length<=1)return;buf=buf.slice(0,-1);paint();}));
        kb.append(row);});
      const sub=el('div','kr');
      const ok=key('✓ Check','ok w',()=>{
        if(buf.length<w.length)return;
        if(buf===w){finish(true);return;}
        tries++;cells.forEach(c=>c.classList.add('bad'));sfx('zap');
        setTimeout(()=>cells.forEach(c=>c.classList.remove('bad')),600);
        if(tries>=3){cells.forEach((c,i)=>{c.textContent=w[i].toUpperCase();});finish(false);return;}
        talk(gPick(GATE_SAY.bad));buf=hint?w[0]:'';paint();speak(w);
      });
      ok.style.maxWidth='none';ok.style.flex='1';sub.append(ok);kb.append(sub);
      function finish(good){done=true;res({ok:good,hint});}
    });
  }

  /* ---------- 3 · WAKE: the whole screen is the gate; tap it to go through ---------- */
  /* gates: one per episode. swipe the gate sideways (or tap a dot) to go to the next one. */
  const GATE_SCENE={8:'tower',9:'tower'};
  const RELICS=['amber','lamp','helmet','drone','obelisk'];
  const relics=()=>{const L=gateState();if(!L.loot)L.loot={};if(!L.loot.relics)L.loot.relics={};return L.loot.relics;};
  const gateOn=i=>SETS[i].words.every(w=>lit(w)===2)||/[?&]force=1/.test(location.search);
  const awake=()=>gateNext()<0&&SETS.some((_,i)=>gateOn(i));
  let cur=-1,busy=false,wkEls=[],dots=null,hintEl=null,arL=null,arR=null;
  function showGate(i,anim){
    cur=i;const on=gateOn(i),S0=SETS[i];
    post({color:S0.tint});post({charge:on?1:.12});
    const t0=performance.now(),from=on?0:.85,to=on?.85:0;
    (function f(){const k=Math.min(1,(performance.now()-t0)/(anim?1600:1));post({reveal:from+(to-from)*k});if(k<1&&d.isConnected&&cur===i)requestAnimationFrame(f);})();
    if(hintEl)hintEl.textContent=on?(GATE_SCENE[S0.ep]?'TAP THE GATE':'GATE '+S0.ep+' IS AWAKE'):'GATE '+S0.ep+' · ASLEEP';
    if(arL){arL.style.visibility=i>0?'visible':'hidden';arR.style.visibility=i<SETS.length-1?'visible':'hidden';}
    if(dots)[...dots.children].forEach((x,j)=>{x.className='dt'+(j===i?' cur':'')+(gateOn(j)?' on':'');});
  }
  function wake(){
    if(!awake())return false;
    d.classList.remove('pw');d.classList.add('wake');wkEls.forEach(x=>x.remove());wkEls=[];
    hintEl=el('div','wk','');
    backFn=()=>{if(!busy)d.remove();};pb.style.opacity=1;
    const cd=el('button','wkb','Cards');cd.style.right='12px';cd.onclick=()=>{if(busy)return;d.classList.remove('wake');wkEls.forEach(x=>x.remove());wkEls=[];drawPower();};
    arL=el('div','swh l','‹');arR=el('div','swh r','›');arL.onclick=()=>swipe(-1);arR.onclick=()=>swipe(1);
    dots=el('div','dts');SETS.forEach((_,j)=>{const x=el('i','dt');x.onclick=()=>{if(!busy&&j!==cur){sfx('tick');showGate(j,true);}};dots.append(x);});
    const strip=el('div','rlc');const have=relics();RELICS.forEach(id=>{const sl=el('i','rs'+(have[id]?' on':''));if(have[id])sl.style.backgroundImage='url('+have[id]+')';strip.append(sl);});
    d.append(hintEl,cd,dots,arL,arR,strip);wkEls=[hintEl,cd,dots,arL,arR,strip];
    let i0=cur>=0?cur:-1;if(i0<0)for(let j=0;j<SETS.length;j++)if(gateOn(j))i0=j;
    setTimeout(()=>showGate(i0,true),400);
    return true;
  }
  function swipe(dir){if(busy||!d.classList.contains('wake'))return;const n=cur+dir;if(n<0||n>=SETS.length)return;sfx('whoosh');showGate(n,true);}
  function stepThrough(){
    if(busy)return;
    if(!gateOn(cur)){sfx('buzz');return;}
    if(!GATE_SCENE[SETS[cur].ep]){sfx('buzz');if(hintEl)hintEl.textContent='NOTHING BEYOND IT YET';return;}
    busy=true;sfx('whoosh');wkEls.forEach(x=>x.style.opacity=0);pb.style.opacity=0;
    post({reveal:1,charge:1});post({enter:1});
    /* pre-warm the scene behind the flash */
    pk=document.createElement('iframe');pk.className='pkf';pk.src='gate/index.html?embed=1&peek='+GATE_SCENE[SETS[cur].ep]+'&have='+Object.keys(relics()).join(',')+'&v=4';
    pk.style.cssText='position:fixed;inset:0;width:100%;height:100%;border:0;z-index:65;opacity:0;transition:opacity .9s;background:#000';
    d.append(pk);
  }
  let pk=null,fl=null;
  function arrive(){
    if(!pk)return;
    fl=el('div','flash');d.append(fl);requestAnimationFrame(()=>{fl.style.opacity=1;});
    const show=()=>{pk.style.opacity=1;fl.style.opacity=0;setTimeout(()=>fl.remove(),700);hud();};
    setTimeout(show,520);
  }
  let afterExit=null;
  function hud(){
    const out=el('button','wkb','✕');out.style.cssText+=';right:12px;z-index:80;position:fixed';
    const cnt=el('b','wkb','Relics '+Object.keys(relics()).length+' / '+RELICS.length);cnt.style.cssText+=';left:12px;z-index:80;position:fixed;padding:5px 10px';
    d.append(cnt,out);
    let done=false;
    const onm=e=>{if(!pk||e.source!==pk.contentWindow)return;const m=e.data||{};
      if(m.peekCollected){const R=relics();if(m.id&&!R[m.id]){R[m.id]=m.thumb||'x';const n=Object.keys(R).length;save();sfx('good');try{earn(1);}catch(_){}
        cnt.textContent='Relics '+n+' / '+RELICS.length;if(n===RELICS.length){try{earn(5);}catch(_){}}}else sfx('good');}
      if(m.peekExit)leave();};
    addEventListener('message',onm);
    function leave(){if(done)return;done=true;removeEventListener('message',onm);cnt.remove();out.remove();
      const fl2=el('div','flash');fl2.style.transition='opacity .45s';d.append(fl2);requestAnimationFrame(()=>{fl2.style.opacity=1;});sfx('whoosh');
      setTimeout(()=>{if(pk){pk.remove();pk=null;}busy=false;afterExit=fl2;ready=false;fr.src=fr.src;},520);}
    out.onclick=leave;
  }
  if(gateNext()>=0)drawBuild(G.mask===0?gPick(GATE_SAY.hello):'');else if(!wake())drawPower();
  curE=gateNext()<0?total():0;
}
