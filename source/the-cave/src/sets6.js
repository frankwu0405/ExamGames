// Episode 6 places: the gray shore in the thick white fog, the dark woods and the old man's fire.
import { THREE, builder, toon, outline, newWorld, onTick } from './gfx.js';
import { rnd } from './sets.js';
import { cartBoat } from './sets4.js';
import { makeCast, makeOldMan } from './chars.js';
import { mist, glowSprite } from './effects.js';

function grayTex() {   // wet gray sand with darker patches and pebbles
  const c = document.createElement('canvas'); c.width = c.height = 512; const x = c.getContext('2d');
  x.fillStyle = '#B4B3AB'; x.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 90; i++) { x.fillStyle = `rgba(${80 + Math.random() * 40},${82 + Math.random() * 40},${80 + Math.random() * 40},${0.04 + Math.random() * 0.07})`; x.beginPath(); x.ellipse(Math.random() * 512, Math.random() * 512, 12 + Math.random() * 46, 6 + Math.random() * 20, Math.random() * 3, 0, 7); x.fill(); }
  for (let i = 0; i < 260; i++) { const g = 120 + Math.random() * 80; x.fillStyle = `rgb(${g},${g},${g - 6})`; x.beginPath(); x.ellipse(Math.random() * 512, Math.random() * 512, 1.5 + Math.random() * 3, 1 + Math.random() * 2, Math.random() * 3, 0, 7); x.fill(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(10, 3); return t;
}
function mossTex() {
  const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
  x.fillStyle = '#4C5A47'; x.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 160; i++) { x.fillStyle = `rgba(${40 + Math.random() * 30},${60 + Math.random() * 40},${40 + Math.random() * 30},${0.2 + Math.random() * 0.3})`; x.beginPath(); x.ellipse(Math.random() * 256, Math.random() * 256, 5 + Math.random() * 18, 3 + Math.random() * 10, Math.random() * 3, 0, 7); x.fill(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(14, 10); return t;
}
// a dark, tall, slightly bent pine for the misty woods
function pine(b, x, z, s = 1, lean = 0) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.z = lean; b.group.add(g); const t = builder(g);
  t.cyl(0.14 * s, 0.22 * s, 3.2 * s, 0x4A3A2C, 0, 1.6 * s, 0, { line: 0.03 });
  const cols = [0x37503F, 0x3F5C47, 0x345041];
  for (let i = 0; i < 5; i++) t.cone((1.5 - i * 0.24) * s, 1.9 * s, cols[i % 3], 0, (2.3 + i * 1.0) * s, 0, { line: 0.03, seg: 9 });
  return g;
}
function bareTree(b, x, z, s = 1) {   // a dead, twisty tree
  const g = new THREE.Group(); g.position.set(x, 0, z); b.group.add(g); const t = builder(g);
  t.cyl(0.1 * s, 0.2 * s, 3 * s, 0x3C342C, 0, 1.5 * s, 0, { line: 0.03 });
  [[-0.9, 2.5, 0.8], [0.9, 2.9, -0.7], [-0.5, 3.3, -0.4], [0.6, 3.5, 0.5]].forEach(([dx, y, rz]) => t.cyl(0.04 * s, 0.09 * s, 1.5 * s, 0x3C342C, dx * 0.4 * s, y * s, 0, { rz: -dx, line: 0.02 }));
  return g;
}

export function buildGrayShore() {
  const w = newWorld({ sky: 0xB7C0C3, ambient: 0xDDE5E8, ambientI: 1.25, sun: 0xE8EEF0, sunI: 0.75, sunPos: [-6, 12, 8], fog: [0xC3CBCD, 12, 64] }); const b = builder(w);
  // ground: a gray beach strip, the sea in front (towards -z) and the woods behind (+z)
  const beach = new THREE.Mesh(new THREE.PlaneGeometry(160, 24), toon(0xFFFFFF, { map: grayTex() })); beach.rotation.x = -Math.PI / 2; beach.position.set(0, 0, 1); w.add(beach);
  const wet = new THREE.Mesh(new THREE.PlaneGeometry(160, 3), toon(0x8E9490, { transparent: true, opacity: 0.8 })); wet.rotation.x = -Math.PI / 2; wet.position.set(0, 0.02, -9.8); w.add(wet);
  const forest = new THREE.Mesh(new THREE.PlaneGeometry(160, 70), toon(0xFFFFFF, { map: mossTex() })); forest.rotation.x = -Math.PI / 2; forest.position.set(0, 0.03, 48); w.add(forest);
  // the sand fades into the moss with a soft edge of tufts
  for (let i = 0; i < 70; i++) b.ball(0.35 + rnd() * 0.4, rnd() > 0.5 ? 0x5C6C52 : 0x6D7C60, -40 + i * 1.15, 0.05, 12 + rnd() * 1.4, { line: 0.02, seg: 8 }).scale.set(1.6, 0.5, 1);
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(260, 160, 50, 30), toon(0x7E99A6, { transparent: true, opacity: 0.95 })); sea.rotation.x = -Math.PI / 2; sea.position.set(0, -0.05, -90); w.add(sea);
  const sp = sea.geometry.attributes.position; onTick(t => { for (let i = 0; i < sp.count; i++) sp.setZ(i, Math.sin(sp.getX(i) * 0.25 + t * 0.8) * 0.1 + Math.cos(sp.getY(i) * 0.3 + t * 0.6) * 0.07); sp.needsUpdate = true; });
  // foam line at the water's edge
  for (let i = 0; i < 40; i++) b.ball(0.5 + rnd() * 0.6, 0xEFF4F4, -30 + i * 1.6, 0.02, -11.4 - rnd() * 0.6, { line: 0, seg: 8 }).scale.set(1.8, 0.14, 0.7);
  // sharp rocks where the little boat is stuck
  const rocks = []; for (let i = 0; i < 9; i++) { const r = b.cone(0.35 + rnd() * 0.3, 1.2 + rnd() * 1.4, i % 2 ? 0x4C4F52 : 0x5D6064, 3.2 + rnd() * 3.8, 0.2, -13.5 - rnd() * 3, { rx: (rnd() - 0.5) * 0.4, rz: (rnd() - 0.5) * 0.5, line: 0.03, seg: 5 }); rocks.push(r); }
  for (let i = 0; i < 20; i++) b.rock(0.22 + rnd() * 0.4, i % 3 ? 0x777A7C : 0x6A6E70, -28 + rnd() * 56, 0.1, -7 + rnd() * 9, { line: 0.025 });
  // wreck of an old ship, half sunk in the gray water, far off
  const wreck = new THREE.Group(); wreck.position.set(-10, -0.5, -20); wreck.rotation.set(0.1, 0.5, 0.28); w.add(wreck); const wb = builder(wreck);
  wb.box(8, 2.6, 3, 0x3E3128, 0, 0.5, 0, { line: 0.04 }); wb.box(2.6, 1.6, 3, 0x4A3A2E, 3.3, 2, 0, { line: 0.04 }); wb.cyl(0.14, 0.2, 7, 0x4A3A2E, -0.6, 4.5, 0, { rz: -0.3, line: 0.03 });
  const rag = wb.box(2.2, 2.6, 0.05, 0x1E1D26, 0.4, 5, 0, { rz: -0.3, line: 0 }); rag.userData.rag = true;
  const wreck2 = wreck.clone(); wreck2.position.set(-14, -0.9, -34); wreck2.rotation.set(0, 2.4, -0.4); wreck2.scale.setScalar(0.8); w.add(wreck2);
  // the woods: dark pines in the mist, a clearing for the fire
  const fireAt = new THREE.Vector3(-4, 0, 21);
  for (let i = 0; i < 70; i++) { const x = -48 + rnd() * 96, z = 16 + rnd() * 34; if (Math.hypot(x - fireAt.x, z - fireAt.z) < 7.5 || (Math.abs(x + 2) < 3.2 && z < 24)) continue; (i % 6 === 0 ? bareTree(b, x, z, 1.1 + rnd() * 0.5) : pine(b, x, z, 0.9 + rnd() * 0.8, (rnd() - 0.5) * 0.06)); }
  for (let i = 0; i < 12; i++) pine(b, -44 + i * 8 + rnd() * 3, 14.5 + rnd() * 2, 0.8 + rnd() * 0.5);
  for (let i = 0; i < 18; i++) b.rock(0.3 + rnd() * 0.5, 0x5E6A58, -40 + rnd() * 80, 0.1, 15 + rnd() * 20, { line: 0.02 });
  // the camp: a ring of stones, a fire, a log to sit on, and a little tent
  const fire = new THREE.Group(); fire.position.copy(fireAt); w.add(fire); const fb = builder(fire);
  for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2; fb.rock(0.22, 0x8A8D8C, Math.cos(a) * 0.9, 0.1, Math.sin(a) * 0.9, { line: 0.02 }); }
  fb.cyl(0.07, 0.07, 1.2, 0x4A3322, 0, 0.12, 0, { rz: Math.PI / 2, ry: 0.5, line: 0.015 }); fb.cyl(0.07, 0.07, 1.2, 0x3E2A1C, 0, 0.12, 0, { rz: Math.PI / 2, ry: -0.7, line: 0.015 });
  const flames = [0xFFD24A, 0xFF9B2E, 0xE8541E].map((c, i) => { const f = fb.cone(0.34 - i * 0.07, 1.1 - i * 0.2, c, 0, 0.5 + i * 0.1, 0, { line: 0, seg: 7 }); f.material = new THREE.MeshBasicMaterial({ color: c }); return f; });
  const fl = new THREE.PointLight(0xFF9A3C, 0, 18, 1.5); fl.position.set(0, 1.2, 0); fire.add(fl);
  const fglow = glowSprite(0xFFB45A, 2.4, 0.6); fglow.position.set(0, 0.8, 0); fire.add(fglow);
  onTick(t => { flames.forEach((f, i) => { f.scale.set(1 + Math.sin(t * 9 + i * 2) * 0.12, 1 + Math.sin(t * 7 + i) * 0.18, 1 + Math.sin(t * 8 + i) * 0.12); }); fl.intensity = fire.userData.on ? 9 + Math.sin(t * 11) * 1.5 + Math.sin(t * 17) * 1.2 : 0; fglow.material.opacity = fire.userData.on ? 0.5 + Math.sin(t * 10) * 0.1 : 0; });
  fire.userData.on = false; fire.visible = true; fire.userData.set = on => { fire.userData.on = on; flames.forEach(f => f.visible = on); };
  fire.userData.set(false);
  const log = b.cyl(0.28, 0.28, 2.6, 0x5A4331, fireAt.x + 3.2, 0.3, fireAt.z + 1.2, { rz: Math.PI / 2, ry: 0.5, line: 0.03 });
  const tent = new THREE.Group(); tent.position.set(fireAt.x - 4.2, 0, fireAt.z - 1.4); tent.rotation.y = 0.6; w.add(tent); const tb = builder(tent);
  tb.cone(1.6, 1.7, 0x6B6A52, 0, 0.85, 0, { line: 0.035, seg: 4, ry: Math.PI / 4 }).scale.set(1.2, 1, 1.4); tb.box(0.8, 1.1, 0.06, 0x2A2820, 0, 0.55, 1.12, { line: 0, rx: -0.12 });
  // mist hugging the ground, thicker in the woods
  const fogA = mist(w, { count: 34, center: new THREE.Vector3(0, 0, 4), spread: 40, y: [0.5, 3], size: [9, 18], color: 0xE3E9EA, opacity: 0.3 }); fogA.show(1, 10);
  const fogB = mist(w, { count: 26, center: new THREE.Vector3(fireAt.x, 0, fireAt.z), spread: 22, inner: 7, y: [0.8, 4], size: [8, 14], color: 0xCBD4D4, opacity: 0.22 }); fogB.show(1, 10);
  // the cart-boat, stuck on the rocks in the shallows (points to -z)
  const boat = cartBoat(w); boat.g.position.set(5.2, 0.35, -12.4); boat.g.rotation.set(0.08, 0.35, -0.16); boat.wind.k = 0.12;
  boat.cast.leo.g.visible = boat.cast.mia.g.visible = boat.cast.toby.g.visible = false;     // the kids are on the beach; the boat is empty
  // the kids and Toby; Leo is fast asleep
  const cast = makeCast(w); const { leo, mia, toby } = cast;
  leo.g.position.set(1.4, 0.26, 1.6); leo.g.rotation.set(-Math.PI / 2, 0, 0.4); leo.forceFace = 'blink'; leo.pose('idle');
  mia.g.position.set(-0.4, -0.36, 1.4); mia.g.rotation.y = 0.5; mia.pose('sit'); toby.g.position.set(-1.4, 0, 1.0); toby.g.rotation.y = 0.9;
  const man = makeOldMan(w); man.g.position.set(fireAt.x - 1.4, 0, fireAt.z + 1.1); man.g.rotation.y = 2.9; man.g.visible = false;
  return { w, boat, cast, leo, mia, toby, man, fire, fireAt, log, rocks, fog: fogA, fogB, wreck, sea, beach };
}
