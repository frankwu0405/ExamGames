// The places. Each build function makes a fresh world and returns handles the story script uses.
import { THREE, builder, toon, outline, newWorld, onTick, textPlane, textTexture, INK } from './gfx.js';
import { makeCast } from './chars.js';

export const rnd = (s => () => (s = (s * 16807) % 2147483647) / 2147483647)(7);
export function tree(b, x, z, s = 1) { b.cyl(0.12 * s, 0.16 * s, 1 * s, 0x7A5236, x, 0.5 * s, z); b.cone(0.7 * s, 1.5 * s, 0x4FA35A, x, 1.6 * s, z); b.cone(0.55 * s, 1.1 * s, 0x5DBB66, x, 2.2 * s, z); }
export function ferris(b, x, y, z, s = 1) {
  const RED = 0xD93A35, g = new THREE.Group(); g.position.set(x, y, z); g.scale.setScalar(s); b.group.add(g); const fb = builder(g);
  fb.box(0.14, 3, 0.14, RED, -0.7, 1.4, 0, { rz: -0.25 }); fb.box(0.14, 3, 0.14, RED, 0.7, 1.4, 0, { rz: 0.25 }); fb.box(0.12, 3, 0.12, RED, -0.7, 1.4, -0.5, { rz: -0.25 }); fb.box(0.12, 3, 0.12, RED, 0.7, 1.4, -0.5, { rz: 0.25 });
  const w = new THREE.Group(); w.position.set(0, 2.9, -0.25); g.add(w); const wb = builder(w);
  wb.torus(1.8, 0.08, RED, 0, 0, 0.12, { seg: 36 }); wb.torus(1.8, 0.08, RED, 0, 0, -0.12, { seg: 36 }); wb.cyl(0.18, 0.18, 0.4, RED, 0, 0, 0, { rx: Math.PI / 2 });
  const cabs = [];
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; wb.box(0.05, 1.8, 0.05, RED, Math.cos(a) * 0.9, Math.sin(a) * 0.9, 0.12, { rz: a + Math.PI / 2, line: 0 }); wb.box(0.05, 1.8, 0.05, RED, Math.cos(a) * 0.9, Math.sin(a) * 0.9, -0.12, { rz: a + Math.PI / 2, line: 0 });
    const cb = new THREE.Group(); cb.position.set(Math.cos(a) * 1.8, Math.sin(a) * 1.8, 0); w.add(cb); builder(cb).box(0.34, 0.3, 0.3, i % 2 ? 0xFFF4D6 : 0xFFC94A, 0, -0.2, 0, { line: 0.02 }); cabs.push(cb); }
  onTick((t, dt) => { w.rotation.z += dt * 0.3; cabs.forEach(c => c.rotation.z = -w.rotation.z); });
  return g;
}
export function cart(b, x, y, z) {
  const g = new THREE.Group(); g.position.set(x, y, z); b.group.add(g); const cb = builder(g);
  cb.box(1.3, 0.6, 1.8, 0x8A5A3B, 0, 0.55, 0, { line: 0.03 }); cb.box(1.1, 0.1, 1.6, 0x5A3A24, 0, 0.83, 0, { line: 0 });
  [-0.66, 0.66].forEach(xx => [-0.9, 0.9].forEach(zz => cb.box(0.06, 0.62, 0.08, 0x9C6B45, xx, 0.55, zz, { line: 0 })));
  [-0.68, 0.68].forEach(xx => [-0.55, 0.55].forEach(zz => cb.cyl(0.2, 0.2, 0.1, 0x55595F, xx, 0.22, zz, { rz: Math.PI / 2, line: 0.02 })));
  return g;
}

