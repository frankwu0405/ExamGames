// Background music, written in code (no audio files): a sea shanty for the map and a mood for each place.
import { S, onAudio } from './core.js';

let AC = null, bus = null, duck = null, timer = null, theme = null, want = null, nextT = 0, step = 0;
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
onAudio((ctx, master) => {
  AC = ctx; bus = AC.createGain(); bus.gain.value = 0; duck = AC.createGain(); duck.gain.value = 1;
  bus.connect(duck); duck.connect(master);
  window.__duck = on => { if (!duck) return; duck.gain.cancelScheduledValues(AC.currentTime); duck.gain.setTargetAtTime(on ? 0.4 : 1, AC.currentTime, 0.15); };
  if (want) playMusic(want);
});

// ---------------------------------------------------------------- little instruments
function env(g, t, a, peak, d) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); }
function accordion(m, t, dur, vol = 0.05) {   // two detuned saws through a soft filter, with a little wobble
  const f = AC.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1700; f.Q.value = 0.7; const g = AC.createGain(); f.connect(g); g.connect(bus);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.04); g.gain.setValueAtTime(vol, t + dur * 0.8); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  [-7, 7].forEach(c => { const o = AC.createOscillator(); o.type = 'sawtooth'; o.frequency.value = mtof(m); o.detune.value = c; const lfo = AC.createOscillator(), lg = AC.createGain(); lfo.frequency.value = 5.5; lg.gain.value = 6; lfo.connect(lg); lg.connect(o.detune); o.connect(f); o.start(t); lfo.start(t); o.stop(t + dur + 0.05); lfo.stop(t + dur + 0.05); });
}
function pluck(m, t, vol = 0.12, type = 'triangle', dec = 0.35) { const o = AC.createOscillator(), g = AC.createGain(); o.type = type; o.frequency.value = mtof(m); env(g, t, 0.005, vol, dec); o.connect(g); g.connect(bus); o.start(t); o.stop(t + dec + 0.05); }
function flute(m, t, dur, vol = 0.07) { const o = AC.createOscillator(), g = AC.createGain(); o.type = 'sine'; o.frequency.value = mtof(m);
  const lfo = AC.createOscillator(), lg = AC.createGain(); lfo.frequency.value = 5; lg.gain.value = 4; lfo.connect(lg); lg.connect(o.detune);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.06); g.gain.setValueAtTime(vol, t + dur * 0.7); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(bus); o.start(t); lfo.start(t); o.stop(t + dur + 0.05); lfo.stop(t + dur + 0.05); }
function bell(m, t, vol = 0.05) { const o = AC.createOscillator(), mo = AC.createOscillator(), mg = AC.createGain(), g = AC.createGain(); o.frequency.value = mtof(m); mo.frequency.value = mtof(m) * 3.5; mg.gain.value = mtof(m) * 0.8; mo.connect(mg); mg.connect(o.frequency); env(g, t, 0.005, vol, 2.6); o.connect(g); g.connect(bus); o.start(t); mo.start(t); o.stop(t + 2.7); mo.stop(t + 2.7); }
function noiseHit(t, { vol = 0.2, f = 100, q = 0.8, dec = 0.25, type = 'lowpass' } = {}) {
  const len = Math.floor(AC.sampleRate * dec), buf = AC.createBuffer(1, len, AC.sampleRate), d = buf.getChannelData(0); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
  const s = AC.createBufferSource(); s.buffer = buf; const fl = AC.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q; const g = AC.createGain(); g.gain.value = vol; s.connect(fl); fl.connect(g); g.connect(bus); s.start(t); }
