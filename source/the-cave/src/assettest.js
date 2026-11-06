// Asset test v2: free CC0 models (Quaternius / Kenney) restyled to our toon look, instanced by the hundreds, plus a code-built meadow, Ferris wheel and cave.
import { THREE, init, newWorld, onTick, setCam, toon, renderer, camera } from './gfx.js';
import { glowTex, cloudTex } from './effects.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { makeCast } from './chars.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

init(document.body);
const world = newWorld({ sky: 0x7EC8F2, fog: [0xD3EEFA, 80, 260], ambient: 0xFFFFFF, ambientI: 1.45, sun: 0xFFF0D6, sunI: 1.8, sunPos: [30, 40, 22] });
renderer.shadowMap.enabled = true;
setCam([0, 14, 58], [0, 7, 0]);
let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647, rr = (a, b) => a + (b - a) * rnd(), pick = a => a[Math.floor(rnd() * a.length)];
const small = innerWidth < 800;
const nz = (x, z, f) => Math.sin(x * f + 1.3) * Math.cos(z * f * 1.1 - 0.7) + Math.sin((x + z) * f * 0.6 + 2) * 0.5; // cheap smooth noise ~[-1.5,1.5]
const CAVE = { x: 0, z: -42 }, WHEEL = { x: -56, z: -100 }; // same layout as scene one, scaled up about 3x so the kids have room

// ---------------------------------------------------------------- ground
const H = (x, z) => nz(x, z, 0.04) * 1.8 + nz(x, z, 0.11) * 0.45;
const flatAt = (x, z) => Math.max(Math.max(0, 1 - Math.max(0, Math.hypot(x - WHEEL.x, z - WHEEL.z) - 14) / 12), Math.max(0, 1 - Math.max(0, Math.hypot(x, z - 10) - 20) / 14));
const gy = (x, z) => H(x, z) * (1 - flatAt(x, z) * 0.95) - Math.min(1, Math.max(0, (-z - 118) / 14)) * 4.5;
const gGeo = new THREE.PlaneGeometry(420, 420, 140, 140); gGeo.rotateX(-Math.PI / 2);
{ const p = gGeo.attributes.position, col = new Float32Array(p.count * 3), c = new THREE.Color();
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i); p.setY(i, gy(x, z)); const n = nz(x, z, 0.05), m = nz(x + 40, z - 20, 0.13);
    c.setHSL(0.26 + n * 0.018 + (m > 0.9 ? 0.04 : 0), 0.52 + n * 0.05, 0.47 + m * 0.035); col.set([c.r, c.g, c.b], i * 3); }
  gGeo.setAttribute('color', new THREE.BufferAttribute(col, 3)); gGeo.computeVertexNormals(); }
const ground = new THREE.Mesh(gGeo, toon(0xffffff, { vertexColors: true })); ground.receiveShadow = true; world.add(ground);

// ---------------------------------------------------------------- dirt path from the foreground, past the wheel, to the cave
const pathCurve = new THREE.CatmullRomCurve3([[8, 70], [-4, 46], [5, 26], [-3, 4], [3, -12], [0, -26]].map(([x, z]) => new THREE.Vector3(x, 0, z)));
const pathPts = pathCurve.getSpacedPoints(90), onPath = (x, z, w = 4) => pathPts.some(q => Math.hypot(q.x - x, q.z - z) < w);
{ const pos = [], idx = [], col = []; pathPts.forEach((q, i) => { const t = pathCurve.getTangent(Math.min(1, i / 90)), nx = -t.z, nz2 = t.x, w = 2.6 + Math.sin(i * 0.4) * 0.5;
    [-1, 1].forEach(sd => { const x = q.x + nx * w * sd, z = q.z + nz2 * w * sd; pos.push(x, gy(x, z) + 0.06, z); const k = 0.78 + Math.sin(i * 1.3 + sd) * 0.04; col.push(0.82 * k, 0.66 * k, 0.45 * k); });
    if (i < 90) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } });
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals();
  const m = new THREE.Mesh(g, toon(0xffffff, { vertexColors: true, side: THREE.DoubleSide })); m.receiveShadow = true; world.add(m); }

