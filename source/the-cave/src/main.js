// The Cave — Leo, Mia and Toby's voyage. Title → journey map → stops.
import { S, load, save, audioInit, sfx, say, h, $, wait, englishVoices, setVoice, currentVoice } from './core.js';
import { init, camera, setCam, flyCam, pickAt, renderer, onTick, stopFollow, THREE } from './gfx.js';
import { buildMap, STOPS, setCamRef } from './sets.js';
import { mountUI, openBinder, hideStory, hideTask, MODE, dueCards, ownedCount } from './ui.js';
import { playMusic, setMusic } from './music.js';
import { stop1, stop2, stop3, sumUp } from './ep1.js';

const PLAY = { 1: stop1, 2: stop2, 3: stop3 };
let hud;

function buildHud(mode) {
  if (hud) hud.remove();
  const readBtn = h('button', { class: 'hud-btn', onclick: () => { S.settings.read = !S.settings.read; save(); readBtn.textContent = S.settings.read ? '🔊 Read to me' : '🔈 Reading off'; sfx('tap'); } }, S.settings.read ? '🔊 Read to me' : '🔈 Reading off');
  const musicBtn = h('button', { class: 'hud-btn', 'aria-label': 'Music', onclick: () => { setMusic(!S.settings.music); save(); musicBtn.textContent = S.settings.music ? '🎵' : '🔇'; sfx('tap'); } }, S.settings.music ? '🎵' : '🔇');
  const due = dueCards().length;
  hud = h('div', { class: 'hud' },
    mode === 'stop' ? h('button', { class: 'hud-btn', onclick: () => { sessionStorage.setItem('cave_skipTitle', '1'); location.reload(); } }, '🗺 Map')
      : h('button', { class: 'hud-btn' + (due ? ' glow' : ''), onclick: () => { sfx('tap'); openBinder(() => buildHud('map')); } }, '🃏 Word cards ' + ownedCount() + '/4' + (due ? ` · ✨${due}` : '')),
    h('div', { class: 'hud-right' }, mode === 'map' ? h('button', { class: 'hud-btn', onclick: () => { sfx('tap'); voicePanel(); } }, '🗣 Voice') : null, musicBtn, readBtn));
  document.body.append(hud);
}

// Choose the reading voice. The best one on this device is picked automatically and starred.
function voicePanel() {
  const vs = englishVoices(), cur = currentVoice();
  const list = h('div', { class: 'voice-list' }, ...vs.slice(0, 14).map((v, i) => h('button', { class: 'voice-row' + (cur && cur.name === v.name ? ' on' : ''), onclick: () => {
    setVoice(v.name); list.querySelectorAll('.voice-row').forEach(b => b.classList.remove('on')); list.children[i].classList.add('on'); say('Leo and Mia were playing in the bright sun with Toby the puppy.', { force: true }); } },
    h('b', {}, (i === 0 ? '★ ' : '') + v.name.replace(/^Microsoft |\s*-\s*English.*$| Online \(Natural\)/g, m => m.includes('Natural') ? ' (natural)' : '')), h('small', {}, v.lang))));
  const ov = h('div', { class: 'binder', onclick: e => { if (e.target === ov) ov.remove(); } }, h('div', { class: 'binder-page voice-page' },
    h('button', { class: 'btn ghost close', onclick: () => ov.remove() }, '✕'), h('h2', {}, 'Reading voice'),
    h('div', { class: 'binder-sub' }, vs.length ? 'Tap a voice to hear it. ★ is the best one found on this device.' : 'No voices found on this device yet.'),
    h('button', { class: 'voice-row' + (!S.settings.voice ? ' on' : ''), onclick: () => { setVoice(''); ov.remove(); say('I will use the best voice on this device.', { force: true }); } }, h('b', {}, 'Automatic (best voice)')),
    list, h('p', { class: 'voice-tip' }, 'Tip: Microsoft Edge has very natural voices (like Aria or Jenny). On iPad, you can download better voices in Settings → Accessibility → Spoken Content → Voices.')));
  document.body.append(ov);
}

async function showMap(focusNext = true) {
  buildHud('map'); playMusic('map');
  const { markers, reached } = buildMap(S, null);
  const next = STOPS[Math.min(reached, 3) - 1];
  setCam([-2, 40, 40], [0, 0, 0]);
  const banner = h('div', { class: 'map-banner' }, h('div', { class: 'ep' }, 'Episode 1'), h('div', { class: 'ep-title' }, 'The Cave'),
    h('div', { class: 'ep-hint' }, S.stops[3] ? 'Episode 1 complete! More of the voyage is coming soon.' : 'Tap the glowing stop to begin.'));
  document.body.append(banner);
  await flyCam([next.p[0] + 12, 25, next.p[2] + 24], [next.p[0] + 9, 0, next.p[2] - 3], 2600);
  // drag to look around the map, tap a stop to play it
  let down = null, moved = 0; const cv = renderer.domElement;
  const pd = e => { down = { x: e.clientX, y: e.clientY }; moved = 0; };
  const pm = e => { if (!down) return; const dx = e.clientX - down.x, dy = e.clientY - down.y; moved += Math.abs(dx) + Math.abs(dy); down = { x: e.clientX, y: e.clientY };
    const k = 0.035; camera.position.x -= dx * k; camera.position.z -= dy * k; camera.position.x = Math.max(-34, Math.min(32, camera.position.x)); camera.position.z = Math.max(-8, Math.min(34, camera.position.z));
    camera.lookAt(camera.position.x - 3, 0, camera.position.z - 27); };
  const pu = async e => { const wasDrag = moved > 12; down = null; if (wasDrag) return;
    const hit = pickAt(e.clientX, e.clientY, markers); if (!hit) return; const s = hit.obj.userData.stop;
    const can = s.n === 1 || (S.stops[s.n - 1] && S.stops[s.n - 1].done);
    if (!can) { sfx('bad'); say('Finish stop ' + (s.n - 1) + ' first!', { force: true }); return; }
    sfx('pop');
    let captain = false;
    if (S.stops[s.n] && S.stops[s.n].done) { captain = await chooseMode(s); if (captain === null) return; }
    cv.removeEventListener('pointerdown', pd); cv.removeEventListener('pointermove', pm); cv.removeEventListener('pointerup', pu);
    banner.remove(); await flyCam([s.p[0] + 1, s.p[1] + 4, s.p[2] + 5], [s.p[0], s.p[1], s.p[2]], 1100); play(s.n, captain); };
  cv.addEventListener('pointerdown', pd); cv.addEventListener('pointermove', pm); cv.addEventListener('pointerup', pu);
}

