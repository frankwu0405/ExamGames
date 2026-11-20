// WORKSHOP — grammar. One machine for each lesson's grammar topic.
import { h, sfx, say, pip, mark, setQ, REPLAY, giveCoins, burst, shake, cheer, tryAgain, wait, speakBtn, choose } from '../core.js';
import { GRAMMAR } from '../data.js';
import { menu, playRound, machineProgress } from '../shell.js';
import { askChoice } from '../widgets.js';
import { shuffle, pick } from '../mathgen.js';

const PICS = { 1: '🔏', 2: '🎚️', 3: '🔄', 4: '🖨️', 5: '🫙', 6: '🏷️', 7: '⚖️' };
export default {
  id: 'workshop', title: 'Workshop — Grammar',
  bg: 'linear-gradient(#E9E2D3 0 58%, #8A6A4F 58% 60%, #B5916B 60%)',
  enter(ui) {
    menu(ui, 'Fix the machines!', [...Object.entries(GRAMMAR).map(([L, g]) => ({
      name: g.name, desc: `Lesson ${L}: ${g.topic}`, pic: PICS[L], count: [Math.round(machineProgress(L) * 6), 6, 'right'], go: () => round(ui, +L) })),
      { name: 'Repair shop', desc: 'Find the wrong word.', pic: '🛠️', color: '#FFE07A', go: () => repair(ui) }]);
    pip('Pick a machine!');
  },
};

function round(ui, L) {
  const g = GRAMMAR[L]; const items = choose(g.items.map((it, i) => ({ it, i })), 8, x => `g${L}:${x.i}`);
  ui.clear();
  playRound(ui, { n: items.length, again: () => round(ui, L), ask: async (i, host) => {
    const frame = h('div', { class: 'machine' }, h('div', { class: 'plate' }, g.name), h('div', { class: 'gears' }, h('span', {}, '⚙️'), h('span', {}, '⚙️')));
    host.append(frame);
    if (i === 0) await pip(g.help);
    setQ('gram', { L, i: items[i].i }, gramLabel(L, items[i].it));
    const ok = await TASKS[L](frame, items[i].it, `g${L}:${items[i].i}`, g);
    const gears = frame.querySelector('.gears'); gears.classList.add('spin'); return ok;
  } });
}
const gramLabel = (L, it) => { const t = Array.isArray(it) ? it[0] : it.t || it.q; return `${GRAMMAR[L].name}: ${String(t).replace('___', '__')}`; };
REPLAY.gram = (host, d) => { const g = GRAMMAR[d.L]; const frame = h('div', { class: 'machine' }, h('div', { class: 'plate' }, g.name), h('div', { class: 'gears' }, h('span', {}, '⚙️'), h('span', {}, '⚙️'))); host.append(frame); return TASKS[d.L](frame, g.items[d.i], `g${d.L}:${d.i}`, g); };
REPLAY.repair = (host, B) => repairTask(host, B);
const belt = (...kids) => h('div', { class: 'belt run' }, h('div', { class: 'item' }, ...kids));

