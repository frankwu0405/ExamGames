// Story: opening cutscene, mission banner, townsfolk quests, the Storm Cloud finale and the festival.
import { S, save, h, sfx, say, wait, pip, pipVisible, giveCoins, confetti, setQ, clearQ, stripPics, plainText, mark, burst, shake, cheer } from './core.js';
import { wordIsleView } from './town3d.js';
import { T, setProgress, setWords, overview, focus, labelsVisible, setSky, lighthouseOn, PLACE_NAMES, TOWN_WORDS } from './town3d.js';
import * as F from './folk.js';
import { quick, finaleSet } from './questions.js';
import { shuffle } from './mathgen.js';
import { SPELLING, SENTENCES } from './data.js';

export const READY = 0.34;                       // one star
export const BUILD_AREAS = ['signs', 'train', 'bridge', 'library', 'workshop', 'detective', 'market', 'science'];

// ---------------------------------------------------------------- portraits
const MAYOR = `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="#FFE3B3"/><circle cx="50" cy="60" r="26" fill="#F6D2B5" stroke="#2E2A4F" stroke-width="3"/>
<rect x="30" y="12" width="40" height="30" rx="3" fill="#2E2A4F"/><rect x="20" y="38" width="60" height="8" rx="4" fill="#2E2A4F"/><rect x="30" y="32" width="40" height="6" fill="#EF5B4C"/>
<circle cx="41" cy="57" r="3.5" fill="#2E2A4F"/><circle cx="59" cy="57" r="3.5" fill="#2E2A4F"/><path d="M36 68q7-6 14 0q7-6 14 0q-7 5-14 1q-7 4-14-1z" fill="#6B4A33"/>
<circle cx="35" cy="66" r="4" fill="#F49AA4" opacity=".7"/><circle cx="65" cy="66" r="4" fill="#F49AA4" opacity=".7"/></svg>`;
const BOOK = `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="#E8E0F5"/><path d="M18 30q16-6 32 4q16-10 32-4v42q-16-6-32 4q-16-10-32-4z" fill="#fff" stroke="#2E2A4F" stroke-width="3"/><path d="M50 34v42" stroke="#2E2A4F" stroke-width="3"/></svg>`;
const CLOUD = `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="#3B4176"/><g fill="#7E83A8" stroke="#1E2148" stroke-width="3"><circle cx="35" cy="55" r="16"/><circle cx="55" cy="45" r="20"/><circle cx="70" cy="58" r="14"/><rect x="25" y="55" width="55" height="17" rx="8"/></g>
<path d="M40 50l10 4M68 50l-10 4" stroke="#1E2148" stroke-width="4" stroke-linecap="round"/><circle cx="46" cy="58" r="3" fill="#fff"/><circle cx="62" cy="58" r="3" fill="#fff"/><path d="M48 68h12" stroke="#1E2148" stroke-width="3" stroke-linecap="round"/></svg>`;
let PIP_FACE = '';
export function setPipFace(svg) { PIP_FACE = svg; }

// ---------------------------------------------------------------- dialogue box
let box = null;
function dialogueBox() {
  if (box) return box;
  const face = h('div', { class: 'dlg-face' }), who = h('div', { class: 'dlg-who' }), text = h('div', { class: 'dlg-text' }), next = h('button', { class: 'btn small green dlg-next' }, 'Next ▸');
  const skip = h('button', { class: 'btn small paper dlg-skip' }, 'Skip story');
  const el = h('div', { class: 'dlg hidden' }, face, h('div', { class: 'dlg-body' }, who, text), next, skip);
  document.body.append(el); box = { el, face, who, text, next, skip }; return box;
}
let skipping = false;
export function talk(speaker, line, { auto = 0, canSkip = false } = {}) {
  const B = dialogueBox(); B.el.classList.remove('hidden');
  const map = { mayor: ['Mayor Pebble', MAYOR], pip: ['Pip', PIP_FACE], story: ['', BOOK], cloud: ['Storm Cloud', CLOUD] };
  const [name, svg] = map[speaker] || map.story;
  B.face.innerHTML = svg; B.who.textContent = name; B.who.style.display = name ? '' : 'none'; B.el.classList.toggle('narrate', speaker === 'story'); B.el.classList.toggle('villain', speaker === 'cloud');
  B.text.textContent = ''; B.skip.style.display = canSkip ? '' : 'none';
  if (speaker === 'mayor') F.mayorTalk(true);
  say(line);
  return new Promise(res => {
    if (skipping) { res(); return; }
    let i = 0; const typer = setInterval(() => { i += 2; B.text.textContent = line.slice(0, i); if (i >= line.length) clearInterval(typer); }, 22);
    const done = () => { clearInterval(typer); B.next.onclick = null; B.el.onclick = null; F.mayorTalk(false); sfx('tap'); res(); };
    B.next.onclick = e => { e.stopPropagation(); if (B.text.textContent.length < line.length) { clearInterval(typer); B.text.textContent = line; return; } done(); };
    B.skip.onclick = e => { e.stopPropagation(); skipping = true; done(); };
    if (auto) setTimeout(() => { if (B.next.onclick) done(); }, auto);
  });
}
export function talkEnd() { if (box) box.el.classList.add('hidden'); F.mayorTalk(false); }

