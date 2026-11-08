// Shared props for every place: CC0 models (Kenney, Quaternius, pmndrs market) restyled to the toon look, plus code-built water, rock, crystals, carts, rails, lanterns, signs, flags.
import { THREE, onTick, toon, builder, outline, rockHook } from './gfx.js';
import { glowTex, cloudTex, glowSprite } from './effects.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
export let seed = 7; export const setSeed = v => { seed = v; }; export const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647; export const rr = (a, b) => a + (b - a) * rnd(); export const pick = a => a[Math.floor(rnd() * a.length)];
export const nz = (x, z, f) => Math.sin(x * f + 1.3) * Math.cos(z * f * 1.1 - 0.7) + Math.sin((x + z) * f * 0.6 + 2) * 0.5;
export const small = innerWidth < 800;

// ---------------------------------------------------------------- shared: ink, loading, toon restyle, instanced scatter
export const INK = new THREE.MeshBasicMaterial({ color: 0x2E2A4F, side: THREE.BackSide });
INK.onBeforeCompile = sh => { sh.vertexShader = sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n float sc = length(modelMatrix[0].xyz);\n#ifdef USE_INSTANCING\n sc *= length(instanceMatrix[0].xyz);\n#endif\n transformed += normalize(normal) * 0.035 / max(sc, 0.001);'); };
export const loader = new GLTFLoader(); loader.setMeshoptDecoder(MeshoptDecoder);
const raw = {}; export const load = n => raw[n] || (raw[n] = new Promise(res => loader.load(PROPS.base + n + '.glb', g => res(g.scene), undefined, () => { console.error('LOADFAIL ' + n); res(null); })));
export const PAL = { leaf: [0x5FBF5A, 0x7BCB5E, 0x4FAE6A, 0x8FD05C, 0x6BC48A], pine: [0x3E9A63, 0x4BA672, 0x35875A], autumn: [0xF2A33B, 0xE9693B, 0xF6C94C], stone: [0xA7AFC2, 0x9AA3B8, 0xB4B9C9, 0xA9A6B5],
  bloom: [0xFF8FB1, 0xFFD25E, 0xFFFFFF, 0xB79CFF, 0xFF7B7B], crys: [0x9FEFFF, 0x7FE9FF, 0xB9F6FF], rainbow: [0xFF7BA8, 0xFFC857, 0x7ED6A8, 0x6FB4F2, 0xB79CFF, 0x9FEFFF], sand: [0xE9D3A0] };
export const W = () => toon(0xffffff);
export const crysMat = (c = 0x9FEFFF) => toon(0xffffff, { emissive: c, emissiveIntensity: 0.85, transparent: true, opacity: 0.92 });
// which material each part of each model gets: [material, palette name or null]
export function partStyle(name, mn, orig) {
  if (/^(tree|bush)/.test(name)) { if (/wood|bark|trunk/i.test(mn)) return [toon(0x8A5A3A)]; return [W(), name.includes('autumn') ? 'autumn' : /pine|dark/.test(name) ? 'pine' : 'leaf']; }
  if (/^rock|crystal_rock/.test(name)) return mn === 'crystal' ? [crysMat(), 'crys'] : /grass/.test(mn) ? [toon(0x6DBB5E)] : [W(), 'stone'];
  if (name === 'crystal' || name === 'gem_pink') return [crysMat(), 'gem'];
  if (name === 'flower_red') return /grass/.test(mn) ? [toon(0x6DBB5E)] : [W(), 'bloom'];
  if (name === 'log' || name === 'stump') return /bark/i.test(mn) ? [toon(0x8A5A3A)] : [toon(0xF6EBD0)];
  const c = orig.color ? orig.color.clone() : new THREE.Color(0xffffff);
  if (orig.map) return [toon(0xffffff, { map: orig.map })];
  return [toon(c)];
}
// packed (quantized) models store positions as small integers; turn every attribute into plain floats before moving the points
export function toFloat(geo) { const g = new THREE.BufferGeometry(); if (geo.index) g.setIndex(geo.index.clone());
  for (const k in geo.attributes) { const a = geo.attributes[k], n = a.count, s = a.itemSize, f = new Float32Array(n * s); for (let i = 0; i < n; i++) for (let j = 0; j < s; j++) f[i * s + j] = a.getComponent ? a.getComponent(i, j) : [a.getX, a.getY, a.getZ, a.getW][j].call(a, i); g.setAttribute(k, new THREE.BufferAttribute(f, s)); }
  return g; }
// many copies of one model as instanced meshes, each with an ink-outline copy. items: {x,y,z,s,sy,rx,ry,rz,col}
export async function scatter(parent, name, items, { norm = 0, shadow = true, gy = () => 0, style = null } = {}) {
  const src = await load(name); if (!src || !items.length) return null; src.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(src), ctr = box.getCenter(new THREE.Vector3()), minY = box.min.y, bs = box.getSize(new THREE.Vector3()), F = norm ? norm / Math.max(bs.x, bs.y, bs.z) : 1, parts = []; src.traverse(m => { if (m.isMesh) parts.push(m); });
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), S = new THREE.Vector3(), cols = items.map(() => ({})), grp = new THREE.Group(); parent.add(grp);
  for (const m of parts) { const [mat, pal] = (style || partStyle)(name, m.material.name || '', m.material), g = toFloat(m.geometry).applyMatrix4(m.matrixWorld); g.translate(-ctr.x, 0, -ctr.z);   // some packs keep each model off at its old spot in the kit's layout
    const im = new THREE.InstancedMesh(g, mat, items.length), ink = new THREE.InstancedMesh(g, INK, items.length);
    items.forEach((it, i) => { const s = (it.s ?? 1) * F, sy = (it.sy ?? 1) * s; Q.setFromEuler(new THREE.Euler(it.rx ?? 0, it.ry ?? rnd() * 6.28, it.rz ?? 0));
      M.compose(V.set(it.x, (it.y ?? gy(it.x, it.z)) - minY * sy + (it.dy ?? 0), it.z), Q, S.set(s, sy, s)); im.setMatrixAt(i, M); ink.setMatrixAt(i, M);
      if (pal) { const P = pal === 'gem' ? (it.pal || PAL.crys) : PAL[pal]; cols[i][pal] ??= new THREE.Color(it.col ?? pick(P)); im.setColorAt(i, cols[i][pal]); } });
    im.castShadow = shadow; im.receiveShadow = true; im.frustumCulled = ink.frustumCulled = false; grp.add(im, ink); }
  return grp;
}
// a ground mesh with height and vertex colour functions
export function ground(parent, size, seg, hf, cf, mat = null) {
  const g = new THREE.PlaneGeometry(size, size, seg, seg); g.rotateX(-Math.PI / 2); const p = g.attributes.position, col = new Float32Array(p.count * 3), c = new THREE.Color();
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i); p.setY(i, hf(x, z)); cf(x, z, c); col.set([c.r, c.g, c.b], i * 3); }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.computeVertexNormals();
  const m = new THREE.Mesh(g, mat || toon(0xffffff, { vertexColors: true })); m.receiveShadow = true; parent.add(m); return m;
}
// swaying grass tufts (the meadow test's grass)
export function grass(parent, n, spot, hf, hsl = [0.25, 0.62, 0.52]) {
  const wind = { value: 0 }, pos = [], col = [], idx = []; let v = 0;
  for (let b = 0; b < 5; b++) { const a = b / 5 * Math.PI * 2 + rnd(), h = rr(0.2, 0.42), w = rr(0.025, 0.04), bend = rr(0.04, 0.12), ox = rr(-0.1, 0.1), oz = rr(-0.1, 0.1), cx = Math.cos(a), cz = Math.sin(a), sx = -cz, sz = cx;
    const P = (u, y, s) => pos.push(ox + cx * u + sx * s, y, oz + cz * u + sz * s);
    P(0, 0, -w); P(0, 0, w); P(bend * 0.35, h * 0.5, -w * 0.7); P(bend * 0.35, h * 0.5, w * 0.7); P(bend, h, 0); col.push(0.42, 0.55, 0.3, 0.42, 0.55, 0.3, 0.8, 0.9, 0.7, 0.8, 0.9, 0.7, 1.1, 1.15, 0.95);
    idx.push(v, v + 1, v + 3, v, v + 3, v + 2, v + 2, v + 3, v + 4); v += 5; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals();
  const mat = toon(0xffffff, { vertexColors: true, side: THREE.DoubleSide });
  mat.onBeforeCompile = sh => { sh.uniforms.uT = wind; sh.vertexShader = 'uniform float uT;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n float sw = sin(uT * 1.7 + instanceMatrix[3].x * 0.35 + instanceMatrix[3].z * 0.22); transformed.x += sw * 0.25 * position.y; transformed.z += cos(uT * 1.3 + instanceMatrix[3].x * 0.2) * 0.12 * position.y;'); };
  const m = new THREE.InstancedMesh(g, mat, n), d = new THREE.Object3D(), c = new THREE.Color(); let k = 0, tries = 0;
  while (k < n && tries++ < n * 20) { const s = spot(); if (!s) continue; const [x, z, hs = 1] = s; d.position.set(x, hf(x, z), z); d.rotation.set(0, rnd() * 6.28, 0); const patch = nz(x, z, 0.3), sc = (1 + patch * 0.3) * rr(0.7, 1.4); d.scale.set(sc, sc * rr(0.9, 1.4) * hs, sc); d.updateMatrix(); m.setMatrixAt(k, d.matrix);
    c.setHSL(hsl[0] + patch * 0.03 + rr(-0.012, 0.012), hsl[1], hsl[2] + patch * 0.05 + rr(-0.05, 0.06)); m.setColorAt(k, c); k++; }
  m.count = k; m.frustumCulled = false; m.receiveShadow = true; parent.add(m); onTick(t => { wind.value = t; }); return m;
}
// toon water: banded colour, drifting sparkles, foam where it meets the shore (foam(x,z) gives 0..1)
export function water(parent, geo, { deep = 0x2F8FC4, shallow = 0x6FD3E6, foamC = 0xFFFFFF, flow = [0, 0], opacity = 0.9, foamFn = '0.0', speed = 1, scale = 1, sparkle = 0.8 } = {}) {
  const u = { uT: { value: 0 }, uDeep: { value: new THREE.Color(deep) }, uShal: { value: new THREE.Color(shallow) }, uFoam: { value: new THREE.Color(foamC) }, uFlow: { value: new THREE.Vector2(...flow) }, uOp: { value: opacity } };
  const m = new THREE.ShaderMaterial({ uniforms: u, transparent: opacity < 1, depthWrite: opacity >= 1, side: THREE.DoubleSide,
    vertexShader: `uniform float uT; varying vec3 vW; void main(){ vec3 p = position; vec4 w = modelMatrix * vec4(p, 1.0); w.y += sin(w.x * 0.6 + uT * 1.4) * 0.05 + cos(w.z * 0.7 + uT * 1.1) * 0.05; vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `uniform float uT, uOp; uniform vec3 uDeep, uShal, uFoam; uniform vec2 uFlow; varying vec3 vW;
      float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y); }
      void main(){ vec2 p = (vW.xz - uFlow * uT * ${speed.toFixed(2)}) * ${scale.toFixed(2)};
        float a = n(p * 0.35 + uT * 0.05) * 0.6 + n(p * 0.9 - uT * 0.08) * 0.4;
        vec3 c = mix(uDeep, uShal, smoothstep(0.35, 0.75, a));
        float sp = smoothstep(0.82, 0.9, n(p * 2.2 + vec2(uT * 0.3, -uT * 0.2)) * n(p * 1.3 - uT * 0.1) * 1.6);
        float streak = length(uFlow) > 0.0 ? smoothstep(0.78, 0.86, n(vec2(dot(p, normalize(uFlow + 1e-4)) * 0.6, dot(p, vec2(-uFlow.y, uFlow.x)) * 3.0))) : 0.0;
        float fo = clamp(${foamFn}, 0.0, 1.0); fo = max(fo * step(0.35, n(p * 1.6 + uT * 0.4) + fo * 0.7), streak);
        c = mix(c, uFoam, max(sp * ${sparkle.toFixed(2)}, fo));
        gl_FragColor = vec4(c, uOp);
#include <colorspace_fragment>
      }` });
  const mesh = new THREE.Mesh(geo, m); parent.add(mesh); onTick(t => { u.uT.value = t; }); return mesh;
}
// rock with the ambientCG Rock020 colour map, projected from three sides (no seams), stepped in toon bands
let rockTex = null; export const PROPS = { base: 'props/' };
export function rockMat(tint = 0xffffff, scale = 0.18, { steep = false } = {}) {
  if (!rockTex) { rockTex = new THREE.TextureLoader().load(PROPS.base + 'tex/rock.jpg'); rockTex.wrapS = rockTex.wrapT = THREE.RepeatWrapping; rockTex.colorSpace = THREE.SRGBColorSpace; }
  const m = toon(tint, steep ? { vertexColors: true } : {}); m.onBeforeCompile = sh => { sh.uniforms.uRock = { value: rockTex };
    sh.vertexShader = 'varying vec3 vRW; varying vec3 vRN;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vec4 rw = modelMatrix * vec4(transformed, 1.0);\n#ifdef USE_INSTANCING\n rw = modelMatrix * instanceMatrix * vec4(transformed, 1.0);\n#endif\n vRW = rw.xyz; vRN = normalize(mat3(modelMatrix) * objectNormal);');
    sh.fragmentShader = 'uniform sampler2D uRock; varying vec3 vRW; varying vec3 vRN;\n' + sh.fragmentShader.replace(steep ? '#include <color_fragment>' : '#include <map_fragment>', (steep ? '#include <color_fragment>\n' : '') + `vec3 bw = pow(abs(vRN), vec3(4.0)); bw /= (bw.x + bw.y + bw.z);
      vec3 tc = texture2D(uRock, vRW.yz * ${scale.toFixed(3)}).rgb * bw.x + texture2D(uRock, vRW.xz * ${scale.toFixed(3)}).rgb * bw.y + texture2D(uRock, vRW.xy * ${scale.toFixed(3)}).rgb * bw.z;
      float lum = dot(tc, vec3(0.333)); vec3 rk = mix(vec3(0.62), vec3(1.25), smoothstep(0.15, 0.6, lum)) * mix(vec3(1.0), tc / max(lum, 0.05), 0.35);
      ${steep ? 'float st = 1.0 - smoothstep(0.7, 0.88, vRN.y); diffuseColor.rgb = mix(diffuseColor.rgb * mix(vec3(1.0), rk, 0.25), vec3(0.62, 0.58, 0.54) * rk, st);' : 'diffuseColor.rgb *= rk;'}`); };
  m.customProgramCacheKey = function () { return this.onBeforeCompile.toString() + scale + steep; };   // (three caches shaders by the hook's source text, so say what differs)
  return m;
}
export function lumpy(r, d = 3, amp = 0.22, sq = 0.85) { let g = new THREE.IcosahedronGeometry(r, d); const p = g.attributes.position, v = new THREE.Vector3(), s = rnd() * 9;
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const k = 1 + (Math.sin(v.x / r * 2.3 + s) * Math.cos(v.y / r * 1.9 - s) * Math.sin(v.z / r * 2.1) + 0.4 * Math.sin(v.x / r * 6 + s * 2) * Math.cos(v.z / r * 5)) * amp; p.setXYZ(i, v.x * k, v.y * k * sq, v.z * k); }
  g = g.toNonIndexed(); g.computeVertexNormals(); return g; }
export const mesh = (parent, geo, mat, x, y, z, o = {}) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.set(o.rx || 0, o.ry || 0, o.rz || 0); if (o.s) m.scale.setScalar(o.s); if (o.sc) m.scale.set(...o.sc); m.castShadow = o.shadow !== false; m.receiveShadow = true; if (o.ink !== false) { const k = new THREE.Mesh(geo, INK); m.add(k); } parent.add(m); return m; };
export const textTex = (txt, { w = 512, h = 160, bg = '#C8A06A', fg = '#3A2414', font = '700 86px Chewy, sans-serif' } = {}) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.fillStyle = bg; x.fillRect(0, 0, w, h);
  for (let i = 0; i < 9; i++) { x.strokeStyle = `rgba(80,50,20,${0.12 + rnd() * 0.12})`; x.lineWidth = 3; x.beginPath(); x.moveTo(0, h * (i + rnd()) / 9); x.bezierCurveTo(w * 0.3, h * rnd(), w * 0.7, h * rnd(), w, h * (i + rnd()) / 9); x.stroke(); }
  x.fillStyle = fg; x.font = font; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(txt, w / 2, h / 2 + 4); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; };

// ---------------------------------------------------------------- code-built props (shared between sets)
export const WOOD = 0x8B5E3C, WOOD2 = 0x6E4529, IRON = 0x4A4F5C;
export function mineCart(parent, x, y, z, ry = 0, { tipped = 0 } = {}) {
  const g = new THREE.Group(); g.position.set(x, y + (tipped ? 0.55 : 0), z); g.rotation.set(0, ry, 0); g.rotateX(tipped); parent.add(g); const b = builder(g);
  for (let i = 0; i < 4; i++) b.rbox(1.9, 0.26, 0.08, i % 2 ? WOOD : WOOD2, 0, 0.55 + i * 0.27, 0.62, { line: 0.02 }), b.rbox(1.9, 0.26, 0.08, i % 2 ? WOOD2 : WOOD, 0, 0.55 + i * 0.27, -0.62, { line: 0.02 });
  for (let i = 0; i < 4; i++) b.rbox(0.08, 0.26, 1.24, i % 2 ? WOOD : WOOD2, 0.95, 0.55 + i * 0.27, 0, { line: 0.02 }), b.rbox(0.08, 0.26, 1.24, i % 2 ? WOOD2 : WOOD, -0.95, 0.55 + i * 0.27, 0, { line: 0.02 });
  b.rbox(1.9, 0.08, 1.24, WOOD2, 0, 0.44, 0, { line: 0.02 });
  [-0.55, 0.55].forEach(xx => [-0.66, 0.66].forEach(zz => b.box(0.1, 1.15, 0.05, IRON, xx, 0.95, zz, { line: 0.01 })));
  [0.5, 1.38].forEach(yy => [-0.66, 0.66].forEach(zz => b.box(2.0, 0.07, 0.05, IRON, 0, yy, zz, { line: 0.01 })));
  [-0.6, 0.6].forEach(xx => [-0.6, 0.6].forEach(zz => { const w = b.cyl(0.3, 0.3, 0.12, 0x3A3D47, xx, 0.3, zz * 1.12, { rx: Math.PI / 2, line: 0.015, seg: 18 }); b.cyl(0.1, 0.1, 0.14, 0xB8862F, xx, 0.3, zz * 1.13, { rx: Math.PI / 2, line: 0, seg: 10 }); }));
  return g;
}
export function rails(parent, curve, n = 60, { y = 0, gauge = 1.1 } = {}) {
  const pts = curve.getSpacedPoints(n), b = builder(parent), up = new THREE.Vector3(0, 1, 0), railM = toon(0x8D93A3, { emissive: 0x111111 });
  for (let i = 0; i < n; i++) { const p = pts[i], t = curve.getTangentAt(i / n), side = new THREE.Vector3().crossVectors(t, up).normalize();
    const tie = b.rbox(gauge + 0.7, 0.12, 0.32, i % 3 ? WOOD : WOOD2, p.x, y + p.y + 0.06, p.z, { line: 0.012 }); tie.rotation.y = Math.atan2(t.x, t.z) + Math.PI / 2; tie.rotation.z = rr(-0.04, 0.04); }
  [-1, 1].forEach(sd => { const path = new THREE.CatmullRomCurve3(pts.map((p, i) => { const t = curve.getTangentAt(Math.min(1, i / n)), side = new THREE.Vector3().crossVectors(t, up).normalize(); return p.clone().addScaledVector(side, sd * gauge / 2).setY(y + p.y + 0.2); }));
    const m = new THREE.Mesh(new THREE.TubeGeometry(path, n * 2, 0.06, 6), railM); m.castShadow = true; parent.add(m); });
}
export function lantern(parent, x, y, z, { c = 0xFFB65C, light = true } = {}) {
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
export function sign(parent, txt, x, y, z, ry = 0, { post = true, w = 2.2 } = {}) {
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; parent.add(g); const b = builder(g);
  if (post) b.rbox(0.16, 1.6, 0.16, WOOD2, 0, 0.8, -0.02, { line: 0.015 });
  const board = b.rbox(w, 0.62, 0.1, WOOD, 0, post ? 1.5 : 0, 0, { line: 0.02 }); const face = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.94, 0.56), new THREE.MeshBasicMaterial({ map: textTex(txt), toneMapped: true })); face.position.set(0, post ? 1.5 : 0, 0.056); g.add(face);
  [-1, 1].forEach(sd => b.ball(0.035, IRON, sd * (w / 2 - 0.12), post ? 1.5 : 0, 0.06, { line: 0 }));
  g.rotation.z = rr(-0.05, 0.05); return g;
}
export function crystalCluster(parent, x, y, z, { n = 7, size = 1, cols = PAL.crys, light = true, lc = null } = {}) {
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
export function flag(parent, x, y, z, { h = 3.4, ry = 0 } = {}) {
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
export function pawPrints(parent, from, to, n, gy) { const m = toon(0x6E5A3E); const d = to.clone().sub(from); const ang = Math.atan2(d.x, d.z), side = new THREE.Vector3(Math.cos(ang), 0, -Math.sin(ang));
  for (let i = 0; i < n; i++) { const p = from.clone().lerp(to, i / (n - 1)).addScaledVector(side, (i % 2 ? 0.16 : -0.16)); const g = new THREE.Group(); g.position.set(p.x, gy(p.x, p.z) + 0.03, p.z); g.rotation.y = ang; parent.add(g);
    const pad = new THREE.Mesh(new THREE.CircleGeometry(0.1, 12), m); pad.rotation.x = -Math.PI / 2; pad.scale.set(1, 1.15, 1); g.add(pad);
    [-0.09, -0.03, 0.03, 0.09].forEach((xx, k) => { const toe = new THREE.Mesh(new THREE.CircleGeometry(0.035, 8), m); toe.rotation.x = -Math.PI / 2; toe.position.set(xx, 0, 0.13 + (k % 3 ? 0.03 : 0)); g.add(toe); }); } }
export function shell(parent, x, y, z, col) { const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = rnd() * 6.28; parent.add(g); const shape = new THREE.Shape(); shape.moveTo(0, 0); for (let i = 0; i <= 10; i++) { const a = Math.PI * (0.15 + 0.7 * i / 10), r = 0.22 * (0.85 + (i % 2) * 0.15); shape.lineTo(Math.cos(a) * r, Math.sin(a) * r); } shape.lineTo(0, 0);
  const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.05, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.03, bevelSegments: 2 }); const m = mesh(g, geo, toon(col), 0, 0.04, 0, { rx: -Math.PI / 2 + 0.25 }); return g; }
export function starfish(parent, x, y, z, col = 0xFF8A5C) { const s = new THREE.Shape(); for (let i = 0; i <= 10; i++) { const a = i / 10 * Math.PI * 2 + Math.PI / 2, r = i % 2 ? 0.1 : 0.3; i ? s.lineTo(Math.cos(a) * r, Math.sin(a) * r) : s.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
  const geo = new THREE.ExtrudeGeometry(s, { depth: 0.04, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 3 }); return mesh(parent, geo, toon(col), x, y + 0.05, z, { rx: -Math.PI / 2, rz: rnd() * 6 }); }


// ---------------------------------------------------------------- small helpers used by the sets
export function clouds(G, n, y0, y1, z) { const ct = cloudTex(); for (let i = 0; i < n; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: ct, transparent: true, opacity: 0.85, depthWrite: false, fog: false })); s.position.set(rr(-70, 70), rr(y0, y1), z + rr(-20, 10)); s.scale.set(rr(16, 30), rr(8, 13), 1); G.add(s); const v = rr(0.2, 0.5); onTick((t, dt) => { s.position.x += v * (dt || 0.016); if (s.position.x > 80) s.position.x = -80; }); } }
export function motes(G, n, a, b, col, size) { const g = new THREE.BufferGeometry(), p = new Float32Array(n * 3), ph = []; for (let i = 0; i < n; i++) { p.set([rr(a[0], b[0]), rr(a[1], b[1]), rr(a[2], b[2])], i * 3); ph.push(rnd() * 6); } g.setAttribute('position', new THREE.BufferAttribute(p, 3));
  const m = new THREE.PointsMaterial({ map: glowTex(), color: col, size: size * 4, transparent: true, opacity: 0.7, depthWrite: false, blending: THREE.AdditiveBlending }); G.add(new THREE.Points(g, m));
  onTick(t => { for (let i = 0; i < n; i++) { p[i * 3] += Math.cos(t * 0.3 + ph[i]) * 0.003; p[i * 3 + 1] += Math.sin(t * 0.5 + ph[i] * 2) * 0.003; } g.attributes.position.needsUpdate = true; }); }
export function bubbles(G, n, a, b) { const g = new THREE.BufferGeometry(), p = new Float32Array(n * 3), v = []; for (let i = 0; i < n; i++) { p.set([rr(a[0], b[0]), rr(a[1], b[1]), rr(a[2], b[2])], i * 3); v.push(rr(0.3, 0.8)); } g.setAttribute('position', new THREE.BufferAttribute(p, 3));
  G.add(new THREE.Points(g, new THREE.PointsMaterial({ map: glowTex(), color: 0xE6FBFF, size: 0.25, transparent: true, opacity: 0.8, depthWrite: false })));
  onTick((t, dt) => { for (let i = 0; i < n; i++) { p[i * 3 + 1] += v[i] * (dt || 0.016); if (p[i * 3 + 1] > b[1]) p[i * 3 + 1] = a[1]; } g.attributes.position.needsUpdate = true; }); }
export function snow(G, n) { const g = new THREE.BufferGeometry(), p = new Float32Array(n * 3); for (let i = 0; i < n; i++) p.set([rr(-20, 20), rr(0, 14), rr(-20, 16)], i * 3); g.setAttribute('position', new THREE.BufferAttribute(p, 3));
  G.add(new THREE.Points(g, new THREE.PointsMaterial({ map: glowTex(), color: 0xffffff, size: 0.22, transparent: true, opacity: 0.9, depthWrite: false })));
  onTick((t, dt) => { for (let i = 0; i < n; i++) { p[i * 3 + 1] -= 0.8 * (dt || 0.016); p[i * 3] += Math.sin(t + i) * 0.004; if (p[i * 3 + 1] < 0) p[i * 3 + 1] = 14; } g.attributes.position.needsUpdate = true; }); }
export function ferris(G, x, y, z, sc = 1, ry = 0.35) { const FW = new THREE.Group(); FW.position.set(x, y, z); FW.rotation.y = ry; FW.scale.setScalar(sc); G.add(FW);
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
  onTick(t => { wheel.rotation.z = -t * 0.12; cars.forEach(c => c.rotation.z = t * 0.12); bulbs.forEach((b, i) => b.material.opacity = 0.55 + Math.sin(t * 3 + i * 0.7) * 0.35); }); return FW; }

// start loading every model early so places can build without waiting
export const PRELOAD = ['tree_oak', 'tree_fat', 'tree_pine', 'tree_pine_tall', 'tree_autumn', 'tree_dark', 'bush', 'bush_large', 'flower_red', 'mushroom_red', 'log', 'stump', 'rock_small', 'rock_large', 'rock_tall', 'crystal', 'crab', 'fish', 'palm-detailed-long', 'palm-detailed-short', 'formation-rock', 'formation-large-stone', 'plant-pirate-kit', 'barrel', 'chest', 'shovel', 'ship-wreck', 'boat-small', 'ferris-wheel', 'tower'];
export const preload = () => PRELOAD.forEach(n => load(n));

// ---------------------------------------------------------------- tunnels: real holes in rock walls, and rock tubes that follow a track
// cutHoles: a rockMat with see-through openings. Each hole: { p: centre (floor level), d: direction the tunnel runs, r: radius }.
export function cutHoles(mat, holes) {
  const o = mat.onBeforeCompile; const f3 = v => `vec3(${v.x.toFixed(3)}, ${v.y.toFixed(3)}, ${v.z.toFixed(3)})`;
  const code = holes.map(({ p, d, r, depth = 4 }) => { const D = d.clone().normalize(); return `{ vec3 hd = vRW - ${f3(p)}; float al = dot(hd, ${f3(D)}); vec3 pp = hd - al * ${f3(D)}; if (abs(al) < ${depth.toFixed(1)} && pp.y > -0.3 && length(vec2(length(pp.xz), pp.y - ${(r * 0.35).toFixed(2)})) < ${r.toFixed(2)}) discard; }`; }).join('\n');
  mat.onBeforeCompile = sh => { o(sh); sh.fragmentShader = sh.fragmentShader.replace('void main() {', 'void main() {\n' + code); };
  const k0 = mat.customProgramCacheKey.bind(mat); mat.customProgramCacheKey = () => k0() + code;
  return mat;
}
// rockTube: a lumpy rock tunnel around part of a track curve (s0..s1), with a flat floor just under the track.
export function rockTube(parent, curve, { s0 = 0, s1 = 1, r = 2.6, lift = 1.3, tint = 0x8A8678, scale = 0.32, seg = 160, radial = 18, side = THREE.BackSide, lump = 0.24, floor = 0.12 } = {}) {
  const pts = []; for (let i = 0; i <= 60; i++) pts.push(curve.getPointAt(s0 + (s1 - s0) * i / 60).clone().add(new THREE.Vector3(0, lift, 0)));
  const sub = new THREE.CatmullRomCurve3(pts), tg = new THREE.TubeGeometry(sub, seg, r, radial), p = tg.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i <= seg; i++) { const c = sub.getPointAt(i / seg); for (let j = 0; j <= radial; j++) { const k = i * (radial + 1) + j; v.fromBufferAttribute(p, k); const n = nz(v.x * 1.3, v.z * 0.7 + v.y, 0.5) * lump + nz(v.y * 2, v.z, 0.9) * lump * 0.4;
    const dx = v.clone().sub(c); v.addScaledVector(dx.normalize(), n); v.y = Math.max(v.y, c.y - lift - floor); p.setXYZ(k, v.x, v.y, v.z); } }
  tg.computeVertexNormals(); const m = rockMat(tint, scale); m.side = side; const tube = new THREE.Mesh(tg, m); tube.receiveShadow = true; parent.add(tube); return tube;
}
// timber frame (two posts and a beam) standing across a track at point p facing along t
export function timber(parent, p, t, { w = 4.4, h = 3.2 } = {}) { const g = new THREE.Group(); g.position.copy(p); g.lookAt(p.clone().add(new THREE.Vector3(t.x, 0, t.z))); parent.add(g); const b = builder(g);
  [-1, 1].forEach(sd => b.rbox(0.28, h, 0.28, WOOD2, sd * w / 2, h / 2, 0, { line: 0.02 })); b.rbox(w + 0.5, 0.32, 0.34, WOOD, 0, h, 0, { line: 0.02 }); return g; }

// every old-style b.rock(...) now gets the textured rock (one material per colour)
const _rk = new Map(); rockHook.mat = c => { if (!_rk.has(c)) _rk.set(c, rockMat(new THREE.Color(c).multiplyScalar(1.15).getHex(), 0.4)); return _rk.get(c); };
// a rock-textured material for the inside of caves and tunnels
export const rockInside = (c, scale = 0.2) => { const m = rockMat(c, scale); m.side = THREE.BackSide; return m; };
