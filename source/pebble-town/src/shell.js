// Shell: title screen, town HUD, opening places, rounds, results, rebuild celebrations.
import { runClear, clearQ, replayOops, oopsFixed, protectStorage, unpackSave, writeSave, S, save, load, h, $, wait, sfx, say, hush, pip, pipMount, pipVisible, audioInit, musicStart, musicStop, giveCoins, confetti, burst, renderCoins, streakHit, streakReset, PIP_SVG, speakBtn, SPEAKER_SVG } from './core.js';
import { caveView, flyIntoCave, setCameraAt } from './town3d.js';
import { cloudsIn, cloudsCovered, cloudsOut } from './clouds.js';
import { T, initTown, labelsVisible, setProgress, setWords, setDecor, focus, overview, pauseTown, setIdleSpin, setLabelHTML, lighthouseOn, trainRunning, setSky, PLACE_NAMES, TOWN_WORDS, DECOR_LIST, decorThumb, decorFull, focusSpot } from './town3d.js';
import { SPELLING, SENTENCES, GRAMMAR } from './data.js';
import * as F from './folk.js';
import * as ST from './story.js';
import * as WBR from './wordbridge.js';
import * as G from './guide.js';

const AREAS = {};
export function registerArea(a) { AREAS[a.id] = a; }

// ---------------------------------------------------------------- progress per place (0..1)
const cnt = (pref, test = r => r.box >= 1) => Object.entries(S.items).filter(([k, r]) => k.startsWith(pref) && test(r)).length;
export function progressOf(area) {
  switch (area) {
    case 'signs': return SPELLING.reduce((a, s) => a + Math.min(3, (S.items['sp:' + s.w] || { box: 0 }).box), 0) / (SPELLING.length * 3);
    case 'train': return Math.min(1, (S.bricks.train || 0) / 45);
    case 'bridge': return SENTENCES.reduce((a, s) => a + ['sb:', 'sf:', 'sm:'].filter(p => (S.items[p + s.id] || { box: 0 }).box >= 1).length, 0) / (SENTENCES.length * 2);
    case 'library': return Math.min(1, (cnt('lib:') + cnt('use:')) / 34);
    case 'science': return Math.min(1, (S.bricks.science || 0) / 36);
    case 'workshop': { let t = 0; for (const L of Object.keys(GRAMMAR)) t += Math.min(6, cnt('g' + L + ':')); return Math.min(1, (t + Math.min(12, cnt('fix:'))) / 54); }
    case 'detective': return Math.min(1, (S.bricks.detective || 0) / 30);
    case 'market': return ['num', 'add', 'story', 'len', 'mass', 'miss'].reduce((a, k) => a + Math.min(8, S.bricks['m_' + k] || 0), 0) / 48;
    case 'storm': return S.story.finale ? 1 : ST.readyCount() / ST.BUILD_AREAS.length * 0.75;
  }
  return 0;
}
export function machineProgress(L) { return Math.min(6, cnt('g' + L + ':')) / 6; }
function masteredTownWords() { return TOWN_WORDS.filter(w => (S.items['sp:' + w] || { box: 0 }).box >= 2); }
const starsOf = p => p >= 1 ? '★★★' : p >= 0.67 ? '★★☆' : p >= ST.READY ? '★☆☆' : '☆☆☆';
function labelHTML(area) {
  if (area === 'storm') {
    const r = ST.readyCount(), n = ST.BUILD_AREAS.length;
    const sub = S.story.finale ? '<span class="stars">Festival ★</span>' : r >= n ? '<span class="stars go">⚡ Ready!</span>' : `<span class="stars">🔒 ${r}/${n} ★</span>`;
    return `<span>${PLACE_NAMES[area]}</span>${sub}`;
  }
  const p = progressOf(area), toStar = Math.min(1, p / ST.READY);
  const pc = Math.round((p < ST.READY ? toStar : p) * 100);
  return `<span>${PLACE_NAMES[area]}</span><span class="bar${p < ST.READY ? ' first' : ''}"><i style="--p:${pc}%"></i></span><span class="stars">${starsOf(p)}</span>`;
}
function refreshLabels() {
  for (const a of Object.keys(PLACE_NAMES)) setLabelHTML(a, labelHTML(a));
  document.querySelectorAll('.place-label').forEach(el => { const a = Object.keys(PLACE_NAMES).find(k => el.textContent.startsWith(PLACE_NAMES[k])); if (a) { el.classList.toggle('done', progressOf(a) >= 1); el.classList.toggle('ready', a !== 'storm' && progressOf(a) >= ST.READY); } });
}
function cloudForProgress() { if (S.story.finale) F.cloudGone(); else F.cloudSize(1.35 - 0.55 * ST.readyCount() / ST.BUILD_AREAS.length); }
function syncTown(animate = false) {
  for (const a of Object.keys(PLACE_NAMES)) setProgress(a, progressOf(a), animate);
  setWords(masteredTownWords(), false); setDecor(S.decor); refreshLabels();
  lighthouseOn(ST.finaleUnlocked() || !!S.story.finale); trainRunning(progressOf('train') > 0); cloudForProgress();
}
const decorCounts = () => S.decor.reduce((m, k) => (m[k] = (m[k] || 0) + 1, m), {});
const syncPeople = (animate = false) => F.syncFolk(S.story.finale ? () => 1 : progressOf, { animate, bridge: progressOf('bridge') });

