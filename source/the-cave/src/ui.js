// Story panel, activity widgets, hints and keyword cards.
import { S, save, say, hush, sfx, h, $, wait, shuffle, shake, miss } from './core.js';
import { CARD_IMG } from './cards.gen.js';
import { THREE, pickAt, rayFrom, renderer, camera, onTick, toScreen, sparkles, textTexture, snapshot, tween } from './gfx.js';

// ---------------------------------------------------------------- story panel
let panel, textEl, nextBtn, taskEl, tobyEl, layer;
export function mountUI() {
  layer = h('div', { id: 'ui' });
  textEl = h('div', { class: 'story-text' });
  nextBtn = h('button', { class: 'next', 'aria-label': 'Next' }, '▶');
  const hear = h('button', { class: 'hear', 'aria-label': 'Read to me', onclick: e => { e.stopPropagation(); readCurrent(true); } }, '🔊');
  panel = h('div', { class: 'story hidden' }, hear, textEl, nextBtn);
  taskEl = h('div', { class: 'task hidden' });
  tobyEl = h('div', { class: 'toby-hint hidden' });
  layer.append(panel, taskEl, tobyEl); document.body.append(layer);
}
let current = '';
// text may contain {word} for a blank that gets filled later; returns when she taps ▶
function render(text) {
  textEl.innerHTML = ''; current = text;
  text.split(/(\{[^}]*\}|\s+)/).forEach(part => {
    if (!part) return;
    if (/^\{/.test(part)) { const w = part.slice(1, -1); textEl.append(h('span', { class: 'gap', 'data-word': w }, ' '.repeat(10))); }
    else if (/^\s+$/.test(part)) textEl.append(part);
    else textEl.append(h('span', { class: 'w' }, part));
  });
}
const spoken = () => current.replace(/\{([^}]*)\}/g, (m, w) => (textEl.querySelector(`.gap[data-word="${w}"].filled`) ? w : '...'));
function readCurrent(force) {
  const words = [...textEl.querySelectorAll('.w, .gap')]; const txt = spoken();
  // map char offsets to spans for highlighting as she listens
  let off = 0; const starts = words.map(sp => { const t = sp.classList.contains('gap') ? (sp.classList.contains('filled') ? sp.dataset.word : '...') : sp.textContent; const i = txt.indexOf(t, off); off = i + t.length; return i; });
  return say(txt, { force, onWord: ci => { let k = 0; starts.forEach((s, i) => { if (s <= ci) k = i; }); words.forEach((w, i) => w.classList.toggle('reading', i === k)); } })
    .then(() => words.forEach(w => w.classList.remove('reading')));
}
// Play mode for this run. Captain mode: she reads by herself, fewer hints, bonus challenges always on.
export const MODE = { captain: false, perfect: true };
let reading = Promise.resolve();
export async function tell(text, { wait: waitTap = true } = {}) {
  panel.classList.remove('hidden'); render(text); nextBtn.classList.add('hidden');
  reading = MODE.captain ? Promise.resolve() : readCurrent(false);
  if (!waitTap) return reading;
  await tapOn();
}
// Wait for her to tap ▶ on the line already showing (it is not read again).
export async function tapOn() {
  panel.classList.remove('hidden');
  await Promise.race([reading, wait(1200)]);
  nextBtn.classList.remove('hidden'); nextBtn.classList.add('bob');
  await new Promise(r => { const go = () => { panel.removeEventListener('click', go); r(); }; panel.addEventListener('click', go); });
  hush(); sfx('tap'); nextBtn.classList.remove('bob'); nextBtn.classList.add('hidden');
}
// Fill the gap, then read the finished sentence once and move on.
export async function filled(word, reread = true) { fillGap(word); if (!reread || MODE.captain || !S.settings.read) return wait(500); await wait(450); await readCurrent(false); }
export function fillGap(word) { const g = textEl.querySelector(`.gap[data-word="${word}"]`); if (!g) return; g.textContent = word; g.classList.add('filled'); g.animate([{ transform: 'scale(1.5)' }, { transform: 'scale(1)' }], { duration: 400, easing: 'cubic-bezier(.3,1.6,.6,1)' }); }
export const hideStory = () => panel.classList.add('hidden');
export const storyText = () => current;

