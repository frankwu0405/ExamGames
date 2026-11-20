// THE BRIDGE — the 35 weekly sentences, by reading: build them, fix them, fill the gap. Dictation is optional.
import { S, h, sfx, say, pip, mark, setQ, REPLAY, giveCoins, burst, shake, cheer, tryAgain, wait, speakBtn, choose, confetti } from '../core.js';
import { SENTENCES } from '../data.js';
import { menu, playRound } from '../shell.js';
import { askChoice } from '../widgets.js';
import { shuffle, pick } from '../mathgen.js';

const WALKERS = ['🐢', '🦆', '🐈', '🐕', '🐇', '🦔', '🐓'];
const seen = (p, s) => (S.items[p + s.id] || { box: 0 }).box >= 1;

export default {
  id: 'bridge', title: 'The Bridge — Weekly Sentences',
  bg: 'linear-gradient(#BFE6F2 0 45%, #9BCB6C 45% 52%, #6FC1E0 52% 80%, #9BCB6C 80%)',
  enter(ui) {
    menu(ui, 'Build the bridge!', [
      { name: 'Build the bridge', desc: 'Put the words in order.', pic: '🌉', go: () => lessons(ui, 'build') },
      { name: 'Fix the sentence', desc: 'Find the mistakes.', pic: '🔎', color: '#FFE07A', go: () => lessons(ui, 'fix') },
      { name: 'Missing word', desc: 'Pick the word that fits.', pic: '🧩', go: () => lessons(ui, 'gap') },
      { name: 'Listen & write', desc: 'Listen and write', pic: '🎧', sound: true, go: () => lessons(ui, 'write') },
    ]);
  },
};
const PREF = { build: 'sb:', fix: 'sf:', gap: 'sm:', write: 'sw:' };
function lessons(ui, mode) {
  const cards = [1, 2, 3, 4, 5, 6, 7].map(L => { const list = SENTENCES.filter(s => s.L === L);
    return { name: 'Lesson ' + L, desc: list.map(s => s.b).filter(b => !['are', 'does'].includes(b)).slice(0, 3).join(', ') + '…', count: [list.filter(s => seen(PREF[mode], s)).length, list.length, 'sentences'], go: () => round(ui, mode, list) }; });
  cards.push({ name: 'All lessons', desc: 'Lessons 1 to 7', pic: '🎲', color: '#FFE07A', go: () => round(ui, mode, choose(SENTENCES, 6, s => PREF[mode] + s.id)) });
  menu(ui, { build: 'Build the bridge: pick a lesson.', fix: 'Fix the sentence: pick a lesson.', gap: 'Missing word: pick a lesson.', write: 'Listen & write: pick a lesson.' }[mode], cards);
}
function round(ui, mode, list) {
  const L = shuffle(list);
  const fn = { build: buildBridge, fix: fixSentence, gap: gapTask, write: writeTask }[mode];
  playRound(ui, { n: L.length, again: () => round(ui, mode, list), ask: (i, host) => { setQ('bridge', { mode, id: L[i].id }, `${{ build: 'Build', fix: 'Fix', gap: 'Missing word', write: 'Write' }[mode]}: ${L[i].t}`); return fn(host, L[i]); } });
}
REPLAY.bridge = (host, d) => ({ build: buildBridge, fix: fixSentence, gap: gapTask, write: writeTask })[d.mode](host, SENTENCES.find(s => s.id === d.id));