// ---------------------------------------------------------------- boot
let townEl, hudEl, screenEl, titleEl, current = null, before = null, busy = false;
export const isBusy = () => busy || !!current;
export async function boot() {
  load(); protectStorage(); if (await restoreFromLink()) return; document.body.innerHTML = '';
  const fromCave = new URLSearchParams(location.search).get('from') === 'cave'; const curtain = fromCave ? cloudsCovered() : null;
  try { await Promise.race([Promise.all([document.fonts.load('40px Chewy'), document.fonts.load('bold 20px Andika')]), wait(1500)]); } catch (e) { }
  townEl = h('div', { id: 'town' }); document.body.append(townEl);
  initTown(townEl, { onPick: openArea, onWordTap: tapWord, onPerson: id => { if (!busy && !current) ST.tapPerson(id); }, onCave: goCave }); WBR.syncBridge();
  try { const l = document.createElement('link'); l.rel = 'prefetch'; l.href = 'cave.html'; document.head.append(l); } catch (e) { }
  T.onPersonProxy = id => { if (!busy && !current) ST.tapPerson(id); };
  F.initFolk({}); ST.setPipFace(PIP_SVG.replace('class="pip-svg"', ''));
  ST.initStory({ progressOf, hud: v => { hudEl.classList.toggle('hidden', !v); pipVisible(v); }, sync: () => { syncTown(false); syncPeople(false); },
    festivalTown: () => { Object.keys(PLACE_NAMES).forEach(a => setProgress(a, 1, true)); setWords(TOWN_WORDS, true); F.syncFolk(() => 1, { bridge: 1 }); } });
  syncTown(false); syncPeople(false);
  hudEl = buildHud(); document.body.append(hudEl); hudEl.classList.add('hidden');
  screenEl = h('div', { class: 'screen hidden' }); document.body.append(screenEl);
  pipMount(); pipVisible(false);
  // coming back from The Cave: start at the cave mouth in the dark, then pull back out to the town
  // coming back from The Cave: start behind the clouds looking at the sky island, then the clouds part and the camera pulls back
  if (fromCave) { history.replaceState(null, '', location.pathname); const v = caveView(); setCameraAt(v.pos, v.target); }
  showTitle();
  if (fromCave) { if (S.name) { const b = titleEl && titleEl.querySelector('.btn'); if (b) setTimeout(() => b.click(), 30); } setTimeout(() => cloudsOut(curtain), 600); }
}
// Into The Cave: the camera walks into the dark mouth, everything goes black around the blue glow, then the story page opens.
async function goCave() {
  if (busy || current) return; busy = true; sfx('whoosh'); hush(); setIdleSpin(false); labelsVisible(false); hudEl.classList.add('hidden'); pipVisible(false);
  save(); const fly = flyIntoCave(1900); await wait(650); await cloudsIn(); await fly;
  location.href = 'cave.html?from=town';
}
// Opening a backup link (…/Qin/?r=…) puts that progress on this device, after asking.
async function restoreFromLink() {
  const r = new URLSearchParams(location.search).get('r'); if (!r) return false;
  const clean = () => history.replaceState(null, '', location.pathname);
  let o; try { o = await unpackSave(r); } catch (e) { clean(); return false; }
  const have = S.name || Object.keys(S.items).length;
  return new Promise(res => {
    document.body.innerHTML = '';
    const ov = h('div', { class: 'overlay' }, h('div', { class: 'panel', style: { textAlign: 'center', width: 'min(520px,94vw)' } },
      h('h2', {}, 'Restore progress?'),
      h('p', { style: { fontWeight: 700, fontSize: '20px' } }, `${o.name || 'Player'} · ${o.coins || 0} coins · ${Object.keys(o.items || {}).length} things learned`),
      have ? h('p', {}, `This will replace the progress now on this device (${S.name || 'Player'} · ${S.coins || 0} coins).`) : null,
      h('div', { style: { display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '12px' } },
        h('button', { class: 'btn green', onclick: () => { writeSave(o); clean(); location.reload(); } }, 'Yes, restore'),
        h('button', { class: 'btn paper', onclick: () => { clean(); location.reload(); } }, 'No, keep this device'))));
    document.body.append(ov); res(true);
  });
}
function tapWord(w) { const s = SPELLING.find(x => x.w === w); sfx('pop'); pip(`${s.pic} ${w}: ${s.ctx}`, { speech: `${w}. ${s.ctx}` }); }

