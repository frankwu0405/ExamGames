// Episode 2 places: the shaft (the drop), the green crystal room (the loop), the swift river and the beach.
// Built with the shared prop library: real rock texture, real holes where tracks go through walls, flowing toon water.
import { THREE, builder, toon, outline, newWorld, onTick, textPlane } from './gfx.js';
import { makeCast } from './chars.js';
import { cart } from './sets.js';
import { setSeed, rnd, rr, pick, nz, PAL, scatter, ground, water, rockMat, lumpy, mesh, crystalCluster, lantern, motes, shell as seaShell, starfish, cutHoles, rockTube, timber, caveMouth, WOOD, WOOD2 } from './props.js';
import { glowSprite } from './effects.js';

const GREEN = 0x4BE38A, GREENS = [0x4BE38A, 0x6FF0A6, 0x9FFFC8, 0x3CCB7A];
const GAUGE = 0.62;   // rails sit right under the cart's wheels
function rider(w) {   // the cart with Mia and Toby inside
  const g = new THREE.Group(); w.add(g); const c = cart(builder(g), 0, 0, 0);
  const cast = makeCast(g); cast.leo.g.visible = false;
  cast.mia.g.position.set(0, 0.45, 0.15); cast.mia.pose('hold'); cast.mia.L.rotation.x = cast.mia.R.rotation.x = -1.4;
  cast.toby.g.position.set(0, 0.85, 0.6); cast.toby.g.scale.setScalar(0.9);
  return { g, cast, cartMesh: c };
}
const gemOf = (parent, x, y, z, s = 0.2) => { const m = builder(parent).add(new THREE.OctahedronGeometry(s), toon(0x5AD1FF, { emissive: 0x2AA8E8, emissiveIntensity: 0.9 }), x, y, z, { line: 0.02 }); m.scale.y = 1.6; const sp = glowSprite(0x7FE9FF, 0.9, 0.5); sp.position.set(x, y, z); parent.add(sp); return m; };
// straight rails + sleepers between two z values (track running along z at height y, centred on x)
function straightRails(w, x, y, z0, z1, { tie = 0.9 } = {}) { const b = builder(w), L = Math.abs(z1 - z0), zc = (z0 + z1) / 2, rm = toon(0x9DA3B3, { emissive: 0x15171C });
  [-GAUGE, GAUGE].forEach(o => { const r = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.09, L), rm); r.position.set(x + o, y + 0.06, zc); r.castShadow = true; w.add(r); });
  let i = 0; for (let z = Math.min(z0, z1); z < Math.max(z0, z1); z += tie) b.rbox(GAUGE * 2 + 0.55, 0.1, 0.26, i++ % 3 ? WOOD : WOOD2, x, y - 0.01, z, { line: 0.012 }); }
// rails that follow a curve with a frame function ({p, r, u, f})
function curveRails(w, L, frame, { s0 = 0, s1 = 1 } = {}) { const rm = toon(0x9DA3B3, { emissive: 0x15171C }), tm = [toon(WOOD), toon(WOOD2)];
  [-GAUGE, GAUGE].forEach(o => { const rp = []; for (let i = 0; i <= 600; i++) { const { p, r, u } = frame(s0 + (s1 - s0) * i / 600); rp.push(p.clone().addScaledVector(r, o).addScaledVector(u, 0.12)); } w.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rp), 900, 0.05, 6), rm)); });
  let k = 0; for (let d = s0 * L; d < s1 * L; d += 0.9) { const { p, f, u } = frame(d / L); const t = new THREE.Mesh(new THREE.BoxGeometry(GAUGE * 2 + 0.55, 0.08, 0.24), tm[k++ % 3 ? 0 : 1]); t.position.copy(p).addScaledVector(u, 0.03); t.up.copy(u); t.lookAt(t.position.clone().add(f)); w.add(t); } }

