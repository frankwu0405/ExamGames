// Leo (sculpted model): auto-skinned skeleton, face-decal expressions, and a set of movements
import { THREE, init, newWorld, onTick, setCam, toon, renderer, camera } from './gfx.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
init(document.body);
const world = newWorld({ sky: 0x9FD8F5, ambientI: 1.7, sunI: 1.7, fog: [0xBFE3F5, 40, 120] });
renderer.shadowMap.enabled = true;
const ground = new THREE.Mesh(new THREE.CircleGeometry(60, 48), toon(0x8CC95E)); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; world.add(ground);
const S = 1.9; // model is 1 unit tall; scale to game-Leo height
const gm = (() => { const t = new THREE.DataTexture(new Uint8Array([140, 195, 255]), 3, 1, THREE.RedFormat); t.needsUpdate = true; t.minFilter = t.magFilter = THREE.NearestFilter; return t; })();
const INKM = new THREE.MeshBasicMaterial({ color: 0x2E2A4F, side: THREE.BackSide });
INKM.onBeforeCompile = s => { s.vertexShader = s.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n transformed += normalize(normal) * 0.0028;'); };
const err = e => { const d = document.createElement('div'); d.style.cssText = 'position:fixed;top:8px;left:8px;color:#fff;background:#a00;padding:6px 10px;font:12px sans-serif;z-index:9'; d.textContent = 'Failed: ' + (e && e.message || e); document.body.append(d); };

// ---------- skeleton (model space, 1 unit tall, facing +z) ----------
const JP = { hips: [0, .46, 0], chest: [0, .56, 0], head: [0, .68, 0], shL: [.11, .63, 0], elL: [.17, .49, 0], wrL: [.20, .37, 0], shR: [-.11, .63, 0], elR: [-.17, .49, 0], wrR: [-.20, .37, 0],
  hpL: [.06, .45, 0], knL: [.06, .25, 0], anL: [.06, .05, 0], hpR: [-.06, .45, 0], knR: [-.06, .25, 0], anR: [-.06, .05, 0] };
const PAR = { hips: null, chest: 'hips', head: 'chest', shL: 'chest', elL: 'shL', wrL: 'elL', shR: 'chest', elR: 'shR', wrR: 'elR', hpL: 'hips', knL: 'hpL', anL: 'knL', hpR: 'hips', knR: 'hpR', anR: 'knR' };
const B = {}; const bones = [];
for (const k in JP) { const b = new THREE.Bone(); b.name = k; B[k] = b; bones.push(b); }
for (const k in JP) { const p = PAR[k]; if (p) { B[p].add(B[k]); B[k].position.set(JP[k][0] - JP[p][0], JP[k][1] - JP[p][1], JP[k][2] - JP[p][2]); } else B[k].position.set(...JP[k]); }
const names = Object.keys(JP);
// weight segments (bone → [a,b] in model space); each influence is a capsule axis
const SEG = [['hips', [0, .40, 0], [0, .50, 0]], ['chest', [0, .52, 0], [0, .64, 0]], ['head', [0, .72, 0.01], [0, .88, 0.01]],
  ['shL', [.11, .63, 0], [.17, .49, 0]], ['elL', [.17, .49, 0], [.21, .33, 0]], ['shR', [-.11, .63, 0], [-.17, .49, 0]], ['elR', [-.17, .49, 0], [-.21, .33, 0]],
  ['hpL', [.06, .45, 0], [.06, .25, 0]], ['knL', [.06, .25, 0], [.06, .03, .02]], ['hpR', [-.06, .45, 0], [-.06, .25, 0]], ['knR', [-.06, .25, 0], [-.06, .03, .02]]];
const dseg = (p, a, b) => { const ab = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], ap = [p[0] - a[0], p[1] - a[1], p[2] - a[2]]; const l = ab[0] ** 2 + ab[1] ** 2 + ab[2] ** 2; let t = (ap[0] * ab[0] + ap[1] * ab[1] + ap[2] * ab[2]) / l; t = Math.max(0, Math.min(1, t)); const q = [a[0] + ab[0] * t - p[0], a[1] + ab[1] * t - p[1], a[2] + ab[2] * t - p[2]]; return Math.hypot(q[0], q[1], q[2]); };
const RAD = { hips: .115, chest: .10, head: .17, shL: .06, elL: .058, shR: .06, elR: .058, hpL: .05, knL: .05, hpR: .05, knR: .05 };
function smoothFace(geo) {
  const pos = geo.attributes.position, n = pos.count, idx = geo.index.array, key = new Map(), gid = new Int32Array(n); let ng = 0;
  for (let i = 0; i < n; i++) { const k = Math.round(pos.getX(i) * 4000) + ',' + Math.round(pos.getY(i) * 4000) + ',' + Math.round(pos.getZ(i) * 4000); let g = key.get(k); if (g === undefined) { g = ng++; key.set(k, g); } gid[i] = g; }
  const nb = Array.from({ length: ng }, () => new Set()); for (let i = 0; i < idx.length; i += 3) for (let j = 0; j < 3; j++) { const a = gid[idx[i + j]], b = gid[idx[i + (j + 1) % 3]]; nb[a].add(b); nb[b].add(a); }
  const P = new Float32Array(ng * 3), M = new Float32Array(ng); for (let i = 0; i < n; i++) { const g = gid[i]; P[g * 3] = pos.getX(i); P[g * 3 + 1] = pos.getY(i); P[g * 3 + 2] = pos.getZ(i); }
  for (let g = 0; g < ng; g++) { const x = P[g * 3], y = P[g * 3 + 1], z = P[g * 3 + 2]; // face + cheeks, feathered; keep hair, ears and neck
    const fy = Math.min(1, Math.max(0, (y - .66) / .04)) * Math.min(1, Math.max(0, (.93 - y) / .04)), fx2 = Math.min(1, Math.max(0, (.135 - Math.abs(x)) / .03)), fz = Math.min(1, Math.max(0, (z - .02) / .04)); M[g] = fy * fx2 * fz; }
  for (let it = 0; it < 6; it++) { const Q = P.slice(); for (let g = 0; g < ng; g++) { if (M[g] < .01 || !nb[g].size) continue; let ax = 0, ay = 0, az = 0; nb[g].forEach(h => { ax += P[h * 3]; ay += P[h * 3 + 1]; az += P[h * 3 + 2]; }); const c = nb[g].size, l = .55 * M[g]; Q[g * 3] += (ax / c - P[g * 3]) * l; Q[g * 3 + 1] += (ay / c - P[g * 3 + 1]) * l; Q[g * 3 + 2] += (az / c - P[g * 3 + 2]) * l; } P.set(Q); }
  for (let i = 0; i < n; i++) { const g = gid[i]; pos.setXYZ(i, P[g * 3], P[g * 3 + 1], P[g * 3 + 2]); }
  geo.computeVertexNormals();
  // the cut at UV seams leaves doubled vertices with split normals; share them
  const nrm = geo.attributes.normal, acc = new Float32Array(ng * 3); for (let i = 0; i < n; i++) { const g = gid[i]; acc[g * 3] += nrm.getX(i); acc[g * 3 + 1] += nrm.getY(i); acc[g * 3 + 2] += nrm.getZ(i); }
  for (let i = 0; i < n; i++) { const g = gid[i], l = Math.hypot(acc[g * 3], acc[g * 3 + 1], acc[g * 3 + 2]) || 1; nrm.setXYZ(i, acc[g * 3] / l, acc[g * 3 + 1] / l, acc[g * 3 + 2] / l); }
}