// ---------------------------------------------------------------- mission banner
let banner = null, hooks = {};
export function initStory(opts) { hooks = opts; }
export function missionBanner(parent) {
  banner = h('button', { class: 'mission', onclick: () => openMission() }); parent.append(banner); refreshMission(); return banner;
}
export function readyCount() { return BUILD_AREAS.filter(a => hooks.progressOf(a) >= READY).length; }
export function finaleUnlocked() { return readyCount() >= BUILD_AREAS.length; }
export function refreshMission() {
  if (!banner) return; const home = F.folkCount(), total = F.TOTAL_FOLK, ready = readyCount();
  const step = S.story.finale ? '<span class="m-goal">The town is saved! 🎉</span>' : finaleUnlocked() ? '<span class="m-goal go">Go to the Lighthouse!</span>' : `<span class="m-goal">★ ${ready}/${BUILD_AREAS.length} places</span>`;
  banner.innerHTML = `<span class="m-people"><b>${home}</b>/${total} home</span>${step}`;
}
function openMission() {
  sfx('pop'); const rows = BUILD_AREAS.map(a => { const p = hooks.progressOf(a); const n = F.RESIDENTS[a].length; const homeN = F.THRESH.filter(t => p >= t - 1e-6).length;
    return h('tr', {}, h('td', {}, PLACE_NAMES[a]), h('td', {}, p >= READY ? h('b', { style: { color: '#2A6E40' } }, '★ ready') : h('span', {}, `${Math.round(p / READY * 100)}% to ★`)), h('td', {}, `${homeN}/${n} people`)); });
  const ov = h('div', { class: 'overlay', onclick: e => { if (e.target === ov) ov.remove(); } }, h('div', { class: 'panel' },
    h('button', { class: 'btn small paper close', onclick: () => ov.remove() }, 'Close'),
    h('h2', {}, 'Your mission'),
    h('ol', { class: 'mission-steps' },
      h('li', {}, 'Play in each place.'),
      h('li', {}, 'Get a ★ on all 8 places.'),
      h('li', {}, 'Go to the Lighthouse. Beat the Storm Cloud!'),
      h('li', {}, 'Party time!')),
    h('table', { class: 'report' }, ...rows)));
  document.body.append(ov);
}

