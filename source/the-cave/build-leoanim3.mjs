// Varn showcase: one offline HTML file: dist/leo-anim3.html (the model files stay in dist/varn/)
import { build } from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
const r = await build({ entryPoints: ['src/leoanim3.js'], bundle: true, minify: !process.env.DEV, format: 'iife', write: false, target: 'es2019', legalComments: 'none' });
const js = r.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
const font = (f, fam, w) => `@font-face{font-family:'${fam}';font-weight:${w};font-display:block;src:url(data:font/woff2;base64,${readFileSync('node_modules/@fontsource/' + f).toString('base64')}) format('woff2')}`;
const fonts = font('chewy/files/chewy-latin-400-normal.woff2', 'Chewy', 400) + font('andika/files/andika-latin-400-normal.woff2', 'Andika', 400) + font('andika/files/andika-latin-700-normal.woff2', 'Andika', 700);
const css = fonts + `
html,body{margin:0;height:100%;overflow:hidden;background:#05192A;font-family:Andika,sans-serif;color:#E8FBFF;touch-action:none;-webkit-user-select:none;user-select:none}
canvas{display:block;position:fixed;inset:0;touch-action:none}
.title{z-index:2;position:fixed;left:18px;top:14px;pointer-events:none;text-shadow:0 2px 14px #000A}
.title h1{margin:0;font:400 34px Chewy,sans-serif;letter-spacing:.5px;color:#C9F7FF}
.title p{margin:2px 0 0;font-size:13px;opacity:.75}
.panel{z-index:2;position:fixed;left:50%;transform:translateX(-50%);bottom:max(14px,env(safe-area-inset-bottom));width:min(760px,calc(100vw - 24px));background:#06223AB8;border:1px solid #6FE3FF55;border-radius:18px;padding:10px 12px;backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);display:grid;gap:8px;box-shadow:0 8px 30px #0008}
.row{display:flex;flex-wrap:wrap;gap:6px;align-items:center}
.row b{font-size:11px;letter-spacing:1.4px;text-transform:uppercase;opacity:.6;width:62px}
button{font:700 13px Andika,sans-serif;color:#D6F8FF;background:#0E3B5C;border:1px solid #6FE3FF44;border-radius:999px;padding:7px 13px;cursor:pointer}
button.on{background:#2DB8E0;color:#032033;border-color:#B6F4FF}
label{font-size:12px;opacity:.85;display:flex;align-items:center;gap:6px}
input[type=range]{width:96px;accent-color:#5FE0FF}
.hint{font-size:11px;opacity:.55;text-align:center}
.credit{z-index:2;position:fixed;right:12px;top:12px;font-size:11px;opacity:.5;text-align:right;pointer-events:none}
.hideui .panel,.hideui .title,.hideui .credit{display:none}
#hide{position:fixed;right:10px;bottom:10px;opacity:.5;padding:4px 9px;z-index:3}
@media(max-width:560px){.title h1{font-size:26px}.row b{width:100%}input[type=range]{width:72px}}
`;
const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">
<title>Leo merged</title>
<style>${css}</style></head>
<body>
<script>${js}</script></body></html>`;
mkdirSync('dist', { recursive: true }); writeFileSync('dist/leo-anim3.html', html);
console.log('built', (html.length / 1024).toFixed(0) + ' KB');
