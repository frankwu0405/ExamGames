// 3D engine: one renderer, one scene; each place builds into `world` and is swapped out.
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
export { THREE };
export const INK = 0x2E2A4F;
let composer, bloom, sunLight = null; const sunDir = new THREE.Vector3(0.5, 1, 0.4);
// cast/receive shadows for everything solid in the world
window.__gfx = { get world() { return world; }, get sun() { return sunLight; } };
function shadeAll() { world && world.traverse(o => { if (!o.isMesh) return; if (o.userData.isOutline || o.material.transparent || o.material.isMeshBasicMaterial || o.material.blending === THREE.AdditiveBlending) { o.castShadow = false; o.receiveShadow = false; return; } o.castShadow = true; o.receiveShadow = !o.userData.noRecv; }); }
export let renderer, scene, camera, world;
const ticks = new Set();
export const onTick = f => { ticks.add(f); return () => ticks.delete(f); };
let lookAt = new THREE.Vector3();

// ---------------------------------------------------------------- materials
const grad = (() => { const t = new THREE.DataTexture(new Uint8Array([120, 120, 120, 255, 168, 168, 168, 255, 215, 215, 215, 255, 255, 255, 255, 255]), 4, 1, THREE.RGBAFormat);
  t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t; })();
const shared = {};
export function toon(color, opts = {}) { return new THREE.MeshToonMaterial(Object.assign({ color, gradientMap: grad }, opts)); }
const smat = c => shared[c] || (shared[c] = toon(c));
const INK_MAT = new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide });
export function outline(mesh, t = 0.04) {
  const g = mesh.geometry; g.computeBoundingBox();
  const s = new THREE.Vector3(), c = new THREE.Vector3(); g.boundingBox.getSize(s); g.boundingBox.getCenter(c);
  const o = new THREE.Mesh(g, INK_MAT); const k = v => v > 0.0001 ? (v + 2 * t) / v : 1;
  o.scale.set(k(s.x), k(s.y), k(s.z)); o.position.set(c.x * (1 - o.scale.x), c.y * (1 - o.scale.y), c.z * (1 - o.scale.z));
  o.userData.isOutline = true; mesh.add(o); return mesh;
}
// smooth, slightly lumpy rock (not faceted)
function lumpy(r) { let g = new THREE.IcosahedronGeometry(r, 2); g.deleteAttribute('normal'); g.deleteAttribute('uv'); g = mergeVertices(g); const p = g.attributes.position, v = new THREE.Vector3(), s = Math.random() * 9;
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const k = 1 + Math.sin(v.x / r * 2.3 + s) * Math.cos(v.y / r * 1.9 - s) * Math.sin(v.z / r * 2.1) * 0.16; p.setXYZ(i, v.x * k, v.y * k * 0.82, v.z * k); }
  g.computeVertexNormals(); return g; }
