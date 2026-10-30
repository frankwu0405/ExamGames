// Episode 5 places: the frozen sea in the fog, and Varn, guard of the deep stones.
import { THREE, builder, toon, newWorld, onTick } from './gfx.js';
import { rnd, ferris } from './sets.js';
import { cartBoat } from './sets4.js';
import { makeVarn } from './varn.js';
import { mist, snow, glowSprite } from './effects.js';
export { makeVarn };

// cracked-ice look, tinted teal and lavender like the storybook
function frozenTex() {
  const c = document.createElement('canvas'); c.width = c.height = 1024; const x = c.getContext('2d');
  const g = x.createRadialGradient(512, 512, 0, 512, 512, 720); g.addColorStop(0, '#DDEFF6'); g.addColorStop(0.5, '#C9DDF0'); g.addColorStop(1, '#B9C3E6'); x.fillStyle = g; x.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 60; i++) { const px = Math.random() * 1024, py = Math.random() * 1024, r = 40 + Math.random() * 140; const gg = x.createRadialGradient(px, py, 0, px, py, r);
    gg.addColorStop(0, i % 3 ? 'rgba(170,150,230,.25)' : 'rgba(120,220,230,.25)'); gg.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = gg; x.fillRect(0, 0, 1024, 1024); }
  // plates of ice with dark cracks between them
  for (let i = 0; i < 70; i++) { let px = Math.random() * 1024, py = Math.random() * 1024, a = Math.random() * 6.28; x.strokeStyle = 'rgba(60,80,120,.55)'; x.lineWidth = 2 + Math.random() * 2; x.beginPath(); x.moveTo(px, py);
    for (let k = 0; k < 10; k++) { a += (Math.random() - 0.5) * 0.9; px += Math.cos(a) * 26; py += Math.sin(a) * 26; x.lineTo(px, py); } x.stroke();
    x.strokeStyle = 'rgba(255,255,255,.6)'; x.lineWidth = 1; x.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 3); return t;
}

export function buildIce() {
  const w = newWorld({ sky: 0x4E5670, ambient: 0xC9D8F0, ambientI: 1.15, sunI: 0.7, sunPos: [-6, 10, 8], fog: [0x7E89A3, 30, 120] }); const b = builder(w);
  // a dark sky glow low on the horizon
  const skyM = new THREE.MeshBasicMaterial({ color: 0x8B8FB8, side: THREE.BackSide, fog: false, transparent: true, opacity: 0.6 });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(200, 24, 12, 0, Math.PI * 2, Math.PI * 0.42, Math.PI * 0.1), skyM); w.add(dome);
  // the sea under the ice is dark and a little see-through, so Varn's glow shows from below
  const water = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), toon(0x152A3C, { transparent: true, opacity: 0.6 })); water.rotation.x = -Math.PI / 2; water.position.y = -0.25; w.add(water);
  const iceMat = toon(0xFFFFFF, { map: frozenTex(), transparent: true, opacity: 0.84, depthWrite: false });
  const ice = new THREE.Mesh(new THREE.CircleGeometry(70, 48), iceMat); ice.rotation.x = -Math.PI / 2; ice.position.y = 0.05; w.add(ice);
  // the broken place where Varn bursts out: tilted slabs that jump up
  const slabs = []; for (let i = 0; i < 22; i++) { const a = (i / 22) * Math.PI * 2, r = 4.5 + rnd() * 3.5; const s = b.box(1.6 + rnd() * 2.2, 0.35, 1.2 + rnd() * 1.6, 0xD8EAF6, 1.3 + Math.cos(a) * r, 0.1, -15 + Math.sin(a) * r * 0.8, { ry: rnd() * 3, line: 0.03 });
    s.userData = { rx: (rnd() - 0.5) * 1.4, rz: (rnd() - 0.5) * 1.4, y: 0.2 + rnd() * 0.6 }; s.visible = false; slabs.push(s); }
  const hole = new THREE.Mesh(new THREE.CircleGeometry(5.6, 30), new THREE.MeshBasicMaterial({ color: 0x0C1A28 })); hole.rotation.x = -Math.PI / 2; hole.position.set(1.3, 0.07, -15); hole.scale.setScalar(0.001); w.add(hole);
  // ice chunks in front of the boat (letters go on these)
  const chunks = []; for (let i = 0; i < 9; i++) { const k = i / 8; const m = b.box(1.2 + rnd() * 0.5, 0.4, 1 + rnd() * 0.4, 0xE2F2FF, -5 + k * 10, 0.15, -4.4 - Math.sin(k * Math.PI) * 1.6, { ry: rnd() * 3, line: 0.025 }); m.visible = false; chunks.push(m); }
  // the hometown, faint in the fog: buildings and the Ferris wheel
  const ghost = new THREE.Group(); w.add(ghost); const gb = builder(ghost);
  for (let i = 0; i < 16; i++) gb.box(3 + rnd() * 3, 4 + rnd() * 9, 3, 0x6E7896, -40 + i * 5.2, 2, -78 - rnd() * 6, { line: 0 });
  ferris(gb, -14, 0, -72, 2.8);
  ghost.traverse(o => { if (o.material) { o.material = o.material.clone(); o.material.transparent = true; o.material.opacity = 0.5; } });
  // fog drifting low over the ice, and tiny ice crystals in the air
  const fogA = mist(w, { count: 30, center: new THREE.Vector3(0, 0, -6), spread: 46, inner: 16, y: [0.6, 3.5], size: [8, 18], color: 0xC9D3E6, opacity: 0.55 }); fogA.show(1, 10);
  const glitter = snow(w, { count: 260, area: 50, size: 0.16, fall: 0.25, color: 0xDDF4FF }); glitter.show(0.8, 10);
  // the boat, stuck in the ice (it points towards -z)
  const boat = cartBoat(w); boat.g.position.set(0, 0.12, 0); boat.g.rotation.y = Math.PI; boat.wind.k = 0.15;
  const { leo, mia, toby } = boat.cast;
  leo.g.position.set(-0.3, 0.45, 0.2); mia.g.position.set(0.3, 0.45, -0.1); toby.g.position.set(0, 0.85, 0.6); toby.g.scale.setScalar(0.9);
  [leo, mia].forEach(c => { c.L.rotation.x = c.R.rotation.x = -1.4; });
  const gem = builder(mia.g).add(new THREE.OctahedronGeometry(0.2), toon(0x5AD1FF, { emissive: 0x2AA8E8, emissiveIntensity: 0.9 }), 0, 0.85, -0.35, { line: 0.02 }); gem.scale.y = 1.6;
  const gemLight = new THREE.PointLight(0x5AD1FF, 0, 10, 1.4); gem.add(gemLight);
  const gemGlow = glowSprite(0x7FDBFF, 0.01, 0.95); gem.add(gemGlow);
  // Varn
  const varn = makeVarn(w); varn.set('hidden');
  const varnLight = new THREE.PointLight(0x8FEFFF, 0, 40, 1.2); w.add(varnLight); onTick(() => { const p = varn.at(0.15); varnLight.position.copy(p); });
  return { w, boat, gem, gemLight, gemGlow, varn, varnLight, slabs, hole, chunks, iceMat, fog: fogA, ghost };
}
