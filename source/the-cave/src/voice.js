// Voice answers (the way The Gate does it): she reads a line aloud, or shouts a command, and the words light up as they are heard.
// The microphone is open ONLY while she is answering. Before it opens, read-aloud stops and every sound is held (core audioHold);
// the moment she answers, skips or taps instead, the mic is closed, the sound comes back, and only then the "good" sound plays.
// No mic, no permission, or she would rather tap: the same task is done by tapping, so she is never stuck.
import { S, save, sfx, say, hush, h, wait, audioHold, shake, miss } from './core.js';
import { task, hideTask, ladder, win, toby, tobyHide } from './ui.js';

const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
export const micAvailable = () => !!SR;
export const micOn = () => !!SR && S.settings.mic !== false && !denied;
let denied = false;
export function setMic(on) { S.settings.mic = !!on; if (on) denied = false; save(); }

// ---- words: normalise, sound-alikes, and a forgiving match (one slip in a longer word is fine; the key word must be right)
const NUM = { 0: 'zero', 1: 'one', 2: 'two', 3: 'three', 4: 'four', 5: 'five', 6: 'six', 7: 'seven', 8: 'eight', 9: 'nine', 10: 'ten' };
export const norm = s => s.toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(Boolean).map(w => NUM[w] || w);
const HOMO = {}; [['to', 'too', 'two'], ['for', 'four'], ['no', 'know'], ['right', 'write'], ['there', 'their', 'theyre'], ['hear', 'here'], ['one', 'won'], ['new', 'knew'], ['red', 'read'], ['by', 'buy', 'bye'], ['so', 'sew'], ['would', 'wood'], ['tale', 'tail'], ['sea', 'see'], ['blue', 'blew'], ['im', 'i'], ['row', 'roe'], ['mia', 'maya', 'mya', 'mira'], ['leo', 'lio'], ['toby', 'tobey'], ['varn', 'vern', 'barn', 'farm']].forEach(g => g.forEach(w => HOMO[w] = g));
function lev(a, b) { const d = Array.from({ length: a.length + 1 }, (_, i) => [i]); for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return d[a.length][b.length]; }
function same(t, w, strict) { if (t === w || (HOMO[t] && HOMO[t].includes(w))) return true; if (strict) return false;
  if (t.replace(/s$/, '') === w.replace(/s$/, '')) return true; return t.length >= 5 && w.length >= 4 && w[0] === t[0] && lev(t, w) <= 1; }
// mark which target words were heard, in order (a word may be found later in the transcript; words already lit stay lit)
function hear(tokens, words, lit) { let j = 0; tokens.forEach((t, i) => { for (let k = j; k < words.length; k++) if (same(t.n, words[k], t.key)) { lit.add(i); j = k + 1; break; } }); return lit; }

// ---- the microphone: one recogniser at a time, restarted if the browser stops it while she is still answering
const Mic = { want: false, rec: null, handler: null, retry: null };
function startRec(state) {
  if (!SR || !Mic.want || Mic.rec || document.hidden) return;
  const r = new SR(); r.lang = 'en-US'; r.interimResults = true; r.continuous = true; r.maxAlternatives = 3; Mic.rec = r; state('starting');
  r.onstart = r.onaudiostart = () => { if (Mic.rec === r) state('on'); };
  r.onresult = e => { if (Mic.rec !== r || !Mic.handler) return; for (let i = e.resultIndex; i < e.results.length; i++) { const res = e.results[i]; Mic.handler(Array.from(res, a => norm(a.transcript)), res.isFinal, i); } };
  r.onerror = e => { if (Mic.rec !== r) return; if (['not-allowed', 'service-not-allowed', 'audio-capture'].includes(e.error)) { denied = true; Mic.want = false; state('denied'); } };
  r.onend = () => { if (Mic.rec !== r) return; Mic.rec = null; if (Mic.want) { state('starting'); clearTimeout(Mic.retry); Mic.retry = setTimeout(() => startRec(state), 160); } else state('off'); };
  try { r.start(); } catch (e) { Mic.rec = null; Mic.want = false; state('off'); }
}
function openMic(handler, state) { hush(); audioHold(true); Mic.want = true; Mic.handler = handler; setTimeout(() => startRec(state), 120); }   // (a short gap so the last sound has faded before listening)
function closeMic() { Mic.want = false; Mic.handler = null; clearTimeout(Mic.retry); const r = Mic.rec; Mic.rec = null; try { r && r.abort(); } catch (e) { } audioHold(false); }
document.addEventListener('visibilitychange', () => { if (document.hidden && Mic.rec) { const r = Mic.rec; Mic.rec = null; try { r.abort(); } catch (e) { } } });

