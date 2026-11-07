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
const JP = { hips: [0, .40, 0], chest: [0, .50, 0], head: [0, .66, 0], shL: [.095, .60, 0], elL: [.22, .60, 0], wrL: [.30, .60, 0], shR: [-.095, .60, 0], elR: [-.22, .60, 0], wrR: [-.30, .60, 0],
  hpL: [.055, .38, 0], knL: [.055, .20, 0], anL: [.055, .06, 0], hpR: [-.055, .38, 0], knR: [-.055, .20, 0], anR: [-.055, .06, 0] };
const PAR = { hips: null, chest: 'hips', head: 'chest', shL: 'chest', elL: 'shL', wrL: 'elL', shR: 'chest', elR: 'shR', wrR: 'elR', hpL: 'hips', knL: 'hpL', anL: 'knL', hpR: 'hips', knR: 'hpR', anR: 'knR' };
const B = {}; const bones = [];
for (const k in JP) { const b = new THREE.Bone(); b.name = k; B[k] = b; bones.push(b); }
for (const k in JP) { const p = PAR[k]; if (p) { B[p].add(B[k]); B[k].position.set(JP[k][0] - JP[p][0], JP[k][1] - JP[p][1], JP[k][2] - JP[p][2]); } else B[k].position.set(...JP[k]); }
const names = Object.keys(JP);
const SEG = [['hips', [0, .33, 0], [0, .44, 0]], ['chest', [0, .46, 0], [0, .58, 0]], ['head', [0, .72, 0], [0, .86, 0]],
  ['shL', [.095, .60, 0], [.22, .60, 0]], ['elL', [.22, .60, 0], [.36, .60, 0]], ['shR', [-.095, .60, 0], [-.22, .60, 0]], ['elR', [-.22, .60, 0], [-.36, .60, 0]],
  ['hpL', [.055, .38, 0], [.055, .20, 0]], ['knL', [.055, .20, 0], [.055, .04, .01]], ['hpR', [-.055, .38, 0], [-.055, .20, 0]], ['knR', [-.055, .20, 0], [-.055, .04, .01]]];
const dseg = (p, a, b) => { const ab = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], ap = [p[0] - a[0], p[1] - a[1], p[2] - a[2]]; const l = ab[0] ** 2 + ab[1] ** 2 + ab[2] ** 2; let t = (ap[0] * ab[0] + ap[1] * ab[1] + ap[2] * ab[2]) / l; t = Math.max(0, Math.min(1, t)); const q = [a[0] + ab[0] * t - p[0], a[1] + ab[1] * t - p[1], a[2] + ab[2] * t - p[2]]; return Math.hypot(q[0], q[1], q[2]); };
const RAD = { hips: .10, chest: .09, head: .17, shL: .05, elL: .05, shR: .05, elR: .05, hpL: .06, knL: .055, hpR: .06, knR: .055 };
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
function skinAttrs(pos) {
  const n = pos.count, si = new Uint16Array(n * 4), sw = new Float32Array(n * 4), p = [0, 0, 0];
  for (let i = 0; i < n; i++) { p[0] = pos.getX(i); p[1] = pos.getY(i); p[2] = pos.getZ(i);
    const armness = p[1] > .50 && p[1] < .70 ? sstep(.07, .17, Math.abs(p[0])) : (Math.abs(p[0]) > .15 ? 1 : 0);
    const w = SEG.map(([k, a, b]) => { let v = Math.exp(-Math.max(0, dseg(p, a, b) - (RAD[k] || .05)) / 0.012);
      if (/^(sh|el)/.test(k)) v *= armness + 1e-4; else if (/^(hips|chest)$/.test(k)) v *= (1 - armness) + 1e-4;
      if (/^(hp|kn)L/.test(k) && p[0] < -.004) v *= .002; if (/^(hp|kn)R/.test(k) && p[0] > .004) v *= .002; return [names.indexOf(k), v]; }).sort((x, y) => y[1] - x[1]).slice(0, 4);
    const s = w.reduce((a, c) => a + c[1], 0); for (let j = 0; j < 4; j++) { si[i * 4 + j] = w[j][0]; sw[i * 4 + j] = w[j][1] / s; } }
  return [si, sw];
}