// ================================================================ stop 4: the drop
export function buildShaft() {
  const w = newWorld({ sky: 0x04050A, ambient: 0x9AA5C8, ambientI: 0.8, sunI: 0.3, fog: [0x04050A, 8, 42] }); const b = builder(w); setSeed(41);
  const BOTTOM = -70, SR = 4.6;
  // the pit: a lumpy rock shaft with a real opening at the bottom, where the hidden track runs off into a tunnel
  const holeP = new THREE.Vector3(0, BOTTOM - 0.1, -SR + 0.2);
  const shM = cutHoles(rockMat(0x80869A, 0.2), [{ p: holeP, d: new THREE.Vector3(0, 0, -1), r: 2.0, depth: 2.5 }]); shM.side = THREE.BackSide;
  const sg = new THREE.CylinderGeometry(SR, SR, 94, 44, 80, true); { const p = sg.attributes.position, v = new THREE.Vector3(); for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const k = 1 + nz(v.x * 0.7 + v.y * 0.15, v.z * 0.7 - v.y * 0.1, 1) * 0.07 + nz(v.x * 2, v.y * 0.6 + v.z, 1) * 0.025; p.setXYZ(i, v.x * k, v.y, v.z * k); } sg.computeVertexNormals(); }
  const shaft = new THREE.Mesh(sg, shM); shaft.position.y = BOTTOM + 45; shaft.receiveShadow = true; w.add(shaft);
  // ledges and boulders sticking out of the walls (never on the camera's side, never over the opening)
  const lm = rockMat(0x8E92A4, 0.45); for (let i = 0; i < 46; i++) { const a = rnd() * Math.PI * 2, y = BOTTOM + 3 + rnd() * 78; if (Math.abs(((a - 0.9 + 9.42) % 6.28) - 3.14) > 2.5) continue; if (y < BOTTOM + 5 && Math.sin(a) < -0.6) continue;
    const s = rr(0.5, 1.2); mesh(w, lumpy(s, 2, 0.24, 0.6), lm, Math.cos(a) * (SR - s * 0.35), y, Math.sin(a) * (SR - s * 0.35), { ry: rnd() * 6, shadow: false }); }
  // glowing blue crystals growing out of the walls light the way down
  for (let y = BOTTOM + 6, k = 0; y < 8; y += 6.5, k++) { const a = 1.9 + k * 2.4, n = new THREE.Vector3(-Math.cos(a), 0.45, -Math.sin(a)).normalize();
    const cc = crystalCluster(w, Math.cos(a) * (SR - 0.2), y, Math.sin(a) * (SR - 0.2), { n: 4, size: 0.38, cols: PAL.crys, light: k % 2 === 0 }); cc.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), n); }
  // wind streaks rushing up past the cart
  const streakMat = new THREE.MeshBasicMaterial({ color: 0xDDE6FF, transparent: true, opacity: 0.35 });
  const streaks = Array.from({ length: 46 }, () => { const m = new THREE.Mesh(new THREE.BoxGeometry(0.03, 1.6, 0.03), streakMat); const a = rnd() * Math.PI * 2, r = 0.8 + rnd() * 2.8; m.position.set(Math.cos(a) * r, -rnd() * 20, Math.sin(a) * r); w.add(m); return m; });
  const R = rider(w); R.g.position.set(0, 0, 0);
  const wind = { speed: 0 };
  onTick((t, dt) => streaks.forEach(m => { m.position.y += wind.speed * dt * (1 + (m.id % 5) * 0.2); if (m.position.y > R.g.position.y + 12) m.position.y = R.g.position.y - 12 - Math.random() * 6; m.visible = wind.speed > 0.5; }));
  // the bottom: a rock floor with rubble round the edge (none on the track)
  const fl = new THREE.Mesh(new THREE.CircleGeometry(SR + 0.6, 40), rockMat(0x7C7F90, 0.3)); fl.rotation.x = -Math.PI / 2; fl.position.y = BOTTOM - 0.1; fl.receiveShadow = true; w.add(fl);
  for (let i = 0; i < 18; i++) { const a = rnd() * Math.PI * 2, r = rr(2.4, 4.1), x = Math.cos(a) * r, z = Math.sin(a) * r; if (Math.abs(x) < 1.6) continue; mesh(w, lumpy(rr(0.25, 0.6), 2, 0.25, 0.7), lm, x, BOTTOM + 0.05, z, { ry: rnd() * 6 }); }
  // the hidden track: from the middle of the pit floor, through the opening, down a long mine tunnel
  straightRails(w, 0, BOTTOM, 3, -64);
  const tcurve = new THREE.LineCurve3(new THREE.Vector3(0, BOTTOM, -SR + 1.0), new THREE.Vector3(0, BOTTOM, -66));
  rockTube(w, tcurve, { r: 2.5, lift: 1.25, tint: 0x8A8678, scale: 0.32, seg: 120 });
  timber(w, new THREE.Vector3(0, BOTTOM - 0.1, -SR + 0.4), new THREE.Vector3(0, 0, -1), { w: 3.5, h: 2.9 });
  for (let z = -10, k = 0; z > -62; z -= 6.5, k++) { timber(w, new THREE.Vector3(0, BOTTOM - 0.1, z), new THREE.Vector3(0, 0, -1), { w: 3.7, h: 3.0 }); lantern(w, k % 2 ? -1.55 : 1.55, BOTTOM + 2.1, z + 0.3, { light: k % 2 === 0 }); }
  motes(w, 90, [-2, BOTTOM + 0.3, -60], [2, BOTTOM + 3, -4], 0xFFE2B0, 0.05);
  // glowing pebbles that float beside the cart while it falls (they carry letters)
  const floaters = new THREE.Group(); w.add(floaters); const fls = [];
  const pm = toon(0xCFF6FF, { emissive: 0x3A9FE0, emissiveIntensity: 0.8 });
  for (let i = 0; i < 6; i++) { const a = -0.2 + i / 5 * (Math.PI + 0.4), r = 2.2; const m = builder(floaters).add(new THREE.OctahedronGeometry(0.36), pm, Math.cos(a) * r, 0.7 + (i % 2) * 0.9, -Math.sin(a) * r * 0.6 - 0.6, { line: 0.03 }); m.scale.y = 1.4; const sp = glowSprite(0x7FE9FF, 1.3, 0.5); m.add(sp); m.userData.base = m.position.clone(); fls.push(m); }
  onTick(t => { floaters.position.y = R.g.position.y; fls.forEach((m, i) => { m.position.y = m.userData.base.y + Math.sin(t * 1.5 + i) * 0.15; m.rotation.y = t + i; }); });
  floaters.visible = false;
  return { w, R, wind, BOTTOM, floaters, fl: fls };
}

