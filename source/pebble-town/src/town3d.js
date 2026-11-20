// The 3D town: a floating island diorama with a river, a bridge and eight
// places that rise out of the ground as the player earns them.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const INK = 0x2E2A4F;
let renderer, scene, camera, controls, clock, container, labelLayer;
let running = true, onPick = () => {}, onWordTap = () => {}, onPerson = () => {};
let hemi, sun, skyTex = {};
const places = {};          // area -> {group, inner, rubble, scaff, extras, height, p, disp, label, mats, onFull}
const wordObjs = {};        // word -> {group, label}
const decorObjs = {};
const animated = [];
function srand(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }        // functions called every frame
const raycastTargets = [];

// ---------------------------------------------------------------- materials
const grad = (() => { const t = new THREE.DataTexture(new Uint8Array([95, 95, 95, 255, 175, 175, 175, 255, 255, 255, 255, 255]), 3, 1, THREE.RGBAFormat);
  t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t; })();
const sharedMats = {};
function toon(color, opts = {}) { return new THREE.MeshToonMaterial(Object.assign({ color, gradientMap: grad }, opts)); }
function smat(color) { return sharedMats[color] || (sharedMats[color] = toon(color)); }
const INK_MAT = new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide });

function outline(mesh, t = 0.05) {
  const g = mesh.geometry; g.computeBoundingBox();
  const s = new THREE.Vector3(), c = new THREE.Vector3(); g.boundingBox.getSize(s); g.boundingBox.getCenter(c);
  const o = new THREE.Mesh(g, INK_MAT);
  const k = v => v > 0.0001 ? (v + 2 * t) / v : 1;
  o.scale.set(k(s.x), k(s.y), k(s.z)); o.position.set(c.x * (1 - o.scale.x), c.y * (1 - o.scale.y), c.z * (1 - o.scale.z));
  o.userData.isOutline = true; mesh.add(o); return mesh;
}

// Builder bound to a group; `own` = give this group its own materials (for color fade)
function builder(group, own = false) {
  const mats = [];
  const M = c => { if (!own) return smat(c); const m = toon(c); m.userData.base = new THREE.Color(c); mats.push(m); return m; };
  const add = (geo, color, x, y, z, { rx = 0, ry = 0, rz = 0, line = 0.05, shadow = true, parent = group } = {}) => {
    const m = new THREE.Mesh(geo, typeof color === 'object' ? color : M(color)); m.position.set(x, y, z); m.rotation.set(rx, ry, rz);
    m.castShadow = shadow; m.receiveShadow = true; if (line) outline(m, line); parent.add(m); return m;
  };
  return {
    mats, M, add,
    box: (w, h, d, c, x, y, z, o) => add(new THREE.BoxGeometry(w, h, d), c, x, y, z, o),
    cyl: (rt, rb, h, c, x, y, z, o = {}) => add(new THREE.CylinderGeometry(rt, rb, h, o.seg || 14), c, x, y, z, o),
    cone: (r, h, c, x, y, z, o = {}) => add(new THREE.ConeGeometry(r, h, o.seg || 12), c, x, y, z, o),
    ball: (r, c, x, y, z, o = {}) => add(new THREE.SphereGeometry(r, o.seg || 14, 10), c, x, y, z, o),
    roof: (w, d, h, c, x, y, z, o = {}) => { const sh = new THREE.Shape(); sh.moveTo(-w / 2, 0); sh.lineTo(w / 2, 0); sh.lineTo(0, h); sh.closePath();
      const g = new THREE.ExtrudeGeometry(sh, { depth: d, bevelEnabled: false }); g.translate(0, 0, -d / 2); return add(g, c, x, y, z, o); },
    torus: (r, t, c, x, y, z, o = {}) => add(new THREE.TorusGeometry(r, t, 8, 20), c, x, y, z, o),
  };
}

// Text painted onto a canvas for signs
function signTexture(text, { bg = '#FFF4D6', fg = '#2E2A4F', w = 512, h = 128, font = 'bold 76px Chewy, "Comic Sans MS", sans-serif' } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d');
  x.fillStyle = bg; x.fillRect(0, 0, w, h); x.fillStyle = fg; x.font = font; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, w / 2, h / 2 + 4);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}

// ---------------------------------------------------------------- island
export const SP = 1.3;
const RX = 21 * SP, RZ = 15 * SP;
function islandShape() {
  const sh = new THREE.Shape(); const N = 64;
  for (let i = 0; i <= N; i++) { const a = i / N * Math.PI * 2; const wob = 1 + 0.035 * Math.sin(a * 5) + 0.02 * Math.cos(a * 9);
    const x = Math.sign(Math.cos(a)) * Math.pow(Math.abs(Math.cos(a)), 0.75) * RX * wob, y = Math.sign(Math.sin(a)) * Math.pow(Math.abs(Math.sin(a)), 0.75) * RZ * wob;
    i ? sh.lineTo(x, y) : sh.moveTo(x, y); }
  return sh;
}
// River centre line (x,z)
const RIVER = new THREE.CatmullRomCurve3([[-7, 0, -17], [-3, 0, -8], [0.5, 0, -1], [2.5, 0, 6], [4.5, 0, 16.5]].map(p => new THREE.Vector3(p[0] * SP, p[1], p[2] * SP)));
export function riverXAt(z) { let best = 0, bd = 1e9; for (let i = 0; i <= 100; i++) { const p = RIVER.getPoint(i / 100); const d = Math.abs(p.z - z); if (d < bd) { bd = d; best = p.x; } } return best; }

function ribbon(curve, width, y, segs = 120) {
  const pos = [], uv = [], idx = [];
  for (let i = 0; i <= segs; i++) { const t = i / segs, p = curve.getPoint(t), tg = curve.getTangent(t); const n = new THREE.Vector3(-tg.z, 0, tg.x).normalize();
    pos.push(p.x + n.x * width / 2, y, p.z + n.z * width / 2, p.x - n.x * width / 2, y, p.z - n.z * width / 2); uv.push(0, t * 12, 1, t * 12);
    if (i < segs) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); } }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
const waterUniforms = { uTime: { value: 0 } };
function waterMat() {
  return new THREE.ShaderMaterial({ uniforms: waterUniforms, transparent: true, side: THREE.DoubleSide,
    vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: `uniform float uTime; varying vec2 vUv;
      void main(){ float edge=smoothstep(0.,.18,vUv.x)*smoothstep(1.,.82,vUv.x);
        float w=sin(vUv.y*6.2831-uTime*2.2+sin(vUv.x*9.)*1.3); float stripe=smoothstep(.82,.97,w)*edge;
        vec3 deep=vec3(.24,.60,.80), light=vec3(.47,.78,.90); vec3 c=mix(light,deep,edge*.65)+stripe*.35;
        gl_FragColor=vec4(c,.96); }` });
}

function buildIsland() {
  const g = new THREE.Group(); scene.add(g);
  const shape = islandShape();
  const geo = new THREE.ExtrudeGeometry(shape, { depth: 2.4, bevelEnabled: true, bevelThickness: 0.5, bevelSize: 0.6, bevelSegments: 3, curveSegments: 64 });
  geo.rotateX(Math.PI / 2);
  const isl = new THREE.Mesh(geo, [toon(0x8CC95E), toon(0xA9744A)]); isl.position.y = 0; isl.receiveShadow = true; outline(isl, 0.08); g.add(isl);
  // dirt band + rocky underside
  const under = new THREE.Mesh(new THREE.ConeGeometry(1, 1, 18, 1), toon(0x7A5236)); under.scale.set(RX * 0.92, 9, RZ * 0.92); under.rotation.x = Math.PI; under.position.y = -3.4 - 4.5; outline(under, 0.06); g.add(under);
  const b = builder(g);
  for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2 + 0.3; b.ball(1.3 + Math.random(), 0x8E6646, Math.cos(a) * RX * 0.6, -5 - Math.random() * 3, Math.sin(a) * RZ * 0.6, { line: 0.05 }); }
  // sand banks + water
  const bank = new THREE.Mesh(ribbon(RIVER, 5.2, 0.52), toon(0xE9D59A)); bank.receiveShadow = true; g.add(bank);
  const water = new THREE.Mesh(ribbon(RIVER, 3.8, 0.56), waterMat()); g.add(water);
  // waterfall over the front edge
  const end = RIVER.getPoint(1);
  const fall = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 9, 1, 8), waterMat()); fall.position.set(end.x, -3.9, end.z + 0.15); g.add(fall);
  for (let i = 0; i < 5; i++) { const puff = b.ball(0.7 + Math.random() * 0.5, 0xFFFFFF, end.x - 1.4 + i * 0.7, -8.5 + Math.random(), end.z + 0.4, { line: 0 });
    animated.push(t => { puff.position.y = -8.5 + Math.sin(t * 2 + i) * 0.3; puff.scale.setScalar(1 + Math.sin(t * 3 + i) * 0.12); }); }
  // grass tufts, rocks and trees as filler
  const SR = srand(2026); const rnd = (a, b) => a + SR() * (b - a);
  const free = (x, z, r = 2) => Math.abs(x - riverXAt(z)) > 3.6 + r && insideIsland(x, z, 1.5) && !PLOTS.some(p => Math.hypot(p.x - x, p.z - z) < p.r + r);
  let made = 0, tries = 0;
  while (made < 42 && tries < 600) { tries++; const x = rnd(-RX, RX), z = rnd(-RZ, RZ); if (!free(x, z, 0.8)) continue; made++; const tg = new THREE.Group(); g.add(tg); FILLERS.push({ x, z, r: 1.1, g: tg }); tree(builder(tg), x, z, SR()); }
  for (let i = 0; i < 22; i++) { const x = rnd(-RX, RX), z = rnd(-RZ, RZ); if (!free(x, z, 0.2)) continue; const rg = new THREE.Group(); g.add(rg); FILLERS.push({ x, z, r: 0.5, g: rg }); builder(rg).add(new THREE.DodecahedronGeometry(rnd(0.3, 0.7)), 0xB7B1A6, x, 0.7, z, { line: 0.04 }); }
  return g;
}
function insideIsland(x, z, margin = 0) { const nx = Math.abs(x) / (RX - margin), nz = Math.abs(z) / (RZ - margin); return Math.pow(nx, 2.6) + Math.pow(nz, 2.6) < 1; }
function tree(b, x, z, kind) {
  if (kind < 0.5) { b.cyl(0.18, 0.25, 1.2, 0x8A5A3B, x, 1.1, z); const c = [0x3E9B5C, 0x4FAF62, 0x5DBA6B][Math.floor(Math.random() * 3)];
    b.ball(1.05, c, x, 2.3, z); b.ball(0.75, c, x + 0.5, 2.0, z + 0.3); }
  else { b.cyl(0.15, 0.2, 0.8, 0x8A5A3B, x, 0.9, z); b.cone(1.1, 1.8, 0x2F8551, x, 2.1, z); b.cone(0.8, 1.4, 0x3E9B5C, x, 2.9, z); }
}

// ---------------------------------------------------------------- places
// x/z on the island, r = clear radius, h = building height, rot = facing
const PLOTS = [
  { area: 'signs', name: 'Sign Shop', x: -11, z: -4, r: 3.4, rot: 0.35 },
  { area: 'library', name: 'Library', x: -12, z: 6, r: 3.6, rot: 0.2 },
  { area: 'detective', name: "Detective's Office", x: -4.5, z: 10.5, r: 2.8, rot: 0.1 },
  { area: 'bridge', name: 'The Bridge', x: 0.7, z: -0.2, r: 0.1, rot: 0 },
  { area: 'market', name: 'Market', x: 8.5, z: -2.5, r: 3.8, rot: -0.25 },
  { area: 'train', name: 'Train Station', x: 9, z: -10.5, r: 3.2, rot: 0 },
  { area: 'workshop', name: 'Workshop', x: 12, z: 6, r: 3.4, rot: -0.4 },
  { area: 'storm', name: 'Lighthouse', x: 18.2, z: -3.5, r: 2.4, rot: 0 },
  { area: 'science', name: 'Science Lab', x: -16.3, z: -7.6, r: 2.9, rot: 0.5 },
];
PLOTS.forEach(p => { p.x *= SP; p.z *= SP; });
const Y0 = 0.6; // grass top

function makePlace(plot, build, height) {
  const g = new THREE.Group(); g.position.set(plot.x, Y0, plot.z); g.rotation.y = plot.rot; scene.add(g);
  const inner = new THREE.Group(); g.add(inner);
  const b = builder(inner, true); build(b, inner);
  // dirt plot
  const gb = builder(g); const pad = gb.cyl(plot.r * 0.92, plot.r, 0.12, 0xC9A06B, 0, -0.02, 0, { line: 0.03, seg: 24 }); pad.receiveShadow = true; pad.castShadow = false;
  // rubble pile
  const rubble = new THREE.Group(); g.add(rubble); const rb = builder(rubble);
  for (let i = 0; i < 9; i++) rb.box(0.5 + Math.random() * 0.9, 0.25 + Math.random() * 0.4, 0.4 + Math.random() * 0.6, [0x9C9488, 0xB5ADA0, 0x8D6B4F][i % 3], (Math.random() - .5) * 2.6, 0.2 + Math.random() * 0.25, (Math.random() - .5) * 2.2, { ry: Math.random() * 3, rz: (Math.random() - .5) * .6, line: 0.03 });
  rb.box(0.12, 1.4, 0.12, 0x8A5A3B, 1.4, 0.6, 1.1, { rz: 0.3 }); const sign = rb.box(0.9, 0.55, 0.06, 0xFFF4D6, 1.3, 1.3, 1.15, { rz: 0.2 });
  sign.material = new THREE.MeshToonMaterial({ map: signTexture('?', { font: 'bold 110px Chewy, sans-serif', w: 192, h: 128 }), gradientMap: grad });
  // scaffolding
  const scaff = new THREE.Group(); g.add(scaff); const sb = builder(scaff); const s = plot.r * 0.78;
  for (const [x, z] of [[-s, -s], [s, -s], [-s, s], [s, s]]) sb.box(0.12, height + 0.6, 0.12, 0xD9A441, x, (height + 0.6) / 2, z, { line: 0.02 });
  for (let y = 1; y < height + 0.5; y += 1.3) { sb.box(s * 2, 0.1, 0.1, 0xD9A441, 0, y, -s, { line: 0.02 }); sb.box(s * 2, 0.1, 0.1, 0xD9A441, 0, y, s, { line: 0.02 }); sb.box(0.1, 0.1, s * 2, 0xD9A441, -s, y, 0, { line: 0.02 }); sb.box(0.1, 0.1, s * 2, 0xD9A441, s, y, 0, { line: 0.02 }); }
  // hit area
  const hit = new THREE.Mesh(new THREE.CylinderGeometry(plot.r, plot.r, height + 1, 12), new THREE.MeshBasicMaterial({ visible: false }));
  hit.position.y = (height + 1) / 2; hit.userData.area = plot.area; g.add(hit); raycastTargets.push(hit);
  const P = { plot, group: g, inner, rubble, scaff, height, p: -1, disp: 0, mats: b.mats, extras: [], hover: 0 };
  places[plot.area] = P; return P;
}

