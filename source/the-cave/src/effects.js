// Cinematic effects: soft fog, a fog wall that rolls in, ice that spreads across the sea, frost on the screen,
// glowing light, flying ice shards, drifting snow, letterbox bars.
import { THREE, onTick, tween, world, camera } from './gfx.js';

const cache = {};
// soft round glow (for magic light, eyes, mane wisps)
export function glowTex() {
  if (cache.glow) return cache.glow;
  const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
  const g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.25, 'rgba(255,255,255,.6)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 128, 128); const t = new THREE.CanvasTexture(c); return (cache.glow = t);
}
// soft cloudy puff (for fog and mist)
export function cloudTex() {
  if (cache.cloud) return cache.cloud;
  const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
  for (let i = 0; i < 40; i++) { const px = 64 + Math.random() * 128, py = 70 + Math.random() * 116, r = 24 + Math.random() * 56;
    const g = x.createRadialGradient(px, py, 0, px, py, r); g.addColorStop(0, 'rgba(255,255,255,.22)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 256, 256); }
  const m = x.createRadialGradient(128, 128, 60, 128, 128, 128); x.globalCompositeOperation = 'destination-in'; m.addColorStop(0, 'rgba(0,0,0,1)'); m.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = m; x.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c); return (cache.cloud = t);
}
export function glowSprite(color = 0x9FFFF4, size = 2, opacity = 1) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false }));
  s.scale.setScalar(size); return s;
}

// ---------------------------------------------------------------- fog that drifts, thickens and rolls in like a wall
export function mist(parent, { count = 40, center = new THREE.Vector3(), spread = 40, y = [0.5, 4], size = [10, 22], color = 0xE6ECF2, opacity = 0.55, drift = 0.4, inner = 0 } = {}) {
  const g = new THREE.Group(); parent.add(g); const puffs = [];
  for (let i = 0; i < count; i++) {
    const m = new THREE.SpriteMaterial({ map: cloudTex(), color, transparent: true, opacity: 0, depthWrite: false, fog: false });
    const s = new THREE.Sprite(m); const sz = size[0] + Math.random() * (size[1] - size[0]); s.scale.set(sz * 1.6, sz, 1);
    const a = Math.random() * Math.PI * 2, r = inner + Math.random() * (spread - inner);
    s.position.set(center.x + Math.cos(a) * r, y[0] + Math.random() * (y[1] - y[0]), center.z + Math.sin(a) * r);
    s.userData = { v: new THREE.Vector3((Math.random() - 0.5) * drift, 0, (Math.random() - 0.5) * drift), ph: Math.random() * 6, base: opacity * (0.6 + Math.random() * 0.4) };
    g.add(s); puffs.push(s);
  }
  const st = { k: 0, pull: null, pullK: 0 };
  onTick((t, dt) => puffs.forEach(s => {
    s.position.addScaledVector(s.userData.v, dt); s.material.rotation += dt * 0.02 * (s.userData.ph > 3 ? 1 : -1);
    if (st.pull) s.position.lerp(new THREE.Vector3(st.pull.x + (s.userData.ph - 3) * 4, s.position.y, st.pull.z + Math.cos(s.userData.ph) * 4), st.pullK * dt);
    s.material.opacity = s.userData.base * st.k * (0.85 + Math.sin(t * 0.5 + s.userData.ph) * 0.15);
  }));
  return {
    g, puffs,
    show: (k = 1, ms = 2000) => { const k0 = st.k; return tween(ms, e => { st.k = k0 + (k - k0) * e; }); },
    rollTo: (p, strength = 0.35) => { st.pull = p.clone(); st.pullK = strength; },
  };
}
// thicken the scene's own fog (hides far things, like the hometown)
export function fogThicken(scene, { near = 6, far = 26, color = null, ms = 3000 } = {}) {
  const f = scene.fog; if (!f) return Promise.resolve(); const n0 = f.near, f0 = f.far, c0 = f.color.clone(), c1 = color != null ? new THREE.Color(color) : c0;
  const bg = scene.background && scene.background.isColor ? scene.background.clone() : null;
  return tween(ms, e => { f.near = n0 + (near - n0) * e; f.far = f0 + (far - f0) * e; f.color.copy(c0).lerp(c1, e); if (bg) scene.background.copy(bg).lerp(c1, e); });
}

