// Episode 7 — Out of the Fog. One long stretch of sea, sailed from the gray beach (behind them, at the start) straight out to the north.
// Most of it is buried in thick fog, with dark sea stacks looming out of it; the giant sharp rock sits right on the blue beam's line;
// past the fog bank the water is calm and blue, green islands far away, and the fog stands behind them like a gray wall.
import { THREE, builder, onTick, toon, scene, tween } from './gfx.js';
import { rockMat, lumpy, water, load, crysMat, INK, setSeed, rnd } from './props.js';
import { cloudTex, glowSprite } from './effects.js';
import { cartBoat } from './sets4.js';
import { newWorld } from './gfx.js';

const rr = (a, b) => a + rnd() * (b - a);
export const FOG = { col: new THREE.Color(0xB3BCC2), sky: new THREE.Color(0xA9B3BA), near: 4, far: 50 };
export const CLEAR = { col: new THREE.Color(0xCFEAF5), sky: new THREE.Color(0x8FD0F2), near: 80, far: 520 };
export const ROCK = new THREE.Vector3(-0.8, 0, -64);   // the giant sharp rock, right on the beam's line
export const FOG_END = -104;                              // where the fog bank ends and the clear sea begins
export const BEAM_TO = new THREE.Vector3(-3.2, 1.2, -320); // the blue beam always points here (it passes straight through the rock)

