// Episode 2 places: the shaft (the drop), the green crystal room (the loop), the swift river and the beach.
import { THREE, builder, toon, outline, newWorld, onTick, textPlane } from './gfx.js';
import { makeCast } from './chars.js';
import { cart, rnd } from './sets.js';

const GREEN = 0x4BE38A;
function rider(w) {   // the cart with Mia and Toby inside
  const g = new THREE.Group(); w.add(g); const c = cart(builder(g), 0, 0, 0);
  const cast = makeCast(g); cast.leo.g.visible = false;
  cast.mia.g.position.set(0, 0.45, 0.15); cast.mia.pose('hold'); cast.mia.L.rotation.x = cast.mia.R.rotation.x = -1.4;
  cast.toby.g.position.set(0, 0.85, 0.6); cast.toby.g.scale.setScalar(0.9);
  return { g, cast, cartMesh: c };
}
const gemOf = (parent, x, y, z, s = 0.2) => { const m = builder(parent).add(new THREE.OctahedronGeometry(s), toon(0x5AD1FF, { emissive: 0x2AA8E8, emissiveIntensity: 0.9 }), x, y, z, { line: 0.02 }); m.scale.y = 1.6; return m; };

// ================================================================ stop 4: the drop
export function buildShaft() {
  const w = newWorld({ sky: 0x04050A, ambient: 0x9AA5C8, ambientI: 0.7, sunI: 0.3, fog: [0x04050A, 6, 46] }); const b = builder(w);
  const BOTTOM = -70;
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(4.6, 4.6, 90, 22, 1, true), toon(0x2B2F40, { side: THREE.BackSide })); shaft.position.y = -38; w.add(shaft);
  for (let i = 0; i < 70; i++) { const a = rnd() * Math.PI * 2, y = -rnd() * 75; b.rock(0.4 + rnd() * 0.6, 0x3B4054, Math.cos(a) * 4.3, y, Math.sin(a) * 4.3); }
  for (let y = -6; y > BOTTOM; y -= 9) { const l = new THREE.PointLight(0x7FA8FF, 4, 12, 1.5); l.position.set(0, y, 0); w.add(l); }
  // wind streaks rushing up past the cart
  const streakMat = new THREE.MeshBasicMaterial({ color: 0xDDE6FF, transparent: true, opacity: 0.35 });
  const streaks = Array.from({ length: 46 }, () => { const m = new THREE.Mesh(new THREE.BoxGeometry(0.03, 1.6, 0.03), streakMat); const a = rnd() * Math.PI * 2, r = 0.8 + rnd() * 3; m.position.set(Math.cos(a) * r, -rnd() * 20, Math.sin(a) * r); w.add(m); return m; });
  const R = rider(w); R.g.position.set(0, 0, 0);
  const wind = { speed: 0 };
  onTick((t, dt) => streaks.forEach(m => { m.position.y += wind.speed * dt * (1 + (m.id % 5) * 0.2); if (m.position.y > R.g.position.y + 12) m.position.y = R.g.position.y - 12 - Math.random() * 6; m.visible = wind.speed > 0.5; }));
  // the hidden track at the bottom, running off into a tunnel
  const floor = new THREE.Mesh(new THREE.CircleGeometry(4.6, 22), toon(0x23263A)); floor.rotation.x = -Math.PI / 2; floor.position.y = BOTTOM - 0.05; w.add(floor);
  const tun = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, 60, 16, 1, true), toon(0x2B2F40, { side: THREE.BackSide })); tun.rotation.x = Math.PI / 2; tun.position.set(0, BOTTOM + 1.6, -32); w.add(tun);
  [-0.38, 0.38].forEach(o => b.box(0.06, 0.06, 64, 0x8E9099, o, BOTTOM + 0.05, -30, { line: 0 }));
  for (let z = 3; z > -60; z -= 0.9) b.box(1.4, 0.06, 0.2, 0x5A3A24, 0, BOTTOM, z, { line: 0 });
  for (let z = -6; z > -60; z -= 8) { const l = new THREE.PointLight(0xFFB04A, 5, 9, 1.6); l.position.set(1.6, BOTTOM + 2, z); w.add(l); b.ball(0.14, new THREE.MeshBasicMaterial({ color: 0xFFC46B }), 1.9, BOTTOM + 2, z, { line: 0.02 }); }
  // glowing pebbles that float beside the cart while it falls (they carry letters)
  const floaters = new THREE.Group(); w.add(floaters); const fl = [];
  for (let i = 0; i < 6; i++) { const a = -0.2 + i / 5 * (Math.PI + 0.4), r = 2.2; const m = builder(floaters).add(new THREE.DodecahedronGeometry(0.4), toon(0x8FD3FF, { emissive: 0x3A7FC0, emissiveIntensity: 0.6 }), Math.cos(a) * r, 0.7 + (i % 2) * 0.9, -Math.sin(a) * r * 0.6 - 0.6, { line: 0.03 }); m.userData.base = m.position.clone(); fl.push(m); }
  onTick(t => { floaters.position.y = R.g.position.y; fl.forEach((m, i) => { m.position.y = m.userData.base.y + Math.sin(t * 1.5 + i) * 0.15; m.rotation.y = t + i; }); });
  floaters.visible = false;
  return { w, R, wind, BOTTOM, floaters, fl };
}

