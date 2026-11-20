// Core: saved progress, sound, speech, Pip, rewards and small UI helpers.
import { shuffle } from './mathgen.js';

// ---------------------------------------------------------------- state
const KEY = 'pebbleTown_v1';
const fresh = () => ({ name: '', coins: 0, items: {}, bricks: {}, decor: [], storm: { best: 0, runs: 0, won: 0 },
  settings: { music: true, sfx: true, rate: 0.85, voice: '', read: false }, intro: false, storyVer: 2, lastArea: '', story: { finale: 0, quests: 0 } });
export let S = fresh();
export function load() {
  try { const raw = localStorage.getItem(KEY); if (raw) { const old = JSON.parse(raw); S = Object.assign(fresh(), old); if (!old.storyVer) { S.intro = false; S.storyVer = 2; } } } catch (e) { /* private mode: play without saving */ }
  S.settings = Object.assign(fresh().settings, S.settings || {}); S.story = Object.assign(fresh().story, S.story || {}); S.storm = Object.assign(fresh().storm, S.storm || {});
}
let saveHook = null; export const onSave = f => { saveHook = f; };
export function save() { S.savedAt = Date.now(); try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { } if (saveHook) saveHook(); }
// ---------------------------------------------------------------- keeping progress safe
// Ask the browser not to auto-clear this site's storage. Returns true/false (or null if the browser can't say).
export async function protectStorage() { try { if (navigator.storage && navigator.storage.persist) return (await navigator.storage.persisted()) || await navigator.storage.persist(); } catch (e) { } return null; }
export async function isProtected() { try { return navigator.storage && navigator.storage.persisted ? await navigator.storage.persisted() : null; } catch (e) { return null; } }
// A save code is the whole progress as text: it can be copied, emailed, or kept in a file.
// ---- backup links: the whole progress packed small (items as [box, right, wrong, ...last wrong tries]) and compressed
const b64u = bytes => { let s = ''; bytes.forEach(b => s += String.fromCharCode(b)); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
const unb64u = t => { const s = atob(t.replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from(s, c => c.charCodeAt(0)); };
async function pipeBytes(bytes, stream) { const r = new Blob([bytes]).stream().pipeThrough(stream); return new Uint8Array(await new Response(r).arrayBuffer()); }
export async function packSave() {
  const o = JSON.parse(JSON.stringify(S)); delete o.savedAt;
  o.items = Object.fromEntries(Object.entries(S.items).map(([k, r]) => [k, [r.box, r.c, r.w, ...(r.miss || [])]]));
  const raw = new TextEncoder().encode(JSON.stringify(o));
  if (window.CompressionStream) { try { return 'z' + b64u(await pipeBytes(raw, new CompressionStream('deflate-raw'))); } catch (e) { } }
  return 'j' + b64u(raw);
}
export async function unpackSave(t) {
  t = String(t).trim(); let bytes = unb64u(t.slice(1));
  if (t[0] === 'z') bytes = await pipeBytes(bytes, new DecompressionStream('deflate-raw'));
  const o = JSON.parse(new TextDecoder().decode(bytes));
  o.items = Object.fromEntries(Object.entries(o.items || {}).map(([k, a]) => Array.isArray(a) ? [k, { box: a[0], c: a[1], w: a[2], miss: a.slice(3), t: 0 }] : [k, a]));
  return o;
}
export async function backupLink() { return location.origin + location.pathname + '?r=' + await packSave(); }
// Ask is.gd (a free link shortener, no account) for a short link. Falls back to the long link if it can't.
export function shortenLink(long) {
  return new Promise((res, rej) => {
    if (long.length > 4900) return rej(new Error('too long'));
    const cb = '__isgd' + Date.now(); const sc = document.createElement('script'); const done = () => { delete window[cb]; sc.remove(); clearTimeout(tm); };
    const tm = setTimeout(() => { done(); rej(new Error('timeout')); }, 9000);
    window[cb] = d => { done(); d && d.shorturl ? res(d.shorturl) : rej(new Error(d && d.errormessage || 'failed')); };
    sc.onerror = () => { done(); rej(new Error('offline')); };
    sc.src = 'https://is.gd/create.php?format=json&callback=' + cb + '&url=' + encodeURIComponent(long); document.head.append(sc);
  });
}
const keepPrev = () => { try { const cur = localStorage.getItem(KEY); if (cur) localStorage.setItem(KEY + '_before_restore', cur); } catch (e) { } };
export function writeSave(obj) { if (!obj || typeof obj !== 'object' || !obj.items) throw new Error('not a Pebble Town save'); keepPrev(); localStorage.setItem(KEY, JSON.stringify(obj)); return obj; }
export const exportSave = () => 'PEBBLE1:' + btoa(unescape(encodeURIComponent(JSON.stringify(S))));
export function importSave(text) {
  let t = String(text || '').trim(); if (!t) throw new Error('empty');
  let obj; if (t.startsWith('PEBBLE1:')) obj = JSON.parse(decodeURIComponent(escape(atob(t.slice(8).replace(/\s+/g, ''))))); else obj = JSON.parse(t);
  if (!obj || typeof obj !== 'object' || !obj.items) throw new Error('not a Pebble Town save');
  keepPrev(); localStorage.setItem(KEY, JSON.stringify(obj)); return obj;
}
export function resetAll() { S = fresh(); save(); }

// Item records: c = right, w = wrong, box = 0–3 mastery, miss = last wrong tries
export function rec(id) { return S.items[id] || (S.items[id] = { c: 0, w: 0, box: 0, miss: [], t: 0 }); }
export function mark(id, ok, firstTry = true, wrongAnswer) {
  const r = rec(id); r.t = Date.now(); if (!ok && firstTry) logOops(wrongAnswer);
  if (ok) { r.c++; if (firstTry) r.box = Math.min(3, r.box + 1); }
  else { r.w++; r.box = Math.max(0, r.box - 1); if (wrongAnswer != null) { r.miss.unshift(String(wrongAnswer)); r.miss = r.miss.slice(0, 4); } }
  save();
}
// ---------------------------------------------------------------- mistakes log ("Oops Book")
// Every question says what it is (setQ) so a wrong answer can be saved and played again later.
let QCTX = null, REPLAYING = false;
export const REPLAY = {};                       // kind -> (host, data) => Promise<firstTryRight>
export function setQ(kind, data, label) { QCTX = { kind, data, label }; }
export function setQSoft(kind, data, label) { if (!QCTX) QCTX = { kind, data, label }; } // widgets: only if the activity didn't say
export function clearQ() { QCTX = null; }
export const isReplaying = () => REPLAYING;
function logOops(wrong) {
  if (!QCTX || REPLAYING || !REPLAY[QCTX.kind]) return;
  const key = QCTX.kind + ':' + JSON.stringify(QCTX.data).replace(/<[^>]*>/g, '').slice(0, 160);
  S.oops = S.oops || []; let e = S.oops.find(x => x.key === key);
  if (!e) { e = { key, kind: QCTX.kind, data: QCTX.data, label: QCTX.label || '', area: S.lastArea || '', n: 0 }; S.oops.unshift(e); }
  e.n++; e.t = Date.now(); if (wrong != null) e.wrong = String(wrong).slice(0, 60);
  S.oops = S.oops.slice(0, 80);
}
export async function replayOops(host, e) {
  REPLAYING = true; try { return await REPLAY[e.kind](host, e.data); } finally { REPLAYING = false; }
}
export function oopsFixed(e) { S.oops = (S.oops || []).filter(x => x.key !== e.key); S.fixed = (S.fixed || 0) + 1; save(); }
// Save a piece of the screen as plain HTML (pictures are stored by name, not as image data)
export function snapHTML(el) { if (!el) return ''; const c = el.cloneNode(true); c.querySelectorAll('img[data-pic]').forEach(i => i.removeAttribute('src')); c.querySelectorAll('canvas,script').forEach(x => x.remove()); return c.innerHTML.length > 20000 ? '' : c.innerHTML; }
export function unsnap(html) { const d = document.createElement('div'); d.className = 'oops-ctx'; d.innerHTML = html; d.querySelectorAll('img[data-pic]').forEach(i => { i.src = IMG[i.dataset.pic] || ''; }); d.setAttribute('inert', ''); return d; }
export const stripPics = html => String(html ?? '').replace(/ src="data:[^"]*"(?= data-pic=)/g, '');
export const restorePics = html => String(html ?? '').replace(/<img data-pic="([^"]+)"/g, (m, k) => `<img src="${IMG[k] || ''}" data-pic="${k}"`);
export const plainText = html => { const d = document.createElement('div'); d.innerHTML = String(html).replace(/<br\s*\/?>/g, ' '); return d.textContent.replace(/\s+/g, ' ').trim(); };

export function addBricks(area, n = 1) { S.bricks[area] = (S.bricks[area] || 0) + n; save(); }

// Choose what to practise: unseen and shaky items first, a little randomness on top
export function choose(pool, n, idOf) {
  const scored = pool.map(x => { const r = S.items[idOf(x)]; const box = r ? r.box : 0; const recentMiss = r && r.w > r.c ? -0.6 : 0;
    return { x, s: box + recentMiss + Math.random() * 1.2 }; });
  scored.sort((a, b) => a.s - b.s);
  return shuffle(scored.slice(0, n).map(o => o.x));
}

// ---------------------------------------------------------------- audio
let AC = null, master = null, musicGain = null, musicTimer = null;
export function audioInit() {
  if (AC) { if (AC.state === 'suspended') AC.resume(); return; }
  try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
  master = AC.createGain(); master.gain.value = 0.55; master.connect(AC.destination);
  musicGain = AC.createGain(); musicGain.gain.value = 0.0; musicGain.connect(master);
  if (S.settings.music) musicStart();
}
function tone(f, t0, dur, { type = 'sine', vol = 0.3, to = null, attack = 0.005, dest = master } = {}) {
  if (!AC) return; const o = AC.createOscillator(), g = AC.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t0); if (to) o.frequency.exponentialRampToValueAtTime(to, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + attack); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g); g.connect(dest); o.start(t0); o.stop(t0 + dur + 0.05);
}
function noise(t0, dur, { vol = 0.25, f = 1200, q = 1, to = null } = {}) {
  if (!AC) return; const len = Math.floor(AC.sampleRate * dur), buf = AC.createBuffer(1, len, AC.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const s = AC.createBufferSource(); s.buffer = buf; const bp = AC.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.setValueAtTime(f, t0); bp.Q.value = q;
  if (to) bp.frequency.exponentialRampToValueAtTime(to, t0 + dur);
  const g = AC.createGain(); g.gain.value = vol; s.connect(bp); bp.connect(g); g.connect(master); s.start(t0);
}
export function sfx(name) {
  if (!AC || !S.settings.sfx) return; const t = AC.currentTime;
  switch (name) {
    case 'tap': tone(660, t, 0.06, { type: 'triangle', vol: 0.12 }); break;
    case 'pop': tone(420, t, 0.09, { type: 'sine', vol: 0.25, to: 900 }); break;
    case 'place': tone(300, t, 0.08, { type: 'triangle', vol: 0.2, to: 520 }); noise(t, 0.05, { vol: 0.12, f: 2500 }); break;
    case 'good': tone(784, t, 0.18, { type: 'triangle', vol: 0.25 }); tone(1175, t + 0.09, 0.28, { type: 'triangle', vol: 0.22 }); break;
    case 'great': [523, 659, 784, 1047].forEach((f, i) => tone(f, t + i * 0.07, 0.3, { type: 'triangle', vol: 0.22 })); break;
    case 'bad': tone(220, t, 0.22, { type: 'sine', vol: 0.3, to: 150 }); tone(233, t + 0.02, 0.2, { type: 'triangle', vol: 0.08, to: 160 }); break;
    case 'coin': tone(1319, t, 0.08, { type: 'square', vol: 0.06 }); tone(1760, t + 0.07, 0.22, { type: 'square', vol: 0.06 }); break;
    case 'hammer': [0, 0.16, 0.32].forEach(d => { noise(t + d, 0.07, { vol: 0.35, f: 900, q: 2 }); tone(140, t + d, 0.08, { vol: 0.25 }); }); break;
    case 'whoosh': noise(t, 0.35, { vol: 0.2, f: 400, to: 3000, q: 0.8 }); break;
    case 'toot': tone(392, t, 0.35, { type: 'sawtooth', vol: 0.07 }); tone(494, t, 0.35, { type: 'sawtooth', vol: 0.06 }); tone(392, t + 0.42, 0.5, { type: 'sawtooth', vol: 0.07 }); tone(494, t + 0.42, 0.5, { type: 'sawtooth', vol: 0.06 }); break;
    case 'chug': [0, .18, .36, .54].forEach(d => noise(t + d, 0.09, { vol: 0.16, f: 700, q: 1.5 })); break;
    case 'flip': noise(t, 0.08, { vol: 0.15, f: 3000, q: 0.7 }); break;
    case 'build': [262, 330, 392, 523, 659].forEach((f, i) => tone(f, t + i * 0.09, 0.25, { type: 'square', vol: 0.05 })); noise(t, 0.6, { vol: 0.12, f: 300, to: 1500 }); break;
    case 'fanfare': [[523, 0], [659, .12], [784, .24], [1047, .36], [784, .6], [1047, .72]].forEach(([f, d]) => { tone(f, t + d, 0.35, { type: 'square', vol: 0.06 }); tone(f / 2, t + d, 0.35, { type: 'triangle', vol: 0.12 }); }); break;
    case 'thunder': noise(t, 1.6, { vol: 0.4, f: 120, q: 0.5 }); break;
  }
}
// Gentle looping tune (pentatonic music box)
const MEL = [67, 69, 72, 69, 67, 64, 62, 64, 67, 72, 74, 72, 69, 67, 64, 67, 60, 62, 64, 67, 69, 67, 64, 62, 64, 67, 69, 72, 74, 72, 69, 67];
const BASS = [48, 48, 45, 45, 41, 41, 43, 43];
export function musicStart() {
  if (!AC || musicTimer) return;
  musicGain.gain.cancelScheduledValues(AC.currentTime); musicGain.gain.linearRampToValueAtTime(0.5, AC.currentTime + 1.5);
  let step = 0, next = AC.currentTime + 0.1; const beat = 0.34;
  musicTimer = setInterval(() => {
    while (next < AC.currentTime + 0.4) {
      const m = MEL[step % MEL.length]; const f = 440 * Math.pow(2, (m - 69) / 12);
      if (step % 8 !== 7) tone(f, next, beat * 1.6, { type: 'sine', vol: 0.05, dest: musicGain, attack: 0.01 });
      if (step % 4 === 0) { const b = BASS[(step / 4) % BASS.length]; tone(440 * Math.pow(2, (b - 69) / 12), next, beat * 3.5, { type: 'triangle', vol: 0.06, dest: musicGain, attack: 0.02 }); }
      next += beat; step++;
    }
  }, 120);
}
export function musicStop() { if (!musicTimer) return; clearInterval(musicTimer); musicTimer = null; if (AC) musicGain.gain.linearRampToValueAtTime(0, AC.currentTime + 0.4); }

// ---------------------------------------------------------------- speech
let voice = null;
// Rank voices: natural/neural online voices (Edge), Apple Premium/Enhanced, Google, then the rest. Novelty voices last.
const NOVELTY = /Albert|Bad News|Bahh|Bells|Boing|Bubbles|Cellos|Good News|Jester|Organ|Superstar|Trinoids|Whisper|Wobble|Zarvox|Fred|Junior|Ralph|Kathy|Grandma|Grandpa|Eddy|Flo|Reed|Rocko|Sandy|Shelley/i;
export function voiceScore(v) {
  const n = v.name; let s = 0;
  if (/^en[-_]US/i.test(v.lang)) s += 3; else if (/^en[-_](GB|AU|CA|IE|NZ)/i.test(v.lang)) s += 2;
  if (/Natural|Neural/i.test(n)) s += 20; if (/Premium/i.test(n)) s += 16; if (/Enhanced/i.test(n)) s += 13;
  if (/Google US English/i.test(n)) s += 9; else if (/Google/i.test(n)) s += 6;
  if (/Aria|Jenny|Ava|Emma|Michelle|Samantha|Allison|Libby|Sonia/i.test(n)) s += 4;
  if (NOVELTY.test(n)) s -= 40;
  return s;
}
export function englishVoices() { return ((window.speechSynthesis && speechSynthesis.getVoices()) || []).filter(v => /^en(-|_)/i.test(v.lang)).sort((a, b) => voiceScore(b) - voiceScore(a)); }
function pickVoice() {
  const vs = (window.speechSynthesis && speechSynthesis.getVoices()) || [];
  if (S.settings.voice) { const v = vs.find(v => v.name === S.settings.voice); if (v) return (voice = v); }
  voice = englishVoices()[0] || null; return voice;
}
if (window.speechSynthesis) { speechSynthesis.onvoiceschanged = pickVoice; }
export function setVoice(name) { S.settings.voice = name; save(); voice = null; pickVoice(); }
let speakToken = 0;
export function say(text, { rate, force } = {}) {
  return new Promise(res => {
    if (!window.speechSynthesis || !text) return res();
    if (!force && !S.settings.read) return res();
    const my = ++speakToken; speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text.replace(/___/g, 'blank'));
    if (!voice) pickVoice(); if (voice) u.voice = voice;
    u.lang = (voice && voice.lang) || 'en-US'; u.rate = rate || S.settings.rate; u.pitch = 1.05;
    let done = false; const fin = () => { if (!done) { done = true; res(); } };
    u.onend = fin; u.onerror = fin; setTimeout(fin, 2500 + text.length * 120);
    setTimeout(() => { if (my === speakToken) speechSynthesis.speak(u); }, 40);
  });
}
export function hush() { speakToken++; if (window.speechSynthesis) speechSynthesis.cancel(); }