// ---------------------------------------------------------------- grass: thousands of little tufts, swaying in the wind
const wind = { value: 0 };
{ const pos = [], col = [], idx = []; let v = 0;
  for (let b = 0; b < 5; b++) { const a = b / 5 * Math.PI * 2 + rnd(), h = rr(0.55, 1.15), w = rr(0.05, 0.085), bend = rr(0.08, 0.28), ox = rr(-0.12, 0.12), oz = rr(-0.12, 0.12), cx = Math.cos(a), cz = Math.sin(a), sx = -cz, sz = cx;
    const P = (u, y, s) => pos.push(ox + cx * u + sx * s, y, oz + cz * u + sz * s);
    P(0, 0, -w); P(0, 0, w); P(bend * 0.35, h * 0.5, -w * 0.7); P(bend * 0.35, h * 0.5, w * 0.7); P(bend, h, 0); col.push(0.42, 0.55, 0.3, 0.42, 0.55, 0.3, 0.8, 0.9, 0.7, 0.8, 0.9, 0.7, 1.1, 1.15, 0.95);
    idx.push(v, v + 1, v + 3, v, v + 3, v + 2, v + 2, v + 3, v + 4); v += 5; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals();
  const mat = toon(0xffffff, { vertexColors: true, side: THREE.DoubleSide });
  mat.onBeforeCompile = sh => { sh.uniforms.uT = wind; sh.vertexShader = 'uniform float uT;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n float sw = sin(uT * 1.7 + instanceMatrix[3].x * 0.35 + instanceMatrix[3].z * 0.22); transformed.x += sw * position.y * position.y * 0.16; transformed.z += cos(uT * 1.3 + instanceMatrix[3].z * 0.3) * position.y * position.y * 0.1;'); };
  const N = small ? 14000 : 34000, m = new THREE.InstancedMesh(g, mat, N), d = new THREE.Object3D(), c = new THREE.Color(); let k = 0;
  while (k < N) { const a = rnd() * 6.28, r = Math.pow(rnd(), 0.62) * 125, x = Math.cos(a) * r, z = Math.sin(a) * r; if (z < -120 || onPath(x, z, 2.7) || Math.hypot(x - WHEEL.x, z - WHEEL.z) < 3.5) continue;
    d.position.set(x, gy(x, z), z); d.rotation.set(0, rnd() * 6.28, 0); const patch = nz(x, z, 0.09), sc = (1.0 + patch * 0.35) * rr(0.8, 1.7) * (r > 80 ? 1.4 : 1); d.scale.set(sc, sc * rr(0.9, 1.5), sc); d.updateMatrix(); m.setMatrixAt(k, d.matrix);
    c.setHSL(0.25 + patch * 0.035 + rr(-0.012, 0.012), 0.62, 0.52 + patch * 0.05 + rr(-0.05, 0.06)); m.setColorAt(k, c); k++; }
  m.frustumCulled = false; m.receiveShadow = true; world.add(m); }

