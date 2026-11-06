// Leo, Mia and Toby as toon figures. Each has .g (group) and .pose(name); poses animate every frame.
import { THREE, builder, onTick } from './gfx.js';


// ---- painted faces: one canvas per expression, swapped onto a curved patch of the head ----
const FACE = { W: 512, H: 320 };
function paintFace(expr, o) {
  const c = document.createElement('canvas'); c.width = FACE.W; c.height = FACE.H; const x = c.getContext('2d');
  x.translate(256, 150); x.scale(1.4, 1.4); x.translate(-256, -165); x.lineCap = 'round'; x.lineJoin = 'round'; const ink = '#2A1B1B';
  const eye = (cx, cy, rx, ry, look = 0, lid = 0) => {
    x.save(); x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, 0, 7); x.fillStyle = '#fff'; x.fill(); x.lineWidth = 5; x.strokeStyle = ink; x.stroke(); x.clip();
    const ir = Math.min(rx, ry) * 0.95; x.beginPath(); x.ellipse(cx + look, cy + ry * 0.08, ir * 0.8, ir, 0, 0, 7); x.fillStyle = o.iris; x.fill();
    x.beginPath(); x.ellipse(cx + look, cy + ry * 0.08, ir * 0.42, ir * 0.55, 0, 0, 7); x.fillStyle = '#17101a'; x.fill();
    x.beginPath(); x.arc(cx + look - ir * 0.28, cy - ry * 0.3, ir * 0.24, 0, 7); x.fillStyle = '#fff'; x.fill();
    x.beginPath(); x.arc(cx + look + ir * 0.3, cy + ry * 0.35, ir * 0.11, 0, 7); x.fill();
    if (lid) { x.fillStyle = o.skin; x.fillRect(cx - rx - 8, cy - ry - 8, rx * 2 + 16, (ry * 2) * lid + 8); x.fillStyle = ink; x.fillRect(cx - rx - 8, cy - ry + ry * 2 * lid - 2, rx * 2 + 16, 6); }
    x.restore();
    if (o.lash) { x.strokeStyle = ink; x.lineWidth = 6; x.beginPath(); x.arc(cx, cy, rx + 1, Math.PI * 1.08, Math.PI * 1.92); x.stroke(); }
  };
  const brow = (cx, cy, w, tilt, lift = 0) => { x.strokeStyle = o.brow; x.lineWidth = o.lash ? 7 : 12; x.beginPath(); x.moveTo(cx - w, cy + lift - tilt); x.quadraticCurveTo(cx, cy + lift - 12 - Math.abs(tilt) * 0.2, cx + w, cy + lift + tilt); x.stroke(); };
  const cheek = () => { x.fillStyle = o.cheek; [150, 362].forEach(px => { x.globalAlpha = 0.55; x.beginPath(); x.ellipse(px, 218, 34, 20, 0, 0, 7); x.fill(); }); x.globalAlpha = 1; };
  const nose = () => { x.strokeStyle = o.nose; x.lineWidth = 6; x.beginPath(); x.moveTo(246, 196); x.quadraticCurveTo(256, 206, 266, 196); x.stroke(); };
  const EX = 98, EY = 148, ER = 28, EH = 40;
  const E = { happy: () => { eye(256 - EX, EY, ER, EH, 3); eye(256 + EX, EY, ER, EH, -3); brow(256 - EX, 84, 30, 6, 0); brow(256 + EX, 84, 30, -6, 0); cheek(); nose();
      x.fillStyle = '#7A2230'; x.beginPath(); x.moveTo(204, 238); x.quadraticCurveTo(256, 250, 308, 238); x.quadraticCurveTo(300, 292, 256, 292); x.quadraticCurveTo(212, 292, 204, 238); x.fill();
      x.fillStyle = '#fff'; x.beginPath(); x.moveTo(214, 241); x.quadraticCurveTo(256, 252, 298, 241); x.lineTo(296, 252); x.quadraticCurveTo(256, 262, 216, 252); x.fill();
      x.fillStyle = '#E8707E'; x.beginPath(); x.ellipse(256, 284, 22, 9, 0, 0, 7); x.fill(); x.strokeStyle = ink; x.lineWidth = 5; x.beginPath(); x.moveTo(204, 238); x.quadraticCurveTo(256, 250, 308, 238); x.quadraticCurveTo(300, 292, 256, 292); x.quadraticCurveTo(212, 292, 204, 238); x.stroke(); },
    scared: () => { eye(256 - EX, EY, ER + 6, EH + 8, 0); eye(256 + EX, EY, ER + 6, EH + 8, 0); brow(256 - EX, 70, 30, -12, -4); brow(256 + EX, 70, 30, 12, -4); nose();
      x.fillStyle = '#6a1c2a'; x.strokeStyle = ink; x.lineWidth = 5; x.beginPath(); x.ellipse(256, 262, 26, 30, 0, 0, 7); x.fill(); x.stroke();
      x.fillStyle = '#9fd8ff'; x.beginPath(); x.moveTo(396, 100); x.quadraticCurveTo(410, 130, 396, 144); x.quadraticCurveTo(382, 130, 396, 100); x.fill(); },
    surprised: () => { eye(256 - EX, EY, ER + 4, EH + 6, 0); eye(256 + EX, EY, ER + 4, EH + 6, 0); brow(256 - EX, 66, 30, 0, -6); brow(256 + EX, 66, 30, 0, -6); cheek(); nose();
      x.fillStyle = '#6a1c2a'; x.strokeStyle = ink; x.lineWidth = 5; x.beginPath(); x.ellipse(256, 260, 20, 26, 0, 0, 7); x.fill(); x.stroke(); },
    determined: () => { eye(256 - EX, EY, ER, EH - 6, 0, 0.2); eye(256 + EX, EY, ER, EH - 6, 0, 0.2); brow(256 - EX, 92, 32, 16, 0); brow(256 + EX, 92, 32, -16, 0); nose();
      x.strokeStyle = ink; x.lineWidth = 8; x.beginPath(); x.moveTo(218, 258); x.quadraticCurveTo(256, 270, 294, 254); x.stroke(); },
    sad: () => { eye(256 - EX, EY + 4, ER, EH - 2, 0, 0.1); eye(256 + EX, EY + 4, ER, EH - 2, 0, 0.1); brow(256 - EX, 86, 30, -14, 0); brow(256 + EX, 86, 30, 14, 0); nose();
      x.strokeStyle = ink; x.lineWidth = 8; x.beginPath(); x.moveTo(222, 276); x.quadraticCurveTo(256, 250, 290, 276); x.stroke();
      x.fillStyle = '#9fd8ff'; x.beginPath(); x.moveTo(160, 196); x.quadraticCurveTo(172, 222, 160, 236); x.quadraticCurveTo(148, 222, 160, 196); x.fill(); },
    blink: () => { [256 - EX, 256 + EX].forEach(cx => { x.strokeStyle = ink; x.lineWidth = 9; x.beginPath(); x.arc(cx, EY - 4, 28, 0.15, Math.PI - 0.15); x.stroke(); }); brow(256 - EX, 86, 30, 6, 0); brow(256 + EX, 86, 30, -6, 0); cheek(); nose();
      x.strokeStyle = ink; x.lineWidth = 8; x.beginPath(); x.moveTo(220, 250); x.quadraticCurveTo(256, 280, 292, 250); x.stroke(); } };
  (E[expr] || E.happy)(); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
