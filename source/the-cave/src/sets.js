// The places. Each build function makes a fresh world and returns handles the story script uses.
import { THREE, builder, toon, outline, newWorld, onTick, textPlane, textTexture, INK } from './gfx.js';
import { makeCast } from './chars.js';
import { setSeed, rnd as prnd, rr, pick, nz, small, PAL, scatter, ground, grass, water, rockMat, lumpy, mesh, crystalCluster, clouds, lantern, sign as woodSign, mineCart, motes, ferris as ferris3 } from './props.js';
import { glowSprite } from './effects.js';

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
  // the old mine cart: plank walls, iron bands and corners, spoked iron wheels (open on top so the kids sit inside)
  const g = new THREE.Group(); g.position.set(x, y, z); b.group.add(g); const cb = builder(g), W1 = 0x8B5E3C, W2 = 0x6E4529, IR = 0x4A4F5C;
  for (let i = 0; i < 4; i++) { const yy = 0.42 + i * 0.15, c1 = i % 2 ? W1 : W2, c2 = i % 2 ? W2 : W1;
    cb.rbox(0.07, 0.14, 1.78, c1, 0.62, yy, 0, { line: 0.012 }); cb.rbox(0.07, 0.14, 1.78, c2, -0.62, yy, 0, { line: 0.012 });
    cb.rbox(1.3, 0.14, 0.07, c2, 0, yy, 0.88, { line: 0.012 }); cb.rbox(1.3, 0.14, 0.07, c1, 0, yy, -0.88, { line: 0.012 }); }
  cb.rbox(1.24, 0.07, 1.72, W2, 0, 0.36, 0, { line: 0.012 });
  [[-0.64, -0.9], [0.64, -0.9], [-0.64, 0.9], [0.64, 0.9]].forEach(([xx, zz]) => cb.box(0.09, 0.66, 0.09, IR, xx, 0.66, zz, { line: 0.01 }));
  [0.4, 0.95].forEach(yy => { cb.box(1.36, 0.05, 0.05, IR, 0, yy, 0.92, { line: 0 }); cb.box(1.36, 0.05, 0.05, IR, 0, yy, -0.92, { line: 0 }); cb.box(0.05, 0.05, 1.84, IR, 0.66, yy, 0, { line: 0 }); cb.box(0.05, 0.05, 1.84, IR, -0.66, yy, 0, { line: 0 }); });
  [-0.68, 0.68].forEach(xx => [-0.55, 0.55].forEach(zz => { cb.cyl(0.22, 0.22, 0.09, 0x3A3D47, xx, 0.22, zz, { rz: Math.PI / 2, line: 0.015, seg: 16 }); cb.cyl(0.08, 0.08, 0.11, 0xB8862F, xx, 0.22, zz, { rz: Math.PI / 2, line: 0, seg: 10 }); }));
  [-0.55, 0.55].forEach(zz => cb.cyl(0.035, 0.035, 1.3, IR, 0, 0.22, zz, { rz: Math.PI / 2, line: 0 }));
  return g;
}

