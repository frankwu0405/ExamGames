// TRAIN STATION — phonics by reading. Sort whole trains, spot the odd wagon, build words from blends.
import { h, sfx, pip, mark, setQ, REPLAY, addBricks, giveCoins, burst, shake, cheer, wait, choose, pic, speakBtn } from '../core.js';
import { cloze } from '../questions.js';
import { SPELLING } from '../data.js';
import { menu, playRound } from '../shell.js';
import { shuffle, pick } from '../mathgen.js';

const START = ['br', 'cl', 'dr', 'fl', 'gl', 'gr', 'pl', 'pr', 'sk', 'sp', 'st', 'sw'];
const END = ['nd', 'ng', 'nk', 'nt', 'ft', 'xt', 'mp'];
const fam = b => b[1] === 'r' ? 'r' : b[1] === 'l' ? 'l' : 's';
const SHED_COLORS = ['#9FD7EA', '#FFE07A', '#C9B6E6', '#B5E3A1', '#FFC2B3'];

// Ways to sort words into sheds
const SORTS = {
  sl: { q: 'Short vowel or long vowel (magic e)?', pool: SPELLING, key: s => s.v === 'l' ? 'long' : 'short', sheds: [['short', 'Short', 'like jam'], ['long', 'Long', 'magic e, like grape']] },
  vowel: { q: 'Which vowel do you see and hear?', pool: SPELLING, key: s => s.vl, sheds: 'aeiou'.split('').map(v => [v, v, '']) },
  blend: { q: 'Which kind of blend does it start with?', pool: SPELLING.filter(s => s.ib), key: s => fam(s.ib), sheds: [['r', 'r-blend', 'br, dr, gr, pr'], ['l', 'l-blend', 'cl, fl, gl, pl'], ['s', 's-blend', 'sk, sp, st, sw']] },
  end: { q: 'How does it end?', pool: SPELLING.filter(s => s.fb), key: s => s.fb, sheds: null },
};

export default {
  id: 'train', title: 'Train Station — Phonics',
  bg: 'linear-gradient(#CFEAF7 0 55%, #B9D98F 55%)',
  enter(ui) {
    menu(ui, 'Help the trains!', [
      { name: 'Sort the train', desc: 'Put each wagon in the right shed.', pic: '🚂', go: () => round(ui, 'sort') },
      { name: 'Odd wagon out', desc: 'Find the one that is different.', pic: '🔍', go: () => round(ui, 'odd') },
      { name: 'Blend builder', desc: 'Finish the word.', pic: '🧩', go: () => round(ui, 'build') },
      { name: 'Mixed station', desc: 'A bit of everything', pic: '🎲', color: '#FFE07A', go: () => round(ui, 'mix') },
    ]);
    pip('Read the word on each wagon.');
  },
};

function round(ui, mode) {
  const kinds = Array.from({ length: 6 }, (_, i) => mode === 'mix' ? ['sort', 'odd', 'build'][i % 3] : mode);
  playRound(ui, { n: kinds.length, again: () => round(ui, mode), ask: (i, host) => ({ sort: sortTrain, odd: oddOut, build: blendBuild })[kinds[i]](host) });
}