// ---------------------------------------------------------------- models
const loader = new GLTFLoader(); loader.setMeshoptDecoder(MeshoptDecoder);
const raw = {}; const loadRaw = n => raw[n] || (raw[n] = new Promise(res => loader.load((window.__ASSETS && window.__ASSETS[n]) || ('assets/' + n + '.glb'), g => res(g.scene), undefined, e => { console.error('LOADFAIL ' + n); res(null); })));
const INK = new THREE.MeshBasicMaterial({ color: 0x2E2A4F, side: THREE.BackSide });
INK.onBeforeCompile = sh => { sh.vertexShader = sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n float sc = length(modelMatrix[0].xyz);\n#ifdef USE_INSTANCING\n sc *= length(instanceMatrix[0].xyz);\n#endif\n transformed += normalize(normal) * 0.07 / sc;'); };
const T = c => toon(c), W = toon(0xffffff);
const MATS = { trunk: T(0x8A5A3A), birch: T(0xF2EDE0), moss: T(0x6DBB5E), red: T(0xE8575A), cream: T(0xF6EBD0), crys: toon(0x9FEFFF, { emissive: 0x4FD8FF, emissiveIntensity: 0.9 }), leaf: W, stone: W, bloom: W };
const PAL = { leaf: [0x5FBF5A, 0x7BCB5E, 0x4FAE6A, 0x8FD05C, 0x6BC48A, 0x58B86B, 0x9BD662], pine: [0x3E9A63, 0x4BA672, 0x35875A, 0x2F8A6A], autumn: [0xF2A33B, 0xE9693B, 0xF6C94C, 0xD9532F], stone: [0xA7AFC2, 0x9AA3B8, 0xB4B9C9, 0xA9A6B5, 0x8E98AE], bloom: [0xFF8FB5, 0xFFD36B, 0xB79CFF, 0xFFFFFF, 0xFF9A62, 0x8FD7FF], crys: [0x7FE9FF, 0xB48CFF, 0x9FFFE0] };
// which material (and which colour palette, if any) each part of each model gets
function partStyle(name, mn, orig) {
  if (/^(tree|bush)/.test(name)) { if (mn === 'woodBirch') return [MATS.birch]; if (/wood/i.test(mn)) return [MATS.trunk]; return [MATS.leaf, name.includes('autumn') ? 'autumn' : name.includes('pine') ? 'pine' : 'leaf']; }
  if (name.startsWith('rock') || name === 'crystal_rock') return mn === 'crystal' ? [MATS.crys, 'crys'] : mn === 'grass' ? [MATS.moss] : [MATS.stone, 'stone'];
  if (name === 'crystal') return [MATS.crys, 'crys'];
  if (name === 'flower_red') return mn === 'grass' ? [MATS.moss] : [MATS.bloom, 'bloom'];
  if (name === 'log' || name === 'stump') return /bark/i.test(mn) ? [MATS.trunk] : [MATS.cream];
  if (name === 'mushroom_red') return mn === 'colorRed' ? [MATS.red] : [MATS.cream];
  return [T(orig.color ? orig.color.clone() : 0xffffff)];
}
// place many copies of one model as a handful of instanced meshes (+ an ink-outline copy of each)
async function scatter(name, items, { shadow = true, norm = 0 } = {}) {
  const src = await loadRaw(name); if (!src || !items.length) return; src.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(src), minY = box.min.y, bsz = box.getSize(new THREE.Vector3()), F = norm ? norm / Math.max(bsz.x, bsz.y, bsz.z) : 1, parts = []; src.traverse(m => { if (m.isMesh) parts.push(m); });
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), V3 = new THREE.Vector3(), SC = new THREE.Vector3();
  const cols = items.map(() => ({}));
  for (const m of parts) { const [mat, pal] = partStyle(name, m.material.name, m.material), im = new THREE.InstancedMesh(m.geometry, mat, items.length), ink = new THREE.InstancedMesh(m.geometry, INK, items.length);
    items.forEach((it, i) => { const s = (it.s ?? 1) * F, sy = (it.sy ?? 1) * s; Q.setFromEuler(new THREE.Euler(it.rx ?? 0, it.ry ?? rnd() * 6.28, it.rz ?? 0)); M.compose(V3.set(it.x, (it.y ?? gy(it.x, it.z)) - minY * sy + (it.dy ?? 0), it.z), Q, SC.set(s, sy, s)); M.multiply(m.matrixWorld);
      im.setMatrixAt(i, M); ink.setMatrixAt(i, M); if (pal) { cols[i][pal] ??= new THREE.Color(it.col ?? pick(PAL[pal])); im.setColorAt(i, cols[i][pal]); } });
    im.castShadow = shadow; im.receiveShadow = true; im.frustumCulled = false; ink.frustumCulled = false; world.add(im, ink); }
}
const at = (n, f) => Array.from({ length: n }, f);
const free = (x, z, pad = 5) => !onPath(x, z, pad) && Math.hypot(x - WHEEL.x, z - WHEEL.z) > 18 && Math.hypot(x - CAVE.x, z - (CAVE.z + 12)) > 17 && !(z < -50 && Math.abs(x) < 60) && z > -118;
const spot = (rMin, rMax, pad = 5) => { for (;;) { const a = rnd() * 6.28, r = rr(rMin, rMax), x = Math.cos(a) * r, z = Math.sin(a) * r; if (free(x, z, pad)) return [x, z]; } };

