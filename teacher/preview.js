import {WORLDS} from './data.js';
export function expand(record) {
 const s=structuredClone(record.state),rocket=record.world==='seven';
 s.items=Object.fromEntries(Object.entries(s.items||{}).map(([k,a])=>[k,Array.isArray(a)?rocket?{box:a[0],r:a[1],w:a[2],label:a[3],t:0}:{box:a[0],c:a[1],w:a[2],miss:a.slice(3),t:0}:a]));
 if(rocket){s.glitch=(s.glitch||[]).map(a=>Array.isArray(a)?{key:a[0],gen:a[1]||null,n:a[2],area:a[3],wrong:a[4],label:s.items[a[0]]?.label||''}:a);s.sentences=(s.sentences||[]).map(a=>Array.isArray(a)?{w:a[0],ok:!!a[1],text:a[2]||'',t:0}:a);}
 if(record.world==='lemon'){
  s.trap=Object.fromEntries(Object.entries(s.trap||{}).map(([k,a])=>[k,Array.isArray(a)?{n:a[0],hits:a[1],done:!!a[2],first:a[3]*60000,last:a[4]*60000,given:a[5],lastMission:a[6],doneAt:a[7]*60000}:a]));
  s.missLog=(s.missLog||[]).map(a=>Array.isArray(a)?{t:a[0]*60000,key:a[1],given:a[2],ctx:a[3]}:a);s.trapInit=true;
 }
 s.cloudOff=record.id;s.cloudCode='';s.intro=true;
 s.settings={...s.settings,music:false,sfx:false,sound:false,read:false};
 return s;
}
export async function previewHTML(record) {
 const world=WORLDS.find(w=>w.id===record.world),state=expand(record);
 const config=await (await fetch('./config.json')).json();
 const source=config.previewSource==='repository'?`../${world.folder}/index.html`:`./worlds/${world.id}.html`;
 const response=await fetch(source);if(!response.ok)throw new Error('World preview file is unavailable.');
 let html=await response.text();
 // Substitute the old cloud host as an additional safeguard, independent of CSP.
 html=html.replaceAll('https://firestore.googleapis.com','https://teacher-preview.invalid')
  .replace(/\b(?:window\.)?location\.(href|assign|replace|reload)\b/g,'window.__teacherLocation.$1');
 const storage=JSON.stringify({[world.key]:JSON.stringify(state)}).replaceAll('<','\\u003c');
 const base=`https://frankwu0405.github.io/ExamGames/${world.folder}/`;
 const script=`(()=>{const values=new Map(Object.entries(${storage}));const memory={getItem:k=>values.has(String(k))?values.get(String(k)):null,setItem:(k,v)=>values.set(String(k),String(v)),removeItem:k=>values.delete(String(k)),clear:()=>values.clear(),key:i=>[...values.keys()][i]??null,get length(){return values.size}};Object.defineProperty(window,'localStorage',{value:memory});Object.defineProperty(window,'sessionStorage',{value:{...memory}});window.__teacherLocation={href:${JSON.stringify(base)},origin:'https://frankwu0405.github.io',pathname:${JSON.stringify('/ExamGames/'+world.folder+'/')},search:'',reload(){},replace(){},assign(){}};const original=window.fetch.bind(window);window.fetch=(input,options={})=>{const url=new URL(typeof input==='string'?input:input.url,document.baseURI);const method=String(options.method||(typeof input==='object'?input.method:'GET')||'GET').toUpperCase();if(method!=='GET'||url.origin!=='https://frankwu0405.github.io')return Promise.reject(new Error('Teacher preview is read-only'));return original(url.href,options);};navigator.sendBeacon=()=>false;window.open=()=>null;let entered=false;const autoEnter=()=>{if(entered)return;const start=[...document.querySelectorAll('button')].find(b=>/^(Keep building|Continue mission|Keep exploring)$/.test(b.textContent.trim()));if(start){entered=true;observer.disconnect();start.click();}};const observer=new MutationObserver(autoEnter);observer.observe(document,{childList:true,subtree:true});document.addEventListener('DOMContentLoaded',autoEnter);document.addEventListener('click',event=>{if(event.target.closest?.('a'))event.preventDefault();},true);})();`;
 const csp="default-src 'none'; script-src 'unsafe-inline' blob:; style-src 'unsafe-inline'; img-src data: blob: https://frankwu0405.github.io; font-src data: https://frankwu0405.github.io; connect-src https://frankwu0405.github.io; worker-src blob:; media-src data: blob:; form-action 'none';";
 const prefix=`<base href="${base}"><meta http-equiv="Content-Security-Policy" content="${csp}"><script>${script}<\/script>`;
 return html.replace(/<head([^>]*)>/i,`<head$1>${prefix}`);
}
