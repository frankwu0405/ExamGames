// Episode 3 places (Leo's side): the rock shelf, the muddy crack, the rainbow cliff with the water slide.
import { THREE, builder, toon, outline, newWorld, onTick, textTexture } from './gfx.js';
import { makeCast } from './chars.js';
import { rnd, cart } from './sets.js';

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
  const shell = new THREE.Mesh(new THREE.SphereGeometry(14, 24, 16), toon(0x3A3F55, { side: THREE.BackSide })); shell.scale.set(1.2, 0.55, 1); shell.position.y = 2; w.add(shell);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(13, 30), toon(0x4A4F63)); floor.rotation.x = -Math.PI / 2; w.add(floor);
  for (let i = 0; i < 22; i++) { const a = rnd() * Math.PI * 2, r = 8 + rnd() * 4; b.rock(0.4 + rnd() * 0.8, 0x565B70, Math.cos(a) * r, 0.2, Math.sin(a) * r); }
  const warm = new THREE.PointLight(0xFFD7A0, 18, 20, 1.4); warm.position.set(0, 4, 3); w.add(warm);
  // three rock shelves along the back wall: thin, medium, THICK
  const shelves = [{ id: 'thin', t: 0.14, x: -4.6 }, { id: 'medium', t: 0.42, x: 0 }, { id: 'thick', t: 1.0, x: 4.6 }].map(o => {
    const g = new THREE.Group(); g.position.set(o.x, 0, -4.2); w.add(g); const sb = builder(g);
    sb.rock(1.1, 0x4E5368, -1.1, 0.7, -0.4, { line: 0.03 }); sb.rock(1.0, 0x4E5368, 1.2, 0.6, -0.5, { line: 0.03 });
    const slab = sb.box(3.4, o.t, 2.0, 0x6B7086, 0, 1.45 + o.t / 2, 0.1, { line: 0.04 });
    if (o.id === 'thin') { sb.box(0.05, o.t + 0.02, 1.2, 0x2E3245, 0.3, 1.45 + o.t / 2, 0.3, { ry: 0.6, line: 0 }); }   // a crack in the thin one
    g.userData.id = o.id; g.userData.slab = slab; return g; });
  // the rock wall right behind the shelves — with a tiny dark crack low down behind the thick one
  const wall = b.box(17, 7, 1.6, 0x464B5F, 0, 3.5, -6.6, { line: 0.05 }); for (let i = 0; i < 16; i++) b.rock(0.6 + rnd() * 0.7, 0x4A4F63, -8 + i * 1.07, 0.3 + rnd() * 6, -5.9, { line: 0.03 });
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
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 44, 18, 30, true), toon(0x5A4632, { side: THREE.BackSide })); tube.rotation.x = Math.PI / 2; tube.position.z = -16; w.add(tube);
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
// a channel (U-shaped stone trough) along a path, with water running in it
function trough(w, path, { width = 1.1, depth = 0.55, seg = 140, stone = 0x6E6A85, water = 0x5BB8E8 } = {}) {
  const ring = 11, pos = [], wpos = [], idx = [], widx = [], up = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i <= seg; i++) { const s = i / seg, p = path.getPointAt(s), t = path.getTangentAt(s), side = new THREE.Vector3().crossVectors(t, up).normalize(), u = new THREE.Vector3().crossVectors(side, t).normalize();
    for (let j = 0; j <= ring; j++) { const a = Math.PI * j / ring; const q = p.clone().addScaledVector(side, -Math.cos(a) * width).addScaledVector(u, -Math.sin(a) * depth + depth * 0.35); pos.push(q.x, q.y, q.z); }
    [-1, 1].forEach(k => { const q = p.clone().addScaledVector(side, k * width * 0.86).addScaledVector(u, -depth * 0.15); wpos.push(q.x, q.y, q.z); });
    if (i < seg) { for (let j = 0; j < ring; j++) { const a0 = i * (ring + 1) + j, b0 = a0 + ring + 1; idx.push(a0, b0, a0 + 1, b0, b0 + 1, a0 + 1); } const k = i * 2; widx.push(k, k + 2, k + 1, k + 1, k + 2, k + 3); } }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  const stoneM = new THREE.Mesh(g, toon(stone, { side: THREE.DoubleSide })); w.add(stoneM); outline(stoneM, 0.04);
  const wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.Float32BufferAttribute(wpos, 3)); wg.setIndex(widx); wg.computeVertexNormals();
  w.add(new THREE.Mesh(wg, toon(water, { side: THREE.DoubleSide, emissive: 0x1E5A80, emissiveIntensity: 0.35 })));
  // white foam streaks racing down the water
  const fm = new THREE.MeshBasicMaterial({ color: 0xE6F6FF }); const foam = Array.from({ length: 40 }, (_, i) => { const m = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.03, 0.55), fm); w.add(m); m.userData = { s: i / 40, o: (rnd() - 0.5) * width * 1.3 }; return m; });
  onTick((t, dt) => foam.forEach(m => { const u = m.userData; u.s = (u.s + dt * 0.12) % 1; const p = path.getPointAt(u.s), tg = path.getTangentAt(u.s), sd = new THREE.Vector3().crossVectors(tg, up).normalize(); m.position.copy(p).addScaledVector(sd, u.o).add(new THREE.Vector3(0, 0.02, 0)); m.lookAt(m.position.clone().add(tg)); }));
}
export function buildCliff() {
  const w = newWorld({ sky: 0x0B0A18, ambient: 0xD8D0FF, ambientI: 0.85, sunI: 0.4, fog: [0x0B0A18, 34, 95] }); const b = builder(w);
  // a lumpy cavern (not a smooth bowl): bumpy walls, floor at two levels, stalactites
  const roomGeo = new THREE.SphereGeometry(36, 40, 24); const rp = roomGeo.attributes.position;
  for (let i = 0; i < rp.count; i++) { const v = new THREE.Vector3().fromBufferAttribute(rp, i); const n = 1 + Math.sin(v.x * 0.35) * Math.cos(v.z * 0.3) * 0.08 + Math.sin(v.y * 0.5 + v.x * 0.2) * 0.06 + (rnd() - 0.5) * 0.05; rp.setXYZ(i, v.x * n, v.y * n, v.z * n); }
  roomGeo.computeVertexNormals(); const room = new THREE.Mesh(roomGeo, toon(0x2A2442, { side: THREE.BackSide })); room.scale.set(1.25, 0.8, 1.15); room.position.set(0, 7, -6); w.add(room);
  const floorGeo = new THREE.PlaneGeometry(110, 100, 50, 46); const fp = floorGeo.attributes.position;
  for (let i = 0; i < fp.count; i++) { const x = fp.getX(i), y = fp.getY(i); fp.setZ(i, Math.sin(x * 0.18) * Math.cos(y * 0.15) * 1.6 + Math.max(0, -y - 14) * 0.18); }
  floorGeo.computeVertexNormals(); const floor = new THREE.Mesh(floorGeo, toon(0x2E2948)); floor.rotation.x = -Math.PI / 2; floor.position.set(0, -0.6, -6); w.add(floor);
  for (let i = 0; i < 26; i++) { const x = (rnd() - 0.5) * 70, z = -40 + rnd() * 50; b.cone(0.8 + rnd() * 1.4, 3 + rnd() * 6, 0x3A3456, x, 1.5, z, { line: 0.04, seg: 7 }); }
  for (let i = 0; i < 34; i++) { const x = (rnd() - 0.5) * 70, z = -40 + rnd() * 52; const h = 2 + rnd() * 6; b.cone(0.5 + rnd() * 1.1, h, 0x3A3456, x, 31 - h / 2 - rnd() * 3, z, { line: 0.04, seg: 7, rx: Math.PI }); }
  // rainbow crystals everywhere: on the floor, on the walls, hanging from the roof
  for (let i = 0; i < 46; i++) { const a = rnd() * Math.PI * 2, r = 14 + rnd() * 26; crystalCluster(b, Math.cos(a) * r, 0.2, -6 + Math.sin(a) * r, 1 + rnd() * 1.6, RAIN[i % RAIN.length]); }
  for (let i = 0; i < 26; i++) { const a = rnd() * Math.PI * 2, r = 8 + rnd() * 28; crystalCluster(b, Math.cos(a) * r, 26 + rnd() * 3, -6 + Math.sin(a) * r, 1 + rnd(), RAIN[i % RAIN.length], 3, true); }
  [[-22, 10, -8, 0xB197FC], [22, 9, -4, 0xFF6B6B], [0, 16, -16, 0x4DABF7], [12, 8, 10, 0xFFA94D], [-14, 6, -26, 0xF783AC]].forEach(([x, y, z, c]) => { const l = new THREE.PointLight(c, 45, 55, 1.1); l.position.set(x, y, z); w.add(l); });
  // ---- the ledge, against the back wall, with the tunnel mouth Leo crawls out of
  const LEDGE = new THREE.Vector3(-10, 12, 12);                         // the top of the ledge (Leo stands near its front edge)
  const back = b.box(34, 30, 4, 0x3A3456, -8, 10, 21, { line: 0.06 });
  for (let i = 0; i < 22; i++) { const x = -24 + rnd() * 32, y = rnd() * 22; if (Math.abs(x - (-11.5)) < 4.5 && Math.abs(y - 13) < 4) continue; b.rock(1.2 + rnd() * 1.6, 0x3E385A, x, y, 19 + rnd() * 0.6, { line: 0.04 }); }
  const ledge = b.box(10, 13, 10, 0x4A4466, LEDGE.x, LEDGE.y - 6.5, LEDGE.z + 2, { line: 0.06 });
  for (let i = 0; i < 14; i++) b.rock(0.9 + rnd() * 1.2, 0x4A4466, LEDGE.x + (rnd() - 0.5) * 10, rnd() * 11, LEDGE.z - 3 + rnd() * 2, { line: 0.04 });
  b.box(10.4, 0.5, 10.4, 0x5B5578, LEDGE.x, LEDGE.y - 0.2, LEDGE.z + 2, { line: 0.05 });
  for (let i = 0; i < 4; i++) crystalCluster(b, LEDGE.x - 4.6 + (i % 2) * 1.2, LEDGE.y, LEDGE.z + 5 - i * 1.6, 0.8 + rnd() * 0.5, RAIN[(i * 3) % 7], 3);
  for (let i = 0; i < 18; i++) b.rock(0.18 + rnd() * 0.3, 0x5B5578, LEDGE.x + (rnd() - 0.5) * 9, LEDGE.y + 0.1, LEDGE.z + 2 + (rnd() - 0.5) * 9, { line: 0.02 });
  // the tunnel mouth: a dark jagged hole low in the back wall, rocks around it
  const MOUTH = new THREE.Vector3(LEDGE.x - 1.5, LEDGE.y, 18.9);
  const hole = new THREE.Mesh(new THREE.CircleGeometry(1.2, 18, 0, Math.PI), new THREE.MeshBasicMaterial({ color: 0x050407 })); hole.position.copy(MOUTH); hole.rotation.y = Math.PI; hole.scale.set(1, 1.05, 1); w.add(hole);
  [[-1.5, 0.3], [-1.3, 1.1], [-0.6, 1.5], [0.3, 1.55], [1.1, 1.2], [1.45, 0.4]].forEach(([x, y]) => { const r = b.rock(0.45, 0x4E4870, MOUTH.x - x, MOUTH.y + y, MOUTH.z - 0.2, { line: 0.03 }); r.scale.z = 0.6; });
  // ---- the spring and the water slide: water pours out of the wall into a stone pool, then down the slide
  const SPRING = new THREE.Vector3(LEDGE.x + 4.2, LEDGE.y + 1.8, 18.9);
  const fallM = toon(0x7FD0F5, { transparent: true, opacity: 0.85, emissive: 0x2A7AB0, emissiveIntensity: 0.4 });
  const fall = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.5, 2, 10, 1, true), fallM); fall.position.set(SPRING.x, SPRING.y - 1, SPRING.z - 0.5); w.add(fall);
  const pool = b.cyl(1.6, 1.4, 0.6, 0x5B5578, SPRING.x, LEDGE.y + 0.1, SPRING.z - 1.6, { line: 0.04, seg: 14 });
  const poolW = new THREE.Mesh(new THREE.CircleGeometry(1.35, 18), toon(0x5BB8E8, { emissive: 0x1E5A80, emissiveIntensity: 0.35 })); poolW.rotation.x = -Math.PI / 2; poolW.position.set(SPRING.x, LEDGE.y + 0.42, SPRING.z - 1.6); w.add(poolW);
  const slidePath = new THREE.CatmullRomCurve3([
    [SPRING.x, LEDGE.y + 0.42, SPRING.z - 2.4], [SPRING.x + 0.2, LEDGE.y + 0.3, LEDGE.z + 3], [SPRING.x + 0.6, LEDGE.y - 0.2, LEDGE.z - 2.2],
    [SPRING.x + 2.2, LEDGE.y - 2.6, LEDGE.z - 5.2], [SPRING.x + 5.2, LEDGE.y - 5.6, LEDGE.z - 6.4], [SPRING.x + 8.4, LEDGE.y - 8.2, LEDGE.z - 7.4],
    [SPRING.x + 10.6, LEDGE.y - 10.4, LEDGE.z - 9.6], [SPRING.x + 11.6, LEDGE.y - 11.6, LEDGE.z - 12.6],
  ].map(p => new THREE.Vector3(...p)), false, 'centripetal');
  trough(w, slidePath);
  // posts holding the slide up
  for (let k = 0.38; k < 0.95; k += 0.11) { const p = slidePath.getPointAt(k); b.cyl(0.25, 0.35, p.y + 0.6, 0x4A4466, p.x, (p.y - 0.6) / 2, p.z, { line: 0.03, seg: 7 }); }
  // ---- the river on the cavern floor: the slide pours into it, and it runs off into a dark tunnel
  const end = slidePath.getPointAt(1);
  const riverPath = new THREE.CatmullRomCurve3([[end.x - 3, -0.1, end.z + 4], [end.x, -0.1, end.z - 1], [end.x + 6, -0.1, end.z - 6], [end.x + 14, -0.1, end.z - 9], [end.x + 24, -0.1, end.z - 10]].map(p => new THREE.Vector3(...p)), false, 'centripetal');
  trough(w, riverPath, { width: 3.2, depth: 0.5, stone: 0x3A3456, water: 0x2F86C9 });
  // carve the floor down along the river so it is never hidden
  { const rs = Array.from({ length: 80 }, (_, i) => riverPath.getPointAt(i / 79)); for (let i = 0; i < fp.count; i++) { const wx = fp.getX(i), wz = -fp.getY(i) - 6; let d = 1e9; rs.forEach(q => { d = Math.min(d, Math.hypot(q.x - wx, q.z - wz)); });
    if (d < 6) fp.setZ(i, Math.min(fp.getZ(i), -0.9 + Math.max(0, d - 3.4) * 0.5)); } fp.needsUpdate = true; floorGeo.computeVertexNormals(); }
  const rEnd = riverPath.getPointAt(1); const rTunnel = new THREE.Mesh(new THREE.CircleGeometry(4, 20, 0, Math.PI), new THREE.MeshBasicMaterial({ color: 0x050407 })); rTunnel.position.set(rEnd.x, -0.4, rEnd.z); rTunnel.rotation.y = -Math.PI / 2; w.add(rTunnel);
  b.box(3, 9, 16, 0x3A3456, rEnd.x + 1.6, 3, rEnd.z, { line: 0.05 });
  const splash = new THREE.Group(); splash.position.copy(end); w.add(splash);
  for (let i = 0; i < 8; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 6), new THREE.MeshBasicMaterial({ color: 0xE6F6FF })); splash.add(m); m.userData.ph = i; }
  onTick(t => splash.children.forEach(m => { const k = (t * 1.6 + m.userData.ph / 8) % 1; m.position.set(Math.cos(m.userData.ph) * k * 1.4, Math.sin(k * Math.PI) * 1.1, Math.sin(m.userData.ph) * k * 1.4); }));
  // ---- the green crystal room far across the cavern: ONE loop on a track that runs from tunnel to tunnel
  const G = new THREE.Vector3(5, 3.2, -20), LR = 5.2, LAT = 2.6;
  const ground = b.box(46, 3.6, 12, 0x2E3F38, G.x, G.y - 1.9, G.z - 1, { line: 0.05 });
  const alcove = new THREE.Mesh(new THREE.SphereGeometry(10, 24, 14, 0, Math.PI * 2, 0, Math.PI / 2), toon(0x1C3A33, { side: THREE.BackSide, emissive: 0x0E3A24, emissiveIntensity: 0.6 })); alcove.rotation.x = Math.PI / 2; alcove.position.set(G.x, G.y + LR, G.z - 5); w.add(alcove);
  const GREEN = 0x4BE38A; for (let i = 0; i < 22; i++) { const a = i / 22 * Math.PI * 2; crystalCluster(b, G.x + Math.cos(a) * 9.4, G.y + LR + Math.sin(a) * 8.2, G.z - 4.6, 1.1 + rnd() * 0.6, GREEN, 3); }
  [[G.x, G.y + LR, G.z + 2], [G.x - 8, G.y + 3, G.z - 2], [G.x + 8, G.y + 3, G.z - 2]].forEach(p => { const l = new THREE.PointLight(GREEN, 40, 26, 1.2); l.position.set(...p); w.add(l); });
  const tl = [[-22, 0, 0], [-16, 0, 0.4], [-10, 0, 0.6], [-5, 0, 0.4], [-2, 0, 0]];
  const pts = tl.map(([x, y, z]) => new THREE.Vector3(G.x + x, G.y + y, G.z + z));
  for (let k = 0; k <= 20; k++) { const th = k / 20 * Math.PI * 2; pts.push(new THREE.Vector3(G.x + LR * Math.sin(th) * 0.98 - (k === 0 ? 0 : 0), G.y + LR - LR * Math.cos(th), G.z - LAT * k / 20)); }
  [[4, 0, -LAT - 0.2], [9, 0, -LAT - 0.6], [15, 0, -LAT - 0.8], [22, 0, -LAT - 0.8]].forEach(([x, y, z]) => pts.push(new THREE.Vector3(G.x + x, G.y + y, G.z + z)));
  const track = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
  const nearS = q => { let best = 0, bd = 1e9; for (let i = 0; i <= 600; i++) { const d = track.getPointAt(i / 600).distanceTo(q); if (d < bd) { bd = d; best = i / 600; } } return best; };
  const sA = nearS(pts[tl.length]), sB = nearS(pts[tl.length + 20]);
  const frame = s => { const p = track.getPointAt(s), f = track.getTangentAt(s); let u = new THREE.Vector3(0, 1, 0);
    if (s > sA + 0.004 && s < sB - 0.004) u = new THREE.Vector3(G.x, G.y + LR, p.z).sub(p).normalize();
    const r = new THREE.Vector3().crossVectors(u, f).normalize(); u = new THREE.Vector3().crossVectors(f, r).normalize(); return { p, f, r, u }; };
  const railM = toon(0xB8C4BE), tieM = toon(0x5A3A24), TL = track.getLength();
  [-0.38, 0.38].forEach(o => { const rp2 = []; for (let i = 0; i <= 400; i++) { const { p, r, u } = frame(i / 400); rp2.push(p.clone().addScaledVector(r, o).addScaledVector(u, 0.08)); } w.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rp2), 600, 0.06, 5), railM)); });
  for (let d = 0; d < TL; d += 0.8) { const { p, f, u } = frame(d / TL); const t = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.08, 0.22), tieM); t.position.copy(p); t.up.copy(u); t.lookAt(p.clone().add(f)); w.add(t); }
  // two tunnels: the track comes out of one and goes into the other
  [[pts[0], Math.PI / 2], [pts[pts.length - 1], -Math.PI / 2]].forEach(([p, ry]) => { const m = new THREE.Mesh(new THREE.CircleGeometry(2.2, 18, 0, Math.PI), new THREE.MeshBasicMaterial({ color: 0x040807 })); m.position.set(p.x, G.y - 0.1, p.z); m.rotation.y = ry; w.add(m); b.box(2, 5, 7, 0x2E3F38, p.x + (ry > 0 ? -1.1 : 1.1), G.y + 1.2, p.z, { line: 0.04 }); });
  // the cart with Mia and Toby
  const tiny = new THREE.Group(); w.add(tiny); const tc = cart(builder(tiny), 0, 0, 0); const cc = makeCast(tiny); cc.leo.g.visible = false;
  cc.mia.g.position.set(0, 0.45, 0.15); cc.mia.pose('cheer'); cc.mia.L.rotation.x = cc.mia.R.rotation.x = -1.4; cc.toby.g.position.set(0, 0.85, 0.6); cc.toby.g.scale.setScalar(0.9);
  tiny.scale.setScalar(1.15);
  const hitBox = new THREE.Mesh(new THREE.SphereGeometry(1.9, 10, 8), new THREE.MeshBasicMaterial({ visible: false })); tiny.add(hitBox);
  const ride = { s: 0, on: true, speed: 0.11 };
  onTick((t, dt) => { if (!ride.on) return; ride.s += dt * ride.speed * (ride.s > sA && ride.s < sB ? 1.25 : 1); if (ride.s > 1.18) ride.s = -0.05;   // a short pause in the tunnels, then round again
    const s = Math.min(0.999, Math.max(0.001, ride.s)); tiny.visible = ride.s > 0.004 && ride.s < 0.996; const { p, f, r, u } = frame(s); tiny.position.copy(p).addScaledVector(u, 0.05); tiny.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(r, u, f)); });
  // ---- Leo
  const cast = makeCast(w); cast.mia.g.visible = false; cast.toby.g.visible = false; const leo = cast.leo;
  leo.g.position.set(LEDGE.x - 0.6, LEDGE.y + 0.05, LEDGE.z - 3.6); leo.g.rotation.y = Math.PI;
  return { w, leo, LEDGE, MOUTH, SPRING, tiny, hitBox, ride, slidePath, riverPath, G, track, sA, sB };
}
