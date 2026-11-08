// Jack (boy, grown, old) and the old man, rebuilt from the story art: slim realistic proportions, painted faces.
import { THREE, builder, onTick, toon } from './gfx.js';

// ---- painted face (canvas mapped onto a curved patch of the head) ----
function paintFace(expr, o) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 320; const x = c.getContext('2d'); x.lineCap = x.lineJoin = 'round';
  const ink = '#2A1B14', EX = o.ex || 84, EY = 138, rx = o.erx, ry = o.ery;
  const eye = (cx, side, lid) => {
    x.save(); x.beginPath(); x.ellipse(cx, EY, rx, ry, 0, 0, 7); x.fillStyle = o.white || '#F4F1E6'; x.fill(); x.clip();
    const ir = ry * 0.95; x.beginPath(); x.ellipse(cx + side * 1, EY + ry * 0.1, ir * 0.88, ir, 0, 0, 7); x.fillStyle = o.iris; x.fill();
    x.beginPath(); x.ellipse(cx + side, EY + ry * 0.1, ir * 0.42, ir * 0.5, 0, 0, 7); x.fillStyle = '#10100E'; x.fill();
    x.fillStyle = '#fff'; x.beginPath(); x.arc(cx - 6, EY - ry * 0.35, ir * 0.22, 0, 7); x.fill();
    const l = lid; if (l) { x.fillStyle = o.skin; x.fillRect(cx - rx - 4, EY - ry - 4, rx * 2 + 8, ry * 2 * l + 4); }
    x.restore(); x.strokeStyle = ink; x.lineWidth = o.lineW || 4; x.beginPath(); x.ellipse(cx, EY, rx, ry, 0, Math.PI * 1.05, Math.PI * 1.95); x.stroke();
    if (l) { x.beginPath(); x.moveTo(cx - rx, EY - ry + ry * 2 * l); x.lineTo(cx + rx, EY - ry + ry * 2 * l); x.stroke(); }
  };
  const brow = (cx, side, tilt, lift) => { x.strokeStyle = o.brow; x.lineWidth = o.browW || 9; x.beginPath(); const y = EY - ry - 24 + lift; x.moveTo(cx - 34, y + tilt * side * -1); x.quadraticCurveTo(cx, y - 8, cx + 34, y + tilt * side); x.stroke(); };
  const T = { neutral: [0, 0, 0, 0, 0], happy: [0.0, 0, -2, 4, 1], scared: [0, 0, 8, -10, 2], sad: [0.05, 0, -9, 4, 3], determined: [0.22, 0, 10, 2, 4], surprised: [0, 0, 0, -14, 2], talk: [0, 0, 0, 0, 5] }[expr] || [0, 0, 0, 0, 0];
  eye(256 - EX, -1, T[0]); eye(256 + EX, 1, T[0]);
  brow(256 - EX, -1, T[2], T[3]); brow(256 + EX, 1, T[2], T[3]);
  // nose
  x.strokeStyle = o.nose; x.lineWidth = o.noseW || 5; x.beginPath(); x.moveTo(248, 168); x.quadraticCurveTo(240, 196, 250, 202); x.quadraticCurveTo(256, 206, 264, 202); x.stroke();
  if (o.freckles) { x.fillStyle = '#B97A58'; [[-52, 200], [-34, 210], [-70, 208], [52, 200], [34, 210], [70, 208], [-44, 190], [44, 190]].forEach(([dx, dy]) => { x.globalAlpha = 0.55; x.beginPath(); x.arc(256 + dx, dy, 3, 0, 7); x.fill(); }); x.globalAlpha = 1; }
  if (o.cheek) { x.fillStyle = o.cheek; x.globalAlpha = 0.28; [140, 372].forEach(px => { x.beginPath(); x.ellipse(px, 208, 30, 17, 0, 0, 7); x.fill(); }); x.globalAlpha = 1; }
  if (o.wrinkles) { x.strokeStyle = o.wrinkles; x.lineWidth = 3; [[-1, 1], [1, 1]].forEach(([s]) => { for (let k = 0; k < 3; k++) { x.beginPath(); x.moveTo(256 + s * (EX + rx + 6), EY + k * 9 - 6); x.lineTo(256 + s * (EX + rx + 28), EY + k * 12 - 14); x.stroke(); } x.beginPath(); x.moveTo(256 + s * 66, 188); x.quadraticCurveTo(256 + s * 74, 220, 256 + s * 58, 244); x.stroke(); }); x.lineWidth = 3; for (let k = 0; k < 3; k++) { x.beginPath(); x.moveTo(256 - 52, 70 + k * 10); x.quadraticCurveTo(256, 62 + k * 10, 256 + 52, 70 + k * 10); x.stroke(); } }
  // beard, painted straight onto the skin so the mouth stays clear
  if (o.beard) { x.fillStyle = o.beard; x.beginPath(); x.moveTo(60, 170); x.quadraticCurveTo(100, 230, 160, 255); x.quadraticCurveTo(210, 232, 256, 232); x.quadraticCurveTo(302, 232, 352, 255); x.quadraticCurveTo(412, 230, 452, 170); x.lineTo(470, 320); x.lineTo(42, 320); x.closePath(); x.fill();
    x.beginPath(); x.moveTo(190, 236); x.quadraticCurveTo(256, 214, 322, 236); x.quadraticCurveTo(300, 252, 256, 246); x.quadraticCurveTo(212, 252, 190, 236); x.fill(); }
  // mouth
  x.strokeStyle = o.beard ? '#3A1D1A' : '#7A3A3A'; x.lineWidth = 6; const my = o.mouthY || 262;
  if (expr === 'happy') { x.beginPath(); x.moveTo(214, my - 4); x.quadraticCurveTo(256, my + 26, 298, my - 4); x.stroke(); if (!o.beard) { x.fillStyle = '#7A2A2A'; x.beginPath(); x.moveTo(222, my); x.quadraticCurveTo(256, my + 22, 290, my); x.quadraticCurveTo(256, my + 8, 222, my); x.fill(); } }
  else if (expr === 'scared' || expr === 'surprised') { x.fillStyle = '#4A1E1E'; x.beginPath(); x.ellipse(256, my + 6, 18, 24, 0, 0, 7); x.fill(); }
  else if (expr === 'sad') { x.beginPath(); x.moveTo(222, my + 8); x.quadraticCurveTo(256, my - 10, 290, my + 8); x.stroke(); }
  else if (expr === 'talk') { x.fillStyle = '#4A1E1E'; x.beginPath(); x.ellipse(256, my + 4, 20, 11, 0, 0, 7); x.fill(); }
  else if (expr === 'determined') { x.beginPath(); x.moveTo(222, my + 2); x.lineTo(290, my - 2); x.stroke(); }
  else { x.beginPath(); x.moveTo(226, my); x.quadraticCurveTo(256, my + 5, 286, my); x.stroke(); }
  // shadow from a hood falls over the eyes only
  if (o.hoodShadow) { const g = x.createLinearGradient(0, 40, 0, 190); g.addColorStop(0, 'rgba(8,12,8,0.96)'); g.addColorStop(0.55, 'rgba(8,12,8,0.82)'); g.addColorStop(1, 'rgba(8,12,8,0)'); x.fillStyle = g; x.fillRect(0, 0, 512, 190); }
  // feather the edges so the painted patch melts into the head
  x.globalCompositeOperation = 'destination-in';
  let m = x.createLinearGradient(0, 0, 512, 0); m.addColorStop(0, 'rgba(0,0,0,0)'); m.addColorStop(0.1, 'rgba(0,0,0,1)'); m.addColorStop(0.9, 'rgba(0,0,0,1)'); m.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = m; x.fillRect(0, 0, 512, 320);
  m = x.createLinearGradient(0, 0, 0, 320); m.addColorStop(0, 'rgba(0,0,0,0)'); m.addColorStop(0.1, 'rgba(0,0,0,1)'); m.addColorStop(0.88, 'rgba(0,0,0,1)'); m.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = m; x.fillRect(0, 0, 512, 320);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}