function buildPlaces() {
  const by = a => PLOTS.find(p => p.area === a);
  // Sign Shop — shop with striped awning and a big sign
  makePlace(by('signs'), (b, g) => {
    b.box(4.4, 3.2, 3.2, 0xFFE3B3, 0, 1.6, 0); b.roof(5, 3.6, 1.6, 0xEF5B4C, 0, 3.2, 0, { ry: 0 });
    b.box(1, 1.8, 0.1, 0x8A5A3B, 0, 0.9, 1.62); b.box(1, 0.9, 0.1, 0xBFE3EF, -1.45, 1.6, 1.62); b.box(1, 0.9, 0.1, 0xBFE3EF, 1.45, 1.6, 1.62);
    for (let i = 0; i < 7; i++) b.box(0.62, 0.08, 1.1, i % 2 ? 0xFFFFFF : 0xEF5B4C, -1.86 + i * 0.62, 2.35, 2.05, { rx: 0.35, line: 0.02 });
    const sg = b.box(3.4, 0.9, 0.16, 0x8A5A3B, 0, 3.0, 1.75); const face = new THREE.Mesh(new THREE.PlaneGeometry(3.15, 0.7), new THREE.MeshBasicMaterial({ map: signTexture('SIGNS') }));
    face.position.set(0, 0, 0.09); sg.add(face); b.box(0.5, 0.7, 0.5, 0x7A5BA6, 1.7, 0.35, 2.2); b.ball(0.3, 0xFFC94A, -1.8, 0.3, 2.2);
  }, 4.6);
  // Library — columns and a pediment
  makePlace(by('library'), (b, g) => {
    b.box(5, 0.4, 3.6, 0xD8D2C4, 0, 0.2, 0.2); b.box(4.4, 2.8, 2.8, 0x9DB7D9, 0, 1.8, -0.2);
    for (let i = 0; i < 4; i++) b.cyl(0.22, 0.25, 2.6, 0xFFFDF4, -1.65 + i * 1.1, 1.7, 1.55);
    b.box(5, 0.35, 3.6, 0xFFFDF4, 0, 3.2, 0.2); b.roof(5, 3.6, 1.3, 0x5C7FB8, 0, 3.37, 0.2);
    b.box(0.9, 1.6, 0.1, 0x6B4A33, 0, 1.2, 1.25);
    const bk = new THREE.Group(); bk.position.set(0, 5.0, 0.2); g.add(bk); const bb = builder(bk, true); bb.mats.forEach(m => b.mats.push(m));
    bb.box(1.1, 0.12, 0.8, 0xEF5B4C, -0.55, 0, 0, { rz: 0.25 }); bb.box(1.1, 0.12, 0.8, 0xEF5B4C, 0.55, 0, 0, { rz: -0.25 });
  }, 5.4);
  // Detective's office — tall house, round window, magnifying glass sign
  makePlace(by('detective'), (b, g) => {
    b.box(2.8, 4.2, 2.6, 0x8E73BF, 0, 2.1, 0); b.roof(3.2, 3, 1.5, 0x4B3C70, 0, 4.2, 0);
    b.cyl(0.55, 0.55, 0.12, 0xFFE07A, 0, 3.0, 1.32, { rx: Math.PI / 2 }); b.box(0.9, 1.6, 0.1, 0x3A2E55, 0, 0.8, 1.32);
    b.torus(0.5, 0.1, 0xC9A227, 1.75, 2.6, 1.0, { ry: 0.4 }); b.box(0.14, 0.9, 0.14, 0x6B4A33, 2.05, 1.85, 1.15, { rz: 0.6 });
    b.cyl(0.1, 0.1, 1.2, 0x6B4A33, -1.0, 4.8, -0.3);
  }, 5.8);
  // Market — three striped stalls with fruit
  makePlace(by('market'), (b) => {
    const stall = (x, z, c) => { b.box(2, 0.9, 1.1, 0xC98B4F, x, 0.45, z); for (const [dx, dz] of [[-.9, -.5], [.9, -.5], [-.9, .5], [.9, .5]]) b.box(0.1, 2.2, 0.1, 0x8A5A3B, x + dx, 1.1, z + dz, { line: 0.02 });
      for (let i = 0; i < 5; i++) b.box(0.42, 0.08, 1.5, i % 2 ? 0xFFFFFF : c, x - 0.84 + i * 0.42, 2.25, z, { rx: 0.25, line: 0.02 });
      for (let i = 0; i < 6; i++) b.ball(0.16, [0xEF5B4C, 0x7A5BA6, 0x7CC24A][(i + Math.round(x) + 9) % 3], x - 0.6 + (i % 3) * 0.6, 1.02, z - 0.2 + Math.floor(i / 3) * 0.4, { line: 0.02 }); };
    stall(-2.3, 0.4, 0xEF5B4C); stall(0, -1.1, 0x4FB3D9); stall(2.3, 0.4, 0x3E9B5C);
    b.box(0.7, 0.5, 0.7, 0xC98B4F, -0.4, 0.25, 1.6); b.box(0.7, 0.5, 0.7, 0xC98B4F, 0.4, 0.25, 1.9);
  }, 2.6);
  // Train Station — platform, house with a clock
  makePlace(by('train'), (b) => {
    b.box(5.6, 0.45, 2.2, 0xD8D2C4, 0, 0.22, 1.0); b.box(3.6, 2.4, 2.2, 0x6DBB8A, 0, 1.6, -0.6); b.roof(4.2, 2.8, 1.2, 0x2F6E4A, 0, 2.8, -0.6);
    b.cyl(0.5, 0.5, 0.12, 0xFFFDF4, 0, 3.3, 0.55, { rx: Math.PI / 2 }); b.box(0.06, 0.35, 0.05, INK, 0, 3.4, 0.62, { line: 0 }); b.box(0.25, 0.05, 0.05, INK, 0.08, 3.3, 0.62, { line: 0 });
    b.box(0.9, 1.5, 0.1, 0x6B4A33, -0.9, 1.2, 0.52); b.box(0.9, 0.7, 0.1, 0xBFE3EF, 0.9, 1.6, 0.52);
    b.box(0.1, 1.8, 0.1, 0x2E2A4F, 2.4, 1.1, 1.8, { line: 0 }); b.box(0.9, 0.4, 0.08, 0xFFC94A, 2.4, 2.0, 1.8);
  }, 4.2);
  // Workshop — barn with a big gear and a chimney
  makePlace(by('workshop'), (b, g) => {
    b.box(4.2, 3, 3.2, 0xC2513F, 0, 1.5, 0); b.roof(4.8, 3.6, 1.8, 0x6B4A33, 0, 3, 0);
    b.box(1.6, 2.1, 0.1, 0xFFE3B3, 0, 1.05, 1.62); b.box(0.08, 2.1, 0.12, 0xC2513F, 0, 1.05, 1.66, { line: 0 });
    b.cyl(0.35, 0.35, 1.6, 0x8D8D99, 1.3, 4, -0.6);
    const gear = new THREE.Group(); gear.position.set(-1.35, 2.3, 1.7); g.add(gear); const gb = builder(gear, true); gb.mats.forEach(m => b.mats.push(m));
    gb.cyl(0.6, 0.6, 0.18, 0xFFC94A, 0, 0, 0, { rx: Math.PI / 2 }); for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; gb.box(0.26, 0.26, 0.18, 0xFFC94A, Math.cos(a) * 0.7, Math.sin(a) * 0.7, 0, { rz: a, line: 0.02 }); }
    gb.cyl(0.18, 0.18, 0.22, 0x2E2A4F, 0, 0, 0, { rx: Math.PI / 2, line: 0 });
    places.__gear = gear;
  }, 4.8);
  // Lighthouse — striped tower with a turning beam
  makePlace(by('storm'), (b, g) => {
    b.cyl(1.7, 2.0, 0.6, 0xB7B1A6, 0, 0.3, 0);
    for (let i = 0; i < 5; i++) b.cyl(1.25 - i * 0.12, 1.37 - i * 0.12, 1.2, i % 2 ? 0xFFFDF4 : 0xEF5B4C, 0, 1.2 + i * 1.2, 0);
    b.cyl(0.95, 0.95, 0.15, 0x2E2A4F, 0, 6.65, 0, { line: 0 }); b.cyl(0.7, 0.7, 1, 0xFFF3B0, 0, 7.2, 0); b.cone(0.95, 1, 0xEF5B4C, 0, 8.2, 0);
    b.box(0.6, 1, 0.1, 0x6B4A33, 0, 1.0, 1.25);
    const beam = new THREE.Mesh(new THREE.ConeGeometry(1.6, 9, 20, 1, true), new THREE.MeshBasicMaterial({ color: 0xFFF3B0, transparent: true, opacity: 0.0, depthWrite: false, side: THREE.DoubleSide }));
    beam.rotation.z = Math.PI / 2; beam.position.x = 4.5; const pivot = new THREE.Group(); pivot.position.y = 7.2; pivot.add(beam); g.add(pivot);
    places.__beam = { pivot, beam };
  }, 8.8);
  // Science Lab — white lab with an observatory dome, telescope and a sun sign
  makePlace(by('science'), (b, g) => {
    b.box(3.6, 2.6, 2.8, 0xF3F6FA, 0, 1.3, 0); b.box(3.8, 0.3, 3.0, 0x4FB3D9, 0, 2.75, 0);
    b.add(new THREE.SphereGeometry(1.15, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), 0xB9C6DA, 0.5, 2.9, -0.2, { line: 0.04 });
    b.box(0.35, 0.35, 1.5, 0x2E2A4F, 0.9, 3.7, 0.2, { rx: -0.7, line: 0.02 });
    b.box(0.9, 1.6, 0.1, 0x3B8FC4, -0.8, 0.8, 1.42); b.box(0.9, 0.8, 0.1, 0xBFE3EF, 0.9, 1.5, 1.42);
    b.cyl(0.08, 0.08, 1.4, 0x8A5A3B, -1.9, 3.1, 1.2, { line: 0 }); b.ball(0.35, 0xFFC94A, -1.9, 3.95, 1.2);
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; b.box(0.08, 0.28, 0.08, 0xF2B62B, -1.9 + Math.cos(a) * 0.5, 3.95 + Math.sin(a) * 0.5, 1.2, { rz: a + Math.PI / 2, line: 0 }); }
    b.box(0.6, 0.4, 0.6, 0x7A5BA6, 1.5, 0.2, 1.8); b.cyl(0.12, 0.18, 0.5, 0x9FE3AE, 1.5, 0.65, 1.8, { line: 0.02 });
  }, 4.4);
  // Bridge — built plank by plank across the river
  const bp = by('bridge'); const mid = RIVER.getPoint(0.5), tg = RIVER.getTangent(0.5);
  bp.x = mid.x; bp.z = mid.z; bp.rot = Math.atan2(tg.x, tg.z);
  const g = new THREE.Group(); g.position.set(bp.x, 0.6, bp.z); g.rotation.y = bp.rot; scene.add(g);
  const b = builder(g, true); const planks = [];
  for (let i = 0; i < 14; i++) { const x = -3.25 + i * 0.5;
    planks.push(b.box(0.46, 0.18, 1.9, i % 2 ? 0xC98B4F : 0xB87A42, x, 0.55 + Math.sin((x + 3.25) / 6.5 * Math.PI) * 0.6, 0, { rz: -Math.cos((x + 3.25) / 6.5 * Math.PI) * 0.28, line: 0.02 })); }
  const rails = new THREE.Group(); g.add(rails); const rb2 = builder(rails, true); rb2.mats.forEach(m => b.mats.push(m));
  for (const side of [-1, 1]) { for (let i = 0; i <= 6; i++) { const x = -3 + i; rb2.box(0.12, 0.8, 0.12, 0x8A5A3B, x, 0.95 + Math.sin((x + 3.25) / 6.5 * Math.PI) * 0.6, side * 0.95, { line: 0.02 }); }
    for (let i = 0; i < 6; i++) { const x = -2.5 + i; rb2.box(1.02, 0.1, 0.1, 0xC98B4F, x, 1.3 + Math.sin((x + 3.25) / 6.5 * Math.PI) * 0.6, side * 0.95, { rz: -Math.cos((x + 3.25) / 6.5 * Math.PI) * 0.28, line: 0.02 }); } }
  const lamps = new THREE.Group(); g.add(lamps); const lb = builder(lamps);
  for (const x of [-3.4, 3.4]) for (const z of [-1.1, 1.1]) { lb.cyl(0.07, 0.09, 1.6, INK, x, 1.3, z, { line: 0 }); lb.ball(0.2, 0xFFE07A, x, 2.15, z, { line: 0.02 }); }
  const hit = new THREE.Mesh(new THREE.BoxGeometry(7.5, 2.5, 3.5), new THREE.MeshBasicMaterial({ visible: false })); hit.position.y = 1; hit.userData.area = 'bridge'; g.add(hit); raycastTargets.push(hit);
  places.bridge = { plot: bp, group: g, inner: g, planks, rails, lamps, rubble: null, scaff: null, height: 2.5, p: -1, disp: 0, mats: b.mats, extras: [], isBridge: true, hover: 0 };
  // a broken stump of the old bridge on each bank
  const sb = builder(g); sb.box(0.5, 0.4, 1.9, 0x8D6B4F, -3.6, 0.2, 0, { rz: 0.2 }); sb.box(0.5, 0.4, 1.9, 0x8D6B4F, 3.6, 0.2, 0, { rz: -0.2 });
}

// Train that runs along the back edge once the station has started
let train;
function buildTrain() {
  const g = new THREE.Group(); scene.add(g);
  const tb = builder(g); const zT = -13.2 * SP;
  for (let x = -0.5 * SP; x <= 17.5 * SP; x += 0.7) tb.box(0.18, 0.08, 1.4, 0x8A5A3B, x, 0.66, zT, { line: 0 });
  tb.box(18.4 * SP, 0.1, 0.1, 0x8D8D99, 8.5 * SP, 0.74, zT - 0.5, { line: 0 }); tb.box(18.4 * SP, 0.1, 0.1, 0x8D8D99, 8.5 * SP, 0.74, zT + 0.5, { line: 0 });
  const car = new THREE.Group(); g.add(car); const cb = builder(car);
  cb.box(1.8, 1.1, 1.2, 0xEF5B4C, 0, 1.4, 0); cb.box(0.9, 0.9, 1.25, 0x2E2A4F, -0.5, 2.3, 0); cb.cyl(0.22, 0.28, 0.7, 0x2E2A4F, 0.55, 2.2, 0);
  for (const x of [-0.55, 0.55]) for (const z of [-0.62, 0.62]) cb.cyl(0.32, 0.32, 0.12, 0x2E2A4F, x, 0.95, z, { rx: Math.PI / 2, line: 0 });
  const wag = (x, c) => { cb.box(1.6, 0.9, 1.1, c, x, 1.3, 0); for (const xx of [x - 0.5, x + 0.5]) for (const z of [-0.58, 0.58]) cb.cyl(0.26, 0.26, 0.1, 0x2E2A4F, xx, 0.92, z, { rx: Math.PI / 2, line: 0 }); };
  wag(-2, 0xFFC94A); wag(-3.9, 0x4FB3D9);
  car.position.set(9 * SP, 0, zT); car.visible = false; train = { car, zT, t: 0 };
}

// Clouds drifting around the island
function buildClouds() {
  for (let i = 0; i < 9; i++) {
    const c = new THREE.Group(); const b = builder(c); const n = 3 + Math.floor(Math.random() * 3);
    for (let k = 0; k < n; k++) b.ball(1 + Math.random() * 0.8, 0xFFFFFF, k * 1.3 - n * 0.6, Math.random() * 0.5, Math.random() * 0.8, { line: 0, shadow: false });
    const a = Math.random() * Math.PI * 2, r = (28 + Math.random() * 12) * SP, y = (i % 3 === 0 ? -9 : 7) + Math.random() * 5;
    c.position.set(Math.cos(a) * r, y, Math.sin(a) * r); scene.add(c);
    const sp = 0.01 + Math.random() * 0.015; animated.push(t => { const aa = a + t * sp; c.position.x = Math.cos(aa) * r; c.position.z = Math.sin(aa) * r; c.lookAt(0, c.position.y, 0); });
  }
}

