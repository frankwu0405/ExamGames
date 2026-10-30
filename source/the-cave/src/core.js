// Core: saved progress, sound, read-aloud and small DOM helpers for The Cave.
// Uses its own save key so it can never touch Pebble Town's progress.
const KEY = 'theCave_v1';
const fresh = () => ({ name: '', stops: {}, cards: {}, stars: {}, misses: {}, ep: 1,
  settings: { read: true, sfx: true, rate: 0.85, voice: '' } });
export let S = fresh();
export function load() {
  try { const raw = localStorage.getItem(KEY); if (raw) S = Object.assign(fresh(), JSON.parse(raw)); } catch (e) { }
  S.settings = Object.assign(fresh().settings, S.settings || {});
  if (!S.name) { try { const p = JSON.parse(localStorage.getItem('pebbleTown_v1') || '{}'); if (p.name) S.name = p.name; } catch (e) { } }
}
export function save() { S.savedAt = Date.now(); try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { } }
export function miss(word) { S.misses[word] = (S.misses[word] || 0) + 1; save(); }

// ---------------------------------------------------------------- audio
let AC = null, master = null;
export function audioInit() {
  if (AC) { if (AC.state === 'suspended') AC.resume(); return; }
  try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
  master = AC.createGain(); master.gain.value = 0.55; master.connect(AC.destination);
}
function tone(f, t0, dur, { type = 'sine', vol = 0.3, to = null, attack = 0.005 } = {}) {
  if (!AC) return; const o = AC.createOscillator(), g = AC.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t0); if (to) o.frequency.exponentialRampToValueAtTime(to, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + attack); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g); g.connect(master); o.start(t0); o.stop(t0 + dur + 0.05);
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
    case 'pop': tone(420, t, 0.09, { vol: 0.25, to: 900 }); break;
    case 'good': tone(784, t, 0.18, { type: 'triangle', vol: 0.25 }); tone(1175, t + 0.09, 0.28, { type: 'triangle', vol: 0.22 }); break;
    case 'great': [523, 659, 784, 1047].forEach((f, i) => tone(f, t + i * 0.07, 0.3, { type: 'triangle', vol: 0.22 })); break;
    case 'bad': tone(220, t, 0.22, { vol: 0.3, to: 150 }); break;
    case 'bark': [0, 0.18].forEach(d => { tone(520, t + d, 0.09, { type: 'square', vol: 0.08, to: 300 }); noise(t + d, 0.08, { vol: 0.15, f: 900, q: 3 }); }); break;
    case 'whine': tone(900, t, 0.5, { vol: 0.08, to: 600 }); break;
    case 'click': noise(t, 0.03, { vol: 0.5, f: 4000, q: 4 }); tone(1800, t, 0.03, { type: 'square', vol: 0.05 }); break;
    case 'rumble': noise(t, 2.2, { vol: 0.55, f: 90, q: 0.6 }); noise(t + 0.3, 1.6, { vol: 0.3, f: 160, q: 0.7 }); break;
    case 'crash': noise(t, 0.6, { vol: 0.45, f: 400, q: 0.5, to: 120 }); break;
    case 'whoosh': noise(t, 0.5, { vol: 0.22, f: 400, to: 3000, q: 0.8 }); break;
    case 'clack': [0, 0.11].forEach(d => noise(t + d, 0.04, { vol: 0.2, f: 1800, q: 2 })); break;
    case 'chime': [1319, 1568, 1976].forEach((f, i) => tone(f, t + i * 0.06, 0.6, { vol: 0.06 })); break;
    case 'glow': tone(523, t, 1.2, { vol: 0.07, to: 1046, attack: 0.3 }); tone(784, t + 0.1, 1.2, { vol: 0.05, attack: 0.3 }); break;
    case 'card': [784, 988, 1175, 1568].forEach((f, i) => tone(f, t + i * 0.09, 0.5, { type: 'triangle', vol: 0.12 })); break;
    case 'fall': tone(700, t, 1.6, { vol: 0.12, to: 120 }); noise(t, 1.6, { vol: 0.2, f: 600, to: 200 }); break;
  }
}

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
if (window.speechSynthesis) speechSynthesis.onvoiceschanged = pickVoice;
let speakToken = 0;
export function say(text, { force, onWord } = {}) {
  return new Promise(res => {
    if (!window.speechSynthesis || !text || (!force && !S.settings.read)) return res();
    const my = ++speakToken; speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text.replace(/_{2,}/g, 'blank'));
    if (!voice) pickVoice(); if (voice) u.voice = voice;
    u.lang = (voice && voice.lang) || 'en-US'; u.rate = S.settings.rate; u.pitch = 1.05;
    if (onWord) u.onboundary = e => { if (e.name === 'word' || e.charIndex != null) onWord(e.charIndex); };
    let done = false; const fin = () => { if (!done) { done = true; res(); } };
    u.onend = fin; u.onerror = fin; setTimeout(fin, 2500 + text.length * 110);
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
    else if (k === 'html') e.innerHTML = v; else if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else e.setAttribute(k, v);
  }
  for (const k of kids.flat()) if (k != null && k !== false) e.append(k.nodeType ? k : document.createTextNode(String(k)));
  return e;
}
export const $ = (s, r = document) => r.querySelector(s);
export const wait = ms => new Promise(r => setTimeout(r, ms));
export const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
export function shake(el) { el.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-9px)' }, { transform: 'translateX(9px)' }, { transform: 'translateX(0)' }], { duration: 300 }); }
export function setVoice(name) { S.settings.voice = name; save(); voice = null; pickVoice(); }
export const currentVoice = () => { if (!voice) pickVoice(); return voice; };
