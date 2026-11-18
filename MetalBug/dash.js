/* =========================================================
   Gate workshop. Two stages:
   1) BUILD: Kip sells the gate's parts for bug parts. Shown as
      silhouettes on a blueprint, not as a text list.
   2) POWER: the gate runs on memory. Recall words with no options.
   The 3D gate is gate/index.html?embed=1 in an iframe, driven by
   postMessage. Charge is kept between visits.
   ========================================================= */
(function(){const s=document.createElement('style');s.textContent=`
#dash{position:fixed;inset:0;z-index:60;background:#05070e;display:flex;flex-direction:column}
#dash iframe{border:0;width:100%;height:38dvh;flex:none;background:#05070e;transition:height .4s}
#dash.pw iframe{height:30dvh}
#dash.base iframe{height:52dvh}
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

#dash .tb{display:flex;flex:none;background:#0a0e1c;border-top:3px solid #000;padding-bottom:env(safe-area-inset-bottom)}
#dash.pw .tb,#dash.wake .tb{display:none}
#dash .tbb{flex:1;border:0;border-right:3px solid #000;background:#141a33;color:#7f8bbd;font:400 21px var(--hd);letter-spacing:.08em;padding:11px 0 9px}
#dash .tbb:last-child{border-right:0}
#dash .tbb.on{background:var(--yellow);color:var(--ink)}
#dash .bal{text-align:right;line-height:1}
#dash .bal small{display:block;font:700 11px var(--bd);color:#9aa7d6;letter-spacing:.06em;margin-top:3px;text-transform:uppercase}
#dash .gcs{display:flex;gap:8px;flex:none}
#dash .gc{flex:1;text-align:left;border:3px solid #000;background:#141a33;color:#7f8bbd;padding:7px 9px 8px;box-shadow:3px 3px 0 #000;position:relative}
#dash .gc b{display:block;font:400 22px/1 var(--hd);letter-spacing:.05em}
#dash .gc span{display:block;font:700 11px var(--bd);letter-spacing:.05em;margin-top:2px}
#dash .gc i{display:block;font:700 11px var(--bd);font-style:normal;margin-top:5px;color:var(--yellow)}
#dash .gc.on{background:var(--paper);color:var(--ink)}
#dash .gc.on i{color:#8a1d12}
#dash .gc.open:after{content:'';position:absolute;right:7px;top:7px;width:10px;height:10px;background:#2cc8ff;border:2px solid #000;transform:rotate(45deg)}
#dash .gc.seal:after{content:'🔒';position:absolute;right:6px;top:4px;font-size:14px;background:none;border:0;transform:none;width:auto;height:auto}
#dash .pnts{display:flex;gap:8px;align-items:center;justify-content:center;flex:none}
#dash .pnts span{font:700 12px var(--bd);color:#9aa7d6;letter-spacing:.05em}
#dash .pn{width:28px;height:28px;border:3px solid #000;transform:rotate(45deg);padding:0}
#dash .pn.on{box-shadow:0 0 0 3px #fff}
#dash .shelf{display:grid;grid-template-columns:repeat(5,1fr);gap:7px;flex:none;padding-bottom:9px;border-bottom:7px solid #3a2a1c;box-shadow:0 5px 0 #000}
#dash .rl{aspect-ratio:1;border:3px solid #000;background:#0b1a22 center/cover;padding:0;position:relative;display:flex;align-items:center;justify-content:center;font:400 28px var(--hd);color:#27414f;box-shadow:3px 3px 0 #000}
#dash .rl.have{border-color:#7fe3ff}
#dash .rl.sel{outline:3px solid var(--yellow);outline-offset:2px}
#dash .rl.have.gl{color:#cfeaf5}
#dash .rl b{position:absolute;right:-6px;top:-8px;background:var(--yellow);color:var(--ink);border:2px solid #000;font:400 13px var(--hd);padding:0 4px}
#dash .insp{display:flex;gap:12px;align-items:flex-start;flex:none;background:rgba(255,255,255,.05);border:2px dashed #3a4676;padding:10px}
#dash .insp .big{width:104px;height:104px;flex:none;border:3px solid #000;background:#0b1a22 center/cover;box-shadow:4px 4px 0 #000;display:flex;align-items:center;justify-content:center;font:400 44px var(--hd);color:#27414f}
#dash .insp h3{font:400 26px/1 var(--hd);letter-spacing:.04em;color:var(--yellow);margin:0 0 4px}
#dash .insp p{font:700 14px/1.3 var(--bd);color:var(--paper);margin:0 0 8px}
#dash .insp p.sm{font-weight:400;font-size:12px;color:#9aa7d6}
#dash .cta{font:400 20px var(--hd);letter-spacing:.05em;color:var(--ink);background:var(--yellow);border:3px solid #000;box-shadow:3px 3px 0 #000;padding:6px 14px 8px}
#dash .bn{display:flex;gap:10px;align-items:center;flex:none;border:3px solid #000;background:#141a33;padding:8px;box-shadow:3px 3px 0 #000}
#dash .bn .ic{width:54px;height:54px;flex:none;border:3px solid #000;background:#0b1a22 center/cover;display:flex;align-items:center;justify-content:center;font:400 24px var(--hd);color:#27414f}
#dash .bn .tx{flex:1;min-width:0}
#dash .bn h4{font:400 20px/1 var(--hd);letter-spacing:.04em;color:var(--paper);margin:0 0 3px}
#dash .bn p{font:700 12px/1.25 var(--bd);color:#9aa7d6;margin:0}
#dash .bn.lock{opacity:.6}
#dash .bn.lock h4{color:#7f8bbd}
#dash .buy{flex:none;min-width:62px;font:400 22px var(--hd);color:var(--ink);background:var(--yellow);border:3px solid #000;box-shadow:3px 3px 0 #000;padding:6px 8px 8px}
#dash .buy.poor{background:#8a7a2a}
#dash .buy.ok{background:var(--good);box-shadow:none;font-size:15px;padding:9px 8px}
#dash .buy.no{background:#27304f;color:#7f8bbd;box-shadow:none;font-size:13px;padding:10px 6px}
#dash .caught{position:absolute;inset:0;z-index:90;background:rgba(10,0,4,.9);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:24px;text-align:center}
#dash .caught h2{font:400 68px/1 var(--hd);color:#ff3b4e;-webkit-text-stroke:3px #000;paint-order:stroke fill;letter-spacing:.05em;margin:0;transform:rotate(-3deg);text-shadow:5px 5px 0 #000}
#dash .caught p{font:700 16px/1.35 var(--bd);color:var(--paper);margin:0;max-width:300px}
#dash .caught .lost{display:flex;gap:8px;justify-content:center}
#dash .caught .lost i{width:52px;height:52px;border:3px solid #000;background:#0b1a22 center/cover;filter:grayscale(1) brightness(.6);position:relative}
#dash .caught .lost i:after{content:'✕';position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#ff3b4e;font:400 36px var(--hd);filter:none}
#dash .toast{position:fixed;left:12px;right:12px;top:calc(56px + env(safe-area-inset-top));z-index:85;background:var(--paper);color:var(--ink);border:3px solid #000;box-shadow:4px 4px 0 #000;font:700 15px/1.3 var(--bd);padding:8px 12px;text-align:center;transition:opacity .4s;pointer-events:none;display:flex;gap:8px;align-items:center;justify-content:center;flex-wrap:wrap}
#dash .toast i{width:34px;height:34px;border:2px solid #000;background:#0b1a22 center/cover}
#dash .seg{display:flex;flex:none;border:3px solid #000;box-shadow:3px 3px 0 #000}
#dash .seg button{flex:1;border:0;background:#141a33;color:#7f8bbd;font:400 21px var(--hd);letter-spacing:.07em;padding:7px 0 6px}
#dash .seg button+button{border-left:3px solid #000}
#dash .seg button.on{background:var(--paper);color:var(--ink)}
#dash .holdc{position:fixed;left:12px;right:12px;top:calc(54px + env(safe-area-inset-top));z-index:85;background:var(--paper);color:var(--ink);border:3px solid #000;box-shadow:4px 4px 0 #000;padding:8px 12px;pointer-events:none}
#dash .holdc h3{font:400 24px/1 var(--hd);letter-spacing:.04em;margin:0 0 3px}
#dash .holdc p{font:700 13px/1.3 var(--bd);margin:0}
#dash .lvl{flex:none;font:700 12px var(--bd);letter-spacing:.08em;color:#9aa7d6;text-align:center}
#dash .cov{position:fixed;inset:0;z-index:61;background:#000;opacity:0;pointer-events:none;transition:opacity .35s}
`;document.head.append(s);})();


