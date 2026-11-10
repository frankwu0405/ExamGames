import {WORLDS,worldFor,decodeDoc,metrics,visibleRecords,parseImport,safeCSV} from './data.js';
import {previewHTML,expand} from './preview.js';
const $=s=>document.querySelector(s);
function el(tag,props={},...children){const node=document.createElement(tag);for(const[k,v]of Object.entries(props)){if(k==='class')node.className=v;else if(k==='text')node.textContent=v;else if(k==='style')Object.assign(node.style,v);else if(k.startsWith('on'))node.addEventListener(k.slice(2).toLowerCase(),v);else if(v!==false&&v!=null)node.setAttribute(k,v===true?'':String(v));}node.append(...children.flat().filter(x=>x!=null));return node;}
const prefKey='island-teacher-preferences-v1';
let prefs={hidden:[],added:[],view:'list',layout:2};
try{prefs={...prefs,...JSON.parse(localStorage.getItem(prefKey)||'{}')};}catch{}
try{const old=JSON.parse(localStorage.getItem(prefKey)||'{}');if(old.layout!==2){prefs.view='list';prefs.layout=2;}}catch{}
const state={records:[],world:'all',query:'',reviewOnly:false,sort:'recent',showHidden:false,loading:false,errors:[],modal:null,imported:false,roster:[]};
const persist=()=>localStorage.setItem(prefKey,JSON.stringify(prefs));
const relative=t=>{if(!t)return'No save time';const days=Math.floor((Date.now()-t)/86400000);return days<0?'Just saved':days===0?'Today':days===1?'Yesterday':days<30?days+' days ago':new Date(t).toLocaleDateString('en',{month:'short',day:'numeric'});};
const human=s=>String(s??'').replace(/<[^>]*>/g,'').replace(/[_|]/g,' ').replace(/:/g,' · ');
const options=()=>({hidden:prefs.hidden,showHidden:state.showHidden,world:state.world,query:state.query,reviewOnly:state.reviewOnly,sort:state.sort});
const shown=()=>visibleRecords(state.records,options());
function toast(text,undo){const node=$('#toast');node.replaceChildren(document.createTextNode(text));if(undo)node.append(el('button',{onclick:()=>{undo();node.hidden=true;}},'Undo'));node.hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>node.hidden=true,6500);}
function islandArt(id){const svg=el('div',{class:'island-art','aria-hidden':'true'});const common='<ellipse cx="137" cy="148" rx="106" ry="19" fill="#183e3520"/><path d="M31 103L99 68 236 106 166 153 46 132Z" fill="';const shapes=id==='qin'?common+'#b4c5a6"/><path d="M31 103L102 57 236 106 163 139Z" fill="#92bc91"/><path d="M91 99V63L113 51 135 65V105Z" fill="#fff1d0"/><path d="M82 65L112 41 143 65 133 73 112 56 91 73Z" fill="#de9279"/><path d="M151 115V82L170 73 194 87V126Z" fill="#eff1d8"/><path d="M144 85L169 63 203 85 194 94 169 77 151 93Z" fill="#579a84"/><path d="M108 101V82H120V107M166 119V101H177V122" fill="#718d73"/><path d="M60 102V65M214 109V80" stroke="#6c8970" stroke-width="6"/><circle cx="60" cy="57" r="23" fill="#76a77c"/><circle cx="214" cy="73" r="20" fill="#78a383"/><path d="M128 130L149 110 161 115 143 138" fill="#d6d6b3"/>':id==='lemon'?common+'#cfaf7b"/><path d="M31 103L103 58 236 106 164 139Z" fill="#d0bd83"/><path d="M79 98L127 33 167 107Z" fill="#b98c68"/><path d="M111 55L127 33 141 58 127 53Z" fill="#f4dbaf"/><path d="M165 113q-13-8-6-19q5-7 15-2l17 7 7-20q3-9 11-6q7 3 3 13l-10 28-9 4v16h-8v-15l-11-3v15h-8v-17l-14 1-10-10Z" fill="#7da993"/><circle cx="207" cy="78" r="2" fill="#3b6553"/><path d="M58 118V91M51 103L64 98M223 124V104" stroke="#9d9865" stroke-width="5"/><ellipse cx="105" cy="122" rx="9" ry="6" fill="#f6e9cb"/>':common+'#a09abb"/><path d="M31 103L103 58 236 106 164 139Z" fill="#b6adc9"/><ellipse cx="137" cy="109" rx="35" ry="15" fill="#8e86ac"/><path d="M122 102V63Q122 38 137 24Q153 38 153 63V102Z" fill="#f4f1ed"/><path d="M122 91L111 112 124 105M151 91L164 112 151 105" fill="#8175ac"/><path d="M129 106L137 130 146 105" fill="#ebbe77"/><circle cx="137" cy="63" r="10" fill="#9fc4c7" stroke="#ccc6d8" stroke-width="4"/><path d="M73 99V75M62 77Q73 90 84 77" stroke="#eae5ee" stroke-width="5" fill="none"/><circle cx="196" cy="92" r="20" fill="#d5d1e0"/><path d="M181 92h31M196 72v40" stroke="#b5acc7" stroke-width="2"/><path d="M66 37v10M61 42h10M202 35v10M197 40h10" stroke="#a6a0c0" stroke-width="2"/>';
svg.innerHTML='<svg viewBox="0 0 260 180" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">'+shapes+'</svg>';return svg;}
function hide(record){if(prefs.hidden.includes(record.id))return;prefs.hidden.push(record.id);persist();render();toast(record.name+' hidden from your classroom.',()=>{prefs.hidden=prefs.hidden.filter(id=>id!==record.id);persist();render();});}
function restore(record){prefs.hidden=prefs.hidden.filter(id=>id!==record.id);persist();render();toast(record.name+' restored.');}
function render(){
 renderGates();
 const active=state.records.filter(r=>!prefs.hidden.includes(r.id)),summary=state.world==='all'?active:active.filter(r=>r.world===state.world);
 $('#stat-students').textContent=state.loading&&!state.records.length?'—':summary.length;
 $('#stat-worlds').textContent=state.loading&&!state.records.length?'—':new Set(summary.map(r=>r.world)).size;
 $('#stat-mastered').textContent=summary.reduce((n,r)=>n+(metrics(r)?.mastered||0),0);
 $('#stat-review').textContent=summary.reduce((n,r)=>n+(metrics(r)?.review||0),0);
 $('#stat-hidden').textContent=prefs.hidden.length?`${prefs.hidden.length} account${prefs.hidden.length===1?'':'s'} hidden`:'No accounts hidden';
 $('#hidden-count').textContent=prefs.hidden.length;
 $('#nav-hidden').classList.toggle('active',state.showHidden);$('#nav-class').classList.toggle('active',!state.showHidden);
 $('#breadcrumb').textContent=state.showHidden?'Hidden accounts can be restored anytime.':'Qin, Lemon and Seven.';
 $('#island-tabs').replaceChildren(...WORLDS.map(w=>{const rows=active.filter(r=>r.world===w.id),button=el('button',{class:'island-card '+w.id,style:{'--world':w.color},'aria-pressed':String(state.world===w.id),onclick:()=>{state.world=state.world===w.id?'all':w.id;render();}},el('span',{class:'small-label'},'STUDENT WORLD'),el('h2',{},w.label),el('div',{class:'subtitle'},w.title),islandArt(w.id),el('div',{class:'island-bottom'},rows.length+' accounts ',el('span',{},'· '+rows.reduce((n,r)=>n+(metrics(r)?.built||0),0)+' '+w.build)));return button;}));
 const rows=shown(),world=WORLDS.find(w=>w.id===state.world);
 $('#section-heading').textContent=state.showHidden?'Hidden testing accounts':world?world.label+' · Student worlds':'All student worlds';
 $('#results-count').textContent=state.loading&&!state.records.length?'Loading saved projects…':`${rows.length} account${rows.length===1?'':'s'}${state.showHidden?' hidden':world?' in '+world.label:' across all worlds'}`;
 $('#clear-island').hidden=state.world==='all';
 $('#grid-view').setAttribute('aria-pressed',String(prefs.view==='grid'));$('#list-view').setAttribute('aria-pressed',String(prefs.view==='list'));
 const host=$('#records');host.replaceChildren();
 if(!rows.length){
  const label=state.loading?'Loading your classroom…':state.showHidden?'No hidden accounts.':state.records.length?'No matching students.':'Your student worlds will appear here.';
  const description=state.loading?'Reading saved progress from the three worlds.':state.showHidden?'Accounts you hide are kept safely. You can restore them here.':state.records.length?'Try clearing the search or choosing another island.':'Open a game in this browser, add a cloud save code in Manage accounts, or import a saved-data export.';
  host.append(el('div',{class:'empty'},el('div',{class:'empty-icon'},'◈'),el('h3',{},label),el('p',{},description),!state.loading&&!state.records.length?el('div',{class:'actions'},el('button',{class:'button primary',onclick:loadRecords},'Try again'),el('button',{class:'button',onclick:accountManager},'Manage accounts')):null));return;
 }
 if(prefs.view==='list'){renderTable(host,rows);return;}
 for(const record of rows){const w=WORLDS.find(w=>w.id===record.world),m=metrics(record);const percent=m?.tried?Math.round(m.mastered/m.tried*100):0;
  host.append(el('article',{class:'student-card',style:{'--world':w.color}},
   el('div',{class:'student-top'},el('div',{class:'avatar'},record.name.slice(0,2).toUpperCase()),el('div',{},el('h3',{},record.name),el('div',{class:'save-code'},record.id)),el('button',{class:'account-action','aria-label':(state.showHidden?'Restore ':'Hide as test: ')+record.name+' ('+w.label+')',onclick:()=>state.showHidden?restore(record):hide(record)},state.showHidden?'Restore':'Hide as test')),
   el('span',{class:'world-pill'},w.label+' · '+w.title),
   el('div',{class:'student-metrics'},...[[m?.mastered,'mastered'],[m?.built,w.build],[m?.currency,w.currency]].map(([n,label])=>el('div',{},el('strong',{},n==null?'—':String(n)),el('span',{},label)))),
   el('div',{class:'student-details'},el('span',{},m?m.mastered+' of '+m.tried+' tried items mastered':'Save unavailable'),m?.review?el('span',{class:'review-badge'},m.review+' to review'):el('span',{},m?.tried?'No review items':'Not started')),
   el('div',{class:'mastery-track','aria-label':percent+'% of tried items mastered'},el('i',{style:{width:percent+'%'}})),
   el('div',{class:'student-bottom'},el('small',{},'Saved '+relative(record.updated)),el('button',{onclick:()=>inspect(record)},'Inspect world ↗'))));
 }
}
function renderTable(host,rows){const table=el('table',{class:'record-table'},el('thead',{},el('tr',{},...['STUDENT','WORLD','MASTERED','BUILT / COLLECTED','REVIEW','LAST SAVED',''].map(x=>el('th',{},x))))),body=el('tbody');
 for(const r of rows){const w=WORLDS.find(w=>w.id===r.world),m=metrics(r);body.append(el('tr',{style:{'--world':w.color}},el('td',{},el('b',{},r.name),el('div',{class:'save-code'},r.id)),el('td',{},el('span',{class:'world-tag'},w.label)),el('td',{},m?String(m.mastered):'—',m?el('span',{class:'table-sub'},m.tried+' items tried'):null),el('td',{},m?String(m.built):'—',el('span',{class:'table-sub'},w.build)),el('td',{},m?.review?el('span',{class:'review-badge'},m.review+' to review'):m?'None':'—'),el('td',{},relative(r.updated)),el('td',{},el('button',{onclick:()=>inspect(r)},'Open world'),el('button',{onclick:()=>state.showHidden?restore(r):hide(r),'aria-label':(state.showHidden?'Restore ':'Hide as test: ')+r.name+' ('+w.label+')'},state.showHidden?'Restore':'Hide'))));}
 table.append(body);host.append(el('div',{class:'table-wrap'},table));}