function skinAttrs(pos) {
  const n = pos.count, si = new Uint16Array(n * 4), sw = new Float32Array(n * 4), p = [0, 0, 0];
  for (let i = 0; i < n; i++) { p[0] = pos.getX(i); p[1] = pos.getY(i); p[2] = pos.getZ(i);
    const w = SEG.map(([k, a, b]) => [names.indexOf(k), Math.exp(-Math.max(0, dseg(p, a, b) - (RAD[k] || .05)) / 0.009) * ((/^(sh|el)/.test(k) && ((Math.abs(p[0]) < .118 && p[1] < .60 && p[1] > .40) || (Math.abs(p[0]) < .13 && p[1] < .44 && p[1] > .24))) ? 0.0003 : 1)]).sort((x, y) => y[1] - x[1]).slice(0, 4);
    const s = w.reduce((a, c) => a + c[1], 0); for (let j = 0; j < 4; j++) { si[i * 4 + j] = w[j][0]; sw[i * 4 + j] = w[j][1] / s; } }
  return [si, sw];
}

// ---------- face decal canvas (eyes / brows / mouth drawn over the baked face) ----------
const FC = { x0: -.15, x1: .15, y0: .66, y1: .96, W: 768, H: 768 };
const fcv = document.createElement('canvas'); fcv.width = FC.W; fcv.height = FC.H; const fx = fcv.getContext('2d');
const ftex = new THREE.CanvasTexture(fcv); ftex.colorSpace = THREE.SRGBColorSpace; ftex.anisotropy = 4;
const FX = x => (x - FC.x0) / (FC.x1 - FC.x0) * FC.W, FY = y => (FC.y1 - y) / (FC.y1 - FC.y0) * FC.H, FL = l => l / (FC.x1 - FC.x0) * FC.W;
// landmarks in model units (tuned by ?grid)
const LM = { eyeX: .066, eyeY: .778, eyeR: .03, browY: .85, mouthY: .697, mouthW: .05, skin: '#8A5333', skinD: '#6E3E25', ink: '#2A1B24' };
const EXPR = {
  smile: null, // the baked smile, untouched
  happy: { brow: [-.004, 0, 0], eye: 'happy', mouth: 'grin' },
  surprised: { brow: [.016, .008, 0], eye: 'wide', mouth: 'o' },
  sad: { brow: [-.01, .006, -.2], eye: 'sad', mouth: 'frown' },
  scared: { brow: [.012, .006, -.15], eye: 'wide', mouth: 'wobble' },
  angry: { brow: [-.01, -.012, .38], eye: 'narrow', mouth: 'grr' },
  sleepy: { brow: [-.008, 0, -.05], eye: 'closed', mouth: 'small' },
  cheeky: { brow: [.008, 0, .1], eye: 'wink', mouth: 'tongue' },
  talk: { brow: [0, 0, 0], eye: 'open', mouth: 'talk' },
};
let cur = 'smile', blink = 0, talkOpen = 0, dirty = true, GRID = /grid/.test(location.search);
function drawFace() {
  fx.clearRect(0, 0, FC.W, FC.H);
  const e = EXPR[cur];
  if (GRID) { fx.strokeStyle = '#fff'; fx.fillStyle = '#fff'; fx.font = '16px sans-serif'; for (let x = -.14; x <= .14; x += .02) { fx.beginPath(); fx.moveTo(FX(x), 0); fx.lineTo(FX(x), FC.H); fx.stroke(); fx.fillText(x.toFixed(2), FX(x) + 2, 14); } for (let y = .68; y <= .95; y += .02) { fx.beginPath(); fx.moveTo(0, FY(y)); fx.lineTo(FC.W, FY(y)); fx.stroke(); fx.fillText(y.toFixed(2), 2, FY(y) - 2); } return; }
  if (!e && !blink) return;
  const eye = blink ? 'closed' : (e ? e.eye : 'open');
  const skinPatch = (cx, cy, rx, ry) => { const g = fx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(rx, ry)); g.addColorStop(0, LM.skin); g.addColorStop(.72, LM.skin); g.addColorStop(1, LM.skin + '00'); fx.save(); fx.translate(cx, cy); fx.scale(rx / Math.max(rx, ry), ry / Math.max(rx, ry)); fx.translate(-cx, -cy); fx.fillStyle = g; fx.beginPath(); fx.arc(cx, cy, Math.max(rx, ry), 0, 6.3); fx.fill(); fx.restore(); };
  fx.lineCap = 'round'; fx.lineJoin = 'round';
  // eyes: cover the baked ones with skin, then draw new
  for (const s of [-1, 1]) {
    const ex = s * LM.eyeX, ey = LM.eyeY, r = FL(LM.eyeR);
    if (eye !== 'open' || blink) { skinPatch(FX(ex), FY(ey), r * 2.25, r * 2.0); }
    fx.strokeStyle = LM.ink; fx.fillStyle = LM.ink;
    const cx = FX(ex), cy = FY(ey);
    const wink = e && e.eye === 'wink' && s < 0;
    if (eye === 'closed' || wink) { fx.lineWidth = r * .32; fx.beginPath(); fx.arc(cx, cy - r * .45, r * .95, .2 * Math.PI, .8 * Math.PI); fx.stroke(); }
    else if (eye === 'happy') { fx.lineWidth = r * .34; fx.beginPath(); fx.arc(cx, cy + r * .55, r * .95, 1.15 * Math.PI, 1.85 * Math.PI); fx.stroke(); }
    else if (eye === 'sad') { fx.lineWidth = r * .3; fx.beginPath(); fx.arc(cx, cy - r * .3, r * .95, .15 * Math.PI, .85 * Math.PI); fx.stroke(); fx.fillStyle = '#7ec8ff'; fx.beginPath(); fx.ellipse(cx + s * r * .6, cy + r * 1.6, r * .22, r * .36, 0, 0, 6.3); fx.fill(); }
    else if (eye === 'narrow') { fx.lineWidth = r * .3; skinPatch(cx, cy - r * .6, r * 1.8, r * .8); fx.strokeStyle = LM.ink; fx.beginPath(); fx.moveTo(cx - s * r * 1.0, cy - r * .55); fx.lineTo(cx + s * r * 1.0, cy - r * .05); fx.stroke(); }
    else if (eye === 'wide') { fx.fillStyle = '#fff'; fx.beginPath(); fx.ellipse(cx, cy, r * 1.15, r * 1.3, 0, 0, 6.3); fx.fill(); fx.lineWidth = r * .18; fx.stroke(); fx.fillStyle = '#4A2A14'; fx.beginPath(); fx.arc(cx, cy, r * .62, 0, 6.3); fx.fill(); fx.fillStyle = LM.ink; fx.beginPath(); fx.arc(cx, cy, r * .32, 0, 6.3); fx.fill(); fx.fillStyle = '#fff'; fx.beginPath(); fx.arc(cx - r * .2, cy - r * .22, r * .18, 0, 6.3); fx.fill(); }
  }
  // brows
  if (e) { fx.strokeStyle = '#2A1408'; fx.lineCap = 'round'; for (const s of [-1, 1]) { const cx = FX(s * LM.eyeX * 1.02), cy = FY(LM.browY + e.brow[0] + (s < 0 && e.eye === 'wink' ? .01 : 0)), w = FL(.026), tilt = e.brow[2] * s * -1;
      skinPatch(FX(s * .07), FY(.845), FL(.05), FL(.026)); fx.lineWidth = w * .36; fx.beginPath(); fx.moveTo(cx - w * Math.cos(tilt) * s, cy - w * Math.sin(tilt) * s * -1 + FL(e.brow[1]) * -1); fx.lineTo(cx + w * Math.cos(tilt) * s, cy + w * Math.sin(tilt) * s * -1 + FL(e.brow[1]) * -1); fx.stroke(); } }
  // mouth
  if (e) {
    const mx = FX(0), my = FY(LM.mouthY), mw = FL(LM.mouthW);
    skinPatch(mx, my - mw * .1, mw * 2.2, mw * 1.7);
    const m = e.mouth === 'talk' ? (talkOpen > .66 ? 'o2' : talkOpen > .33 ? 'grin' : 'small') : e.mouth;
    fx.fillStyle = '#4A1620'; fx.strokeStyle = LM.ink; fx.lineWidth = mw * .16;
    const mouth = (path, fill) => { fx.beginPath(); path(); if (fill) { fx.fillStyle = fill; fx.fill(); } fx.stroke(); };
    if (m === 'grin') { mouth(() => { fx.moveTo(mx - mw, my - mw * .2); fx.quadraticCurveTo(mx, my + mw * 1.5, mx + mw, my - mw * .2); fx.closePath(); }, '#4A1620'); fx.fillStyle = '#fff'; fx.beginPath(); fx.moveTo(mx - mw * .85, my - mw * .17); fx.quadraticCurveTo(mx, my + mw * .22, mx + mw * .85, my - mw * .17); fx.quadraticCurveTo(mx, my - mw * .02, mx - mw * .85, my - mw * .17); fx.fill(); fx.fillStyle = '#E0607A'; fx.beginPath(); fx.ellipse(mx, my + mw * .62, mw * .42, mw * .2, 0, 0, 6.3); fx.fill(); }
    else if (m === 'o' || m === 'o2') { const r = mw * (m === 'o' ? .5 : .62); mouth(() => fx.ellipse(mx, my + mw * .1, r * .82, r, 0, 0, 6.3), '#4A1620'); fx.fillStyle = '#E0607A'; fx.beginPath(); fx.ellipse(mx, my + r * .55, r * .5, r * .26, 0, 0, 6.3); fx.fill(); }
    else if (m === 'frown') { fx.lineWidth = mw * .2; fx.beginPath(); fx.moveTo(mx - mw * .8, my + mw * .35); fx.quadraticCurveTo(mx, my - mw * .55, mx + mw * .8, my + mw * .35); fx.stroke(); }
    else if (m === 'wobble') { fx.lineWidth = mw * .18; fx.beginPath(); fx.moveTo(mx - mw * .8, my + mw * .1); for (let i = 1; i <= 6; i++) fx.lineTo(mx - mw * .8 + mw * 1.6 * i / 6, my + mw * .1 + (i % 2 ? -1 : 1) * mw * .18); fx.stroke(); }
    else if (m === 'grr') { mouth(() => { fx.moveTo(mx - mw * .85, my + mw * .3); fx.lineTo(mx + mw * .85, my + mw * .3); fx.lineTo(mx + mw * .7, my - mw * .35); fx.lineTo(mx - mw * .7, my - mw * .35); fx.closePath(); }, '#fff'); fx.lineWidth = mw * .1; for (let i = -2; i <= 2; i++) { fx.beginPath(); fx.moveTo(mx + i * mw * .3, my - mw * .35); fx.lineTo(mx + i * mw * .3, my + mw * .3); fx.stroke(); } }
    else if (m === 'small') { fx.lineWidth = mw * .2; fx.beginPath(); fx.moveTo(mx - mw * .35, my); fx.quadraticCurveTo(mx, my + mw * .35, mx + mw * .35, my); fx.stroke(); }
    else if (m === 'tongue') { mouth(() => { fx.moveTo(mx - mw * .9, my - mw * .2); fx.quadraticCurveTo(mx, my + mw * 1.1, mx + mw * .9, my - mw * .2); fx.closePath(); }, '#4A1620'); fx.fillStyle = '#E0607A'; fx.beginPath(); fx.ellipse(mx + mw * .2, my + mw * .55, mw * .35, mw * .5, 0, 0, 6.3); fx.fill(); }
  }
}
const FACE_MAT = new THREE.MeshToonMaterial({ map: ftex, gradientMap: gm, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
FACE_MAT.onBeforeCompile = s => { s.vertexShader = s.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n transformed += normal * 0.0016;'); };

// ---------- build the character ----------
let skel = null, root = null;
function build(gltf, img) {
  const src = []; gltf.scene.traverse(m => { if (m.isMesh) src.push(m); });
  const geo = src[0].geometry.clone(); const pos = geo.attributes.position;
  smoothFace(geo); const [si, sw] = skinAttrs(pos); window.__geo = geo; window.__si = si; window.__sw = sw; geo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(si, 4)); geo.setAttribute('skinWeight', new THREE.Float32BufferAttribute(sw, 4));
  root = new THREE.Group(); root.add(B.hips); root.updateMatrixWorld(true); skel = new THREE.Skeleton(bones);
  const tex = new THREE.Texture(img); tex.flipY = false; tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4; tex.needsUpdate = true;
  const mk = (g, mat, cast) => { const m = new THREE.SkinnedMesh(g, mat); m.frustumCulled = false; m.bind(skel, new THREE.Matrix4()); m.castShadow = !!cast; return m; };
  const body = mk(geo, new THREE.MeshToonMaterial({ map: tex, gradientMap: gm }), true); const ink = mk(geo, INKM);
  // face decal: front-facing triangles of the head
  const idx = geo.index.array, nrm = geo.attributes.normal, keep = [];
  for (let i = 0; i < idx.length; i += 3) { let ok = true; for (let j = 0; j < 3; j++) { const v = idx[i + j], x = pos.getX(v), y = pos.getY(v), z = pos.getZ(v); if (y < FC.y0 || y > FC.y1 || Math.abs(x) > FC.x1 || z < 0.06 || nrm.getZ(v) < 0.1) ok = false; } if (ok) keep.push(idx[i], idx[i + 1], idx[i + 2]); }
  const fg = new THREE.BufferGeometry(); for (const k of ['position', 'normal', 'skinIndex', 'skinWeight']) fg.setAttribute(k, geo.attributes[k]);
  const uv = new Float32Array(pos.count * 2); for (let i = 0; i < pos.count; i++) { uv[i * 2] = (pos.getX(i) - FC.x0) / (FC.x1 - FC.x0); uv[i * 2 + 1] = (pos.getY(i) - FC.y0) / (FC.y1 - FC.y0); }
  fg.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); fg.setIndex(keep);
  const face = mk(fg, FACE_MAT); face.renderOrder = 3;
  root.scale.setScalar(S);
  const g = new THREE.Group(); g.add(root); root.add(body, ink, face); world.add(g); g.userData.ready = true; return g;
}
let LEO = null;
const loadImg = src => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
async function load() {
  let buf, tsrc;
  if (window.__LEO_B64) { const b = atob(window.__LEO_B64), u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); buf = u.buffer; tsrc = window.__LEO_TEX; }
  else { buf = await (await fetch('leo/leo_notex.glb')).arrayBuffer(); tsrc = 'leo/leo_tex.jpg'; }
  const img = await loadImg(tsrc); const gltf = await new Promise((res, rej) => new GLTFLoader().parse(buf, '', res, rej)); LEO = build(gltf, img); drawFace(); ftex.needsUpdate = true;
}
load().catch(err);