// ---------------------------------------------------------------- opening cutscene
export async function opening() {
  skipping = false; labelsVisible(false); pipVisible(false); hooks.hud(false);
  const all = Object.keys(PLACE_NAMES);
  all.forEach(a => setProgress(a, 1, false)); setWords(TOWN_WORDS, false); F.spawnCrowd(); F.cloudGone(); setSky('day'); lighthouseOn(true);
  T.fly(new T.THREE.Vector3(-26 * T.SP, 22 * T.SP, 30 * T.SP), new T.THREE.Vector3(0, 0, 0), 10);
  T.fly(new T.THREE.Vector3(18 * T.SP, 24 * T.SP, 34 * T.SP), new T.THREE.Vector3(0, 0, 0), 9000);
  await talk('story', 'This is Pebble Town.', { canSkip: true });
  await talk('story', 'Everyone here loves to read and count.', { canSkip: true });
  if (!skipping) {
    setSky('storm'); lighthouseOn(false); F.cloudReset(); F.cloudSize(1.5); sfx('thunder'); flash();
    await overview(1200);
    await talk('cloud', 'HA HA! I am the Storm Cloud!', { canSkip: true });
    F.cloudZap(); sfx('thunder'); flash(); await wait(400); F.cloudZap(); flash(); sfx('thunder');
    all.forEach(a => setProgress(a, 0, true)); setWords([], false); F.freezeAll(true); await wait(700); await F.scatterAll();
    await talk('cloud', 'I broke your town! HA HA!', { canSkip: true });
  } else { all.forEach(a => setProgress(a, 0, false)); setWords([], false); await F.scatterAll(); F.cloudReset(); }
  setSky('day'); F.cloudSize(1.2); hooks.sync();
  const m = F.mayorPos(); await T.fly(new T.THREE.Vector3(m.x + 2, 6, m.z + 11), new T.THREE.Vector3(m.x, 1.8, m.z), 1400);
  skipping = false;
  await talk('mayor', `Oh no! Our town is broken!`);
  await talk('mayor', `${S.name}, please help us fix it!`);
  pipVisible(true); await talk('pip', `I am Pip. I will help you!`);
  await talk('mayor', 'Play in a place to fix it. Then people come home.');
  await talk('mayor', 'Get a ★ on every place. Then go to the Lighthouse!');
  await talk('pip', 'Let\'s go!');
  talkEnd(); await overview(1200); labelsVisible(true); hooks.hud(true); refreshMission();
  banner && banner.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.12)' }, { transform: 'scale(1)' }], { duration: 600, iterations: 3 });
  pip('Look around with me!', { hold: 3000 });
}
function flash() { const f = h('div', { class: 'screen-flash' }); document.body.append(f); f.animate([{ opacity: 0 }, { opacity: .85 }, { opacity: 0 }, { opacity: .5 }, { opacity: 0 }], { duration: 700 }).onfinish = () => f.remove(); }

// ---------------------------------------------------------------- arrivals and quests
export async function welcomeArrivals(list) {
  for (const a of list.slice(0, 4)) {
    const p = F.personPos(a.id); if (!p) continue;
    await T.fly(new T.THREE.Vector3(p.x + 3, 7, p.z + 10), new T.THREE.Vector3(p.x, 1.5, p.z), 900);
    F.sayBubble(a.id, `I'm home! I'm ${a.name}.`, 3); sfx('great');
    await wait(2200);
  }
  if (list.length > 4) await pip(`${list.length - 4} more people came home!`, { mood: 'happy' });
  refreshMission(); topUpQuests();
}
export function topUpQuests() {
  const have = F.questHolders(); const n = F.folkCount(); if (!n) return;
  let need = Math.min(2, n) - have.length;
  const ids = shuffle([...Array(n).keys()].filter(i => !have.includes(i)));
  while (need-- > 0 && ids.length) F.setQuest(ids.pop(), true);
}
export function tapPerson(id) {
  const f = F.getPerson(id); if (!f) return;
  sfx('pop');
  if (!f.quest) { F.sayBubble(id, F.randomLine(id)); return; }
  const q = quick(); F.setQuest(id, false); setQ('choice', { prompt: stripPics(q.prompt), options: q.options, answer: q.answer, id: q.id, long: q.long }, plainText(q.prompt));
  const row = h('div', { class: 'choices' + (q.long ? ' long' : '') });
  const card = h('div', { class: 'panel quest', style: { textAlign: 'center' } },
    h('div', { class: 'quest-who' }, `${f.name} asks:`), h('div', { class: 'prompt', html: q.prompt }), row);
  const ov = h('div', { class: 'overlay' }, card); document.body.append(ov);
  let first = true;
  for (const o of shuffle(q.options)) {
    const b = h('button', { class: 'choice', onclick: async () => {
      if (row.dataset.done || b.classList.contains('wrong')) return;
      if (String(o) === String(q.answer)) { row.dataset.done = 1; b.classList.add('right'); sfx('good'); mark(q.id, true, first); giveCoins(first ? 4 : 1, b); burst(b, first ? 'Thank you!' : 'Got it!');
        S.story.quests++; save(); await wait(900); ov.remove(); F.sayBubble(id, 'Thank you!'); setTimeout(topUpQuests, 25000); }
      else { b.classList.add('wrong'); sfx('bad'); shake(b); if (first) mark(q.id, false, true, o); first = false; }
    } }, String(o));
    row.append(b);
  }
  card.append(h('button', { class: 'btn small paper', style: { marginTop: '16px' }, onclick: () => { ov.remove(); clearQ(); F.setQuest(id, true); } }, 'Maybe later'));
}