function showTitle() {
  setIdleSpin(true); overview(10); labelsVisible(false); F.folkLabels(false);
  const input = h('input', { class: 'name-input', placeholder: 'Your name', maxlength: 14, value: S.name || '', 'aria-label': 'Your name' });
  const quiet = h('input', { type: 'checkbox', checked: !S.settings.music ? '' : null });
  const go = async () => {
    const n = input.value.trim(); if (!n) { input.focus(); sfx('bad'); input.animate([{ transform: 'translateX(-8px)' }, { transform: 'translateX(8px)' }, { transform: 'none' }], { duration: 300 }); return; }
    S.settings.music = !quiet.checked; S.settings.read = false; if (quiet.checked) S.settings.sfx = true; save();
    audioInit(); if (!S.settings.music) musicStop();
    { const { switchPlayer } = await import('./cloud.js'); if (await switchPlayer(n)) return; }
    S.name = n.charAt(0).toUpperCase() + n.slice(1); save();
    { const { cloudStart } = await import('./cloud.js'); if (await cloudStart((o, t) => confirm(`Found ${o.name || S.name}'s saved game (${o.coins || 0} coins, saved ${new Date(t).toLocaleDateString()}). Bring it back?\n\nOK = bring it back · Cancel = keep this game`))) return; }
    sfx('great'); titleEl.remove(); $('.hud-name').textContent = S.name; refreshReadBtn();
    setIdleSpin(false);
    if (!S.intro) { S.intro = true; save(); busy = true; try { await ST.opening(); if (!S.toured) await G.townTour({ placeLabel }); } finally { busy = false; } ST.topUpQuests(); }
    else { hudEl.classList.remove('hidden'); pipVisible(true); labelsVisible(true); F.folkLabels(true); ST.refreshMission(); ST.topUpQuests(); await overview(900); if (S.toured && !S.story.wordIsle3) { busy = true; try { await ST.wordIsleIntro(); } finally { busy = false; } } if (!S.toured) { busy = true; try { await G.townTour({ placeLabel }); } finally { busy = false; } } else pip(`Welcome back, ${S.name}! ${nextGoal()}`, { hold: 6000 }); }
    F.folkLabels(true);
  };
  input.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
  titleEl = h('div', { id: 'title' },
    h('div', { class: 'logo' }, 'Pebble', h('span', {}, 'Town')),
    h('div', { class: 'title-card' }, h('p', {}, S.name ? 'Welcome back!' : 'What is your name?'), input,
      h('label', { class: 'quiet-row' }, quiet, ' No music'),
      h('button', { class: 'btn red', onclick: go }, S.name ? 'Keep building' : 'Start')));
  document.body.append(titleEl);
}
function nextGoal() {
  if (S.story.finale) return 'Get ★★★ on every place!';
  if (ST.finaleUnlocked()) return 'Go to the Lighthouse!';
  const need = ST.BUILD_AREAS.filter(a => progressOf(a) < ST.READY).map(a => PLACE_NAMES[a]);
  return need.length <= 3 ? `Still need: ${need.join(', ')}.` : 'Get a ★ on every place!';
}

