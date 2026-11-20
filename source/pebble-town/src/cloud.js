// Cloud save + message box (Firebase Firestore over plain HTTPS; no SDK, stays tiny, fails silently when offline).
import { S, save, packSave, unpackSave, onSave, writeSave } from './core.js';
const PROJECT = 'exam-games', KEY = 'AIzaSyB9v9S8A1nMQ2_TiKxtNFO4GUuc26WrZSE';
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;
const GAME = 'Pebble Town';
export const cloud = { last: 0, err: '', busy: false };
export const idFor = name => { const n = String(name || '').toUpperCase().replace(/[^\p{L}\p{N}]/gu, '').slice(0, 20); return n ? 'PEBBLE-' + n : ''; };
const seg = id => encodeURIComponent(id);
const fields = o => ({ fields: Object.fromEntries(Object.entries(o).map(([k, v]) => [k, typeof v === 'number' ? { integerValue: String(v) } : { stringValue: v }])) });
let lastSent = '', timer = 0;
// How much she has done. Only grows while she plays, so it tells which copy is ahead (timestamps can't: an old device saves "newer").
export const progressOf = o => { if (!o) return 0; let n = 0; for (const r of Object.values(o.items || {})) n += (r.c || 0) + (r.w || 0);
  return n + ((o.wb && o.wb.marks) || '').length * 3 + (o.decor || []).length + ((o.storm && o.storm.runs) || 0); };
export const summary = o => `${o.coins || 0} coins, ${((o.wb && o.wb.marks) || '').length}/28 bridge planks, ${Object.keys(o.items || {}).length} words practised`;
// The copy that is ahead wins; questions she practised only on the other device are kept too.
export function mergeSaves(win, other) { const o = JSON.parse(JSON.stringify(win)); o.items = o.items || {};
  for (const [k, r] of Object.entries((other && other.items) || {})) { const m = o.items[k]; if (!m || (r.c || 0) + (r.w || 0) > (m.c || 0) + (m.w || 0)) o.items[k] = r; } return o; }
async function cloudAhead() { try { const g = await fetchSave(S.cloudCode); return progressOf(g.save) > progressOf(S) ? g : null; } catch (e) { return null; } }
export async function syncNow(force) {
  if (!S.cloudCode || cloud.busy) return false;
  try {
    cloud.busy = true;
    if (!force) { const g = await cloudAhead(); if (g) { cloud.ahead = g; cloud.err = 'The cloud copy has more progress'; cloud.busy = false; return false; } }
    const d = await packSave();
    if (!force && d === lastSent) { cloud.busy = false; return true; }
    const r = await fetch(`${BASE}/saves/${seg(S.cloudCode)}?key=${KEY}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, keepalive: d.length < 60000, body: JSON.stringify(fields({ d, t: Date.now(), game: GAME })) });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    lastSent = d; cloud.last = Date.now(); cloud.err = ''; cloud.busy = false; return true;
  } catch (e) { cloud.err = String(e.message || e); cloud.busy = false; return false; }
}
export async function turnOn() { const id = idFor(S.name); if (!id) throw new Error('no name'); S.cloudCode = id; S.cloudOff = ''; save(); const ok = await syncNow(true); if (!ok) { const bad = cloud.err; S.cloudCode = ''; save(); throw new Error(bad || 'offline'); } return S.cloudCode; }
export async function fetchSave(code) {
  const r = await fetch(`${BASE}/saves/${seg(code)}?key=${KEY}`, { signal: AbortSignal.timeout(6000) }); if (r.status === 404) throw new Error('nocode'); if (!r.ok) throw new Error('HTTP ' + r.status);
  const j = await r.json(); const o = await unpackSave(j.fields.d.stringValue); o.cloudCode = code; o.cloudOff = ''; return { save: o, t: +j.fields.t.integerValue };
}
export async function sendMessage(from, text) {
  const r = await fetch(`${BASE}/messages?key=${KEY}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(fields({ from: String(from || '').slice(0, 60), text: String(text).slice(0, 1900), game: GAME, t: Date.now() })) });
  if (!r.ok) throw new Error('HTTP ' + r.status);
}
// auto-sync: a little after progress changes, and when the page is hidden
onSave(() => { if (!S.cloudCode) return; clearTimeout(timer); timer = setTimeout(() => syncNow(), 15000); });
document.addEventListener('visibilitychange', async () => { if (!S.cloudCode) return;
  if (document.visibilityState === 'hidden') { clearTimeout(timer); syncNow(); return; }
  const g = await cloudAhead(); if (g) { writeSave(mergeSaves(g.save, S)); location.reload(); } });

// Called when she starts the game with her name. Returns true if the page is reloading with a restored save.
// Safe by design: it never overwrites cloud progress with a blank or older game; it asks first.
const blank = () => !S.coins && !Object.keys(S.items || {}).length && !(S.decor || []).length;
export async function cloudStart(confirmFn) {
  const id = idFor(S.name); if (!id || S.cloudOff === id) return false;
  if (S.cloudCode === id && !blank()) { const g = await cloudAhead(); if (g) { writeSave(mergeSaves(g.save, S)); location.reload(); return true; } syncNow(true); return false; }
  try {
    const { save: o, t } = await fetchSave(id).catch(e => { if (e.message === 'nocode') return { save: null }; throw e; });
    if (!o) { S.cloudCode = id; save(); syncNow(true); return false; }                       // no cloud copy yet: start one
    const newer = t > (S.savedAt || 0) + 120000;
    if (blank() || (S.cloudCode !== id && newer)) {
      if (confirmFn(o, t)) { writeSave(o); location.reload(); return true; }
      S.cloudOff = id; save(); return false;                                                 // she chose to keep this game: leave the cloud copy alone
    }
    S.cloudCode = id; save(); syncNow(true); return false;
  } catch (e) { return false; }                                                              // offline: try again next time
}

// A different name on the title screen is a different player: look for that player's cloud save, otherwise start fresh. The old game stays saved.
// Returns true when the page is reloading (or the player cancelled), false to carry on normally.
export async function switchPlayer(n) {
  const nm = n.charAt(0).toUpperCase() + n.slice(1), nid = idFor(nm), oid = idFor(S.name);
  if (!nid || !oid || nid === oid || blank()) return false;
  const on = S.name;
  try { if (S.cloudCode === oid) await syncNow(true); } catch (e) { /* offline is fine */ }
  let g = null, off = false;
  try { g = await fetchSave(nid); } catch (e) { if (e.message !== 'nocode') off = true; }
  const fresh = f => { writeSave({ name: nm, items: {}, cloudCode: '', cloudOff: f ? nid : '' }); location.reload(); return true; };
  if (g) {
    if (confirm(`Found ${g.save.name || nm}'s saved game (${g.save.coins || 0} coins, saved ${new Date(g.t).toLocaleDateString()}). Bring it back? ${on}'s game stays saved.\n\nOK = bring it back \u00B7 Cancel = start new`)) { writeSave(g.save); location.reload(); return true; }
    return fresh(true);
  }
  return confirm((off ? `Can't check online for ${nm} right now. ` : `There is no saved game for ${nm}. `) + `Start a new game for ${nm}? ${on}'s game stays saved.`) ? fresh(false) : true;
}