function browserSave(key,fallback=null){
 try{return JSON.parse(localStorage.getItem(key))??fallback;}catch{return fallback;}
}
function islandBrowserRecords(){
 return WORLDS.flatMap(world=>{
  const save=browserSave(world.key);
  if(!save||typeof save!=='object'||Array.isArray(save))return [];
  const code=typeof save.cloudCode==='string'?save.cloudCode.trim().toUpperCase():'';
  const id=code.startsWith(world.prefix)&&code.length>world.prefix.length?code:'local-'+world.id;
  const name=String(save.name|| (id===code?code.slice(world.prefix.length):world.label));
  return [{id,world:world.id,name,state:save,updated:Number(save.savedAt)||0,local:true}];
 });
}
function mergeIslandRecords(local,cloud){
 const records=new Map(local.map(record=>[record.id,record]));
 for(const record of cloud){
  const fallback=records.get(record.id);
  if(!fallback||(record.state&&(!fallback.updated||record.updated>=fallback.updated)))records.set(record.id,record);
  else if(record.error||record.fetchError)records.set(record.id,{...fallback,fetchError:record.error||record.fetchError});
 }
 return [...records.values()];
}
function gateProfiles(){
 const roster=browserSave('gate8-students');
 if(Array.isArray(roster?.students)&&roster.students.length){
  return roster.students.filter(entry=>entry?.progress&&typeof entry.name==='string');
 }
 const legacy=browserSave('gate8v2');
 return legacy&&((legacy.ch>0)||legacy.earned?.length||Object.keys(legacy.stats||{}).length)
  ?[{name:'Unnamed player',progress:legacy}]:[];
}
function renderGates(){
 const host=$('#gate-records');
 if(!host)return;
 const profiles=gateProfiles();
 host.replaceChildren();
 if(!profiles.length){
  host.append(el('p',{class:'muted'},'No Gate 8 progress is saved in this browser yet. Open the episode and enter a player name to begin.'));
  return;
 }
 for(const {name,progress} of profiles){
  const stats=Object.entries(progress.stats||{}).filter(([,result])=>result?.m>0).sort((a,b)=>b[1].m-a[1].m);
  const stage=progress.ch>=4?'Cards finale':'Paragraph '+(Math.max(0,Number(progress.ch)||0)+1);
  const cards=Array.isArray(progress.earned)?progress.earned:[];
  const details=el('details',{},el('summary',{},el('b',{},name),el('span',{},stage+' · '+cards.length+'/4 cards · '+stats.length+' to review')));
  if(cards.length)details.append(el('p',{},'Cards: '+cards.map(human).join(', ')));
  details.append(el('p',{},stats.length?stats.map(([word,result])=>word+' (missed '+result.m+', read '+(result.h||0)+')').join(' · '):'No misses recorded yet.'));
  host.append(details);
 }
}
let config;
async function loadRecords(){
 if(state.loading)return;
 const local=islandBrowserRecords();
 state.records=mergeIslandRecords(local,state.records.filter(record=>!record.local));
 state.loading=true;$('#refresh').disabled=true;$('#connection').classList.remove('error');$('#connection-text').textContent='Refreshing student saves…';render();
 try{
  const configResponse=config?null:await fetch('./config.json');
  if(configResponse&&!configResponse.ok)throw new Error('Dashboard configuration unavailable');
  config ||= await configResponse.json();
  $('.private-pill').textContent=config.private===false?'Browser-only account list':'Private';
  const registryResponse=await fetch('./accounts.json',{cache:'no-store'});
  if(!registryResponse.ok)throw new Error('Account list unavailable');
  const registry=await registryResponse.json();
  const ids=[...new Set([...(registry.accounts||[]),...(prefs.added||[]),...local.map(r=>r.id).filter(id=>worldFor(id))])];state.roster=ids;
  const base=`https://firestore.googleapis.com/v1/projects/${config.project}/databases/(default)/documents/saves`;
  const results=await Promise.all(ids.map(async id=>{try{const response=await fetch(`${base}/${encodeURIComponent(id)}?key=${encodeURIComponent(config.key)}`,{signal:AbortSignal.timeout(18000)});if(!response.ok)throw new Error(response.status===404?'Save not found':response.status===403?'Read permission needed':'Cloud unavailable');const record=await decodeDoc(await response.json());return record||{id,world:worldFor(id)?.id,name:id.replace(/^[^-]+-/,''),state:null,error:'Unknown save format'};}catch(e){const previous=state.records.find(r=>r.id===id);return previous?{...previous,fetchError:e.message}:{id,world:worldFor(id)?.id,name:id.replace(/^[^-]+-/,''),state:null,error:e.message};}}));
  state.records=mergeIslandRecords(local,results.filter(r=>r.world));state.errors=state.records.filter(r=>r.error||r.fetchError);state.imported=false;
  $('#connection').classList.toggle('error',state.errors.length>0);
  $('#connection-text').textContent=state.errors.length?`${state.records.length-state.errors.length} saves refreshed · ${state.errors.length} need attention`:state.records.length?local.length?`${state.records.length} saves available · includes this browser`:`${state.records.length} cloud saves connected`:'Play on this browser or add cloud save codes';
  $('#updated-time').textContent='Updated '+new Date().toLocaleTimeString('en',{hour:'numeric',minute:'2-digit'});
  $('#roster-status').textContent=config.private===false?'Account codes stay in this browser. Student saves are read-only.':`Account list checked ${registry.checked}. All accounts are included until you hide them.`;
 }catch(e){$('#connection').classList.add('error');$('#connection-text').textContent='Cloud refresh unavailable. Browser saves are still shown.';toast('Could not refresh: '+e.message);}
 finally{state.loading=false;$('#refresh').disabled=false;render();}
}
function closeModal(){const root=$('#modal-root');root.replaceChildren();state.modal=null;document.body.style.overflow='';closeModal.focus?.focus();}
function modal(title,subtitle,large=false){closeModal.focus=document.activeElement;const backdrop=el('div',{class:'modal-backdrop'+(large?' inspector-backdrop':''),onclick:e=>{if(e.target===backdrop)closeModal();}}),content=el('section',{class:'modal'+(large?' inspector':''),role:'dialog','aria-modal':'true','aria-label':title}),header=el('header',{class:'modal-header'},el('div',{},el('h2',{},title),el('p',{},subtitle)),el('button',{class:'close-modal','aria-label':'Close inspector',onclick:closeModal},'×'));content.append(header);backdrop.append(content);$('#modal-root').replaceChildren(backdrop);document.body.style.overflow='hidden';state.modal=content;header.querySelector('button').focus();return content;}
function inspect(record){
 const w=WORLDS.find(w=>w.id===record.world),m=metrics(record),panel=modal(record.name+'’s world',w.label+' · '+w.title+' · Saved '+relative(record.updated),true);
 if(!m){panel.append(el('div',{class:'empty'},el('h3',{},'This save needs attention'),el('p',{},record.error||'Try refreshing the saved record.')));return;}
 const summary=el('div',{class:'inspect-summary'},...[[m.mastered,'items mastered'],[m.built,w.build],[m.review,'review items'],[m.accuracy==null?'—':m.accuracy+'%','recorded accuracy']].map(([n,label])=>el('div',{},el('strong',{},String(n)),el('span',{},label))));
 const content=el('div',{class:'inspector-content'}),tabs=el('nav',{class:'inspector-tabs','aria-label':'Student detail views'}),body=el('div');
 const sections=[['world','World & collection'],['learning','Learning'],['review','Review ('+m.review+')']];if(record.state.log?.essay?.text||record.state.sentences?.length)sections.push(['writing','Writing']);
 let frame=null;
 function select(id){frame?.remove();frame=null;body.replaceChildren();[...tabs.children].forEach(b=>b.classList.toggle('active',b.dataset.id===id));
  if(id==='world'){
   const preview=el('div',{class:'preview-box'}),start=el('button',{class:'button primary',onclick:async()=>{start.disabled=true;start.textContent='Opening saved world…';try{const html=await previewHTML(record);if(!preview.isConnected)return;frame=el('iframe',{sandbox:'allow-scripts',title:record.name+' read-only '+w.title+' preview',referrerpolicy:'no-referrer'});frame.srcdoc=html;preview.replaceChildren(frame);}catch(e){start.disabled=false;start.textContent='Try preview again';toast(e.message);}}},'Explore saved world');
   preview.append(el('div',{class:'preview-prompt'},el('div',{class:'preview-symbol'},'◈'),el('h3',{},record.name+'’s '+w.title),el('p',{},'Open the saved world to look around and inspect what this student has built.'),start));
   body.append(preview,el('p',{class:'read-only'},'◇ Isolated preview · Student cloud saves and your own game progress are never changed.'),el('h3',{class:'detail-heading'},'Built & collected'));
   const s=record.state,inventory=record.world==='qin'?s.decor||[]:record.world==='lemon'?[...(s.dinos||[]),...(s.outpost||[])]:s.hangar?.own||[];
   body.append(el('div',{class:'inventory'},...inventory.map(x=>el('span',{},human(typeof x==='object'?x.name||x.kind||x.id||'Collected item':x)))));
   if(!inventory.length)body.append(el('p',{class:'muted'},'No collected objects recorded yet.'));
   if(record.world==='seven')body.append(el('p',{class:'muted'},'Rocket paint: '+human(s.hangar?.paint||'classic')+' · Launches: '+(s.launched||0)));
  }else if(id==='learning'){
   body.append(el('p',{class:'muted'},'Mastery is shown for the items the student has attempted, not the entire curriculum.'));
   const data=expand(record).items,table=el('table',{class:'record-table'},el('thead',{},el('tr',{},...['ITEM / SKILL','MASTERY','RIGHT','WRONG'].map(x=>el('th',{},x))))),tbody=el('tbody');
   Object.entries(data).sort((a,b)=>(b[1].w||0)-(a[1].w||0)).forEach(([key,r])=>tbody.append(el('tr',{},el('td',{},human(r.label||key)),el('td',{},String(r.box||0)+' / 3'),el('td',{},String(r.c??r.r??0)),el('td',{},String(r.w||0)))));table.append(tbody);body.append(el('div',{class:'table-wrap'},table));
  }else if(id==='review'){
   const s=expand(record);let rows=record.world==='qin'?s.oops||[]:record.world==='lemon'?Object.entries(s.trap||{}).filter(([,x])=>!x.done).map(([key,x])=>({key,...x})):s.glitch||[];
   body.append(el('div',{class:'detail-list'},...rows.map(x=>el('div',{},el('b',{},human(x.label||x.data?.prompt||x.key||x.kind||'Practice item')),el('small',{},human(x.area||x.st||'')+(x.n?' · '+x.n+' recorded attempts':'')),x.wrong||x.given?el('small',{},'Recorded answer: '+human(x.wrong||x.given)):null))));
   if(!rows.length)body.append(el('div',{class:'empty'},el('h3',{},'No review items saved.')));
  }else{
   const s=expand(record);if(s.log?.essay?.text)body.append(el('h3',{class:'detail-heading'},'Saved writing'),el('div',{class:'detail-list'},el('div',{style:{whiteSpace:'pre-wrap'}},s.log.essay.text)));
   body.append(el('div',{class:'detail-list'},...(s.sentences||[]).map(x=>el('div',{},String(x.text||''),el('small',{},String(x.w||'')+' · '+(x.ok?'Correct':'To practise'))))));
  }
 }
 for(const[id,label]of sections){const b=el('button',{onclick:()=>select(id)},label);b.dataset.id=id;tabs.append(b);}content.append(summary,tabs,body);panel.append(content);select('world');
}
function accountManager(){const panel=modal('Manage accounts','Everyone is included by default. Hide testing accounts manually.');
 const search=el('input',{placeholder:'Find an account',style:{width:'100%',padding:'11px',border:'1px solid #ccd9c5',borderRadius:'8px'},'aria-label':'Find account to hide'}),list=el('div'),selected=new Set(prefs.hidden);
 function draw(){list.replaceChildren(...state.records.filter(r=>(r.name+' '+r.id).toLowerCase().includes(search.value.toLowerCase())).map(r=>el('label',{class:'account-check'},el('input',{type:'checkbox',checked:selected.has(r.id),onchange:e=>e.target.checked?selected.add(r.id):selected.delete(r.id)}),el('span',{},r.name),el('code',{},r.id))));}
 search.addEventListener('input',draw);draw();panel.append(search,el('p',{class:'help'},'Checked accounts are hidden from your classroom and totals. Nothing is deleted.'),list,
 el('div',{class:'modal-actions'},el('button',{class:'button',onclick:()=>{const file=new Blob([JSON.stringify({accounts:state.roster,hidden:prefs.hidden},null,2)],{type:'application/json'});const url=URL.createObjectURL(file);el('a',{href:url,download:'teacher-account-list.json'}).click();setTimeout(()=>URL.revokeObjectURL(url),500);}},'Download account list'),el('button',{class:'button',onclick:()=>{selected.clear();draw();}},'Show everyone'),el('button',{class:'button primary',onclick:()=>{prefs.hidden=[...selected];persist();closeModal();render();toast('Account visibility saved.');}},'Save visibility')),
 el('label',{class:'form-label'},'Add cloud-save codes'),el('p',{class:'help'},'One code per line. Examples: PEBBLE-NAME, DINO-NAME, ROCKET-NAME.'),el('textarea',{id:'add-codes',placeholder:'PEBBLE-STUDENTNAME\nDINO-STUDENTNAME'}),el('div',{class:'modal-actions'},el('button',{class:'button',onclick:()=>{
 const codes=$('#add-codes').value.split(/[\n,;]+/).map(x=>x.trim().toUpperCase()).filter(Boolean);if(codes.some(x=>!worldFor(x))){toast('Each code must begin with PEBBLE-, DINO- or ROCKET-.');return;}prefs.added=[...new Set([...prefs.added,...codes])];persist();closeModal();loadRecords();}},'Add accounts')));
}
$('#refresh').onclick=loadRecords;$('#search').addEventListener('input',e=>{state.query=e.target.value;render();});$('#review-only').onchange=e=>{state.reviewOnly=e.target.checked;render();};$('#sort').onchange=e=>{state.sort=e.target.value;render();};
$('#nav-class').onclick=()=>{state.showHidden=false;render();};$('#nav-hidden').onclick=()=>{state.showHidden=true;render();};$('#clear-island').onclick=()=>{state.world='all';render();};
for(const kind of ['grid','list'])$('#'+kind+'-view').onclick=()=>{prefs.view=kind;persist();render();};$('#manage-accounts').onclick=accountManager;
$('#import-button').onclick=()=>$('#import-file').click();$('#import-file').onchange=async e=>{try{const file=e.target.files[0];if(!file)return;const imported=JSON.parse(await file.text());const codes=imported.accounts||(Array.isArray(imported)&&imported.every(x=>typeof x==='string')?imported:null);if(codes){if(!Array.isArray(codes)||codes.some(x=>typeof x!=='string'||!worldFor(x)))throw new Error('Use PEBBLE-, DINO- or ROCKET- save codes.');prefs.added=[...new Set([...prefs.added,...codes])];if(Array.isArray(imported.hidden))prefs.hidden=[...new Set([...prefs.hidden,...imported.hidden.filter(x=>codes.includes(x))])];persist();await loadRecords();toast('Account list imported on this browser.');}else{state.records=await parseImport(imported);state.imported=true;$('#connection-text').textContent='Imported snapshot · '+state.records.length+' accounts';$('#connection').classList.remove('error');$('#updated-time').textContent='Imported '+new Date().toLocaleTimeString();render();toast('Save data imported. No cloud records were changed.');}}catch(error){toast(error.message);}e.target.value='';};
$('#export').onclick=()=>{const rows=shown();const csv=[['Name','World','Cloud save code','Items tried','Mastered','Built / collected','Review items','Currency','Saved at'],...rows.map(r=>{const w=WORLDS.find(w=>w.id===r.world),m=metrics(r);return[r.name,w.label,r.id,m?.tried??'',m?.mastered??'',m?.built??'',m?.review??'',m?.currency??'',r.updated?new Date(r.updated).toISOString():''];})].map(row=>row.map(safeCSV).join(',')).join('\r\n');const url=URL.createObjectURL(new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'}));const a=el('a',{href:url,download:'island-classroom-view.csv'});a.click();setTimeout(()=>URL.revokeObjectURL(url),500);};
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&state.modal)closeModal();});
render();loadRecords();
