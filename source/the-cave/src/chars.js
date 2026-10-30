// Leo, Mia and Toby as toon figures. Each has .g (group) and .pose(name); poses animate every frame.
import { THREE, builder, onTick } from './gfx.js';

function kid({ skin, shirt, legs, shoes, hair }) {
  const g = new THREE.Group(); const b = builder(g);
  const limb = (x, y, parts) => { const p = new THREE.Group(); p.position.set(x, y, 0); g.add(p); parts(builder(p)); return p; };
  const L = limb(-0.11, 0.5, b => { b.box(0.15, 0.3, 0.16, legs, 0, -0.12, 0, { line: 0.02 }); b.box(0.13, 0.2, 0.14, skin, 0, -0.34, 0, { line: 0.02 }); b.box(0.17, 0.09, 0.26, shoes, 0, -0.47, 0.04, { line: 0.02 }); });
  const R = limb(0.11, 0.5, b => { b.box(0.15, 0.3, 0.16, legs, 0, -0.12, 0, { line: 0.02 }); b.box(0.13, 0.2, 0.14, skin, 0, -0.34, 0, { line: 0.02 }); b.box(0.17, 0.09, 0.26, shoes, 0, -0.47, 0.04, { line: 0.02 }); });
  b.cyl(0.24, 0.27, 0.5, shirt, 0, 0.76, 0, { line: 0.025 });
  const AL = limb(-0.31, 0.96, b => { b.box(0.12, 0.2, 0.13, shirt, 0, -0.08, 0, { line: 0.02 }); b.box(0.1, 0.24, 0.11, skin, 0, -0.28, 0, { line: 0.02 }); });
  const AR = limb(0.31, 0.96, b => { b.box(0.12, 0.2, 0.13, shirt, 0, -0.08, 0, { line: 0.02 }); b.box(0.1, 0.24, 0.11, skin, 0, -0.28, 0, { line: 0.02 }); });
  const head = new THREE.Group(); head.position.y = 1.32; g.add(head); const hb = builder(head);
  hb.ball(0.27, skin, 0, 0, 0, { line: 0.025, seg: 18 });
  [-0.09, 0.09].forEach(x => { hb.ball(0.045, 0x2E2A4F, x, 0.03, 0.23, { line: 0 }); hb.ball(0.016, 0xffffff, x + 0.015, 0.05, 0.27, { line: 0 }); });
  [-0.15, 0.15].forEach(x => hb.ball(0.045, 0xF49AA4, x, -0.06, 0.2, { line: 0 }));
  const mouth = hb.torus(0.05, 0.012, 0x2E2A4F, 0, -0.09, 0.24, { line: 0, arc: Math.PI, rz: Math.PI });
  hair(hb, head);
  return { g, L, R, AL, AR, head, mouth };
}
const LEO = () => kid({ skin: 0x8D5A3B, shirt: 0x5DBB4A, legs: 0xA88B5C, shoes: 0x3D6FD1, hair: hb => {
  for (let i = 0; i < 26; i++) { const a = i / 26 * Math.PI * 2, r = 0.22 + (i % 3) * 0.03, y = 0.12 + (i % 4) * 0.05;
    hb.ball(0.1, 0x3B2416, Math.cos(a) * r * 0.9, y, Math.sin(a) * r * 0.8 - 0.05, { line: 0 }); }
  hb.ball(0.26, 0x3B2416, 0, 0.12, -0.05, { line: 0.02 }); } });
const MIA = () => kid({ skin: 0xF6D2B5, shirt: 0xF06292, legs: 0xF06292, shoes: 0xE84A7F, hair: (hb, head) => {
  hb.ball(0.285, 0xF2C94C, 0, 0.07, -0.04, { line: 0.02 }); hb.box(0.42, 0.12, 0.1, 0xF2C94C, 0, 0.2, 0.18, { line: 0.02, rx: -0.3 });
  [-1, 1].forEach(s => { hb.ball(0.07, 0xE84A7F, s * 0.27, 0.12, -0.02, { line: 0.015 });
    hb.cone(0.1, 0.36, 0xF2C94C, s * 0.34, -0.06, -0.02, { line: 0.02, rz: -s * (Math.PI - 0.45) }); }); } });