// ---------------------------------------------------------------- task card + Toby's hints
function task(prompt, ...body) {
  taskEl.innerHTML = ''; taskEl.classList.remove('hidden'); document.body.classList.remove('cine');
  const p = h('div', { class: 'task-prompt' }, h('button', { class: 'hear small', onclick: () => say(prompt, { force: true }) }, '🔊'), h('span', {}, prompt));
  taskEl.append(p, ...body.filter(Boolean)); say(prompt, { queue: true });
  return taskEl;
}
export const hideTask = () => { taskEl.classList.add('hidden'); taskEl.innerHTML = ''; tobyHide(); document.body.classList.remove('aim'); };
const aimMode = () => document.body.classList.add('aim');
// Failsafe: if something in the scene is hard to reach, the same choices appear as buttons in the card after a few seconds.
function backup(list, delay = 6000) {
  const box = h('div', { class: 'backup hidden' }, h('div', { class: 'backup-note' }, 'Hard to reach? Tap here:'), h('div', { class: 'tiles' }, ...list.map(it => { const b = h('button', { class: 'tile small', onclick: () => it.go(b) }, it.label); it.btn = b; return b; })));
  const tm = setTimeout(() => box.classList.remove('hidden'), delay); box.stop = () => clearTimeout(tm); return box;
}
export function toby(text, mood = '') {
  tobyEl.innerHTML = ''; tobyEl.className = 'toby-hint ' + mood;
  tobyEl.append(h('div', { class: 'toby-face', html: TOBY_SVG }), h('div', { class: 'toby-say' }, text)); say(text);
}
export const tobyHide = () => tobyEl.classList.add('hidden');
const TOBY_SVG = `<svg viewBox="0 0 100 100"><ellipse cx="22" cy="44" rx="13" ry="24" fill="#8A5A2E" stroke="#2E2A4F" stroke-width="4" transform="rotate(18 22 44)"/><ellipse cx="78" cy="44" rx="13" ry="24" fill="#8A5A2E" stroke="#2E2A4F" stroke-width="4" transform="rotate(-18 78 44)"/><circle cx="50" cy="50" r="32" fill="#C98A4B" stroke="#2E2A4F" stroke-width="4"/><ellipse cx="50" cy="64" rx="17" ry="13" fill="#E7B985" stroke="#2E2A4F" stroke-width="3"/><circle cx="38" cy="45" r="5" fill="#2E2A4F"/><circle cx="62" cy="45" r="5" fill="#2E2A4F"/><ellipse cx="50" cy="58" rx="6" ry="4.5" fill="#2E2A4F"/></svg>`;

// A hint ladder: 1) Toby's clue  2) a stronger clue  3) Toby shows the answer. She is never stuck.
function ladder(hints, word) {
  let wrong = 0; if (MODE.captain) hints = hints.slice(0, 1);
  return {
    get first() { return wrong === 0; },
    async wrong(reveal) {
      wrong++; MODE.perfect = false; sfx('whine'); if (word) miss(word);
      if (wrong <= hints.length) toby(hints[wrong - 1]);
      else { toby('I’ll show you!', 'show'); await wait(600); reveal(); }
    },
  };
}
async function win(el) { sfx('good'); tobyHide(); if (el) el.classList.add('right'); await wait(700); }

// ---------------------------------------------------------------- activity: put the right word (or ending) in the gap
export function chooseWord({ prompt, sentence, tiles, answer, hints = [], base = '', note }) {
  return new Promise(res => {
    const shown = h('div', { class: 'task-sentence' });
    const draw = (w, cls = '') => { shown.innerHTML = ''; sentence.split(/(\{_\})/).forEach(p => shown.append(p === '{_}' ? h('span', { class: 'slot ' + cls }, w || ' '.repeat(8)) : p)); };
    draw('');
    const L = ladder(hints, answer);
    const row = h('div', { class: 'tiles' }, ...shuffle(tiles).map(t => h('button', { class: 'tile', onclick: async e => {
      sfx('tap'); const word = base + t.replace(/^-/, ''); draw(word);
      if (word === answer || t === answer) { row.querySelectorAll('.tile').forEach(b => b.disabled = true); e.target.classList.add('right'); draw(word, 'ok'); await win(); hideTask(); res({ first: L.first, word: answer }); }
      else { shake(e.target); e.target.classList.add('nope'); setTimeout(() => draw(''), 700); L.wrong(() => [...row.children].find(b => (base + b.textContent.replace(/^-/, '')) === answer || b.textContent === answer).click()); }
    } }, (base ? '' : '') + t)));
    window.__solve = () => [...row.children].find(b => (base + b.textContent.replace(/^-/, '')) === answer || b.textContent === answer).click();
    task(prompt, base ? h('div', { class: 'base-word' }, h('b', {}, base), ' + ?') : null, shown, row, note ? h('div', { class: 'task-note' }, note) : null);
  });
}

