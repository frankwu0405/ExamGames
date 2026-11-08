// Varn, guard of the deep stones — a whale-like sea guardian (from Frank's character sheet):
// a big round whale head with a gentle wide smile and throat grooves, wise glowing gold-and-teal eyes,
// a glowing crest of blue-violet tendrils, stone-like teal and lavender skin with glowing glyphs,
// crystal fins along the back, four jointed flippers with white crystal claws, and a whale tail fluke.
// The body follows a living spine, so he can circle under the ice, burst up, rest beside the boat, rear up, or dive.
import { THREE, INK, toon, outline, builder, onTick, tween } from './gfx.js';
import { glowTex, cloudTex, glowSprite } from './effects.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const M = 110, R = 80;                                      // rings along the body × points around each ring
const SPOW = 1.65;                                         // more rings near the head
const sOf = i => Math.pow(i / (M - 1), SPOW), iOf = s => Math.max(0, Math.min(M - 1, Math.round(Math.pow(s, 1 / SPOW) * (M - 1))));
const PROFILE = [[0.05, 1.6], [0.07, 1.85], [0.13, 2.2], [0.22, 2.38], [0.33, 2.3], [0.45, 2.0], [0.58, 1.52], [0.72, 1.02], [0.86, 0.62], [0.96, 0.4], [1, 0.32]];
const radiusAt = s => { if (s < 0.05) { const u = 1 - s / 0.05; return Math.max(0.04, 1.6 * Math.pow(1 - u * u, 0.34)); } for (let i = 1; i < PROFILE.length; i++) if (s <= PROFILE[i][0]) { const [a, ra] = PROFILE[i - 1], [b, rb] = PROFILE[i]; const k = (s - a) / (b - a); return ra + (rb - ra) * (k * k * (3 - 2 * k)); } return 0.32; };
let LEN = 22;
// the sculpted head: eye socket, heavy brow, cheek roll, nose pad, forehead dome, cheek puff and an upper-lip ridge, all one surface
const g2 = (a, b, sa, sb) => Math.exp(-(a * a) / (2 * sa * sa) - (b * b) / (2 * sb * sb));
function headDisp(s, a) {
  if (s > 0.3) return 0; const aa = a > Math.PI ? 2 * Math.PI - a : a, L = LEN, W2 = 2.1;
  const dE = (s - 0.11) * L, aE = (aa - 1.152) * W2; let d = 0;
  d += -0.3 * g2(dE, aE, 0.5, 0.5);                       // socket the eye sits in
  d += 0.26 * g2(dE, aE + 0.52, 0.8, 0.24);               // heavy brow fold above
  d += 0.2 * g2(dE, aE - 0.5, 0.62, 0.22);                // lower lid / cheek roll below
  d += 0.14 * g2((s - 0.036) * L, aa * W2, 0.55, 0.5);    // nose pad
  d += 0.22 * g2((s - 0.12) * L, aa * W2, 1.3, 1.0);      // forehead dome
  d += 0.2 * g2((s - 0.145) * L, (aa - 1.95) * W2, 0.8, 0.45);  // cheek puff where the smile ends
  const as = (150 - 34 * Math.sin(Math.max(0, Math.min(1, (s - 0.004) / 0.15)) * Math.PI / 2)) * Math.PI / 180, win = s < 0.17 ? 1 : Math.max(0, 1 - (s - 0.17) / 0.03);
  d += 0.1 * win * Math.exp(-Math.pow((aa - (as - 0.14)) * W2, 2) / (2 * 0.13 * 0.13));   // upper lip
  return d * Math.min(1, s / 0.02);
}
const WIDE = 1.12, flatBelly = c => (c < 0 ? 0.86 : 1);

