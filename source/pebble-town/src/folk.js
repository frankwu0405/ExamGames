// Townsfolk who come home and walk around, plus the Storm Cloud that hangs over the town.
import { T } from './town3d.js';

const SKIN = [0xF6D2B5, 0xE8B48F, 0xC98E64, 0x8D5A3B, 0xFFE0C7];
const HAIR = [0x2E2A4F, 0x6B4A33, 0xD9A441, 0x9C3B2E, 0x55595F];

// Four residents per place. They come home as the place is rebuilt (at 15%, 40%, 70% and 100%).
export const RESIDENTS = {
  signs: [['Sam', 'the sign painter', 0xEF5B4C, 'cap'], ['Lulu', 'the shop girl', 0xF49AA4, 'bow'], ['Mr. Fox', 'the shopper', 0xF08A2E, 'hat'], ['Kai', 'the paper boy', 0x4FB3D9, 'cap']],
  library: [['Ms. Owl', 'the librarian', 0x7A5BA6, 'bun'], ['Ben', 'the book worm', 0x3E9B5C, 'none'], ['Rosa', 'the reader', 0xEF5B4C, 'bow'], ['Grandpa Lin', 'the storyteller', 0x9C8A7A, 'hat']],
  detective: [['Detective Dot', 'the detective', 0xC9A227, 'deer'], ['Max', 'the helper', 0x4B3C70, 'cap'], ['Nina', 'the writer', 0x4CA7A0, 'bun'], ['Officer Ray', 'the police officer', 0x3B5EA8, 'police']],
  bridge: [['Captain Bo', 'the boat captain', 0xFFFDF4, 'captain'], ['Mia', 'the swimmer', 0xFFC94A, 'none'], ['Leo', 'the fisher', 0x3E9B5C, 'hat'], ['Tess', 'the jogger', 0xF08A2E, 'cap']],
  market: [['Mrs. Plum', 'the fruit seller', 0x7A5BA6, 'bun'], ['Bao', 'the baker', 0xFFFDF4, 'chef'], ['Jun', 'the farmer', 0xC98B4F, 'straw'], ['Lily', 'the shopper', 0xF49AA4, 'bow']],
  train: [['Conductor Kim', 'the train driver', 0x2F6E4A, 'conductor'], ['Pat', 'the porter', 0xEF5B4C, 'cap'], ['Ivy', 'the traveller', 0x4FB3D9, 'hat'], ['Gus', 'the ticket man', 0x55595F, 'cap']],
  workshop: [['Builder Bob', 'the builder', 0xFFC94A, 'helmet'], ['Zoe', 'the inventor', 0x4CA7A0, 'goggles'], ['Hank', 'the carpenter', 0xC2513F, 'helmet'], ['Ana', 'the painter', 0x7A5BA6, 'beret']],
  science: [['Dr. Sunny', 'the scientist', 0xFFFFFF, 'goggles'], ['Leo', 'the star watcher', 0x3B5EA8, 'cap'], ['Ivy', 'the lab helper', 0x4CA7A0, 'bun'], ['Professor Fox', 'the inventor', 0x9C8A7A, 'hat']],
  storm: [['Keeper Joy', 'the lighthouse keeper', 0x3B5EA8, 'captain'], ['Nico', 'the sailor', 0xFFFDF4, 'sailor'], ['Pearl', 'the shell collector', 0xF49AA4, 'straw'], ['Old Tom', 'the fisherman', 0xFFC94A, 'hat']],
};
export const THRESH = [0.15, 0.4, 0.7, 1.0];
export const TOTAL_FOLK = Object.values(RESIDENTS).reduce((a, r) => a + r.length, 0);
export const homeCount = progressOf => Object.keys(RESIDENTS).reduce((a, k) => a + THRESH.filter(t => progressOf(k) >= t - 1e-6).length, 0);