// ---------------------------------------------------------------- activity: tap something in the 3D scene
export function pick3D({ prompt, targets, answer, hints = [], word, onWrong, onHover, backupWords = false }) {
  return new Promise(res => { aimMode();
    const bk = backupWords ? backup(targets.map(t => ({ label: t.id, go: () => { if (t.id === answer) good(t.obj); else { sfx('bad'); onWrong && onWrong(t.id); L.wrong(() => good(a0())); } } }))) : null;
    task(prompt, bk);
    const L = ladder(hints, word);
    const objs = targets.map(t => t.obj);
    const click = async e => {
      const hit = pickAt(e.clientX, e.clientY, objs); if (!hit) return;
      const t = targets.find(t => t.obj === hit.obj);
      if (t.id === answer) { cleanup(); sfx('good'); sparkles(hit.point, 0xFFE58A); await win(); hideTask(); res({ first: L.first }); }
      else { sfx('bad'); onWrong && onWrong(t.id); L.wrong(() => good(a0())); }
    };
    const a0 = () => targets.find(t => t.id === answer).obj;
    const good = async obj => { cleanup(); sfx('good'); sparkles(obj.getWorldPosition(new THREE.Vector3()), 0xFFE58A); await win(); hideTask(); res({ first: L.first }); };
    window.__solve = () => good(a0());
    const cleanup = () => renderer.domElement.removeEventListener('pointerup', click);
    renderer.domElement.addEventListener('pointerup', click);
  });
}

// ---------------------------------------------------------------- activity: spell a word by tapping letters painted on objects
export function spellOn({ prompt, word, objs, decoys = '', hints = [], sentence, onLetter }) {
  return new Promise(res => { aimMode();
    const letters = shuffle([...word.toUpperCase(), ...decoys.toUpperCase()]); const slots = h('div', { class: 'slots' }, ...[...word].map(() => h('span', { class: 'slot-l' }, '')));
    const tags = []; let at = 0; const L = ladder(hints, word);
    objs.slice(0, letters.length).forEach((o, i) => {
      const tag = new THREE.Sprite(new THREE.SpriteMaterial({ map: textTexture(letters[i], { w: 128, h: 128, font: '96px Chewy, sans-serif', bg: null, fg: '#FFFDF4', glow: '#2E2A4F' }), depthTest: false }));
      tag.scale.setScalar(1.1); o.add(tag); tag.position.set(0, 0, 0.8); tag.userData.letter = letters[i]; tag.userData.owner = o; tags.push(tag);
    });
    const bk = backup(tags.map(tag => ({ label: tag.userData.letter, go: b => take(tag) })));
    task(prompt, sentence ? h('div', { class: 'task-sentence' }, sentence) : null, slots, bk);
    // she taps the letter itself (the sprite), so a rock in front can never steal the tap
    const take = async (tag, point) => {
      if (!tag || tag.userData.used || at >= word.length) return;
      if (tag.userData.letter === word[at].toUpperCase()) {
        sfx('pop'); tag.userData.used = true; tag.material.opacity = 0.25; const bb = bk.querySelectorAll('.tile')[tags.indexOf(tag)]; if (bb) bb.disabled = true; if (onLetter) { tag.visible = false; onLetter(tag.userData.owner, at); } slots.children[at].textContent = tag.userData.letter; slots.children[at].classList.add('in'); at++;
        if (at === word.length) { renderer.domElement.removeEventListener('pointerup', click); tags.forEach(t => t.parent && t.parent.remove(t)); sparkles(point || tag.getWorldPosition(new THREE.Vector3())); slots.classList.add('right'); await win(); hideTask(); res({ first: L.first }); }
      } else {
        sfx('bad'); shake(slots);
        L.wrong(() => take(tags.find(t => !t.userData.used && t.userData.letter === word[at].toUpperCase())));
      }
    };
    const click = e => { const live = tags.filter(t => !t.userData.used); const hit = pickAt(e.clientX, e.clientY, live) || pickAt(e.clientX, e.clientY, objs);
      if (!hit) return; take(live.includes(hit.obj) ? hit.obj : tags.find(t => t.userData.owner === hit.obj), hit.point); };
    window.__solve = async () => { while (at < word.length) { await take(tags.find(t => !t.userData.used && t.userData.letter === word[at].toUpperCase())); await wait(150); } };
    renderer.domElement.addEventListener('pointerup', click);
  });
}