// ---------------------------------------------------------------- skin: painted once along the whole body (x = around, y = head → tail)
function skinTextures() {
  const W = 1024, H = 2048, X = (deg, side) => (side > 0 ? deg / 360 : 1 - deg / 360) * W, Y = s => s * H;
  const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, W, 0);
  [[0, '#3B8C9A'], [0.1, '#479EA6'], [0.2, '#5FAEAE'], [0.3, '#8A9FCB'], [0.4, '#B9D6D2'], [0.5, '#D3E6E1'], [0.6, '#B9D6D2'], [0.7, '#8A9FCB'], [0.8, '#5FAEAE'], [0.9, '#479EA6'], [1, '#3B8C9A']].forEach(([k, col]) => g.addColorStop(k, col));
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  // lavender and deep-teal patches, like the painting
  for (let i = 0; i < 140; i++) { const px = Math.random() * W, py = Math.random() * H, r = 30 + Math.random() * 90; const gg = x.createRadialGradient(px, py, 0, px, py, r);
    gg.addColorStop(0, i % 3 ? 'rgba(150,130,220,.32)' : 'rgba(40,120,140,.3)'); gg.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = gg; x.fillRect(px - r, py - r, r * 2, r * 2); }
  // stony bumps (more on the head and back)
  for (let i = 0; i < 900; i++) { const top = Math.random() < 0.7; const px = top ? (Math.random() < 0.5 ? Math.random() * W * 0.22 : W - Math.random() * W * 0.22) : Math.random() * W; const py = Math.random() * H * (top ? 0.7 : 1); const r = 2 + Math.random() * 6;
    const gg = x.createRadialGradient(px - r * 0.35, py - r * 0.35, 0, px, py, r); gg.addColorStop(0, 'rgba(235,250,248,.85)'); gg.addColorStop(0.6, 'rgba(150,200,205,.35)'); gg.addColorStop(1, 'rgba(40,80,100,.35)'); x.fillStyle = gg; x.beginPath(); x.arc(px, py, r, 0, 7); x.fill(); }
  // eye socket: soft shadow, lid crease, heavy brow fold, cheek roll and little wrinkles (the eye ball is sunk into this)
  [1, -1].forEach(sd => { const cx = X(66, sd), cy = Y(0.11), dx = sd > 0 ? -1 : 1;
    const sh = x.createRadialGradient(cx, cy, 14, cx, cy, 58); sh.addColorStop(0, 'rgba(20,60,76,.55)'); sh.addColorStop(1, 'rgba(20,60,76,0)'); x.fillStyle = sh; x.beginPath(); x.arc(cx, cy, 58, 0, 7); x.fill();
    x.lineCap = 'round'; x.strokeStyle = 'rgba(28,66,82,.8)'; x.lineWidth = 6; x.beginPath(); x.ellipse(cx, cy, 33, 36, 0, 0, 7); x.stroke();
    x.strokeStyle = 'rgba(28,66,82,.35)'; x.lineWidth = 5; x.beginPath(); x.moveTo(cx + dx * 34, cy - 40); x.quadraticCurveTo(cx + dx * 56, cy, cx + dx * 34, cy + 40); x.stroke();      // heavy brow fold
    x.strokeStyle = 'rgba(28,66,82,.4)'; x.lineWidth = 6; x.beginPath(); x.moveTo(cx - dx * 24, cy - 44); x.quadraticCurveTo(cx - dx * 52, cy, cx - dx * 24, cy + 44); x.stroke();   // cheek roll
    x.strokeStyle = 'rgba(28,66,82,.4)'; x.lineWidth = 4; [[-14, 0], [0, 6], [14, 12]].forEach(([o, r]) => { x.beginPath(); x.moveTo(cx + dx * o * 0.4, cy + 44 + r); x.lineTo(cx + dx * (o * 0.4 + 6), cy + 70 + r); x.stroke(); });   // eye-corner wrinkles
  });
  // blend the snout tip to one soft colour (all the texture meets at one point there), then add two nostrils
  { const fg = x.createLinearGradient(0, 0, 0, H * 0.07); fg.addColorStop(0, 'rgba(120,184,186,1)'); fg.addColorStop(0.55, 'rgba(120,184,186,.85)'); fg.addColorStop(1, 'rgba(120,184,186,0)'); x.fillStyle = fg; x.fillRect(0, 0, W, H * 0.07);
    [1, -1].forEach(sd => { x.fillStyle = 'rgba(30,60,80,.7)'; x.beginPath(); x.ellipse(X(14, sd), Y(0.045), 9, 18, 0, 0, 7); x.fill(); }); }
  // the lower jaw is paler, with throat grooves, and a long gentle smile
  [1, -1].forEach(side => {
    x.fillStyle = 'rgba(232,244,240,.85)'; x.beginPath(); x.moveTo(X(150, side), Y(0.004));
    for (let k = 0; k <= 20; k++) { const s = 0.004 + k / 20 * 0.15; x.lineTo(X(150 - 34 * Math.sin(k / 20 * Math.PI / 2), side), Y(s)); }
    x.lineTo(X(180, side), Y(0.2)); x.lineTo(X(180, side), Y(0.004)); x.fill();
    x.strokeStyle = 'rgba(80,110,130,.55)'; x.lineWidth = 3;
    for (let d = 112; d <= 180; d += 9) { x.beginPath(); x.moveTo(X(d, side), Y(0.07 + (d - 112) * 0.0006)); x.lineTo(X(d, side), Y(0.3)); x.stroke(); }
    x.strokeStyle = '#2F5C6B'; x.lineWidth = 6; x.lineCap = 'round'; x.beginPath();
    for (let k = 0; k <= 30; k++) { const t = k / 30, s = 0.004 + t * 0.15, deg = 150 - 34 * Math.sin(t * Math.PI / 2) - (t > 0.88 ? (t - 0.88) * 90 : 0); k ? x.lineTo(X(deg, side), Y(s)) : x.moveTo(X(deg, side), Y(s)); }
    x.stroke();
  });
  const map = new THREE.CanvasTexture(c); map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = 4;
  // glowing glyphs: spirals, squares, diamonds, zig-zags along both sides (a soft inner glow everywhere else)
  const e = document.createElement('canvas'); e.width = W; e.height = H; const y2 = e.getContext('2d'); y2.fillStyle = '#0D1C24'; y2.fillRect(0, 0, W, H);
  y2.lineCap = 'round'; y2.lineJoin = 'round';
  const pen = col => { y2.strokeStyle = col; y2.lineWidth = 6; y2.shadowColor = col; y2.shadowBlur = 16; };
  const spiral = (cx, cy, r, col) => { pen(col); y2.beginPath(); for (let a = 0; a < Math.PI * 5; a += 0.12) { const rr = r * a / (Math.PI * 5); y2.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } y2.stroke(); };
  const square = (cx, cy, r, col) => { pen(col); y2.strokeRect(cx - r, cy - r, r * 2, r * 2); y2.strokeRect(cx - r * 0.4, cy - r * 0.4, r * 0.8, r * 0.8); };
  const diamond = (cx, cy, r, col) => { pen(col); y2.beginPath(); y2.moveTo(cx, cy - r); y2.lineTo(cx + r, cy); y2.lineTo(cx, cy + r); y2.lineTo(cx - r, cy); y2.closePath(); y2.stroke(); };
  const zig = (cx, cy, col) => { pen(col); y2.beginPath(); y2.moveTo(cx - 50, cy); for (let k = 0; k < 6; k++) y2.lineTo(cx - 40 + k * 18, cy + (k % 2 ? -12 : 12)); y2.stroke(); };
  const glyphs = [spiral, square, diamond, square, spiral, diamond];
  [1, -1].forEach(side => { let n = 0; for (let s = 0.24; s < 0.86; s += 0.075, n++) { const cx = X(78 + (n % 2) * 14, side), cy = Y(s), col = n % 3 ? '#7FF6FF' : '#C69BFF', r = 30 * (1 - s * 0.5);
    glyphs[n % glyphs.length](cx, cy, r, col); if (n % 2) zig(X(60, side), cy + 70, '#7FF6FF'); else { y2.fillStyle = col; for (let k = 0; k < 3; k++) { y2.beginPath(); y2.arc(X(112, side), cy - 20 + k * 18, 4, 0, 7); y2.fill(); } } } });
  spiral(X(28, 1), Y(0.11), 26, '#7FF6FF'); spiral(X(28, -1), Y(0.11), 26, '#7FF6FF');   // a glyph on each side of the forehead
  const emi = new THREE.CanvasTexture(e); emi.colorSpace = THREE.SRGBColorSpace;
  return { map, emi };
}
function eyeTexture() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 128; const x = c.getContext('2d');
  const SK = '#4C9CA5'; x.fillStyle = SK; x.fillRect(0, 0, 256, 128);
  const cx = 128, cy = 64, R = 34;
  let g = x.createRadialGradient(cx, cy, 0, cx, cy, R); g.addColorStop(0, '#0C1E26'); g.addColorStop(0.2, '#0C1E26'); g.addColorStop(0.24, '#62F0DE'); g.addColorStop(0.6, '#2EC0BA'); g.addColorStop(0.78, '#F0C562'); g.addColorStop(0.92, '#B8862E'); g.addColorStop(1, '#6B5320');
  x.fillStyle = g; x.beginPath(); x.arc(cx, cy, R, 0, 7); x.fill();
  x.fillStyle = 'rgba(255,255,255,.95)'; x.beginPath(); x.arc(cx - 15, cy - 15, 10, 0, 7); x.fill(); x.beginPath(); x.arc(cx + 14, cy + 15, 4.5, 0, 7); x.fill();
  // gentle, wise lids: the upper lid droops a little over the iris, the lower one rises slightly
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
// a soft glowing edge (magic, a little see-through)
function rimMaterial(color, push, k = 1) {
  return new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uColor: { value: new THREE.Color(color) }, uK: { value: k }, uPush: { value: push } }]),
    vertexShader: `uniform float uPush; varying float vRim; varying float vD;
      void main(){ vec4 mv = modelViewMatrix * vec4(position + normal * uPush, 1.0); vec3 n = normalize(normalMatrix * normal); vec3 v = normalize(-mv.xyz);
        vRim = pow(1.0 - abs(dot(n, v)), 2.6); vD = -mv.z; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform vec3 uColor; uniform float uK; uniform float fogNear; uniform float fogFar; varying float vRim; varying float vD;
      void main(){ float f = 1.0 - smoothstep(fogNear, fogFar * 1.3, vD); gl_FragColor = vec4(uColor * vRim * uK * f, 1.0); }`,
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: true,
  });
}
function inkShell(push) {
  const m = new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide });
  m.onBeforeCompile = sh => { sh.vertexShader = sh.vertexShader.replace('#include <begin_vertex>', `vec3 transformed = position + normal * ${push.toFixed(3)};`); };
  return m;
}