function kick(t, vol = 0.35) { const o = AC.createOscillator(), g = AC.createGain(); o.frequency.setValueAtTime(130, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.18); env(g, t, 0.003, vol, 0.25); o.connect(g); g.connect(bus); o.start(t); o.stop(t + 0.3); }
let pad = null;
function padOn(notes, vol = 0.035) { padOff(); const g = AC.createGain(), f = AC.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 420; g.gain.value = 0.0001; g.gain.exponentialRampToValueAtTime(vol, AC.currentTime + 2.5);
  const lfo = AC.createOscillator(), lg = AC.createGain(); lfo.frequency.value = 0.08; lg.gain.value = 260; lfo.connect(lg); lg.connect(f.frequency); lfo.start();
  const os = notes.map((m, i) => { const o = AC.createOscillator(); o.type = 'sawtooth'; o.frequency.value = mtof(m); o.detune.value = (i % 2 ? 6 : -6); o.connect(f); o.start(); return o; }); f.connect(g); g.connect(bus); pad = { g, os: [...os, lfo] }; }
function padOff() { if (!pad) return; const p = pad; pad = null; p.g.gain.setTargetAtTime(0.0001, AC.currentTime, 0.6); setTimeout(() => p.os.forEach(o => { try { o.stop(); } catch (e) { } }), 3000); }

// ---------------------------------------------------------------- the pieces
// Map: an original pirate shanty in D minor, 6/8 — low accordion and fiddle, booming drum, stomping bass, a deep drone.
const SHANTY = {
  mel: [[57,1],[62,2],[62,1],[60,1],[58,1],[57,2],[55,1],[53,2],[55,1],[57,2],[58,1],[60,2],[57,1],[55,3],[50,3],
        [53,1],[55,2],[57,1],[58,1],[60,1],[62,2],[60,1],[58,2],[57,1],[55,2],[53,1],[52,2],[49,1],[50,6]],
  roots: [38, 38, 41, 43, 41, 46, 45, 38] };