const FACES = {};
function facePatch(head, o) {
  const key = o.iris + o.skin; const maps = FACES[key] || (FACES[key] = {});
  const geo = new THREE.SphereGeometry(0.2735, 28, 18, Math.PI / 2 - 0.95, 1.9, Math.PI / 2 - 0.55, 1.2);
  const mat = new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, toneMapped: false });
  const m = new THREE.Mesh(geo, mat); m.renderOrder = 2; head.add(m);
  const set = e => { mat.map = maps[e] || (maps[e] = paintFace(e, o)); mat.needsUpdate = true; };
  set('happy'); return { mesh: m, set };
}
function kid({ skin, shirt, legs, shoes, hair, face, overalls }) {
  const g = new THREE.Group(); const b = builder(g);
  const limb = (x, y, parts) => { const p = new THREE.Group(); p.position.set(x, y, 0); g.add(p); parts(builder(p)); return p; };
  const E = (o, sx, sy, sz) => { o.scale.set(sx, sy, sz); return o; };
  const sole = (b) => { E(b.ball(0.1, 0xF4F1EA, 0, -0.485, 0.045, { line: 0.02, seg: 18 }), 1.0, 0.3, 1.6); E(b.ball(0.1, shoes, 0, -0.45, 0.04, { line: 0.02, seg: 18 }), 0.92, 0.6, 1.5); };
  // one smooth shape per limb / torso; colour is painted along its length
  const W = 0xF4F1EA, cuffC = new THREE.Color(legs).lerp(new THREE.Color(0xffffff), 0.25).getHex();
  const leg = x => limb(x, 0.5, b => {
    const P = overalls
      ? [[0.001, -0.43, legs], [0.07, -0.425, cuffC], [0.098, -0.395, cuffC], [0.098, -0.36, cuffC], [0.088, -0.35, legs], [0.088, -0.2, legs], [0.098, -0.05, legs], [0.085, 0.04, legs], [0.001, 0.05, legs]]
      : [[0.001, -0.435, W], [0.05, -0.43, W], [0.058, -0.38, W], [0.054, -0.33, W], [0.05, -0.32, skin], [0.048, -0.27, skin], [0.056, -0.2, skin], [0.075, -0.195, legs], [0.105, -0.18, legs], [0.108, -0.08, legs], [0.095, 0.03, legs], [0.001, 0.05, legs]];
    b.paint(P, 0, 0, 0, { line: 0.02, seg: 22 }); if (!overalls) b.rbox(0.04, 0.09, 0.075, legs, x > 0 ? 0.105 : -0.105, -0.1, 0.02, { line: 0.012 }); sole(b); });
  const L = leg(-0.11), R = leg(0.11);
  const tee = shirt, bot = overalls ? legs : shirt, pk = new THREE.Color(legs).multiplyScalar(0.78).getHex();
  const torsoFn = overalls ? (x, y, z, base) => {
    if (y > 1.1) return base; const ax = Math.abs(x);
    if (y < 0.86) return legs;
    if (z > 0 && ax < 0.1 && y < 1.0) return (ax < 0.052 && y > 0.885 && y < 0.95) ? pk : legs;      // bib + pocket
    if (ax > 0.06 && ax < 0.115 && (z < 0 ? y < 1.07 : y > 0.98)) return legs;                           // straps
    return tee; } : null;
  b.paint([[0.001, 0.5, bot], [0.195, 0.5, bot], [0.212, 0.55, bot], [0.2, 0.68, bot], [0.205, 0.84, bot], [0.208, 0.87, tee], [0.21, 0.9, tee], [0.2, 0.99, tee], [0.15, 1.05, tee], [0.095, 1.095, tee], [0.074, 1.12, skin], [0.07, 1.2, skin], [0.001, 1.2, skin]], 0, 0, 0, { line: 0.025, seg: 120, fn: torsoFn || undefined,
    bend: (x, y, z) => [0, 0, (y > 0.6 ? 0.012 * (1 - Math.abs(y - 0.95) / 0.35) : 0)] });
  const arm = x => limb(x, 0.96, b => {
    b.paint([[0.001, 0.07, tee], [0.06, 0.05, tee], [0.07, -0.02, tee], [0.068, -0.12, tee], [0.056, -0.125, skin], [0.052, -0.2, skin], [0.043, -0.3, skin], [0.05, -0.34, skin], [0.066, -0.39, skin], [0.064, -0.43, skin], [0.03, -0.46, skin], [0.001, -0.465, skin]].reverse(), 0, 0, 0, { line: 0.02, seg: 20, bend: (x, y, z) => { const t = Math.max(0, (-0.12 - y) / 0.35); return [0, 0.02 * t * t, 0.09 * t * t + 0.0]; } });
    const th = b.ball(0.026, skin, Math.sign(x) * -0.045, -0.385, 0.045, { line: 0.012, seg: 10 }); });
  const AL = arm(-0.275), AR = arm(0.275);
  const head = new THREE.Group(); head.position.y = 1.32; g.add(head); const hb = builder(head);
  hb.ball(0.27, skin, 0, 0, 0, { line: 0.025, seg: 28 });
  [-1, 1].forEach(sx => { const e = hb.ball(0.055, skin, sx * 0.262, -0.01, 0, { line: 0.015, seg: 14 }); e.scale.set(0.5, 1, 0.8); });
  const fp = facePatch(head, face); const mouth = new THREE.Object3D();
  hair(hb, head);
  return { g, L, R, AL, AR, head, mouth, fp, face };
}
const LEO = () => kid({ skin: 0x8D5A3B, shirt: 0x74C842, legs: 0x7B8446, shoes: 0x3D5FB5, face: { iris: '#4A2A14', skin: '#8D5A3B', brow: '#2A1B1B', cheek: '#D9704F', nose: '#6B3A24' }, hair: hb => {
  const A = 0x3B2416, C = [0, 0.09, -0.07], R = 0.31;
  const af = hb.ball(R, A, ...C, { line: 0.02, seg: 28 }); af.scale.set(1.1, 1.0, 1.03);
  const N = 70; for (let i = 0; i < N; i++) { const yy = 1 - (i + 0.5) / N * 1.55, rr = Math.sqrt(1 - yy * yy), th = i * 2.399963, px = Math.cos(th) * rr, pz = Math.sin(th) * rr;
    const x = C[0] + px * R * 1.1, y = C[1] + yy * R, z = C[2] + pz * R * 1.03; if (pz > 0.25 && y < 0.3) continue;
    hb.ball(0.09, A, x * 1.0, y, z, { line: 0, seg: 12 }); } } });
