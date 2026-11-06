// Test: free CC0 models (Quaternius / Kenney) restyled to our toon look, plus a Ferris wheel and meadow built in code.
import { THREE, init, newWorld, onTick, setCam, toon, outline, renderer, scene, camera } from './gfx.js';
import { glowTex, cloudTex } from './effects.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

init(document.body);
const world = newWorld({ sky: 0x8FD0F5, fog: [0xCDEBFA, 70, 220], ambient: 0xFFFFFF, ambientI: 1.5, sun: 0xFFF1DC, sunI: 1.7, sunPos: [30, 40, 20] });
renderer.shadowMap.enabled = true;
setCam([0, 14, 58], [0, 7, 0]);
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647, rr = (a, b) => a + (b - a) * rnd();

// ---- ground: soft rolling meadow
const H = (x, z) => Math.sin(x * 0.045) * Math.cos(z * 0.05) * 2.2 + Math.sin(x * 0.12 + z * 0.09) * 0.5;
const gGeo = new THREE.PlaneGeometry(400, 400, 120, 120); gGeo.rotateX(-Math.PI / 2);
{ const p = gGeo.attributes.position, col = new Float32Array(p.count * 3), c = new THREE.Color(); for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), d = Math.hypot(x, z), flat = Math.max(0, 1 - Math.max(0, d - 18) / 14); p.setY(i, H(x, z) * (1 - flat * 0.95) * Math.min(1, d / 40 + 0.15));
  c.setHSL(0.27 + Math.sin(x * 0.07 + z * 0.05) * 0.02, 0.5, 0.5 + Math.sin(x * 0.2) * Math.cos(z * 0.17) * 0.04); col.set([c.r, c.g, c.b], i * 3); }
  gGeo.setAttribute('color', new THREE.BufferAttribute(col, 3)); gGeo.computeVertexNormals(); }
const ground = new THREE.Mesh(gGeo, toon(0xffffff, { vertexColors: true })); ground.receiveShadow = true; world.add(ground);
const gy = (x, z) => { const d = Math.hypot(x, z), flat = Math.max(0, 1 - Math.max(0, d - 18) / 14); return H(x, z) * (1 - flat * 0.95) * Math.min(1, d / 40 + 0.15); };

// ---- grass tufts: thousands of little curved blades, one draw call
{ const blade = new THREE.BufferGeometry(); blade.setAttribute('position', new THREE.Float32BufferAttribute([-0.07, 0, 0, 0.07, 0, 0, 0, 0.9, 0.12], 3)); blade.setIndex([0, 1, 2]); blade.computeVertexNormals();
  const N = 9000, m = new THREE.InstancedMesh(blade, new THREE.MeshToonMaterial({ color: 0x6FCB5A, side: THREE.DoubleSide, gradientMap: toon(0).gradientMap }), N), d = new THREE.Object3D(), c = new THREE.Color();
  for (let i = 0; i < N; i++) { const a = rnd() * 6.28, r = Math.sqrt(rnd()) * 90; const x = Math.cos(a) * r, z = Math.sin(a) * r; d.position.set(x, gy(x, z), z); d.rotation.set(0, rnd() * 6.28, 0); d.scale.set(1, rr(0.8, 2.2), 1); d.updateMatrix(); m.setMatrixAt(i, d.matrix); c.setHSL(rr(0.24, 0.31), 0.6, rr(0.4, 0.58)); m.setColorAt(i, c); }
  m.frustumCulled = false; world.add(m); }

// ---- models: loaded, then every mesh gets our toon material + ink outline
const loader = new GLTFLoader(); loader.setMeshoptDecoder(MeshoptDecoder);