// read-aloud switch: a speaker icon (slashed when off). Lives in the town menu and on every activity bar.
const SPK_OFF = SPEAKER_SVG.replace('</svg>', '<path d="M4 4l32 32" stroke="#EF5B4C" stroke-width="4" stroke-linecap="round"/></svg>');
function refreshReadBtn() {
  document.querySelectorAll('.read-btn').forEach(b => { b.classList.toggle('on', !!S.settings.read); const i = b.querySelector('.spk'); if (i) i.innerHTML = S.settings.read ? SPEAKER_SVG : SPK_OFF; const s = b.querySelector('span'); if (s) s.textContent = S.settings.read ? 'Read aloud: on' : 'Read aloud: off'; });
  document.querySelectorAll('.music-row span').forEach(s => s.textContent = S.settings.music ? 'Music: on' : 'Music: off');
}
const toggleRead = () => { S.settings.read = !S.settings.read; save(); refreshReadBtn(); sfx('tap'); if (S.settings.read) say('I will read things out loud.'); else hush(); };
const miniRead = () => { const b = h('button', { class: 'btn icon paper read-btn mini', 'aria-label': 'Read aloud on or off', title: 'Read aloud', onclick: toggleRead }, h('i', { class: 'spk' })); setTimeout(refreshReadBtn, 0); return b; };
// give every question line a 🔊 button, and read it out if read-aloud is on
function addSpeakers(root) {
  let firstText = '';
  root.querySelectorAll('.prompt, .story-text, .sentence-card, .sub').forEach(el => {
    if (el.querySelector('.speak') || el.closest('.clue-card') || el.closest('.oops-ctx') || el.closest('.choices')) return; const t = el.textContent.replace(/_{2,}/g, 'blank').trim(); if (!t) return;
    if (el.classList.contains('sentence-card') && el.querySelector('.gap')) return;
    el.prepend(speakBtn(() => el.textContent.replace(/_{2,}/g, 'blank').trim())); if (!firstText) firstText = t; });
  if (firstText && S.settings.read && window.speechSynthesis && !speechSynthesis.speaking) say(firstText);
}
function buildHud() {
  // settings tray: everything that is not part of playing
  const row = (icon, label, fn, cls = '') => h('button', { class: 'tray-row ' + cls, onclick: e => { e.stopPropagation(); fn(); } }, h('i', { class: 'spk', html: icon }), h('span', {}, label));
  const tray = h('div', { class: 'tray hidden' },
    row('', '', toggleRead, 'read-btn'),
    row('🎵', '', () => { S.settings.music = !S.settings.music; save(); S.settings.music ? musicStart() : musicStop(); refreshReadBtn(); sfx('tap'); }, 'music-row'),
    row('🧭', 'Show me around', async () => { closeTray(); if (busy || current) return; busy = true; try { await G.townTour({ placeLabel }); } finally { busy = false; } }),
    row('👪', 'Grown-ups', () => { closeTray(); import('./parent.js').then(m => m.openParent()); }));
  const menuBtn = h('button', { class: 'btn icon paper menu-btn', 'aria-label': 'Settings', onclick: e => { e.stopPropagation(); sfx('tap'); tray.classList.toggle('hidden'); refreshReadBtn(); } }, '⚙️');
  const closeTray = () => tray.classList.add('hidden');
  addEventListener('pointerdown', e => { if (!tray.contains(e.target) && e.target !== menuBtn) closeTray(); });
  // game dock: the things she does in town
  const dockBtn = (icon, label, fn, cls = '', extra = null) => h('button', { class: 'dock-btn ' + cls, onclick: fn }, h('span', { class: 'dock-ic' }, icon), h('small', {}, label), extra);
  const hud = h('div', { id: 'hud' },
    h('div', { class: 'hud-top' },
      h('div', { class: 'hud-row' }, h('div', { class: 'chip' }, h('span', { class: 'hud-name' }, S.name || ''))),
      h('div', { class: 'hud-row' }, h('div', { class: 'chip' }, h('i', { class: 'coin' }), h('span', { class: 'coin-count' }, String(S.coins))), h('div', { class: 'menu-wrap' }, menuBtn, tray))),
    h('div', { class: 'dock' },
      dockBtn('🌉', 'Bridge', () => window.dispatchEvent(new Event('wordisle')), 'bridge-btn'),
      dockBtn('📕', 'Oops', openOops, 'oops-btn', h('b', { class: 'oops-count' }, '0')),
      dockBtn('🎨', 'Decorate', openShop, 'shop-btn'),
      dockBtn('👁', 'Look', toggleSigns, 'eye-btn')),
    h('div', { class: 'hud-bottom' }, 'Tap a place to play!'));
  ST.missionBanner(hud); setTimeout(() => { refreshOops(); refreshReadBtn(); }, 0); setInterval(refreshOops, 2500);
  return hud;
}
const noteIcon = () => S.settings.music ? '<svg viewBox="0 0 32 32"><path d="M12 24V7l14-3v17" fill="none" stroke="#2E2A4F" stroke-width="3" stroke-linejoin="round"/><circle cx="9" cy="24" r="4" fill="#2E2A4F"/><circle cx="23" cy="21" r="4" fill="#2E2A4F"/></svg>'
  : '<svg viewBox="0 0 32 32"><path d="M12 24V7l14-3v17" fill="none" stroke="#9A97B0" stroke-width="3"/><circle cx="9" cy="24" r="4" fill="#9A97B0"/><circle cx="23" cy="21" r="4" fill="#9A97B0"/><path d="M4 4l24 24" stroke="#EF5B4C" stroke-width="3.5" stroke-linecap="round"/></svg>';