// ---------------------------------------------------------------- word objects (spelling words that "live" in town)
const WORD_SPOTS = {
  pond:  { x: -16.5, z: -0.5, make: b => { const w = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, 0.1, 24), waterMat()); w.position.y = 0.05; b.group.add(w); b.cyl(2.05, 2.1, 0.08, 0xE9D59A, 0, 0, 0, { line: 0.03, seg: 24 });
    b.box(0.4, 0.3, 0.3, 0xFFFFFF, 0.5, 0.25, 0.3, { line: 0.02 }); b.ball(0.15, 0x3E9B5C, 0.75, 0.45, 0.3, { line: 0.02 }); b.cone(0.07, 0.15, 0xF08A2E, 0.92, 0.45, 0.3, { rz: -Math.PI / 2, line: 0 }); } },
  camp:  { x: -16, z: 9, make: b => { b.cone(1.3, 1.8, 0xF08A2E, 0, 0.9, 0, { seg: 4, ry: Math.PI / 4 }); b.box(0.5, 0.9, 0.05, 0x6B3A1F, 0, 0.45, 0.88, { line: 0 }); for (let i = 0; i < 3; i++) b.box(0.6, 0.12, 0.12, 0x8A5A3B, 2, 0.1, i * 0.15 - 0.15, { ry: i, line: 0.02 }); b.cone(0.25, 0.5, 0xFFC94A, 2, 0.4, 0, { line: 0 }); } },
  stage: { x: -1.5, z: -11, make: b => { b.box(3.2, 0.6, 2, 0xC98B4F, 0, 0.3, 0); b.box(3.2, 2.2, 0.15, 0xB82E3A, 0, 1.7, -0.95); b.box(0.15, 2.4, 0.15, 0x8A5A3B, -1.6, 1.8, -0.9); b.box(0.15, 2.4, 0.15, 0x8A5A3B, 1.6, 1.8, -0.9); b.box(0.35, 0.8, 0.35, 0xFFC94A, 0.4, 1, 0.2); b.ball(0.22, 0xFFE3B3, 0.4, 1.6, 0.2); } },
  rose:  { x: -8.5, z: 2.5, make: b => { b.ball(0.7, 0x3E9B5C, 0, 0.55, 0); for (let i = 0; i < 5; i++) b.ball(0.17, 0xE0303E, Math.cos(i * 1.3) * 0.5, 0.75 + (i % 2) * 0.25, Math.sin(i * 1.3) * 0.5, { line: 0.02 }); } },
  net:   { x: 5.6, z: 9.5, make: b => { b.box(0.1, 1.6, 0.1, 0x8A5A3B, -0.9, 0.8, 0); b.box(0.1, 1.6, 0.1, 0x8A5A3B, 0.9, 0.8, 0); const n = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.2, 6, 4), new THREE.MeshBasicMaterial({ color: INK, wireframe: true })); n.position.y = 0.9; b.group.add(n); b.ball(0.2, 0xF08A2E, 0.3, 0.8, 0.05, { line: 0.02 }); } },
  plum:  { x: -7.5, z: -10, make: b => { b.cyl(0.2, 0.28, 1.4, 0x8A5A3B, 0, 0.7, 0); b.ball(1.2, 0x4FAF62, 0, 2.0, 0); for (let i = 0; i < 7; i++) b.ball(0.16, 0x6E3D8F, Math.cos(i) * 1.05, 1.7 + (i % 3) * 0.3, Math.sin(i) * 1.05, { line: 0.02 }); } },
  grape: { x: 15, z: -8, make: b => { b.box(0.1, 1.8, 0.1, 0x8A5A3B, -0.8, 0.9, 0); b.box(0.1, 1.8, 0.1, 0x8A5A3B, 0.8, 0.9, 0); b.box(1.8, 0.1, 0.1, 0x8A5A3B, 0, 1.8, 0); b.ball(0.45, 0x5DBA6B, 0, 1.8, 0.1);
    for (const x of [-0.4, 0.4]) for (let i = 0; i < 6; i++) b.ball(0.12, 0x7CC24A, x + (i % 2) * 0.12 - 0.06, 1.5 - Math.floor(i / 2) * 0.17, 0.15, { line: 0.015 }); } },
  rake:  { x: 14.6, z: 9.6, make: b => { b.box(0.08, 2.2, 0.08, 0x8A5A3B, 0, 1.1, 0, { rz: 0.25 }); b.box(0.9, 0.08, 0.08, 0x8D8D99, 0.28, 0.05, 0, { rz: 0.25 }); for (let i = 0; i < 5; i++) b.box(0.04, 0.2, 0.04, 0x8D8D99, 0.03 + i * 0.2, 0.1 - 0.1 + i * 0.05, 0, { line: 0 }); b.ball(0.5, 0xE89A3C, 0.9, 0.25, 0.4, { line: 0.02 }); b.ball(0.4, 0xD9533E, 1.4, 0.2, 0.0, { line: 0.02 }); } },
  pole:  { x: 4.5, z: -7.5, make: b => { b.cyl(0.07, 0.09, 4, 0xD8D2C4, 0, 2, 0); b.ball(0.15, 0xFFC94A, 0, 4.05, 0); const f = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.7, 6, 1), toon(0xEF5B4C, { side: THREE.DoubleSide })); f.position.set(0.62, 3.55, 0); b.group.add(f);
    animated.push(t => { const p = f.geometry.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i) + 0.6; p.setZ(i, Math.sin(t * 4 + x * 4) * 0.12 * x); } p.needsUpdate = true; }); } },
  mule:  { x: -0.5, z: 12.5, make: b => { b.box(1.4, 0.7, 0.6, 0x9C8A7A, 0, 1.0, 0); for (const x of [-0.5, 0.5]) for (const z of [-0.2, 0.2]) b.box(0.15, 0.7, 0.15, 0x7A6A5C, x, 0.35, z, { line: 0.02 });
    b.box(0.45, 0.5, 0.4, 0x9C8A7A, 0.85, 1.45, 0); b.box(0.12, 0.45, 0.08, 0x7A6A5C, 0.8, 1.9, -0.12, { line: 0.02 }); b.box(0.12, 0.45, 0.08, 0x7A6A5C, 0.8, 1.9, 0.12, { line: 0.02 }); b.box(0.3, 0.25, 0.3, 0xD8C8B8, 1.12, 1.35, 0, { line: 0.02 }); } },
  stamp: { x: -6.5, z: -3.5, make: b => { b.box(0.12, 1.1, 0.12, 0x2E2A4F, 0, 0.55, 0, { line: 0 }); b.box(0.7, 0.55, 0.5, 0x3B8FC4, 0, 1.3, 0); b.cyl(0.35, 0.35, 0.5, 0x3B8FC4, 0, 1.55, 0, { rx: Math.PI / 2 }); b.box(0.25, 0.2, 0.02, 0xFFC94A, 0.2, 1.35, 0.27, { line: 0.01 }); } },
  jam:   { x: 12.4, z: -4.2, make: b => { b.box(1.4, 0.8, 0.9, 0xC98B4F, 0, 0.4, 0); b.cyl(0.22, 0.22, 0.45, 0xC7283A, -0.3, 1.02, 0); b.cyl(0.24, 0.24, 0.08, 0xFFFDF4, -0.3, 1.27, 0, { line: 0.02 }); b.cyl(0.18, 0.18, 0.36, 0x6E3D8F, 0.3, 0.98, 0.1); b.cyl(0.2, 0.2, 0.07, 0xFFFDF4, 0.3, 1.18, 0.1, { line: 0.02 }); } },
};
for (const s of Object.values(WORD_SPOTS)) { s.x *= SP; s.z *= SP; }
export const TOWN_WORDS = Object.keys(WORD_SPOTS);
function buildWordObjects() {
  for (const [w, s] of Object.entries(WORD_SPOTS)) {
    const g = new THREE.Group(); g.position.set(s.x, Y0, s.z); g.visible = false; scene.add(g);
    const b = builder(g); b.group = g; s.make(b);
    const hit = new THREE.Mesh(new THREE.SphereGeometry(1.6, 8, 6), new THREE.MeshBasicMaterial({ visible: false })); hit.position.y = 1; hit.userData.word = w; g.add(hit);
    wordObjs[w] = { group: g, hit, shown: false, label: null };
  }
}

