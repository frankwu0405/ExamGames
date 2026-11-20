// BRIDGE BUILDER — the long bridge to Word Island, built from this week's lessons (Lesson 10 + Lesson 11).
// 7 parts x 4 planks. Every right answer lays a plank; right the first time = a gold plank.
// After each part a pair of lantern posts goes up. The bridge itself shows how she did.
import { S, save, h, sfx, say, hush, pip, mark, giveCoins, burst, shake, cheer, tryAgain, wait, speakBtn, setQ, clearQ, REPLAY, confetti } from './core.js';
import { askChoice, askNumber } from './widgets.js';
import { shuffle, pick } from './mathgen.js';
import { bridgeSet, bridgeLay, bridgePost, bridgeFocus, bridgeWide, bridgeFog, bridgeGate, WB_N, labelsVisible, overview } from './town3d.js';
import * as F from './folk.js';
import { talk, talkEnd } from './story.js';

// ---------------------------------------------------------------- content (Grade 2, Lessons 10 & 11)
const SPELL = [
  // Lesson 10
  { w: 'class', pic: '🏫', ctx: 'Our ___ has a fun teacher.' },
  { w: 'stage', pic: '🎤', ctx: 'We sing on the ___.' },
  { w: 'hunt', pic: '🐈', ctx: 'Cats ___ mice.' },
  { w: 'stamp', pic: '✉️', ctx: 'Put a ___ on the letter.' },
  { w: 'glide', pic: '🕊️', ctx: 'Birds can ___ in the sky.' },
  { w: 'stuck', pic: '🚗', ctx: 'The car is ___ in the mud.' },
  { w: 'place', pic: '📍', ctx: 'The zoo is a fun ___.' },
  { w: 'such', pic: '☀️', ctx: 'It is ___ a hot day!' },
  { w: 'pond', pic: '🦆', ctx: 'Ducks swim in the ___.' },
  { w: 'while', pic: '⏳', ctx: 'I read a book ___ I wait.' },
  // Lesson 11
  { w: 'bells', pic: '🔔🔔', ctx: 'The ___ ring and ring.' },
  { w: 'ducks', pic: '🦆🦆', ctx: 'Two ___ swim in the pond.' },
  { w: 'bikes', pic: '🚲🚲', ctx: 'We ride our ___ to the park.' },
  { w: 'eggs', pic: '🥚🥚', ctx: 'I eat two ___ for breakfast.' },
  { w: 'boxes', pic: '📦📦', ctx: 'Put the toys in the ___.' },
  { w: 'grapes', pic: '🍇', ctx: 'I like green ___.' },
  { w: 'dishes', pic: '🍽️🍽️', ctx: 'Dad washes the ___.' },
  { w: 'names', pic: '📛📛', ctx: 'Write your ___ on the paper.' },
  { w: 'dresses', pic: '👗👗', ctx: 'She has three pretty ___.' },
  { w: 'wishes', pic: '🌠', ctx: 'Close your eyes and make three ___!' },
];
const PLURAL = [
  ['bell', '🔔', 0], ['duck', '🦆', 0], ['bike', '🚲', 0], ['egg', '🥚', 0], ['grape', '🍇', 0], ['name', '📛', 0], ['cat', '🐈', 0], ['cup', '🥤', 0],
  ['box', '📦', 1], ['dish', '🍽️', 1], ['dress', '👗', 1], ['wish', '🌠', 1], ['fox', '🦊', 1], ['bus', '🚌', 1], ['lunch', '🍱', 1], ['glass', '🥛', 1], ['brush', '🪥', 1], ['peach', '🍑', 1],
].map(([w, pic, es]) => ({ w, pic, es: !!es }));
const SOUND = [
  ['', 'ip', 'sh', ['sh', 'ch', 'th'], 'ship', '🚢'], ['', 'eese', 'ch', ['ch', 'sh', 'wh'], 'cheese', '🧀'], ['', 'ale', 'wh', ['wh', 'th', 'sh'], 'whale', '🐋'],
  ['', 'umb', 'th', ['th', 'sh', 'ch'], 'thumb', '👍'], ['wa', '', 'tch', ['tch', 'sh', 'th'], 'watch', '⌚'], ['du', '', 'ck', ['ck', 'k', 'c'], 'duck', '🦆'],
  ['cla', '', 'ss', ['ss', 's', 'sh'], 'class', '🏫'], ['po', '', 'nd', ['nd', 'nt', 'ng'], 'pond', '🏞️'], ['hu', '', 'nt', ['nt', 'nd', 'mp'], 'hunt', '🐈'],
  ['sta', '', 'mp', ['mp', 'nd', 'ft'], 'stamp', '✉️'], ['', 'ide', 'gl', ['gl', 'gr', 'sl'], 'glide', '🕊️'], ['ri', '', 'ng', ['ng', 'nk', 'nd'], 'ring', '💍'],
  ['si', '', 'nk', ['nk', 'ng', 'nt'], 'sink', '🚰'], ['gi', '', 'ft', ['ft', 'st', 'nt'], 'gift', '🎁'], ['ne', '', 'xt', ['xt', 'st', 'ft'], 'next', '⏭️'],
  ['', 'ain', 'tr', ['tr', 'dr', 'cr'], 'train', '🚂'], ['stu', '', 'ck', ['ck', 'k', 'ch'], 'stuck', '🚗'], ['su', '', 'ch', ['ch', 'sh', 'tch'], 'such', '☀️'],
  ['', 'ile', 'wh', ['wh', 'w', 'th'], 'while', '⏳'], ['wi', 'es', 'sh', ['sh', 'ch', 's'], 'wishes', '🌠'],
].map(([pre, post, ans, opts, word, pic]) => ({ pre, post, ans, opts, word, pic }));
const WHOSE = [
  { t: '___ bike is this?', a: "It is Uncle Bo's bike.", ans: 'Whose', opts: ['Whose', 'Who', 'What'] },
  { t: '___ cat is that?', a: "It is Mia's cat.", ans: 'Whose', opts: ['Whose', 'Who', 'Where'] },
  { t: '___ dresses are these?', a: "They are Mom's dresses.", ans: 'Whose', opts: ['Whose', 'What', 'Who'] },
  { t: '___ idea is this?', a: "It is Pip's idea!", ans: 'Whose', opts: ['Whose', 'Who', 'When'] },
  { t: '___ is your uncle?', a: 'He is the man in the red hat.', ans: 'Who', opts: ['Who', 'Whose', 'What'] },
  { t: '___ is in the box?', a: 'Two eggs are in the box.', ans: 'What', opts: ['What', 'Whose', 'Who'] },
  { t: '___ ducks are in the pond?', a: "They are Grandpa's ducks.", ans: 'Whose', opts: ['Whose', 'Who', 'What'] },
];
const COMPARE = [
  { t: 'The pool is cool. The lake is ___.', ans: 'cooler', opts: ['cooler', 'cool', 'more cool'] },
  { t: 'A duck is small. An egg is ___.', ans: 'smaller', opts: ['smaller', 'small', 'smallest'] },
  { t: 'My bike is fast. The train is ___.', ans: 'faster', opts: ['faster', 'fast', 'more fast'] },
  { t: 'The cat is big. The horse is ___.', ans: 'bigger', opts: ['bigger', 'biger', 'big'] },
  { t: 'Today is hot. Tomorrow will be ___.', ans: 'hotter', opts: ['hotter', 'hoter', 'hot'] },
  { t: 'My uncle is tall. The giraffe is ___.', ans: 'taller', opts: ['taller', 'tall', 'more tall'] },
  { t: 'The water is warm. The soup is ___.', ans: 'warmer', opts: ['warmer', 'warm', 'warmest'] },
];
const ADJ = [
  { t: 'The water is cool.', ans: 'cool' }, { t: 'My uncle tells funny stories.', ans: 'funny' }, { t: 'The bright sun gives us heat.', ans: 'bright' },
  { t: 'Do you have a good idea?', ans: 'good' }, { t: 'The zoo is a fun place.', ans: 'fun' }, { t: 'She wears a pretty dress.', ans: 'pretty' },
  { t: 'I ride my red bike.', ans: 'red' },
];
const SENTENCES = [
  'The bright sun gives us heat.', 'Do you have a good idea?', 'The zoo is a fun place to see animals.', 'We have to stay inside when it rains.', 'You can buy many things in a store.',
  'May I have another cookie?', 'The water is cool.', 'I will invite my friend to my party.', 'The children swim in the pool.', 'My uncle tells funny stories.',
];
const VOCAB = ['heat', 'idea', 'place', 'stay', 'things', 'another', 'cool', 'invite', 'pool', 'uncle'];
const FILL = [
  ['The bright sun gives us ___.', 'heat'], ['Do you have a good ___?', 'idea'], ['The zoo is a fun ___ to see animals.', 'place'], ['We have to ___ inside when it rains.', 'stay'],
  ['You can buy many ___ in a store.', 'things'], ['May I have ___ cookie?', 'another'], ['The water is ___.', 'cool'], ['I will ___ my friend to my party.', 'invite'],
  ['The children swim in the ___.', 'pool'], ['My ___ tells funny stories.', 'uncle'],
];
const LIVING = [['🦆', 'a duck', 1], ['🌳', 'a tree', 1], ['🐕', 'a dog', 1], ['🌻', 'a sunflower', 1], ['🐟', 'a fish', 1], ['🐛', 'a caterpillar', 1], ['🐴', 'a horse', 1],
  ['🪨', 'a rock', 0], ['🚲', 'a bike', 0], ['📦', 'a box', 0], ['🔔', 'a bell', 0], ['✏️', 'a pencil', 0], ['🧸', 'a teddy bear', 0], ['☁️', 'a cloud', 0], ['🚗', 'a car', 0]]
  .map(([e, n, l]) => ({ e, n, living: !!l }));