const TASKS = {
  // L1 — what kind of sentence?
  1: (m, [t, k], id) => {
    const item = h('span', {}, t); const b = belt(item, h('span', { class: 'endmark' }, ''));
    m.append(b);
    const opts = { S: 'Statement', Q: 'Question', C: 'Command' };
    return askChoice(m, { prompt: 'What kind of sentence is it?', speech: t, options: Object.values(opts), answer: opts[k], id,
      hint: 'A question asks. A command tells someone to do something. A statement tells a fact.',
      onRight: async () => { b.querySelector('.endmark').textContent = k === 'Q' ? '?' : '.'; sfx('hammer'); await wait(500); } });
  },
  // L2 — am/is/are, or put "not" in the right place
  2: (m, it, id) => {
    if (it.k === 'be') { const b = belt(h('span', { html: it.t.replace('___', '<span class="gapbtn"></span>') })); m.append(b);
      return askChoice(m, { prompt: 'Which word goes in the gap?', speech: it.t, options: ['am', 'is', 'are'], answer: it.a, id,
        hint: 'I am, he is, she is, it is, we are, you are, they are.', onRight: async () => { b.querySelector('.item').textContent = it.t.replace('___', it.a); await say(it.t.replace('___', it.a)); } }); }
    return gapNot(m, it.t, id);
  },
  // L3 — flip into a question, or pick the short answer
  3: (m, it, id) => it.k === 'flip' ? flipQ(m, it.t, id)
    : askChoice(m, { prompt: it.q, speech: it.q, options: [it.a, ...it.o], answer: it.a, id, extra: belt(it.q), hint: 'Use the same word as the question: is → is, are → are.' }),
  // L4 — one → many
  4: (m, [one, many, wrong], id) => { const b = belt(`one ${one}`, h('span', { style: { margin: '0 14px' } }, '→'), h('span', { class: 'out' }, 'two ___')); m.append(b);
    return askChoice(m, { prompt: `One ${one}, two…?`, speech: `One ${one}. Two what?`, options: [many, ...wrong], answer: many, id,
      hint: 'Remember: -s, -es, -ies, or a special word like children.', onRight: async () => { b.querySelector('.out').textContent = `two ${many}`; await say(`two ${many}`); } }); },
  // L5 — count or non-count jar
  5: (m, [w, k, pic], id) => new Promise(res => {
    let first = true; const item = belt(h('span', { style: { fontSize: '40px' } }, pic), ' ', w); m.append(item);
    const jars = h('div', { class: 'jars' });
    const mk = (kind, label, cls) => { const j = h('button', { class: 'jar ' + cls, 'data-label': label, onclick: async () => {
      if (jars.dataset.done) return;
      if (kind === k) { jars.dataset.done = 1; j.append(h('span', {}, pic)); sfx('good'); burst(j, cheer()); mark(id, true, first); if (first) giveCoins(1, j);
        await say(k === 'C' ? `You can count it: one ${w}, two ${w}s.` : `You can't count ${w}. We say some ${w}.`); res(first); }
      else { sfx('bad'); shake(j); if (first) mark(id, false, true, label); first = false; pip(k === 'C' ? `Two ${w}s? Yes! You can count it.` : `Two ${w}s? No! You can't count it.`); }
    } }); return j; };
    jars.append(mk('C', 'Can count', 'count'), mk('N', "Can't count", 'non')); m.append(h('div', { class: 'prompt' }, speakBtn(w), 'Which jar does it go in?'), jars); say(w);
  }),
  // L6 — a / an / the
  6: (m, [t, a], id) => { const b = belt(h('span', { html: t.replace('___', '<span class="gapbtn"></span>') })); m.append(b); const cap = t.startsWith('___');
    return askChoice(m, { prompt: 'Pick the right word.', speech: t, options: cap ? ['A', 'An', 'The'] : ['a', 'an', 'the'], answer: a, id,
      hint: '"an" goes before a vowel sound like a, e, i, o, u. "the" is for one special thing, like the sun.', onRight: async () => { b.querySelector('.item').textContent = t.replace('___', a); await say(t.replace('___', a)); } }); },
  // L7 — some / any
  7: (m, [t, a], id) => { const b = belt(h('span', { html: t.replace('___', '<span class="gapbtn"></span>') })); m.append(b);
    return askChoice(m, { prompt: 'some or any?', speech: t, options: ['some', 'any'], answer: a, id,
      hint: 'Questions and "not" sentences use "any". Telling sentences use "some".', onRight: async () => { b.querySelector('.item').textContent = t.replace('___', a); await say(t.replace('___', a)); } }); },
};