// ---------------------------------------------------------------- opening a place
export async function openArea(id) {
  if (current || busy) return;
  if (id === 'storm') return lighthouse();
  const A = AREAS[id]; if (!A) return;
  audioInit(); sfx('whoosh'); hush(); current = A; S.lastArea = id; save();
  snapshot();
  await focus(id); pauseTown(true); hudEl.classList.add('hidden'); F.folkLabels(false);
  screenEl.innerHTML = ''; screenEl.classList.remove('hidden'); screenEl.classList.toggle('dark', !!A.dark);
  const bg = h('div', { class: 'screen-bg', style: { background: A.bg } });
  const title = h('div', { class: 'title' }, A.title);
  const top = h('div', { class: 'bar-top' },
    h('button', { class: 'btn small paper', onclick: () => leaveArea() }, '← Town'), title,
    h('button', { class: 'btn icon paper help-btn', 'aria-label': 'How to play', onclick: () => { if (G.hasHelp()) G.replayHelp(); } }, '?'), miniRead(),
    h('div', { class: 'streak' }, 'Streak', h('div', { class: 'streak-track' }, h('div', { class: 'streak-fill' }))),
    h('div', { class: 'chip' }, h('i', { class: 'coin' }), h('span', { class: 'coin-count' }, String(S.coins))));
  const stage = h('div', { class: 'stage' });
  screenEl.append(bg, top, stage); streakReset();
  G.clearHelp();
  const ui = { stage, bg, setTitle: t => title.textContent = t, clear: () => { runClear(); stage.innerHTML = ''; stage.scrollTop = 0; }, home: () => A.enter(ui), leave: leaveArea };
  A.enter(ui);
}
function snapshot() { before = Object.fromEntries(Object.keys(PLACE_NAMES).map(a => [a, progressOf(a)])); before.__words = masteredTownWords(); before.__unlocked = ST.finaleUnlocked(); }
export async function leaveArea() {
  if (!current) return; runClear(); hush(); sfx('whoosh'); current = null;
  screenEl.classList.add('hidden'); screenEl.innerHTML = ''; hudEl.classList.remove('hidden'); pauseTown(false); renderCoins();
  await celebrate();
}
async function celebrate() { busy = true; try { await celebrateInner(); } finally { busy = false; F.folkLabels(true); } }
async function celebrateInner() {
  const changed = Object.keys(PLACE_NAMES).filter(a => progressOf(a) > (before[a] || 0) + 0.0001);
  const newWords = masteredTownWords().filter(w => !before.__words.includes(w));
  for (const a of changed) {
    await focus(a); sfx('hammer'); await wait(300); sfx('build');
    await setProgress(a, progressOf(a), true); refreshLabels();
    const p = progressOf(a), b = before[a] || 0;
    if (p >= 1 && b < 1) { sfx('fanfare'); confetti(innerWidth / 2, innerHeight / 3, 70); bigToast(`${PLACE_NAMES[a]} is fixed!`); await pip(`Hooray! ${PLACE_NAMES[a]}: ★★★!`, { mood: 'happy' }); }
    else if (a !== 'storm' && p >= ST.READY && b < ST.READY) { sfx('fanfare'); bigToast(`★ ${PLACE_NAMES[a]}!`); await pip(`${PLACE_NAMES[a]} got a ★!`, { mood: 'happy' }); }
    else if (a !== 'storm') await pip(p < ST.READY ? `The ${PLACE_NAMES[a]} is growing!` : `The ${PLACE_NAMES[a]} is growing!`, { mood: 'happy' });
  }
  const arrived = syncPeople(true);
  if (arrived.length) await ST.welcomeArrivals(arrived);
  if (newWords.length) {
    setWords(masteredTownWords(), true); sfx('great');
    await pip(newWords.length === 1 ? `Look! A ${newWords[0]} came back!` : `New things in town!`, { mood: 'happy' });
  }
  trainRunning(progressOf('train') > 0); setDecor(S.decor); cloudForProgress(); refreshLabels(); ST.refreshMission();
  if (!before.__unlocked && ST.finaleUnlocked() && !S.story.finale) {
    await focus('storm', { close: false }); lighthouseOn(true); sfx('fanfare');
    await ST.talk('mayor', `Every place has a ★! Go to the Lighthouse!`); ST.talkEnd();
  }
  if (!changed.length && !arrived.length) await overview(900);
  else { await wait(300); overview(1200); }
  before = null;
}
export function bigToast(t) { const e = h('div', { class: 'toast-big' }, t); document.body.append(e); e.animate([{ transform: 'translateX(-50%) scale(.3)', opacity: 0 }, { transform: 'translateX(-50%) scale(1.1)', opacity: 1, offset: .2 }, { transform: 'translateX(-50%) scale(1)', opacity: 1, offset: .8 }, { transform: 'translateX(-50%) scale(1)', opacity: 0 }], { duration: 2600 }).onfinish = () => e.remove(); }