const HOME_LINES = {
  signs: ['My shop has a sign again!', 'Can you spell "stamp"? I can!', 'I love reading the shop signs.'],
  library: ['Shh! I am reading a book.', 'A title is the name of a book.', 'This library is my favourite place.'],
  detective: ['The setting is where a story happens.', 'I solved a case today!', 'Every story has characters.'],
  bridge: ['Now I can cross the river!', 'A sentence starts with a capital letter.', 'Don\'t forget the period at the end!'],
  market: ['Fresh plums! Two for ten dollars!', 'One plum, two plums, three plums!', 'A watermelon is about four kilograms.'],
  train: ['Choo choo! All aboard!', 'Next stop: Pebble Town!', 'The train is long. "Long" ends with n-g!'],
  workshop: ['I fixed the machine!', 'One child, two children!', 'Do you have any nails? I have some.'],
  science: ['Light helps us to see!', 'A shadow forms when something blocks the light.', 'Heat can change the shape of ice cream!'],
  storm: ['The lighthouse keeps us safe.', 'I can see the sea from here!', 'The storm is scary. Can you stop it?'],
};

let folk = [], mayor = null, bridgeReady = false, onArrive = () => {}, labelsOn = true;
const tmp = { v: null };

function person(shirt, hat, seed = 0, scale = 1.45) {
  const { THREE, builder } = T; const g = new THREE.Group();
  const b = builder(g); const skin = SKIN[seed % SKIN.length], hair = HAIR[(seed * 3 + 1) % HAIR.length], pants = [0x3B4A6B, 0x55595F, 0x6B4A33, 0x2E2A4F][seed % 4];
  const leg = x => { const p = new THREE.Group(); p.position.set(x, 0.48, 0); g.add(p); builder(p).box(0.15, 0.46, 0.17, pants, 0, -0.23, 0, { line: 0.02 }); builder(p).box(0.17, 0.08, 0.24, 0x2E2A4F, 0, -0.46, 0.03, { line: 0 }); return p; };
  const arm = x => { const p = new THREE.Group(); p.position.set(x, 0.98, 0); g.add(p); builder(p).box(0.11, 0.42, 0.12, shirt, 0, -0.2, 0, { line: 0.02 }); builder(p).ball(0.07, skin, 0, -0.43, 0, { line: 0 }); return p; };
  const L = leg(-0.1), R = leg(0.1);
  b.cyl(0.25, 0.28, 0.58, shirt, 0, 0.77, 0, { line: 0.025 });
  const AL = arm(-0.33), AR = arm(0.33);
  const head = new THREE.Group(); head.position.y = 1.3; g.add(head); const hb = builder(head);
  hb.ball(0.24, skin, 0, 0, 0, { line: 0.025, seg: 16 });
  hb.ball(0.035, 0x2E2A4F, -0.08, 0.02, 0.21, { line: 0 }); hb.ball(0.035, 0x2E2A4F, 0.08, 0.02, 0.21, { line: 0 });
  hb.ball(0.04, 0xF49AA4, -0.13, -0.07, 0.18, { line: 0 }); hb.ball(0.04, 0xF49AA4, 0.13, -0.07, 0.18, { line: 0 });
  const H = {
    cap: () => { hb.ball(0.25, shirt, 0, 0.06, 0, { line: 0.02 }); hb.box(0.26, 0.04, 0.2, shirt, 0, 0.08, 0.2, { line: 0.02 }); },
    bow: () => { hb.ball(0.25, hair, 0, 0.07, -0.03, { line: 0.02 }); hb.ball(0.08, 0xEF5B4C, -0.14, 0.24, 0, { line: 0.02 }); hb.ball(0.08, 0xEF5B4C, 0.14, 0.24, 0, { line: 0.02 }); },
    hat: () => { hb.cyl(0.33, 0.33, 0.04, 0x6B4A33, 0, 0.18, 0, { line: 0.02 }); hb.cyl(0.2, 0.22, 0.2, 0x6B4A33, 0, 0.28, 0, { line: 0.02 }); },
    bun: () => { hb.ball(0.25, hair, 0, 0.07, -0.03, { line: 0.02 }); hb.ball(0.12, hair, 0, 0.27, -0.12, { line: 0.02 }); },
    none: () => { hb.ball(0.25, hair, 0, 0.08, -0.04, { line: 0.02 }); },
    deer: () => { hb.cyl(0.27, 0.27, 0.2, 0x9C7A4A, 0, 0.18, 0, { line: 0.02 }); hb.box(0.5, 0.04, 0.3, 0x9C7A4A, 0, 0.1, 0, { line: 0.02 }); },
    police: () => { hb.cyl(0.27, 0.24, 0.16, 0x2E3F78, 0, 0.2, 0, { line: 0.02 }); hb.box(0.3, 0.04, 0.16, 0x2E2A4F, 0, 0.12, 0.2, { line: 0 }); hb.ball(0.04, 0xFFC94A, 0, 0.22, 0.25, { line: 0 }); },
    captain: () => { hb.cyl(0.28, 0.25, 0.14, 0xFFFDF4, 0, 0.2, 0, { line: 0.02 }); hb.box(0.32, 0.04, 0.16, 0x2E2A4F, 0, 0.13, 0.2, { line: 0 }); },
    chef: () => { hb.cyl(0.22, 0.2, 0.32, 0xFFFFFF, 0, 0.32, 0, { line: 0.02 }); hb.ball(0.2, 0xFFFFFF, 0, 0.5, 0, { line: 0.02 }); },
    straw: () => { hb.cyl(0.4, 0.4, 0.03, 0xE9C46A, 0, 0.18, 0, { line: 0.02 }); hb.cyl(0.18, 0.22, 0.16, 0xE9C46A, 0, 0.27, 0, { line: 0.02 }); },
    conductor: () => { hb.cyl(0.25, 0.25, 0.18, 0x2E2A4F, 0, 0.22, 0, { line: 0.02 }); hb.box(0.3, 0.04, 0.16, 0x2E2A4F, 0, 0.14, 0.2, { line: 0 }); },
    helmet: () => { hb.ball(0.27, 0xFFC94A, 0, 0.08, 0, { line: 0.02 }); hb.cyl(0.3, 0.3, 0.03, 0xFFC94A, 0, 0.06, 0.04, { line: 0.02 }); },
    goggles: () => { hb.ball(0.25, hair, 0, 0.08, -0.04, { line: 0.02 }); hb.torus(0.06, 0.02, 0x2E2A4F, -0.08, 0.13, 0.21, { line: 0 }); hb.torus(0.06, 0.02, 0x2E2A4F, 0.08, 0.13, 0.21, { line: 0 }); },
    beret: () => { hb.ball(0.25, hair, 0, 0.06, -0.04, { line: 0.02 }); hb.cyl(0.26, 0.28, 0.08, 0xEF5B4C, 0.04, 0.24, 0, { rz: 0.2, line: 0.02 }); },
    sailor: () => { hb.cyl(0.24, 0.22, 0.12, 0xFFFFFF, 0, 0.21, 0, { line: 0.02 }); },
    top: () => { hb.cyl(0.32, 0.32, 0.04, 0x2E2A4F, 0, 0.18, 0, { line: 0.02 }); hb.cyl(0.19, 0.19, 0.42, 0x2E2A4F, 0, 0.4, 0, { line: 0.02 }); hb.cyl(0.2, 0.2, 0.08, 0xEF5B4C, 0, 0.24, 0, { line: 0 }); },
  };
  (H[hat] || H.none)();
  g.scale.setScalar(scale);
  return { g, L, R, AL, AR, head };
}