// ---------- face decal canvas (eyes / brows / mouth drawn over the baked face) ----------
const FC = { x0: -.15, x1: .15, y0: .62, y1: .96, W: 768, H: 768 };
const fcv = document.createElement('canvas'); fcv.width = FC.W; fcv.height = FC.H; const fx = fcv.getContext('2d');
const ftex = new THREE.CanvasTexture(fcv); ftex.colorSpace = THREE.SRGBColorSpace; ftex.anisotropy = 4;
const FX = x => (x - FC.x0) / (FC.x1 - FC.x0) * FC.W, FY = y => (FC.y1 - y) / (FC.y1 - FC.y0) * FC.H, FL = l => l / (FC.x1 - FC.x0) * FC.W;
// landmarks in model units (tuned by ?grid)
const LM = { eyeX: .056, eyeY: .778, eyeR: .027, browY: .84, mouthY: .697, mouthW: .05, skin: '#AA7255', skinD: '#8A5A40', ink: '#2A1B24' };
const EXPR = {
  smile: { brow: [0, 0, 0], eye: 'open', mouth: 'smile' },
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
  // clean skin base: replaces the lumpy baked face (eye-socket shadows, brow smudges, mouth) with smooth painted skin
  { const cx = FX(0), cy = FY(.76), rx = FL(.123), ry = FL(.122); fx.save(); fx.translate(cx, cy); fx.scale(1, ry / rx);
    let g = fx.createRadialGradient(0, 0, 0, 0, 0, rx); g.addColorStop(0, '#B9835F'); g.addColorStop(.72, '#AA7255'); g.addColorStop(.86, '#AA7255ee'); g.addColorStop(1, '#AA725500'); fx.fillStyle = g; fx.beginPath(); fx.arc(0, 0, rx, 0, 6.3); fx.fill(); fx.restore();
    for (const s of [-1, 1]) { const bx = FX(s * .085), by = FY(.72), br = FL(.032); const bg = fx.createRadialGradient(bx, by, 0, bx, by, br); bg.addColorStop(0, '#C26F4888'); bg.addColorStop(1, '#C26F4800'); fx.fillStyle = bg; fx.beginPath(); fx.arc(bx, by, br, 0, 6.3); fx.fill(); }
    // nose: small soft shadow + two nostril ticks
    fx.fillStyle = '#6B3A2455'; fx.beginPath(); fx.ellipse(FX(0), FY(.738), FL(.018), FL(.011), 0, 0, 6.3); fx.fill(); fx.strokeStyle = '#5A2F1C'; fx.lineWidth = FL(.0035); fx.lineCap = 'round'; for (const s of [-1, 1]) { fx.beginPath(); fx.arc(FX(s * .009), FY(.735), FL(.006), .2, 2.6 + (s > 0 ? 0 : .3)); fx.stroke(); } }
  const eye = blink ? 'closed' : (e ? e.eye : 'open');
  const skinPatch = (cx, cy, rx, ry) => { const g = fx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(rx, ry)); g.addColorStop(0, LM.skin); g.addColorStop(.72, LM.skin); g.addColorStop(1, LM.skin + '00'); fx.save(); fx.translate(cx, cy); fx.scale(rx / Math.max(rx, ry), ry / Math.max(rx, ry)); fx.translate(-cx, -cy); fx.fillStyle = g; fx.beginPath(); fx.arc(cx, cy, Math.max(rx, ry), 0, 6.3); fx.fill(); fx.restore(); };
  fx.lineCap = 'round'; fx.lineJoin = 'round';
  // eyes: cover the baked ones with skin, then draw new
  for (const s of [-1, 1]) {
    const ex = s * LM.eyeX, ey = LM.eyeY, r = FL(LM.eyeR);

    fx.strokeStyle = LM.ink; fx.fillStyle = LM.ink;
    const cx = FX(ex), cy = FY(ey);
    const wink = e && e.eye === 'wink' && s < 0;
    if (eye === 'closed' || wink) { fx.lineWidth = r * .32; fx.beginPath(); fx.arc(cx, cy - r * .45, r * .95, .2 * Math.PI, .8 * Math.PI); fx.stroke(); }
    else if (eye === 'happy') { fx.lineWidth = r * .34; fx.beginPath(); fx.arc(cx, cy + r * .55, r * .95, 1.15 * Math.PI, 1.85 * Math.PI); fx.stroke(); }
    else if (eye === 'sad') { fx.lineWidth = r * .3; fx.beginPath(); fx.arc(cx, cy - r * .3, r * .95, .15 * Math.PI, .85 * Math.PI); fx.stroke(); fx.fillStyle = '#7ec8ff'; fx.beginPath(); fx.ellipse(cx + s * r * .6, cy + r * 1.6, r * .22, r * .36, 0, 0, 6.3); fx.fill(); }
    else if (eye === 'narrow') { fx.lineWidth = r * .3; skinPatch(cx, cy - r * .6, r * 1.8, r * .8); fx.strokeStyle = LM.ink; fx.beginPath(); fx.moveTo(cx - s * r * 1.0, cy - r * .55); fx.lineTo(cx + s * r * 1.0, cy - r * .05); fx.stroke(); }
    else if (eye === 'open') { fx.fillStyle = '#FBF7EE'; fx.beginPath(); fx.ellipse(cx, cy, r * 1.0, r * 1.08, 0, 0, 6.3); fx.fill(); fx.fillStyle = '#6A3A1A'; fx.beginPath(); fx.arc(cx + s * r * .04, cy + r * .06, r * .66, 0, 6.3); fx.fill(); fx.fillStyle = '#3A1E0C'; fx.beginPath(); fx.arc(cx + s * r * .04, cy + r * .06, r * .42, 0, 6.3); fx.fill(); fx.fillStyle = '#fff'; fx.beginPath(); fx.arc(cx - r * .2, cy - r * .22, r * .2, 0, 6.3); fx.fill(); fx.beginPath(); fx.arc(cx + r * .22, cy + r * .28, r * .09, 0, 6.3); fx.fill();
      fx.strokeStyle = LM.ink; fx.lineWidth = r * .3; fx.beginPath(); fx.ellipse(cx, cy, r * 1.0, r * 1.08, 0, 1.12 * Math.PI, 1.88 * Math.PI); fx.stroke(); fx.lineWidth = r * .1; fx.beginPath(); fx.ellipse(cx, cy, r * 1.0, r * 1.08, 0, 0, 1.0 * Math.PI); fx.stroke(); }
    else if (eye === 'wide') { fx.fillStyle = '#fff'; fx.beginPath(); fx.ellipse(cx, cy, r * 1.15, r * 1.3, 0, 0, 6.3); fx.fill(); fx.lineWidth = r * .18; fx.stroke(); fx.fillStyle = '#4A2A14'; fx.beginPath(); fx.arc(cx, cy, r * .62, 0, 6.3); fx.fill(); fx.fillStyle = LM.ink; fx.beginPath(); fx.arc(cx, cy, r * .32, 0, 6.3); fx.fill(); fx.fillStyle = '#fff'; fx.beginPath(); fx.arc(cx - r * .2, cy - r * .22, r * .18, 0, 6.3); fx.fill(); }
  }
  // brows
  { const e2 = e; fx.strokeStyle = '#2A1408'; fx.lineCap = 'round'; for (const s of [-1, 1]) { const cx = FX(s * LM.eyeX * 1.02), cy = FY(LM.browY + e.brow[0] + (s < 0 && e.eye === 'wink' ? .01 : 0)), w = FL(.026), tilt = e.brow[2] * s * -1;
      fx.lineWidth = w * .36; fx.beginPath(); fx.moveTo(cx - w * Math.cos(tilt) * s, cy - w * Math.sin(tilt) * s * -1 + FL(e.brow[1]) * -1); fx.lineTo(cx + w * Math.cos(tilt) * s, cy + w * Math.sin(tilt) * s * -1 + FL(e.brow[1]) * -1); fx.stroke(); } }
  // mouth
  if (e) {
    const mx = FX(0), my = FY(LM.mouthY), mw = FL(LM.mouthW);
    const m = e.mouth === 'talk' ? (talkOpen > .66 ? 'o2' : talkOpen > .33 ? 'grin' : 'small') : e.mouth;
    fx.fillStyle = '#4A1620'; fx.strokeStyle = LM.ink; fx.lineWidth = mw * .16;
    const mouth = (path, fill) => { fx.beginPath(); path(); if (fill) { fx.fillStyle = fill; fx.fill(); } fx.stroke(); };
    if (m === 'smile') { mouth(() => { fx.moveTo(mx - mw * .85, my - mw * .15); fx.quadraticCurveTo(mx, my + mw * 1.25, mx + mw * .85, my - mw * .15); fx.quadraticCurveTo(mx, my + mw * .05, mx - mw * .85, my - mw * .15); fx.closePath(); }, '#4A1620'); fx.fillStyle = '#fff'; fx.beginPath(); fx.moveTo(mx - mw * .7, my - mw * .13); fx.quadraticCurveTo(mx, my + mw * .12, mx + mw * .7, my - mw * .13); fx.quadraticCurveTo(mx, my - mw * .02, mx - mw * .7, my - mw * .13); fx.fill(); fx.fillStyle = '#E0607A'; fx.beginPath(); fx.ellipse(mx, my + mw * .5, mw * .36, mw * .17, 0, 0, 6.3); fx.fill(); }
    else if (m === 'grin') { mouth(() => { fx.moveTo(mx - mw, my - mw * .2); fx.quadraticCurveTo(mx, my + mw * 1.5, mx + mw, my - mw * .2); fx.closePath(); }, '#4A1620'); fx.fillStyle = '#fff'; fx.beginPath(); fx.moveTo(mx - mw * .85, my - mw * .17); fx.quadraticCurveTo(mx, my + mw * .22, mx + mw * .85, my - mw * .17); fx.quadraticCurveTo(mx, my - mw * .02, mx - mw * .85, my - mw * .17); fx.fill(); fx.fillStyle = '#E0607A'; fx.beginPath(); fx.ellipse(mx, my + mw * .62, mw * .42, mw * .2, 0, 0, 6.3); fx.fill(); }
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


// Arms become their own rigid pieces: triangles that bridge arm and body are given wholly to one side, so lifting an arm opens a clean crack at the armpit instead of dragging a web of skin
function splitArms(geo, si, sw) {
  const IL = [names.indexOf('shL'), names.indexOf('elL')], IR = [names.indexOf('shR'), names.indexOf('elR')], n = geo.attributes.position.count, idx = geo.index.array;
  const cls = new Int8Array(n); for (let i = 0; i < n; i++) { let l = 0, r = 0; for (let j = 0; j < 4; j++) { const b = si[i * 4 + j], w = sw[i * 4 + j]; if (IL.includes(b)) l += w; if (IR.includes(b)) r += w; } cls[i] = l > .5 ? 1 : r > .5 ? 2 : 0; }
  const A = geo.attributes, P = A.position.array, N = A.normal.array, U = A.uv.array, map = new Map(), oi = [], oc = [], ni = [];
  for (let t = 0; t < idx.length; t += 3) { const c = [cls[idx[t]], cls[idx[t + 1]], cls[idx[t + 2]]]; const tc = c[0] === c[1] || c[0] === c[2] ? c[0] : c[1] === c[2] ? c[1] : c[0];
    for (let j = 0; j < 3; j++) { const v = idx[t + j], k = v * 3 + tc; let m = map.get(k); if (m === undefined) { m = oi.length; map.set(k, m); oi.push(v); oc.push(tc); } ni.push(m); } }
  // plug the armholes: a slightly inset copy of the upper-arm / sleeve skin stays on the body, so lifting an arm never leaves a window in the shirt
  const base = oi.length, plug = new Map(), extra = []; const chestI = names.indexOf('chest');
  for (let t = 0; t < ni.length; t += 3) { const a = ni[t], b = ni[t + 1], c = ni[t + 2]; if (!oc[a] || oc[a] !== oc[b] || oc[a] !== oc[c]) continue; const cy = (P[oi[a] * 3 + 1] + P[oi[b] * 3 + 1] + P[oi[c] * 3 + 1]) / 3; if (cy < .5) continue;
    for (const q of [a, b, c]) { let m2 = plug.get(q); if (m2 === undefined) { m2 = base + plug.size; plug.set(q, m2); } extra.push(m2); } }
  const plugList = [...plug.keys()]; for (const q of plugList) { oi.push(oi[q]); oc.push(-1); } for (const e of extra) ni.push(e);
  const m = oi.length, P2 = new Float32Array(m * 3), N2 = new Float32Array(m * 3), U2 = new Float32Array(m * 2), S2 = new Uint16Array(m * 4), W2 = new Float32Array(m * 4);
  for (let q = 0; q < m; q++) { const v = oi[q], tc = oc[q]; for (let j = 0; j < 3; j++) { P2[q * 3 + j] = P[v * 3 + j]; N2[q * 3 + j] = N[v * 3 + j]; }
    if (tc < 0) { P2[q * 3] *= .86; U2[q * 2] = U[v * 2]; U2[q * 2 + 1] = U[v * 2 + 1]; S2[q * 4] = chestI; W2[q * 4] = 1; continue; } U2[q * 2] = U[v * 2]; U2[q * 2 + 1] = U[v * 2 + 1];
    let tot = 0; const ws = []; for (let j = 0; j < 4; j++) { const b = si[v * 4 + j], w = sw[v * 4 + j], isL = IL.includes(b), isR = IR.includes(b), ok = tc === 1 ? isL : tc === 2 ? isR : !(isL || isR); if (ok && w > 0) { ws.push([b, w]); tot += w; } }
    if (!ws.length) { ws.push([tc === 1 ? IL[0] : tc === 2 ? IR[0] : names.indexOf('chest'), 1]); tot = 1; }
    for (let j = 0; j < 4; j++) { S2[q * 4 + j] = j < ws.length ? ws[j][0] : 0; W2[q * 4 + j] = j < ws.length ? ws[j][1] / tot : 0; } }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(P2, 3)); g.setAttribute('normal', new THREE.BufferAttribute(N2, 3)); g.setAttribute('uv', new THREE.BufferAttribute(U2, 2));
  g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(S2, 4)); g.setAttribute('skinWeight', new THREE.Float32BufferAttribute(W2, 4)); g.setIndex(ni); return g;
}
function smoothFace(geo) {
  const pos = geo.attributes.position, n = pos.count, idx = geo.index.array, key = new Map(), gid = new Int32Array(n); let ng = 0;
  for (let i = 0; i < n; i++) { const k = Math.round(pos.getX(i) * 4000) + ',' + Math.round(pos.getY(i) * 4000) + ',' + Math.round(pos.getZ(i) * 4000); let g = key.get(k); if (g === undefined) { g = ng++; key.set(k, g); } gid[i] = g; }
  const nb = Array.from({ length: ng }, () => new Set()); for (let i = 0; i < idx.length; i += 3) for (let j = 0; j < 3; j++) { const a = gid[idx[i + j]], b = gid[idx[i + (j + 1) % 3]]; nb[a].add(b); nb[b].add(a); }
  const P = new Float32Array(ng * 3), M = new Float32Array(ng); for (let i = 0; i < n; i++) { const g = gid[i]; P[g * 3] = pos.getX(i); P[g * 3 + 1] = pos.getY(i); P[g * 3 + 2] = pos.getZ(i); }
  for (let g = 0; g < ng; g++) { const x = P[g * 3], y = P[g * 3 + 1], z = P[g * 3 + 2]; // face + cheeks, feathered; keep hair, ears and neck
    const fy = Math.min(1, Math.max(0, (y - .62) / .04)) * Math.min(1, Math.max(0, (.93 - y) / .04)), fx2 = Math.min(1, Math.max(0, (.135 - Math.abs(x)) / .03)), fz = Math.min(1, Math.max(0, (z - .02) / .04)); const nz = Math.hypot(x / .042, (y - .745) / .045); M[g] = fy * fx2 * fz * Math.min(1, Math.max(0, (nz - .8) / .5)); }
  for (let it = 0; it < 4; it++) { const Q = P.slice(); for (let g = 0; g < ng; g++) { if (M[g] < .01 || !nb[g].size) continue; let ax = 0, ay = 0, az = 0; nb[g].forEach(h => { ax += P[h * 3]; ay += P[h * 3 + 1]; az += P[h * 3 + 2]; }); const c = nb[g].size, l = .55 * M[g]; Q[g * 3] += (ax / c - P[g * 3]) * l; Q[g * 3 + 1] += (ay / c - P[g * 3 + 1]) * l; Q[g * 3 + 2] += (az / c - P[g * 3 + 2]) * l; } P.set(Q); }
  // close the open mouth: relax the mouth area into a smooth closed surface so painted mouths sit on the skin, not inside a hole
  const MM = new Float32Array(ng); for (let g = 0; g < ng; g++) { const x = P[g * 3], y = P[g * 3 + 1], z = P[g * 3 + 2]; const e = Math.hypot(x / .085, (y - .692) / .055); MM[g] = z > -.01 ? Math.min(1, Math.max(0, (1.12 - e) / .3)) : 0; }
  for (let it = 0; it < 90; it++) { const Q = P.slice(); for (let g = 0; g < ng; g++) { if (MM[g] < .01 || !nb[g].size) continue; let az = 0; nb[g].forEach(h => { az += P[h * 3 + 2]; }); const t = az / nb[g].size; if (t > P[g * 3 + 2]) Q[g * 3 + 2] += (t - P[g * 3 + 2]) * .6 * MM[g]; } P.set(Q); }
  for (let i = 0; i < n; i++) { const g = gid[i]; pos.setXYZ(i, P[g * 3], P[g * 3 + 1], P[g * 3 + 2]); }
  geo.computeVertexNormals();
  // the cut at UV seams leaves doubled vertices with split normals; share them
  const nrm = geo.attributes.normal, acc = new Float32Array(ng * 3); for (let i = 0; i < n; i++) { const g = gid[i]; acc[g * 3] += nrm.getX(i); acc[g * 3 + 1] += nrm.getY(i); acc[g * 3 + 2] += nrm.getZ(i); }
  for (let i = 0; i < n; i++) { const g = gid[i], l = Math.hypot(acc[g * 3], acc[g * 3 + 1], acc[g * 3 + 2]) || 1; nrm.setXYZ(i, acc[g * 3] / l, acc[g * 3 + 1] / l, acc[g * 3 + 2] / l); }
}