// ---------------------------------------------------------------- activity: sweep the flashlight to find things / words
export function flashlight({ spot, surfaces, prompt, words = [], answer, find, hints = [], word }) {
  return new Promise(res => { aimMode();
    task(prompt);
    const L = ladder(hints, word || answer); const hitV = new THREE.Vector3(); let aim = new THREE.Vector3(0, 2, -6);
    const move = e => { const r = rayFrom(e.clientX, e.clientY); const hit = r.intersectObjects(surfaces, false)[0]; if (hit) aim.copy(hit.point); };
    const off = onTick(() => {
      spot.target.position.lerp(aim, 0.25);
      words.forEach(m => { const d = m.position.distanceTo(spot.target.position); m.material.opacity = Math.max(0, Math.min(1, (4.2 - d) / 2)); });
    });
    const down = async e => {
      move(e);
      if (find) { const d = find.obj.getWorldPosition(new THREE.Vector3()).distanceTo(aim); if (d < 2.2) { done(); sfx('good'); await win(); hideTask(); res({ first: L.first }); } return; }
      const lit = words.filter(m => m.material.opacity > 0.5); const hit = pickAt(e.clientX, e.clientY, lit); if (!hit) return;
      if (hit.obj.userData.word === answer) { done(); sparkles(hit.obj.position, 0x9FEAFF); sfx('good'); await win(); hideTask(); res({ first: L.first }); }
      else { sfx('bad'); L.wrong(() => { const m = words.find(m => m.userData.word === answer); aim.copy(m.position); setTimeout(() => { const p = toScreen(m.position); down({ clientX: p.x, clientY: p.y }); }, 800); }); }
    };
    window.__solve = () => { if (find) { aim.copy(find.obj.getWorldPosition(new THREE.Vector3())); done(); win().then(() => { hideTask(); res({ first: true }); }); } else { const m = words.find(m => m.userData.word === answer); aim.copy(m.position); setTimeout(() => { const p = toScreen(m.position); down({ clientX: p.x, clientY: p.y }); }, 600); } };
    const cv = renderer.domElement; cv.addEventListener('pointermove', move); cv.addEventListener('pointerdown', down);
    const done = () => { clearTimeout(L.wrongTimer); cv.removeEventListener('pointermove', move); cv.removeEventListener('pointerdown', down); };
    if (find) L.wrongTimer = setTimeout(() => toby(hints[0] || 'Keep looking!'), 12000);
  });
}

// ---------------------------------------------------------------- activity: put things in order (quiet→loud, first→last)
export function order({ prompt, items, labels = ['', ''], hints = [], word, compact }) {
  return new Promise(res => {
    const slots = h('div', { class: 'order-slots' + (compact ? ' compact' : '') }, ...items.map((_, i) => h('div', { class: 'oslot' }, h('i', {}, String(i + 1)))));
    const ends = h('div', { class: 'order-ends' }, h('span', {}, labels[0]), h('span', {}, labels[1]));
    let at = 0; const L = ladder(hints, word);
    const pool = h('div', { class: 'order-pool' + (compact ? ' compact' : '') }, ...shuffle(items).map(it => h('button', { class: 'tile', onclick: async e => {
      if (it === items[at]) { sfx('pop'); slots.children[at].append(h('span', {}, it)); slots.children[at].classList.add('in'); e.target.remove(); at++;
        if (at === items.length) { await win(slots); hideTask(); res({ first: L.first }); } }
      else { shake(e.target); sfx('bad'); L.wrong(() => [...pool.children].find(b => b.textContent === items[at]).click()); }
    } }, it)));
    window.__solve = () => { while (at < items.length) [...pool.children].find(b => b.textContent === items[at]).click(); };
    task(prompt, labels[0] ? ends : null, slots, pool);
  });
}

// ---------------------------------------------------------------- activity: pick the best answer (used sparingly)
export function think({ prompt, options, answer, hints = [] }) {
  return new Promise(res => {
    const L = ladder(hints);
    const row = h('div', { class: 'think' }, ...shuffle(options).map(o => h('button', { class: 'idea', onclick: async e => {
      if (o === answer) { e.target.classList.add('right'); row.querySelectorAll('button').forEach(b => b.disabled = true); await win(); hideTask(); res({ first: L.first }); }
      else { shake(e.target); e.target.classList.add('nope'); sfx('bad'); L.wrong(() => [...row.children].find(b => b.textContent === answer).click()); }
    } }, o)));
    window.__solve = () => [...row.children].find(b => b.textContent === answer).click();
    task(prompt, row);
  });
}