const smatD = (c, side = THREE.FrontSide) => toon(c, { side });
// One slim figure. opts: {s,w, skin, hairC, top, vest, trouser, shoe, face, ...}
function person(o) {
  const g = new THREE.Group(), s = o.s || 1, w = o.w || 1; const body = new THREE.Group(); body.scale.set(w, s, w); g.add(body); const b = builder(body);
  const limb = (x, y) => { const p = new THREE.Group(); p.position.set(x, y, 0); body.add(p); return p; };
  // legs
  const legs = [-1, 1].map(sx => { const p = limb(sx * 0.07, 0.74), q = builder(p);
    q.caps(0.056, o.longLegs ? 0.5 : 0.3, o.trouser, 0, o.longLegs ? -0.33 : -0.23, 0, { line: 0.012, seg: 14 });
    if (!o.longLegs) { q.caps(0.034, 0.16, o.legSkin || o.skin, 0, -0.5, 0, { line: 0.01, seg: 10 }); for (let i = 0; i < 6; i++) { const a = i / 6 * 6.283; q.cone(0.03, 0.09, o.trouser, Math.cos(a) * 0.05, -0.43, Math.sin(a) * 0.05, { rx: Math.PI, line: 0.006, seg: 4 }); } }
    q.rbox(0.095, 0.075, 0.21, o.shoe, 0, -0.7, 0.045, { line: 0.012 }); return p; });
  // torso (shirt + vest painted along one lathe)
  const SH = o.top, VE = o.vest; const col = new THREE.Color();
  const prof = [[0.001, 0.7], [0.1, 0.7], [0.105, 0.78], [0.098, 0.9], [0.112, 1.04], [0.122, 1.14], [0.08, 1.19], [0.04, 1.22], [0.001, 1.22]];
  const lg = new THREE.LatheGeometry(prof.map(p => new THREE.Vector2(p[0], p[1])), 24); const P = lg.attributes.position, cols = new Float32Array(P.count * 3);
  for (let i = 0; i < P.count; i++) { const px = P.getX(i), py = P.getY(i), pz = P.getZ(i); const open = pz > 0 && Math.abs(px) < 0.04 && py > 0.78 && py < 1.2; col.set(VE && !open && py < 1.17 ? VE : SH); cols.set([col.r, col.g, col.b], i * 3); }
  lg.setAttribute('color', new THREE.BufferAttribute(cols, 3)); lg.computeVertexNormals();
  const tm = toon(0xffffff, { vertexColors: true }); const torso = new THREE.Mesh(lg, tm); body.add(torso); torso.castShadow = true;
  if (o.sash) { const sh = b.torus(0.105, 0.03, o.sash, 0, 0.8, 0, { rx: Math.PI / 2, line: 0.01, seg: 20 }); b.box(0.07, 0.1, 0.03, o.sash, 0.05, 0.74, 0.11, { line: 0.01, rx: 0.1, rz: 0.2 }); }
  // coat tails for the grown man (open at the front)
  if (o.coat) { const pts = [[0.114, 0.84], [0.135, 0.7], [0.15, 0.55], [0.16, 0.42]].map(p => new THREE.Vector2(p[0], p[1])); const cg = new THREE.LatheGeometry(pts, 16, Math.PI * 0.62, Math.PI * 0.76); const cm = new THREE.Mesh(cg, smatD(o.coat, THREE.DoubleSide)); body.add(cm); for (let i = 0; i < 5; i++) { const a = Math.PI * 0.62 + (i + 0.5) / 5 * Math.PI * 0.76; b.cone(0.035, 0.1, o.coat, Math.sin(a) * 0.16, 0.38, Math.cos(a) * 0.16, { rx: Math.PI, line: 0.005, seg: 4 }); } }
  // arms
  const arm = sx => { const p = limb(sx * (0.128 + 0.012 * w), 1.14), q = builder(p);
    q.caps(0.037, 0.2, o.sleeve || o.top, 0, -0.13, 0, { line: 0.012, seg: 12 });
    const fore = new THREE.Group(); fore.position.set(0, -0.26, 0); p.add(fore); const f = builder(fore);
    f.caps(0.031, o.rolled ? 0.12 : 0.2, o.rolled ? o.skin : o.sleeve || o.top, 0, o.rolled ? -0.09 : -0.12, 0, { line: 0.01, seg: 12 });
    if (o.bracer) f.caps(0.037, 0.07, o.bracer, 0, -0.1, 0, { line: 0.008, seg: 10 });
    f.ball(0.034, o.handC || o.skin, 0, -0.24, 0.005, { line: 0.01, seg: 10 }); p.fore = fore; return p; };
  const AL = arm(-1), AR = arm(1);
  // neck + head
  b.cyl(0.036, 0.04, 0.1, o.skin, 0, 1.24, 0, { line: 0.01, seg: 12 });
  const head = new THREE.Group(); head.position.set(0, 1.36, 0); body.add(head); head.scale.setScalar(o.headS || 1);
  const R = o.hr || [0.108, 0.135, 0.118];
  const hm = new THREE.Mesh(new THREE.SphereGeometry(1, 28, 20), toon(o.skin)); hm.scale.set(...R); head.add(hm);
  [-1, 1].forEach(sx => { const e = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 8), toon(o.skin)); e.scale.set(0.012, 0.03, 0.02); e.position.set(sx * R[0] * 0.99, -0.005, -0.005); head.add(e); });
  const geo = new THREE.SphereGeometry(1.004, 28, 18, Math.PI / 2 - 0.95, 1.9, Math.PI / 2 - 0.62, 1.3);
  const mat = new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, toneMapped: false });
  const patch = new THREE.Mesh(geo, mat); patch.scale.set(...R); patch.renderOrder = 2; head.add(patch);
  const maps = {}; const setFace = e => { mat.map = maps[e] || (maps[e] = paintFace(e, o.face)); mat.needsUpdate = true; }; setFace('neutral');
  const hb = builder(head); o.hair && o.hair(hb, head, R);
  const c = { g, body, head, AL, AR, legs, setFace, state: 'idle', t0: Math.random() * 10, forceFace: null };
  c.pose = st => { c.state = st; };
  let tl = 0;
  c.tick = (t, dt = 0.016) => {
    const st = c.state, run = st === 'run', walk = st === 'walk', k = t * (run ? 11 : 6) + c.t0, sw = run ? 0.9 : walk ? 0.5 : 0;
    legs[0].rotation.x = Math.sin(k) * sw; legs[1].rotation.x = -Math.sin(k) * sw;
    AL.rotation.x = -Math.sin(k) * sw; AR.rotation.x = Math.sin(k) * sw; AL.rotation.z = -0.07; AR.rotation.z = 0.07; AL.fore.rotation.x = AR.fore.rotation.x = -0.15 - (run ? 0.7 : 0);
    if (st === 'idle' || st === 'talk') { AL.rotation.x = Math.sin(t * 1.3 + c.t0) * 0.04; AR.rotation.x = -AL.rotation.x; if (st === 'talk') { AR.rotation.x = -0.6 + Math.sin(t * 3) * 0.2; AR.fore.rotation.x = -0.7; } }
    if (st === 'point') { AR.rotation.x = -1.55; AR.fore.rotation.x = 0; }
    if (st === 'scared') { AL.rotation.z = -0.9; AR.rotation.z = 0.9; AL.rotation.x = AR.rotation.x = -0.4; AL.fore.rotation.x = AR.fore.rotation.x = -1; }
    if (st === 'cheer') { AL.rotation.z = -2.7 + Math.sin(t * 9) * 0.15; AR.rotation.z = 2.7 - Math.sin(t * 9) * 0.15; }
    if (st === 'hold') { AL.rotation.x = AR.rotation.x = -0.9; AL.fore.rotation.x = AR.fore.rotation.x = -1; AL.rotation.z = -0.25; AR.rotation.z = 0.25; }
    if (st === 'wow') { AL.rotation.z = -0.7; AR.rotation.z = 0.7; }
    if (st === 'sit') { legs[0].rotation.x = legs[1].rotation.x = -1.45; body.position.y = -0.36 * s; } else body.position.y = 0;
    body.rotation.x = run ? 0.12 : 0; head.rotation.z = Math.sin(t * 1.2 + c.t0) * 0.03;
    const want = c.forceFace || (st === 'scared' ? 'scared' : st === 'wow' ? 'surprised' : st === 'cheer' ? 'happy' : st === 'talk' ? (Math.sin(t * 9) > 0 ? 'talk' : 'neutral') : 'neutral');
    if (want !== c.cf) { c.cf = want; setFace(want); }
  };
  c.dims = { s, w }; onTick(c.tick); g.traverse(m => { if (m.isMesh) m.userData.noRecv = true; }); return c;
}
const clumps = (hb, col, list, r = 0.06) => list.forEach(([x, y, z, sx = 1, sy = 1, sz = 1, rz = 0]) => { const m = hb.ball(r, col, x, y, z, { line: 0.006, seg: 8 }); m.scale.set(sx, sy, sz); m.rotation.z = rz; });