const vcMat = toon(0xffffff, { vertexColors: true });
export function builder(group) {
  const add = (geo, color, x, y, z, { rx = 0, ry = 0, rz = 0, line = 0.04, parent = group } = {}) => {
    const m = new THREE.Mesh(geo, typeof color === 'object' ? color : smat(color)); m.position.set(x, y, z); m.rotation.set(rx, ry, rz);
    if (line) outline(m, line); parent.add(m); return m;
  };
  return {
    add, group,
    box: (w, h, d, c, x, y, z, o) => add(new THREE.BoxGeometry(w, h, d), c, x, y, z, o),
    cyl: (rt, rb, h, c, x, y, z, o = {}) => add(new THREE.CylinderGeometry(rt, rb, h, o.seg || 14), c, x, y, z, o),
    cone: (r, h, c, x, y, z, o = {}) => add(new THREE.ConeGeometry(r, h, o.seg || 12), c, x, y, z, o),
    ball: (r, c, x, y, z, o = {}) => add(new THREE.SphereGeometry(r, o.seg || 14, o.seg ? Math.round(o.seg * 0.7) : 10), c, x, y, z, o),
    caps: (r, len, c, x, y, z, o = {}) => add(new THREE.CapsuleGeometry(r, len, 6, o.seg || 16), c, x, y, z, o),
    paint: (pts0, x, y, z, o = {}) => { let pts = pts0; if (o.fn) { pts = []; for (let k = 0; k < pts0.length; k++) { pts.push(pts0[k]); const a = pts0[k], b2 = pts0[k + 1]; if (b2 && (a[0] !== b2[0] || a[1] !== b2[1])) for (let q = 1; q < 16; q++) { const t = q / 16; pts.push([a[0] + (b2[0] - a[0]) * t, a[1] + (b2[1] - a[1]) * t, a[2]]); } } }
      const geo = new THREE.LatheGeometry(pts.map(p => new THREE.Vector2(p[0], p[1])), o.seg || 24); const n = pts.length, seg = (o.seg || 24) + 1, P = geo.attributes.position, col = new Float32Array(P.count * 3), c = new THREE.Color();
      for (let i = 0; i < seg; i++) for (let j = 0; j < n; j++) { const k = i * n + j; c.set(o.fn ? o.fn(P.getX(k), P.getY(k), P.getZ(k), pts[j][2]) : pts[j][2]); col.set([c.r, c.g, c.b], k * 3); }
      if (o.bend) for (let k = 0; k < P.count; k++) { const d = o.bend(P.getX(k), P.getY(k), P.getZ(k)); P.setXYZ(k, P.getX(k) + d[0], P.getY(k) + d[1], P.getZ(k) + d[2]); }
      geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); geo.computeVertexNormals(); return add(geo, vcMat, x, y, z, o); },
    // tapered curved tube (pigtails, tails); r(t) gives the radius along the curve
    tube: (pts, rf, c, o = {}) => { const cur = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p))), N = 28, geo = new THREE.TubeGeometry(cur, N, 1, 14, false), P = geo.attributes.position, ctr = new THREE.Vector3(), v = new THREE.Vector3();
      for (let i = 0; i <= N; i++) { cur.getPointAt(i / N, ctr); const r = rf(i / N); for (let j = 0; j <= 14; j++) { const k = i * 15 + j; v.fromBufferAttribute(P, k).sub(ctr).multiplyScalar(r).add(ctr); P.setXYZ(k, v.x, v.y, v.z); } }
      geo.computeVertexNormals(); const m = add(geo, c, 0, 0, 0, { line: 0 }); if (o.line !== 0) { const sh = new THREE.Mesh(geo, INK_MAT); const q = geo.clone(), Q = q.attributes.position, Nn = q.attributes.normal; for (let k = 0; k < Q.count; k++) Q.setXYZ(k, Q.getX(k) + Nn.getX(k) * (o.line || 0.018), Q.getY(k) + Nn.getY(k) * (o.line || 0.018), Q.getZ(k) + Nn.getZ(k) * (o.line || 0.018)); sh.geometry = q; sh.userData.isOutline = true; m.add(sh); } return m; },
    lathe: (pts, c, x, y, z, o = {}) => add(new THREE.LatheGeometry(pts.map(p => new THREE.Vector2(p[0], p[1])), o.seg || 28), c, x, y, z, o),
    rock: (r, c, x, y, z, o = {}) => add(lumpy(r), c, x, y, z, o),
    rbox: (w, h, d, c, x, y, z, o) => add(new RoundedBoxGeometry(w, h, d, 3, Math.min(w, h, d) * 0.3), c, x, y, z, o),
    torus: (r, t, c, x, y, z, o = {}) => add(new THREE.TorusGeometry(r, t, 8, o.seg || 24, o.arc || Math.PI * 2), c, x, y, z, o),
  };
}
// Words painted on a canvas (for signs and cave walls)
export function textTexture(text, { bg = null, fg = '#2E2A4F', w = 512, h = 160, font = '72px Chewy, sans-serif', glow = null } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d');
  if (bg) { x.fillStyle = bg; x.fillRect(0, 0, w, h); }
  x.font = font; x.textAlign = 'center'; x.textBaseline = 'middle';
  if (glow) { x.shadowColor = glow; x.shadowBlur = 24; }
  x.fillStyle = fg; x.fillText(text, w / 2, h / 2 + 4);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
export function textPlane(text, wUnits, opts = {}) {
  const tex = textTexture(text, opts); const hUnits = wUnits * (opts.h || 160) / (opts.w || 512);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(wUnits, hUnits), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
  return m;
}

// ---------------------------------------------------------------- setup
export function init(container) {
  renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.setSize(innerWidth, innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace; container.append(renderer.domElement); initLook(renderer.domElement);
  renderer.localClippingEnabled = true; renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = 0.9;
  scene = new THREE.Scene(); camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.05, 600);
  world = new THREE.Group(); scene.add(world);
  addEventListener('resize', () => { renderer.setSize(innerWidth, innerHeight); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); });
  const clock = new THREE.Clock();
  composer = new EffectComposer(renderer); composer.addPass(new RenderPass(scene, camera)); bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth / 2, innerHeight / 2), 0.32, 0.5, 0.88); composer.addPass(bloom); composer.addPass(new OutputPass());
  addEventListener('resize', () => composer.setSize(innerWidth, innerHeight));
  let frame = 0;
  renderer.setAnimationLoop(() => { const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime; ticks.forEach(f => f(t, dt));
    if (t - frame > 0.6) { frame = t; shadeAll(); }
    if (sunLight) { sunLight.position.copy(lookAt).addScaledVector(sunDir, 30); sunLight.target.position.copy(lookAt); sunLight.target.updateMatrixWorld(); }
    composer.render(); });
}
// Swap to a new place: clear the old world, set sky / fog / light.
export function newWorld({ sky = 0x9FD8F5, fog = null, ambient = 0xffffff, ambientI = 1.6, sun = 0xffffff, sunI = 1.6, sunPos = [8, 14, 6] } = {}) {
  ticks.clear(); ticks.add(camTick); lookOff.set(0, 0, 0); Object.assign(LK, { yaw: 0, pitch: 0, zoom: 1, ty: 0, tp: 0, tz: 1 }); document.body.classList.remove('cine'); const fr = document.querySelector('.frost'); if (fr) { fr.style.transition = 'none'; fr.style.opacity = 0; }
  if (camera.fov !== 50) { camera.fov = 50; camera.updateProjectionMatrix(); }
  scene.remove(world); world.traverse(o => { if (o.geometry && !o.userData.isOutline) o.geometry.dispose(); });
  world = new THREE.Group(); scene.add(world);
  scene.background = new THREE.Color(sky); scene.fog = fog ? new THREE.Fog(fog[0], fog[1], fog[2]) : null;
  world.add(new THREE.HemisphereLight(ambient, 0x6A6080, ambientI * 0.9));
  const d = new THREE.DirectionalLight(sun === 0xffffff ? 0xFFF1DC : sun, sunI * 1.0); d.position.set(...sunPos); world.add(d); world.add(d.target);
  // soft shadows that follow wherever the camera is looking
  d.castShadow = true; d.shadow.mapSize.set(2048, 2048); d.shadow.radius = 5; d.shadow.bias = -0.0006; d.shadow.normalBias = 0.02; Object.assign(d.shadow.camera, { left: -22, right: 22, top: 22, bottom: -22, near: 1, far: 80 }); d.shadow.camera.updateProjectionMatrix();
  sunLight = d; sunDir.set(...sunPos).normalize();
  // a soft sky: deeper at the top, paler near the horizon
  { const c = document.createElement('canvas'); c.width = 4; c.height = 256; const x = c.getContext('2d'); const col = new THREE.Color(sky), top = col.clone().multiplyScalar(0.88), bot = col.clone().lerp(new THREE.Color(0xffffff), 0.35);
    const g = x.createLinearGradient(0, 0, 0, 256); g.addColorStop(0, '#' + top.getHexString()); g.addColorStop(0.55, '#' + col.getHexString()); g.addColorStop(1, '#' + bot.getHexString()); x.fillStyle = g; x.fillRect(0, 0, 4, 256);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; scene.background = t; }
  return world;
}