// ---------------------------------------------------------------- a bonus challenge she may skip
export function offerStretch(text) {
  return new Promise(res => {
    if (MODE.captain) { toby('Captain bonus! ' + text); return setTimeout(() => res(true), 1400); }
    const box = h('div', { class: 'stretch' }, h('div', { class: 'stretch-star' }, '★'), h('div', {}, h('b', {}, 'Bonus challenge'), h('div', {}, text)),
      h('div', { class: 'stretch-btns' }, h('button', { class: 'btn gold', onclick: () => { box.remove(); res(true); } }, 'Try it!'), h('button', { class: 'btn ghost', onclick: () => { box.remove(); res(false); } }, 'Skip')));
    document.body.append(box); say('Bonus challenge! ' + text);
  });
}

// ---------------------------------------------------------------- keyword cards
export const CARDS = {
  explore: { ep: 1, line: 'They had to explore it to find their puppy.', tip: 'explore = look around a new place', more: ['Leo and Mia wanted to {_} the dark cave.', 'Let\u2019s {_} the island and see what is there!'] },
  rumble: { ep: 1, line: 'The cave gave a loud rumble.', tip: 'rumble = a deep, shaking sound', more: ['The thunder gave a low {_}.', 'They heard a {_} under the floor.'] },
  cart: { ep: 1, line: 'Mia and Toby jumped into a rusty old cart.', tip: 'cart = a box on wheels', more: ['The {_} rolled down the metal tracks.', 'Mia held Toby tight in the {_}.'] },
  pit: { ep: 1, line: 'In front of them was a giant black pit with no bottom.', tip: 'pit = a very deep hole', more: ['Toby dug a deep {_} in the sand.', 'The cart fell into the dark {_}.'] },
  drop: { ep: 2, line: 'It was the longest drop of their lives.', tip: 'drop = a fall down', more: ['Don\u2019t {_} the blue stone!', 'One more {_} and the cart was on the track.'] },
  loop: { ep: 2, line: 'The track went up in a giant loop.', tip: 'loop = a big circle', more: ['The cart went round the {_} upside down!', 'Tie the rope in a {_}.'] },
  swift: { ep: 2, line: 'The swift water quickly helped them out.', tip: 'swift = very fast', more: ['Toby is a {_} little dog.', 'The {_} river pushed the cart along.'] },
  thick: { ep: 3, line: 'He rolled under a thick, strong rock shelf.', tip: 'thick = big and fat, not thin', more: ['Leo hid under a {_} rock.', 'The ice was too {_} to break.'] },
  tunnel: { ep: 3, line: 'It was a dark tunnel and the only way out.', tip: 'tunnel = a long hole to go through', more: ['The train went into a dark {_}.', 'Leo crawled through the muddy {_}.'] },
  cliff: { ep: 3, line: 'He was standing on a high cliff.', tip: 'cliff = a high, rocky edge', more: ['Don’t stand too close to the {_}!', 'They climbed up the rocky {_}.'] },
  fetch: { ep: 3, line: 'Mia paddled over to fetch him.', tip: 'fetch = go and get', more: ['Toby loves to {_} the ball.', 'Can you {_} my shoes, please?'] },
  island: { ep: 4, line: 'They were on a wild, lost island in the middle of the sea!', tip: 'island = land with water all around', more: ['Palm trees grow on the {_}.', 'They sailed away from the {_}.'] },
  flag: { ep: 4, line: 'Toby pulled out a giant, old pirate flag.', tip: 'flag = cloth that waves on a pole', more: ['The {_} waved in the wind.', 'The pirate ship had a black {_}.'] },
  clear: { ep: 4, line: 'The ocean water was very clear.', tip: 'clear = you can see through it', more: ['The window is so {_} I can see the sea.', 'The sky was {_} and blue.'] },
  sign: { ep: 4, line: 'They saw a sign stuck between the rocks.', tip: 'sign = a board with words on it (quiet g)', more: ['The {_} said KEEP OUT.', 'Read the {_} before you go in.'] },
  lie: { ep: 5, line: '“You lie!” Varn yelled.', tip: 'lie = say something that is not true', more: ['It is wrong to tell a {_}.', 'Mia told a {_} to Varn.'] },
  smash: { ep: 5, line: 'Varn lifts a big, heavy tail to smash the ice.', tip: 'smash = hit hard and break', more: ['The waves {_} against the rocks.', 'Don’t {_} the eggs!'] },
  wave: { ep: 5, line: 'The hard hit makes a huge, angry wave.', tip: 'wave = a big moving hill of water', more: ['A big {_} rolled onto the beach.', 'The boat rode over the {_}.'] },
  voice: { ep: 5, line: 'A cold, deep voice speaks inside their heads.', tip: 'voice = the sound of talking', more: ['Mia has a soft {_}.', 'Speak in a quiet {_}, please.'] },
  flush: { ep: 2, line: 'The water helped them flush out of the dark cave.', tip: 'flush = wash out fast with water', more: ['The rain will {_} the mud off the rocks.', 'The waves {_} the sand away.'] },
};
const cardSrc = w => CARD_IMG[w] || `cave-cards/ep${CARDS[w].ep}/${w}.webp`;
// Card levels: 1 bronze → 2 silver → 3 gold. A card is "due" for a quick polish a day (then three days) after it was last earned or polished.
const DAY = 864e5, LV = ['', 'Bronze', 'Silver', 'Gold'];
const lvl = c => (c && c.lvl) || 1;
export const isDue = c => c && lvl(c) < 3 && Date.now() >= (c.due || (c.t + DAY));
export const dueCards = () => Object.keys(CARDS).filter(w => isDue(S.cards[w]));
function cardEl(word, c, own) {
  const L = own ? lvl(own) : 0;
  return h('div', { class: 'kcard' + (own ? ' lv' + L : ' empty') + (own && isDue(own) ? ' due' : ''), style: { '--tilt': ((word.length * 37) % 7 - 3) + 'deg' } },
    own ? h('div', { class: 'kcard-badge' }, LV[L]) : null,
    own ? h('img', { class: 'kcard-img', src: cardSrc(word), alt: word }) : h('div', { class: 'kcard-blank' }, '?'),
    own ? h('div', { class: 'kcard-tip' }, isDue(own) ? '✨ Tap to polish!' : c.tip) : null);
}
export const ownedCount = (maxEp = 99) => Object.keys(CARDS).filter(w => CARDS[w].ep <= maxEp && S.cards[w]).length;
export const cardTotal = maxEp => Object.keys(CARDS).filter(w => CARDS[w].ep <= maxEp).length;
export function earnCard(word) {
  return new Promise(async res => {
    const isNew = !S.cards[word];
    if (isNew) { S.cards[word] = { t: Date.now(), lvl: 1, due: Date.now() + DAY }; save(); }
    sfx('card'); const c = CARDS[word];
    const ov = h('div', { class: 'card-reveal' }, h('div', { class: 'card-flip' }, cardEl(word, c, S.cards[word])), h('div', { class: 'card-msg' }, isNew ? 'New word card!' : 'You found it again!'),
      h('button', { class: 'btn gold', onclick: () => { ov.remove(); res(); } }, 'Keep it'));
    document.body.append(ov); await wait(300); say(`${word}. ${c.line}`, { force: S.settings.read });
  });
}
// A quick polish: spell the word from letter tiles, then use it in a new sentence. Both right first try → the card goes up a level.
function spellTiles(word, others) {
  return new Promise(res => {
    const letters = shuffle([...word, ...shuffle('aeioumnrst'.split('').filter(x => !word.includes(x))).slice(0, 2)]);
    const slots = h('div', { class: 'slots' }, ...[...word].map(() => h('span', { class: 'slot-l' }, '')));
    let at = 0; const L = ladder(['Say it slowly.', `It starts with ${word[0].toUpperCase()}.`], word);
    const row = h('div', { class: 'tiles' }, ...letters.map(ch => h('button', { class: 'tile', onclick: async e => {
      if (e.target.disabled) return;
      if (ch === word[at]) { sfx('pop'); e.target.disabled = true; e.target.classList.add('right'); slots.children[at].textContent = ch; slots.children[at].classList.add('in'); at++;
        if (at === word.length) { slots.classList.add('right'); await win(); hideTask(); res({ first: L.first }); } }
      else { sfx('bad'); shake(slots); L.wrong(() => [...row.children].find(b => !b.disabled && b.textContent === word[at]).click()); }
    } }, ch)));
    window.__solve = () => { while (at < word.length) [...row.children].find(b => !b.disabled && b.textContent === word[at]).click(); };
    task('Listen, then spell the word.', h('button', { class: 'btn ghost', onclick: () => say(word, { force: true }) }, '🔊 Hear it'), slots, row);
    setTimeout(() => say(word, { force: true }), 600);
  });
}
async function polish(word, done) {
  const c = CARDS[word], own = S.cards[word];
  const ov = h('div', { class: 'sumup polish' }, h('div', { class: 'sumup-title' }, 'Polish your card'), h('div', { class: 'sumup-sub' }, `${word} · ${LV[lvl(own)]} → ${LV[lvl(own) + 1]}`));
  document.body.append(ov);
  const a = await spellTiles(word);
  const others = Object.keys(CARDS).filter(w => w !== word && CARDS[w].ep === c.ep);
  const b = await chooseWord({ prompt: 'Which word fits?', sentence: c.more[Math.floor(Math.random() * c.more.length)], tiles: [word, ...shuffle(others).slice(0, 2)], answer: word, hints: [c.tip] });
  ov.remove();
  if (a.first && b.first) { own.lvl = lvl(own) + 1; own.due = Date.now() + 3 * DAY; save(); sfx('card'); toby(`Your ${word} card is now ${LV[own.lvl]}!`); }
  else { own.due = Date.now() + DAY; save(); toby('Good practice! Polish it again tomorrow.'); }
  setTimeout(tobyHide, 3500); done && done();
}
export function openBinder(onClose) {
  const due = dueCards();
  const ov = h('div', { class: 'binder', onclick: e => { if (e.target === ov) close(); } },
    h('div', { class: 'binder-page' }, h('button', { class: 'btn ghost close', onclick: () => close() }, '✕'),
      h('h2', {}, 'My Word Cards'), h('div', { class: 'binder-sub' }, due.length ? `✨ ${due.length} card${due.length > 1 ? 's' : ''} ready to polish. Polish cards to make them Silver, then Gold!` : 'Cards go Bronze → Silver → Gold when you polish them on later days.'),
      ...[...new Set(Object.values(CARDS).map(c => c.ep))].filter(ep => ep <= (window.__maxEp || 99)).flatMap(ep => [h('h3', { class: 'binder-ep' }, ep === 1 ? 'Episode 1 · The Cave' : ep === 3 ? 'Episode 3 · Leo’s Side' : ep === 4 ? 'Episode 4 · The Lost Island' : ep === 5 ? 'Episode 5 · Guard of the Stones' : `Episode ${ep} · The Cave ${ep}`),
        h('div', { class: 'binder-grid' }, ...Object.entries(CARDS).filter(([w, c]) => c.ep === ep).map(([w, c]) => { const el = cardEl(w, c, S.cards[w]);
        if (S.cards[w]) el.onclick = () => { if (isDue(S.cards[w])) { ov.remove(); polish(w, () => openBinder(onClose)); } else say(`${w}. ${c.line}`, { force: true }); }; return el; }))])));
  const close = () => { ov.remove(); onClose && onClose(); };
  document.body.append(ov);
}

