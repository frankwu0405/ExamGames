// Varn showcase: a free-orbit stage for the sculpted model, with designed swimming / hovering / looping motions.
import { THREE, init, newWorld, onTick, setCam, renderer, scene, camera } from './gfx.js';
import { makeVarn, SHOW } from './varn.js';
import { glowTex, cloudTex } from './effects.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

init(document.body);
const world = newWorld({ sky: 0x0B2A3F, ambient: 0xBFE8FF, ambientI: 1.2, sun: 0xCFE9FF, sunI: 1.2, sunPos: [10, 24, 8] });
renderer.shadowMap.enabled = false;
setCam([0, 6, 38], [0, 0, 0]);
const V = makeVarn(world);
V.state.sway = 0.25; V.state.waterY = -999;
V.set('show');

const gradTex = (top, mid, bot) => { const c = document.createElement('canvas'); c.width = 4; c.height = 256; const x = c.getContext('2d'); const g = x.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, top); g.addColorStop(0.5, mid); g.addColorStop(1, bot); x.fillStyle = g; x.fillRect(0, 0, 4, 256); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; };

// ---- soft floating lights, always present, drifting slowly
const MOTES = 420, mg = new THREE.BufferGeometry(), mp = new Float32Array(MOTES * 3), mv = [];
for (let i = 0; i < MOTES; i++) { mp[i * 3] = (Math.random() - 0.5) * 120; mp[i * 3 + 1] = (Math.random() - 0.5) * 60; mp[i * 3 + 2] = (Math.random() - 0.5) * 120; mv.push(Math.random() * 6.28); }
mg.setAttribute('position', new THREE.BufferAttribute(mp, 3));
const moteM = new THREE.PointsMaterial({ map: glowTex(), size: 1.1, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending, color: 0x9FEFFF, sizeAttenuation: true });
const motes = new THREE.Points(mg, moteM); motes.frustumCulled = false; world.add(motes);

// ---- clouds for the sky stage
const clouds = new THREE.Group(); world.add(clouds); { const ct = cloudTex();
  for (let i = 0; i < 26; i++) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: ct, color: 0xFFFFFF, transparent: true, opacity: 0.55 + Math.random() * 0.3, depthWrite: false, fog: false }));
    const a = Math.random() * 6.28, r = 40 + Math.random() * 60; sp.position.set(Math.cos(a) * r, -22 + Math.random() * 10 + (i % 4) * 6, Math.sin(a) * r); sp.scale.setScalar(30 + Math.random() * 30); clouds.add(sp); } }

// ---- a faint stone-blue floor ring for the deep stage
const floor = new THREE.Group(); world.add(floor); {
  const rg = new THREE.Mesh(new THREE.RingGeometry(26, 30, 80), new THREE.MeshBasicMaterial({ color: 0x4FD8FF, transparent: true, opacity: 0.25, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
  rg.rotation.x = -Math.PI / 2; rg.position.y = -16; floor.add(rg);
  const rg2 = rg.clone(); rg2.geometry = new THREE.RingGeometry(14, 14.4, 80); rg2.position.y = -16; floor.add(rg2);
  const disc = new THREE.Mesh(new THREE.CircleGeometry(60, 64), new THREE.MeshBasicMaterial({ map: glowTex(), color: 0x2B8FB8, transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending }));
  disc.rotation.x = -Math.PI / 2; disc.position.y = -16.1; floor.add(disc); }

// ---- aurora curtains
const aurora = new THREE.Group(); world.add(aurora); const curtains = [];
{ const w = 48, h = 64, d = new Uint8Array(w * h * 4); for (let y = 0; y < h; y++) { const k = y / (h - 1), a = Math.pow(Math.sin(Math.PI * Math.min(1, k * 1.05)), 1.4) * (0.2 + 0.8 * (1 - k));
    const c = new THREE.Color().setHSL(0.42 + (1 - k) * 0.3, 0.9, 0.55); for (let x = 0; x < w; x++) { const o = (y * w + x) * 4; d[o] = 255 * c.r; d[o + 1] = 255 * c.g; d[o + 2] = 255 * c.b; d[o + 3] = 255 * a * 0.7 * Math.pow(Math.sin(Math.PI * (x + 0.5) / w), 1.3); } }
  const tex = new THREE.DataTexture(d, w, h, THREE.RGBAFormat); tex.needsUpdate = true; tex.colorSpace = THREE.SRGBColorSpace; tex.magFilter = tex.minFilter = THREE.LinearFilter;
  for (let i = 0; i < 5; i++) { const g = new THREE.PlaneGeometry(130, 40, 64, 1), m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, fog: false }));
    const a = i * 1.257 + 0.4, r = 75; m.position.set(Math.cos(a) * r, 8 + i * 3, Math.sin(a) * r); m.rotation.y = -a + Math.PI / 2; m.userData = { ph: i * 1.7, base: g.attributes.position.array.slice() }; aurora.add(m); curtains.push(m); } }