// ---------- build the character ----------
let skel = null, root = null;
const HEADI = names.indexOf('head'), CHESTI = names.indexOf('chest');
function build(bodyG, bodyImg, headG, headImg) {
  const first = g => { let m = null; g.scene.traverse(o => { if (o.isMesh && !m) m = o; }); return m; };
  // body: the new model without its own head (the old, better-liked head replaces it)
  let geo = first(bodyG).geometry.clone(); { const ix = geo.index.array, P = geo.attributes.position, out = [];
    for (let i = 0; i < ix.length; i += 3) { let cut = false; for (let j = 0; j < 3; j++) { const v = ix[i + j]; if (P.getY(v) > .655 && Math.abs(P.getX(v)) < .13) cut = true; } if (!cut) out.push(ix[i], ix[i + 1], ix[i + 2]); } geo.setIndex(out); }
  const pos = geo.attributes.position; const [si, sw] = skinAttrs(pos); geo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(si, 4)); geo.setAttribute('skinWeight', new THREE.Float32BufferAttribute(sw, 4));
  // head: rigid on the head bone, easing into the chest at the neck
  const hg = first(headG).geometry.clone(); smoothFace(hg); const hp = hg.attributes.position, hn = hp.count, hsi = new Uint16Array(hn * 4), hsw = new Float32Array(hn * 4);
  for (let i = 0; i < hn; i++) { const w = sstep(.64, .70, hp.getY(i)); hsi[i * 4] = HEADI; hsw[i * 4] = w; hsi[i * 4 + 1] = CHESTI; hsw[i * 4 + 1] = 1 - w; if (w >= 1) { hsw[i * 4 + 1] = 0; } }
  hg.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(hsi, 4)); hg.setAttribute('skinWeight', new THREE.Float32BufferAttribute(hsw, 4));
  root = new THREE.Group(); root.add(B.hips); root.updateMatrixWorld(true); skel = new THREE.Skeleton(bones);
  const mkTex = im => { const t = new THREE.Texture(im); t.flipY = false; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; t.needsUpdate = true; return t; };
  const mk = (g, mat, cast) => { const m = new THREE.SkinnedMesh(g, mat); m.frustumCulled = false; m.bind(skel, new THREE.Matrix4()); m.castShadow = !!cast; return m; };
  const body = mk(geo, new THREE.MeshToonMaterial({ map: mkTex(bodyImg), gradientMap: gm, side: THREE.DoubleSide }), true), head = mk(hg, new THREE.MeshToonMaterial({ map: mkTex(headImg), gradientMap: gm }), true);
  const bink = mk(geo, INKM), hink = mk(hg, INKM);
  // face decal on the head
  const idx = hg.index.array, nrm = hg.attributes.normal, keep = [];
  for (let i = 0; i < idx.length; i += 3) { let ok = true; for (let j = 0; j < 3; j++) { const v = idx[i + j], x = hp.getX(v), y = hp.getY(v), z = hp.getZ(v); if (y < FC.y0 || y > FC.y1 || Math.abs(x) > FC.x1 || z < 0.06 || nrm.getZ(v) < 0.1) ok = false; } if (ok) keep.push(idx[i], idx[i + 1], idx[i + 2]); }
  const fg = new THREE.BufferGeometry(); for (const k of ['position', 'normal', 'skinIndex', 'skinWeight']) fg.setAttribute(k, hg.attributes[k]);
  const uv = new Float32Array(hn * 2); for (let i = 0; i < hn; i++) { uv[i * 2] = (hp.getX(i) - FC.x0) / (FC.x1 - FC.x0); uv[i * 2 + 1] = (hp.getY(i) - FC.y0) / (FC.y1 - FC.y0); }
  fg.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); fg.setIndex(keep);
  const face = mk(fg, FACE_MAT); face.renderOrder = 3;
  root.scale.setScalar(S);
  const g = new THREE.Group(); g.add(root); root.add(body, bink, head, hink, face); world.add(g); return g;
}
let LEO = null;
const loadImg = src => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
const b64buf = s => { const b = atob(s), u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u.buffer; };
async function load() {
  const emb = !!window.__LEO_B64, get = async (k, f) => emb ? b64buf(window[k]) : await (await fetch('leo/' + f)).arrayBuffer();
  const parse = buf => new Promise((res, rej) => new GLTFLoader().parse(buf, '', res, rej));
  const [bg, hgl] = await Promise.all([get('__LEO_B64', 'boy_notex.glb').then(parse), get('__HEAD_B64', 'head_notex.glb').then(parse)]);
  const [bi, hi] = await Promise.all([loadImg(emb ? window.__LEO_TEX : 'leo/boy_tex.jpg'), loadImg(emb ? window.__HEAD_TEX : 'leo/head_tex.jpg')]);
  LEO = build(bg, bi, hgl, hi); drawFace(); ftex.needsUpdate = true;
}
load().catch(err);

// ---------- poses ----------
const REST = {}; names.forEach(n => REST[n] = [0, 0, 0]);
let act = 'idle', actT = 0, actStart = 0, pos0 = new THREE.Vector3();
const QT = new THREE.Quaternion(), EU = new THREE.Euler(), QHL = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -Math.PI / 2), QHR = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 2);
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
  for (const n of names) { for (let i = 0; i < 3; i++) smooth[n][i] += (P[n][i] - smooth[n][i]) * k;
    const q = QT.setFromEuler(EU.set(smooth[n][0], smooth[n][1], smooth[n][2], 'XYZ'));
    if (n === 'shL') B[n].quaternion.copy(q).multiply(QHL); else if (n === 'shR') B[n].quaternion.copy(q).multiply(QHR);
    else if (n === 'elL') B[n].quaternion.copy(QHL).invert().multiply(q).multiply(QHL); else if (n === 'elR') B[n].quaternion.copy(QHR).invert().multiply(q).multiply(QHR);
    else B[n].quaternion.copy(q); }
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