// ---------------------------------------------------------------- the finale: chase the Storm Cloud away
const HP = 12;
export async function finale({ preview = false } = {}) {
  skipping = false; hooks.hud(false); labelsVisible(false); F.folkLabels(false);
  const L = T.places.storm.group.position, c = F.cloudPos();
  await T.fly(new T.THREE.Vector3(L.x - 14, 10, L.z + 20), new T.THREE.Vector3((L.x + c.x) / 2, 6, (L.z + c.z) / 2), 1400);
  lighthouseOn(true); setSky('storm'); F.cloudSize(1.4); F.cloudCalm(false); sfx('thunder');
  await talk('cloud', `${S.name}! I will break your town again!`);
  await talk('mayor', 'Right answers zap the cloud. Go!');
  talkEnd();
  let hp = HP, asked = 0, right = 0;
  const hpFill = h('i'), hpBar = h('div', { class: 'boss-hp' }, h('span', {}, 'Storm Cloud'), h('div', { class: 'hp-track' }, hpFill));
  const host = h('div', { class: 'boss-q' }); const quit = h('button', { class: 'btn small paper boss-quit', onclick: () => { stop = true; } }, 'Stop for now');
  const wrap = h('div', { class: 'boss' }, hpBar, host, quit); document.body.append(wrap);
  let stop = false; const setHp = () => hpFill.style.width = (hp / HP * 100) + '%'; setHp();
  let set = finaleSet(20);
  while (hp > 0 && !stop) {
    if (!set.length) set = finaleSet(20);
    const q = set.shift(); asked++;
    const ok = await bossQuestion(host, q, () => stop);
    if (stop) break;
    if (ok) { right++; hp--; setHp(); F.beamShot(); sfx('great'); hpBar.animate([{ transform: 'translateX(-50%) scale(1)' }, { transform: 'translateX(-50%) scale(1.06)' }, { transform: 'translateX(-50%) scale(1)' }], { duration: 300 }); F.cloudSize(0.6 + 0.8 * hp / HP); }
    else { F.cloudZap(); sfx('thunder'); flash(); }
    await wait(700);
  }
  wrap.remove();
  if (stop) { setSky('day'); F.cloudSize(1); F.cloudCalm(true); setTimeout(() => F.cloudCalm(false), 100); await overview(1000); labelsVisible(true); F.folkLabels(true); hooks.hud(true); pip('Come back soon!'); return false; }
  if (!preview) { S.story.finale = 1; S.storm.won = (S.storm.won || 0) + 1; S.storm.best = Math.max(S.storm.best || 0, right); S.storm.lastAcc = Math.round(right / asked * 100); save(); }
  await talk('cloud', 'NOOO! I am melting!');
  talkEnd(); await F.cloudVanish(); await festival(true, preview);
  return true;
}
function bossQuestion(host, q, stopped) {
  return new Promise(res => {
    host.innerHTML = ''; if (window.__TEST) window.__bossAns = q.answer; setQ('choice', { prompt: stripPics(q.prompt), options: q.options, answer: q.answer, id: q.id, long: q.long }, plainText(q.prompt)); const row = h('div', { class: 'choices' + (q.long ? ' long' : '') });
    host.append(h('div', { class: 'prompt', html: q.prompt }), row);
    const tick = setInterval(() => { if (stopped()) { clearInterval(tick); res(false); } }, 200);
    for (const o of shuffle(q.options)) {
      const b = h('button', { class: 'choice', onclick: async () => {
        if (row.dataset.done) return; row.dataset.done = 1; clearInterval(tick);
        const ok = String(o) === String(q.answer); mark(q.id, ok, true, ok ? null : o);
        [...row.children].forEach(x => { if (x.textContent === String(q.answer)) x.classList.add('right'); else if (x !== b) x.classList.add('dim'); });
        if (ok) { sfx('good'); burst(b, cheer()); giveCoins(1, b); await wait(500); } else { b.classList.add('wrong'); sfx('bad'); await wait(1500); }
        res(ok);
      } }, String(o));
      row.append(b);
    }
  });
}

