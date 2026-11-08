// Leo, Mia and Toby as toon figures. Each has .g (group) and .pose(name); poses animate every frame.
import { THREE, builder, onTick, toon, outline } from './gfx.js';


// ---- grown-up faces: smaller almond eyes with real lids, heavier brows, a modelled nose and a thinner mouth ----
const ADULT = {        // lid: upper lid closing (0 open .. 1 shut); low: lower lid raised; bin/bout: brow inner/outer lift; mouth
  neutral:    { lid: 0.18, low: 0.05, bin: 0, bout: 0, mouth: 'flat' },
  kind:       { lid: 0.22, low: 0.32, bin: 4, bout: -2, mouth: 'smile', crinkle: 1 },
  happy:      { lid: 0.25, low: 0.42, bin: 3, bout: -3, mouth: 'grin', crinkle: 1 },
  talk:       { lid: 0.16, low: 0.08, bin: 2, bout: 0, mouth: 'talk' },
  sad:        { lid: 0.38, low: 0.05, bin: 14, bout: -8, mouth: 'down' },
  surprised:  { lid: 0.0, low: 0.0, bin: 16, bout: 12, wide: 1.25, mouth: 'o' },
  scared:     { lid: 0.0, low: 0.0, bin: 14, bout: -2, wide: 1.2, mouth: 'grimace' },
  determined: { lid: 0.3, low: 0.12, bin: -10, bout: 2, mouth: 'firm' },
  angry:      { lid: 0.4, low: 0.22, bin: -26, bout: 8, mouth: 'snarl' },
  sly:        { lid: 0.42, low: 0.22, bin: -6, bout: 4, mouth: 'smirk', lift: 1 },
  blink:      { lid: 1, low: 0, bin: 0, bout: 0, mouth: 'flat' },
};
function adultFace(x, expr, o) {
  const E = ADULT[expr] || ADULT.neutral, ink = '#2A1B14', EX = o.ex || 90, EY = 150, W = 37 * (o.ew || 1), H = 17 * (o.eh2 || 1) * (E.wide || 1), skin = o.skin;
  const eye = s => {   // s = -1 left, 1 right; drawn in a local frame where +x points to the outer corner
    x.save(); x.translate(256 + s * EX, EY); x.scale(s, 1);
    const up = () => { x.moveTo(-W, 2); x.bezierCurveTo(-W * 0.45, -H * 1.55, W * 0.45, -H * 1.6, W, -2); }, lo = () => { x.bezierCurveTo(W * 0.45, H * 1.05, -W * 0.45, H * 1.1, -W, 2); };
    x.save(); x.beginPath(); up(); lo(); x.closePath(); x.fillStyle = '#F1EBDF'; x.fill(); x.clip();
    const ir = H * 1.08, lx = (o.look || 0) * s; x.beginPath(); x.arc(lx, H * 0.1, ir, 0, 7); x.fillStyle = o.iris; x.fill();
    x.beginPath(); x.arc(lx, H * 0.1, ir, 0, 7); x.lineWidth = 2.5; x.strokeStyle = 'rgba(20,15,10,0.55)'; x.stroke();
    x.beginPath(); x.arc(lx, H * 0.1, ir * 0.45, 0, 7); x.fillStyle = '#15100C'; x.fill();
    x.beginPath(); x.arc(lx - ir * 0.35, -H * 0.25, 2.6, 0, 7); x.fillStyle = '#fff'; x.fill();
    const lid = E.lid + (E.lift && s > 0 ? -0.12 : 0);
    if (lid > 0) { x.fillStyle = skin; x.beginPath(); x.moveTo(-W - 4, -H * 2); x.lineTo(W + 4, -H * 2); x.lineTo(W + 4, -H * 1.6 + H * 3 * lid); x.quadraticCurveTo(0, -H * 1.3 + H * 3.1 * lid, -W - 4, -H * 1.6 + H * 3 * lid); x.fill(); }
    if (E.low > 0) { x.fillStyle = skin; x.beginPath(); x.moveTo(-W - 4, H * 2); x.lineTo(W + 4, H * 2); x.lineTo(W + 4, H * 1.4 - H * 2.4 * E.low); x.quadraticCurveTo(0, H * 1.0 - H * 2.6 * E.low, -W - 4, H * 1.4 - H * 2.4 * E.low); x.fill(); }
    x.restore();
    // upper lid line (heavy, with a flick past the outer corner), lower lid (light), crease above
    x.strokeStyle = ink; x.lineWidth = o.lidW || 6;
    if (E.lid >= 1) { x.beginPath(); x.moveTo(-W, 2); x.quadraticCurveTo(0, H * 0.7, W, 0); x.stroke(); }
    else { const k = Math.min(1, E.lid + (E.lift && s > 0 ? -0.12 : 0)); x.beginPath(); x.moveTo(-W, 2 + k * 6); x.bezierCurveTo(-W * 0.45, -H * 1.55 + H * 2.6 * k, W * 0.45, -H * 1.6 + H * 2.6 * k, W + 5, -4 + k * 8); x.stroke();
      x.lineWidth = 2.5; x.globalAlpha = 0.55; x.beginPath(); x.moveTo(-W + 6, 4); x.bezierCurveTo(-W * 0.4, H * 1.15 - H * 2.5 * E.low, W * 0.4, H * 1.05 - H * 2.4 * E.low, W - 2, 2); x.stroke(); x.globalAlpha = 1; }
    x.strokeStyle = o.crease || 'rgba(90,50,30,0.45)'; x.lineWidth = 3; x.beginPath(); x.moveTo(-W * 0.7, -H * 1.45); x.quadraticCurveTo(0, -H * 2.15, W * 0.85, -H * 1.2); x.stroke();
    if (o.old) { x.beginPath(); x.moveTo(-W * 0.6, H * 1.55); x.quadraticCurveTo(0, H * 2.3, W * 0.7, H * 1.4); x.stroke(); }
    if (E.crinkle || o.old) { x.lineWidth = 2.5; for (let k = 0; k < (o.old ? 3 : 2); k++) { x.beginPath(); x.moveTo(W + 8, -6 + k * 8); x.lineTo(W + 22, -12 + k * 12); x.stroke(); } }
    // brow: a thick tapered stroke, inner end towards the nose
    const bi = -H * 2.6 - E.bin - (E.lift && s > 0 ? 8 : 0), bo = -H * 2.4 - E.bout - (E.lift && s > 0 ? 6 : 0);
    x.fillStyle = o.brow; x.beginPath(); x.moveTo(-W * 1.05, bi + 5); x.quadraticCurveTo(-W * 0.2, bi - 8 + (bo - bi) * 0.4, W * 1.1, bo); x.quadraticCurveTo(-W * 0.1, bi + 2 + (bo - bi) * 0.4, -W * 1.05, bi + 5 + (o.browH || 12)); x.closePath(); x.fill();
    x.restore(); };
  eye(-1); eye(1);
  // nose: one shaded side of the bridge, a rounded tip and the nostril wings
  x.strokeStyle = o.nose; x.lineCap = 'round'; x.lineWidth = 4.5; x.globalAlpha = 0.7; x.beginPath(); x.moveTo(242, 150); x.quadraticCurveTo(236, 180, 240, 198); x.stroke(); x.globalAlpha = 1;
  x.lineWidth = 5; x.beginPath(); x.moveTo(232, 204); x.quadraticCurveTo(238, 214, 250, 212); x.moveTo(262, 212); x.quadraticCurveTo(274, 214, 280, 204); x.stroke();
  x.lineWidth = 4; x.beginPath(); x.moveTo(248, 214); x.quadraticCurveTo(256, 218, 264, 214); x.stroke();
  if (o.old || o.lines) { x.strokeStyle = o.wrinkles || o.nose; x.lineWidth = 3.5; x.globalAlpha = 0.75; [-1, 1].forEach(s => { x.beginPath(); x.moveTo(256 + s * 34, 206); x.quadraticCurveTo(256 + s * 52, 236, 256 + s * 44, 262); x.stroke(); }); x.globalAlpha = 1; }
  if (o.old) { x.strokeStyle = o.wrinkles; x.lineWidth = 3; x.globalAlpha = 0.6; for (let k = 0; k < 3; k++) { x.beginPath(); x.moveTo(256 - 64 + k * 6, 66 + k * 11); x.quadraticCurveTo(256, 58 + k * 11 - (E.bin > 8 ? 6 : 0), 256 + 64 - k * 6, 66 + k * 11); x.stroke(); } x.globalAlpha = 1; }
  // mouth (kept inside the gap the beard leaves)
  const my = o.mouthY || 252, lip = o.lip || '#8A4A3E', dark = '#3A1614', teeth = '#F4EEE2';
  x.lineCap = 'round'; x.strokeStyle = ink; x.lineWidth = 5;
  const M = E.mouth;
  if (M === 'flat') { x.beginPath(); x.moveTo(228, my); x.quadraticCurveTo(256, my + 3, 284, my - 1); x.stroke(); }
  else if (M === 'smile') { x.beginPath(); x.moveTo(222, my - 6); x.quadraticCurveTo(256, my + 12, 290, my - 6); x.stroke(); }
  else if (M === 'down') { x.beginPath(); x.moveTo(226, my + 6); x.quadraticCurveTo(256, my - 6, 286, my + 6); x.stroke(); }
  else if (M === 'firm') { x.beginPath(); x.moveTo(226, my + 3); x.lineTo(286, my + 1); x.stroke(); }
  else if (M === 'smirk') { x.beginPath(); x.moveTo(230, my + 2); x.quadraticCurveTo(262, my + 4, 292, my - 10); x.stroke(); }
  else if (M === 'o') { x.fillStyle = dark; x.beginPath(); x.ellipse(256, my + 4, 13, 17, 0, 0, 7); x.fill(); x.stroke(); }
  else if (M === 'talk') { x.fillStyle = dark; x.beginPath(); x.ellipse(256, my + 2, 22, 9, 0, 0, 7); x.fill(); x.lineWidth = 3.5; x.stroke(); }
  else { // grin / grimace / snarl: an open mouth showing teeth
    const w = M === 'snarl' ? 40 : M === 'grin' ? 34 : 30, top = M === 'grin' ? my - 8 : my - 4, bot = M === 'grimace' ? my + 16 : M === 'snarl' ? my + 12 : my + 16, curve = M === 'grin' ? 10 : M === 'snarl' ? -2 : -6;
    x.beginPath(); x.moveTo(256 - w, top); x.quadraticCurveTo(256, top + curve * 0.4 - 2, 256 + w, top - (M === 'snarl' ? 6 : 0)); x.quadraticCurveTo(256, bot + curve, 256 - w, top); x.closePath(); x.fillStyle = dark; x.fill();
    x.save(); x.clip(); x.fillStyle = teeth; x.fillRect(256 - w, top - 10, w * 2, (M === 'grin' ? 9 : 11) + 10); if (M !== 'grin') x.fillRect(256 - w, bot + curve - 9, w * 2, 12);
    x.strokeStyle = 'rgba(80,60,50,0.6)'; x.lineWidth = 1.8; for (let k = -3; k <= 3; k++) { x.beginPath(); x.moveTo(256 + k * w / 3.6, top - 6); x.lineTo(256 + k * w / 3.6, top + 10); x.stroke(); } x.restore();
    x.strokeStyle = ink; x.lineWidth = 4.5; x.stroke(); }
}

