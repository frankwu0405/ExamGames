// Episode 5 places: the frozen sea in the fog, and Varn, guard of the deep stones.
import { THREE, builder, toon, outline, newWorld, onTick, textTexture } from './gfx.js';
import { rnd, ferris } from './sets.js';
import { cartBoat } from './sets4.js';

// Varn: translucent sea-green body with glowing runes, a flowing purple mane, glowing white eyes, long sharp claws, a heavy tail.
export function makeVarn(parent) {
  const V = new THREE.Group(); parent.add(V); const b = builder(V);
  const skin = toon(0x5E9DB0, { emissive: 0x1C4C5C, emissiveIntensity: 0.3 });
  const belly = toon(0xA8D4DC, { emissive: 0x2A5A66, emissiveIntensity: 0.15 });
  const glowM = new THREE.MeshBasicMaterial({ color: 0x9FFFF4 }), maneM = toon(0xB197FC, { emissive: 0x7A4FE0, emissiveIntensity: 0.6 });
  const body = b.add(new THREE.SphereGeometry(1, 22, 14), skin, 0, 0, 0, { line: 0.04 }); body.scale.set(2.3, 1.5, 3.8);
  b.add(new THREE.SphereGeometry(1, 16, 10), belly, 0, -0.55, 0.4, { line: 0 }).scale.set(1.8, 0.9, 3.2);
  // head
  const head = new THREE.Group(); head.position.set(0, 1.3, 3.6); V.add(head); const hb = builder(head);
  hb.add(new THREE.SphereGeometry(1, 20, 14), skin, 0, 0, 0, { line: 0.04 }).scale.set(1.8, 1.25, 1.9);
  hb.add(new THREE.SphereGeometry(1, 16, 10), skin, 0, -0.35, 1.3, { line: 0.03 }).scale.set(1.35, 0.8, 1.0);
  hb.torus(0.8, 0.05, 0x1D3440, 0, -0.55, 1.75, { arc: Math.PI, rz: Math.PI, line: 0 });
  const eyes = [-0.75, 0.75].map(x => { const e = hb.add(new THREE.SphereGeometry(0.3, 12, 10), glowM, x, 0.42, 1.45, { line: 0.02 }); e.scale.set(1, 0.75, 0.6); return e; });
  const eyeLight = new THREE.PointLight(0xDFFFFF, 0, 12, 1.4); eyeLight.position.set(0, 0.5, 2.6); head.add(eyeLight);
  // mane: flowing purple strands from the head back over the neck
  const mane = []; for (let i = 0; i < 9; i++) { const a = (i - 4) * 0.22; const pts = [0, 1, 2, 3].map(k => new THREE.Vector3(Math.sin(a) * (0.5 + k * 0.25), 1.0 + k * 0.35 - k * k * 0.12, -0.2 - k * 0.75));
    const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, 0.13 - Math.abs(i - 4) * 0.008, 6), maneM); outline(m, 0.02); head.add(m); m.userData.ph = i; mane.push(m); }
  // glowing runes on the sides
  [-1, 1].forEach(sd => { for (let k = 0; k < 4; k++) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.35 + k * 0.08, 0.035, 6, 20, Math.PI * 1.4), glowM); r.position.set(sd * 2.25, 0.3 - k * 0.15, 1.2 - k * 1.2); r.rotation.y = sd * Math.PI / 2; r.rotation.z = k; V.add(r); } });
  // spikes along the back
  for (let k = 0; k < 7; k++) b.cone(0.22, 0.6, 0xA9D3DE, 0, 1.45 - Math.abs(k - 3) * 0.05, 2.2 - k * 0.8, { rx: -0.4, line: 0.02 });
  // front legs with long sharp claws
  const legs = [-1, 1].map(sd => { const g = new THREE.Group(); g.position.set(sd * 1.7, -0.6, 2.0); V.add(g); const lb = builder(g);
    lb.add(new THREE.CylinderGeometry(0.42, 0.34, 1.6, 10), skin, 0, -0.7, 0.2, { rx: 0.3, line: 0.03 });
    for (let c = -1; c <= 1; c++) lb.cone(0.11, 0.75, 0xEDF6F8, c * 0.24, -1.55, 0.75, { rx: 1.9, line: 0.015 }); return g; });
  // the heavy tail (it can lift and smash)
  const tail = new THREE.Group(); tail.position.set(0, 0, -3.4); V.add(tail); let seg = tail; const tailSegs = [];
  for (let k = 0; k < 6; k++) { const g = new THREE.Group(); g.position.z = k === 0 ? 0 : -1.0; seg.add(g); builder(g).add(new THREE.SphereGeometry(0.9 - k * 0.12, 14, 10), skin, 0, 0, -0.5, { line: 0.03 }).scale.set(1, 0.8, 1.2); tailSegs.push(g); seg = g; }
  builder(seg).cone(0.9, 1.4, 0x9AC8D4, 0, 0, -1.4, { rx: -Math.PI / 2, rz: Math.PI / 2, line: 0.03 }).scale.set(1, 1, 0.25);
  const state = { swim: 0, lift: 0, anger: 0 };
  onTick(t => {
    mane.forEach(m => { m.rotation.x = Math.sin(t * 2 + m.userData.ph * 0.6) * 0.15; m.rotation.y = Math.sin(t * 1.5 + m.userData.ph) * 0.1; });
    tailSegs.forEach((g, k) => { g.rotation.y = Math.sin(t * 2.2 - k * 0.6) * 0.12 * (1 + state.swim); g.rotation.x = -state.lift * 0.32; });
    legs.forEach((g, i) => g.rotation.x = Math.sin(t * 1.8 + i * Math.PI) * 0.15 * state.swim);
    eyes.forEach(e => e.scale.y = 0.75 + state.anger * 0.15 + (Math.sin(t * 0.9) > 0.985 ? -0.6 : 0));
  });
  V.scale.setScalar(1.25);
  return { g: V, head, eyes, eyeLight, tail, state, mane };
}