// ================================================================ stop 5: the green crystal room and the loop
export function buildCrystal() {
  const w = newWorld({ sky: 0x06110D, ambient: 0xBFF5D6, ambientI: 0.75, sunI: 0.35, fog: [0x06110D, 26, 80] }); const b = builder(w);
  const room = new THREE.Mesh(new THREE.SphereGeometry(34, 26, 16), toon(0x1C3A33, { side: THREE.BackSide })); room.scale.set(1.2, 0.6, 1.25); room.position.set(0, 4, -6); w.add(room);
  const ground = new THREE.Mesh(new THREE.CircleGeometry(40, 30), toon(0x203A30)); ground.rotation.x = -Math.PI / 2; ground.position.y = -0.6; w.add(ground);
  const cmat = toon(GREEN, { emissive: 0x1FA85A, emissiveIntensity: 0.55 });
  const cluster = (x, z, s = 1, y = -0.6) => { for (let k = 0; k < 4; k++) { const m = b.add(new THREE.OctahedronGeometry(0.5 * s * (0.6 + rnd() * 0.6)), cmat, x + (rnd() - 0.5) * s, y + 0.6 * s, z + (rnd() - 0.5) * s, { line: 0.03, rx: (rnd() - 0.5) * 0.7, rz: (rnd() - 0.5) * 0.7 }); m.scale.y = 2 + rnd() * 1.5; } };
  for (let i = 0; i < 46; i++) { const a = rnd() * Math.PI * 2, r = 14 + rnd() * 20; cluster(Math.cos(a) * r * 1.1, -6 + Math.sin(a) * r, 1 + rnd() * 1.5); }
  for (let i = 0; i < 24; i++) { const a = rnd() * Math.PI * 2, r = 6 + rnd() * 26; const m = b.add(new THREE.OctahedronGeometry(0.6 + rnd()), cmat, Math.cos(a) * r, 18, -6 + Math.sin(a) * r, { line: 0.03, rx: Math.PI }); m.scale.y = 2.5; }
  [[-12, 6, 10], [12, 6, -4], [0, 8, -22], [-10, 6, -26], [10, 6, 18]].forEach(([x, y, z]) => { const l = new THREE.PointLight(GREEN, 30, 40, 1.2); l.position.set(x, y, z); w.add(l); });
  // the track: twists left and right, then a giant vertical loop, then a platform
  const Zc = -16, LR = 6;
  const pts = [[0, 0, 34], [0, 0, 28], [-5, 0, 21], [-6, 0, 16], [3, 0, 10], [6, 0, 5], [-2, 0, 0], [-4, 0, -4], [0, 0, Zc + 7], [0, 0, Zc + 3]];
  const loopStart = pts.length;
  for (let k = 0; k <= 18; k++) { const th = k / 18 * Math.PI * 2; pts.push([2.4 * k / 18, LR - LR * Math.cos(th), Zc - LR * Math.sin(th)]); }
  const loopEnd = pts.length - 1;
  pts.push([2.4, 0, Zc - 4], [2.4, 0, Zc - 10], [2.4, 0, Zc - 16]);
  const path = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p)), false, 'centripetal', 0.5);
  const L = path.getLength();
  // find where the loop starts and ends along the path (as 0..1)
  const near = q => { let best = 0, bd = 1e9; for (let i = 0; i <= 600; i++) { const d = path.getPointAt(i / 600).distanceTo(q); if (d < bd) { bd = d; best = i / 600; } } return best; };
  const sA = near(new THREE.Vector3(...pts[loopStart])), sB = near(new THREE.Vector3(...pts[loopEnd]));
  const center = s => new THREE.Vector3(path.getPointAt(s).x, LR, Zc);
  const frame = s => {
    const p = path.getPointAt(s), f = path.getTangentAt(s);
    let up = new THREE.Vector3(0, 1, 0);
    if (s > sA + 0.004 && s < sB - 0.004) up = center(s).sub(p).normalize();
    const r = new THREE.Vector3().crossVectors(up, f).normalize(); const u = new THREE.Vector3().crossVectors(f, r).normalize();
    return { p, f, r, u };
  };
  const railMat = toon(0xB8C4BE), tieMat = toon(0x5A3A24);
  [-0.38, 0.38].forEach(o => { const rp = []; for (let i = 0; i <= 500; i++) { const { p, r, u } = frame(i / 500); rp.push(p.clone().addScaledVector(r, o).addScaledVector(u, 0.08)); }
    w.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rp), 700, 0.05, 5), railMat)); });
  for (let d = 0; d < L; d += 0.9) { const { p, f, u } = frame(d / L); const t = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.07, 0.2), tieMat); t.position.copy(p); t.up.copy(u); t.lookAt(p.clone().add(f)); w.add(t); }
  // support posts under the flat parts
  for (let d = 0; d < L; d += 4) { const s = d / L; if (s > sA && s < sB) continue; const { p } = frame(s); b.cyl(0.08, 0.1, 0.6, 0x3A4A44, p.x, -0.3, p.z, { line: 0 }); }
  const R = rider(w);
  const place = s => { const { p, f, r, u } = frame(Math.min(s, 0.999)); R.g.position.copy(p).addScaledVector(u, 0.05); R.g.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(r, u, f)); };
  place(0);
  // the platform at the end, with eight big crystals around it (they will carry words)
  const end = path.getPointAt(1); b.cyl(3.2, 3.4, 0.4, 0x2E4A3E, end.x, -0.25, end.z - 1.5, { line: 0.04 });
  const big = [];
  for (let i = 0; i < 8; i++) { const side = i < 4 ? -1 : 1, k = i % 4; const x = side * (4.6 + (k % 2) * 2.0) + 1.2, z = Zc + 3 - k * 2.6;
    const g = new THREE.Group(); g.position.set(x, -0.6, z); w.add(g); const m = builder(g).add(new THREE.OctahedronGeometry(0.9), toon(GREEN, { emissive: 0x1FA85A, emissiveIntensity: 0.4 }), 0, 1.9, 0, { line: 0.04 }); m.scale.y = 2.2; g.userData.crystal = m; big.push(g); }
  return { w, path, L, frame, place, R, sA, sB, big, end };
}