const MIA = () => kid({ overalls: true, skin: 0xF6D2B5, shirt: 0xF8A5C2, legs: 0xE5508F, shoes: 0xF48FB1, face: { iris: '#2F8FD6', skin: '#F6D2B5', brow: '#B8892B', cheek: '#F27C8E', nose: '#C98E74', lash: true }, hair: (hb, head) => {
const Y = 0xF2C94C;
  hb.ball(0.285, Y, 0, 0.07, -0.045, { line: 0.02, seg: 28 });
  [-1, 1].forEach(q => {
    const bg = hb.ball(0.1, Y, q * 0.115, 0.15, 0.185, { line: 0.012, seg: 16 }); bg.scale.set(1.9, 0.62, 0.5); bg.rotation.z = q * -0.75; bg.rotation.y = q * 0.25;
    const sd = hb.ball(0.1, Y, q * 0.225, 0.02, 0.07, { line: 0, seg: 14 }); sd.scale.set(0.55, 1.5, 0.9);
    hb.ball(0.045, 0xD94480, q * 0.275, 0.2, -0.04, { line: 0.012, seg: 14 });
    hb.tube([[q * 0.275, 0.2, -0.04], [q * 0.335, 0.13, -0.045], [q * 0.365, 0.0, -0.03], [q * 0.35, -0.12, 0.0]], t => 0.03 + 0.04 * Math.sin(Math.min(1, t * 1.15) * Math.PI * 0.9) + 0.003, Y, { line: 0.014 });
    hb.ball(0.034, Y, q * 0.35, -0.125, 0.0, { line: 0, seg: 12 }); }); } });

