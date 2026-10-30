// Episode 3 places (Leo's side): the rock shelf, the muddy crack, the rainbow cliff with the water slide.
import { THREE, builder, toon, outline, newWorld, onTick, textTexture } from './gfx.js';
import { makeCast } from './chars.js';
import { rnd } from './sets.js';

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
  const cast = makeCast(w); cast.mia.g.visible = false; cast.toby.g.visible = false; const leo = cast.leo;
  leo.g.position.set(0, 0, 3); leo.g.rotation.y = 0;
  return { w, leo, shelves, drop: dropper(w, b) };
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

// ================================================================ stop 9: the rainbow cliff and the water slide
export function buildCliff() {
  const w = newWorld({ sky: 0x0B0A18, ambient: 0xD8D0FF, ambientI: 0.85, sunI: 0.4, fog: [0x0B0A18, 30, 90] }); const b = builder(w);
  const room = new THREE.Mesh(new THREE.SphereGeometry(40, 26, 16), toon(0x24203A, { side: THREE.BackSide })); room.scale.set(1.2, 0.65, 1.1); room.position.y = 6; w.add(room);
  const ground = new THREE.Mesh(new THREE.CircleGeometry(46, 30), toon(0x2A2640)); ground.rotation.x = -Math.PI / 2; w.add(ground);
  const RAIN = [0xFF6B6B, 0xFFA94D, 0xFFE066, 0x69DB7C, 0x4DABF7, 0xB197FC, 0xF783AC];
  for (let i = 0; i < 70; i++) { const a = rnd() * Math.PI * 2, r = 12 + rnd() * 30, c = RAIN[i % RAIN.length]; const s = 0.8 + rnd() * 1.8;
    for (let k = 0; k < 3; k++) { const m = b.add(new THREE.OctahedronGeometry(0.45 * s * (0.6 + rnd() * 0.6)), toon(c, { emissive: c, emissiveIntensity: 0.45 }), Math.cos(a) * r + (rnd() - 0.5) * s, 0.5 * s, Math.sin(a) * r + (rnd() - 0.5) * s, { line: 0.03, rx: (rnd() - 0.5) * 0.6, rz: (rnd() - 0.5) * 0.6 }); m.scale.y = 2 + rnd(); } }
  for (let i = 0; i < 30; i++) { const a = rnd() * Math.PI * 2, r = 6 + rnd() * 30, c = RAIN[i % RAIN.length]; const m = b.add(new THREE.OctahedronGeometry(0.5 + rnd() * 0.8), toon(c, { emissive: c, emissiveIntensity: 0.5 }), Math.cos(a) * r, 26, Math.sin(a) * r, { line: 0.03, rx: Math.PI }); m.scale.y = 2.4; }
  [[-14, 12, -10, 0xB197FC], [14, 10, -6, 0x69DB7C], [0, 14, 12, 0x4DABF7], [8, 8, 16, 0xFFA94D]].forEach(([x, y, z, c]) => { const l = new THREE.PointLight(c, 40, 50, 1.1); l.position.set(x, y, z); w.add(l); });
  // the high cliff where Leo stands
  const CL = new THREE.Vector3(-14, 11, 8);
  const col = b.cyl(3.4, 4.6, 11, 0x5B5770, CL.x, 5.5, CL.z, { line: 0.05, seg: 9 }); b.cyl(3.6, 3.4, 0.6, 0x6E6A85, CL.x, 11.1, CL.z, { line: 0.04, seg: 9 });
  for (let i = 0; i < 8; i++) b.rock(0.9 + rnd() * 0.6, 0x5B5770, CL.x + Math.cos(i) * 4, 1 + rnd() * 7, CL.z + Math.sin(i) * 4);
  const cast = makeCast(w); cast.mia.g.visible = false; cast.toby.g.visible = false; const leo = cast.leo; leo.g.position.set(CL.x + 1.6, 11.4, CL.z - 1.2); leo.g.rotation.y = 2.3;
  // the green loop below, with Mia and Toby's little cart racing around it (a moving target)
  const LC = new THREE.Vector3(6, 7.4, -8), LR = 6.2, LOOPY = -0.8;   // the loop faces Leo's cliff
  const loop = new THREE.Mesh(new THREE.TorusGeometry(LR, 0.16, 6, 56), toon(0xB8C4BE)); loop.position.copy(LC); loop.rotation.y = LOOPY; outline(loop, 0.03); w.add(loop);
  [[-1, 1], [1, 1]].forEach(([sx]) => b.box(0.15, 1.2, 0.15, 0x3A4A44, LC.x + sx * 0.4, 0.6, LC.z, { line: 0 }));
  const gm = toon(0x4BE38A, { emissive: 0x1FA85A, emissiveIntensity: 0.6 }); for (let i = 0; i < 16; i++) { const a = rnd() * Math.PI * 2, r = 6 + rnd() * 5; const m = b.add(new THREE.OctahedronGeometry(0.6 + rnd() * 0.5), gm, LC.x + Math.cos(a) * r, 0.7, LC.z + Math.sin(a) * r, { line: 0.03 }); m.scale.y = 2.2; }
  const tiny = new THREE.Group(); tiny.scale.setScalar(1.5); w.add(tiny); const tb = builder(tiny); tb.box(1.1, 0.55, 1.5, 0x8A5A3B, 0, 0.3, 0, { line: 0.03 }); tb.ball(0.28, 0xF2C94C, 0.15, 0.85, 0, { line: 0.02 }); tb.ball(0.2, 0xC98A4B, -0.25, 0.7, 0.3, { line: 0.02 });
  const hitBox = new THREE.Mesh(new THREE.SphereGeometry(1.8, 10, 8), new THREE.MeshBasicMaterial({ visible: false })); tiny.add(hitBox);
  const rot = new THREE.Euler(0, LOOPY, 0);
  onTick(t => { const a = t * 1.1; const p = new THREE.Vector3(Math.sin(a) * LR, -Math.cos(a) * LR, 0).applyEuler(rot); tiny.position.copy(LC).add(p); tiny.rotation.set(0, LOOPY, 0); tiny.rotateZ(a); tiny.rotateY(Math.PI / 2); });
  // the water slide: a smooth rock path full of rushing water, from the cliff top spiralling down
  const pts = []; for (let i = 0; i <= 24; i++) { const k = i / 24; const a = 2.4 + k * 4.2; pts.push(new THREE.Vector3(CL.x + Math.cos(a) * (4.6 + k * 2), 11.1 - k * 10.6, CL.z + Math.sin(a) * (4.6 + k * 2))); }
  const slidePath = new THREE.CatmullRomCurve3(pts);
  const N = 160, up = new THREE.Vector3(0, 1, 0), wp = [], idx = [], edges = [[], []];
  for (let i = 0; i <= N; i++) { const p = slidePath.getPointAt(i / N), tg = slidePath.getTangentAt(i / N), sd = new THREE.Vector3().crossVectors(tg, up).normalize();
    wp.push(...p.clone().addScaledVector(sd, -0.8).toArray(), ...p.clone().addScaledVector(sd, 0.8).toArray()); edges[0].push(p.clone().addScaledVector(sd, -0.9).setY(p.y + 0.25)); edges[1].push(p.clone().addScaledVector(sd, 0.9).setY(p.y + 0.25));
    if (i < N) { const k = i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); } }
  const wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.Float32BufferAttribute(wp, 3)); wg.setIndex(idx); wg.computeVertexNormals();
  w.add(new THREE.Mesh(wg, toon(0x5BB8E8, { side: THREE.DoubleSide })));
  edges.forEach(e => w.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(e), 160, 0.22, 6), toon(0x8C88A6))));
  const bed = new THREE.Mesh(wg.clone(), toon(0x6E6A85, { side: THREE.DoubleSide })); bed.position.y = -0.12; w.add(bed);
  return { w, leo, CL, tiny, hitBox, slidePath };
}