function freePoint(near, side) {
  const { places, PLOTS, riverXAt, insideIsland, RX, RZ } = T;
  for (let k = 0; k < 60; k++) {
    let x, z;
    if (near) { const a = Math.random() * Math.PI * 2, r = near.r + 0.9 + Math.random() * 2.2; x = near.x + Math.cos(a) * r; z = near.z + Math.sin(a) * r; }
    else { x = (Math.random() * 2 - 1) * RX; z = (Math.random() * 2 - 1) * RZ; }
    if (!insideIsland(x, z, 2.6)) continue;
    const rx = riverXAt(z); if (Math.abs(x - rx) < 3.4) continue;
    if (side && Math.sign(x - rx) !== side) continue;
    if (PLOTS.some(p => p.area !== 'bridge' && Math.hypot(p.x - x, p.z - z) < p.r + 0.4)) continue;
    if (T.decorObs.some(p => Math.hypot(p.x - x, p.z - z) < p.r + 0.5)) continue;
    if (z < -12.4 * T.SP && x > 0) continue; // railway
    return { x, z };
  }
  return near ? { x: near.x + near.r + 1, z: near.z } : { x: -10, z: 0 };
}
const sideOf = (x, z) => Math.sign(x - T.riverXAt(z)) || 1;
function bridgeEnds() {
  const P = T.places.bridge; const g = P.group; const c = Math.cos(g.rotation.y), s = Math.sin(g.rotation.y);
  const end = lx => ({ x: g.position.x + lx * c, z: g.position.z - lx * s });
  return [end(-4.6), end(4.6)];
}

