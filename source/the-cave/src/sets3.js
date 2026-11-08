// Episode 3 places (Leo's side): the rock shelf, the muddy crack, the rainbow cliff with the water slide.
import { THREE, builder, toon, outline, newWorld, onTick, textTexture } from './gfx.js';
import { makeCast } from './chars.js';
import { rnd, cart } from './sets.js';
import { crystalRoom, CAVERN } from './sets2.js';
import { trough, rockMat, rockInside, lumpy as lumpyP, mesh, crystalCluster as crys, motes, water as waterP, nz, rockTube, timber } from './props.js';

function dropper(w, b, floorY = 0) {   // falling rocks with gravity, bounce and a hit callback
  return (x, z, size = 0.35, y = 6.8, onHit) => {
    const r = b.rock(size, 0x5E6377, x, y, z, { line: 0.025 }); const v = new THREE.Vector3((rnd() - 0.5) * 0.6, 0, (rnd() - 0.5) * 0.6); let hits = 0;
    const off = onTick((t, dt) => { v.y -= 22 * dt; r.position.addScaledVector(v, dt); r.rotation.x += dt * 4; r.rotation.z += dt * 3;
      if (r.position.y < floorY + size * 0.8) { r.position.y = floorY + size * 0.8; if (hits === 0 && onHit) onHit(r); hits++; v.y = -v.y * 0.3; v.x *= 0.6; v.z *= 0.6; if (hits > 2) off(); } });
    return r;
  };
}

// ================================================================ stop 7: the rock shelf (the moment the floor tipped, from Leo's side)
export function buildShelf() {
  const w = newWorld({ sky: 0x06070D, ambient: 0x9AA5D8, ambientI: 0.7, sunI: 0.35, fog: [0x06070D, 14, 34] }); const b = builder(w);
  const shell = new THREE.Mesh(new THREE.SphereGeometry(14, 24, 16), rockInside(0x6A7088, 0.14)); shell.scale.set(1.2, 0.55, 1); shell.position.y = 2; w.add(shell);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(13, 30), rockMat(0x80869C, 0.3)); floor.rotation.x = -Math.PI / 2; w.add(floor);
  for (let i = 0; i < 22; i++) { const a = rnd() * Math.PI * 2, r = 8 + rnd() * 4; b.rock(0.4 + rnd() * 0.8, 0x565B70, Math.cos(a) * r, 0.2, Math.sin(a) * r); }
  const warm = new THREE.PointLight(0xFFD7A0, 18, 20, 1.4); warm.position.set(0, 4, 3); w.add(warm);
  // three rock shelves along the back wall: thin, medium, THICK
  const shelves = [{ id: 'thin', t: 0.14, x: -4.6 }, { id: 'medium', t: 0.42, x: 0 }, { id: 'thick', t: 1.0, x: 4.6 }].map(o => {
    const g = new THREE.Group(); g.position.set(o.x, 0, -4.2); w.add(g); const sb = builder(g);
    sb.rock(1.1, 0x4E5368, -1.1, 0.7, -0.4, { line: 0.03 }); sb.rock(1.0, 0x4E5368, 1.2, 0.6, -0.5, { line: 0.03 });
    const slab = sb.box(3.4, o.t, 2.0, rockMat(0x8E94AA, 0.45), 0, 1.45 + o.t / 2, 0.1, { line: 0.04 });
    if (o.id === 'thin') { sb.box(0.05, o.t + 0.02, 1.2, 0x2E3245, 0.3, 1.45 + o.t / 2, 0.3, { ry: 0.6, line: 0 }); }   // a crack in the thin one
    g.userData.id = o.id; g.userData.slab = slab; return g; });
  // the rock wall right behind the shelves — with a tiny dark crack low down behind the thick one
  const wall = b.box(17, 7, 1.6, rockMat(0x6A7088, 0.25), 0, 3.5, -6.6, { line: 0.05 }); motes(w, 80, [-7, 0.5, -5], [7, 5, 4], 0xD8D0C0, 0.05); for (let i = 0; i < 16; i++) b.rock(0.6 + rnd() * 0.7, 0x4A4F63, -8 + i * 1.07, 0.3 + rnd() * 6, -5.9, { line: 0.03 });
  const crackG = new THREE.Group(); crackG.position.set(4.6, 0, -5.78); w.add(crackG);
  const cs = new THREE.Shape(); cs.moveTo(-0.55, 0); cs.lineTo(-0.35, 0.55); cs.lineTo(-0.5, 0.9); cs.lineTo(-0.15, 1.25); cs.lineTo(0.05, 1.05); cs.lineTo(0.3, 1.2); cs.lineTo(0.42, 0.7); cs.lineTo(0.58, 0.35); cs.lineTo(0.5, 0); cs.lineTo(-0.55, 0);
  const crack = new THREE.Mesh(new THREE.ShapeGeometry(cs), new THREE.MeshBasicMaterial({ color: 0x050407 })); crackG.add(crack); crack.position.z = 0.02;
  const crackGlow = new THREE.PointLight(0xFFD9A0, 0, 4, 1.6); crackGlow.position.set(0, 0.5, 0.6); crackG.add(crackGlow);
  const rim = new THREE.Mesh(new THREE.ShapeGeometry(cs), new THREE.MeshBasicMaterial({ color: 0x2A2235 })); rim.scale.setScalar(1.18); rim.position.set(0, -0.05, 0.01); crackG.add(rim);
  // fallen rocks (shown when the dust settles)
  const pile = []; for (let i = 0; i < 14; i++) { const sd = i % 2 ? 1 : -1; const r = b.rock(0.35 + rnd() * 0.4, 0x5E6377, 4.6 + sd * (2.1 + rnd() * 1.3), 0.3, -3.4 + rnd() * 2.6, { line: 0.025 }); r.visible = false; pile.push(r); }
  const cast = makeCast(w); cast.mia.g.visible = false; cast.toby.g.visible = false; const leo = cast.leo;
  leo.g.position.set(0, 0, 3); leo.g.rotation.y = 0;
  return { w, leo, shelves, drop: dropper(w, b), crackG, crackGlow, pile };
}

