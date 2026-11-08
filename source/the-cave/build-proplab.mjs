import { build } from 'esbuild';
import { readFileSync, writeFileSync } from 'fs';
const r = await build({ entryPoints: ['src/proplab.js'], bundle: true, minify: !process.env.DEV, format: 'iife', write: false, target: 'es2019', legalComments: 'none' });
const js = r.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
const fonts = readFileSync('shell/head.html', 'utf8').match(/<style>(@font-face[^]*?)<\/style>/)[1].match(/@font-face\{[^}]*\}/g).join('');
const css = fonts + `html,body{margin:0;height:100%;overflow:hidden;background:#0E1A22;font-family:Andika,sans-serif;color:#EDEBE4}canvas{display:block;position:fixed;inset:0;touch-action:none}
#roster{position:fixed;left:10px;top:10px;display:flex;flex-direction:column;gap:5px;z-index:3;width:190px}
#roster button{display:block;text-align:left}#roster small{display:block;font-weight:400;font-size:11px;opacity:.7}
#side{position:fixed;right:10px;top:10px;bottom:62px;width:min(300px,32vw);overflow:auto;z-index:3;background:#0B141BDD;border:1px solid #ffffff22;padding:12px 14px;border-radius:6px}
#side h2{font:400 26px Chewy,sans-serif;margin:2px 0 6px;color:#FFE58A}.lead{font-size:11px;letter-spacing:1.2px;text-transform:uppercase;opacity:.55;margin:12px 0 6px}.lead small{text-transform:none;letter-spacing:0}
#stops span{display:inline-block;font-size:12px;background:#26333D;border-radius:3px;padding:2px 7px;margin:0 4px 4px 0}
#now{display:grid;grid-template-columns:1fr 1fr;gap:4px}#now img{width:100%;display:block;border:1px solid #ffffff22}
.prop{padding:7px 8px;border-left:3px solid #ffffff22;margin-bottom:5px;font-size:13px;line-height:1.35}.prop.go{cursor:pointer;border-left-color:#FFE58A}.prop.go:hover{background:#ffffff0d}
.prop b{display:block}.prop i{font-style:normal;font-size:11px;padding:1px 6px;border-radius:3px;display:inline-block;margin:2px 0}.prop i.code{background:#2D4A3A;color:#BFF2CF}.prop i.pack{background:#4A3A2D;color:#F7D9B5}.prop span{display:block;opacity:.7;font-size:12px}
button{font:700 13px Andika,sans-serif;color:#EDEBE4;background:#26333DEE;border:1px solid #ffffff2a;border-radius:4px;padding:7px 11px;cursor:pointer}button.on{background:#FFE58A;color:#1A1A1A}
#views{position:fixed;left:210px;right:calc(min(300px,32vw) + 24px);bottom:10px;display:flex;gap:6px;z-index:3;flex-wrap:wrap;justify-content:center}
#loading{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:4;background:#0B141BDD;padding:10px 18px;border-radius:6px;display:none}
.clean #side,.clean #views{display:none}.clean #roster button:not(.hide){display:none}
@media(max-width:820px){#roster{width:150px}#side{width:42vw}#views{left:10px;right:10px}}`;
writeFileSync('dist/prop-lab.html', `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Prop Lab</title><style>${css}</style></head><body><script>${js}</script></body></html>`);
console.log('ok');