// ================================================================ stop 6: the swift river (and the beach after it)
export function buildRiver() {
  const w = newWorld({ sky: 0x070B14, ambient: 0xB0C4E8, ambientI: 0.75, sunI: 0.35, fog: [0x070B14, 18, 70] }); const b = builder(w);
  const cave = new THREE.Mesh(new THREE.CylinderGeometry(8, 8, 110, 20, 1, true, Math.PI / 2, Math.PI * 1.25), toon(0x2A3040, { side: THREE.BackSide })); cave.rotation.x = Math.PI / 2; cave.rotation.y = 0; cave.position.set(0, 1, -40); w.add(cave);
  const bed = new THREE.Mesh(new THREE.PlaneGeometry(16, 110), toon(0x2A3040)); bed.rotation.x = -Math.PI / 2; bed.position.set(0, -1.2, -40); w.add(bed);
  const water = new THREE.Mesh(new THREE.PlaneGeometry(11, 110, 22, 110), toon(0x2F86C9, { transparent: true, opacity: 0.92 })); water.rotation.x = -Math.PI / 2; water.position.set(0, 0, -40); w.add(water);
  const wp = water.geometry.attributes.position; onTick(t => { for (let i = 0; i < wp.count; i++) wp.setZ(i, Math.sin(wp.getY(i) * 0.8 + t * 3) * 0.07 + Math.sin(wp.getX(i) * 1.7 + t * 2) * 0.04); wp.needsUpdate = true; });
  // foam bits racing down the river
  const foamMat = new THREE.MeshBasicMaterial({ color: 0xE6F6FF }); const foam = Array.from({ length: 70 }, () => { const m = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.02, 0.6), foamMat); m.position.set((rnd() - 0.5) * 10, 0.06, 10 - rnd() * 100); w.add(m); return m; });
  const flow = { speed: 3 }; onTick((t, dt) => foam.forEach(m => { m.position.z -= flow.speed * dt * (0.8 + (m.id % 4) * 0.15); if (m.position.z < -92) m.position.z = 12; }));
  for (let i = 0; i < 40; i++) { const z = 10 - rnd() * 95, side = rnd() < 0.5 ? -1 : 1; b.rock(0.6 + rnd() * 1.1, 0x4A4F63, side * (5.6 + rnd() * 1.5), 0, z); }
  // the ledge where the old tracks stop, high above the water
  b.box(4, 4.6, 6, 0x3A3F55, 0, -0.9, 13, { line: 0.05 });
  [-0.38, 0.38].forEach(o => b.box(0.06, 0.06, 5.6, 0x8E9099, o, 1.42, 13, { line: 0 })); for (let z = 10.6; z < 16; z += 0.9) b.box(1.4, 0.06, 0.2, 0x5A3A24, 0, 1.38, z, { line: 0 });
  // bright exit far ahead
  const exitGlow = new THREE.Mesh(new THREE.CircleGeometry(6.5, 30), new THREE.MeshBasicMaterial({ color: 0xFFF6D8 })); exitGlow.position.set(0, 1, -94); w.add(exitGlow);
  const halo = new THREE.PointLight(0xFFF0C0, 40, 60, 1); halo.position.set(0, 3, -85); w.add(halo);
  // the river splits into three channels between rock walls; a word sign hangs over each one
  [-1.8, 1.8].forEach(x => { for (let z = -18; z > -34; z -= 1.6) b.rock(0.9, 0x4A4F63, x + (rnd() - 0.5) * 0.4, 0.1, z); });
  const gates = [-3.6, 0, 3.6].map(x => { const g = new THREE.Group(); g.position.set(x, 0, -17.2); w.add(g); const gb = builder(g);
    gb.cyl(0.07, 0.07, 3, 0x5A3A24, -1.1, 1.5, 0, { line: 0.015 }); gb.cyl(0.07, 0.07, 3, 0x5A3A24, 1.1, 1.5, 0, { line: 0.015 });
    const board = gb.box(2.4, 0.9, 0.08, 0xC9A46A, 0, 2.7, 0, { line: 0.03 }); g.userData.board = board; return g; });
  // Leo on his log, drifting where the channels meet again
  const leoLog = new THREE.Group(); leoLog.position.set(0, 0.1, -42); w.add(leoLog); builder(leoLog).cyl(0.34, 0.34, 2.4, 0x8A5A3B, 0, 0.1, 0, { rz: Math.PI / 2, line: 0.03 });
  onTick(t => { leoLog.position.y = 0.1 + Math.sin(t * 2) * 0.06; leoLog.rotation.z = Math.sin(t * 1.3) * 0.05; });
  const R = rider(w); R.g.position.set(0, 1.45, 15.5); R.g.rotation.y = Math.PI;
  const paddle = builder(R.cast.mia.AR).box(0.06, 1.3, 0.06, 0x8A5A3B, 0, -0.5, 0.2, { line: 0.015 }); paddle.visible = false;
  const lc = makeCast(leoLog); lc.mia.g.visible = false; lc.toby.g.visible = false; const leo = lc.leo; leo.g.position.set(0, 0.32, 0); leo.pose('sit'); leo.g.rotation.y = Math.PI * 0.15;
  return { w, R, gates, leoLog, flow, leo, paddle, exitGlow };
}
export function buildBeach() {
  const w = newWorld({ sky: 0xA8E0FF, ambientI: 1.7, sunI: 1.8, fog: [0xBFE6F7, 45, 120] }); const b = builder(w);
  // sky gradient
  const sc = document.createElement('canvas'); sc.width = 4; sc.height = 256; const sx = sc.getContext('2d'); const sg = sx.createLinearGradient(0, 0, 0, 256);
  sg.addColorStop(0, '#6FB7E6'); sg.addColorStop(0.6, '#BFE6F7'); sg.addColorStop(1, '#FFE9C2'); sx.fillStyle = sg; sx.fillRect(0, 0, 4, 256);
  const st = new THREE.CanvasTexture(sc); st.colorSpace = THREE.SRGBColorSpace; w.parent.background = st;
  // sand with soft dunes, a darker wet band, and the sea
  const sandGeo = new THREE.PlaneGeometry(90, 50, 60, 34); const sp0 = sandGeo.attributes.position;
  for (let i = 0; i < sp0.count; i++) { const x = sp0.getX(i), y = sp0.getY(i); const back = Math.max(0, -y - 2) / 22; sp0.setZ(i, back * back * 6 + Math.sin(x * 0.35) * Math.cos(y * 0.4) * 0.35 * back + (rnd() - 0.5) * 0.05); }
  sandGeo.computeVertexNormals(); const sand = new THREE.Mesh(sandGeo, toon(0xF2D79B)); sand.rotation.x = -Math.PI / 2; sand.position.set(0, 0, 5); w.add(sand);
  const wet = new THREE.Mesh(new THREE.PlaneGeometry(90, 5), toon(0xD9B878)); wet.rotation.x = -Math.PI / 2; wet.position.set(0, 0.015, -17.5); w.add(wet);
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(220, 120, 50, 24), toon(0x3FA7D6)); sea.rotation.x = -Math.PI / 2; sea.position.set(0, 0.05, -80); w.add(sea);
  const spos = sea.geometry.attributes.position; onTick(t => { for (let i = 0; i < spos.count; i++) spos.setZ(i, Math.sin(spos.getX(i) * 0.25 + t) * 0.12 + Math.cos(spos.getY(i) * 0.3 + t * 0.7) * 0.08); spos.needsUpdate = true; });
  // waves washing up the sand
  const foamMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0.85 });
  const waves = [0, 1, 2].map(i => { const m = new THREE.Mesh(new THREE.PlaneGeometry(90, 0.5, 40, 1), foamMat.clone()); m.rotation.x = -Math.PI / 2; w.add(m); m.userData.ph = i / 3; return m; });
  onTick(t => waves.forEach(m => { const k = (t * 0.18 + m.userData.ph) % 1; m.position.set(0, 0.06, -21 + k * 4.2); m.material.opacity = Math.sin(k * Math.PI) * 0.85; }));
  const sun = new THREE.Mesh(new THREE.SphereGeometry(4, 20, 12), new THREE.MeshBasicMaterial({ color: 0xFFE58A })); sun.position.set(30, 22, -100); w.add(sun);
  // clouds
  const cm = toon(0xFFFFFF); for (let i = 0; i < 6; i++) { const g = new THREE.Group(); g.position.set(-50 + i * 20 + rnd() * 8, 16 + rnd() * 6, -70 - rnd() * 20); w.add(g); for (let k = 0; k < 4; k++) { const m = new THREE.Mesh(new THREE.SphereGeometry(2 + rnd() * 1.5, 10, 8), cm); m.position.set(k * 2.6 - 4, rnd(), 0); m.scale.y = 0.6; g.add(m); } onTick((t, dt) => { g.position.x += dt * 0.6; if (g.position.x > 70) g.position.x = -70; }); }
  // the rocky cliff with the cave they shot out of — the opening sits IN FRONT of the rock so it is never cut off
  const cliff = b.rock(10, 0x9A8C7A, 0, 3, 21, { line: 0.06 }); cliff.scale.set(1.8, 1.0, 0.75);
  b.rock(5, 0x8C7F6E, -13, 1.5, 17, { line: 0.05 }); b.rock(5.5, 0x8C7F6E, 13, 1.8, 17.5, { line: 0.05 });
  const mouth = new THREE.Group(); mouth.position.set(0, 0, 13.4); mouth.rotation.y = Math.PI; w.add(mouth);
  const gc = document.createElement('canvas'); gc.width = gc.height = 256; const gx = gc.getContext('2d'); const gr = gx.createRadialGradient(128, 256, 10, 128, 256, 250);
  gr.addColorStop(0, '#000000'); gr.addColorStop(0.55, '#07080E'); gr.addColorStop(1, '#2A2D3A'); gx.fillStyle = gr; gx.fillRect(0, 0, 256, 256); const gt = new THREE.CanvasTexture(gc); gt.colorSpace = THREE.SRGBColorSpace;
  const door = new THREE.Mesh(new THREE.CircleGeometry(2.6, 28, 0, Math.PI), new THREE.MeshBasicMaterial({ map: gt })); door.scale.y = 1.1; mouth.add(door);
  const face = new THREE.Mesh(new THREE.RingGeometry(2.6, 6.5, 28, 1, 0, Math.PI), toon(0x9A8C7A)); face.scale.y = 1.1; face.position.z = 0.02; mouth.add(face); outline(face, 0.04);
  [[-3.6, 0.6], [-3.2, 2.2], [-2.0, 3.4], [-0.4, 3.9], [1.3, 3.7], [2.7, 2.8], [3.5, 1.4]].forEach(([x, y]) => { const r = builder(mouth).rock(0.55, 0x8C7F6E, x, y, 0.3, { line: 0.03 }); r.scale.z = 0.5; });
  // the little stream from the cave across the sand to the sea
  const stream = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 31), toon(0x5BB8E8)); stream.rotation.x = -Math.PI / 2; stream.position.set(0, 0.03, -2.3); w.add(stream);
  // palms, bushes, boulders, driftwood, shells, starfish, a crab
  const palm = (x, z, lean) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.z = lean; w.add(g); const pb = builder(g);
    for (let k = 0; k < 6; k++) pb.cyl(0.24 - k * 0.02, 0.27 - k * 0.02, 0.85, 0x8A5A3B, Math.sin(k * 0.35) * 0.3, 0.45 + k * 0.8, 0, { line: 0.02 });
    for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; const l = pb.box(2.6, 0.06, 0.7, 0x4FA35A, Math.cos(a) * 1.1 + 0.3, 4.9, Math.sin(a) * 1.1, { ry: -a, rz: -0.45, line: 0.02 }); }
    pb.ball(0.18, 0x6B4A33, 0.4, 4.6, 0.2, { line: 0.01 }); pb.ball(0.18, 0x6B4A33, 0.1, 4.55, -0.2, { line: 0.01 }); };
  [[-9, 8, 0.12], [-12.5, 4, -0.1], [9.5, 7, -0.14], [13, 3, 0.1], [-6, 11, 0.05], [7, 11.5, -0.06]].forEach(p => palm(...p));
  for (let i = 0; i < 14; i++) { const x = (rnd() < 0.5 ? -1 : 1) * (8 + rnd() * 14), z = 5 + rnd() * 10; b.ball(0.8 + rnd() * 0.8, [0x4FA35A, 0x5DBB66][i % 2], x, 0.5, z, { line: 0.03 }); }
  [[-7, -9, 1.2], [8, -11, 1.5], [-15, -6, 2], [16, -5, 1.8], [-4, -15, 0.7], [11, -16, 0.9]].forEach(([x, z, r]) => b.rock(r, 0x8C7F6E, x, r * 0.4, z, { line: 0.04 }));
  b.cyl(0.18, 0.2, 3.4, 0xB79A72, -5, 0.18, -4, { rz: Math.PI / 2, ry: 0.5, line: 0.02 });
  for (let i = 0; i < 18; i++) { const x = -14 + rnd() * 28, z = -16 + rnd() * 14; if (Math.abs(x) < 2.5) continue; b.ball(0.12, [0xFFFFFF, 0xF8C8D0, 0xFFE58A][i % 3], x, 0.05, z, { line: 0.01 }).scale.y = 0.45; }
  [[-3.5, -10], [5, -7]].forEach(([x, z]) => { for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2; b.box(0.08, 0.04, 0.4, 0xF28C38, x + Math.cos(a) * 0.18, 0.04, z + Math.sin(a) * 0.18, { ry: -a + Math.PI / 2, line: 0.01 }); } });
  const crab = new THREE.Group(); crab.position.set(4, 0, -3); w.add(crab); const crb = builder(crab); crb.ball(0.25, 0xEF5B4C, 0, 0.18, 0, { line: 0.02 }).scale.y = 0.6; [-1, 1].forEach(sd => { crb.ball(0.1, 0xEF5B4C, sd * 0.3, 0.25, 0.15, { line: 0.01 }); crb.ball(0.05, 0x2E2A4F, sd * 0.09, 0.32, 0.18, { line: 0 }); });
  onTick(t => { crab.position.x = 4 + Math.sin(t * 0.6) * 2.5; crab.rotation.y = Math.PI / 2; });
  const tipped = cart(b, 3.2, 0, 1.5); tipped.rotation.set(0, 0.8, 1.2);
  const cast = makeCast(w);
  cast.leo.g.position.set(-0.7, 0, 0); cast.mia.g.position.set(0.7, 0, 0); cast.toby.g.position.set(0, 0, -1.0);
  [cast.leo, cast.mia, cast.toby].forEach(c => c.g.rotation.y = Math.PI);   // facing the camera (and the sea)
  const gem = gemOf(cast.mia.g, 0, 0.95, 0.38);
  return { w, cast, gem };
}