// ---------------------------------------------------------------- DOM helpers
export function h(tag, attrs = {}, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') e.className = v; else if (k === 'style' && typeof v === 'object') Object.assign(e.style, v);
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else if (k === 'html') e.innerHTML = v; else e.setAttribute(k, v);
  }
  for (const k of kids.flat()) if (k != null && k !== false) e.append(k.nodeType ? k : document.createTextNode(k));
  return e;
}
export const $ = (s, r = document) => r.querySelector(s);
export const wait = ms => new Promise(r => setTimeout(r, ms));
export function speakBtn(text, cls = '') {
  return h('button', { class: 'speak ' + cls, 'aria-label': 'Hear it', onclick: e => { e.stopPropagation(); sfx('tap'); say(typeof text === 'function' ? text() : text, { force: true }); } },
    h('span', { html: SPEAKER_SVG }));
}
export const SPEAKER_SVG = '<svg viewBox="0 0 40 40" width="100%" height="100%"><path d="M7 15h7l9-8v26l-9-8H7z" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M28 13c3 4 3 10 0 14M32 9c5 6 5 16 0 22" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>';

// ---------------------------------------------------------------- Pip (the helper bird)
export const PIP_SVG = `<svg viewBox="0 0 120 120" class="pip-svg"><defs>
<radialGradient id="pipBody" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#9FE0F2"/><stop offset=".6" stop-color="#4FB3D9"/><stop offset="1" stop-color="#2C7FA8"/></radialGradient>
<radialGradient id="pipBelly" cx="45%" cy="40%" r="60%"><stop offset="0" stop-color="#FFFBEA"/><stop offset="1" stop-color="#F4DFA8"/></radialGradient>
<linearGradient id="pipHat" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE07A"/><stop offset="1" stop-color="#F2B62B"/></linearGradient></defs>
<ellipse cx="60" cy="112" rx="30" ry="5" fill="#000" opacity=".15"/>
<g class="pip-bob"><path d="M30 78 Q14 72 18 58 Q30 66 38 66Z" fill="#2C7FA8" class="pip-wing"/>
<ellipse cx="60" cy="72" rx="34" ry="32" fill="url(#pipBody)" stroke="#2E2A4F" stroke-width="3"/>
<ellipse cx="62" cy="80" rx="20" ry="18" fill="url(#pipBelly)"/>
<g class="pip-eyes"><ellipse cx="50" cy="62" rx="6" ry="7.5" fill="#fff" stroke="#2E2A4F" stroke-width="2"/><ellipse cx="72" cy="62" rx="6" ry="7.5" fill="#fff" stroke="#2E2A4F" stroke-width="2"/>
<circle cx="51.5" cy="63.5" r="3.2" fill="#2E2A4F"/><circle cx="73.5" cy="63.5" r="3.2" fill="#2E2A4F"/><circle cx="52.5" cy="62" r="1.1" fill="#fff"/><circle cx="74.5" cy="62" r="1.1" fill="#fff"/></g>
<path d="M56 70 L68 70 L62 79Z" fill="#F08A2E" stroke="#2E2A4F" stroke-width="2" stroke-linejoin="round" class="pip-beak"/>
<ellipse cx="42" cy="73" rx="5" ry="3" fill="#F49AA4" opacity=".7"/><ellipse cx="80" cy="73" rx="5" ry="3" fill="#F49AA4" opacity=".7"/>
<path d="M30 48 Q60 14 90 48 Z" fill="url(#pipHat)" stroke="#2E2A4F" stroke-width="3" stroke-linejoin="round"/><path d="M24 49 Q60 40 96 49 Q96 55 90 55 Q60 48 30 55 Q24 55 24 49Z" fill="#F2B62B" stroke="#2E2A4F" stroke-width="3"/>
<rect x="55" y="24" width="10" height="20" rx="3" fill="#FFE9A6" stroke="#2E2A4F" stroke-width="2"/>
<path d="M50 102 l-4 8 M50 102 l2 8 M70 102 l-2 8 M70 102 l4 8" stroke="#F08A2E" stroke-width="3" stroke-linecap="round"/></g></svg>`;