// ---- Sort a whole train of 5 wagons
function sortTrain(host, pre) {
  return new Promise(res => {
    const k = pre ? pre.k : pick(['sl', 'sl', 'vowel', 'blend', 'end']); const R = SORTS[k];
    let words = pre ? pre.words.map(w => R.pool.find(s => s.w === w)).filter(Boolean) : choose(R.pool, 5, s => `ph:${k}:${s.w}`);
    let sheds = R.sheds; if (k === 'end') { const used = [...new Set(words.map(R.key))]; const extra = shuffle(END.filter(e => !used.includes(e))); while (used.length < 3) used.push(extra.pop()); sheds = used.slice(0, 4).map(e => [e, '-' + e, '']); words = words.filter(s => sheds.some(x => x[0] === s.fb)); }
    let idx = 0, errors = 0; setQ('sort', { k, words: words.map(s => s.w) }, `${R.q} ${words.map(s => s.w).join(', ')}`);
    const cars = words.map(s => h('div', { class: 'wagon' }, s.w));
    const train = h('div', { class: 'wagons' }, h('div', { style: { fontSize: '56px' } }, '🚂'), ...cars);
    const shedRow = h('div', { class: 'sheds' });
    const markNow = () => cars.forEach((c, i) => { c.classList.toggle('picked', i === idx); c.style.transform = i === idx ? 'translateY(-10px)' : ''; });
    sheds.forEach(([id, big, small], i) => { const b = h('button', { class: 'shed', style: { '--c': SHED_COLORS[i % 5] } }, h('span', {}, big), small ? h('small', {}, small) : null);
      b.onclick = async () => {
        if (idx >= words.length) return; const s = words[idx], want = R.key(s), id2 = `ph:${k}:${s.w}`;
        if (id === want) { sfx('good'); b.classList.remove('right'); void b.offsetWidth; b.classList.add('right'); mark(id2, true, !cars[idx].dataset.miss); if (!cars[idx].dataset.miss) addBricks('train');
          cars[idx].classList.remove('picked'); cars[idx].classList.add('done'); cars[idx].append(h('small', {}, big)); idx++; markNow();
          if (idx >= words.length) { const ok = errors <= 1; if (ok) giveCoins(3, train); burst(train, errors ? 'Train sorted!' : 'Perfect!'); sfx('toot'); await wait(1000); res(ok); }
        } else { sfx('bad'); shake(b); shake(cars[idx]); errors++; if (!cars[idx].dataset.miss) mark(id2, false, true, id); cars[idx].dataset.miss = 1;
          pip(k === 'sl' ? 'Magic e at the end? Then it is long.' : k === 'vowel' ? 'Find a, e, i, o or u.' : k === 'blend' ? 'Look at the first two letters.' : 'Look at the last two letters.'); }
      }; shedRow.append(b); });
    if (window.__TEST) window.__solve = () => { if (idx >= words.length) return; const want = R.key(words[idx]); const i = sheds.findIndex(x => x[0] === want); shedRow.children[i].click(); };
    markNow(); host.append(h('div', { class: 'prompt' }, R.q), train, shedRow, h('div', { class: 'sub' }, 'The yellow wagon goes next.'));
  });
}

// ---- Odd one out
const ODD_RULES = [
  { name: 'long vowel', pool: SPELLING.filter(s => s.v === 'l'), other: SPELLING.filter(s => s.v === 's'), why: (o) => `${o} has a short vowel. The others have a magic e.` },
  { name: 'short vowel', pool: SPELLING.filter(s => s.v === 's'), other: SPELLING.filter(s => s.v === 'l'), why: (o) => `${o} has a long vowel with a magic e. The others are short.` },
  ...['a', 'i', 'o', 'u', 'e'].map(v => ({ name: 'short ' + v, pool: SPELLING.filter(s => s.v === 's' && s.vl === v), other: SPELLING.filter(s => s.v === 's' && s.vl !== v), why: o => `The others all have short ${v}. ${o} does not.` })),
  ...['r', 'l', 's'].map(f => ({ name: f + '-blend', pool: SPELLING.filter(s => s.ib && fam(s.ib) === f), other: SPELLING.filter(s => s.ib && fam(s.ib) !== f), why: o => `The others start with an ${f}-blend. ${o} does not.` })),
  { name: 'ends in -nk/-ng', pool: SPELLING.filter(s => s.fb === 'nk' || s.fb === 'ng'), other: SPELLING.filter(s => s.fb && s.fb !== 'nk' && s.fb !== 'ng'), why: o => `The others end in -nk or -ng. ${o} does not.` },
  { name: 'ends in -nd/-nt', pool: SPELLING.filter(s => s.fb === 'nd' || s.fb === 'nt'), other: SPELLING.filter(s => s.fb && s.fb !== 'nd' && s.fb !== 'nt'), why: o => `The others end in -nd or -nt. ${o} does not.` },
];
function oddOut(host, pre) {
  return new Promise(res => {
    const R = pre ? ODD_RULES.find(r => r.name === pre.rule) : pick(ODD_RULES.filter(r => r.pool.length >= 3 && r.other.length));
    const find = w => SPELLING.find(s => s.w === w);
    const same = pre ? pre.same.map(find) : shuffle(R.pool).slice(0, 3), odd = pre ? find(pre.odd) : pick(R.other); let first = true;
    setQ('odd', { rule: R.name, same: same.map(s => s.w), odd: odd.w }, `Odd one out: ${[...same.map(s => s.w), odd.w].join(', ')}`);
    const cars = h('div', { class: 'wagons' });
    for (const s of shuffle([...same, odd])) { const c = h('button', { class: 'wagon' }, s.w); c.onclick = async () => {
      if (cars.dataset.done) return;
      if (s === odd) { cars.dataset.done = 1; c.classList.add('picked'); sfx('good'); burst(c, cheer()); mark('ph:odd:' + R.name, true, first); if (first) { giveCoins(2, c); addBricks('train', 2); }
        pip(R.why(odd.w)); await wait(2400); res(first); }
      else { c.classList.add('wrongpick'); sfx('bad'); shake(c); if (first) mark('ph:odd:' + R.name, false, true, s.w); first = false; pip('Look again!'); }
    }; cars.append(c); if (window.__TEST && s === odd) window.__solve = () => { c.click(); window.__solve = null; }; }
    host.append(h('div', { class: 'prompt' }, 'Which wagon does NOT belong?'), cars, h('div', { class: 'sub' }, 'Three are the same. One is different.'));
  });
}

