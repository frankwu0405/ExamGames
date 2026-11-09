export const WORLDS = [
 {id:'qin',label:'Qin',title:'Pebble Town',prefix:'PEBBLE-',game:'Pebble Town',key:'pebbleTown_v1',color:'#20796c',currency:'coins',build:'decorations',folder:'Qin'},
 {id:'lemon',label:'Lemon',title:'Dino Valley',prefix:'DINO-',game:'Dino Valley',key:'dinoValley.v1',color:'#b27631',currency:'amber',build:'discoveries',folder:'Lemon'},
 {id:'seven',label:'Seven',title:'Rocket Base',prefix:'ROCKET-',game:'Rocket Base',key:'rocketbase_g4_v1',color:'#6862ad',currency:'stars',build:'hangar items',folder:'Seven'}
];
export const worldFor = (id='',game='') => WORLDS.find(w=>id.startsWith(w.prefix)||game===w.game||game.toLowerCase()===w.id);
export function field(value) {
 if(!value)return null;
 if('stringValue'in value)return value.stringValue;
 if('integerValue'in value||'doubleValue'in value)return Number(value.integerValue??value.doubleValue);
 if('booleanValue'in value)return value.booleanValue;
 if('timestampValue'in value)return Date.parse(value.timestampValue);
 if('arrayValue'in value)return (value.arrayValue.values||[]).map(field);
 if('mapValue'in value)return Object.fromEntries(Object.entries(value.mapValue.fields||{}).map(([k,v])=>[k,field(v)]));
 return null;
}
export async function unpack(packed) {
 if(typeof packed!=='string'||!['j','z'].includes(packed[0]))throw new Error('Unrecognized save format');
 let encoded=packed.slice(1).replace(/-/g,'+').replace(/_/g,'/');
 encoded+='='.repeat((4-encoded.length%4)%4);
 let bytes=Uint8Array.from(atob(encoded),c=>c.charCodeAt(0));
 if(packed[0]==='z')bytes=new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer());
 return JSON.parse(new TextDecoder().decode(bytes));
}
export async function decodeDoc(doc) {
 const id=String(doc.id||doc.name||'').split('/').pop();
 const f=doc.fields?Object.fromEntries(Object.entries(doc.fields).map(([k,v])=>[k,field(v)])):doc;
 const world=worldFor(id,f.game||f.world||'');
 if(!world)return null;
 try{
  const state=f.state||f.save||(typeof f.d==='string'?await unpack(f.d):null);
  if(!state||typeof state!=='object')throw new Error('Save data missing');
  return {id,world:world.id,name:String(state.name||f.studentName||id.slice(world.prefix.length)),updated:Number(f.t||f.updatedAt||state.savedAt)||Date.parse(doc.updateTime)||0,state};
 }catch(e){return{id,world:world.id,name:id.slice(world.prefix.length),updated:Number(f.t)||0,state:null,error:'This save could not be decoded.'};}
}
export function metrics(record) {
 const s=record.state;if(!s)return null;
 const entries=Object.values(s.items||{}).map(x=>Array.isArray(x)?{box:x[0]||0,right:x[1]||0,wrong:x[2]||0}:{box:x.box||0,right:x.c??x.r??0,wrong:x.w||0});
 const correct=entries.reduce((n,x)=>n+x.right,0),wrong=entries.reduce((n,x)=>n+x.wrong,0);
 const built=record.world==='qin'?(s.decor||[]).length:record.world==='lemon'?(s.dinos||[]).length+(s.outpost||[]).length:(s.hangar?.own||[]).length;
 const review=record.world==='qin'?(s.oops||[]).length:record.world==='lemon'?Object.values(s.trap||{}).filter(x=>Array.isArray(x)?!x[2]:!x.done).length:(s.glitch||[]).length;
 const currency=record.world==='qin'?s.coins:record.world==='lemon'?s.amber:s.stars;
 return {tried:entries.length,mastered:entries.filter(x=>x.box>=3).length,correct,wrong,accuracy:correct+wrong?Math.round(correct/(correct+wrong)*100):null,built,review,currency:typeof currency==='number'?currency:0,completed:Object.keys(s.done||{}).length};
}
export function visibleRecords(records,{hidden=[],showHidden=false,world='all',query='',reviewOnly=false,sort='recent'}={}) {
 const set=new Set(hidden),q=query.trim().toLocaleLowerCase();
 return records.filter(r=>(showHidden?set.has(r.id):!set.has(r.id))&&(world==='all'||r.world===world)&&(!q||(r.name+' '+r.id).toLocaleLowerCase().includes(q))&&(!reviewOnly||(metrics(r)?.review||0)>0))
 .sort((a,b)=>sort==='name'?a.name.localeCompare(b.name):sort==='review'?(metrics(b)?.review||0)-(metrics(a)?.review||0)||b.updated-a.updated:b.updated-a.updated);
}
export function safeCSV(value){let s=String(value??'');if(/^[\s]*[=+@-]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';}
export async function parseImport(input) {
 const obj=typeof input==='string'?JSON.parse(input):input;
 const rows=Array.isArray(obj)?obj:obj.documents||obj.records||(obj.saves?Object.entries(obj.saves).map(([id,x])=>({id,...x})):[]);
 if(!Array.isArray(rows))throw new Error('Use a JSON export containing documents, records, or saves.');
 const result=(await Promise.all(rows.map(decodeDoc))).filter(Boolean);
 if(!result.length)throw new Error('No Qin, Lemon or Seven saves were found in that file.');
 return [...new Map(result.map(r=>[r.id,r])).values()];
}