export function buildFogSea() {
  const w = newWorld({ sky: 0xA9B3BA, fog: [0xB3BCC2, FOG.near, FOG.far], ambientI: 1.35, sunI: 0.75, sunPos: [10, 24, -14] }); const b = builder(w); setSeed(77);
  scene.background = FOG.sky.clone();
  // ---- the sea (gray in the fog, turned blue when it clears)
  const seaGeo = new THREE.PlaneGeometry(900, 900, 1, 1); seaGeo.rotateX(-Math.PI / 2);
  const sea = water(w, seaGeo, { deep: 0x55666F, shallow: 0x74868F, opacity: 1, sparkle: 0.25, scale: 0.8 }); sea.position.set(0, 0, -150);
  const U = sea.material.uniforms, GRAYS = [new THREE.Color(0x55666F), new THREE.Color(0x74868F)], BLUES = [new THREE.Color(0x1F7FB8), new THREE.Color(0x56C2E2)];
  // ---- the route: out from the gray beach, a hard swerve round the rock, then on into the clear water
  const route = new THREE.CatmullRomCurve3([[0, 8], [0, -10], [-0.2, -30], [-0.5, -46], [0.6, -54], [5.4, -60], [6.0, -65], [4.8, -70], [1.8, -78], [-0.2, -96], [-1, -120], [-2, -150], [-3, -185]].map(([x, z]) => new THREE.Vector3(x, 0.15, z)), false, 'centripetal');
  const RL = route.getLength();
  const dAt = z => { let best = 0, bd = 1e9; for (let i = 0; i <= 800; i++) { const q = route.getPointAt(i / 800), d = Math.abs(q.z - z); if (d < bd) { bd = d; best = i / 800; } } return best * RL; };
  // ---- the gray beach left behind (low sand, the two crags, dark trees) — it melts into the fog as they row away
  { const sand = new THREE.Mesh(new THREE.BoxGeometry(90, 1, 14), toon(0xA9A28E)); sand.position.set(0, -0.3, 30); w.add(sand);
    for (let i = 0; i < 26; i++) { const x = rr(-40, 40), z = rr(34, 44); b.cone(rr(1.4, 2.4), rr(5, 9), 0x2F3D36, x, 2.5, z, { line: 0 }); }
    [[-3, 22], [3.4, 21.5]].forEach(([x, z]) => { const r = b.rock(1.6, 0x4E5257, x, 1.2, z, { line: 0.03 }); r.scale.set(1, 2.2, 1); }); }
  // ---- sea stacks: tall dark rocks that loom out of the fog on either side of the way
  const stackMat = rockMat(0x3F454D, 0.22, { steep: true });
  const stacks = []; for (let i = 0; i < 26; i++) { const z = rr(10, FOG_END + 6), side = rnd() < 0.5 ? -1 : 1, x = side * rr(9, 30), h = rr(5, 13);
    const g = new THREE.Group(); g.position.set(x, -0.6, z); w.add(g);
    const m = new THREE.Mesh(lumpy(rr(1.4, 2.6), 3, 0.32, 0.8), stackMat); m.scale.set(1, h / 2.4, rr(0.8, 1.2)); m.position.y = h * 0.42; m.rotation.y = rnd() * 6; g.add(m);
    const ink = new THREE.Mesh(m.geometry, INK); ink.scale.setScalar(1.035); m.add(ink);
    if (rnd() < 0.6) { const m2 = new THREE.Mesh(lumpy(rr(0.8, 1.4), 2, 0.3), stackMat); m2.position.set(rr(-2, 2), 0.6, rr(-2, 2)); m2.scale.y = rr(1.2, 2.2); g.add(m2); }
    stacks.push(g); }
  // ---- THE ROCK: a giant black spire with jagged shoulders, a ring of foam round its foot
  const rock = new THREE.Group(); rock.position.copy(ROCK); w.add(rock);
  { const dark = rockMat(0x3E434C, 0.2, { steep: true });
    const add = (r, sx, sy, sz, x, y, z, ry = 0) => { const m = new THREE.Mesh(lumpy(r, 3, 0.36, 0.78), dark); m.scale.set(sx, sy, sz); m.position.set(x, y, z); m.rotation.y = ry; rock.add(m); const ink = new THREE.Mesh(m.geometry, INK); ink.scale.setScalar(1.03); m.add(ink); return m; };
    add(3.0, 1, 3.4, 1.1, 0, 6.5, 0, 0.4); add(2.1, 1, 3.6, 1, -1.6, 9, 0.5, 1.2); add(1.4, 1, 3.4, 0.9, 1.2, 12.5, -0.3, 2.1); add(2.4, 1.2, 1.4, 1.2, 2.2, 1.6, 1.2); add(2.0, 1.3, 1.2, 1.1, -2.6, 1.2, -1.0); add(1.3, 1, 2.2, 1, 3.4, 3.6, -1.6, 0.8);
    const foam = new THREE.Mesh(new THREE.RingGeometry(4.2, 6.2, 40), new THREE.MeshBasicMaterial({ color: 0xF2F6F8, transparent: true, opacity: 0.55, depthWrite: false })); foam.rotation.x = -Math.PI / 2; foam.position.y = 0.12; rock.add(foam);
    onTick(t => { foam.material.opacity = 0.4 + Math.sin(t * 1.3) * 0.15; foam.scale.setScalar(1 + Math.sin(t * 0.9) * 0.04); }); }
  const rockHit = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 5.5, 16, 10), new THREE.MeshBasicMaterial({ visible: false })); rockHit.position.set(ROCK.x, 8, ROCK.z); w.add(rockHit);
  const rockGlow = glowSprite(0x6FE4FF, 4.2, 0); rockGlow.position.set(ROCK.x + 0.2, 4.2, ROCK.z + 3.1); w.add(rockGlow);   // where the beam strikes the rock
  // ---- the clear sea beyond the fog: green islands far off, a few gulls, the gray wall of fog left behind
  const isles = new THREE.Group(); w.add(isles);
  [[-120, -330, 26], [-60, -380, 16], [40, -360, 22], [130, -310, 30], [210, -250, 18], [-200, -260, 20]].forEach(([x, z, r]) => {
    const isle = new THREE.Mesh(new THREE.SphereGeometry(r, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), toon(0x5E9E5A)); isle.scale.y = 0.42; isle.position.set(x, -1, z); isles.add(isle);
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.06, r * 1.1, 1.4, 24), toon(0xE6D3A0)); rim.position.set(x, -0.4, z); isles.add(rim); });
  const wall = new THREE.Group(); w.add(wall); wall.visible = false;
  for (let i = 0; i < 90; i++) { const m = new THREE.SpriteMaterial({ map: cloudTex(), color: i % 3 ? 0x5F6871 : 0x7C858D, transparent: true, opacity: 1, depthWrite: false, fog: false });
    const s = new THREE.Sprite(m), sz = rr(16, 34); s.scale.set(sz * 1.5, sz, 1); s.position.set(rr(-110, 110), rr(1, 22), FOG_END + rr(4, 24)); wall.add(s); }
  // ---- fog puffs that keep rolling past the boat (they wrap round to the front as the boat goes by, so the fog never ends until it does)
  const puffs = []; for (let i = 0; i < 46; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: cloudTex(), color: 0xE4E9EC, transparent: true, opacity: 0, depthWrite: false, fog: false }));
    const sz = rr(6, 14); s.scale.set(sz * 1.6, sz, 1); s.position.set(rr(-26, 26), rr(0.4, 5), rr(-40, 20)); s.userData = { base: rr(0.35, 0.7), ph: rnd() * 6, dx: rr(-0.3, 0.3) }; w.add(s); puffs.push(s); }
  const W = { e: 0, puffK: 1, at: new THREE.Vector3() };
  onTick((t, dt) => puffs.forEach(s => { s.position.x += s.userData.dx * dt;
    if (s.position.z > W.at.z + 22) { s.position.z = W.at.z - rr(28, 42); s.position.x = W.at.x + rr(-26, 26); }
    const near = Math.hypot(s.position.x - W.at.x, s.position.z - W.at.z) < 3.5 && s.position.y < 3.2 ? 0.25 : 1;   // thin out right on top of the boat so the kids stay visible
    s.material.opacity = s.userData.base * W.puffK * near * (0.85 + Math.sin(t * 0.5 + s.userData.ph) * 0.15); }));
  // weather(e): 0 = thick fog, 1 = clear blue day
  const hemi = w.children.find(o => o.isHemisphereLight), sun = w.children.find(o => o.isDirectionalLight);
  const weather = e => { W.e = e; const k = e * e;
    scene.fog.color.copy(FOG.col).lerp(CLEAR.col, e); scene.fog.near = FOG.near + (CLEAR.near - FOG.near) * k; scene.fog.far = FOG.far + (CLEAR.far - FOG.far) * k;
    scene.background = FOG.sky.clone().lerp(CLEAR.sky, e); U.uDeep.value.copy(GRAYS[0]).lerp(BLUES[0], e); U.uShal.value.copy(GRAYS[1]).lerp(BLUES[1], e);
    if (hemi) hemi.intensity = 1.2 + e * 0.5; if (sun) sun.intensity = 0.75 + e * 1.0; W.puffK = 1 - e; wall.visible = e > 0.05; };
  weather(0);
  // ---- the boat and its crew; each of the kids gets a real wooden paddle
  const B = cartBoat(w), k = B.cast;
  // Leo at the front on the left, Mia behind him on the right, Toby at the back on a little crate (so he never blocks the close-ups)
  k.leo.g.position.set(-0.3, 0.45, 0.25); k.mia.g.position.set(0.3, 0.45, -0.15); k.toby.g.position.set(-0.28, 0.62, -0.5); k.toby.g.scale.setScalar(0.85);
  builder(B.g).box(0.5, 0.2, 0.45, 0x6E4529, -0.28, 0.5, -0.5, { line: 0.012 });
  const paddles = {}; const paddleOf = (c, name) => { const g = new THREE.Group(); c.AR.add(g); g.position.set(0, -0.44, 0.06); paddles[name] = g;
    load('q/paddle').then(src => { if (!src) return; const m = src.clone(true); const box = new THREE.Box3().setFromObject(m), ctr = box.getCenter(new THREE.Vector3()); m.position.sub(ctr); const ms = []; m.traverse(o => { if (o.isMesh) ms.push(o); }); ms.forEach(o => { o.material = toon(0xB8763F); const ink = new THREE.Mesh(o.geometry, INK); ink.scale.setScalar(1.06); o.add(ink); });
      const holder = new THREE.Group(); holder.add(m); holder.rotation.x = Math.PI / 2; holder.scale.setScalar(1.25); holder.position.y = -0.35; g.add(holder); }); return g; };
  paddleOf(k.leo, 'leo'); paddleOf(k.mia, 'mia'); paddles.leo.visible = paddles.mia.visible = false;   // (only out while they row)
  // a paddle lying in the boat (Mia drops hers)
  // ---- the gem: a tiny crystal shard (CC0 model) with a warm blue light; it starts hidden in Leo's pocket
  const gem = new THREE.Group(); w.add(gem); gem.visible = false;
  load('q/gem-blue').then(src => { const m = src ? src.clone(true) : new THREE.Mesh(new THREE.OctahedronGeometry(0.5), toon(0)); const box = new THREE.Box3().setFromObject(m), sz = box.getSize(new THREE.Vector3()), ctr = box.getCenter(new THREE.Vector3()); m.position.sub(ctr);
    const ms = []; m.traverse(o => { if (o.isMesh) ms.push(o); }); ms.forEach(o => { o.material = toon(0x8FE6FF, { emissive: 0x2AA8E8, emissiveIntensity: 0.9 }); const ink = new THREE.Mesh(o.geometry, INK); ink.scale.setScalar(1.08); o.add(ink); });
    const hold = new THREE.Group(); hold.add(m); hold.scale.setScalar(0.17 / Math.max(sz.x, sz.y, sz.z)); hold.rotation.z = 0.3; gem.add(hold); });
  const gemGlow = glowSprite(0x7FE9FF, 0.55, 0.8); gem.add(gemGlow); const gemLight = new THREE.PointLight(0x5AD1FF, 0, 6, 1.6); gem.add(gemLight);
  onTick(t => { gem.rotation.y = t * 1.5; gemGlow.material.opacity = 0.6 + Math.sin(t * 5) * 0.15; });
  // the glow seeping out of Leo's shorts pocket
  const pocketGlow = glowSprite(0x8FEAFF, 0.01, 0); k.leo.g.add(pocketGlow); pocketGlow.position.set(0.17, 0.66, 0.12);
  const pocketLight = new THREE.PointLight(0x7FDFFF, 0, 5, 1.5); pocketLight.position.set(0.2, 0.7, 0.4); k.leo.g.add(pocketLight);
  const pocketHit = new THREE.Mesh(new THREE.SphereGeometry(0.32, 10, 8), new THREE.MeshBasicMaterial({ visible: false })); pocketHit.position.set(0.15, 0.68, 0.1); k.leo.g.add(pocketHit);
  // ---- the beam: a thin bright core in a soft sheath, from the gem straight to BEAM_TO; cut short where it strikes the rock
  const beam = new THREE.Group(); w.add(beam); beam.visible = false;
  const core = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1, 8, 1, true), new THREE.MeshBasicMaterial({ color: 0xDFFBFF, fog: false, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false }));
  const sheath = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 1, 10, 1, true), new THREE.MeshBasicMaterial({ color: 0x4FCFFF, fog: false, transparent: true, opacity: 0.32, blending: THREE.AdditiveBlending, depthWrite: false }));
  [core, sheath].forEach(m => { m.geometry.translate(0, 0.5, 0); m.geometry.rotateX(Math.PI / 2); beam.add(m); });   // unit length along +z, scaled to the beam's length
  const BM = { len: 120, on: 0, blocked: true };
  const gp = new THREE.Vector3();
  onTick(t => { if (!beam.visible) return; gem.getWorldPosition(gp); beam.position.copy(gp); beam.lookAt(BEAM_TO);
    let len = gp.distanceTo(BEAM_TO); if (BM.blocked && gp.z > ROCK.z + 3) len = Math.min(len, (gp.z - (ROCK.z + 3.1)) / Math.max(0.2, (gp.z - BEAM_TO.z) / gp.distanceTo(BEAM_TO)));
    const L = Math.min(len, BM.len) * BM.on; beam.scale.set(1 + Math.sin(t * 9) * 0.08, 1 + Math.sin(t * 9) * 0.08, Math.max(0.001, L));
    rockGlow.material.opacity = BM.blocked && BM.on > 0.9 && len < BM.len ? 0.85 + Math.sin(t * 6) * 0.1 : 0; });
  // ---- the crystal fin (someone they know…): a glassy fin with a dark shape under it, drawing a long white trail behind it
  const fin = new THREE.Group(); w.add(fin); fin.visible = false;
  { const sh = new THREE.Shape(); sh.moveTo(-0.9, 0); sh.quadraticCurveTo(-0.5, 0.9, 0.35, 1.9); sh.quadraticCurveTo(0.25, 0.9, 0.9, 0); sh.lineTo(-0.9, 0);
    const g = new THREE.ExtrudeGeometry(sh, { depth: 0.08, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.05, bevelSegments: 1 }); g.translate(0, -0.25, -0.04); g.rotateY(-Math.PI / 2);
    const m = new THREE.Mesh(g, crysMat(0xA8F4FF)); m.material.opacity = 0.88; fin.add(m); const ink = new THREE.Mesh(g, INK); ink.scale.setScalar(1.04); m.add(ink);
    const fg = glowSprite(0x9FF6FF, 2.6, 0.35); fg.position.y = 0.8; fin.add(fg);
    const shadow = new THREE.Mesh(new THREE.CircleGeometry(1, 24), new THREE.MeshBasicMaterial({ color: 0x0B2E44, transparent: true, opacity: 0.45, depthWrite: false })); shadow.rotation.x = -Math.PI / 2; shadow.scale.set(1.7, 4.2, 1); shadow.position.y = -0.15; fin.add(shadow); fin.userData.shadow = shadow; }
  // trail: a ribbon laid along where the fin has been, foamy white at the fin and fading to nothing behind
  const TN = 80, tPos = new Float32Array(TN * 2 * 3), tAlpha = new Float32Array(TN * 2), hist = [];
  const tGeo = new THREE.BufferGeometry(); tGeo.setAttribute('position', new THREE.BufferAttribute(tPos, 3)); tGeo.setAttribute('alpha', new THREE.BufferAttribute(tAlpha, 1));
  const idx = []; for (let i = 0; i < TN - 1; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } tGeo.setIndex(idx);
  const trail = new THREE.Mesh(tGeo, new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, uniforms: { uT: { value: 0 } },
    vertexShader: 'attribute float alpha; varying float vA; varying vec2 vP; void main(){ vA = alpha; vP = position.xz; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'uniform float uT; varying float vA; varying vec2 vP; void main(){ float n = 0.75 + 0.25 * sin(vP.x * 3.1 + uT * 3.0) * sin(vP.y * 2.3 - uT * 2.0); gl_FragColor = vec4(vec3(0.96, 0.99, 1.0), vA * n); }' }));
  trail.frustumCulled = false; w.add(trail); trail.visible = false;
  const fp = new THREE.Vector3(), fd = new THREE.Vector3();
  onTick(t => { trail.material.uniforms.uT.value = t; if (!fin.visible) return; fin.getWorldPosition(fp);
    if (!hist.length || hist[0].distanceTo(fp) > 0.35) { hist.unshift(fp.clone().setY(0.08)); if (hist.length > TN) hist.pop(); }
    for (let i = 0; i < TN; i++) { const p = hist[Math.min(i, hist.length - 1)] || fp, q = hist[Math.min(i + 1, hist.length - 1)] || p; fd.subVectors(p, q); fd.y = 0; if (fd.lengthSq() < 1e-6) fd.set(0, 0, 1); fd.normalize();
      const wdt = 0.25 + i / TN * 1.6, sx = -fd.z * wdt, sz = fd.x * wdt; tPos.set([p.x + sx, 0.08, p.z + sz, p.x - sx, 0.08, p.z - sz], i * 6);
      const a = i < hist.length ? (1 - i / TN) * 0.85 : 0; tAlpha[i * 2] = tAlpha[i * 2 + 1] = a; }
    tGeo.attributes.position.needsUpdate = true; tGeo.attributes.alpha.needsUpdate = true; });
  const trailHit = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.6, 14), new THREE.MeshBasicMaterial({ visible: false })); w.add(trailHit);
  const finHit = new THREE.Mesh(new THREE.SphereGeometry(1.1, 10, 8), new THREE.MeshBasicMaterial({ visible: false })); finHit.position.y = 0.7; fin.add(finHit);
  return { w, b, sea, route, RL, dAt, B, k, paddles, gem, gemLight, gemGlow, pocketGlow, pocketLight, pocketHit, beam, BM, rock, rockHit, rockGlow, stacks, wall, isles, fin, trail, trailHit, finHit, hist, weather, W };
}