// ---------------------------------------------------------------- decorations bought with coins
// Every purchase gets a spot from a fixed (seeded) pool, in the order it was bought, so the town looks the same after a reload.
const PAL = { red: 0xEF5B4C, orange: 0xF08A2E, yellow: 0xFFC94A, pink: 0xF49AA4, purple: 0x7A5BA6, blue: 0x4FB3D9, green: 0x3E9B5C, leaf: 0x5DBA6B, wood: 0xC98B4F, bark: 0x8A5A3B, white: 0xFFFDF4, stone: 0xD8D2C4, gray: 0x8D8D99, skin: 0xFFE3B3 };
const tween = (anim, fn) => anim.push(fn);
const DECOR_MAKERS = {
  flowers(b) { for (let i = 0; i < 6; i++) { const a = i; b.cyl(0.03, 0.03, 0.5, PAL.green, Math.cos(a) * 0.5, 0.25, Math.sin(a) * 0.5, { line: 0 }); b.ball(0.16, [PAL.red, PAL.yellow, PAL.pink, PAL.purple][i % 4], Math.cos(a) * 0.5, 0.55, Math.sin(a) * 0.5, { line: 0.02 }); } },
  bush(b) { b.ball(0.6, PAL.green, 0, 0.45, 0); b.ball(0.45, PAL.leaf, 0.45, 0.35, 0.15); b.ball(0.4, PAL.leaf, -0.42, 0.3, -0.1); },
  gnome(b) { b.cyl(0.22, 0.28, 0.45, PAL.blue, 0, 0.22, 0); b.ball(0.18, PAL.skin, 0, 0.58, 0, { line: 0.02 }); b.cone(0.13, 0.25, PAL.white, 0, 0.47, 0.12, { rx: 0.6, line: 0.02 }); b.cone(0.2, 0.5, PAL.red, 0, 0.92, 0, { rz: 0.15 }); },
  mushrooms(b) { for (const [x, z, s] of [[0, 0, 1], [0.45, 0.2, 0.7], [-0.35, 0.3, 0.6]]) { b.cyl(0.08 * s, 0.1 * s, 0.4 * s, PAL.white, x, 0.2 * s, z, { line: 0.02 }); b.ball(0.26 * s, PAL.red, x, 0.42 * s, z, { line: 0.02 }); b.ball(0.05 * s, PAL.white, x + 0.1 * s, 0.6 * s, z + 0.08 * s, { line: 0 }); } },
  pumpkins(b) { for (const [x, z, s] of [[0, 0, 1], [0.55, 0.2, 0.7], [-0.4, 0.35, 0.6]]) { const p = b.ball(0.35 * s, PAL.orange, x, 0.3 * s, z, { line: 0.03 }); p.scale.y = 0.75; b.cyl(0.04, 0.05, 0.18 * s, PAL.green, x, 0.6 * s, z, { line: 0 }); } },
  butterflies(b, anim) { b.ball(0.35, PAL.leaf, 0, 0.3, 0); for (let i = 0; i < 3; i++) { const g = new THREE.Group(); b.group.add(g); const bb = builder(g); const c = [PAL.yellow, PAL.pink, PAL.blue][i];
    const L = bb.box(0.22, 0.02, 0.18, c, -0.11, 0, 0, { line: 0.01 }), R = bb.box(0.22, 0.02, 0.18, c, 0.11, 0, 0, { line: 0.01 });
    tween(anim, t => { const a = t * 0.9 + i * 2.1; g.position.set(Math.cos(a) * 0.9, 1 + Math.sin(t * 2 + i) * 0.3, Math.sin(a) * 0.9); g.rotation.y = -a; L.rotation.z = Math.sin(t * 18) * 0.7; R.rotation.z = -Math.sin(t * 18) * 0.7; }); } },
  lamp(b) { b.cyl(0.08, 0.12, 2.6, INK, 0, 1.3, 0, { line: 0 }); b.box(0.45, 0.5, 0.45, 0xFFE07A, 0, 2.75, 0, { line: 0.03 }); b.cone(0.38, 0.35, INK, 0, 3.15, 0, { seg: 4, line: 0 }); },
  mailbox(b) { b.box(0.1, 0.9, 0.1, PAL.bark, 0, 0.45, 0); b.box(0.35, 0.3, 0.55, PAL.blue, 0, 1.0, 0); b.cyl(0.175, 0.175, 0.55, PAL.blue, 0, 1.15, 0, { rx: Math.PI / 2 }); b.box(0.03, 0.25, 0.12, PAL.red, 0.2, 1.25, 0.1, { line: 0.01 }); },
  birdhouse(b, anim) { b.box(0.12, 1.6, 0.12, PAL.bark, 0, 0.8, 0); b.box(0.5, 0.5, 0.5, PAL.yellow, 0, 1.85, 0); b.cone(0.45, 0.35, PAL.red, 0, 2.27, 0, { seg: 4, ry: Math.PI / 4 }); b.cyl(0.1, 0.1, 0.02, INK, 0, 1.9, 0.26, { rx: Math.PI / 2, line: 0 });
    const bird = b.ball(0.12, PAL.blue, 0.15, 2.5, 0, { line: 0.02 }); tween(anim, t => bird.position.y = 2.5 + Math.abs(Math.sin(t * 3)) * 0.15); },
  bench(b) { b.box(1.8, 0.12, 0.6, PAL.wood, 0, 0.55, 0); b.box(1.8, 0.5, 0.1, PAL.wood, 0, 0.9, -0.28); for (const xx of [-0.75, 0.75]) b.box(0.1, 0.55, 0.5, INK, xx, 0.27, 0, { line: 0 }); },
  bunting(b, anim) { for (const x of [-1.2, 1.2]) b.cyl(0.06, 0.07, 2.2, PAL.bark, x, 1.1, 0); const g = new THREE.Group(); g.position.y = 2.0; b.group.add(g); const bb = builder(g);
    for (let i = 0; i < 7; i++) { const x = -0.9 + i * 0.3, y = -Math.sin((i + 1) / 8 * Math.PI) * 0.3; bb.cone(0.12, 0.28, [PAL.red, PAL.yellow, PAL.blue, PAL.green][i % 4], x, y - 0.12, 0, { seg: 3, rx: Math.PI, line: 0.01 }); }
    tween(anim, t => g.rotation.x = Math.sin(t * 1.5) * 0.12); },
  appletree(b) { b.cyl(0.2, 0.28, 1.4, PAL.bark, 0, 0.7, 0); b.ball(1.15, PAL.leaf, 0, 2.0, 0); for (let i = 0; i < 8; i++) b.ball(0.13, PAL.red, Math.cos(i * 0.8) * 1.05, 1.6 + (i % 3) * 0.35, Math.sin(i * 0.8) * 1.05, { line: 0.02 }); },
  sakura(b) { b.cyl(0.18, 0.3, 1.6, 0x6B3A2A, 0, 0.8, 0); for (const [x, y, z, r] of [[0, 2.1, 0, 1.0], [0.7, 1.8, 0.3, 0.7], [-0.6, 1.9, -0.2, 0.75], [0.1, 2.6, 0.2, 0.6]]) b.ball(r, 0xF7B6C8, x, y, z); for (let i = 0; i < 6; i++) b.ball(0.08, 0xF7B6C8, Math.cos(i) * 1.3, 0.05, Math.sin(i) * 1.1, { line: 0 }); },
  bunny(b, anim) { const g = new THREE.Group(); b.group.add(g); const bb = builder(g); bb.ball(0.28, PAL.white, 0, 0.3, 0); bb.ball(0.18, PAL.white, 0, 0.55, 0.2); bb.box(0.07, 0.3, 0.04, PAL.white, -0.07, 0.8, 0.18, { line: 0.015 }); bb.box(0.07, 0.3, 0.04, PAL.white, 0.07, 0.8, 0.18, { line: 0.015 }); bb.ball(0.04, PAL.pink, 0, 0.55, 0.38, { line: 0 }); bb.ball(0.1, PAL.white, 0, 0.3, -0.28, { line: 0.01 });
    b.cone(0.07, 0.35, PAL.orange, 0.6, 0.12, 0.2, { rz: Math.PI / 2 }); tween(anim, t => { const k = t * 0.6 % 1; g.position.y = Math.abs(Math.sin(t * 5)) * 0.25; g.rotation.y = Math.sin(t * 0.7) * 1.2; }); },
  kite(b, anim) { b.box(0.1, 0.3, 0.1, PAL.bark, 0, 0.15, 0); const g = new THREE.Group(); b.group.add(g); const bb = builder(g); bb.box(0.03, 3.6, 0.03, INK, 0, 1.8, 0, { line: 0, rz: 0.35 });
    const k = new THREE.Group(); k.position.set(-1.25, 3.5, 0); g.add(k); const kb = builder(k); kb.box(0.7, 0.7, 0.04, PAL.red, 0, 0, 0, { rz: Math.PI / 4, line: 0.02 }); kb.box(0.25, 0.25, 0.05, PAL.yellow, 0, 0, 0.01, { rz: Math.PI / 4, line: 0 }); for (let i = 0; i < 4; i++) kb.box(0.15, 0.08, 0.02, [PAL.blue, PAL.yellow][i % 2], 0.1 * (i % 2), -0.6 - i * 0.25, 0, { line: 0 });
    tween(anim, t => { g.rotation.y = t * 0.3; k.rotation.z = Math.sin(t * 2) * 0.25; k.position.y = 3.5 + Math.sin(t * 1.3) * 0.25; }); },
  cat(b, anim) { const body = b.ball(0.35, PAL.orange, 0, 0.3, 0); body.scale.set(1, 0.7, 1.3); const head = b.ball(0.24, PAL.orange, 0, 0.45, 0.42); for (const x of [-0.12, 0.12]) b.cone(0.08, 0.15, PAL.orange, x, 0.72, 0.42, { line: 0.01 });
    b.box(0.3, 0.06, 0.02, INK, 0, 0.45, 0.66, { line: 0 }); const tail = b.cyl(0.05, 0.05, 0.6, PAL.orange, 0, 0.35, -0.5, { rx: 1.1, line: 0.015 }); tween(anim, t => { tail.rotation.z = Math.sin(t * 2) * 0.4; body.scale.y = 0.7 + Math.sin(t * 1.5) * 0.04; }); },
  picnic(b) { const m = b.box(1.6, 0.03, 1.2, PAL.red, 0, 0.02, 0, { line: 0.02 }); for (let i = 0; i < 4; i++) b.box(0.2, 0.035, 1.2, PAL.white, -0.6 + i * 0.4, 0.025, 0, { line: 0 });
    b.box(0.5, 0.35, 0.35, PAL.wood, 0.3, 0.2, -0.1); b.box(0.04, 0.3, 0.04, PAL.bark, 0.3, 0.5, -0.1, { line: 0 }); b.ball(0.12, PAL.red, -0.4, 0.13, 0.25, { line: 0.02 }); b.cyl(0.2, 0.2, 0.05, PAL.white, -0.35, 0.06, -0.25, { line: 0.02 }); },
  snowman(b) { b.ball(0.5, PAL.white, 0, 0.5, 0); b.ball(0.36, PAL.white, 0, 1.2, 0); b.ball(0.26, PAL.white, 0, 1.7, 0); b.cone(0.06, 0.3, PAL.orange, 0, 1.7, 0.36, { rx: Math.PI / 2, line: 0 }); b.cyl(0.22, 0.22, 0.3, INK, 0, 2.05, 0, { line: 0 }); b.cyl(0.33, 0.33, 0.04, INK, 0, 1.9, 0, { line: 0 }); b.box(0.6, 0.1, 0.12, PAL.red, 0, 1.45, 0.1, { line: 0.01 }); },
  doghouse(b, anim) { b.box(1.1, 0.9, 1.1, PAL.wood, 0, 0.45, 0); b.cone(0.95, 0.6, PAL.red, 0, 1.2, 0, { seg: 4, ry: Math.PI / 4 }); b.box(0.45, 0.55, 0.02, INK, 0, 0.3, 0.56, { line: 0 });
    const dog = new THREE.Group(); dog.position.set(0.9, 0, 0.7); b.group.add(dog); const db = builder(dog); const bd = db.ball(0.28, 0xE0C49A, 0, 0.35, 0); bd.scale.z = 1.4; db.ball(0.2, 0xE0C49A, 0, 0.6, 0.35); db.box(0.08, 0.2, 0.12, 0x8A5A3B, -0.15, 0.62, 0.35, { line: 0.01 }); db.box(0.08, 0.2, 0.12, 0x8A5A3B, 0.15, 0.62, 0.35, { line: 0.01 });
    const tail = db.cyl(0.04, 0.04, 0.3, 0xE0C49A, 0, 0.5, -0.42, { rx: -0.6, line: 0.01 }); tween(anim, t => tail.rotation.z = Math.sin(t * 14) * 0.6); },
  seesaw(b, anim) { b.cone(0.3, 0.5, PAL.gray, 0, 0.25, 0, { seg: 4, ry: Math.PI / 4 }); const g = new THREE.Group(); g.position.y = 0.5; b.group.add(g); const bb = builder(g);
    bb.box(2.6, 0.1, 0.35, PAL.yellow, 0, 0, 0); for (const x of [-1.15, 1.15]) bb.box(0.06, 0.3, 0.3, PAL.red, x, 0.2, 0, { line: 0.01 }); tween(anim, t => g.rotation.z = Math.sin(t * 1.6) * 0.25); },
  swing(b, anim) { b.box(0.12, 2.4, 0.12, PAL.bark, -0.9, 1.2, 0, { rz: 0.1 }); b.box(0.12, 2.4, 0.12, PAL.bark, 0.9, 1.2, 0, { rz: -0.1 }); b.box(2.1, 0.12, 0.12, PAL.bark, 0, 2.35, 0);
    const sw = new THREE.Group(); sw.position.set(0, 2.3, 0); b.group.add(sw); const s2 = builder(sw); s2.box(0.03, 1.6, 0.03, INK, -0.3, -0.8, 0, { line: 0 }); s2.box(0.03, 1.6, 0.03, INK, 0.3, -0.8, 0, { line: 0 }); s2.box(0.8, 0.08, 0.35, PAL.red, 0, -1.62, 0);
    tween(anim, t => sw.rotation.x = Math.sin(t * 2) * 0.35); },
  slide(b) { b.box(0.8, 0.12, 0.8, PAL.blue, 0, 1.6, -0.6); for (const x of [-0.35, 0.35]) for (const z of [-0.95, -0.25]) b.box(0.08, 1.6, 0.08, PAL.gray, x, 0.8, z, { line: 0.01 });
    for (let i = 0; i < 4; i++) b.box(0.7, 0.05, 0.05, PAL.gray, 0, 0.35 + i * 0.35, -1.0, { line: 0 }); b.box(0.7, 0.08, 2.0, PAL.yellow, 0, 0.85, 0.5, { rx: 0.85 }); },
  well(b) { b.cyl(0.7, 0.75, 0.7, PAL.stone, 0, 0.35, 0, { seg: 16 }); const w = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.05, 16), waterMat()); w.position.y = 0.6; b.group.add(w);
    for (const x of [-0.6, 0.6]) b.box(0.1, 1.4, 0.1, PAL.bark, x, 1.2, 0); b.cone(0.95, 0.6, PAL.red, 0, 2.1, 0, { seg: 4, ry: Math.PI / 4 }); b.cyl(0.05, 0.05, 1.2, PAL.bark, 0, 1.6, 0, { rz: Math.PI / 2, line: 0 }); b.cyl(0.15, 0.12, 0.2, PAL.gray, 0, 1.15, 0, { line: 0.02 }); },
  icecream(b, anim) { b.box(1.5, 0.8, 0.8, PAL.white, 0, 0.7, 0); b.box(1.5, 0.15, 0.8, PAL.pink, 0, 0.35, 0, { line: 0.02 }); for (const x of [-0.5, 0.5]) b.cyl(0.25, 0.25, 0.1, INK, x, 0.25, 0.42, { rx: Math.PI / 2, line: 0 });
    b.cyl(0.04, 0.04, 1.3, PAL.gray, 0, 1.75, 0, { line: 0 }); const um = b.cone(1.0, 0.45, PAL.pink, 0, 2.55, 0, { seg: 8 }); b.cone(0.12, 0.35, 0xE8C27A, 0.5, 1.25, 0, { rx: Math.PI, line: 0.02 }); b.ball(0.15, 0xF7B6C8, 0.5, 1.48, 0, { line: 0.02 });
    tween(anim, t => um.rotation.y = t * 0.5); },
  fountain(b, anim) { b.cyl(1.4, 1.5, 0.5, PAL.stone, 0, 0.25, 0, { seg: 20 }); const w = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 0.08, 20), waterMat()); w.position.y = 0.5; b.group.add(w);
    b.cyl(0.25, 0.35, 1.2, PAL.stone, 0, 0.9, 0); b.cyl(0.6, 0.4, 0.2, PAL.stone, 0, 1.5, 0); const sp = b.ball(0.3, 0x9FE0F2, 0, 1.8, 0, { line: 0 }); tween(anim, t => sp.scale.set(1, 1 + Math.sin(t * 6) * 0.25, 1)); },
  windmill(b, anim) { b.cyl(0.6, 0.9, 3.4, 0xFFF1D0, 0, 1.7, 0); b.cone(0.85, 1, PAL.red, 0, 3.9, 0); const hub = new THREE.Group(); hub.position.set(0, 3.1, 0.75); b.group.add(hub); const hb = builder(hub);
    for (let i = 0; i < 4; i++) { const blade = new THREE.Group(); blade.rotation.z = i * Math.PI / 2; hub.add(blade); builder(blade).box(0.4, 1.7, 0.06, PAL.white, 0, 0.95, 0, { line: 0.02 }); }
    hb.ball(0.15, INK, 0, 0, 0, { line: 0 }); tween(anim, t => hub.rotation.z = t * 0.9); },
  statue(b, anim) { b.box(1.0, 0.6, 1.0, PAL.stone, 0, 0.3, 0); b.box(0.8, 0.15, 0.8, PAL.stone, 0, 0.67, 0); b.cyl(0.12, 0.2, 0.7, 0xE8B530, 0, 1.1, 0);
    const s = new THREE.Group(); s.position.y = 1.9; b.group.add(s); const sh = new THREE.Shape(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 0.25 : 0.6, a = i / 10 * Math.PI * 2 + Math.PI / 2; i ? sh.lineTo(Math.cos(a) * r, Math.sin(a) * r) : sh.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
    const geo = new THREE.ExtrudeGeometry(sh, { depth: 0.2, bevelEnabled: false }); geo.translate(0, 0, -0.1); builder(s).add(geo, 0xFFC94A, 0, 0, 0, { line: 0.03 }); tween(anim, t => s.rotation.y = t * 0.8); },
  balloon(b, anim) { const bl = new THREE.Group(); b.group.add(bl); const bb = builder(bl); bb.ball(1.3, PAL.red, 0, 6.5, 0, { seg: 18 }); bb.box(0.6, 0.45, 0.6, PAL.wood, 0, 4.4, 0);
    for (const [dx, dz] of [[-.25, -.25], [.25, -.25], [-.25, .25], [.25, .25]]) bb.box(0.03, 1.1, 0.03, INK, dx, 5.1, dz, { line: 0 });
    for (let i = 0; i < 6; i++) bb.box(0.08, 2.5, 0.02, PAL.white, Math.cos(i) * 1.25, 6.5, Math.sin(i) * 1.25, { ry: -i, line: 0 });
    tween(anim, t => bl.position.y = Math.sin(t * 0.8) * 0.5); },
  treehouse(b) { b.cyl(0.35, 0.5, 3.0, PAL.bark, 0, 1.5, 0); b.ball(1.8, PAL.green, 0, 4.4, 0); b.ball(1.2, PAL.leaf, 1.1, 4.0, 0.6); b.box(1.6, 0.12, 1.6, PAL.wood, 0, 2.6, 0.3); b.box(1.2, 0.9, 1.0, 0xE89A3C, 0, 3.1, 0.4); b.cone(0.95, 0.6, PAL.red, 0, 3.85, 0.4, { seg: 4, ry: Math.PI / 4 }); b.box(0.35, 0.5, 0.02, INK, 0, 2.95, 0.91, { line: 0 });
    for (let i = 0; i < 6; i++) b.box(0.5, 0.05, 0.08, PAL.bark, 0.6, 0.3 + i * 0.4, 1.1, { line: 0 }); for (const x of [0.37, 0.83]) b.box(0.05, 2.5, 0.05, PAL.bark, x, 1.3, 1.1, { line: 0 }); },
  carousel(b, anim) { b.cyl(2.0, 2.1, 0.3, PAL.white, 0, 0.15, 0, { seg: 24 }); b.cyl(0.2, 0.2, 2.6, PAL.yellow, 0, 1.4, 0); const top = b.cone(2.3, 1.0, PAL.red, 0, 3.1, 0, { seg: 12 }); b.ball(0.2, PAL.yellow, 0, 3.7, 0);
    const ring = new THREE.Group(); b.group.add(ring); const rb = builder(ring);
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2, x = Math.cos(a) * 1.5, z = Math.sin(a) * 1.5; rb.cyl(0.04, 0.04, 2.4, PAL.gray, x, 1.5, z, { line: 0 }); const h = rb.box(0.25, 0.4, 0.7, [PAL.white, PAL.pink, PAL.blue][i % 3], x, 1.1, z, { ry: -a }); h.userData.k = i; rb.ball(0.14, [PAL.white, PAL.pink, PAL.blue][i % 3], x + Math.cos(a + Math.PI / 2) * 0.35, 1.4, z + Math.sin(a + Math.PI / 2) * 0.35, { line: 0.02 }); }
    tween(anim, t => { ring.rotation.y = t * 0.6; top.rotation.y = t * 0.6; ring.position.y = Math.sin(t * 3) * 0.08; }); },
  castle(b, anim) { const g = new THREE.Group(); b.group.add(g); const cb = builder(g); cb.box(2.6, 0.5, 2.6, PAL.blue, 0, 0.25, 0); for (const [x, z] of [[-1.1, -1.1], [1.1, -1.1], [-1.1, 1.1], [1.1, 1.1]]) { cb.cyl(0.4, 0.4, 2.0, PAL.red, x, 1.2, z); cb.cone(0.45, 0.6, PAL.yellow, x, 2.5, z); }
    for (const [w, d, x, z] of [[2.2, 0.25, 0, -1.1], [0.25, 2.2, -1.1, 0], [0.25, 2.2, 1.1, 0]]) cb.box(w, 1.0, d, PAL.yellow, x, 0.95, z); tween(anim, t => g.scale.set(1 + Math.sin(t * 5) * 0.02, 1 - Math.sin(t * 5) * 0.03, 1 + Math.sin(t * 5) * 0.02)); },
  ferris(b, anim) { for (const z of [-0.6, 0.6]) { b.box(0.18, 4.2, 0.18, PAL.gray, -1.0, 2.0, z, { rz: -0.25 }); b.box(0.18, 4.2, 0.18, PAL.gray, 1.0, 2.0, z, { rz: 0.25 }); } b.box(3.4, 0.25, 1.6, PAL.stone, 0, 0.12, 0);
    const wheel = new THREE.Group(); wheel.position.set(0, 4.0, 0); b.group.add(wheel); const wb = builder(wheel); const rim = new THREE.Mesh(new THREE.TorusGeometry(2.6, 0.08, 6, 36), toon(PAL.white)); outline(rim, 0.02); wheel.add(rim);
    const cars = []; for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; wb.box(0.06, 2.6, 0.06, PAL.white, Math.cos(a) * 1.3, Math.sin(a) * 1.3, 0, { rz: a + Math.PI / 2, line: 0 }); const car = new THREE.Group(); car.position.set(Math.cos(a) * 2.6, Math.sin(a) * 2.6, 0); wheel.add(car); builder(car).box(0.55, 0.45, 0.7, [PAL.red, PAL.yellow, PAL.blue, PAL.green][i % 4], 0, -0.3, 0, { line: 0.02 }); cars.push(car); }
    tween(anim, t => { wheel.rotation.z = t * 0.25; for (const c of cars) c.rotation.z = -wheel.rotation.z; }); },
  // ---- 20 more (2026-10-28): ground variety, river, sky and under-island pieces
  sundial(b) { b.cyl(0.55, 0.65, 0.5, PAL.stone, 0, 0.25, 0, { seg: 16 }); b.cyl(0.6, 0.6, 0.06, 0xF3E3B0, 0, 0.53, 0, { seg: 16, line: 0.02 });
    for (let i = 0; i < 12; i++) b.box(0.03, 0.02, 0.12, INK, Math.cos(i / 12 * Math.PI * 2) * 0.48, 0.57, Math.sin(i / 12 * Math.PI * 2) * 0.48, { ry: -i / 12 * Math.PI * 2, line: 0 });
    b.box(0.04, 0.35, 0.4, 0xC9A23A, 0, 0.72, 0, { rx: 0.5, line: 0.02 }); b.box(0.06, 0.01, 0.6, 0x7A6F5C, 0.18, 0.565, 0.12, { ry: 0.6, line: 0 }); },
  beehive(b, anim) { b.box(0.12, 0.7, 0.12, PAL.bark, 0, 0.35, 0); b.box(0.7, 0.08, 0.7, PAL.wood, 0, 0.72, 0);
    for (let i = 0; i < 4; i++) b.cyl(0.38 - i * 0.07, 0.42 - i * 0.07, 0.2, 0xF2C14E, 0, 0.88 + i * 0.18, 0, { line: 0.02 }); b.cyl(0.07, 0.07, 0.02, INK, 0, 0.9, 0.4, { rx: Math.PI / 2, line: 0 });
    const bees = new THREE.Group(); bees.position.y = 1.2; b.group.add(bees); const bb = builder(bees); for (let i = 0; i < 3; i++) { const a = i * 2.1; bb.ball(0.07, 0xFFC94A, Math.cos(a) * 0.8, i * 0.15, Math.sin(a) * 0.8, { line: 0.01 }); }
    tween(anim, t => { bees.rotation.y = t * 2.5; bees.position.y = 1.2 + Math.sin(t * 5) * 0.08; }); },
  scarecrow(b) { b.box(0.1, 2.0, 0.1, PAL.bark, 0, 1.0, 0); b.box(1.6, 0.08, 0.08, PAL.bark, 0, 1.45, 0); b.box(0.75, 0.75, 0.35, 0x5C7FB8, 0, 1.25, 0, { line: 0.03 });
    for (const x of [-0.8, 0.8]) b.cone(0.1, 0.25, 0xE8C27A, x, 1.45, 0, { rz: x < 0 ? Math.PI / 2 : -Math.PI / 2, line: 0.01 });
    const hd = b.ball(0.32, PAL.orange, 0, 1.95, 0); hd.scale.y = 0.85; b.cyl(0.36, 0.42, 0.06, 0xC9A23A, 0, 2.18, 0, { line: 0.02 }); b.cone(0.24, 0.35, 0xC9A23A, 0, 2.38, 0); for (const x of [-0.11, 0.11]) b.cone(0.05, 0.08, INK, x, 2.0, 0.3, { rx: Math.PI / 2, seg: 3, line: 0 }); },
  garden(b) { b.box(2.0, 0.2, 1.4, 0x7A5236, 0, 0.1, 0, { line: 0.03 }); for (const z of [-0.45, 0, 0.45]) for (let i = 0; i < 4; i++) { const x = -0.72 + i * 0.48;
      if (z < 0) { b.cone(0.07, 0.2, PAL.orange, x, 0.18, z, { rx: Math.PI, line: 0.01 }); b.cone(0.1, 0.22, PAL.leaf, x, 0.36, z, { line: 0 }); }
      else if (z === 0) b.ball(0.17, 0x8CC95E, x, 0.32, z, { line: 0.015 }); else b.ball(0.13, 0xD9533E, x, 0.3, z, { line: 0.015 }); }
    b.box(0.08, 0.6, 0.08, PAL.bark, 1.1, 0.3, 0.6); b.box(0.35, 0.22, 0.03, PAL.white, 1.1, 0.62, 0.64, { line: 0.015 }); },
  fairyhouse(b, anim) { b.cyl(0.55, 0.65, 1.1, 0xFFF1D0, 0, 0.55, 0, { seg: 14 }); const cap = b.ball(1.05, PAL.red, 0, 1.25, 0, { seg: 16 }); cap.scale.y = 0.62;
    for (let i = 0; i < 6; i++) b.ball(0.12, PAL.white, Math.cos(i * 1.05) * 0.7, 1.6 + (i % 2) * 0.12, Math.sin(i * 1.05) * 0.7, { line: 0 });
    b.box(0.32, 0.5, 0.04, 0x8A5A3B, 0, 0.3, 0.6, { line: 0.02 }); const win = b.cyl(0.13, 0.13, 0.04, 0xFFE07A, 0.32, 0.75, 0.52, { rx: Math.PI / 2, line: 0.02 }); b.cyl(0.05, 0.08, 0.3, PAL.stone, -0.4, 1.95, 0.1, { line: 0.01 });
    tween(anim, t => win.material.emissive && win.material.emissive.setScalar(0.25 + Math.sin(t * 2) * 0.15)); },
  lemonade(b) { b.box(1.4, 0.8, 0.6, 0xFFE07A, 0, 0.4, 0); b.box(1.5, 0.08, 0.7, PAL.wood, 0, 0.84, 0); for (const x of [-0.65, 0.65]) b.box(0.07, 1.0, 0.07, PAL.wood, x, 1.35, -0.25);
    for (let i = 0; i < 5; i++) b.box(0.3, 0.06, 0.5, i % 2 ? PAL.white : 0xF5D23A, -0.6 + i * 0.3, 1.9, -0.05, { rx: 0.35, line: 0.01 });
    b.cyl(0.14, 0.12, 0.35, 0xFFF3A0, -0.3, 1.05, 0.05, { line: 0.02 }); for (const x of [0.15, 0.4]) b.cyl(0.07, 0.06, 0.16, 0xFFF3A0, x, 0.96, 0.1, { line: 0.01 }); b.box(0.9, 0.22, 0.02, PAL.white, 0, 0.5, 0.31, { line: 0.01 }); },
  coop(b, anim) { b.box(1.2, 0.8, 0.9, 0xB8463A, 0, 0.6, 0); b.cone(0.95, 0.5, 0x8A5A3B, 0, 1.25, 0, { seg: 4, ry: Math.PI / 4 }); for (const [x, z] of [[-0.5, -0.35], [0.5, -0.35], [-0.5, 0.35], [0.5, 0.35]]) b.box(0.08, 0.25, 0.08, PAL.bark, x, 0.12, z, { line: 0 });
    b.box(0.3, 0.35, 0.02, INK, 0.25, 0.55, 0.46, { line: 0 }); b.box(0.15, 0.04, 0.5, PAL.wood, 0.25, 0.25, 0.7, { rx: -0.5, line: 0.01 });
    for (let i = 0; i < 2; i++) { const c = new THREE.Group(); c.position.set(-0.4 + i * 1.1, 0, 1.0); b.group.add(c); const cb = builder(c); cb.ball(0.18, PAL.white, 0, 0.22, 0, { line: 0.015 }); const hd = new THREE.Group(); hd.position.set(0, 0.36, 0.15); c.add(hd); const hb = builder(hd); hb.ball(0.1, PAL.white, 0, 0, 0, { line: 0.01 }); hb.cone(0.04, 0.08, PAL.orange, 0, 0, 0.1, { rx: Math.PI / 2, line: 0 }); hb.box(0.04, 0.07, 0.07, PAL.red, 0, 0.1, 0, { line: 0 });
      tween(anim, t => { hd.rotation.x = Math.max(0, Math.sin(t * 3 + i * 2)) * 0.9; }); } },
  telescope(b, anim) { for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI * 2; b.box(0.06, 1.2, 0.06, PAL.wood, Math.cos(a) * 0.3, 0.55, Math.sin(a) * 0.3, { rx: Math.sin(a) * 0.25, rz: -Math.cos(a) * 0.25, line: 0.01 }); }
    const tube = new THREE.Group(); tube.position.y = 1.15; b.group.add(tube); const tb = builder(tube); tb.cyl(0.13, 0.17, 1.2, 0x3B5BA8, 0, 0, 0, { rz: -1.0, line: 0.02 }); tb.cyl(0.19, 0.19, 0.1, 0xC9A23A, 0.5, 0.33, 0, { rz: -1.0, line: 0.01 });
    tween(anim, t => tube.rotation.y = Math.sin(t * 0.3) * 0.8); },
  clocktower(b, anim) { b.box(1.1, 3.2, 1.1, 0xE9D9B8, 0, 1.6, 0); b.box(1.3, 0.2, 1.3, PAL.wood, 0, 3.3, 0); b.cone(0.95, 1.1, 0x3B5BA8, 0, 3.95, 0, { seg: 4, ry: Math.PI / 4 }); b.ball(0.1, PAL.yellow, 0, 4.55, 0, { line: 0 });
    for (const [x, z, ry] of [[0, 0.56, 0], [0.56, 0, Math.PI / 2]]) { b.cyl(0.38, 0.38, 0.04, PAL.white, x, 2.6, z, { rx: Math.PI / 2, rz: ry, line: 0.02 }); }
    const hands = new THREE.Group(); hands.position.set(0, 2.6, 0.6); b.group.add(hands); const hb = builder(hands); const hr = hb.box(0.04, 0.22, 0.02, INK, 0, 0.1, 0, { line: 0 }); const mn = new THREE.Group(); hands.add(mn); builder(mn).box(0.03, 0.3, 0.02, INK, 0, 0.14, 0.01, { line: 0 });
    b.box(0.4, 0.7, 0.04, PAL.wood, 0, 0.35, 0.56, { line: 0.02 }); tween(anim, t => { mn.rotation.z = -t * 0.6; hr.rotation.z = -t * 0.05; }); },
  // river
  lilypads(b, anim) { for (const [x, z, r] of [[0, 0, 0.45], [0.8, 0.4, 0.35], [-0.6, 0.6, 0.3], [0.3, -0.7, 0.32]]) { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.04, 14, 1, false, 0.3, Math.PI * 1.8), toon(0x4FAF62)); m.position.set(x, 0.02, z); outline(m, 0.02); b.group.add(m); }
    b.ball(0.12, PAL.pink, 0.8, 0.12, 0.4, { line: 0.01 }); const frog = new THREE.Group(); b.group.add(frog); const fb = builder(frog); const bd = fb.ball(0.2, 0x7CC24A, 0, 0.17, 0, { line: 0.015 }); bd.scale.y = 0.75; for (const x of [-0.09, 0.09]) fb.ball(0.07, PAL.white, x, 0.3, 0.1, { line: 0.01 });
    tween(anim, t => { const k = (t * 0.35) % 1; frog.position.y = k > 0.9 ? Math.sin((k - 0.9) * 10 * Math.PI) * 0.25 : 0; }); },
  swans(b, anim) { const g = new THREE.Group(); b.group.add(g); for (let i = 0; i < 3; i++) { const s = new THREE.Group(); s.position.set(i ? 0.6 * i - 0.9 : 0, 0, i ? -0.7 : 0); s.scale.setScalar(i ? 0.55 : 1); g.add(s); const sb = builder(s);
      const bd = sb.ball(0.32, PAL.white, 0, 0.2, 0, { line: 0.02 }); bd.scale.set(0.8, 0.6, 1.2); sb.cyl(0.06, 0.07, 0.5, PAL.white, 0, 0.5, 0.25, { rx: -0.25, line: 0.015 }); sb.ball(0.1, PAL.white, 0, 0.78, 0.33, { line: 0.015 }); sb.cone(0.04, 0.12, PAL.orange, 0, 0.77, 0.47, { rx: Math.PI / 2, line: 0 }); }
    tween(anim, t => { g.position.z = Math.sin(t * 0.3) * 1.2; g.rotation.y = Math.cos(t * 0.3) > 0 ? 0 : Math.PI; g.position.y = Math.sin(t * 2) * 0.03; }); },
  rowboat(b, anim) { const g = new THREE.Group(); b.group.add(g); const bb = builder(g); const hull = bb.box(0.9, 0.35, 2.0, 0xC97B3F, 0, 0.12, 0); bb.box(0.7, 0.05, 1.8, 0x8A5A3B, 0, 0.3, 0, { line: 0 }); bb.box(0.9, 0.06, 0.2, 0xC97B3F, 0, 0.32, 0.2, { line: 0.01 });
    bb.cone(0.45, 0.6, 0xC97B3F, 0, 0.12, 1.25, { rx: Math.PI / 2, seg: 4, ry: Math.PI / 4 }); for (const x of [-0.6, 0.6]) bb.box(0.05, 0.04, 1.3, PAL.wood, x, 0.35, -0.1, { ry: x < 0 ? 0.4 : -0.4, rz: x < 0 ? 0.3 : -0.3, line: 0 }); bb.ball(0.12, 0xFFC94A, 0, 0.5, -0.5, { line: 0.01 });
    tween(anim, t => { g.rotation.z = Math.sin(t * 1.4) * 0.05; g.position.y = Math.sin(t * 1.8) * 0.04; }); },
  dock(b) { b.box(1.2, 0.08, 2.6, PAL.wood, 0, 0.35, 0); for (const z of [-1.1, -0.2, 0.7]) for (const x of [-0.55, 0.55]) b.cyl(0.07, 0.07, 0.8, PAL.bark, x, 0.1, z, { line: 0.01 });
    b.box(0.05, 0.6, 0.05, PAL.bark, 0.4, 0.9, 1.1, { rz: -0.3, line: 0 }); b.box(0.01, 0.9, 0.01, INK, 0.62, 0.75, 1.1, { line: 0 }); b.ball(0.06, PAL.red, 0.62, 0.3, 1.1, { line: 0 }); b.box(0.35, 0.25, 0.3, PAL.blue, -0.3, 0.52, -0.9, { line: 0.02 }); },
  waterwheel(b, anim) { b.box(1.8, 1.6, 1.4, 0xE9D9B8, -1.3, 0.8, 0); b.cone(1.4, 0.8, PAL.red, -1.3, 2.0, 0, { seg: 4, ry: Math.PI / 4 }); b.box(0.15, 1.2, 0.15, PAL.bark, 0, 0.9, -0.45);
    const wh = new THREE.Group(); wh.position.set(0, 0.9, 0); b.group.add(wh); const wb = builder(wh); const rim = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.06, 6, 24), toon(PAL.wood)); rim.rotation.y = Math.PI / 2; outline(rim, 0.015); wh.add(rim);
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; wb.box(0.5, 0.35, 0.06, PAL.wood, 0, Math.sin(a) * 0.85, Math.cos(a) * 0.85, { rx: -a, ry: Math.PI / 2, line: 0.01 }); }
    tween(anim, t => wh.rotation.x = t * 0.8); },
  // sky
  lanterns(b, anim) { for (let i = 0; i < 6; i++) { const l = new THREE.Group(); b.group.add(l); const lb = builder(l); lb.cyl(0.22, 0.17, 0.42, [0xFF8A3D, 0xFFC94A, 0xEF5B4C][i % 3], 0, 0, 0, { seg: 8, line: 0.02 }); lb.ball(0.07, 0xFFF3A0, 0, -0.25, 0, { line: 0 });
      const a = i / 6 * Math.PI * 2, r = 1.5 + (i % 2) * 1.2; tween(anim, t => { l.position.set(Math.cos(a + t * 0.12) * r, Math.sin(t * 0.8 + i) * 0.5 + (i % 3) * 0.6, Math.sin(a + t * 0.12) * r); }); } },
  cloudpal(b, anim) { const g = new THREE.Group(); b.group.add(g); const cb = builder(g); for (const [x, y, r] of [[0, 0, 0.9], [0.9, -0.1, 0.65], [-0.85, -0.15, 0.6], [0.4, 0.45, 0.6]]) cb.ball(r, PAL.white, x, y, 0, { line: 0.03 });
    for (const x of [-0.3, 0.3]) cb.ball(0.08, INK, x, 0.05, 0.85, { line: 0 }); cb.box(0.3, 0.05, 0.05, PAL.pink, 0, -0.25, 0.85, { line: 0 });
    const drops = []; for (let i = 0; i < 5; i++) drops.push(cb.cone(0.06, 0.16, 0x7CC7E8, -0.6 + i * 0.3, -1, 0.2, { rx: Math.PI, line: 0 }));
    tween(anim, t => { g.position.y = Math.sin(t * 0.7) * 0.3; drops.forEach((d, i) => d.position.y = -0.9 - ((t * 1.5 + i * 0.37) % 1.4)); }); },
  birds(b, anim) { const g = new THREE.Group(); b.group.add(g); const wings = []; for (let i = 0; i < 5; i++) { const br = new THREE.Group(); br.position.set(i * 0.7 - 1.4 + 9, Math.abs(i - 2) * -0.3, Math.abs(i - 2) * -0.6); g.add(br); const bb = builder(br);
      bb.ball(0.12, 0x2E2A4F, 0, 0, 0, { line: 0 }); for (const s of [-1, 1]) { const w = bb.box(0.45, 0.03, 0.16, 0x2E2A4F, s * 0.25, 0, 0, { line: 0 }); wings.push([w, s]); } br.rotation.y = -Math.PI / 2; }
    tween(anim, t => { g.rotation.y = t * 0.18; wings.forEach(([w, s], k) => w.rotation.z = s * Math.sin(t * 9 + k) * 0.6); }); },
  skyisland(b, anim) { const g = new THREE.Group(); b.group.add(g); const ib = builder(g); const top = ib.cyl(1.6, 1.3, 0.4, 0x8CC95E, 0, 0, 0, { seg: 12, line: 0.04 }); ib.cone(1.3, 2.0, 0xA9744A, 0, -1.2, 0, { rx: Math.PI, seg: 10 });
    ib.cyl(0.12, 0.17, 0.8, PAL.bark, 0.4, 0.6, 0); ib.ball(0.6, PAL.leaf, 0.4, 1.2, 0); ib.box(0.5, 0.4, 0.5, 0xFFE3B3, -0.6, 0.4, 0.2); ib.cone(0.45, 0.35, PAL.red, -0.6, 0.78, 0.2, { seg: 4, ry: Math.PI / 4 });
    const fall = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 2.4), waterMat()); fall.position.set(1.35, -1.0, 0.6); g.add(fall); tween(anim, t => { g.position.y = Math.sin(t * 0.5) * 0.4; g.rotation.y = t * 0.05; }); },
  airship(b, anim) { const pv = new THREE.Group(); b.group.add(pv); const ship = new THREE.Group(); ship.position.set(13, 0, 0); pv.add(ship); const sb = builder(ship);
    const env = sb.ball(1, 0xF4E1B8, 0, 0, 0, { seg: 18, line: 0.04 }); env.scale.set(1.1, 1.1, 2.6); for (const z of [-1.2, 0, 1.2]) sb.cyl(1.12, 1.12, 0.12, PAL.red, 0, 0, z, { rx: Math.PI / 2, seg: 18, line: 0 });
    sb.box(0.6, 0.4, 1.2, PAL.wood, 0, -1.35, 0.2); for (const z of [-0.2, 0.6]) sb.box(0.03, 0.4, 0.03, INK, 0, -1.0, z, { line: 0 }); for (const r of [0, Math.PI / 2]) sb.box(0.06, 1.0, 0.7, PAL.red, 0, 0, -2.5, { rz: r });
    const prop = new THREE.Group(); prop.position.set(0, -1.35, -0.5); ship.add(prop); builder(prop).box(0.06, 0.7, 0.06, INK, 0, 0, 0, { line: 0 });
    tween(anim, t => { pv.rotation.y = -t * 0.06; ship.position.y = Math.sin(t * 0.7) * 0.3; prop.rotation.z = t * 12; }); },
  // under the island
  crystals(b, anim) { const gs = []; for (const [x, y, z, s, c] of [[0, 0, 0, 1, 0x9B7BE0], [0.7, 0.2, 0.3, 0.7, 0x6FC7E8], [-0.6, 0.1, 0.2, 0.8, 0xF49AA4], [0.2, 0.3, -0.5, 0.6, 0x9B7BE0], [-0.2, 0.2, 0.6, 0.5, 0x6FC7E8]]) {
      const m = b.add(new THREE.OctahedronGeometry(0.5 * s), toon(c, { emissive: c, emissiveIntensity: 0.35 }), x, y - 0.5 * s, z, { line: 0.03 }); m.scale.y = 2.2; gs.push(m); }
    tween(anim, t => gs.forEach((m, i) => m.material.emissiveIntensity = 0.3 + Math.sin(t * 1.5 + i) * 0.2)); },
  rainbow(b) { [PAL.red, PAL.orange, PAL.yellow, PAL.green, PAL.blue, PAL.purple].forEach((c, i) => { const m = new THREE.Mesh(new THREE.TorusGeometry(9 - i * 0.45, 0.24, 6, 40, Math.PI), toon(c)); m.position.y = -1; b.group.add(m); }); },
};
// name, price, how many can be placed, clear radius on the ground
export const DECOR_LIST = [
  ['flowers', 'Flowers', 6, 3, 0.6], ['bush', 'Bush', 6, 2, 0.7], ['gnome', 'Garden gnome', 7, 2, 0.4], ['mushrooms', 'Mushrooms', 7, 2, 0.5],
  ['pumpkins', 'Pumpkins', 8, 2, 0.6], ['mailbox', 'Mailbox', 9, 2, 0.35], ['lamp', 'Lamp', 10, 3, 0.3], ['butterflies', 'Butterflies', 10, 2, 0.6],
  ['birdhouse', 'Bird house', 11, 1, 0.35], ['bench', 'Bench', 12, 2, 1.0], ['bunting', 'Flags', 14, 2, 1.2], ['appletree', 'Apple tree', 14, 2, 1.1],
  ['bunny', 'Bunny', 15, 2, 0.5], ['snowman', 'Snowman', 15, 2, 0.6], ['picnic', 'Picnic', 16, 2, 1.0], ['cat', 'Cat', 18, 2, 0.5],
  ['kite', 'Kite', 18, 2, 0.4], ['sakura', 'Pink tree', 18, 2, 0.9], ['swing', 'Swing', 20, 1, 1.3], ['doghouse', 'Dog house', 22, 1, 1.2],
  ['seesaw', 'Seesaw', 22, 1, 1.3], ['well', 'Wishing well', 24, 1, 1.0], ['slide', 'Slide', 25, 1, 1.3], ['icecream', 'Ice cream cart', 28, 1, 1.2],
  ['fountain', 'Fountain', 30, 1, 1.5], ['windmill', 'Windmill', 35, 1, 1.2], ['statue', 'Star statue', 40, 1, 0.8], ['balloon', 'Hot-air balloon', 45, 2, 0.5],
  ['treehouse', 'Tree house', 50, 1, 1.6], ['carousel', 'Carousel', 60, 1, 2.1], ['rainbow', 'Rainbow', 60, 1, 0], ['castle', 'Bouncy castle', 70, 1, 1.8],
  ['ferris', 'Ferris wheel', 90, 1, 1.9],
  // added 2026-10-28 — new kinds always go at the end so old saves stay the same
  ['sundial', 'Sundial', 12, 1, 0.6], ['lilypads', 'Lily pads', 12, 1, 0, 'river'], ['beehive', 'Beehive', 14, 1, 0.5], ['scarecrow', 'Scarecrow', 16, 1, 0.6],
  ['garden', 'Veggie garden', 16, 2, 1.2], ['swans', 'Swans', 20, 1, 0, 'river'], ['rowboat', 'Rowboat', 24, 1, 0, 'river'], ['lemonade', 'Lemonade stand', 26, 1, 1.0],
  ['coop', 'Chicken coop', 28, 1, 1.2], ['telescope', 'Telescope', 30, 1, 0.6], ['dock', 'Fishing dock', 30, 1, 0, 'river'], ['lanterns', 'Sky lanterns', 32, 1, 0, 'sky'],
  ['cloudpal', 'Rain cloud friend', 35, 1, 0, 'sky'], ['birds', 'Flying birds', 38, 1, 0, 'sky'], ['fairyhouse', 'Mushroom house', 45, 1, 1.1], ['clocktower', 'Clock tower', 55, 1, 0.9],
  ['waterwheel', 'Water mill', 55, 1, 1.4, 'mill'], ['crystals', 'Cliff crystals', 65, 1, 0, 'cliff'], ['skyisland', 'Sky island', 80, 1, 0, 'sky'], ['airship', 'Airship', 100, 1, 0, 'sky'],
].map(([kind, name, price, max, r, zone = 'ground']) => ({ kind, name, price, max, r, zone }));
const DECOR_BY = Object.fromEntries(DECOR_LIST.map(d => [d.kind, d]));
function buildDecor(kind, anim) { const g = new THREE.Group(); const b = builder(g); b.group = g; DECOR_MAKERS[kind](b, anim || []); return g; }