// ---------------------------------------------------------------- poses (spine points, head first, in his own space; the boat is at 0,0,0 facing -z; water is y = 0)
const P = (...a) => a.map(([x, y, z]) => new THREE.Vector3(x, y, z));
const POSES = {
  hidden: () => P([0, -14, -8], [0, -14, -10.2], [0, -14, -12.4], [0, -14, -14.6], [0, -14, -16.8], [0, -14, -19], [0, -14, -21.2], [0, -14, -23.4], [0, -14, -25.6]),
  // a big glowing shape swimming in a ring under the ice
  circle: t => Array.from({ length: 9 }, (_, i) => { const a = t * 0.5 - i * 0.29; return new THREE.Vector3(Math.cos(a) * 7.5, -9.5, Math.sin(a) * 7.5 - 1); }),
  // bursting up through the ice in front of the boat, chest and front flippers out
  rise: () => P([1.2, 5.6, -6.8], [1.2, 4.4, -8.6], [1.1, 2.6, -10.2], [1, 0.6, -11.4], [0.9, -1.5, -12.4], [0.8, -3.6, -13.2], [0.8, -5.6, -13.6], [1, -7.4, -13.2], [1.2, -8.8, -12.2]),
  // resting his great head on the ice right beside the boat, looking at the kids
  loom: () => P([-4.8, 1.5, -2.4], [-6.2, 1.7, -4.1], [-7.4, 1.4, -5.9], [-8.4, 0.6, -7.8], [-9.0, -0.6, -9.8], [-9.2, -2, -11.8], [-9.0, -3.4, -13.8], [-8.6, -4.6, -15.8], [-8.0, -5.6, -17.6]),
  // rearing up high, leaning over the boat
  rear: () => P([0, 6.6, -4.6], [0, 6.2, -6.8], [0, 4.8, -8.5], [0.2, 2.8, -9.8], [0.4, 0.6, -10.8], [0.6, -1.6, -11.6], [0.8, -3.8, -12.2], [1, -5.8, -12.4], [1.2, -7.6, -12]),
  // head down into the water, tail fluke lifted high beside the boat
  tailUp: () => P([1.5, -6, -15.7], [1.5, -4.2, -14.6], [1.5, -2.6, -13.2], [1.5, -1.2, -11.7], [1.5, 0.4, -10.0], [1.5, 2.6, -8.8], [1.5, 5, -8.2], [1.5, 7.4, -8.0], [1.5, 9.8, -8.0]),
  // halfway through the tail lift: head dives forward and down near the boat while the tail swings up and away over the water, so his back stays on top the whole time (turning the other way round would roll him belly-up)
  turnOver: () => P([1.20, -3.5, -5.5], [1.24, -2.47, -7.44], [1.28, -1.44, -9.38], [1.32, -0.41, -11.32], [1.36, 0.62, -13.26], [1.40, 1.65, -15.2], [1.44, 2.68, -17.14], [1.48, 3.71, -19.08], [1.52, 4.74, -21.02]),
  // …and slammed down flat onto the ice
  tailSmash: () => P([-4, -5, -12], [-2.6, -3.4, -11], [-1, -1.6, -10], [0.6, -0.4, -9], [2, 0.4, -7.8], [3, 0.6, -6.2], [3.6, 0.5, -4.6], [3.9, 0.3, -3], [4, 0.2, -1.4]),
  // diving back into the deep in one great arc
  dive: () => P([0.8, -6, -9.5], [0.6, -3.6, -10.5], [0.5, -1.2, -11.8], [0.4, 1, -13.4], [0.4, 2.6, -15.4], [0.5, 3.2, -17.6], [0.6, 2.8, -19.8], [0.8, 1.8, -21.8], [1, 0.8, -23.4]),
  gone: () => P([1, -16, -14], [1, -15, -16], [1, -14, -18], [1, -13, -20], [1, -12, -22], [1, -11, -24], [1, -10, -26], [1, -9, -28], [1, -8, -30]),
};
POSES.arch = POSES.rise;
// swimming level (a side view, like the character sheet)
POSES.straight = () => Array.from({ length: 9 }, (_, i) => new THREE.Vector3(11 - i * 2.75, 3, -12));
POSES.swim = () => Array.from({ length: 9 }, (_, i) => new THREE.Vector3(8 - i * 2.2, 3 + Math.sin(i * 0.7) * 0.4 + (i > 5 ? Math.pow(i - 5, 2) * 0.18 : 0), -12));

