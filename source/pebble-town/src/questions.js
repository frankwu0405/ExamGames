// Quick reading-only questions (no listening needed), used by townsfolk quests and the finale.
import { SPELLING, SENTENCES, VOCAB, GRAMMAR, TERMS } from './data.js';
import { picHTML } from './core.js';
import { rnd, pick, shuffle, numWord3, numDistractors3, makeSum3, LENGTH_UNITS, MASS_UNITS, UNIT_NAMES } from './mathgen.js';

const VOW = 'aeiou';
// Believable misspellings of a word (substitution-only when subOnly).
export function misspell(w, n = 2, subOnly = false) {
  const out = new Set(), real = new Set(SPELLING.map(s => s.w));
  const cand = [];
  [...w].forEach((c, i) => { if (VOW.includes(c)) for (const v of VOW) if (v !== c) cand.push(w.slice(0, i) + v + w.slice(i + 1)); });
  if (w[0] === 'c') cand.push('k' + w.slice(1));
  if (/nd$/.test(w)) cand.push(w.slice(0, -1) + 't'); if (/nt$/.test(w)) cand.push(w.slice(0, -1) + 'd');
  if (/nk$/.test(w)) cand.push(w.slice(0, -2) + 'ng'); if (/ng$/.test(w)) cand.push(w.slice(0, -2) + 'nk');
  if (/mp$/.test(w)) cand.push(w.slice(0, -2) + 'np'); if (/xt$/.test(w)) cand.push(w.slice(0, -2) + 'kst');
  if (/ft$/.test(w)) cand.push(w.slice(0, -2) + 'pt');
  if (/^(cl|gl|pl|fl)/.test(w)) cand.push(w[0] + 'r' + w.slice(2)); if (/^(gr|pr|dr|br)/.test(w)) cand.push(w[0] + 'l' + w.slice(2));
  if (!subOnly) {
    if (/[^aeiou]e$/.test(w)) cand.push(w.slice(0, -1), w.slice(0, -1), w.slice(0, -1));
    if (/[aeiou][^aeiou]$/.test(w) && w.length <= 4) cand.push(w + 'e', w + w.slice(-1));
    if (/^st/.test(w)) cand.push('s' + w.slice(2)); if (/^sw/.test(w)) cand.push('s' + w.slice(2));
    if (/x/.test(w)) cand.push(w.replace('x', 'ks'));
  }
  for (const c of shuffle(cand)) { if (c !== w && !real.has(c) && (!subOnly || c.length === w.length)) out.add(c); if (out.size >= n) break; }
  return [...out];
}
export const cloze = s => s.ctx.replace(new RegExp('\\b' + s.w + '\\b', 'i'), '_____');
export const vkey = w => 'v_' + w.replace('-', '');