// seeded pool of ground spots (shuffled once) + everything already on the ground
const FILLERS = [];   // trees and rocks from buildIsland
const decorPlaced = []; // { g, x, z, r, kind }
const decorObs = [];    // obstacles for walkers
let POOL = null;
function decorPool() {
  if (POOL) return POOL; const R = srand(99); const pts = [];
  for (let x = -RX; x <= RX; x += 1.1) for (let z = -RZ; z <= RZ; z += 1.1) pts.push([x + (R() - 0.5) * 0.7, z + (R() - 0.5) * 0.7]);
  for (let i = pts.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [pts[i], pts[j]] = [pts[j], pts[i]]; }
  return POOL = pts;
}
let STATIC = null, RESERVED = null;
const BIG = ['swing', 'doghouse', 'seesaw', 'well', 'slide', 'icecream', 'fountain', 'windmill', 'treehouse', 'carousel', 'castle', 'ferris']; // spots that are clear of buildings, river, trees and word objects (checked once)
function spotFor(r, big = false) {
  if (!STATIC) STATIC = decorPool().map(([x, z]) => {
    if (!insideIsland(x, z, 1.2)) return null; if (z < -12 * SP && x > -1 * SP) return null;
    let room = Math.abs(x - riverXAt(z)) - 2.9;
    for (const p of PLOTS) room = Math.min(room, Math.hypot(p.x - x, p.z - z) - (p.area === 'bridge' ? 3.4 : p.r + 0.4));
    for (const w of Object.values(WORD_SPOTS)) room = Math.min(room, Math.hypot(w.x - x, w.z - z) - 1.4);
    for (let m = 0; m < 3; m += 0.25) if (!insideIsland(x, z, 1.2 + m)) { room = Math.min(room, m); break; }
    return room > 0.4 ? [x, z, room] : null; }).filter(Boolean).sort((a, b) => a[2] - b[2]); // best fit: small things take small gaps
  if (!RESERVED) { RESERVED = []; for (const [x, z, room] of [...STATIC].sort((a, b) => b[2] - a[2])) { const rr = Math.min(room, 2.2);
    if (RESERVED.length < BIG.length && rr >= 1.1 && RESERVED.every(q => Math.hypot(q.x - x, q.z - z) > q.rr + rr + 0.2)) RESERVED.push({ x, z, rr }); } RESERVED.sort((a, b) => a.rr - b.rr); }
  const taken = (x, z, rr) => decorPlaced.some(d => Math.hypot(d.x - x, d.z - z) < d.r + rr + 0.35);
  if (big) { const q = RESERVED.find(q => q.rr >= r * 0.85 && !taken(q.x, q.z, r)); if (q) return [q.x, q.z]; }
  for (const [x, z, room] of STATIC) {
    if (room < r * 0.85) continue;
    if (!big && RESERVED.some(q => Math.hypot(q.x - x, q.z - z) < q.rr + r + 0.15)) continue; // keep the big spots free for big things
    if (taken(x, z, r)) continue;
    return [x, z];
  }
  return null;
}
// Off-the-ground places: on the river, in the sky, on the cliff. Each has its own fixed spots so the ground stays roomy.
const SKY_AT = { lanterns: [-13, 9, -11], cloudpal: [12, 8.5, -9], birds: [0, 13, -6], skyisland: [-24, 6, -8], airship: [0, 15, -8] };
for (const k in SKY_AT) { SKY_AT[k][0] *= SP; SKY_AT[k][2] *= SP; }
const RIVER_T = [0.14, 0.27, 0.62, 0.72, 0.85];
function zoneSpot(def) {
  const used = decorPlaced.filter(d => d.zone === def.zone).map(d => d.si);
  if (def.zone === 'sky') return used.includes(def.kind) ? null : { at: SKY_AT[def.kind], si: def.kind };
  if (def.zone === 'cliff') return used.length ? null : { at: [8 * SP, -1.3, 15.1 * SP], ry: 0.15, si: 0 };
  if (def.zone === 'mill') { if (used.length) return null; const p = RIVER.getPoint(0.8); return { at: [p.x + 2.4, Y0 - 0.35, p.z], ry: Math.PI, si: 0 }; }
  const ks = RIVER_T.map((t, k) => k).filter(k => { const p = RIVER.getPoint(RIVER_T[k]); return Math.hypot(p.x - 0.7 * SP, p.z + 0.2 * SP) > 4.5 && !used.includes(k); });
  if (!ks.length) return null; const k = ks[0], p = RIVER.getPoint(RIVER_T[k]), tan = RIVER.getTangent(RIVER_T[k]);
  if (def.kind === 'dock') return { at: [p.x + 2.3, 0.3, p.z], ry: Math.PI / 2, si: k };
  return { at: [p.x, 0.5, p.z], ry: Math.atan2(tan.x, tan.z), si: k };
}
// list = every kind bought, in buying order. Returns where the newest one landed (for the camera).
export function setDecor(list, animateNewest = false) {
  let landed = null;
  while (decorPlaced.length > list.length) { const d = decorPlaced.pop(); scene.remove(d.g); const i = decorObs.indexOf(d.ob); if (i >= 0) decorObs.splice(i, 1); }
  for (let i = decorPlaced.length; i < list.length; i++) {
    const kind = list[i], def = DECOR_BY[kind]; if (!def) { decorPlaced.push({ g: new THREE.Group(), x: 999, z: 999, r: 0 }); continue; }
    const g = buildDecor(kind, animated); let x, z;
    let si, zone = def.zone;
    if (kind === 'rainbow') { x = 0; z = -16; g.position.set(0, 2, -16); }
    else if (zone !== 'ground') { const s = zoneSpot(def); if (!s) { decorPlaced.push({ g, x: 999, z: 999, r: 0, kind, zone }); continue; } [x, , z] = s.at; g.position.set(...s.at); g.rotation.y = s.ry || 0; si = s.si; }
    else { const s = spotFor(def.r, BIG.includes(kind)); if (!s) { decorPlaced.push({ g, x: 999, z: 999, r: 0 }); continue; } [x, z] = s; g.position.set(x, Y0, z); g.rotation.y = srand(i + 7)() * Math.PI * 2; }
    scene.add(g); const d = { g, x, z, r: def.r, kind, zone, si }; decorPlaced.push(d);
    for (const f of FILLERS) if (f.g.visible && Math.hypot(f.x - x, f.z - z) < f.r + def.r) f.g.visible = false; // the decoration replaces trees/rocks under it
    if (def.r && kind !== 'balloon' && zone !== 'sky') { d.ob = { x, z, r: def.r * 0.8 }; decorObs.push(d.ob); }
    if (animateNewest && i === list.length - 1) { landed = { x, z, y: g.position.y }; const y0 = g.position.y; g.position.y = y0 + 12; const t0 = performance.now();
      const drop = () => { const k = Math.min(1, (performance.now() - t0) / 900); const e = k < 1 ? 1 - Math.pow(1 - k, 3) : 1; g.position.y = y0 + 12 * (1 - e); if (k < 1) requestAnimationFrame(drop); else { dust(x, 0.6, z, 8); sparkles(x, 2, z, 16); } }; setTimeout(drop, 350); }
  }
  return landed;
}
export const decorDebug = () => ({ res: RESERVED && RESERVED.map(q => +q.rr.toFixed(2)), hist: STATIC && [0.5,0.8,1,1.2,1.5,2,2.5].map(t => STATIC.filter(s => s[2] >= t).length), pool: decorPool().length, stat: STATIC && STATIC.length, placed: decorPlaced.map(d => [d.kind, Math.round(d.x), Math.round(d.z)]), fill: FILLERS.length });
export const decorFull = kind => { const d = DECOR_BY[kind]; return !d || decorPlaced.filter(p => p.kind === kind).length >= d.max || (d.zone === 'ground' ? (d.r && !spotFor(d.r, BIG.includes(kind))) : !zoneSpot(d)); };
// little 3D pictures for the shop
let thumbR = null; const thumbCache = {};
export function decorThumb(kind) {
  if (thumbCache[kind]) return thumbCache[kind];
  try {
    if (!thumbR) { thumbR = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true }); thumbR.setPixelRatio(1); thumbR.setSize(150, 150); }
    const sc = new THREE.Scene(); sc.add(new THREE.HemisphereLight(0xEAF6FF, 0x8C7A5B, 1.6)); const sun = new THREE.DirectionalLight(0xFFF2DA, 2.2); sun.position.set(-6, 10, 8); sc.add(sun);
    const g = buildDecor(kind, null); sc.add(g);
    const box = new THREE.Box3().setFromObject(g), c = box.getCenter(new THREE.Vector3()), rad = box.getSize(new THREE.Vector3()).length() / 2;
    const cam = new THREE.PerspectiveCamera(30, 1, 0.1, 400); cam.position.copy(c).add(new THREE.Vector3(0.75, 0.5, 1.2).normalize().multiplyScalar(rad / Math.sin(Math.PI / 12) * 0.95)); cam.lookAt(c);
    thumbR.render(sc, cam); return thumbCache[kind] = thumbR.domElement.toDataURL();
  } catch (e) { return ''; }
}
export function focusSpot(x, z, y = 1.2) {
  const target = new THREE.Vector3(x, Math.max(1.2, y), z); const dir = new THREE.Vector3().subVectors(camera.position, controls.target).normalize();
  return fly(target.clone().add(new THREE.Vector3(dir.x, Math.max(0.55, dir.y), dir.z).normalize().multiplyScalar(15)), target, 1000);
}

