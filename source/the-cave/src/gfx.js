// 3D engine: one renderer, one scene; each place builds into `world` and is swapped out.
import * as THREE from 'three';
export { THREE };
export const INK = 0x2E2A4F;
export let renderer, scene, camera, world;
const ticks = new Set();
export const onTick = f => { ticks.add(f); return () => ticks.delete(f); };
let lookAt = new THREE.Vector3();

// ---------------------------------------------------------------- materials
const grad = (() => { const t = new THREE.DataTexture(new Uint8Array([95, 95, 95, 255, 175, 175, 175, 255, 255, 255, 255, 255]), 3, 1, THREE.RGBAFormat);
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
    ball: (r, c, x, y, z, o = {}) => add(new THREE.SphereGeometry(r, o.seg || 14, 10), c, x, y, z, o),
    rock: (r, c, x, y, z, o = {}) => { const g = new THREE.DodecahedronGeometry(r, 0); return add(g, c, x, y, z, o); },
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
  scene = new THREE.Scene(); camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.05, 600);
  world = new THREE.Group(); scene.add(world);
  addEventListener('resize', () => { renderer.setSize(innerWidth, innerHeight); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); });
  const clock = new THREE.Clock();
  renderer.setAnimationLoop(() => { const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime; ticks.forEach(f => f(t, dt)); renderer.render(scene, camera); });
}
// Swap to a new place: clear the old world, set sky / fog / light.
export function newWorld({ sky = 0x9FD8F5, fog = null, ambient = 0xffffff, ambientI = 1.6, sun = 0xffffff, sunI = 1.6, sunPos = [8, 14, 6] } = {}) {
  ticks.clear(); ticks.add(camTick); lookOff.set(0, 0, 0); Object.assign(LK, { yaw: 0, pitch: 0, zoom: 1, ty: 0, tp: 0, tz: 1 }); document.body.classList.remove('cine'); const fr = document.querySelector('.frost'); if (fr) { fr.style.transition = 'none'; fr.style.opacity = 0; }
  if (camera.fov !== 50) { camera.fov = 50; camera.updateProjectionMatrix(); }
  scene.remove(world); world.traverse(o => { if (o.geometry && !o.userData.isOutline) o.geometry.dispose(); });
  world = new THREE.Group(); scene.add(world);
  scene.background = new THREE.Color(sky); scene.fog = fog ? new THREE.Fog(fog[0], fog[1], fog[2]) : null;
  world.add(new THREE.HemisphereLight(ambient, 0x404060, ambientI));
  const d = new THREE.DirectionalLight(sun, sunI); d.position.set(...sunPos); world.add(d);
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