let pipEl, bubbleEl, pipTimer;
export function pipMount() {
  pipEl = h('div', { id: 'pip', html: PIP_SVG, onclick: () => { sfx('pop'); pipEl.classList.remove('hop'); void pipEl.offsetWidth; pipEl.classList.add('hop'); if (bubbleEl.dataset.say) { bubbleEl.classList.remove('hidden'); say(bubbleEl.dataset.say, { force: true }); } } });
  bubbleEl = h('div', { id: 'bubble', class: 'hidden', title: 'Tap to hear it', onclick: () => { clearTimeout(pipTimer); say(bubbleEl.dataset.say, { force: true }); pipTimer = setTimeout(() => bubbleEl.classList.add('hidden'), 5000); } });
  document.body.append(pipEl, bubbleEl);
}
export function pip(text, { speak = true, mood = '', hold = 0, speech } = {}) {
  if (!pipEl) return Promise.resolve();
  clearTimeout(pipTimer); pipEl.className = mood; void pipEl.offsetWidth; pipEl.classList.add('hop');
  bubbleEl.textContent = text; bubbleEl.dataset.say = speech || text; bubbleEl.classList.remove('hidden');
  bubbleEl.prepend(h('span', { class: 'bubble-spk', html: SPEAKER_SVG })); bubbleEl.append(h('button', { class: 'bubble-x', 'aria-label': 'Close', onclick: e => { e.stopPropagation(); clearTimeout(pipTimer); bubbleEl.classList.add('hidden'); } }, '×'));
  const p = speak && S.settings.read ? say(speech || text) : wait(speak ? Math.min(4200, 900 + text.length * 38) : 0);
  pipTimer = setTimeout(() => bubbleEl.classList.add('hidden'), Math.min(6000, hold || 2400 + text.length * 50));
  return p;
}
export function pipHide() { if (bubbleEl) bubbleEl.classList.add('hidden'); }
export function pipVisible(v) { if (pipEl) { pipEl.style.display = v ? '' : 'none'; if (!v) pipHide(); } }

