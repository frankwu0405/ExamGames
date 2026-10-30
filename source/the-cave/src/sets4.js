// Episode 4 places: the lost island (cliff top, the beach where Toby digs) and the clear sea (sunken ship, the sign, the ice).
import { THREE, builder, toon, outline, newWorld, onTick, textTexture } from './gfx.js';
import { makeCast } from './chars.js';
import { cart, rnd, ferris, tree } from './sets.js';

export function pirateFlagTexture() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 168; const x = c.getContext('2d');
  x.fillStyle = '#1D1B2A'; x.fillRect(0, 0, 256, 168);
  x.fillStyle = '#2A2738'; for (let i = 0; i < 6; i++) x.fillRect(200 + (i % 2) * 18, i * 28, 18, 14);           // ragged end
  x.fillStyle = '#F4F1E6'; x.beginPath(); x.arc(128, 66, 32, 0, Math.PI * 2); x.fill(); x.fillRect(112, 86, 32, 20);
  x.fillStyle = '#1D1B2A'; x.beginPath(); x.arc(116, 62, 8, 0, 7); x.arc(140, 62, 8, 0, 7); x.fill(); x.fillRect(126, 74, 4, 8);
  x.strokeStyle = '#F4F1E6'; x.lineWidth = 12; x.lineCap = 'round'; x.beginPath(); x.moveTo(76, 118); x.lineTo(180, 152); x.moveTo(180, 118); x.lineTo(76, 152); x.stroke();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
// the cart-boat: the old cart with the pole and the pirate flag tied on as a sail
export function cartBoat(parent, { mast = true } = {}) {
  const g = new THREE.Group(); parent.add(g); const c = cart(builder(g), 0, 0, 0);
  const pole = builder(g).cyl(0.06, 0.07, 3.2, 0x8A5A3B, 0, 2.1, -0.2, { line: 0.015 }); pole.visible = mast;
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.0, 10, 1), new THREE.MeshBasicMaterial({ map: pirateFlagTexture(), side: THREE.DoubleSide }));
  flag.position.set(0.78, 2.9, -0.2); g.add(flag); flag.visible = mast;
  const fp = flag.geometry.attributes.position, fx = Array.from({ length: fp.count }, (_, i) => fp.getX(i));
  const wind = { k: 0.5 }; onTick(t => { for (let i = 0; i < fp.count; i++) fp.setZ(i, Math.sin(fx[i] * 4 + t * 5) * 0.1 * (fx[i] + 0.75) * wind.k); fp.needsUpdate = true; });
  const vines = [0.9, 1.2].map(y => { const v = builder(g).torus(0.12, 0.035, 0x3E8E41, 0, y, -0.2, { rx: Math.PI / 2, line: 0 }); v.visible = mast; return v; });
  const cast = makeCast(g);
  return { g, pole, flag, vines, wind, cast };
}
function sea(w, { opacity = 0.9, color = 0x3FA7D6, y = 0, size = 260 } = {}) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size, 60, 60), toon(color, { transparent: opacity < 1, opacity })); m.rotation.x = -Math.PI / 2; m.position.y = y; w.add(m);
  const p = m.geometry.attributes.position; onTick(t => { for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i) * 0.22 + t) * 0.12 + Math.cos(p.getY(i) * 0.3 + t * 0.7) * 0.08); p.needsUpdate = true; });
  return m;
}
function hometown(w, b, x, z, s = 1) {   // the far-away coast with the red Ferris wheel
  const land = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 30), [toon(0xE2C48A), toon(0x8CC95E), toon(0xE2C48A)]); land.scale.set(40 * s, 1.2, 9 * s); land.position.set(x, 0.3, z); w.add(land);
  const f = ferris(b, x + 4 * s, 0.8, z + 3 * s, 2.2 * s);
  for (let i = 0; i < 16; i++) { const hx = x - 26 * s + rnd() * 48 * s, hz = z - 5 * s + rnd() * 6 * s; b.box(1.6 * s, 1.4 * s, 1.6 * s, 0xFFF4D6, hx, 1.5, hz, { line: 0.03 }); b.cone(1.3 * s, 1 * s, [0xEF5B4C, 0x4AA3DF, 0xFFC94A, 0x5DBB4A][i % 4], hx, 2.7 * s, hz, { seg: 4, ry: Math.PI / 4 }); }
  return f;
}