// ================================================================ the journey map
export const STOPS = [
  { n: 1, name: 'The Meadow', ep: 1, p: [-19, 0.5, 7] },
  { n: 2, name: 'The Glowing Stone', ep: 1, p: [-14.6, 0.5, 9.4] },
  { n: 3, name: 'The Dark Tunnel', ep: 1, p: [-9.5, -1.6, 6.8] },
  { n: 4, name: 'The Drop', ep: 2, p: [-6.6, -2.0, 5.4] },
  { n: 5, name: 'Crystal Loop', ep: 2, p: [-3.6, -1.6, 4] },
  { n: 6, name: 'The Swift River', ep: 2, p: [-0.8, -0.6, 2.8] },
  { n: 7, name: 'The Rock Shelf', ep: 3, p: [-12.2, -1.8, 3.4] },
  { n: 8, name: 'The Crack', ep: 3, p: [-8.8, -2.0, 1.6] },
  { n: 9, name: 'The Rainbow Cliff', ep: 3, p: [-5.4, -1.6, 1.0] },
  { n: 10, name: 'The Lost Island', ep: 4, p: [2.6, 1.8, 1.4] },
  { n: 11, name: 'Toby’s Dig', ep: 4, p: [0.2, 0.7, 3.9] },
  { n: 12, name: 'The Clear Sea', ep: 4, p: [7.5, 0.3, -2.4] },
  { n: 13, name: 'Varn Rises', ep: 5, p: [10, 0.3, -4.4] },
  { n: 14, name: 'Mia’s Choice', ep: 5, p: [12.4, 0.3, -6.6] },
  { n: 15, name: 'The Angry Wave', ep: 5, p: [14.6, 0.3, -9] },
  { n: 16, name: 'The Gray Shore', ep: 6, p: [18, 0.6, -11] },
  { n: 17, name: 'Out of the Fog', ep: 7, p: [23, 0.3, -2] },
  { n: 18, name: 'The Chase', ep: 8, p: [18, 0.3, 8] },
  { n: 19, name: "Varn's Story", ep: 9, p: [27, 0.6, 12] },
];
export const EPISODES = { 1: { title: 'The Cave', stops: [1, 2, 3] }, 2: { title: 'The Cave 2', stops: [4, 5, 6] }, 3: { title: 'The Cave 3: Leo’s Side', stops: [7, 8, 9] }, 4: { title: 'The Cave 4: The Lost Island', stops: [10, 11, 12] }, 5: { title: 'The Cave 5: Guard of the Stones', stops: [13, 14, 15] } };
export const MAX_EP = 5;
export function buildMap(S, onPick) {
  const w = newWorld({ sky: 0xBFE6F7, ambientI: 1.5, sunI: 1.5, fog: [0xBFE6F7, 70, 140] }); const b = builder(w);
  // sea with a dark seabed under it, so the secret tunnel shows through the water
  const seabed = new THREE.Mesh(new THREE.PlaneGeometry(160, 120), toon(0x1F4E6B)); seabed.rotation.x = -Math.PI / 2; seabed.position.y = -3.2; w.add(seabed);
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(160, 120, 40, 30), toon(0x3FA7D6, { transparent: true, opacity: 0.72 })); sea.rotation.x = -Math.PI / 2; w.add(sea);
  const pos = sea.geometry.attributes.position; onTick(t => { for (let i = 0; i < pos.count; i++) pos.setZ(i, Math.sin(pos.getX(i) * 0.3 + t) * 0.08 + Math.cos(pos.getY(i) * 0.4 + t * 0.8) * 0.06); pos.needsUpdate = true; });
  const land = (x, z, rx, rz, h, c = 0x8CC95E, side = 0xC9A46A) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(1, 1.15, h, 28), [toon(side), toon(c), toon(side)]); m.scale.set(rx, 1, rz); m.position.set(x, h / 2 - 0.3, z); outline(m, 0.05); w.add(m); return m; };
  // the mainland: the hometown coast runs off the edge of the map (it is not an island)
  const coast = z => -16.5 + 5.6 * Math.exp(-(((z - 10) / 5.5) ** 2)) + 0.7 * Math.sin(z * 0.37) + 0.35 * Math.sin(z * 1.1 + 1);
  const shape = new THREE.Shape(); shape.moveTo(-95, 70);
  for (let z = -70; z <= 70; z += 1.5) shape.lineTo(coast(z), -z);
  shape.lineTo(-95, -70); shape.closePath();
  const mainland = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 1.0, bevelEnabled: true, bevelSize: 0.6, bevelThickness: 0.3, bevelSegments: 2 }), [toon(0x8CC95E), toon(0xE2C48A)]);
  mainland.rotation.x = -Math.PI / 2; mainland.position.y = -0.3; w.add(mainland);
  // village: houses, a red Ferris wheel, a lighthouse, a little harbour
  ferris(b, -24, 0.7, -2, 0.75);
  const roofC = [0xEF5B4C, 0x4AA3DF, 0xFFC94A, 0xB57EDC, 0x5DBB4A, 0xF28C38, 0xE86A8E, 0x6FC3C8];
  let placed = 0; for (let i = 0; i < 120 && placed < 30; i++) {
    const x = -40 + rnd() * 21, z = -22 + rnd() * 42;
    if (x > coast(z) - 2.2) continue; if (Math.hypot(x + 19, z - 7) < 3.6 || Math.hypot(x + 24, z + 2) < 2.8 || Math.hypot(x + 14.5, z - 11) < 4) continue;
    const tall = rnd() < 0.3, hh = tall ? 1.7 : 1.0, c = roofC[placed % roofC.length];
    b.box(1.1, hh, 1.1, 0xFFF4D6, x, 0.7 + hh / 2, z, { ry: rnd() * 0.6 }); b.cone(0.95, 0.75, c, x, 0.7 + hh + 0.37, z, { seg: 4, ry: Math.PI / 4 }); placed++;
  }
  for (let i = 0; i < 40; i++) { const x = -44 + rnd() * 26, z = -26 + rnd() * 50; if (x > coast(z) - 1.6) continue; tree(b, x, z, 0.55 + rnd() * 0.25); }
  const lz = -9, lx = coast(lz) - 1.3; b.cyl(0.55, 0.75, 3.2, 0xFFFDF4, lx, 2.3, lz); [1.4, 2.6].forEach(y => b.cyl(0.62, 0.66, 0.4, 0xD93A35, lx, y, lz, { line: 0.02 }));
  b.cyl(0.5, 0.5, 0.5, 0xFFE58A, lx, 4.15, lz, { line: 0.02 }); b.cone(0.65, 0.6, 0xD93A35, lx, 4.7, lz);
  const beam = new THREE.Mesh(new THREE.ConeGeometry(1.2, 7, 16, 1, true), new THREE.MeshBasicMaterial({ color: 0xFFF2B0, transparent: true, opacity: 0.18, side: THREE.DoubleSide, depthWrite: false }));
  beam.rotation.z = Math.PI / 2; beam.position.x = 3.5; const beamPivot = new THREE.Group(); beamPivot.position.set(lx, 4.15, lz); beamPivot.add(beam); w.add(beamPivot); onTick((t, dt) => { beamPivot.rotation.y += dt * 0.8; });
  const pz = -3.5, px = coast(pz); b.box(5, 0.2, 0.9, 0x9C6B45, px + 2.2, 0.45, pz, { line: 0.02 }); for (let k = 0; k < 5; k++) b.cyl(0.08, 0.08, 1.4, 0x6B4A33, px + 0.4 + k, -0.2, pz + 0.45, { line: 0 });
  const boats = [[px + 3.5, pz + 1.6, 0xEF5B4C], [px + 5.5, pz - 1.5, 0x4AA3DF], [px + 2, pz - 4, 0xFFC94A]].map(([x, z, c], i) => { const g = new THREE.Group(); g.position.set(x, 0.1, z); w.add(g); const bb = builder(g);
    bb.box(1.3, 0.35, 0.55, c, 0, 0.1, 0, { line: 0.02 }); bb.cyl(0.03, 0.03, 1.2, 0xFFFDF4, 0, 0.8, 0, { line: 0 });
    const sail = new THREE.Mesh(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0.35, 0.02), new THREE.Vector3(0, 1.35, 0.02), new THREE.Vector3(0.6, 0.4, 0.02)]), new THREE.MeshBasicMaterial({ color: 0xFFFDF4, side: THREE.DoubleSide })); g.add(sail);
    onTick(t => { g.position.y = 0.1 + Math.sin(t * 1.6 + i) * 0.06; g.rotation.z = Math.sin(t * 1.2 + i) * 0.08; g.rotation.x = Math.sin(t + i) * 0.05; }); return g; });
  // drifting clouds and wheeling gulls
  const cloudMat = toon(0xFFFFFF, { transparent: true, opacity: 0.92 });
  for (let i = 0; i < 9; i++) { const g = new THREE.Group(); g.position.set(-55 + rnd() * 95, 10 + rnd() * 3, -20 + rnd() * 40); w.add(g);
    for (let k = 0; k < 4; k++) { const m = new THREE.Mesh(new THREE.SphereGeometry(1.2 + rnd(), 10, 8), cloudMat); m.position.set(k * 1.3 - 2, rnd() * 0.5, rnd() * 0.8); m.scale.y = 0.6; g.add(m); }
    const sp = 0.4 + rnd() * 0.4; onTick((t, dt) => { g.position.x += sp * dt; if (g.position.x > 45) g.position.x = -60; }); }
  const gullMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
  for (let i = 0; i < 6; i++) { const g = new THREE.Group(); w.add(g); const wl = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.04, 0.12), gullMat), wr = wl.clone(); wl.position.x = -0.22; wr.position.x = 0.22; g.add(wl, wr);
    const cx = -18 + rnd() * 8, cz = -8 + rnd() * 16, r = 2 + rnd() * 3, ph = rnd() * 6, hy = 4 + rnd() * 2;
    onTick(t => { const a = t * 0.5 + ph; g.position.set(cx + Math.cos(a) * r, hy + Math.sin(t * 2 + ph) * 0.2, cz + Math.sin(a) * r); g.rotation.y = -a; const f = Math.sin(t * 8 + ph) * 0.5; wl.rotation.z = f; wr.rotation.z = -f; }); }
  // the cave hill on the coast (where the meadow is)
  const hill = b.rock(2.0, 0x8B8F9E, -14.0, 1.3, 12.2); hill.scale.set(1.2, 0.8, 0.9); b.ball(0.6, 0x1A1C2C, -14.4, 1.1, 10.8, { line: 0 }).scale.set(1, 0.9, 0.3);
  // the lost island
  land(2, 2, 4.5, 3.6, 1.0); const cliff = b.rock(2.2, 0x9A8C7A, 2.6, 1.8, 1.2); cliff.scale.set(1.2, 1.1, 1);
  for (let i = 0; i < 6; i++) tree(b, 0 + rnd() * 4, 2 + rnd() * 3, 0.5);
  // far places (still in fog)
  land(18, -11, 4, 2.6, 0.7, 0x9AA39A, 0x8C8C8C); for (let i = 0; i < 5; i++) tree(b, 16.5 + rnd() * 3, -12 + rnd() * 2, 0.45);
  land(27, 12, 3, 2.2, 0.7); [[16, 9], [19.5, 7], [17.5, 10.5]].forEach(([x, z]) => b.rock(0.9, 0x6E6A66, x, 0.4, z).scale.set(1, 1.6, 1));
  // ice field and sunken ship
  for (let i = 0; i < 7; i++) { const m = b.box(1.4 + rnd(), 0.2, 1 + rnd(), 0xDDF4FF, 9 + rnd() * 4, 0.1, -6 + rnd() * 3, { ry: rnd() * 3, line: 0.02 }); }
  b.box(2.6, 0.6, 0.9, 0x5A3A24, 7.5, -1.6, -2, { ry: 0.6, rz: 0.4, line: 0.03 }); b.cyl(0.06, 0.06, 2, 0x5A3A24, 7.5, -0.9, -2, { rz: 0.6, line: 0 });
  // the secret tunnel: a glowing line under the sea from the cave to the island
  const tunnelPts = [[-14.6, -0.4, 9.2], [-12, -1.6, 7.8], [-9, -1.6, 6.5], [-6, -1.9, 5], [-3.5, -1.6, 4], [-0.5, -0.8, 2.6], [1.2, 0.5, 2]].map(p => new THREE.Vector3(...p));
  const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(tunnelPts), 60, 0.32, 8), new THREE.MeshBasicMaterial({ color: 0x0E1020 })); w.add(tube);
  // route: dashes between stops, lit up to where she has reached
  const reached = Math.max(1, ...Object.keys(S.stops).filter(k => S.stops[k].done).map(k => +k + 1));
  const routePts = STOPS.map(s => new THREE.Vector3(s.p[0], s.p[1] + 0.25, s.p[2]));
  const curve = new THREE.CatmullRomCurve3(routePts, false, 'centripetal');
  const N = 140; for (let i = 0; i < N; i += 2) {
    const a = curve.getPoint(i / N), c = curve.getPoint((i + 1) / N); const seg = i / N * (STOPS.length - 1) + 1;
    const lit = seg < reached; const m = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, a.distanceTo(c), 6), new THREE.MeshBasicMaterial({ color: lit ? 0xFFC94A : 0xFFFFFF, transparent: true, opacity: lit ? 1 : 0.5 }));
    m.position.copy(a).lerp(c, 0.5); m.lookAt(c); m.rotateX(Math.PI / 2); w.add(m);
  }
  // fog over places not yet open
  const fogMat = toon(0xF4F7FB, { transparent: true, opacity: 0.8 });
  for (let i = 0; i < 40; i++) { const x = (MAX_EP >= 5 ? 16.5 : MAX_EP >= 4 ? 10.5 : 3.5) + rnd() * (MAX_EP >= 5 ? 16 : MAX_EP >= 4 ? 22 : 28), z = -15 + rnd() * 30; const m = new THREE.Mesh(new THREE.SphereGeometry(1.0 + rnd() * 1.3, 10, 8), fogMat); m.position.set(x, 1.2 + rnd() * 1.2, z); m.scale.y = 0.55; w.add(m);
    const ph = rnd() * 6; onTick(t => { m.position.y = 1.4 + Math.sin(t * 0.4 + ph) * 0.25; }); }
  // markers
  const markers = [];
  STOPS.forEach(s => {
    const open = s.ep <= MAX_EP, done = S.stops[s.n] && S.stops[s.n].done, next = open && !done && s.n === reached;
    const g = new THREE.Group(); g.position.set(s.p[0], s.p[1], s.p[2]); w.add(g); const mb = builder(g);
    if (!open) { if (s.p[0] < 4) { mb.cyl(0.35, 0.35, 0.1, 0x9AA0AE, 0, 0.3, 0); } markers.push(null); return; }
    mb.cyl(0.06, 0.06, 2, 0xFFFDF4, 0, 1, 0, { line: 0.015 });
    const disc = mb.cyl(0.62, 0.62, 0.14, done ? 0xFFC94A : next ? 0xEF5B4C : 0xFFFDF4, 0, 2.3, 0, { rx: Math.PI / 2, line: 0.03, seg: 24 });
    const num = textPlane(String(s.n), 1.2, { w: 160, h: 160, font: '120px Chewy, sans-serif', fg: done || next ? '#fff' : '#2E2A4F' }); num.position.set(0, 2.3, 0.09); g.add(num);
    const back = num.clone(); back.position.z = -0.09; back.rotation.y = Math.PI; g.add(back);
    if (S.captain && S.captain[s.n]) { const an = textPlane('⚓', 0.8, { w: 128, h: 128, font: '100px sans-serif', fg: '#2E2A4F' }); an.position.set(-0.55, 2.9, 0.1); g.add(an); }
    if (S.stars[s.n]) { const st = textPlane('★', 0.7, { w: 128, h: 128, font: '110px sans-serif', fg: '#FFC94A' }); st.position.set(0.55, 2.9, 0.1); g.add(st); }
    if (next) { const gem = mb.add(new THREE.OctahedronGeometry(0.3), toon(0x5AD1FF, { emissive: 0x2AA8E8, emissiveIntensity: 0.6 }), 0, 3.3, 0, { line: 0.02 }); onTick(t => { gem.rotation.y = t * 2; gem.position.y = 3.3 + Math.sin(t * 3) * 0.15; }); }
    onTick(() => { g.rotation.y = Math.atan2(camPos().x - g.position.x, camPos().z - g.position.z); });
    g.userData.stop = s; markers.push(g);
  });
  const qm = textPlane('?', 2, { w: 160, h: 160, font: '130px Chewy, sans-serif', fg: '#FFFDF4' }); qm.position.set(31, 3.2, 6); w.add(qm); onTick(t => { qm.position.y = 3.2 + Math.sin(t) * 0.3; });
  return { markers: markers.filter(Boolean), reached };
}
let camRef = null; const camPos = () => camRef.position; export const setCamRef = c => camRef = c;