// ---------------------------------------------------------------- the lighthouse (finale)
async function lighthouse() {
  audioInit(); sfx('pop');
  if (S.story.finale) {
    const ov = h('div', { class: 'overlay', onclick: e => { if (e.target === ov) ov.remove(); } }, h('div', { class: 'panel', style: { textAlign: 'center' } },
      h('button', { class: 'btn small paper close', onclick: () => ov.remove() }, 'Close'), h('h2', {}, 'The Lighthouse'),
      
      h('div', { class: 'menu-grid' },
        h('button', { class: 'menu-card', onclick: () => { ov.remove(); runFinale(); } }, h('div', { class: 'big-emoji' }, '⛈️'), h('b', {}, 'Storm rematch'), h('small', {}, 'The cloud is back for more!')),
        h('button', { class: 'menu-card', onclick: () => { ov.remove(); runStormPractice(); } }, h('div', { class: 'big-emoji' }, '🗼'), h('b', {}, 'Storm Night quiz'), h('small', {}, '15 mixed questions, like a test')),
        h('button', { class: 'menu-card', onclick: async () => { ov.remove(); busy = true; try { await ST.festival(false); } finally { busy = false; } } }, h('div', { class: 'big-emoji' }, '🎆'), h('b', {}, 'Festival'), h('small', {}, 'Watch the party again')))));
    document.body.append(ov); return;
  }
  if (!ST.finaleUnlocked()) {
    busy = true; await focus('storm', { close: false });
    const need = ST.BUILD_AREAS.filter(a => progressOf(a) < ST.READY).map(a => PLACE_NAMES[a]);
    await ST.talk('mayor', `Not yet! Every place needs a ★ first.`);
    await ST.talk('mayor', `Still need: ${need.join(', ')}.`); ST.talkEnd(); await overview(1000); busy = false; return;
  }
  runFinale();
}
async function runFinale(preview = false) {
  busy = true; snapshot();
  try { const won = await ST.finale({ preview }); if (won) { syncTown(false); syncPeople(false); } } finally { busy = false; ST.refreshMission(); refreshLabels(); }
}
export function previewFinale() { if (current || busy) return; runFinale(true); }
function runStormPractice() { openScreen(AREAS.storm, true); }
function openScreen(A, dark = false) {
  current = A; snapshot(); pauseTown(true); hudEl.classList.add('hidden');
  screenEl.innerHTML = ''; screenEl.classList.remove('hidden'); screenEl.classList.toggle('dark', dark); streakReset(); G.clearHelp();
  const bg = h('div', { class: 'screen-bg', style: { background: A.bg } }); const stage = h('div', { class: 'stage' });
  const top = h('div', { class: 'bar-top' }, h('button', { class: 'btn small paper', onclick: () => leaveArea() }, '← Town'), h('div', { class: 'title' }, A.title), miniRead(),
    h('div', { class: 'streak' }, 'Streak', h('div', { class: 'streak-track' }, h('div', { class: 'streak-fill' }))), h('div', { class: 'chip' }, h('i', { class: 'coin' }), h('span', { class: 'coin-count' }, String(S.coins))));
  screenEl.append(bg, top, stage);
  const ui = { stage, bg, setTitle: () => {}, clear: () => { runClear(); stage.innerHTML = ''; }, home: () => A.enter(ui), leave: leaveArea };
  A.enter(ui);
}