// ---------- poses ----------
const REST = {}; names.forEach(n => REST[n] = [0, 0, 0]);
let act = 'idle', actT = 0, actStart = 0, pos0 = new THREE.Vector3();
const smooth = {}; names.forEach(n => smooth[n] = [0, 0, 0]);
const hipsOffset = { y: 0, z: 0, x: 0 }, rootState = { x: 0, z: 0, ry: 0 };
const sn = Math.sin, cs = Math.cos;
function pose(t, a) {
  const P = {}; names.forEach(n => P[n] = [0, 0, 0]); let hy = 0, hx = 0, ry = 0;
  const br = sn(t * 1.9) * .012;
  P.chest[0] += br; P.head[0] += -br * .6;
  const armDown = s => { P['sh' + s][2] = (s === 'L' ? 1 : -1) * .08; P['el' + s][2] = (s === 'L' ? 1 : -1) * .06; };
  armDown('L'); armDown('R');
  if (a === 'idle') { P.head[1] = sn(t * .5) * .12; P.head[0] += sn(t * .7) * .03; P.shL[0] = sn(t * 1.9) * .03; P.shR[0] = -sn(t * 1.9) * .03; hx = sn(t * .9) * .008; P.hips[2] = sn(t * .9) * .03; P.chest[2] = -sn(t * .9) * .03; }
  if (a === 'walk' || a === 'run') { const f = a === 'run' ? 8.5 : 5.2, A = a === 'run' ? .85 : .55, k = t * f, sw = sn(k);
    P.hpL[0] = -sw * A; P.hpR[0] = sw * A; P.knL[0] = Math.max(0, sn(k + 1.6)) * A * 1.4 * (a === 'run' ? 1.4 : 1); P.knR[0] = Math.max(0, sn(k + 1.6 + Math.PI)) * A * 1.4 * (a === 'run' ? 1.4 : 1);
    P.shL[0] = sw * A * .9; P.shR[0] = -sw * A * .9; P.elL[0] = -.35 - (a === 'run' ? .6 : 0); P.elR[0] = -.35 - (a === 'run' ? .6 : 0);
    P.hips[1] = sw * .12; P.chest[1] = -sw * .1; P.head[1] = sw * .05; P.chest[0] += a === 'run' ? -.15 : -.04; hy = -Math.abs(cs(k)) * (a === 'run' ? .05 : .025) + .02; P.hips[2] = sn(k) * .04; }
  if (a === 'wave') { P.shL[2] = 1.75; P.elL[2] = 1.15 + sn(t * 8) * .45; P.head[2] = .1; P.head[1] = -.2; P.chest[2] = -.05; }
  if (a === 'cheer') { const j = Math.abs(sn(t * 5)); P.shL[2] = 1.9 + sn(t * 10) * .1; P.shR[2] = -1.9 - sn(t * 10) * .1; P.elL[2] = .9; P.elR[2] = -.9; P.hpL[0] = -j * .5; P.hpR[0] = -j * .5; P.knL[0] = j * .9; P.knR[0] = j * .9; hy = j * .12; P.head[0] = -.2; }
  if (a === 'jump') { const u = (t % 1.6) / 1.6, c = u < .28 ? -sn(u / .28 * Math.PI) * .12 : 0, air = u > .28 && u < .8 ? sn((u - .28) / .52 * Math.PI) : 0;
    hy = air * .32 + c; const crouch = u < .28 ? sn(u / .28 * Math.PI) : 0; P.hpL[0] = -crouch * .7 - air * .4; P.hpR[0] = P.hpL[0]; P.knL[0] = crouch * 1.2 + air * .8; P.knR[0] = P.knL[0]; P.shL[2] = .08 + air * .9 + crouch * -.1; P.shR[2] = -P.shL[2]; P.shL[0] = crouch * .8; P.shR[0] = crouch * .8; P.chest[0] += crouch * .25; }
  if (a === 'look') { P.head[1] = sn(t * .9) * .85; P.head[0] = sn(t * 1.3) * .15; P.chest[1] = sn(t * .9) * .15; P.hips[1] = sn(t * .9) * .1; }
  if (a === 'shrug') { const u = (sn(t * 2) + 1) / 2; P.shL[2] += -.06; hy = u * .008; P.head[2] = .15 * sn(t * 2); P.chest[2] = 0; P.shL[2] = .55 + u * .1; P.shR[2] = -.55 - u * .1; P.elL[0] = -1.0; P.elR[0] = -1.0; P.elL[2] = .3; P.elR[2] = -.3; P.chest[1] = 0; }
  if (a === 'sit') { P.hpL[0] = -1.45; P.hpR[0] = -1.45; P.knL[0] = 1.5; P.knR[0] = 1.5; hy = -.3; P.chest[0] += .05; P.shL[0] = -.5; P.shR[0] = -.5; P.elL[0] = -.8; P.elR[0] = -.8; P.head[0] += .1; }
  if (a === 'dance') { const k = t * 6.5; P.hips[2] = sn(k) * .22; P.chest[2] = -sn(k) * .2; P.hips[1] = sn(k * .5) * .4; P.head[2] = sn(k) * .2; hy = Math.abs(sn(k)) * .045; P.hpL[0] = -Math.max(0, sn(k)) * .5; P.hpR[0] = -Math.max(0, -sn(k)) * .5; P.knL[0] = Math.max(0, sn(k)) * .8; P.knR[0] = Math.max(0, -sn(k)) * .8; P.shL[2] = 1.1 + sn(k) * .5; P.shR[2] = -(1.1 + sn(k + Math.PI) * .5); P.elL[2] = .7; P.elR[2] = -.7; }
  if (a === 'sneak') { P.hpL[0] = -.55 * sn(t * 3.2); P.hpR[0] = .55 * sn(t * 3.2); P.knL[0] = .5 + Math.max(0, sn(t * 3.2 + 1.5)) * .6; P.knR[0] = .5 + Math.max(0, -sn(t * 3.2 + 1.5)) * .6; hy = -.09; P.chest[0] += .35; P.head[0] = -.25; P.head[1] = sn(t * 1.1) * .6; P.shL[0] = -.4; P.shR[0] = -.4; P.elL[0] = -.8; P.elR[0] = -.8; }
  return { P, hy, hx, ry };
}
// ---------- UI ----------
const ctl = new OrbitControls(camera, renderer.domElement); ctl.enableDamping = true; ctl.minDistance = .8; ctl.maxDistance = 16; ctl.maxPolarAngle = Math.PI * .52; ctl.target.set(0, .95, 0); camera.position.set(0, 1.4, 6.2); ctl.target.set(0, .62, 0); ctl.update();
const bar = document.createElement('div'); bar.style.cssText = 'position:fixed;left:50%;bottom:12px;transform:translateX(-50%);display:grid;gap:7px;z-index:3;font:700 13px Andika,sans-serif;width:min(820px,calc(100vw - 16px));background:#06223AB8;border:1px solid #6FE3FF55;border-radius:16px;padding:9px 11px;backdrop-filter:blur(8px)';
const mkRow = (label, items, cb, first) => { const r = document.createElement('div'); r.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;align-items:center'; const l = document.createElement('span'); l.textContent = label; l.style.cssText = 'font-size:11px;letter-spacing:1.2px;text-transform:uppercase;opacity:.6;width:72px'; r.append(l);
  items.forEach(([n, k]) => { const b = document.createElement('button'); b.textContent = n; b.dataset.k = k; b.style.cssText = 'padding:6px 12px;border-radius:999px;border:1px solid #6FE3FF44;background:#0E3B5C;color:#D6F8FF;cursor:pointer;font:inherit'; b.onclick = () => { r.querySelectorAll('button').forEach(x => { x.style.background = '#0E3B5C'; x.style.color = '#D6F8FF'; }); b.style.background = '#2DB8E0'; b.style.color = '#032033'; cb(k); }; r.append(b); if (k === first) b.click(); }); bar.append(r); };