(async () => { try {
  // ---- woods: groves of mixed trees, big at the back, small in front, never on the path
  const groves = at(11, () => { const [x, z] = spot(46, 105, 1); return { x, z, r: rr(10, 20), pine: rnd() < 0.5 }; });
  const treeSpots = []; groves.forEach(g => { const n = Math.floor(g.r * 1.7); for (let i = 0; i < n; i++) { const a = rnd() * 6.28, r = Math.sqrt(rnd()) * g.r, x = g.x + Math.cos(a) * r, z = g.z + Math.sin(a) * r; if (free(x, z, 4.5)) treeSpots.push({ x, z, kind: g.pine ? (rnd() < 0.7 ? 'pine' : 'oak') : (rnd() < 0.15 ? 'pine' : 'oak') }); } });
  for (let i = 0; i < 46; i++) { const [x, z] = spot(26, 80, 6); treeSpots.push({ x, z, kind: 'oak' }); }
  const by = { tree_oak: [], tree_fat: [], tree_pine: [], tree_pine_tall: [], tree_autumn: [] };
  treeSpots.forEach(t => { const far = Math.hypot(t.x, t.z) > 60, s = rr(5, 9.5) * (far ? 1.15 : 0.9), it = { x: t.x, z: t.z, s, sy: rr(0.9, 1.25), rx: rr(-0.04, 0.04), rz: rr(-0.04, 0.04) };
    if (t.kind === 'pine') (rnd() < 0.45 ? by.tree_pine_tall : by.tree_pine).push(it); else (rnd() < 0.5 ? by.tree_oak : by.tree_fat).push(it); });
  for (const k in by) await scatter(k, by[k]);
  // ---- bushes: hedges along the path and clumps around trees
  const bushes = []; pathPts.forEach((q, i) => { if (i % 3) return; const t = pathCurve.getTangent(Math.min(1, i / 90)); [-1, 1].forEach(sd => { if (rnd() < 0.55) { const w = rr(4.6, 7.5); bushes.push({ x: q.x - t.z * w * sd, z: q.z + t.x * w * sd, s: rr(1.6, 3.2) }); } }); });
  for (let i = 0; i < 90; i++) { const [x, z] = spot(10, 90, 4); bushes.push({ x, z, s: rr(1.6, 3.4) }); }
  await scatter('bush', bushes.filter((_, i) => i % 2 === 0)); await scatter('bush_large', bushes.filter((_, i) => i % 2 === 1).map(b => ({ ...b, s: b.s * 0.9 })));
  // ---- wild flowers in drifts of one colour
  const flowers = []; at(26, () => { const [cx, cz] = spot(4, 60, 3), col = pick(PAL.bloom), n = Math.floor(rr(22, 46)); for (let i = 0; i < n; i++) { const a = rnd() * 6.28, r = Math.sqrt(rnd()) * rr(3, 7), x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r; if (!onPath(x, z, 2.5)) flowers.push({ x, z, s: rr(1.0, 2.2), col }); } });
  await scatter('flower_red', flowers, { shadow: false });
  // ---- mushrooms, logs, stumps, rocks scattered about
  await scatter('mushroom_red', at(46, () => { const [x, z] = spot(8, 80, 3); return { x, z, s: rr(0.9, 2.4) }; }), { shadow: false });
  await scatter('log', at(9, () => { const [x, z] = spot(10, 70, 4); return { x, z, s: rr(0.8, 1.3) }; }), { norm: 7 }); await scatter('stump', at(8, () => { const [x, z] = spot(10, 70, 4); return { x, z, s: rr(0.8, 1.3) }; }), { norm: 3 });
  await scatter('rock_small', at(60, () => { const [x, z] = spot(8, 95, 3); return { x, z, s: rr(1.4, 3.8), dy: -0.15 }; })); await scatter('rock_tall', at(10, () => { const [x, z] = spot(25, 90, 4); return { x, z, s: rr(3, 6) }; }));
  // ---- a little camp near the foreground path
  const CP = { x: -34, z: 22 }; await scatter('tent', [{ x: CP.x, z: CP.z, ry: 0.9 }], { norm: 10 }); await scatter('campfire', [{ x: CP.x + 8, z: CP.z + 5 }], { norm: 3.6 }); await scatter('log', [{ x: CP.x + 12, z: CP.z + 6, ry: 1.2 }, { x: CP.x + 5, z: CP.z + 12, ry: -0.3 }], { norm: 7 });
  const fences = []; for (let i = 0; i < 10; i++) fences.push({ x: 18 + i * 4.8, z: 8 - i * 1.2, ry: 0.25 }); await scatter('fence', fences, { norm: 5 });

  // ---- the cave: a rocky hill with a real arched opening, rock pillars and lintel, and glowing crystals deep inside
  const { x: CX, z: CZ } = CAVE, base = gy(CX, CZ), R = 5.3, mouthZ = CZ + 17;
  const hillMat = toon(0x78C65F); hillMat.onBeforeCompile = sh => { sh.vertexShader = 'varying vec3 vW;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vW = (modelMatrix * vec4(transformed, 1.0)).xyz;'); sh.fragmentShader = 'varying vec3 vW;\n' + sh.fragmentShader.replace('void main() {', `void main() { if (vW.z > ${(CZ + 3).toFixed(1)} && length(vec2(vW.x - ${CX.toFixed(1)}, max(vW.y - ${(base + 0.2).toFixed(1)}, 0.0))) < ${(R - 0.15).toFixed(1)}) discard;`); };
  const hill = new THREE.Mesh(new THREE.SphereGeometry(20, 56, 28, 0, Math.PI * 2, 0, Math.PI / 2), hillMat); hill.scale.set(1.2, 0.72, 1); hill.position.set(CX, base - 1.2, CZ); hill.castShadow = hill.receiveShadow = true; world.add(hill);
  const dark = new THREE.MeshBasicMaterial({ color: 0x0A0D20, side: THREE.DoubleSide });
  const tun = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 22, 32, 1, true, 0, Math.PI), dark); tun.rotation.set(Math.PI / 2, 0, Math.PI / 2); tun.position.set(CX, base + 0.15, CZ + 6); world.add(tun);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(R * 2, 22), new THREE.MeshBasicMaterial({ color: 0x14203A })); floor.rotation.x = -Math.PI / 2; floor.position.set(CX, base + 0.12, CZ + 6); world.add(floor);
  const back = new THREE.Mesh(new THREE.CircleGeometry(R, 32, 0, Math.PI), dark); back.position.set(CX, base + 0.15, CZ - 5); world.add(back);
  const arch = []; for (let i = 0; i <= 9; i++) { const a = Math.PI * i / 9; arch.push({ x: CX + Math.cos(a) * (R + 1.3), z: mouthZ + 0.6 + rr(-0.5, 0.5), y: base + Math.sin(a) * (R + 1.2) - 0.6, s: rr(3.4, 4.6), ry: rnd() * 6.28, sy: 0.9 }); }
  await scatter('rock_large', arch); await scatter('rock_tall', [{ x: CX - R - 2.2, z: mouthZ, s: 6.5 }, { x: CX + R + 2.4, z: mouthZ - 0.4, s: 7 }]);
  await scatter('rock_large', at(22, () => { const a = rnd() * Math.PI, r = rr(8, 17); return { x: CX + Math.cos(a) * r * 1.15, z: CZ + 2 + Math.sin(a) * r, y: base + rr(0.5, 7) * Math.max(0.1, 1 - r / 20), s: rr(3.5, 7) }; }));
  await scatter('rock_small', at(30, () => ({ x: CX + rr(-16, 16), z: mouthZ + rr(-3, 7), s: rr(1.5, 3.8) })));
  const cr = []; for (let i = 0; i < 26; i++) { const sd = i % 2 ? 1 : -1; cr.push({ x: CX + sd * rr(1.5, R - 1.3), z: CZ + rr(-3, mouthZ - 1), s: rr(1.8, 4.2), rz: rr(-0.4, 0.4) }); } await scatter('crystal', cr.slice(0, 16)); await scatter('crystal_rock', cr.slice(16));
  await scatter('crystal', at(8, () => ({ x: CX + rr(-9, 9), z: mouthZ + rr(1, 6), s: rr(1.2, 2.6), rz: rr(-0.3, 0.3) })));
  [[0x7FE9FF, 0], [0xB48CFF, -7], [0x7FE9FF, -14]].forEach(([c, dz]) => { const l = new THREE.PointLight(c, 55, 26, 1.5); l.position.set(CX, base + 3.2, mouthZ + dz - 1); world.add(l); });
  const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: 0x7FE9FF, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false })); gl.scale.set(18, 12, 1); gl.position.set(CX, base + 3, mouthZ - 3); world.add(gl);
} catch (e) { console.error('BUILDFAIL ' + e.message + ' ' + (e.stack || '').split('\n')[1]); } })();