// ================================================================ stop 10: the top of the lost island
export function buildIslandTop() {
  const w = newWorld({ sky: 0x9FD8F5, ambientI: 1.6, sunI: 1.7, fog: [0xBFE6F7, 90, 260] }); const b = builder(w);
  sea(w, { opacity: 0.62 });
  const seabed = new THREE.Mesh(new THREE.PlaneGeometry(260, 260), toon(0x2C6E8E)); seabed.rotation.x = -Math.PI / 2; seabed.position.y = -4; w.add(seabed);
  // the island: a green top on rocky sides, a tall cliff at one end
  const isl = new THREE.Mesh(new THREE.CylinderGeometry(16, 19, 4, 26), [toon(0x9A8C7A), toon(0x7DBB55), toon(0x9A8C7A)]); isl.position.y = -0.6; outline(isl, 0.06); w.add(isl);
  const cliff = b.cyl(5.2, 7.5, 9, 0x9A8C7A, -6, 4.5, -4, { seg: 9, line: 0.06 }); b.cyl(5.4, 5.2, 0.6, 0x7DBB55, -6, 9.1, -4, { seg: 9, line: 0.04 });
  for (let i = 0; i < 20; i++) { const a = rnd() * Math.PI * 2, r = 6 + rnd() * 8; tree(b, Math.cos(a) * r + 3, Math.sin(a) * r + 2, 0.9 + rnd() * 0.5); }
  // the cave they came out of, at the foot of the cliff
  const door = new THREE.Mesh(new THREE.CircleGeometry(1.6, 18, 0, Math.PI), new THREE.MeshBasicMaterial({ color: 0x0B0C13 })); door.position.set(-1.6, 1.4, 1.2); door.rotation.y = 0.9; w.add(door);
  // the secret path under the clear water: a dark straight line running off toward the hometown
  const path = new THREE.Mesh(new THREE.PlaneGeometry(4, 130), new THREE.MeshBasicMaterial({ color: 0x07121C })); path.rotation.x = -Math.PI / 2; path.rotation.z = -0.35; path.position.set(-34, -3.4, -66); w.add(path);
  [-2.4, 2.4].forEach(o => { const e = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 130), new THREE.MeshBasicMaterial({ color: 0x8FB4C8 })); e.rotation.x = -Math.PI / 2; e.rotation.z = -0.35; e.position.set(-34 + o * Math.cos(0.35), -3.38, -66 + o * Math.sin(0.35)); w.add(e); });
  // the hometown, far away, with its spinning Ferris wheel
  const wheel = hometown(w, b, -70, -150, 1);
  const cast = makeCast(w); const { leo, mia, toby } = cast;
  leo.g.position.set(4, 0.9, 8); mia.g.position.set(5.2, 0.9, 8.4); toby.g.position.set(4.6, 0.9, 9.2);
  const top = new THREE.Vector3(-4.2, 9.4, 0.2);
  return { w, cast, top, wheel, path, door };
}