// ---- question makers: each returns { prompt (html), options, answer, id, extra? (html) }
const Q = {
  // vocab words: meaning only (picture or sentence)
  meaning() { const vs = shuffle(VOCAB).slice(0, 3); const t = vs[0]; return { prompt: `${picHTML(vkey(t.w), 130)}<br>Which word matches the picture?`, options: vs.map(v => v.w), answer: t.w, id: 'lib:' + t.w }; },
  cloze() { const v = pick(VOCAB); const sn = SENTENCES.find(x => x.id === v.s); const fix = w => sn.t.startsWith(sn.b) ? w[0].toUpperCase() + w.slice(1) : w;
    const others = shuffle(VOCAB.filter(x => x.w !== v.w)).slice(0, 2).map(x => fix(x.w)); return { prompt: sn.t.replace(sn.b, '_____'), options: [fix(v.w), ...others], answer: fix(v.w), id: 'lib:' + v.w }; },
  useit() {
    const v = pick(VOCAB); const s = SENTENCES.find(x => x.id === v.s); const w = v.w;
    const wrong = shuffle(VOCAB.filter(x => x.w !== w)).slice(0, 2).map(o => { const x = SENTENCES.find(y => y.id === o.s); const put = x.t.startsWith(x.b) ? w[0].toUpperCase() + w.slice(1) : w; return x.t.replace(x.b, put); });
    return { prompt: `Which sentence uses <b>${w}</b> the right way?`, options: [s.t, ...wrong], answer: s.t, id: 'use:' + s.id, long: true };
  },
  // spelling words: spelling only (picture + sentence, never a definition)
  spellpick() { const s = pick(SPELLING); const bad = misspell(s.w, 2); return { prompt: `${picHTML(s.w, 120)}<br>${cloze(s)}<br>Which spelling is right?`, options: [s.w, ...bad], answer: s.w, id: 'spr:' + s.w }; },
  vowel() { const s = pick(SPELLING); const i = s.w.indexOf(s.vl); return { prompt: `${picHTML(s.w, 120)}<br><b style="font-size:38px;letter-spacing:4px">${s.w.slice(0, i)}_${s.w.slice(i + 1)}</b>`, options: ['a', 'e', 'i', 'o', 'u'], answer: s.vl, id: 'ph:vw:' + s.w }; },
  sentType() { const [t, k] = pick(GRAMMAR[1].items); const o = { S: 'Statement', Q: 'Question', C: 'Command' }; return { prompt: `“${t}”<br>What kind of sentence is it?`, options: Object.values(o), answer: o[k], id: 'g1:' + GRAMMAR[1].items.findIndex(x => x[0] === t) }; },
  be() { const be = GRAMMAR[2].items.filter(x => x.k === 'be'); const x = pick(be); return { prompt: x.t.replace('___', '_____'), options: ['am', 'is', 'are'], answer: x.a, id: 'g2:' + GRAMMAR[2].items.indexOf(x) }; },
  plural() { const it = pick(GRAMMAR[4].items); return { prompt: `one ${it[0]} → two _____`, options: [it[1], ...it[2]], answer: it[1], id: 'g4:' + GRAMMAR[4].items.indexOf(it) }; },
  article() { const it = pick(GRAMMAR[6].items); const cap = it[0].startsWith('___'); return { prompt: it[0].replace('___', '_____'), options: cap ? ['A', 'An', 'The'] : ['a', 'an', 'the'], answer: it[1], id: 'g6:' + GRAMMAR[6].items.indexOf(it) }; },
  someany() { const it = pick(GRAMMAR[7].items); return { prompt: it[0].replace('___', '_____'), options: ['some', 'any'], answer: it[1], id: 'g7:' + GRAMMAR[7].items.indexOf(it) }; },
  count() { const it = pick(GRAMMAR[5].items); return { prompt: `${it[2]} <b>${it[0]}</b><br>Can you count it?`, options: ['Yes, I can count it', "No, I can't count it"], answer: it[1] === 'C' ? 'Yes, I can count it' : "No, I can't count it", id: 'g5:' + GRAMMAR[5].items.indexOf(it) }; },
  term() { const t = pick(TERMS); return { prompt: `${t.def[0].toUpperCase() + t.def.slice(1)} is the…`, options: TERMS.map(x => x.term), answer: t.term, id: 'term:' + t.term }; },
  numword() { const n = rnd(101, 989); return Math.random() < 0.5 ? { prompt: `Which number is <b>${numWord3(n)}</b>?`, options: [n, ...numDistractors3(n, 2)], answer: n, id: 'm:num' } : { prompt: `How do you write <b>${n}</b> in words?`, options: [n, ...numDistractors3(n, 2)].map(numWord3), answer: numWord3(n), id: 'm:num', long: true }; },
  compare() { const a = rnd(100, 989); let b = pick([+String(a).split('').reverse().join(''), a + pick([-10, 10, -1, 1, -100, 100])]); if (b > 999 || b < 100 || b === a) b = a + 1; return { prompt: `<b style="font-size:40px">${a} ___ ${b}</b>`, options: ['>', '<'], answer: a > b ? '>' : '<', id: 'm:num' }; },
  missing() { const by = pick([1, 10, 100]); const more = Math.random() < 0.5; const m = more ? rnd(100, 999 - by) : rnd(100 + by, 999); const ans = more ? m + by : m - by;
    return { prompt: `What number is <b>${by} ${more ? 'more' : 'less'} than ${m}</b>?`, options: [ans, ...numDistractors3(ans, 2)], answer: ans, id: 'm:num' }; },
  sum() { const q = makeSum3(pick(['addR', 'subR', 'sub0'])); return { prompt: `<b style="font-size:40px">${q.a} ${q.op} ${q.b} = ?</b>`, options: [q.ans, ...numDistractors3(q.ans, 2)], answer: q.ans, id: 'm:add' }; },
  placeval() { const n = rnd(101, 989); const d = String(n); const pos = rnd(0, 2); const lab = ['hundreds', 'tens', 'ones']; return { prompt: `<b style="font-size:36px">${n} = ${[0, 1, 2].map(k => k === pos ? '_ ' + lab[k] : d[k] + ' ' + lab[k]).join(' ')}</b>`, options: [...new Set([+d[pos], (+d[pos] + 1) % 10, (+d[pos] + 5) % 10])], answer: +d[pos], id: 'm:num' }; },
  unitname() { const u = pick(Object.keys(UNIT_NAMES)); return { prompt: `<b style="font-size:40px">${u}</b> stands for…`, options: Object.values(UNIT_NAMES), answer: UNIT_NAMES[u], id: 'm:len' }; },
  unit() { const [t, a] = pick([...LENGTH_UNITS, ...MASS_UNITS]); const opts = ['cm', 'm'].includes(a) ? ['cm', 'm'] : ['g', 'kg']; return { prompt: t.replace('___', '_____'), options: opts, answer: a, id: opts[0] === 'cm' ? 'm:len' : 'm:mass' }; },
};
export const KINDS = Object.keys(Q);
export function quick(kind) { const k = kind || pick(KINDS); return Object.assign({ kind: k }, Q[k]()); }
// A balanced mixed set for the finale
export function finaleSet(n = 18) {
  const order = ['spellpick', 'useit', 'cloze', 'be', 'vowel', 'missing', 'plural', 'meaning', 'compare', 'article', 'sentType', 'someany', 'sum', 'term', 'unit', 'count', 'numword', 'placeval', 'spellpick', 'unitname', 'sum'];
  return shuffle(order).slice(0, n).map(k => quick(k));
}