// ---------------------------------------------------------------- activity: tap EVERY object that matches (e.g. words with the oo sound)
export function tapAll({ prompt, items, hints = [], word, onRight }) {   // items: [{ obj, label, ok }]
  return new Promise(res => { aimMode();
    const need = items.filter(i => i.ok).length; let got = 0; const L = ladder(hints, word);
    const count = h('div', { class: 'tap-count' }, `0 / ${need}`);
    const bk = backup(items.map(it => ({ label: it.label, go: b => { if (it.ok && !it.done) b.disabled = true; take(it); } })), 9000);
    task(prompt, count, bk);
    const objs = items.map(i => i.obj);
    const take = async it => {
      if (!it || it.done) return;
      if (it.ok) { it.done = true; got++; sfx('chime'); count.textContent = `${got} / ${need}`; onRight && onRight(it); sparkles(it.obj.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, 2, 0)), 0xC8FFD8);
        if (got === need) { cv.removeEventListener('pointerup', click); await win(count); hideTask(); res({ first: L.first }); } }
      else { sfx('bad'); shake(count); it.obj.userData.nope && it.obj.userData.nope(); L.wrong(() => take(items.find(i => i.ok && !i.done))); }
    };
    const click = e => { const hit = pickAt(e.clientX, e.clientY, objs); if (hit) take(items.find(i => i.obj === hit.obj)); };
    window.__solve = async () => { for (const it of items.filter(i => i.ok)) { await take(it); await wait(200); } };
    const cv = renderer.domElement; cv.addEventListener('pointerup', click);
  });
}