function dog() {
  const g = new THREE.Group(); const b = builder(g); const fur = 0xDDA24F, dark = 0xB9772F;
  const body = b.ball(0.24, fur, 0, 0.33, 0, { line: 0.02, seg: 24 }); body.scale.set(0.85, 0.8, 1.35);
  const legs = [[-0.12, 0.17], [0.12, 0.17], [-0.12, -0.17], [0.12, -0.17]].map(([x, z]) => { const p = new THREE.Group(); p.position.set(x, 0.26, z); g.add(p); builder(p).caps(0.06, 0.16, fur, 0, -0.13, 0, { line: 0.015 }); return p; });
  const head = new THREE.Group(); head.position.set(0, 0.55, 0.3); g.add(head); const hb = builder(head);
  hb.ball(0.19, fur, 0, 0, 0, { line: 0.02, seg: 24 }); const snout = hb.ball(0.1, 0xEBC27E, 0, -0.05, 0.16, { line: 0.015, seg: 18 }); snout.scale.set(0.95, 0.8, 1.35);
  hb.ball(0.04, 0x2E2A4F, 0, -0.01, 0.26, { line: 0 });
  [-0.07, 0.07].forEach(x => { hb.ball(0.035, 0x2E2A4F, x, 0.05, 0.15, { line: 0 }); hb.ball(0.012, 0xffffff, x + 0.01, 0.065, 0.18, { line: 0 }); });
  const ears = [-1, 1].map(s => { const e = hb.ball(0.09, dark, s * 0.17, -0.04, -0.02, { line: 0.015, seg: 16 }); e.scale.set(0.45, 1.7, 1.0); return e; });
  const col = hb.torus(0.135, 0.02, 0xD7263D, 0, -0.15, 0.03, { line: 0.012, seg: 20 }); col.rotation.x = Math.PI / 2 + 0.2;
  const tail = new THREE.Group(); tail.position.set(0, 0.42, -0.3); g.add(tail); builder(tail).caps(0.04, 0.18, fur, 0, 0.1, -0.03, { line: 0.015, rx: -0.6 });
  return { g, legs, head, ears, tail };
}