// ---------------------------------------------------------------- effects
const fx = [];
function dust(x, y, z, n = 14) {
  for (let i = 0; i < n; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 6), new THREE.MeshBasicMaterial({ color: 0xEADBC3, transparent: true, opacity: 0.9 }));
    const a = Math.random() * Math.PI * 2; m.position.set(x + Math.cos(a) * 1.5, y + 0.3, z + Math.sin(a) * 1.5); scene.add(m);
    fx.push({ m, v: new THREE.Vector3(Math.cos(a) * 1.6, 1 + Math.random(), Math.sin(a) * 1.6), life: 1, grow: 1.6 }); }
}
function sparkles(x, y, z, n = 24) {
  const cols = [0xFFC94A, 0xFFFFFF, 0xEF5B4C, 0x4FB3D9, 0x7CC24A];
  for (let i = 0; i < n; i++) { const m = new THREE.Mesh(new THREE.OctahedronGeometry(0.22), new THREE.MeshBasicMaterial({ color: cols[i % cols.length], transparent: true }));
    m.position.set(x, y, z); scene.add(m); const a = Math.random() * Math.PI * 2;
    fx.push({ m, v: new THREE.Vector3(Math.cos(a) * (2 + Math.random() * 3), 4 + Math.random() * 4, Math.sin(a) * (2 + Math.random() * 3)), life: 1.4, grav: 7, spin: true }); }
}

// ---------------------------------------------------------------- progress → visuals
const GRAY = new THREE.Color(0xA8A49C);
function applyPlace(P, d) {
  const sat = Math.max(0, Math.min(1, d));
  P.mats.forEach(m => m.color.copy(GRAY).lerp(m.userData.base, 0.15 + 0.85 * sat));
  if (P.isBridge) {
    const n = Math.round(d * P.planks.length);
    P.planks.forEach((pl, i) => { const target = i < n ? 1 : 0; pl.visible = pl.scale.y > 0.02 || target; pl.userData.t = target; });
    P.rails.visible = d >= 0.5; P.lamps.visible = d >= 0.999; return;
  }
  const shown = d <= 0 ? 0 : 0.28 + 0.72 * d;
  P.inner.position.y = -(1 - shown) * P.height * 1.02;
  P.rubble.visible = d <= 0.001 || (P.collapsing && d < 0.6); P.scaff.visible = !P.collapsing && d > 0.001 && d < 0.999;
}
function setPlace(P, p, animate) {
  return new Promise(res => {
    const from = P.p < 0 ? p : P.disp; P.p = p; P.collapsing = animate && p < from - 0.001;
    if (!animate || Math.abs(from - p) < 0.001) { P.disp = p; applyPlace(P, p); return res(); }
    const t0 = performance.now(), dur = 1800; const pos = P.group.position;
    dust(pos.x, 0.6, pos.z); let shook = 0;
    const step = () => { const k = Math.min(1, (performance.now() - t0) / dur); const e = 1 - Math.pow(1 - k, 3);
      P.disp = from + (p - from) * e; applyPlace(P, P.disp);
      P.group.position.x = P.plot.x + (k < 1 ? Math.sin(k * 60) * 0.04 : 0);
      if (k > 0.3 && !shook) { shook = 1; dust(pos.x, 0.6, pos.z, 8); }
      if (k < 1) requestAnimationFrame(step); else { P.collapsing = false; applyPlace(P, P.disp); if (p >= 0.999 && from < 0.999) sparkles(pos.x, P.height + 1, pos.z, 36); res(); } };
    requestAnimationFrame(step);
  });
}
export function setProgress(area, p, animate = false) { const P = places[area]; if (!P) return Promise.resolve(); return setPlace(P, Math.max(0, Math.min(1, p)), animate); }
export function setWords(list, animateNew = false) {
  for (const [w, o] of Object.entries(wordObjs)) {
    const on = list.includes(w);
    if (on && !o.shown) { o.group.visible = true; o.shown = true; raycastTargets.push(o.hit);
      if (animateNew) { o.group.scale.setScalar(0.01); const t0 = performance.now(); const grow = () => { const k = Math.min(1, (performance.now() - t0) / 700); const e = k < 1 ? 1 + Math.sin(k * Math.PI) * 0.3 * (1 - k) : 1; o.group.scale.setScalar(Math.max(0.01, k * e)); if (k < 1) requestAnimationFrame(grow); }; grow(); sparkles(o.group.position.x, 1.5, o.group.position.z, 14); }
      o.label = makeLabel(w, 'word-label', () => onWordTap(w)); }
    if (!on && o.shown) { o.group.visible = false; o.shown = false; if (o.label) o.label.remove(); o.label = null; const i = raycastTargets.indexOf(o.hit); if (i >= 0) raycastTargets.splice(i, 1); }
  }
}
export function lighthouseOn(on) { if (places.__beam) places.__beam.on = on; }

// ---------------------------------------------------------------- labels (DOM, projected each frame)
const labels = [];
function makeLabel(text, cls, onClick) {
  const el = document.createElement('button'); el.className = 'label3d ' + cls; el.innerHTML = text;
  el.addEventListener('click', e => { e.stopPropagation(); onClick && onClick(); }); labelLayer.appendChild(el); return el;
}
function placeLabel(el, v) {
  const p = v.clone().project(camera); const x = (p.x * 0.5 + 0.5) * container.clientWidth, y = (-p.y * 0.5 + 0.5) * container.clientHeight;
  const hidden = p.z > 1 || x < -60 || x > container.clientWidth + 60; el.style.display = hidden ? 'none' : '';
  el.style.transform = `translate(-50%,-100%) translate(${x}px,${y}px)`; el.style.zIndex = String(1000 - Math.round(p.z * 1000));
}
export function setLabelHTML(area, html) { const P = places[area]; if (P && P.label) P.label.innerHTML = html; }