// ---------------------------------------------------------------- activity: read the clue, then lean the cart LEFT or RIGHT
export function steer({ prompt, clue, answer, hints = [], word }) {
  return new Promise(res => {
    const L = ladder(hints, word);
    const go = async (side, btn) => {
      if (side === answer) { row.querySelectorAll('button').forEach(b => b.disabled = true); btn.classList.add('right'); await win(); hideTask(); res({ first: L.first }); }
      else { sfx('bad'); shake(btn); btn.classList.add('nope'); setTimeout(() => btn.classList.remove('nope'), 600); L.wrong(() => go(answer, row.querySelector(`[data-side="${answer}"]`))); }
    };
    const row = h('div', { class: 'steer' },
      h('button', { class: 'tile steer-btn', 'data-side': 'left', onclick: e => go('left', e.currentTarget) }, '⬅ Left'),
      h('button', { class: 'tile steer-btn', 'data-side': 'right', onclick: e => go('right', e.currentTarget) }, 'Right ➡'));
    window.__solve = () => go(answer, row.querySelector(`[data-side="${answer}"]`));
    task(prompt, h('div', { class: 'task-sentence' }, clue), row);
  });
}

// ---------------------------------------------------------------- activity: look through a spyglass (drag to look around, find the thing, tap)
export function spyglass({ prompt, target, hints = [], word, fov = 16 }) {
  return new Promise(res => {
    const L = ladder(hints, word); const cam = camera; const fov0 = cam.fov;
    const dir = new THREE.Vector3(); cam.getWorldDirection(dir);
    let yaw = Math.atan2(dir.x, dir.z), pitch = Math.asin(dir.y), found = false, heldOn = 0;
    const ring = h('div', { class: 'spy-ring' }), hint = h('div', { class: 'spy-tap' }, 'Tap!');
    const ov = h('div', { class: 'spy' }, h('div', { class: 'spy-mask' }), ring, hint);
    document.body.append(ov); tween(500, e => { cam.fov = fov0 + (fov - fov0) * e; cam.updateProjectionMatrix(); });
    task(prompt);
    const tgt = new THREE.Vector3(); let drag = null, moved = 0;
    const off = onTick((t, dt) => {
      const d = new THREE.Vector3(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch));
      cam.lookAt(cam.position.clone().add(d));
      target.getWorldPosition(tgt); const to = tgt.clone().sub(cam.position).normalize(); const ang = Math.acos(Math.min(1, to.dot(d)));
      const on = ang < 0.055; ring.classList.toggle('on', on); hint.classList.toggle('on', on);
      if (on) { heldOn += dt; if (heldOn > 1.6) win2(); } else heldOn = 0;
    });
    const pd = e => { drag = { x: e.clientX, y: e.clientY }; moved = 0; };
    const pm = e => { if (!drag) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y; moved += Math.abs(dx) + Math.abs(dy); drag = { x: e.clientX, y: e.clientY };
      yaw -= dx * 0.0022 * (fov / 20); pitch = Math.max(-0.6, Math.min(0.5, pitch + dy * 0.0022 * (fov / 20))); };
    const pu = () => { const wasTap = moved < 10; drag = null; if (!wasTap) return; if (ring.classList.contains('on')) win2(); else { sfx('bad'); L.wrong(() => aimAt()); } };
    const aimAt = () => { target.getWorldPosition(tgt); const to = tgt.clone().sub(cam.position).normalize(); const y1 = Math.atan2(to.x, to.z), p1 = Math.asin(to.y), y0 = yaw, p0 = pitch;
      let dy = y1 - y0; while (dy > Math.PI) dy -= 2 * Math.PI; while (dy < -Math.PI) dy += 2 * Math.PI; tween(1200, e => { yaw = y0 + dy * e; pitch = p0 + (p1 - p0) * e; }); };
    ov.addEventListener('pointerdown', pd); ov.addEventListener('pointermove', pm); ov.addEventListener('pointerup', pu);
    const bk = h('button', { class: 'tile small', onclick: () => aimAt() }, 'Help me look'); const bkWrap = h('div', { class: 'backup hidden' }, bk); taskEl.append(bkWrap); setTimeout(() => bkWrap.classList.remove('hidden'), 14000);
    window.__solve = () => { aimAt(); setTimeout(win2, 1300); };
    async function win2() { if (found) return; found = true; off(); sfx('good'); ov.classList.add('done'); await win(); tween(500, e => { cam.fov = fov + (fov0 - fov) * e; cam.updateProjectionMatrix(); }); setTimeout(() => ov.remove(), 600); hideTask(); res({ first: L.first }); }
  });
}