function spawn(area, idx, { animate = false } = {}) {
  const [name, role, shirt, hat] = RESIDENTS[area][idx]; const seed = name.length * 7 + idx * 3;
  const P = person(shirt, hat, seed); const plot = T.PLOTS.find(p => p.area === area);
  const home = area === 'bridge' ? { x: plot.x - 5.5, z: plot.z, r: 0.5 } : plot;
  const homeSide = area === 'bridge' ? -1 : sideOf(plot.x, plot.z);
  const start = freePoint(home, homeSide);
  P.g.position.set(start.x, T.Y0, start.z); T.scene.add(P.g); P.g.traverse(o => { if (o.isMesh) { o.castShadow = true; } });
  const hit = new T.THREE.Mesh(new T.THREE.CylinderGeometry(0.7, 0.7, 2.4, 8), new T.THREE.MeshBasicMaterial({ visible: false })); hit.position.y = 1.2; P.g.add(hit);
  const f = Object.assign(P, { id: folk.length, area, idx, name, role, home, homeSide, path: [], wait: Math.random() * 2, phase: Math.random() * 6, speed: 1.1 + Math.random() * 0.5,
    lines: HOME_LINES[area], quest: false, mark: null, bubble: null, bubbleT: 0, cheer: 0 });
  hit.userData.person = f.id; T.raycastTargets.push(hit);
  folk.push(f);
  if (animate) { P.g.scale.setScalar(0.01); f.pop = 0; T.sparkles(start.x, 2, start.z, 18); }
  return f;
}

function plan(f) {
  f.lastD = null; f.stuckT = 0;
  const x = f.g.position.x, z = f.g.position.z, side = sideOf(x, z);
  const goHome = Math.random() < 0.55;
  let target = freePoint(goHome ? f.home : null, bridgeReady ? null : side);
  const tSide = sideOf(target.x, target.z);
  if (tSide !== side) { const [a, b] = bridgeEnds(); const [near, far] = Math.hypot(a.x - x, a.z - z) < Math.hypot(b.x - x, b.z - z) ? [a, b] : [b, a]; f.path = [near, far, target]; }
  else f.path = [target];
}