// ---------------------------------------------------------------- Ferris wheel (code)
const FW = new THREE.Group(); FW.position.set(WHEEL.x, gy(WHEEL.x, WHEEL.z), WHEEL.z); FW.rotation.y = 0.35; FW.scale.setScalar(1.35); world.add(FW);
{ const R = 15, hubY = R + 3.2, white = toon(0xF6F1E7), red = toon(0xE8575A), blue = toon(0x5B86D6), gold = toon(0xFFC857, { emissive: 0xFFB020, emissiveIntensity: 0.6 }), ink = INK;
  const part = (g, m, x, y, z) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.castShadow = true; const k = new THREE.Mesh(g, ink); k.scale.setScalar(1.06); o.add(k); return o; };
  const beam = (a, b, r, m) => { const d = new THREE.Vector3().subVectors(b, a), o = part(new THREE.CylinderGeometry(r, r, d.length(), 10), m, 0, 0, 0); o.position.copy(a).addScaledVector(d, 0.5); o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize()); return o; };
  [-1.8, 1.8].forEach(z => { FW.add(beam(new THREE.Vector3(-8, 0, z * 1.6), new THREE.Vector3(0, hubY, z), 0.5, red)); FW.add(beam(new THREE.Vector3(8, 0, z * 1.6), new THREE.Vector3(0, hubY, z), 0.5, red)); });
  FW.add(beam(new THREE.Vector3(-8, 1, -2.9), new THREE.Vector3(-8, 1, 2.9), 0.35, white), beam(new THREE.Vector3(8, 1, -2.9), new THREE.Vector3(8, 1, 2.9), 0.35, white));
  const wheel = new THREE.Group(); wheel.position.y = hubY; FW.add(wheel);
  [-1.2, 1.2].forEach(z => { wheel.add(part(new THREE.TorusGeometry(R, 0.35, 10, 72), white, 0, 0, z), part(new THREE.TorusGeometry(R * 0.55, 0.22, 8, 48), blue, 0, 0, z)); });
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; [-1.2, 1.2].forEach(z => wheel.add(beam(new THREE.Vector3(0, 0, z), new THREE.Vector3(Math.cos(a) * R, Math.sin(a) * R, z), 0.14, white))); }
  const hub = part(new THREE.CylinderGeometry(1.5, 1.5, 3.6, 20), gold, 0, 0, 0); hub.rotation.x = Math.PI / 2; wheel.add(hub);
  const cars = [], cc = [0xFF7B7B, 0xFFC857, 0x7ED6A8, 0x6FB4F2, 0xB79CFF, 0xFF9FD0];
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2, g = new THREE.Group(); g.position.set(Math.cos(a) * R, Math.sin(a) * R, 0); const roof = part(new THREE.CylinderGeometry(1.8, 1.8, 0.35, 4), red, 0, -0.9, 0); roof.rotation.y = Math.PI / 4;
    g.add(part(new THREE.BoxGeometry(3, 2.2, 3.2), toon(cc[i % 6]), 0, -2.2, 0), roof, beam(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -1.2, 0), 0.1, white)); wheel.add(g); cars.push(g); }
  const bulbs = []; for (let i = 0; i < 48; i++) { const a = i / 48 * Math.PI * 2, sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: [0xFFE08A, 0xFF9FB5, 0x9FE8FF][i % 3], transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); sp.position.set(Math.cos(a) * (R + 0.6), Math.sin(a) * (R + 0.6), 1.9); sp.scale.setScalar(1.5); wheel.add(sp); bulbs.push(sp); }
  onTick(t => { wheel.rotation.z = -t * 0.12; cars.forEach(c => c.rotation.z = t * 0.12 + Math.sin(t * 0.9 + c.position.x) * 0.04); bulbs.forEach((b, i) => b.material.opacity = 0.55 + Math.sin(t * 3 + i * 0.7) * 0.35); }); }