// ================================================================ stop 8: the crack (a tight, muddy tunnel with bugs)
export function buildCrack() {
  const w = newWorld({ sky: 0x0A0806, ambient: 0xE8C9A0, ambientI: 0.75, sunI: 0.25, fog: [0x0A0806, 4, 20] }); const b = builder(w);
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 44, 18, 30, true), rockInside(0x9A7A58, 0.5)); tube.rotation.x = Math.PI / 2; tube.position.z = -16; w.add(tube);
  const tp = tube.geometry.attributes.position; for (let i = 0; i < tp.count; i++) { const k = 1 + (rnd() - 0.5) * 0.16; tp.setX(i, tp.getX(i) * k); tp.setZ(i, tp.getZ(i) * k); } tube.geometry.computeVertexNormals();
  const mudMat = toon(0x3B2A1C); for (let i = 0; i < 26; i++) { const m = new THREE.Mesh(new THREE.CircleGeometry(0.3 + rnd() * 0.4, 12), mudMat); m.rotation.x = -Math.PI / 2; m.position.set((rnd() - 0.5) * 1.6, -1.26, 2 - rnd() * 34); w.add(m); }
  const lamp = new THREE.PointLight(0xFFC98A, 10, 9, 1.5); w.add(lamp);
  // the light at the end of the crack
  const exitDisc = new THREE.Mesh(new THREE.CircleGeometry(1.4, 24), new THREE.MeshBasicMaterial({ color: 0xFFF4D0 })); exitDisc.position.set(0, -0.1, -37.5); w.add(exitDisc);
  const exitLight = new THREE.PointLight(0xFFF0C0, 25, 16, 1.2); exitLight.position.set(0, 0, -34); w.add(exitLight);
  // little bugs crawling on the walls
  const bug = (color, s = 1) => { const g = new THREE.Group(); const bb = builder(g); bb.ball(0.13 * s, color, 0, 0, 0, { line: 0.012 }).scale.set(1, 0.6, 1.4); bb.ball(0.07 * s, 0x1A1410, 0, 0.01, 0.17 * s, { line: 0 });
    for (let k = 0; k < 3; k++) [-1, 1].forEach(sd => bb.box(0.18 * s, 0.015, 0.02, 0x1A1410, sd * 0.13 * s, -0.02, (k - 1) * 0.09 * s, { line: 0, rz: sd * 0.3 })); w.add(g); return g; };
  const crawlers = [];
  for (let i = 0; i < 22; i++) { const g = bug([0x2E2A4F, 0x4A3B5C, 0x3B5A3A][i % 3], 0.8 + rnd() * 0.5); const a = rnd() * Math.PI * 2, z = 1 - rnd() * 32; g.userData = { a, z, sp: (rnd() - 0.5) * 0.6, zs: (rnd() - 0.5) * 0.5 }; crawlers.push(g); }
  onTick((t, dt) => crawlers.forEach(g => { const u = g.userData; u.a += u.sp * dt; u.z += u.zs * dt; const r = 1.38; g.position.set(Math.cos(u.a) * r, Math.sin(u.a) * r, u.z); g.lookAt(0, 0, u.z); g.rotateX(Math.PI / 2); g.rotateY(u.sp > 0 ? Math.PI / 2 : -Math.PI / 2); }));
  // Leo, flat on his tummy (head toward the far end)
  const crawler = new THREE.Group(); crawler.position.set(0, -1.05, 1); crawler.rotation.y = Math.PI; w.add(crawler);
  const cast = makeCast(crawler); cast.mia.g.visible = false; cast.toby.g.visible = false; const leo = cast.leo; leo.g.rotation.x = Math.PI / 2; leo.g.position.set(0, 0.28, 0.6);
  onTick(() => lamp.position.set(0, 0.4, crawler.position.z - 1.5));
  // mud blobs on the walls ahead (they carry letters), and bigger bugs (they carry words)
  const blobs = []; [[-0.9, 0.5, -1.8], [0.9, 0.7, -2.4], [-0.5, 1.0, -3.4], [0.6, 0.2, -4.0], [-1.0, -0.2, -4.8], [0.95, -0.1, -5.6], [0.0, 1.15, -6.2], [-0.6, 0.6, -7.0]].forEach(([x, y, z]) => { const m = b.add(new THREE.SphereGeometry(0.32, 12, 8), toon(0x6B4A2E), x, y, z, { line: 0.025 }); m.scale.z = 0.5; m.lookAt(0, 0, z); blobs.push(m); });
  const wordBugs = []; for (let i = 0; i < 8; i++) { const g = bug([0xC94A3A, 0x3A7FC0, 0xE8A23A, 0x5DBB4A][i % 4], 2.4); const a = i / 8 * Math.PI * 2 + Math.PI / 8; g.userData = { a, z: -14.2 - (i % 2) * 0.9 }; wordBugs.push(g); }
  onTick(t => wordBugs.forEach((g, i) => { const u = g.userData, r = 1.3, a = u.a + Math.sin(t * 0.8 + i) * 0.08; g.position.set(Math.cos(a) * r, Math.sin(a) * r, u.z); g.lookAt(0, 0, u.z); g.rotateX(Math.PI / 2); }));
  return { w, leo, crawler, blobs, wordBugs, exitDisc };
}