// ---------- build: arrange planks, then Check (no listening needed)
function tokens(t) { const parts = t.split(' '); const last = parts.pop(); const m = last.match(/^(.*?)([.?!])$/); return [...parts, m[1], m[2]]; }
function buildBridge(host, s) {
  return new Promise(res => {
    const toks = tokens(s.t); let tries = 0, peeked = false; if (window.__TEST) window.__ans = toks;
    const decoys = [];
    if (toks[0] !== 'I' && toks[0] !== toks[0].toLowerCase()) decoys.push(toks[0].toLowerCase());
    decoys.push(toks[toks.length - 1] === '?' ? '.' : '?');
    const deck = h('div', { class: 'deck' }); const walker = h('div', { class: 'walker' }, pick(WALKERS));
    const scene = h('div', { class: 'river-scene' }, h('div', { class: 'river' }), deck, walker);
    const pile = h('div', { class: 'pile' }); const placed = [];
    const check = h('button', { class: 'btn green', disabled: '' }, 'Check');
    const peek = h('button', { class: 'btn small paper' }, '👀 Peek');
    const hint = h('div', { class: 'sub' }, h('span', {}, 'Word: '), h('b', {}, s.b.toLowerCase()), h('span', {}, ` · ${toks.length - 1} words`));
    const draw = () => { deck.innerHTML = ''; placed.forEach((p, i) => { const b = h('button', { class: 'plank placed' + (/^[.?!]$/.test(p.t) ? ' mark' : '') }, p.t); b.onclick = () => { p.el.classList.remove('used'); placed.splice(i, 1); sfx('tap'); draw(); }; deck.append(b); });
      placed.length === toks.length ? check.removeAttribute('disabled') : check.setAttribute('disabled', ''); };
    for (const t of shuffle([...toks, ...decoys])) { const b = h('button', { class: 'plank' + (/^[.?!]$/.test(t) ? ' mark' : '') }, t); b.onclick = () => { if (b.classList.contains('used') || placed.length >= toks.length) return; b.classList.add('used'); placed.push({ t, el: b }); sfx('place'); draw(); }; pile.append(b); }
    peek.onclick = () => { peeked = true; sfx('flip'); peek.setAttribute('disabled', ''); const p = h('div', { class: 'sentence-card' }, s.t); hint.after(p); setTimeout(() => p.remove(), 1600); };
    check.onclick = async () => {
      const got = placed.map(p => p.t); const ok = got.join(' ') === toks.join(' ');
      if (ok) { const first = tries === 0 && !peeked; mark('sb:' + s.id, true, first); if (first) giveCoins(3, deck); sfx('great'); burst(deck, cheer()); walker.style.left = 'calc(100% + 20px)'; await wait(2300); res(first); return; }
      tries++; sfx('bad'); shake(deck); if (tries === 1) mark('sb:' + s.id, false, true, got.join(' '));
      const bad = [...deck.children].filter((el, i) => got[i] !== toks[i]); bad.forEach(el => el.classList.add('bad'));
      const tips = []; if (got[0] !== toks[0]) tips.push(got[0] && got[0].toLowerCase() === toks[0].toLowerCase() ? 'Start with a BIG letter.' : 'Which word is first?');
      if (got[got.length - 1] !== toks[toks.length - 1]) tips.push(toks[toks.length - 1] === '?' ? 'It asks. Use ?' : 'It tells. Use .');
      if (tries >= 3) { pip('Here it is. Read it!'); deck.innerHTML = ''; toks.forEach(t => deck.append(h('span', { class: 'plank placed' }, t))); await wait(2600); res(false); return; }
      pip(tips.join(' ') || 'Tap the red planks. Try again!');
    };
    if (window.__TEST) window.__solve = () => { toks.forEach(t => { const b = [...pile.children].find(x => x.textContent === t && !x.classList.contains('used')); b && b.click(); }); check.click(); window.__solve = null; };
    host.append(h('div', { class: 'prompt' }, 'Build the sentence.', peek), hint, scene, pile, check);
  });
}

// ---------- fix: tap every mistake (capital letter, end mark, spelling)
function fixSentence(host, s) {
  return new Promise(res => {
    const toks = tokens(s.t).map(t => ({ t, fix: null }));
    const errs = shuffle(['cap', 'end', 'word', 'word2']).slice(0, Math.random() < 0.5 ? 1 : 2).map(e => e === 'word2' ? 'word' : e);
    if (errs.includes('cap')) { const f = toks[0]; f.fix = f.t; f.t = f.t === 'I' ? 'i' : f.t.toLowerCase(); }
    if (errs.includes('end')) { const e = toks[toks.length - 1]; e.fix = e.t; e.t = e.t === '?' ? '.' : '?'; }
    if (errs.includes('word')) { // a word that does not make sense here (meaning, not spelling)
      const ix = toks.findIndex(x => x.t.toLowerCase() === s.b.toLowerCase() && !x.fix);
      if (ix >= 0) { const other = pick(SENTENCES.filter(o => o.L === s.L && o.b !== s.b && !['are', 'does'].includes(o.b.toLowerCase()))); if (other) { const x = toks[ix]; x.fix = x.t; const w = other.b.toLowerCase(); x.t = ix === 0 ? w[0].toUpperCase() + w.slice(1) : w; } } }
    const mid = toks.findIndex((x, i) => i > 0 && x.t === 'I'); if (mid > 0 && !toks.some(x => x.fix) ) { toks[mid].fix = 'I'; toks[mid].t = 'i'; }
    if (!toks.some(x => x.fix)) { const e = toks[toks.length - 1]; e.fix = e.t; e.t = e.t === '?' ? '.' : '?'; }
    const total = toks.filter(x => x.fix).length; let found = 0, wrongTaps = 0;
    const counter = h('div', { class: 'counter' }, `Mistakes found: 0 / ${total}`);
    const line = h('div', { class: 'fixline' });
    toks.forEach(x => { const b = h('button', { class: 'tok' + (/^[.?!]$/.test(x.t) ? ' ltr' : '') }, x.t); b.onclick = async () => {
      if (b.classList.contains('fixed') || found >= total) return;
      if (x.fix) { found++; b.textContent = x.fix; b.classList.add('fixed'); sfx('good'); counter.textContent = `Mistakes found: ${found} / ${total}`;
        if (found === total) { const first = wrongTaps === 0; mark('sf:' + s.id, true, first); if (first) giveCoins(3, line); burst(line, cheer()); sfx('great'); await wait(1300); res(first); } }
      else { wrongTaps++; sfx('bad'); b.classList.add('nope'); shake(b); setTimeout(() => b.classList.remove('nope'), 600); if (wrongTaps === 1) mark('sf:' + s.id, false, true, x.t); pip('That part is OK. Look again!'); }
    }; line.append(b); });
    if (window.__TEST) window.__solve = () => { [...line.children].forEach((b, i) => { if (toks[i].fix) b.click(); }); window.__solve = null; };
    host.append(h('div', { class: 'prompt' }, 'Find and tap every mistake.'), counter, line, h('div', { class: 'sub' }, 'Look for: BIG letters, . or ?, and wrong words.'));
  });
}