// ---------------------------------------------------------------- ice that spreads across the water from a point
function iceTex() {
  if (cache.ice) return cache.ice;
  const c = document.createElement('canvas'); c.width = c.height = 512; const x = c.getContext('2d');
  const g = x.createRadialGradient(256, 256, 0, 256, 256, 256); g.addColorStop(0, '#E8F7FF'); g.addColorStop(0.8, '#CDEBF7'); g.addColorStop(0.96, 'rgba(190,230,248,.85)'); g.addColorStop(1, 'rgba(190,230,248,0)');
  x.fillStyle = g; x.fillRect(0, 0, 512, 512);
  x.strokeStyle = 'rgba(110,150,180,.55)'; x.lineWidth = 1.6;
  for (let i = 0; i < 60; i++) { let px = 256, py = 256, a = Math.random() * Math.PI * 2; x.beginPath(); x.moveTo(px, py); for (let k = 0; k < 14; k++) { a += (Math.random() - 0.5) * 0.7; px += Math.cos(a) * 18; py += Math.sin(a) * 18; x.lineTo(px, py); } x.stroke(); }
  x.strokeStyle = 'rgba(255,255,255,.7)'; for (let i = 0; i < 40; i++) { const px = Math.random() * 512, py = Math.random() * 512; x.beginPath(); x.moveTo(px, py); x.lineTo(px + (Math.random() - 0.5) * 40, py + (Math.random() - 0.5) * 40); x.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return (cache.ice = t);
}
export function iceSpread(parent, at, { radius = 40, y = 0.08 } = {}) {
  const m = new THREE.Mesh(new THREE.CircleGeometry(1, 64), new THREE.MeshLambertMaterial({ map: iceTex(), transparent: true, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; m.position.set(at.x, y, at.z); m.scale.setScalar(0.001); parent.add(m);
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.96, 1.02, 64), new THREE.MeshBasicMaterial({ color: 0xBFF6FF, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }));
  ring.rotation.x = -Math.PI / 2; ring.position.set(at.x, y + 0.02, at.z); ring.scale.setScalar(0.001); parent.add(ring);
  const spikes = [];
  return {
    m, ring,
    grow: (ms = 3000, onRadius) => tween(ms, (e, k) => { const r = Math.max(0.001, radius * (1 - Math.pow(1 - k, 2.2))); m.scale.setScalar(r); ring.scale.setScalar(r); ring.material.opacity = 0.9 * (1 - k); onRadius && onRadius(r); }),
    spike: (p, h = 1.6) => { const s = new THREE.Mesh(new THREE.ConeGeometry(0.35, h, 5), new THREE.MeshToonMaterial({ color: 0xDDF6FF, emissive: 0x6FC8E8, emissiveIntensity: 0.25 })); s.position.set(p.x, y, p.z); s.scale.setScalar(0.001); parent.add(s); spikes.push(s); tween(400, e => { s.scale.setScalar(Math.max(0.001, e)); s.position.y = y + h / 2 * e; }); return s; },
  };
}

// ---------------------------------------------------------------- ice shards flying up (when the ice breaks)
export function shardBurst(parent, at, { n = 30, power = 9, color = 0xDDF4FF } = {}) {
  const mat = new THREE.MeshToonMaterial({ color, emissive: 0x7FD8F0, emissiveIntensity: 0.25 });
  for (let i = 0; i < n; i++) {
    const s = new THREE.Mesh(new THREE.BoxGeometry(0.4 + Math.random() * 1.2, 0.18, 0.3 + Math.random() * 0.9), mat); s.position.copy(at).add(new THREE.Vector3((Math.random() - 0.5) * 3, 0.2, (Math.random() - 0.5) * 3)); parent.add(s);
    const v = new THREE.Vector3((Math.random() - 0.5) * power, power * (0.6 + Math.random() * 0.8), (Math.random() - 0.5) * power); const spin = new THREE.Vector3(Math.random() * 6, Math.random() * 6, Math.random() * 6);
    const off = onTick((t, dt) => { v.y -= 16 * dt; s.position.addScaledVector(v, dt); s.rotation.x += spin.x * dt; s.rotation.y += spin.y * dt; if (s.position.y < 0.1 && v.y < 0) { s.position.y = 0.1; v.set(v.x * 0.3, 0, v.z * 0.3); spin.multiplyScalar(0.2); if (v.lengthSq() < 0.01) off(); } });
  }
}

// ---------------------------------------------------------------- drifting snow / ice glitter
export function snow(parent, { count = 400, area = 40, color = 0xFFFFFF, size = 0.12, fall = 0.6, center = new THREE.Vector3() } = {}) {
  const geo = new THREE.BufferGeometry(); const p = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) { p[i * 3] = center.x + (Math.random() - 0.5) * area; p[i * 3 + 1] = Math.random() * 14; p[i * 3 + 2] = center.z + (Math.random() - 0.5) * area; }
  geo.setAttribute('position', new THREE.BufferAttribute(p, 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color, size, map: glowTex(), transparent: true, depthWrite: false, opacity: 0 })); parent.add(pts);
  onTick((t, dt) => { for (let i = 0; i < count; i++) { p[i * 3 + 1] -= fall * dt * (0.5 + (i % 5) * 0.2); p[i * 3] += Math.sin(t + i) * dt * 0.2; if (p[i * 3 + 1] < 0) p[i * 3 + 1] = 14; } geo.attributes.position.needsUpdate = true; });
  return { pts, show: (o = 0.9, ms = 1500) => tween(ms, e => { pts.material.opacity = o * e; }) };
}