onTick(t => { curtains.forEach(m => { if (!aurora.visible) return; const p = m.geometry.attributes.position, b = m.userData.base; for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(b[i * 3] * 0.09 + t * 0.5 + m.userData.ph) * 4 + Math.sin(b[i * 3] * 0.21 - t * 0.8) * 1.2); p.needsUpdate = true; m.material.opacity = 0.8 + Math.sin(t * 0.4 + m.userData.ph) * 0.2; }); });

// ---- bubbles of light shed by his body as he swims
const SH = 90, shed = Array.from({ length: SH }, () => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: 0xAEF6FF, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })); sp.userData = { life: Math.random(), v: new THREE.Vector3(), s: 0.2 + Math.random() * 0.35 }; world.add(sp); return sp; });
const tmp = new THREE.Vector3();
onTick((t, dt) => { shed.forEach(sp => { const u = sp.userData; u.life += dt * 0.35; if (u.life >= 1) { u.life = 0; V.at(0.1 + Math.random() * 0.75).clone(); sp.position.copy(V.at(0.1 + Math.random() * 0.75)); u.v.set((Math.random() - 0.5) * 0.6, 0.3 + Math.random() * 0.8, (Math.random() - 0.5) * 0.6); }
  sp.position.addScaledVector(u.v, dt); sp.material.opacity = Math.sin(u.life * Math.PI) * 0.8; sp.scale.setScalar(u.s * (1.4 - u.life * 0.6) * 1.8); }); });
onTick((t, dt) => { const p = mg.attributes.position; for (let i = 0; i < MOTES; i++) { p.setY(i, p.getY(i) + Math.sin(t * 0.3 + mv[i]) * dt * 0.5); p.setX(i, p.getX(i) + Math.cos(t * 0.2 + mv[i] * 2) * dt * 0.4); } p.needsUpdate = true; });

// ---- stages
const hemi = world.children.find(o => o.isHemisphereLight), sun = world.children.find(o => o.isDirectionalLight);
const STAGES = {
  deep: { bg: ['#05192A', '#0B4A6B', '#1B8FB0'], fog: [0x0B4A6B, 40, 150], hemi: 1.2, sun: 1.2, motes: [0x9FEFFF, 0.55], floor: true },
  sky: { bg: ['#4A86D8', '#9CCBF2', '#F6E7D0'], fog: [0xBFDDF2, 90, 260], hemi: 1.8, sun: 1.8, motes: [0xFFFFFF, 0.35], clouds: true },
  aurora: { bg: ['#02040F', '#0A1033', '#1D2A5C'], fog: [0x0A1033, 60, 200], hemi: 0.9, sun: 0.8, motes: [0xC8B4FF, 0.6], aurora: true, floor: true },
};
function stage(name) { const s = STAGES[name]; scene.background = gradTex(...s.bg); scene.fog = new THREE.Fog(...s.fog); hemi.intensity = s.hemi; sun.intensity = s.sun;
  moteM.color.set(s.motes[0]); moteM.opacity = s.motes[1]; clouds.visible = !!s.clouds; aurora.visible = !!s.aurora; floor.visible = !!s.floor;
  document.querySelectorAll('[data-stage]').forEach(b => b.classList.toggle('on', b.dataset.stage === name)); }
stage('deep');

// ---- the free camera
const ctl = new OrbitControls(camera, renderer.domElement); ctl.enableDamping = true; ctl.dampingFactor = 0.07; ctl.minDistance = 7; ctl.maxDistance = 90; ctl.rotateSpeed = 0.7; ctl.zoomSpeed = 0.8; ctl.autoRotateSpeed = 0.9;
ctl.target.set(0, 0, 0); camera.position.set(0, 6, 42); ctl.update();
let follow = true; const mid = new THREE.Vector3(), prev = new THREE.Vector3(); let started = false;
onTick(() => { V.state; mid.copy(V.mid());
  if (follow) { if (!started) { prev.copy(mid); started = true; } const d = tmp.copy(mid).sub(ctl.target).multiplyScalar(0.06); ctl.target.add(d); camera.position.add(d); } else started = false;
  ctl.update(); });

// ---- controls
const $ = s => document.querySelector(s);
document.querySelectorAll('[data-mode]').forEach(b => b.onclick = () => { SHOW.mode = b.dataset.mode; V.to('show', 1600); document.querySelectorAll('[data-mode]').forEach(x => x.classList.toggle('on', x === b)); });
document.querySelectorAll('[data-stage]').forEach(b => b.onclick = () => stage(b.dataset.stage));
$('#spd').oninput = e => { SHOW.rate = +e.target.value; };
$('#flap').oninput = e => { SHOW.flap = +e.target.value; };
$('#tail').oninput = e => { SHOW.tail = +e.target.value; };
$('#glow').oninput = e => { V.state.glow = +e.target.value; };
$('#fol').onclick = e => { follow = !follow; e.target.classList.toggle('on', follow); };
$('#orb').onclick = e => { ctl.autoRotate = !ctl.autoRotate; e.target.classList.toggle('on', ctl.autoRotate); };
$('#hide').onclick = () => document.body.classList.toggle('hideui');
SHOW.rate = 1; SHOW.flap = 1; SHOW.tail = 1; V.state.glow = 1.1;
window.__show = { V, SHOW, ctl, stage, setFollow: v => { follow = v; } };