// ---------------------------------------------------------------- camera moves
let camMove = null;
const ease = k => k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
export function setCam(pos, target) { camMove = null; lookOff.set(0, 0, 0); camera.position.set(...pos); lookAt.set(...target); camera.lookAt(lookAt); }
export function flyCam(pos, target, ms = 1400, { linear = false, fov = null } = {}) {
  return new Promise(res => {
    const p0 = camera.position.clone().sub(lookOff), l0 = lookAt.clone(), p1 = new THREE.Vector3(...pos), l1 = new THREE.Vector3(...target);
    camMove = { p0, l0, p1, l1, t0: performance.now(), ms, res, linear, f0: camera.fov, f1: fov };
  });
}
// cinematic helpers: a hard cut, a slow drift (does not block), a lens change
export function cut(pos, target, fov = 50) { follow = null; setCam(pos, target); camera.fov = fov; camera.updateProjectionMatrix(); }
export function dolly(pos, target, ms = 6000, fov = null) { follow = null; flyCam(pos, target, ms, { linear: true, fov }); }
export function lens(fov, ms = 800) { const f0 = camera.fov; return tween(ms, e => { camera.fov = f0 + (fov - f0) * e; camera.updateProjectionMatrix(); }); }
export const camLook = () => lookAt.clone();
let follow = null;   // () => [pos, target]  (camera tracks something every frame)
export const followCam = f => { follow = f; camMove = null; };
// ---- "look around": during story moments she can drag to swing the camera a little around the shot; it springs back.
const lookOff = new THREE.Vector3(); const LK = { yaw: 0, pitch: 0, zoom: 1, ty: 0, tp: 0, tz: 1, drag: false, x: 0, y: 0, pinch: 0, ok: false, used: false };
export const lookState = LK;
const lookAllowed = () => !!document.querySelector('.story:not(.hidden)') && !document.querySelector('.task:not(.hidden), .letter-layer, .card-reveal, .stretch, .binder, .after, .mode-pick, .spy, .veil, .sumup, .ep-done, .tbc, .stop-title');
export function initLook(el) {
  const pts = new Map();
  el.addEventListener('pointerdown', e => { if (!LK.ok) return; pts.set(e.pointerId, [e.clientX, e.clientY]); LK.drag = true; LK.x = e.clientX; LK.y = e.clientY; if (pts.size === 2) { const [a, b] = [...pts.values()]; LK.pinch = Math.hypot(a[0] - b[0], a[1] - b[1]); } });
  addEventListener('pointermove', e => { if (!LK.drag || !pts.has(e.pointerId)) return; pts.set(e.pointerId, [e.clientX, e.clientY]);
    if (pts.size === 2) { const [a, b] = [...pts.values()]; const d = Math.hypot(a[0] - b[0], a[1] - b[1]); if (LK.pinch) LK.tz = Math.max(0.7, Math.min(1.25, LK.tz * LK.pinch / d)); LK.pinch = d; return; }
    LK.ty = Math.max(-0.65, Math.min(0.65, LK.ty - (e.clientX - LK.x) * 0.006)); LK.tp = Math.max(-0.22, Math.min(0.3, LK.tp + (e.clientY - LK.y) * 0.004)); LK.x = e.clientX; LK.y = e.clientY; LK.used = true; });
  const up = e => { pts.delete(e.pointerId); if (!pts.size) { LK.drag = false; LK.pinch = 0; } };
  addEventListener('pointerup', up); addEventListener('pointercancel', up);
  el.addEventListener('wheel', e => { if (!LK.ok) return; LK.tz = Math.max(0.7, Math.min(1.25, LK.tz * (e.deltaY > 0 ? 1.06 : 0.94))); LK.used = true; }, { passive: true });
}
function applyLook() {
  LK.ok = lookAllowed();
  if (!LK.ok || !LK.drag) { const k = LK.ok ? 0.025 : 0.08; LK.ty -= LK.ty * k * 2; LK.tp -= LK.tp * k * 2; LK.tz += (1 - LK.tz) * k * 2; }
  const t = performance.now() / 1000, drift = LK.ok ? Math.sin(t * 0.25) * 0.035 : 0, driftP = LK.ok ? Math.sin(t * 0.19) * 0.015 : 0;
  LK.yaw += (LK.ty + drift - LK.yaw) * 0.12; LK.pitch += (LK.tp + driftP - LK.pitch) * 0.12; LK.zoom += (LK.tz - LK.zoom) * 0.12;
  if (Math.abs(LK.yaw) + Math.abs(LK.pitch) + Math.abs(LK.zoom - 1) < 1e-4) return;
  const d = camera.position.clone().sub(lookAt), len = d.length(); if (len < 1e-3) return;
  d.applyAxisAngle(new THREE.Vector3(0, 1, 0), LK.yaw);
  const side = new THREE.Vector3().crossVectors(d, new THREE.Vector3(0, 1, 0)).normalize(); const el0 = Math.asin(Math.max(-1, Math.min(1, d.y / len)));
  const el1 = Math.max(-1.2, Math.min(1.35, el0 + LK.pitch)); d.applyAxisAngle(side, el0 - el1); d.multiplyScalar(LK.zoom);
  const np = lookAt.clone().add(d); lookOff.copy(np).sub(camera.position); camera.position.copy(np); camera.lookAt(lookAt);
}
function camTick() {
  camera.position.sub(lookOff); lookOff.set(0, 0, 0);
  if (camMove) {
    const k = Math.min(1, (performance.now() - camMove.t0) / camMove.ms), e = camMove.linear ? (k * k * (3 - 2 * k) * 0.35 + k * 0.65) : ease(k);
    camera.position.lerpVectors(camMove.p0, camMove.p1, e); lookAt.lerpVectors(camMove.l0, camMove.l1, e); camera.lookAt(lookAt);
    if (camMove.f1) { camera.fov = camMove.f0 + (camMove.f1 - camMove.f0) * e; camera.updateProjectionMatrix(); }
    if (k >= 1) { const r = camMove.res; camMove = null; r(); }
  } else if (follow) { const [p, l] = follow(); camera.position.lerp(p, 0.12); lookAt.lerp(l, 0.15); camera.lookAt(lookAt); }
  applyLook();
}
export const stopFollow = () => { follow = null; };
export let shakeAmt = 0;
export function quake(secs = 1.5, amt = 0.15) {
  const t0 = performance.now(); const off = onTick(() => {
    const k = (performance.now() - t0) / 1000; if (k > secs) { off(); return; }
    const a = amt * (1 - k / secs); camera.position.x += (Math.random() - 0.5) * a; camera.position.y += (Math.random() - 0.5) * a;
  });
}