// ---------------------------------------------------------------- the seven parts
const PARTS = [
  { key: 'spell', name: 'Spelling Planks', pip: 'Spell each word to lay a plank!' },
  { key: 'plural', name: 'Plural Planks', pip: 'One box, two boxes! Do we add s or es?' },
  { key: 'sound', name: 'Sound Planks', pip: 'Find the missing sound!' },
  { key: 'gram', name: 'Grammar Planks', pip: 'Whose? Who? Bigger? Pick the right words!' },
  { key: 'sent', name: 'Sentence Planks', pip: "Fix this week's sentences!" },
  { key: 'math', name: 'Nail Planks', pip: 'Every plank needs nails. Count them fast!' },
  { key: 'sci', name: 'Lantern Planks', pip: 'Living or non-living? Then the lanterns light up!' },
];
const POST_LINES = ['Spelling posts are up!', 'Plural posts are up!', 'Sound posts are up!', 'Grammar posts are up!', 'Sentence posts are up!', 'Nail posts are up!', 'The last lanterns are on!'];

function itemsFor(key) {
  const take = (arr, n) => shuffle(arr).slice(0, n);
  if (key === 'spell') return [...take(SPELL.slice(0, 10), 2), ...take(SPELL.slice(10), 2)].sort(() => Math.random() - 0.5);
  if (key === 'plural') { const es = take(PLURAL.filter(p => p.es), 2), s = take(PLURAL.filter(p => !p.es), 2); return shuffle([...es, ...s]); }
  if (key === 'sound') return take(SOUND, 4);
  if (key === 'gram') return shuffle([{ type: 'q', ...pick(WHOSE.filter(x => x.ans === 'Whose')) }, { type: 'cmp', ...pick(COMPARE) }, { type: 'adj', ...pick(ADJ) },
    Math.random() < 0.5 ? { type: 'q', ...pick(WHOSE.filter(x => x.ans !== 'Whose')) } : { type: 'cmp', ...pick(COMPARE) }]);
  if (key === 'sent') { const b = take(SENTENCES, 2), f = take(FILL.filter(x => !b.some(s => s.includes(x[1]))), 2); return [{ type: 'build', t: b[0] }, { type: 'fill', t: f[0][0], ans: f[0][1] }, { type: 'build', t: b[1] }, { type: 'fill', t: f[1][0], ans: f[1][1] }]; }
  if (key === 'math') { const pair = () => { for (;;) { const a = 2 + Math.floor(Math.random() * 7), b = 2 + Math.floor(Math.random() * 5); if (a * b <= 40) return [a, b]; } };
    return ['nails', 'ducks', 'same', 'lanterns'].map(kind => { const [a, b] = pair(); return { kind, a, b }; }); }
  if (key === 'sci') { const l = take(LIVING.filter(x => x.living), 2), n = take(LIVING.filter(x => !x.living), 2); return shuffle([...l, ...n]); }
  return [];
}

