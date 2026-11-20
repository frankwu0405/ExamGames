// SIGN SHOP — spelling, no listening needed. Each word climbs a ladder:
// 1) Build it from letter tiles (with tricky decoys)  2) Fix a misspelled sign  3) Paint it from memory.
import { S, h, sfx, say, pip, mark, rec, choose, setQ, REPLAY, giveCoins, burst, shake, cheer, wait, speakBtn, confetti, pic } from '../core.js';
import { SPELLING, LESSON_SOUNDS, wordsOfLesson } from '../data.js';
import { menu, playRound } from '../shell.js';
import { keyboard } from '../widgets.js';
import { misspell, cloze } from '../questions.js';
import { shuffle, pick } from '../mathgen.js';

const CUSTOMERS = [['🐻', 'Bear'], ['🐰', 'Bunny'], ['🦊', 'Fox'], ['🐐', 'Granny Goat'], ['🐼', 'Panda'], ['🐸', 'Frog'], ['🦉', 'Owl'], ['🐷', 'Pig']];
const sp = w => 'sp:' + w;
const box = w => (S.items[sp(w)] || { box: 0 }).box;
const mastery = list => list.reduce((a, s) => a + Math.min(3, box(s.w)), 0) / (list.length * 3);
const STEP = ['Build', 'Fix', 'Paint'];

export default {
  id: 'signs', title: 'Sign Shop — Spelling',
  bg: 'linear-gradient(#FFE9C2 0 62%, #C98B4F 62% 64%, #E2B47E 64%)',
  enter(ui) {
    const cards = [1, 2, 3, 4, 5, 6, 7].map(L => { const ws = wordsOfLesson(L); const lv = Math.min(...ws.map(s => box(s.w)));
      const st = Math.min(2, lv), passed = ws.filter(s => box(s.w) > st).length;
      return { name: 'Lesson ' + L, desc: LESSON_SOUNDS[L], count: [lv >= 3 ? ws.length : passed, ws.length], countText: lv >= 3 ? `All ${ws.length} words ✓` : `Step ${st + 1} ${STEP[st]}: ${passed}/${ws.length}`, level: lv >= 3 ? 'Mastered!' : null, go: () => round(ui, ws) }; });
    const tricky = SPELLING.filter(s => { const r = S.items[sp(s.w)]; return r && r.w > 0 && r.box < 3; });
    cards.push({ name: 'Mixed bag', desc: 'All lessons', pic: '🎲', color: '#FFE07A', go: () => round(ui, choose(SPELLING, 8, s => sp(s.w))) });
    if (tricky.length >= 3) cards.push({ name: 'Tricky words', desc: `${tricky.length} words to fix`, pic: '🔧', color: '#FFD1CB', go: () => round(ui, choose(tricky, Math.min(8, tricky.length), s => sp(s.w))) });
    cards.push({ name: 'Listen & spell', desc: 'Listen and spell', pic: '🎧', sound: true, go: () => round(ui, choose(SPELLING, 8, s => sp(s.w)), true) });
    menu(ui, 'Make the shop signs!', cards);
    pip('Look at the picture. Spell the word!');
  },
};

function round(ui, words, listen = false) {
  const list = shuffle(words).slice(0, 8);
  playRound(ui, { n: list.length, again: () => round(ui, words, listen), ask: (i, host) => signTask(host, list[i], listen) });
}

function clueCard(s, listen) {
  return h('div', { class: 'clue-card' }, pic(s.w, 130),
    h('div', { class: 'what' }, listen ? 'Listen to the word.' : cloze(s)),
    speakBtn(`${s.w}. ${s.ctx} ${s.w}.`));
}