// ---------------------------------------------------------------- shared round engine
// ask(i, host) must resolve to true (right first time) or false.
export async function playRound(ui, { n, ask, again }) {
  ui.clear();
  const dots = h('div', { class: 'progress-dots' }, ...Array.from({ length: n }, () => h('i')));
  const host = h('div', { class: 'qhost' });
  ui.stage.append(dots, host);
  let right = 0;
  for (let i = 0; i < n; i++) {
    dots.children[i].className = 'now'; runClear(); host.innerHTML = ''; if (window.__TEST) window.__solve = null;
    clearQ(); let ok = false; const spk = setTimeout(() => addSpeakers(host), 80); try { ok = await ask(i, host); } catch (e) { console.error(e); } clearQ();
    if (ok === 'quit') return;
    dots.children[i].className = ok ? 'ok' : 'oops'; if (ok) { right++; if (curCard) { S.tileRight = S.tileRight || {}; S.tileRight[curCard] = (S.tileRight[curCard] || 0) + 1; save(); } }
    clearTimeout(spk); streakHit(!!ok); await wait(450);
  }
  giveCoins(3); const card = curCard; if (card) { const st = starsFor(right, n); S.done = S.done || {}; S.done[card] = Math.max(S.done[card] || 0, st); save(); }
  await results(ui, right, n, again);
}
const starsFor = (right, n) => { const r = right / n; return r >= 0.9 ? 3 : r >= 0.6 ? 2 : 1; };
let curCard = null;
function results(ui, right, n, again) {
  return new Promise(res => {
    const stars = starsFor(right, n);
    sfx(stars === 3 ? 'fanfare' : 'great'); confetti(innerWidth / 2, innerHeight / 3, stars * 25);
    const msg = stars === 3 ? `Amazing, ${S.name}!` : stars === 2 ? 'Great job!' : 'Good try! Play again?';
    const ov = h('div', { class: 'overlay' }, h('div', { class: 'panel', style: { textAlign: 'center' } },
      h('div', { class: 'result-stars' }, ...[1, 2, 3].map(k => h('span', { class: k <= stars ? '' : 'dim' }, '⭐'))),
      h('h2', {}, msg), h('p', { style: { fontSize: '22px', fontWeight: 700 } }, `${right} / ${n} right`),
      h('div', { style: { display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '10px' } },
        h('button', { class: 'btn green', onclick: () => { ov.remove(); res(); again ? again() : ui.home(); } }, 'Play again'),
        h('button', { class: 'btn paper', onclick: () => { ov.remove(); res(); ui.home(); } }, 'Choose another'),
        h('button', { class: 'btn red', onclick: () => { ov.remove(); res(); leaveArea(); } }, 'See my town'))));
    document.body.append(ov); pip(msg);
  });
}

// Every tile shows a bar with words under it, so it is clear what the bar counts.
// Areas can pass count: [done, total, 'words'] ; otherwise the bar counts right answers in this activity (goal 16).
const TILE_GOAL = 16;
function tileMeter(c, key) {
  if (c.noTrack) return [];
  let [x, y, what] = c.count || [Math.min(TILE_GOAL, (S.tileRight || {})[key] || 0), TILE_GOAL, 'right'];
  x = Math.min(x, y); const full = x >= y;
  return [h('div', { class: 'meter' + (full ? ' full' : '') }, h('i', { style: { width: Math.round(x / y * 100) + '%' } })),
    h('span', { class: 'meter-txt' }, c.countText || (full ? `${y}/${y} ${what} ✓` : `${x}/${y} ${what}`))];
}
// Simple menu of cards inside a place
export function menu(ui, intro, cards) {
  ui.clear();
  if (intro) ui.stage.append(h('div', { class: 'prompt' }, intro));
  const grid = h('div', { class: 'menu-grid' });
  for (const c of cards) {
    const key = (current ? current.id : '') + '|' + c.name, best = (S.done || {})[key] || 0;
    const card = h('button', { class: 'menu-card' + (c.sound ? ' sound' : '') + (best ? ' played' : '') + (best === 3 ? ' perfect' : ''), style: c.color ? { '--c': c.color } : null, onclick: async () => { sfx('pop'); curCard = c.noTrack ? null : key; if (current) await G.maybeHelp(current.id, c.name + ' ' + (c.desc || '')); c.go(); } },
      best ? h('span', { class: 'done-badge', title: 'Your best' }, '★'.repeat(best) + '☆'.repeat(3 - best)) : null,
      c.pic ? h('div', { class: 'big-emoji' }, c.pic) : null, h('b', {}, c.name), c.desc ? h('small', {}, c.desc) : null,
      c.level ? h('span', { class: 'level' }, c.level) : null,
      ...tileMeter(c, key));
    grid.append(card);
  }
  ui.stage.append(grid);
}

