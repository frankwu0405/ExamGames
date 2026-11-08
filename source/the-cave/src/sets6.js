// Episode 6: the gray shore, the misty wood and the old man's camp — ONE continuous place, built from the storybook panels.
// The sea is towards -z; the beach runs from the waterline (z = -5) up to the wood's edge (z ≈ 9); a path winds into the wood to a
// clearing with the camp (fire at FIRE). The cart-boat is wedged between two sharp mossy rocks just off the beach.
import { THREE, builder, toon, outline, newWorld, onTick, renderer } from './gfx.js';
import { makeCast, makeOldJack } from './chars.js';
import { cartBoat } from './sets4.js';
import { mist, glowSprite } from './effects.js';
import { makeVarn } from './varn.js';
import { setSeed, rnd, rr, pick, nz, small, scatter, ground, grass, water, rockMat, lumpy, mesh, motes, pawPrints } from './props.js';

export const FIRE = new THREE.Vector3(-6, 0, 34);
const PATH = [[1.5, 6], [1, 10], [-0.6, 15], [-2.6, 20], [-4.4, 25], [-5.6, 29.5], [-5.8, 31.6]];
// mossy rock material: rock grain, with moss on the tops
function mossRock(tint = 0x8A8F92, scale = 0.35) { const m = rockMat(tint, scale), o = m.onBeforeCompile;
  m.onBeforeCompile = sh => { o(sh); sh.fragmentShader = sh.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\n diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.36, 0.5, 0.26), smoothstep(0.45, 0.8, vRN.y) * 0.85);'); };
  return m; }