// ---- Jack, the lost boy
export function makeJackBoy(world) {
  const skin = 0xF0CBA6, hairC = 0x7A5A30;
  const c = person({ s: 1, w: 1, skin, top: 0xCFC6AE, sleeve: 0xCFC6AE, vest: 0x35505A, trouser: 0x6B6444, shoe: 0x5A3A22, sash: 0x7A3B2B, rolled: true, legSkin: 0xE9C29C,
    face: { iris: '#3C9AA8', skin: '#F0CBA6', brow: '#6A4A28', cheek: '#E8907A', nose: '#CE957C', erx: 25, ery: 30, ex: 84, freckles: true, lineW: 4, browW: 8, mouthY: 258 },
    hair: (hb, head, R) => { clumps(hb, hairC, [[0, 0.07, -0.03, 1.9, 1.5, 1.8], [-0.07, 0.15, 0.03, 1, 0.8, 1, 0.5], [0.06, 0.17, 0.04, 1, 0.8, 1, -0.4], [-0.1, 0.1, 0.09, 0.8, 1.2, 0.8], [0.1, 0.11, 0.08, 0.8, 1.2, 0.8], [0, 0.17, 0.0, 1, 0.8, 1], [-0.025, 0.12, 0.12, 0.8, 0.6, 0.6, 0.3], [0.04, 0.115, 0.125, 0.8, 0.6, 0.6, -0.5], [-0.12, 0.0, -0.02, 0.8, 1.4, 0.9], [0.12, 0.0, -0.02, 0.8, 1.4, 0.9], [0, 0.0, -0.1, 1.6, 1.5, 1], [-0.12, 0.08, 0.1, 0.7, 0.7, 0.7], [0.14, 0.07, 0.08, 0.7, 0.7, 0.7]], 0.056); } });
  world.add(c.g); return c;
}
// ---- Jack, grown: scruffy beard, laced shirt, long open vest, sash, bracers; no hat
export function makeJackMan(world) {
  const skin = 0xDDAE86, hairC = 0x5A3F24;
  const c = person({ s: 1.2, w: 1.12, headS: 0.94, skin, top: 0xD6CCB0, sleeve: 0xD6CCB0, vest: 0x36525E, coat: 0x36525E, trouser: 0x6E6A47, longLegs: true, shoe: 0x45301E, sash: 0x7A3B2B, bracer: 0x6A4A2E,
    face: { iris: '#4B6B72', skin: '#DDAE86', brow: '#3E2A18', nose: '#B67E5C', erx: 22, ery: 20, ex: 82, lineW: 5, browW: 12, beard: '#5A3F24', wrinkles: '#B58A68', noseW: 6, mouthY: 252 },
    hair: (hb, head, R) => { clumps(hb, hairC, [[0, 0.08, -0.03, 2.0, 1.4, 1.9], [-0.1, 0.1, 0.05, 1, 1.2, 1], [0.1, 0.1, 0.05, 1, 1.2, 1], [0, 0.14, 0.06, 1.4, 0.7, 1], [-0.115, -0.02, -0.03, 0.7, 1.5, 1], [0.115, -0.02, -0.03, 0.7, 1.5, 1], [0, -0.04, -0.1, 1.8, 1.6, 1], [0, -0.165, 0.07, 1.0, 0.8, 0.8]], 0.05); } });
  world.add(c.g); return c;
}
// ---- the old man (Jack, old): hooded olive cloak, grey beard; only the eyes are in the hood's shadow
export function makeOldJack(world) {
  const skin = 0xD8B08C, CL = 0x59603E, CL2 = 0x454B30;
  const c = person({ s: 1.12, w: 1.0, headS: 0.98, skin, top: CL2, sleeve: CL, trouser: 0x2E2A20, longLegs: true, shoe: 0x4A3220, handC: skin,
    face: { iris: '#5A6A70', skin: '#D8B08C', brow: '#B8B8AE', nose: '#B07E5E', erx: 18, ery: 15, ex: 80, lineW: 4, browW: 11, beard: '#C9CBC4', wrinkles: '#A57E5E', noseW: 6, mouthY: 256, hoodShadow: true },
    hair: (hb, head, R) => {
      // the hood: an open shell, so the face shows and only the brim shades the eyes
      const hg = new THREE.SphereGeometry(1, 32, 22, Math.PI / 2 + 0.72, Math.PI * 2 - 1.44, 0, Math.PI * 0.78); const hood = new THREE.Mesh(hg, smatD(CL, THREE.DoubleSide)); hood.scale.set(0.2, 0.2, 0.22); hood.position.set(0, 0.025, -0.025); head.add(hood);
      const brim = new THREE.Mesh(new THREE.TorusGeometry(0.155, 0.03, 8, 22, Math.PI * 1.35), smatD(CL, THREE.FrontSide)); brim.rotation.set(0, Math.PI / 2 - 0.675 * Math.PI + Math.PI * 0.0, 0); brim.rotation.z = 0; brim.position.set(0, 0.08, 0.05); brim.rotation.x = -0.05; brim.rotation.y = Math.PI * 1.5 - Math.PI * 0.0 + 0.0; head.add(brim);
      hb.cone(0.06, 0.13, 0xC9CBC4, 0, -0.17, 0.08, { rx: Math.PI + 0.12, line: 0.006, seg: 10 }).scale.set(1.3, 1, 0.8);
 } });
  // a long cloak over the body, ragged at the hem, and a shepherd's crook
  const body = c.body, b = builder(body);
  const prof = [[0.115, 1.17], [0.17, 1.1], [0.2, 0.9], [0.27, 0.5], [0.33, 0.12]]; const cl = new THREE.LatheGeometry(prof.map(p => new THREE.Vector2(p[0], p[1])), 24, Math.PI * 0.12, Math.PI * 1.76);
  body.add(new THREE.Mesh(cl, smatD(CL, THREE.DoubleSide)));
  for (let i = 0; i < 14; i++) { const a = Math.PI * 0.12 + (i + 0.5) / 14 * Math.PI * 1.76; b.cone(0.05, 0.14 + (i % 3) * 0.05, i % 2 ? CL : CL2, Math.sin(a) * 0.33, 0.07, Math.cos(a) * 0.33, { rx: Math.PI, line: 0.005, seg: 4 }); }
  b.cone(0.17, 0.2, CL, 0, 1.17, -0.03, { line: 0, seg: 14 }).scale.set(1.2, 0.5, 1);   // shoulders / cape
  const st = new THREE.Group(); st.position.set(0, -0.24, 0.0); c.AR.fore.add(st); const sb = builder(st);
  sb.cyl(0.018, 0.022, 1.35, 0x6B4A2E, 0, 0.22, 0, { line: 0.008, seg: 8 }); sb.torus(0.09, 0.02, 0x6B4A2E, 0.07, 0.95, 0, { arc: Math.PI * 1.25, rz: 0.5, line: 0.006, seg: 14 }); c.staff = st;
  world.add(c.g); return c;
}
