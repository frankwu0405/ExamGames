{
const api = window.__caveApi;
const { THREE, stop16, stop17, stop18, sumUp6, buildGrayShore, save, audioInit, sfx, say, h, wait, englishVoices, setVoice, currentVoice, hush, setCam, flyCam, pickAt, stopFollow, newWorld, buildMap, STOPS, setCamRef, EPISODES, MAX_EP, mountUI, hideStory, hideTask, MODE, ownedCount, cardTotal, CARDS, cardSrc, playMusic, setMusic, cloudsIn, cloudsCovered, cloudsOut, stop1, stop2, stop3, sumUp, stop4, stop5, stop6, sumUp2, stop7, stop8, stop9, sumUp3, stop10, stop11, stop12, sumUp4, stop13, stop14, stop15, sumUp5, debugVarn, buildBeach, makeCast, makeVarn, buildCliff, buildShelf, buildCrack } = api;
let S, camera, renderer;
const load = () => { api.load(); S = api.S(); };
const init = (...args) => { api.init(...args); camera = api.camera(); renderer = api.renderer(); };

const openBinder = openPolishCollection;
// Wordsmith's Table: mixed-episode retrieval in hands of at most four cards.
// Uses existing card records and levels; adds only small review-history fields.
const POLISH_DAY = 86400000;
const FRAME_NAMES = ['', 'Bronze', 'Silver', 'Gold', 'Diamond'];
let polishBackdropRender = null;
function suspendPolishBackdrop() {
  if (!polishBackdropRender) { polishBackdropRender = renderer.render; renderer.render = () => {}; }
}
function resumePolishBackdrop() {
  if (polishBackdropRender) { renderer.render = polishBackdropRender; polishBackdropRender = null; }
}
const polishLevel = own => Math.max(1, Math.min(4, own?.lvl || 1));
const polishOwned = () => Object.keys(CARDS).filter(w => S.cards[w] && CARDS[w].ep <= MAX_EP);
const polishReady = word => {
  const own = S.cards[word];
  return own && polishLevel(own) < 4;
};
const dueCards = () => polishOwned().filter(polishReady);
const mixCards = values => {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [result[i], result[j]] = [result[j], result[i]]; }
  return result;
};

// Two meaning-rich contexts per word, avoiding ambiguous short fill-in prompts.
const POLISH_LINES = {
  explore: ['Let’s {_} the forest and see what lives there.', 'The kids went to {_} the old castle.', 'Astronauts {_} space in a rocket.', 'I like to {_} new places on holiday.'],
  rumble: ['My tummy gave a hungry {_}.', 'The thunder gave a long, low {_}.', 'The big truck made a loud {_} on the road.', 'We felt a {_} when the train went by.'],
  cart: ['Grandpa pulled a {_} full of hay.', 'Put the apples in the shopping {_}.', 'The horse pulled a wooden {_}.', 'The {_} rolled down the track on its wheels.'],
  pit: ['The dog dug a deep {_} in the yard.', 'We sat around the fire {_} and roasted marshmallows.', 'Watch out! There is a big {_} in the ground.', 'The miners dug a {_} to find gold.'],
  drop: ['A {_} of rain ran down the window.', 'A {_} of water fell from the leaf.', 'Let go, and the ball will {_}.', 'Hold your ice cream tight. Don’t {_} it on the floor!'],
  loop: ['The roller coaster went around a big {_}.', 'Tie the ribbon into a {_}.', 'The plane flew in a {_} in the sky.', 'Make a {_} with your shoelace to tie your shoe.'],
  swift: ['The cheetah is a very {_} runner.', 'A {_} bird flew past the window.', 'The {_} horse won the race.', 'With one {_} kick, she scored a goal.'],
  thick: ['This {_} book has 500 pages.', 'Wear a {_} coat in the snow.', 'The fog was so {_} we could not see.', 'Spread a {_} layer of jam on the bread.'],
  tunnel: ['The train went through a long, dark {_}.', 'The rabbit dug a {_} under the fence.', 'Cars drive through a {_} under the river.', 'We crawled through the play {_} at the park.'],
  cliff: ['The goat stood on top of the high {_}.', 'Don’t go near the edge of the {_}!', 'The waterfall poured over the rocky {_}.', 'From the top of the {_}, we could see the sea.'],
  fetch: ['Throw the stick and the dog will {_} it.', 'Can you {_} a cup of water for Grandma?', 'Please {_} your boots from the closet.', 'Mom asked me to {_} the mail.'],
  island: ['Palm trees grew on the sunny {_}.', 'We took a boat to the little {_}.', 'The {_} had water all around it.', 'Pirates buried treasure on the {_}.'],
  flag: ['Every country has its own {_}.', 'The {_} waved in the wind.', 'We put a little {_} on top of our sandcastle.', 'The pirate ship had a black {_}.'],
  clear: ['The glass is {_}, so you can see through it.', 'The sky was {_} with no clouds.', 'The pond was so {_} we could see the fish.', 'Clean water looks {_}.'],
  sign: ['The {_} on the door said OPEN.', 'Stop at the red STOP {_}.', 'Read the {_} to find the way to the zoo.', 'The {_} said NO DOGS ALLOWED.'],
  lie: ['It is wrong to tell a {_}.', 'He said he ate his peas, but that was a {_}.', 'Always tell the truth, never a {_}.', '“I didn’t break it!” was a {_}.'],
  smash: ['Look out! The ball will {_} the window!', 'The giant can {_} the wall with one hit.', 'Big waves {_} against the rocks.', 'Hit the piñata hard to {_} it open!'],
  wave: ['A big {_} knocked down my sandcastle.', 'The surfer rode a giant {_}.', 'The boat went up and down on each {_}.', 'Give your friend a {_} to say hello.'],
  voice: ['Mia sang with a sweet {_}.', 'Please use your quiet {_} in the library.', 'I knew it was Dad from his {_} on the phone.', 'The teacher has a loud, strong {_}.'],
  fog: ['We could not see the boat in the thick white {_}.', 'The ship sounded its horn through the {_}.', 'In the morning, a gray {_} covered the whole beach.', 'Dad drove slowly because of the {_}.'],
  kind: ['Be {_} to your little brother.', 'The {_} nurse gave Toby a pat.', 'It was {_} of you to share your snack.', 'The old lady had a {_} smile.'],
  greedy: ['The {_} pirate wanted every gem for himself.', 'Don’t be {_}. Share your cake!', 'The {_} man filled his pockets with gold.', 'Toby was {_} and ate all the treats.'],
  treasure: ['The pirates buried the {_} on the island.', 'Mia found a box of {_} under the sand.', 'Gold and gems are a kind of {_}.', 'Leo drew a map to find the hidden {_}.'],
  flush: ['Don’t forget to {_} the toilet!', 'The rain will {_} the dirt off the road.', 'The hose can {_} the mud out of the pipe.', 'Wash your hands after you {_}.']
};

function choosePolishHand(preferred) {
  const all = polishOwned();
  // Older reviews and cards needing help come first, with jitter for variety.
  const score = w => {
    const own = S.cards[w];
    return (polishReady(w) ? 100 : 0) + (own.polishHelp ? 18 : 0)
      + Math.min(20, (Date.now() - (own.polishSeen || own.t || Date.now())) / POLISH_DAY)
      + Math.random() * 8;
  };
  const ranked = all.map(w => ({ w, score: score(w) })).sort((a, b) => b.score - a.score).map(x => x.w);
  const chosen = preferred && all.includes(preferred) ? [preferred] : ranked.slice(0, 1);
  // Deliberately bring in another episode, even when its cards aren't due.
  const other = ranked.find(w => !chosen.includes(w) && CARDS[w].ep !== CARDS[chosen[0]]?.ep);
  if (other) chosen.push(other);
  while (chosen.length < Math.min(4, all.length)) {
    const remaining = ranked.filter(w => !chosen.includes(w));
    const unusedEpisode = remaining.find(w => !chosen.some(c => CARDS[c].ep === CARDS[w].ep));
    chosen.push(unusedEpisode || remaining[0]);
  }
  return mixCards(chosen);
}