let drift = 0, follow = false, walkDir = 0;
mkRow('Movement', [['Idle', 'idle'], ['Walk', 'walk'], ['Run', 'run'], ['Sneak', 'sneak'], ['Wave', 'wave'], ['Cheer', 'cheer'], ['Jump', 'jump'], ['Look around', 'look'], ['Shrug', 'shrug'], ['Dance', 'dance'], ['Sit', 'sit']], k => { act = k; actStart = performance.now() / 1000; if (!['walk', 'run', 'sneak'].includes(k)) { rootState.x = 0; rootState.z = 0; } }, 'idle');
mkRow('Face', [['Smile', 'smile'], ['Happy', 'happy'], ['Surprised', 'surprised'], ['Sad', 'sad'], ['Scared', 'scared'], ['Angry', 'angry'], ['Sleepy', 'sleepy'], ['Cheeky', 'cheeky'], ['Talking', 'talk']], k => { cur = k; dirty = true; }, 'smile');
mkRow('Camera', [['Full', 'f'], ['Face', 'c'], ['Side', 's'], ['Back', 'b']], k => { const t = LEO ? 1.0 : 1.0; const set = { f: [[0, 1.4, 6.2], [0, .62, 0]], c: [[0, 1.6, 1.5], [0, 1.45, 0]], s: [[4.6, 1.2, 1.2], [0, .95, 0]], b: [[0, 1.2, -5.2], [0, .95, 0]] }[k]; camera.position.set(...set[0]); ctl.target.set(...set[1]); ctl.update(); }, 'f');
document.body.append(bar);
window.__ctl = ctl; window.__cam = camera; window.__B = B; window.__setAct = k => { act = k; }; window.__setFace = k => { cur = k; dirty = true; };