// ---------------------------------------------------------------- sea, sun, far hills (scene one has the sea behind the wheel and the sun at upper left)
{ const sea = new THREE.Mesh(new THREE.PlaneGeometry(900, 160), toon(0x3FA7D6, { emissive: 0x1C5E86, emissiveIntensity: 0.35 })); sea.rotation.x = -Math.PI / 2; sea.position.set(0, -0.9, -190); world.add(sea);
  const sunM = new THREE.Mesh(new THREE.SphereGeometry(9, 24, 14), new THREE.MeshBasicMaterial({ color: 0xFFE58A, fog: false })); sunM.position.set(-85, 78, -150); world.add(sunM);
  const flare = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: 0xFFE9A8, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); flare.scale.setScalar(120); flare.position.copy(sunM.position); world.add(flare);
  [[-190, -150, 60], [-120, -210, 45], [150, -170, 55], [230, -90, 50], [-240, -40, 55], [250, 20, 40]].forEach(([x, z, r], i) => { const h = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), toon(i % 2 ? 0x8CBF8A : 0x7DB88A)); h.scale.y = 0.55; h.position.set(x, -1, z); world.add(h); }); }
// ---------------------------------------------------------------- the kids, exactly as in scene one (3x bigger to match this scale)
{ const cast = makeCast(world), K = 3; [['leo', -3.6, 15, 0.3], ['mia', 3.6, 15.6, -0.3], ['toby', 0.6, 10.8, 0]].forEach(([n, x, z, ry]) => { const c = cast[n]; if (!c) return; c.g.scale.setScalar(K); c.g.position.set(x, gy(x, z), z); c.g.rotation.y = ry; c.pose && c.pose(n === 'toby' ? 'wag' : 'idle'); }); }
// ---------------------------------------------------------------- life: fireflies, clouds
{ const N = 160, g = new THREE.BufferGeometry(), p = new Float32Array(N * 3), ph = []; for (let i = 0; i < N; i++) { const [x, z] = spot(5, 70, 0); p.set([x, gy(x, z) + rr(1, 7), z], i * 3); ph.push(rnd() * 6.28); }
  g.setAttribute('position', new THREE.BufferAttribute(p, 3)); const m = new THREE.PointsMaterial({ map: glowTex(), color: 0xFFF0A0, size: 1.1, transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending }); const pts = new THREE.Points(g, m); pts.frustumCulled = false; world.add(pts);
  onTick(t => { for (let i = 0; i < N; i++) { p[i * 3] += Math.cos(t * 0.5 + ph[i]) * 0.012; p[i * 3 + 1] += Math.sin(t * 0.9 + ph[i] * 2) * 0.01; p[i * 3 + 2] += Math.sin(t * 0.4 + ph[i]) * 0.012; } g.attributes.position.needsUpdate = true; m.opacity = 0.75 + Math.sin(t * 2) * 0.15; }); }
{ const ct = cloudTex(); for (let i = 0; i < 18; i++) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: ct, color: 0xFFFFFF, transparent: true, opacity: 0.85, depthWrite: false, fog: false })); sp.position.set(rr(-170, 170), rr(40, 72), rr(-190, -40)); sp.scale.set(rr(45, 80), rr(15, 26), 1); sp.userData.v = rr(0.4, 1); world.add(sp); onTick((t, dt) => { sp.position.x += dt * sp.userData.v; if (sp.position.x > 200) sp.position.x = -200; }); } }
onTick(t => { wind.value = t; });