function dog() {
  const g = new THREE.Group(); const b = builder(g); const fur = 0xC98A4B, dark = 0x8A5A2E;
  const body = b.ball(0.24, fur, 0, 0.33, 0, { line: 0.02 }); body.scale.set(0.85, 0.8, 1.35);
  const legs = [[-0.12, 0.17], [0.12, 0.17], [-0.12, -0.17], [0.12, -0.17]].map(([x, z]) => { const p = new THREE.Group(); p.position.set(x, 0.26, z); g.add(p); builder(p).cyl(0.05, 0.05, 0.26, fur, 0, -0.13, 0, { line: 0.015 }); return p; });
  const head = new THREE.Group(); head.position.set(0, 0.55, 0.3); g.add(head); const hb = builder(head);
  hb.ball(0.19, fur, 0, 0, 0, { line: 0.02 }); const snout = hb.ball(0.1, 0xE7B985, 0, -0.05, 0.15, { line: 0.015 }); snout.scale.set(1, 0.8, 1.1);
  hb.ball(0.04, 0x2E2A4F, 0, -0.01, 0.26, { line: 0 });
  [-0.07, 0.07].forEach(x => { hb.ball(0.035, 0x2E2A4F, x, 0.05, 0.15, { line: 0 }); hb.ball(0.012, 0xffffff, x + 0.01, 0.065, 0.18, { line: 0 }); });
  const ears = [-1, 1].map(s => { const e = hb.ball(0.08, dark, s * 0.16, 0.02, -0.02, { line: 0.015 }); e.scale.set(0.5, 1.4, 0.9); return e; });
  const tail = new THREE.Group(); tail.position.set(0, 0.42, -0.3); g.add(tail); builder(tail).cyl(0.03, 0.045, 0.24, fur, 0, 0.1, -0.03, { line: 0.015, rx: -0.6 });
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
    c.AL.rotation.z = c.AR.rotation.z = 0;
    if (s === 'scared' || s === 'cheer') { c.AL.rotation.z = -2.6 + Math.sin(t * 9) * 0.15; c.AR.rotation.z = 2.6 - Math.sin(t * 9) * 0.15; }
    if (s === 'reach') { c.AR.rotation.x = -1.5; c.AL.rotation.x = -0.3; }
    if (s === 'point') { c.AR.rotation.x = -1.6; }
    if (s === 'hold') { c.AR.rotation.x = c.AL.rotation.x = -1.1; c.AR.rotation.z = 0.35; c.AL.rotation.z = -0.35; }
    if (s === 'hide') { c.AR.rotation.x = c.AL.rotation.x = 0.75; c.AR.rotation.z = -0.35; c.AL.rotation.z = 0.35; }
    if (s === 'sit') { c.L.rotation.x = c.R.rotation.x = -1.4; }
    c.head.rotation.z = s === 'idle' ? Math.sin(t * 1.5 + c.t0) * 0.05 : 0;
    c.head.position.y = 1.32 + (run ? Math.abs(Math.sin(k)) * 0.04 : 0);
    c.mouth.scale.y = s === 'scared' || s === 'hide' ? -1 : 1;
  };
  onTick(c.tick);
  return c;
}
// Fresh figures each time a place is built (the old world is thrown away).
export function makeCast(world) {
  const leo = animate(LEO(), 'kid'), mia = animate(MIA(), 'kid'), toby = animate(dog(), 'dog');
  [leo, mia, toby].forEach(c => world.add(c.g)); toby.g.scale.setScalar(1.1);
  return { leo, mia, toby, rearm: () => [leo, mia, toby].forEach(c => onTick(c.tick)) };
}