// ---------------------------------------------------------------- camera moves
let flight = null, flightDone = null;
export function focus(area, { close = true } = {}) {
  const P = places[area]; if (!P) return Promise.resolve();
  const target = new THREE.Vector3(P.group.position.x, P.height * 0.45, P.group.position.z);
  const dir = new THREE.Vector3().subVectors(camera.position, controls.target).normalize(); const dist = close ? 17 : 34 * SP;
  const endPos = target.clone().add(new THREE.Vector3(dir.x, Math.max(0.55, dir.y), dir.z).normalize().multiplyScalar(dist));
  return fly(endPos, target, 1100);
}
export function overview(ms = 1100) { return fly(new THREE.Vector3(0, 31 * SP, 43 * SP), new THREE.Vector3(0, -0.5, 1.5 * SP), ms); }
function fly(endPos, endTarget, ms) {
  if (flightDone) flightDone();
  return new Promise(res => { const sp = camera.position.clone(), st = controls.target.clone(), t0 = performance.now(); flightDone = res;
    flight = () => { const k = Math.min(1, (performance.now() - t0) / ms); const e = k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      camera.position.lerpVectors(sp, endPos, e); controls.target.lerpVectors(st, endTarget, e); if (k >= 1) { flight = null; flightDone = null; res(); } }; });
}
let idleSpin = false; export function setIdleSpin(on) { idleSpin = on; }

// ---------------------------------------------------------------- init + loop
export function initTown(el, opts) {
  container = el; onPick = opts.onPick; onWordTap = opts.onWordTap || (() => {}); onPerson = opts.onPerson || (() => {});
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
  el.appendChild(renderer.domElement);
  labelLayer = document.createElement('div'); labelLayer.className = 'label-layer'; el.appendChild(labelLayer);
  scene = new THREE.Scene();
  const bg = document.createElement('canvas'); bg.width = 4; bg.height = 256; const bx = bg.getContext('2d'); const gr = bx.createLinearGradient(0, 0, 0, 256);
  gr.addColorStop(0, '#7CC3E3'); gr.addColorStop(0.55, '#BFE6F2'); gr.addColorStop(1, '#FFE9C2'); bx.fillStyle = gr; bx.fillRect(0, 0, 4, 256);
  const bgt = new THREE.CanvasTexture(bg); bgt.colorSpace = THREE.SRGBColorSpace; scene.background = bgt; skyTex.day = bgt;
  skyTex.storm = gradTex(['#23264D', '#3B4176', '#6A6E95']); skyTex.dusk = gradTex(['#3B2F6B', '#C9628B', '#FFB36B']);
  scene.fog = new THREE.Fog(0xCFEAF2, 70 * SP, 140 * SP);
  camera = new THREE.PerspectiveCamera(38, 1, 0.5, 420); camera.position.set(0, 33 * SP, 47 * SP);
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; controls.dampingFactor = 0.08; controls.enablePan = false; controls.minDistance = 16; controls.maxDistance = 60 * SP;
  controls.minPolarAngle = 0.35; controls.maxPolarAngle = 1.2; controls.rotateSpeed = 0.6; controls.zoomSpeed = 0.7;
  hemi = new THREE.HemisphereLight(0xEAF6FF, 0x8C7A5B, 1.35); scene.add(hemi);
  sun = new THREE.DirectionalLight(0xFFF2DA, 2.1); sun.position.set(-18 * SP, 32, 14 * SP); sun.castShadow = true; sun.shadow.mapSize.set(3072, 3072);
  Object.assign(sun.shadow.camera, { left: -28 * SP, right: 28 * SP, top: 22 * SP, bottom: -22 * SP, near: 1, far: 110 }); sun.shadow.bias = -0.0008; sun.shadow.normalBias = 0.03; scene.add(sun);
  buildIsland(); buildPlaces(); buildTrain(); buildClouds(); buildWordObjects(); buildSkyIsland(opts.onCave); buildWordIsland();
  for (const pl of PLOTS) { const P = places[pl.area]; P.label = makeLabel(pl.name, 'place-label', () => onPick(pl.area)); P.labelPos = new THREE.Vector3(P.group.position.x, P.height + (pl.area === 'bridge' ? 1.2 : 1.6), P.group.position.z); }
  // tap vs drag
  let down = null; const ray = new THREE.Raycaster(), mv = new THREE.Vector2();
  const hitAt = e => { const r = renderer.domElement.getBoundingClientRect(); mv.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(mv, camera); const hs = ray.intersectObjects(raycastTargets, false); return hs[0] && hs[0].object.userData; };
  renderer.domElement.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY }; setIdleSpin(false); });
  renderer.domElement.addEventListener('pointerup', e => { if (!down) return; const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y); down = null; if (moved > 8) return;
    const u = hitAt(e); if (!u) return; if (u.cave) { opts.onCave && opts.onCave(); return; } if (u.person != null) onPerson(u.person); else if (u.area) onPick(u.area); else if (u.word) onWordTap(u.word); });
  renderer.domElement.addEventListener('pointermove', e => { if (e.pointerType !== 'mouse') return; const u = hitAt(e); renderer.domElement.style.cursor = u ? 'pointer' : 'grab';
    for (const k in places) if (places[k] && places[k].plot) places[k].hover = u && u.area === k ? 1 : 0; });
  const resize = () => { const w = el.clientWidth, h = el.clientHeight; renderer.setSize(w, h); camera.aspect = w / h;
    camera.fov = w / h < 1 ? 58 : 38; camera.updateProjectionMatrix(); };
  addEventListener('resize', resize); resize();
  clock = new THREE.Clock(); loop();
}
let trainOn = false; export function trainRunning(on) { trainOn = on; if (train) train.car.visible = on; }
function loop() {
  requestAnimationFrame(loop); if (!running) return;
  const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;
  waterUniforms.uTime.value = t;
  if (flight) flight(); else if (idleSpin) { const a = 0.0016; const p = camera.position, c = controls.target; const x = p.x - c.x, z = p.z - c.z; p.x = c.x + x * Math.cos(a) - z * Math.sin(a); p.z = c.z + x * Math.sin(a) + z * Math.cos(a); }
  controls.update();
  animated.forEach(f => f(t));
  ticks.forEach(f => f(t, dt));
  for (const k in places) { const P = places[k]; if (!P || !P.plot) continue;
    const hy = P.hover ? 0.25 + Math.sin(t * 6) * 0.08 : 0; if (!P.isBridge) P.group.position.y += ((Y0 + hy) - P.group.position.y) * 0.2;
    if (P.isBridge) P.planks.forEach((pl, i) => { const tg = pl.userData.t || 0; const s = pl.scale.y + (tg - pl.scale.y) * 0.15; pl.scale.set(1, Math.max(0.001, s), 1); pl.visible = s > 0.02; });
    if (P.label && P.labelPos) { const shown = P.isBridge ? 1 : (P.disp <= 0.001 ? 0 : 0.28 + 0.72 * P.disp); P.labelPos.y = P.isBridge ? 2.6 : 2.4 + shown * P.height; placeLabel(P.label, P.labelPos); } }
  for (const o of Object.values(wordObjs)) if (o.label) placeLabel(o.label, new THREE.Vector3(o.group.position.x, 2.6, o.group.position.z));
  if (places.__gear && places.workshop && places.workshop.disp >= 0.999) places.__gear.rotation.z = t * 1.2;
  if (places.__beam) { const B = places.__beam; B.pivot.rotation.y = t * 0.8; B.beam.material.opacity += ((B.on ? 0.35 : 0) - B.beam.material.opacity) * 0.05; }
  if (train && trainOn) { train.t += dt * 0.12; const u = (Math.sin(train.t) + 1) / 2; const x = (1.5 + u * 15) * SP; train.car.position.x = x; train.car.rotation.y = Math.cos(train.t) >= 0 ? 0 : Math.PI;
    train.car.position.y = Math.abs(Math.sin(t * 14)) * 0.03; }
  for (let i = fx.length - 1; i >= 0; i--) { const f = fx[i]; f.life -= dt; f.m.position.addScaledVector(f.v, dt); if (f.grav) f.v.y -= f.grav * dt; else f.v.multiplyScalar(0.94);
    if (f.grow) f.m.scale.multiplyScalar(1 + dt * f.grow); if (f.spin) { f.m.rotation.x += dt * 6; f.m.rotation.y += dt * 4; }
    f.m.material.opacity = Math.max(0, Math.min(1, f.life)); if (f.life <= 0) { scene.remove(f.m); fx.splice(i, 1); } }
  renderer.render(scene, camera);
}
export function labelsVisible(v) { if (labelLayer) labelLayer.style.visibility = v ? '' : 'hidden'; }
let snap = null;
export function pauseTown(p) {
  running = !p; if (labelLayer) labelLayer.style.display = p ? 'none' : '';
  if (p) { // freeze a soft, low-res copy of the town behind the place screens (cheap blur)
    renderer.render(scene, camera); const c = renderer.domElement; snap = document.createElement('canvas');
    const mid = document.createElement('canvas'); mid.width = Math.round(c.width / 4); mid.height = Math.round(c.height / 4);
    const mx = mid.getContext('2d'); mx.imageSmoothingQuality = 'high'; mx.drawImage(c, 0, 0, mid.width, mid.height);
    snap.width = Math.max(48, Math.round(c.width / 14)); snap.height = Math.max(30, Math.round(c.height / 14)); snap.className = 'snap';
    const sx = snap.getContext('2d'); sx.imageSmoothingQuality = 'high'; sx.drawImage(mid, 0, 0, snap.width, snap.height); container.appendChild(snap); c.style.visibility = 'hidden';
  } else { if (snap) { snap.remove(); snap = null; } renderer.domElement.style.visibility = ''; clock.getDelta(); }
}
export const PLACE_NAMES = Object.fromEntries(PLOTS.map(p => [p.area, p.name]));

// ---------------------------------------------------------------- shared with the story / townsfolk module
const ticks = [];
function gradTex(cols) { const c = document.createElement('canvas'); c.width = 4; c.height = 256; const x = c.getContext('2d'); const g = x.createLinearGradient(0, 0, 0, 256);
  cols.forEach((col, i) => g.addColorStop(i / (cols.length - 1), col)); x.fillStyle = g; x.fillRect(0, 0, 4, 256); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
export function setSky(mode) {
  scene.background = skyTex[mode] || skyTex.day;
  const L = { day: [0xEAF6FF, 1.35, 0xFFF2DA, 2.1, 0xCFEAF2], storm: [0x8890C0, 0.75, 0x9AA3D6, 0.55, 0x3B4176], dusk: [0xFFD3B0, 1.15, 0xFFB077, 1.6, 0xC9628B] }[mode] || [];
  hemi.color.setHex(L[0]); hemi.intensity = L[1]; sun.color.setHex(L[2]); sun.intensity = L[3]; scene.fog.color.setHex(L[4]);
}
export const T = {
  THREE, get scene() { return scene; }, get camera() { return camera; }, get controls() { return controls; }, get renderer() { return renderer; },
  places, PLOTS, decorObs, Y0, RX, RZ, SP, riverXAt, insideIsland, builder, outline, toon, raycastTargets, ticks, sparkles, dust, makeLabel, placeLabel, fly, waterMat,
};

// ---------------------------------------------------------------- the sky island with The Cave on it (a door to the story page)
export const CAVE = { pos: new THREE.Vector3(-9 * SP, Y0 + 3.2, -21.5 * SP), mouth: null }; const FACE = 0.16;
function buildSkyIsland(onCave) {
  const g = new THREE.Group(); g.position.copy(CAVE.pos); scene.add(g); const b = builder(g);
  // the floating rock: grassy top, rocky cone underneath
  const top = new THREE.Mesh(new THREE.CylinderGeometry(5.2, 4.6, 1.2, 22), [toon(0xA9744A), toon(0x8CC95E), toon(0xA9744A)]); top.position.y = -0.6; outline(top, 0.06); g.add(top);
  const under = new THREE.Mesh(new THREE.ConeGeometry(4.6, 7, 14), toon(0x7A5236)); under.rotation.x = Math.PI; under.position.y = -4.7; outline(under, 0.05); g.add(under);
  for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; b.ball(0.5, 0x8C6A48, Math.cos(a) * 3.2, -3 - (i % 3), Math.sin(a) * 3.2); }
  // the cave hill, its dark mouth turned toward the town, a blue stone glowing inside
  const face = FACE; const hill = b.add(new THREE.DodecahedronGeometry(3.1, 0), toon(0x8B8F9E), 0.2, 1.4, -1.6, { line: 0.05 }); hill.scale.set(1.15, 0.85, 0.85);
  const mouth = new THREE.Group(); mouth.position.set(0.9, 0, 0.75); mouth.rotation.y = face; g.add(mouth);
  const gc = document.createElement('canvas'); gc.width = gc.height = 128; const gx = gc.getContext('2d'); const gr = gx.createRadialGradient(64, 128, 4, 64, 128, 124);
  gr.addColorStop(0, '#000'); gr.addColorStop(0.6, '#07080E'); gr.addColorStop(1, '#2A2D3A'); gx.fillStyle = gr; gx.fillRect(0, 0, 128, 128); const gt = new THREE.CanvasTexture(gc); gt.colorSpace = THREE.SRGBColorSpace;
  const door = new THREE.Mesh(new THREE.CircleGeometry(1.25, 20, 0, Math.PI), new THREE.MeshBasicMaterial({ map: gt })); door.scale.y = 1.2; mouth.add(door);
  const rim = new THREE.Mesh(new THREE.RingGeometry(1.25, 1.75, 20, 1, 0, Math.PI), toon(0x7C8090)); rim.scale.y = 1.2; rim.position.z = 0.01; mouth.add(rim); outline(rim, 0.02);
  const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.26), toon(0x5AD1FF, { emissive: 0x2AA8E8, emissiveIntensity: 1 })); gem.scale.y = 1.6; gem.position.set(0, 0.55, 0.05); mouth.add(gem);
  const glow = new THREE.PointLight(0x5AD1FF, 6, 6, 1.6); glow.position.set(0, 0.8, 0.6); mouth.add(glow);
  CAVE.mouth = mouth;
  // a little mine cart on rails rolling into the cave
  const fwd = new THREE.Vector3(Math.sin(face), 0, Math.cos(face));
  for (let k = 0; k < 6; k++) { const p = new THREE.Vector3(0.9, 0, 0.75).addScaledVector(fwd, 0.6 + k * 0.45); const tie = b.box(0.9, 0.05, 0.12, 0x5A3A24, p.x, 0.03, p.z, { line: 0 }); tie.rotation.y = face; }
  [-0.25, 0.25].forEach(o => { const c = new THREE.Vector3(0.9, 0, 0.75).addScaledVector(fwd, 1.7).add(new THREE.Vector3(Math.cos(face) * o, 0, -Math.sin(face) * o)); const r = b.box(0.04, 0.05, 2.8, 0x8E9099, c.x, 0.07, c.z, { line: 0 }); r.rotation.y = face; });
  const cartG = new THREE.Group(); const cp = new THREE.Vector3(0.9, 0, 0.75).addScaledVector(fwd, 2.4); cartG.position.set(cp.x, 0.05, cp.z); cartG.rotation.y = face; g.add(cartG); const cb = builder(cartG);
  cb.box(0.7, 0.36, 0.95, 0x8A5A3B, 0, 0.34, 0, { line: 0.02 }); [-0.36, 0.36].forEach(x => [-0.3, 0.3].forEach(z => cb.cyl(0.11, 0.11, 0.06, 0x55595F, x, 0.13, z, { rz: Math.PI / 2, line: 0.01 })));
  // Toby's paw prints leading from the stepping stones to the cave
  const pawMat = new THREE.MeshBasicMaterial({ color: 0x5A4630 });
  for (let k = 0; k < 9; k++) { const t = k / 8; const x = 4.2 - t * 3.2 + (k % 2 ? 0.18 : -0.18), z = 2.6 - t * 1.4; const pad = new THREE.Mesh(new THREE.CircleGeometry(0.1, 10), pawMat); pad.rotation.x = -Math.PI / 2; pad.position.set(x, 0.02, z); g.add(pad);
    [-1, 0, 1].forEach(q => { const toe = new THREE.Mesh(new THREE.CircleGeometry(0.04, 8), pawMat); toe.rotation.x = -Math.PI / 2; toe.position.set(x - 0.12, 0.02, z + q * 0.07); g.add(toe); }); }
  // a pirate flag and a blue crystal cluster
  b.cyl(0.05, 0.05, 2.6, 0x6B4A33, -3.1, 1.3, 0.9, { line: 0.01 });
  const fc = document.createElement('canvas'); fc.width = 128; fc.height = 84; const fx2 = fc.getContext('2d'); fx2.fillStyle = '#1D1B2A'; fx2.fillRect(0, 0, 128, 84);
  fx2.fillStyle = '#fff'; fx2.beginPath(); fx2.arc(64, 34, 16, 0, Math.PI * 2); fx2.fill(); fx2.fillRect(56, 44, 16, 10); fx2.fillStyle = '#1D1B2A'; fx2.beginPath(); fx2.arc(58, 32, 4, 0, 7); fx2.arc(70, 32, 4, 0, 7); fx2.fill();
  fx2.strokeStyle = '#fff'; fx2.lineWidth = 6; fx2.beginPath(); fx2.moveTo(38, 60); fx2.lineTo(90, 78); fx2.moveTo(90, 60); fx2.lineTo(38, 78); fx2.stroke();
  const ft = new THREE.CanvasTexture(fc); ft.colorSpace = THREE.SRGBColorSpace;
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.85, 8, 1), new THREE.MeshBasicMaterial({ map: ft, side: THREE.DoubleSide })); flag.position.set(-2.42, 2.2, 0.9); g.add(flag);
  const fp = flag.geometry.attributes.position, fx0 = Array.from({ length: fp.count }, (_, i) => fp.getX(i));
  for (let k = 0; k < 5; k++) { const a = 2.2 + k * 0.5; const c = b.add(new THREE.OctahedronGeometry(0.22 + (k % 2) * 0.12), toon(0x7FD8FF, { emissive: 0x2AA8E8, emissiveIntensity: 0.5 }), Math.cos(a) * 3.8, 0.3, Math.sin(a) * 3.8, { line: 0.02 }); c.scale.y = 2; }
  // stepping stones from the town to the sky island
  const sd = new THREE.Vector3(-CAVE.pos.x, 0, -CAVE.pos.z).normalize(), s2 = new THREE.Vector3(CAVE.pos.x + sd.x * 4.7, 0, CAVE.pos.z + sd.z * 4.7), edge = s2.clone();
  while (!insideIsland(edge.x, edge.z, 0.3) && edge.distanceTo(s2) < 24) edge.addScaledVector(sd, 0.25);
  edge.addScaledVector(sd, -0.9);
  const nSt = Math.max(2, Math.round(s2.distanceTo(edge) / 1.6) + 1);
  const stones = Array.from({ length: nSt }, (_, k) => { const t = k / (nSt - 1); return [edge.x + (s2.x - edge.x) * t, Y0 + 0.9 + t * 0.9, edge.z + (s2.z - edge.z) * t]; }).map(([x, y, z], i) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.55, 0.45, 9), [toon(0x8C6A48), toon(0x8CC95E), toon(0x8C6A48)]); m.position.set(x, y, z); outline(m, 0.04); scene.add(m); m.userData.y0 = y; m.userData.ph = i; return m; });
  // label + tap target
  const label = makeLabel('The Cave', 'place-label cave-label', () => onCave && onCave()); const lp = new THREE.Vector3();
  const hit = new THREE.Mesh(new THREE.SphereGeometry(4.4, 12, 8), new THREE.MeshBasicMaterial({ visible: false })); hit.position.set(0.4, 1.4, -0.6); hit.userData.cave = true; g.add(hit); raycastTargets.push(hit);
  ticks.push((t, dt) => { g.position.y = CAVE.pos.y + Math.sin(t * 0.7) * 0.25; gem.rotation.y = t * 1.5; glow.intensity = 5 + Math.sin(t * 2.4) * 1.5;
    for (let i = 0; i < fp.count; i++) fp.setZ(i, Math.sin(fx0[i] * 4 + t * 4) * 0.08 * (fx0[i] + 0.65)); fp.needsUpdate = true;
    stones.forEach(m => { m.position.y = m.userData.y0 + Math.sin(t * 1.1 + m.userData.ph) * 0.18; });
    lp.set(g.position.x, g.position.y + 4.2, g.position.z); placeLabel(label, lp); });
}
// camera helpers for walking in and out of the cave
export function caveView() { const m = CAVE.mouth.getWorldPosition(new THREE.Vector3()); const d = new THREE.Vector3(Math.sin(FACE), 0, Math.cos(FACE)); return { pos: m.clone().addScaledVector(d, 3.2).add(new THREE.Vector3(0, 1.1, 0)), target: m.clone().add(new THREE.Vector3(0, 0.7, 0)) }; }
export function flyIntoCave(ms = 1500) { const m = CAVE.mouth.getWorldPosition(new THREE.Vector3()); const d = new THREE.Vector3(Math.sin(FACE), 0, Math.cos(FACE)); return fly(m.clone().addScaledVector(d, 0.4).add(new THREE.Vector3(0, 0.6, 0)), m.clone().addScaledVector(d, -2).add(new THREE.Vector3(0, 0.6, 0)), ms); }
export function setCameraAt(pos, target) { camera.position.copy(pos); controls.target.copy(target); controls.update(); }