// ---------------------------------------------------------------- tweens
export function tween(ms, fn) {
  return new Promise(res => { const t0 = performance.now(); const off = onTick(() => { const k = Math.min(1, (performance.now() - t0) / ms); fn(ease(k), k); if (k >= 1) { off(); res(); } }); });
}
export function moveTo(obj, [x, y, z], ms = 1000, { face = true, hop = 0 } = {}) {
  const a = obj.position.clone(), b = new THREE.Vector3(x, y ?? a.y, z);
  if (face) obj.rotation.y = Math.atan2(b.x - a.x, b.z - a.z);
  return tween(ms, (e, k) => { obj.position.lerpVectors(a, b, e); if (hop) obj.position.y += Math.sin(k * Math.PI) * hop; });
}

// ---------------------------------------------------------------- picking
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
export function pickAt(clientX, clientY, objs) {
  ndc.set(clientX / innerWidth * 2 - 1, -(clientY / innerHeight) * 2 + 1); ray.setFromCamera(ndc, camera);
  const hit = ray.intersectObjects(objs, true)[0]; if (!hit) return null;
  let o = hit.object; while (o && !objs.includes(o)) o = o.parent; return { obj: o, point: hit.point };
}
export function rayFrom(clientX, clientY) { ndc.set(clientX / innerWidth * 2 - 1, -(clientY / innerHeight) * 2 + 1); ray.setFromCamera(ndc, camera); return ray; }
export function toScreen(v) { const p = v.clone().project(camera); return { x: (p.x + 1) / 2 * innerWidth, y: (1 - p.y) / 2 * innerHeight }; }

