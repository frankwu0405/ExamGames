// The Cave: one offline HTML file: dist/the-cave.html
import { build } from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';

const r = await build({ entryPoints: [process.env.ENTRY || 'src/main.js'], bundle: true, minify: !process.env.DEV, format: 'iife', write: false, target: 'es2019', legalComments: 'none' });
const js = r.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
const font = (f, fam, w) => `@font-face{font-family:'${fam}';font-weight:${w};font-display:block;src:url(data:font/woff2;base64,${readFileSync('node_modules/@fontsource/' + f).toString('base64')}) format('woff2')}`;
const fonts = font('chewy/files/chewy-latin-400-normal.woff2', 'Chewy', 400) + font('andika/files/andika-latin-400-normal.woff2', 'Andika', 400) + font('andika/files/andika-latin-700-normal.woff2', 'Andika', 700);
const css = fonts + readFileSync('src/styles.css', 'utf8');
const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">
<meta name="apple-mobile-web-app-capable" content="yes">
<title>The Cave</title>
<style>${css}</style></head>
<body><script>${js}</script></body></html>`;
mkdirSync('dist', { recursive: true }); writeFileSync('dist/the-cave.html', html);
console.log('built', (html.length / 1024).toFixed(0) + ' KB');