REPLAY.sign = (host, d) => signTask(host, SPELLING.find(x => x.w === d.w), d.listen);
export async function signTask(host, s, listen) {
  setQ('sign', { w: s.w, listen: !!listen }, `Spell the word: ${s.w}`);
  const [face, who] = pick(CUSTOMERS); if (window.__TEST) window.__ans = s.w;
  const lv = listen ? 2 : Math.min(2, box(s.w));
  const bubble = h('div', { class: 'say-bubble' }, `${who}: "${['Make my sign!', 'Fix my sign!', 'Write my sign!'][lv]}"`);
  host.append(h('div', { class: 'customer' }, h('div', { class: 'face' }, face), bubble), clueCard(s, listen));
  say(`${s.w}. ${s.ctx} ${s.w}.`, { force: listen });
  const scene = h('div', { class: 'shop-scene' }); host.append(scene);
  const ok = await [build, fixSign, paint][lv](scene, s);
  if (ok) { sfx('great'); confetti(innerWidth / 2, innerHeight * 0.45, 25); bubble.textContent = `${who}: "Thank you!"`; await wait(1100); }
  return ok;
}

// Step 1 — tap tiles into the slots, then Check. Decoys are believable wrong letters.
function build(scene, s) {
  return new Promise(res => {
    const w = s.w; let tries = 0;
    const near = new Set(); misspell(w, 6).forEach(m => [...m].forEach(c => { if (!w.includes(c)) near.add(c); }));
    const decoys = shuffle([...near]).slice(0, w.length <= 3 ? 2 : 3);
    while (decoys.length < 2) decoys.push(pick('bdfghlmnprst'.split('').filter(c => !w.includes(c) && !decoys.includes(c))));
    const slots = [...w].map(() => h('button', { class: 'slot' })); const placed = Array(w.length).fill(null);
    const board = h('div', { class: 'signboard' }, h('div', { class: 'slots' }, ...slots));
    const tiles = h('div', { class: 'tiles' }); const check = h('button', { class: 'btn green', disabled: '' }, 'Check');
    const refresh = () => { slots.forEach((sl, i) => { sl.textContent = placed[i] ? placed[i].ch : ''; sl.className = 'slot' + (placed[i] ? ' filled' : '') + (i === placed.indexOf(null) ? ' next' : ''); }); placed.includes(null) ? check.setAttribute('disabled', '') : check.removeAttribute('disabled'); };
    slots.forEach((sl, i) => sl.onclick = () => { if (!placed[i]) return; placed[i].el.classList.remove('used'); placed[i] = null; sfx('tap'); refresh(); });
    for (const ch of shuffle([...w, ...decoys])) { const t = h('button', { class: 'tile' }, ch); t.onclick = () => { if (t.classList.contains('used')) return; const i = placed.indexOf(null); if (i < 0) return; placed[i] = { ch, el: t }; t.classList.add('used'); sfx('place'); refresh(); }; tiles.append(t); }
    check.onclick = async () => {
      const got = placed.map(p => p.ch).join('');
      if (got === w) { slots.forEach(x => x.classList.add('good')); mark(sp(w), true, tries === 0); if (tries === 0) giveCoins(2, board); burst(board, cheer()); await wait(700); res(tries === 0); return; }
      tries++; sfx('bad'); shake(board); if (tries === 1) mark(sp(w), false, true, got);
      slots.forEach((x, i) => { if (placed[i].ch !== w[i]) { x.classList.add('bad'); } });
      if (tries === 1) { pip('Tap the red letters. Try again!'); }
      else { pip(`${[...w].join(' - ')}`); slots.forEach((x, i) => { x.textContent = w[i]; x.className = 'slot filled good'; }); await wait(1800); res(false); }
    };
    if (window.__TEST) window.__solve = () => { [...w].forEach(c => { const t = [...tiles.children].find(x => x.textContent === c && !x.classList.contains('used')); t && t.click(); }); check.click(); window.__solve = null; };
    refresh(); scene.append(h('div', { class: 'sub' }, `Make the word. (${w.length} letters)`), board, tiles, check);
  });
}

