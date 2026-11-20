// LIGHTHOUSE — Storm Night: a mixed review of everything. Light 12 of 15 lamps to clear the storm.
import { S, save, h, sfx, say, pip, mark, setQ, snapHTML, stripPics, plainText, giveCoins, burst, shake, cheer, tryAgain, wait, speakBtn, choose, confetti, pic } from '../core.js';
import { SPELLING, SENTENCES, GRAMMAR, TERMS } from '../data.js';
import { playRound, bigToast } from '../shell.js';
import { keyboard, numpad } from '../widgets.js';
import { cloze } from '../questions.js';
import { rnd, pick, shuffle, makeSum3, LENGTH_UNITS, MASS_UNITS } from '../mathgen.js';
import { quick } from '../questions.js';

const N = 15, GOAL = 12;
export default {
  id: 'storm', dark: true, title: 'Lighthouse — Storm Night',
  bg: '#1E2148',
  enter(ui) {
    ui.clear(); ui.bg.innerHTML = ''; const sky = h('div', { class: 'storm-sky' }), rain = h('div', { class: 'rain' }), flash = h('div', { class: 'flash' });
    ui.bg.append(sky, rain, flash);
    const best = S.storm.best || 0;
    const card = h('div', { class: 'qcard' }, h('div', { style: { fontSize: '72px' } }, '⛈️🗼'),
      h('div', { class: 'prompt big' }, 'Storm Night!'),
      h('div', { class: 'sub', style: { color: 'var(--ink)' } }, `${N} questions. Get ${GOAL} right!`),
      best ? h('div', { style: { fontWeight: 700 } }, `Your best: ${best} lamps`) : null,
      h('button', { class: 'btn red', onclick: () => run(ui, sky, rain, flash) }, 'Start the night'));
    ui.stage.append(card);
    pip('Do your best!');
  },
};

function run(ui, sky, rain, flash) {
  sky.classList.remove('clear'); rain.style.opacity = 1;
  const qs = buildQuiz(); let lit = 0;
  const lamps = h('div', { class: 'lamps' }, ...Array.from({ length: N }, () => h('i')));
  playRound(ui, { n: N, again: () => run(ui, sky, rain, flash), ask: async (i, host) => {
    if (i === 0) { ui.stage.prepend(lamps); const d = ui.stage.querySelector('.progress-dots'); if (d) d.style.display = 'none'; }
    const card = h('div', { class: 'qcard' }); host.append(card);
    const ok = await qs[i](card);
    lamps.children[i].className = ok ? 'on' : 'off';
    if (ok) { lit++; sfx('pop'); } else { sfx('thunder'); flash.animate([{ opacity: 0 }, { opacity: .8 }, { opacity: 0 }, { opacity: .5 }, { opacity: 0 }], { duration: 700 }); }
    if (i === N - 1) {
      S.storm.runs = (S.storm.runs || 0) + 1; S.storm.best = Math.max(S.storm.best || 0, lit); save();
      if (lit >= GOAL) { sky.classList.add('clear'); rain.style.opacity = 0; sfx('fanfare'); confetti(innerWidth / 2, innerHeight / 3, 80); bigToast('The storm is gone!'); await wait(1600); }
      else { await pip(`${lit} lamps! You need ${GOAL}. Try again!`); }
    }
    return ok;
  } });
}

// One question from each kind, mixed
function buildQuiz() {
  const sp = choose(SPELLING, 4, s => 'sp:' + s.w), se = shuffle(SENTENCES.filter(s => !['are', 'does'].includes(s.b.toLowerCase()))).slice(0, 2);
  const list = [
    ...sp.map(s => c => spellQ(c, s)),
    ...se.map(s => c => gapQ(c, s)),
    c => phonicsQ(c), c => meaningQ(c), c => grammarQ(c, 2), c => grammarQ(c, pick([4, 6, 7])), c => termQ(c),
    c => numberWordQ(c), c => sumQ(c), c => unitQ(c), c => grammarQ(c, pick([1, 6, 7])),
  ];
  return shuffle(list).slice(0, N);
}