// ================================================================ stop 5: the twisting tunnel, the green crystal room and the loop
export function buildCrystal() {
  const w = newWorld({ sky: 0x06110D, ambient: 0xD6F2E2, ambientI: 0.7, sunI: 0.3, fog: [0x06110D, 22, 70] }); const b = builder(w); setSeed(53);
  // the room: a big rock dome, and the track: a twisting tunnel in, a giant vertical loop, a tunnel out
  const RC = new THREE.Vector3(0, 2, -14), RX = 19, RY = 15, RZ = 23;
  const inRoom = p => ((p.x - RC.x) / RX) ** 2 + ((p.y - RC.y) / RY) ** 2 + ((p.z - RC.z) / RZ) ** 2;
  const Zc = -17, LR = 6;
  const pts = [[0, 0, 47], [0, 0, 41], [-4, 0, 34], [-5, 0, 29], [2.5, 0, 23], [5, 0, 18], [-1, 0, 13], [-1.5, 0, 8], [0, 0, 1], [0, 0, -6], [0, 0, -10], [0, 0, Zc + 3]];
  const loopStart = pts.length;
  for (let k = 0; k <= 18; k++) { const th = k / 18 * Math.PI * 2; pts.push([2.4 * k / 18, LR - LR * Math.cos(th), Zc - LR * Math.sin(th)]); }
  const loopEnd = pts.length - 1;
  pts.push([2.4, 0, Zc - 4], [2.4, 0, Zc - 10], [2.4, 0, -33], [2.4, -0.4, -38], [2.4, -1.4, -44], [2.4, -2.8, -50]);
  const path = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p)), false, 'centripetal', 0.5);
  const L = path.getLength();
  const near = q => { let best = 0, bd = 1e9; for (let i = 0; i <= 800; i++) { const d = path.getPointAt(i / 800).distanceTo(q); if (d < bd) { bd = d; best = i / 800; } } return best; };
  const sA = near(new THREE.Vector3(...pts[loopStart])), sB = near(new THREE.Vector3(...pts[loopEnd]));
  const center = s => new THREE.Vector3(path.getPointAt(s).x, LR, Zc);
  const frame = s => {
    const p = path.getPointAt(s), f = path.getTangentAt(s);
    let up = new THREE.Vector3(0, 1, 0);
    if (s > sA + 0.004 && s < sB - 0.004) up = center(s).sub(p).normalize();
    const r = new THREE.Vector3().crossVectors(up, f).normalize(); const u = new THREE.Vector3().crossVectors(f, r).normalize();
    return { p, f, r, u };
  };
  // where the track goes through the room wall (in and out)
  let sIn = 0, sOut = 1; for (let i = 0; i <= 800; i++) { const v = inRoom(path.getPointAt(i / 800)); if (v < 1 && !sIn) sIn = i / 800; if (i / 800 > 0.6 && v > 1 && sOut === 1) sOut = i / 800; }
  const holeAt = s => ({ p: path.getPointAt(s).clone().setY(-0.6), d: path.getTangentAt(s).setY(0).normalize(), r: 2.5, depth: 3 });
  const shM = cutHoles(rockMat(0x4E6A60, 0.14), [holeAt(sIn), holeAt(sOut)]); shM.side = THREE.BackSide;
  const sg = new THREE.SphereGeometry(1, 64, 40); { const p = sg.attributes.position, v = new THREE.Vector3(); for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const k = 1 + nz(v.x * 3, v.z * 3 + v.y * 2, 1) * 0.035 + nz(v.x * 7, v.y * 6, 1) * 0.012; p.setXYZ(i, v.x * k * RX, v.y * k * RY, v.z * k * RZ); } sg.computeVertexNormals(); }
  const room = new THREE.Mesh(sg, shM); room.position.copy(RC); room.receiveShadow = true; w.add(room);
  const hf = (x, z) => -0.6 + nz(x, z, 0.35) * 0.12;
  ground(w, 46, 80, (x, z) => hf(x, z - 14), (x, z, c) => { const n = nz(x, z, 0.5); c.setHSL(0.42, 0.22, 0.2 + n * 0.03); }, rockMat(0x5E7A6E, 0.25)).position.z = -14;
  // tunnels: in (the twisting part), and out (down into the dark)
  rockTube(w, path, { s0: 0, s1: sIn + 0.012, r: 2.7, lift: 1.25, tint: 0x5E7068, scale: 0.3, seg: 220, floor: 0.6 });
  rockTube(w, path, { s0: sOut - 0.012, s1: 1, r: 2.7, lift: 1.25, tint: 0x5E7068, scale: 0.3, seg: 60, floor: 0.6 });
  [sIn, sOut].forEach(s => timber(w, path.getPointAt(s).clone().setY(-0.6), path.getTangentAt(s), { w: 3.8, h: 3.1 }));
  // green crystals in the tunnel walls: the first glimpse of the room ahead
  for (let k = 0; k < 9; k++) { const s = 0.03 + k * (sIn - 0.05) / 8, { p, r } = frame(s), sd = k % 2 ? 1 : -1; const cc = crystalCluster(w, p.x + r.x * sd * 2.2, -0.5, p.z + r.z * sd * 2.2, { n: 4, size: 0.45, cols: GREENS, light: k % 3 === 0 }); cc.rotation.z = -sd * 0.5; }
  const cmat = toon(GREEN, { emissive: 0x1FA85A, emissiveIntensity: 0.55 });
  // the room: crystals everywhere — on the floor, on the walls, hanging from the roof
  const clear = (x, z) => { for (let i = 0; i <= 120; i++) { const s = sIn + (sOut - sIn) * i / 120, q = path.getPointAt(s); if (Math.hypot(q.x - x, q.z - z) < 3.4) return false; } return true; };
  for (let i = 0, n = 0; i < 90 && n < 34; i++) { const a = rnd() * Math.PI * 2, r = rr(0.35, 0.92), x = RC.x + Math.cos(a) * RX * r, z = RC.z + Math.sin(a) * RZ * r; if (!clear(x, z) || inRoom(new THREE.Vector3(x, 0, z)) > 0.8) continue;
    crystalCluster(w, x, hf(x, z) - 0.1, z, { n: 7, size: rr(0.8, 1.7), cols: GREENS, light: n % 9 === 0 }); n++; }
  for (let i = 0; i < 16; i++) { const a = rnd() * Math.PI * 2, r = rr(0.2, 0.7), x = Math.cos(a) * RX * r, z = RC.z + Math.sin(a) * RZ * r, y = RC.y + RY * Math.sqrt(Math.max(0, 1 - r * r)) - 0.6; const cc = crystalCluster(w, x, y, z, { n: 5, size: rr(0.6, 1.1), cols: GREENS, light: false }); cc.rotation.z = Math.PI; }
  scatter(w, 'rock_large', Array.from({ length: 16 }, () => { const a = rnd() * Math.PI * 2, x = Math.cos(a) * RX * 0.9, z = RC.z + Math.sin(a) * RZ * 0.9; return clear(x, z) ? { x, z, s: rr(1, 2), dy: -0.3 } : null; }).filter(Boolean), { gy: hf, style: () => [rockMat(0x6E8A80, 0.4)] });
  [[-12, 6, 4], [12, 6, -6], [0, 9, -22], [-10, 6, -28], [10, 6, 2]].forEach(([x, y, z]) => { const l = new THREE.PointLight(GREEN, 11, 30, 1.3); l.position.set(x, y, z); w.add(l); });
  motes(w, 180, [-14, 0, -34], [14, 12, 6], 0xB6FFD0, 0.07);
  curveRails(w, L, frame);
  // support posts under the track (not in the loop)
  for (let d = 0; d < L; d += 4) { const s = d / L; if (s > sA - 0.01 && s < sB + 0.01) continue; const { p } = frame(s); if (p.y < -0.2) continue; b.cyl(0.08, 0.1, 0.62 + p.y, 0x3A4A44, p.x, (p.y - 0.6) / 2, p.z, { line: 0 }); }
  // the loop's own legs: tall wooden trestles on both sides
  for (let k = 1; k < 18; k += 2) { const th = k / 18 * Math.PI * 2, x = 2.4 * k / 18, y = LR - LR * Math.cos(th), z = Zc - LR * Math.sin(th); if (y < 1.5) continue; [-1, 1].forEach(sd => { b.cyl(0.07, 0.09, y + 0.6, 0x3A4A44, x + sd * 2.7, (y - 0.6) / 2, z, { line: 0.01 }); b.box(2.0, 0.08, 0.08, 0x3A4A44, x + sd * 1.7, y, z, { line: 0 }); }); }
  const R = rider(w);
  const place = s => { const { p, f, r, u } = frame(Math.min(s, 0.999)); R.g.position.copy(p).addScaledVector(u, 0.05); R.g.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(r, u, f)); };
  place(0);
  // eight big crystals beside the loop (they will carry words)
  const big = [];
  for (let i = 0; i < 8; i++) { const side = i < 4 ? -1 : 1, k = i % 4; const x = side * (4.6 + (k % 2) * 2.0) + 1.2, z = Zc + 3 - k * 2.6;
    const g = new THREE.Group(); g.position.set(x, hf(x, z), z); w.add(g); const cc = crystalCluster(g, 0, 0, 0, { n: 5, size: 1.25, cols: [GREEN], light: false }); cc.scale.set(1, 1.1, 1); g.userData.crystal = cc; big.push(g); }
  const end = path.getPointAt(1);
  return { w, path, L, frame, place, R, sA, sB, big, end, sIn, sOut, cmat };
}