// ---- the activity
// mode 'read': she reads the whole line; every word must light up (after two tries, nearly all of it is enough).
// mode 'shout': a short command that makes something happen; only the words in `need` must be heard, in any order, in one go.
// tap fallback: 'read' = tap the words in reading order; 'shout' = one big button with the command on it.
export function speakIt({ prompt, line, mode = 'read', need = null, key = [], hints = [], word, idle = 40000 }) {
  return new Promise(res => {
    const raw = line.split(/\s+/), tokens = raw.map(r => ({ raw: r, n: (norm(r)[0] || ''), key: key.includes((norm(r)[0] || '')) })).filter(t => t.n);
    const needIdx = need ? need.map(nw => tokens.findIndex(t => t.n === nw)).filter(i => i >= 0) : tokens.map((_, i) => i);
    const L = ladder(hints, word); let done = false, lit = new Set(), tries = 0, idleT = null;
    const lineEl = h('div', { class: 'voice-line' + (mode === 'shout' ? ' shout' : '') }, ...tokens.map((t, i) => { t.el = h('span', { class: 'vw' + (needIdx.includes(i) ? ' need' : '') }, t.raw); return t.el; }).flatMap(e => [e, ' ']));
    const orb = h('button', { class: 'mic-orb', 'aria-label': 'Microphone' }, h('span', { class: 'mic-ico' }, '🎤'));
    const status = h('div', { class: 'mic-state' }), heard = h('div', { class: 'mic-heard' });
    const state = st => { orb.dataset.state = st; status.textContent = { on: mode === 'shout' ? 'Listening… say it loud!' : 'Listening… read it out loud!', starting: 'Getting the microphone ready…', denied: 'The microphone is blocked. Tap instead!', off: 'Microphone off. Tap 🎤 to try again, or tap instead.' }[st] || ''; if (st === 'denied') tapMode(); };
    const paint = () => tokens.forEach((t, i) => t.el.classList.toggle('lit', lit.has(i)));
    const finish = async by => { if (done) return; done = true; clearTimeout(idleT); clearTimeout(tapLater); closeMic(); tokens.forEach(t => t.el.classList.add('lit')); lineEl.classList.add('ok'); await wait(260); await win(); hideTask(); res({ first: L.first, by }); };
    const listen = () => { if (done || !micOn()) return state(micOn() ? 'off' : 'denied');
      clearTimeout(idleT); idleT = setTimeout(() => { closeMic(); state('off'); }, idle);   // never left listening: it closes itself if nothing comes
      openMic((cands, final) => { if (done) return;
        let best = null; for (const words of cands) { const l = mode === 'shout' ? hear(tokens, words, new Set()) : hear(tokens, words, new Set(lit)); if (!best || l.size > best.l.size) best = { l, words }; }
        heard.textContent = best.words.join(' ');
        if (mode === 'shout') { if (needIdx.every(i => best.l.has(i))) { lit = best.l; paint(); return finish('voice'); } if (final) { tries++; nudge(); } return; }
        lit = best.l; paint();
        if (needIdx.every(i => lit.has(i))) return finish('voice');
        if (final) { tries++; const left = tokens.filter((_, i) => !lit.has(i)); if (tokens.length >= 10 && tries >= 3 && left.length <= 1 && !left.some(t => t.key || t.n.length > 4)) return finish('voice'); nudge(left); }
      }, state); };
    const nudge = left => { if (tries >= 2) tapBtn.classList.remove('hidden'); if (mode === 'shout') toby(tries > 1 ? 'Say it louder: “' + line + '”' : 'Try again — say “' + line + '”!'); else if (left && left.length) toby(left.length === 1 ? 'One word left: ' + left[0].raw : 'Keep going! Read the gray words.'); };
    orb.onclick = () => { if (done) return; if (Mic.want) { closeMic(); state('off'); } else { if (!micOn()) { setMic(true); } listen(); } };
    const hearIt = h('button', { class: 'hear voice-hear', onclick: async () => { const was = Mic.want; closeMic(); state('off'); await say(line, { force: true }); if (was && !done) listen(); } }, '▶ Hear it');
    const tapBtn = h('button', { class: 'hear voice-tap hidden', onclick: () => tapMode() }, '👆 Tap instead'); const tapLater = setTimeout(() => tapBtn.classList.remove('hidden'), 25000);
    let tapping = false;
    function tapMode() { if (tapping || done) return; tapping = true; closeMic(); clearTimeout(idleT); orb.classList.add('hidden'); tapBtn.classList.add('hidden');
      if (mode === 'shout') { status.textContent = 'Tap the words to say them!'; lineEl.classList.add('tapme'); lineEl.onclick = () => { sfx('tap'); finish('tap'); }; return; }
      status.textContent = 'Read along: tap each word as you read it.'; let next = 0;
      tokens.forEach((t, i) => { t.el.classList.add('tapme'); t.el.onclick = () => { if (done) return; if (i === next) { sfx('tap'); lit.add(i); paint(); next++; while (next < tokens.length && lit.has(next)) next++; if (next >= tokens.length) finish('tap'); } else { shake(t.el); L.wrong(() => finish('tap')); } }; }); }
    window.__solve = () => finish('test');
    task(prompt, lineEl, h('div', { class: 'mic-row' }, orb, h('div', { class: 'mic-col' }, status, heard)), h('div', { class: 'voice-btns' }, hearIt, tapBtn));
    // let the prompt be read first, then open the mic (never both at once)
    if (micOn()) { status.textContent = 'Get ready…'; Promise.race([say(prompt, { queue: true }), wait(6000)]).then(() => { if (!tapping && !done) listen(); }); }
    else tapMode();
  });
}