// ================================================================ stop 1: the meadow
export function buildMeadow() {
  const w = newWorld({ sky: 0x9FD8F5, ambientI: 1.7, sunI: 1.7, fog: [0x9FD8F5, 40, 90] }); const b = builder(w);
  const ground = new THREE.Mesh(new THREE.CircleGeometry(60, 40), toon(0x8CC95E)); ground.rotation.x = -Math.PI / 2; w.add(ground);
  const sun = new THREE.Mesh(new THREE.SphereGeometry(3, 20, 12), new THREE.MeshBasicMaterial({ color: 0xFFE58A })); sun.position.set(-25, 22, -40); w.add(sun);
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(120, 30), toon(0x3FA7D6)); sea.rotation.x = -Math.PI / 2; sea.position.set(0, 0.02, -48); w.add(sea);
  ferris(b, -22, 0, -36, 1.6);
  for (let i = 0; i < 40; i++) { const a = rnd() * Math.PI * 2, r = 14 + rnd() * 20; if (Math.sin(a) < -0.5 && Math.abs(Math.cos(a)) < 0.4) continue; tree(b, Math.cos(a) * r, Math.sin(a) * r, 0.8 + rnd() * 0.6); }
  const flowerC = [0xFFFFFF, 0xFFC94A, 0xF06292, 0xB57EDC];
  for (let i = 0; i < 70; i++) { const x = -14 + rnd() * 28, z = -6 + rnd() * 16; b.ball(0.08, flowerC[i % 4], x, 0.1, z, { line: 0 }); }
  for (let i = 0; i < 90; i++) { const x = -16 + rnd() * 32, z = -8 + rnd() * 18; b.cone(0.07, 0.35, 0x5DAA4A, x, 0.17, z, { line: 0, seg: 4 }); }
  // the hill and the cave mouth
  const hill = b.rock(6.5, 0x8B8F9E, 0, 2.2, -14, { line: 0.06 }); hill.scale.set(1.4, 0.9, 0.8);
  b.rock(2.4, 0x7C8090, -6.5, 1, -11.5); b.rock(1.8, 0x9A9EAC, 6, 0.7, -11);
  // a real opening: a dark tunnel going back into the hill, framed by rocks
  const mouth = new THREE.Group(); mouth.position.set(0, 0, -8.4); w.add(mouth);
  const gc = document.createElement('canvas'); gc.width = gc.height = 256; const gx = gc.getContext('2d');
  const gr = gx.createRadialGradient(128, 256, 10, 128, 256, 250); gr.addColorStop(0, '#000000'); gr.addColorStop(0.55, '#07080E'); gr.addColorStop(1, '#2A2D3A'); gx.fillStyle = gr; gx.fillRect(0, 0, 256, 256);
  const gt = new THREE.CanvasTexture(gc); gt.colorSpace = THREE.SRGBColorSpace;
  const door = new THREE.Mesh(new THREE.CircleGeometry(2.05, 28, 0, Math.PI), new THREE.MeshBasicMaterial({ map: gt })); door.scale.y = 1.15; door.position.z = 0.01; mouth.add(door);
  const face = new THREE.Mesh(new THREE.RingGeometry(2.0, 4.6, 24, 1, 0, Math.PI), toon(0x8B8F9E)); face.scale.y = 1.15; face.position.z = 0.02; mouth.add(face); outline(face, 0.03);
  // pond and bush (where the other tracks go)
  const pond = new THREE.Mesh(new THREE.CircleGeometry(2.2, 24), toon(0x5BB8E8)); pond.rotation.x = -Math.PI / 2; pond.position.set(-9, 0.03, -2); pond.scale.set(1.3, 1, 1); w.add(pond);
  [[9, -3.5], [10.2, -2.8], [8.6, -2.2]].forEach(([x, z], i) => b.ball(1.1 - i * 0.15, 0x4FA35A, x, 0.8, z));
  // three trails of paw prints, all starting near the kids
  const trail = (to, size, color, n, wob) => {
    const g = new THREE.Group(); w.add(g); const from = new THREE.Vector3(0, 0, 3), end = new THREE.Vector3(...to);
    for (let i = 1; i <= n; i++) { const k = i / (n + 1), p = from.clone().lerp(end, k); p.x += Math.sin(i * 1.3) * wob;
      const side = i % 2 ? 1 : -1, dir = Math.atan2(end.x - from.x, end.z - from.z);
      const pad = new THREE.Mesh(new THREE.CircleGeometry(size, 12), new THREE.MeshBasicMaterial({ color })); pad.rotation.x = -Math.PI / 2; pad.scale.set(0.8, 1, 1);
      pad.position.set(p.x + Math.cos(dir) * side * size * 1.4, 0.04, p.z - Math.sin(dir) * side * size * 1.4); g.add(pad);
      [-1, 0, 1].forEach(t => { const toe = new THREE.Mesh(new THREE.CircleGeometry(size * 0.38, 8), pad.material); toe.rotation.x = -Math.PI / 2;
        toe.position.set(pad.position.x + Math.sin(dir) * size * 1.15 + Math.cos(dir) * t * size * 0.6, 0.04, pad.position.z + Math.cos(dir) * size * 1.15 - Math.sin(dir) * t * size * 0.6); g.add(toe); }); }
    // invisible wide hit area along the trail
    const len = from.distanceTo(end); const hit = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.3, len), new THREE.MeshBasicMaterial({ visible: false }));
    hit.position.copy(from).lerp(end, 0.5); hit.lookAt(end.x, 0, end.z); g.add(hit); g.userData.hit = hit; return g;
  };
  const trails = { fox: trail([-8.5, 0, -1], 0.17, 0x6B5A3A, 9, 0.4), toby: trail([0, 0, -8.6], 0.12, 0x5A4630, 12, 0.6), bigdog: trail([8.2, 0, -1.6], 0.27, 0x55452E, 8, 0.3) };
  const cast = makeCast(w);
  cast.leo.g.position.set(-1.2, 0, 5); cast.mia.g.position.set(1.2, 0, 5.2); cast.toby.g.position.set(0.2, 0, 3.6);
  // letters on the stones around the cave mouth (for spelling "enter")
  const stones = [];
  [[-2.9, 0.5], [-2.6, 1.7], [-1.8, 2.6], [-0.6, 3.0], [0.7, 3.0], [1.9, 2.6], [2.7, 1.7], [2.95, 0.5]].forEach(([x, y]) => { const s = b.rock(0.5, 0xA7ABB8, x, y, -8.2, { line: 0.03 }); s.scale.z = 0.5; stones.push(s); });
  return { w, cast, trails, stones, mouth };
}