function animate(c, kind) {
  c.state = 'idle'; c.t0 = Math.random() * 10;
  c.pose = s => { c.state = s; };
  c.tick = (t) => {
    const s = c.state, k = t * (s === 'run' ? 11 : 5) + c.t0;
    if (kind === 'dog') {
      const run = s === 'run', sit = s === 'sit';
      c.legs.forEach((l, i) => l.rotation.x = run ? Math.sin(k + (i % 2 ? Math.PI : 0) + (i > 1 ? 0.6 : 0)) * 0.8 : 0);
      c.tail.rotation.z = Math.sin(t * (s === 'wag' || run ? 18 : 5)) * 0.6;
      c.head.rotation.x = s === 'bark' ? -0.3 + Math.abs(Math.sin(t * 12)) * 0.4 : sit ? -0.15 : Math.sin(t * 2) * 0.05;
      c.g.children[0].position.y = run ? 0.33 + Math.abs(Math.sin(k)) * 0.05 : 0.33;
      c.legs[2].rotation.x = c.legs[3].rotation.x = sit ? -1.2 : c.legs[2].rotation.x;
      c.ears.forEach((e, i) => e.rotation.z = (i ? -1 : 1) * (run ? 0.6 : 0.2));
      return;
    }
    const run = s === 'run', walk = s === 'walk';
    const sw = run ? 0.9 : walk ? 0.45 : 0;
    c.L.rotation.x = Math.sin(k) * sw; c.R.rotation.x = -Math.sin(k) * sw;
    c.AL.rotation.x = -Math.sin(k) * sw; c.AR.rotation.x = Math.sin(k) * sw;
    c.AL.rotation.z = -0.1; c.AR.rotation.z = 0.1; if (s === 'idle') { c.AL.rotation.x = Math.sin(t * 1.3 + c.t0) * 0.06; c.AR.rotation.x = -Math.sin(t * 1.3 + c.t0) * 0.06; c.g.rotation.z = Math.sin(t * 0.8 + c.t0) * 0.02; }
    if (s === 'scared' || s === 'cheer') { c.AL.rotation.z = -2.6 + Math.sin(t * 9) * 0.15; c.AR.rotation.z = 2.6 - Math.sin(t * 9) * 0.15; }
    if (s === 'reach') { c.AR.rotation.x = -1.5; c.AL.rotation.x = -0.3; }
    if (s === 'point') { c.AR.rotation.x = -1.6; }
    if (s === 'hold') { c.AR.rotation.x = c.AL.rotation.x = -1.1; c.AR.rotation.z = 0.35; c.AL.rotation.z = -0.35; }
    if (s === 'wow') { c.AL.rotation.x = c.AR.rotation.x = -0.5; c.AL.rotation.z = -0.9; c.AR.rotation.z = 0.9; }
    if (s === 'slide') { c.L.rotation.x = c.R.rotation.x = -1.45; c.AL.rotation.z = -2.3 + Math.sin(t * 7) * 0.15; c.AR.rotation.z = 2.3 - Math.sin(t * 7) * 0.15; }
    if (s === 'hug') { c.AL.rotation.x = c.AR.rotation.x = -1.5; c.AL.rotation.z = 0.35; c.AR.rotation.z = -0.35; c.L.rotation.x = 0.4 + Math.sin(t * 7) * 0.35; c.R.rotation.x = 0.4 - Math.sin(t * 7) * 0.35; }
    if (s === 'hide') { c.AR.rotation.x = c.AL.rotation.x = 0.75; c.AR.rotation.z = -0.35; c.AL.rotation.z = 0.35; }
    if (s === 'sit') { c.L.rotation.x = c.R.rotation.x = -1.4; }
    c.head.rotation.z = s === 'idle' ? Math.sin(t * 1.5 + c.t0) * 0.05 : 0;
    c.head.position.y = 1.32 + (run ? Math.abs(Math.sin(k)) * 0.04 : 0);
    { const bl = Math.sin(t * 0.9 + c.t0 * 2) > 0.985 && !c.forceFace; const e = c.forceFace || (bl ? 'blink' : (s === 'scared' || s === 'hide' ? 'scared' : s === 'wow' ? 'surprised' : s === 'cheer' || s === 'hug' || s === 'slide' ? 'happy' : s === 'reach' || s === 'hold' || s === 'run' ? 'determined' : 'happy')); if (e !== c.curFace) { c.curFace = e; c.fp.set(e); } }
    c.mouth.scale.y = s === 'scared' || s === 'hide' ? -1 : s === 'wow' ? -2 : 1; c.mouth.scale.x = s === 'wow' ? 0.8 : 1;
  };
  onTick(c.tick);
  return c;
}
// Fresh figures each time a place is built (the old world is thrown away).
export function makeCast(world) {
  const leo = animate(LEO(), 'kid'), mia = animate(MIA(), 'kid'), toby = animate(dog(), 'dog');
  [leo, mia, toby].forEach(c => c.g.traverse(o => { if (o.isMesh) o.userData.noRecv = true; }));
  [leo, mia, toby].forEach(c => world.add(c.g)); toby.g.scale.setScalar(1.1);
  return { leo, mia, toby, rearm: () => [leo, mia, toby].forEach(c => onTick(c.tick)) };
}