// ---- a spoken answer: the question is asked, NO choices are shown, and she says the answer.
// accept: phrases (any one of them heard counts), e.g. ['gem', 'stone', 'crystal']. reply(heard) can add a line from Toby after a right answer.
// After a miss Toby gives a hint and finishes saying it before the mic opens again.
// After two misses a "Show me choices" button appears and runs fallback() (the tap version). No mic: the fallback runs straight away.
export function sayAnswer({ prompt, sub = '', accept, hints = [], word, fallback, any = false, reply = null, idle = 40000 }) {
  if (!micOn()) return fallback();
  return new Promise(res => {
    const L = ladder(hints, word); let done = false, tries = 0, idleT = null;
    const acc = accept.map(a => norm(a));
    const found = words => any ? (words.length ? words : null) : acc.find(a => words.some((_, k) => a.every((w, j) => words[k + j] && same(w, words[k + j], false))));
    const orb = h('button', { class: 'mic-orb', 'aria-label': 'Microphone' }, h('span', { class: 'mic-ico' }, '🎤'));
    const status = h('div', { class: 'mic-state' }), heard = h('div', { class: 'mic-heard' });
    const state = st => { orb.dataset.state = st; status.textContent = { on: 'Listening… say your answer!', starting: 'Getting the microphone ready…', denied: 'The microphone is blocked.', off: 'Tap 🎤 to answer again.' }[st] || ''; if (st === 'denied') choices(); };
    const choicesBtn = h('button', { class: 'hear voice-tap hidden', onclick: () => choices() }, '👀 Show me choices');
    const finish = async (by, said) => { if (done) return; done = true; clearTimeout(idleT); closeMic(); heard.textContent = '“' + said.join(' ') + '”'; heard.classList.add('ok'); await win(); hideTask(); if (reply) { toby(reply(said)); await wait(2400); tobyHide(); } res({ first: L.first, by, said }); };
    async function choices() { if (done) return; done = true; clearTimeout(idleT); closeMic(); hideTask(); res(Object.assign({ by: 'tap' }, await fallback())); }
    const listen = () => { if (done) return; if (!micOn()) return state('denied'); clearTimeout(idleT); idleT = setTimeout(() => { closeMic(); state('off'); }, idle);
      openMic((cands, final) => { if (done) return; let hit = null, best = cands[0] || []; for (const words of cands) { if (found(words)) { hit = words; break; } }
        heard.textContent = (hit || best).join(' ');
        if (hit && (final || !any)) return finish('voice', hit);
        if (final && best.length) { tries++; if (tries >= 2) choicesBtn.classList.remove('hidden'); closeMic(); state('off'); sfx('whine'); if (word) miss(word);
          const hint = hints[Math.min(tries, hints.length) - 1] || 'Try again!'; toby(hint); setTimeout(() => { if (!done) listen(); }, 1400 + hint.length * 65); } }, state); };
    orb.onclick = () => { if (done) return; if (Mic.want) { closeMic(); state('off'); } else { if (!micOn()) setMic(true); listen(); } };
    window.__solve = () => finish('test', acc[0] || ['test']);
    task(prompt, sub ? h('div', { class: 'task-sentence say-sub' }, sub) : null, h('div', { class: 'mic-row' }, orb, h('div', { class: 'mic-col' }, status, heard)), h('div', { class: 'voice-btns' }, choicesBtn));
    status.textContent = 'Get ready…'; Promise.race([say(prompt + (sub ? ' ' + sub.replace(/_+/g, 'blank') : ''), { queue: true }), wait(7000)]).then(() => { if (!done) listen(); });
  });
}