function tick(t, dt) {
  const { places, PLOTS } = T;
  for (const f of folk) {
    const g = f.g;
    if (f.pop != null) { f.pop += dt * 2.2; const k = Math.min(1, f.pop); g.scale.setScalar(1.45 * (k + Math.sin(k * Math.PI) * 0.35)); g.position.y = T.Y0 + Math.sin(k * Math.PI) * 1.2; if (k >= 1) { f.pop = null; g.scale.setScalar(1.45); } continue; }
    if (f.cheer > 0) { f.cheer -= dt; g.position.y = T.Y0 + Math.abs(Math.sin(t * 9 + f.id)) * 0.5; f.AL.rotation.z = -2.6; f.AR.rotation.z = 2.6; f.L.rotation.x = f.R.rotation.x = 0; if (f.cheer <= 0) { g.position.y = T.Y0; f.AL.rotation.z = f.AR.rotation.z = 0; } continue; }
    if (f.frozen) continue;
    if (f.wait > 0) {
      f.wait -= dt; f.L.rotation.x += (0 - f.L.rotation.x) * 0.2; f.R.rotation.x += (0 - f.R.rotation.x) * 0.2; f.AL.rotation.x *= 0.8; f.AR.rotation.x *= 0.8;
      f.AR.rotation.z = f.wave > 0 ? 2.4 + Math.sin(t * 12) * 0.4 : f.AR.rotation.z * 0.85; if (f.wave > 0) f.wave -= dt;
      f.head.rotation.y = Math.sin(t * 0.8 + f.id) * 0.4;
      if (f.wait <= 0) plan(f); continue;
    }
    const wp = f.path[0]; if (!wp) { f.wait = 1 + Math.random() * 4; if (Math.random() < 0.25) f.wave = 1.6; continue; }
    const dx = wp.x - g.position.x, dz = wp.z - g.position.z, d = Math.hypot(dx, dz);
    if (d < 0.25) { f.path.shift(); if (!f.path.length) { f.wait = 1.5 + Math.random() * 4; if (Math.random() < 0.3) f.wave = 1.6; } continue; }
    let vx = dx / d, vz = dz / d;
    const onBridge = f.path.length >= 2 || (f.path.length === 1 && f.crossing);
    // steer around buildings: slide sideways along the edge instead of bouncing off it
    for (const p of PLOTS.concat(T.decorObs)) { if (p.area === 'bridge') continue; const ox = g.position.x - p.x, oz = g.position.z - p.z, od = Math.hypot(ox, oz), R = p.r + 0.7;
      if (od < R + 1.2) { const nx = ox / od, nz = oz / od, into = -(vx * nx + vz * nz); if (into > 0) { const k = Math.min(1, (R + 1.2 - od) / 1.2); vx += nx * into * k * 1.1; vz += nz * into * k * 1.1; }
        if (od < R) { g.position.x = p.x + nx * R; g.position.z = p.z + nz * R; } } }
    for (const o of folk) { if (o === f) continue; const ox = g.position.x - o.g.position.x, oz = g.position.z - o.g.position.z, od = Math.hypot(ox, oz); if (od < 0.8 && od > 0.001) { vx += ox / od * 0.25 * (1 - od / 0.8); vz += oz / od * 0.25 * (1 - od / 0.8); } }
    const vl = Math.hypot(vx, vz) || 1; vx /= vl; vz /= vl;
    // smooth the heading so small pushes never cause twitching
    const k = Math.min(1, dt * 3.5); f.vx = (f.vx ?? vx) + (vx - (f.vx ?? vx)) * k; f.vz = (f.vz ?? vz) + (vz - (f.vz ?? vz)) * k;
    const sl = Math.hypot(f.vx, f.vz) || 1; const sp = f.speed * dt; g.position.x += f.vx / sl * sp; g.position.z += f.vz / sl * sp;
    let want = Math.atan2(f.vx, f.vz), cur = g.rotation.y; let da = ((want - cur + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI; g.rotation.y = cur + da * Math.min(1, dt * 8);
    // if stuck (not getting closer), pick a new place to go
    f.stuckT = (f.stuckT || 0) + dt; if (f.stuckT > 2.5) { const now = Math.hypot(wp.x - g.position.x, wp.z - g.position.z); if (f.lastD != null && f.lastD - now < 0.6) { f.path = []; f.wait = 0.8; } f.lastD = now; f.stuckT = 0; }
    f.phase += dt * f.speed * 7;
    const sw = Math.sin(f.phase) * 0.55; f.L.rotation.x = sw; f.R.rotation.x = -sw; f.AL.rotation.x = -sw * 0.8; f.AR.rotation.x = sw * 0.8; f.AR.rotation.z *= 0.8;
    const br = places.bridge; const onDeck = br && Math.hypot(g.position.x - br.group.position.x, g.position.z - br.group.position.z) < 3.4;
    g.position.y = T.Y0 + Math.abs(Math.sin(f.phase)) * 0.06 + (onDeck ? 0.55 + 0.5 * Math.max(0, 1 - Math.hypot(g.position.x - br.group.position.x, g.position.z - br.group.position.z) / 3.4) : 0);
  }
  // labels (quest marks and speech bubbles)
  for (const f of folk) {
    const v = new T.THREE.Vector3(f.g.position.x, f.g.position.y + 2.55, f.g.position.z);
    if (f.mark) { f.mark.style.display = labelsOn ? '' : 'none'; if (labelsOn) T.placeLabel(f.mark, v); }
    if (f.bubble) { f.bubbleT -= dt; if (f.bubbleT <= 0) { f.bubble.remove(); f.bubble = null; } else T.placeLabel(f.bubble, v.add(new T.THREE.Vector3(0, f.mark ? 0.9 : 0, 0))); }
  }
  if (mayor) mayorTick(t, dt);
  cloudTick(t, dt);
}

// ---------------------------------------------------------------- the Mayor (always in town)
function mayorTick(t) { if (mayor.talking) { mayor.AR.rotation.z = 0.6 + Math.sin(t * 6) * 0.3; mayor.head.rotation.y = 0; } }

// ---------------------------------------------------------------- public API
export function initFolk({ onArrival }) {
  onArrive = onArrival || onArrive; T.ticks.push(tick);
  const M = person(0x7A2E3A, 'top', 2, 1.4); mayor = Object.assign(M, { talking: false });
  mayor.g.position.set(-6.2, T.Y0, -1.5); mayor.g.rotation.y = 0.5; T.scene.add(mayor.g);
  const sash = T.builder(mayor.g).box(0.08, 0.6, 0.53, 0xFFC94A, 0, 0.8, 0, { rx: 0, rz: 0.6, line: 0 });
  buildCloud();
}
export function syncFolk(progressOf, { animate = false, bridge = 0 } = {}) {
  bridgeReady = bridge >= 0.5; const arrived = [];
  for (const area of Object.keys(RESIDENTS)) {
    const n = THRESH.filter(t => progressOf(area) >= t - 1e-6).length;
    for (let i = 0; i < n; i++) if (!folk.some(f => f.area === area && f.idx === i)) arrived.push(spawn(area, i, { animate }));
  }
  return arrived.map(f => ({ name: f.name, role: f.role, area: f.area, id: f.id }));
}
export function folkCount() { return folk.length; }
export function getPerson(id) { return folk[id]; }
export function personPos(id) { const f = folk[id]; return f && { x: f.g.position.x, z: f.g.position.z }; }
export function sayBubble(id, text, secs = 3.5) {
  const f = folk[id]; if (!f) return; if (f.bubble) f.bubble.remove();
  f.bubble = T.makeLabel(text, 'speech-label', () => {}); f.bubbleT = secs; f.wait = Math.max(f.wait, secs); f.path = [];
  f.g.rotation.y = Math.atan2(T.camera.position.x - f.g.position.x, T.camera.position.z - f.g.position.z);
}
export function randomLine(id) { const f = folk[id]; return f.lines[Math.floor(Math.random() * f.lines.length)]; }
export function setQuest(id, on) {
  const f = folk[id]; if (!f) return; f.quest = on;
  if (on && !f.mark) f.mark = T.makeLabel('!', 'quest-mark', () => T.onPersonProxy && T.onPersonProxy(id));
  if (!on && f.mark) { f.mark.remove(); f.mark = null; }
}
export function questHolders() { return folk.filter(f => f.quest).map(f => f.id); }
export function folkLabels(on) { labelsOn = on; }
export function cheerAll(secs = 6) { folk.forEach((f, i) => setTimeout(() => f.cheer = secs, i * 60)); if (mayor) mayor.talking = true; }
export function freezeAll(on) { folk.forEach(f => f.frozen = on); }
export function scatterAll() { // the storm blows everyone away
  return new Promise(res => { const t0 = performance.now(); const start = folk.map(f => ({ x: f.g.position.x, z: f.g.position.z }));
    const step = () => { const k = Math.min(1, (performance.now() - t0) / 1600);
      folk.forEach((f, i) => { f.g.position.y = T.Y0 + k * k * 18; f.g.position.x = start[i].x + k * 10; f.g.rotation.z = k * 6; f.g.scale.setScalar(1.25 * (1 - k * 0.7)); });
      if (k < 1) requestAnimationFrame(step); else { folk.forEach(f => { T.scene.remove(f.g); if (f.mark) f.mark.remove(); if (f.bubble) f.bubble.remove(); }); T.raycastTargets.splice(0, T.raycastTargets.length, ...T.raycastTargets.filter(h => h.userData.person == null)); folk = []; res(); } };
    step(); });
}
export function spawnCrowd() { for (const area of Object.keys(RESIDENTS)) for (let i = 0; i < 4; i++) spawn(area, i); }
export function mayorTalk(on) { if (mayor) { mayor.talking = on; if (!on) mayor.AR.rotation.z = 0; } }
export function mayorPos() { return mayor.g.position; }

// ---------------------------------------------------------------- Storm Cloud
let cloud = null;
function buildCloud() {
  const { THREE, builder } = T; const g = new THREE.Group(); const b = builder(g);
  const body = new THREE.Group(); g.add(body); const bb = builder(body);
  [[0, 0, 0, 2.2], [-2, -0.3, 0.2, 1.6], [2, -0.2, 0.1, 1.7], [-1, 1.1, -0.2, 1.5], [1.2, 1.0, -0.3, 1.4], [-3.2, -0.5, -0.3, 1.0], [3.3, -0.5, -0.2, 1.1]]
    .forEach(([x, y, z, r]) => bb.ball(r, 0x575C7E, x, y, z, { line: 0.06, seg: 16, shadow: false }));
  const face = new THREE.Group(); face.position.set(0, 0.1, 2.0); body.add(face); const fb = builder(face);
  fb.ball(0.42, 0xFFFFFF, -0.75, 0.2, 0, { line: 0.04 }); fb.ball(0.42, 0xFFFFFF, 0.75, 0.2, 0, { line: 0.04 });
  const pl = fb.ball(0.2, 0x1E2148, -0.7, 0.12, 0.33, { line: 0 }), pr = fb.ball(0.2, 0x1E2148, 0.7, 0.12, 0.33, { line: 0 });
  const browL = fb.box(0.75, 0.16, 0.12, 0x1E2148, -0.75, 0.75, 0.25, { rz: -0.4, line: 0 }), browR = fb.box(0.75, 0.16, 0.12, 0x1E2148, 0.75, 0.75, 0.25, { rz: 0.4, line: 0 });
  const mouth = fb.box(0.9, 0.12, 0.1, 0x1E2148, 0, -0.55, 0.3, { line: 0 });
  // rain
  const rain = new THREE.Group(); g.add(rain); const drops = [];
  const rmat = new THREE.MeshBasicMaterial({ color: 0x9FC6E8, transparent: true, opacity: 0.7 });
  for (let i = 0; i < 70; i++) { const d = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.5, 0.05), rmat); d.position.set((Math.random() - 0.5) * 7, -Math.random() * 12, (Math.random() - 0.5) * 3); rain.add(d); drops.push(d); }
  // lightning bolt
  const bolt = new THREE.Group(); g.add(bolt); bolt.visible = false; const boltMat = new THREE.MeshBasicMaterial({ color: 0xFFF3B0 });
  let px = 0, py = -1.5; for (let i = 0; i < 6; i++) { const nx = px + (i % 2 ? 0.8 : -0.8), ny = py - 1.9; const len = Math.hypot(nx - px, ny - py);
    const seg = new THREE.Mesh(new THREE.BoxGeometry(0.22, len, 0.22), boltMat); seg.position.set((px + nx) / 2, (py + ny) / 2, 0.5); seg.rotation.z = Math.atan2(nx - px, -(ny - py)) * -1; bolt.add(seg); px = nx; py = ny; }
  const flash = new THREE.PointLight(0xFFF3B0, 0, 60); flash.position.set(0, -3, 3); g.add(flash);
  g.position.set(9, 9.5, -5); T.scene.add(g);
  cloud = { g, body, face, pl, pr, browL, browR, mouth, rain, drops, bolt, flash, size: 1, targetSize: 1, hurt: 0, zap: 0, mood: 'angry', gone: false, home: g.position.clone(), nextZap: 4 };
}
function cloudTick(t, dt) {
  const c = cloud; if (!c || c.gone && c.g.visible === false) return;
  c.size += (c.targetSize - c.size) * 0.04; c.g.scale.setScalar(c.size);
  c.g.position.y = c.home.y + Math.sin(t * 0.9) * 0.4; c.g.position.x = c.home.x + Math.sin(t * 0.35) * 2.2;
  c.g.rotation.y = Math.sin(t * 0.5) * 0.15 + Math.atan2(T.camera.position.x - c.g.position.x, T.camera.position.z - c.g.position.z) * 0.6;
  const look = Math.sin(t * 1.3) * 0.12; c.pl.position.x = -0.7 + look; c.pr.position.x = 0.7 + look;
  c.drops.forEach(d => { d.position.y -= dt * 14; if (d.position.y < -12) d.position.y = -1.5 - Math.random(); });
  if (c.hurt > 0) { c.hurt -= dt; c.body.position.x = Math.sin(t * 60) * 0.25 * c.hurt; c.body.children.forEach(m => m.material && m.material.color && !m.userData.isOutline); } else c.body.position.x = 0;
  if (c.zap > 0) { c.zap -= dt; c.bolt.visible = Math.sin(t * 50) > -0.3; c.flash.intensity = c.bolt.visible ? 60 : 0; } else { c.bolt.visible = false; c.flash.intensity = 0; }
  if (!c.calm && !c.gone) { c.nextZap -= dt; if (c.nextZap <= 0) { c.nextZap = 6 + Math.random() * 8; c.zap = 0.35; } }
}
export function cloudSize(s) { if (cloud) cloud.targetSize = s; }
export function cloudHit() { if (!cloud) return; cloud.hurt = 0.7; T.sparkles(cloud.g.position.x, cloud.g.position.y, cloud.g.position.z + 2, 20); }
export function cloudZap() { if (cloud) cloud.zap = 0.5; }
export function cloudPos() { return cloud.g.position; }
export function cloudCalm(on) { if (!cloud) return; cloud.calm = on; cloud.rain.visible = !on; }
export function cloudVanish() {
  return new Promise(res => { const c = cloud; const t0 = performance.now(); c.browL.rotation.z = 0.4; c.browR.rotation.z = -0.4; c.mouth.scale.set(0.5, 3, 1); c.rain.visible = false;
    const step = () => { const k = Math.min(1, (performance.now() - t0) / 2200); c.targetSize = c.size = (1 - k) * 1.1 + 0.001; c.g.position.y += 0.03; c.g.rotation.z = Math.sin(k * 30) * 0.2 * (1 - k);
      if (k < 1) requestAnimationFrame(step); else { c.g.visible = false; c.gone = true; for (let i = 0; i < 4; i++) setTimeout(() => T.sparkles(c.g.position.x, c.g.position.y, c.g.position.z, 30), i * 150); res(); } };
    step(); });
}
export function cloudReset() { if (!cloud) return; cloud.g.visible = true; cloud.gone = false; cloud.rain.visible = true; cloud.calm = false; cloud.mouth.scale.set(1, 1, 1); cloud.browL.rotation.z = -0.4; cloud.browR.rotation.z = 0.4; }
export function cloudGone() { if (cloud) { cloud.g.visible = false; cloud.gone = true; } }