// ================================================================ stops 8–9: the rainbow cavern (from the storybook panel)
// Leo comes out of the tunnel onto a high ledge. Far across the cavern, inside a ring of green crystals, the mine
// track runs out of one tunnel, makes ONE loop and goes into another. Beside the ledge a spring pours into a
// stone water slide that curves down the cliff into the river on the cavern floor; the river runs out to a tunnel.
const RAIN = [0xFF6B6B, 0xFFA94D, 0xFFE066, 0x69DB7C, 0x4DABF7, 0xB197FC, 0xF783AC];
function crystalCluster(b, x, y, z, s, c, n = 4, down = false) {
  const m0 = toon(c, { emissive: c, emissiveIntensity: 0.5 });
  for (let k = 0; k < n; k++) { const m = b.add(new THREE.OctahedronGeometry(0.42 * s * (0.6 + rnd() * 0.6)), m0, x + (rnd() - 0.5) * s * 0.9, y + (down ? -0.6 : 0.6) * s, z + (rnd() - 0.5) * s * 0.9, { line: 0.03, rx: (down ? Math.PI : 0) + (rnd() - 0.5) * 0.7, rz: (rnd() - 0.5) * 0.7 }); m.scale.y = 2 + rnd() * 1.4; }
}
export function buildCliff() {
  // the very same cavern Mia rides through (sets2: crystalRoom), seen from Leo's ledge high on the wall
  const w = newWorld(CAVERN), K = crystalRoom(w);
  // the cart with Mia and Toby, riding the track round the loop (and pausing in the tunnels between laps)
  const tiny = new THREE.Group(); w.add(tiny); cart(builder(tiny), 0, 0, 0); const cc = makeCast(tiny); cc.leo.g.visible = false;
  cc.mia.g.position.set(0, 0.45, 0.15); cc.mia.pose('cheer'); cc.mia.L.rotation.x = cc.mia.R.rotation.x = -1.4; cc.toby.g.position.set(0, 0.85, 0.6); cc.toby.g.scale.setScalar(0.9);
  const hitBox = new THREE.Mesh(new THREE.SphereGeometry(2.2, 10, 8), new THREE.MeshBasicMaterial({ visible: false })); tiny.add(hitBox);
  const ride = { s: 0, on: true, speed: 0.05 }, s0 = K.sIn - 0.02, s1 = K.sOut + 0.01;
  onTick((t, dt) => { if (!ride.on) return; ride.s += dt * ride.speed * (ride.s > K.sA && ride.s < K.sB ? 1.3 : 1); if (ride.s > 1.15) ride.s = -0.05;
    const u = Math.min(1, Math.max(0, ride.s)), s = s0 + (s1 - s0) * u; tiny.visible = ride.s > 0 && ride.s < 1; const { p, f, r, u: up } = K.frame(s); tiny.position.copy(p).addScaledVector(up, 0.05); tiny.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(r, up, f)); });
  // map the loop's own 0..1 onto this ride's 0..1, so the story can wait for "after the loop"
  const toRide = s => (s - s0) / (s1 - s0);
  // ---- Leo, on the ledge
  const cast = makeCast(w); cast.mia.g.visible = false; cast.toby.g.visible = false; const leo = cast.leo;
  leo.g.position.set(K.LEDGE.x - 0.6, K.LEDGE.y + 0.05, K.LEDGE.z - 1.2); leo.g.rotation.y = Math.PI;
  return { w, leo, LEDGE: K.LEDGE, MOUTH: K.MOUTH, SPRING: K.SPRING, tiny, hitBox, ride, slidePath: K.slidePath, riverPath: K.riverPath, G: K.G, track: K.path, sA: toRide(K.sA), sB: toRide(K.sB) };
}
