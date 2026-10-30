// The places. Each build function makes a fresh world and returns handles the story script uses.
import { THREE, builder, toon, outline, newWorld, onTick, textPlane, textTexture, INK } from './gfx.js';
import { makeCast } from './chars.js';

const rnd = (s => () => (s = (s * 16807) % 2147483647) / 2147483647)(7);
function tree(b, x, z, s = 1) { b.cyl(0.12 * s, 0.16 * s, 1 * s, 0x7A5236, x, 0.5 * s, z); b.cone(0.7 * s, 1.5 * s, 0x4FA35A, x, 1.6 * s, z); b.cone(0.55 * s, 1.1 * s, 0x5DBB66, x, 2.2 * s, z); }
function ferris(b, x, y, z, s = 1) {
  const g = new THREE.Group(); g.position.set(x, y, z); g.scale.setScalar(s); b.group.add(g); const fb = builder(g);
  fb.box(0.12, 3, 0.12, 0xFFFDF4, -0.7, 1.4, 0, { rz: -0.25 }); fb.box(0.12, 3, 0.12, 0xFFFDF4, 0.7, 1.4, 0, { rz: 0.25 });
  const w = new THREE.Group(); w.position.y = 2.9; g.add(w); const wb = builder(w);
  wb.torus(1.8, 0.07, 0xFFFDF4, 0, 0, 0, { seg: 36 });
  [0xEF5B4C, 0xFFC94A, 0x4AA3DF, 0x5DBB4A, 0xB57EDC, 0xF28C38].forEach((c, i) => { const a = i / 6 * Math.PI * 2; wb.box(0.04, 1.8, 0.04, 0xFFFDF4, Math.cos(a) * 0.9, Math.sin(a) * 0.9, 0, { rz: a + Math.PI / 2, line: 0 }); wb.box(0.36, 0.3, 0.3, c, Math.cos(a) * 1.8, Math.sin(a) * 1.8, 0, { line: 0.02 }); });
  onTick((t, dt) => { w.rotation.z += dt * 0.3; });
  return g;
}
function cart(b, x, y, z) {
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
  { n: 3, name: 'The Dark Tunnel', ep: 1, p: [-9, -1.6, 6.5] },
  { n: 4, name: 'Crystal Loop', ep: 2, p: [-3.5, -1.6, 4] },
  { n: 5, name: "Leo's Side", ep: 3, p: [-6.5, -1.6, 0.5] },
  { n: 6, name: 'The Lost Island', ep: 4, p: [2, 1.6, 2] },
  { n: 7, name: 'The Ice', ep: 5, p: [10, 0.3, -5] },
  { n: 8, name: 'The Gray Shore', ep: 6, p: [18, 0.6, -11] },
  { n: 9, name: 'Out of the Fog', ep: 7, p: [23, 0.3, -2] },
  { n: 10, name: 'The Chase', ep: 8, p: [18, 0.3, 8] },
  { n: 11, name: "Varn's Story", ep: 9, p: [27, 0.6, 12] },
];
export function buildMap(S, onPick) {
  const w = newWorld({ sky: 0xBFE6F7, ambientI: 1.5, sunI: 1.5, fog: [0xBFE6F7, 70, 140] }); const b = builder(w);
  // sea with a dark seabed under it, so the secret tunnel shows through the water
  const seabed = new THREE.Mesh(new THREE.PlaneGeometry(160, 120), toon(0x1F4E6B)); seabed.rotation.x = -Math.PI / 2; seabed.position.y = -3.2; w.add(seabed);
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(160, 120, 40, 30), toon(0x3FA7D6, { transparent: true, opacity: 0.72 })); sea.rotation.x = -Math.PI / 2; w.add(sea);
  const pos = sea.geometry.attributes.position; onTick(t => { for (let i = 0; i < pos.count; i++) pos.setZ(i, Math.sin(pos.getX(i) * 0.3 + t) * 0.08 + Math.cos(pos.getY(i) * 0.4 + t * 0.8) * 0.06); pos.needsUpdate = true; });
  const land = (x, z, rx, rz, h, c = 0x8CC95E, side = 0xC9A46A) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(1, 1.15, h, 28), [toon(side), toon(c), toon(side)]); m.scale.set(rx, 1, rz); m.position.set(x, h / 2 - 0.3, z); outline(m, 0.05); w.add(m); return m; };
  // hometown coast
  land(-24, 2, 9, 13, 1.0); land(-15.5, 9.6, 3.8, 3.8, 1.0);
  ferris(b, -24, 0.7, -2, 0.75);
  [[-27, 5, 0xEF5B4C], [-25.5, 7.5, 0x4AA3DF], [-21.5, 4.5, 0xFFC94A], [-27.5, -6, 0xB57EDC], [-21, -7, 0x5DBB4A], [-28, 1, 0xF28C38]].forEach(([x, z, c]) => { b.box(1.2, 1, 1.2, 0xFFF4D6, x, 1.2, z); const r = b.cone(1.0, 0.8, c, x, 2.1, z, { seg: 4, ry: Math.PI / 4 }); });
  for (let i = 0; i < 14; i++) tree(b, -30 + rnd() * 12, -10 + rnd() * 20, 0.6);
  // the cave hill in the meadow
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
  for (let i = 0; i < 44; i++) { const x = 0 + rnd() * 31, z = -15 + rnd() * 30; const m = new THREE.Mesh(new THREE.SphereGeometry(1.0 + rnd() * 1.3, 10, 8), fogMat); m.position.set(x, 1.2 + rnd() * 1.2, z); m.scale.y = 0.55; w.add(m);
    const ph = rnd() * 6; onTick(t => { m.position.y = 1.4 + Math.sin(t * 0.4 + ph) * 0.25; }); }
  // markers
  const markers = [];
  STOPS.forEach(s => {
    const open = s.ep <= 1, done = S.stops[s.n] && S.stops[s.n].done, next = open && !done && s.n === reached;
    const g = new THREE.Group(); g.position.set(s.p[0], s.p[1], s.p[2]); w.add(g); const mb = builder(g);
    if (!open) { if (s.p[0] < 4) { mb.cyl(0.35, 0.35, 0.1, 0x9AA0AE, 0, 0.3, 0); } markers.push(null); return; }
    mb.cyl(0.06, 0.06, 2, 0xFFFDF4, 0, 1, 0, { line: 0.015 });
    const disc = mb.cyl(0.62, 0.62, 0.14, done ? 0xFFC94A : next ? 0xEF5B4C : 0xFFFDF4, 0, 2.3, 0, { rx: Math.PI / 2, line: 0.03, seg: 24 });
    const num = textPlane(String(s.n), 1.2, { w: 160, h: 160, font: '120px Chewy, sans-serif', fg: done || next ? '#fff' : '#2E2A4F' }); num.position.set(0, 2.3, 0.09); g.add(num);
    const back = num.clone(); back.position.z = -0.09; back.rotation.y = Math.PI; g.add(back);
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
  const mouth = new THREE.Mesh(new THREE.CircleGeometry(2.2, 24, 0, Math.PI), new THREE.MeshBasicMaterial({ color: 0x14151F })); mouth.position.set(0, 0.02, -9.25); mouth.scale.set(1, 1.15, 1); w.add(mouth);
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
  [[-3.6, 1.2], [-2.6, 2.6], [-1.2, 3.3], [0.3, 3.5], [1.8, 3.1], [3.0, 2.2], [3.8, 0.9]].forEach(([x, y]) => { const s = b.rock(0.55, 0xA7ABB8, x, y, -9.1, { line: 0.03 }); s.scale.z = 0.5; stones.push(s); });
  return { w, cast, trails, stones, mouth };
}

// ================================================================ stop 2: the glowing stone chamber
export function buildChamber() {
  const w = newWorld({ sky: 0x06070D, ambient: 0x8090C0, ambientI: 0.25, sunI: 0.0 }); const b = builder(w);
  const shell = new THREE.Mesh(new THREE.SphereGeometry(14, 22, 14), toon(0x3A3F55, { side: THREE.BackSide })); shell.scale.set(1.2, 0.55, 1); shell.position.y = 2; w.add(shell);
  const floorG = new THREE.Group(); w.add(floorG); const fb = builder(floorG);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(13, 30), toon(0x4A4F63)); floor.rotation.x = -Math.PI / 2; floorG.add(floor);
  for (let i = 0; i < 26; i++) { const a = rnd() * Math.PI * 2, r = 7 + rnd() * 5; fb.rock(0.4 + rnd() * 0.8, 0x565B70, Math.cos(a) * r, 0.2, Math.sin(a) * r); }
  for (let i = 0; i < 18; i++) { const a = rnd() * Math.PI * 2, r = 3 + rnd() * 9; const st = b.cone(0.25 + rnd() * 0.3, 1.5 + rnd() * 2, 0x4A4F63, Math.cos(a) * r, 7.4, Math.sin(a) * r, { rx: Math.PI }); }
  // the stone on its rock
  const ped = fb.rock(0.9, 0x5B6075, 0, 0.5, -5); ped.scale.set(1.2, 0.7, 1);
  const gem = fb.add(new THREE.OctahedronGeometry(0.42), toon(0x5AD1FF, { emissive: 0x2AA8E8, emissiveIntensity: 0.9 }), 0, 1.45, -5, { line: 0.02 }); gem.scale.y = 1.6;
  const gemLight = new THREE.PointLight(0x5AD1FF, 0, 14, 1.5); gemLight.position.set(0, 1.8, -5); w.add(gemLight);
  onTick(t => { gem.rotation.y = t; });
  // flashlight (follows her finger)
  const spot = new THREE.SpotLight(0xFFF2CC, 60, 30, 0.32, 0.5, 1.2); spot.position.set(0, 3, 8); w.add(spot); w.add(spot.target);
  // rusty cart on rails by the tunnel
  const rails = builder(floorG); for (let i = 0; i < 9; i++) rails.box(1.6, 0.06, 0.18, 0x5A3A24, 4.2 + i * 0.25, 0.04, -1 - i * 0.9, { ry: 0.27, line: 0 });
  [-0.35, 0.35].forEach(o => rails.box(0.05, 0.06, 8.5, 0x77787E, 5.2 + o, 0.1, -4.6, { ry: 0.27, line: 0 }));
  const theCart = cart(builder(floorG), 4.4, 0, -1.6); theCart.rotation.y = 0.27 + Math.PI;
  const tunnelMouth = new THREE.Mesh(new THREE.CircleGeometry(2, 20), new THREE.MeshBasicMaterial({ color: 0x000000 })); tunnelMouth.position.set(7.3, 1.4, -9.6); tunnelMouth.rotation.y = -0.6; w.add(tunnelMouth);
  const cast = makeCast(floorG);
  cast.leo.g.position.set(-1, 0, 6); cast.mia.g.position.set(1, 0, 6.2); cast.toby.g.position.set(0.9, 0, -4.6); cast.toby.pose('sit'); cast.toby.g.rotation.y = -0.5;
  // words hidden on the cave walls: only seen in the flashlight beam
  const words = [];
  const place = (text, x, y, z) => { const m = textPlane(text, 2.4, { w: 512, h: 150, font: '82px Chewy, sans-serif', fg: '#BFF3FF', glow: '#5AD1FF' }); m.position.set(x, y, z); m.lookAt(0, y, 0); m.material.opacity = 0; m.userData.word = text; w.add(m); words.push(m); return m; };
  return { w, cast, gem, gemLight, spot, floorG, cart: theCart, words, place, shell };
}

// ================================================================ stop 3: the tunnel ride
export function buildTunnel() {
  const w = newWorld({ sky: 0x05060B, ambient: 0x9AA5C8, ambientI: 0.55, sunI: 0.25, fog: [0x05060B, 8, 34] }); const b = builder(w);
  const pts = []; for (let i = 0; i <= 14; i++) pts.push(new THREE.Vector3(Math.sin(i * 0.7) * 6, -i * 1.1, -i * 9));
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