const INK = new THREE.MeshBasicMaterial({ color: 0x2E2A4F, side: THREE.BackSide });
INK.onBeforeCompile = sh => { sh.vertexShader = sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n transformed += normalize(normal) * 0.075 / length(modelMatrix[0].xyz);'); };
const cache = {};
const load = n => cache[n] || (cache[n] = new Promise(res => loader.load('assets/' + n + '.glb', g => {
  const ms = []; g.scene.traverse(o => { if (o.isMesh) ms.push(o); }); ms.forEach(o => { { const s = o.material, mat = toon(s.color ? s.color.clone() : 0xffffff, { map: s.map || null, vertexColors: !!o.geometry.attributes.color }); o.userData.mn = s.name; if (s.emissive && s.emissive.getHex()) { mat.emissive = s.emissive.clone(); mat.emissiveIntensity = 1; }
    o.material = mat; o.castShadow = true; o.receiveShadow = true; { const ink = new THREE.Mesh(o.geometry, INK); ink.userData.isOutline = true; o.add(ink); } } }); res(g.scene); }, undefined, e => { console.error('LOADFAIL ' + n + ' ' + (e && e.message)); res(null); })));

const LEAF = [0x5FBF5A, 0x7BCB5E, 0x4FAE6A, 0x8FD05C, 0x6BC48A].map(c => toon(c)), AUTUMN = [0xF2A33B, 0xE9693B, 0xF6C94C].map(c => toon(c)), PINE = [0x3E9A63, 0x4BA672, 0x35875A].map(c => toon(c)), TRUNK = toon(0x8A5A3A), STONE = [0xA7AFC2, 0x9AA3B8, 0xB4B9C9].map(c => toon(c)), MOSS = toon(0x6DBB5E), BLOOM = [0xFF8FB5, 0xFFD36B, 0xB79CFF, 0xFFFFFF].map(c => toon(c));
const pick = a => a[Math.floor(rnd() * a.length)];
const CRYS = toon(0x7FE9FF, { emissive: 0x4FD8FF, emissiveIntensity: 0.9 }), BIRCH = toon(0xF2EDE0), RED = toon(0xE8575A), CREAM = toon(0xF6EBD0);
function restyle(o, name) { const leaf = name.includes('autumn') ? pick(AUTUMN) : name.includes('pine') ? pick(PINE) : pick(LEAF), stone = pick(STONE), isRock = name.startsWith('rock') || name === 'crystal_rock';
  o.traverse(m => { if (!m.isMesh || m.userData.isOutline) return; const mn = m.userData.mn || '';
    if (/^(tree|bush)/.test(name)) m.material = mn === 'woodBirch' ? BIRCH : /wood/i.test(mn) ? TRUNK : leaf;
    else if (isRock) m.material = mn === 'crystal' ? CRYS : mn === 'grass' ? MOSS : stone;
    else if (name === 'flower_red') m.material = mn === 'grass' ? MOSS : pick(BLOOM);
    else if (name === 'mushroom_red') m.material = mn === 'colorRed' ? RED : CREAM; }); }
async function put(name, x, z, { s = 1, ry = rnd() * 6.28, y = null, tint = null } = {}) {
  const src = await load(name); if (!src) return null; const o = src.clone(true); const box = new THREE.Box3().setFromObject(o), h = box.max.y - box.min.y;
  restyle(o, name); o.scale.setScalar(s); o.rotation.y = ry; o.position.set(x, (y ?? gy(x, z)) - box.min.y * s, z);
  world.add(o); return o; }

const TREES = ['tree_oak', 'tree_fat', 'tree_pine', 'tree_pine_tall', 'tree_oak', 'tree_fat', 'tree_pine', 'tree_autumn'];
(async () => {
  // woodland ring behind the fair
  for (let i = 0; i < 46; i++) { const a = rnd() * 6.28, r = rr(34, 95), x = Math.cos(a) * r, z = Math.sin(a) * r - 10; if (z > 30 && Math.abs(x) < 20) continue; await put(TREES[Math.floor(rnd() * TREES.length)], x, z, { s: rr(5, 9) }); }
  // bushes and flowers near the path
  for (let i = 0; i < 26; i++) { const a = rnd() * 6.28, r = rr(14, 44); await put(rnd() < 0.6 ? 'bush' : 'bush_large', Math.cos(a) * r, Math.sin(a) * r, { s: rr(1.6, 3) }); }
  for (let i = 0; i < 70; i++) { const a = rnd() * 6.28, r = rr(8, 60); await put('flower_red', Math.cos(a) * r, Math.sin(a) * r, { s: rr(0.9, 1.8), tint: [0xFF8FB5, 0xFFD36B, 0xB79CFF, 0xFFFFFF][i % 4] }); }
  for (let i = 0; i < 8; i++) { const a = rnd() * 6.28, r = rr(18, 50); await put('mushroom_red', Math.cos(a) * r, Math.sin(a) * r, { s: rr(1.2, 2.2) }); }
  // the cave: a mouth made of big rocks on the hillside, with glowing crystals inside
  const CX = -34, CZ = -30; const cave = new THREE.Group(); world.add(cave);
  const hill = new THREE.Mesh(new THREE.SphereGeometry(17, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2), toon(0x78C65F)); hill.scale.set(1.15, 0.8, 1); hill.position.set(CX, gy(CX, CZ) - 1.5, CZ); hill.castShadow = hill.receiveShadow = true; world.add(hill);
  const tun = new THREE.Mesh(new THREE.CylinderGeometry(4.6, 4.6, 17, 28, 1, true, 0, Math.PI), new THREE.MeshBasicMaterial({ color: 0x0B0E22, side: THREE.DoubleSide })); tun.rotation.set(Math.PI / 2, 0, Math.PI / 2); tun.position.set(CX, gy(CX, CZ) + 0.2, CZ + 6.8); world.add(tun);
  const back = new THREE.Mesh(new THREE.CircleGeometry(4.6, 28, 0, Math.PI), new THREE.MeshBasicMaterial({ color: 0x0B0E22, side: THREE.DoubleSide })); back.position.set(CX, gy(CX, CZ) + 0.2, CZ - 1.7); world.add(back);
  const ring = [[-6.5, 0], [-5.5, 4.5], [-2.5, 7.4], [2.6, 7.4], [5.6, 4.3], [6.6, -0.2], [0, 9.6]];
  for (const [dx, dy] of ring) { const o = await put('rock_large', CX + dx * 1.1, CZ + 15.2 + (dy > 8 ? -1.2 : 0), { s: rr(6, 8), y: gy(CX, CZ) + dy * 0.9, ry: rnd() * 6.28 }); }
  for (let i = 0; i < 6; i++) await put(i % 2 ? 'rock_tall' : 'rock_small', CX + rr(-13, 13), CZ + rr(12, 19), { s: rr(3, 6) });
  for (let i = 0; i < 7; i++) { const o = await put(i % 2 ? 'crystal' : 'crystal_rock', CX + rr(-4, 4), CZ + 11 + rr(-2, 2), { s: rr(2, 3.6) }); if (o && i % 2) o.traverse(m => { if (m.isMesh && !m.userData.isOutline) m.material = CRYS; }); }
  const gl = new THREE.PointLight(0x7FE9FF, 60, 30, 1.6); gl.position.set(CX, gy(CX, CZ) + 4, CZ + 12); world.add(gl);
  await put('tent', 18, 24, { s: 4, ry: 0.6 }); await put('campfire', 12, 28, { s: 2.2 }); await put('log', 9, 30, { s: 2.6 }); await put('log', 15, 32, { s: 2.2 }); await put('fence', -12, 26, { s: 3, ry: 0.2 }); await put('fence', -18, 25, { s: 3, ry: 0.2 }); await put('deer', 44, 10, { s: 4, ry: -1.4 }); await put('fox', -22, 20, { s: 2.2, ry: 1 });
})();

// ---- Ferris wheel, built in code: A-frame legs, rim, spokes, swinging gondolas, string lights
const FW = new THREE.Group(); FW.position.set(14, gy(14, -12), -12); FW.rotation.y = -0.25; world.add(FW);
{ const R = 15, hubY = R + 3.2, white = toon(0xF6F1E7), red = toon(0xE8575A), blue = toon(0x5B86D6), gold = toon(0xFFC857, { emissive: 0xFFB020, emissiveIntensity: 0.6 });
  const part = (g, m, x, y, z) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.castShadow = true; outline(o, 0.1); return o; };
  const beam = (a, b, r, m) => { const d = new THREE.Vector3().subVectors(b, a), o = part(new THREE.CylinderGeometry(r, r, d.length(), 10), m, 0, 0, 0); o.position.copy(a).addScaledVector(d, 0.5); o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize()); return o; };
  [-1.8, 1.8].forEach(z => { FW.add(beam(new THREE.Vector3(-8, 0, z * 1.6), new THREE.Vector3(0, hubY, z), 0.5, red)); FW.add(beam(new THREE.Vector3(8, 0, z * 1.6), new THREE.Vector3(0, hubY, z), 0.5, red)); });
  FW.add(beam(new THREE.Vector3(-8, 1, -2.9), new THREE.Vector3(-8, 1, 2.9), 0.35, white), beam(new THREE.Vector3(8, 1, -2.9), new THREE.Vector3(8, 1, 2.9), 0.35, white));
  const wheel = new THREE.Group(); wheel.position.y = hubY; FW.add(wheel);
  [-1.2, 1.2].forEach(z => { const rim = part(new THREE.TorusGeometry(R, 0.35, 10, 72), white, 0, 0, z); wheel.add(rim); const rim2 = part(new THREE.TorusGeometry(R * 0.55, 0.22, 8, 48), blue, 0, 0, z); wheel.add(rim2); });
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; [-1.2, 1.2].forEach(z => wheel.add(beam(new THREE.Vector3(0, 0, z), new THREE.Vector3(Math.cos(a) * R, Math.sin(a) * R, z), 0.14, white))); }
  wheel.add(part(new THREE.CylinderGeometry(1.5, 1.5, 3.6, 20), gold, 0, 0, 0)); wheel.children[wheel.children.length - 1].rotation.x = Math.PI / 2;
  const cars = [], cc = [0xFF7B7B, 0xFFC857, 0x7ED6A8, 0x6FB4F2, 0xB79CFF, 0xFF9FD0];
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2, g = new THREE.Group(); g.position.set(Math.cos(a) * R, Math.sin(a) * R, 0); const cm = toon(cc[i % 6]);
    g.add(part(new THREE.BoxGeometry(3, 2.2, 3.2), cm, 0, -2.2, 0), part(new THREE.CylinderGeometry(1.8, 1.8, 0.35, 4), red, 0, -0.9, 0)); g.children[1].rotation.y = Math.PI / 4; g.children[1].scale.set(1, 1, 1);
    g.add(beam(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -1.2, 0), 0.1, white)); wheel.add(g); cars.push(g); }
  // string lights
  const bulbs = []; for (let i = 0; i < 48; i++) { const a = i / 48 * Math.PI * 2, sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: [0xFFE08A, 0xFF9FB5, 0x9FE8FF][i % 3], transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); sp.position.set(Math.cos(a) * (R + 0.6), Math.sin(a) * (R + 0.6), 1.9); sp.scale.setScalar(1.5); wheel.add(sp); bulbs.push(sp); }
  onTick(t => { wheel.rotation.z = -t * 0.12; cars.forEach(c => c.rotation.z = t * 0.12 + Math.sin(t * 0.9 + c.position.x) * 0.04); bulbs.forEach((b, i) => b.material.opacity = 0.55 + Math.sin(t * 3 + i * 0.7) * 0.35); }); }