// ================================================================ stop 2: the glowing stone chamber
export function buildChamber() {
  const w = newWorld({ sky: 0x06070D, ambient: 0x8090C0, ambientI: 0.25, sunI: 0.0 }); const b = builder(w);
  const shell = new THREE.Mesh(new THREE.SphereGeometry(14, 24, 16), toon(0x3A3F55, { side: THREE.BackSide })); shell.scale.set(1.2, 0.55, 1); shell.position.y = 2; w.add(shell);
  const floorG = new THREE.Group(); w.add(floorG); const fb = builder(floorG);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(13, 30), toon(0x4A4F63)); floor.rotation.x = -Math.PI / 2; floorG.add(floor);
  for (let i = 0; i < 26; i++) { const a = rnd() * Math.PI * 2, r = 8.5 + rnd() * 4; fb.rock(0.4 + rnd() * 0.8, 0x565B70, Math.cos(a) * r, 0.2, Math.sin(a) * r); }
  // stalactites hanging from the roof (some can break off)
  const stal = []; for (let i = 0; i < 22; i++) { const a = rnd() * Math.PI * 2, r = 2 + rnd() * 9; const h2 = 1.2 + rnd() * 1.8; const st = b.cone(0.22 + rnd() * 0.25, h2, 0x4A4F63, Math.cos(a) * r, 7.3 - h2 / 2 + 0.4, Math.sin(a) * r, { rx: Math.PI }); st.userData.h = h2; stal.push(st); }
  // the stone on its rock
  const ped = fb.rock(0.9, 0x5B6075, 0, 0.5, -5); ped.scale.set(1.2, 0.7, 1);
  const gem = fb.add(new THREE.OctahedronGeometry(0.42), toon(0x5AD1FF, { emissive: 0x2AA8E8, emissiveIntensity: 0.9 }), 0, 1.45, -5, { line: 0.02 }); gem.scale.y = 1.6;
  const gemLight = new THREE.PointLight(0x5AD1FF, 0, 14, 1.5); gemLight.position.set(0, 1.8, -5); w.add(gemLight);
  onTick(t => { gem.rotation.y = t; });
  // flashlight (follows her finger)
  const spot = new THREE.SpotLight(0xFFF2CC, 60, 30, 0.32, 0.5, 1.2); spot.position.set(0, 3, 8); w.add(spot); w.add(spot.target);
  // one curved track from the cart to the dark tunnel in the wall
  const track = new THREE.CatmullRomCurve3([[2.2, 0, 2.2], [3.2, 0, -0.4], [4.4, 0, -3.4], [5.8, 0, -6.6], [6.9, 0, -9.6], [7.5, 0, -12.6]].map(p => new THREE.Vector3(...p)));
  const up = new THREE.Vector3(0, 1, 0), tf = t => { const p = track.getPointAt(t), tg = track.getTangentAt(t), side = new THREE.Vector3().crossVectors(tg, up).normalize(); return { p, tg, side }; };
  const railMat = toon(0x8E9099);
  [-0.38, 0.38].forEach(o => { const rp = []; for (let i = 0; i <= 60; i++) { const { p, side } = tf(i / 60); rp.push(p.clone().addScaledVector(side, o).setY(0.1)); } floorG.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rp), 120, 0.045, 5), railMat)); });
  for (let i = 0; i <= 26; i++) { const { p, tg } = tf(i / 26); const tie = fb.box(1.4, 0.06, 0.2, 0x5A3A24, p.x, 0.04, p.z, { line: 0 }); tie.rotation.y = Math.atan2(tg.x, tg.z); }
  const theCart = cart(builder(floorG), 0, 0, 0);
  const placeCart = t => { const { p, tg } = tf(t); theCart.position.set(p.x, 0.02, p.z); theCart.rotation.y = Math.atan2(tg.x, tg.z); };
  placeCart(0.1);
  // the tunnel mouth where the track ends
  const end = tf(1); const tm = new THREE.Group(); tm.position.copy(end.p); tm.rotation.y = Math.atan2(end.tg.x, end.tg.z) + Math.PI; floorG.add(tm);
  const tdark = new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.DoubleSide });
  const tun = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, 5, 16, 1, true, -Math.PI / 2, Math.PI), tdark); tun.rotation.x = Math.PI / 2; tun.position.z = -2.4; tm.add(tun);
  const tback = new THREE.Mesh(new THREE.CircleGeometry(1.8, 16, 0, Math.PI), tdark); tback.position.z = -4.8; tm.add(tback);
  const tface = new THREE.Mesh(new THREE.RingGeometry(1.8, 4.5, 20, 1, 0, Math.PI), toon(0x3A3F55, { side: THREE.DoubleSide })); tm.add(tface);
  // glowing cracks that will spread from the stone's rock across the floor
  const crackMat = new THREE.MeshBasicMaterial({ color: 0x8FE9FF }); const cracks = [];
  const crack = (ang, len, from = new THREE.Vector3(0, 0, -5)) => { let p = from.clone(), a = ang; const segs = [];
    for (let i = 0; i < len; i++) { a += (rnd() - 0.5) * 0.9; const l = 0.5 + rnd() * 0.5; const q = p.clone().add(new THREE.Vector3(Math.sin(a) * l, 0, Math.cos(a) * l));
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.02, l), crackMat); m.position.copy(p).lerp(q, 0.5).setY(0.03); m.rotation.y = a; m.scale.z = 0.001; floorG.add(m); segs.push(m); p = q; }
    cracks.push(segs); };
  [0.4, 0.9, 1.6, 2.4, -0.4, -1.1, 3.0, 1.2].forEach((a, i) => crack(a, 6 + (i % 3) * 3));
  const cast = makeCast(floorG);
  cast.leo.g.position.set(-1, 0, 6); cast.mia.g.position.set(1, 0, 6.2); cast.toby.g.position.set(0.9, 0, -4.6); cast.toby.pose('sit'); cast.toby.g.rotation.y = -0.5;
  // loose rocks in the roof (they carry letters later)
  const loose = []; [[-0.4, 3.9, -2.4], [0.9, 4.3, -3.0], [2.2, 3.8, -2.2], [3.4, 4.2, -2.8], [1.5, 3.5, -1.4], [-1.5, 4.1, -2.9]].forEach(([x, y, z]) => { const r = b.rock(0.45, 0x6B7086, x, y, z, { line: 0.03 }); loose.push(r); });
  // words hidden on the cave walls: only seen in the flashlight beam
  const words = [];
  const place = (text, x, y, z) => { const m = textPlane(text, 2.4, { w: 512, h: 150, font: '82px Chewy, sans-serif', fg: '#BFF3FF', glow: '#5AD1FF' }); m.position.set(x, y, z); m.lookAt(0, y, 0); m.material.opacity = 0; m.userData.word = text; w.add(m); words.push(m); return m; };
  // real falling rocks: gravity, a bounce, dust
  const drop = (x, z, size = 0.35, y = 6.8, onHit) => {
    const r = b.rock(size, 0x5E6377, x, y, z, { line: 0.025 }); const v = new THREE.Vector3((rnd() - 0.5) * 0.6, 0, (rnd() - 0.5) * 0.6); let hits = 0;
    const off = onTick((t, dt) => { v.y -= 22 * dt; r.position.addScaledVector(v, dt); r.rotation.x += dt * 4; r.rotation.z += dt * 3;
      const floorY = size * 0.8 + floorTilt(r.position);
      if (r.position.y < floorY) { r.position.y = floorY; if (hits === 0 && onHit) onHit(r); hits++; v.y = -v.y * 0.3; v.x *= 0.6; v.z *= 0.6; if (hits > 2) { off(); } } });
    return r;
  };
  const floorTilt = p => { const n = new THREE.Vector3(0, 1, 0).applyEuler(floorG.rotation); return -(n.x * p.x + n.z * p.z) / n.y; };
  return { w, cast, gem, gemLight, spot, floorG, cart: theCart, placeCart, words, place, shell, cracks, stal, loose, drop };
}

