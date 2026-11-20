// Beginner guidance: a spotlight tour of the town, and "How to play" cards for every activity.
import { S, save, h, sfx, wait } from './core.js';

// ---------------------------------------------------------------- spotlight tour
function spot(target, text, { pad = 10, place = 'below' } = {}) {
  return new Promise(res => {
    const el = typeof target === 'function' ? target() : document.querySelector(target);
    const r = el ? el.getBoundingClientRect() : { left: innerWidth / 2 - 60, top: innerHeight / 2 - 40, width: 120, height: 80 };
    const hole = h('div', { class: 'tour-hole' }); Object.assign(hole.style, { left: r.left - pad + 'px', top: r.top - pad + 'px', width: r.width + pad * 2 + 'px', height: r.height + pad * 2 + 'px' });
    const next = h('button', { class: 'btn small green' }, 'Next ▸');
    const tip = h('div', { class: 'tour-tip' }, h('div', { class: 'tour-text' }, text), next);
    const ov = h('div', { class: 'tour' }, hole, tip); document.body.append(ov);
    const tw = Math.min(380, innerWidth - 24); tip.style.width = tw + 'px';
    let x = Math.max(12, Math.min(innerWidth - tw - 12, r.left + r.width / 2 - tw / 2));
    let y = r.top + r.height + pad + 16; if (place === 'above' || y + 160 > innerHeight) y = Math.max(12, r.top - pad - 16 - 150);
    Object.assign(tip.style, { left: x + 'px', top: y + 'px' });
    sfx('pop');
    const done = () => { ov.remove(); res(); };
    next.onclick = e => { e.stopPropagation(); done(); };
    ov.onclick = e => { if (e.target === ov) done(); };
  });
}
export async function townTour({ placeLabel }) {
  await spot('.mission', 'Your goal: a ★ on every place!');
  await spot(placeLabel('signs'), 'Tap a place to play.');
  await spot('#hud .coin-count', 'Right answers give you coins!', { pad: 18 });
  await spot('.dock', 'Fix mistakes and decorate here.', { place: 'above' });
  await spot('.menu-btn', 'Sound and help are here.');
  await spot('#pip', 'I am Pip. I give you help!', { place: 'above' });
  const lbl = placeLabel('signs')(); if (lbl) lbl.classList.add('pulse-me');
  await spot(placeLabel('signs'), 'Start here! Tap the Sign Shop.');
  setTimeout(() => lbl && lbl.classList.remove('pulse-me'), 12000);
  S.toured = 1; save();
}

// ---------------------------------------------------------------- how-to-play cards
// [area, card name pattern, title, steps]
const HELP = [
  ['signs', /^Lesson|Mixed|Tricky/, 'Sign Shop', ['Look at the picture.', 'Read the sentence.', 'Spell the missing word!']],
  ['signs', /Listen/, 'Listen & spell', ['Tap 🔊 to hear the word.', 'Type it.']],
  ['train', /Sort/, 'Sort the train', ['Read the yellow wagon.', 'Tap the right shed.']],
  ['train', /Odd/, 'Odd one out', ['Three are the same.', 'Tap the different one.']],
  ['train', /Blend/, 'Blend builder', ['Look at the picture.', 'Pick the letters to finish the word.']],
  ['train', /Mixed/, 'Mixed station', ['Read the question at the top.']],
  ['bridge', /Build/, 'Build the bridge', ['Tap the words in order.', 'Start with a BIG letter.', 'End with . or ?', 'Tap Check.']],
  ['bridge', /Fix/, 'Fix the sentence', ['Find the mistakes.', 'Tap them!']],
  ['bridge', /Missing/, 'Missing word', ['Read the sentence.', 'Tap the word that fits.']],
  ['bridge', /Listen/, 'Listen & write', ['Tap 🔊 to hear it.', 'Type the sentence.']],
  ['library', /Which picture/, 'Which picture?', ['Read the word.', 'Tap the right picture.']],
  ['library', /Use it right/, 'Use it right', ['Read the sentences.', 'Tap the good one.']],
  ['library', /Fill/, 'Fill the sentence', ['Read the sentence.', 'Tap the word that fits.']],
  ['workshop', /Repair/, 'Repair shop', ['Tap the wrong word.', 'Pick the right word.']],
  ['workshop', /./, 'Grammar machine', ['Read the sentence.', 'Tap the answer.']],
  ['detective', /case/, 'Solve a case', ['Read the story.', 'Tap the clue in the story.']],
  ['detective', /Detective words|Title/, 'Detective words', ['Read the question.', 'Tap the answer.']],
  ['market', /Number/, 'Number Stall', ['Read the question.', 'Tap the answer.']],
  ['market', /Column/, 'Column Counter', ['Start with O (ones).', 'Then T (tens), then H (hundreds).', 'Type each number.']],
  ['market', /Story/, 'Story Stall', ['Read the story.', 'Add or take away?', 'Type the answer.']],
  ['market', /Ruler/, 'Ruler Stall', ['m is for long things.', 'cm is for short things.', 'Read the ruler from 0.']],
  ['market', /Scale/, 'Scale Stall', ['kg is for heavy things.', 'g is for light things.', 'Add or take away?']],
  ['market', /Puzzle/, 'Puzzle Stall', ['Find the missing number.']],
  ['science', /Light/, 'Light Lab', ['Look at the picture.', 'Tap the answer.']],
  ['science', /Shadow/, 'Shadow Lab', ['Light can not go through you.', 'The shadow is away from the light.']],
  ['science', /Heat/, 'Heat Lab', ['Look at the picture.', 'Hot or cold?']],
  ['science', /quiz/, 'Science quiz', ['Read and tap the answer.']],
];
let lastHelp = null;
export function helpFor(area, name) { const m = HELP.find(([a, re]) => a === area && re.test(name)); return m ? { key: area + ':' + m[2], title: m[2], steps: m[3] } : null; }
export function showHelp(hp) {
  return new Promise(res => {
    if (!hp) return res(); lastHelp = hp;
    const ov = h('div', { class: 'overlay' }, h('div', { class: 'panel howto' },
      h('div', { class: 'howto-top' }, 'How to play'), h('h2', {}, hp.title),
      h('ol', {}, ...hp.steps.map(s => h('li', {}, s))),
      h('button', { class: 'btn green', onclick: () => { ov.remove(); res(); } }, "Let's go!")));
    document.body.append(ov); sfx('pop');
  });
}
export async function maybeHelp(area, name) {
  const hp = helpFor(area, name); if (!hp) return; lastHelp = hp;
  S.seenHelp = S.seenHelp || {}; if (S.seenHelp[hp.key]) return;
  S.seenHelp[hp.key] = 1; save(); await showHelp(hp);
}
export const replayHelp = () => showHelp(lastHelp);
export const hasHelp = () => !!lastHelp;
export function clearHelp() { lastHelp = null; }