const CHEERS = ['Great job!', 'You got it!', 'Super!', 'Yes! Well done!', 'Wow, nice!', 'Perfect!', 'Brilliant!', 'Way to go!'];
const TRY = ['Almost! Try again.', 'Oops! Look again.', 'Not quite. You can do it!', 'Hmm, try one more time.'];
export const cheer = () => CHEERS[Math.floor(Math.random() * CHEERS.length)];
export const tryAgain = () => TRY[Math.floor(Math.random() * TRY.length)];

// ---------------------------------------------------------------- rewards & effects
let coinEl;
export function bindCoinCounter(el) { coinEl = el; renderCoins(); }
export function renderCoins() { document.querySelectorAll('.coin-count').forEach(e => e.textContent = S.coins); }
export function giveCoins(n, fromEl) {
  S.coins += n; save();
  const target = document.querySelector('.screen:not(.hidden) .coin-count') || document.querySelector('#hud .coin-count');
  const tr = target ? target.getBoundingClientRect() : { left: innerWidth - 80, top: 20, width: 20, height: 20 };
  const fr = fromEl ? fromEl.getBoundingClientRect() : { left: innerWidth / 2, top: innerHeight / 2, width: 0, height: 0 };
  for (let i = 0; i < Math.min(n, 6); i++) {
    const c = h('div', { class: 'fly-coin' }); document.body.append(c);
    const sx = fr.left + fr.width / 2 + (Math.random() * 40 - 20), sy = fr.top + fr.height / 2;
    c.style.left = sx + 'px'; c.style.top = sy + 'px';
    const dx = tr.left + tr.width / 2 - sx, dy = tr.top + tr.height / 2 - sy;
    c.animate([{ transform: 'translate(-50%,-50%) scale(.6)', opacity: 0 }, { transform: `translate(calc(-50% + ${dx * .2}px), calc(-50% + ${dy * .2 - 60}px)) scale(1.1)`, opacity: 1, offset: .3 },
      { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(.7)`, opacity: 1 }], { duration: 750 + i * 90, easing: 'cubic-bezier(.5,0,.6,1)' })
      .onfinish = () => { c.remove(); if (i === 0) { sfx('coin'); renderCoins(); target && target.parentElement.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.25)' }, { transform: 'scale(1)' }], { duration: 300 }); } };
  }
  setTimeout(renderCoins, 1300);
}
const CONF = ['#EF5B4C', '#FFC94A', '#3E9B5C', '#4FB3D9', '#7A5BA6', '#F08A2E'];
export function confetti(x = innerWidth / 2, y = innerHeight / 3, n = 40) {
  for (let i = 0; i < n; i++) {
    const p = h('div', { class: 'confetti' }); p.style.background = CONF[i % CONF.length]; p.style.left = x + 'px'; p.style.top = y + 'px';
    if (i % 3 === 0) p.style.borderRadius = '50%'; document.body.append(p);
    const a = Math.random() * Math.PI * 2, v = 120 + Math.random() * 260;
    p.animate([{ transform: 'translate(0,0) rotate(0) rotateX(0)', opacity: 1 },
      { transform: `translate(${Math.cos(a) * v}px, ${Math.sin(a) * v * .6 + 340}px) rotate(${Math.random() * 720}deg) rotateX(${Math.random() * 720}deg)`, opacity: 0 }],
      { duration: 1300 + Math.random() * 700, easing: 'cubic-bezier(.2,.6,.4,1)' }).onfinish = () => p.remove();
  }
}
export function burst(el, text, color) {
  const r = el.getBoundingClientRect(); const b = h('div', { class: 'burst' }, text);
  if (color) b.style.color = color; b.style.left = (r.left + r.width / 2) + 'px'; b.style.top = r.top + 'px'; document.body.append(b);
  b.animate([{ transform: 'translate(-50%,0) scale(.5)', opacity: 0 }, { transform: 'translate(-50%,-30px) scale(1.15)', opacity: 1, offset: .3 }, { transform: 'translate(-50%,-70px) scale(1)', opacity: 0 }], { duration: 1100 }).onfinish = () => b.remove();
}
export function shake(el) { el.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-9px)' }, { transform: 'translateX(9px)' }, { transform: 'translateX(-6px)' }, { transform: 'translateX(4px)' }, { transform: 'translateX(0)' }], { duration: 420 }); }
export function pulse(el) { el.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.12)' }, { transform: 'scale(1)' }], { duration: 380, easing: 'ease-out' }); }

// Streak meter shared by all areas
let streak = 0;
export function streakHit(ok) {
  streak = ok ? streak + 1 : 0;
  document.querySelectorAll('.streak-fill').forEach(f => f.style.width = Math.min(100, streak * 20) + '%');
  document.querySelectorAll('.streak').forEach(s => s.classList.toggle('hot', streak >= 5));
  if (ok && streak > 0 && streak % 5 === 0) { sfx('great'); confetti(innerWidth / 2, 90, 30); giveCoins(5); pip(`${streak} in a row! Bonus coins!`, { mood: 'happy' }); return true; }
  return false;
}
export function streakReset() { streak = 0; streakHit(false); }

// Things to undo when a question or place closes (key listeners, timers)
const cleanups = [];
export function onClear(f) { cleanups.push(f); }
export function runClear() { while (cleanups.length) { try { cleanups.pop()(); } catch (e) { } } }

// ---------------------------------------------------------------- pictures (openly licensed images from Openverse, embedded)
import { IMG } from './images.gen.js';
export function pic(key, size = 120, cls = '') {
  const src = IMG[key]; const el = document.createElement('span'); el.className = 'photo ' + cls;
  if (src) { const im = document.createElement('img'); im.src = src; im.dataset.pic = key; im.alt = ''; im.draggable = false; el.append(im); } else { el.classList.add('missing'); el.textContent = '?'; }
  el.style.width = el.style.height = size + 'px'; return el;
}
export const hasPic = key => !!IMG[key];
export const picHTML = (key, size = 120, cls = "") => pic(key, size, cls).outerHTML;
