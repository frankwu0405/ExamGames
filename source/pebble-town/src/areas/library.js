// LIBRARY — VOCAB words (Lessons 4–7), tested for MEANING only: pictures and sentences, never spelling.
import { S, h, sfx, pip, mark, setQ, REPLAY, giveCoins, burst, shake, cheer, wait, choose, pic } from '../core.js';
import { VOCAB, SENTENCES } from '../data.js';
import { menu, playRound } from '../shell.js';
import { shuffle, pick } from '../mathgen.js';
import { askChoice } from '../widgets.js';
import { quick, vkey } from '../questions.js';

const id = v => 'lib:' + v.w;
const known = list => list.filter(v => (S.items[id(v)] || { box: 0 }).box >= 1).length / list.length;

export default {
  id: 'library', title: 'Library — Vocab Words',
  bg: 'linear-gradient(#E8E0F5 0 60%, #B98A5E 60% 62%, #D7AE7F 62%)',
  enter(ui) {
    menu(ui, 'Word meanings', [
      { name: 'Which picture?', desc: 'Tap the right picture.', pic: '🖼️', go: () => picPick(ui) },
      { name: 'Use it right', desc: 'Find the good sentence.', pic: '✅', color: '#FFE07A', go: () => quiz(ui, 'useit') },
      { name: 'Fill the sentence', desc: 'Pick the word that fits.', pic: '🧩', color: '#FFE07A', go: () => quiz(ui, 'cloze') },
    ]);
    pip('What does the word mean?');
  },
};

// ---------- read the word, tap the matching picture
function picPick(ui) {
  const list = choose(VOCAB, 8, id);
  playRound(ui, { n: list.length, again: () => picPick(ui), ask: (i, host) => pickOne(host, list[i]) });
}
REPLAY.vpic = (host, d) => pickOne(host, VOCAB.find(v => v.w === d.w));
function pickOne(host, v) {
  setQ('vpic', { w: v.w }, `Which picture shows "${v.w}"?`);
  return new Promise(res => {
     const opts = shuffle([v, ...shuffle(VOCAB.filter(x => x.w !== v.w)).slice(0, 2)]); let first = true;
    const row = h('div', { class: 'pic-choices' });
    for (const o of opts) { const b = h('button', { class: 'pic-choice' }, pic(vkey(o.w), 170)); b.onclick = async () => {
      if (row.dataset.done || b.classList.contains('wrong')) return;
      if (o === v) { row.dataset.done = 1; b.classList.add('right'); sfx('good'); burst(b, cheer()); mark(id(v), true, first); if (first) giveCoins(1, b); await wait(900); res(first); }
      else { b.classList.add('wrong'); sfx('bad'); shake(b); if (first) mark(id(v), false, true, o.w); first = false; const sn = SENTENCES.find(x => x.id === v.s); pip(`${sn.t}`); }
    }; if (window.__TEST && o === v) window.__solve = () => { b.click(); window.__solve = null; }; row.append(b); }
    host.append(h('div', { class: 'prompt' }, h('span', {}, 'Which picture shows '), h('b', { style: { fontSize: '40px', color: '#57407D' } }, v.w), h('span', {}, '?')), row);
  });
}

function quiz(ui, kind) {
  playRound(ui, { n: 8, again: () => quiz(ui, kind), ask: (i, host) => {
    const q = quick(kind);
    return askChoice(host, { prompt: q.prompt, options: q.options, answer: q.answer, id: q.id, long: q.long, hint: 'Read it again.' });
  } });
}
