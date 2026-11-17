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
  let thumbs=null,ready=false,tk=0,say,curE=gateEnergy();
  const now=()=>Date.now();
  const onMsg=e=>{
    if(e.source!==fr.contentWindow)return;
    if(e.data==='gate-ready'&&!ready){ready=true;post({mask:G.mask,anim:false,charge:curE});}
    else if(e.data&&e.data.thumbs){thumbs=e.data.thumbs;if(gateNext()>=0)drawBuild();}
  };
  addEventListener('message',onMsg);
  new MutationObserver((_,o)=>{if(!d.isConnected){removeEventListener('message',onMsg);o.disconnect();}}).observe(document.body,{childList:true});
  const talk=t=>{if(!say)return;const id=++tk,t0=performance.now();say.textContent='';(function f(){if(!d.isConnected||id!==tk)return;const n=Math.min(t.length,Math.ceil((performance.now()-t0)/22));say.textContent=t.slice(0,n);if(n<t.length)requestAnimationFrame(f);})();};
  const head=(withBal)=>{const k=el('div','kip');k.append(P_KIP());say=el('div','say','');k.append(say);if(withBal)k.append(el('div','bal','🔧 '+(S.parts||0)));return k;};
  const back=()=>{const b=el('button','bk','◂ Back');b.onclick=()=>d.remove();return b;};
  const rampCharge=(from,to,ms=900)=>{curE=to;const t0=performance.now();(function f(){if(!d.isConnected)return;const k=Math.min(1,(performance.now()-t0)/ms);post({charge:from+(to-from)*k});if(k<1)requestAnimationFrame(f);})();};

  /* ---------- 1 · BUILD ---------- */
  function drawBuild(msg){
    d.classList.remove('pw');dp.replaceChildren();
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
    dp.append(back());
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

  /* ---------- 2 · POWER ---------- */
  function drawPower(){
    d.classList.remove('pw');dp.replaceChildren();
    dp.append(head(false));
    const e=gateEnergy();
    const b=el('button','pwr',e>.92?'⚡ Full':'⚡ Wake the gate');
    b.onclick=()=>session();
    dp.append(b);
    dp.append(back());
    talk(e>.92?gPick(GATE_SAY.full):e<.05?gPick(GATE_SAY.cold):'She is '+(e<.5?'dim':'warm')+'. Keep her going.');
  }
  /* words he has actually met; those charged recently sit out for 4 hours */
  function recallPool(){
    const E=S.e9&&S.e9.words||{},fallback=['city','giant','cage','face','nice','race','gem','huge','page','ice'];
    const ep8=Object.keys(S.stats||{}).concat(S.earned||[]).map(w=>String(w).toLowerCase());
    let ws=[...new Set(Object.keys(E).concat(ep8))].filter(w=>/^[a-z]{2,10}$/.test(w));
    if(ws.length<6)ws=ws.concat(fallback.filter(w=>!ws.includes(w)));
    return {elig:ws.filter(w=>now()-(G.wl[w]||0)>4*36e5),all:ws};
  }
  const fillFor=w=>(typeof E9_FILL!=='undefined'?E9_FILL:[]).find(x=>x.w===w);
  async function session(){
    const {elig,all}=recallPool();
    if(elig.length<3&&!/[?&]force=1/.test(location.search)){talk(gPick(GATE_SAY.rest));return;}
    d.classList.add('pw');
    const src=elig.length>=6?elig:elig.concat(all.filter(w=>!elig.includes(w)));
    const words=src.map(w=>({w,k:(typeof e9Weak==='function'?e9Weak(w):1)+Math.random()*1.5})).sort((a,b)=>b.k-a.k).slice(0,6).map(x=>x.w);
    dp.replaceChildren();dp.append(head(false));
    const plate=el('div','plate');words.forEach(()=>plate.append(el('i','')));dp.append(plate);
    const body=el('div','rc');dp.append(body);
    const kb=el('div','kb');dp.append(kb);
    talk('Listen. Spell it. No help from me.');
    let gained=0;const startE=gateEnergy();
    for(let n=0;n<words.length;n++){
      if(!d.isConnected)return;
      const w=words[n],res=await recall(w,body,kb);
      plate.children[n].classList.add(res.ok?'on':'bad');
      const fresh=now()-(G.wl[w]||0)>4*36e5;
      if(typeof e9Rec==='function')e9Rec(w,res.ok,'recall');
      if(res.ok){
        sfx('good');if(typeof burst==='function')burst(6);
        const add=fresh?(res.hint?.07:.15):0;
        if(fresh)G.wl[w]=now();
        const e0=curE;rampCharge(e0,Math.min(1,e0+add),700);gained+=add;talk(gPick(GATE_SAY.good));
      }else{sfx('zap');talk(gPick(GATE_SAY.reveal));}
      gateSetEnergy(Math.min(1,startE+gained));
      await new Promise(r=>setTimeout(r,res.ok?650:1500));
    }
    if(gateEnergy()>=.9){
      G.opens=(G.opens||0)+1;save();talk(GATE_SAY.open[0]);sfx('whoosh');
      const t0=performance.now();
      await new Promise(r=>{(function f(){const k=Math.min(1,(performance.now()-t0)/3000);post({reveal:k});if(k<1)requestAnimationFrame(f);else r();})();});
      await new Promise(r=>setTimeout(r,3500));
      const t1=performance.now();(function f(){const k=Math.min(1,(performance.now()-t1)/1500);post({reveal:1-k});if(k<1)requestAnimationFrame(f);})();
    }
    drawPower();
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

  if(gateNext()>=0)drawBuild(G.mask===0?gPick(GATE_SAY.hello):'');else drawPower();
}
