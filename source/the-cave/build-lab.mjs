import { build } from 'esbuild';
import { readFileSync, writeFileSync } from 'fs';
const r = await build({ entryPoints: ['src/lab.js'], bundle: true, minify: !process.env.DEV, format: 'iife', write: false, target: 'es2019', legalComments: 'none' });
const js = r.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
const fonts = readFileSync('shell/head.html', 'utf8').match(/<style>(@font-face[^]*?)<\/style>/)[1].match(/@font-face\{[^}]*\}/g).join('');
const css = fonts + `html,body{margin:0;height:100%;overflow:hidden;background:#0E1A22;font-family:Andika,sans-serif;color:#EDEBE4}canvas{display:block;position:fixed;inset:0}
#roster{position:fixed;left:10px;top:10px;display:flex;flex-direction:column;gap:5px;z-index:3}
#side{position:fixed;right:10px;top:10px;bottom:56px;width:min(300px,34vw);overflow:auto;z-index:3;background:#0B141BDD;border:1px solid #ffffff22;padding:12px 14px;border-radius:6px}
#side h2{font:400 28px Chewy,sans-serif;margin:8px 0 2px;color:#FFE58A}#side p{font-size:13px;line-height:1.4;margin:0 0 10px;opacity:.85}
#refs img{width:100%;max-height:230px;object-fit:contain;background:#000;display:block;margin-bottom:4px}#refs small{font-size:11px;opacity:.55}
#pr,#fr,#mr{display:flex;flex-wrap:wrap;gap:5px;margin:7px 0}#pr b,#fr b,#mr b{width:100%;font-size:11px;letter-spacing:1.2px;text-transform:uppercase;opacity:.55}
button{font:700 13px Andika,sans-serif;color:#EDEBE4;background:#26333D;border:1px solid #ffffff2a;border-radius:4px;padding:6px 11px;cursor:pointer;text-align:left}button.on{background:#FFE58A;color:#1A1A1A}
#bg{position:fixed;left:50%;bottom:10px;transform:translateX(-50%);display:flex;gap:6px;z-index:3}`;
writeFileSync('dist/character-lab.html', `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Character Lab</title><style>${css}</style></head><body><script>${js}</script></body></html>`);
console.log('ok');