// ================================================================ the journey map
export const STOPS = [
  { n: 1, name: 'The Meadow', ep: 1, p: [-19.5, 0.6, 8.2] },
  { n: 2, name: 'The Glowing Stone', ep: 1, p: [-15.4, -1.6, 10.6] },
  { n: 3, name: 'The Dark Tunnel', ep: 1, p: [-8, -1.6, 9.6] },
  { n: 4, name: 'The Drop', ep: 2, p: [0, -1.6, 8.8] },
  { n: 5, name: 'Crystal Loop', ep: 2, p: [9, -1.6, 7.8] },
  { n: 6, name: 'The Swift River', ep: 2, p: [19, -1.6, 6.6] },
  { n: 7, name: 'The Rock Shelf', ep: 3, p: [-12.6, -1.6, 6.4] },
  { n: 8, name: 'The Crack', ep: 3, p: [-2.5, -1.6, 4.8] },
  { n: 9, name: 'The Rainbow Cliff', ep: 3, p: [9.8, -1.6, 4.0] },
  { n: 10, name: 'The Lost Island', ep: 4, p: [51.2, 3.4, 1.2] },
  { n: 11, name: 'Toby’s Dig', ep: 4, p: [57.6, 0.6, 2.6] },
  { n: 12, name: 'The Clear Sea', ep: 4, p: [34, 0.3, -8.4] },
  { n: 13, name: 'Varn Rises', ep: 5, p: [13, 0.4, -10.2] },
  { n: 14, name: 'Mia’s Choice', ep: 5, p: [7, 0.4, -11.6] },
  { n: 15, name: 'The Angry Wave', ep: 5, p: [1, 0.4, -12.6] },
  { n: 16, name: 'The Gray Shore', ep: 6, p: [77, 0.6, -9] },
  { n: 17, name: 'The Old Man’s Fire', ep: 6, p: [80, 0.6, -12] },
  { n: 18, name: 'The Stolen Boat', ep: 6, p: [83, 0.6, -8.2] },
  { n: 19, name: 'Out of the Fog', ep: 7, p: [85, 0.3, 3] },
  { n: 20, name: 'The Chase', ep: 8, p: [77, 0.3, 11] },
  { n: 21, name: "Varn's Story", ep: 9, p: [89, 0.6, 13] },
];
// the route, drawn episode by episode (Leo's side is told as a memory, so it runs alongside the main tunnel; the angry wave is a long throw)
// legs that bend round something: from the island's sea-side beach they sail round the south of the island, then home
const VIA = { '11-12': [[60, 0.5, -2.5], [56, 0.5, -6.5], [48, 0.5, -8.6]] };
export const ROUTE = [[1, 2, 3], [3, 4, 5, 6], [2, 7, 8, 9, 6], [6, 10, 11, 12], [12, 13, 14, 15], [15, 'wave', 16, 17, 18], [18, 19, 20, 21]];
export const EPISODES = { 1: { title: 'The Cave', stops: [1, 2, 3] }, 2: { title: 'The Cave 2', stops: [4, 5, 6] }, 3: { title: 'The Cave 3: Leo’s Side', stops: [7, 8, 9] }, 4: { title: 'The Cave 4: The Lost Island', stops: [10, 11, 12] }, 5: { title: 'The Cave 5: Guard of the Stones', stops: [13, 14, 15] }, 6: { title: 'The Cave 6: The Old Man', stops: [16, 17, 18] } };
export const MAX_EP = 5;   // episode 6 is rebuilt; held back from the map until Frank OKs it (play it with ?test&stop=16)
export function buildMap(S, onPick) {
  const w = newWorld({ sky: 0xBFE6F7, ambientI: 1.5, sunI: 1.55, sunPos: [-14, 30, 18], fog: [0xCFEAF5, 80, 170] }); const b = builder(w); setSeed(11);
  const coastX = z => -16.5 + 5.6 * Math.exp(-(((z - 10) / 5.5) ** 2)) + 0.7 * Math.sin(z * 0.37) + 0.35 * Math.sin(z * 1.1 + 1);
  const ISL = [52, 2], GRAY = [80, -10];
  const landD = (x, z) => Math.min(x - coastX(z), Math.hypot(x - ISL[0], z - ISL[1]) - 6.5, Math.hypot((x - GRAY[0]) * 0.8, (z - GRAY[1]) * 1.15) - 4.2);
  // sea floor (shallow near land, deep further out) and the clear sea over it, with foam along the shores
  const bed = new THREE.PlaneGeometry(220, 120, 110, 60); bed.rotateX(-Math.PI / 2); bed.translate(18, 0, 0);
  { const p = bed.attributes.position, c = new Float32Array(p.count * 3), col = new THREE.Color(); for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), dl = Math.max(0, landD(x, z)); p.setY(i, -1.4 - Math.min(2.2, dl * 0.3) + nz(x, z, 0.2) * 0.2); col.setHSL(0.13 - Math.min(0.05, dl * 0.008), 0.4, 0.62 - Math.min(0.3, dl * 0.035)); c.set([col.r, col.g, col.b], i * 3); }
    bed.setAttribute('color', new THREE.BufferAttribute(c, 3)); bed.computeVertexNormals(); }
  w.add(new THREE.Mesh(bed, toon(0xffffff, { vertexColors: true })));
  const bedY = (x, z) => -1.4 - Math.min(2.2, Math.max(0, landD(x, z)) * 0.3) + nz(x, z, 0.2) * 0.2;
  const sea = new THREE.PlaneGeometry(240, 140, 2, 2); sea.rotateX(-Math.PI / 2); sea.translate(18, 0, 0);
  water(w, sea, { deep: 0x3AA2D0, shallow: 0x67C6E0, opacity: 0.58, scale: 2.2, sparkle: 0.3, foamFn: `max(max(1.0 - smoothstep(0.0, 0.45, abs(vW.x - (-16.5 + 5.6 * exp(-pow((vW.z - 10.0) / 5.5, 2.0)) + 0.7 * sin(vW.z * 0.37) + 0.35 * sin(vW.z * 1.1 + 1.0)) - 0.5)),
    1.0 - smoothstep(0.0, 0.5, abs(length(vW.xz - vec2(${ISL[0]}.0, ${ISL[1]}.0)) - 6.6 - sin(atan(vW.z - ${ISL[1]}.0, vW.x - ${ISL[0]}.0) * 3.0) * 0.45))), 1.0 - smoothstep(0.0, 0.45, abs(length((vW.xz - vec2(${GRAY[0]}.0, ${GRAY[1]}.0)) * vec2(0.8, 1.15)) - 4.3)))` });
  // the mainland: low green hills, a sandy shore
  const mH = (x, z) => { const d = coastX(z) - x; return d < 0 ? Math.max(-6, d * 1.5) : Math.min(0.8, d * 0.5) + (d > 3 ? nz(x, z, 0.12) * 0.5 + 0.3 : 0); };
  const ml = new THREE.PlaneGeometry(90, 140, 90, 140); ml.rotateX(-Math.PI / 2); { const p = ml.attributes.position, c = new Float32Array(p.count * 3), col = new THREE.Color(); for (let i = 0; i < p.count; i++) { const x = p.getX(i) - 54, z = p.getZ(i), d = coastX(z) - x; p.setX(i, x); p.setY(i, mH(x, z)); d < 1.2 ? col.setRGB(0.93, 0.83, 0.6) : col.setHSL(0.27 + nz(x, z, 0.1) * 0.02, 0.48, 0.5 + nz(x, z, 0.3) * 0.04); c.set([col.r, col.g, col.b], i * 3); }
    ml.setAttribute('color', new THREE.BufferAttribute(c, 3)); ml.computeVertexNormals(); }
  const mlm = new THREE.Mesh(ml, toon(0xffffff, { vertexColors: true })); mlm.receiveShadow = true; w.add(mlm);
  // hometown: houses, the Ferris wheel facing the sea, the lighthouse, the harbour
  const roofC = [0xEF5B4C, 0x4AA3DF, 0xFFC94A, 0xB57EDC, 0x5DBB4A, 0xF28C38, 0xE86A8E]; let placed = 0;
  for (let i = 0; i < 220 && placed < 34; i++) { const x = rr(-42, -19), z = rr(-26, 1); if (x > coastX(z) - 2) continue; if (Math.hypot(x + 23, z + 3) < 3.6) continue; const y = mH(x, z), hh = rnd() < 0.3 ? 1.5 : 0.95, ry = rr(-0.3, 0.3);
    b.rbox(1.1, hh, 1.1, 0xFFF4D6, x, y + hh / 2, z, { ry, line: 0.025 }); b.cone(0.95, 0.75, roofC[placed % 7], x, y + hh + 0.37, z, { seg: 4, ry: Math.PI / 4 + ry, line: 0.025 }); placed++; }
  ferris3(w, -23, mH(-23, -3), -3, 0.22, Math.PI / 2);
  { const lz = -10, lx = coastX(lz) - 1.2; b.cyl(0.45, 0.65, 3, 0xFFFDF4, lx, 1.9, lz); [1.2, 2.3].forEach(y => b.cyl(0.55, 0.58, 0.35, 0xD93A35, lx, y, lz, { line: 0.02 })); b.cyl(0.42, 0.42, 0.45, 0xFFE58A, lx, 3.6, lz, { line: 0.02 }); b.cone(0.58, 0.55, 0xD93A35, lx, 4.1, lz);
    const beam = new THREE.Mesh(new THREE.ConeGeometry(1.1, 6, 16, 1, true), new THREE.MeshBasicMaterial({ color: 0xFFF2B0, transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false })); beam.rotation.z = Math.PI / 2; beam.position.x = 3.2; const piv = new THREE.Group(); piv.position.set(lx, 3.6, lz); piv.add(beam); w.add(piv); onTick((t, dt) => { piv.rotation.y += dt * 0.8; }); }
  { const pz = -4, px = coastX(pz); b.box(4, 0.18, 0.8, 0x9C6B45, px + 1.8, 0.35, pz, { line: 0.02 }); scatter(w, 'boat-small', [{ x: px + 3.2, z: pz + 1.6, y: -0.1, ry: 0.5 }, { x: px + 4.6, z: pz - 1.4, y: -0.1, ry: 2 }], { norm: 1.6 }); }
  { const tr = { tree_oak: [], tree_fat: [], tree_pine: [], tree_pine_tall: [] }, tk = Object.keys(tr);
    for (let i = 0; i < 120; i++) { const z = rr(-44, 44), x = rr(-48, coastX(z) - 2); if (z > -28 && z < 3 && x > -44) continue; if (Math.hypot(x + 19.5, z - 8.5) < 3.2) continue; tr[tk[i % 4]].push({ x, z, s: rr(0.55, 0.9) }); }
    for (const k in tr) scatter(w, k, tr[k], { gy: mH }); }
  // the cave hill on the coast, with the meadow in front of it
  const CH = [-16.6, 11.8]; { const hm = rockMat(0xA9A3A0, 0.3), o = hm.onBeforeCompile; hm.onBeforeCompile = sh => { o(sh); sh.fragmentShader = sh.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\n diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.42, 0.72, 0.33), smoothstep(0.6, 0.85, vRN.y));'); };
    mesh(w, lumpy(2.6, 3, 0.2, 0.62), hm, CH[0], 0.4, CH[1], { sc: [1.25, 1, 1] }); const hole = new THREE.Mesh(new THREE.CircleGeometry(0.75, 18, 0, Math.PI), new THREE.MeshBasicMaterial({ color: 0x07080F })); hole.position.set(CH[0] - 1.6, mH(CH[0] - 3, CH[1]) + 0.05, CH[1] - 1.9); hole.rotation.y = -0.6; w.add(hole); }
  scatter(w, 'flower_red', Array.from({ length: 30 }, () => ({ x: -19.5 + rr(-2, 2), z: 8.5 + rr(-2, 2), s: 0.35 })), { gy: mH, shadow: false });
  // the lost island, far out to sea: a rocky lookout hill, palms and the cave where the river comes out
  const iH = (x, z) => { const dx = x - ISL[0], dz = z - ISL[1], d = Math.hypot(dx, dz) / (1 + Math.sin(Math.atan2(dz, dx) * 3) * 0.07), hill = Math.max(0, 1 - Math.hypot(dx + 1, dz + 1) / 3.8); return Math.max(-6, Math.min(0.6, (6.4 - d) * 1.4)) + Math.pow(hill, 1.2) * 3.4; };
  ground(w, 22, 120, (x, z) => iH(x + ISL[0], z + ISL[1]), (x, z, c) => { iH(x + ISL[0], z + ISL[1]) < 0.4 ? c.setRGB(0.93, 0.83, 0.6) : c.setHSL(0.27, 0.5, 0.5); }, rockMat(0xffffff, 0.35, { steep: true })).position.set(ISL[0], 0, ISL[1]);
  { const rm = rockMat(0xA59C92, 0.5); for (let i = 0; i < 10; i++) { const a = rnd() * 6.28, r = rr(0.8, 2.6), x = ISL[0] - 1 + Math.cos(a) * r, z = ISL[1] - 1 + Math.sin(a) * r; mesh(w, lumpy(rr(0.3, 0.55), 2, 0.25, 0.9), rm, x, iH(x, z) + 0.05, z, { ry: rnd() * 6 }); } }
  scatter(w, 'palm-detailed-short', [[3, 3.5], [4.6, 0], [1, 5], [-2.8, 3.4], [2.4, -3.8]].map(([x, z]) => ({ x: ISL[0] + x, z: ISL[1] + z })), { gy: iH, norm: 1.8 });
  scatter(w, 'tree_fat', [{ x: ISL[0] + 2.4, z: ISL[1] - 1.4, s: 0.6 }, { x: ISL[0] - 3.6, z: ISL[1] + 0.6, s: 0.55 }], { gy: iH });
  // the secret tunnel under the sea floor, all the way from the meadow cave to the island, with Leo's side passage beside it
  const tP = n => { const s = STOPS[n - 1]; return [s.p[0], s.p[2]]; };
  const onBed = ([x, z], up = 0.15) => new THREE.Vector3(x, bedY(x, z) + up, z);
  const tc = new THREE.CatmullRomCurve3([new THREE.Vector3(CH[0] - 1.6, 0.2, CH[1] - 1.9), onBed([-15, 9.8]), ...[3, 4, 5, 6].map(n => onBed(tP(n))), onBed([25, 5.2]), onBed([40, 3.8]), new THREE.Vector3(ISL[0] - 5.4, 0.2, ISL[1] + 2.6)], false, 'centripetal');
  const tube = new THREE.Mesh(new THREE.TubeGeometry(tc, 200, 0.42, 10), toon(0x24304A, { emissive: 0x1E5A80, emissiveIntensity: 0.55 })); w.add(tube); tube.add(new THREE.Mesh(tube.geometry, INK));
  const lc = new THREE.CatmullRomCurve3([onBed(tP(2)), onBed(tP(7)), onBed(tP(8)), onBed(tP(9)), onBed([15, 5.4]), onBed(tP(6))], false, 'centripetal');
  w.add(new THREE.Mesh(new THREE.TubeGeometry(lc, 140, 0.3, 8), toon(0x2E3348, { emissive: 0x1A2A4A, emissiveIntensity: 0.5 })));
  // the shipwreck on the way back, and the frozen sea near home
  scatter(w, 'ship-wreck', [{ x: 22, z: -4, y: -2.6, ry: 0.9, rz: 0.15 }], { norm: 3.2 });
  { const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'); x.fillStyle = '#DDF2FB'; x.fillRect(0, 0, 256, 256); x.strokeStyle = '#7FA9C2'; x.lineWidth = 2; for (let i = 0; i < 22; i++) { x.beginPath(); let px = rnd() * 256, py = rnd() * 256; x.moveTo(px, py); for (let k = 0; k < 4; k++) { px += rr(-40, 40); py += rr(-40, 40); x.lineTo(px, py); } x.stroke(); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; const im = toon(0xffffff, { map: t, emissive: 0x3E6E88, emissiveIntensity: 0.15 });
    for (let i = 0; i < 30; i++) { const x0 = rr(-1.5, 16), z0 = -11.4 + rr(-2.6, 2.6); mesh(w, new THREE.CylinderGeometry(rr(0.7, 1.4), rr(0.8, 1.5), 0.18, 6), im, x0, 0.06, z0, { ry: rnd() * 6 }); } }
  // the gray shore far beyond the island (Episode 6 on), a dark little island under fog
  const gH = (x, z) => { const d = Math.hypot((x - GRAY[0]) * 0.8, (z - GRAY[1]) * 1.15); return Math.max(-6, Math.min(0.5, (4.1 - d) * 0.5)); };
  ground(w, 16, 60, (x, z) => gH(x + GRAY[0], z + GRAY[1]), (x, z, c) => c.setRGB(0.6, 0.63, 0.6)).position.set(GRAY[0], 0, GRAY[1]);
  { const rm = rockMat(0x8A8E92, 0.4); for (let i = 0; i < 10; i++) { const a = rnd() * 6.28, r = rr(1.5, 4), x = GRAY[0] + Math.cos(a) * r * 1.2, z = GRAY[1] + Math.sin(a) * r * 0.85; mesh(w, lumpy(rr(0.3, 0.7), 2, 0.25, 1.1), rm, x, gH(x, z), z, { ry: rnd() * 6 }); } }
  scatter(w, 'tree_dark', [{ x: GRAY[0] - 1.6, z: GRAY[1] - 1, s: 0.6 }, { x: GRAY[0] + 1, z: GRAY[1] + 1.2, s: 0.5 }, { x: GRAY[0] + 2, z: GRAY[1] - 1.6, s: 0.55 }], { gy: gH, style: (n, mn) => [toon(/wood|bark/i.test(mn) ? 0x6E6A66 : 0x7E8A84)] });
  // cute puffy clouds drifting, and gulls over the harbour
  const cloudMat = toon(0xFFFFFF, { transparent: true, opacity: 0.92 });
  for (let i = 0; i < 12; i++) { const g = new THREE.Group(); g.position.set(-50 + rnd() * 130, 10 + rnd() * 3, -22 + rnd() * 44); w.add(g);
    for (let k = 0; k < 4; k++) { const m = new THREE.Mesh(new THREE.SphereGeometry(1.2 + rnd(), 10, 8), cloudMat); m.position.set(k * 1.3 - 2, rnd() * 0.5, rnd() * 0.8); m.scale.y = 0.6; g.add(m); }
    const sp = 0.4 + rnd() * 0.4; onTick((t, dt) => { g.position.x += sp * dt; if (g.position.x > 85) g.position.x = -55; }); }
  const gullMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
  for (let i = 0; i < 6; i++) { const g = new THREE.Group(); w.add(g); const wl = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.04, 0.12), gullMat), wr = wl.clone(); wl.position.x = -0.22; wr.position.x = 0.22; g.add(wl, wr);
    const cx = -14 + rnd() * 8, cz = -10 + rnd() * 16, r = 2 + rnd() * 3, ph = rnd() * 6, hy = 4 + rnd() * 2;
    onTick(t => { const a = t * 0.5 + ph; g.position.set(cx + Math.cos(a) * r, hy + Math.sin(t * 2 + ph) * 0.2, cz + Math.sin(a) * r); g.rotation.y = -a; const f = Math.sin(t * 8 + ph) * 0.5; wl.rotation.z = f; wr.rotation.z = -f; }); }
  // the route, episode by episode: gold where she has been, white ahead; the wave's throw is a red sweep north of the island
  const done = n => S.stops[n] && S.stops[n].done, P = n => { const s = STOPS[n - 1]; return new THREE.Vector3(s.p[0], s.p[1] < 0 ? s.p[1] + 0.2 : 0.35, s.p[2]); };
  const dash = (curve, lit, col = null, N = 80) => { for (let i = 0; i < N; i += 2) { const a = curve.getPoint(i / N), c = curve.getPoint((i + 1) / N); const m = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, a.distanceTo(c), 6), new THREE.MeshBasicMaterial({ color: col || (lit ? 0xFFC94A : 0xFFFFFF), transparent: !lit && !col, opacity: lit || col ? 1 : 0.55 })); m.position.copy(a).lerp(c, 0.5); m.lookAt(c); m.rotateX(Math.PI / 2); w.add(m); } };
  ROUTE.forEach(seq => { for (let i = 0; i < seq.length - 1; i++) { const a = seq[i], bb = seq[i + 1]; if (bb === 'wave') { const to = seq[i + 2], lit = done(to); dash(new THREE.CatmullRomCurve3([P(a), new THREE.Vector3(4, 0.5, -20), new THREE.Vector3(32, 0.5, -21), new THREE.Vector3(62, 0.5, -16), P(to)], false, 'centripetal'), lit, lit ? 0xFFC94A : 0xE8575A, 220); i++; continue; }
    if (VIA[a + '-' + bb]) { const cv = new THREE.CatmullRomCurve3([P(a), ...VIA[a + '-' + bb].map(v => new THREE.Vector3(...v)), P(bb)], false, 'centripetal'); dash(cv, done(bb), null, Math.round(cv.getLength() * 2.4)); continue; }
    const pa = P(a), pb = P(bb), len = pa.distanceTo(pb); dash(new THREE.LineCurve3(pa, pb), done(bb), null, Math.max(8, Math.round(len * 2.4))); } });
  // fog over places not yet open
  const fogMat = toon(0xF4F7FB, { transparent: true, opacity: 0.82 }); const lockedX = MAX_EP >= 5 ? 68 : MAX_EP >= 4 ? 20 : 26;
  for (let i = 0; i < 46; i++) { const x = lockedX + rnd() * 30, z = -18 + rnd() * 36; const m = new THREE.Mesh(new THREE.SphereGeometry(1.0 + rnd() * 1.3, 10, 8), fogMat); m.position.set(x, 1.2 + rnd() * 1.2, z); m.scale.y = 0.55; w.add(m); const ph = rnd() * 6; onTick(t => { m.position.y = 1.4 + Math.sin(t * 0.4 + ph) * 0.25; }); }
  // markers
  const reached = Math.max(1, ...Object.keys(S.stops).filter(k => S.stops[k].done).map(k => +k + 1)); const markers = [];
  STOPS.forEach(s => {
    const open = s.ep <= MAX_EP, isDone = done(s.n), next = open && !isDone && s.n === reached;
    const g = new THREE.Group(); g.position.set(s.p[0], s.p[1], s.p[2]); w.add(g); const mb = builder(g);
    if (!open) { markers.push(null); return; }
    const under = s.p[1] < 0, pole = under ? 2.2 - s.p[1] * 0.4 : 2; mb.cyl(0.06, 0.06, pole, under ? 0x9FF2FF : 0xFFFDF4, 0, pole / 2, 0, { line: 0.015 }); if (under) { const gl = glowSprite(0x7FE9FF, 1.8, 0.7); g.add(gl); }
    const top = pole + 0.3; mb.cyl(0.62, 0.62, 0.14, isDone ? 0xFFC94A : next ? 0xEF5B4C : 0xFFFDF4, 0, top, 0, { rx: Math.PI / 2, line: 0.03, seg: 24 });
    const num = textPlane(String(s.n), 1.2, { w: 160, h: 160, font: '120px Chewy, sans-serif', fg: isDone || next ? '#fff' : '#2E2A4F' }); num.position.set(0, top, 0.09); g.add(num);
    const back = num.clone(); back.position.z = -0.09; back.rotation.y = Math.PI; g.add(back);
    if (S.captain && S.captain[s.n]) { const an = textPlane('⚓', 0.8, { w: 128, h: 128, font: '100px sans-serif', fg: '#2E2A4F' }); an.position.set(-0.55, top + 0.6, 0.1); g.add(an); }
    if (S.stars[s.n]) { const st = textPlane('★', 0.7, { w: 128, h: 128, font: '110px sans-serif', fg: '#FFC94A' }); st.position.set(0.55, top + 0.6, 0.1); g.add(st); }
    if (next) { const gem = mb.add(new THREE.OctahedronGeometry(0.3), toon(0x5AD1FF, { emissive: 0x2AA8E8, emissiveIntensity: 0.6 }), 0, top + 1, 0, { line: 0.02 }); onTick(t => { gem.rotation.y = t * 2; gem.position.y = top + 1 + Math.sin(t * 3) * 0.15; }); }
    onTick(() => { g.rotation.y = Math.atan2(camPos().x - g.position.x, camPos().z - g.position.z); });
    g.userData.stop = s; markers.push(g);
  });
  const qm = textPlane('?', 2, { w: 160, h: 160, font: '130px Chewy, sans-serif', fg: '#FFFDF4' }); qm.position.set(66, 3.2, 8); w.add(qm); onTick(t => { qm.position.y = 3.2 + Math.sin(t) * 0.3; });
  return { markers: markers.filter(Boolean), reached };
}
let camRef = null; const camPos = () => camRef.position; export const setCamRef = c => camRef = c;