function tom(t, vol = 0.3, f0 = 95) { const o = AC.createOscillator(), g = AC.createGain(); o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(48, t + 0.35); env(g, t, 0.004, vol, 0.45); o.connect(g); g.connect(bus); o.start(t); o.stop(t + 0.5); noiseHit(t, { vol: vol * 0.4, f: 180, dec: 0.2 }); }
function fiddle(m, t, dur, vol = 0.03) { const f = AC.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1400; f.Q.value = 0.8; const g = AC.createGain(); f.connect(g); g.connect(bus);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.08); g.gain.setValueAtTime(vol, t + dur * 0.75); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  const o = AC.createOscillator(); o.type = 'sawtooth'; o.frequency.value = mtof(m); const lfo = AC.createOscillator(), lg = AC.createGain(); lfo.frequency.value = 6; lg.gain.value = 12; lfo.connect(lg); lg.connect(o.detune); o.connect(f); o.start(t); lfo.start(t); o.stop(t + dur + 0.05); lfo.stop(t + dur + 0.05); }
function shanty(t, i) {
  const bar = Math.floor(i / 6) % 8, inBar = i % 6, root = SHANTY.roots[bar], B = 0.26;
  if (inBar === 0) { tom(t, 0.4); pluck(root - 12, t, 0.22, 'triangle', 0.7); pluck(root - 5, t, 0.08, 'sawtooth', 0.5); }
  if (inBar === 3) { tom(t, 0.22, 120); pluck(root - 5, t, 0.18, 'triangle', 0.5); }
  if (inBar === 2 || inBar === 5) noiseHit(t, { vol: 0.07, f: 2500, type: 'bandpass', q: 1.2, dec: 0.08 });  // stomp
  let at = 0; const k = i % 48;
  for (const [m, d] of SHANTY.mel) { if (at === k) { accordion(m, t, d * B * 0.95, 0.05); accordion(m - 12, t, d * B * 0.95, 0.025); if (i % 96 >= 48) fiddle(m + 12 - 3 - (m % 3 === 0 ? 1 : 0), t, d * B * 0.95); } at += d; }
}
// Meadow: a light waltz in G (flute + plucked bass).
const WALTZ = [[67,1],[71,1],[74,1],[76,2],[74,1],[72,1],[71,1],[69,1],[71,3],[67,1],[69,1],[71,1],[72,2],[76,1],[74,1],[72,1],[69,1],[67,3]];
const WROOT = [43, 48, 50, 43, 43, 48, 50, 43];
function meadow(t, i) {
  const bar = Math.floor(i / 3) % 8, b = i % 3, r = WROOT[bar];
  if (b === 0) pluck(r, t, 0.16, 'triangle', 0.5); else { pluck(r + 12 + 4 - (bar === 2 || bar === 6 ? 1 : 0), t, 0.05, 'triangle', 0.2); pluck(r + 19, t, 0.04, 'triangle', 0.2); }
  let at = 0, k = i % 24; for (const [m, d] of WALTZ) { if (at === k) flute(m, t, d * 0.36 * 0.95, 0.06); at += d; }
}
// Cave: a low hum and glassy bells (D dorian), sparse and mysterious.
const BELLS = [74, 77, 79, 81, 83, 86, 88];
function cave(t, i) { if (i % 3 === 0 && Math.random() < 0.7) bell(BELLS[Math.floor(Math.random() * BELLS.length)], t, 0.035); if (i % 16 === 8) bell(62, t, 0.03); }
// Danger / tunnel: driving bass ostinato in E minor with drums.
const OST = [40, 40, 43, 40, 45, 40, 43, 47];
function danger(t, i) {
  const n = OST[i % 8] + (Math.floor(i / 32) % 2 ? 3 : 0); pluck(n, t, 0.16, 'sawtooth', 0.16);
  if (i % 4 === 0) kick(t, 0.32); if (i % 4 === 2) noiseHit(t, { vol: 0.12, f: 1800, type: 'bandpass', q: 0.6, dec: 0.12 });
  noiseHit(t, { vol: 0.03, f: 8000, type: 'highpass', dec: 0.04 });
  if (i % 16 === 0) accordion(n + 24, t, 0.9, 0.025); if (i % 16 === 8) accordion(n + 27, t, 0.9, 0.025);
}
// Wonder: quick bell arpeggios in A major pentatonic over a soft pad (the crystal room).
const ARP = [[69, 73, 76, 81], [66, 69, 73, 78], [62, 66, 69, 74], [64, 68, 71, 76]];
function wonder(t, i) { const ch = ARP[Math.floor(i / 8) % 4]; bell(ch[i % 4] + (i % 8 >= 4 ? 12 : 0), t, 0.03); if (i % 8 === 0) { pluck(ch[0] - 24, t, 0.14, 'triangle', 0.9); kick(t, 0.12); } }
const THEMES = { shantyOld: null, wonder: { fn: wonder, beat: 0.17, vol: 0.9, pad: [45, 52, 57] }, map: { fn: shanty, beat: 0.26, vol: 0.95, pad: [26, 33] }, meadow: { fn: meadow, beat: 0.36, vol: 0.9 }, cave: { fn: cave, beat: 0.5, vol: 1, pad: [38, 45, 50] }, danger: { fn: danger, beat: 0.15, vol: 0.85, pad: [40, 47] } };

export function playMusic(name) {
  want = name; if (!AC || !S.settings.music) return; if (theme === name) return;
  const th = THEMES[name]; theme = name; clearInterval(timer); padOff();
  bus.gain.cancelScheduledValues(AC.currentTime); bus.gain.setValueAtTime(0.0001, AC.currentTime); bus.gain.exponentialRampToValueAtTime(th.vol, AC.currentTime + 1.2);
  if (th.pad) padOn(th.pad);
  step = 0; nextT = AC.currentTime + 0.15;
  timer = setInterval(() => { while (nextT < AC.currentTime + 0.35) { th.fn(nextT, step++); nextT += th.beat; } }, 90);
}
export function stopMusic() { want = null; theme = null; clearInterval(timer); timer = null; padOff(); if (bus) bus.gain.setTargetAtTime(0.0001, AC.currentTime, 0.3); }
export function setMusic(on) { S.settings.music = on; if (on) { const w = want; theme = null; if (w) playMusic(w); } else { const w = want; stopMusic(); want = w; } }
