// Prop Lab: the upgraded props for Episodes 1–5, one small diorama per kind of place, with the meadow test's grass and lighting.
// Models: free CC0 packs (Kenney, Quaternius, pmndrs market) restyled to our toon look; water, crystals, ice, carts etc. are built in code.
import { THREE, init, newWorld, onTick, setCam, toon, renderer, camera, builder, outline } from './gfx.js';
import { glowTex, cloudTex, glowSprite } from './effects.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { makeLabKids } from './chars.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

init(document.body);
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647, rr = (a, b) => a + (b - a) * rnd(), pick = a => a[Math.floor(rnd() * a.length)];
const nz = (x, z, f) => Math.sin(x * f + 1.3) * Math.cos(z * f * 1.1 - 0.7) + Math.sin((x + z) * f * 0.6 + 2) * 0.5;
const small = innerWidth < 800;

// ---------------------------------------------------------------- shared: ink, loading, toon restyle, instanced scatter
const INK = new THREE.MeshBasicMaterial({ color: 0x2E2A4F, side: THREE.BackSide });
INK.onBeforeCompile = sh => { sh.vertexShader = sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n float sc = length(modelMatrix[0].xyz);\n#ifdef USE_INSTANCING\n sc *= length(instanceMatrix[0].xyz);\n#endif\n transformed += normalize(normal) * 0.035 / max(sc, 0.001);'); };
const loader = new GLTFLoader(); loader.setMeshoptDecoder(MeshoptDecoder);
const raw = {}; const load = n => raw[n] || (raw[n] = new Promise(res => loader.load('props/' + n + '.glb', g => res(g.scene), undefined, () => { console.error('LOADFAIL ' + n); res(null); })));
const PAL = { leaf: [0x5FBF5A, 0x7BCB5E, 0x4FAE6A, 0x8FD05C, 0x6BC48A], pine: [0x3E9A63, 0x4BA672, 0x35875A], autumn: [0xF2A33B, 0xE9693B, 0xF6C94C], stone: [0xA7AFC2, 0x9AA3B8, 0xB4B9C9, 0xA9A6B5],
  bloom: [0xFF8FB1, 0xFFD25E, 0xFFFFFF, 0xB79CFF, 0xFF7B7B], crys: [0x9FEFFF, 0x7FE9FF, 0xB9F6FF], rainbow: [0xFF7BA8, 0xFFC857, 0x7ED6A8, 0x6FB4F2, 0xB79CFF, 0x9FEFFF], sand: [0xE9D3A0] };
const W = () => toon(0xffffff);
const crysMat = (c = 0x9FEFFF) => toon(0xffffff, { emissive: c, emissiveIntensity: 0.85, transparent: true, opacity: 0.92 });
// which material each part of each model gets: [material, palette name or null]
function partStyle(name, mn, orig) {
  if (/^(tree|bush)/.test(name)) { if (/wood|bark|trunk/i.test(mn)) return [toon(0x8A5A3A)]; return [W(), name.includes('autumn') ? 'autumn' : /pine|dark/.test(name) ? 'pine' : 'leaf']; }
  if (/^rock|crystal_rock/.test(name)) return mn === 'crystal' ? [crysMat(), 'crys'] : /grass/.test(mn) ? [toon(0x6DBB5E)] : [W(), 'stone'];
  if (name === 'crystal' || name === 'gem_pink') return [crysMat(), 'gem'];
  if (name === 'flower_red') return /grass/.test(mn) ? [toon(0x6DBB5E)] : [W(), 'bloom'];
  if (name === 'log' || name === 'stump') return /bark/i.test(mn) ? [toon(0x8A5A3A)] : [toon(0xF6EBD0)];
  const c = orig.color ? orig.color.clone() : new THREE.Color(0xffffff);
  if (orig.map) return [toon(0xffffff, { map: orig.map })];
  return [toon(c)];
}
// many copies of one model as instanced meshes, each with an ink-outline copy. items: {x,y,z,s,sy,rx,ry,rz,col}
async function scatter(parent, name, items, { norm = 0, shadow = true, gy = () => 0, style = null } = {}) {
  const src = await load(name); if (!src || !items.length) return null; src.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(src), ctr = box.getCenter(new THREE.Vector3()), minY = box.min.y, bs = box.getSize(new THREE.Vector3()), F = norm ? norm / Math.max(bs.x, bs.y, bs.z) : 1, parts = []; src.traverse(m => { if (m.isMesh) parts.push(m); });
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), S = new THREE.Vector3(), cols = items.map(() => ({})), grp = new THREE.Group(); parent.add(grp);
  for (const m of parts) { const [mat, pal] = (style || partStyle)(name, m.material.name || '', m.material), g = m.geometry.clone().applyMatrix4(m.matrixWorld); g.translate(-ctr.x, 0, -ctr.z);   // some packs keep each model off at its old spot in the kit's layout
    const im = new THREE.InstancedMesh(g, mat, items.length), ink = new THREE.InstancedMesh(g, INK, items.length);
    items.forEach((it, i) => { const s = (it.s ?? 1) * F, sy = (it.sy ?? 1) * s; Q.setFromEuler(new THREE.Euler(it.rx ?? 0, it.ry ?? rnd() * 6.28, it.rz ?? 0));
      M.compose(V.set(it.x, (it.y ?? gy(it.x, it.z)) - minY * sy + (it.dy ?? 0), it.z), Q, S.set(s, sy, s)); im.setMatrixAt(i, M); ink.setMatrixAt(i, M);
      if (pal) { const P = pal === 'gem' ? (it.pal || PAL.crys) : PAL[pal]; cols[i][pal] ??= new THREE.Color(it.col ?? pick(P)); im.setColorAt(i, cols[i][pal]); } });
    im.castShadow = shadow; im.receiveShadow = true; im.frustumCulled = ink.frustumCulled = false; grp.add(im, ink); }
  return grp;
}
// a ground mesh with height and vertex colour functions
function ground(parent, size, seg, hf, cf, mat = null) {
  const g = new THREE.PlaneGeometry(size, size, seg, seg); g.rotateX(-Math.PI / 2); const p = g.attributes.position, col = new Float32Array(p.count * 3), c = new THREE.Color();
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i); p.setY(i, hf(x, z)); cf(x, z, c); col.set([c.r, c.g, c.b], i * 3); }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.computeVertexNormals();
  const m = new THREE.Mesh(g, mat || toon(0xffffff, { vertexColors: true })); m.receiveShadow = true; parent.add(m); return m;
}
// swaying grass tufts (the meadow test's grass)
function grass(parent, n, spot, hf, hsl = [0.25, 0.62, 0.52]) {
  const wind = { value: 0 }, pos = [], col = [], idx = []; let v = 0;
  for (let b = 0; b < 5; b++) { const a = b / 5 * Math.PI * 2 + rnd(), h = rr(0.2, 0.42), w = rr(0.025, 0.04), bend = rr(0.04, 0.12), ox = rr(-0.1, 0.1), oz = rr(-0.1, 0.1), cx = Math.cos(a), cz = Math.sin(a), sx = -cz, sz = cx;
    const P = (u, y, s) => pos.push(ox + cx * u + sx * s, y, oz + cz * u + sz * s);
    P(0, 0, -w); P(0, 0, w); P(bend * 0.35, h * 0.5, -w * 0.7); P(bend * 0.35, h * 0.5, w * 0.7); P(bend, h, 0); col.push(0.42, 0.55, 0.3, 0.42, 0.55, 0.3, 0.8, 0.9, 0.7, 0.8, 0.9, 0.7, 1.1, 1.15, 0.95);
    idx.push(v, v + 1, v + 3, v, v + 3, v + 2, v + 2, v + 3, v + 4); v += 5; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals();
  const mat = toon(0xffffff, { vertexColors: true, side: THREE.DoubleSide });
  mat.onBeforeCompile = sh => { sh.uniforms.uT = wind; sh.vertexShader = 'uniform float uT;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n float sw = sin(uT * 1.7 + instanceMatrix[3].x * 0.35 + instanceMatrix[3].z * 0.22); transformed.x += sw * 0.25 * position.y; transformed.z += cos(uT * 1.3 + instanceMatrix[3].x * 0.2) * 0.12 * position.y;'); };
  const m = new THREE.InstancedMesh(g, mat, n), d = new THREE.Object3D(), c = new THREE.Color(); let k = 0, tries = 0;
  while (k < n && tries++ < n * 20) { const s = spot(); if (!s) continue; const [x, z] = s; d.position.set(x, hf(x, z), z); d.rotation.set(0, rnd() * 6.28, 0); const patch = nz(x, z, 0.3), sc = (1 + patch * 0.3) * rr(0.7, 1.4); d.scale.set(sc, sc * rr(0.9, 1.4), sc); d.updateMatrix(); m.setMatrixAt(k, d.matrix);
    c.setHSL(hsl[0] + patch * 0.03 + rr(-0.012, 0.012), hsl[1], hsl[2] + patch * 0.05 + rr(-0.05, 0.06)); m.setColorAt(k, c); k++; }
  m.count = k; m.frustumCulled = false; m.receiveShadow = true; parent.add(m); onTick(t => { wind.value = t; }); return m;
}
// toon water: banded colour, drifting sparkles, foam where it meets the shore (foam(x,z) gives 0..1)
function water(parent, geo, { deep = 0x2F8FC4, shallow = 0x6FD3E6, foamC = 0xFFFFFF, flow = [0, 0], opacity = 0.9, foamFn = '0.0', speed = 1 } = {}) {
  const u = { uT: { value: 0 }, uDeep: { value: new THREE.Color(deep) }, uShal: { value: new THREE.Color(shallow) }, uFoam: { value: new THREE.Color(foamC) }, uFlow: { value: new THREE.Vector2(...flow) }, uOp: { value: opacity } };
  const m = new THREE.ShaderMaterial({ uniforms: u, transparent: opacity < 1, depthWrite: opacity >= 1, side: THREE.DoubleSide,
    vertexShader: `uniform float uT; varying vec3 vW; void main(){ vec3 p = position; vec4 w = modelMatrix * vec4(p, 1.0); w.y += sin(w.x * 0.6 + uT * 1.4) * 0.05 + cos(w.z * 0.7 + uT * 1.1) * 0.05; vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `uniform float uT, uOp; uniform vec3 uDeep, uShal, uFoam; uniform vec2 uFlow; varying vec3 vW;
      float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y); }
      void main(){ vec2 p = vW.xz - uFlow * uT * ${speed.toFixed(2)};
        float a = n(p * 0.35 + uT * 0.05) * 0.6 + n(p * 0.9 - uT * 0.08) * 0.4;
        vec3 c = mix(uDeep, uShal, smoothstep(0.35, 0.75, a));
        float sp = smoothstep(0.82, 0.9, n(p * 2.2 + vec2(uT * 0.3, -uT * 0.2)) * n(p * 1.3 - uT * 0.1) * 1.6);
        float streak = length(uFlow) > 0.0 ? smoothstep(0.78, 0.86, n(vec2(dot(p, normalize(uFlow + 1e-4)) * 0.6, dot(p, vec2(-uFlow.y, uFlow.x)) * 3.0))) : 0.0;
        float fo = clamp(${foamFn}, 0.0, 1.0); fo = max(fo * step(0.35, n(p * 1.6 + uT * 0.4) + fo * 0.7), streak);
        c = mix(c, uFoam, max(sp * 0.8, fo));
        gl_FragColor = vec4(c, uOp);
#include <colorspace_fragment>
      }` });
  const mesh = new THREE.Mesh(geo, m); parent.add(mesh); onTick(t => { u.uT.value = t; }); return mesh;
}
// rock with the ambientCG Rock020 colour map, projected from three sides (no seams), stepped in toon bands
let rockTex = null;
function rockMat(tint = 0xffffff, scale = 0.18) {
  if (!rockTex) { rockTex = new THREE.TextureLoader().load('props/tex/rock.jpg'); rockTex.wrapS = rockTex.wrapT = THREE.RepeatWrapping; rockTex.colorSpace = THREE.SRGBColorSpace; }
  const m = toon(tint); m.onBeforeCompile = sh => { sh.uniforms.uRock = { value: rockTex };
    sh.vertexShader = 'varying vec3 vRW; varying vec3 vRN;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vec4 rw = modelMatrix * vec4(transformed, 1.0);\n#ifdef USE_INSTANCING\n rw = modelMatrix * instanceMatrix * vec4(transformed, 1.0);\n#endif\n vRW = rw.xyz; vRN = normalize(mat3(modelMatrix) * objectNormal);');
    sh.fragmentShader = 'uniform sampler2D uRock; varying vec3 vRW; varying vec3 vRN;\n' + sh.fragmentShader.replace('#include <map_fragment>', `vec3 bw = pow(abs(vRN), vec3(4.0)); bw /= (bw.x + bw.y + bw.z);
      vec3 tc = texture2D(uRock, vRW.yz * ${scale.toFixed(3)}).rgb * bw.x + texture2D(uRock, vRW.xz * ${scale.toFixed(3)}).rgb * bw.y + texture2D(uRock, vRW.xy * ${scale.toFixed(3)}).rgb * bw.z;
      float lum = dot(tc, vec3(0.333)); diffuseColor.rgb *= mix(vec3(0.62), vec3(1.25), smoothstep(0.15, 0.6, lum)) * mix(vec3(1.0), tc / max(lum, 0.05), 0.35);`); };
  return m;
}
function lumpy(r, d = 3, amp = 0.22, sq = 0.85) { let g = new THREE.IcosahedronGeometry(r, d); const p = g.attributes.position, v = new THREE.Vector3(), s = rnd() * 9;
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const k = 1 + (Math.sin(v.x / r * 2.3 + s) * Math.cos(v.y / r * 1.9 - s) * Math.sin(v.z / r * 2.1) + 0.4 * Math.sin(v.x / r * 6 + s * 2) * Math.cos(v.z / r * 5)) * amp; p.setXYZ(i, v.x * k, v.y * k * sq, v.z * k); }
  g = g.toNonIndexed(); g.computeVertexNormals(); return g; }
const mesh = (parent, geo, mat, x, y, z, o = {}) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.set(o.rx || 0, o.ry || 0, o.rz || 0); if (o.s) m.scale.setScalar(o.s); if (o.sc) m.scale.set(...o.sc); m.castShadow = o.shadow !== false; m.receiveShadow = true; if (o.ink !== false) { const k = new THREE.Mesh(geo, INK); m.add(k); } parent.add(m); return m; };
const textTex = (txt, { w = 512, h = 160, bg = '#C8A06A', fg = '#3A2414', font = '700 86px Chewy, sans-serif' } = {}) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.fillStyle = bg; x.fillRect(0, 0, w, h);
  for (let i = 0; i < 9; i++) { x.strokeStyle = `rgba(80,50,20,${0.12 + rnd() * 0.12})`; x.lineWidth = 3; x.beginPath(); x.moveTo(0, h * (i + rnd()) / 9); x.bezierCurveTo(w * 0.3, h * rnd(), w * 0.7, h * rnd(), w, h * (i + rnd()) / 9); x.stroke(); }
  x.fillStyle = fg; x.font = font; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(txt, w / 2, h / 2 + 4); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; };

// ---------------------------------------------------------------- code-built props (shared between sets)
const WOOD = 0x8B5E3C, WOOD2 = 0x6E4529, IRON = 0x4A4F5C;
function mineCart(parent, x, y, z, ry = 0, { tipped = 0 } = {}) {
  const g = new THREE.Group(); g.position.set(x, y + (tipped ? 0.55 : 0), z); g.rotation.set(0, ry, 0); g.rotateX(tipped); parent.add(g); const b = builder(g);
  for (let i = 0; i < 4; i++) b.rbox(1.9, 0.26, 0.08, i % 2 ? WOOD : WOOD2, 0, 0.55 + i * 0.27, 0.62, { line: 0.02 }), b.rbox(1.9, 0.26, 0.08, i % 2 ? WOOD2 : WOOD, 0, 0.55 + i * 0.27, -0.62, { line: 0.02 });
  for (let i = 0; i < 4; i++) b.rbox(0.08, 0.26, 1.24, i % 2 ? WOOD : WOOD2, 0.95, 0.55 + i * 0.27, 0, { line: 0.02 }), b.rbox(0.08, 0.26, 1.24, i % 2 ? WOOD2 : WOOD, -0.95, 0.55 + i * 0.27, 0, { line: 0.02 });
  b.rbox(1.9, 0.08, 1.24, WOOD2, 0, 0.44, 0, { line: 0.02 });
  [-0.55, 0.55].forEach(xx => [-0.66, 0.66].forEach(zz => b.box(0.1, 1.15, 0.05, IRON, xx, 0.95, zz, { line: 0.01 })));
  [0.5, 1.38].forEach(yy => [-0.66, 0.66].forEach(zz => b.box(2.0, 0.07, 0.05, IRON, 0, yy, zz, { line: 0.01 })));
  [-0.6, 0.6].forEach(xx => [-0.6, 0.6].forEach(zz => { const w = b.cyl(0.3, 0.3, 0.12, 0x3A3D47, xx, 0.3, zz * 1.12, { rx: Math.PI / 2, line: 0.015, seg: 18 }); b.cyl(0.1, 0.1, 0.14, 0xB8862F, xx, 0.3, zz * 1.13, { rx: Math.PI / 2, line: 0, seg: 10 }); }));
  return g;
}
function rails(parent, curve, n = 60, { y = 0, gauge = 1.1 } = {}) {
  const pts = curve.getSpacedPoints(n), b = builder(parent), up = new THREE.Vector3(0, 1, 0), railM = toon(0x8D93A3, { emissive: 0x111111 });
  for (let i = 0; i < n; i++) { const p = pts[i], t = curve.getTangentAt(i / n), side = new THREE.Vector3().crossVectors(t, up).normalize();
    const tie = b.rbox(gauge + 0.7, 0.12, 0.32, i % 3 ? WOOD : WOOD2, p.x, y + p.y + 0.06, p.z, { line: 0.012 }); tie.rotation.y = Math.atan2(t.x, t.z) + Math.PI / 2; tie.rotation.z = rr(-0.04, 0.04); }
  [-1, 1].forEach(sd => { const path = new THREE.CatmullRomCurve3(pts.map((p, i) => { const t = curve.getTangentAt(Math.min(1, i / n)), side = new THREE.Vector3().crossVectors(t, up).normalize(); return p.clone().addScaledVector(side, sd * gauge / 2).setY(y + p.y + 0.2); }));
    const m = new THREE.Mesh(new THREE.TubeGeometry(path, n * 2, 0.06, 6), railM); m.castShadow = true; parent.add(m); });
}
function lantern(parent, x, y, z, { c = 0xFFB65C, light = true } = {}) {
  const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); const b = builder(g);
  b.cyl(0.18, 0.22, 0.08, IRON, 0, 0, 0, { line: 0.01 }); b.cyl(0.02, 0.24, 0.2, IRON, 0, 0.55, 0, { line: 0.01, seg: 8 }); b.torus(0.1, 0.02, IRON, 0, 0.72, 0, { line: 0 });
  [0, 1, 2, 3].forEach(i => { const a = i * Math.PI / 2 + Math.PI / 4; b.box(0.03, 0.42, 0.03, IRON, Math.cos(a) * 0.17, 0.25, Math.sin(a) * 0.17, { line: 0 }); });
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 8), new THREE.MeshBasicMaterial({ color: 0xFFE7A8 })); core.position.y = 0.24; g.add(core);
  const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.4, 12), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.35, depthWrite: false })); glass.position.y = 0.24; g.add(glass);
  const sp = glowSprite(c, 2.2, 0.75); sp.position.y = 0.24; g.add(sp);
  let L = null; if (light) { L = new THREE.PointLight(c, 10, 12, 1.4); L.position.y = 0.3; g.add(L); }
  const ph = rnd() * 9; onTick(t => { const f = 0.85 + Math.sin(t * 9 + ph) * 0.06 + Math.sin(t * 23 + ph * 2) * 0.05; sp.material.opacity = 0.65 * f; if (L) L.intensity = 10 * f; });
  return g;
}
function sign(parent, txt, x, y, z, ry = 0, { post = true, w = 2.2 } = {}) {
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; parent.add(g); const b = builder(g);
  if (post) b.rbox(0.16, 1.6, 0.16, WOOD2, 0, 0.8, -0.02, { line: 0.015 });
  const board = b.rbox(w, 0.62, 0.1, WOOD, 0, post ? 1.5 : 0, 0, { line: 0.02 }); const face = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.94, 0.56), new THREE.MeshBasicMaterial({ map: textTex(txt), toneMapped: true })); face.position.set(0, post ? 1.5 : 0, 0.056); g.add(face);
  [-1, 1].forEach(sd => b.ball(0.035, IRON, sd * (w / 2 - 0.12), post ? 1.5 : 0, 0.06, { line: 0 }));
  g.rotation.z = rr(-0.05, 0.05); return g;
}
function crystalCluster(parent, x, y, z, { n = 7, size = 1, cols = PAL.crys, light = true, lc = null } = {}) {
  const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); const c0 = pick(cols);
  for (let i = 0; i < n; i++) { const h = size * rr(0.7, 1.8) * (i ? 0.75 : 1.2), r = h * rr(0.16, 0.24), geo = new THREE.CylinderGeometry(0.001, r, h * 0.22, 6, 1); geo.translate(0, h * 0.89, 0);
    const body = new THREE.CylinderGeometry(r, r * 0.92, h * 0.78, 6, 1); body.translate(0, h * 0.39, 0); const col = i ? pick(cols) : c0;
    const mat = toon(0xffffff, { color: new THREE.Color(col).lerp(new THREE.Color(0xffffff), 0.35), emissive: col, emissiveIntensity: 0.75, transparent: true, opacity: 0.9 });
    [body, geo].forEach(gg => { const m = mesh(g, gg, mat, 0, 0, 0, { shadow: false }); m.rotation.set(rr(-0.5, 0.5) * (i ? 1 : 0.3), rr(0, 6.28), rr(-0.5, 0.5) * (i ? 1 : 0.3)); m.userData.k = i; }); }
  // pair the tips with their bodies (same rotation)
  for (let i = 0; i < g.children.length; i += 2) g.children[i + 1].rotation.copy(g.children[i].rotation);
  const sp = glowSprite(lc || c0, size * 3.2, 0.45); sp.position.y = size * 0.8; g.add(sp);
  if (light) { const L = new THREE.PointLight(lc || c0, 4 * size, 7 * size, 1.5); L.position.y = size; g.add(L); }
  const ph = rnd() * 6; onTick(t => { sp.material.opacity = 0.38 + Math.sin(t * 1.4 + ph) * 0.1; });
  return g;
}
function flag(parent, x, y, z, { h = 3.4, ry = 0 } = {}) {
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; parent.add(g); builder(g).cyl(0.06, 0.08, h, WOOD2, 0, h / 2, 0, { line: 0.015 });
  const c = document.createElement('canvas'); c.width = 256; c.height = 170; const x2 = c.getContext('2d'); x2.fillStyle = '#1E1C24'; x2.fillRect(0, 0, 256, 170);
  for (let i = 0; i < 6; i++) { x2.fillStyle = 'rgba(255,255,255,0.05)'; x2.fillRect(rnd() * 256, rnd() * 170, 60, 4); }
  x2.fillStyle = '#F2EFE6'; x2.beginPath(); x2.arc(128, 70, 30, 0, 7); x2.fill(); x2.fillRect(108, 82, 40, 26); x2.fillStyle = '#1E1C24'; [[116, 68], [140, 68]].forEach(([a, b]) => { x2.beginPath(); x2.arc(a, b, 8, 0, 7); x2.fill(); });
  x2.strokeStyle = '#F2EFE6'; x2.lineWidth = 12; x2.lineCap = 'round'; x2.beginPath(); x2.moveTo(80, 120); x2.lineTo(176, 150); x2.moveTo(176, 120); x2.lineTo(80, 150); x2.stroke();
  x2.fillStyle = '#00000000'; const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const geo = new THREE.PlaneGeometry(1.6, 1.05, 16, 6); geo.translate(0.8, 0, 0); const u = { uT: { value: 0 } };
  const mat = toon(0xffffff, { map: t, side: THREE.DoubleSide }); mat.onBeforeCompile = sh => { sh.uniforms.uT = u.uT; sh.vertexShader = 'uniform float uT;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n transformed.z += sin(position.x * 3.5 - uT * 5.0) * 0.14 * position.x + sin(position.y * 2.0 + uT * 3.0) * 0.03 * position.x; transformed.y -= 0.06 * position.x * position.x;'); };
  const f = new THREE.Mesh(geo, mat); f.position.y = h - 0.62; f.castShadow = true; g.add(f); onTick(tt => { u.uT.value = tt; });
  return g;
}
function pawPrints(parent, from, to, n, gy) { const m = toon(0x6E5A3E); const d = to.clone().sub(from); const ang = Math.atan2(d.x, d.z), side = new THREE.Vector3(Math.cos(ang), 0, -Math.sin(ang));
  for (let i = 0; i < n; i++) { const p = from.clone().lerp(to, i / (n - 1)).addScaledVector(side, (i % 2 ? 0.16 : -0.16)); const g = new THREE.Group(); g.position.set(p.x, gy(p.x, p.z) + 0.03, p.z); g.rotation.y = ang; parent.add(g);
    const pad = new THREE.Mesh(new THREE.CircleGeometry(0.1, 12), m); pad.rotation.x = -Math.PI / 2; pad.scale.set(1, 1.15, 1); g.add(pad);
    [-0.09, -0.03, 0.03, 0.09].forEach((xx, k) => { const toe = new THREE.Mesh(new THREE.CircleGeometry(0.035, 8), m); toe.rotation.x = -Math.PI / 2; toe.position.set(xx, 0, 0.13 + (k % 3 ? 0.03 : 0)); g.add(toe); }); } }
function shell(parent, x, y, z, col) { const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = rnd() * 6.28; parent.add(g); const shape = new THREE.Shape(); shape.moveTo(0, 0); for (let i = 0; i <= 10; i++) { const a = Math.PI * (0.15 + 0.7 * i / 10), r = 0.22 * (0.85 + (i % 2) * 0.15); shape.lineTo(Math.cos(a) * r, Math.sin(a) * r); } shape.lineTo(0, 0);
  const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.05, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.03, bevelSegments: 2 }); const m = mesh(g, geo, toon(col), 0, 0.04, 0, { rx: -Math.PI / 2 + 0.25 }); return g; }
function starfish(parent, x, y, z, col = 0xFF8A5C) { const s = new THREE.Shape(); for (let i = 0; i <= 10; i++) { const a = i / 10 * Math.PI * 2 + Math.PI / 2, r = i % 2 ? 0.1 : 0.3; i ? s.lineTo(Math.cos(a) * r, Math.sin(a) * r) : s.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
  const geo = new THREE.ExtrudeGeometry(s, { depth: 0.04, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 3 }); return mesh(parent, geo, toon(col), x, y + 0.05, z, { rx: -Math.PI / 2, rz: rnd() * 6 }); }

// ---------------------------------------------------------------- the sets
const SETS = {};
// ======== 1. Meadow and cave mouth (stop 1; the green top of the lost island in stop 10 uses the same grass, trees and flowers)
SETS.meadow = { name: 'Meadow & cave mouth', stops: [1, 10], light: { sky: 0x7EC8F2, fog: [0xD3EEFA, 40, 120], ambientI: 1.45, sunI: 1.8, sunPos: [16, 22, 12] }, cam: [[0, 6.5, 22], [0, 2, 0]],
  build: async G => {
    const hf = (x, z) => nz(x, z, 0.12) * 0.35 + nz(x, z, 0.3) * 0.08 - Math.max(0, 1 - Math.hypot(x + 7, z - 4) / 3.6) * 0.5;
    ground(G, 80, 120, hf, (x, z, c) => { const n = nz(x, z, 0.2), m = nz(x + 40, z - 20, 0.5); c.setHSL(0.26 + n * 0.02 + (m > 0.9 ? 0.04 : 0), 0.52, 0.47 + m * 0.035); });
    // pond
    const pond = new THREE.CircleGeometry(3.3, 40); pond.rotateX(-Math.PI / 2); const pw = water(G, pond, { deep: 0x3FA0C8, shallow: 0x8FE0EC, foamFn: 'smoothstep(2.9, 3.3, length(vW.xz - vec2(-7.0, 4.0)))' }); pw.position.set(-7, -0.12, 4);
    await scatter(G, 'rock_small', Array.from({ length: 12 }, (_, i) => { const a = i / 12 * 6.28; return { x: -7 + Math.cos(a) * 3.5, z: 4 + Math.sin(a) * 3.4, s: rr(0.5, 1.0), gy: hf, dy: -0.1 }; }), { gy: hf });
    // the hill with the cave mouth
    { const hg = new THREE.SphereGeometry(9, 72, 36, 0, Math.PI * 2, 0, Math.PI / 2), p = hg.attributes.position, v = new THREE.Vector3(); for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const k = 1 + nz(v.x, v.z + v.y, 0.45) * 0.08 + nz(v.x * 2, v.y * 2, 0.9) * 0.035; p.setXYZ(i, v.x * k, v.y * k, v.z * k); } hg.computeVertexNormals();
      const hm = rockMat(0xA9A3A0, 0.22); const old = hm.onBeforeCompile; hm.onBeforeCompile = sh => { old(sh); sh.fragmentShader = sh.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\n float grassy = smoothstep(0.55, 0.8, vRN.y + sin(vRW.x * 1.7) * 0.08 + sin(vRW.z * 2.3) * 0.06); diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.42, 0.72, 0.33), grassy);'); };
      const hill = new THREE.Mesh(hg, hm); hill.scale.set(1.25, 0.75, 1); hill.position.set(0, -1.2, -12); hill.castShadow = hill.receiveShadow = true; G.add(hill); }
    const dark = new THREE.MeshBasicMaterial({ color: 0x0A0D20, side: THREE.DoubleSide }), R = 2.6;
    const tun = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 9, 32, 1, true, 0, Math.PI), dark); tun.rotation.set(Math.PI / 2, 0, Math.PI / 2); tun.position.set(0, -0.1, -6); G.add(tun);
    const back = new THREE.Mesh(new THREE.CircleGeometry(R, 32, 0, Math.PI), dark); back.position.set(0, -0.1, -10.4); G.add(back);
    const arch = []; for (let i = 0; i <= 9; i++) { const a = Math.PI * i / 9; arch.push({ x: Math.cos(a) * (R + 0.7), z: -1.6 + rr(-0.3, 0.3), y: Math.sin(a) * (R + 0.6) - 0.4, s: rr(1.6, 2.2), sy: 0.9 }); }
    const am = rockMat(0xB0ABA6, 0.35); arch.forEach(a => mesh(G, lumpy(a.s * 0.42, 2, 0.25, 0.8), am, a.x, a.y + 0.4, a.z, { ry: rnd() * 6 }));
    [[-R - 1.2, -1.6], [R + 1.3, -1.8]].forEach(([x, z]) => mesh(G, lumpy(1.1, 2, 0.2, 2.4), am, x, 1.6, z, { ry: rnd() * 6 }));
    await scatter(G, 'rock_large', Array.from({ length: 10 }, () => { const a = rnd() * Math.PI, r = rr(4, 9); return { x: Math.cos(a) * r * 1.2, z: -11 + Math.sin(a) * r * 0.6 + 4, y: rr(0, 3), s: rr(1.5, 3) }; }), { gy: hf });
    for (let i = 0; i < 5; i++) crystalCluster(G, (i % 2 ? 1 : -1) * rr(0.6, 1.6), 0, -3.5 - i * 1.3, { n: 5, size: rr(0.35, 0.6), light: i % 2 === 0 });
    // woods, bushes, flowers, mushrooms, logs
    const free = (x, z) => Math.hypot(x, z - 6) > 6 && Math.hypot(x + 7, z - 4) > 4.2 && Math.hypot(x, (z + 10) * 1.3) > 11;
    const sp = (rmin, rmax) => { for (let k = 0; k < 200; k++) { const a = rnd() * 6.28, r = rr(rmin, rmax), x = Math.cos(a) * r, z = Math.sin(a) * r + 2; if (free(x, z)) return [x, z]; } return null; };
    const trees = { tree_oak: [], tree_fat: [], tree_pine: [], tree_pine_tall: [], tree_autumn: [] }, tk = Object.keys(trees);
    for (let i = 0; i < 48; i++) { const s = sp(11, 34); if (s && !(s[1] > 8 && Math.abs(s[0]) < 14)) trees[tk[i % 5]].push({ x: s[0], z: s[1], s: rr(1.9, 3.2), sy: rr(0.9, 1.25) }); }
    for (const k in trees) await scatter(G, k, trees[k], { gy: hf });
    const bushes = []; for (let i = 0; i < 26; i++) { const s = sp(7, 26); if (s) bushes.push({ x: s[0], z: s[1], s: rr(0.9, 1.7) }); }
    await scatter(G, 'bush', bushes.filter((_, i) => i % 2), { gy: hf }); await scatter(G, 'bush_large', bushes.filter((_, i) => !(i % 2)), { gy: hf });
    const fl = []; for (let d = 0; d < 12; d++) { const s = sp(4, 20); if (!s) continue; const col = pick(PAL.bloom); for (let i = 0; i < 18; i++) { const a = rnd() * 6.28, r = Math.sqrt(rnd()) * 2.2, x = s[0] + Math.cos(a) * r, z = s[1] + Math.sin(a) * r; if (free(x, z)) fl.push({ x, z, s: rr(0.45, 0.8), col }); } }
    await scatter(G, 'flower_red', fl, { gy: hf, shadow: false });
    await scatter(G, 'mushroom_red', Array.from({ length: 14 }, () => { const s = sp(6, 22) || [9, 9]; return { x: s[0], z: s[1], s: rr(0.5, 1.1) }; }), { gy: hf, shadow: false });
    await scatter(G, 'log', [{ x: 8, z: 5, s: 1, ry: 0.4 }, { x: -11, z: 12, s: 0.9 }], { gy: hf, norm: 3 }); await scatter(G, 'stump', [{ x: 10, z: 10 }, { x: -12, z: -1 }], { gy: hf, norm: 1.3 });
    await scatter(G, 'rock_small', Array.from({ length: 20 }, () => { const s = sp(5, 26) || [6, 6]; return { x: s[0], z: s[1], s: rr(0.6, 1.5), dy: -0.1 }; }), { gy: hf });
    grass(G, small ? 9000 : 22000, () => { const a = rnd() * 6.28, r = Math.pow(rnd(), 0.7) * 30, x = Math.cos(a) * r, z = Math.sin(a) * r + 4; return free(x, z) || (Math.hypot(x, z - 6) > 3 && Math.hypot(x + 7, z - 4) > 3.6 && z > -1) ? [x, z] : null; }, hf);
    pawPrints(G, new THREE.Vector3(1.5, 0, 8), new THREE.Vector3(0.4, 0, -0.5), 12, hf); pawPrints(G, new THREE.Vector3(-1.5, 0, 8), new THREE.Vector3(-5.5, 0, 6), 8, hf);
    // the Ferris wheel on the far hill, and the sea
    ferris(G, -24, hf(-24, -30) - 0.2, -30, 0.45);
    const sea = new THREE.PlaneGeometry(400, 120); sea.rotateX(-Math.PI / 2); water(G, sea, { deep: 0x3FA7D6, shallow: 0x7FD0EA }).position.set(0, -0.6, -100);
    const kids = makeLabKids(G); [['leo', -1.2, 7, 0.2], ['mia', 1.2, 7.3, -0.2], ['toby', 0.2, 5.6, 0]].forEach(([n, x, z, ry]) => { const c = kids[n]; c.g.position.set(x, hf(x, z), z); c.g.rotation.y = Math.PI + ry; });
    clouds(G, 10, 22, 34, -50);
    return [['Swaying grass', [0, 1.5, 12], [0, 0.4, 7]], ['Cave mouth', [0, 3, 6], [0, 1.6, -3]], ['Crystals inside', [0.5, 1.8, 0.5], [0, 0.8, -5]], ['Pond', [-4, 3, 10], [-7, 0, 4]], ['Woods', [10, 4, 14], [16, 2, 0]], ['Ferris wheel', [-12, 4, -6], [-24, 6, -30]], ['Paw prints', [1.5, 2, 10], [0.6, 0, 5]]];
  },
  props: [['Grass tufts', 'code', 'thousands of blades, swaying in the wind'], ['Trees (5 kinds)', 'Kenney Nature Kit', 'oak, round, pine, tall pine, autumn'], ['Bushes, flowers, mushrooms, logs, stumps', 'Kenney Nature Kit'], ['Rocks', 'Kenney Nature Kit', 'restyled stone colours'],
    ['Pond water', 'code', 'moving ripples, sparkles, foam at the edge'], ['Cave mouth', 'code + Kenney rocks', 'a real arch of rocks round a dark tunnel'], ['Crystals', 'code', 'glowing clusters that light the tunnel'], ['Ferris wheel', 'code', 'turning, with twinkling bulbs'], ['Paw prints', 'code']] };

// ======== 2. Mine tunnels (stops 2, 3, 4, 7, 8)
SETS.mine = { name: 'Mine tunnels', stops: [2, 3, 4, 7, 8], light: { sky: 0x0B1020, fog: [0x0B1020, 12, 40], ambient: 0x8F9FD8, ambientI: 1.0, sunI: 0.35, sunPos: [4, 14, 6] }, cam: [[3.2, 3.4, 14], [0, 1.3, -2]],
  build: async G => {
    const hf = (x, z) => nz(x, z, 0.5) * 0.08;
    ground(G, 60, 80, hf, (x, z, c) => { const n = nz(x, z, 0.6); c.setHSL(0.07, 0.18, 0.2 + n * 0.03); }, rockMat(0x8C7A66, 0.25)).geometry;
    // the tunnel: a lumpy rock tube with a rock texture, open towards the camera
    const tube = new THREE.CylinderGeometry(4.2, 4.2, 30, 36, 30, true, Math.PI * 0.5, Math.PI); tube.rotateX(Math.PI / 2); { const p = tube.attributes.position, v = new THREE.Vector3(); for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const k = 1 + nz(v.x * 2, v.z, 0.6) * 0.12 + nz(v.y * 3, v.z * 2, 0.9) * 0.05; p.setXYZ(i, v.x * k * 1.05, Math.max(-0.3, v.y * k * 0.9), v.z); } tube.computeVertexNormals(); }
    const tm = new THREE.Mesh(tube, rockMat(0x9A8B7A, 0.3)); tm.material.side = THREE.BackSide; tm.position.set(0, 0, -6); tm.receiveShadow = true; G.add(tm);
    // stalactites and stalagmites
    const rm = rockMat(0xA89A88, 0.6); for (let i = 0; i < 30; i++) { const x = rr(-3.2, 3.2), z = rr(-19, 3), h = rr(0.5, 1.6), up = i % 3 === 0; if (up && Math.abs(x) < 1.5) continue; const g = new THREE.ConeGeometry(rr(0.12, 0.28), h, 7, 3); const p = g.attributes.position; for (let k = 0; k < p.count; k++) p.setX(k, p.getX(k) + Math.sin(p.getY(k) * 5) * 0.03); g.computeVertexNormals();
      const m = mesh(G, g, rm, x, up ? h / 2 : Math.sqrt(Math.max(0, 16 - x * x)) * 0.92 - h / 2 - 0.1, z, { rx: up ? 0 : Math.PI }); }
    // track, sleepers and the cart
    const curve = new THREE.CatmullRomCurve3([[0.4, 0, 8], [0, 0, 2], [-0.6, 0, -4], [0.6, 0, -12], [0, 0, -20]].map(a => new THREE.Vector3(...a)));
    rails(G, curve, 48); mineCart(G, 0.05, 0.2, 1.5, Math.PI / 2 + 0.05);
    // timber supports, lanterns, signs at the fork, the glowing stone on its rock, fallen rocks
    [-1, -7, -13].forEach((z, i) => { const b = builder(G); [-1, 1].forEach(sd => b.rbox(0.32, 3.4, 0.32, WOOD2, sd * 2.4, 1.7, z, { line: 0.02 })); b.rbox(5.4, 0.36, 0.4, WOOD, 0, 3.45, z, { line: 0.02 }); [-1, 1].forEach(sd => { const br = b.rbox(0.18, 1.3, 0.18, WOOD, sd * 1.9, 2.95, z, { line: 0.015 }); br.rotation.z = sd * 0.75; }); lantern(G, i % 2 ? -1.7 : 1.7, 2.55, z + 0.25); });
    sign(G, 'LEFT', -1.4, 0, -9, 0.5); sign(G, 'RIGHT', 1.6, 0, -9.4, -0.5);
    const rock = mesh(G, lumpy(0.8), rockMat(0x8E8478, 0.5), -2.5, 0.4, 4.5); crystalCluster(G, -2.5, 0.9, 4.5, { n: 1, size: 0.55, cols: [0x7FE9FF] });
    await scatter(G, 'rock_small', Array.from({ length: 14 }, () => ({ x: rr(-3, 3) * (rnd() < 0.5 ? 1 : 0.9), z: rr(-16, 7), s: rr(0.4, 1), dy: -0.05 })).filter(r => Math.abs(r.x) > 1.3), { gy: hf });
    // dust in the lantern light
    motes(G, 120, [-3, 0.5, -16], [3, 3.5, 7], 0xFFE2B0, 0.05);
    const kids = makeLabKids(G); kids.leo.g.position.set(1.6, 0, 4.5); kids.leo.g.rotation.y = Math.PI - 0.6; kids.mia.g.position.set(-1.2, 0, 3.4); kids.mia.g.rotation.y = 2.6; kids.toby.g.position.set(-0.6, 0, 5.2); kids.toby.g.rotation.y = 3.4;
    return [['Mine cart', [2.6, 1.8, 4.2], [0, 0.8, 1.5]], ['Track and sleepers', [1.5, 1.2, 6], [0, 0, 0]], ['Lantern', [2.4, 3, 0.6], [1.7, 2.6, -0.8]], ['Timber supports', [0, 2, 3], [0, 2.4, -7]], ['Signs at the fork', [0, 1.8, -5.5], [0, 1.4, -9.2]], ['Glowing stone', [-0.8, 1.5, 6.4], [-2.5, 0.9, 4.5]], ['Rock walls', [0, 1.6, 8], [0, 2.4, -12]]];
  },
  props: [['Rock walls, floor', 'code + ambientCG Rock020 texture', 'real rock grain, still in toon bands'], ['Stalactites, stalagmites', 'code'], ['Mine cart', 'code', 'planks, iron bands, spoked wheels'], ['Rails and sleepers', 'code', 'follow any path'],
    ['Timber supports', 'code'], ['Lanterns', 'code', 'warm flickering light and glow'], ['Signs', 'code', 'painted wood with any word'], ['Glowing stone', 'code'], ['Loose rocks', 'Kenney Nature Kit'], ['Dust in the light', 'code']] };

// ======== 3. Crystal cavern and river (stops 5, 6, 9)
SETS.crystal = { name: 'Crystal cavern & river', stops: [5, 6, 9], light: { sky: 0x071822, fog: [0x0A2230, 14, 46], ambient: 0x7FE9FF, ambientI: 0.5, sunI: 0.3, sunPos: [-6, 14, 4] }, cam: [[7, 5, 13], [0, 1.5, -2]],
  build: async G => {
    const hf = (x, z) => { const d = Math.abs(x - Math.sin(z * 0.18) * 2); return d < 2.2 ? -0.6 * Math.cos(d / 2.2 * Math.PI / 2) - 0.05 : nz(x, z, 0.4) * 0.15 + Math.max(0, d - 6) * 0.25; };
    ground(G, 60, 140, hf, (x, z, c) => { const n = nz(x, z, 0.5); c.setHSL(0.55, 0.15, 0.22 + n * 0.03); }, rockMat(0x6E7E88, 0.28));
    const dome = new THREE.SphereGeometry(18, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2); { const p = dome.attributes.position, v = new THREE.Vector3(); for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const k = 1 + nz(v.x, v.z, 0.3) * 0.07 + nz(v.y * 2, v.x, 0.6) * 0.04; p.setXYZ(i, v.x * k, v.y * k * 0.55, v.z * k); } dome.computeVertexNormals(); }
    const dm = new THREE.Mesh(dome, rockMat(0x5A6B78, 0.15)); dm.material.side = THREE.BackSide; dm.position.z = -4; G.add(dm);
    // the river, flowing past, with foam streaks
    const riv = new THREE.PlaneGeometry(5, 50, 20, 80); riv.rotateX(-Math.PI / 2); { const p = riv.attributes.position; for (let i = 0; i < p.count; i++) p.setX(i, p.getX(i) + Math.sin(p.getZ(i) * 0.18) * 2); }
    water(G, riv, { deep: 0x1D6F8E, shallow: 0x46C7D6, flow: [0, 1.6], foamFn: 'smoothstep(1.7, 2.4, abs(vW.x - sin(vW.z * 0.18) * 2.0))', speed: 1.2 }).position.y = -0.3;
    // the waterfall pouring off a ledge at the back
    const fall = new THREE.PlaneGeometry(3.2, 6, 10, 20); const fw = water(G, fall, { deep: 0x3FB6D2, shallow: 0xCFF6FF, flow: [0, -2.5], opacity: 0.88, speed: 1.6 }); fw.position.set(Math.sin(-20 * 0.18) * 2, 2.7, -18.4);
    mesh(G, lumpy(3, 3, 0.18, 0.5), rockMat(0x6A7A86, 0.3), -4, 5.8, -19.5, { sc: [1.6, 0.8, 1] }); mesh(G, lumpy(3, 3, 0.18, 0.5), rockMat(0x6A7A86, 0.3), 3.5, 5.8, -19.5, { sc: [1.4, 0.8, 1] });
    const sp = glowSprite(0xCFF6FF, 7, 0.25); sp.position.set(fw.position.x, 0.5, -17); G.add(sp);
    // crystals in every colour: clusters on the floor, on the walls, hanging from the roof
    const RB = PAL.rainbow;
    [[-5, -3], [5.5, -6], [-6.5, 4], [6, 3.5], [-3.5, -11], [4.5, -13], [8, -1], [-8.5, -6], [7.5, 8], [-7, 9.5]].forEach(([x, z], i) => crystalCluster(G, x, hf(x, z) - 0.1, z, { n: 8, size: rr(0.7, 1.4), cols: i % 3 ? RB : PAL.crys, light: i < 7 }));
    for (let i = 0; i < 12; i++) { const a = Math.PI + rnd() * Math.PI, r = rr(8, 14), cc = crystalCluster(G, Math.cos(a) * r, rr(5, 8), Math.sin(a) * r - 4, { n: 5, size: rr(0.4, 0.8), cols: RB, light: false }); cc.rotation.z = Math.PI; }
    await scatter(G, 'crystal', Array.from({ length: 20 }, () => { const x = rr(-9, 9), z = rr(-15, 10); return Math.abs(x - Math.sin(z * 0.18) * 2) > 3 ? { x, z, s: rr(0.6, 1.2), pal: RB, rz: rr(-0.4, 0.4) } : null; }).filter(Boolean), { gy: hf, shadow: false });
    await scatter(G, 'rock_large', Array.from({ length: 12 }, () => { const z = rr(-16, 12), x = Math.sin(z * 0.18) * 2 + (rnd() < 0.5 ? -1 : 1) * rr(2.4, 3.2); return { x, z, s: rr(0.8, 1.6) }; }), { gy: hf, style: (n, mn) => [rockMat(0x7E8A94, 0.4)] });
    { const lg = new THREE.Group(); lg.position.set(Math.sin(3 * 0.18) * 2 + 0.3, -0.32, 3); lg.rotation.y = 1.3; G.add(lg); const b = builder(lg); b.cyl(0.32, 0.36, 3, 0x7A5132, 0, 0, 0, { rz: Math.PI / 2, line: 0.02, seg: 12 }); [-1, 1].forEach(sd => b.cyl(0.3, 0.3, 0.02, 0xE2C49A, sd * 1.51, 0, 0, { rz: Math.PI / 2, line: 0, seg: 12 })); b.cyl(0.08, 0.1, 0.5, 0x7A5132, 0.4, 0.3, 0.1, { rz: -0.5, line: 0.012 }); onTick(t => { lg.position.y = -0.32 + Math.sin(t * 1.5) * 0.04; lg.rotation.x = Math.sin(t) * 0.05; }); }
    [[2.2, 7], [-2.6, 9], [3.6, 10.5]].forEach(([x, z]) => crystalCluster(G, x, hf(x, z) - 0.1, z, { n: 6, size: rr(0.45, 0.7), cols: RB, light: false }));
    motes(G, 160, [-10, 0.5, -16], [10, 6, 10], 0xB9F6FF, 0.07);
    const kids = makeLabKids(G); kids.leo.g.position.set(-3.2, hf(-3.2, 6), 6); kids.leo.g.rotation.y = 2.6; kids.mia.g.position.set(-4.3, hf(-4.3, 5), 5); kids.mia.g.rotation.y = 2.4; kids.toby.g.position.set(-3.6, hf(-3.6, 7.4), 7.4); kids.toby.g.rotation.y = 2.8;
    return [['Crystal clusters', [-2, 2.2, 0.5], [-5, 1, -3]], ['Rainbow crystals', [3, 2, 0], [5.5, 1, -6]], ['River', [3, 3.5, 9], [1, -0.3, 2]], ['Waterfall', [2, 3, -10], [-0.7, 2.7, -18.4]], ['Floating log', [2.5, 1.5, 6], [0.9, -0.3, 3]], ['Roof crystals', [0, 2, 4], [0, 6, -8]]];
  },
  props: [['Crystal clusters', 'code', 'six-sided, see-through, glowing, light the cave around them'], ['Rainbow crystals', 'code + Quaternius crystals', 'pink, gold, green, blue, purple like the panels'], ['River', 'code', 'flowing water with foam streaks and white edges'],
    ['Waterfall', 'code'], ['Cavern walls', 'code + ambientCG Rock020'], ['Floating log', 'Kenney Nature Kit'], ['Sparkles in the air', 'code']] };

// ======== 4. Beach and island (Episode 2's beach, stops 10–11)
SETS.beach = { name: 'Beach & island', stops: [6, 10, 11], light: { sky: 0x86D4F5, fog: [0xD9F3FC, 40, 130], ambientI: 1.5, sunI: 1.9, sunPos: [-14, 22, 10] }, cam: [[2, 6, 20], [0, 1, 2]],
  build: async G => {
    const hf = (x, z) => { const d = z + nz(x, 0, 0.15) * 1.5; return Math.min(1.2, (6 - d) * 0.09) + nz(x, z, 0.35) * 0.06 + Math.max(0, -z - 10) * 0.25; };
    ground(G, 90, 140, hf, (x, z, c) => { const y = hf(x, z), wet = y < 0.25, rip = Math.sin(x * 2.4 + nz(x, z, 0.3) * 3) * 0.5 + 0.5; c.setHSL(0.11, wet ? 0.38 : 0.55, wet ? 0.62 : 0.76 + rip * 0.03); });
    const sea = new THREE.PlaneGeometry(200, 80, 60, 30); sea.rotateX(-Math.PI / 2); water(G, sea, { deep: 0x1E8FC2, shallow: 0x6FE0E8, foamFn: '1.0 - smoothstep(0.0, 1.1, abs(vW.z - 9.6 - sin(vW.x * 0.45 + uT * 1.2) * 0.7 - sin(uT * 0.9) * 0.6))' }).position.set(0, -0.3, 49);
    // cliff with the cave at the back, palms, rocks, driftwood
    { const cm = rockMat(0xD7B48A, 0.2), old = cm.onBeforeCompile; cm.onBeforeCompile = sh => { old(sh); sh.fragmentShader = sh.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\n diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.45, 0.74, 0.36), smoothstep(0.7, 0.85, vRN.y) * smoothstep(3.5, 5.0, vRW.y));'); };
      [[-9, 3, -17, 6, 1.1], [-1, 3.6, -19, 7, 1.0], [8, 2.6, -17, 5.5, 1.2], [-15, 2, -13, 4, 1], [14, 2, -13, 4.5, 1]].forEach(([x, y, z, r, sq]) => mesh(G, lumpy(r, 3, 0.16, 0.75 * sq), cm, x, y, z, { ry: rnd() * 6 })); }
    const cave = new THREE.Mesh(new THREE.CircleGeometry(2.1, 32, 0, Math.PI), new THREE.MeshBasicMaterial({ color: 0x0A0D20 })); cave.position.set(-3.5, hf(-3.5, -12.6) - 0.1, -12.6); G.add(cave);
    await scatter(G, 'formation-rock', [{ x: 7, z: -4, s: 1, ry: 0.4 }, { x: -9, z: -3, s: 0.8, ry: 2 }, { x: 11, z: 6, s: 0.6 }], { gy: hf, norm: 4.5, style: (n, mn, o) => [/sand/.test(mn) ? toon(0xE6CF96) : rockMat(0xC9A884, 0.4)] });
    await scatter(G, 'palm-detailed-long', [{ x: -6.5, z: 0, s: 1, ry: 0.3, rz: -0.12 }, { x: 8.5, z: 1, s: 1, ry: 2, rz: 0.1 }], { gy: hf, norm: 7.5 });
    await scatter(G, 'palm-detailed-short', [{ x: -9, z: 3.5, s: 1, ry: 1 }, { x: 4.5, z: -6, s: 1 }], { gy: hf, norm: 5 });
    await scatter(G, 'bush_large', [{ x: -8, z: -5, s: 1.4 }, { x: 10, z: -2, s: 1.2 }, { x: -11, z: 1, s: 1 }], { gy: hf });
    await scatter(G, 'log', [{ x: 3.2, z: 6.5, s: 1, ry: 1.1, rz: 0.1 }], { gy: hf, norm: 3, style: (n, mn) => [toon(/bark/i.test(mn) ? 0xB89C80 : 0xE6DCC8)] });
    await scatter(G, 'crab', [{ x: 1.5, z: 9, s: 1, ry: -0.5 }], { gy: hf, norm: 0.8 });
    const sc = [0xFFD8C8, 0xFFF1D6, 0xF6B8C8, 0xE9D4FF]; for (let i = 0; i < 14; i++) { const x = rr(-10, 10), z = rr(2, 11); shell(G, x, hf(x, z), z, pick(sc)); } [[-2, 10], [5, 8.5], [-5, 7.5]].forEach(([x, z]) => starfish(G, x, hf(x, z), z, pick([0xFF8A5C, 0xFFB14A])));
    // Toby's three dig mounds, the shovel, the flag, the tipped cart
    [[-5.5, 1.5], [6, -2.5], [0.5, 9.8]].forEach(([x, z]) => mesh(G, new THREE.SphereGeometry(0.9, 20, 10, 0, 6.28, 0, Math.PI / 2), toon(0xD9B878), x, hf(x, z) - 0.05, z, { sc: [1, 0.45, 1], ink: false }));
    flag(G, -1, hf(-1, -3), -3, { ry: 0.3 }); const cart = mineCart(G, 3.5, hf(3.5, -1), -1, 0.7, { tipped: 1.35 });
    await scatter(G, 'shovel', [{ x: -4.6, z: 2.2, y: hf(-4.6, 2.2) + 0.1, rx: 0.3, rz: 1.35, ry: 0.4 }], { gy: hf, norm: 1.6 });
    clouds(G, 8, 20, 30, -40);
    const kids = makeLabKids(G); [['leo', -1.4, 6], ['mia', 0.4, 5.6], ['toby', -5.2, 2.6]].forEach(([n, x, z]) => { kids[n].g.position.set(x, hf(x, z), z); kids[n].g.rotation.y = n === 'toby' ? 0.6 : Math.PI - 0.1; }); kids.toby.pose('dig');
    return [['Shoreline foam', [0, 2.5, 18], [0, 0, 12]], ['Palm trees', [-2, 4, 8], [-6.5, 3.5, 0]], ['Rocks & cliff', [3, 4, 4], [-2, 2, -12]], ['Shells & starfish', [0, 1.4, 12.5], [-1, 0, 9]], ['Crab', [2.4, 0.9, 10.8], [1.5, 0.2, 9]], ['Dig mounds & shovel', [-3, 2, 5.5], [-5, 0, 1.8]], ['Pirate flag', [1.5, 3, 1.5], [-1, 2.6, -3]], ['Tipped cart', [6, 2, 2.5], [3.5, 0.6, -1]]];
  },
  props: [['Sand', 'code', 'dry and wet sand, little ripples'], ['Sea', 'code', 'moving water with surf rolling up the beach'], ['Palm trees', 'Kenney Pirate Kit (pmndrs market)'], ['Rock formations', 'Kenney Pirate Kit', 'sandstone with rock texture'],
    ['Bushes, driftwood', 'Kenney Nature Kit'], ['Crab', 'Quaternius'], ['Shells, starfish', 'code'], ['Dig mounds', 'code'], ['Shovel', 'Kenney Pirate Kit'], ['Pirate flag', 'code', 'cloth that waves in the wind'], ['Mine cart (tipped)', 'code']] };

// ======== 5. Clear sea and the sunken ship (stop 12)
SETS.sea = { name: 'Clear sea & shipwreck', stops: [12], light: { sky: 0x8ED8F5, fog: [0xCFF1FA, 30, 110], ambientI: 1.6, sunI: 1.8, sunPos: [10, 24, 8] }, cam: [[6, 5, 15], [-1, -2, -1]],
  build: async G => {
    const hf = (x, z) => -4 + nz(x, z, 0.15) * 0.6 + nz(x, z, 0.5) * 0.15;
    ground(G, 90, 120, hf, (x, z, c) => { const n = nz(x, z, 0.3); c.setHSL(0.13, 0.45, 0.66 + n * 0.04); });
    // light ripples dancing on the seabed
    const caus = new THREE.PlaneGeometry(60, 60); caus.rotateX(-Math.PI / 2); const cu = { uT: { value: 0 } };
    const cm = new THREE.ShaderMaterial({ uniforms: cu, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, vertexShader: 'varying vec2 vP; void main(){ vP = position.xz; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: 'uniform float uT; varying vec2 vP; float c(vec2 p){ p *= 0.8; float v = 0.0; for (int i = 0; i < 3; i++) { p += vec2(sin(p.y * 1.3 + uT * 0.7), cos(p.x * 1.1 - uT * 0.6)) * 0.6; v += abs(sin(p.x + p.y)); } return v / 3.0; } void main(){ float k = smoothstep(0.88, 0.99, 1.0 - c(vP)); gl_FragColor = vec4(vec3(0.75, 0.95, 1.0) * k * 0.55 * (1.0 - smoothstep(18.0, 28.0, length(vP))), 1.0); }' });
    const cmesh = new THREE.Mesh(caus, cm); cmesh.position.y = -3.6; G.add(cmesh); onTick(t => { cu.uT.value = t; });
    await scatter(G, 'ship-wreck', [{ x: -2, z: -3, y: hf(-2, -3) - 0.4, ry: 0.6, rz: 0.12 }], { gy: hf, norm: 11 });
    await scatter(G, 'formation-large-stone', [{ x: 5, z: 2, ry: 0.4 }, { x: 7, z: -5 }, { x: -9, z: 4, ry: 2 }], { gy: hf, norm: 4, style: (n, mn) => [/sand/.test(mn) ? toon(0xE6CF96) : rockMat(0x8FA7B5, 0.4)] });
    await scatter(G, 'plant-pirate-kit', Array.from({ length: 26 }, () => ({ x: rr(-12, 12), z: rr(-10, 10), s: rr(0.8, 1.6) })), { gy: hf, norm: 0.9, style: () => [toon(pick([0x3FAE7A, 0x56C08A, 0x2E9C8A]))] });
    await scatter(G, 'barrel', [{ x: 1.8, z: 1.5, rz: 1.5, ry: 0.4 }, { x: -5.5, z: 2.5 }], { gy: hf, norm: 1.2 }); await scatter(G, 'chest', [{ x: 0.6, z: 3, ry: -0.5 }], { gy: hf, norm: 1.2 });
    const kp = sign(G, 'KEEP OUT', 4.2, hf(4.2, 3.5), 3.5, -0.4); kp.rotation.z = 0.12;
    // a school of fish circling the wreck
    const fishes = await scatter(G, 'fish', Array.from({ length: 14 }, (_, i) => ({ x: 0, z: 0, y: 0, s: 1 })), { norm: 0.7, shadow: false });
    if (fishes) { const sch = new THREE.Group(); G.add(sch); G.remove(fishes); sch.add(fishes); const ims = fishes.children; const ph = Array.from({ length: 14 }, (_, i) => [i / 14 * 6.28 + rnd() * 0.3, rr(4, 6.5), rr(-2.8, -1.4)]), M = new THREE.Matrix4(), Q = new THREE.Quaternion(), S = new THREE.Vector3(0.7, 0.7, 0.7);
      onTick(t => ph.forEach(([a0, r, y], i) => { const a = a0 + t * 0.35; Q.setFromEuler(new THREE.Euler(0, -a, 0)); const box = 1; M.compose(new THREE.Vector3(Math.cos(a) * r - 1, y + Math.sin(t * 2 + i) * 0.15, Math.sin(a) * r - 2), Q, S.set(box, box, box)); ims.forEach(im => { im.setMatrixAt(i, M); im.instanceMatrix.needsUpdate = true; }); })); }
    // the see-through surface, and the cart-boat floating on it
    const surf = new THREE.PlaneGeometry(200, 200, 60, 60); surf.rotateX(-Math.PI / 2); water(G, surf, { deep: 0x3AB7DA, shallow: 0x9FEAF2, opacity: 0.42 }).position.y = 0;
    const boat = new THREE.Group(); boat.position.set(3, 0, 6); boat.rotation.y = -0.6; G.add(boat); mineCart(boat, 0, -0.75, 0, 0); flag(boat, 0, 0.2, 0, { h: 3 });
    onTick(t => { boat.position.y = Math.sin(t * 1.3) * 0.08; boat.rotation.z = Math.sin(t * 0.9) * 0.05; });
    bubbles(G, 60, [-8, -4, -8], [8, 0, 8]);
    return [['Sunken ship', [4, 0.5, 4], [-2, -2.5, -3]], ['Seaweed & rocks', [6, -1.5, 6], [3, -3.6, 0]], ['KEEP OUT sign', [6, -1.6, 7], [4.2, -2.6, 3.5]], ['Fish', [0, -0.5, 8], [-1, -2, -2]], ['Light on the seabed', [0, 3, 10], [0, -3.6, 0]], ['Cart-boat', [7, 2, 11], [3, 0.5, 6]]];
  },
  props: [['Sunken ship', 'Kenney Pirate Kit (pmndrs market)'], ['Sea surface', 'code', 'see-through, so the seabed shows'], ['Light ripples on the seabed', 'code'], ['Seaweed', 'Kenney Pirate Kit'], ['Rocks', 'Kenney Pirate Kit'], ['Barrels, chest', 'Kenney Pirate Kit'],
    ['Fish', 'Quaternius', 'a school circling the wreck'], ['KEEP OUT sign', 'code'], ['Cart-boat with flag', 'code'], ['Bubbles', 'code']] };

// ======== 6. Frozen sea (stops 13–15)
SETS.ice = { name: 'Frozen sea', stops: [13, 14, 15], light: { sky: 0x9AB2C8, fog: [0xC9D6E2, 14, 70], ambient: 0xDDEBFF, ambientI: 1.3, sunI: 0.9, sunPos: [-8, 16, 6] }, cam: [[4, 4.5, 14], [0, 1, 0]],
  build: async G => {
    // cracked ice plates: a canvas of cells with dark cracks, tinted teal and lavender
    const c = document.createElement('canvas'); c.width = c.height = 1024; const x = c.getContext('2d'); const pts = Array.from({ length: 70 }, () => [rnd() * 1024, rnd() * 1024]);
    const img = x.createImageData(1024, 1024); for (let yy = 0; yy < 1024; yy += 2) for (let xx = 0; xx < 1024; xx += 2) { let d1 = 1e9, d2 = 1e9, k = 0; pts.forEach(([px, py], i) => { for (let ox = -1024; ox <= 1024; ox += 1024) for (let oy = -1024; oy <= 1024; oy += 1024) { const d = Math.hypot(xx - px - ox, yy - py - oy); if (d < d1) { d2 = d1; d1 = d; k = i; } else if (d < d2) d2 = d; } });
      const edge = d2 - d1, crack = edge < 3 ? 1 : edge < 8 ? 0.4 : 0, tint = (k * 37 % 10) / 10; const r = 200 + tint * 25 - crack * 110, g = 228 + tint * 8 - crack * 90, b = 240 - tint * 6 - crack * 50; for (const [a, bb] of [[0, 0], [1, 0], [0, 1], [1, 1]]) { const o = ((yy + bb) * 1024 + xx + a) * 4; img.data[o] = r; img.data[o + 1] = g; img.data[o + 2] = b; img.data[o + 3] = 255; } }
    x.putImageData(img, 0, 0); const it = new THREE.CanvasTexture(c); it.wrapS = it.wrapT = THREE.RepeatWrapping; it.repeat.set(4, 4); it.colorSpace = THREE.SRGBColorSpace;
    const iceM = toon(0xffffff, { map: it, emissive: 0x2E5A70, emissiveIntensity: 0.15 }); const ice = new THREE.PlaneGeometry(160, 160, 2, 2); ice.rotateX(-Math.PI / 2); const im = new THREE.Mesh(ice, iceM); im.receiveShadow = true; G.add(im);
    // the hole where Varn breaks out, with tilted slabs round it and dark water inside
    const hole = new THREE.CircleGeometry(3.4, 32); hole.rotateX(-Math.PI / 2); water(G, hole, { deep: 0x0E3346, shallow: 0x2B6E86 }).position.set(-1, 0.02, -6);
    const slab = new THREE.MeshPhysicalMaterial({ color: 0xCFEFFA, roughness: 0.15, transmission: 0.0, transparent: true, opacity: 0.85, emissive: 0x3A7E98, emissiveIntensity: 0.25 });
    for (let i = 0; i < 9; i++) { const a = i / 9 * 6.28 + rr(-0.2, 0.2); const g = new THREE.BoxGeometry(rr(1.6, 2.6), rr(0.25, 0.4), rr(1.2, 2)); const m = mesh(G, g, toon(0xE4F6FF, { emissive: 0x4E9AB8, emissiveIntensity: 0.2 }), -1 + Math.cos(a) * 3.9, 0.3, -6 + Math.sin(a) * 3.9, { ry: -a, rz: rr(0.25, 0.6) * (i % 2 ? 1 : -1), rx: rr(-0.2, 0.2) }); }
    // ice chunks lying about
    for (let i = 0; i < 18; i++) { const xx = rr(-12, 12), zz = rr(-14, 10); if (Math.hypot(xx + 1, zz + 6) < 5) continue; mesh(G, lumpy(rr(0.25, 0.7), 1, 0.25, 0.7), toon(0xE9F8FF, { emissive: 0x5AA8C8, emissiveIntensity: 0.18, flatShading: true }), xx, 0.15, zz, { ry: rnd() * 6 }); }
    // the boat stuck in the ice
    const boat = new THREE.Group(); boat.position.set(1.5, -0.35, 4); boat.rotation.y = 0.4; boat.rotation.z = 0.06; G.add(boat); mineCart(boat, 0, 0, 0, 0); flag(boat, 0, 0.9, 0, { h: 2.8 });
    // the hometown far off in the fog
    await scatter(G, 'ferris-wheel', [{ x: -26, z: -48, y: -0.5, ry: 0.4 }], { norm: 14, style: (n, mn, o) => [toon(0x8C98AC)] });
    await scatter(G, 'tower', [{ x: -14, z: -50, y: 0, ry: 0.2 }, { x: 12, z: -46, y: 0 }], { norm: 6, style: () => [toon(0x8C98AC)] });
    // low fog and falling snow
    const ct = cloudTex(); for (let i = 0; i < 22; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: ct, color: 0xE6EEF5, transparent: true, opacity: 0.4, depthWrite: false })); s.position.set(rr(-30, 30), rr(0.5, 2.5), rr(-40, 4)); s.scale.set(rr(10, 18), rr(3, 5), 1); G.add(s); const ph = rnd() * 6; onTick(t => { s.position.x += Math.sin(t * 0.2 + ph) * 0.004; }); }
    snow(G, 500);
    const glow = glowSprite(0x7FE9FF, 10, 0.4); glow.position.set(-1, 0.3, -6); G.add(glow); onTick(t => { glow.material.opacity = 0.3 + Math.sin(t * 1.3) * 0.12; });
    const kids = makeLabKids(G); [['leo', 1.0, 3.9], ['mia', 2.0, 4.3]].forEach(([n, xx, zz]) => { kids[n].g.position.set(xx, 0.25, zz); kids[n].g.rotation.y = Math.PI - 0.3; kids[n].pose('scared'); }); kids.toby.g.position.set(2.8, 0, 5.2); kids.toby.g.rotation.y = 3.4;
    return [['Cracked ice', [0, 3, 10], [0, 0, 2]], ['Broken ice and dark water', [3, 3, 1], [-1, 0, -6]], ['Ice chunks', [-4, 1.5, 4], [-6, 0.2, 0]], ['Boat stuck in the ice', [5, 2.5, 8], [1.5, 0.5, 4]], ['Town in the fog', [0, 3, 0], [-10, 5, -48]], ['Snow and fog', [0, 2, 12], [0, 2, 0]]];
  },
  props: [['Cracked ice', 'code', 'plates in teal and lavender with dark cracks, like the panels'], ['Broken slabs, dark water', 'code'], ['Ice chunks', 'code'], ['Ferris wheel in the fog', 'creativetrio (pmndrs market)'], ['Towers in the fog', 'Kenney (pmndrs market)'],
    ['Low fog, snow', 'code'], ['Boat stuck in the ice', 'code']] };

// ---------------------------------------------------------------- small helpers used by the sets
function clouds(G, n, y0, y1, z) { const ct = cloudTex(); for (let i = 0; i < n; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: ct, transparent: true, opacity: 0.85, depthWrite: false, fog: false })); s.position.set(rr(-70, 70), rr(y0, y1), z + rr(-20, 10)); s.scale.set(rr(16, 30), rr(8, 13), 1); G.add(s); const v = rr(0.2, 0.5); onTick((t, dt) => { s.position.x += v * (dt || 0.016); if (s.position.x > 80) s.position.x = -80; }); } }
function motes(G, n, a, b, col, size) { const g = new THREE.BufferGeometry(), p = new Float32Array(n * 3), ph = []; for (let i = 0; i < n; i++) { p.set([rr(a[0], b[0]), rr(a[1], b[1]), rr(a[2], b[2])], i * 3); ph.push(rnd() * 6); } g.setAttribute('position', new THREE.BufferAttribute(p, 3));
  const m = new THREE.PointsMaterial({ map: glowTex(), color: col, size: size * 4, transparent: true, opacity: 0.7, depthWrite: false, blending: THREE.AdditiveBlending }); G.add(new THREE.Points(g, m));
  onTick(t => { for (let i = 0; i < n; i++) { p[i * 3] += Math.cos(t * 0.3 + ph[i]) * 0.003; p[i * 3 + 1] += Math.sin(t * 0.5 + ph[i] * 2) * 0.003; } g.attributes.position.needsUpdate = true; }); }
function bubbles(G, n, a, b) { const g = new THREE.BufferGeometry(), p = new Float32Array(n * 3), v = []; for (let i = 0; i < n; i++) { p.set([rr(a[0], b[0]), rr(a[1], b[1]), rr(a[2], b[2])], i * 3); v.push(rr(0.3, 0.8)); } g.setAttribute('position', new THREE.BufferAttribute(p, 3));
  G.add(new THREE.Points(g, new THREE.PointsMaterial({ map: glowTex(), color: 0xE6FBFF, size: 0.25, transparent: true, opacity: 0.8, depthWrite: false })));
  onTick((t, dt) => { for (let i = 0; i < n; i++) { p[i * 3 + 1] += v[i] * (dt || 0.016); if (p[i * 3 + 1] > b[1]) p[i * 3 + 1] = a[1]; } g.attributes.position.needsUpdate = true; }); }
function snow(G, n) { const g = new THREE.BufferGeometry(), p = new Float32Array(n * 3); for (let i = 0; i < n; i++) p.set([rr(-20, 20), rr(0, 14), rr(-20, 16)], i * 3); g.setAttribute('position', new THREE.BufferAttribute(p, 3));
  G.add(new THREE.Points(g, new THREE.PointsMaterial({ map: glowTex(), color: 0xffffff, size: 0.22, transparent: true, opacity: 0.9, depthWrite: false })));
  onTick((t, dt) => { for (let i = 0; i < n; i++) { p[i * 3 + 1] -= 0.8 * (dt || 0.016); p[i * 3] += Math.sin(t + i) * 0.004; if (p[i * 3 + 1] < 0) p[i * 3 + 1] = 14; } g.attributes.position.needsUpdate = true; }); }
function ferris(G, x, y, z, sc = 1) { const FW = new THREE.Group(); FW.position.set(x, y, z); FW.rotation.y = 0.35; FW.scale.setScalar(sc); G.add(FW);
  const R = 15, hubY = R + 3.2, white = toon(0xF6F1E7), red = toon(0xE8575A), blue = toon(0x5B86D6), gold = toon(0xFFC857, { emissive: 0xFFB020, emissiveIntensity: 0.6 });
  const part = (g, m, x, y, z) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.castShadow = true; o.add(new THREE.Mesh(g, INK)); return o; };
  const beam = (a, b, r, m) => { const d = new THREE.Vector3().subVectors(b, a), o = part(new THREE.CylinderGeometry(r, r, d.length(), 10), m, 0, 0, 0); o.position.copy(a).addScaledVector(d, 0.5); o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize()); return o; };
  [-1.8, 1.8].forEach(zz => { FW.add(beam(new THREE.Vector3(-8, 0, zz * 1.6), new THREE.Vector3(0, hubY, zz), 0.5, red)); FW.add(beam(new THREE.Vector3(8, 0, zz * 1.6), new THREE.Vector3(0, hubY, zz), 0.5, red)); });
  const wheel = new THREE.Group(); wheel.position.y = hubY; FW.add(wheel);
  [-1.2, 1.2].forEach(zz => { wheel.add(part(new THREE.TorusGeometry(R, 0.35, 10, 72), white, 0, 0, zz), part(new THREE.TorusGeometry(R * 0.55, 0.22, 8, 48), blue, 0, 0, zz)); });
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; [-1.2, 1.2].forEach(zz => wheel.add(beam(new THREE.Vector3(0, 0, zz), new THREE.Vector3(Math.cos(a) * R, Math.sin(a) * R, zz), 0.14, white))); }
  const hub = part(new THREE.CylinderGeometry(1.5, 1.5, 3.6, 20), gold, 0, 0, 0); hub.rotation.x = Math.PI / 2; wheel.add(hub);
  const cars = [], cc = [0xFF7B7B, 0xFFC857, 0x7ED6A8, 0x6FB4F2, 0xB79CFF, 0xFF9FD0];
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2, g = new THREE.Group(); g.position.set(Math.cos(a) * R, Math.sin(a) * R, 0); g.add(part(new THREE.BoxGeometry(3, 2.2, 3.2), toon(cc[i % 6]), 0, -2.2, 0)); wheel.add(g); cars.push(g); }
  const bulbs = []; for (let i = 0; i < 48; i++) { const a = i / 48 * Math.PI * 2, s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: [0xFFE08A, 0xFF9FB5, 0x9FE8FF][i % 3], transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); s.position.set(Math.cos(a) * R, Math.sin(a) * R, 1.6); s.scale.setScalar(1.6); wheel.add(s); bulbs.push(s); }
  onTick(t => { wheel.rotation.z = -t * 0.12; cars.forEach(c => c.rotation.z = t * 0.12); bulbs.forEach((b, i) => b.material.opacity = 0.55 + Math.sin(t * 3 + i * 0.7) * 0.35); }); }

// ---------------------------------------------------------------- page: build a set, camera, side panel
let ctl = null, cur = null, building = false;
const ui = document.createElement('div'); ui.id = 'ui'; ui.innerHTML = '<div id="roster"></div><div id="side"><h2 id="nm"></h2><div id="stops"></div><p class="lead">Now in the game</p><div id="now"></div><p class="lead">Props in this set <small>(tap one to look at it)</small></p><div id="props"></div></div><div id="loading">Building…</div>';
document.body.append(ui); const $ = s => ui.querySelector(s);
const STOPNAMES = { 1: 'The Meadow', 2: 'The Glowing Stone', 3: 'The Dark Tunnel', 4: 'The Drop', 5: 'Crystal Loop', 6: 'The Swift River', 7: 'The Rock Shelf', 8: 'The Crack', 9: 'The Rainbow Cliff', 10: 'The Lost Island', 11: 'Toby’s Dig', 12: 'The Clear Sea', 13: 'Varn Rises', 14: 'Mia’s Choice', 15: 'The Angry Wave' };
let fly = null; const flyTo = (p, t) => { fly = { p0: camera.position.clone(), t0: ctl.target.clone(), p1: new THREE.Vector3(...p), t1: new THREE.Vector3(...t), k: 0 }; };
async function show(id) {
  if (building) return; building = true; $('#loading').style.display = 'block'; cur = id; const S = SETS[id]; seed = 7 + Object.keys(SETS).indexOf(id) * 31;
  [...$('#roster').children].forEach(b => b.classList.toggle('on', b.dataset.id === id));
  const G = newWorld(Object.assign({ ambient: 0xffffff }, S.light)); renderer.shadowMap.enabled = true;
  setCam(...S.cam); if (ctl) ctl.dispose(); ctl = new OrbitControls(camera, renderer.domElement); ctl.enableDamping = true; ctl.maxPolarAngle = Math.PI * 0.49; ctl.minDistance = 0.8; ctl.maxDistance = 90; ctl.target.set(...S.cam[1]); ctl.update();
  renderer.domElement.addEventListener('pointerdown', () => { fly = null; });
  onTick((t, dt) => { if (fly) { fly.k = Math.min(1, fly.k + (dt || 0.016) / 1.6); const e = fly.k * fly.k * (3 - 2 * fly.k); camera.position.lerpVectors(fly.p0, fly.p1, e); ctl.target.lerpVectors(fly.t0, fly.t1, e); if (fly.k >= 1) fly = null; } ctl.update(); });
  let views = [];
  try { views = await S.build(G) || []; } catch (e) { console.error('BUILDFAIL ' + id + ' ' + e.message + ' ' + (e.stack || '').split('\n')[1]); }
  $('#nm').textContent = S.name;
  $('#stops').innerHTML = S.stops.map(n => `<span>Stop ${n} · ${STOPNAMES[n]}</span>`).join('');
  $('#now').innerHTML = S.stops.map(n => `<img src="lab/stops/st${n}.jpg" alt="stop ${n} now" onerror="this.remove()">`).join('');
  const pr = $('#props'); pr.innerHTML = '';
  S.props.forEach(([name, src, note], i) => { const v = views.find(w => name.toLowerCase().startsWith(w[0].toLowerCase().split(' ')[0])) || null;
    const d = document.createElement('div'); d.className = 'prop' + (v ? ' go' : ''); d.innerHTML = `<b>${name}</b><i class="${/^code/.test(src) ? 'code' : 'pack'}">${src}</i>${note ? `<span>${note}</span>` : ''}`; if (v) d.onclick = () => flyTo(v[1], v[2]); pr.append(d); });
  const vb = $('#views') || Object.assign(document.createElement('div'), { id: 'views' }); ui.append(vb); vb.innerHTML = '';
  [['Overview', ...S.cam]].concat(views).forEach(([n, p, t]) => { const b = document.createElement('button'); b.textContent = n; b.onclick = () => flyTo(p, t); vb.append(b); });
  $('#loading').style.display = 'none'; building = false; window.__ready = id;
}
{ const r = $('#roster'); Object.entries(SETS).forEach(([id, S]) => { const b = document.createElement('button'); b.dataset.id = id; b.innerHTML = `${S.name}<small>Stops ${S.stops.join(', ')}</small>`; b.onclick = () => show(id); r.append(b); });
  const t = document.createElement('button'); t.className = 'hide'; t.textContent = 'Hide panels'; t.onclick = () => document.body.classList.toggle('clean'); r.append(t); }
show(new URLSearchParams(location.search).get('set') || 'meadow');
window.__lab = { load, show, flyTo, get ctl() { return ctl; }, cam: (p, t) => { camera.position.set(...p); ctl.target.set(...t); ctl.update(); }, SETS };