// Lighthouse beam that shoots at the cloud
let shot = null;
export function beamShot() {
  const { THREE } = T; const L = T.places.storm.group.position; const from = new THREE.Vector3(L.x, 7.8, L.z), to = cloud.g.position.clone();
  const len = from.distanceTo(to); const m = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.9, len, 12, 1, true), new THREE.MeshBasicMaterial({ color: 0xFFF3B0, transparent: true, opacity: 0.9, depthWrite: false }));
  m.position.copy(from).add(to).multiplyScalar(0.5); m.lookAt(to); m.rotateX(Math.PI / 2); T.scene.add(m);
  const t0 = performance.now(); const step = () => { const k = (performance.now() - t0) / 600; m.material.opacity = 0.9 * (1 - k); m.scale.x = m.scale.z = 1 + k; if (k < 1) requestAnimationFrame(step); else T.scene.remove(m); }; step();
  setTimeout(cloudHit, 120);
}
// Fireworks for the festival
export function firework() {
  const { THREE } = T; const x = (Math.random() - 0.5) * 30, z = (Math.random() - 0.5) * 16 - 4, y = 14 + Math.random() * 8;
  const cols = [0xFFC94A, 0xEF5B4C, 0x4FB3D9, 0x7CC24A, 0xF49AA4, 0xFFFFFF]; const col = cols[Math.floor(Math.random() * cols.length)];
  const parts = []; for (let i = 0; i < 40; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.18, 6, 4), new THREE.MeshBasicMaterial({ color: col, transparent: true })); m.position.set(x, y, z); T.scene.add(m);
    const a = Math.random() * Math.PI * 2, b = Math.acos(2 * Math.random() - 1), v = 5 + Math.random() * 2; parts.push({ m, v: new THREE.Vector3(Math.sin(b) * Math.cos(a) * v, Math.cos(b) * v, Math.sin(b) * Math.sin(a) * v) }); }
  const t0 = performance.now(); let last = t0; const step = () => { const now = performance.now(), dt = (now - last) / 1000; last = now; const k = (now - t0) / 1600;
    parts.forEach(p => { p.m.position.addScaledVector(p.v, dt); p.v.y -= 4 * dt; p.v.multiplyScalar(0.98); p.m.material.opacity = 1 - k; }); if (k < 1) requestAnimationFrame(step); else parts.forEach(p => T.scene.remove(p.m)); }; step();
}