// ---------------------------------------------------------------- decoration shop
function openShop() {
  sfx('pop'); const counts = decorCounts();
  const list = h('div', { class: 'shop-list' }); const imgs = [];
  const sorted = [...DECOR_LIST].sort((x, y) => x.price - y.price);
  for (const d of sorted) {
    const have = counts[d.kind] || 0, maxed = have >= d.max, full = maxed || decorFull(d.kind), can = S.coins >= d.price && !full;
    const img = h('img', { class: 'shop-pic', alt: d.name }); imgs.push([img, d.kind]);
    list.append(h('div', { class: 'shop-item' + (full ? ' full' : '') }, img, h('b', {}, d.name), h('small', {}, maxed ? 'All done!' : full ? 'No room left' : `${have} / ${d.max}`),
      h('button', { class: 'btn small ' + (can ? 'green' : 'paper'), disabled: can ? null : '', onclick: () => {
        S.coins -= d.price; S.decor.push(d.kind); save(); renderCoins(); ov.remove(); sfx('coin');
        const at = setDecor(S.decor, true); if (at) focusSpot(at.x, at.z, at.y); setTimeout(() => sfx('place'), 900); pip('So pretty!', { mood: 'happy' });
      } }, h('i', { class: 'coin' }), String(d.price))));
  }
  const ov = h('div', { class: 'overlay', onclick: e => { if (e.target === ov) ov.remove(); } }, h('div', { class: 'panel shop-panel' },
    h('button', { class: 'btn small paper close', onclick: () => ov.remove() }, 'Close'), h('h2', {}, 'Decorate the town'),
    h('p', { style: { margin: '0 0 14px', fontWeight: 700 } }, h('span', {}, 'You have '), h('i', { class: 'coin' }), h('b', {}, ' ' + S.coins)), list));
  document.body.append(ov);
  let k = 0; const next = () => { if (!ov.isConnected || k >= imgs.length) return; const [img, kind] = imgs[k++]; img.src = decorThumb(kind); setTimeout(next, 0); }; next();
}
export { syncTown };

// ---------------------------------------------------------------- hide the signs to look at the town
function toggleSigns() {
  const off = document.body.classList.toggle('no-labels'); sfx('tap');
  document.querySelectorAll('.eye-btn small').forEach(s => s.textContent = off ? 'Signs' : 'Look'); document.querySelectorAll('.eye-btn').forEach(b => b.classList.toggle('on', off));
  if (off) pip('Tap 👁 again to bring the signs back.', { speak: false });
}

// ---------------------------------------------------------------- Oops Book: questions she got wrong, to try again
function refreshOops() { const n = (S.oops || []).length; document.querySelectorAll('.oops-count').forEach(e => e.textContent = String(n)); document.querySelectorAll('.oops-btn').forEach(b => b.classList.toggle('has', n > 0)); }
const OOPS = { id: 'oops', title: 'Oops Book — Try again!', bg: 'linear-gradient(#FFF4DC 0 70%, #FFE0C9 70%)', enter: ui => oopsMenu(ui) };
function openOops() { if (current || busy) return; audioInit(); sfx('whoosh'); hush(); snapshot(); openScreen(OOPS); }
function oopsMenu(ui) {
  ui.clear(); const list = S.oops || [];
  if (!list.length) {
    ui.stage.append(h('div', { class: 'prompt', style: { fontSize: '30px' } }, 'No mistakes to fix! 🎉'),
      h('p', { style: { textAlign: 'center', fontWeight: 700, fontSize: '20px' } }, S.fixed ? `You fixed ${S.fixed} mistakes. Great work!` : 'When you get one wrong, it goes here.'),
      h('div', { style: { textAlign: 'center' } }, h('button', { class: 'btn green', onclick: () => leaveArea() }, '← Town')));
    pip(S.fixed ? 'All fixed! Great job!' : 'Nothing here yet!'); return;
  }
  const groups = {}; for (const e of list) (groups[e.area || 'other'] = groups[e.area || 'other'] || []).push(e);
  const cards = [{ name: 'Fix them all', desc: `${list.length} to fix`, pic: '📕', color: '#FFD1CB', noTrack: true, go: () => oopsRound(ui, list) }];
  for (const [a, es] of Object.entries(groups)) cards.push({ name: PLACE_NAMES[a] || 'Other', desc: `${es.length} to fix`, pic: '✏️', noTrack: true, go: () => oopsRound(ui, es) });
  menu(ui, 'Get it right to fix it!', cards);
  pip('Try your mistakes again!');
}
function oopsRound(ui, entries) {
  const L = entries.slice(0, 12);
  playRound(ui, { n: L.length, again: () => (S.oops || []).length ? oopsRound(ui, S.oops) : oopsMenu(ui), ask: async (i, host) => {
    const e = L[i]; const ok = await replayOops(host, e);
    if (ok) { oopsFixed(e); burst(host, 'Fixed!'); } else { e.n++; save(); }
    refreshOops(); return ok;
  } });
}

function placeLabel(area) { return () => [...document.querySelectorAll('.place-label')].find(el => el.textContent.startsWith(PLACE_NAMES[area])); }

window.addEventListener('wordisle', () => { if (busy || current) return; sfx('pop'); if (WBR.bridgeDone()) { pip('Word Island is open! New lessons are coming soon.', { hold: 3500 }); return; }
  busy = true; WBR.openBridge({ hud: v => hudEl.classList.toggle('hidden', !v) }).finally(() => { busy = false; }); });