// ---------------------------------------------------------------- camera + view buttons
const ctl = new OrbitControls(camera, renderer.domElement); ctl.enableDamping = true; ctl.maxPolarAngle = Math.PI * 0.495; ctl.minDistance = 6; ctl.maxDistance = 170; ctl.target.set(0, 3, 9); camera.position.set(0, 9.6, 39); ctl.update();
let fly = null; const flyTo = (p, t) => { fly = { p0: camera.position.clone(), t0: ctl.target.clone(), p1: new THREE.Vector3(...p), t1: new THREE.Vector3(...t), k: 0 }; };
onTick((t, dt) => { if (fly) { fly.k = Math.min(1, fly.k + dt / 2.2); const e = fly.k * fly.k * (3 - 2 * fly.k); camera.position.lerpVectors(fly.p0, fly.p1, e); ctl.target.lerpVectors(fly.t0, fly.t1, e); if (fly.k >= 1) fly = null; } ctl.update(); });
renderer.domElement.addEventListener('pointerdown', () => { fly = null; });
const bar = document.createElement('div'); bar.style.cssText = 'position:fixed;left:50%;bottom:14px;transform:translateX(-50%);display:flex;gap:8px;z-index:3;font:700 14px Andika,sans-serif;flex-wrap:wrap;justify-content:center;width:calc(100vw - 20px)';
[['Scene one view', [0, 9.6, 39], [0, 3, 9]], ['Cave', [0, 7, -2], [0, 5, -26]], ['Ferris wheel', [-26, 14, -50], [-56, 24, -100]], ['Meadow', [-14, 3.5, 50], [0, 3, 20]], ['Woods', [70, 10, 30], [50, 10, -30]], ['From above', [40, 80, 80], [0, 0, -30]]].forEach(([n, p, t]) => { const b = document.createElement('button'); b.textContent = n; b.style.cssText = 'padding:9px 15px;border-radius:999px;border:1px solid #fff9;background:#0B2A3FCC;color:#E8FBFF;cursor:pointer;font:inherit'; b.onclick = () => flyTo(p, t); bar.append(b); });
document.body.append(bar);
window.__ctl = ctl; window.__cam = camera; window.__fly = flyTo;
window.__world = world;
