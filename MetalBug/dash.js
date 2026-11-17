/* =========================================================
   Gate workshop · Kip sells the gate's parts for bug parts.
   The 3D gate lives in gate/index.html?embed=1 (iframe); this
   file drives it by postMessage. Parts are bought, not filled.
   ========================================================= */
const GATE_PARTS=[
 {n:'Foundation plate',cost:2,say:'The base. Everything stands on it, so we start here.'},
 {n:'Left pillar, low',cost:3,say:'Left side. Heavy, so do not drop it on my foot.'},
 {n:'Right pillar, low',cost:3,say:'Right side now. It has to match the left one.'},
 {n:'Left pillar, high',cost:4,say:'The runes on this one are the old kind. Careful.'},
 {n:'Right pillar, high',cost:4,say:'Nearly there. The frame is starting to look like a gate.'},
 {n:'Arch, left',cost:5,say:'The arch holds the portal in. No arch, no door.'},
 {n:'Keystone',cost:6,say:'The keystone. Everything leans on this piece.'},
 {n:'Arch, right',cost:5,say:'The last piece. After this, it only needs power.'}
];
(function(){const s=document.createElement('style');s.textContent=`
#dash{position:fixed;inset:0;z-index:60;background:#05070e;display:flex;flex-direction:column}
#dash iframe{border:0;width:100%;height:48dvh;flex:none;background:#05070e}
#dash .dp{flex:1;min-height:0;overflow:auto;padding:14px 14px 18px;display:flex;flex-direction:column;gap:10px;background:var(--ink) radial-gradient(rgba(255,255,255,.045) 1.4px,transparent 1.6px) 0 0/11px 11px;clip-path:polygon(0 14px,100% 0,100% 100%,0 100%);margin-top:-14px;padding-top:28px}
#dash .kip{display:flex;gap:10px;align-items:flex-start}
#dash .kip .pt i{width:76px;height:76px}
#dash .say{flex:1;font:700 16px/1.3 var(--bd);color:var(--ink);background:var(--paper);border:3px solid #000;box-shadow:4px 4px 0 #000;padding:9px 12px;position:relative}
#dash .say:before{content:'';position:absolute;left:-12px;top:16px;border:8px solid transparent;border-right:10px solid #000}
#dash .bal{display:flex;justify-content:space-between;font:700 13px var(--bd);letter-spacing:.1em;text-transform:uppercase;color:var(--teal)}
#dash .bal b{color:var(--yellow)}
#dash .shop{display:flex;flex-direction:column;gap:7px}
#dash .item{display:flex;align-items:center;gap:10px;font:700 15px var(--bd);color:var(--paper);background:#10162c;border:3px solid #000;padding:8px 10px}
#dash .item span{flex:1}
#dash .item.own{opacity:.55}
#dash .item button{font:400 20px var(--hd);letter-spacing:.04em;color:var(--ink);background:var(--yellow);border:3px solid #000;box-shadow:3px 3px 0 #000;padding:3px 12px 5px}
#dash .item button:disabled{background:#3a4468;color:#8a95c0;box-shadow:none}
#dash .item.next{border-color:var(--yellow)}
#dash .bk{align-self:flex-start;font:700 14px var(--bd);color:#9aa7d6;background:none;border:2px dashed #55618f;padding:6px 14px}
`;document.head.append(s);})();

function gateState(){if(!S.gate)S.gate={mask:0};return S.gate;}
function gateCount(){const m=gateState().mask;let n=0;for(let i=0;i<8;i++)if(m&(1<<i))n++;return n;}
/* parts must be bought in order, so the gate always looks designed, never random */
function gateNext(){const m=gateState().mask;for(let i=0;i<8;i++)if(!(m&(1<<i)))return i;return -1;}

function dashButton(){
  const b=el('button','go alt','🔧 Gate workshop');b.style.cssText+=';font-size:22px;padding:8px 10px';
  b.onclick=()=>{Snd.init();Snd.resume();openDash();};return b;
}
function openDash(){
  document.querySelector('#dash')?.remove();
  const G=gateState();
  const d=el('div','');d.id='dash';
  const fr=document.createElement('iframe');fr.src='gate/index.html?embed=1&loc=woods&beyond=city&charge='+(gateNext()<0?.35:0)+'&parts=0&v=9';
  fr.setAttribute('allow','');
  const dp=el('div','dp');
  const kip=el('div','kip');kip.append(P_KIP());
  const say=el('div','say','');kip.append(say);
  const bal=el('div','bal');
  const shop=el('div','shop');
  const bk=el('button','bk','◂ Back');bk.onclick=()=>{d.remove();};
  dp.append(kip,bal,shop,bk);d.append(fr,dp);document.body.append(d);
  const post=(o)=>{try{fr.contentWindow.postMessage(o,'*');}catch(_){}};
  let tk=0;const talk=t=>{const id=++tk,t0=performance.now();say.textContent='';(function f(){if(!d.isConnected||id!==tk)return;const n=Math.min(t.length,Math.ceil((performance.now()-t0)/22));say.textContent=t.slice(0,n);if(n<t.length)requestAnimationFrame(f);})();};
  let ready=false;
  const onMsg=e=>{if(e.data==='gate-ready'&&!ready){ready=true;post({mask:G.mask,anim:false});}};
  addEventListener('message',onMsg);
  const rm=new MutationObserver(()=>{if(!d.isConnected){removeEventListener('message',onMsg);rm.disconnect();}});rm.observe(document.body,{childList:true});
  function draw(msg){
    bal.replaceChildren(el('span','','Parts ready to spend'),el('b','','🔧 '+(S.parts||0)));
    shop.replaceChildren();
    const nx=gateNext();
    GATE_PARTS.forEach((p,i)=>{
      const own=!!(G.mask&(1<<i));
      const row=el('div','item'+(own?' own':i===nx?' next':''));
      row.append(el('span','',(own?'✓ ':'')+p.n));
      if(!own){
        const b=el('button','','🔧 '+p.cost);
        b.disabled=i!==nx||(S.parts||0)<p.cost;
        b.onclick=()=>buy(i);
        row.append(b);
      }
      shop.append(row);
    });
    if(msg)talk(msg);
  }
  function buy(i){
    const p=GATE_PARTS[i];
    if(i!==gateNext()||(S.parts||0)<p.cost)return;
    S.parts-=p.cost;G.mask|=1<<i;save();
    partsEl.lastChild.textContent=S.parts;
    sfx('card');post({mask:G.mask,anim:true});
    setTimeout(()=>sfx('pin'),950);
    const done=gateNext()<0;
    draw(done?'That is every piece. She is complete. Without power she is just a pretty statue, though. Finn will need to remember what he learned to wake her.':p.say);
  }
  const nx=gateNext(),first=G.mask===0;
  const need=nx>=0?GATE_PARTS[nx].cost-(S.parts||0):0;
  draw(nx<0?'The gate is built. Power comes next.'
    :first?'Welcome to my workshop. I have gate parts. You have bug parts. Fair trade?'
    :need>0?`Next up is the ${GATE_PARTS[nx].n.toLowerCase()}. You are ${need} part${need>1?'s':''} short. Go earn them.`
    :`I have the ${GATE_PARTS[nx].n.toLowerCase()} ready for you.`);
}
