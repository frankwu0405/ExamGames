// Split only at complete JavaScript statement boundaries. The generated scripts
// execute in order inside the isolated scene iframe, using ordinary HTTP URLs.
const fs=require('fs'),acorn=require('acorn'),path=require('path');
const source=fs.readFileSync(__dirname+'/scene.bundle.js','utf8');
const program=acorn.parse(source,{ecmaVersion:'latest'});
const statements=program.body[0].expression.callee.body.body;
const reserved=['top','parent','self','location','window','document','length','name'];
const declarations=statements.filter(n=>n.type==='VariableDeclaration').flatMap(n=>n.declarations.map(d=>d.id.name));
if(declarations.some(n=>reserved.includes(n)))throw Error('Scene global conflicts with a browser binding.');
for(const old of fs.readdirSync(__dirname).filter(n=>/^scene\.part-\d+\.js$/.test(n)))fs.unlinkSync(path.join(__dirname,old));
const chunks=[];let text='';
for(const statement of statements){const part=source.slice(statement.start,statement.end);if(text.length+part.length>195000&&text){chunks.push(text);text='';}text+=part+'\n';}
if(text)chunks.push(text);
const names=chunks.map((text,index)=>{const name='scene.part-'+index+'.js';fs.writeFileSync(path.join(__dirname,name),text);return name;});
const loader=`(()=>{const base=new URL('.',document.currentScript.src);(async()=>{try{for(const name of ${JSON.stringify(names)})await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=new URL(name+'?v=2',base).href;script.onload=resolve;script.onerror=reject;document.body.append(script);});}catch(error){document.getElementById('loading').hidden=true;document.getElementById('fallback').hidden=false;console.warn('Cargo renderer unavailable:',error);}})();})();\n`;
fs.writeFileSync(__dirname+'/scene.js',loader);
const start=source.lastIndexOf('/*! Bundled license information:');if(start>=0)fs.writeFileSync(__dirname+'/THIRD_PARTY_LICENSES.txt',source.slice(start));
console.log('Scene split into',chunks.map(x=>x.length).join(', '),'characters');