// ---------------------------------------------------------------- Word Island: a new island across a long broken bridge.
// The bridge is built plank by plank in the Bridge Builder (wordbridge.js): 28 planks, a post pair with a lantern after every 4.
export const WB_N = 28, WB_POSTS = 7;
export const WORD_ISLE = { pos: new THREE.Vector3(RX + 26, Y0 - 0.5, 3), label: null };
const WB = { planks: [], posts: [], ropes: [], fogMat: null, gate: null, a: null, b: null };
const WB_Z = 3, WB_SAG = 1.3;
function wbPoint(t) { const { a, b } = WB; return new THREE.Vector3(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t - WB_SAG * Math.sin(Math.PI * t), WB_Z); }
function buildWordIsland() {
  const g = new THREE.Group(); g.position.copy(WORD_ISLE.pos); scene.add(g); const b = builder(g);
  const top = new THREE.Mesh(new THREE.CylinderGeometry(8, 7.2, 1.4, 22), [toon(0xA9744A), toon(0x9BD36A), toon(0xA9744A)]); top.position.y = -0.7; outline(top, 0.07); g.add(top);
  const under = new THREE.Mesh(new THREE.ConeGeometry(7.2, 9, 16), toon(0x7A5236)); under.rotation.x = Math.PI; under.position.y = -5.9; outline(under, 0.05); g.add(under);
  for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2; b.ball(0.8, 0x8C6A48, Math.cos(a) * 5, -3.5 - (i % 3), Math.sin(a) * 5); }
  // four letter-tile houses that spell WORD
  const tile = ch => new THREE.MeshBasicMaterial({ map: signTexture(ch, { w: 128, h: 128, bg: '#FFF4D6', font: 'bold 104px Chewy, "Comic Sans MS", sans-serif' }) });
  [['W', -3.6, -1.8, 0xEF5B4C], ['O', -1.2, -2.6, 0xFFC94A], ['R', 1.2, -2.6, 0x4FB3D9], ['D', 3.6, -1.8, 0x7A5BA6]].forEach(([ch, x, z, c], i) => {
    const hgt = 1.8 + (i % 2) * 0.5; b.box(1.8, hgt, 1.8, 0xFFF4D6, x, hgt / 2, z); b.cone(1.5, 1.2, c, x, hgt + 0.6, z, { seg: 4, ry: Math.PI / 4 });
    const f = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.3), tile(ch)); f.position.set(x, hgt * 0.55, z + 0.91); g.add(f); });
  // a tower of stacked books and a giant open book
  [0xEF5B4C, 0x4FB3D9, 0xFFC94A, 0x5DBA6B, 0x7A5BA6, 0xF08A2E].forEach((c, i) => { b.box(2.2 - i * 0.12, 0.55, 1.6 - i * 0.08, c, 5.4, 0.28 + i * 0.56, 0.6, { ry: (i % 2 ? 0.25 : -0.15) }); b.box(2.0 - i * 0.12, 0.42, 0.06, 0xFFFDF4, 5.4, 0.28 + i * 0.56, 0.6 + (0.81 - i * 0.04), { ry: (i % 2 ? 0.25 : -0.15), line: 0 }); });
  b.cone(0.9, 1.3, 0xEF5B4C, 5.4, 3.95, 0.6, { seg: 6 });
  b.box(1.9, 0.18, 2.6, 0xFFFDF4, -4.2, 0.5, 3.6, { rz: 0.28 }); b.box(1.9, 0.18, 2.6, 0xFFFDF4, -2.4, 0.5, 3.6, { rz: -0.28 }); b.box(0.2, 0.3, 2.7, 0xB82E3A, -3.3, 0.3, 3.6, { line: 0.02 });
  [[0.5, -4.6], [3.2, -4.4], [-2.6, -5], [5.6, -3.2]].forEach(([x, z], i) => tree(b, x, z, i % 2 ? 0.7 : 0.2));
  // the gate at the island end of the bridge (closed until the bridge is done)
  const gate = new THREE.Group(); gate.position.set(-7.2, 0, 0); g.add(gate); const gb = builder(gate);
  gb.box(0.35, 2.6, 0.35, 0x8A5A3B, 0, 1.3, -1.1); gb.box(0.35, 2.6, 0.35, 0x8A5A3B, 0, 1.3, 1.1); gb.box(0.5, 0.7, 2.9, 0xFFF4D6, 0, 2.75, 0);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.6), new THREE.MeshBasicMaterial({ map: signTexture('WORD ISLAND', { w: 512, h: 120, font: 'bold 64px Chewy, "Comic Sans MS", sans-serif' }) })); sign.position.set(-0.26, 2.75, 0); sign.rotation.y = -Math.PI / 2; gate.add(sign);
  const doors = [-1, 1].map(sd => { const d = new THREE.Group(); d.position.set(0, 0, sd * 0.95); gate.add(d); builder(d).box(0.14, 1.9, 0.92, 0xC98B4F, 0, 0.95, -sd * 0.46, { line: 0.03 }); return d; });
  WB.gate = { gate, doors };
  // fog over the island; it thins as the bridge grows
  WB.fogMat = new THREE.MeshBasicMaterial({ color: 0xF4F7FA, transparent: true, opacity: 0.72, depthWrite: false });
  const puffs = []; for (let i = 0; i < 12; i++) { const a = -Math.PI * 0.9 + Math.random() * Math.PI * 1.1, r = 3 + Math.random() * 5; const m = new THREE.Mesh(new THREE.SphereGeometry(1.6 + Math.random() * 1.4, 12, 8), WB.fogMat);
    m.position.set(Math.cos(a) * r + 2, 1.2 + Math.random() * 2.4, Math.sin(a) * r - 1.5); m.scale.y = 0.6; g.add(m); puffs.push([m, m.position.x, Math.random() * 6]); }
  // the bridge, in world space
  WB.a = new THREE.Vector3(RX - 0.4, Y0 + 0.05, WB_Z); WB.b = new THREE.Vector3(WORD_ISLE.pos.x - 7.6, WORD_ISLE.pos.y + 0.05, WB_Z);
  const bg = new THREE.Group(); scene.add(bg); const bb = builder(bg);
  const stub = (x0, x1, y) => { for (let x = x0; x <= x1 + 0.01; x += 0.62) bb.box(0.5, 0.12, 1.6, 0x8A5A3B, x, y, WB_Z, { line: 0.02 }); };
  stub(WB.a.x - 1.6, WB.a.x - 0.2, WB.a.y); stub(WB.b.x + 0.2, WB.b.x + 1.4, WB.b.y);
  const post = (p, lit) => { const grp = new THREE.Group(); grp.position.copy(p); bg.add(grp); const pb = builder(grp, true);
    [-0.88, 0.88].forEach(z => { pb.box(0.18, 1.5, 0.18, 0x6B4A33, 0, 0.55, z); pb.box(0.34, 0.34, 0.34, 0xFFF4D6, 0, 1.45, z, { line: 0.03 }); pb.cone(0.3, 0.3, 0xEF5B4C, 0, 1.76, z, { seg: 4, ry: Math.PI / 4, line: 0.02 }); });
    const glow = []; grp.traverse(m => { if (m.isMesh && m.material.color && m.material.color.getHex() === 0xFFF4D6) glow.push(m.material); });
    grp.userData.lit = on => glow.forEach(mt => { mt.emissive = new THREE.Color(on ? 0xFFC94A : 0x000000); mt.emissiveIntensity = on ? 0.9 : 0; });
    grp.userData.lit(lit); return grp; };
  post(new THREE.Vector3(WB.a.x - 0.2, WB.a.y, 0).setZ(WB_Z), true);
  const segLen = (WB.b.x - WB.a.x) / WB_N;
  for (let i = 0; i < WB_N; i++) {
    const t = (i + 0.5) / WB_N, p = wbPoint(t), p0 = wbPoint(i / WB_N), p1 = wbPoint((i + 1) / WB_N);
    const m = new THREE.Mesh(new THREE.BoxGeometry(segLen * 0.82, 0.12, 1.6), toon(0x8A5A3B)); m.position.copy(p); m.rotation.z = Math.atan2(p1.y - p0.y, p1.x - p0.x);
    m.castShadow = true; outline(m, 0.02); m.visible = false; m.userData.home = p.clone(); bg.add(m); WB.planks.push(m);
  }
  for (let k = 1; k <= WB_POSTS; k++) { const p = wbPoint(k / WB_POSTS); const g2 = post(p, true); g2.visible = false; WB.posts.push(g2);
    const q = wbPoint((k - 1) / WB_POSTS); const ropes = [-0.88, 0.88].map(z => { const len = p.distanceTo(q); const r = new THREE.Mesh(new THREE.BoxGeometry(len, 0.05, 0.05), smat(0xD8C49A));
      r.position.set((p.x + q.x) / 2, (p.y + q.y) / 2 + 1.05, WB_Z + z); r.rotation.z = Math.atan2(p.y - q.y, p.x - q.x); r.visible = false; bg.add(r); return r; }); WB.ropes.push(ropes); }
  WORD_ISLE.label = makeLabel('Word Island 🔒', 'place-label', () => window.dispatchEvent(new Event('wordisle')));
  const lp = new THREE.Vector3(WORD_ISLE.pos.x, WORD_ISLE.pos.y + 5.2, WORD_ISLE.pos.z);
  ticks.push(t => { puffs.forEach(([m, x, ph]) => { m.position.x = x + Math.sin(t * 0.25 + ph) * 0.6; }); placeLabel(WORD_ISLE.label, lp); });
}
const GOLD = 0xF2C14E, WOOD = 0x8A5A3B;
// marks: array of 'g' (right the first time: gold plank) or 'w' (wood) for the planks already laid
export function bridgeSet(marks) {
  WB.planks.forEach((m, i) => { m.visible = i < marks.length; if (m.visible) { m.material.color.setHex(marks[i] === 'g' ? GOLD : WOOD); m.position.copy(m.userData.home); } });
  const posts = Math.floor(marks.length / 4);
  WB.posts.forEach((p, k) => { p.visible = k < posts; WB.ropes[k].forEach(r => r.visible = k < posts); });
  bridgeFog(marks.length / WB_N); bridgeGate(marks.length >= WB_N, false);
}
export function bridgeLay(i, gold) {
  const m = WB.planks[i]; if (!m) return Promise.resolve(); m.material.color.setHex(gold ? GOLD : WOOD); m.visible = true;
  const home = m.userData.home, rz = m.rotation.z, t0 = performance.now();
  return new Promise(res => { const step = () => { const k = Math.min(1, (performance.now() - t0) / 650), e = 1 - Math.pow(1 - k, 3);
    m.position.set(home.x, home.y + 5 * (1 - e), home.z + 2.5 * (1 - e)); m.rotation.set(1.6 * (1 - e), 0, rz);
    if (k < 1) requestAnimationFrame(step); else { m.position.copy(home); dust(home.x, home.y + 0.1, home.z, 10); if (gold) sparkles(home.x, home.y + 0.4, home.z, 14); res(); } }; step(); });
}
export function bridgePost(k) { // k = 1..7
  const p = WB.posts[k - 1]; if (!p) return; p.visible = true; WB.ropes[k - 1].forEach(r => r.visible = true);
  const t0 = performance.now(); p.scale.set(1, 0.01, 1); const step = () => { const q = Math.min(1, (performance.now() - t0) / 500); p.scale.y = 0.01 + 0.99 * (1 - Math.pow(1 - q, 3)); if (q < 1) requestAnimationFrame(step); }; step();
  sparkles(p.position.x, p.position.y + 1.6, p.position.z, 24);
}
export function bridgeFog(frac) { if (WB.fogMat) { WB.fogMat.opacity = 0.72 * (1 - Math.min(1, frac) * 0.85); WB.fogMat.visible = frac < 1; } }
export function bridgeGate(open, animate = true) {
  if (!WB.gate) return; const target = open ? 1.45 : 0; const t0 = performance.now();
  const step = () => { const q = animate ? Math.min(1, (performance.now() - t0) / 1200) : 1; WB.gate.doors.forEach((d, i) => d.rotation.y = (i ? 1 : -1) * target * q); if (q < 1) requestAnimationFrame(step); }; step();
  if (WORD_ISLE.label) WORD_ISLE.label.innerHTML = open ? 'Word Island' : 'Word Island 🔒';
}
export function bridgeFocus(i, ms = 900) {
  const p = wbPoint(Math.min(1, (i + 0.5) / WB_N));
  return fly(new THREE.Vector3(p.x - 1.2, p.y + 5.5, WB_Z + 15), new THREE.Vector3(p.x - 0.2, p.y - 3.0, WB_Z), ms);
}
export function bridgeWide(ms = 1400) { const p = wbPoint(0.5); return fly(new THREE.Vector3(p.x - 4, p.y + 9, WB_Z + 24), new THREE.Vector3(p.x + 2, p.y - 3, WB_Z), ms); }
export function wordIsleView() { const p = WORD_ISLE.pos; return { pos: new THREE.Vector3(p.x - 21, 11, p.z + 22), target: new THREE.Vector3(p.x - 6, 0.5, p.z - 0.5) }; }