const RELICS=['amber','lamp','helmet','drone','obelisk'];
const RELIC_INFO={
 amber:{n:'Amber specimen',lore:'Something older than the city sleeps inside it.'},
 lamp:{n:'Iridescent lamp',lore:'It still glows. Nobody knows what feeds it.'},
 helmet:{n:'Pilot helmet',lore:'A pilot\'s. Far too small for a grown man.'},
 drone:{n:'Scout drone',lore:'It stopped in the middle of a search. Kip says it was looking for a gate.'},
 obelisk:{n:'Obelisk shard',lore:'Cut with no tool Kip knows. The edges hum.'}
};
/* the secret base: decorate inside, build scrap weapons outside. A relic is the star piece of some of them. */
const BASE_ITEMS=[
 {id:'sign',v:'in',name:'Neon Sign',cost:8,desc:'Every base needs a name.'},
 {id:'bench',v:'in',name:'Workbench',cost:12,desc:'Scrap table, a generator and a work lamp.'},
 {id:'bunk',v:'in',name:'Bunk Tent',cost:10,desc:'Somewhere to sleep between missions.'},
 {id:'chest',v:'in',name:'Stash Chest',cost:12,desc:'Where the shiny things go.'},
 {id:'map',v:'in',name:'City Map',cost:16,desc:'A live map of the ruined city.'},
 {id:'rack',v:'in',name:'Blaster Rack',cost:14,desc:'Spare blasters, ready to grab.'},
 {id:'amber',v:'in',name:'Amber Display',cost:6,relic:'amber',desc:'A stand for the amber. Tap it to pick it up and turn it.'},
 {id:'lamp',v:'in',name:'Lamp Stand',cost:6,relic:'lamp',desc:'The lamp glows on a crate. Tap it to hold it.'},
 {id:'helmet',v:'in',name:'Helmet Mount',cost:6,relic:'helmet',desc:'Hang the pilot helmet on the wall. Tap it to hold it.'},
 {id:'blaster',v:'out',name:'Scrap Blaster',cost:14,desc:'Crates, a barrel and a salvaged blaster. Tap to fire.'},
 {id:'twin',v:'out',name:'Twin Laser',cost:24,relic:'obelisk',desc:'Two barrels, powered by the obelisk shard.'},
 {id:'sentry',v:'out',name:'Sentry Drone',cost:20,relic:'drone',desc:'The scout drone, rebuilt to guard the yard.'},
 {id:'dish',v:'out',name:'Radar Dish',cost:10,desc:'Watches the sky for Watchers.'},
 {id:'wall',v:'out',name:'Scrap Wall',cost:8,desc:'A fence made of salvage.'},
 {id:'light',v:'out',name:'Searchlight',cost:12,desc:'Sweeps the yard all night.'}
];
const BASE_RANKS=[[14,'Fortress'],[10,'Stronghold'],[6,'Safe house'],[3,'Hideout'],[0,'Scrap heap']];
const GATE_SAY={
 hello:['Fix the gate? I sell the parts. You bring bug parts.','Parts for parts. Fair trade.'],
 short:['Not enough yet. Go earn some.','Too light. Come back with more.'],
 bought:['Heavy. Mind your toes.','That fits.','Look at that. Hand-cut.','Better.','Keep going.','Solid.'],
 done:['That is all of it. But she is cold. She runs on memory.'],
 hint:['Fine. One letter. It costs you.'],
 good:['Yes!','That is it.','She hummed.','Right.','Spot on.'],
 bad:['Not quite. Listen again.','Close. Check each sound.','Careful now.']
};
const gPick=a=>a[Math.floor(Math.random()*a.length)];
function gateState(){if(!S.gate)S.gate={mask:0};const g=S.gate;if(g.energy==null){g.energy=0;g.t=Date.now();}if(!g.wl)g.wl={};if(!g.opens)g.opens=0;if(!g.ms)g.ms={};if(!g.seal)g.seal={};if(!g.kip)g.kip={own:{},fuse:0,paint:{}};if(!g.base)g.base={built:{}};if(!g.loot)g.loot={};if(!g.loot.relics)g.loot.relics={};if(!g.loot.cnt)g.loot.cnt={};return g;}
function dashButton(){
  const b=el('button','go alt','🔧 Gate workshop');b.style.cssText+=';font-size:22px;padding:8px 10px';
  b.onclick=()=>{Snd.init();Snd.resume();openDash();};return b;
}
function openDash(initialTab='gates'){
  document.querySelector('#dash')?.remove();
  const G=gateState(),K=G.kip;
  const force=/[?&]force=1/.test(location.search);
  /* each gate stands somewhere different, is built from its own set of parts, and runs on its own four cards */
  const GATES=[
    {ep:8,name:'THE WOODS',loc:'woods',bey:'city',tint:'cyan',cost:[6,10,10,14,14,18,22,16],words:CARDS.slice(),have:w=>(S.earned||[]).includes(w),img:w=>CARD[w]},
    {ep:9,name:'THE WALL',loc:'wall',bey:'city',tint:'violet',cost:[8,13,13,18,18,24,29,21],words:['city','giant','cage','face'],have:w=>!!(S.e9&&S.e9.earned&&S.e9.earned.includes(w)),img:w=>CARD[w],night:true}
  ];
  const gmask=i=>i===0?(G.mask|0):(G.ms[GATES[i].ep]|0);
  const setMask=(i,v)=>{if(i===0)G.mask=v;else G.ms[GATES[i].ep]=v;};
  const pop=m=>{let n=0;for(let k=0;k<8;k++)if(m&(1<<k))n++;return n;};
  const built=i=>gmask(i)===255;
  const nextPart=i=>{const m=gmask(i);for(let k=0;k<8;k++)if(!(m&(1<<k)))return k;return -1;};
  const lit=w=>(G.cards&&G.cards[w])||0;
  const pwr=i=>GATES[i].words.reduce((a,w)=>a+(lit(w)===2?1:lit(w)===1?.5:0),0)/GATES[i].words.length;
  const lit2=i=>GATES[i].words.every(w=>lit(w)===2);
  const sealed=i=>!!G.seal[GATES[i].ep];
  const gateOn=i=>built(i)&&(lit2(i)||force);
  const awake=()=>GATES.some((_,i)=>gateOn(i));
  const tint=i=>K.paint[GATES[i].ep]||GATES[i].tint;
  const relics=()=>G.loot.relics;
  const GATE_SCENE={8:'tower',9:'tower'};
  const nBuilt=()=>Object.keys(G.base.built).length;
  const rank=()=>BASE_RANKS.find(r=>nBuilt()>=r[0])[1];
  G.cards=G.cards||{};
  let gi=GATES.findIndex((_,i)=>!gateOn(i));if(gi<0)gi=GATES.length-1;
  const d=el('div','');d.id='dash';
  const fr=document.createElement('iframe');
  const dp=el('div','dp'),tb=el('div','tb');
  d.append(fr,dp,tb);document.body.append(d);
  const post=o=>{try{fr.contentWindow.postMessage(o,'*');}catch(_){}};
  let thumbs=null,ready=false,tk=0,say,curE=pwr(gi),tab='gates',frLoc=-1;
  const frSrc=i=>'gate/index.html?embed=1&loc='+GATES[i].loc+'&beyond='+GATES[i].bey+'&parts=0&charge='+pwr(i).toFixed(2)+'&color='+tint(i)+'&v=12';
  function loadGate(i){if(frLoc===i)return false;frLoc=i;ready=false;fr.src=frSrc(i);return true;}
  loadGate(gi);
  let held=null;
  const onMsg=e=>{
    if(e.source!==fr.contentWindow)return;
    if(e.data==='gate-ready'&&!ready){ready=true;if(frLoc==='base'){uncover();return;}post({mask:gmask(frLoc),anim:false,charge:curE,color:tint(frLoc)});if(d.classList.contains('wake'))wake();if(afterExit){const f=afterExit;afterExit=null;setTimeout(()=>{f.style.opacity=0;setTimeout(()=>f.remove(),600);},350);}uncover();}
    else if(e.data==='gate-tap'){if(d.classList.contains('wake'))stepThrough();}
    else if(e.data==='gate-entered'){arrive();}
    else if(e.data&&e.data.swipe){swipe(e.data.swipe);}
    else if(e.data&&e.data.baseFire){sfx('zap');}
    else if(e.data&&typeof e.data==='object'&&'baseHold' in e.data){const id=e.data.baseHold;dropCard();if(id){held=id;showCard(id);sfx('tick');}else held=null;}
    else if(e.data&&e.data.thumbs){const first=!thumbs;thumbs=e.data.thumbs;if(first&&tab==='gates'&&!d.classList.contains('pw')&&!d.classList.contains('wake'))gatesView();}
  };
  addEventListener('message',onMsg);
  new MutationObserver((_,o)=>{if(!d.isConnected){removeEventListener('message',onMsg);o.disconnect();}}).observe(document.body,{childList:true});
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  const talk=t=>{if(!say)return;const id=++tk,t0=performance.now();say.textContent='';(function f(){if(!d.isConnected||id!==tk)return;const n=Math.min(t.length,Math.ceil((performance.now()-t0)/22));say.textContent=t.slice(0,n);if(n<t.length)requestAnimationFrame(f);})();};
  const balEl=()=>d.querySelector('.bal');
  const refreshBal=()=>{try{partsEl.lastChild.textContent=S.parts||0;}catch(_){}const b=balEl();if(b)b.firstChild.textContent='🔧 '+(S.parts||0);};
  const head=withBal=>{const k=el('div','kip');k.append(P_KIP());say=el('div','say','');k.append(say);if(withBal){const b=el('div','bal','');b.append(document.createTextNode('🔧 '+(S.parts||0)),el('small','',rank()));k.append(b);}return k;};
  const toast=(txt,thumbList)=>{const t=el('div','toast','');if(thumbList)thumbList.forEach(u=>{const i=el('i');if(u&&u!=='x')i.style.backgroundImage='url('+u+')';t.append(i);});t.append(document.createTextNode(txt));d.append(t);setTimeout(()=>{t.style.opacity=0;setTimeout(()=>t.remove(),500);},2600);};
  let cov=null;const cover=()=>{if(!cov){cov=el('div','cov');d.append(cov);}void cov.offsetWidth;cov.style.opacity=1;};const uncover=()=>{if(cov){const c=cov;cov=null;setTimeout(()=>{c.style.opacity=0;setTimeout(()=>c.remove(),500);},300);}};
  let airCleanup=null;
  let backFn=()=>d.remove();
  const pb=el('button','wkb pb','◂');pb.style.left='12px';pb.onclick=()=>backFn();d.append(pb);
  const rampCharge=(from,to,ms=900)=>{curE=to;const t0=performance.now();(function f(){if(!d.isConnected)return;const k=Math.min(1,(performance.now()-t0)/ms);post({charge:from+(to-from)*k});if(k<1)requestAnimationFrame(f);})();};

  /* ---------- tabs ---------- */
  const TABS=[['gates','GATES'],['base','BASE'],['relics','RELICS'],['airdrop','AIRDROP']];
  TABS.forEach(([k,t])=>{const b=el('button','tbb',t);b.dataset.k=k;b.onclick=()=>{if(tab===k&&!d.classList.contains('pw'))return;sfx('tick');({gates:gatesView,base:baseView,relics:relicsView,airdrop:airdropView})[k]();};tb.append(b);});
  const setTab=k=>{airCleanup?.();airCleanup=null;if(held){held=null;dropCard();}d.classList.toggle('base',k==='base');d.classList.toggle('air',k==='airdrop');if(k!=='base'&&frLoc==='base'||k!=='airdrop'&&frLoc==='airdrop'){frLoc=-1;loadGate(gi);}tab=k;[...tb.children].forEach(b=>b.classList.toggle('on',b.dataset.k===k));d.classList.remove('pw');dp.replaceChildren();dp.onpointerdown=dp.onpointerup=null;dp.scrollTop=0;backFn=()=>d.remove();};
  function airdropView(){
    setTab('airdrop');frLoc='airdrop';ready=false;
    if(typeof mountAirdrop==='function')airCleanup=mountAirdrop({d,dp,fr,head,talk,close:()=>{airCleanup?.();airCleanup=null;d.remove();},setBack:fn=>backFn=fn});
  }
  new MutationObserver((_,observer)=>{if(!d.isConnected){airCleanup?.();airCleanup=null;observer.disconnect();}}).observe(document.body,{childList:true});

  /* ---------- GATES: pick a gate, then build it, power it, go through ---------- */
  const state=i=>!built(i)?'BUILD '+pop(gmask(i))+'/8':!lit2(i)?'POWER '+Math.round(pwr(i)*100)+'%':sealed(i)?'SEALED':'OPEN';
  function gatesView(msg){
    setTab('gates');dp.append(head(true));
    const row=el('div','gcs');
    GATES.forEach((g,j)=>{const b=el('button','gc'+(j===gi?' on':'')+(gateOn(j)?(sealed(j)?' seal':' open'):''));b.append(el('b','','GATE '+g.ep),el('span','',g.name),el('i','',state(j)));
      b.onclick=()=>{if(j===gi)return;gi=j;sfx('whoosh');curE=pwr(j);loadGate(j);gatesView();};row.append(b);});
    dp.append(row);
    if(!built(gi))buildPanel(msg);else if(!gateOn(gi))powerPanel(msg);else readyPanel(msg);
  }
  function buildPanel(msg){
    const i=gi,grid=el('div','bp');dp.append(grid);const nx=nextPart(i),cost=GATES[i].cost,m=gmask(i);
    cost.forEach((c,k)=>{
      const own=!!(m&(1<<k));
      const sl=el('button','slot'+(own?' own':k===nx?' next'+((S.parts||0)<c?' poor':''):''));
      if(thumbs){const b=el('i','b');b.style.setProperty('--m',`url(${thumbs[0]})`);const p=el('i','p');p.style.setProperty('--m',`url(${thumbs[k+1]})`);sl.append(b,p);}
      if(!own)sl.append(el('b','',String(c)));
      sl.onclick=()=>{if(k===nx)buy(k,sl);else if(!own){sl.classList.add('shake');setTimeout(()=>sl.classList.remove('shake'),400);sfx('buzz');talk('One at a time. The glowing one.');}};
      grid.append(sl);
    });
    talk(msg||(m===0?(gi===0?gPick(GATE_SAY.hello):'A new gate, a new place. Same trade. Parts for parts.'):'Next part is glowing.'));
  }
  function buy(k,sl){
    const i=gi,c=GATES[i].cost[k];
    if((S.parts||0)<c){sl.classList.add('shake');setTimeout(()=>sl.classList.remove('shake'),400);sfx('buzz');talk(gPick(GATE_SAY.short));return;}
    S.parts-=c;setMask(i,gmask(i)|(1<<k));save();refreshBal();
    sfx('card');post({mask:gmask(i),anim:true});setTimeout(()=>sfx('pin'),950);
    if(built(i)){gatesView();talk(GATE_SAY.done[0]);}else gatesView(gPick(GATE_SAY.bought));
  }
  const cardFace=(g,w,on)=>{const c=el('div','kc'+(on?' on':''));const im=el('img');im.src=g.img(w);im.alt='';im.draggable=false;c.append(im);return c;};
  function powerPanel(msg){
    const g=GATES[gi];const rows=el('div','kcs');dp.append(rows);
    const row=el('div','kcr');const line=el('div','kl');let next=null;
    g.words.forEach(w=>{
      const own=g.have(w),st=lit(w),slot=el('button','kslot'+(st===2?' full':st===1?' dim':own?' ready':' none'));
      if(own){slot.append(cardFace(g,w,st>0));if(st===1)slot.append(el('b','','½'));
        slot.onclick=()=>{if(st===2){speak(w);sfx('tick');}else recallCard(w);};
        if(!next&&st<2)next=slot;}
      line.append(slot);
    });
    row.append(line);rows.append(row);
    if(next)next.classList.add('pulse');
    const any=g.words.some(w=>g.have(w));
    talk(msg||(!any?'No cards for this gate yet. Finish its story first.':'Tap a glowing card. Hear it. Spell it.'));
  }
  function silverBtn(){
    const all=GATES.every((_,i)=>lit2(i));if(!all&&!G.silver)return null;
    const sv=el('button','silver on','');sv.append(el('span','','NARA'));
    sv.onclick=()=>{if(!G.silver){G.silver=1;save();}talk('Nara\'s silver card. It opens the tower.');sfx('card');};return sv;
  }
  function readyPanel(msg){
    const i=gi,s=sealed(i);
    const go=el('button','pwr',s?'🔒 BREAK THE SEAL':'▶ ENTER GATE '+GATES[i].ep);go.onclick=()=>{if(s)breakSeal(i);else{wake();}};dp.append(go);
    const sv=silverBtn();if(sv)dp.append(sv);
    talk(msg||(s?'The guards sealed her. Remember one card to break it.':GATES[i].night?'This one is darker. Guards walk faster. ':'Open. Go and find what is out there.'));
  }
  async function breakSeal(i){
    if(busy)return;
    const g=GATES[i],fromWake=d.classList.contains('wake');
    const pool=g.words.filter(w=>g.have(w)),w=pool[Math.floor(Math.random()*pool.length)]||g.words[0];
    d.classList.remove('wake');wkEls.forEach(x=>x.remove());wkEls=[];d.classList.add('pw');dp.replaceChildren();
    dp.append(head(false));const body=el('div','rc'),kb=el('div','kb');dp.append(body,kb);
    backFn=()=>{if(fromWake)wake();else gatesView();};
    talk('The guards sealed it. Prove you remember. Spell it.');
    const res=await recall(w,body,kb);
    if(!d.isConnected)return;
    if(typeof e9Rec==='function')e9Rec(w,res.ok,'recall');
    if(res.ok){delete G.seal[g.ep];save();sfx('good');if(typeof burst==='function')burst(8);}else sfx('zap');
    await sleep(res.ok?900:1400);
    if(!d.isConnected)return;
    if(fromWake){if(!wake())gatesView();}else gatesView(res.ok?'Seal broken. She is open.':'Still sealed. Try again.');
  }
  async function openGateShow(line){
    talk(line);sfx('whoosh');
    const t0=performance.now();
    await new Promise(r=>{(function f(){const k=Math.min(1,(performance.now()-t0)/3000);post({reveal:k});if(k<1)requestAnimationFrame(f);else r();})();});
    await sleep(3200);
    const t1=performance.now();(function f(){const k=Math.min(1,(performance.now()-t1)/1500);post({reveal:.85*(1-k)});if(k<1)requestAnimationFrame(f);})();
  }
  const fillFor=w=>(typeof E9_FILL!=='undefined'?E9_FILL:[]).find(x=>x.w===w);
  async function recallCard(w){
    const i=gi,g=GATES[i];
    backFn=()=>gatesView();
    d.classList.add('pw');dp.replaceChildren();dp.append(head(false));
    const body=el('div','rc'),kb=el('div','kb');dp.append(body,kb);
    talk('Listen. Spell it. No help from me.');
    const res=await recall(w,body,kb);
    if(!d.isConnected)return;
    if(typeof e9Rec==='function')e9Rec(w,res.ok,'recall');
    const before=lit(w),setBefore=lit2(i);
    if(res.ok){G.cards[w]=res.hint?Math.max(before,1):2;sfx('good');if(typeof burst==='function')burst(8);}else sfx('zap');
    save();
    const e0=curE,e1=pwr(i);rampCharge(e0,e1,1200);
    await sleep(res.ok?900:1500);
    if(!d.isConnected)return;
    if(res.ok&&lit2(i)&&!setBefore){gatesView();await openGateShow('Gate '+g.ep+' is awake!');if(d.isConnected)gatesView('Gate '+g.ep+' is awake!');return;}
    gatesView(res.ok?(res.hint?'Half lit. Try again with no help.':gPick(GATE_SAY.good)):'Not yet. Tap it to try again.');
  }
  /* one word, typed from memory. 3 tries. a hint costs charge. */
  function recall(w,body,kb){
    return new Promise(res=>{
      body.replaceChildren();kb.replaceChildren();
      const fl=fillFor(w),useSent=fl&&Math.random()<.5;
      let buf='',tries=0,hint=false,done=false;
      const lett=el('div','lett');const cells=[...w].map(()=>el('div','',''));cells.forEach(c=>lett.append(c));
      const spk=el('button','spk','🔊');spk.onclick=()=>speak(w);
      if(useSent){const s=el('div','sent','');const parts=fl.s.split('___');s.append(parts[0]);s.append(el('u','',' '));s.append(parts[1]||'');body.append(s,lett);}
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

  /* ---------- BASE: the hideout. inside = decorations, outside = scrap weapons ---------- */
  let bview='in',cardEl2=null;
  const dropCard=()=>{if(cardEl2){cardEl2.remove();cardEl2=null;}};
  const showCard=id=>{const i=RELIC_INFO[id];if(!i)return;cardEl2=el('div','holdc');cardEl2.append(el('h3','',i.n),el('p','',i.lore+'  Drag to spin it. Tap to put it back.'));d.append(cardEl2);};
  function baseSrc(){return 'gate/index.html?embed=1&base=1&view='+bview+'&built='+Object.keys(G.base.built).join(',')+'&v=1';}
  function baseView(msg){
    setTab('base');dp.append(head(true));
    if(frLoc!=='base'){frLoc='base';ready=false;fr.src=baseSrc();}
    const sg=el('div','seg');[['in','INSIDE'],['out','OUTSIDE']].forEach(([k,t])=>{const b=el('button',bview===k?'on':'',t);b.onclick=()=>{if(bview===k)return;bview=k;sfx('whoosh');post({baseView:k});baseView();};sg.append(b);});dp.append(sg);
    const R=relics();
    BASE_ITEMS.filter(it=>it.v===bview).forEach(it=>{
      const built=!!G.base.built[it.id],have=!it.relic||!!R[it.relic];
      const row=el('div','bn'+(have||built?'':' lock'));
      const ic=el('div','ic');if(it.relic&&R[it.relic]&&R[it.relic]!=='x')ic.style.backgroundImage='url('+R[it.relic]+')';else ic.textContent=it.relic?(have?'◆':'?'):it.name[0];
      const tx=el('div','tx');tx.append(el('h4','',it.name),el('p','',have||built?it.desc:'Needs the '+RELIC_INFO[it.relic].n+'. Find it through a gate.'));
      row.append(ic,tx);
      if(built)row.append(el('div','buy ok','BUILT'));
      else if(!have)row.append(el('div','buy no','LOCKED'));
      else{const b=el('button','buy'+((S.parts||0)<it.cost?' poor':''),'🔧'+it.cost);b.onclick=()=>{
        if((S.parts||0)<it.cost){b.classList.add('shake');setTimeout(()=>b.classList.remove('shake'),400);sfx('buzz');talk(gPick(GATE_SAY.short));return;}
        S.parts-=it.cost;G.base.built[it.id]=1;save();refreshBal();sfx('card');setTimeout(()=>sfx('pin'),350);post({baseBuilt:[it.id]});
        baseView('Built. '+it.name+'.');};row.append(b);}
      dp.append(row);
    });
    const n=nBuilt();
    talk(msg||(n===0?'Bare walls. Bring parts and I will make it ours.':bview==='in'?'Drag to look around. Tap a relic to pick it up.':'Tap a weapon to fire it. Drag to look around.'));
  }

  /* ---------- RELICS: the shelf. tap one to look at it ---------- */
  let relSel=null;
  function relicsView(){
    setTab('relics');dp.append(head(true));
    const R=relics(),n=Object.keys(R).length;
    const shelf=el('div','shelf');
    RELICS.forEach(id=>{const have=!!R[id];const b=el('button','rl'+(have?' have':'')+(relSel===id?' sel':''));
      if(have&&R[id]!=='x')b.style.backgroundImage='url('+R[id]+')';else b.textContent=have?RELIC_INFO[id].n[0]:'?';
      if(have&&G.loot.cnt[id]>1)b.append(el('b','','×'+G.loot.cnt[id]));
      b.onclick=()=>{relSel=id;sfx('tick');relicsView();};shelf.append(b);});
    dp.append(shelf);
    if(relSel){
      const id=relSel,have=!!R[id],info=RELIC_INFO[id];
      const ins=el('div','insp'),big=el('div','big');
      if(have&&R[id]!=='x')big.style.backgroundImage='url('+R[id]+')';else big.textContent=have?info.n[0]:'?';
      const tx=el('div','');
      tx.append(el('h3','',have?info.n:'Not found yet'));
      tx.append(el('p','',have?info.lore:'Somewhere in the ruined city. Look for a glint.'));
      if(have){
        const bi=BASE_ITEMS.find(b=>b.relic===id);if(bi){const bt=el('button','cta',G.base.built[bi.id]?'In your base':'Put it in the base');bt.onclick=()=>{bview=bi.v;baseView();};tx.append(bt);}
        tx.append(el('p','sm','Found '+(G.loot.cnt[id]||1)+' time'+((G.loot.cnt[id]||1)>1?'s':'')));
      }
      ins.append(big,tx);dp.append(ins);
      talk(have?'Look at that. Hold it up to the light.':'Not found yet. Go through a gate and look.');
    }else talk(n===0?'Nothing yet. Go through a gate and find something.':n===RELICS.length?'Every relic. The whole shelf. Tap one.':'Tap one to look closer. '+n+' of '+RELICS.length+'.');
  }

  /* ---------- WAKE: the whole screen is the gate; tap it to go through ---------- */
  let cur=-1,busy=false,wkEls=[],dots=null,hintEl=null,arL=null,arR=null;
  const onIdx=()=>GATES.map((_,i)=>i).filter(gateOn);
  function showGate(i,anim){
    cur=i;const on=gateOn(i),dim=!on||sealed(i);
    post({color:tint(i)});post({charge:dim?.12:1});
    const t0=performance.now(),from=dim?.85:0,to=dim?0:.85;
    (function f(){const k=Math.min(1,(performance.now()-t0)/(anim?1600:1));post({reveal:from+(to-from)*k});if(k<1&&d.isConnected&&cur===i)requestAnimationFrame(f);})();
    if(hintEl)hintEl.textContent=!on?'GATE '+GATES[i].ep+' · ASLEEP':sealed(i)?'SEALED · TAP TO BREAK THE SEAL':GATE_SCENE[GATES[i].ep]?'TAP THE GATE':'GATE '+GATES[i].ep+' IS AWAKE';
    const oi=onIdx(),pos=oi.indexOf(i);
    if(arL){arL.style.visibility=pos>0?'visible':'hidden';arR.style.visibility=pos>=0&&pos<oi.length-1?'visible':'hidden';}
    if(dots)[...dots.children].forEach((x,j)=>{x.className='dt'+(j===i?' cur':'')+(gateOn(j)?' on':'');});
  }
  function exitWake(){if(busy)return;d.classList.remove('wake');wkEls.forEach(x=>x.remove());wkEls=[];post({reveal:0,charge:pwr(gi)});curE=pwr(gi);gatesView();}
  function wake(){
    if(!awake())return false;
    d.classList.remove('pw');d.classList.add('wake');wkEls.forEach(x=>x.remove());wkEls=[];
    if(cur<0||!gateOn(cur))cur=onIdx().includes(gi)?gi:onIdx()[0];
    hintEl=el('div','wk','');
    backFn=()=>exitWake();pb.style.opacity=1;
    const cd=el('button','wkb','Workshop');cd.style.right='12px';cd.onclick=()=>exitWake();
    arL=el('div','swh l','‹');arR=el('div','swh r','›');arL.onclick=()=>swipe(-1);arR.onclick=()=>swipe(1);
    dots=el('div','dts');GATES.forEach((_,j)=>{const x=el('i','dt');x.onclick=()=>{if(!busy&&j!==cur&&gateOn(j)){sfx('tick');goGate(j);}};dots.append(x);});
    const strip=el('div','rlc');const have=relics();RELICS.forEach(id=>{const sl=el('i','rs'+(have[id]?' on':''));if(have[id]&&have[id]!=='x')sl.style.backgroundImage='url('+have[id]+')';strip.append(sl);});
    d.append(hintEl,cd,dots,arL,arR,strip);wkEls=[hintEl,cd,dots,arL,arR,strip];
    gi=cur;
    setTimeout(()=>showGate(cur,true),400);
    return true;
  }
  /* each gate is somewhere else: leaving for another one reloads the world */
  function goGate(j){
    if(busy)return;busy=true;sfx('whoosh');cover();
    setTimeout(()=>{gi=j;cur=j;curE=1;busy=false;if(!loadGate(j)){uncover();showGate(j,true);}},400);
  }
  function swipe(dir){if(busy||!d.classList.contains('wake'))return;const oi=onIdx(),p=oi.indexOf(cur)+dir;if(p<0||p>=oi.length)return;goGate(oi[p]);}
  function stepThrough(){
    if(busy)return;
    if(!gateOn(cur)){sfx('buzz');return;}
    if(sealed(cur)){breakSeal(cur);return;}
    if(!GATE_SCENE[GATES[cur].ep]){sfx('buzz');if(hintEl)hintEl.textContent='NOTHING BEYOND IT YET';return;}
    busy=true;sfx('whoosh');wkEls.forEach(x=>x.style.opacity=0);pb.style.opacity=0;
    post({reveal:1,charge:1});post({enter:1});
    /* pre-warm the scene behind the flash */
    pk=document.createElement('iframe');pk.className='pkf';
    const night=!!GATES[cur].night;
    pk.src='gate/index.html?embed=1&peek='+GATE_SCENE[GATES[cur].ep]+'&have='+(night?'':Object.keys(relics()).join(','))+'&night='+(night?1:0)+'&v=7';
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
  /* in the scene: relics are CARRIED. They only become yours when you walk back through the gate. */
  function hud(){
    const carry={};const nC=()=>Object.keys(carry).length;
    const out=el('button','wkb','Abandon');out.style.cssText+=';right:12px;z-index:80;position:fixed';
    const cnt=el('b','wkb','');cnt.style.cssText+=';left:12px;z-index:80;position:fixed;padding:5px 10px';
    const upd=()=>{cnt.textContent='Carrying '+nC()+' · Vault '+Object.keys(relics()).length+'/'+RELICS.length;};upd();
    d.append(cnt,out);
    let done=false;
    const onm=e=>{if(!pk||e.source!==pk.contentWindow)return;const m=e.data||{};
      if(m.peekCollected&&m.id&&!carry[m.id]){carry[m.id]=m.thumb||'x';sfx('good');upd();toast('Got the '+m.peekCollected+'. It is only yours if you get back through the gate.');}
      else if(m.peekPing)sfx('buzz');
      else if(m.peekCaught)caughtScreen();
      else if(m.peekExit){const r=bank();leave(r);}};
    addEventListener('message',onm);
    function bank(){
      const R=relics(),fresh=[];let gain=0;
      Object.keys(carry).forEach(id=>{G.loot.cnt[id]=(G.loot.cnt[id]|0)+1;if(!R[id]){R[id]=carry[id];fresh.push(id);gain+=3;}else gain+=1;});
      let setDone=false;if(fresh.length&&Object.keys(R).length===RELICS.length&&!G.loot.set){G.loot.set=1;gain+=5;setDone=true;}
      save();if(gain)try{earn(gain);}catch(_){}
      return {fresh,gain,setDone,n:nC(),thumbs:Object.keys(carry).map(k=>carry[k])};
    }
    function caughtScreen(){
      if(done)return;const lost=Object.keys(carry);G.seal[GATES[cur].ep]=1;save();sfx('zap');
      const o=el('div','caught');o.append(el('h2','','BUSTED!'));
      o.append(el('p','',lost.length?'The guards took everything you were carrying.':'You had nothing on you. They sealed the gate anyway.'));
      if(lost.length){const l=el('div','lost');lost.forEach(id=>{const i=el('i');if(carry[id]!=='x')i.style.backgroundImage='url('+carry[id]+')';l.append(i);});o.append(l);}
      o.append(el('p','','Gate sealed. Remember one card to break the seal.'));
      const ok=el('button','cta','OK');ok.onclick=()=>{o.remove();leave(null);};o.append(ok);d.append(o);
    }
    function leave(r){if(done)return;done=true;removeEventListener('message',onm);cnt.remove();out.remove();
      const fl2=el('div','flash');fl2.style.transition='opacity .45s';d.append(fl2);requestAnimationFrame(()=>{fl2.style.opacity=1;});sfx('whoosh');
      setTimeout(()=>{if(pk){pk.remove();pk=null;}busy=false;afterExit=fl2;ready=false;frLoc=-1;loadGate(cur);
        if(r&&r.n)toast(r.setDone?'Full set! The shelf is complete. +'+r.gain+' 🔧':'+'+r.gain+' 🔧 banked',r.thumbs);else if(r)toast('You came back empty-handed.');},520);}
    out.onclick=()=>{if(done)return;if(nC()&&!confirm('Abandon the run? You lose what you are carrying.'))return;leave(null);};
  }
  if(initialTab==='airdrop')airdropView();else gatesView();
  if(typeof location!=='undefined'&&/[?&]wake=1/.test(location.search))wake();
}