// Step 2 — the sign painter made a mistake. Find the wrong letter and fix it.
function fixSign(scene, s) {
  return new Promise(res => {
    const w = s.w; const bad = misspell(w, 1, true)[0];
    if (!bad) { build(scene, s).then(res); return; }
    const pos = [...bad].findIndex((c, i) => c !== w[i]); let first = true, found = false;
    const letters = [...bad].map((c, i) => h('button', { class: 'slot filled' }, c));
    const board = h('div', { class: 'signboard' }, h('div', { class: 'slots' }, ...letters));
    const opts = h('div', { class: 'tiles' }); const info = h('div', { class: 'sub' }, 'One letter is wrong. Tap it!');
    letters.forEach((el, i) => el.onclick = () => {
      if (found) return;
      if (i === pos) { found = true; el.classList.add('bad'); sfx('pop'); info.textContent = 'Yes! Now pick the right letter.';
        const choices = shuffle([w[i], ...shuffle('aeioukcdtgpnmlrs'.split('').filter(c => c !== w[i] && c !== bad[i])).slice(0, 2), bad[i]]);
        for (const c of choices) { const t = h('button', { class: 'tile' }, c); t.onclick = async () => {
          if (c === w[i]) { el.textContent = c; el.className = 'slot filled good'; sfx('good'); mark(sp(w), true, first); if (first) giveCoins(2, board); burst(board, cheer()); await wait(800); res(first); }
          else { sfx('bad'); shake(t); t.classList.add('used'); if (first) mark(sp(w), false, true, bad); first = false; }
        }; opts.append(t); }
      } else { sfx('bad'); shake(el); if (first) mark(sp(w), false, true, bad); first = false; pip('That one is OK. Look again!'); }
    });
    if (window.__TEST) window.__solve = () => { letters[pos].click(); setTimeout(() => { const t = [...opts.children].find(x => x.textContent === w[pos]); t && t.click(); }, 50); window.__solve = null; };
    scene.append(info, board, opts);
  });
}

// Step 3 — type it from the clue, with no letters to help.
function paint(scene, s) {
  return new Promise(res => {
    const w = s.w; let typed = '', tries = 0, done = false;
    const show = h('div', { class: 'typed' }); const board = h('div', { class: 'signboard' }, show);
    const draw = () => show.innerHTML = (typed || '') + '<span class="caret"></span>' + `<span style="opacity:.25">${'_'.repeat(Math.max(0, w.length - typed.length))}</span>`;
    const info = h('div', { class: 'sub' }, `Type the word. (${w.length} letters)`);
    const kb = keyboard(async k => {
      if (done) return;
      if (k === 'back') typed = typed.slice(0, -1);
      else if (k === 'enter') {
        if (!typed) return;
        if (typed === w) { done = true; mark(sp(w), true, tries === 0); if (tries === 0) giveCoins(3, board); show.innerHTML = ''; const paintEl = h('div', { class: 'painted' }); show.append(paintEl);
          for (const c of w) { paintEl.textContent += c; sfx('pop'); await wait(90); } burst(board, cheer()); await wait(500); res(tries === 0); return; }
        tries++; sfx('bad'); shake(board); if (tries === 1) mark(sp(w), false, true, typed);
        info.innerHTML = ''; const you = h('span'); for (let i = 0; i < Math.max(typed.length, w.length); i++) you.append(h('span', { class: (typed[i] || '_') === w[i] ? 'y' : 'x' }, typed[i] || '_'));
        info.append(h('div', { class: 'compare' }, 'You: ', you));
        if (tries >= 2) { info.append(h('div', { class: 'compare' }, 'Sign: ', h('span', { class: 'y' }, w))); done = true; await wait(2200); res(false); return; }
        pip('Fix the red letters!'); typed = '';
      } else if (typed.length < 10) typed += k;
      draw();
    }, { enterLabel: 'Done' });
    draw(); scene.append(info, board, kb);
  });
}