// ================================================================ stop 11: the beach where Toby digs
export function buildDigBeach() {
  const w = newWorld({ sky: 0xA8E0FF, ambientI: 1.7, sunI: 1.8, fog: [0xBFE6F7, 45, 140] }); const b = builder(w);
  const sand = new THREE.Mesh(new THREE.CircleGeometry(40, 30), toon(0xF2D79B)); sand.rotation.x = -Math.PI / 2; w.add(sand);
  sea(w, {}).position.z = -110;
  const wet = new THREE.Mesh(new THREE.PlaneGeometry(90, 5), toon(0xD9B878)); wet.rotation.x = -Math.PI / 2; wet.position.set(0, 0.02, -14); w.add(wet);
  b.rock(9, 0x9A8C7A, 0, 3, 20, { line: 0.06 }).scale.set(1.8, 1, 0.75);
  const palm = (x, z) => { const g = new THREE.Group(); g.position.set(x, 0, z); w.add(g); const pb = builder(g);
    for (let k = 0; k < 6; k++) pb.cyl(0.24 - k * 0.02, 0.27 - k * 0.02, 0.85, 0x8A5A3B, Math.sin(k * 0.35) * 0.3, 0.45 + k * 0.8, 0, { line: 0.02 });
    for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; pb.box(2.6, 0.06, 0.7, 0x4FA35A, Math.cos(a) * 1.1 + 0.3, 4.9, Math.sin(a) * 1.1, { ry: -a, rz: -0.45, line: 0.02 }); } return g; };
  [[-11, 8], [12, 6], [-14, 2], [9, 12]].forEach(p => palm(...p));
  // three sandy mounds to dig: next to a palm, next to a big rock, by the water
  const thePalm = palm(-5.5, -1.5); const bigRock = b.rock(1.4, 0x8C7F6E, 5.6, 0.7, -1.2, { line: 0.04 });
  const mounds = [{ id: 'palm', x: -4.3, z: -2.6 }, { id: 'rock', x: 4.2, z: -2.4 }, { id: 'water', x: 0.2, z: -10.5 }].map(o => { const m = b.add(new THREE.SphereGeometry(1.0, 14, 8), toon(0xE6C886), o.x, 0, o.z, { line: 0.03 }); m.scale.y = 0.35; m.userData.id = o.id; return m; });
  // the flag pole buried under the palm mound
  const pole = new THREE.Group(); pole.position.set(-4.3, -3.4, -2.6); w.add(pole); builder(pole).cyl(0.07, 0.08, 3.2, 0x8A5A3B, 0, 1.6, 0, { line: 0.015 });
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.0, 10, 1), new THREE.MeshBasicMaterial({ map: pirateFlagTexture(), side: THREE.DoubleSide })); flag.position.set(0.78, 2.7, 0); pole.add(flag);
  // shells on the sand (for spelling)
  const shells = []; for (let i = 0; i < 7; i++) { const a = -0.9 + i * 0.3; const s = b.add(new THREE.SphereGeometry(0.34, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), toon([0xFFFFFF, 0xF8C8D0, 0xFFE0B0][i % 3]), Math.sin(a) * 4.5, 0.02, -4.4 - Math.cos(a) * 1.4, { line: 0.02 }); s.scale.y = 0.5; shells.push(s); }
  // the tipped-over cart, and vines on the rocks
  const theCart = new THREE.Group(); theCart.position.set(2.6, 0, 3); w.add(theCart); cart(builder(theCart), 0, 0, 0); theCart.rotation.set(0, 0.6, 1.25);
  for (let i = 0; i < 5; i++) b.torus(0.5, 0.06, 0x3E8E41, 7.5 + i * 0.25, 1.4 - i * 0.2, 8, { rx: 1, ry: i, line: 0 });
  const cast = makeCast(w); const { leo, mia, toby } = cast;
  leo.g.position.set(-1.2, 0, 2.4); mia.g.position.set(0.4, 0, 2.6); toby.g.position.set(-0.4, 0, 0.6); [leo, mia, toby].forEach(c => c.g.rotation.y = Math.PI);
  return { w, cast, mounds, pole, flag, shells, theCart, thePalm, bigRock };
}