let tNext = 2 + Math.random() * 3, blinkEnd = 0;
onTick((t, dt) => {
  ctl.update();
  if (!LEO) return;
  const T = t - actStart + 0;
  const { P, hy, hx } = pose(t, act);
  const k = 1 - Math.exp(-dt * 12);
  for (const n of names) for (let i = 0; i < 3; i++) { smooth[n][i] += (P[n][i] - smooth[n][i]) * k; B[n].rotation[['x', 'y', 'z'][i]] = smooth[n][i]; }
  hipsOffset.y += (hy - hipsOffset.y) * k; hipsOffset.x += (hx - hipsOffset.x) * k;
  B.hips.position.set(JP.hips[0] + hipsOffset.x, JP.hips[1] + hipsOffset.y, 0);
  // walking travels in a circle so the camera can stay put
  const sp = { walk: .9, run: 2.1, sneak: .45 }[act] || 0;
  if (sp) { rootState.ry += dt * sp / 1.8; }
  const R = 1.8, a = rootState.ry;
  if (sp) { LEO.position.set(Math.sin(a) * R, 0, -R + Math.cos(a) * R); LEO.rotation.y = a + Math.PI / 2; }
  else { const tw = Math.round((LEO.rotation.y) / (Math.PI * 2)) * Math.PI * 2; LEO.position.x *= .93; LEO.position.z *= .93; LEO.rotation.y += (tw - LEO.rotation.y) * .08; if (Math.abs(LEO.position.x) + Math.abs(LEO.position.z) < .01) { rootState.ry = 0; } }
  // sitting: nothing under him but ground, lower the whole model slightly so shoes meet the ground
  if (sp && follow) { ctl.target.copy(LEO.position).add(new THREE.Vector3(0, .95, 0)); }
  // blinks + talking
  if (!blink && t > tNext) { blink = 1; blinkEnd = t + .13; dirty = true; }
  if (blink && t > blinkEnd) { blink = 0; tNext = t + 2 + Math.random() * 3.5; dirty = true; }
  if (cur === 'talk') { const o = (sn(t * 11) * .5 + .5) * (sn(t * 3.1) * .5 + .5) * 1.4; const q = Math.min(1, o); const lv = q > .66 ? 3 : q > .33 ? 2 : 1; if (lv !== talkOpen) { talkOpen = lv === 3 ? .8 : lv === 2 ? .5 : .1; dirty = true; } }
  if (dirty) { drawFace(); ftex.needsUpdate = true; dirty = false; }
});