// ================================================================ stop 6: the swift river (and the beach after it)
export function buildRiver({ exitZ = null } = {}) {
  const w = newWorld({ sky: 0x070B14, ambient: 0xB0C4E8, ambientI: 0.8, sunI: 0.35, fog: [0x070B14, 18, 70] }); const b = builder(w); setSeed(61);
  const ZEND = exitZ !== null ? exitZ : -100;
  // the cave: a big lumpy rock tunnel the river runs down
  rockTube(w, new THREE.LineCurve3(new THREE.Vector3(0, -1.3, 22), new THREE.Vector3(0, -1.3, ZEND - (exitZ !== null ? 0.5 : 0))), { r: 8.2, lift: 2.4, tint: 0x6E7488, scale: 0.16, seg: 140, radial: 28, lump: 0.6 });
  // the river: flowing toon water with foam streaks and white edges along the banks
  const rg = new THREE.PlaneGeometry(11, 122, 22, 120); rg.rotateX(-Math.PI / 2);
  const riv = water(w, rg, { deep: 0x1D5F8E, shallow: 0x3FA7D6, flow: [0, 2.2], foamFn: 'smoothstep(4.6, 5.4, abs(vW.x))', speed: 1.4, opacity: 0.94 }); riv.position.set(0, 0, -39);
  // foam bits racing down the river (their speed shows how fast the water is)
  const foamMat = new THREE.MeshBasicMaterial({ color: 0xE6F6FF, transparent: true, opacity: 0.8 }); const foam = Array.from({ length: 70 }, () => { const m = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.02, 0.7), foamMat); m.position.set((rnd() - 0.5) * 10, 0.08, 10 - rnd() * 100); w.add(m); return m; });
  const flow = { speed: 3 }; onTick((t, dt) => foam.forEach(m => { m.position.z -= flow.speed * dt * (0.8 + (m.id % 4) * 0.15); if (m.position.z < Math.max(-92, ZEND + 2)) m.position.z = 12; }));
  // rocky banks
  const bm = rockMat(0x7A8094, 0.4); for (let i = 0; i < 70; i++) { const z = 12 - rnd() * 105, side = rnd() < 0.5 ? -1 : 1; if (z < ZEND + 1) continue; mesh(w, lumpy(rr(0.6, 1.5), 2, 0.24, 0.7), bm, side * rr(5.6, 7.4), rr(-0.4, 0.1), z, { ry: rnd() * 6, shadow: false }); }
  // stalactites
  const stm = rockMat(0x7A8094, 0.6); for (let i = 0; i < 30; i++) { const x = rr(-5, 5), z = 14 - rnd() * 100; if (z < ZEND + 2) continue; const h2 = rr(0.6, 1.8), cg = new THREE.ConeGeometry(rr(0.15, 0.35), h2, 7, 3); mesh(w, cg, stm, x, 1.1 + Math.sqrt(Math.max(0, 8.2 * 8.2 - x * x)) * 0.94 - h2 / 2, z, { rx: Math.PI, shadow: false }); }
  // blue crystals in the walls give the cave its light
  for (let k = 0; k < 10; k++) { const z = 8 - k * 9.5; if (z < ZEND + 3) break; const sd = k % 2 ? 1 : -1, cc = crystalCluster(w, sd * 6.6, 0.4, z, { n: 6, size: 0.7, cols: PAL.crys, light: k % 2 === 0 }); cc.rotation.z = sd * 0.45; }
  // the ledge where the old tracks stop, high above the water (the rails end in broken stubs)
  mesh(w, lumpy(3.2, 3, 0.12, 0.8), rockMat(0x80869A, 0.3), 0, -1.6, 14.4, { sc: [1, 0.95, 1.25], shadow: false });
  { const lb = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.3, 6.2), rockMat(0x8A8C9E, 0.35)); lb.position.set(0, 1.25, 13.4); w.add(lb); }
  straightRails(w, 0, 1.36, 10.5, 16.4);
  [-GAUGE, GAUGE].forEach((o, i) => { const st = b.box(0.09, 0.09, 0.5, 0x9DA3B3, o, 1.5, 10.3, { line: 0 }); st.rotation.x = i ? 0.35 : -0.25; });
  // bright exit far ahead
  const exitGlow = new THREE.Mesh(new THREE.CircleGeometry(6.5, 30), new THREE.MeshBasicMaterial({ color: 0xFFF6D8, fog: false })); exitGlow.position.set(0, 1, -94); w.add(exitGlow);
  const eg = glowSprite(0xFFF2C8, 22, 0.55); eg.position.set(0, 1.5, -92); eg.material.fog = false; w.add(eg);
  const halo = new THREE.PointLight(0xFFF0C0, 40, 60, 1); halo.position.set(0, 3, -85); w.add(halo);
  // the river splits into three channels between rock walls; a word sign hangs over each one
  const cm = rockMat(0x7A8094, 0.45); [-1.8, 1.8].forEach(x => { for (let z = -18.5; z > -34; z -= 1.3) mesh(w, lumpy(rr(0.7, 1.0), 2, 0.22, 0.85), cm, x + (rnd() - 0.5) * 0.3, 0.05, z, { ry: rnd() * 6, shadow: false }); });
  const gates = [-3.6, 0, 3.6].map(x => { const g = new THREE.Group(); g.position.set(x, 0, -17.2); w.add(g); const gb = builder(g);
    gb.rbox(0.14, 3.2, 0.14, WOOD2, -1.1, 1.5, 0, { line: 0.015 }); gb.rbox(0.14, 3.2, 0.14, WOOD2, 1.1, 1.5, 0, { line: 0.015 }); gb.rbox(2.6, 0.12, 0.14, WOOD, 0, 3.1, 0, { line: 0.015 });
    const board = gb.box(2.4, 0.9, 0.08, 0xC9A46A, 0, 2.5, 0, { line: 0.03 }); g.userData.board = board; return g; });
  // Leo on his log, drifting where the channels meet again
  const leoLog = new THREE.Group(); leoLog.position.set(0, 0.1, -42); w.add(leoLog); { const lb = builder(leoLog); lb.cyl(0.34, 0.36, 2.4, 0x7A5132, 0, 0.1, 0, { rz: Math.PI / 2, line: 0.03, seg: 12 }); [-1, 1].forEach(sd => lb.cyl(0.3, 0.3, 0.02, 0xE2C49A, sd * 1.21, 0.1, 0, { rz: Math.PI / 2, line: 0, seg: 12 })); lb.cyl(0.07, 0.09, 0.5, 0x7A5132, 0.5, 0.42, 0.1, { rz: -0.5, line: 0.012 }); }
  onTick(t => { leoLog.position.y = 0.1 + Math.sin(t * 2) * 0.06; leoLog.rotation.z = Math.sin(t * 1.3) * 0.05; });
  const R = rider(w); R.g.position.set(0, 1.45, 15.5); R.g.rotation.y = Math.PI;
  const paddle = builder(R.cast.mia.AR).box(0.06, 1.3, 0.06, 0x8A5A3B, 0, -0.5, 0.2, { line: 0.015 }); paddle.visible = false;
  const lc = makeCast(leoLog); lc.mia.g.visible = false; lc.toby.g.visible = false; const leo = lc.leo; leo.g.position.set(0, 0.32, 0); leo.pose('sit'); leo.g.rotation.y = Math.PI * 0.15;
  // (Episode 3) a real cave mouth: the river runs out through a rocky arch into the bright day
  if (exitZ !== null) {
    exitGlow.position.z = exitZ - 1.5; exitGlow.scale.setScalar(1.3); halo.position.z = exitZ + 6; eg.position.z = exitZ + 0.5;
    const oc = document.createElement('canvas'); oc.width = 256; oc.height = 256; const ox = oc.getContext('2d'); const og = ox.createLinearGradient(0, 0, 0, 256);
    og.addColorStop(0, '#9FD8F5'); og.addColorStop(0.5, '#FFF6D8'); og.addColorStop(0.56, '#3FA7D6'); og.addColorStop(0.7, '#5BB8E8'); og.addColorStop(0.72, '#F2D79B'); og.addColorStop(1, '#E9C98A'); ox.fillStyle = og; ox.fillRect(0, 0, 256, 256);
    const ot = new THREE.CanvasTexture(oc); ot.colorSpace = THREE.SRGBColorSpace; exitGlow.material = new THREE.MeshBasicMaterial({ map: ot, fog: false });
    const arch = new THREE.Mesh(new THREE.RingGeometry(6.2, 18, 30), rockMat(0x6E7488, 0.2)); arch.position.set(0, 0, exitZ); w.add(arch);
    for (let i = 0; i < 16; i++) { const a = Math.PI * i / 15; mesh(w, lumpy(rr(1, 1.8), 2, 0.22, 0.8), bm, Math.cos(a) * 7, Math.sin(a) * 7.2 - 0.3, exitZ + 0.6, { ry: rnd() * 6, shadow: false }); }
  }
  return { w, R, gates, leoLog, flow, leo, paddle, exitGlow };
}