// ================================================================ stop 12: sailing the clear sea
export function buildClearSea() {
  const w = newWorld({ sky: 0x9FD8F5, ambientI: 1.6, sunI: 1.7, fog: [0xBFE6F7, 70, 200] }); const b = builder(w);
  const water = sea(w, { opacity: 0.45, color: 0x4FC3E8 });
  const bed = new THREE.Mesh(new THREE.PlaneGeometry(300, 300, 40, 40), toon(0xE8D3A0)); bed.rotation.x = -Math.PI / 2; bed.position.y = -6; w.add(bed);
  const bp = bed.geometry.attributes.position; for (let i = 0; i < bp.count; i++) bp.setZ(i, Math.sin(bp.getX(i) * 0.15) * 0.6 + Math.cos(bp.getY(i) * 0.2) * 0.5); bed.geometry.computeVertexNormals();
  for (let i = 0; i < 40; i++) { const x = (rnd() - 0.5) * 80, z = -rnd() * 120; b.rock(0.6 + rnd() * 1.4, 0x7C8A8A, x, -5.6, z); }
  for (let i = 0; i < 30; i++) { const x = (rnd() - 0.5) * 70, z = -rnd() * 110; for (let k = 0; k < 3; k++) b.cyl(0.05, 0.05, 1.2 + rnd(), 0x4FA35A, x + k * 0.2, -5.2, z, { line: 0, rz: (rnd() - 0.5) * 0.4 }); }
  // the sunken pirate ship on the sand
  const ship = new THREE.Group(); ship.position.set(-5, -5.4, -28); ship.rotation.set(0.15, 0.7, 0.3); w.add(ship); const sb = builder(ship);
  sb.box(9, 2.2, 3.2, 0x5A3A24, 0, 0, 0, { line: 0.05 }); sb.box(2.4, 1.6, 3.0, 0x5A3A24, -3.6, 1.4, 0, { line: 0.04 }); sb.cone(1.6, 2.4, 0x5A3A24, 5.4, 0, 0, { rz: -Math.PI / 2, seg: 4, line: 0.04 });
  sb.cyl(0.15, 0.18, 6, 0x6B4A33, 1, 3, 0, { rz: 0.5, line: 0.02 }); sb.box(3, 0.1, 0.1, 0x6B4A33, 0.2, 4.4, 0, { rz: 0.5, line: 0 });
  for (let i = 0; i < 4; i++) sb.box(0.6, 0.6, 0.1, 0x2E2A4F, -2 + i * 1.6, 0.2, 1.62, { line: 0 });
  const shipHit = new THREE.Mesh(new THREE.BoxGeometry(11, 5, 5), new THREE.MeshBasicMaterial({ visible: false })); ship.add(shipHit);
  // the KEEP OUT sign stuck between underwater rocks
  const signG = new THREE.Group(); signG.position.set(6, -5, -44); signG.rotation.set(0, -0.4, 0.15); w.add(signG); const gb = builder(signG);
  gb.cyl(0.1, 0.12, 3, 0x6B4A33, 0, 1.5, 0, { line: 0.02 });
  const board = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.2, 0.12), [toon(0xA0805A), toon(0xA0805A), toon(0xA0805A), toon(0xA0805A), new THREE.MeshBasicMaterial({ map: textTexture('KEEP OUT', { bg: '#C9A46A', w: 512, h: 220, font: '104px Chewy, sans-serif', fg: '#7A1F1F' }) }), toon(0xA0805A)]);
  board.position.y = 2.9; board.rotation.z = -0.2; outline(board, 0.03); signG.add(board);
  gb.rock(1.4, 0x6E7A7A, -1.4, 0.4, 0.3); gb.rock(1.2, 0x6E7A7A, 1.5, 0.3, 0.2);
  // the far hometown and its Ferris wheel
  hometown(w, b, 30, -190, 1.2);
  // the cart-boat with the kids
  const boat = cartBoat(w); const { leo, mia, toby } = boat.cast;
  leo.g.position.set(-0.3, 0.45, 0.2); mia.g.position.set(0.3, 0.45, -0.1); toby.g.position.set(0, 0.85, 0.6); toby.g.scale.setScalar(0.9);
  [leo, mia].forEach(c => { c.L.rotation.x = c.R.rotation.x = -1.4; });
  // ice, fog, bubbles and the glowing shadow (hidden until the end)
  const ice = []; for (let i = 0; i < 26; i++) { const a = rnd() * Math.PI * 2, r = 2 + rnd() * 14; const m = b.box(2 + rnd() * 2.5, 0.25, 1.6 + rnd() * 2, 0xDDF4FF, Math.cos(a) * r, 0.1, Math.sin(a) * r, { ry: rnd() * 3, line: 0.02 }); m.scale.setScalar(0.001); m.userData.r = r; ice.push(m); }
  const fogMat = toon(0xE8EEF4, { transparent: true, opacity: 0 }); const fogs = []; for (let i = 0; i < 26; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(3 + rnd() * 3, 10, 8), fogMat); m.scale.y = 0.5; w.add(m); fogs.push(m); }
  const bubbles = new THREE.Group(); w.add(bubbles); bubbles.visible = false; const bmat = new THREE.MeshBasicMaterial({ color: 0xE6F6FF, transparent: true, opacity: 0.8 });
  for (let i = 0; i < 40; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.1 + rnd() * 0.15, 8, 6), bmat); m.position.set((rnd() - 0.5) * 8, -rnd() * 3, -8 - rnd() * 5); m.userData.v = 0.5 + rnd(); bubbles.add(m); }
  onTick((t, dt) => { if (!bubbles.visible) return; bubbles.children.forEach(m => { m.position.y += m.userData.v * dt; if (m.position.y > 0.2) m.position.y = -3; }); });
  const shadow = new THREE.Group(); shadow.position.set(0, -7, -16); w.add(shadow); shadow.visible = false;
  const sMat = new THREE.MeshBasicMaterial({ color: 0x2BC4C4, transparent: true, opacity: 0.35 }); const body = new THREE.Mesh(new THREE.SphereGeometry(4, 18, 12), sMat); body.scale.set(2.2, 0.8, 1); shadow.add(body);
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF }); [-1.3, 1.3].forEach(x => { const e = new THREE.Mesh(new THREE.SphereGeometry(0.35, 10, 8), eyeMat); e.position.set(x, 1.2, 3.2); shadow.add(e); });
  const glow = new THREE.PointLight(0x5AE8E8, 0, 30, 1.2); shadow.add(glow);
  return { w, boat, ship, shipHit, signG, board, ice, fogs, fogMat, bubbles, shadow, sMat, glow, water };
}