// ================================================================ stop 3: the tunnel ride
export function buildTunnel() {
  const w = newWorld({ sky: 0x05060B, ambient: 0x9AA5C8, ambientI: 0.55, sunI: 0.25, fog: [0x05060B, 8, 34] }); const b = builder(w);
  const pts = []; for (let i = 0; i <= 14; i++) pts.push(new THREE.Vector3(Math.sin(i * 0.7) * 6, -i * 2.6 - (i > 10 ? (i - 10) * 1.2 : 0), -i * 9));
  const path = new THREE.CatmullRomCurve3(pts);
  const tube = new THREE.Mesh(new THREE.TubeGeometry(path, 240, 3.2, 14), toon(0x2E3245, { side: THREE.BackSide })); w.add(tube);
  // rails + ties
  const L = path.getLength(), up = new THREE.Vector3(0, 1, 0);
  const frame = s => { const p = path.getPointAt(s), t = path.getTangentAt(s), side = new THREE.Vector3().crossVectors(t, up).normalize(); return { p, t, side }; };
  const railMat = toon(0x8E9099), tieMat = toon(0x5A3A24);
  for (let d = 0; d < L * 0.985; d += 0.9) { const { p, t } = frame(d / L); const tie = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.1, 0.22), tieMat); tie.position.copy(p).y -= 2.6; tie.lookAt(p.clone().add(t).setY(p.y - 2.6 + t.y)); w.add(tie); }
  [-0.38, 0.38].forEach(o => { const rp = []; for (let i = 0; i <= 200; i++) { const s = i / 200 * 0.985; const { p, side } = frame(s); rp.push(p.clone().addScaledVector(side, o).setY(p.y - 2.45)); }
    w.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rp), 300, 0.05, 5), railMat)); });
  // lanterns
  for (let s = 0.04; s < 0.95; s += 0.08) { const { p, side } = frame(s); const lp = p.clone().addScaledVector(side, 2.4).setY(p.y + 0.6); b.ball(0.16, new THREE.MeshBasicMaterial({ color: 0xFFC46B }), lp.x, lp.y, lp.z, { line: 0.02 }); const l = new THREE.PointLight(0xFFB04A, 6, 9, 1.6); l.position.copy(lp); w.add(l); }
  // junctions: a side branch with a sign over each way
  const junctions = [0.22, 0.47, 0.72].map(s => {
    const { p, t, side } = frame(s); const g = new THREE.Group(); w.add(g);
    const signs = [-1, 1].map(sd => { const sp = p.clone().addScaledVector(side, sd * 2.0).addScaledVector(t, 2.6).setY(p.y - 1.0);
      const board = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.95, 0.08), toon(0xC9A46A)); board.position.copy(sp); board.lookAt(sp.clone().sub(t)); outline(board, 0.03); g.add(board);
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.2), toon(0x5A3A24)); post.position.copy(sp).y -= 1.05; g.add(post);
      return board; });
    // the branch rails that peel away
    const bp = []; for (let i = 0; i <= 20; i++) { const k = i / 20; const { p: q, side: sd2 } = frame(Math.min(0.985, s + k * 0.05)); bp.push(q.clone().addScaledVector(sd2, k * k * 4).setY(q.y - 2.45)); }
    const branch = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(bp), 40, 0.05, 5), railMat); g.add(branch);
    return { s, signs, g, side };
  });
  // the end: the tracks stop at a giant black hole
  const { p: endP, t: endT } = frame(0.985);
  const hole = new THREE.Mesh(new THREE.CircleGeometry(3.4, 30), new THREE.MeshBasicMaterial({ color: 0x000000 })); hole.rotation.x = -Math.PI / 2; hole.position.copy(endP).addScaledVector(endT, 4.5).setY(endP.y - 2.58); w.add(hole);
  const rim = new THREE.Mesh(new THREE.RingGeometry(3.3, 3.9, 30), toon(0x232634)); rim.rotation.x = -Math.PI / 2; rim.position.copy(hole.position).y += 0.01; w.add(rim);
  // the cart with Mia and Toby inside
  const rider = new THREE.Group(); w.add(rider); const theCart = cart(builder(rider), 0, 0, 0);
  const cast = makeCast(rider); cast.leo.g.visible = false;
  cast.mia.g.position.set(0, 0.45, 0.1); cast.mia.pose('hold'); cast.mia.L.rotation.x = cast.mia.R.rotation.x = -1.4;
  cast.toby.g.position.set(0, 0.85, 0.45); cast.toby.g.scale.setScalar(0.9);
  const placeAt = (s, extraSide = 0) => { const { p, t, side } = frame(Math.min(s, 0.985)); rider.position.copy(p).addScaledVector(side, extraSide).setY(p.y - 2.5); rider.lookAt(rider.position.clone().add(t)); };
  placeAt(0);
  return { w, path, frame, junctions, rider, placeAt, cast, hole, L };
}