// ---- Blend builder: picture + clue, pick the missing blend
function blendBuild(host, pre) {
  return new Promise(res => {
    const s = pre ? SPELLING.find(x => x.w === pre.w) : pick(SPELLING.filter(x => x.ib || x.fb)); const atEnd = pre ? pre.atEnd : s.fb && (!s.ib || Math.random() < 0.5);
    setQ('blend', { w: s.w, atEnd: !!atEnd }, `Finish the word: ${s.w}`);
    const blend = atEnd ? s.fb : s.ib; const shown = atEnd ? s.w.slice(0, -2) + '__' : '__' + s.w.slice(2);
    const opts = shuffle([blend, ...shuffle((atEnd ? END : START).filter(b => b !== blend)).slice(0, 3)]); let first = true;
    const wordEl = h('div', { class: 'wagon', style: { minWidth: '200px' } }, shown);
    const row = h('div', { class: 'blend-row' });
    for (const b of opts) { const t = h('button', { class: 'tile blend' }, b); t.onclick = async () => {
      if (row.dataset.done) return;
      if (b === blend) { row.dataset.done = 1; wordEl.textContent = s.w; sfx('good'); burst(wordEl, cheer()); mark(`ph:${atEnd ? 'fb' : 'ib'}:${s.w}`, true, first); if (first) { giveCoins(1, t); addBricks('train'); } await wait(1100); res(first); }
      else { sfx('bad'); shake(t); t.classList.add('used'); if (first) mark(`ph:${atEnd ? 'fb' : 'ib'}:${s.w}`, false, true, b); first = false; wordEl.textContent = atEnd ? s.w.slice(0, -2) + b : b + s.w.slice(2); setTimeout(() => { if (!row.dataset.done) wordEl.textContent = shown; }, 900); pip('Not that one. Look at the picture!'); }
    }; row.append(t); if (window.__TEST && b === blend) window.__solve = () => { t.click(); window.__solve = null; }; }
    host.append(h('div', { class: 'clue-card' }, pic(s.w, 120), h('div', { class: 'what' }, cloze(s)), speakBtn(`${s.w}. ${s.ctx}`)), h('div', { class: 'prompt' }, 'Finish the word:'), h('div', { class: 'wagons' }, wordEl), row);
  });
}

REPLAY.sort = (host, d) => sortTrain(host, d);
REPLAY.odd = (host, d) => oddOut(host, d);
REPLAY.blend = (host, d) => blendBuild(host, d);