function framedCard(word, level, compact = false) {
  return h('span', { class: `wt-frame wt-tier-${level}${compact ? ' wt-compact' : ''}` },
    h('img', { src: cardSrc(word), alt: word, draggable: false }),
    h('span', { class: 'wt-ornament', 'aria-hidden': 'true' }));
}

function openPolishCollection(onClose) {
  if (document.querySelector('.wt-overlay')) return;
  suspendPolishBackdrop();
  let closed = false;
  const close = () => { if (closed) return; closed = true; hush(); ov.remove(); resumePolishBackdrop(); document.removeEventListener('keydown', escape); removeEventListener('resize', onResize); onClose?.(); };
  const escape = e => { if (e.key === 'Escape') close(); };
  // Every card of the voyage, in story order, on one treasure shelf.
  const allWords = Object.keys(CARDS).filter(w => CARDS[w].ep <= MAX_EP).sort((a, b) => CARDS[a].ep - CARDS[b].ep);
  const owned = polishOwned();
  const tiers = [0, 0, 0, 0, 0]; owned.forEach(w => tiers[polishLevel(S.cards[w])]++);
  const cap = w => w[0].toUpperCase() + w.slice(1);
  const note = h('p', { class: 'sh-note' });
  const shelves = h('div', { class: 'sh-shelves' });
  function slot(w, i) {
    const own = S.cards[w], tilt = [-2.2, 1.4, -.8, 2, -1.6, .9][i % 6];
    if (!own) return h('div', { class: 'sh-slot locked' },
      h('div', { class: 'sh-stand', style: `--tilt:${tilt}deg` }, h('div', { class: 'sh-mystery' }, h('span', {}, '?'))),
      h('div', { class: 'sh-plaque' }, h('b', {}, '???')));
    const level = polishLevel(own), need = SHINE_NEED[level] || 0, have = own.shine || 0;
    return h('div', { class: 'sh-slot tier-' + level },
      h('button', { class: 'sh-stand', style: `--tilt:${tilt}deg`, 'aria-label': `Power up ${w}`, onclick: () => launch(false, w) }, framedCard(w, level)),
      h('div', { class: 'sh-plaque' }, h('b', {}, cap(w)),
        level >= 4 ? h('span', { class: 'sh-gem' }, '💎')
          : h('span', { class: 'sh-dots', 'aria-label': `${have} of ${need} power to ${FRAME_NAMES[level + 1]}` }, ...Array.from({ length: need }, (_, k) => h('i', { class: k < have ? 'on' : '' })))));
  }
  let perRow = 0;
  function layout() {
    const wdt = Math.min(innerWidth, 1180), n = wdt >= 1000 ? 5 : wdt >= 600 ? 3 : 2;
    if (n === perRow) return; perRow = n;
    const rows = [];
    for (let i = 0; i < allWords.length; i += n) rows.push(allWords.slice(i, i + n));
    shelves.style.setProperty('--per', n);
    shelves.replaceChildren(...rows.map((row, r) => h('div', { class: 'sh-row' },
      h('div', { class: 'sh-items' }, ...row.map((w, k) => slot(w, r * n + k))),
      h('div', { class: 'sh-plank', 'aria-hidden': 'true' }, h('i', { class: 'l' }), h('i', { class: 'r' })))));
  }
  const onResize = () => layout();
  const ov = h('section', { class: 'wt-overlay wt-collection sh', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Treasure shelf' },
    h('div', { class: 'sh-wrap' },
      h('button', { class: 'wt-close sh-close', onclick: close, 'aria-label': 'Back to the map' }, '✕'),
      h('header', { class: 'sh-sign' },
        h('div', { class: 'sh-ropes', 'aria-hidden': 'true' }),
        h('div', { class: 'sh-board' },
          h('h1', {}, 'Treasure Shelf'),
          h('p', {}, `${owned.length} of ${allWords.length} cards found`),
          h('div', { class: 'sh-tally' }, ...[1, 2, 3, 4].map(t => h('span', { class: 'sh-coin t' + t, title: FRAME_NAMES[t] }, h('i'), tiers[t]))))),
      h('div', { class: 'sh-actions' },
        h('button', { class: 'wt-btn wt-primary', onclick: () => launch(false) }, '⚡ Power up cards'),
        h('button', { class: 'wt-btn pg-practice', onclick: () => launch(true), title: 'Practice round. Nothing is saved.' }, 'Practice')),
      h('p', { class: 'sh-hint' }, 'Pick the word that fits the sentence. The magic circle makes your card glow and grow a fancier frame!'),
      note,
      h('div', { class: 'sh-cabinet' }, shelves)));
  if (!owned.length) note.textContent = 'Find cards in the story to fill your shelf. Or tap “Practice”.';
  function launch(demo, preferred) {
    if (!demo && !owned.length) { note.textContent = 'Find cards in the story first. Or tap “Practice”.'; return; }
    closed = true; ov.remove(); document.removeEventListener('keydown', escape); removeEventListener('resize', onResize);
    openPolishGame(preferred ? [preferred] : [], demo, () => openPolishCollection(onClose));
  }
  layout(); addEventListener('resize', onResize);
  document.body.append(ov); document.addEventListener('keydown', escape);
  ov.querySelector('.wt-close').focus();
}

// Shine needed to move up from each frame: Bronze→Silver 2, Silver→Gold 3, Gold→Diamond 5.
// A card earns a shine every time it's right on the first try. No waiting: practise as much as you like.
const SHINE_NEED = [0, 2, 3, 5];
const ROUND_QUESTIONS = 8;
function openPolishGame(words, demo, onReturn) {
  suspendPolishBackdrop();
  // Practice uses a throwaway copy so nothing is saved.
  const DEMO = { explore: { lvl: 1, shine: 1 }, cart: { lvl: 2, shine: 2 }, swift: { lvl: 3, shine: 4 }, wave: { lvl: 4 }, rumble: { lvl: 1, shine: 0 }, pit: { lvl: 2, shine: 0 } };
  const pool = demo ? Object.keys(DEMO).filter(w => CARDS[w]) : polishOwned();
  const own = w => demo ? DEMO[w] : S.cards[w];
  const lvlOf = w => polishLevel(own(w));
  const readyNow = w => demo ? lvlOf(w) < 4 : polishReady(w);
  const startReady = Object.fromEntries(pool.map(w => [w, readyNow(w)]));
  const results = {};   // word -> { lvl0, lvl, gained, missed, shownLevel }
  const total = Math.min(ROUND_QUESTIONS, Math.max(1, pool.length * 2));
  const handSize = Math.min(4, pool.length);
  const rank = () => mixCards(pool).map(w => ({ w, s: (readyNow(w) ? 100 : 0) + (own(w).polishHelp ? 15 : 0) + Math.random() * 25 }))
    .sort((a, b) => b.s - a.s).map(x => x.w);
  let deck = rank();
  const preferred = words && words.length === 1 ? words[0] : null;
  let hand = [];
  if (preferred && pool.includes(preferred)) { hand.push(preferred); deck = deck.filter(w => w !== preferred); }
  while (hand.length < handSize && deck.length) hand.push(deck.shift());
  let target = null, lastTarget = null, qi = 0, streak = 0, bestStreak = 0, firstTry = 0, wrongs = 0, tried = new Set(), busy = false, closed = false, drag = null;
  const seenCount = {};
  // Each word has several sentences in different settings; never the same one twice in a row.
  const lineIdx = {};
  const linesOf = w => POLISH_LINES[w] || CARDS[w].more;
  const lineFor = w => linesOf(w)[lineIdx[w] ?? 0];
  function chooseLine(w) {
    const n = linesOf(w).length, last = own(w).lastLine;
    let k = Math.floor(Math.random() * n);
    if (n > 1 && k === last) k = (k + 1 + Math.floor(Math.random() * (n - 1))) % n;
    lineIdx[w] = k; own(w).lastLine = k;
  }
  const clueFor = w => CARDS[w].tip.replace(/^.*?=\s*/, '');
  function pickTarget() {
    const score = w => (readyNow(w) && !(results[w]?.gained) ? 60 : 0) + (results[w] ? 0 : 25) + (w === lastTarget ? -200 : 0) + Math.random() * 30;
    target = [...hand].sort((a, b) => score(b) - score(a))[0];
    chooseLine(target);
  }
  function draw(exclude) {
    if (!deck.length) deck = rank().filter(w => !hand.includes(w) && w !== exclude);
    if (!deck.length) deck = rank().filter(w => !hand.includes(w));
    return deck.shift() || null;
  }

  const progress = h('div', { class: 'pg-progress', role: 'img' });
  const counter = h('div', { class: 'pg-counter' });
  const combo = h('div', { class: 'pg-combo' });
  const sentence = h('p', { class: 'pg-sentence' });
  const clueBox = h('div', { class: 'pg-clue' });
  const msg = h('div', { class: 'pg-msg', role: 'status', 'aria-live': 'polite' });
  const tray = h('div', { class: 'pg-tray', 'aria-label': 'Magic circle' });
  const trayHint = h('div', { class: 'pg-tray-hint' }, h('span', { class: 'pg-tray-icon' }, '✦'), 'Drop the card in the magic circle');
  const handEl = h('div', { class: 'pg-hand' });
  const deckEl = h('div', { class: 'pg-deck', 'aria-hidden': 'true' });
  const readBtn = h('button', { class: 'pg-pill', onclick: () => !busy && say(lineFor(target).replace('{_}', 'blank'), { force: true }) }, '🔊 Read it');
  const clueBtn = h('button', { class: 'pg-pill', onclick: () => !busy && showClue() }, '🐾 Toby’s clue');
  const ov = h('section', { class: 'wt-overlay pg', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Power up your cards' },
    h('div', { class: 'pg-shell' },
      h('header', { class: 'pg-top' },
        h('button', { class: 'wt-close wt-exit', onclick: leave, 'aria-label': 'Back to my cards' }, '←'),
        h('h1', {}, demo ? 'Practice power-up' : 'Power up your cards'), counter, progress, combo),
      h('div', { class: 'pg-stage' },
        h('div', { class: 'pg-scroll' }, sentence, h('div', { class: 'pg-tools' }, readBtn, clueBtn), clueBox),
        h('div', { class: 'pg-tray-wrap' }, tray, msg)),
      h('div', { class: 'pg-table' }, handEl, deckEl)));

  function leave() { if (closed) return; closed = true; hush(); ov.remove(); document.removeEventListener('keydown', escape); resumePolishBackdrop(); onReturn?.(); }
  function escape(e) { if (e.key === 'Escape') leave(); }
  function say2(text) { msg.textContent = text; }
  function cardNode(w, level) {
    const f = framedCard(w, level ?? lvlOf(w)); f.classList.add('pg-card'); return f;
  }
  function shineDots(w, cls = 'pg-pips') {
    const l = lvlOf(w);
    if (l >= 4) return h('div', { class: cls + ' max' }, '💎');
    const need = SHINE_NEED[l], have = own(w).shine || 0;
    return h('div', { class: cls, 'aria-label': `${have} of ${need} power to ${FRAME_NAMES[l + 1]}` },
      ...Array.from({ length: need }, (_, i) => h('span', { class: 'pg-pip' + (i < have ? ' on' : '') })));
  }
  function renderProgress() {
    progress.replaceChildren(...Array.from({ length: total }, (_, i) => h('span', { class: 'pg-seg' + (i < qi ? (results.__q?.[i] ? ' on' : ' dim') : i === qi ? ' now' : '') })));
    counter.textContent = `${Math.min(qi + 1, total)} / ${total}`;
    combo.textContent = streak >= 2 ? `⚡ ${streak} in a row!` : '';
    combo.classList.toggle('show', streak >= 2);
  }
  function renderSentence() {
    const [a, b] = lineFor(target).split('{_}');
    sentence.replaceChildren(a, h('span', { class: 'pg-gap' }, ' '), b);
    clueBox.textContent = ''; clueBox.classList.remove('show');
  }
  function renderTray(node) { tray.replaceChildren(node || trayHint); tray.classList.toggle('full', !!node); }
  function renderDeck() {
    const n = Math.min(3, Math.max(0, total - qi - 1));
    deckEl.replaceChildren(...Array.from({ length: n }, (_, i) => h('span', { class: 'pg-back', style: { transform: `translate(${i * 3}px,${-i * 3}px)` } })));
  }
  function renderHand(entering) {
    const n = hand.length;
    handEl.style.setProperty('--n', n);
    handEl.replaceChildren(...hand.map((w, i) => {
      const off = i - (n - 1) / 2;
      const btn = h('button', { class: 'pg-hcard' + (tried.has(w) ? ' tried' : ''), 'aria-label': `Play ${w}`, 'data-w': w, disabled: tried.has(w) || busy }, cardNode(w));
      bindDrag(btn, w);
      const slot = h('div', { class: 'pg-slot' + (w === entering ? ' entering' : ''), style: `--rot:${off * 7}deg;--lift:${Math.abs(off) * Math.abs(off) * 9}px;z-index:${10 + i}` }, btn, shineDots(w));
      return slot;
    }));
  }
  function showClue() { clueBox.textContent = '🐾 ' + clueFor(target); clueBox.classList.add('show'); }

  // ---------- moving cards ----------
  function ghostOf(w, rect) {
    const g = h('div', { class: 'pg-ghost' }, cardNode(w));
    Object.assign(g.style, { left: rect.left + 'px', top: rect.top + 'px', width: rect.width + 'px' });
    ov.append(g); return g;
  }
  function fly(g, to, ms = 340, extra = '') {
    const from = g.getBoundingClientRect();
    return g.animate([{ transform: 'translate(0,0) scale(1)' },
      { transform: `translate(${to.left - from.left}px,${to.top - from.top}px) scale(${to.width / from.width}) ${extra}` }],
    { duration: ms, easing: 'cubic-bezier(.2,.8,.25,1)', fill: 'forwards' }).finished;
  }
  const cardRect = btn => btn.querySelector('.wt-frame').getBoundingClientRect();
  const overTray = (x, y) => { const r = tray.getBoundingClientRect(), m = 30; return x > r.left - m && x < r.right + m && y > r.top - m && y < r.bottom + m; };
  function bindDrag(btn, w) {
    btn.addEventListener('pointerdown', e => {
      if (busy || closed || tried.has(w) || (e.button != null && e.button > 0)) return;
      e.preventDefault();
      const r = cardRect(btn);
      drag = { w, btn, id: e.pointerId, x0: e.clientX, y0: e.clientY, ox: e.clientX - r.left, oy: e.clientY - r.top, r, g: null };
      btn.setPointerCapture?.(e.pointerId); sfx('tap');
    });
    btn.addEventListener('pointermove', e => {
      if (!drag || drag.id !== e.pointerId) return;
      if (!drag.g) {
        if (Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) < 10) return;
        drag.g = ghostOf(w, drag.r); drag.g.classList.add('lifted'); btn.classList.add('away'); tray.classList.add('ready');
      }
      drag.g.style.left = (e.clientX - drag.ox) + 'px'; drag.g.style.top = (e.clientY - drag.oy) + 'px';
      tray.classList.toggle('over', overTray(e.clientX, e.clientY));
    });
    const end = e => {
      if (!drag || drag.id !== e.pointerId) return;
      const d = drag; drag = null; tray.classList.remove('ready', 'over');
      if (!d.g) { if (e.type === 'pointerup') playCard(w, ghostOf(w, d.r)); return; }
      if (e.type === 'pointerup' && overTray(e.clientX, e.clientY)) playCard(w, d.g);
      else fly(d.g, d.r, 260).then(() => { d.g.remove(); d.btn.classList.remove('away'); });
    };
    btn.addEventListener('pointerup', end); btn.addEventListener('pointercancel', end);
    btn.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && !busy) { e.preventDefault(); playCard(w, ghostOf(w, cardRect(btn))); } });
  }
  function sparkle(n = 12) {
    const r = tray.getBoundingClientRect();
    for (let i = 0; i < n; i++) {
      const s = h('span', { class: 'pg-spark' }, '✦');
      const a = Math.random() * Math.PI * 2, dist = r.width * (0.45 + Math.random() * 0.5);
      Object.assign(s.style, { left: r.left + r.width / 2 + 'px', top: r.top + r.height / 2 + 'px', fontSize: (12 + Math.random() * 16) + 'px' });
      ov.append(s);
      s.animate([{ transform: 'translate(-50%,-50%) scale(.3)', opacity: 1 }, { transform: `translate(calc(-50% + ${Math.cos(a) * dist}px),calc(-50% + ${Math.sin(a) * dist}px)) scale(1)`, opacity: 0 }],
        { duration: 700 + Math.random() * 400, easing: 'cubic-bezier(.1,.7,.3,1)' }).finished.then(() => s.remove());
    }
  }

  // ---------- magic: rune circle, light orbs, scan-glow frame transformation ----------
  const TFX = { 1: { a: '#ffb070', b: '#ff7a2a', c: '#ffe0c0' }, 2: { a: '#f2fbff', b: '#9ccaff', c: '#ffffff' }, 3: { a: '#fff3b0', b: '#ffb21e', c: '#ffe27a' }, 4: { a: '#ffffff', b: '#b48cff', c: '#8fe9ff' } };
  function setFx(l) { const p = TFX[l] || TFX[1]; ov.style.setProperty('--fa', p.a); ov.style.setProperty('--fb', p.b); ov.style.setProperty('--fc', p.c); }
  const R = n => Math.random() * n;
  function ringAt(x, y, size, dur, delay, color) {
    const s = h('span', { class: 'fx-ring' }); Object.assign(s.style, { left: x + 'px', top: y + 'px', borderColor: color, color }); ov.append(s);
    s.animate([{ transform: 'translate(-50%,-50%) scale(.1)', opacity: 1 }, { transform: `translate(-50%,-50%) scale(${size / 20})`, opacity: 0 }], { duration: dur, delay, easing: 'ease-out', fill: 'both' }).finished.then(() => s.remove());
  }
  function raysAt(x, y, size, cls, dur, spin) {
    const s = h('span', { class: 'fx-rays ' + cls }); Object.assign(s.style, { left: x - size / 2 + 'px', top: y - size / 2 + 'px', width: size + 'px', height: size + 'px' }); ov.append(s);
    s.animate([{ transform: 'rotate(0) scale(.3)', opacity: 0 }, { opacity: 1, offset: .25 }, { transform: `rotate(${spin}deg) scale(1)`, opacity: 0 }], { duration: dur, easing: 'ease-out' }).finished.then(() => s.remove());
  }
  // each frame has its own material: copper embers, silver glints, gold dust and rays, diamond shards and light
  function tierBurst(l) {
    const r = tray.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2, W = r.width, H = r.height;
    if (l === 1) {
      for (let i = 0; i < 36; i++) {
        const sz = 4 + R(6), s = h('span', { class: 'fx-dot' }), col = ['#ffb070', '#ff7a2a', '#ffd9a0'][i % 3];
        Object.assign(s.style, { left: cx + (R(1) - .5) * W * 1.3 + 'px', top: cy + H * (.05 + R(.45)) + 'px', width: sz + 'px', height: sz + 'px', background: col, boxShadow: `0 0 8px 2px ${col}` }); ov.append(s);
        s.animate([{ transform: 'translate(0,0) scale(1)', opacity: 1 }, { transform: `translate(${(R(1) - .5) * 80}px,${-H * (.4 + R(.8))}px) scale(.2)`, opacity: 0 }], { duration: 1100 + R(900), delay: R(300), easing: 'cubic-bezier(.2,.6,.4,1)', fill: 'both' }).finished.then(() => s.remove());
      }
      ringAt(cx, cy, W * 1.7, 1000, 0, '#ff9a4a');
    } else if (l === 2) {
      for (let i = 0; i < 24; i++) {
        const s = h('span', { class: 'fx-glint' }); s.style.setProperty('--c', i % 2 ? '#cfe8ff' : '#ffffff');
        Object.assign(s.style, { left: cx + (R(1) - .5) * W * 1.5 + 'px', top: cy + (R(1) - .5) * H * 1.3 + 'px' }); ov.append(s);
        const big = .5 + R(1.1);
        s.animate([{ transform: 'translate(-50%,-50%) scale(0) rotate(0)', opacity: 0 }, { transform: `translate(-50%,-50%) scale(${big}) rotate(45deg)`, opacity: 1, offset: .4 }, { transform: 'translate(-50%,-50%) scale(0) rotate(90deg)', opacity: 0 }], { duration: 700 + R(300), delay: R(900), fill: 'both' }).finished.then(() => s.remove());
      }
      ringAt(cx, cy, W * 1.5, 900, 0, '#dff1ff'); ringAt(cx, cy, W * 1.1, 800, 220, '#9ccaff');
    } else if (l === 3) {
      raysAt(cx, cy, W * 3.4, 'gold', 1900, 50);
      for (let i = 0; i < 50; i++) {
        const sz = 3 + R(6), s = h('span', { class: 'fx-dot' }), a = R(Math.PI * 2), d = W * (.5 + R(.9));
        Object.assign(s.style, { left: cx + 'px', top: cy + 'px', width: sz + 'px', height: sz + 'px', background: ['#fff3b0', '#ffd34d', '#ffb21e'][i % 3], boxShadow: '0 0 8px 2px #ffd34d' }); ov.append(s);
        s.animate([{ transform: 'translate(0,0)', opacity: 1 }, { transform: `translate(${Math.cos(a) * d}px,${Math.sin(a) * d * .8 - 30}px)`, opacity: 1, offset: .45 }, { transform: `translate(${Math.cos(a) * d * 1.1}px,${Math.sin(a) * d * .8 + H * .5}px)`, opacity: 0 }], { duration: 1500 + R(700), easing: 'cubic-bezier(.2,.7,.4,1)', fill: 'both' }).finished.then(() => s.remove());
      }
      ringAt(cx, cy, W * 1.8, 1000, 0, '#ffd34d'); ringAt(cx, cy, W * 1.2, 900, 250, '#fff3b0');
    } else {
      const fl = h('div', { class: 'fx-flash' }); ov.append(fl);
      fl.animate([{ opacity: .95 }, { opacity: 0 }], { duration: 1000, easing: 'ease-out' }).finished.then(() => fl.remove());
      tray.animate([{ translate: '0 0' }, { translate: '-8px 4px' }, { translate: '9px -5px' }, { translate: '-6px -3px' }, { translate: '5px 4px' }, { translate: '0 0' }], { duration: 520 });
      raysAt(cx, cy, W * 6, 'dia', 2300, 70);
      [['#ffffff', 0], ['#c9a6ff', 150], ['#8fe9ff', 300], ['#ff9ad5', 450]].forEach(([c, d], k) => ringAt(cx, cy, W * (2.8 - k * .4), 1100, d, c));
      for (let i = 0; i < 46; i++) {
        const a = R(Math.PI * 2), d = W * (.7 + R(1.6)), w = 8 + R(16), s = h('span', { class: 'fx-shard' });
        Object.assign(s.style, { left: cx + 'px', top: cy + 'px', width: w + 'px', height: w * 1.6 + 'px', background: `linear-gradient(135deg,#fff,hsl(${180 + R(140)} 95% 78%))` }); ov.append(s);
        s.animate([{ transform: 'translate(-50%,-50%) rotate(0) scale(.2)', opacity: 1 }, { transform: `translate(calc(-50% + ${Math.cos(a) * d}px),calc(-50% + ${Math.sin(a) * d}px)) rotate(${R(540) - 270}deg) scale(1)`, opacity: 1, offset: .55 }, { transform: `translate(calc(-50% + ${Math.cos(a) * d * 1.15}px),calc(-50% + ${Math.sin(a) * d * 1.15 + 60}px)) rotate(${R(720) - 360}deg) scale(.6)`, opacity: 0 }], { duration: 1500 + R(600), easing: 'cubic-bezier(.1,.8,.3,1)', fill: 'both' }).finished.then(() => s.remove());
      }
      for (let i = 0; i < 70; i++) {
        const s = h('span', { class: 'fx-glint' }); s.style.setProperty('--c', ['#fff', '#d8c4ff', '#aef1ff'][i % 3]);
        Object.assign(s.style, { left: R(innerWidth) + 'px', top: -20 + 'px' }); ov.append(s);
        s.animate([{ transform: 'translate(-50%,0) scale(0)', opacity: 0 }, { transform: `translate(-50%,${innerHeight * (.3 + R(.5))}px) scale(${.5 + R(1)}) rotate(90deg)`, opacity: 1, offset: .5 }, { transform: `translate(-50%,${innerHeight * (.8 + R(.3))}px) scale(0) rotate(180deg)`, opacity: 0 }], { duration: 1600 + R(900), delay: 150 + R(1300), fill: 'both' }).finished.then(() => s.remove());
      }
    }
  }
  // one pass of light across the finished card and its frame
  function shimmer(nc) {
    const a = h('span', { class: 'pg-shim pg-shim-card' }), b = h('span', { class: 'wt-ornament pg-shim pg-shim-orn' });
    nc.append(a, b); setTimeout(() => { a.remove(); b.remove(); }, 1300);
  }
  function runeCircle(on, lvl) {
    let rc = tray.querySelector('.pg-runes');
    if (on && !rc) {
      rc = h('div', { class: 'pg-runes', 'aria-hidden': 'true', html:
        '<svg viewBox="-100 -100 200 200"><g class="r1"><circle r="92"/><circle r="84"/>' +
        Array.from({ length: 24 }, (_, i) => `<path transform="rotate(${i * 15})" d="M0 -84v-8"/>`).join('') +
        Array.from({ length: 8 }, (_, i) => `<text transform="rotate(${i * 45}) translate(0 -73)">${'ᚠᚢᚦᚨᚱᚲᚷᚹ'[i]}</text>`).join('') +
        '</g><g class="r2"><circle r="62"/><path d="M0 -62L54 31L-54 31Z"/><path d="M0 62L54 -31L-54 -31Z"/></g></svg>' });
      tray.prepend(rc);
    }
    if (rc && lvl) { rc.classList.remove('fx-1', 'fx-2', 'fx-3', 'fx-4'); rc.classList.add('fx-' + lvl); }
    rc?.classList.toggle('on', on);
    rc?.classList.toggle('fast', on === 'fast');
  }
  function orb(fromEl, toEl, ms = 650) {
    const a = fromEl.getBoundingClientRect(), b = toEl.getBoundingClientRect();
    const o = h('span', { class: 'pg-orb' }); ov.append(o);
    const x0 = a.left + a.width / 2, y0 = a.top + a.height * .45, x1 = b.left + b.width / 2, y1 = b.top + b.height / 2;
    Object.assign(o.style, { left: x0 + 'px', top: y0 + 'px' });
    const mx = (x0 + x1) / 2 + (Math.random() - .5) * 120, my = Math.min(y0, y1) - 60;
    const kf = [];
    for (let i = 0; i <= 12; i++) { const t = i / 12, u = 1 - t;
      kf.push({ transform: `translate(${u * u * x0 + 2 * u * t * mx + t * t * x1 - x0}px,${u * u * y0 + 2 * u * t * my + t * t * y1 - y0}px) scale(${1 - t * .4})` }); }
    // trailing sparkles
    const trail = setInterval(() => { const r = o.getBoundingClientRect(); const s = h('span', { class: 'pg-trail' }); Object.assign(s.style, { left: r.left + r.width / 2 + 'px', top: r.top + r.height / 2 + 'px' }); ov.append(s);
      s.animate([{ opacity: .9, transform: 'translate(-50%,-50%) scale(1)' }, { opacity: 0, transform: 'translate(-50%,-50%) scale(.2)' }], { duration: 450 }).finished.then(() => s.remove()); }, 35);
    return o.animate(kf, { duration: ms, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' }).finished.then(() => { clearInterval(trail); o.remove(); });
  }
  function burstAt(el, n = 10, cls = 'pg-spark') {
    const r = el.getBoundingClientRect();
    for (let i = 0; i < n; i++) {
      const s = h('span', { class: cls }, '✦'), a = Math.random() * Math.PI * 2, d = 20 + Math.random() * 40;
      Object.assign(s.style, { left: r.left + r.width / 2 + 'px', top: r.top + r.height / 2 + 'px', fontSize: (9 + Math.random() * 10) + 'px' }); ov.append(s);
      s.animate([{ transform: 'translate(-50%,-50%) scale(.3)', opacity: 1 }, { transform: `translate(calc(-50% + ${Math.cos(a) * d}px),calc(-50% + ${Math.sin(a) * d}px)) scale(1)`, opacity: 0 }], { duration: 600 }).finished.then(() => s.remove());
    }
  }
  // the new frame is "printed" onto the card by a glowing line sweeping top to bottom
  function scanTransform(w, oldCard, lvl) {
    return new Promise(res => {
      const nc = cardNode(w, lvl); nc.classList.add('pg-newcard'); tray.append(nc);
      const line = h('div', { class: 'pg-scan' }); tray.append(line);
      const glyphs = h('div', { class: 'pg-scan-glyphs' }); tray.append(glyphs);
      const t0 = performance.now(), dur = 1700, top = -32, bot = 132;
      const step = now => {
        const t = Math.min(1, (now - t0) / dur), e = t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2, y = top + (bot - top) * e;
        nc.style.clipPath = `inset(-60% -60% ${100 - y}% -60%)`;
        oldCard.style.clipPath = `inset(${y}% -60% -60% -60%)`;
        line.style.top = y + '%'; glyphs.style.top = y + '%';
        const rc = tray.querySelector('.pg-runes'); if (rc) { rc.style.transition = 'none'; rc.style.transform = `translate(-50%,-50%) scale(${1 - .3 * e})`; rc.style.filter = `brightness(${1 + e * 1.2})`; }
        if (Math.random() < .5) { const r = tray.getBoundingClientRect(); const s = h('span', { class: 'pg-trail' });
          Object.assign(s.style, { left: r.left + r.width * (-.25 + Math.random() * 1.5) + 'px', top: r.top + r.height * y / 100 + 'px' }); ov.append(s);
          s.animate([{ opacity: 1, transform: 'translate(-50%,-50%)' }, { opacity: 0, transform: 'translate(-50%,-180%) scale(.3)' }], { duration: 700 }).finished.then(() => s.remove()); }
        if (t < 1) requestAnimationFrame(step);
        else { oldCard.remove(); line.remove(); glyphs.remove(); nc.style.clipPath = ''; res(nc); }
      };
      requestAnimationFrame(step);
    });
  }

  async function playCard(w, g) {
    if (busy || closed) { g.remove(); return; }
    busy = true; handEl.querySelectorAll('.pg-hcard').forEach(b => b.disabled = true);
    const btn = handEl.querySelector(`[data-w="${w}"]`);
    btn?.classList.add('away');
    await fly(g, tray.getBoundingClientRect(), 300);
    if (closed) return;
    if (w !== target) {
      wrongs++; tried.add(w); streak = 0; renderProgress();
      sfx('bad'); say2('Not that one!');
      await g.animate([{ translate: '0 0' }, { translate: '-14px 0' }, { translate: '12px 0' }, { translate: '-8px 0' }, { translate: '0 0' }], { duration: 380 }).finished;
      await fly(g, cardRect(btn), 300);
      g.remove(); busy = false;
      if (wrongs >= 2) showClue();
      say2(wrongs >= 2 ? 'Read Toby’s clue.' : 'Try another card.');
      renderHand(); return;
    }
    // Right card: it is enchanted in the tray, then sent off and a new one is dealt.
    const clean = wrongs === 0;
    (results.__q ||= [])[qi] = clean;
    const r = results[w] ||= { lvl0: lvlOf(w), gained: 0, missed: 0 };
    if (clean) { firstTry++; streak++; bestStreak = Math.max(bestStreak, streak); } else { streak = 0; r.missed++; }
    g.remove();
    let tc = cardNode(w); renderTray(tc);
    const gap = sentence.querySelector('.pg-gap'); gap.textContent = w; gap.classList.add('filled');
    if (S.settings.read) say(lineFor(w).replace('{_}', w), { force: true });
    seenCount[w] = (seenCount[w] || 0) + 1;
    const o = own(w), eligible = lvlOf(w) < 4, lvlBefore = lvlOf(w), shineBefore = o.shine || 0;
    let upgraded = false;
    if (clean && eligible) {
      o.shine = shineBefore + 1; r.gained = (r.gained || 0) + 1;
      if (o.shine >= SHINE_NEED[lvlBefore]) { o.lvl = lvlBefore + 1; o.shine = 0; upgraded = true; }
    }
    if (!clean) o.polishHelp = true; else if (eligible) o.polishHelp = false;
    o.polishSeen = Date.now();
    if (!demo) save();
    r.lvl = lvlOf(w);
    qi++; renderProgress(); renderDeck();
    sfx('card'); setFx(lvlBefore); runeCircle(true, lvlBefore); tc.classList.add('charge');
    // dots show the shine before this answer; a light orb flies in to fill the next one
    let dots = null;
    if (lvlBefore < 4) {
      dots = h('div', { class: 'pg-tray-dots' }, ...Array.from({ length: SHINE_NEED[lvlBefore] }, (_, i) => h('span', { class: 'pg-pip' + (i < shineBefore ? ' on' : '') })));
      tray.append(dots);
    }
    await wait(450);
    if (clean && eligible) {
      say2(streak >= 3 ? `⚡ ${streak} in a row! +1 power` : '+1 power ⚡');
      const pip = dots.children[shineBefore];
      await orb(tc, pip); if (closed) return;
      pip.classList.add('on', 'pop'); burstAt(pip, 9); sfx('good');
      await wait(450);
    } else {
      say2(!clean ? 'Got it! No power this time.' : 'Already Diamond! ✨');
      sparkle(6); await wait(700);
    }
    if (upgraded) {
      if (closed) return;
      say2('✨ The magic is changing it…');
      dots.classList.add('full'); setFx(r.lvl); runeCircle('fast', r.lvl); tray.classList.add('lift'); sfx('glow');
      await wait(650); dots.remove();
      tc = await scanTransform(w, tc, r.lvl); if (closed) return;
      tray.querySelector('.pg-runes')?.classList.add('release');
      tray.classList.add('flash'); sfx('great'); tierBurst(r.lvl); tc.classList.add('upgraded');
      const nm = FRAME_NAMES[r.lvl];
      msg.replaceChildren(h('span', { class: 'pg-up2' }, '⬆ ' + nm + '!'), `${w[0].toUpperCase() + w.slice(1)} is ${nm} now!`);
      if (r.lvl < 4) tray.append(shineDots(w, 'pg-tray-dots'));
      setTimeout(() => tray.classList.remove('flash'), 700);
      await wait(r.lvl === 4 ? 1500 : 1000);
      if (closed) return;
      shimmer(tc); sfx('glow');
      await wait(1300);
    } else await wait(500);
    runeCircle(false); tray.classList.remove('lift'); tc.classList.remove('charge');
    if (closed) return;
    // send it off: the polished card flies away, a new one slides in from the deck
    const g2 = ghostOf(w, tc.getBoundingClientRect()); renderTray(null);
    sfx('whoosh');
    fly(g2, { left: innerWidth + 40, top: -tc.offsetHeight, width: g2.offsetWidth * .7 }, 520, 'rotate(25deg)').then(() => g2.remove());
    wrongs = 0; tried = new Set();
    if (qi >= total) { await wait(350); busy = false; return endScreen(); }
    const idx = hand.indexOf(w), next = draw(w);
    if (next) hand[idx] = next; else hand.splice(idx, 1);
    lastTarget = w; pickTarget();
    busy = false; renderSentence(); renderHand(next); say2('Which word fits? Drag it into the magic circle.');
  }

  function endScreen() {
    renderProgress(); counter.textContent = `${total} / ${total}`; combo.textContent = ''; combo.classList.remove('show');
    const played = Object.keys(results).filter(k => k !== '__q');
    const label = w => {
      const r = results[w], l = r.lvl;
      if (l > r.lvl0) return [h('b', { class: 'up' }, '⬆ ' + FRAME_NAMES[l] + '!'), shineDots(w)];
      if (r.gained) return [h('b', {}, `+${r.gained} power`), shineDots(w)];
      if (l >= 4) return [h('b', {}, '💎 Max power')];
      if (r.missed && !r.gained) return [h('b', {}, 'No power')];
      return [h('b', {}, 'Powered up'), shineDots(w)];
    };
    const more = !demo && dueCards().length > 0;
    const panel = h('div', { class: 'pg-end' },
      h('h2', {}, demo ? 'Practice done!' : 'Round done!'),
      h('p', {}, `Right on the first try: ${firstTry} of ${total}` + (bestStreak >= 3 ? ` · best streak ${bestStreak}` : '') + (demo ? ' · practice, nothing saved' : '')),
      h('div', { class: 'pg-end-row', style: `grid-template-columns:repeat(${Math.min(4, played.length)},auto)` }, ...played.map(w => h('div', { class: 'pg-end-card' }, cardNode(w), h('div', { class: 'pg-end-label' }, ...label(w))))),
      h('div', { class: 'pg-end-actions' },
        more ? h('button', { class: 'wt-btn wt-primary', onclick: () => { closed = true; hush(); ov.remove(); document.removeEventListener('keydown', escape); openPolishGame([], false, onReturn); } }, '✨ Another round') : null,
        h('button', { class: 'wt-btn' + (more ? '' : ' wt-primary'), onclick: leave }, 'Done')));
    ov.querySelector('.pg-stage').replaceWith(panel); ov.querySelector('.pg-table').remove();
    if (played.some(w => results[w].lvl > results[w].lvl0)) sfx('great');
  }

  if (!hand.length) { closed = true; resumePolishBackdrop(); onReturn?.(); return; }
  document.body.append(ov); document.addEventListener('keydown', escape);
  pickTarget(); renderProgress(); renderSentence(); renderTray(null); renderHand(); renderDeck(); say2('Which word fits? Drag it into the magic circle.');
  ov.querySelector('.wt-exit').focus();
}

// The Cave — Leo, Mia and Toby's voyage. Title → journey map → stops.
window.__maxEp = MAX_EP;

const PLAY = { 1: stop1, 2: stop2, 3: stop3, 4: stop4, 5: stop5, 6: stop6, 7: stop7, 8: stop8, 9: stop9, 10: stop10, 11: stop11, 12: stop12, 13: stop13, 14: stop14, 15: stop15, 16: stop16, 17: stop17, 18: stop18 };
const SUMUP = { 1: sumUp, 2: sumUp2, 3: sumUp3, 4: sumUp4, 5: sumUp5, 6: sumUp6 };
let hud, cleanupMap = () => {}, mapVersion = 0, playing = false, leaving = false;

// A page replacement safely cancels every pending story/activity callback.
// Keep the current filename and test flag, so the review build stays isolated.
function returnToMap() {
  if (leaving) return;
  leaving = true; save(); cleanupMap();
  const url = new URL(location.href);
  url.searchParams.delete('stop'); url.searchParams.delete('from');
  url.searchParams.set('view', 'map');
  location.replace(url.href);
}

function buildHud(mode) {
  if (hud) hud.remove();
  const readBtn = h('button', { class: 'hud-btn', onclick: () => { S.settings.read = !S.settings.read; save(); readBtn.textContent = S.settings.read ? '🔊 Read to me' : '🔈 Reading off'; sfx('tap'); } }, S.settings.read ? '🔊 Read to me' : '🔈 Reading off');
  const musicBtn = h('button', { class: 'hud-btn', 'aria-label': 'Music', onclick: () => { setMusic(!S.settings.music); save(); musicBtn.textContent = S.settings.music ? '🎵' : '🔇'; sfx('tap'); } }, S.settings.music ? '🎵' : '🔇');
  const due = dueCards().length;
  hud = h('div', { class: 'hud' },
    h('div', { class: 'hud-right' }, mode === 'stop' ? h('button', { class: 'hud-btn', title: 'Return to the voyage map. This stop restarts when you visit again.', onclick: returnToMap }, '🗺 Back to the map') : h('button', { class: 'hud-btn town-btn', onclick: goTown }, '⛵ Pebble Town'),
      mode === 'map' ? h('button', { class: 'hud-btn' + (due ? ' glow' : ''), onclick: () => { sfx('tap'); openBinder(() => buildHud(mode)); } }, '🃏 Word cards ' + ownedCount(MAX_EP) + '/' + cardTotal(MAX_EP) + (due ? ` · ✨${due}` : '')) : null),
    h('div', { class: 'hud-right' }, mode === 'map' ? h('button', { class: 'hud-btn', onclick: () => { sfx('tap'); voicePanel(); } }, '🗣 Voice') : null, musicBtn, readBtn));
  document.body.append(hud);
}

// Back to Pebble Town: fade to black around the blue glow, then the town opens at the cave mouth.
async function goTown() { if (leaving) return; leaving = true; cleanupMap(); sfx('whoosh'); save(); await cloudsIn(); location.href = 'index.html?from=cave'; }

// Choose the reading voice. The best one on this device is picked automatically and starred.
function voicePanel() {
  const vs = englishVoices(), cur = currentVoice();
  const list = h('div', { class: 'voice-list' }, ...vs.slice(0, 14).map((v, i) => h('button', { class: 'voice-row' + (cur && cur.name === v.name ? ' on' : ''), onclick: () => {
    setVoice(v.name); list.querySelectorAll('.voice-row').forEach(b => b.classList.remove('on')); list.children[i].classList.add('on'); say('Leo and Mia were playing in the bright sun with Toby the puppy.', { force: true }); } },
    h('b', {}, (i === 0 ? '★ ' : '') + v.name.replace(/^Microsoft |\s*-\s*English.*$| Online \(Natural\)/g, m => m.includes('Natural') ? ' (natural)' : '')), h('small', {}, v.lang))));
  const ov = h('div', { class: 'binder', onclick: e => { if (e.target === ov) ov.remove(); } }, h('div', { class: 'binder-page voice-page' },
    h('button', { class: 'btn ghost close', onclick: () => ov.remove() }, '✕'), h('h2', {}, 'Reading voice'),
    h('div', { class: 'binder-sub' }, vs.length ? 'Tap a voice to hear it. ★ is the best one found on this device.' : 'No voices found on this device yet.'),
    h('button', { class: 'voice-row' + (!S.settings.voice ? ' on' : ''), onclick: () => { setVoice(''); ov.remove(); say('I will use the best voice on this device.', { force: true }); } }, h('b', {}, 'Automatic (best voice)')),
    list, h('p', { class: 'voice-tip' }, 'Tip: Microsoft Edge has very natural voices (like Aria or Jenny). On iPad, you can download better voices in Settings → Accessibility → Spoken Content → Voices.')));
  document.body.append(ov);
}

async function showMap(focusNext = true) {
  if (playing) return returnToMap();
  cleanupMap(); const version = ++mapVersion;
  hideStory(); hideTask();
  document.querySelectorAll('.map-banner').forEach(e => e.remove());
  buildHud('map'); playMusic('map');
  const { markers, reached } = buildMap(S, null);
  const last = Math.max(...EPISODES[MAX_EP].stops); const next = STOPS[Math.min(reached, last) - 1];
  const ep = Math.min(MAX_EP, next.ep), epDone = S['ep' + ep];
  setCam([-2, 40, 40], [0, 0, 0]);
  const banner = h('div', { class: 'map-banner' }, h('div', { class: 'ep' }, 'Episode ' + ep), h('div', { class: 'ep-title' }, EPISODES[ep].title),
    h('div', { class: 'ep-hint' }, epDone && ep === MAX_EP ? `Episode ${ep} complete! More of the voyage is coming soon.` : 'Tap the glowing stop to begin.'));
  document.body.append(banner);
  await flyCam([next.p[0] + 12, 25, next.p[2] + 24], [next.p[0] + 9, 0, next.p[2] - 3], 2600);
  if (version !== mapVersion || leaving) return;
  // drag to look around the map, tap a stop to play it
  let down = null, moved = 0, selecting = false; const cv = renderer.domElement;
  const pd = e => { if (selecting || leaving || (e.button != null && e.button !== 0)) return; down = { x: e.clientX, y: e.clientY, id: e.pointerId }; moved = 0; cv.setPointerCapture?.(e.pointerId); };
  const pm = e => { if (!down || e.pointerId !== down.id) return; const dx = e.clientX - down.x, dy = e.clientY - down.y; moved += Math.abs(dx) + Math.abs(dy); down = { x: e.clientX, y: e.clientY, id: e.pointerId };
    const k = 0.035; camera.position.x -= dx * k; camera.position.z -= dy * k; camera.position.x = Math.max(-34, Math.min(32, camera.position.x)); camera.position.z = Math.max(-8, Math.min(34, camera.position.z));
    camera.lookAt(camera.position.x - 3, 0, camera.position.z - 27); };
  const pu = async e => { if (!down || selecting || leaving || e.pointerId !== down.id) return; const wasDrag = moved > 12; down = null; if (wasDrag) return;
    const hit = pickAt(e.clientX, e.clientY, markers); if (!hit) return; const s = hit.obj.userData.stop;
    const can = s.n === 1 || (S.stops[s.n - 1] && S.stops[s.n - 1].done);
    if (!can) { sfx('bad'); say('Finish stop ' + (s.n - 1) + ' first!', { force: true }); return; }
    selecting = true; sfx('pop');
    let captain = false;
    if (S.stops[s.n] && S.stops[s.n].done) { captain = await chooseMode(s); if (captain === null) { selecting = false; return; } }
    cleanupMap();
    banner.remove(); await flyCam([s.p[0] + 1, s.p[1] + 4, s.p[2] + 5], [s.p[0], s.p[1], s.p[2]], 1100); play(s.n, captain); };
  cv.addEventListener('pointerdown', pd); cv.addEventListener('pointermove', pm); cv.addEventListener('pointerup', pu);
  const cancel = () => { down = null; moved = 0; };
  cv.addEventListener('pointercancel', cancel);
  cleanupMap = () => { cancel(); cv.removeEventListener('pointerdown', pd); cv.removeEventListener('pointermove', pm); cv.removeEventListener('pointerup', pu); cv.removeEventListener('pointercancel', cancel); cleanupMap = () => {}; };
}

// A stop she has finished can be replayed (new versions of each activity) or played in Captain mode.
function chooseMode(s) {
  return new Promise(res => {
    const close = v => { ov.remove(); res(v); };
    const ov = h('div', { class: 'mode-pick', onclick: e => { if (e.target === ov) close(null); } }, h('div', { class: 'mode-card' },
      h('h3', {}, s.name), h('div', {}, S.captain && S.captain[s.n] ? '⚓ Captain stamp earned!' : 'You have been here before. New puzzles are waiting!'),
      h('button', { class: 'mode-opt', onclick: () => close(false) }, h('b', {}, '▶ Play again'), 'New words and new puzzles, with Toby\u2019s help.'),
      h('button', { class: 'mode-opt cap', onclick: () => close(true) }, h('b', {}, '⚓ Captain mode'), 'Read the story yourself, bonus challenges on, only one hint. Get everything right the first time to earn the Captain stamp!'),
      h('button', { class: 'mode-opt', onclick: () => close(null) }, h('b', {}, '🗺 Stay on the map'))));
    document.body.append(ov);
  });
}

async function play(n, captain = false) {
  if (playing || leaving || !PLAY[n]) return;
  cleanupMap(); playing = true;
  MODE.captain = captain; MODE.perfect = true;
  buildHud('stop'); stopFollow(); document.querySelectorAll('.map-banner').forEach(e => e.remove());
  const veil = h('div', { class: 'veil' }); document.body.append(veil); await wait(350);
  const stopName = STOPS[n - 1].name;
  const card = h('div', { class: 'stop-title' }, h('small', {}, 'Stop ' + n), stopName); document.body.append(card);
  const go = PLAY[n](); setTimeout(() => veil.classList.add('out'), 200); setTimeout(() => { veil.remove(); card.classList.add('out'); }, 1500); setTimeout(() => card.remove(), 2600);
  await go; hideStory(); hideTask();
  const captainPerfect = MODE.perfect;
  MODE.captain = false;
  const epN = STOPS[n - 1].ep, lastOfEp = Math.max(...EPISODES[epN].stops);
  // Finish an episode's required recap before presenting its final navigation.
  const completedEpisode = n === lastOfEp && !S['ep' + epN];
  if (completedEpisode) { await SUMUP[epN](); hideStory(); hideTask(); }
  if (captain || completedEpisode) {
    const next = await completionChoice(n, completedEpisode ? epN : null, captain, captainPerfect);
    playing = false;
    if (next) return play(n + 1);
    return showMap();
  }
  const nxt = STOPS[n]; // the stop after this one
  if (nxt && nxt.ep <= MAX_EP) {
    const go = await new Promise(r => { const ov = h('div', { class: 'after' }, h('div', { class: 'mode-card' }, h('h3', {}, 'Stop ' + n + ' done!'), h('div', {}, 'Where to next?'),
      h('button', { class: 'mode-opt cap', onclick: () => { ov.remove(); r(true); } }, h('b', {}, nxt.ep === epN ? '▶ Next stop' : '▶ Start Episode ' + nxt.ep), `Stop ${nxt.n}: ${nxt.name}`),
      h('button', { class: 'mode-opt', onclick: () => { ov.remove(); r(false); } }, h('b', {}, '🗺 Back to the map'), 'Choose a stop on the voyage map.'))); document.body.append(ov); say('Where to next?', { force: S.settings.read }); });
    playing = false;
    if (go) return play(nxt.n);
  }
  playing = false;
  const v2 = h('div', { class: 'veil' }); document.body.append(v2); await wait(400); showMap(); v2.classList.add('out'); setTimeout(() => v2.remove(), 900);
}

function completionChoice(n, ep, captain, perfect) {
  return new Promise(resolve => {
    const nxt = STOPS[n], available = nxt && nxt.ep <= MAX_EP && PLAY[nxt.n];
    let chosen = false;
    const close = next => { if (chosen) return; chosen = true; ov.remove(); resolve(next); };
    const stops = ep ? EPISODES[ep].stops : [];
    const heading = ep ? `You finished ${EPISODES[ep].title}!` : perfect ? 'Captain stamp earned!' : 'Great sailing!';
    const ov = h('div', { class: 'ep-done' }, h('div', { class: 'ep-done-in' },
      h('div', { class: 'stamp' }, ep ? 'Episode ' + ep : '⚓ Captain mode'),
      h('h2', {}, heading),
      ep ? h('p', {}, `Bonus stars: ${stops.filter(s => S.stars[s]).length} of ${stops.length}`) : null,
      captain ? h('p', {}, perfect ? '⚓ Captain stamp earned! Everything right the first time!' : 'Try Captain mode again to get every answer right the first time.') : null,
      available ? h('button', { class: 'btn gold', onclick: () => close(true) }, nxt.ep === STOPS[n - 1].ep ? '▶ Next stop' : '▶ Start Episode ' + nxt.ep) : h('p', {}, 'More of the voyage is coming soon.'),
      h('button', { class: 'btn gold', onclick: () => close(false) }, '🗺 Back to the map')));
    document.body.append(ov); sfx(captain && !perfect ? 'good' : 'great');
    say(heading, { force: S.settings.read });
  });
}

function title() {
  let started = false;
  const go = () => { if (started) return; started = true; audioInit(); sfx('glow'); t.classList.add('out'); setTimeout(() => t.remove(), 900); showMap(); };
  const t = h('div', { class: 'title' },
    h('div', { class: 'title-glow' }), h('h1', {}, 'The Cave'), h('div', { class: 'title-sub' }, 'Leo, Mia & Toby’s voyage'),
    h('button', { class: 'btn gold big', onclick: go }, S.stops[1] ? 'Open the voyage map' : 'Start the voyage'),
    h('div', { class: 'title-note' }, S.name ? `Welcome, ${S.name}!` : ''));
  document.body.append(t);
}

load(); init(document.body); setCamRef(camera); mountUI();
document.addEventListener('pointerdown', () => audioInit(), { once: true });
const fromTown = new URLSearchParams(location.search).get('from') === 'town';
const route = new URLSearchParams(location.search);
const testStop = route.has('test') && +route.get('stop');
if (testStop && PLAY[testStop]) { play(testStop); }
else if (fromTown) { const url = new URL(location.href); url.searchParams.delete('from'); history.replaceState(null, '', url.href); const cv = cloudsCovered(); showMap(); setTimeout(() => cloudsOut(cv), 700); }
else if (route.get('view') === 'map') { showMap(); }
else if (sessionStorage.getItem('cave_skipTitle')) { sessionStorage.removeItem('cave_skipTitle'); showMap(); } else { setCam([-2, 40, 40], [0, 0, 0]); buildMap(S, null); title(); }
window.__cave = { S, play, showMap, debugVarn, dbg: { makeCast, newWorld, makeVarn, buildShelf, buildCliff, buildCrack, setCam, stopFollow, THREE, camera: () => camera }, debugCliff: (cam, tgt, fov = 50) => { stopFollow(); const K = buildCliff(); setCam(cam, tgt); camera.fov = fov; camera.updateProjectionMatrix(); window.__K = K; }, debugBeach: (cam = [0, 2.2, -8], tgt = [0, 1, 1]) => { stopFollow(); buildBeach(); setCam(cam, tgt); } };

// test helper: only appears when the page address has ?test (e.g. cave-test.html?test). The live page never shows it.
if (new URLSearchParams(location.search).has('test')) {
  const sel = h('select', { style: 'position:fixed;left:8px;bottom:8px;z-index:9999;padding:6px;font:14px sans-serif;max-width:55vw;opacity:.85' }, h('option', { value: '' }, 'TEST: jump to stop…'),
    ...STOPS.filter(s => s.ep <= MAX_EP).map(s => h('option', { value: s.n }, `Ep${s.ep} · stop ${s.n}: ${s.name}`)));
  sel.onchange = () => { const n = +sel.value; if (!n || leaving) return; leaving = true; save(); const url = new URL(location.href); url.searchParams.delete('view'); url.searchParams.delete('from'); url.searchParams.set('stop', n); location.replace(url.href); };
  document.body.append(sel);
}

// Frame preview: open with ?frames (or the "Preview frames" button in ?test mode). Shows every card in any tier
// without changing saved progress.
function openFramePreview() {
  if (document.querySelector('.wt-overlay')) return;
  let tier = 4;
  const words = Object.keys(CARDS).filter(w => CARDS[w].ep <= MAX_EP);
  const grid = h('div', { style: 'display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:130px 150px;padding:110px 110px 120px;max-width:1500px;margin:auto' });
  const names = ['', 'Bronze', 'Silver', 'Gold', 'Diamond'];
  const tabs = [1, 2, 3, 4].map(t => h('button', { type: 'button', style: 'font:600 15px var(--body,sans-serif);padding:8px 16px;border-radius:999px;border:2px solid #fff4d8;cursor:pointer' }, names[t]));
  const render = () => {
    tabs.forEach((b, i) => { const on = i + 1 === tier; b.style.background = on ? '#fff4d8' : 'transparent'; b.style.color = on ? '#172c43' : '#fff4d8'; });
    grid.replaceChildren(...words.map(w => framedCard(w, tier)));
  };
  tabs.forEach((b, i) => b.onclick = () => { tier = i + 1; render(); });
  const close = () => { ov.remove(); document.removeEventListener('keydown', esc); };
  const esc = e => { if (e.key === 'Escape') close(); };
  const ov = h('section', { class: 'wt-overlay', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Frame preview' },
    h('div', { style: 'position:sticky;top:0;z-index:5;display:flex;gap:10px;align-items:center;flex-wrap:wrap;padding:14px 18px;background:#172c43ee' },
      h('strong', { style: 'font:700 18px var(--body,sans-serif);margin-right:8px' }, 'Frame preview'), ...tabs,
      h('button', { type: 'button', style: 'margin-left:auto;font:600 15px var(--body,sans-serif);padding:8px 16px;border-radius:999px;border:0;cursor:pointer;background:#fff4d8;color:#172c43', onclick: close }, 'Close ✕')),
    grid);
  document.addEventListener('keydown', esc);
  document.body.append(ov);
  render();
}
if (new URLSearchParams(location.search).has('frames')) setTimeout(openFramePreview, 600);
if (new URLSearchParams(location.search).has('test')) {
  document.body.append(h('button', { type: 'button', style: 'position:fixed;left:8px;bottom:48px;z-index:9999;padding:6px 10px;font:14px sans-serif;opacity:.85', onclick: openFramePreview }, 'Preview frames'));
}

// A borrowed practice hand offers a direct review link without seeding saves.
if (route.get('cards') === 'practice') {
  openPolishGame(['explore', 'cart', 'swift', 'wave'], true, () => openPolishCollection(() => buildHud('map')));
}

}
