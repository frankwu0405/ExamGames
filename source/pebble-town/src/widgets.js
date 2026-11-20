// Reusable game pieces: choice blocks, on-screen keyboard, number pad.
import { S, h, sfx, say, pip, mark, giveCoins, burst, shake, cheer, tryAgain, onClear, wait, speakBtn, setQSoft, snapHTML, unsnap, plainText, stripPics, restorePics, REPLAY } from './core.js';
import { shuffle } from './mathgen.js';

// Choice question. Resolves true if right on the first try. Keeps going until right.
export function askChoice(host, { prompt, speech, options, answer, id, coins = 1, extra, hint, big, onRight, wrongLine, long }) {
  setQSoft('choice', { ctx: snapHTML(host) + (extra ? snapHTML(h('div', {}, extra.cloneNode(true))) : ''), prompt: stripPics(prompt), speech, options, answer, id, hint, big, long }, plainText(prompt));
  return new Promise(res => {
    let first = true; const opts = shuffle(options);
    const row = h('div', { class: 'choices' + (long ? ' long' : '') });
    const sp = speech || plainText(prompt); const p = h('div', { class: 'prompt' + (big ? ' big' : '') }, speakBtn(long ? () => sp + '. ' + options.join('. ') : sp), h('span', { html: prompt }));
    if (extra) host.append(extra); host.prepend(p); host.append(row);
    for (const o of opts) {
      const b = h('button', { class: 'choice', onclick: async () => {
        if (b.classList.contains('wrong') || row.dataset.done) return;
        if (String(o) === String(answer)) {
          row.dataset.done = 1; b.classList.add('right'); sfx('good'); burst(b, cheer());
          [...row.children].forEach(x => x !== b && x.classList.add('dim'));
          if (id) mark(id, true, first); if (first) giveCoins(coins, b);
          if (onRight) await onRight(b); else await wait(700); res(first);
        } else {
          b.classList.add('wrong'); sfx('bad'); shake(b);
          if (first && id) mark(id, false, true, o); first = false;
          pip(wrongLine ? wrongLine(o) : (hint || tryAgain()), { speak: true });
        }
      } }, String(o));
      row.append(b);
    }
    say(sp);
  });
}

// QWERTY keyboard with big wooden keys. onKey(letter | 'back' | 'enter')
export function keyboard(onKey, { enterLabel = 'Done' } = {}) {
  const rows = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
  const kb = h('div', { class: 'keyboard' });
  rows.forEach((r, i) => {
    const row = h('div', { class: 'row' });
    for (const ch of r) row.append(h('button', { class: 'tile', onclick: () => { sfx('tap'); onKey(ch); } }, ch));
    if (i === 2) row.append(h('button', { class: 'tile wide', 'aria-label': 'Delete', onclick: () => { sfx('tap'); onKey('back'); } }, '⌫'));
    kb.append(row);
  });
  kb.append(h('div', { class: 'row' }, h('button', { class: 'btn green', onclick: () => onKey('enter') }, enterLabel)));
  const key = e => { if (e.metaKey || e.ctrlKey || e.altKey) return; if (/^[a-zA-Z]$/.test(e.key)) { onKey(e.key.toLowerCase()); sfx('tap'); } else if (e.key === 'Backspace') { e.preventDefault(); onKey('back'); } else if (e.key === 'Enter') onKey('enter'); };
  addEventListener('keydown', key); onClear(() => removeEventListener('keydown', key));
  return kb;
}

// Number pad. onKey(digit | 'back' | 'enter')
export function numpad(onKey, { enterLabel = 'Check' } = {}) {
  const pad = h('div', { class: 'numpad' });
  for (const d of [1, 2, 3, 4, 5, 6, 7, 8, 9, 0]) pad.append(h('button', { class: 'tile', onclick: () => { sfx('tap'); onKey(String(d)); } }, String(d)));
  pad.append(h('button', { class: 'tile wide', onclick: () => { sfx('tap'); onKey('back'); } }, '⌫ Undo'));
  pad.append(h('button', { class: 'tile wide', style: { '--c': '#9FE3AE', background: 'linear-gradient(160deg,#D7F2DC,#7FD08F)' }, onclick: () => onKey('enter') }, enterLabel));
  pad.append(h('span'));
  const key = e => { if (/^[0-9]$/.test(e.key)) { sfx('tap'); onKey(e.key); } else if (e.key === 'Backspace') { e.preventDefault(); onKey('back'); } else if (e.key === 'Enter') onKey('enter'); };
  addEventListener('keydown', key); onClear(() => removeEventListener('keydown', key));
  return pad;
}

// Number answer with a pad. Resolves true if right first time.
export function askNumber(host, { prompt, speech, answer, id, extra, maxLen = 3, hint, unit = '' }) {
  setQSoft('number', { ctx: snapHTML(host) + (extra ? snapHTML(h('div', {}, extra.cloneNode(true))) : ''), prompt: stripPics(prompt), speech, answer, id, maxLen, hint, unit }, plainText(prompt));
  return new Promise(res => {
    if (window.__TEST) window.__ans = answer;
    let val = '', first = true, done = false;
    const box = h('div', { class: 'answer-box' }, '');
    const draw = () => box.innerHTML = (val || '<span style="opacity:.3">?</span>') + (unit ? ` <small style="font-size:28px">${unit}</small>` : '');
    draw();
    const sp = speech || plainText(prompt); const p = h('div', { class: 'prompt' }, speakBtn(sp), h('span', { html: prompt }));
    host.append(p); if (extra) host.append(extra); host.append(box);
    host.append(numpad(async k => {
      if (done) return;
      if (k === 'back') val = val.slice(0, -1); else if (k === 'enter') {
        if (!val) return;
        if (+val === answer) { done = true; box.style.background = '#D7F2DC'; sfx('good'); burst(box, cheer()); if (id) mark(id, true, first); if (first) giveCoins(1, box); await wait(800); res(first); return; }
        sfx('bad'); shake(box); if (first && id) mark(id, false, true, val); first = false;
        pip(hint || tryAgain()); val = '';
      } else if (val.length < maxLen) val += k;
      draw();
    }));
    say(sp);
  });
}

// replay saved questions
REPLAY.choice = (host, d) => { const { ctx, ...o } = d; o.prompt = restorePics(o.prompt); if (ctx) host.append(unsnap(ctx)); return askChoice(host, o); };
REPLAY.number = (host, d) => { const { ctx, ...o } = d; o.prompt = restorePics(o.prompt); return askNumber(host, Object.assign(o, { extra: ctx ? unsnap(ctx) : null })); };