// Tap the gap where "not" belongs
function gapNot(m, t, id) {
  return new Promise(res => {
    let first = true; const words = t.replace(/\.$/, '').split(' '); const be = words.findIndex(w => ['am', 'is', 'are'].includes(w));
    const item = h('div', { class: 'item' }); const b = h('div', { class: 'belt run' }, item); m.append(b);
    words.forEach((w, i) => { item.append(h('span', {}, w)); if (i < words.length - 1) {
      const g = h('button', { class: 'gapbtn', 'aria-label': 'Put not here', onclick: async () => {
        if (item.dataset.done) return;
        if (i === be) { item.dataset.done = 1; g.replaceWith(h('span', { class: 'not-chip' }, 'not')); sfx('good'); mark(id, true, first); if (first) giveCoins(1, b); burst(b, cheer());
          const out = [...words.slice(0, be + 1), 'not', ...words.slice(be + 1)].join(' ') + '.'; await say(out); res(first); }
        else { sfx('bad'); shake(g); if (first) mark(id, false, true, 'gap ' + i); first = false; pip('Put "not" after am, is, are.'); }
      } }); item.append(g); } });
    item.append('.');
    m.append(h('div', { class: 'prompt' }, speakBtn(t), 'Where does "not" go?')); say(`${t} Where does not go?`);
  });
}

// Tap the be-verb to flip the sentence into a question
function flipQ(m, t, id) {
  return new Promise(res => {
    let first = true; const words = t.replace(/\.$/, '').split(' '); const be = words.findIndex(w => ['am', 'is', 'are'].includes(w));
    const item = h('div', { class: 'item' }); m.append(h('div', { class: 'belt run' }, item));
    words.forEach((w, i) => item.append(h('button', { class: 'wordbtn', onclick: async () => {
      if (item.dataset.done) return;
      if (i === be) { item.dataset.done = 1; sfx('whoosh'); mark(id, true, first); if (first) giveCoins(1, item);
        const rest = words.filter((_, k) => k !== be); rest[0] = rest[0] === 'I' ? 'I' : rest[0].toLowerCase();
        const q = words[be][0].toUpperCase() + words[be].slice(1) + ' ' + rest.join(' ') + '?';
        item.animate([{ transform: 'rotateX(0)' }, { transform: 'rotateX(90deg)' }, { transform: 'rotateX(0)' }], { duration: 500 });
        await wait(250); item.textContent = q; sfx('good'); burst(item, cheer()); await say(q); res(first); }
      else { sfx('bad'); shake(item); if (first) mark(id, false, true, w); first = false; pip('Tap am, is or are.'); }
    } }, w)));
    item.append('.');
    m.append(h('div', { class: 'prompt' }, speakBtn(t), 'Make a question. Which word moves?')); say(t);
  });
}