// ================================================================ stop 1: the meadow
export function buildMeadow() {
  const w = newWorld({ sky: 0x7EC8F2, ambientI: 1.45, sunI: 1.8, sunPos: [16, 22, 12], fog: [0xD3EEFA, 45, 120] }); const b = builder(w); setSeed(21);
  // rolling ground, flat where the kids play; a dip for the pond
  const hf = (x, z) => { const flat = Math.max(0, 1 - Math.max(0, Math.hypot(x, z - 1) - 7) / 6); return (nz(x, z, 0.12) * 0.35 + nz(x, z, 0.3) * 0.08) * (1 - flat * 0.85) - Math.max(0, 1 - Math.hypot(x + 9, (z + 2) * 1.3) / 3.4) * 0.9; };
  ground(w, 130, 150, hf, (x, z, c) => { const n = nz(x, z, 0.2), m = nz(x + 40, z - 20, 0.5); c.setHSL(0.26 + n * 0.02 + (m > 0.9 ? 0.04 : 0), 0.52, 0.47 + m * 0.035); });
  const sun = new THREE.Mesh(new THREE.SphereGeometry(3, 20, 12), new THREE.MeshBasicMaterial({ color: 0xFFE58A, fog: false })); sun.position.set(-25, 22, -40); w.add(sun);
  const seaG = new THREE.PlaneGeometry(260, 60); seaG.rotateX(-Math.PI / 2); water(w, seaG, { deep: 0x3FA7D6, shallow: 0x7FD0EA, scale: 1.5, sparkle: 0.5 }).position.set(0, -0.4, -62);
  // the Ferris wheel of home on the far hill, its face turned out to the sea
  ferris3(w, -24, hf(-24, -40) - 0.3, -40, 0.62, 0.15);
  // the hill with the cave: a real arched opening and a rock tunnel going back into the dark
  const R = 2.3, MZ = -8.4, TL = 9;
  { const hg = new THREE.SphereGeometry(9, 96, 48, 0, Math.PI * 2, 0, Math.PI / 2), p = hg.attributes.position, v = new THREE.Vector3(); for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const k = 1 + nz(v.x, v.z + v.y, 0.45) * 0.08 + nz(v.x * 2, v.y * 2, 0.9) * 0.035; p.setXYZ(i, v.x * k, v.y * k, v.z * k); } hg.computeVertexNormals();
    const hm = rockMat(0xA9A3A0, 0.22); hm.side = THREE.DoubleSide; const old = hm.onBeforeCompile; hm.onBeforeCompile = sh => { old(sh); sh.fragmentShader = sh.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\n float grassy = smoothstep(0.55, 0.8, vRN.y + sin(vRW.x * 1.7) * 0.08 + sin(vRW.z * 2.3) * 0.06); diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.42, 0.72, 0.33), grassy);')
      .replace('void main() {', 'void main() {\n if (length(vec2(vRW.x, vRW.y + 0.1)) < ' + (R - 0.05).toFixed(2) + ' && vRW.z > ' + (MZ - TL).toFixed(1) + ') discard;'); };
    const hill = new THREE.Mesh(hg, hm); hill.scale.set(1.35, 0.8, 1); hill.position.set(0, -1.2, MZ - 8.2); hill.castShadow = hill.receiveShadow = true; w.add(hill); }
  { const pos = [], idx = [], NA = 28, NZ = 18; for (let j = 0; j <= NZ; j++) for (let i = 0; i <= NA; i++) { const a = Math.PI * i / NA, z = MZ + 0.4 - (TL + 0.4) * j / NZ, k = 1 + nz(i, j, 0.9) * 0.06; pos.push(Math.cos(a) * R * k, Math.sin(a) * R * k - 0.1, z); }
    for (let j = 0; j < NZ; j++) for (let i = 0; i < NA; i++) { const a2 = j * (NA + 1) + i, b2 = a2 + NA + 1; idx.push(a2, b2, a2 + 1, a2 + 1, b2, b2 + 1); }
    const tg = new THREE.BufferGeometry(); tg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); tg.setIndex(idx); tg.computeVertexNormals();
    const deep = m => { const o = m.onBeforeCompile; m.onBeforeCompile = sh => { o(sh); sh.fragmentShader = sh.fragmentShader.replace('#include <dithering_fragment>', '#include <dithering_fragment>\n gl_FragColor.rgb *= mix(0.04, 1.0, smoothstep(' + (MZ - TL + 1).toFixed(1) + ', ' + (MZ + 0.3).toFixed(1) + ', vRW.z));'); }; return m; };
    const tm = deep(rockMat(0x8E8A86, 0.4)); tm.side = THREE.DoubleSide; w.add(new THREE.Mesh(tg, tm));
    const fl = new THREE.PlaneGeometry(R * 2, TL + 0.4, 6, 12); fl.rotateX(-Math.PI / 2); const fm = new THREE.Mesh(fl, deep(rockMat(0x8A7A66, 0.5))); fm.position.set(0, 0.03, MZ - TL / 2 + 0.2); fm.receiveShadow = true; w.add(fm);
    const end = new THREE.Mesh(new THREE.CircleGeometry(R + 0.1, 24, 0, Math.PI), new THREE.MeshBasicMaterial({ color: 0x05060C })); end.position.set(0, -0.1, MZ - TL + 0.05); w.add(end); }
  const mouth = new THREE.Group(); mouth.position.set(0, 0, MZ); w.add(mouth);
  for (let i = 0; i < 4; i++) crystalCluster(w, (i % 2 ? 1 : -1) * rr(1.1, 1.6), 0, MZ - 2 - i * 1.6, { n: 5, size: rr(0.3, 0.5), light: i % 2 === 0 });
  const am = rockMat(0xB0ABA6, 0.35);
  mesh(w, lumpy(1.0, 2, 0.2, 0.55), am, 0.1, R + 1.6, MZ - 0.2, { sc: [2, 0.75, 1.1] });
  [[-R - 2.0, MZ - 0.3], [R + 2.1, MZ - 0.5]].forEach(([x, z]) => mesh(w, lumpy(1.1, 2, 0.2, 1.8), am, x, 1.1, z, { ry: rnd() * 6 }));
  for (let i = 0; i < 9; i++) { const a = rnd() * Math.PI, r = rr(6, 11), x = Math.cos(a) * r * 1.3; if (Math.abs(x) < 4.6) continue; mesh(w, lumpy(rr(0.6, 1.2), 2, 0.25, 0.75), am, x, rr(0.2, 1.2), MZ - 8.2 + Math.sin(a) * r * 0.75 + 2, { ry: rnd() * 6 }); }
  // letters go on the stones that frame the cave mouth (for spelling)
  const stones = []; for (let i = 0; i < 8; i++) { const a = Math.PI * (0.06 + 0.88 * i / 7), r = R + 0.75; const st = mesh(w, lumpy(0.55, 2, 0.22, 0.8), am, Math.cos(a) * r * 1.05, Math.sin(a) * r - 0.1, MZ + 0.25, { ry: rnd() * 6 }); st.scale.z = 0.7; stones.push(st); }
  // the pond and the bushes (where the other tracks go)
  const pondG = new THREE.CircleGeometry(3.1, 40); pondG.rotateX(-Math.PI / 2); pondG.scale(1.3, 1, 1);
  water(w, pondG, { deep: 0x3FA0C8, shallow: 0x8FE0EC, foamFn: 'smoothstep(2.7, 3.1, length((vW.xz - vec2(-9.0, -2.0)) * vec2(0.77, 1.0)))' }).position.set(-9, -0.05, -2);
  scatter(w, 'rock_small', Array.from({ length: 12 }, (_, i) => { const a = i / 12 * 6.28; return { x: -9 + Math.cos(a) * 4.1, z: -2 + Math.sin(a) * 3.2, s: rr(0.5, 0.9), dy: -0.1 }; }), { gy: hf });
  scatter(w, 'bush_large', [{ x: 9, z: -3.5, s: 1.5 }, { x: 10.4, z: -2.6, s: 1.2 }, { x: 8.4, z: -2, s: 1.1 }], { gy: hf });
  // woods round the meadow, flowers, mushrooms, logs
  const free = (x, z) => Math.hypot(x, z - 1) > 8 && Math.hypot(x + 9, z + 2) > 4.6 && Math.hypot(x, (z - MZ + 8) * 1.3) > 12.5 && !(Math.abs(x) < 6 && z < -5 && z > -10) && Math.hypot(x - 9, z + 3) > 3;
  const sp = (rmin, rmax) => { for (let k = 0; k < 200; k++) { const a = rnd() * 6.28, r = rr(rmin, rmax), x = Math.cos(a) * r, z = Math.sin(a) * r + 2; if (free(x, z)) return [x, z]; } return null; };
  const trees = { tree_oak: [], tree_fat: [], tree_pine: [], tree_pine_tall: [], tree_autumn: [] }, tk = Object.keys(trees);
  for (let i = 0; i < 60; i++) { const q = sp(14, 40); if (q && !(q[1] > 10 && Math.abs(q[0]) < 12)) trees[tk[i % 5]].push({ x: q[0], z: q[1], s: rr(1.9, 3.2), sy: rr(0.9, 1.25) }); }
  for (const k in trees) scatter(w, k, trees[k], { gy: hf });
  const bushes = []; for (let i = 0; i < 22; i++) { const q = sp(9, 26); if (q) bushes.push({ x: q[0], z: q[1], s: rr(0.9, 1.6) }); }
  scatter(w, 'bush', bushes.filter((_, i) => i % 2), { gy: hf }); scatter(w, 'bush_large', bushes.filter((_, i) => !(i % 2)), { gy: hf });
  const fl = []; for (let d = 0; d < 14; d++) { const q = sp(6, 22); if (!q) continue; const col = pick(PAL.bloom); for (let i = 0; i < 16; i++) { const a = rnd() * 6.28, r = Math.sqrt(rnd()) * 2.2, x = q[0] + Math.cos(a) * r, z = q[1] + Math.sin(a) * r; if (free(x, z)) fl.push({ x, z, s: rr(0.45, 0.8), col }); } }
  scatter(w, 'flower_red', fl, { gy: hf, shadow: false });
  scatter(w, 'mushroom_red', Array.from({ length: 14 }, () => { const q = sp(8, 24) || [12, 12]; return { x: q[0], z: q[1], s: rr(0.5, 1.1) }; }), { gy: hf, shadow: false });
  scatter(w, 'log', [{ x: 11, z: 6, s: 1, ry: 0.4 }, { x: -12, z: 9, s: 0.9 }], { gy: hf, norm: 3 }); scatter(w, 'stump', [{ x: 12, z: 10 }, { x: -13, z: 2 }], { gy: hf, norm: 1.3 });
  // three trails of paw prints, all starting near the kids
  const trail = (to, size, color, n, wob) => {
    const g = new THREE.Group(); w.add(g); const from = new THREE.Vector3(0, 0, 3), end = new THREE.Vector3(...to);
    for (let i = 1; i <= n; i++) { const k = i / (n + 1), p = from.clone().lerp(end, k); p.x += Math.sin(i * 1.3) * wob;
      const side = i % 2 ? 1 : -1, dir = Math.atan2(end.x - from.x, end.z - from.z);
      const pad = new THREE.Mesh(new THREE.CircleGeometry(size, 12), new THREE.MeshBasicMaterial({ color })); pad.rotation.x = -Math.PI / 2; pad.scale.set(0.8, 1, 1);
      const px = p.x + Math.cos(dir) * side * size * 1.4, pz = p.z - Math.sin(dir) * side * size * 1.4; pad.position.set(px, hf(px, pz) + 0.05, pz); g.add(pad);
      [-1, 0, 1].forEach(t => { const toe = new THREE.Mesh(new THREE.CircleGeometry(size * 0.38, 8), pad.material); toe.rotation.x = -Math.PI / 2;
        toe.position.set(pad.position.x + Math.sin(dir) * size * 1.15 + Math.cos(dir) * t * size * 0.6, pad.position.y, pad.position.z + Math.cos(dir) * size * 1.15 - Math.sin(dir) * t * size * 0.6); g.add(toe); }); }
    const len = from.distanceTo(end); const hit = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.3, len), new THREE.MeshBasicMaterial({ visible: false }));
    hit.position.copy(from).lerp(end, 0.5); hit.lookAt(end.x, 0, end.z); g.add(hit); g.userData.hit = hit; g.userData.line = [from, end]; return g;
  };
  const trails = { fox: trail([-8.5, 0, -1], 0.17, 0x6B5A3A, 9, 0.4), toby: trail([0, 0, MZ - 0.2], 0.12, 0x5A4630, 12, 0.6), bigdog: trail([8.2, 0, -1.6], 0.27, 0x55452E, 8, 0.3) };
  // short swaying grass everywhere except on the tracks, the pond and the cave floor
  const offTrail = (x, z) => Object.values(trails).every(t => { const [a, e] = t.userData.line, d = new THREE.Vector3(x, 0, z), ab = e.clone().sub(a), k = Math.max(0, Math.min(1, d.clone().sub(a).dot(ab) / ab.lengthSq())); return d.distanceTo(a.clone().addScaledVector(ab, k)) > 0.75; });
  grass(w, small ? 9000 : 20000, () => { const a = rnd() * 6.28, r = Math.pow(rnd(), 0.7) * 30, x = Math.cos(a) * r, z = Math.sin(a) * r + 3; if (Math.hypot(x + 9, (z + 2) * 1.3) < 4.2) return null; if (Math.abs(x) < R + 0.4 && z < MZ + 0.6) return null; if (Math.hypot(x, (z - MZ + 8) * 1.3) < 11.5 && z < MZ) return null; return offTrail(x, z) ? [x, z, Math.hypot(x, z - 3) < 9 ? 0.55 : 1] : null; }, hf);
  const cast = makeCast(w);
  cast.leo.g.position.set(-1.2, 0, 5); cast.mia.g.position.set(1.2, 0, 5.2); cast.toby.g.position.set(0.2, 0, 3.6);
  clouds(w, 9, 22, 32, -50);
  return { w, cast, trails, stones, mouth };
}