// ---- a chant: say the word again and again, and every time it is heard something happens (a paddle stroke…).
// The count goes up on interim results too, so it reacts the moment she says it. Tap version: tap the big word button.
export function chant({ prompt, word, count = 6, onBeat = () => {}, idle = 45000 }) {
  return new Promise(res => {
    let n = 0, done = false, idleT = null; const per = new Map(), target = norm(word)[0];
    const meter = h('div', { class: 'chant-meter' }, ...Array.from({ length: count }, () => h('i'))), big = h('button', { class: 'chant-word' }, word.toUpperCase() + '!');
    const orb = h('button', { class: 'mic-orb', 'aria-label': 'Microphone' }, h('span', { class: 'mic-ico' }, '🎤')), status = h('div', { class: 'mic-state' });
    const state = st => { orb.dataset.state = st; status.textContent = { on: 'Keep saying it: ' + word + '! ' + word + '!', starting: 'Getting the microphone ready…', denied: 'Microphone blocked: tap the word instead!', off: 'Tap 🎤 and keep going!' }[st] || ''; };
    const step = async () => { if (done) return; n++; meter.children[n - 1] && meter.children[n - 1].classList.add('on'); big.animate([{ transform: 'scale(1.18)' }, { transform: 'scale(1)' }], { duration: 260 }); onBeat(n);
      if (n >= count) { done = true; clearTimeout(idleT); closeMic(); await win(); hideTask(); res({ first: true }); } };
    big.onclick = () => { if (Mic.want && micOn() && !denied) return; sfx('tap'); step(); };   // (taps count only while the mic is not in use)
    const listen = () => { if (done || !micOn()) { state(micOn() ? 'off' : 'denied'); return; } clearTimeout(idleT); idleT = setTimeout(() => { closeMic(); state('off'); }, idle);
      openMic((cands, final, i) => { if (done) return; let c = 0; for (const words of cands) c = Math.max(c, words.filter(w => same(target, w, false) || (target === 'paddle' && /^(pad|paddle|paddles|patel|petal|battle|paddy)$/.test(w))).length);
        const was = per.get(i) || 0; if (c > was) { per.set(i, c); for (let k = 0; k < c - was; k++) step(); } }, state); };
    orb.onclick = () => { if (done) return; if (Mic.want) { closeMic(); state('off'); } else { if (!micOn()) setMic(true); listen(); } };
    window.__solve = () => { while (!done) step(); };
    task(prompt, meter, big, h('div', { class: 'mic-row' }, orb, h('div', { class: 'mic-col' }, status)));
    if (micOn()) { status.textContent = 'Get ready…'; Promise.race([say(prompt, { queue: true }), wait(6000)]).then(() => { if (!done) listen(); }); } else state('denied');
  });
}