function spellQ(card, s) {
  setQ('sign', { w: s.w, listen: false }, `Spell the word: ${s.w}`);
  return new Promise(res => {
    const speech = `Spell: ${s.w}. ${s.ctx} ${s.w}.`; let typed = '', tries = 0, done = false; if (window.__TEST) window.__ans = s.w;
    const show = h('div', { class: 'typed' }); const draw = () => show.innerHTML = typed + '<span class="caret"></span>'; draw();
    say(speech); card.append(h('div', { class: 'clue-card' }, pic(s.w, 120), h('div', { class: 'what' }, 'Spell the missing word:', h('small', {}, cloze(s))), speakBtn(speech)), show, keyboard(async k => {
      if (done) return;
      if (k === 'back') typed = typed.slice(0, -1);
      else if (k === 'enter') { if (!typed) return;
        if (typed === s.w) { done = true; mark('sp:' + s.w, true, tries === 0); if (!tries) giveCoins(1, show); sfx('good'); burst(show, cheer()); await wait(600); res(tries === 0); return; }
        tries++; sfx('bad'); shake(show); mark('sp:' + s.w, false, true, typed); done = true;
        show.innerHTML = `<span style="color:#B83A2E;text-decoration:line-through">${typed}</span> → <span style="color:#2A6E40">${s.w}</span>`;
        await say(`${s.w} is spelled ${[...s.w].join(', ')}.`); await wait(500); res(false); return; }
      else if (typed.length < 10) typed += k;
      draw();
    }, { enterLabel: 'Done' }));
  });
}
// In Storm Night a wrong first answer is final: the lamp goes out, then we move on.
function oneShot(card, opts) {
  setQ('choice', { ctx: opts.extra ? snapHTML(h('div', {}, opts.extra.cloneNode(true))) : '', prompt: stripPics(opts.prompt), speech: opts.speech, options: opts.options, answer: opts.answer, id: opts.id, long: opts.long }, plainText(opts.prompt));
  return new Promise(res => {
    const row = h('div', { class: 'choices' + (opts.long ? ' long' : '') });
    const sp = opts.speech || plainText(opts.prompt); card.append(h('div', { class: 'prompt' }, speakBtn(sp), h('span', { html: opts.prompt })));
    if (opts.extra) card.append(opts.extra);
    card.append(row);
    for (const o of shuffle(opts.options)) row.append(h('button', { class: 'choice', onclick: async e => {
      if (row.dataset.done) return; row.dataset.done = 1; const b = e.currentTarget; const ok = String(o) === String(opts.answer);
      [...row.children].forEach(x => { if (x.textContent === String(opts.answer)) x.classList.add('right'); else if (x !== b) x.classList.add('dim'); });
      if (ok) { sfx('good'); burst(b, cheer()); giveCoins(1, b); } else { b.classList.add('wrong'); sfx('bad'); }
      if (opts.id) mark(opts.id, ok, true, ok ? null : o);
      if (opts.after) await opts.after(ok); else await wait(ok ? 700 : 1500); res(ok);
    } }, String(o)));
    say(sp);
  });
}
function gapQ(card, s) {
  const others = shuffle(SENTENCES.filter(x => x.b !== s.b && !['are', 'does'].includes(x.b.toLowerCase()))).slice(0, 2).map(x => x.b);
  const fix = w => s.t.startsWith(s.b) ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w.toLowerCase();
  return oneShot(card, { prompt: 'Which word fits?', speech: s.t.replace(s.b, 'blank'), extra: h('div', { class: 'sentence-card', html: s.t.replace(s.b, '<span class="gap"></span>') }), options: [s.b, ...others].map(fix), answer: fix(s.b), id: 'sm:' + s.id, after: async () => say(s.t) });
}
function phonicsQ(card) {
  const s = pick(SPELLING); return oneShot(card, { prompt: `<b style="font-size:44px">${s.w}</b><br>Short vowel or long vowel?`, speech: `${s.w}. Short vowel or long vowel?`, options: ['short', 'long'], answer: s.v === 'l' ? 'long' : 'short', id: `ph:sl:${s.w}` });
}
function meaningQ(card) { const q = quick('meaning'); return oneShot(card, q); }
function grammarQ(card, L) {
  const g = GRAMMAR[L]; const i = rnd(0, g.items.length - 1); const it = g.items[i]; const id = `g${L}:${i}`;
  if (L === 1) { const opts = { S: 'Statement', Q: 'Question', C: 'Command' }; return oneShot(card, { prompt: `“${it[0]}”<br>What kind of sentence is it?`, speech: it[0], options: Object.values(opts), answer: opts[it[1]], id }); }
  if (L === 2) { const be = g.items.filter(x => x.k === 'be'); const j = rnd(0, be.length - 1); const x = be[j]; return oneShot(card, { prompt: x.t.replace('___', '<span class="gapbtn"></span>'), speech: x.t, options: ['am', 'is', 'are'], answer: x.a, id: `g2:${g.items.indexOf(x)}` }); }
  if (L === 4) return oneShot(card, { prompt: `one ${it[0]} → two ___`, speech: `One ${it[0]}. Two what?`, options: [it[1], ...it[2]], answer: it[1], id });
  const cap = it[0].startsWith('___');
  return oneShot(card, { prompt: it[0].replace('___', '<span class="gapbtn"></span>'), speech: it[0], options: L === 6 ? (cap ? ['A', 'An', 'The'] : ['a', 'an', 'the']) : ['some', 'any'], answer: it[1], id });
}
function termQ(card) { const t = pick(TERMS); return oneShot(card, { prompt: `${t.def[0].toUpperCase() + t.def.slice(1)} is the…`, speech: `${t.def}. What is it called?`, options: TERMS.map(x => x.term), answer: t.term, id: 'term:' + t.term }); }
function numberWordQ(card) { const q = quick(pick(['numword', 'placeval', 'missing', 'compare'])); return oneShot(card, q); }
function unitQ(card) { const [t, a] = pick([...LENGTH_UNITS, ...MASS_UNITS]); const opts = ['cm', 'm'].includes(a) ? ['cm', 'm'] : ['g', 'kg']; return oneShot(card, { prompt: t, speech: t, options: opts, answer: a, id: opts[0] === 'cm' ? 'm:len' : 'm:mass' }); }
function sumQ(card) {
  const q = makeSum3(pick(['addR', 'subR', 'sub0'])); let val = ''; if (window.__TEST) window.__ans = q.ans;
  setQ('number', { prompt: `<b style="font-size:40px">${q.a} ${q.op} ${q.b} = ?</b>`, answer: q.ans, id: 'm:add', maxLen: 4 }, `${q.a} ${q.op} ${q.b} = ?`);
  return new Promise(res => {
    const box = h('div', { class: 'answer-box' }, '?');
    card.append(h('div', { class: 'prompt' }, speakBtn(`${q.a} ${q.op === '+' ? 'plus' : 'minus'} ${q.b}`), h('span', { style: { fontSize: '44px' } }, `${q.a} ${q.op} ${q.b} = ?`)), box);
    card.append(numpad(async k => {
      if (box.dataset.done) return;
      if (k === 'back') val = val.slice(0, -1); else if (k === 'enter') { if (!val) return; box.dataset.done = 1; const ok = +val === q.ans; mark('m:add', ok, true, val);
        if (ok) { sfx('good'); burst(box, cheer()); giveCoins(1, box); box.style.background = '#D7F2DC'; await wait(700); } else { sfx('bad'); box.innerHTML = `<s style="color:#B83A2E">${val}</s> ${q.ans}`; await wait(1600); } res(ok); return; }
      else if (val.length < 3) val += k; box.textContent = val || '?';
    }));
    say(`${q.a} ${q.op === '+' ? 'plus' : 'minus'} ${q.b}`);
  });
}