// ================================================================ stop 2: the glowing stone chamber
export function buildChamber() {
  const w = newWorld({ sky: 0x06070D, ambient: 0x8090C0, ambientI: 0.3, sunI: 0.0 }); const b = builder(w); setSeed(23);
  // where the track leaves the room: a real tunnel through the wall (placed where the track ends once the floor has tipped)
  const TE = new THREE.Vector3(7.5, 0, -12.6).applyEuler(new THREE.Euler(-0.09, 0, -0.12)), TD = new THREE.Vector3(0.2, 0, -1).normalize(), TR = 2.3;
  const shellM = rockMat(0x7A7E92, 0.12); shellM.side = THREE.BackSide; { const o = shellM.onBeforeCompile; shellM.onBeforeCompile = sh => { o(sh); sh.fragmentShader = sh.fragmentShader.replace('void main() {', `void main() {\n { vec3 d = vRW - vec3(${TE.x.toFixed(2)}, ${TE.y.toFixed(2)}, ${TE.z.toFixed(2)}); float along = dot(d, vec3(${TD.x.toFixed(3)}, 0.0, ${TD.z.toFixed(3)})); vec3 perp = d - along * vec3(${TD.x.toFixed(3)}, 0.0, ${TD.z.toFixed(3)}); if (along > -3.0 && length(vec2(length(perp.xz), perp.y + 0.1)) < ${(TR - 0.05).toFixed(2)} && perp.y > -0.6) discard; }`); }; }
  const sg = new THREE.SphereGeometry(14, 64, 40); { const p = sg.attributes.position, v = new THREE.Vector3(); for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const k = 1 + nz(v.x * 0.5, v.z * 0.5 + v.y, 0.35) * 0.06 + nz(v.x, v.y * 2, 0.8) * 0.03; p.setXYZ(i, v.x * k, v.y * k, v.z * k); } sg.computeVertexNormals(); }
  const shell = new THREE.Mesh(sg, shellM); shell.scale.set(1.2, 0.55, 1); shell.position.y = 2; w.add(shell);
  const floorG = new THREE.Group(); w.add(floorG); const fb = builder(floorG);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(13, 60), rockMat(0x8A8698, 0.3)); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; floorG.add(floor);
  { const rm = rockMat(0x7C7F90, 0.4); for (let i = 0; i < 30; i++) { const a = rnd() * Math.PI * 2, r = 8.5 + rnd() * 4; if (Math.hypot(Math.cos(a) * r - 7.2, Math.sin(a) * r + 12) < 4) continue; mesh(floorG, lumpy(0.4 + rnd() * 0.8, 2, 0.25, 0.8), rm, Math.cos(a) * r, 0.2, Math.sin(a) * r, { ry: rnd() * 6 }); } }
  // a few dim crystals in the walls
  [[-9, 1.4, -6], [-6, 3.2, -10], [9.5, 2.0, -3], [-11, 0.6, 2], [10.5, 0.8, 4]].forEach(([x, y, z]) => crystalCluster(floorG, x, y, z, { n: 4, size: 0.35, light: false }));
  // stalactites hanging from the roof (some can break off)
  const stalM = rockMat(0x7A7E92, 0.6); const stal = []; for (let i = 0; i < 22; i++) { const a = rnd() * Math.PI * 2, r = 2 + rnd() * 9; const h2 = 1.2 + rnd() * 1.8, cg = new THREE.ConeGeometry(0.22 + rnd() * 0.25, h2, 7, 3); { const p = cg.attributes.position; for (let k = 0; k < p.count; k++) p.setX(k, p.getX(k) + Math.sin(p.getY(k) * 4 + i) * 0.03); cg.computeVertexNormals(); }
    const st = mesh(w, cg, stalM, Math.cos(a) * r, 7.3 - h2 / 2 + 0.4, Math.sin(a) * r, { rx: Math.PI }); st.userData.h = h2; stal.push(st); }
  // the stone on its rock
  const ped = mesh(floorG, lumpy(0.9, 2, 0.2, 0.75), rockMat(0x8A8C9E, 0.5), 0, 0.5, -5, { sc: [1.2, 0.7, 1] });
  const gemG = new THREE.Group(); { const body = new THREE.CylinderGeometry(0.2, 0.17, 0.5, 6); body.translate(0, 0.25, 0); const tip = new THREE.CylinderGeometry(0.001, 0.2, 0.28, 6); tip.translate(0, 0.64, 0); const bot = new THREE.CylinderGeometry(0.17, 0.001, 0.16, 6); bot.translate(0, -0.08, 0);
    const gm = toon(0xBFF3FF, { emissive: 0x2AA8E8, emissiveIntensity: 0.9 }); [body, tip, bot].forEach(gg => mesh(gemG, gg, gm, 0, 0, 0, { shadow: false })); const gs = glowSprite(0x7FE9FF, 1.6, 0.6); gs.position.y = 0.3; gemG.add(gs); }
  const gem = gemG; gem.position.set(0, 1.08, -5); floorG.add(gem);
  const gemLight = new THREE.PointLight(0x5AD1FF, 0, 14, 1.5); gemLight.position.set(0, 1.8, -5); w.add(gemLight);
  onTick(t => { gem.rotation.y = t; });
  // flashlight (follows her finger)
  const spot = new THREE.SpotLight(0xFFF2CC, 60, 30, 0.32, 0.5, 1.2); spot.position.set(0, 3, 8); w.add(spot); w.add(spot.target);
  // one curved track from the cart to the dark tunnel in the wall
  const track = new THREE.CatmullRomCurve3([[2.2, 0, 2.2], [3.2, 0, -0.4], [4.4, 0, -3.4], [5.8, 0, -6.6], [6.9, 0, -9.6], [7.5, 0, -12.6]].map(p => new THREE.Vector3(...p)));
  const up = new THREE.Vector3(0, 1, 0), tf = t => { const p = track.getPointAt(t), tg = track.getTangentAt(t), side = new THREE.Vector3().crossVectors(tg, up).normalize(); return { p, tg, side }; };
  const railMat = toon(0x9DA3B3, { emissive: 0x15171C });
  [-0.55, 0.55].forEach(o => { const rp = []; for (let i = 0; i <= 60; i++) { const { p, side } = tf(i / 60); rp.push(p.clone().addScaledVector(side, o).setY(0.14)); } floorG.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rp), 120, 0.055, 6), railMat)); });
  for (let i = 0; i <= 30; i++) { const { p, tg } = tf(i / 30); const tie = fb.rbox(1.7, 0.1, 0.28, i % 3 ? 0x8B5E3C : 0x6E4529, p.x, 0.05, p.z, { line: 0.012 }); tie.rotation.y = Math.atan2(tg.x, tg.z) + Math.PI / 2; }
  const theCart = cart(builder(floorG), 0, 0, 0);
  const placeCart = t => { const { p, tg } = tf(t); theCart.position.set(p.x, 0.02, p.z); theCart.rotation.y = Math.atan2(tg.x, tg.z); };
  placeCart(0.1);
  // the tunnel mouth where the track ends
  { const tm = new THREE.Group(); tm.position.copy(TE); tm.rotation.y = Math.atan2(TD.x, TD.z) + Math.PI; w.add(tm); const TL = 9;
    const pos = [], idx = [], NA = 24, NZ = 16; for (let j = 0; j <= NZ; j++) for (let i = 0; i <= NA; i++) { const a = Math.PI * i / NA, z = 3 - (TL + 3) * j / NZ, k = 1 + nz(i, j, 0.9) * 0.06; pos.push(Math.cos(a) * TR * k, Math.sin(a) * TR * k - 0.1, z); }
    for (let j = 0; j < NZ; j++) for (let i = 0; i < NA; i++) { const a2 = j * (NA + 1) + i, b2 = a2 + NA + 1; idx.push(a2, b2, a2 + 1, a2 + 1, b2, b2 + 1); }
    const tg2 = new THREE.BufferGeometry(); tg2.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); tg2.setIndex(idx); tg2.computeVertexNormals();
    const fade = m => { const o = m.onBeforeCompile; m.onBeforeCompile = sh => { o(sh); sh.vertexShader = sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vLz = position.z;'); sh.vertexShader = 'varying float vLz;\n' + sh.vertexShader; sh.fragmentShader = 'varying float vLz;\n' + sh.fragmentShader.replace('#include <dithering_fragment>', '#include <dithering_fragment>\n gl_FragColor.rgb *= mix(0.03, 1.0, smoothstep(-' + (TL - 1) + '.0, 0.5, vLz));'); }; return m; };
    const twm = fade(rockMat(0x7A7E92, 0.4)); twm.side = THREE.DoubleSide; tm.add(new THREE.Mesh(tg2, twm));
    const tfl = new THREE.PlaneGeometry(TR * 2, TL + 3, 4, 10); tfl.rotateX(-Math.PI / 2); tfl.translate(0, 0.02, -(TL + 3) / 2 + 3); tm.add(new THREE.Mesh(tfl, fade(rockMat(0x8A8698, 0.4))));
    const tback = new THREE.Mesh(new THREE.CircleGeometry(TR + 0.1, 20, 0, Math.PI), new THREE.MeshBasicMaterial({ color: 0x020205 })); tback.position.z = -TL + 0.05; tm.add(tback);
    // the rails carry on into the tunnel
    [-0.55, 0.55].forEach(o => { const r = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, TL + 3), toon(0x9DA3B3)); r.position.set(o, 0.14, -(TL + 3) / 2 + 3); tm.add(r); });
    for (let i = 0; i < 14; i++) { const t2 = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.1, 0.28), toon(0x6E4529)); t2.position.set(0, 0.05, 2.5 - i * 0.85); tm.add(t2); }
    // timber frame round the mouth
    const fb2 = builder(tm); [-1, 1].forEach(sd => fb2.rbox(0.36, 3.0, 0.36, 0x6E4529, sd * (TR - 0.15), 1.4, 0.4, { line: 0.02 })); fb2.rbox(TR * 2 + 0.6, 0.4, 0.44, 0x8B5E3C, 0, 2.9, 0.4, { line: 0.02 }); }
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
  const looseM = rockMat(0x8E90A2, 0.6); const loose = []; [[-0.4, 3.9, -2.4], [0.9, 4.3, -3.0], [2.2, 3.8, -2.2], [3.4, 4.2, -2.8], [1.5, 3.5, -1.4], [-1.5, 4.1, -2.9]].forEach(([x, y, z]) => { const r = mesh(w, lumpy(0.45, 2, 0.2, 0.85), looseM, x, y, z); loose.push(r); });
  // words hidden on the cave walls: only seen in the flashlight beam
  const words = [];
  const place = (text, x, y, z) => { const m = textPlane(text, 2.4, { w: 512, h: 150, font: '82px Chewy, sans-serif', fg: '#BFF3FF', glow: '#5AD1FF' }); m.position.set(x, y, z); m.lookAt(0, y, 0); m.material.opacity = 0; m.userData.word = text; w.add(m); words.push(m); return m; };
  // real falling rocks: gravity, a bounce, dust
  const drop = (x, z, size = 0.35, y = 6.8, onHit) => {
    const r = mesh(w, lumpy(size, 1, 0.22, 0.9), looseM, x, y, z); const v = new THREE.Vector3((rnd() - 0.5) * 0.6, 0, (rnd() - 0.5) * 0.6); let hits = 0;
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
  const tg = new THREE.TubeGeometry(path, 240, 3.2, 20); { const p = tg.attributes.position, v = new THREE.Vector3(); for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const k = nz(v.x * 1.3, v.z * 0.7 + v.y, 0.5) * 0.28 + nz(v.y * 2, v.z, 0.9) * 0.12; p.setXYZ(i, v.x + k, v.y + k * 0.6, v.z); } tg.computeVertexNormals(); }
  const tm2 = rockMat(0x8A8678, 0.32); tm2.side = THREE.BackSide; const tube = new THREE.Mesh(tg, tm2); tube.receiveShadow = true; w.add(tube); setSeed(31);
  // rails + ties
  const L = path.getLength(), up = new THREE.Vector3(0, 1, 0);
  const frame = s => { const p = path.getPointAt(s), t = path.getTangentAt(s), side = new THREE.Vector3().crossVectors(t, up).normalize(); return { p, t, side }; };
  const railMat = toon(0x9DA3B3, { emissive: 0x15171C }), tieMat = toon(0x6E4529), tieMat2 = toon(0x8B5E3C); let ti = 0;
  for (let d = 0; d < L * 0.985; d += 0.9) { const { p, t } = frame(d / L); const tie = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.12, 0.26), ti++ % 3 ? tieMat : tieMat2); tie.position.copy(p).y -= 2.6; tie.lookAt(p.clone().add(t).setY(p.y - 2.6 + t.y)); w.add(tie); }
  // timber supports holding the roof up every few metres
  for (let s0 = 0.03; s0 < 0.95; s0 += 0.055) { if ([0.22, 0.47, 0.72].some(j => Math.abs(s0 - j - 0.02) < 0.035)) continue; const { p, t, side } = frame(s0), g2 = new THREE.Group(); g2.position.copy(p).y -= 2.6; g2.lookAt(g2.position.clone().add(t)); w.add(g2); const fb3 = builder(g2);
    [-1, 1].forEach(sd => fb3.rbox(0.28, 3.6, 0.28, 0x6E4529, sd * 2.25, 1.8, 0, { line: 0.02 })); fb3.rbox(4.9, 0.32, 0.34, 0x8B5E3C, 0, 3.55, 0, { line: 0.02 }); }
  [-0.38, 0.38].forEach(o => { const rp = []; for (let i = 0; i <= 200; i++) { const s = i / 200 * 0.985; const { p, side } = frame(s); rp.push(p.clone().addScaledVector(side, o).setY(p.y - 2.45)); }
    w.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rp), 300, 0.05, 5), railMat)); });
  // lanterns
  { let k = 0; for (let s = 0.03; s < 0.95; s += 0.055) { const { p, side } = frame(s); const lp = p.clone().addScaledVector(side, k % 2 ? 1.95 : -1.95).setY(p.y + 0.15); lantern(w, lp.x, lp.y, lp.z, { light: k % 2 === 0 }); k++; } }
  motes(w, 160, [-8, -40, -125], [8, 4, 0], 0xFFE2B0, 0.05);
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