// ---------------------------------------------------------------- tasks: (host, item) => Promise<right first time>
const blank = (t, fill) => t.replace('___', fill ? `<b class="wb-fill">${fill}</b>` : '<span class="wb-gap">?</span>');
const TASK = {
  spell(host, it) {
    const id = 'wb:spell:' + it.w; const full = it.ctx.replace('___', it.w);
    return new Promise(res => {
      let first = true, done = false;
      host.append(h('div', { class: 'prompt' }, speakBtn(() => `${it.w}. ${full}`), h('span', { class: 'wb-pics' }, it.pic), h('span', { html: blank(it.ctx) })));
      const slots = h('div', { class: 'slots' }), tiles = h('div', { class: 'wb-tiles' });
      const word = it.w.split(''); const pool = 'abcdefghijklmnoprstuwy'.split('').filter(c => !word.includes(c));
      const letters = shuffle([...word, pick(pool), pick(pool)]);
      const S2 = word.map(() => h('div', { class: 'slot' })); S2.forEach(s => slots.append(s));
      const filled = () => S2.filter(s => s.dataset.t);
      const mark1 = () => { S2.forEach(s => s.classList.toggle('next', !s.dataset.t && s === S2.find(x => !x.dataset.t))); };
      S2.forEach(s => s.onclick = () => { if (done || !s.dataset.t) return; const t = tiles.querySelector(`[data-k="${s.dataset.t}"]`); t.classList.remove('used'); s.dataset.t = ''; s.textContent = ''; s.className = 'slot'; sfx('tap'); mark1(); });
      letters.forEach((c, k) => tiles.append(h('button', { class: 'tile', 'data-k': k, onclick: async e => {
        const t = e.currentTarget; if (done || t.classList.contains('used')) return; const s = S2.find(x => !x.dataset.t); if (!s) return;
        sfx('tap'); t.classList.add('used'); s.dataset.t = k; s.textContent = c; s.classList.add('filled'); mark1();
        if (filled().length < word.length) return;
        const got = S2.map(x => x.textContent).join('');
        if (got === it.w) { done = true; S2.forEach(x => x.classList.add('good')); sfx('good'); burst(slots, cheer()); mark(id, true, first); if (first) giveCoins(2, slots); say(it.w); await wait(900); res(first); return; }
        sfx('bad'); shake(slots); if (first) mark(id, false, true, got); first = false; pip(`Listen: ${it.w}.`, { speech: `Listen. ${it.w}` });
        S2.forEach((x, i) => { if (x.textContent !== word[i]) x.classList.add('bad'); }); await wait(900);
        S2.forEach((x, i) => { if (x.textContent !== word[i]) { tiles.querySelector(`[data-k="${x.dataset.t}"]`).classList.remove('used'); x.dataset.t = ''; x.textContent = ''; x.className = 'slot'; } }); mark1();
      } }, c)));
      host.append(slots, tiles); mark1(); say(`Spell ${it.w}. ${full}`);
    });
  },
  plural(host, it) {
    const word = h('span', { class: 'wb-big' }, it.w, h('span', { class: 'wb-gap' }, '?'));
    const extra = h('div', { class: 'wb-plural' }, h('div', {}, h('div', { class: 'wb-pics' }, it.pic), h('small', {}, 'one ' + it.w)), h('div', { class: 'wb-arrow' }, '➜'),
      h('div', {}, h('div', { class: 'wb-pics' }, it.pic + it.pic), word));
    const pl = it.w + (it.es ? 'es' : 's');
    return askChoice(host, { prompt: `One ${it.w}, two ___. Add <b>s</b> or <b>es</b>?`, speech: `One ${it.w}. Two what? Add s, or e s?`, options: ['s', 'es'], answer: it.es ? 'es' : 's', id: 'wb:plural:' + it.w, coins: 2, extra, big: true,
      wrongLine: () => it.es ? `${it.w} ends in ${it.w.match(/(ch|sh|ss|s|x)$/)[0]}. Add e s!` : 'Most words just add s.',
      onRight: async () => { word.textContent = pl; word.classList.add('wb-done'); say(pl); pip(it.es ? `${it.w.match(/(ch|sh|ss|s|x)$/)[0]} → add es: ${pl}!` : `Just add s: ${pl}!`, { speak: false }); await wait(1200); } });
  },
  sound(host, it) {
    const gap = h('span', { class: 'wb-gap' }, '__');
    const extra = h('div', { class: 'wb-plural' }, h('div', { class: 'wb-pics' }, it.pic), h('span', { class: 'wb-big' }, it.pre, gap, it.post));
    return askChoice(host, { prompt: 'Which sound is missing?', speech: `Which sound is missing? ${it.word}.`, options: it.opts, answer: it.ans, id: 'wb:sound:' + it.word, coins: 2, extra,
      hint: `Say it slowly: ${it.word}.`, onRight: async () => { gap.textContent = it.ans; gap.classList.add('wb-done'); say(it.word); await wait(1000); } });
  },
  gram(host, it) {
    if (it.type === 'q') return askChoice(host, { prompt: `${blank(it.t)}<br><small class="wb-answer">${it.a}</small>`, speech: `${it.t.replace('___', 'blank')} ${it.a}`, options: it.opts, answer: it.ans, id: 'wb:q:' + it.t, coins: 2,
      hint: it.ans === 'Whose' ? 'The answer tells who owns it. Use Whose.' : it.ans === 'Who' ? 'The answer is a person. Use Who.' : 'The answer is a thing. Use What.' });
    if (it.type === 'cmp') return askChoice(host, { prompt: blank(it.t), speech: it.t.replace('___', 'blank'), options: it.opts, answer: it.ans, id: 'wb:cmp:' + it.t, coins: 2,
      hint: 'When we compare two things, we add er.' });
    // adj: tap the describing word in the sentence
    const id = 'wb:adj:' + it.t;
    return new Promise(res => {
      let first = true, done = false;
      host.append(h('div', { class: 'prompt' }, speakBtn(it.t), h('span', {}, 'Tap the ', h('b', {}, 'describing word'), ' (adjective).')));
      const row = h('div', { class: 'wb-words' });
      it.t.split(' ').forEach(wd => { const clean = wd.replace(/[.?!]/g, '').toLowerCase();
        row.append(h('button', { class: 'wb-word', onclick: async e => { const b = e.currentTarget; if (done || b.classList.contains('bad')) return;
          if (clean === it.ans) { done = true; b.classList.add('good'); sfx('good'); burst(b, cheer()); mark(id, true, first); if (first) giveCoins(2, b); await wait(900); res(first); }
          else { b.classList.add('bad'); sfx('bad'); shake(b); if (first) mark(id, false, true, clean); first = false; pip('A describing word tells what something is like.'); } } }, wd)); });
      host.append(row); say('Tap the describing word. ' + it.t);
    });
  },
  sent(host, it) {
    if (it.type === 'fill') { const opts = shuffle([it.ans, ...shuffle(VOCAB.filter(v => v !== it.ans)).slice(0, 2)]);
      return askChoice(host, { prompt: blank(it.t), speech: it.t.replace('___', 'blank'), options: opts, answer: it.ans, id: 'wb:fill:' + it.t, coins: 2, hint: 'Read the sentence again.' }); }
    const id = 'wb:build:' + it.t, words = it.t.split(' ');
    return new Promise(res => {
      let first = true, done = false;
      host.append(h('div', { class: 'prompt' }, speakBtn(it.t), h('span', {}, 'Put the words in order.')));
      const line = h('div', { class: 'wb-line' }), bank = h('div', { class: 'wb-words' });
      const check = async () => {
        if (line.children.length < words.length) return;
        const got = [...line.children].map(b => b.textContent).join(' ');
        if (got === it.t) { done = true; line.classList.add('good'); sfx('good'); burst(line, cheer()); mark(id, true, first); if (first) giveCoins(3, line); say(it.t); await wait(1300); res(first); return; }
        sfx('bad'); shake(line); if (first) mark(id, false, true, got); first = false; pip('Listen and try again.', { speech: 'Listen. ' + it.t });
        await wait(700); [...line.children].forEach(b => bank.append(b));
      };
      shuffle(words.map((w, i) => ({ w, i }))).forEach(({ w }) => bank.append(h('button', { class: 'wb-word', onclick: e => { if (done) return; const b = e.currentTarget; sfx('tap'); (b.parentNode === bank ? line : bank).append(b); check(); } }, w)));
      host.append(line, bank); say(it.t);
    });
  },
  math(host, it) {
    const { a, b } = it; const groups = (n, k, e) => h('div', { class: 'wb-nails' }, ...Array.from({ length: n }, () => h('div', { class: 'wb-group' }, e.repeat(k))));
    if (it.kind === 'same') { const opts = shuffle([`${a} × ${b}`, `${b} × ${b}`, `${a} + ${b}`]);
      return askChoice(host, { prompt: `Which is the same as <b>${Array(a).fill(b).join(' + ')}</b>?`, speech: `Which is the same as ${Array(a).fill(b).join(' plus ')}?`, options: opts, answer: `${a} × ${b}`, id: `wb:same:${a}x${b}`, coins: 2,
        extra: groups(a, b, '🔩'), hint: `Count the groups. There are ${a} groups of ${b}.` }); }
    const T = { nails: [`Each plank needs <b>${b}</b> nails. How many nails for <b>${a}</b> planks?`, '🔩'], ducks: [`<b>${a}</b> boats. <b>${b}</b> ducks in each boat. How many ducks?`, '🦆'],
      lanterns: [`<b>${a}</b> rows of lanterns. <b>${b}</b> in each row. How many lanterns?`, '🏮'] }[it.kind];
    return askNumber(host, { prompt: T[0], answer: a * b, id: `wb:${it.kind}:${a}x${b}`, extra: groups(a, b, T[1]), maxLen: 2, hint: `${a} groups of ${b}. Count by ${b}s!` });
  },
  sci(host, it) {
    return askChoice(host, { prompt: `Is <b>${it.n}</b> living or non-living?`, options: ['Living', 'Non-living'], answer: it.living ? 'Living' : 'Non-living', id: 'wb:sci:' + it.n, coins: 2,
      extra: h('div', { class: 'wb-pics big' }, it.e), hint: 'Living things grow, eat and breathe.', big: true });
  },
};
REPLAY.wb = (host, d) => TASK[d.key](host, d.item);