// ---------------------------------------------------------------- screen overlays: frost creeping in at the edges, letterbox bars
let frostEl = null;
export function frost(on, ms = 2500) {
  if (!frostEl) {
    const c = document.createElement('canvas'); c.width = c.height = 512; const x = c.getContext('2d');
    x.strokeStyle = 'rgba(255,255,255,.5)'; x.lineWidth = 1;
    const branch = (px, py, a, len, d) => { if (d > 4 || len < 4) return; const qx = px + Math.cos(a) * len, qy = py + Math.sin(a) * len; x.beginPath(); x.moveTo(px, py); x.lineTo(qx, qy); x.stroke(); branch(qx, qy, a + 0.6, len * 0.6, d + 1); branch(qx, qy, a - 0.6, len * 0.6, d + 1); branch(qx, qy, a, len * 0.7, d + 1); };
    for (let i = 0; i < 90; i++) { const edge = Math.floor(Math.random() * 4), u = Math.random() * 512; const [px, py, a] = edge === 0 ? [u, 0, Math.PI / 2] : edge === 1 ? [u, 512, -Math.PI / 2] : edge === 2 ? [0, u, 0] : [512, u, Math.PI]; branch(px, py, a + (Math.random() - 0.5), 12 + Math.random() * 16, 0); }
    const m = x.createRadialGradient(256, 256, 150, 256, 256, 300); m.addColorStop(0, 'rgba(0,0,0,0)'); m.addColorStop(1, 'rgba(0,0,0,1)'); x.globalCompositeOperation = 'destination-in'; x.fillStyle = m; x.fillRect(0, 0, 512, 512);
    frostEl = document.createElement('div'); frostEl.className = 'frost';
    frostEl.style.backgroundImage = `url(${c.toDataURL()}), radial-gradient(ellipse at center, rgba(255,255,255,0) 52%, rgba(214,238,250,.3) 85%, rgba(236,248,255,.6) 100%)`;
    document.body.append(frostEl);
  }
  frostEl.style.transition = `opacity ${ms}ms ease`; frostEl.style.opacity = Math.min(0.75, on === true ? 0.75 : (on || 0));
}
export function letterbox(on) { document.body.classList.toggle('cine', !!on); }