// ---- painted faces: one canvas per expression, swapped onto a curved patch of the head ----
const FACE = { W: 512, H: 320 };
function paintFace(expr, o) {
  const c = document.createElement('canvas'); c.width = FACE.W; c.height = FACE.H; const x = c.getContext('2d');
  const FS = o.adult ? 1.25 : 1.4; x.translate(256, o.adult ? 140 : 150); x.scale(FS, FS); x.translate(-256, -165); x.lineCap = 'round'; x.lineJoin = 'round'; const ink = '#2A1B1B';
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
  const EX = o.ex || 98, EY = 148, ER = o.er || 28, EH = o.eh || 40;
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
  if (o.adult) adultFace(x, expr, o); else (E[expr] || E.happy)();
  if (o.freckles) { x.fillStyle = o.freckles; x.globalAlpha = 0.6; [[-70, 200], [-52, 212], [-88, 214], [-60, 192], [70, 200], [52, 212], [88, 214], [60, 192]].forEach(([dx, dy]) => { x.beginPath(); x.arc(256 + dx, dy, 4.5, 0, 7); x.fill(); }); x.globalAlpha = 1; }
  if (o.wrinkles) { x.strokeStyle = o.wrinkles; x.lineWidth = 4; [-1, 1].forEach(sd => { for (let k = 0; k < 3; k++) { x.beginPath(); x.moveTo(256 + sd * (EX + ER + 6), EY - 8 + k * 11); x.lineTo(256 + sd * (EX + ER + 26), EY - 16 + k * 15); x.stroke(); } });
    for (let k = 0; k < 2; k++) { x.beginPath(); x.moveTo(256 - 60, 64 + k * 12); x.quadraticCurveTo(256, 56 + k * 12, 256 + 60, 64 + k * 12); x.stroke(); } }
  x.setTransform(1, 0, 0, 1, 0, 0);
  if (o.shade) { // the hood's shadow: a soft band over the brow and eyes, fading out downwards and towards the sides
    const sc = document.createElement('canvas'); sc.width = 512; sc.height = 320; const y = sc.getContext('2d');
    const gr = y.createLinearGradient(0, 0, 0, 178); gr.addColorStop(0, 'rgba(22,26,16,0.8)'); gr.addColorStop(0.6, 'rgba(22,26,16,0.55)'); gr.addColorStop(1, 'rgba(22,26,16,0)'); y.fillStyle = gr; y.fillRect(0, 0, 512, 178);
    y.globalCompositeOperation = 'destination-in'; const hg = y.createLinearGradient(0, 0, 512, 0); hg.addColorStop(0, 'rgba(0,0,0,0)'); hg.addColorStop(0.1, 'rgba(0,0,0,1)'); hg.addColorStop(0.9, 'rgba(0,0,0,1)'); hg.addColorStop(1, 'rgba(0,0,0,0)'); y.fillStyle = hg; y.fillRect(0, 0, 512, 320);
    x.globalCompositeOperation = 'source-atop'; x.drawImage(sc, 0, 0); x.globalCompositeOperation = 'destination-over'; x.drawImage(sc, 0, 0); x.globalCompositeOperation = 'source-over'; }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
const FACES = {};
function facePatch(head, o) {
  const key = JSON.stringify(o); const maps = FACES[key] || (FACES[key] = {});
  const geo = new THREE.SphereGeometry(0.2735, 28, 18, Math.PI / 2 - 0.95, 1.9, Math.PI / 2 - 0.55, 1.2);
  const mat = new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, toneMapped: false });
  const m = new THREE.Mesh(geo, mat); m.renderOrder = 2; head.add(m);
  const set = e => { mat.map = maps[e] || (maps[e] = paintFace(e, o)); mat.needsUpdate = true; };
  set('happy'); return { mesh: m, set };
}
function kid({ skin, shirt, legs, shoes, hair, face, overalls, sock, torso, sleeve, cuff }) {
  const g = new THREE.Group(); const b = builder(g);
  const limb = (x, y, parts) => { const p = new THREE.Group(); p.position.set(x, y, 0); g.add(p); parts(builder(p)); return p; };
  const E = (o, sx, sy, sz) => { o.scale.set(sx, sy, sz); return o; };
  const sole = (b) => { E(b.ball(0.1, 0xF4F1EA, 0, -0.485, 0.045, { line: 0.02, seg: 18 }), 1.0, 0.3, 1.6); E(b.ball(0.1, shoes, 0, -0.45, 0.04, { line: 0.02, seg: 18 }), 0.92, 0.6, 1.5); };
  // one smooth shape per limb / torso; colour is painted along its length
  const W = sock || 0xF4F1EA, cuffC = new THREE.Color(legs).lerp(new THREE.Color(0xffffff), 0.25).getHex();
  const leg = x => limb(x, 0.5, b => {
    const P = overalls
      ? [[0.001, -0.43, legs], [0.07, -0.425, cuffC], [0.098, -0.395, cuffC], [0.098, -0.36, cuffC], [0.088, -0.35, legs], [0.088, -0.2, legs], [0.098, -0.05, legs], [0.085, 0.04, legs], [0.001, 0.05, legs]]
      : [[0.001, -0.435, W], [0.05, -0.43, W], [0.058, -0.38, W], [0.054, -0.33, W], [0.05, -0.32, skin], [0.048, -0.27, skin], [0.056, -0.2, skin], [0.075, -0.195, legs], [0.105, -0.18, legs], [0.108, -0.08, legs], [0.095, 0.03, legs], [0.001, 0.05, legs]];
    b.paint(P, 0, 0, 0, { line: 0.02, seg: 22 }); if (!overalls) b.rbox(0.04, 0.09, 0.075, legs, x > 0 ? 0.105 : -0.105, -0.1, 0.02, { line: 0.012 }); sole(b); });
  const L = leg(-0.11), R = leg(0.11);
  const tee = shirt, bot = overalls ? legs : shirt, pk = new THREE.Color(legs).multiplyScalar(0.78).getHex();
  const torsoFn = torso ? (x, y, z, base) => torso(x, y, z, base) : overalls ? (x, y, z, base) => {
    if (y > 1.1) return base; const ax = Math.abs(x);
    if (y < 0.86) return legs;
    if (z > 0 && ax < 0.1 && y < 1.0) return (ax < 0.052 && y > 0.885 && y < 0.95) ? pk : legs;      // bib + pocket
    if (ax > 0.06 && ax < 0.115 && (z < 0 ? y < 1.07 : y > 0.98)) return legs;                           // straps
    return tee; } : null;
  b.paint([[0.001, 0.5, bot], [0.195, 0.5, bot], [0.212, 0.55, bot], [0.2, 0.68, bot], [0.205, 0.84, bot], [0.208, 0.87, tee], [0.21, 0.9, tee], [0.2, 0.99, tee], [0.15, 1.05, tee], [0.095, 1.095, tee], [0.074, 1.12, skin], [0.07, 1.2, skin], [0.001, 1.2, skin]], 0, 0, 0, { line: 0.025, seg: 120, fn: torsoFn || undefined,
    bend: (x, y, z) => [0, 0, (y > 0.6 ? 0.012 * (1 - Math.abs(y - 0.95) / 0.35) : 0)] });
  const arm = x => limb(x, 0.96, b => {
    const AP = sleeve === 'long' ? [[0.001, 0.07, tee], [0.06, 0.05, tee], [0.07, -0.02, tee], [0.067, -0.12, tee], [0.06, -0.2, tee], [0.066, -0.215, cuff || tee], [0.066, -0.265, cuff || tee], [0.048, -0.27, skin], [0.044, -0.3, skin], [0.05, -0.34, skin], [0.066, -0.39, skin], [0.064, -0.43, skin], [0.03, -0.46, skin], [0.001, -0.465, skin]]
      : [[0.001, 0.07, tee], [0.06, 0.05, tee], [0.07, -0.02, tee], [0.068, -0.12, tee], [0.056, -0.125, skin], [0.052, -0.2, skin], [0.043, -0.3, skin], [0.05, -0.34, skin], [0.066, -0.39, skin], [0.064, -0.43, skin], [0.03, -0.46, skin], [0.001, -0.465, skin]];
    b.paint(AP.reverse(), 0, 0, 0, { line: 0.02, seg: 20, bend: (x, y, z) => { const t = Math.max(0, (-0.12 - y) / 0.35); return [0, 0.02 * t * t, 0.09 * t * t + 0.0]; } });
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
    c.head.position.y = (c.headY || 1.32) + (run ? Math.abs(Math.sin(k)) * 0.04 : 0);
    { const bl = Math.sin(t * 0.9 + c.t0 * 2) > 0.985 && !c.forceFace; const e = c.forceFace || (bl ? 'blink' : (s === 'scared' || s === 'hide' ? 'scared' : s === 'wow' ? 'surprised' : s === 'cheer' || s === 'hug' || s === 'slide' ? 'happy' : s === 'reach' || s === 'hold' || s === 'run' ? 'determined' : (c.face && c.face.adult ? (s === 'talk' ? (Math.sin(t * 9) > 0 ? 'talk' : 'neutral') : 'neutral') : 'happy'))); if (e !== c.curFace) { c.curFace = e; c.fp.set(e); } }
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

// ---------------------------------------------------------------- the old man of the gray shore
// A hooded, ragged cloak, a grey beard and a walking stick. Poses: idle, talk, kind, soup, point, grab, cold.
export function makeOldMan(world) {
  const g = new THREE.Group(); const b = builder(g);
  const CL = 0x5E6540, CL2 = 0x464B30, SK = 0xD9AC84, BE = 0xDCDED8, WOOD = 0x6B4A2E;
  b.paint([[0.001, 0.05, CL2], [0.5, 0.08, CL2], [0.47, 0.3, CL], [0.38, 0.72, CL], [0.31, 1.05, CL], [0.27, 1.3, CL], [0.001, 1.36, CL]], 0, 0, 0, { line: 0.03, seg: 28 });
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; b.cone(0.1, 0.26, i % 2 ? CL : CL2, Math.cos(a) * 0.49, 0.12, Math.sin(a) * 0.49, { rx: Math.PI, line: 0.012, seg: 5 }); }
  b.box(0.7, 0.07, 0.06, 0x3A3022, 0, 0.88, 0.34, { rx: 0.25, line: 0.015 });                      // a rope belt
  const legs = [-0.13, 0.13].map(x => { const p = new THREE.Group(); p.position.set(x, 0.2, 0.05); g.add(p); builder(p).box(0.16, 0.22, 0.26, 0x2E2418, 0, -0.1, 0.04, { line: 0.02 }); return p; });
  // head with a deep hood
  const head = new THREE.Group(); head.position.y = 1.52; g.add(head); const hb = builder(head);
  const hood = hb.ball(0.37, CL, 0, 0.02, -0.04, { line: 0.03, seg: 26 }); hood.scale.set(1, 1.08, 1.1);
  hb.cone(0.22, 0.55, CL, 0, 0.18, -0.4, { rx: -1.25, line: 0.025, seg: 14 });                      // the hood's soft point behind
  const cave = hb.ball(0.27, 0x20261A, 0, -0.01, 0.17, { line: 0, seg: 20 }); cave.scale.set(1, 1.05, 0.85);
  hb.ball(0.19, SK, 0, -0.04, 0.2, { line: 0.012, seg: 20 }).scale.set(1, 1.05, 0.9);
  [-1, 1].forEach(s => { hb.ball(0.036, 0xFFFDF0, s * 0.075, 0.03, 0.355, { line: 0, seg: 10 }); hb.ball(0.02, 0x10202A, s * 0.075, 0.03, 0.385, { line: 0, seg: 8 }); });
  const brows = [-1, 1].map(s => hb.box(0.11, 0.03, 0.03, 0xC9CBC4, s * 0.08, 0.1, 0.37, { line: 0 }));
  hb.ball(0.05, 0xC99A72, 0, -0.03, 0.4, { line: 0.01, seg: 10 });
  const beard = hb.cone(0.2, 0.46, BE, 0, -0.3, 0.26, { rx: Math.PI + 0.12, line: 0.02, seg: 16 }); beard.scale.set(1, 1, 0.7);
  [-1, 1].forEach(s => { const m = hb.ball(0.06, BE, s * 0.065, -0.1, 0.4, { line: 0.01, seg: 10 }); m.scale.set(1.3, 0.7, 0.8); });
  const mouth = hb.torus(0.05, 0.013, 0x2A1B1B, 0, -0.17, 0.4, { arc: Math.PI, rz: Math.PI, line: 0, seg: 14 });
  // arms: a sleeve and a hand, hanging from the shoulder
  const arm = s => { const p = new THREE.Group(); p.position.set(s * 0.32, 1.22, 0); g.add(p); const a = builder(p);
    a.cyl(0.1, 0.14, 0.58, CL, 0, -0.28, 0, { line: 0.02 }); a.ball(0.065, SK, 0, -0.6, 0.02, { line: 0.012, seg: 10 }); return p; };
  const AL = arm(-1), AR = arm(1);
  // the walking stick (right hand) and two soup bowls
  const staff = new THREE.Group(); staff.position.set(0, -0.6, 0.05); AR.add(staff); const sb = builder(staff);
  sb.cyl(0.032, 0.04, 1.9, WOOD, 0, 0.15, 0, { line: 0.015 }); sb.torus(0.12, 0.03, WOOD, 0.1, 1.12, 0, { arc: Math.PI * 1.3, rz: 0.4, line: 0.01 });
  const bowl = new THREE.Group(); bowl.position.set(0, -0.62, 0.12); AL.add(bowl); const bb = builder(bowl);
  bb.cyl(0.16, 0.09, 0.1, 0x7B5A3A, 0, 0, 0, { line: 0.015 }); bb.cyl(0.14, 0.14, 0.012, 0xE59A3E, 0, 0.05, 0, { line: 0 }); bowl.visible = false;
  g.userData.old = true;
  const o = { g, head, AL, AR, mouth, brows, bowl, staff, legs, state: 'idle', t0: Math.random() * 10 };
  let ar = 0, al = 0, lean = 0, ml = 1, blz = 0;
  o.pose = s => { o.state = s; bowl.visible = s === 'soup'; };
  o.tick = (t, dt = 0.016) => {
    const s = o.state, k = Math.min(1, dt * 8);
    const tAR = s === 'point' ? -1.6 : s === 'grab' ? -1.75 : s === 'soup' ? -1.0 : s === 'kind' ? -0.35 : s === 'cold' ? -0.2 : 0;
    const tAL = s === 'grab' ? -1.75 : s === 'soup' ? -1.2 : s === 'kind' ? -0.5 : s === 'talk' ? -0.5 + Math.sin(t * 3) * 0.2 : 0;
    ar += (tAR - ar) * k; al += (tAL - al) * k; lean += ((s === 'grab' ? 0.35 : 0) - lean) * k;
    AR.rotation.x = ar; AL.rotation.x = al; AL.rotation.z = -0.1; AR.rotation.z = 0.1; g.rotation.x = lean;
    const happy = s === 'kind' || s === 'soup' || s === 'cold';
    ml += ((s === 'cold' ? 1.2 : happy ? 1 : s === 'talk' ? 0.4 + Math.abs(Math.sin(t * 9)) * 0.9 : 0.2) - ml) * k;
    mouth.scale.set(s === 'cold' ? 1.3 : 1, happy ? 1 : -ml * 0.6, 1); if (happy) mouth.scale.y = ml;
    brows[0].rotation.z = s === 'cold' ? -0.4 : 0.1; brows[1].rotation.z = s === 'cold' ? 0.4 : -0.1;
    head.rotation.x = s === 'talk' ? Math.sin(t * 4) * 0.06 : s === 'kind' ? 0.1 : s === 'cold' ? -0.08 : 0;
    g.position.y += 0; head.position.y = 1.52 + Math.sin(t * 1.6 + o.t0) * 0.012;
    staff.rotation.z = Math.sin(t * 1.1 + o.t0) * 0.01;
  };
  onTick((t, dt) => o.tick(t, dt));
  g.traverse(m => { if (m.isMesh) m.userData.noRecv = true; });
  world.add(g); return o;
}

// ---------------------------------------------------------------- Jack, three ages (built in the same toon language as Leo and Mia)
const sm01 = v => { v = Math.max(0, Math.min(1, v)); return v * v * (3 - 2 * v); };
const rnd = seed => () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
// a surface over the head sphere, described in (theta from the top, phi round from the front); rFn gives the radius, null = no surface there
function headShell(head, color, { th0 = () => 0, th1, ph0 = -Math.PI, ph1 = Math.PI, rFn, nc = 150, nr = 30, line = 0.012, phWarp = null }) {
  const pos = [], idx = [];
  for (let i = 0; i <= nc; i++) { const ph = ph0 + (ph1 - ph0) * i / nc, a = th0(ph), b = th1(ph);
    for (let j = 0; j <= nr; j++) { const v = j / nr, th = a + (b - a) * v, r = rFn(th, ph, v, a, b), pw = phWarp ? phWarp(ph, v) : ph;
      pos.push(r * Math.sin(th) * Math.sin(pw), r * Math.cos(th), r * Math.sin(th) * Math.cos(pw)); } }
  for (let i = 0; i < nc; i++) for (let j = 0; j < nr; j++) { const a = i * (nr + 1) + j, b = a + nr + 1; idx.push(a, a + 1, b, a + 1, b + 1, b); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  const m = new THREE.Mesh(g, toon(color, { side: THREE.DoubleSide })); if (line) outline(m, line); head.add(m); m.castShadow = true; return m;
}
// messy hair: a cap with uneven, slightly pointed tufts round the edge and a few soft peaks on the crown (no balls)
function messyHair(head, color, { front = 0.98, back = 2.05, R = 0.284, tufts = 17, jag = 0.2, spikes = 5, seed = 7, sweep = 0.18, crown = 0.025, flare = 0.07, recede = 0 } = {}) {
  const r = rnd(seed), T = Array.from({ length: tufts }, () => 0.55 + r() * 0.75), PH = r() * 6.28;
  // a few small, narrow spikes from the mess (not a peak): low and sharp
  const pk = Array.from({ length: spikes }, () => ({ th: 0.35 + r() * 0.6, ph: (r() - 0.5) * 2.6, a: 0.014 + r() * 0.012, w: 0.09 + r() * 0.05 }));
  const tri = ph => { const u = ((ph + Math.PI) / (2 * Math.PI)) * tufts + PH, k = Math.floor(u), f = u - k; return { t: Math.pow(1 - Math.abs(2 * f - 1), 1.6), L: T[((k % tufts) + tufts) % tufts] }; };
  const edge = ph => { const a = Math.abs(ph) / Math.PI, { t, L } = tri(ph); return front + recede * sm01((Math.abs(ph) - 0.3) / 0.35) * (1 - sm01((Math.abs(ph) - 1.0) / 0.4)) + (back - front) * Math.pow(a, 1.25) + jag * L * t * (1 - 0.35 * a); };
  return headShell(head, color, { th1: edge, rFn: (th, ph, v) => {
      // follows the skull closely, a little fuller on the crown and at the back, with a gentle irregular surface
      let rr = R * (1 + crown * Math.pow(Math.cos(Math.min(th, 1.5)), 2) + 0.01 * Math.sin(ph * 9 + th * 11) * Math.cos(ph * 4 - th * 6));
      pk.forEach(p => { const d = Math.hypot(th - p.th, Math.sin((ph - p.ph) / 2) * 2 * Math.max(0.3, Math.sin(th))); rr += p.a * Math.pow(Math.max(0, 1 - d / p.w), 2.2); });
      const { t, L } = tri(ph); return rr * (1 + flare * v * v * v * t * L); },
    phWarp: (ph, v) => ph + sweep * v * v * Math.cos(ph) });
}
// a beard as a raised block of colour that hugs the face; the mouth stays clear
function beard(head, color, { top = 2.17, bottom = 2.82, cheek = 1.72, side = 1.4, width = 1.4, R = 0.27, lift = 0.022, full = 0.03, point = 0, seed = 3 } = {}) {
  const r = rnd(seed), J = Array.from({ length: 12 }, () => r());
  const t0 = ph => { const a = Math.abs(ph); return top - (top - cheek) * sm01((a - 0.3) / 0.24) - (cheek - side) * sm01((a - 0.62) / 0.7); };
  const t1 = ph => { const a = Math.abs(ph), k = Math.floor((ph / width + 1) * 5.5); return bottom + point * (1 - sm01(a / 0.5)) - (bottom - 2.35) * sm01((a - 0.75) / 0.65) + 0.05 * (J[Math.max(0, Math.min(11, k))] - 0.5); };
  const rf = (th, ph, v, a, b) => { const e = Math.min(v, 1 - v, (width - Math.abs(ph)) / 0.08); return R * (1 + 0.004 + (lift + full * sm01((th - top) / 0.5)) * sm01(e / 0.12)) + 0.0025 * Math.sin(th * 40 + ph * 23); };
  const bm = headShell(head, color, { th0: t0, th1: t1, ph0: -width, ph1: width, rFn: rf, nc: 90, nr: 26 });
  // moustache, joined to the beard at the corners of the mouth
  const mt0 = ph => 1.765 + 0.12 * sm01((Math.abs(ph) - 0.2) / 0.16), mt1 = ph => 1.86 + 0.32 * sm01((Math.abs(ph) - 0.16) / 0.22);
  const mm = headShell(head, color, { th0: mt0, th1: mt1, ph0: -0.46, ph1: 0.46, rFn: (th, ph, v) => R * (1 + 0.004 + lift * 1.1 * sm01(Math.min(v, 1 - v, (0.46 - Math.abs(ph)) / 0.1) / 0.15)), nc: 40, nr: 10 });
  return [bm, mm];
}
// a grown-up body in the kids' style: same lathe-painted shapes, longer legs, broader chest, slightly smaller head
function adult({ skin, shirt, sleeve, cuffC, legsC, boots, bootCuff, torso, face, hair, bracer, headS = 0.93 }) {
  const g = new THREE.Group(); const b = builder(g);
  const limb = (x, y, parts) => { const p = new THREE.Group(); p.position.set(x, y, 0); g.add(p); parts(builder(p)); return p; };
  const HIP = 0.86;
  const leg = x => limb(x, HIP, q => {
    q.paint([[0.001, -0.86, boots], [0.075, -0.855, boots], [0.096, -0.82, boots], [0.094, -0.66, boots], [0.104, -0.64, bootCuff], [0.104, -0.58, bootCuff], [0.086, -0.57, legsC], [0.092, -0.4, legsC], [0.108, -0.2, legsC], [0.118, -0.02, legsC], [0.001, 0.05, legsC]], 0, 0, 0, { line: 0.02, seg: 22 });
    const toe = q.ball(0.1, boots, 0, -0.81, 0.07, { line: 0.02, seg: 16 }); toe.scale.set(0.95, 0.55, 1.35); });
  const L = leg(-0.125), R = leg(0.125);
  b.paint([[0.001, 0.84, legsC], [0.24, 0.84, legsC], [0.252, 0.92, legsC], [0.238, 1.04, shirt], [0.24, 1.12, shirt], [0.258, 1.3, shirt], [0.252, 1.42, shirt], [0.2, 1.5, shirt], [0.12, 1.55, shirt], [0.085, 1.575, skin], [0.08, 1.66, skin], [0.001, 1.66, skin]], 0, 0, 0, { line: 0.025, seg: 120, fn: torso ? (x, y, z, base) => torso(x, y, z, base) : undefined,
    bend: (x, y, z) => [0, 0, (y > 0.95 ? 0.016 * (1 - Math.abs(y - 1.3) / 0.4) : 0)] });
  const arm = x => limb(x, 1.42, q => {
    const BR = bracer || sleeve;
    q.paint([[0.001, 0.07, sleeve], [0.07, 0.05, sleeve], [0.084, -0.02, sleeve], [0.08, -0.2, sleeve], [0.072, -0.34, sleeve], [0.078, -0.36, BR], [0.078, -0.52, BR], [0.07, -0.53, cuffC || sleeve], [0.068, -0.56, cuffC || sleeve], [0.054, -0.57, skin], [0.05, -0.6, skin], [0.06, -0.63, skin], [0.074, -0.68, skin], [0.072, -0.72, skin], [0.035, -0.75, skin], [0.001, -0.755, skin]].reverse(), 0, 0, 0, { line: 0.02, seg: 20, bend: (x, y, z) => { const t = Math.max(0, (-0.3 - y) / 0.45); return [0, 0.02 * t * t, 0.1 * t * t]; } });
    q.ball(0.03, skin, Math.sign(x) * -0.05, -0.67, 0.07, { line: 0.012, seg: 10 }); });
  const AL = arm(-0.33), AR = arm(0.33);
  const head = new THREE.Group(); head.position.y = 1.86; head.scale.setScalar(headS); g.add(head); const hb = builder(head);
  hb.ball(0.27, skin, 0, 0, 0, { line: 0.025, seg: 28 });
  [-1, 1].forEach(sx => { const e = hb.ball(0.055, skin, sx * 0.262, -0.01, 0, { line: 0.015, seg: 14 }); e.scale.set(0.5, 1, 0.8); });
  const fp = facePatch(head, face); hair && hair(hb, head);
  return { g, L, R, AL, AR, head, mouth: new THREE.Object3D(), fp, face, headY: 1.86 };
}
const finish = (c, world) => { c.g.traverse(o => { if (o.isMesh) o.userData.noRecv = true; }); world.add(c.g); onTick(c.tick); return c; };

// Jack as the lost boy: tousled brown hair, teal eyes, freckles, cream shirt with rolled sleeves, open teal waistcoat, red-brown sash, knee-length trousers, brown shoes
export function makeJackBoy(world) {
  const SK = 0xF2CDA8, SH = 0xE7DDC2, VE = 0x36535F, SA = 0x8A3B2C, TR = 0x6F6A47;
  const c = animate(kid({ skin: SK, shirt: SH, legs: TR, shoes: 0x5A3A22, sock: SK, sleeve: 'long', cuff: 0xD8CCAE,
    face: { iris: '#2E9AA6', skin: '#F2CDA8', brow: '#6A4626', cheek: '#EC8B76', nose: '#CF957A', freckles: '#C07A55' },
    torso: (x, y, z) => { if (y < 0.66) return TR; if (y < 0.75) return SA; if (y > 1.06) return SH; if (z > 0 && Math.abs(x) < 0.045 + (y - 0.75) * 0.12) return SH; return VE; },
    hair: (hb, head) => messyHair(head, 0x7A532C, { front: 1.02, back: 2.5, seed: 11, jag: 0.24, R: 0.286, crown: 0.03 }) }), 'kid');
  return finish(c, world);
}
// Jack, grown: the same face older, scruffy brown hair and a short beard; laced cream shirt, long open teal vest, sash, leather bracers, boots. No hat.
export function makeJackMan(world) {
  const SK = 0xDFAE86, SH = 0xDCD1B4, VE = 0x34505C, SA = 0x7E3528, TR = 0x6A6544;
  const c = animate(adult({ skin: SK, shirt: SH, sleeve: SH, cuffC: 0xCFC3A4, bracer: 0x6B4A2E, legsC: TR, boots: 0x4A3220, bootCuff: 0x5C3E27,
    face: { adult: true, ex: 90, iris: '#4F8A96', skin: '#DFAE86', brow: '#3A2414', browH: 15, nose: '#A86E4E', lines: true, wrinkles: '#B07A58', mouthY: 250 },
    torso: (x, y, z) => { const ax = Math.abs(x); if (y < 0.96) return TR; if (y < 1.07) return SA; if (z > 0 && y > 1.36 && ax < (y - 1.36) * 0.9) return SK; if (z > 0 && ax < 0.06 + (y - 1.07) * 0.1) return SH; return VE; },
    hair: (hb, head) => { messyHair(head, 0x5E4024, { front: 0.98, back: 2.5, seed: 23, jag: 0.2, R: 0.282, crown: 0.02 }); beard(head, 0x553A22, { top: 2.2, bottom: 2.78, cheek: 1.95, side: 1.62, seed: 5 }); } }), 'kid');
  c.headY = 1.86;
  // long open vest tails, torn at the hem
  const r = rnd(41), N = 22, pos = [], idx = []; const a0 = Math.PI * 0.16, a1 = Math.PI * 1.84;
  for (let i = 0; i <= N; i++) { const a = a0 + (a1 - a0) * i / N, hem = 0.5 + (i % 2 ? 0.05 : 0) + r() * 0.04;
    [[0.26, 1.1], [0.29, 0.8], [0.32, hem]].forEach(([rr, y]) => pos.push(Math.sin(a) * rr, y, Math.cos(a) * rr)); }
  for (let i = 0; i < N; i++) for (let j = 0; j < 2; j++) { const p = i * 3 + j, q = p + 3; idx.push(p, p + 1, q, p + 1, q + 1, q); }
  const vg = new THREE.BufferGeometry(); vg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); vg.setIndex(idx); vg.computeVertexNormals();
  const vm = new THREE.Mesh(vg, toon(VE, { side: THREE.DoubleSide })); outline(vm, 0.015); c.g.add(vm);
  return finish(c, world);
}
// Jack, old: the hooded stranger. Olive cloak and hood, grey beard; the hood only shades his eyes.
export function makeOldJack(world) {
  const SK = 0xE2BC98, CL = 0x5E6540, CL2 = 0x4A5033, TU = 0x463F30;
  const FACE_O = { adult: true, old: true, ex: 92, eh2: 0.9, iris: '#6F8288', skin: '#E2BC98', brow: '#BDBBB2', browH: 14, nose: '#B07E5E', wrinkles: '#A57A5C', crease: 'rgba(120,80,55,0.55)', mouthY: 252 };
  let hood = null;
  const c = animate(adult({ skin: SK, shirt: TU, sleeve: CL, cuffC: CL2, legsC: 0x3A3428, boots: 0x4A3220, bootCuff: 0x4A3220, headS: 0.92,
    face: Object.assign({ shade: true }, FACE_O),
    hair: (hb, head) => {
      // short, untidy grey hair swept back, a little thin at the temples (it shows when the hood comes off)
      messyHair(head, 0xC4C3BC, { front: 0.82, back: 2.45, seed: 31, jag: 0.16, R: 0.281, crown: 0.02, sweep: 0.3, recede: 0.22, spikes: 6 });
      beard(head, 0xD3D3CB, { top: 2.2, bottom: 2.8, cheek: 1.95, side: 1.62, full: 0.03, seed: 9 });
      // the hood hangs from a pivot at the back of the neck so it can be pushed back off the head
      hood = new THREE.Group(); hood.position.set(0, -0.2, -0.24); head.add(hood);
      const hm = headShell(head, CL, { th0: ph => 0, th1: ph => { const a = Math.abs(ph); return 1.1 + 0.12 * sm01((a - 0.25) / 0.25) + 1.05 * sm01((a - 0.44) / 0.3) + 0.25 * sm01((a - 1.0) / 1.5); }, rFn: (th, ph, v) => 0.335 * (1 + 0.04 * Math.sin(ph * 5 + th * 3)) * (1 + 0.12 * sm01((th - 1.6) / 0.8)), nc: 140, nr: 26, line: 0.016 });
      head.remove(hm); hm.position.set(0, 0.2, 0.24); hood.add(hm);
    } }), 'kid');
  // a second face without the hood's shadow, cross-faded in as the hood comes off
  const fpB = facePatch(c.head, FACE_O), fpA = c.fp; fpB.mesh.material.opacity = 0;
  c.fp = { set: e => { fpA.set(e); fpB.set(e); } };
  c.hoodK = 0; let hoodTo = 0, hoodT0 = -1, hoodFrom = 0;
  // take the hood off (k: 1) or put it on (k: 0): hands up to the hood, push it back over the head, hands down
  c.hood = off => { hoodFrom = c.hoodK; hoodTo = off ? 1 : 0; hoodT0 = performance.now(); };
  const baseTick = c.tick;
  c.tick = (t, dt) => { baseTick(t, dt);
    if (hoodT0 >= 0) { const u = Math.min(1, (performance.now() - hoodT0) / 1700); c.hoodK = hoodFrom + (hoodTo - hoodFrom) * sm01((u - 0.25) / 0.55);
      const arms = Math.sin(Math.PI * Math.min(1, u)) ; c.AL.rotation.x = c.AR.rotation.x = -2.5 * arms + (hoodTo ? 0.4 : -0.2) * arms * sm01((u - 0.35) / 0.4); c.AL.rotation.z = -0.35 * arms; c.AR.rotation.z = 0.35 * arms;
      if (u >= 1) hoodT0 = -1; }
    const k = c.hoodK; hood.rotation.x = -2.25 * k; hood.scale.set(1, 1 - 0.25 * k, 1 - 0.35 * k); hood.position.y = -0.2 - 0.06 * k;
    fpB.mesh.material.opacity = sm01((k - 0.3) / 0.5); fpA.mesh.material.opacity = 1 - fpB.mesh.material.opacity; };
  c.headY = 1.86;
  // cloak: from the shoulders to the ground, open at the front, ragged hem
  const r = rnd(77), N = 30, pos = [], idx = []; const a0 = Math.PI * 0.14, a1 = Math.PI * 1.86;
  for (let i = 0; i <= N; i++) { const a = a0 + (a1 - a0) * i / N, hem = 0.1 + (i % 2 ? 0.07 : 0) + r() * 0.06;
    [[0.2, 1.62], [0.31, 1.45], [0.34, 1.1], [0.4, 0.6], [0.45, hem]].forEach(([rr, y]) => pos.push(Math.sin(a) * rr, y, Math.cos(a) * rr)); }
  for (let i = 0; i < N; i++) for (let j = 0; j < 4; j++) { const p = i * 5 + j, q = p + 5; idx.push(p, p + 1, q, p + 1, q + 1, q); }
  const cg = new THREE.BufferGeometry(); cg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); cg.setIndex(idx); cg.computeVertexNormals();
  const cm = new THREE.Mesh(cg, toon(CL, { side: THREE.DoubleSide })); outline(cm, 0.016); c.g.add(cm);
  // a rope belt and a shepherd's crook in his right hand
  const bb = builder(c.g); bb.torus(0.25, 0.022, 0x6B5638, 0, 1.0, 0, { rx: Math.PI / 2, line: 0.008, seg: 28 });
  const st = new THREE.Group(); st.position.set(0, -0.68, 0.08); c.AR.add(st); const sb = builder(st);
  sb.cyl(0.028, 0.034, 2.0, 0x6B4A2E, 0, 0.3, 0, { line: 0.012, seg: 10 }); sb.torus(0.11, 0.028, 0x6B4A2E, 0.11, 1.3, 0, { arc: Math.PI * 1.2, rz: 0.05, line: 0.01, seg: 16 });
  c.staff = st;
  return finish(c, world);
}
export function makeLabKids(world) {
  const leo = animate(LEO(), 'kid'), mia = animate(MIA(), 'kid'), toby = animate(dog(), 'dog');
  [leo, mia, toby].forEach(c => { c.g.traverse(o => { if (o.isMesh) o.userData.noRecv = true; }); world.add(c.g); onTick(c.tick); });
  toby.g.scale.setScalar(1.1); return { leo, mia, toby };
}