// ---- drifting clouds
{ const ct = cloudTex(); for (let i = 0; i < 14; i++) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: ct, color: 0xFFFFFF, transparent: true, opacity: 0.8, depthWrite: false, fog: false })); sp.position.set(rr(-150, 150), rr(35, 60), rr(-160, -40)); sp.scale.set(rr(40, 70), rr(14, 24), 1); world.add(sp); sp.userData.v = rr(0.4, 1); onTick((t, dt) => { sp.position.x += dt * sp.userData.v; if (sp.position.x > 180) sp.position.x = -180; }); } }

const ctl = new OrbitControls(camera, renderer.domElement); ctl.enableDamping = true; ctl.target.set(0, 8, 0); ctl.maxPolarAngle = Math.PI * 0.49; ctl.minDistance = 8; ctl.maxDistance = 140; camera.position.set(8, 18, 62); ctl.update();
onTick(() => ctl.update());
window.__ctl = ctl; window.__cam = camera;
window.__dbg = async n => { const s = await load(n); const out = []; s.traverse(o => { if (o.isMesh && !o.userData.isOutline) out.push({ n: o.name, col: o.material.color.getHexString(), map: !!o.material.map, vc: o.material.vertexColors, attrs: Object.keys(o.geometry.attributes) }); }); return out; };