// A stop she has finished can be replayed (new versions of each activity) or played in Captain mode.
function chooseMode(s) {
  return new Promise(res => {
    const close = v => { ov.remove(); res(v); };
    const ov = h('div', { class: 'mode-pick', onclick: e => { if (e.target === ov) close(null); } }, h('div', { class: 'mode-card' },
      h('h3', {}, s.name), h('div', {}, S.captain && S.captain[s.n] ? '⚓ Captain stamp earned!' : 'You have been here before. New puzzles are waiting!'),
      h('button', { class: 'mode-opt', onclick: () => close(false) }, h('b', {}, '▶ Play again'), 'New words and new puzzles, with Toby\u2019s help.'),
      h('button', { class: 'mode-opt cap', onclick: () => close(true) }, h('b', {}, '⚓ Captain mode'), 'Read the story yourself, bonus challenges on, only one hint. Get everything right the first time to earn the Captain stamp!')));
    document.body.append(ov);
  });
}

async function play(n, captain = false) {
  MODE.captain = captain; MODE.perfect = true;
  buildHud('stop'); stopFollow(); document.querySelectorAll('.map-banner').forEach(e => e.remove());
  const veil = h('div', { class: 'veil' }); document.body.append(veil); await wait(350);
  const stopName = STOPS[n - 1].name;
  const card = h('div', { class: 'stop-title' }, h('small', {}, 'Stop ' + n), stopName); document.body.append(card);
  const go = PLAY[n](); setTimeout(() => veil.classList.add('out'), 200); setTimeout(() => { veil.remove(); card.classList.add('out'); }, 1500); setTimeout(() => card.remove(), 2600);
  await go; hideStory(); hideTask();
  if (captain) { const ok = MODE.perfect; const ov = h('div', { class: 'ep-done' }, h('div', { class: 'ep-done-in' }, h('div', { class: 'stamp' }, ok ? '⚓ Captain' : 'Captain mode'), h('h2', {}, ok ? 'Captain stamp earned!' : 'Great sailing!'), h('p', {}, ok ? 'Everything right the first time!' : 'Try again to get every answer right the first time.'), h('button', { class: 'btn gold', onclick: () => { ov.remove(); r(); } }, 'Back to the map'))); let r; const p = new Promise(x => r = x); document.body.append(ov); sfx(ok ? 'great' : 'good'); await p; }
  MODE.captain = false;
  if (n === 3 && !S.ep1) { await sumUp(); await episodeDone(); }
  const v2 = h('div', { class: 'veil' }); document.body.append(v2); await wait(400); showMap(); v2.classList.add('out'); setTimeout(() => v2.remove(), 900);
}

async function episodeDone() {
  sfx('great');
  const ov = h('div', { class: 'ep-done' }, h('div', { class: 'ep-done-in' }, h('div', { class: 'stamp' }, 'Episode 1'), h('h2', {}, 'You finished The Cave!'),
    h('p', {}, `Word cards: ${ownedCount()} of 4 · Bonus stars: ${Object.keys(S.stars).length} of 3`), h('button', { class: 'btn gold', onclick: () => { ov.remove(); done(); } }, 'Back to the map')));
  let done; const p = new Promise(r => done = r); document.body.append(ov); say('You finished Episode 1! Well done!', { force: S.settings.read }); return p;
}

function title() {
  const go = () => { audioInit(); sfx('glow'); t.classList.add('out'); setTimeout(() => t.remove(), 900); showMap(); };
  const t = h('div', { class: 'title' },
    h('div', { class: 'title-glow' }), h('h1', {}, 'The Cave'), h('div', { class: 'title-sub' }, 'Leo, Mia & Toby’s voyage'),
    h('button', { class: 'btn gold big', onclick: go }, S.stops[1] ? 'Keep going' : 'Start the voyage'),
    h('div', { class: 'title-note' }, S.name ? `Welcome, ${S.name}!` : ''));
  document.body.append(t);
}

load(); init(document.body); setCamRef(camera); mountUI();
document.addEventListener('pointerdown', () => audioInit(), { once: true });
if (sessionStorage.getItem('cave_skipTitle')) { sessionStorage.removeItem('cave_skipTitle'); showMap(); } else { setCam([-2, 40, 40], [0, 0, 0]); buildMap(S, null); title(); }
window.__cave = { S, play, showMap };