// ---------------------------------------------------------------- effects
export function sparkles(pos, color = 0xFFE58A, n = 26) {
  const g = new THREE.Group(); world.add(g); g.position.copy(pos);
  const mat = new THREE.MeshBasicMaterial({ color, transparent: true });
  const ps = Array.from({ length: n }, () => { const m = new THREE.Mesh(new THREE.OctahedronGeometry(0.06), mat); g.add(m);
    m.userData.v = new THREE.Vector3((Math.random() - 0.5) * 3, Math.random() * 3 + 1, (Math.random() - 0.5) * 3); return m; });
  tween(1100, (e, k) => { ps.forEach(m => { m.position.addScaledVector(m.userData.v, 0.016); m.userData.v.y -= 0.08; m.rotation.x += 0.2; }); mat.opacity = 1 - k; }).then(() => world.remove(g));
}
export function snapshot(w = 360, h = 240) {
  const src = renderer.domElement, c = document.createElement('canvas'); c.width = w; c.height = h;
  const r = Math.max(w / src.width, h / src.height), sw = w / r, sh = h / r;
  c.getContext('2d').drawImage(src, (src.width - sw) / 2, (src.height - sh) / 2, sw, sh, 0, 0, w, h);
  return c.toDataURL('image/jpeg', 0.78);
}