// ================================================================ the frozen sea in the fog
export function buildIce() {
  const w = newWorld({ sky: 0x8E9AA8, ambient: 0xCFE2F0, ambientI: 1.25, sunI: 0.9, sunPos: [-6, 10, 8], fog: [0xAEB9C4, 14, 70] }); const b = builder(w);
  const water = new THREE.Mesh(new THREE.PlaneGeometry(300, 300, 40, 40), toon(0x1E3A4E)); water.rotation.x = -Math.PI / 2; water.position.y = -0.2; w.add(water);
  // the ice sheet (slightly see-through so the shadow under it can be seen)
  const iceMat = toon(0xDDF0FA, { transparent: true, opacity: 0.86 });
  const ice = new THREE.Mesh(new THREE.CircleGeometry(26, 40), iceMat); ice.rotation.x = -Math.PI / 2; ice.position.y = 0.06; w.add(ice);
  const crackMat = new THREE.MeshBasicMaterial({ color: 0x5A7A8E });
  for (let i = 0; i < 16; i++) { let x = (rnd() - 0.5) * 30, z = (rnd() - 0.5) * 30, a = rnd() * 6; for (let k = 0; k < 6; k++) { const l = 0.8 + rnd(); a += (rnd() - 0.5) * 1.2; const m = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.01, l), crackMat); m.position.set(x + Math.sin(a) * l / 2, 0.08, z + Math.cos(a) * l / 2); m.rotation.y = a; w.add(m); x += Math.sin(a) * l; z += Math.cos(a) * l; } }
  // big cracks that open at the front when Varn bursts out
  const front = []; for (let i = 0; i < 9; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.02, 1.4 + rnd()), new THREE.MeshBasicMaterial({ color: 0x1E3A4E })); m.position.set(-3 + i * 0.75, 0.09, -6 - rnd()); m.rotation.y = (rnd() - 0.5) * 1.5; m.scale.z = 0.001; w.add(m); front.push(m); }
  const hole = new THREE.Mesh(new THREE.CircleGeometry(4.4, 26), new THREE.MeshBasicMaterial({ color: 0x14293A })); hole.rotation.x = -Math.PI / 2; hole.position.set(0, 0.07, -9.5); hole.scale.setScalar(0.001); w.add(hole);
  // broken ice chunks (they float up when the ice smashes)
  const chunks = []; for (let i = 0; i < 9; i++) { const k = i / 8; const m = b.box(1.1 + rnd() * 0.6, 0.35, 0.9 + rnd() * 0.5, 0xDDF4FF, -5 + k * 10, 0.1, -4.6 - Math.sin(k * Math.PI) * 1.6, { ry: rnd() * 3, line: 0.025 }); m.visible = false; chunks.push(m); }
  // fog banks all around, and the hometown fading in the distance
  const fogMat = toon(0xE8EEF4, { transparent: true, opacity: 0.8 });
  for (let i = 0; i < 30; i++) { const a = rnd() * Math.PI * 2, r = 22 + rnd() * 20; const m = new THREE.Mesh(new THREE.SphereGeometry(4 + rnd() * 4, 10, 8), fogMat); m.position.set(Math.cos(a) * r, 1 + rnd() * 3, Math.sin(a) * r); m.scale.y = 0.5; w.add(m); const ph = rnd() * 6; onTick(t => { m.position.y = 1.5 + Math.sin(t * 0.3 + ph) * 0.5; }); }
  const town = ferris(b, -16, 0, -60, 2.6); town.traverse(o => { if (o.material && o.material.color) { o.material = o.material.clone(); o.material.transparent = true; o.material.opacity = 0.35; } });
  // the boat, stuck in the ice
  const boat = cartBoat(w); boat.g.position.set(0, 0.12, 0); boat.g.rotation.y = Math.PI; boat.wind.k = 0.15;
  const { leo, mia, toby } = boat.cast;
  leo.g.position.set(-0.3, 0.45, 0.2); mia.g.position.set(0.3, 0.45, -0.1); toby.g.position.set(0, 0.85, 0.6); toby.g.scale.setScalar(0.9);
  [leo, mia].forEach(c => { c.L.rotation.x = c.R.rotation.x = -1.4; });
  const gem = builder(mia.g).add(new THREE.OctahedronGeometry(0.2), toon(0x5AD1FF, { emissive: 0x2AA8E8, emissiveIntensity: 0.9 }), 0, 0.85, -0.35, { line: 0.02 }); gem.scale.y = 1.6;
  const gemLight = new THREE.PointLight(0x5AD1FF, 0, 10, 1.4); gem.add(gemLight);
  // the shadow circling under the ice
  const shade = new THREE.Mesh(new THREE.CircleGeometry(1, 24), new THREE.MeshBasicMaterial({ color: 0x0E1E2A, transparent: true, opacity: 0.0 })); shade.rotation.x = -Math.PI / 2; shade.scale.set(2.4, 5, 1); shade.position.y = 0.0; w.add(shade);
  // Varn (hidden below)
  const varn = makeVarn(w); varn.g.position.set(0, -9, -9.5); varn.g.rotation.y = Math.PI * 0; varn.g.visible = false;
  return { w, boat, gem, gemLight, shade, varn, front, hole, chunks, iceMat };
}