// ---------------------------------------------------------------- festival + certificate
let previewing = false;
export async function festival(first = false, preview = false) {
  previewing = preview;
  hooks.hud(false); labelsVisible(false); F.folkLabels(false); F.cloudGone();
  setSky('dusk'); lighthouseOn(true); hooks.festivalTown && hooks.festivalTown();
  sfx('fanfare'); F.cheerAll(14);
  let fw = setInterval(() => { F.firework(); if (Math.random() < 0.6) F.firework(); sfx('pop'); }, 450);
  const fly = [[0, 26, 34], [28, 18, 10], [8, 14, -30], [-28, 18, 6], [0, 30, 40]];
  for (let i = 0; i < fly.length; i++) { T.fly(new T.THREE.Vector3(...fly[i].map(v => v * T.SP)), new T.THREE.Vector3(0, 0, 0), 3000); if (i === 0) await talk('mayor', first ? `The Storm Cloud is gone! Thank you, ${S.name}!` : `Party time!`, { auto: 5000 }); else if (i === 1) await talk('pip', 'Look! Everyone is here!', { auto: 4000 }); else await wait(2600); }
  talkEnd(); clearInterval(fw);
  certificate(first);
}
export function certificate(first) {
  const words = SPELLING.filter(s => (S.items['sp:' + s.w] || { box: 0 }).box >= 2).length;
  const sents = SENTENCES.filter(s => ['sb:', 'sf:', 'sm:', 'sw:'].some(p => (S.items[p + s.id] || { box: 0 }).box >= 1)).length;
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const ov = h('div', { class: 'overlay' }, h('div', { class: 'panel cert' },
    h('div', { class: 'cert-top' }, '★ Pebble Town ★'), h('h2', {}, 'Hero of Pebble Town'), h('p', {}, 'This certificate is given to'), h('div', { class: 'cert-name' }, S.name),
    h('p', {}, 'for saving Pebble Town!'),
    h('div', { class: 'cert-stats' }, h('span', {}, h('b', {}, String(words)), ' words spelled'), h('span', {}, h('b', {}, String(sents)), ' sentences built'), h('span', {}, h('b', {}, String(F.TOTAL_FOLK)), ' people home')),
    h('p', { class: 'cert-date' }, date + ' · signed, Mayor Pebble and Pip'),
    h('div', { style: { display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' } },
      h('button', { class: 'btn blue', onclick: () => print() }, 'Print'),
      h('button', { class: 'btn green', onclick: () => { ov.remove(); setSky('day'); hooks.sync(); if (previewing && !S.story.finale) { F.cloudReset(); hooks.sync(); } previewing = false; overview(1200); labelsVisible(true); F.folkLabels(true); hooks.hud(true); refreshMission(); pip('Now get ★★★ on every place!', { hold: 6000 }); } }, 'Back to town'))));
  document.body.append(ov); confetti(innerWidth / 2, innerHeight / 3, 90);
}

// ---------------------------------------------------------------- new chapter: the fog lifts and Word Island appears
export async function wordIsleIntro() {
  hooks.hud(false); labelsVisible(false); F.folkLabels(false);
  const v = wordIsleView(); await T.fly(v.pos, v.target, 2200); sfx('great');
  await talk('pip', 'Look! The fog is moving!');
  await talk('mayor', 'A new island! It is Word Island.');
  await talk('mayor', 'Long ago, a bridge went there.');
  await talk('pip', 'Oh no. The bridge is broken!');
  await talk('mayor', `${S.name}, use this week's words to build a new bridge!`);
  await talk('pip', 'Tap the Bridge button to start building!');
  talkEnd(); S.story.wordIsle3 = 1; save();
  await overview(1400); labelsVisible(true); F.folkLabels(true); hooks.hud(true);
}