// ---------------------------------------------------------------- the builder
let open = false;
export const bridgeDone = () => ((S.wb && S.wb.marks) || '').length >= WB_N;
export function syncBridge() { S.wb = S.wb || { marks: '' }; bridgeSet(S.wb.marks.split('')); }

export async function openBridge(hooks) {
  if (open) return; open = true; S.wb = S.wb || { marks: '' };
  hush(); hooks.hud(false); labelsVisible(false); F.folkLabels(false);
  let stop = false, wake = null;
  const strip = h('div', { class: 'wb-strip' });
  const drawStrip = () => { strip.innerHTML = ''; for (let i = 0; i < WB_N; i++) strip.append(h('i', { class: 'wbp' + (S.wb.marks[i] ? ' wbp-' + S.wb.marks[i] : '') + (i === S.wb.marks.length ? ' wbp-now' : '') + (i % 4 === 3 ? ' wbp-end' : '') })); };
  const title = h('span', { class: 'wb-title' });
  const restBtn = h('button', { class: 'btn small paper', onclick: () => { stop = true; sfx('pop'); if (wake) wake(); } }, 'Rest');
  const body = h('div', { class: 'wb-body' });
  const sheet = h('div', { class: 'wb-sheet' }, h('div', { class: 'wb-head' }, title, strip, restBtn), body);
  document.body.append(sheet); document.body.classList.add('wb-open'); drawStrip();
  if (!S.wb.marks.length) { await bridgeWide(1400); await pip("Let's build the bridge to Word Island!", { mood: 'happy' }); await wait(1600); }
  let items = null, partShown = -1;
  while (!stop && S.wb.marks.length < WB_N) {
    const n = S.wb.marks.length, p = Math.floor(n / 4), part = PARTS[p];
    if (partShown !== p) {
      partShown = p; items = itemsFor(part.key).slice(n % 4);
      title.textContent = `Part ${p + 1} of 7 · ${part.name}`;
      bridgeFocus(n, 1000); await banner(`Part ${p + 1}`, part.name); pip(part.pip, { hold: 2600 });
    }
    const item = items.shift() || itemsFor(part.key)[0];
    body.innerHTML = ''; setQ('wb', { key: part.key, item }, `${part.name}`);
    const ok = await Promise.race([TASK[part.key](body, item), new Promise(r => { wake = () => r(null); })]);
    wake = null; clearQ(); if (ok === null) break;
    S.wb.marks += ok ? 'g' : 'w'; save(); drawStrip();
    sfx('hammer'); await bridgeLay(n, ok);
    if ((n + 1) % 4 === 0) { bridgePost((n + 1) / 4); sfx('build'); bridgeFog((n + 1) / WB_N); pip(POST_LINES[p], { mood: 'happy', hold: 2000 }); await wait(1300); }
    else bridgeFocus(n + 1, 700);
  }
  sheet.remove(); document.body.classList.remove('wb-open'); open = false;
  if (S.wb.marks.length >= WB_N && !S.wb.done) { S.wb.done = 1; save(); await finish(hooks); return; }
  await overview(1200); labelsVisible(true); F.folkLabels(true); hooks.hud(true);
  if (stop) pip(`Good work! ${S.wb.marks.length} of ${WB_N} planks done.`, { hold: 3000 });
}
function banner(big, small) {
  const b = h('div', { class: 'wb-banner' }, h('small', {}, big), h('div', {}, small)); document.body.append(b); sfx('whoosh');
  b.animate([{ transform: 'translate(-50%,-30px) scale(.8)', opacity: 0 }, { transform: 'translate(-50%,0) scale(1)', opacity: 1 }], { duration: 400, easing: 'cubic-bezier(.3,1.6,.5,1)' });
  return wait(1500).then(() => { b.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300 }).onfinish = () => b.remove(); });
}
async function finish(hooks) {
  const gold = S.wb.marks.split('').filter(c => c === 'g').length;
  await bridgeWide(1600); bridgeGate(true); bridgeFog(1); sfx('fanfare'); F.cheerAll(8); confetti(innerWidth / 2, innerHeight / 3, 80);
  for (let i = 0; i < 6; i++) setTimeout(() => F.firework && F.firework(), i * 450);
  await talk('mayor', `You did it, ${S.name}! The bridge is fixed!`);
  await talk('pip', `Look! ${gold} gold planks! Gold means right the first time.`);
  await talk('mayor', 'Word Island is open. New lessons will come here soon!');
  talkEnd(); giveCoins(30); save();
  await overview(1400); labelsVisible(true); F.folkLabels(true); hooks.hud(true);
}