export function buildGrayShore() {
  const w = newWorld({ sky: 0xA9B4BC, ambient: 0xC9D6DE, ambientI: 1.25, sun: 0xDDE6EE, sunI: 0.95, sunPos: [9, 20, 16], fog: [0xC4CDD1, 22, 90] }); setSeed(616);
  const pc = PATH.map(([x, z]) => new THREE.Vector3(x, 0, z)), pathCurve = new THREE.CatmullRomCurve3(pc), pPts = pathCurve.getSpacedPoints(80);
  const pathD = (x, z) => { let d = 1e9; for (const q of pPts) d = Math.min(d, Math.hypot(q.x - x, q.z - z)); return d; };
  const fireD = (x, z) => Math.hypot(x - FIRE.x, z - FIRE.z);
  // ---- the ground: dark gray sand down to the water, moss and earth in the wood, a worn dirt path, a clearing for the camp
  const hf = (x, z) => { let y = z < -5 ? -0.05 - (-5 - z) * (z > -12 ? 0.075 : 0.075 + (-12 - z) * 0.04) : z < 9 ? (z + 5) * 0.035 + nz(x, z, 0.4) * 0.05 : 0.49 + (z - 9) * 0.02 + nz(x, z, 0.18) * 0.45;
    if (z > 22) y -= Math.max(0, 1 - fireD(x, z) / 9) * (0.49 + (z - 9) * 0.02 + nz(x, z, 0.18) * 0.45 - 0.8);   // the clearing is flattish
    return Math.max(-2.6, y); };
  ground(w, 150, 220, hf, (x, z, c) => { const y = hf(x, z), wet = z < -2.5, pd = pathD(x, z);
    if (z < 8.5) c.setHSL(0.1, 0.06, wet ? 0.38 : 0.55 + nz(x * 2, z * 2, 0.6) * 0.04);
    else if (pd < 1.2 || fireD(x, z) < 3.2) c.setHSL(0.08, 0.28, 0.32 + nz(x, z, 0.8) * 0.03);
    else c.setHSL(0.24 + nz(x, z, 0.3) * 0.03, 0.32, 0.28 + nz(x + 7, z, 0.5) * 0.04); });
  // ---- the cold gray sea, foam where it laps the sand
  const sg = new THREE.PlaneGeometry(400, 260, 40, 20); sg.rotateX(-Math.PI / 2);
  const sea = water(w, sg, { deep: 0x4C6673, shallow: 0x8EA7AE, foamC: 0xE8EEF0, opacity: 0.94, sparkle: 0.25, foamFn: '1.0 - smoothstep(0.0, 0.9, abs(vW.z + 5.2 - sin(vW.x * 0.4 + uT * 1.1) * 0.5 - sin(uT * 0.8) * 0.4))' }); sea.position.set(0, -0.12, -125);
  // ---- the beach: pebbles, mossy boulders at both ends, driftwood, a little seaweed
  const pm = rockMat(0x9A9C9A, 0.6); for (let i = 0; i < 70; i++) { const x = rr(-22, 22), z = rr(-4.5, 7.5), s = rr(0.08, 0.22); mesh(w, lumpy(s, 1, 0.3, 0.6), pm, x, hf(x, z) + s * 0.2, z, { ry: rnd() * 6, ink: false, shadow: false }); }
  const bm = mossRock(0x8A8F92, 0.3);
  [[-13, -2.5, 2.4], [-16, 1, 3.2], [-10.5, 4.5, 1.6], [12.5, -3, 2.2], [15.5, 0.5, 3], [11, 4, 1.4], [-19, 6, 3.6], [19, 5, 3.4], [-6.5, -4.4, 0.9], [7.5, 2.5, 0.8]].forEach(([x, z, r]) => mesh(w, lumpy(r, 2, 0.24, 0.75), bm, x, hf(x, z) + r * 0.2, z, { ry: rnd() * 6 }));
  scatter(w, 'log', [{ x: -4.8, z: 3.6, ry: 1.1, rz: 0.05 }, { x: 8.6, z: -1.6, ry: 2.6 }], { gy: hf, norm: 3.4, style: (n, mn) => [toon(/bark/i.test(mn) ? 0x8E8578 : 0xC8C0B0)] });
  { const sw = toon(0x3F5A3A); for (let i = 0; i < 14; i++) { const x = rr(-15, 15), z = rr(-4.2, -2.6); const m = new THREE.Mesh(new THREE.TorusGeometry(rr(0.18, 0.35), 0.035, 5, 12, Math.PI * rr(0.6, 1.2)), sw); m.rotation.set(-Math.PI / 2, 0, rnd() * 6); m.position.set(x, hf(x, z) + 0.02, z); w.add(m); } }
  // ---- the two sharp mossy rocks just off the beach, with the cart-boat wedged between them (points to -z, tipped a little)
  const RK = new THREE.Vector3(4, 0, -9.6);
  // (two tall crags either side of the boat, a few smaller stones round them — the boat itself stays in clear view between them)
  [[-3.1, -0.4, 1.5, 2.1], [3.3, -0.2, 1.7, 2.4], [-4.4, 0.9, 0.9, 1.3], [4.8, 1.0, 0.8, 1.2], [1.6, -1.8, 0.7, 1.1]].forEach(([dx, dz, r, sy]) => { const m = mesh(w, lumpy(r, 2, 0.32, 0.9), bm, RK.x + dx, -0.5 + r * sy * 0.55, RK.z + dz, { ry: rnd() * 6 }); m.scale.y = sy; });
  const boat = cartBoat(w); boat.g.position.set(RK.x + 0.1, 0.1, RK.z + 0.2); boat.g.rotation.set(0.1, 0.25, -0.2); boat.wind.k = 0.12;
  [boat.cast.leo, boat.cast.mia, boat.cast.toby].forEach(c => c.g.visible = false);
  const boatHit = new THREE.Mesh(new THREE.BoxGeometry(3.4, 3.6, 3.4), new THREE.MeshBasicMaterial({ visible: false })); boatHit.position.y = 1.4; boat.g.add(boatHit);
  // ---- the old ship far out in the fog, half sunk between rocks (like the panel)
  const wreck = new THREE.Group(); wreck.position.set(-22, -1.6, -46); wreck.rotation.set(0.12, 0.8, 0.22); w.add(wreck); scatter(wreck, 'ship-wreck', [{ x: 0, z: 0, y: 0, ry: 0 }], { norm: 14 });
  [[-6, 0, 3.4], [6, 1, 4], [1, -5, 2.6]].forEach(([dx, dz, r]) => { const m = mesh(w, lumpy(r, 2, 0.3, 1), bm, wreck.position.x + dx, -1 + r * 0.6, wreck.position.z + dz); m.scale.y = 1.5; });
  // ---- the wood: tall mossy trunks fading into the mist, ferns, mushrooms, fallen branches
  const trunkM = mossRock(0x7B746A, 0.5);
  const isFree = (x, z) => pathD(x, z) > 2.4 && fireD(x, z) > 7.5 && Math.hypot(x - (FIRE.x - 5), z - (FIRE.z + 4)) > 4;
  const trunks = []; for (let i = 0, n = 0; i < 400 && n < 70; i++) { const x = rr(-34, 30), z = rr(10, 62); if (!isFree(x, z)) continue; const r = rr(0.35, 0.8), h = rr(9, 16);
    const g = new THREE.CylinderGeometry(r * 0.7, r * 1.15, h, 9, 6); { const p = g.attributes.position; for (let k = 0; k < p.count; k++) { const yy = p.getY(k); p.setX(k, p.getX(k) + Math.sin(yy * 0.4 + i) * 0.12); } g.computeVertexNormals(); }
    const m = mesh(w, g, trunkM, x, hf(x, z) + h / 2 - 0.2, z, { ry: rnd() * 6, rz: rr(-0.04, 0.04) }); trunks.push(m);
    // a few bare branches, and a canopy of dark leaves high up
    for (let k = 0; k < 3; k++) { const by = rr(h * 0.45, h * 0.85), a = rnd() * 6.28, bg = new THREE.CylinderGeometry(0.05, 0.12, rr(1.6, 2.8), 6); const b = new THREE.Mesh(bg, trunkM); b.position.set(Math.cos(a) * r, by - h / 2, Math.sin(a) * r); b.rotation.set(Math.cos(a) * 1.0, 0, -Math.sin(a) * 1.0); m.add(b); }
    n++; }
  scatter(w, 'tree_dark', Array.from({ length: 44 }, () => { const x = rr(-40, 36), z = rr(16, 70); return isFree(x, z) ? { x, z, s: rr(2.2, 3.4) } : null; }).filter(Boolean), { gy: hf, style: (n, mn) => [toon(/wood|bark|trunk/i.test(mn) ? 0x5E5548 : pick([0x3E5A44, 0x4A6649, 0x37503E]))] });
  scatter(w, 'bush_large', Array.from({ length: 50 }, () => { const x = rr(-30, 28), z = rr(9.5, 50); return isFree(x, z) || (pathD(x, z) > 1.8 && fireD(x, z) > 5.5) ? { x, z, s: rr(0.8, 1.4) } : null; }).filter(Boolean), { gy: hf, style: () => [toon(pick([0x4E7048, 0x5A7A4E, 0x46663F]))] });
  scatter(w, 'mushroom_red', Array.from({ length: 16 }, () => { const x = rr(-14, 8), z = rr(12, 40); return pathD(x, z) > 1.6 && fireD(x, z) > 3.6 ? { x, z, s: rr(0.6, 1) } : null; }).filter(Boolean), { gy: hf });
  grass(w, small ? 5000 : 11000, () => { const x = rr(-30, 26), z = rr(9.5, 52); return pathD(x, z) > 1.3 && fireD(x, z) > 3.4 ? [x, z] : null; }, hf, [0.25, 0.4, 0.34]);
  // ---- the fork in the path (stop 17): three ways into the trees; only the middle one has Toby's paw prints and leads to the glow
  const FORK = pathCurve.getPointAt(0.3); const forks = [];
  [[-1, -6.5], [0, 0], [1, 6.5]].forEach(([k, dx]) => { const end = new THREE.Vector3(FORK.x + dx + (k ? 0 : -1.8), 0, FORK.z + 6.5); const hit = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 2.6, 12), new THREE.MeshBasicMaterial({ visible: false }));
    hit.position.set((FORK.x + end.x) / 2, hf(end.x, end.z) + 1.2, (FORK.z + end.z) / 2); w.add(hit); hit.userData.id = k === 0 ? 'prints' : k < 0 ? 'left' : 'right'; forks.push(hit);
    if (k) { const sm = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 6.5), toon(0x6E5A44)); sm.rotation.set(-Math.PI / 2, 0, -Math.atan2(dx, 6.5)); sm.position.set(hit.position.x, hf(hit.position.x, hit.position.z) + 0.03, hit.position.z); w.add(sm); } });
  pawPrints(w, pathCurve.getPointAt(0.12), pathCurve.getPointAt(0.55), 14, hf);
  // ---- the camp, as in the panel: a stone ring with a fire and a pot on a tripod, a log seat, a stump for the old man,
  //      stacks of firewood, a blanket, and a patched little tent with a flag pole
  const camp = new THREE.Group(); camp.position.set(FIRE.x, hf(FIRE.x, FIRE.z), FIRE.z); w.add(camp); const cb = builder(camp);
  const sm2 = rockMat(0x8C8C88, 0.5); for (let i = 0; i < 11; i++) { const a = i / 11 * 6.28; mesh(camp, lumpy(rr(0.22, 0.32), 1, 0.25, 0.75), sm2, Math.cos(a) * 0.95, 0.12, Math.sin(a) * 0.95, { ry: rnd() * 6 }); }
  [0, 2.1, 4.2].forEach(a => cb.cyl(0.07, 0.08, 1.2, 0x5A3E28, Math.cos(a) * 0.25, 0.1, Math.sin(a) * 0.25, { rz: Math.PI / 2 - 0.35, ry: a, line: 0.01 }));
  const flames = [], fm = [0xFFB347, 0xFF7A2A, 0xFFE07A].map(c => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending }));
  for (let i = 0; i < 7; i++) { const f = new THREE.Mesh(new THREE.ConeGeometry(0.16 + rnd() * 0.1, 0.7 + rnd() * 0.4, 8), fm[i % 3]); f.position.set(rr(-0.25, 0.25), 0.4, rr(-0.25, 0.25)); camp.add(f); flames.push(f); }
  const fglow = glowSprite(0xFFA347, 3.6, 0.85); fglow.position.y = 0.6; camp.add(fglow);
  const fl = new THREE.PointLight(0xFFA040, 26, 16, 1.4); fl.position.y = 1.2; camp.add(fl);
  onTick(t => { flames.forEach((f, i) => { const k = 0.8 + Math.sin(t * 9 + i * 2) * 0.15 + Math.sin(t * 17 + i) * 0.1; f.scale.set(1, k, 1); f.position.y = 0.3 + k * 0.25; }); fl.intensity = 22 + Math.sin(t * 11) * 3 + Math.sin(t * 23) * 2; fglow.material.opacity = 0.75 + Math.sin(t * 7) * 0.1; });
  motes(camp, 40, [-0.4, 0.4, -0.4], [0.4, 3, 0.4], 0xFFB060, 0.04);
  // tripod, chain and the soup pot, with steam
  [0, 2.1, 4.2].forEach(a => { const leg = cb.cyl(0.035, 0.04, 2.1, 0x4A3826, Math.cos(a) * 0.5, 0.95, Math.sin(a) * 0.5, { line: 0.01 }); leg.rotation.set(Math.sin(a) * 0.26, 0, -Math.cos(a) * 0.26); });
  cb.cyl(0.01, 0.01, 0.5, 0x2E2E32, 0, 1.55, 0, { line: 0 });
  const pot = new THREE.Mesh(new THREE.LatheGeometry([[0, 0], [0.24, 0.02], [0.3, 0.14], [0.31, 0.3], [0.27, 0.36], [0.29, 0.38]].map(([a, b]) => new THREE.Vector2(a, b)), 18), toon(0x34343A, { side: THREE.DoubleSide })); pot.position.y = 0.95; camp.add(pot); outline(pot, 0.012);
  { const sm = new THREE.Mesh(new THREE.CircleGeometry(0.27, 16), toon(0xC9874A)); sm.rotation.x = -Math.PI / 2; sm.position.y = 1.28; camp.add(sm); }
  const steam = []; for (let i = 0; i < 6; i++) { const s = glowSprite(0xF4F6F8, 0.5, 0.35); camp.add(s); s.userData.ph = i / 6; steam.push(s); }
  onTick(t => steam.forEach(s => { const k = (t * 0.25 + s.userData.ph) % 1; s.position.set(Math.sin(t + s.userData.ph * 6) * 0.15 * k, 1.35 + k * 1.6, 0); s.scale.setScalar(0.4 + k * 0.9); s.material.opacity = 0.32 * Math.sin(k * Math.PI); }));
  // the log seat (for the kids) and the stump (for the old man)
  const SEAT = new THREE.Vector3(2.1, 0, -0.6), STUMP = new THREE.Vector3(-1.9, 0, -0.5);
  // (the log seat's cut ends sit on the cylinder's own axis, y — the log is laid down by rz)
  { const lg = cb.cyl(0.32, 0.34, 2.6, 0x7A5638, SEAT.x, 0.32, SEAT.z, { rz: Math.PI / 2, ry: 1.25, line: 0.02, seg: 14 }); [-1, 1].forEach(sd => { const e = new THREE.Mesh(new THREE.CircleGeometry(0.31, 14), toon(0xD9B98A)); e.position.set(0, sd * 1.305, 0); e.rotation.x = -sd * Math.PI / 2; lg.add(e); }); }
  cb.cyl(0.42, 0.48, 0.5, 0x6E4E33, STUMP.x, 0.25, STUMP.z, { line: 0.02, seg: 14 }); { const top = new THREE.Mesh(new THREE.CircleGeometry(0.41, 16), toon(0xD2B07E)); top.rotation.x = -Math.PI / 2; top.position.set(STUMP.x, 0.505, STUMP.z); camp.add(top); }
  // firewood stacks and a blanket
  [[1.4, 1.9, 0.4], [-2.6, -2.2, 1.1]].forEach(([x, z, ry]) => { for (let i = 0; i < 6; i++) cb.cyl(0.09, 0.09, 1.1, 0x7A5432, x + (i % 3) * 0.2 - 0.2, 0.09 + (i > 2 ? 0.17 : 0), z, { rz: Math.PI / 2, ry, line: 0.01 }); });
  { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'); x.fillStyle = '#8A5A3C'; x.fillRect(0, 0, 64, 64); x.fillStyle = '#6E4430'; for (let i = 0; i < 64; i += 16) { x.fillRect(i, 0, 8, 64); x.fillRect(0, i, 64, 8); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; const bl = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.2), toon(0xffffff, { map: t })); bl.rotation.set(-Math.PI / 2, 0, 0.3); bl.position.set(0.4, 0.03, 2.2); camp.add(bl); }
  // the tent: a patched canvas ridge tent behind the fire, a pole with a rag flag
  { const tg = new THREE.Group(); tg.position.set(-4.6, 0, 4.2); tg.rotation.y = 0.5; camp.add(tg); const tb = builder(tg);
    const sh = new THREE.Shape(); sh.moveTo(-1.5, 0); sh.lineTo(0, 1.9); sh.lineTo(1.5, 0); sh.lineTo(-1.5, 0);
    const tgeo = new THREE.ExtrudeGeometry(sh, { depth: 2.8, bevelEnabled: false }); tgeo.translate(0, 0, -1.4); const tm = new THREE.Mesh(tgeo, toon(0x7E7660)); tg.add(tm); outline(tm, 0.03);
    const door = new THREE.Mesh(new THREE.CircleGeometry(0.62, 3), new THREE.MeshBasicMaterial({ color: 0x2A2620 })); door.position.set(0, 0.5, 1.41); door.rotation.z = Math.PI / 2; door.scale.set(1, 1.2, 1); tg.add(door);
    [[0.6, 0.8, 0x8E8670], [-0.7, 1.0, 0x6A624E]].forEach(([x, y, c]) => { const p = tb.box(0.5, 0.4, 0.02, c, x, y, 1.42, { line: 0.008 }); p.rotation.z = 0.2; });
    tb.cyl(0.04, 0.05, 2.9, 0x5A4430, 1.7, 1.45, 1.4, { line: 0.01 }); const fl2 = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.36), toon(0x8C8466, { side: THREE.DoubleSide })); fl2.position.set(2.0, 2.65, 1.4); tg.add(fl2);
    onTick(t => { fl2.rotation.y = Math.sin(t * 2) * 0.3; }); }
  // ---- fog: white mist lying low over the beach and the water, thicker and grayer among the trees
  const fogA = mist(w, { count: 36, center: new THREE.Vector3(2, 0, -2), spread: 60, inner: 14, y: [0.4, 4], size: [12, 22], color: 0xF0F3F4, opacity: 0.5 }); fogA.show(1, 10);
  const fogB = mist(w, { count: 30, center: new THREE.Vector3(-4, 0, 30), spread: 36, inner: 9, y: [0.8, 5], size: [8, 16], color: 0xD6DDDD, opacity: 0.24 }); fogB.show(1, 10);
  motes(w, 120, [-20, 0.5, -10], [20, 5, 50], 0xFFFFFF, 0.04);
  // ---- the kids and Toby (Leo and Mia start asleep on the sand, as in the panel) and the old man (hidden until stop 17)
  const cast = makeCast(w), { leo, mia, toby } = cast;
  const man = makeOldJack(w); man.g.visible = false;
  return { w, hf, boat, boatHit, cast, leo, mia, toby, man, camp, SEAT, STUMP, FORK, forks, pathCurve, fogA, fogB, wreck, RK, sea };
}

