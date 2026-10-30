// Varn, guard of the deep stones — a whale-like sea guardian (from Frank's character sheet):
// a big round whale head with a gentle wide smile and throat grooves, wise glowing gold-and-teal eyes,
// a glowing crest of blue-violet tendrils, stone-like teal and lavender skin with glowing glyphs,
// crystal fins along the back, four jointed flippers with white crystal claws, and a whale tail fluke.
// The body follows a living spine, so he can circle under the ice, burst up, rest beside the boat, rear up, or dive.
import { THREE, INK, toon, outline, builder, onTick, tween } from './gfx.js';
import { glowTex, cloudTex, glowSprite } from './effects.js';

const M = 64, R = 26;                                      // rings along the body × points around each ring
const SPOW = 1.35;                                         // more rings near the head
const sOf = i => Math.pow(i / (M - 1), SPOW), iOf = s => Math.max(0, Math.min(M - 1, Math.round(Math.pow(s, 1 / SPOW) * (M - 1))));
const PROFILE = [[0.05, 1.6], [0.07, 1.85], [0.13, 2.2], [0.22, 2.38], [0.33, 2.3], [0.45, 2.0], [0.58, 1.52], [0.72, 1.02], [0.86, 0.62], [0.96, 0.4], [1, 0.32]];
const radiusAt = s => { if (s < 0.05) { const u = 1 - s / 0.05; return Math.max(0.04, 1.6 * Math.sqrt(1 - u * u)); } for (let i = 1; i < PROFILE.length; i++) if (s <= PROFILE[i][0]) { const [a, ra] = PROFILE[i - 1], [b, rb] = PROFILE[i]; const k = (s - a) / (b - a); return ra + (rb - ra) * (k * k * (3 - 2 * k)); } return 0.32; };
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
  // the lower jaw is paler, with throat grooves, and a long gentle smile
  [1, -1].forEach(side => {
    x.fillStyle = 'rgba(232,244,240,.85)'; x.beginPath(); x.moveTo(X(150, side), Y(0.004));
    for (let k = 0; k <= 20; k++) { const s = 0.004 + k / 20 * 0.19; x.lineTo(X(150 - 52 * Math.sin(k / 20 * Math.PI / 2), side), Y(s)); }
    x.lineTo(X(180, side), Y(0.2)); x.lineTo(X(180, side), Y(0.004)); x.fill();
    x.strokeStyle = 'rgba(80,110,130,.55)'; x.lineWidth = 3;
    for (let d = 112; d <= 180; d += 9) { x.beginPath(); x.moveTo(X(d, side), Y(0.07 + (d - 112) * 0.0006)); x.lineTo(X(d, side), Y(0.3)); x.stroke(); }
    x.strokeStyle = '#2E2A4F'; x.lineWidth = 9; x.lineCap = 'round'; x.beginPath();
    for (let k = 0; k <= 30; k++) { const t = k / 30, s = 0.004 + t * 0.19, deg = 150 - 52 * Math.sin(t * Math.PI / 2) - (t > 0.85 ? (t - 0.85) * 120 : 0); k ? x.lineTo(X(deg, side), Y(s)) : x.moveTo(X(deg, side), Y(s)); }
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
  const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
  x.fillStyle = '#1C2C3A'; x.fillRect(0, 0, 128, 128);
  const g = x.createRadialGradient(64, 64, 0, 64, 64, 60); g.addColorStop(0, '#0B1A22'); g.addColorStop(0.28, '#0B1A22'); g.addColorStop(0.32, '#3FE0D0'); g.addColorStop(0.62, '#2BB8B4'); g.addColorStop(0.72, '#E6B652'); g.addColorStop(0.86, '#B8862E'); g.addColorStop(0.92, '#1C2C3A');
  x.fillStyle = g; x.beginPath(); x.arc(64, 64, 60, 0, 7); x.fill();
  x.fillStyle = 'rgba(255,255,255,.95)'; x.beginPath(); x.arc(46, 44, 11, 0, 7); x.fill(); x.beginPath(); x.arc(80, 82, 5, 0, 7); x.fill();
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
  circle: t => Array.from({ length: 9 }, (_, i) => { const a = t * 0.5 - i * 0.29; return new THREE.Vector3(Math.cos(a) * 7.5, -3.8, Math.sin(a) * 7.5 - 1); }),
  // bursting up through the ice in front of the boat, chest and front flippers out
  rise: () => P([1.2, 5.6, -6.8], [1.2, 4.4, -8.6], [1.1, 2.6, -10.2], [1, 0.6, -11.4], [0.9, -1.5, -12.4], [0.8, -3.6, -13.2], [0.8, -5.6, -13.6], [1, -7.4, -13.2], [1.2, -8.8, -12.2]),
  // resting his great head on the ice right beside the boat, looking at the kids
  loom: () => P([-4.8, 1.5, -2.4], [-6.2, 1.7, -4.1], [-7.4, 1.4, -5.9], [-8.4, 0.6, -7.8], [-9.0, -0.6, -9.8], [-9.2, -2, -11.8], [-9.0, -3.4, -13.8], [-8.6, -4.6, -15.8], [-8.0, -5.6, -17.6]),
  // rearing up high, leaning over the boat
  rear: () => P([0, 6.6, -4.6], [0, 6.2, -6.8], [0, 4.8, -8.5], [0.2, 2.8, -9.8], [0.4, 0.6, -10.8], [0.6, -1.6, -11.6], [0.8, -3.8, -12.2], [1, -5.8, -12.4], [1.2, -7.6, -12]),
  // head down into the water, tail fluke lifted high beside the boat
  tailUp: () => P([-4, -5, -12], [-2.6, -3.4, -11], [-1, -1.6, -10], [0.6, 0, -9], [2, 1.6, -8], [3.2, 3.4, -7], [4, 5.4, -6.2], [4.4, 7.4, -5.6], [4.4, 9.2, -5.2]),
  // …and slammed down flat onto the ice
  tailSmash: () => P([-4, -5, -12], [-2.6, -3.4, -11], [-1, -1.6, -10], [0.6, -0.4, -9], [2, 0.4, -7.8], [3, 0.6, -6.2], [3.6, 0.5, -4.6], [3.9, 0.3, -3], [4, 0.2, -1.4]),
  // diving back into the deep in one great arc
  dive: () => P([0.8, -6, -9.5], [0.6, -3.6, -10.5], [0.5, -1.2, -11.8], [0.4, 1, -13.4], [0.4, 2.6, -15.4], [0.5, 3.2, -17.6], [0.6, 2.8, -19.8], [0.8, 1.8, -21.8], [1, 0.8, -23.4]),
  gone: () => P([1, -16, -14], [1, -15, -16], [1, -14, -18], [1, -13, -20], [1, -12, -22], [1, -11, -24], [1, -10, -26], [1, -9, -28], [1, -8, -30]),
};
POSES.arch = POSES.rise;
// swimming level (a side view, like the character sheet)
POSES.swim = () => Array.from({ length: 9 }, (_, i) => new THREE.Vector3(8 - i * 2.2, 3 + Math.sin(i * 0.7) * 0.4 + (i > 6 ? (i - 6) * 0.6 : 0), -12));

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
    const ball = b.add(new THREE.SphereGeometry(0.56, 20, 14), new THREE.MeshBasicMaterial({ map: eyeTex }), 0, 0, 0, { ry: -Math.PI / 2, line: 0.045 });
    const lid = b.add(new THREE.SphereGeometry(0.66, 18, 10, 0, Math.PI * 2, 0, Math.PI * 0.42), skin, 0, 0, -0.04, { rz: sd * Math.PI / 2, line: 0.04 });
    const halo = glowSprite(0x9FFFF0, 1.7, 0.5); halo.position.z = 0.35; g.add(halo); g.userData = { ball, lid, halo, sd };
    stick(g, 0.11, sd * 66, -0.2); eyes.push(g); });
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
    const arm = new THREE.Group(); side.add(arm); const b = builder(arm);
    b.add(new THREE.CapsuleGeometry(0.42 * k, 1.3 * k, 4, 10), flipM, 0.75 * k, 0, 0, { rz: Math.PI / 2, line: 0.035 });
    const fore = new THREE.Group(); fore.position.set(1.5 * k, 0, 0); arm.add(fore); const fb = builder(fore);
    fb.add(new THREE.SphereGeometry(0.42 * k, 10, 8), flipM, 0, 0, 0, { line: 0.03 });
    fb.add(new THREE.CapsuleGeometry(0.36 * k, 1.1 * k, 4, 10), flipM, 0.65 * k, 0, 0, { rz: Math.PI / 2, line: 0.03 });
    fb.add(new THREE.ConeGeometry(0.12 * k, 0.6 * k, 4), iceM, 0, 0.35 * k, -0.15, { rx: -0.6, line: 0.015 });     // crystal spike on the elbow
    const hand = new THREE.Group(); hand.position.set(1.35 * k, 0, 0); fore.add(hand); const hb = builder(hand);
    hb.add(new THREE.SphereGeometry(0.5 * k, 12, 8), flipM, 0.25 * k, 0, 0.1 * k, { line: 0.03 }).scale.set(1.2, 0.55, 1.15);
    for (let c = -1; c <= 1; c++) { const cl = hb.add(new THREE.ConeGeometry(0.13 * k, 0.95 * k, 8), clawM, 0.75 * k, -0.08 * k, (0.1 + c * 0.34) * k, { line: 0.015 }); cl.rotation.set(0, -c * 0.3, -Math.PI / 2 - 0.3); }
    root.userData = { arm, fore, hand, ph: s * 7 + (sd > 0 ? 0 : 1.5) }; stick(root, s, sd * 112, -0.3); flippers.push(root); });
  // the whale tail fluke
  const fluke = new THREE.Group(); V.add(fluke); fluke.scale.setScalar(1.35);
  { const sh = new THREE.Shape(); sh.moveTo(0, 0.4); sh.bezierCurveTo(1.2, 0.5, 2.6, -0.4, 3.6, -1.8); sh.bezierCurveTo(2.6, -1.5, 1.6, -1.2, 1.0, -1.6); sh.bezierCurveTo(0.6, -1.2, 0.2, -1.0, 0, -0.9); sh.lineTo(0, 0.4);
    const fg = new THREE.ExtrudeGeometry(sh, { depth: 0.22, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.08, bevelSegments: 2 }); fg.translate(0, 0, -0.11);
    [1, -1].forEach(sd => { const m = new THREE.Mesh(fg, flipM); m.rotation.x = -Math.PI / 2; m.scale.x = sd; outline(m, 0.04); fluke.add(m); }); }
  // the glowing crest: soft tendrils of light rising from the top of the head
  const tex = glowTex(), crest = [];
  for (let k = 0; k < 13; k++) { const strand = [], n = 22; const s0 = 0.06 + (k % 7) * 0.022, a0 = ((k % 2 ? 1 : -1) * (6 + (k % 5) * 9)) * Math.PI / 180;
    for (let j = 0; j < n; j++) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: new THREE.Color(0x7FEFFF).lerp(new THREE.Color(k % 3 ? 0x8F5BFF : 0xB48CFF), Math.min(1, j / 12)), transparent: true, opacity: 0.75 * (1 - j / (n + 2)), blending: THREE.AdditiveBlending, depthWrite: false }));
      sp.scale.setScalar(0.8 - j * 0.024); V.add(sp); strand.push(sp); }
    crest.push({ strand, s0, a0, len: 3.4 + (k % 4) * 0.7, ph: k * 1.3, lean: (k % 2 ? 1 : -1) * (0.2 + (k % 3) * 0.25) }); }
  // a few crystals floating near him, and soft coloured mist
  const shards = Array.from({ length: 8 }, (_, i) => { const m = new THREE.Mesh(new THREE.OctahedronGeometry(0.16 + (i % 3) * 0.06), iceM); m.scale.y = 2; outline(m, 0.02); V.add(m); m.userData = { s: 0.1 + (i / 8) * 0.35, a: i * 2.4, r: 3.4 + (i % 3) * 0.6 }; return m; });
  const cl = cloudTex(); const mist = Array.from({ length: 10 }, (_, i) => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: cl, color: i % 2 ? 0x7FE9FF : 0xB48CFF, transparent: true, opacity: 0.2, blending: THREE.AdditiveBlending, depthWrite: false })); sp.scale.set(8, 5, 1); V.add(sp); sp.userData = { s: (i / 10) * 0.8, ph: i }; return sp; });
  // foam rings where he breaks the water
  const ringM = new THREE.MeshBasicMaterial({ color: 0xF2FBFF, transparent: true, opacity: 0.8, depthWrite: false });
  const rings = Array.from({ length: 4 }, () => { const r = new THREE.Mesh(new THREE.RingGeometry(1, 1.45, 30), ringM); r.rotation.x = -Math.PI / 2; r.visible = false; V.add(r); return r; });

  // ---------------------------------------------------------------- spine + per-frame update
  const st = { from: POSES.hidden(0), to: 'hidden', k: 1, look: null, lookK: 0, glow: 1, anger: 0, lift: 0, sway: 1, waterY: 0.1 / 1.3 };
  const base = POSES.hidden(0), cur = base.map(v => v.clone());
  const curve = new THREE.CatmullRomCurve3(cur, false, 'catmullrom', 0.5);
  const pts = Array.from({ length: M }, () => new THREE.Vector3()), T = pts.map(() => new THREE.Vector3()), N = pts.map(() => new THREE.Vector3()), B = pts.map(() => new THREE.Vector3());
  const q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), mtx = new THREE.Matrix4(), v1 = new THREE.Vector3(), v2 = new THREE.Vector3(), v3 = new THREE.Vector3();
  const basis = (obj, x, y, z) => { mtx.makeBasis(x, y, z); obj.quaternion.setFromRotationMatrix(mtx); };
  const surf = (out, i, a, lift) => { const r = radiusAt(sOf(i)), c = Math.cos(a), s = Math.sin(a); return out.copy(pts[i]).addScaledVector(N[i], c * flatBelly(c) * (r + lift)).addScaledVector(B[i], s * WIDE * (r + lift)); };
  const radial = (out, i, a) => out.copy(N[i]).multiplyScalar(Math.cos(a)).addScaledVector(B[i], Math.sin(a)).normalize();
  let time = 0;
  onTick(t => {
    time = t; const target = POSES[st.to](t);
    for (let i = 0; i < 9; i++) { base[i].lerpVectors(st.from[i], target[i], st.k); cur[i].copy(base[i]);
      const sw = st.sway * (0.18 + i * 0.05); cur[i].x += Math.sin(t * 0.8 + i * 0.9) * sw; cur[i].y += Math.sin(t * 0.6 + i * 0.7) * sw * 0.5; }
    // turn the head towards something (bend the front of the spine), or lift it
    if (st.look && st.lookK > 0) { const L = V.worldToLocal(st.look.clone()); const d = cur[0].distanceTo(cur[1]); v1.subVectors(cur[0], cur[1]).normalize(); v2.subVectors(L, cur[1]).normalize(); v1.lerp(v2, st.lookK * 0.8).normalize(); cur[0].copy(cur[1]).addScaledVector(v1, d); }
    cur[0].y += st.lift * 1.2; cur[1].y += st.lift * 0.5;
    for (let i = 0; i < M; i++) { const s = sOf(i); curve.getPointAt(s, pts[i]); curve.getTangentAt(s, T[i]); }
    N[0].copy(up).addScaledVector(T[0], -T[0].dot(up)); if (N[0].lengthSq() < 1e-4) N[0].set(0, 0, 1).addScaledVector(T[0], -T[0].z); N[0].normalize();
    for (let i = 1; i < M; i++) { q.setFromUnitVectors(T[i - 1], T[i]); N[i].copy(N[i - 1]).applyQuaternion(q); N[i].addScaledVector(T[i], -T[i].dot(N[i])).normalize(); }
    for (let i = 0; i < M; i++) B[i].crossVectors(T[i], N[i]).normalize();
    const breathe = 1 + Math.sin(t * 1.2) * 0.02;
    for (let i = 0; i < M; i++) { const r = radiusAt(sOf(i)) * breathe;
      for (let j = 0; j <= R; j++) { const a = (j / R) * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a), o = (i * (R + 1) + j) * 3, f = flatBelly(ca);
        pos[o] = pts[i].x + (N[i].x * ca * f + B[i].x * sa * WIDE) * r; pos[o + 1] = pts[i].y + (N[i].y * ca * f + B[i].y * sa * WIDE) * r; pos[o + 2] = pts[i].z + (N[i].z * ca * f + B[i].z * sa * WIDE) * r; } }
    geo.attributes.position.needsUpdate = true; geo.computeVertexNormals();
    { const nr = geo.attributes.normal; for (let j = 0; j <= R; j++) nr.setXYZ(j, -T[0].x, -T[0].y, -T[0].z); }
    skin.emissiveIntensity = Math.min(1.6, st.glow * (0.8 + Math.sin(t * 1.6) * 0.2) * (1 + st.anger * 0.3));
    rim.material.uniforms.uK.value = 0.22 + st.glow * 0.12 + st.anger * 0.12;
    // everything stuck on the skin
    onSkin.forEach(o => { const i = iOf(o.s); surf(o.obj.position, i, o.a, o.lift); radial(v1, i, o.a); v2.copy(T[i]).negate(); v3.crossVectors(v1, v2).normalize(); v2.crossVectors(v3, v1).normalize(); basis(o.obj, v3, v1, v2); });
    // eyes look out and a little forward; they glow more when he is angry
    eyes.forEach(g => { g.rotateX(-1.12); const u = g.userData; u.halo.material.opacity = 0.4 + st.anger * 0.35 + Math.sin(t * 2.1) * 0.08; const blink = Math.sin(t * 0.7) > 0.993 ? 1 : 0; u.ball.scale.y = 1 - blink * 0.85; });
    eyeLight.position.copy(surf(v1, iOf(0.06), 0, 1.2)); eyeLight.intensity = 6 + st.anger * 10;
    flippers.forEach(g => { const u = g.userData; const sw = Math.sin(t * 1.3 + u.ph); u.arm.rotation.set(0, -0.35 + sw * 0.25, 0.85 + sw * 0.15); u.fore.rotation.set(0, 0.25, -0.95 + sw * 0.15); u.hand.rotation.set(0, 0.15, -0.35 + sw * 0.15); });
    { const i = M - 1; fluke.position.copy(pts[i]); basis(fluke, B[i], N[i], v2.copy(T[i]).negate()); fluke.rotateY(Math.PI); fluke.rotateX(Math.sin(t * 1.6) * 0.18); }
    // crest tendrils rise and wave like smoke
    crest.forEach(c => { const i = iOf(c.s0); const root = surf(v1, i, c.a0, -0.05);
      c.strand.forEach((sp, j) => { const k = j / c.strand.length, L = c.len * k;
        sp.position.copy(root).addScaledVector(N[i], L * 0.95).addScaledVector(T[i], L * 0.45 + k * k * 0.8).addScaledVector(B[i], c.lean * L * 0.5 + Math.sin(t * 1.5 + c.ph + j * 0.35) * k * 0.6).addScaledVector(T[i], Math.cos(t * 1.2 + c.ph + j * 0.3) * k * 0.4); }); });
    shards.forEach(m => { const u = m.userData; const i = iOf(u.s); const a = u.a + t * 0.35; m.position.copy(pts[i]).addScaledVector(B[i], Math.cos(a) * u.r).addScaledVector(N[i], Math.sin(a) * u.r * 0.8 + 0.8); m.rotation.y = t + u.a; });
    mist.forEach(sp => { const u = sp.userData; const i = iOf(u.s); sp.position.copy(pts[i]).addScaledVector(B[i], Math.sin(t * 0.3 + u.ph) * 3).addScaledVector(N[i], 0.5 + Math.cos(t * 0.25 + u.ph) * 1.5); sp.material.rotation = t * 0.05 * (u.ph % 2 ? 1 : -1); });
    let r = 0; const wy = st.waterY; for (let i = 1; i < M && r < rings.length; i++) { if ((pts[i - 1].y - wy) * (pts[i].y - wy) < 0) { const ring = rings[r++]; ring.visible = true; ring.position.set(pts[i].x, wy + 0.03, pts[i].z); const sc = radiusAt(sOf(i)) * (1.15 + Math.sin(t * 3 + i) * 0.06); ring.scale.set(sc, sc, 1); } }
    for (; r < rings.length; r++) rings[r].visible = false;
  });
  V.scale.setScalar(1.3);

  return {
    g: V, eyes, eyeLight, state: st,
    to(mode, ms = 2000) { st.from = base.map(v => v.clone()); st.to = mode; st.k = 0; const id = (st.id = (st.id || 0) + 1); return tween(ms, e => { if (st.id === id) st.k = e; }); },
    set(mode) { st.id = (st.id || 0) + 1; st.to = mode; st.k = 1; st.from = POSES[mode](time); },
    lookAt(v, k = 1, ms = 900) { const k0 = st.lookK; if (v) st.look = v.clone(); return tween(ms, e => { st.lookK = k0 + ((v ? k : 0) - k0) * e; }); },
    roar(ms = 1400) { return tween(ms, (e, k) => { st.lift = Math.sin(k * Math.PI) * 0.8; st.glow = 1.3 + Math.sin(k * Math.PI) * 0.8; }); },
    at(s) { return V.localToWorld(pts[iOf(s)].clone()); },
    headPos() { return V.localToWorld(pts[iOf(0.08)].clone()); },
  };
}
