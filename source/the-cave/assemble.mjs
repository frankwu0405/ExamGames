// Builds the page: bundle of src/lib.js (game modules) + shell/tail.js (map, HUD, Word cards, Power up) + shell/head.html (CSS)
import { build } from 'esbuild';
import { readFileSync, writeFileSync } from 'fs';
const r = await build({ entryPoints: ['src/lib.js'], bundle: true, minify: !process.env.DEV, format: 'iife', write: false, target: 'es2019', legalComments: 'none' });
let js = r.outputFiles[0].text.replace(/<\/script/gi, '<\\/script').trimEnd();
if (!js.endsWith('})();')) throw new Error('unexpected bundle end');
js = js.slice(0, -5);
const html = readFileSync('shell/head.html', 'utf8') + '<body><script>' + js + readFileSync('shell/tail.js', 'utf8') + '})();\n</script></body></html>';
writeFileSync(process.env.OUT || 'dist/cave-new.html', html);
console.log('assembled', (html.length / 1024).toFixed(0) + ' KB');