// ---------------------------------------------------------------- Repair shop: find the grammar mistake, then fix it
function makeBroken() {
  const k = pick(['be', 'be', 'plural', 'article', 'someany', 'answer']); const G = GRAMMAR;
  if (k === 'be') { const items = G[2].items.filter(x => x.k === 'be'); const it = pick(items); const wrong = pick(['am', 'is', 'are'].filter(x => x !== it.a));
    return { id: 'fix:2:' + G[2].items.indexOf(it), words: it.t.replace('___', wrong).split(' '), bad: wrong, good: it.a, opts: ['am', 'is', 'are'], tip: 'I am · he, she, it is · we, you, they are' }; }
  if (k === 'plural') { const it = pick(G[4].items.filter(x => x[0] !== x[1])); const wrong = it[2][0]; const n = pick(['two', 'three', 'five']);
    return { id: 'fix:4:' + G[4].items.indexOf(it), words: `I can see ${n} ${wrong}.`.split(' '), bad: wrong + '.', good: it[1] + '.', opts: [it[1] + '.', ...it[2].map(x => x + '.')], tip: `One ${it[0]}, two…?` }; }
  if (k === 'article') { const it = pick(G[6].items.filter(x => !x[0].startsWith('___') && x[1] !== 'the')); const wrong = it[1] === 'a' ? 'an' : 'a';
    return { id: 'fix:6:' + G[6].items.indexOf(it), words: it[0].replace('___', wrong).split(' '), bad: wrong, good: it[1], opts: ['a', 'an', 'the'], tip: '"an" goes before a, e, i, o, u sounds.' }; }
  if (k === 'someany') { const it = pick(G[7].items); const wrong = it[1] === 'some' ? 'any' : 'some';
    return { id: 'fix:7:' + G[7].items.indexOf(it), words: it[0].replace('___', wrong).split(' '), bad: wrong, good: it[1], opts: ['some', 'any'], tip: 'Questions and "not" sentences use "any".' }; }
  const it = pick(G[3].items.filter(x => x.k === 'ans')); const wrong = it.o[0];
  return { id: 'fix:3:' + G[3].items.indexOf(it), pre: it.q, words: wrong.split(' '), bad: wrong.split(' ').find((w, i) => w !== it.a.split(' ')[i]), good: it.a.split(' ').find((w, i) => w !== wrong.split(' ')[i]), opts: ['am', 'is', 'are'].map(x => x + (wrong.endsWith('not.') ? '' : '.')).filter(Boolean), tip: 'Answer with the same word as the question.' };
}
function repair(ui) {
  playRound(ui, { n: 8, again: () => repair(ui), ask: (i, host) => repairTask(host, makeBroken()) });
}
function repairTask(host, B) {
  setQ('repair', B, `Fix it: ${(B.pre ? B.pre + ' ' : '') + B.words.join(' ')}`);
  return new Promise(res => {
    let first = true, found = false;
    if (B.opts.indexOf(B.good) < 0) B.opts = [B.good, ...B.opts.filter(o => o !== B.good)].slice(0, 3);
    const frame = h('div', { class: 'machine' }, h('div', { class: 'plate' }, 'Repair shop'), h('div', { class: 'gears' }, h('span', {}, '⚙️'), h('span', {}, '⚙️')));
    const line = h('div', { class: 'fixline' }); const fixRow = h('div', { class: 'choices' });
    const info = h('div', { class: 'prompt' }, 'One word is wrong. Tap it!');
    if (B.pre) frame.append(h('div', { class: 'belt run' }, h('div', { class: 'item' }, B.pre)));
    B.words.forEach(w => { const b = h('button', { class: 'tok' }, w); b.onclick = () => {
      if (found) return;
      if (w === B.bad) { found = true; b.classList.add('nope'); sfx('pop'); info.textContent = 'Yes! What should it be?';
        for (const o of shuffle([...new Set(B.opts)])) { const c = h('button', { class: 'choice' }, o); c.onclick = async () => {
          if (fixRow.dataset.done || c.classList.contains('wrong')) return;
          if (o === B.good) { fixRow.dataset.done = 1; c.classList.add('right'); b.textContent = B.good; b.className = 'tok fixed'; sfx('good'); mark(B.id, true, first); if (first) giveCoins(2, b); burst(b, cheer()); frame.querySelector('.gears').classList.add('spin'); await wait(1200); res(first); }
          else { c.classList.add('wrong'); sfx('bad'); shake(c); if (first) mark(B.id, false, true, o); first = false; pip(B.tip); }
        }; fixRow.append(c); }
      } else { sfx('bad'); b.classList.add('nope'); shake(b); setTimeout(() => b.classList.remove('nope'), 600); if (first) mark(B.id, false, true, w); first = false; pip('That word is OK.'); }
    }; line.append(b); });
    if (window.__TEST) window.__solve = () => { [...line.children].find(b => b.textContent === B.bad).click(); setTimeout(() => [...fixRow.children].find(c => c.textContent === B.good).click(), 60); window.__solve = null; };
    frame.append(info, line, fixRow); host.append(frame);
  });
}