// ---- the showcase: a time-based swim, designed as a path the head follows with the whole body trailing exactly along it
export const SHOW = { mode: 'cruise', flap: 0, rate: 1, tail: 0 };
const SEG = 2.45;
const SHOWPATH = {
  // a wide lazy figure-of-eight, rising and sinking, banking through the turns
  cruise: s => { const a = s / 15; return new THREE.Vector3(Math.sin(a) * 17, Math.sin(a * 2) * 3.2 + Math.sin(a * 0.5) * 1.4, Math.sin(a * 2) * 9); },
  // one slow, tight spiral coil that rises and falls, like a whale drifting in a dream
  hover: s => { const a = s / 8.5, r = 8.4 + Math.sin(s / 20) * 1.6; return new THREE.Vector3(Math.cos(a) * r, Math.sin(s / 11) * 4.2, Math.sin(a) * r); },
  // loop-the-loop in a vertical ring that slowly turns round, so the loop sweeps the whole scene
  loop: s => { const a = s / 8.6, ps = s * 0.012, e1x = Math.cos(ps), e1z = Math.sin(ps); const x = Math.sin(a) * 8.6, y = (1 - Math.cos(a)) * 8.6 - 8.6; return new THREE.Vector3(e1x * x, y * 0.95, e1z * x + 0); },
  // the sky dance: a corkscrew that climbs and dives, big and fast
  corkscrew: s => { const a = s / 11, r = 10 + Math.sin(s / 30) * 3; return new THREE.Vector3(Math.cos(a) * r, Math.sin(s / 17) * 7, Math.sin(a) * r * 0.8 + Math.cos(s / 23) * 6); },
};
SHOW.speeds = { cruise: 5.2, hover: 2.4, loop: 6.4, corkscrew: 6.8 };
SHOW.amp = { cruise: 0.9, hover: 0.55, loop: 0.7, corkscrew: 1.1 };
// ---- in place: the same swimming wave, flippers and tail, but the body stays centred on the spot (for inspecting him)
SHOW.inplace = { amp: 0.9, speed: 1, bob: 0.5 };
POSES.inplace = t => {
  const I = SHOW.inplace, A = I.amp, r = I.speed, L = SEG * 8, out = [];
  for (let i = 0; i < 9; i++) { const f = Math.pow(i / 8, 1.0) * (1 + (i > 5 ? (i - 5) * 0.35 : 0)), w = t * 3.1 * r - i * 0.85;
    out.push(new THREE.Vector3(L / 2 - i * SEG, Math.sin(w + 1.1) * A * f * 1.2 + Math.sin(t * 0.9 * r) * I.bob, Math.sin(w) * A * f * 0.8)); }
  for (let i = 1; i < 9; i++) { const v = out[i].clone().sub(out[i - 1]); out[i] = v.setLength(SEG).add(out[i - 1]); }
  const cx = (out[0].x + out[8].x) / 2; out.forEach(p => { p.x -= cx; });
  return out;
};
POSES.show = t => {
  const m = SHOW.mode, path = SHOWPATH[m], sp = SHOW.speeds[m] * SHOW.rate, u = t * sp, A = SHOW.amp[m] * Math.min(1, 0.4 + SHOW.rate * 0.6);
  // the body is laid along the path with every joint exactly SEG from the last, so tight turns and slow-downs can never squash or bunch it up
  const out = [path(u)], d0 = new THREE.Vector3(); let d = 0;
  for (let i = 1; i < 9; i++) { const prev = out[i - 1]; let lo = d, hi = d; for (let k = 1; k < 400; k++) { hi = d + k * 0.06; if (path(u - hi).distanceTo(prev) >= SEG) break; lo = hi; }
    for (let k = 0; k < 8; k++) { const mid = (lo + hi) / 2; if (path(u - mid).distanceTo(prev) >= SEG) hi = mid; else lo = mid; } d = hi; out.push(path(u - d)); }
  // the swimming wave: the body ripples sideways more and more towards the tail
  const res = out.map((p, i) => { const f = Math.pow(i / 8, 1.0) * (1 + (i > 5 ? (i - 5) * 0.35 : 0)), w = t * 3.1 * Math.min(1.6, SHOW.rate) - i * 0.85, q = d0.copy(out[Math.max(0, i - 1)]).sub(out[Math.min(8, i + 1)]); q.y = 0; if (q.lengthSq() < 1e-6) q.set(1, 0, 0); q.normalize();
    return new THREE.Vector3(p.x - q.z * Math.sin(w) * A * f * 1.7, p.y + Math.sin(w + 1.1) * A * f * 0.9, p.z + q.x * Math.sin(w) * A * f * 1.7); });
  for (let i = 1; i < 9; i++) { const v = res[i].sub(res[i - 1]); res[i] = v.setLength(SEG).add(res[i - 1]); }
  return res;
};
export function makeVarn(parent) {
  const V = new THREE.Group(); parent.add(V);
  const { map, emi } = skinTextures();
  const skin = toon(0xFFFFFF, { map, emissiveMap: emi, emissive: 0xFFFFFF, emissiveIntensity: 1 });
  const iceM = toon(0xBDEFFA, { emissive: 0x4FB8D8, emissiveIntensity: 0.5, transparent: true, opacity: 0.78 });
  const clawM = toon(0xF4FAFF, { emissive: 0xBFDDEB, emissiveIntensity: 0.25 });
  const flipM = toon(0x5DB4B8, { emissive: 0x1F3E48, emissiveIntensity: 0.6 });
  // ---- one smooth body, head to tail, rebuilt every frame around the spine
  const geo = new THREE.BufferGeometry(); const pos = new Float32Array(M * (R + 1) * 3), uv = new Float32Array(M * (R + 1) * 2), idx = [];
  for (let i = 0; i < M; i++) for (let j = 0; j <= R; j++) { uv[(i * (R + 1) + j) * 2] = j / R; uv[(i * (R + 1) + j) * 2 + 1] = 1 - sOf(i); }
  for (let i = 0; i < M - 1; i++) for (let j = 0; j < R; j++) { const a = i * (R + 1) + j, b = a + R + 1; idx.push(a, a + 1, b, b, a + 1, b + 1); }
  geo.setIndex(idx); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  const body = new THREE.Mesh(geo, skin); body.frustumCulled = false; V.add(body);
  const ink = new THREE.Mesh(geo, inkShell(0.07)); ink.frustumCulled = false; V.add(ink);
  const rim = new THREE.Mesh(geo, rimMaterial(0x9FF6FF, 0.03, 0.35)); rim.frustumCulled = false; V.add(rim);

  // ---- things that sit on the skin, placed by (how far along the body, angle around it, lift off the skin)
  // their own frame: y = out of the skin, z = towards the head, x = across
  const onSkin = [];
  const stick = (obj, s, deg, lift = 0) => { V.add(obj); onSkin.push({ obj, s, a: deg * Math.PI / 180, lift }); return obj; };
  // eyes: wise, glowing gold and teal, under a heavy lid
  const eyeTex = eyeTexture(), eyes = [];
  [1, -1].forEach(sd => { const g = new THREE.Group(); const b = builder(g);
    const ball = b.add(new THREE.SphereGeometry(0.52, 28, 18), new THREE.MeshBasicMaterial({ map: eyeTex }), 0, 0, 0, { ry: -Math.PI / 2, line: 0.04 }); const lid = ball;
    const halo = glowSprite(0x9FFFF0, 1.7, 0.5); halo.position.z = 0.35; g.add(halo); g.userData = { ball, lid, halo, sd };
    stick(g, 0.11, sd * 66, -0.3); eyes.push(g); });
  // brow ridges, soft cheeks and a rounded forehead, so the face has form and a friendly look
  { const np = new THREE.Group(); const nb = builder(np); const n2 = nb.ball(0.55, toon(0x93BEC0), 0, 0, 0, { line: 0.035, seg: 22 }); n2.scale.set(1.15, 0.42, 1.0); stick(np, 0.04, 0, -0.2); }
  const eyeLight = new THREE.PointLight(0xBFFCFF, 0, 16, 1.4); V.add(eyeLight);
  // stony bumps over the head and along the back
  const bumpM = toon(0xBFE6E4);
  for (let i = 0; i < 46; i++) { const s = 0.03 + Math.random() * (i < 26 ? 0.2 : 0.6), d = (Math.random() - 0.5) * (i < 26 ? 110 : 70); const m = new THREE.Mesh(new THREE.SphereGeometry(0.07 + Math.random() * 0.1, 8, 6), bumpM); outline(m, 0.015); stick(m, s, d, -0.03); }
  // crystal fins along the back (big, uneven, leaning back), small ones on the tail
  const FINS = [[0.25, 1.5], [0.32, 2.6], [0.4, 3.1], [0.48, 2.4], [0.56, 2.0], [0.65, 1.5], [0.74, 1.1], [0.83, 0.85]];
  FINS.forEach(([s, h], k) => { const g = new THREE.Group(); const m = builder(g).add(new THREE.ConeGeometry(0.85 * Math.sqrt(h / 2), h, 4), iceM, 0, h / 2 - 0.15, 0, { rx: -0.5, line: 0.03 }); m.scale.set(0.28, 1, 1);
    if (k % 3 === 1) builder(g).add(new THREE.ConeGeometry(0.3, h * 0.5, 4), iceM, 0, h * 0.25, -0.5, { rx: -0.7, line: 0.02 }).scale.set(0.3, 1, 1);
    stick(g, s, (k % 2 ? 6 : -6), -0.15); });
  // four jointed flippers with white crystal claws (built for one side, mirrored for the other)
  const flippers = [];
  [[0.27, 1, 1], [0.27, -1, 1], [0.6, 1, 0.75], [0.6, -1, 0.75]].forEach(([s, sd, k]) => {
    const root = new THREE.Group(), side = new THREE.Group(); side.scale.x = sd; root.add(side);
    const arm = new THREE.Group(); side.add(arm); const fl = new THREE.Group(); fl.scale.set(1, 1, 0.62); arm.add(fl); const b = builder(fl);
    // slim at the shoulder, widening smoothly to a big paw; raised bands mark the sections
    const rf = t => (0.3 + 0.4 * Math.pow(t, 1.25)) * (1 + 0.07 * Math.sin(t * Math.PI * 4.5)) * k, X = t => 2.5 * k * t, Yy = t => -0.3 * k * t;
    b.tube([[0, 0, 0], [X(0.33), Yy(0.33), 0], [X(0.66), Yy(0.66), 0], [X(1), Yy(1), 0]], rf, flipM, { line: 0.03 });
    b.add(new THREE.SphereGeometry(rf(0) * 1.02, 14, 10), flipM, 0, 0, 0, { line: 0.03 });
    b.add(new THREE.SphereGeometry(rf(1), 18, 12), flipM, X(1), Yy(1), 0, { line: 0.03 });
    const el = b.add(new THREE.ConeGeometry(0.1 * k, 0.5 * k, 4), iceM, X(0.3), rf(0.3) + 0.15 * k, 0, { line: 0.015 });
    const fore = new THREE.Group(); arm.add(fore); const hand = new THREE.Group(); hand.position.set(X(1), Yy(1), 0); fore.add(hand); const hb = builder(hand);
    for (let c = -1; c <= 1; c++) { const zc = c * 0.34 * k; hb.tube([[0.1 * k, -0.15 * k, zc], [0.65 * k, -0.2 * k, zc], [1.1 * k, -0.5 * k, zc], [1.25 * k, -1.05 * k, zc]], t => (0.17 * (1 - t) + 0.012) * k, clawM, { line: 0.012 }); }
    root.userData = { arm, fore, hand, ph: s * 7 + (sd > 0 ? 0 : 1.5) }; stick(root, s, sd * 112, -0.3); flippers.push(root); });
  // the whale tail fluke
  const fluke = new THREE.Group(); V.add(fluke); fluke.scale.setScalar(1.25);
  { const sh = new THREE.Shape(); sh.moveTo(0, 0.4); sh.bezierCurveTo(1.2, 0.5, 2.6, -0.4, 3.6, -1.8); sh.bezierCurveTo(2.6, -1.5, 1.6, -1.2, 1.0, -1.6); sh.bezierCurveTo(0.6, -1.2, 0.2, -1.0, 0, -0.9); sh.lineTo(0, 0.4);
    const fg = new THREE.ExtrudeGeometry(sh, { depth: 0.22, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.08, bevelSegments: 2 }); fg.translate(0, 0, -0.11);
    [1, -1].forEach(sd => { const m = new THREE.Mesh(fg, flipM); m.rotation.x = -Math.PI / 2; m.scale.x = sd; outline(m, 0.04); fluke.add(m); }); }
  // the glowing crest: soft tendrils of light rising from the top of the head
  const tex = glowTex(), crest = [];
  for (let k = 0; k < 20; k++) { const strand = [], n = 26; const s0 = 0.06 + (k % 9) * 0.02, a0 = ((k % 2 ? 1 : -1) * (6 + (k % 5) * 9)) * Math.PI / 180;
    for (let j = 0; j < n; j++) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: new THREE.Color(0x7FEFFF).lerp(new THREE.Color(k % 3 ? 0x8F5BFF : 0xB48CFF), Math.min(1, j / 12)), transparent: true, opacity: 0.95 * (1 - j / (n + 2)), blending: THREE.AdditiveBlending, depthWrite: false }));
      sp.scale.setScalar(1.05 - j * 0.032); V.add(sp); strand.push(sp); }
    crest.push({ strand, s0, a0, len: 4.6 + (k % 4) * 0.9, ph: k * 1.3, lean: (k % 2 ? 1 : -1) * (0.2 + (k % 3) * 0.25) }); }
  // a few crystals floating near him, and soft coloured mist
  const shards = Array.from({ length: 8 }, (_, i) => { const m = new THREE.Mesh(new THREE.OctahedronGeometry(0.16 + (i % 3) * 0.06), iceM); m.scale.y = 2; outline(m, 0.02); V.add(m); m.userData = { s: 0.1 + (i / 8) * 0.35, a: i * 2.4, r: 3.4 + (i % 3) * 0.6 }; return m; });
  const cl = cloudTex(); const mist = Array.from({ length: 10 }, (_, i) => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: cl, color: i % 2 ? 0x7FE9FF : 0xB48CFF, transparent: true, opacity: 0.2, blending: THREE.AdditiveBlending, depthWrite: false })); sp.scale.set(8, 5, 1); V.add(sp); sp.userData = { s: (i / 10) * 0.8, ph: i }; return sp; });
  // foam rings where he breaks the water
  const ringM = new THREE.MeshBasicMaterial({ color: 0xF2FBFF, transparent: true, opacity: 0.8, depthWrite: false });
  const rings = Array.from({ length: 4 }, () => { const r = new THREE.Mesh(new THREE.RingGeometry(1, 1.45, 30), ringM); r.rotation.x = -Math.PI / 2; r.visible = false; V.add(r); return r; });

  // ---------------------------------------------------------------- spine + per-frame update
  const st = { from: POSES.hidden(0), to: 'hidden', k: 1, look: null, lookK: 0, glow: 1, anger: 0, lift: 0, sway: 1, waterY: 0.1 / 1.3, clip: false };
  const base = POSES.hidden(0), cur = base.map(v => v.clone());
  const curve = new THREE.CatmullRomCurve3(cur, false, 'catmullrom', 0.5);
  const pts = Array.from({ length: M }, () => new THREE.Vector3()), T = pts.map(() => new THREE.Vector3()), N = pts.map(() => new THREE.Vector3()), B = pts.map(() => new THREE.Vector3());
  const q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), mtx = new THREE.Matrix4(), v1 = new THREE.Vector3(), v2 = new THREE.Vector3(), v3 = new THREE.Vector3();
  const basis = (obj, x, y, z) => { mtx.makeBasis(x, y, z); obj.quaternion.setFromRotationMatrix(mtx); };
  const surf = (out, i, a, lift) => { const r = radiusAt(sOf(i)) + headDisp(sOf(i), ((a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)), c = Math.cos(a), s = Math.sin(a); return out.copy(pts[i]).addScaledVector(N[i], c * flatBelly(c) * (r + lift)).addScaledVector(B[i], s * WIDE * (r + lift)); };
  const radial = (out, i, a) => out.copy(N[i]).multiplyScalar(Math.cos(a)).addScaledVector(B[i], Math.sin(a)).normalize();
  let time = 0;
  // ---- the sculpted model (Frank's Tripo shape, my own colours): bent along the same spine as the procedural body
  const model = { ready: false }; const TAILCUT = true; const flukeM = toon(0x3E9CA6, { emissive: 0x2BB8C0, emissiveIntensity: 0.3 });   // flat whale fluke instead of unrolling the sculpt's curled tail (unrolling folds it)
  const EYES = [[0.40, 0.347, 0.062], [0.40, 0.347, -0.062]];
  function loadModel(base) {
    new GLTFLoader().load(base + 'varn.glb', gl => {
      let src; gl.scene.traverse(o => { if (o.isMesh && !src) src = o; }); if (!src) return;
      const g0 = src.geometry, P0 = g0.attributes.position, N0 = g0.attributes.normal, cnt = P0.count, xs = new Float32Array(cnt);
      let x0 = 1e9, x1 = -1e9; for (let i = 0; i < cnt; i++) { xs[i] = P0.getX(i); x0 = Math.min(x0, xs[i]); x1 = Math.max(x1, xs[i]); }
      // centre line of the body, traced from the model's silhouette (belly line + half the body height); the side is centred on zero
      const CL = [[-0.5, 0.25], [-0.46, 0.2], [-0.42, 0.14], [-0.35, 0.125], [-0.27, 0.13], [-0.2, 0.16], [-0.1, 0.22], [0, 0.255], [0.1, 0.27], [0.2, 0.27], [0.3, 0.27], [0.4, 0.28], [0.5, 0.31]];
      const cAt = (arr, x) => { if (arr === 'z') return 0; if (x <= CL[0][0]) return CL[0][1]; for (let k = 1; k < CL.length; k++) if (x <= CL[k][0]) { const f = (x - CL[k - 1][0]) / (CL[k][0] - CL[k - 1][0]); return CL[k - 1][1] + (CL[k][1] - CL[k - 1][1]) * f; } return CL[CL.length - 1][1]; };
      const FX = -0.405, cy = 'y', cz = 'z', WID = 1.0, WB = 1.9, HB = 1.22, hAt = x => 1 + (HB - 1) * Math.max(0, Math.min(1, (0.32 - x) / 0.2)), wAt = x => 1 + (WB - 1) * Math.max(0, Math.min(1, (0.32 - x) / 0.2)), CUTX = 0.27, CUTY = 0.40;
      const sv = new Float32Array(cnt), oy = new Float32Array(cnt), oz = new Float32Array(cnt), i0 = new Uint16Array(cnt), fr = new Float32Array(cnt), ot = new Float32Array(cnt), isF = new Float32Array(cnt);
      const sF0 = model.sF = (x1 - FX) / (x1 - x0);
      // flipper weights (how much each vertex belongs to a flipper), so the showcase can make them flap
      const fw = new Float32Array(cnt), fg = new Uint8Array(cnt), fa = new Float32Array(4), fb = new Float32Array(4);
      for (let i = 0; i < cnt; i++) { const x = xs[i], z = P0.getZ(i), az = Math.abs(z); let w = 0;
        if (x > 0.08 && x < 0.33) w = (az - 0.13) / 0.16; else if (x < -0.12 && x > -0.33) w = (az - 0.09) / 0.12;
        w = Math.max(0, Math.min(1, w)); fw[i] = w * Math.sqrt(w); fg[i] = (x > 0 ? 0 : 2) + (z > 0 ? 0 : 1); }
      // the model's tail curls up and over into the fluke; that curl is unrolled here into a straight tail (arc length -> along the spine, distance from the curl centre -> up/down)
      const CF0 = cAt(cy, FX), RC = 0.08, CXc = FX - 0.01, CYc = CF0 + RC, NX = new Float32Array(cnt), NY = new Float32Array(cnt), smf = v => { v = Math.max(0, Math.min(1, v)); return v * v * (3 - 2 * v); };
      for (let i = 0; i < cnt; i++) { const y0 = P0.getY(i), tl0 = xs[i] < FX || (xs[i] < FX + 0.045 && y0 > 0.215), s = (x1 - Math.max(xs[i], FX)) / (x1 - x0); sv[i] = s; NX[i] = N0.getX(i); NY[i] = N0.getY(i);
        if (tl0 && TAILCUT) { oy[i] = Math.max(-0.06, Math.min(0.06, (y0 - CF0) * 0.35)); oz[i] = P0.getZ(i) * 0.35; ot[i] = 0; isF[i] = 0; }   // the sculpt's curled tail is tucked away: the real fluke takes over here
        else if (tl0) { const dx = xs[i] - CXc, dy = y0 - CYc, rho = Math.hypot(dx, dy), al = Math.atan2(dy, dx); let ph = -Math.PI / 2 - al; ph = ((ph % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2); if (ph > Math.PI * 1.6) ph -= Math.PI * 2;
          const sArc = ph * RC; oy[i] = RC - rho + 0.4 * Math.max(0, Math.abs(P0.getZ(i)) - 0.04) * smf(sArc / 0.12); ot[i] = Math.max(0, sArc) / (x1 - x0); oz[i] = P0.getZ(i); isF[i] = smf(sArc / 0.05);
          const be = -Math.PI / 2 - al, cb = Math.cos(be), sb = Math.sin(be), nx0 = NX[i], ny0 = NY[i]; NX[i] = nx0 * cb - ny0 * sb; NY[i] = nx0 * sb + ny0 * cb;
          model.kF = Math.max(0, Math.min(M - 2, Math.floor(Math.pow(sF0, 1 / SPOW) * (M - 1)))); }
        else { let yy = y0; if (xs[i] > CUTX && yy > CUTY) yy = CUTY - 0.02 + (yy - CUTY) * 0.03; oy[i] = (yy - cAt(cy, xs[i])) * hAt(xs[i]); oz[i] = (P0.getZ(i) - cAt(cz, xs[i])) * wAt(xs[i]); ot[i] = 0; isF[i] = 0; }
        const fi = Math.pow(s, 1 / SPOW) * (M - 1), k = Math.max(0, Math.min(M - 2, Math.floor(fi))); i0[i] = k; fr[i] = Math.max(0, Math.min(1, fi - k)); }
      const geo2 = new THREE.BufferGeometry(); const pos2 = new Float32Array(cnt * 3), nor2 = new Float32Array(cnt * 3);
      geo2.setAttribute('position', new THREE.BufferAttribute(pos2, 3)); geo2.setAttribute('normal', new THREE.BufferAttribute(nor2, 3)); geo2.setAttribute('uv', g0.attributes.uv); geo2.setIndex(g0.index);
      const tl = new THREE.TextureLoader(), tex = u => { const t = tl.load(base + u); t.flipY = false; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
      const mat = toon(0xFFFFFF, { map: tex('varn-skin.jpg'), emissiveMap: tex('varn-glow.jpg'), emissive: 0xFFFFFF, emissiveIntensity: 1 });
      const mesh = new THREE.Mesh(geo2, mat), ink2 = new THREE.Mesh(geo2, inkShell(0.05)), rim2 = new THREE.Mesh(geo2, rimMaterial(0x9FF6FF, 0.03, 0.3));
      [mesh, ink2, rim2].forEach(m => { m.frustumCulled = false; V.add(m); });
      const capGlow = glowSprite(0xA8F4FF, 3.2, 0.9); V.add(capGlow); model.cap = capGlow;
      const halos = EYES.map(() => { const h = glowSprite(0x9FFFF0, 1.5, 0.5); V.add(h); return h; });
      const iceCut = [new THREE.Plane(new THREE.Vector3(0, -1, 0), 0.02)];
      const K = () => Math.max(LEN, 17), tmp = new THREE.Vector3();
      const mapPt = (s, a, b, out) => { const fi = Math.pow(s, 1 / SPOW) * (M - 1), k = Math.max(0, Math.min(M - 2, Math.floor(fi))), f = Math.max(0, Math.min(1, fi - k)), kk = K();
        return out.set(0, 0, 0).addScaledVector(pts[k], 1 - f).addScaledVector(pts[k + 1], f).addScaledVector(N[k], a * kk * (1 - f)).addScaledVector(N[k + 1], a * kk * f).addScaledVector(B[k], -b * kk * (1 - f)).addScaledVector(B[k + 1], -b * kk * f); };
      model.update = t => { const kk = K(), pp = pos2, nn = nor2; { const A = SHOW.flap * 0.2; for (let g = 0; g < 4; g++) { const ph = t * 3.1 * Math.min(1.6, SHOW.rate) * 0.55 + (g >> 1) * 0.9 + (g & 1) * 0.0; fa[g] = Math.sin(ph) * A; fb[g] = Math.cos(ph) * A * 0.5; } } { const cp = st.clip ? iceCut : null; if (mat.clippingPlanes !== cp) { mat.clippingPlanes = cp; ink2.material.clippingPlanes = cp; mat.needsUpdate = ink2.material.needsUpdate = true; } rim2.visible = !st.clip; capGlow.visible = !st.clip; } const kF = model.kF || 0, wv = t * 3.1 * Math.min(1.6, SHOW.rate) - 8 * 0.85, th = Math.atan2(T[kF].y, N[kF].y) + SHOW.tail * 0.55 * Math.sin(wv + 2.4), yw = SHOW.tail * 0.22 * Math.sin(wv + 0.9), cF = Math.cos(th), sFn = Math.sin(th);
        for (let i = 0; i < cnt; i++) { const k = i0[i], f = fr[i], g = 1 - f, wq = isF[i], ca = 1 + (cF - 1) * wq, sa = sFn * wq, a = (oy[i] * ca - ot[i] * sa + (fw[i] ? fw[i] * fa[fg[i]] : 0) + (wq ? SHOW.tail * Math.sin(wv + 3.2 - ot[i] * 3.5) * (Math.min(ot[i], 0.1) * 1.6 + Math.abs(oz[i]) * 0.55) * wq : 0)) * kk, b = -oz[i] * kk + (wq ? yw * (oy[i] * sFn + ot[i] * cF) * kk * wq : 0), c0 = (oy[i] * sa + ot[i] * ca + (fw[i] ? fw[i] * fb[fg[i]] : 0)) * kk, A = pts[k], A2 = pts[k + 1], NA = N[k], NB2 = N[k + 1], BA = B[k], BB = B[k + 1], TT = T[k], TT2 = T[k + 1];
          pp[i * 3] = A.x * g + A2.x * f + (NA.x * g + NB2.x * f) * a + (BA.x * g + BB.x * f) * b + (TT.x * g + TT2.x * f) * c0; pp[i * 3 + 1] = A.y * g + A2.y * f + (NA.y * g + NB2.y * f) * a + (BA.y * g + BB.y * f) * b + (TT.y * g + TT2.y * f) * c0; pp[i * 3 + 2] = A.z * g + A2.z * f + (NA.z * g + NB2.z * f) * a + (BA.z * g + BB.z * f) * b + (TT.z * g + TT2.z * f) * c0;
          const nx = NX[i], ny = NY[i], nz = N0.getZ(i), TA = T[k], TB = T[k + 1], qy0 = ny, qz = -nz / (isF[i] || xs[i] < FX ? 1 : wAt(xs[i])), qx0 = -nx, qy = qy0 * ca - qx0 * sa, qx = qy0 * sa + qx0 * ca;
          nn[i * 3] = (TA.x * g + TB.x * f) * qx + (NA.x * g + NB2.x * f) * qy + (BA.x * g + BB.x * f) * qz; nn[i * 3 + 1] = (TA.y * g + TB.y * f) * qx + (NA.y * g + NB2.y * f) * qy + (BA.y * g + BB.y * f) * qz; nn[i * 3 + 2] = (TA.z * g + TB.z * f) * qx + (NA.z * g + NB2.z * f) * qy + (BA.z * g + BB.z * f) * qz; }
        model.capUpd && model.capUpd();
        geo2.attributes.position.needsUpdate = true; geo2.attributes.normal.needsUpdate = true;
        mat.emissiveIntensity = Math.min(1.6, st.glow * (0.8 + Math.sin(t * 1.6) * 0.2) * (1 + st.anger * 0.3)); rim2.material.uniforms.uK.value = 0.22 + st.glow * 0.12 + st.anger * 0.12;
        EYES.forEach((e, q) => { const s = (x1 - e[0]) / (x1 - x0); mapPt(s, (e[1] - cAt(cy, e[0])) * hAt(e[0]), e[2] * wAt(e[0]), tmp); halos[q].position.copy(tmp); halos[q].material.opacity = 0.4 + st.anger * 0.35 + Math.sin(t * 2.1) * 0.08; if (q === 0) eyeLight.position.copy(tmp).addScaledVector(N[k0(s)], 1.2); }); };
      model.capUpd = () => { mapPt((x1 - 0.39) / (x1 - x0), (0.40 - cAt(cy, 0.4)) * hAt(0.4), 0, capGlow.position); };
      model.root = (c, out) => { const s = (x1 - (0.40 - (c.s0 - 0.06) * 1.2)) / (x1 - x0); return mapPt(s, (0.39 - cAt(cy, 0.4)) * hAt(0.4), Math.sin(c.a0 * 3) * 0.05 * wAt(0.4), out); };
      const k0 = s => Math.max(0, Math.min(M - 1, Math.round(Math.pow(s, 1 / SPOW) * (M - 1))));
      // hide the hand-made body parts
      [body, ink, rim].forEach(o => o.visible = false); fluke.visible = TAILCUT; if (TAILCUT) fluke.traverse(o => { if (o.isMesh && o.material && !o.userData.isOutline) o.material = flukeM; }); onSkin.forEach(o => { o.obj.visible = false; }); crest.forEach(c => c.strand.forEach(sp => sp.visible = true));
      model.ready = true;
    }, undefined, () => { /* no model file: the hand-made Varn stays */ });
  }
  window.__loadVarnModel = loadModel;
  onTick(t => {
    time = t; const target = POSES[st.to](t);
    for (let i = 0; i < 9; i++) { base[i].lerpVectors(st.from[i], target[i], st.k); cur[i].copy(base[i]);
      const sw = st.sway * (0.18 + i * 0.05); cur[i].x += Math.sin(t * 0.8 + i * 0.9) * sw; cur[i].y += Math.sin(t * 0.6 + i * 0.7) * sw * 0.5; }
    // turn the head towards something (bend the front of the spine), or lift it
    if (st.look && st.lookK > 0) { const L = V.worldToLocal(st.look.clone()); const d = cur[0].distanceTo(cur[1]); v1.subVectors(cur[0], cur[1]).normalize(); v2.subVectors(L, cur[1]).normalize(); v1.lerp(v2, st.lookK * 0.8).normalize(); cur[0].copy(cur[1]).addScaledVector(v1, d); }
    cur[0].y += st.lift * 1.2; cur[1].y += st.lift * 0.5;
    for (let i = 0; i < M; i++) { const s = sOf(i); curve.getPointAt(s, pts[i]); curve.getTangentAt(s, T[i]); }
    // the body's roll is carried on from frame to frame: recomputing it from 'world up' every frame makes the whole body flip over
    // the instant the head swings through straight up/down. It is only eased back towards belly-down while the head is level.
    { v3.copy(up).addScaledVector(T[0], -T[0].dot(up)); const hz = v3.lengthSq();
      if (!st.n0) { st.n0 = new THREE.Vector3(); st.t0 = new THREE.Vector3(); if (hz < 1e-4) v3.set(0, 0, 1).addScaledVector(T[0], -T[0].z); st.n0.copy(v3).normalize(); st.t0.copy(T[0]); }
      q.setFromUnitVectors(st.t0, T[0]); N[0].copy(st.n0).applyQuaternion(q); N[0].addScaledVector(T[0], -T[0].dot(N[0])).normalize();
      // once his head is roughly level again, roll him smoothly back so his back is on top (this is what stops the tail coming down upside down)
      if (hz > 0.25) { v3.normalize(); const ang = Math.atan2(T[0].dot(v2.crossVectors(N[0], v3)), N[0].dot(v3)); N[0].applyAxisAngle(T[0], ang * 0.08 * Math.min(1, (hz - 0.25) / 0.5)); }
      st.n0.copy(N[0]); st.t0.copy(T[0]); }
    for (let i = 1; i < M; i++) { q.setFromUnitVectors(T[i - 1], T[i]); N[i].copy(N[i - 1]).applyQuaternion(q); N[i].addScaledVector(T[i], -T[i].dot(N[i])).normalize(); }
    for (let i = 0; i < M; i++) B[i].crossVectors(T[i], N[i]).normalize();
    const breathe = 1 + Math.sin(t * 1.2) * 0.02;
    LEN = curve.getLength();
    for (let i = 0; i < M; i++) { const r0 = radiusAt(sOf(i));
      for (let j = 0; j <= R; j++) { const a = (j / R) * Math.PI * 2, r = (r0 + headDisp(sOf(i), a)) * breathe, ca = Math.cos(a), sa = Math.sin(a), o = (i * (R + 1) + j) * 3, f = flatBelly(ca);
        pos[o] = pts[i].x + (N[i].x * ca * f + B[i].x * sa * WIDE) * r; pos[o + 1] = pts[i].y + (N[i].y * ca * f + B[i].y * sa * WIDE) * r; pos[o + 2] = pts[i].z + (N[i].z * ca * f + B[i].z * sa * WIDE) * r; } }
    geo.attributes.position.needsUpdate = true; geo.computeVertexNormals();
    { const nr = geo.attributes.normal; for (let j = 0; j <= R; j++) nr.setXYZ(j, -T[0].x, -T[0].y, -T[0].z); }
    if (model.ready) model.update(t);
    skin.emissiveIntensity = Math.min(1.6, st.glow * (0.8 + Math.sin(t * 1.6) * 0.2) * (1 + st.anger * 0.3));
    rim.material.uniforms.uK.value = 0.22 + st.glow * 0.12 + st.anger * 0.12;
    // everything stuck on the skin
    onSkin.forEach(o => { const i = iOf(o.s); surf(o.obj.position, i, o.a, o.lift); radial(v1, i, o.a); v2.copy(T[i]).negate(); v3.crossVectors(v1, v2).normalize(); v2.crossVectors(v3, v1).normalize(); basis(o.obj, v3, v1, v2); });
    // eyes look out and a little forward; they glow more when he is angry
    eyes.forEach(g => { g.rotateX(-1.12); const u = g.userData; u.halo.material.opacity = 0.4 + st.anger * 0.35 + Math.sin(t * 2.1) * 0.08; const blink = Math.sin(t * 0.7) > 0.993 ? 1 : 0; u.ball.scale.y = 1 - blink * 0.85; });
    eyeLight.position.copy(surf(v1, iOf(0.06), 0, 1.2)); eyeLight.intensity = 6 + st.anger * 10;
    flippers.forEach(g => { const u = g.userData; const sw = Math.sin(t * 1.3 + u.ph); u.arm.rotation.set(0, -0.75 + sw * 0.25, 0.85 + sw * 0.15); u.fore.rotation.set(0, 0, 0); u.hand.rotation.set(0, 0.15, -0.35 + sw * 0.15); });
    { const i = model.ready ? iOf(model.sF) : M - 1; fluke.position.copy(pts[i]); basis(fluke, B[i], N[i], v2.copy(T[i]).negate()); fluke.rotateY(Math.PI); fluke.rotateX(Math.sin(t * 1.6) * 0.18); }
    // crest tendrils rise and wave like smoke
    crest.forEach(c => { const i = iOf(c.s0); const root = model.root ? model.root(c, v1) : surf(v1, i, c.a0, -0.05);
      c.strand.forEach((sp, j) => { const k = j / c.strand.length, L = c.len * k;
        sp.position.copy(root).addScaledVector(N[i], L * 0.95).addScaledVector(T[i], L * 0.45 + k * k * 0.8).addScaledVector(B[i], c.lean * L * 0.5 + Math.sin(t * 1.5 + c.ph + j * 0.35) * k * 0.6).addScaledVector(T[i], Math.cos(t * 1.2 + c.ph + j * 0.3) * k * 0.4); }); });
    shards.forEach(m => { const u = m.userData; const i = iOf(u.s); const a = u.a + t * 0.35; m.position.copy(pts[i]).addScaledVector(B[i], Math.cos(a) * u.r).addScaledVector(N[i], Math.sin(a) * u.r * 0.8 + 0.8); m.rotation.y = t + u.a; });
    mist.forEach(sp => { const u = sp.userData; const i = iOf(u.s); sp.position.copy(pts[i]).addScaledVector(B[i], Math.sin(t * 0.3 + u.ph) * 3).addScaledVector(N[i], 0.5 + Math.cos(t * 0.25 + u.ph) * 1.5); sp.material.rotation = t * 0.05 * (u.ph % 2 ? 1 : -1); });
    let r = 0; const wy = st.waterY; for (let i = 1; i < M && r < rings.length; i++) { if ((pts[i - 1].y - wy) * (pts[i].y - wy) < 0) { const ring = rings[r++]; ring.visible = true; ring.position.set(pts[i].x, wy + 0.03, pts[i].z); const sc = radiusAt(sOf(i)) * (1.15 + Math.sin(t * 3 + i) * 0.06); ring.scale.set(sc, sc, 1); } }
    for (; r < rings.length; r++) rings[r].visible = false;
  });
  V.scale.setScalar(1.3);
  loadModel((typeof window !== 'undefined' && window.__VARN_BASE) || 'varn/');

  return {
    g: V, eyes, eyeLight, state: st,
    to(mode, ms = 2000) { st.from = base.map(v => v.clone()); st.to = mode; st.k = 0; const id = (st.id = (st.id || 0) + 1); return tween(ms, e => { if (st.id === id) st.k = e; }); },
    set(mode) { st.id = (st.id || 0) + 1; st.to = mode; st.k = 1; st.from = POSES[mode](time); st.n0 = null; },
    lookAt(v, k = 1, ms = 900) { const k0 = st.lookK; if (v) st.look = v.clone(); return tween(ms, e => { st.lookK = k0 + ((v ? k : 0) - k0) * e; }); },
    roar(ms = 1400) { return tween(ms, (e, k) => { st.lift = Math.sin(k * Math.PI) * 0.8; st.glow = 1.3 + Math.sin(k * Math.PI) * 0.8; }); },
    at(s) { return V.localToWorld(pts[iOf(s)].clone()); },
    mid() { return V.localToWorld(pts[iOf(0.4)].clone()); },
    headPos() { return V.localToWorld(pts[iOf(0.08)].clone()); },
  };
}