// ---------- gap: choose the bold word (4 options)
function gapTask(host, s) {
  const others = shuffle(SENTENCES.filter(x => x.b !== s.b && !['are', 'does'].includes(x.b.toLowerCase())));
  const same = others.filter(x => x.L === s.L), rest = others.filter(x => x.L !== s.L);
  const fix = w => s.t.startsWith(s.b) ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w.toLowerCase();
  const opts = [...new Set([s.b, ...[...same.slice(0, 2), ...rest].slice(0, 3).map(x => x.b)].map(fix))].slice(0, 4);
  const card = h('div', { class: 'sentence-card', html: s.t.replace(s.b, '<span class="gap"></span>') });
  return askChoice(host, { prompt: 'Which word fits?', options: opts, answer: fix(s.b), id: 'sm:' + s.id, extra: card, coins: 1, hint: 'Read it again.',
    onRight: async () => { card.innerHTML = s.t.replace(s.b, `<b>${s.b}</b>`); await wait(700); } });
}

// ---------- write: dictation (needs sound)
function writeTask(host, s) {
  return new Promise(res => {
    let tries = 0; if (window.__TEST) window.__ans = s.t;
    const box = h('input', { class: 'write-box', autocomplete: 'off', autocapitalize: 'off', autocorrect: 'off', spellcheck: 'false', 'aria-label': 'Write the sentence' });
    const out = h('div', { class: 'diff' });
    const slow = h('button', { class: 'btn small paper', onclick: () => { sfx('tap'); say(s.t, { rate: 0.65, force: true }); } }, 'Slow');
    const check = h('button', { class: 'btn green', onclick: () => go() }, 'Check');
    host.append(h('div', { class: 'prompt' }, speakBtn(s.t), 'Listen. Write the sentence.', slow), box, check, out);
    say(s.t, { force: true }); setTimeout(() => box.focus(), 300);
    box.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
    const norm = x => x.replace(/[’‘]/g, "'").replace(/\s+/g, ' ').trim();
    async function go() {
      const v = norm(box.value); if (!v) return;
      if (v === s.t) { mark('sw:' + s.id, true, tries === 0); if (tries === 0) giveCoins(3, box); sfx('great'); confetti(innerWidth / 2, innerHeight / 2, 30); out.innerHTML = `<span class="ok">${s.t}</span>`; burst(box, cheer()); await wait(1300); res(tries === 0); return; }
      tries++; sfx('bad'); shake(box); if (tries === 1) mark('sw:' + s.id, false, true, v);
      out.innerHTML = ''; const a = v.split(' '), b = s.t.split(' '), wrap = h('div');
      b.forEach((word, i) => { const mine = a[i]; wrap.append(mine === undefined ? h('span', { class: 'miss' }, '___') : h('span', { class: mine === word ? 'ok' : 'no' }, mine), ' '); });
      out.append(wrap);
      if (tries >= 3) { out.append(h('div', { class: 'ok', style: { marginTop: '8px' } }, s.t)); await wait(2500); res(false); }
      else pip('Fix the red words!');
    }
  });
}