// ---------------------------------------------------------------- the old man's story, seen in a thought bubble (panel 3):
// a little live scene — Varn clutching shining gems, a pirate ship beside him — rendered into a cloud-shaped bubble above his head
export function visionBubble(w) {
  const rt = new THREE.WebGLRenderTarget(512, 384), sc = new THREE.Scene(); sc.background = new THREE.Color(0x3A4258); sc.fog = new THREE.Fog(0x3A4258, 14, 40);
  sc.add(new THREE.HemisphereLight(0xC8D8FF, 0x403A50, 1.6)); const d = new THREE.DirectionalLight(0xFFFFFF, 1.2); d.position.set(4, 8, 6); sc.add(d);
  const cam = new THREE.PerspectiveCamera(40, 4 / 3, 0.1, 100); cam.position.set(1.4, 3.6, 12); cam.lookAt(1.0, 3.0, -4);
  const V = makeVarn(sc); V.g.scale.setScalar(0.42); V.g.position.set(-1.2, 0, -3); V.set('rear'); V.state.glow = 1.6; V.state.sway = 0.4;
  const gems = []; [0xFF4D6D, 0x5AD1FF, 0x6BE38A, 0xFFD34D, 0xB57EFF, 0xFF9F4D].forEach((c, i) => { const g = new THREE.Mesh(new THREE.OctahedronGeometry(0.22), toon(c, { emissive: c, emissiveIntensity: 0.7 })); g.scale.y = 1.4; sc.add(g); const s = glowSprite(c, 0.9, 0.6); g.add(s); g.userData.ph = i; gems.push(g); });
  // a little pirate ship rocking on the waves
  const ship = new THREE.Group(); ship.position.set(3.1, 0.2, -1.5); sc.add(ship); const sb = builder(ship);
  sb.box(3, 0.9, 1.1, 0x6B4A2E, 0, 0.45, 0, { line: 0.03 }); sb.box(0.9, 0.5, 1.0, 0x5A3E26, -1.1, 1.1, 0, { line: 0.02 });
  sb.cyl(0.06, 0.07, 3.2, 0x4A3826, 0.2, 2.2, 0, { line: 0.01 });
  [[0.2, 2.1, 1.5, 1.2], [0.2, 3.1, 1.1, 0.8]].forEach(([x, y, wd, ht]) => { const s = new THREE.Mesh(new THREE.PlaneGeometry(wd, ht), toon(0xEDE4CF, { side: THREE.DoubleSide })); s.position.set(x, y, 0.08); s.rotation.y = 1.2; ship.add(s); });
  { const sw = new THREE.Mesh(new THREE.PlaneGeometry(40, 30), toon(0x3A6E86)); sw.rotation.x = -Math.PI / 2; sc.add(sw); }
  onTick(t => { ship.rotation.z = Math.sin(t * 1.3) * 0.08; ship.position.y = 0.2 + Math.sin(t * 1.6) * 0.08; const h = V.headPos ? V.headPos() : new THREE.Vector3(-1, 2, 0);
    gems.forEach((g, i) => { const a = t * 0.8 + i; g.position.set(h.x + 1.3 + Math.cos(a) * 0.7, h.y - 0.6 + Math.sin(a * 1.3) * 0.3, h.z + 0.8 + Math.sin(a) * 0.4); g.rotation.y = t * 2 + i; }); });
  // the bubble: the picture with a soft, cloudy edge, gray puffs round it, and three little bubbles leading down to the speaker
  const mat = new THREE.ShaderMaterial({ uniforms: { map: { value: rt.texture }, uK: { value: 0 }, uT: { value: 0 } }, transparent: true, depthWrite: false,
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform sampler2D map; uniform float uK, uT; varying vec2 vUv;
      float n(vec2 p){ return sin(p.x * 9.0 + uT) * 0.03 + sin(p.y * 7.0 - uT * 0.7) * 0.03 + sin((p.x + p.y) * 13.0) * 0.02; }
      void main(){ vec2 c = (vUv - 0.5) * vec2(1.333, 1.0); float r = length(c) + n(c); float a = 1.0 - smoothstep(0.43, 0.5, r);
        vec3 col = texture2D(map, vUv).rgb; col = mix(col, vec3(0.86, 0.88, 0.92), smoothstep(0.38, 0.47, r)); gl_FragColor = vec4(col, a * uK);
        #include <colorspace_fragment>
      }` });
  const group = new THREE.Group(); w.add(group); const plane = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 3.3), mat); group.add(plane); plane.renderOrder = 10;
  const puffs = []; for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2, s = glowSprite(0xE8ECF2, rr(0.8, 1.1), 0.0); s.position.set(Math.cos(a) * 2.25, Math.sin(a) * 1.65, -0.05); group.add(s); puffs.push(s); }
  // (three shrinking bubbles drop straight down from the cloud to the top of his head)
  const dots = [0.24, 0.16, 0.1].map((r, i) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 10), new THREE.MeshBasicMaterial({ color: 0xE8ECF2, transparent: true, opacity: 0 })); m.position.set(-0.25 + i * 0.12, -1.95 - i * 0.38, 0); group.add(m); return m; });
  let k = 0, target = 0, kFrom = 0, kT0 = -1; group.visible = false;
  onTick((t, dt) => { if (kT0 >= 0) { const e = Math.min(1, (performance.now() - kT0) / 700); k = kFrom + (target - kFrom) * e * e * (3 - 2 * e); if (e >= 1) kT0 = -1; } mat.uniforms.uK.value = k; mat.uniforms.uT.value = t; group.visible = k > 0.01; puffs.forEach(p => { p.material.opacity = 0.5 * k; }); dots.forEach(m => { m.material.opacity = k; });
    if (group.visible) { const old = renderer.getRenderTarget(); renderer.setRenderTarget(rt); renderer.render(sc, cam); renderer.setRenderTarget(old); } });
  return { group, show: on => { kFrom = k; target = on ? 1 : 0; kT0 = performance.now(); }, varn: V };
}