// ---------------------------------------------------------------- the beach: the stream runs out of a real cave in the cliff, curls round, and meets the sea
export const streamX = z => z > 6 ? 0 : 6 * (t => t * t * (3 - 2 * t))(Math.min(1, (6 - z) / 10));
export function buildBeach() {
  const w = newWorld({ sky: 0x86D4F5, ambientI: 1.5, sunI: 1.9, sunPos: [-14, 22, -10], fog: [0xD9F3FC, 45, 130] }); const b = builder(w); setSeed(67);
  const hf = (x, z) => { let y = nz(x, z, 0.32) * 0.05 + Math.max(0, z - 5) * 0.07 - Math.max(0, -z - 11.5) * 0.12; const d = Math.abs(x - streamX(z)); if (z < 26) y = Math.min(y, -0.26 + Math.max(0, d - 1.5) * 0.4); return y; };   // the channel runs right back into the cave
  ground(w, 110, 170, hf, (x, z, c) => { const y = hf(x, z), wet = y < 0.04 && z < -9, rip = Math.sin(x * 2.4 + nz(x, z, 0.3) * 3) * 0.5 + 0.5; c.setHSL(0.11, wet ? 0.38 : 0.55, wet ? 0.62 : 0.76 + rip * 0.03); });
  // the sea, with surf rolling up the sand
  const sea = new THREE.PlaneGeometry(240, 110, 60, 30); sea.rotateX(-Math.PI / 2);
  water(w, sea, { deep: 0x1E8FC2, shallow: 0x6FE0E8, foamFn: '1.0 - smoothstep(0.0, 1.1, abs(vW.z + 12.4 - sin(vW.x * 0.45 + uT * 1.2) * 0.7 - sin(uT * 0.9) * 0.6))' }).position.set(0, -0.05, -66);
  // the stream from the cave across the sand to the sea
  const sgeo = new THREE.PlaneGeometry(3.4, 46, 6, 92); sgeo.rotateX(-Math.PI / 2); { const p = sgeo.attributes.position; for (let i = 0; i < p.count; i++) { const z = p.getZ(i) + 4; p.setXYZ(i, p.getX(i) + streamX(z), 0, z); } }
  water(w, sgeo, { deep: 0x3FA7D6, shallow: 0x8FE6F2, flow: [0, 1.6], foamFn: `smoothstep(1.25, 1.65, abs(vW.x - (vW.z > 6.0 ? 0.0 : 6.0 * (1.0 - smoothstep(-4.0, 6.0, vW.z)))))`, speed: 1.2, opacity: 0.92 }).position.y = -0.12;
  // the cliff with the cave they shot out of: a REAL opening in the rock, with the stream running out of it
  const holeP = new THREE.Vector3(0, -0.3, 15.5);
  const cliffM = cutHoles(rockMat(0xD7B48A, 0.2), [{ p: holeP, d: new THREE.Vector3(0, 0, 1), r: 2.3, depth: 6 }]);
  { const o = cliffM.onBeforeCompile; cliffM.onBeforeCompile = sh => { o(sh); sh.fragmentShader = sh.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\n diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.45, 0.74, 0.36), smoothstep(0.7, 0.85, vRN.y) * smoothstep(4.0, 5.5, vRW.y));'); }; }
  [[0, 2.6, 22.5, 8, [1.5, 0.82, 0.8]], [-11, 2.2, 19, 6, [1.1, 0.9, 0.9]], [11, 2.4, 19.5, 6.5, [1.1, 0.85, 0.9]], [-20, 1.6, 15, 5, [1, 0.8, 1]], [20, 1.6, 15, 5, [1, 0.8, 1]]].forEach(([x, y, z, r, sc]) => mesh(w, lumpy(r, 3, 0.14, 1), cliffM, x, y, z, { sc, shadow: false }));
  rockTube(w, new THREE.LineCurve3(new THREE.Vector3(0, -0.2, 15.2), new THREE.Vector3(0, -0.2, 26)), { r: 2.6, lift: 1.0, tint: 0x5A4A3A, scale: 0.3, seg: 30 });
  { const back = new THREE.Mesh(new THREE.CircleGeometry(3, 20), new THREE.MeshBasicMaterial({ color: 0x0A0806 })); back.position.set(0, 0.6, 24); back.rotation.y = Math.PI; w.add(back); }
  caveMouth(w, new THREE.Vector3(0, -0.25, 15.6), new THREE.Vector3(0, 0, -1), { r: 2.3, mat: rockMat(0xC9A884, 0.35), hf });
  // palms, bushes, sandstone rocks, driftwood, shells, starfish
  scatter(w, 'palm-detailed-long', [{ x: -7.5, z: 6, s: 1, ry: 0.3, rz: -0.12 }, { x: -11.5, z: 1.5, s: 1, ry: 2, rz: 0.1 }, { x: 11.5, z: 9, s: 1, ry: 1.2, rz: 0.12 }], { gy: hf, norm: 7.5 });
  scatter(w, 'palm-detailed-short', [{ x: -5, z: 11, s: 1, ry: 1 }, { x: 13.5, z: 3, s: 1 }, { x: 7.5, z: 12.5, s: 1, ry: 2.4 }], { gy: hf, norm: 5 });
  scatter(w, 'bush_large', [{ x: -9, z: 9, s: 1.4 }, { x: 10, z: 11, s: 1.2 }, { x: -14, z: 6, s: 1.2 }, { x: 15, z: 7, s: 1 }, { x: -3.5, z: 13, s: 0.9 }], { gy: hf });
  scatter(w, 'formation-rock', [{ x: -9, z: -5, s: 1, ry: 0.4 }, { x: 14, z: -6, s: 0.8, ry: 2 }, { x: -15, z: -1, s: 0.7 }], { gy: hf, norm: 4.5, style: (n, mn) => [/sand/.test(mn) ? toon(0xE6CF96) : rockMat(0xC9A884, 0.4)] });
  scatter(w, 'log', [{ x: -5.5, z: -4.5, s: 1, ry: 0.5, rz: 0.1 }], { gy: hf, norm: 3, style: (n, mn) => [toon(/bark/i.test(mn) ? 0xB89C80 : 0xE6DCC8)] });
  const sc = [0xFFD8C8, 0xFFF1D6, 0xF6B8C8, 0xE9D4FF]; for (let i = 0, n = 0; i < 40 && n < 16; i++) { const x = rr(-12, 12), z = rr(-11, 4); if (Math.abs(x - streamX(z)) < 2.2 || Math.hypot(x, z) < 1.6) continue; seaShell(w, x, hf(x, z), z, pick(sc)); n++; }
  [[-3.5, -8], [-6.5, -2.5], [2, -10]].forEach(([x, z]) => starfish(w, x, hf(x, z), z, pick([0xFF8A5C, 0xFFB14A])));
  // a crab scuttling along the wet sand (well away from the stream)
  const crab = new THREE.Group(); crab.position.set(-4, 0, -6); w.add(crab); const crb = builder(crab); crb.ball(0.25, 0xEF5B4C, 0, 0.18, 0, { line: 0.02 }).scale.y = 0.6; [-1, 1].forEach(sd => { crb.ball(0.1, 0xEF5B4C, sd * 0.3, 0.25, 0.15, { line: 0.01 }); crb.ball(0.05, 0x2E2A4F, sd * 0.09, 0.32, 0.18, { line: 0 }); });
  onTick(t => { crab.position.x = -4 + Math.sin(t * 0.6) * 2.5; crab.position.y = hf(crab.position.x, -6); crab.rotation.y = Math.PI / 2; });
  // the sun and cute toon clouds
  const sun = new THREE.Mesh(new THREE.SphereGeometry(4, 20, 12), new THREE.MeshBasicMaterial({ color: 0xFFE58A, fog: false })); sun.position.set(30, 22, -100); w.add(sun); const sg2 = glowSprite(0xFFE58A, 22, 0.5); sg2.position.copy(sun.position); sg2.material.fog = false; w.add(sg2);
  const cm = toon(0xFFFFFF); for (let i = 0; i < 7; i++) { const g = new THREE.Group(); g.position.set(-60 + i * 20 + rnd() * 8, 16 + rnd() * 6, -70 - rnd() * 20); w.add(g); for (let k = 0; k < 4; k++) { const m = new THREE.Mesh(new THREE.SphereGeometry(2 + rnd() * 1.5, 12, 10), cm); m.position.set(k * 2.6 - 4, rnd(), 0); m.scale.y = 0.75; g.add(m); outline(m, 0.05); }
    const v = 0.3 + rnd() * 0.4; onTick((t, dt) => { g.position.x += v * dt; if (g.position.x > 80) g.position.x = -80; }); }
  // the cart, washed up on the bank where the stream bends, tipped on its side
  const tipped = cart(b, -3.6, hf(-3.6, 6.6), 6.6); tipped.rotation.set(0, 0.8, 1.2);
  const cast = makeCast(w);
  cast.leo.g.position.set(-0.7, 0, 0); cast.mia.g.position.set(0.7, 0, 0); cast.toby.g.position.set(0, 0, -1.0);
  [cast.leo, cast.mia, cast.toby].forEach(c => c.g.rotation.y = Math.PI);   // facing the camera (and the sea)
  const gem = gemOf(cast.mia.g, 0, 0.95, 0.38);
  return { w, cast, gem, tipped, hf, streamX };
}
