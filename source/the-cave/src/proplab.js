// Prop Lab: the upgraded props for Episodes 1–5, one small diorama per kind of place, with the meadow test's grass and lighting.
// Models: free CC0 packs (Kenney, Quaternius, pmndrs market) restyled to our toon look; water, crystals, ice, carts etc. are built in code.
import { THREE, init, newWorld, onTick, setCam, toon, renderer, camera, builder, outline } from './gfx.js';
import { glowTex, cloudTex, glowSprite } from './effects.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { makeLabKids } from './chars.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

init(document.body);
import { setSeed, seed as _s, rnd, rr, pick, nz, small, INK, load, PAL, scatter, ground, grass, water, rockMat, lumpy, mesh, textTex, WOOD, WOOD2, IRON, mineCart, rails, lantern, sign, crystalCluster, flag, pawPrints, shell, starfish, clouds, motes, bubbles, snow, ferris } from './props.js';
// ---------------------------------------------------------------- the sets
const SETS = {};
// ======== 0. The journey map, redrawn with the same props (lighter detail) and the route fixed:
// meadow -> under the sea to the island -> sailing back towards home -> frozen sea between the island and home -> the angry wave throws them far past the island (Episode 6 on)
const MAPSTOPS = { 1: [-19.5, 8.2], 2: [-16.6, 9.8], 3: [-13.6, 9.0], 4: [-10.8, 8.0], 5: [-8.0, 7.2], 6: [-5.4, 6.6], 7: [-11.6, 5.4], 8: [-7.8, 4.6], 9: [-4.0, 4.4],
  10: [2.6, 1.6], 11: [4.6, 6.4], 12: [0.2, -3.2], 13: [-4.4, -6.2], 14: [-8.2, -8.6], 15: [-11.4, -10.6], 16: [24, -5], 17: [26.6, -8.2], 18: [29.2, -5.6], 19: [30, 4], 20: [24, 10], 21: [33, 12] };
SETS.map = { name: 'Journey map', stops: [], mapSet: true, light: { sky: 0xBFE6F7, fog: [0xCFEAF5, 70, 150], ambientI: 1.5, sunI: 1.6, sunPos: [-14, 30, 18] }, cam: [[0, 27, 29], [-1, 0, -2]],
  build: async G => {
    const coastX = z => -16.5 + 5.6 * Math.exp(-(((z - 10) / 5.5) ** 2)) + 0.7 * Math.sin(z * 0.37) + 0.35 * Math.sin(z * 1.1 + 1);
    // seabed (deeper away from the land) and the clear sea over it, foam along every shore
    const bed = new THREE.PlaneGeometry(200, 160, 120, 100); bed.rotateX(-Math.PI / 2); { const p = bed.attributes.position, c = new Float32Array(p.count * 3), col = new THREE.Color(); for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), dl = Math.min(x - coastX(z), Math.hypot(x - 3, z - 3) - 5.5); const y = -1.2 - Math.min(2.6, Math.max(0, dl) * 0.35) + nz(x, z, 0.2) * 0.25; p.setY(i, y); col.setHSL(0.13 - Math.min(0.06, Math.max(0, dl) * 0.01), 0.4, 0.62 - Math.min(0.32, Math.max(0, dl) * 0.04)); c.set([col.r, col.g, col.b], i * 3); } bed.setAttribute('color', new THREE.BufferAttribute(c, 3)); bed.computeVertexNormals(); }
    G.add(new THREE.Mesh(bed, toon(0xffffff, { vertexColors: true })));
    const bedY = (x, z) => { const dl = Math.min(x - coastX(z), Math.hypot(x - 3, z - 3) - 5.5); return -1.2 - Math.min(2.6, Math.max(0, dl) * 0.35) + nz(x, z, 0.2) * 0.25; };
    const coastGL = 'float cx(float z){ return -16.5 + 5.6 * exp(-pow((z - 10.0) / 5.5, 2.0)) + 0.7 * sin(z * 0.37) + 0.35 * sin(z * 1.1 + 1.0); }';
    const sea = new THREE.PlaneGeometry(220, 180, 2, 2); sea.rotateX(-Math.PI / 2);
    const sw = water(G, sea, { deep: 0x3AA2D0, shallow: 0x67C6E0, opacity: 0.55, scale: 2.2, sparkle: 0.3, foamFn: `max(max(1.0 - smoothstep(0.0, 0.45, abs(vW.x - (-16.5 + 5.6 * exp(-pow((vW.z - 10.0) / 5.5, 2.0)) + 0.7 * sin(vW.z * 0.37) + 0.35 * sin(vW.z * 1.1 + 1.0)) - 0.5)), 1.0 - smoothstep(0.0, 0.45, abs(length(vW.xz - vec2(3.0, 3.0)) - 5.6 - sin(atan(vW.z - 3.0, vW.x - 3.0) * 3.0) * 0.4))), 1.0 - smoothstep(0.0, 0.45, abs(length((vW.xz - vec2(26.5, -7.0)) * vec2(0.8, 1.15)) - 4.0)))` }); sw.position.y = 0;
    // the mainland: low hills of grass, a sandy shore
    const ml = new THREE.PlaneGeometry(90, 160, 90, 160); ml.rotateX(-Math.PI / 2); { const p = ml.attributes.position, c = new Float32Array(p.count * 3), col = new THREE.Color(); for (let i = 0; i < p.count; i++) { const x = p.getX(i) - 52, z = p.getZ(i), d = coastX(z) - x; p.setX(i, x); p.setY(i, d < 0 ? Math.max(-6, d * 1.5) : Math.min(0.8, d * 0.5) + (d > 3 ? nz(x, z, 0.12) * 0.5 + 0.3 : 0)); d < 1.2 ? col.setRGB(0.93, 0.83, 0.6) : col.setHSL(0.27 + nz(x, z, 0.1) * 0.02, 0.48, 0.5 + nz(x, z, 0.3) * 0.04); c.set([col.r, col.g, col.b], i * 3); } ml.setAttribute('color', new THREE.BufferAttribute(c, 3)); ml.computeVertexNormals(); }
    const mlm = new THREE.Mesh(ml, toon(0xffffff, { vertexColors: true })); mlm.receiveShadow = true; G.add(mlm);
    const mH = (x, z) => { const d = coastX(z) - x; return d < 0 ? -1.5 : Math.min(0.8, d * 0.5) + (d > 3 ? nz(x, z, 0.12) * 0.5 + 0.3 : 0); };
    // hometown: houses with coloured roofs, the Ferris wheel, the lighthouse, the harbour with boats
    const roofC = [0xEF5B4C, 0x4AA3DF, 0xFFC94A, 0xB57EDC, 0x5DBB4A, 0xF28C38, 0xE86A8E]; let placed = 0;
    for (let i = 0; i < 200 && placed < 34; i++) { const x = rr(-42, -19), z = rr(-24, 2); if (x > coastX(z) - 2) continue; if (Math.hypot(x + 24, z + 3) < 3.5) continue; const b = builder(G), y = mH(x, z), hh = rnd() < 0.3 ? 1.5 : 0.95, ry = rr(-0.3, 0.3);
      b.rbox(1.1, hh, 1.1, 0xFFF4D6, x, y + hh / 2, z, { ry, line: 0.025 }); b.cone(0.95, 0.75, roofC[placed % 7], x, y + hh + 0.37, z, { seg: 4, ry: Math.PI / 4 + ry, line: 0.025 }); if (rnd() < 0.5) b.box(0.18, 0.4, 0.18, 0xB8705A, x + 0.25, y + hh + 0.5, z + 0.2, { line: 0.01 }); placed++; }
    ferris(G, -24, mH(-24, -3), -3, 0.22);
    { const lz = -9, lx = coastX(lz) - 1.2, b = builder(G); b.cyl(0.45, 0.65, 3, 0xFFFDF4, lx, 1.9, lz); [1.2, 2.3].forEach(y => b.cyl(0.55, 0.58, 0.35, 0xD93A35, lx, y, lz, { line: 0.02 })); b.cyl(0.42, 0.42, 0.45, 0xFFE58A, lx, 3.6, lz, { line: 0.02 }); b.cone(0.58, 0.55, 0xD93A35, lx, 4.1, lz);
      const beam = new THREE.Mesh(new THREE.ConeGeometry(1.1, 6, 16, 1, true), new THREE.MeshBasicMaterial({ color: 0xFFF2B0, transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false })); beam.rotation.z = Math.PI / 2; beam.position.x = 3.2; const piv = new THREE.Group(); piv.position.set(lx, 3.6, lz); piv.add(beam); G.add(piv); onTick((t, dt) => { piv.rotation.y += (dt || 0.016) * 0.8; }); }
    { const pz = -3.5, px = coastX(pz), b = builder(G); b.box(4, 0.18, 0.8, 0x9C6B45, px + 1.8, 0.35, pz, { line: 0.02 }); }
    await scatter(G, 'boat-small', [{ x: coastX(-2) + 3, z: -1.8, y: -0.1, ry: 0.5 }, { x: coastX(-5) + 4.5, z: -5, y: -0.1, ry: 2 }], { norm: 1.6 });
    // woods and fields on the mainland
    const tr = { tree_oak: [], tree_fat: [], tree_pine: [], tree_pine_tall: [] }, tk = Object.keys(tr);
    for (let i = 0; i < 130; i++) { const z = rr(-40, 40), x = rr(-48, coastX(z) - 2); if (z > -26 && z < 4 && x > -44) continue; if (Math.hypot(x + 19.5, z - 8.5) < 3.5) continue; tr[tk[i % 4]].push({ x, z, s: rr(0.55, 0.9) }); }
    for (const k in tr) await scatter(G, k, tr[k], { gy: mH });
    // the cave hill on the coast, with its arch, and the meadow in front of it
    const hm = rockMat(0xA9A3A0, 0.3), CH = [-16.6, 11.6]; { const m = mesh(G, lumpy(2.6, 3, 0.2, 0.62), hm, CH[0], 0.4, CH[1], { sc: [1.25, 1, 1] }); const o = hm.onBeforeCompile; hm.onBeforeCompile = sh => { o(sh); sh.fragmentShader = sh.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\n diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.42, 0.72, 0.33), smoothstep(0.6, 0.85, vRN.y));'); }; }
    { const h = new THREE.Mesh(new THREE.CircleGeometry(0.75, 18, 0, Math.PI), new THREE.MeshBasicMaterial({ color: 0x07080F })); h.position.set(CH[0] - 1.4, mH(CH[0] - 3, CH[1]) + 0.05, CH[1] - 1.9); h.rotation.y = -0.6; G.add(h); }
    await scatter(G, 'flower_red', Array.from({ length: 30 }, () => ({ x: -19.5 + rr(-2, 2), z: 8.5 + rr(-2, 2), s: 0.35 })), { gy: mH, shadow: false });
    // the lost island: lookout hill, palms, the cave
    const iH = (x, z) => { const d = Math.hypot(x - 3, z - 3) / (1 + Math.sin(Math.atan2(z - 3, x - 3) * 3) * 0.07), hill = Math.max(0, 1 - Math.hypot(x - 1.6, z - 1.2) / 2.6); return Math.max(-6, Math.min(0.6, (5.6 - d) * 1.4)) + Math.pow(hill, 0.7) * 3; };
    ground(G, 20, 120, (x, z) => iH(x + 3, z + 3), (x, z, c) => { const h = iH(x + 3, z + 3); h < 0.4 ? c.setRGB(0.93, 0.83, 0.6) : c.setHSL(0.27, 0.5, 0.5); }, rockMat(0xffffff, 0.35, { steep: true })).position.set(3, 0, 3);
    { const rmI = rockMat(0xA59C92, 0.5); for (let i = 0; i < 9; i++) { const a = rnd() * 6.28, r = rr(0.8, 2.3), x = 1.6 + Math.cos(a) * r, z = 1.2 + Math.sin(a) * r; mesh(G, lumpy(rr(0.3, 0.55), 2, 0.25, 0.9), rmI, x, iH(x, z) + 0.05, z, { ry: rnd() * 6 }); } }
    await scatter(G, 'palm-detailed-short', [{ x: 5.5, z: 4.6 }, { x: 6.4, z: 2 }, { x: 3.4, z: 6.2 }, { x: 0.6, z: 5 }], { gy: iH, norm: 1.7 });
    await scatter(G, 'tree_fat', [{ x: 4.4, z: 1, s: 0.6 }, { x: 5.6, z: 6.4, s: 0.55 }], { gy: iH });
    // the secret tunnel under the sea floor: from the meadow cave to the island cave, seen through the clear water
    const TP = [[CH[0] - 1.4, 0.2, CH[1] - 1.9], [-15, -1.6, 9.6], ...[2, 3, 4, 5, 6].map(n => [MAPSTOPS[n][0], 0, MAPSTOPS[n][1]]), [-2, 0, 4.8], [0.4, -0.6, 3], [1.2, 0.4, 2.2]].map(a => { if (a[1] === 0) a[1] = bedY(a[0], a[2]) + 0.15; return new THREE.Vector3(...a); });
    const tc = new THREE.CatmullRomCurve3(TP, false, 'centripetal');
    const tube = new THREE.Mesh(new THREE.TubeGeometry(tc, 160, 0.42, 10), toon(0x24304A, { emissive: 0x1E5A80, emissiveIntensity: 0.55 })); G.add(tube); tube.add(new THREE.Mesh(tube.geometry, INK));
    // Leo's side passage (Episode 3) branches off and rejoins
    const lc = new THREE.CatmullRomCurve3([[-13.6, 0, 9], [MAPSTOPS[7][0], 0, MAPSTOPS[7][1]], [MAPSTOPS[8][0], 0, MAPSTOPS[8][1]], [MAPSTOPS[9][0], 0, MAPSTOPS[9][1]], [-2, 0, 4.8]].map(a => new THREE.Vector3(a[0], bedY(a[0], a[2]) + 0.12, a[2])), false, 'centripetal');
    G.add(new THREE.Mesh(new THREE.TubeGeometry(lc, 100, 0.3, 8), toon(0x2E3348, { emissive: 0x1A2A4A, emissiveIntensity: 0.5 })));
    // the frozen sea between the island and home, the sunken ship on the way
    { const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'); x.fillStyle = '#DDF2FB'; x.fillRect(0, 0, 256, 256); x.strokeStyle = '#7FA9C2'; x.lineWidth = 2; for (let i = 0; i < 22; i++) { x.beginPath(); let px = rnd() * 256, py = rnd() * 256; x.moveTo(px, py); for (let k = 0; k < 4; k++) { px += rr(-40, 40); py += rr(-40, 40); x.lineTo(px, py); } x.stroke(); } const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
      const im = toon(0xffffff, { map: t, emissive: 0x3E6E88, emissiveIntensity: 0.15 }); for (let i = 0; i < 26; i++) { const a = rnd() * 6.28, r = Math.sqrt(rnd()) * 4.6, x0 = -7.8 + Math.cos(a) * r * 1.3, z0 = -8.2 + Math.sin(a) * r; const g = new THREE.CylinderGeometry(rr(0.7, 1.4), rr(0.8, 1.5), 0.18, 6); mesh(G, g, im, x0, 0.06, z0, { ry: rnd() * 6, rx: rr(-0.05, 0.05) }); } }
    await scatter(G, 'ship-wreck', [{ x: -1.6, z: -1.6, y: -2.6, ry: 0.9, rz: 0.15 }], { norm: 3.2 });
    // the gray shore far past the island (Episode 6), still in fog
    const gH = (x, z) => { const d = Math.hypot((x - 26.5) * 0.8, (z + 7) * 1.15); return Math.max(-6, Math.min(0.5, (4 - d) * 0.4)); };
    { const gg = new THREE.PlaneGeometry(14, 12, 40, 40); gg.rotateX(-Math.PI / 2); const p = gg.attributes.position; for (let i = 0; i < p.count; i++) { p.setX(i, p.getX(i) + 26.5); p.setZ(i, p.getZ(i) - 7); p.setY(i, gH(p.getX(i), p.getZ(i))); } gg.computeVertexNormals(); G.add(new THREE.Mesh(gg, toon(0x9AA39A))); }
    { const rmG = rockMat(0x8A8E92, 0.4); for (let i = 0; i < 10; i++) { const a = rnd() * 6.28, r = rr(1.5, 4.2), x = 26.5 + Math.cos(a) * r * 1.2, z = -7 + Math.sin(a) * r * 0.85; mesh(G, lumpy(rr(0.3, 0.7), 2, 0.25, 1.1), rmG, x, gH(x, z), z, { ry: rnd() * 6 }); } }
    await scatter(G, 'tree_dark', [{ x: 25, z: -8, s: 0.6 }, { x: 27.5, z: -6, s: 0.5 }, { x: 28.5, z: -8.5, s: 0.55 }], { gy: gH, style: (n, mn) => [toon(/wood|bark/i.test(mn) ? 0x6E6A66 : 0x7E8A84)] });
    const fogM = new THREE.SpriteMaterial({ map: cloudTex(), color: 0xF2F5F8, transparent: true, opacity: 0.85, depthWrite: false });
    for (let i = 0; i < 34; i++) { const s = new THREE.Sprite(fogM.clone()); s.position.set(rr(19, 40), rr(1.5, 3.5), rr(-16, 16)); s.scale.set(rr(6, 11), rr(3, 5), 1); G.add(s); const ph = rnd() * 6; onTick(t => { s.position.y += Math.sin(t * 0.4 + ph) * 0.003; }); }
    // the route: a dotted line through the stops; the long sweep where the wave throws them past the island
    const RP = Object.keys(MAPSTOPS).map(Number).sort((a, b) => a - b).map(n => { const [x, z] = MAPSTOPS[n], y = n >= 2 && n <= 9 ? bedY(x, z) + 0.35 : n >= 13 && n <= 15 ? 0.4 : 0.6; return new THREE.Vector3(x, y, z); });
    // add a wide arc between 15 and 16 (north of the island) so the route never crosses itself
    const pts = []; RP.forEach((p, i) => { pts.push(p); if (i === 14) { pts.push(new THREE.Vector3(-6, 0.6, -15), new THREE.Vector3(6, 0.6, -14.5), new THREE.Vector3(17, 0.6, -10)); } });
    const rc = new THREE.CatmullRomCurve3(pts, false, 'centripetal'), NN = 420, idxOf = n => pts.indexOf(RP[n - 1]);
    for (let i = 0; i < NN; i += 2) { const a = rc.getPoint(i / NN), b = rc.getPoint((i + 1) / NN), seg = i / NN * (pts.length - 1), done = seg < idxOf(15), wave = seg > idxOf(15) && seg < idxOf(16);
      const m = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, a.distanceTo(b), 6), new THREE.MeshBasicMaterial({ color: wave ? 0xE8575A : done ? 0xFFC94A : 0xFFFFFF, transparent: !done, opacity: done || wave ? 1 : 0.55 }));
      m.position.copy(a).lerp(b, 0.5); m.lookAt(b); m.rotateX(Math.PI / 2); G.add(m); }
    // wave marks along the push
    for (let i = 0; i < 4; i++) { const p = rc.getPoint((idxOf(15) + 0.5 + i * 0.7) / (pts.length - 1)); const t = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.09, 6, 16, Math.PI), new THREE.MeshBasicMaterial({ color: 0xFFFFFF })); t.position.set(p.x, 0.2, p.z + 0.6); G.add(t); }
    // stop markers: a post with a numbered disc; underground stops glow under the water; locked stops are grey
    const disc = n => { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'); x.beginPath(); x.arc(64, 64, 58, 0, 7); x.fillStyle = n <= 14 ? '#FFC94A' : n === 15 ? '#EF5B4C' : '#C9CDD6'; x.fill(); x.lineWidth = 7; x.strokeStyle = '#2E2A4F'; x.stroke(); x.fillStyle = n <= 15 ? '#fff' : '#5A5E6A'; x.font = '72px Chewy, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineWidth = 6; x.strokeStyle = '#2E2A4F'; x.strokeText(n, 64, 68); x.fillText(n, 64, 68); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; };
    Object.entries(MAPSTOPS).forEach(([n, [x, z]]) => { n = +n; const under = n >= 2 && n <= 9, y = under ? bedY(x, z) + 0.3 : n === 10 ? iH(x, z) : n >= 16 ? 0.4 : n === 1 ? mH(x, z) : 0.2;
      const g = new THREE.Group(); g.position.set(x, y, z); G.add(g); const b = builder(g); const ph = under ? 1.2 - y + 1.6 : 1.8; b.cyl(0.05, 0.05, ph, under ? 0x9FF2FF : 0xFFFDF4, 0, ph / 2, 0, { line: 0.012 });
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: disc(n), depthTest: true })); sp.scale.setScalar(1.25); sp.position.y = under ? ph + 0.45 : 2.3; g.add(sp);
      if (under) { const gl = glowSprite(0x7FE9FF, 1.8, 0.7); g.add(gl); } if (n === 15) { const gem = b.add(new THREE.OctahedronGeometry(0.25), toon(0x5AD1FF, { emissive: 0x2AA8E8, emissiveIntensity: 0.6 }), 0, 3.3, 0, { line: 0.02 }); onTick(t => { gem.rotation.y = t * 2; gem.position.y = 3.3 + Math.sin(t * 3) * 0.12; }); } });
    clouds(G, 10, 12, 16, -10);
    return [['Hometown', [-22, 14, 10], [-28, 0, -8]], ['Meadow & cave hill', [-14, 8, 18], [-17, 0, 10]], ['Tunnel under the sea', [-6, 9, 16], [-8, -2, 7]], ['The island', [8, 9, 12], [3, 0, 3]], ['Frozen sea, near home', [-4, 10, 2], [-8, 0, -8]], ['The wave throws them far away', [8, 26, 8], [12, 0, -8]], ['Gray shore (Episode 6)', [20, 10, 4], [26, 0, -6]]];
  },
  props: [['Route', 'code', 'meadow → under the sea → the island → back towards home → frozen sea near home → the wave throws them far past the island'], ['Underground stops', 'code', 'glow under the clear water along the tunnel; Leo\'s side passage branches off'], ['Mainland, hometown, lighthouse, harbour', 'code + Kenney boats and trees'],
    ['Ferris wheel', 'code'], ['Cave hill', 'code + ambientCG Rock020'], ['The island', 'code + Kenney palms'], ['Frozen sea', 'code'], ['Sunken ship', 'Kenney Pirate Kit'], ['Gray shore in the fog', 'code + Kenney trees']] };

// ======== 1. Meadow and cave mouth (stop 1; the green top of the lost island in stop 10 uses the same grass, trees and flowers)
SETS.meadow = { name: 'Meadow & cave mouth', stops: [1, 10], light: { sky: 0x7EC8F2, fog: [0xD3EEFA, 40, 120], ambientI: 1.45, sunI: 1.8, sunPos: [16, 22, 12] }, cam: [[0, 6.5, 22], [0, 2, 0]],
  build: async G => {
    const hf = (x, z) => nz(x, z, 0.12) * 0.35 + nz(x, z, 0.3) * 0.08 - Math.max(0, 1 - Math.hypot(x + 7, z - 4) / 4.2) * 1.1;
    ground(G, 80, 120, hf, (x, z, c) => { const n = nz(x, z, 0.2), m = nz(x + 40, z - 20, 0.5); c.setHSL(0.26 + n * 0.02 + (m > 0.9 ? 0.04 : 0), 0.52, 0.47 + m * 0.035); });
    // pond
    const pond = new THREE.CircleGeometry(3.3, 40); pond.rotateX(-Math.PI / 2); const pw = water(G, pond, { deep: 0x3FA0C8, shallow: 0x8FE0EC, foamFn: 'smoothstep(2.9, 3.3, length(vW.xz - vec2(-7.0, 4.0)))' }); pw.position.set(-7, -0.02, 4);
    await scatter(G, 'rock_small', Array.from({ length: 12 }, (_, i) => { const a = i / 12 * 6.28; return { x: -7 + Math.cos(a) * 3.5, z: 4 + Math.sin(a) * 3.4, s: rr(0.5, 1.0), gy: hf, dy: -0.1 }; }), { gy: hf });
    // the hill with the cave mouth: the hill has a real arched hole cut into it, a rock-lined tunnel behind it that fades into the dark
    const R = 2.4, MZ = -3.2, TL = 9;
    { const hg = new THREE.SphereGeometry(9, 96, 48, 0, Math.PI * 2, 0, Math.PI / 2), p = hg.attributes.position, v = new THREE.Vector3(); for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const k = 1 + nz(v.x, v.z + v.y, 0.45) * 0.08 + nz(v.x * 2, v.y * 2, 0.9) * 0.035; p.setXYZ(i, v.x * k, v.y * k, v.z * k); } hg.computeVertexNormals();
      const hm = rockMat(0xA9A3A0, 0.22); hm.side = THREE.DoubleSide; const old = hm.onBeforeCompile; hm.onBeforeCompile = sh => { old(sh); sh.fragmentShader = sh.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\n float grassy = smoothstep(0.55, 0.8, vRN.y + sin(vRW.x * 1.7) * 0.08 + sin(vRW.z * 2.3) * 0.06); diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.42, 0.72, 0.33), grassy);')
        .replace('void main() {', 'void main() {\n if (length(vec2(vRW.x, vRW.y + 0.1)) < ' + (R - 0.05).toFixed(2) + ' && vRW.z > ' + (MZ - TL).toFixed(1) + ') discard;'); };
      const hill = new THREE.Mesh(hg, hm); hill.scale.set(1.25, 0.75, 1); hill.position.set(0, -1.2, -11.6); hill.castShadow = hill.receiveShadow = true; G.add(hill); }
    { // tunnel walls (top half of a tube) and floor, getting darker the deeper they go; a black end
      const pos = [], idx = [], NA = 28, NZ = 18; for (let j = 0; j <= NZ; j++) for (let i = 0; i <= NA; i++) { const a = Math.PI * i / NA, z = MZ + 0.4 - (TL + 0.4) * j / NZ, w = 1 + nz(i, j, 0.9) * 0.06; pos.push(Math.cos(a) * R * w, Math.sin(a) * R * w - 0.1, z); }
      for (let j = 0; j < NZ; j++) for (let i = 0; i < NA; i++) { const a = j * (NA + 1) + i, b = a + NA + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
      const tg = new THREE.BufferGeometry(); tg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); tg.setIndex(idx); tg.computeVertexNormals();
      const deep = m => { const o = m.onBeforeCompile; m.onBeforeCompile = sh => { o(sh); sh.fragmentShader = sh.fragmentShader.replace('#include <dithering_fragment>', '#include <dithering_fragment>\n gl_FragColor.rgb *= mix(0.04, 1.0, smoothstep(' + (MZ - TL + 1).toFixed(1) + ', ' + (MZ + 0.3).toFixed(1) + ', vRW.z));'); }; return m; };
      const tm = deep(rockMat(0x8E8A86, 0.4)); tm.side = THREE.DoubleSide; G.add(new THREE.Mesh(tg, tm));
      const fl = new THREE.PlaneGeometry(R * 2, TL + 0.4, 6, 12); fl.rotateX(-Math.PI / 2); const fm = deep(rockMat(0x8A7A66, 0.5)); const fmesh = new THREE.Mesh(fl, fm); fmesh.position.set(0, 0.02, MZ - TL / 2 + 0.2); fmesh.receiveShadow = true; G.add(fmesh);
      const end = new THREE.Mesh(new THREE.CircleGeometry(R + 0.1, 24, 0, Math.PI), new THREE.MeshBasicMaterial({ color: 0x05060C })); end.position.set(0, -0.1, MZ - TL + 0.05); G.add(end); }
    // a ring of boulders framing the opening, set into the hill face, and a big lintel stone on top
    const am = rockMat(0xB0ABA6, 0.35);
    for (let i = 0; i <= 10; i++) { const a = Math.PI * i / 10, r = R + 0.55; mesh(G, lumpy(rr(0.55, 0.8), 2, 0.25, 0.85), am, Math.cos(a) * r * 1.02, Math.sin(a) * r - 0.15, MZ + 0.15 + rr(-0.15, 0.15), { ry: rnd() * 6 }); }
    mesh(G, lumpy(1.0, 2, 0.2, 0.55), am, 0.1, R + 0.85, MZ - 0.1, { sc: [1.9, 0.75, 1.1] });
    [[-R - 1.4, MZ - 0.2], [R + 1.5, MZ - 0.4]].forEach(([x, z]) => mesh(G, lumpy(1.1, 2, 0.2, 1.8), am, x, 1.2, z, { ry: rnd() * 6 }));
    for (let i = 0; i < 9; i++) { const a = rnd() * Math.PI, r = rr(6, 10.5), x = Math.cos(a) * r * 1.2; if (Math.abs(x) < 4.5) continue; mesh(G, lumpy(rr(0.6, 1.2), 2, 0.25, 0.75), am, x, rr(0.2, 1.2), -11.6 + Math.sin(a) * r * 0.75 + 2, { ry: rnd() * 6 }); }
    for (let i = 0; i < 5; i++) crystalCluster(G, (i % 2 ? 1 : -1) * rr(1.1, 1.7), 0, MZ - 1.4 - i * 1.5, { n: 5, size: rr(0.35, 0.6), light: i % 2 === 0 });
    // woods, bushes, flowers, mushrooms, logs
    const free = (x, z) => Math.hypot(x, z - 6) > 6 && Math.hypot(x + 7, z - 4) > 4.2 && Math.hypot(x, (z + 10) * 1.3) > 11 && !(Math.abs(x) < 5 && z < 0 && z > -4);
    const sp = (rmin, rmax) => { for (let k = 0; k < 200; k++) { const a = rnd() * 6.28, r = rr(rmin, rmax), x = Math.cos(a) * r, z = Math.sin(a) * r + 2; if (free(x, z)) return [x, z]; } return null; };
    const trees = { tree_oak: [], tree_fat: [], tree_pine: [], tree_pine_tall: [], tree_autumn: [] }, tk = Object.keys(trees);
    for (let i = 0; i < 48; i++) { const s = sp(11, 34); if (s && !(s[1] > 8 && Math.abs(s[0]) < 14)) trees[tk[i % 5]].push({ x: s[0], z: s[1], s: rr(1.9, 3.2), sy: rr(0.9, 1.25) }); }
    for (const k in trees) await scatter(G, k, trees[k], { gy: hf });
    const bushes = []; for (let i = 0; i < 26; i++) { const s = sp(7, 26); if (s) bushes.push({ x: s[0], z: s[1], s: rr(0.9, 1.7) }); }
    await scatter(G, 'bush', bushes.filter((_, i) => i % 2), { gy: hf }); await scatter(G, 'bush_large', bushes.filter((_, i) => !(i % 2)), { gy: hf });
    const fl = []; for (let d = 0; d < 12; d++) { const s = sp(4, 20); if (!s) continue; const col = pick(PAL.bloom); for (let i = 0; i < 18; i++) { const a = rnd() * 6.28, r = Math.sqrt(rnd()) * 2.2, x = s[0] + Math.cos(a) * r, z = s[1] + Math.sin(a) * r; if (free(x, z)) fl.push({ x, z, s: rr(0.45, 0.8), col }); } }
    await scatter(G, 'flower_red', fl, { gy: hf, shadow: false });
    await scatter(G, 'mushroom_red', Array.from({ length: 14 }, () => { const s = sp(6, 22) || [9, 9]; return { x: s[0], z: s[1], s: rr(0.5, 1.1) }; }), { gy: hf, shadow: false });
    await scatter(G, 'log', [{ x: 8, z: 5, s: 1, ry: 0.4 }, { x: -11, z: 12, s: 0.9 }], { gy: hf, norm: 3 }); await scatter(G, 'stump', [{ x: 10, z: 10 }, { x: -12, z: -1 }], { gy: hf, norm: 1.3 });
    await scatter(G, 'rock_small', Array.from({ length: 20 }, () => { const s = sp(5, 26) || [6, 6]; return { x: s[0], z: s[1], s: rr(0.6, 1.5), dy: -0.1 }; }), { gy: hf });
    grass(G, small ? 9000 : 22000, () => { const a = rnd() * 6.28, r = Math.pow(rnd(), 0.7) * 30, x = Math.cos(a) * r, z = Math.sin(a) * r + 4; return free(x, z) || (Math.hypot(x, z - 6) > 3 && Math.hypot(x + 7, z - 4) > 3.6 && z > -1) ? [x, z] : null; }, hf);
    pawPrints(G, new THREE.Vector3(1.5, 0, 8), new THREE.Vector3(0.4, 0, -0.5), 12, hf); pawPrints(G, new THREE.Vector3(-1.5, 0, 8), new THREE.Vector3(-5.5, 0, 6), 8, hf);
    // the Ferris wheel on the far hill, and the sea
    ferris(G, -24, hf(-24, -30) - 0.2, -30, 0.45);
    const sea = new THREE.PlaneGeometry(400, 120); sea.rotateX(-Math.PI / 2); water(G, sea, { deep: 0x3FA7D6, shallow: 0x7FD0EA }).position.set(0, -0.6, -100);
    const kids = makeLabKids(G); [['leo', -1.2, 7, 0.2], ['mia', 1.2, 7.3, -0.2], ['toby', 0.2, 5.6, 0]].forEach(([n, x, z, ry]) => { const c = kids[n]; c.g.position.set(x, hf(x, z), z); c.g.rotation.y = Math.PI + ry; });
    clouds(G, 10, 22, 34, -50);
    return [['Swaying grass', [0, 1.5, 12], [0, 0.4, 7]], ['Cave mouth', [0, 2.6, 7], [0, 1.4, -3.5]], ['Crystals inside', [0.4, 1.4, -1.5], [0, 0.8, -6.5]], ['Pond', [-4, 3, 10], [-7, 0, 4]], ['Woods', [10, 4, 14], [16, 2, 0]], ['Ferris wheel', [-12, 4, -6], [-24, 6, -30]], ['Paw prints', [1.5, 2, 10], [0.6, 0, 5]]];
  },
  props: [['Grass tufts', 'code', 'thousands of blades, swaying in the wind'], ['Trees (5 kinds)', 'Kenney Nature Kit', 'oak, round, pine, tall pine, autumn'], ['Bushes, flowers, mushrooms, logs, stumps', 'Kenney Nature Kit'], ['Rocks', 'Kenney Nature Kit', 'restyled stone colours'],
    ['Pond water', 'code', 'moving ripples, sparkles, foam at the edge'], ['Cave mouth', 'code + Kenney rocks', 'a real arch of rocks round a dark tunnel'], ['Crystals', 'code', 'glowing clusters that light the tunnel'], ['Ferris wheel', 'code', 'turning, with twinkling bulbs'], ['Paw prints', 'code']] };

// ======== 4b. The lost island: climbing the lookout hill, and spotting the secret tunnel home (stop 10)
SETS.island = { name: 'Island lookout', stops: [10], light: { sky: 0x8ED2F2, fog: [0xCDEBF7, 70, 210], ambientI: 1.5, sunI: 1.8, sunPos: [-18, 26, 14] }, cam: [[17, 10, 21], [-3, 3.5, -2]],
  build: async G => {
    const HC = [-3, -3], CAVE = [-9.2, 1.0];               // the hill's centre, the cave they came out of (at its foot, facing home)
    // the climbing path: a spiral ramp round the hill, from the cave to the top
    const PATH = []; for (let i = 0; i <= 160; i++) { const t = i / 160, a = Math.PI * 0.95 - t * Math.PI * 1.85, r = 7.3 - 5.9 * t; PATH.push([HC[0] + Math.cos(a) * r, HC[1] + Math.sin(a) * r, 0.75 + 7.85 * Math.pow(t, 0.95)]); }
    const shoreR = a => 15 + nz(Math.cos(a) * 9, Math.sin(a) * 9, 0.5) * 1.6 + Math.sin(a * 3 + 1) * 1.1;
    const hBase = (x, z) => { const a = Math.atan2(z, x), d = Math.hypot(x, z), sr = shoreR(a), land = 0.75 + nz(x, z, 0.3) * 0.12; return d < sr - 2 ? land : d < sr ? land - (d - sr + 2) / 2 * 1.2 : -0.45 - (d - sr) * 0.35; };
    const hHill = (x, z) => { const d = Math.hypot(x - HC[0], z - HC[1]) * (1 + nz(x, z, 0.6) * 0.08), k = 1 - Math.min(1, d / 7.6); if (k <= 0) return 0; const top = 8.6; let h = top * Math.pow(k, 0.7); const terr = top / 4; h = Math.floor(h / terr) * terr + terr * Math.pow((h % terr) / terr, 3); return d < 1.7 ? top + nz(x, z, 1.4) * 0.12 : h; };
    const hf = (x, z) => { let h = Math.max(hBase(x, z), hBase(x, z) + hHill(x, z)); let best = 9, ph = 0; for (let i = 0; i < PATH.length; i += 2) { const p = PATH[i], dd = Math.hypot(x - p[0], z - p[1]); if (dd < best) { best = dd; ph = p[2]; } }
      if (best < 1.25 && h > 0.5) { const k = sm(1 - (best - 0.7) / 0.55); h = h + (ph - h) * k; } return Math.max(-4, h); };
    function sm(v) { v = Math.max(0, Math.min(1, v)); return v * v * (3 - 2 * v); }
    const isl = ground(G, 46, 200, hf, (x, z, c) => { const h = hf(x, z); if (h < 0.55) c.setRGB(0.93, 0.83, 0.6); else c.setHSL(0.26 + nz(x, z, 0.5) * 0.02, 0.5, 0.47 + nz(x + 9, z, 0.9) * 0.04); }, rockMat(0xffffff, 0.22, { steep: true }));
    // the path's stepping stones, sandy and worn
    const stoneM = toon(0xD9C7A2); for (let i = 4; i < PATH.length; i += 5) { const p = PATH[i]; mesh(G, lumpy(0.32, 1, 0.15, 0.35), stoneM, p[0] + rr(-0.15, 0.15), hf(p[0], p[1]) + 0.04, p[1] + rr(-0.15, 0.15), { ry: rnd() * 6, ink: false }); }
    // boulders round the hill so its outline is rocky, not smooth
    const bm = rockMat(0xA59C92, 0.35); for (let i = 0; i < 46; i++) { const a = rnd() * 6.28, r = i < 16 ? rr(2.2, 3.6) : rr(3.2, 7.6), x = HC[0] + Math.cos(a) * r, z = HC[1] + Math.sin(a) * r; let near = 9; for (const p of PATH) near = Math.min(near, Math.hypot(x - p[0], z - p[1])); if (near < 1.5) continue; const big = i < 16 ? rr(0.6, 1.15) : rr(0.6, 1.4); mesh(G, lumpy(big, 2, 0.28, i < 16 ? 1.3 : 0.9), bm, x, hf(x, z) + big * 0.3, z, { ry: rnd() * 6 }); }
    // the cave at the hill's foot, facing home (west)
    { const g = new THREE.Group(); g.position.set(CAVE[0], hf(CAVE[0], CAVE[1]) - 0.05, CAVE[1]); g.rotation.y = -Math.PI / 2 + 0.35; G.add(g);
      const hole = new THREE.Mesh(new THREE.CircleGeometry(1.25, 24, 0, Math.PI), new THREE.MeshBasicMaterial({ color: 0x07080F })); hole.position.z = 0.05; g.add(hole);
      for (let i = 0; i <= 8; i++) { const a = Math.PI * i / 8; mesh(g, lumpy(rr(0.35, 0.55), 2, 0.25, 0.85), bm, Math.cos(a) * 1.55, Math.sin(a) * 1.5, 0.1, { ry: rnd() * 6 }); } }
    // trees, palms and bushes on the island, flowers and grass
    const onLand = (x, z) => hf(x, z) > 0.6 && hf(x, z) < 1.3 && Math.hypot(x - HC[0], z - HC[1]) > 8.2;
    const spot = () => { for (let k = 0; k < 300; k++) { const x = rr(-15, 15), z = rr(-15, 15); if (onLand(x, z)) return [x, z]; } return null; };
    const T = { tree_oak: [], tree_fat: [], tree_pine: [], 'palm-detailed-long': [], 'palm-detailed-short': [] }; Object.keys(T).forEach((k, j) => { for (let i = 0; i < 4; i++) { const s = spot(); if (s && !(s[0] > -2 && s[1] > -2) && !(s[0] < -6 && Math.abs(s[1]) < 7)) T[k].push({ x: s[0], z: s[1], s: k.startsWith('palm') ? 1 : rr(1.4, 2.2) }); } });
    for (const k in T) await scatter(G, k, T[k], { gy: hf, norm: k.startsWith('palm') ? rr(3.8, 4.8) : 0 });
    await scatter(G, 'bush_large', Array.from({ length: 14 }, () => { const s = spot() || [10, 10]; return { x: s[0], z: s[1], s: rr(0.8, 1.4) }; }), { gy: hf });
    // bushes up on the terraces of the hill too
    await scatter(G, 'bush', Array.from({ length: 12 }, () => { const a = rnd() * 6.28, r = rr(2.4, 6), x = HC[0] + Math.cos(a) * r, z = HC[1] + Math.sin(a) * r; return { x, z, s: rr(0.6, 1.0) }; }), { gy: hf });
    grass(G, small ? 6000 : 14000, () => { const x = rr(-16, 16), z = rr(-16, 16); const h = hf(x, z); if (h < 0.62) return null; const sl = Math.abs(hf(x + 0.3, z) - hf(x - 0.3, z)) + Math.abs(hf(x, z + 0.3) - hf(x, z - 0.3)); return sl < 0.25 ? [x, z] : null; }, hf);
    // sea (clear, so the seabed and the tunnel show through), seabed
    const bed = new THREE.PlaneGeometry(400, 400, 80, 80); bed.rotateX(-Math.PI / 2); { const p = bed.attributes.position, c = new Float32Array(p.count * 3), col = new THREE.Color(); for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i); p.setY(i, -4 + nz(x, z, 0.08) * 0.5); col.setHSL(0.12, 0.35, 0.55 + nz(x, z, 0.2) * 0.05); c.set([col.r, col.g, col.b], i * 3); } bed.setAttribute('color', new THREE.BufferAttribute(c, 3)); bed.computeVertexNormals(); }
    G.add(new THREE.Mesh(bed, toon(0xffffff, { vertexColors: true })));
    const sea = new THREE.PlaneGeometry(500, 500, 2, 2); sea.rotateX(-Math.PI / 2); water(G, sea, { deep: 0x2F9FD0, shallow: 0x8FE6EE, opacity: 0.55, foamFn: '1.0 - smoothstep(0.0, 0.8, abs(length(vW.xz) - 15.6 - sin(atan(vW.z, vW.x) * 3.0 + 1.0) * 1.1 - sin(uT) * 0.3))' }).position.y = -0.05;
    // the mainland far away: coast, hometown, Ferris wheel, lighthouse, and the hill with the meadow cave
    const MX = -95, coastX = z => MX + 6 * Math.sin(z * 0.05) + 3 * Math.sin(z * 0.13 + 1);
    const ml = new THREE.PlaneGeometry(200, 300, 60, 80); ml.rotateX(-Math.PI / 2); { const p = ml.attributes.position, c = new Float32Array(p.count * 3), col = new THREE.Color(); for (let i = 0; i < p.count; i++) { const x = p.getX(i) + MX - 100, z = p.getZ(i), d = coastX(z) - x; p.setX(i, x); p.setY(i, d < 0 ? -2 : Math.min(1.2, d * 0.25) + nz(x, z, 0.05) * (d > 10 ? 1.2 : 0)); d < 4 ? col.setRGB(0.92, 0.82, 0.6) : col.setHSL(0.27, 0.45, 0.48 + nz(x, z, 0.1) * 0.05); c.set([col.r, col.g, col.b], i * 3); } ml.setAttribute('color', new THREE.BufferAttribute(c, 3)); ml.computeVertexNormals(); }
    const mlm = new THREE.Mesh(ml, toon(0xffffff, { vertexColors: true })); mlm.receiveShadow = true; G.add(mlm);
    const homeZ = -6, rc = [0xEF5B4C, 0x4AA3DF, 0xFFC94A, 0xB57EDC, 0xF28C38]; for (let i = 0; i < 26; i++) { const z = homeZ + rr(-22, 22), x = coastX(z) - rr(5, 22); const b = builder(G), hh = rr(1.2, 2.4); b.rbox(2, hh, 2, 0xFFF4D6, x, 1.2 + hh / 2, z, { line: 0.04, ry: rr(-0.3, 0.3) }); b.cone(1.75, 1.3, pick(rc), x, 1.2 + hh + 0.6, z, { seg: 4, ry: Math.PI / 4, line: 0.04 }); }
    ferris(G, coastX(homeZ - 10) - 14, 1.2, homeZ - 10, 0.9);
    { const lz = homeZ + 14, lx = coastX(lz) - 1.5, b = builder(G); b.cyl(1, 1.4, 7, 0xFFFDF4, lx, 4.5, lz); [3, 5.6].forEach(y => b.cyl(1.12, 1.18, 0.8, 0xD93A35, lx, y, lz, { line: 0.03 })); b.cyl(0.9, 0.9, 1, 0xFFE58A, lx, 8.5, lz, { line: 0.03 }); b.cone(1.2, 1.2, 0xD93A35, lx, 9.6, lz); }
    const CH = [coastX(24) - 4, 24]; mesh(G, lumpy(7, 3, 0.18, 0.6), rockMat(0x9AA39A, 0.12), CH[0] - 4, 0.5, CH[1], { sc: [1.4, 1, 1] });
    { const h = new THREE.Mesh(new THREE.CircleGeometry(2, 20, 0, Math.PI), new THREE.MeshBasicMaterial({ color: 0x07080F })); h.position.set(CH[0] + 4.5, 1.1, CH[1]); h.rotation.y = Math.PI / 2; G.add(h); }
    await scatter(G, 'tree_oak', Array.from({ length: 30 }, () => { const z = rr(-60, 60), x = coastX(z) - rr(8, 50); return { x, z, s: rr(3, 5) }; }), { gy: () => 1.2 });
    // the secret tunnel: a dark stone tube buried just under the seabed, running from the island's cave to the meadow cave on the mainland.
    // Seen from the hill through the clear water: a dark line with pale stone edges and a faint light travelling along it.
    const TP = [[CAVE[0] - 0.5, 0.2, CAVE[1]], [CAVE[0] - 4, -2.6, CAVE[1] + 1], [-20, -3.9, 4], [-40, -3.9, 9], [-60, -3.9, 15], [-78, -3.9, 21], [CH[0] - 2, -2.5, CH[1]], [CH[0] + 4.5, 1.0, CH[1]]].map(a => new THREE.Vector3(...a));
    const tc = new THREE.CatmullRomCurve3(TP, false, 'centripetal');
    const band = (w, col, dy, op = 1) => { const pts = tc.getSpacedPoints(240), pos = [], idx = []; pts.forEach((p, i) => { const t = tc.getTangentAt(Math.min(1, i / 240)), nx = -t.z, nzz = t.x, l = Math.hypot(nx, nzz) || 1; [-1, 1].forEach(sd => pos.push(p.x + nx / l * w * sd, Math.max(p.y, -3.95) + dy, p.z + nzz / l * w * sd)); if (i < 240) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } });
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: col, transparent: op < 1, opacity: op, side: THREE.DoubleSide, depthWrite: op >= 1 })); G.add(m); return m; };
    band(1.6, 0xC9D7DE, 0.02); band(1.25, 0x0A1A2A, 0.05);
    { const pts = tc.getSpacedPoints(120), rib = new THREE.MeshBasicMaterial({ color: 0x9FB3BE }); pts.forEach((p, i) => { if (i % 2 || p.y > -1) return; const t = tc.getTangentAt(i / 120), m = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.06, 0.28), rib); m.position.set(p.x, -3.86, p.z); m.rotation.y = Math.atan2(t.x, t.z) + Math.PI / 2; G.add(m); }); }
    const glowLine = band(0.35, 0x7FE9FF, 0.08, 0.0); glowLine.material.blending = THREE.AdditiveBlending;
    const pulses = Array.from({ length: 8 }, (_, i) => { const s = glowSprite(0x9FF2FF, 2.2, 0.0); G.add(s); return { s, k: i / 8 }; });
    let reveal = 0; const showTunnel = on => { reveal = on ? 1 : 0; };
    onTick((t, dt) => { const r = glowLine.material.opacity + ((reveal ? 0.55 : 0.18) - glowLine.material.opacity) * Math.min(1, (dt || 0.016) * 2); glowLine.material.opacity = r;
      pulses.forEach(p => { p.k = (p.k + (dt || 0.016) * 0.06) % 1; const q = tc.getPointAt(p.k); p.s.position.set(q.x, Math.max(q.y, -3.95) + 0.3, q.z); p.s.material.opacity = (reveal ? 0.9 : 0.35) * Math.sin(p.k * Math.PI); }); });
    // the kids, at the cave at first
    const kids = makeLabKids(G), K = [kids.leo, kids.mia, kids.toby], START = [[-7.8, 2.9], [-7.4, 1.9], [-7.0, 2.6]];
    const place0 = () => K.forEach((c, i) => { const [x, z] = START[i]; c.g.position.set(x, hf(x, z), z); c.g.rotation.y = Math.PI / 2 + 0.3; c.pose('idle'); }); place0();
    // the climb: they walk up the spiral path (Toby runs ahead), reach the top, turn to face home, and the tunnel lights up
    let climbing = null;
    const climb = () => { if (climbing) return; place0(); showTunnel(false); fly = null; climbing = { t: 0 }; K.forEach(c => c.pose(c === kids.toby ? 'run' : 'walk')); };
    const along = u => { u = Math.max(0, Math.min(1, u)); const f = u * (PATH.length - 1), i = Math.floor(f), j = Math.min(PATH.length - 1, i + 1), k = f - i, a = PATH[i], b = PATH[j]; return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]; };
    onTick((t, dt) => { if (!climbing) return; const C = climbing; C.t += (dt || 0.016); const D = 15, u0 = C.t / D;
      const lag = [0.04, 0, -0.04];
      K.forEach((c, i) => { const u = Math.min(1, u0 + lag[i] + (u0 > 0.98 ? 0 : 0)), [x, z] = u <= 0 ? START[i] : along(u), [nx, nzz] = along(Math.min(1, u + 0.01));
        const end = u >= 1, side = [-0.55, 0.55, 0][i]; c.g.position.set(end ? HC[0] - 0.4 : x, hf(x, z) + 0.02, end ? HC[1] + side : z); if (!end) c.g.rotation.y = Math.atan2(nx - x, nzz - z); });
      // camera: following behind and above them, then over their shoulders looking out to sea
      const lead = along(Math.min(1, u0)); if (u0 < 1) { const back = along(Math.max(0, u0 - 0.12)); camera.position.lerp(new THREE.Vector3(back[0] + (back[0] - HC[0]) * 0.9, hf(back[0], back[1]) + 4.5, back[1] + (back[1] - HC[1]) * 0.9), 0.04); ctl.target.lerp(new THREE.Vector3(lead[0], hf(lead[0], lead[1]) + 1, lead[1]), 0.08); }
      if (u0 >= 1.04 && !C.top) { C.top = true; K.forEach(c => { c.g.rotation.y = -Math.PI / 2 + 0.25; c.pose(c === kids.toby ? 'sit' : 'point'); }); kids.mia.pose('wow');
        flyTo([HC[0] + 4.5, 11.6, HC[1] + 1.2], [-40, -2, 8]); setTimeout(() => { showTunnel(true); flyTo([HC[0] + 3.2, 13.5, HC[1] + 0.5], [-24, -4, 5]); }, 3200); setTimeout(() => flyTo([HC[0] + 3.4, 12.2, HC[1] + 1], [-90, 2, 2]), 8000); setTimeout(() => { climbing = null; }, 9000); } });
    clouds(G, 12, 24, 40, -60);
    return [['▶ Play the climb', null, null, climb], ['The lookout hill', [12, 9, 13], [-3, 4, -3]], ['Path up the hill', [4, 5, 8], [-4, 2.5, 1]], ['The cave they came out of', [-3, 2.5, 6], [-8.6, 1, 1.2]], ['View from the top', [HC[0] + 3.4, 12.2, HC[1] + 1], [-90, 2, 2]], ['The secret tunnel', [HC[0] + 2.5, 11.5, HC[1] + 0.5], [-24, -4, 5], () => { showTunnel(true); flyTo([HC[0] + 3.2, 13.5, HC[1] + 0.5], [-24, -4, 5]); }], ['Hometown', [-60, 12, 0], [-100, 4, -6]]];
  },
  props: [['Island and lookout hill', 'code + ambientCG Rock020', 'grassy terraces, rocky steep sides, a path that spirals to the top'], ['Path stones, boulders', 'code'], ['The cave', 'code'], ['Trees, palms, bushes', 'Kenney Nature + Pirate Kits'], ['Grass', 'code'],
    ['Clear sea and seabed', 'code', 'see-through so the tunnel shows'], ['The secret tunnel', 'code', 'a dark stone line from the island cave all the way to the meadow cave, with light running along it'], ['Hometown, Ferris wheel, lighthouse', 'code + Kenney trees']] };

// ======== 2. Mine tunnels (stops 2, 3, 4, 7, 8)
SETS.mine = { name: 'Mine tunnels', stops: [2, 3, 4, 7, 8], light: { sky: 0x0B1020, fog: [0x0B1020, 12, 40], ambient: 0x8F9FD8, ambientI: 1.0, sunI: 0.35, sunPos: [4, 14, 6] }, cam: [[3.2, 3.4, 14], [0, 1.3, -2]],
  build: async G => {
    const hf = (x, z) => nz(x, z, 0.5) * 0.08;
    ground(G, 60, 80, hf, (x, z, c) => { const n = nz(x, z, 0.6); c.setHSL(0.07, 0.18, 0.2 + n * 0.03); }, rockMat(0x8C7A66, 0.25)).geometry;
    // the tunnel: a lumpy rock tube with a rock texture, open towards the camera
    const tube = new THREE.CylinderGeometry(4.2, 4.2, 30, 36, 30, true, Math.PI * 0.5, Math.PI); tube.rotateX(Math.PI / 2); { const p = tube.attributes.position, v = new THREE.Vector3(); for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const k = 1 + nz(v.x * 2, v.z, 0.6) * 0.12 + nz(v.y * 3, v.z * 2, 0.9) * 0.05; p.setXYZ(i, v.x * k * 1.05, Math.max(-0.3, v.y * k * 0.9), v.z); } tube.computeVertexNormals(); }
    const tm = new THREE.Mesh(tube, rockMat(0x9A8B7A, 0.3)); tm.material.side = THREE.BackSide; tm.position.set(0, 0, -6); tm.receiveShadow = true; G.add(tm);
    // stalactites and stalagmites
    const rm = rockMat(0xA89A88, 0.6); for (let i = 0; i < 30; i++) { const x = rr(-3.2, 3.2), z = rr(-19, 3), h = rr(0.5, 1.6), up = i % 3 === 0; if (up && Math.abs(x) < 1.5) continue; const g = new THREE.ConeGeometry(rr(0.12, 0.28), h, 7, 3); const p = g.attributes.position; for (let k = 0; k < p.count; k++) p.setX(k, p.getX(k) + Math.sin(p.getY(k) * 5) * 0.03); g.computeVertexNormals();
      const m = mesh(G, g, rm, x, up ? h / 2 : Math.sqrt(Math.max(0, 16 - x * x)) * 0.92 - h / 2 - 0.1, z, { rx: up ? 0 : Math.PI }); }
    // track, sleepers and the cart
    const curve = new THREE.CatmullRomCurve3([[0.4, 0, 8], [0, 0, 2], [-0.6, 0, -4], [0.6, 0, -12], [0, 0, -20]].map(a => new THREE.Vector3(...a)));
    rails(G, curve, 48); mineCart(G, 0.05, 0.2, 1.5, Math.PI / 2 + 0.05);
    // timber supports, lanterns, signs at the fork, the glowing stone on its rock, fallen rocks
    [-1, -7, -13].forEach((z, i) => { const b = builder(G); [-1, 1].forEach(sd => b.rbox(0.32, 3.4, 0.32, WOOD2, sd * 2.4, 1.7, z, { line: 0.02 })); b.rbox(5.4, 0.36, 0.4, WOOD, 0, 3.45, z, { line: 0.02 }); [-1, 1].forEach(sd => { const br = b.rbox(0.18, 1.3, 0.18, WOOD, sd * 1.9, 2.95, z, { line: 0.015 }); br.rotation.z = sd * 0.75; }); lantern(G, i % 2 ? -1.7 : 1.7, 2.55, z + 0.25); });
    sign(G, 'LEFT', -1.4, 0, -9, 0.5); sign(G, 'RIGHT', 1.6, 0, -9.4, -0.5);
    const rock = mesh(G, lumpy(0.8), rockMat(0x8E8478, 0.5), -2.5, 0.4, 4.5); crystalCluster(G, -2.5, 0.9, 4.5, { n: 1, size: 0.55, cols: [0x7FE9FF] });
    await scatter(G, 'rock_small', Array.from({ length: 14 }, () => ({ x: rr(-3, 3) * (rnd() < 0.5 ? 1 : 0.9), z: rr(-16, 7), s: rr(0.4, 1), dy: -0.05 })).filter(r => Math.abs(r.x) > 1.3), { gy: hf });
    // dust in the lantern light
    motes(G, 120, [-3, 0.5, -16], [3, 3.5, 7], 0xFFE2B0, 0.05);
    const kids = makeLabKids(G); kids.leo.g.position.set(1.6, 0, 4.5); kids.leo.g.rotation.y = Math.PI - 0.6; kids.mia.g.position.set(-1.2, 0, 3.4); kids.mia.g.rotation.y = 2.6; kids.toby.g.position.set(-0.6, 0, 5.2); kids.toby.g.rotation.y = 3.4;
    return [['Mine cart', [2.6, 1.8, 4.2], [0, 0.8, 1.5]], ['Track and sleepers', [1.5, 1.2, 6], [0, 0, 0]], ['Lantern', [2.4, 3, 0.6], [1.7, 2.6, -0.8]], ['Timber supports', [0, 2, 3], [0, 2.4, -7]], ['Signs at the fork', [0, 1.8, -5.5], [0, 1.4, -9.2]], ['Glowing stone', [-0.8, 1.5, 6.4], [-2.5, 0.9, 4.5]], ['Rock walls', [0, 1.6, 8], [0, 2.4, -12]]];
  },
  props: [['Rock walls, floor', 'code + ambientCG Rock020 texture', 'real rock grain, still in toon bands'], ['Stalactites, stalagmites', 'code'], ['Mine cart', 'code', 'planks, iron bands, spoked wheels'], ['Rails and sleepers', 'code', 'follow any path'],
    ['Timber supports', 'code'], ['Lanterns', 'code', 'warm flickering light and glow'], ['Signs', 'code', 'painted wood with any word'], ['Glowing stone', 'code'], ['Loose rocks', 'Kenney Nature Kit'], ['Dust in the light', 'code']] };

// ======== 3. Crystal cavern and river (stops 5, 6, 9)
SETS.crystal = { name: 'Crystal cavern & river', stops: [5, 6, 9], light: { sky: 0x071822, fog: [0x0A2230, 14, 46], ambient: 0x7FE9FF, ambientI: 0.5, sunI: 0.3, sunPos: [-6, 14, 4] }, cam: [[7, 5, 13], [0, 1.5, -2]],
  build: async G => {
    const hf = (x, z) => { const d = Math.abs(x - Math.sin(z * 0.18) * 2); return d < 2.2 ? -0.6 * Math.cos(d / 2.2 * Math.PI / 2) - 0.05 : nz(x, z, 0.4) * 0.15 + Math.max(0, d - 6) * 0.25; };
    ground(G, 60, 140, hf, (x, z, c) => { const n = nz(x, z, 0.5); c.setHSL(0.55, 0.15, 0.22 + n * 0.03); }, rockMat(0x6E7E88, 0.28));
    const dome = new THREE.SphereGeometry(18, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2); { const p = dome.attributes.position, v = new THREE.Vector3(); for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const k = 1 + nz(v.x, v.z, 0.3) * 0.07 + nz(v.y * 2, v.x, 0.6) * 0.04; p.setXYZ(i, v.x * k, v.y * k * 0.55, v.z * k); } dome.computeVertexNormals(); }
    const dm = new THREE.Mesh(dome, rockMat(0x5A6B78, 0.15)); dm.material.side = THREE.BackSide; dm.position.z = -4; G.add(dm);
    // the river, flowing past, with foam streaks
    const riv = new THREE.PlaneGeometry(5, 50, 20, 80); riv.rotateX(-Math.PI / 2); { const p = riv.attributes.position; for (let i = 0; i < p.count; i++) p.setX(i, p.getX(i) + Math.sin(p.getZ(i) * 0.18) * 2); }
    water(G, riv, { deep: 0x1D6F8E, shallow: 0x46C7D6, flow: [0, 1.6], foamFn: 'smoothstep(1.7, 2.4, abs(vW.x - sin(vW.z * 0.18) * 2.0))', speed: 1.2 }).position.y = -0.3;
    // the waterfall pouring off a ledge at the back
    const fall = new THREE.PlaneGeometry(3.2, 6, 10, 20); const fw = water(G, fall, { deep: 0x3FB6D2, shallow: 0xCFF6FF, flow: [0, -2.5], opacity: 0.88, speed: 1.6 }); fw.position.set(Math.sin(-20 * 0.18) * 2, 2.7, -18.4);
    mesh(G, lumpy(3, 3, 0.18, 0.5), rockMat(0x6A7A86, 0.3), -4, 5.8, -19.5, { sc: [1.6, 0.8, 1] }); mesh(G, lumpy(3, 3, 0.18, 0.5), rockMat(0x6A7A86, 0.3), 3.5, 5.8, -19.5, { sc: [1.4, 0.8, 1] });
    const sp = glowSprite(0xCFF6FF, 7, 0.25); sp.position.set(fw.position.x, 0.5, -17); G.add(sp);
    // crystals in every colour: clusters on the floor, on the walls, hanging from the roof
    const RB = PAL.rainbow;
    [[-5, -3], [5.5, -6], [-6.5, 4], [6, 3.5], [-3.5, -11], [4.5, -13], [8, -1], [-8.5, -6], [7.5, 8], [-7, 9.5]].forEach(([x, z], i) => crystalCluster(G, x, hf(x, z) - 0.1, z, { n: 8, size: rr(0.7, 1.4), cols: i % 3 ? RB : PAL.crys, light: i < 7 }));
    for (let i = 0; i < 12; i++) { const a = Math.PI + rnd() * Math.PI, r = rr(8, 14), cc = crystalCluster(G, Math.cos(a) * r, rr(5, 8), Math.sin(a) * r - 4, { n: 5, size: rr(0.4, 0.8), cols: RB, light: false }); cc.rotation.z = Math.PI; }
    await scatter(G, 'crystal', Array.from({ length: 20 }, () => { const x = rr(-9, 9), z = rr(-15, 10); return Math.abs(x - Math.sin(z * 0.18) * 2) > 3 ? { x, z, s: rr(0.6, 1.2), pal: RB, rz: rr(-0.4, 0.4) } : null; }).filter(Boolean), { gy: hf, shadow: false });
    await scatter(G, 'rock_large', Array.from({ length: 12 }, () => { const z = rr(-16, 12), x = Math.sin(z * 0.18) * 2 + (rnd() < 0.5 ? -1 : 1) * rr(2.4, 3.2); return { x, z, s: rr(0.8, 1.6) }; }), { gy: hf, style: (n, mn) => [rockMat(0x7E8A94, 0.4)] });
    { const lg = new THREE.Group(); lg.position.set(Math.sin(3 * 0.18) * 2 + 0.3, -0.32, 3); lg.rotation.y = 1.3; G.add(lg); const b = builder(lg); b.cyl(0.32, 0.36, 3, 0x7A5132, 0, 0, 0, { rz: Math.PI / 2, line: 0.02, seg: 12 }); [-1, 1].forEach(sd => b.cyl(0.3, 0.3, 0.02, 0xE2C49A, sd * 1.51, 0, 0, { rz: Math.PI / 2, line: 0, seg: 12 })); b.cyl(0.08, 0.1, 0.5, 0x7A5132, 0.4, 0.3, 0.1, { rz: -0.5, line: 0.012 }); onTick(t => { lg.position.y = -0.32 + Math.sin(t * 1.5) * 0.04; lg.rotation.x = Math.sin(t) * 0.05; }); }
    [[2.2, 7], [-2.6, 9], [3.6, 10.5]].forEach(([x, z]) => crystalCluster(G, x, hf(x, z) - 0.1, z, { n: 6, size: rr(0.45, 0.7), cols: RB, light: false }));
    motes(G, 160, [-10, 0.5, -16], [10, 6, 10], 0xB9F6FF, 0.07);
    const kids = makeLabKids(G); kids.leo.g.position.set(-3.2, hf(-3.2, 6), 6); kids.leo.g.rotation.y = 2.6; kids.mia.g.position.set(-4.3, hf(-4.3, 5), 5); kids.mia.g.rotation.y = 2.4; kids.toby.g.position.set(-3.6, hf(-3.6, 7.4), 7.4); kids.toby.g.rotation.y = 2.8;
    return [['Crystal clusters', [-2, 2.2, 0.5], [-5, 1, -3]], ['Rainbow crystals', [3, 2, 0], [5.5, 1, -6]], ['River', [3, 3.5, 9], [1, -0.3, 2]], ['Waterfall', [2, 3, -10], [-0.7, 2.7, -18.4]], ['Floating log', [2.5, 1.5, 6], [0.9, -0.3, 3]], ['Roof crystals', [0, 2, 4], [0, 6, -8]]];
  },
  props: [['Crystal clusters', 'code', 'six-sided, see-through, glowing, light the cave around them'], ['Rainbow crystals', 'code + Quaternius crystals', 'pink, gold, green, blue, purple like the panels'], ['River', 'code', 'flowing water with foam streaks and white edges'],
    ['Waterfall', 'code'], ['Cavern walls', 'code + ambientCG Rock020'], ['Floating log', 'Kenney Nature Kit'], ['Sparkles in the air', 'code']] };

// ======== 4. Beach and island (Episode 2's beach, stops 10–11)
SETS.beach = { name: 'Beach & island', stops: [6, 10, 11], light: { sky: 0x86D4F5, fog: [0xD9F3FC, 40, 130], ambientI: 1.5, sunI: 1.9, sunPos: [-14, 22, 10] }, cam: [[2, 6, 20], [0, 1, 2]],
  build: async G => {
    const hf = (x, z) => { const d = z + nz(x, 0, 0.15) * 1.5; return Math.min(1.2, (6 - d) * 0.09) + nz(x, z, 0.35) * 0.06 + Math.max(0, -z - 10) * 0.25; };
    ground(G, 90, 140, hf, (x, z, c) => { const y = hf(x, z), wet = y < 0.25, rip = Math.sin(x * 2.4 + nz(x, z, 0.3) * 3) * 0.5 + 0.5; c.setHSL(0.11, wet ? 0.38 : 0.55, wet ? 0.62 : 0.76 + rip * 0.03); });
    const sea = new THREE.PlaneGeometry(200, 80, 60, 30); sea.rotateX(-Math.PI / 2); water(G, sea, { deep: 0x1E8FC2, shallow: 0x6FE0E8, foamFn: '1.0 - smoothstep(0.0, 1.1, abs(vW.z - 9.6 - sin(vW.x * 0.45 + uT * 1.2) * 0.7 - sin(uT * 0.9) * 0.6))' }).position.set(0, -0.3, 49);
    // cliff with the cave at the back, palms, rocks, driftwood
    { const cm = rockMat(0xD7B48A, 0.2), old = cm.onBeforeCompile; cm.onBeforeCompile = sh => { old(sh); sh.fragmentShader = sh.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\n diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.45, 0.74, 0.36), smoothstep(0.7, 0.85, vRN.y) * smoothstep(3.5, 5.0, vRW.y));'); };
      [[-9, 3, -17, 6, 1.1], [-1, 3.6, -19, 7, 1.0], [8, 2.6, -17, 5.5, 1.2], [-15, 2, -13, 4, 1], [14, 2, -13, 4.5, 1]].forEach(([x, y, z, r, sq]) => mesh(G, lumpy(r, 3, 0.16, 0.75 * sq), cm, x, y, z, { ry: rnd() * 6 })); }
    const cave = new THREE.Mesh(new THREE.CircleGeometry(2.1, 32, 0, Math.PI), new THREE.MeshBasicMaterial({ color: 0x0A0D20 })); cave.position.set(-3.5, hf(-3.5, -12.6) - 0.1, -12.6); G.add(cave);
    await scatter(G, 'formation-rock', [{ x: 7, z: -4, s: 1, ry: 0.4 }, { x: -9, z: -3, s: 0.8, ry: 2 }, { x: 11, z: 6, s: 0.6 }], { gy: hf, norm: 4.5, style: (n, mn, o) => [/sand/.test(mn) ? toon(0xE6CF96) : rockMat(0xC9A884, 0.4)] });
    await scatter(G, 'palm-detailed-long', [{ x: -6.5, z: 0, s: 1, ry: 0.3, rz: -0.12 }, { x: 8.5, z: 1, s: 1, ry: 2, rz: 0.1 }], { gy: hf, norm: 7.5 });
    await scatter(G, 'palm-detailed-short', [{ x: -9, z: 3.5, s: 1, ry: 1 }, { x: 4.5, z: -6, s: 1 }], { gy: hf, norm: 5 });
    await scatter(G, 'bush_large', [{ x: -8, z: -5, s: 1.4 }, { x: 10, z: -2, s: 1.2 }, { x: -11, z: 1, s: 1 }], { gy: hf });
    await scatter(G, 'log', [{ x: 3.2, z: 6.5, s: 1, ry: 1.1, rz: 0.1 }], { gy: hf, norm: 3, style: (n, mn) => [toon(/bark/i.test(mn) ? 0xB89C80 : 0xE6DCC8)] });
    await scatter(G, 'crab', [{ x: 1.5, z: 9, s: 1, ry: -0.5 }], { gy: hf, norm: 0.8 });
    const sc = [0xFFD8C8, 0xFFF1D6, 0xF6B8C8, 0xE9D4FF]; for (let i = 0; i < 14; i++) { const x = rr(-10, 10), z = rr(2, 11); shell(G, x, hf(x, z), z, pick(sc)); } [[-2, 10], [5, 8.5], [-5, 7.5]].forEach(([x, z]) => starfish(G, x, hf(x, z), z, pick([0xFF8A5C, 0xFFB14A])));
    // Toby's three dig mounds, the shovel, the flag, the tipped cart
    [[-5.5, 1.5], [6, -2.5], [0.5, 9.8]].forEach(([x, z]) => mesh(G, new THREE.SphereGeometry(0.9, 20, 10, 0, 6.28, 0, Math.PI / 2), toon(0xD9B878), x, hf(x, z) - 0.05, z, { sc: [1, 0.45, 1], ink: false }));
    flag(G, -1, hf(-1, -3), -3, { ry: 0.3 }); const cart = mineCart(G, 3.5, hf(3.5, -1), -1, 0.7, { tipped: 1.35 });
    await scatter(G, 'shovel', [{ x: -4.6, z: 2.2, y: hf(-4.6, 2.2) + 0.1, rx: 0.3, rz: 1.35, ry: 0.4 }], { gy: hf, norm: 1.6 });
    clouds(G, 8, 20, 30, -40);
    const kids = makeLabKids(G); [['leo', -1.4, 6], ['mia', 0.4, 5.6], ['toby', -5.2, 2.6]].forEach(([n, x, z]) => { kids[n].g.position.set(x, hf(x, z), z); kids[n].g.rotation.y = n === 'toby' ? 0.6 : Math.PI - 0.1; }); kids.toby.pose('dig');
    return [['Shoreline foam', [0, 2.5, 18], [0, 0, 12]], ['Palm trees', [-2, 4, 8], [-6.5, 3.5, 0]], ['Rocks & cliff', [3, 4, 4], [-2, 2, -12]], ['Shells & starfish', [0, 1.4, 12.5], [-1, 0, 9]], ['Crab', [2.4, 0.9, 10.8], [1.5, 0.2, 9]], ['Dig mounds & shovel', [-3, 2, 5.5], [-5, 0, 1.8]], ['Pirate flag', [1.5, 3, 1.5], [-1, 2.6, -3]], ['Tipped cart', [6, 2, 2.5], [3.5, 0.6, -1]]];
  },
  props: [['Sand', 'code', 'dry and wet sand, little ripples'], ['Sea', 'code', 'moving water with surf rolling up the beach'], ['Palm trees', 'Kenney Pirate Kit (pmndrs market)'], ['Rock formations', 'Kenney Pirate Kit', 'sandstone with rock texture'],
    ['Bushes, driftwood', 'Kenney Nature Kit'], ['Crab', 'Quaternius'], ['Shells, starfish', 'code'], ['Dig mounds', 'code'], ['Shovel', 'Kenney Pirate Kit'], ['Pirate flag', 'code', 'cloth that waves in the wind'], ['Mine cart (tipped)', 'code']] };

// ======== 5. Clear sea and the sunken ship (stop 12)
SETS.sea = { name: 'Clear sea & shipwreck', stops: [12], light: { sky: 0x8ED8F5, fog: [0xCFF1FA, 30, 110], ambientI: 1.6, sunI: 1.8, sunPos: [10, 24, 8] }, cam: [[6, 5, 15], [-1, -2, -1]],
  build: async G => {
    const hf = (x, z) => -4 + nz(x, z, 0.15) * 0.6 + nz(x, z, 0.5) * 0.15;
    ground(G, 90, 120, hf, (x, z, c) => { const n = nz(x, z, 0.3); c.setHSL(0.13, 0.45, 0.66 + n * 0.04); });
    // light ripples dancing on the seabed
    const caus = new THREE.PlaneGeometry(60, 60); caus.rotateX(-Math.PI / 2); const cu = { uT: { value: 0 } };
    const cm = new THREE.ShaderMaterial({ uniforms: cu, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, vertexShader: 'varying vec2 vP; void main(){ vP = position.xz; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: 'uniform float uT; varying vec2 vP; float c(vec2 p){ p *= 0.8; float v = 0.0; for (int i = 0; i < 3; i++) { p += vec2(sin(p.y * 1.3 + uT * 0.7), cos(p.x * 1.1 - uT * 0.6)) * 0.6; v += abs(sin(p.x + p.y)); } return v / 3.0; } void main(){ float k = smoothstep(0.88, 0.99, 1.0 - c(vP)); gl_FragColor = vec4(vec3(0.75, 0.95, 1.0) * k * 0.55 * (1.0 - smoothstep(18.0, 28.0, length(vP))), 1.0); }' });
    const cmesh = new THREE.Mesh(caus, cm); cmesh.position.y = -3.6; G.add(cmesh); onTick(t => { cu.uT.value = t; });
    await scatter(G, 'ship-wreck', [{ x: -2, z: -3, y: hf(-2, -3) - 0.4, ry: 0.6, rz: 0.12 }], { gy: hf, norm: 11 });
    await scatter(G, 'formation-large-stone', [{ x: 5, z: 2, ry: 0.4 }, { x: 7, z: -5 }, { x: -9, z: 4, ry: 2 }], { gy: hf, norm: 4, style: (n, mn) => [/sand/.test(mn) ? toon(0xE6CF96) : rockMat(0x8FA7B5, 0.4)] });
    await scatter(G, 'plant-pirate-kit', Array.from({ length: 26 }, () => ({ x: rr(-12, 12), z: rr(-10, 10), s: rr(0.8, 1.6) })), { gy: hf, norm: 0.9, style: () => [toon(pick([0x3FAE7A, 0x56C08A, 0x2E9C8A]))] });
    await scatter(G, 'barrel', [{ x: 1.8, z: 1.5, rz: 1.5, ry: 0.4 }, { x: -5.5, z: 2.5 }], { gy: hf, norm: 1.2 }); await scatter(G, 'chest', [{ x: 0.6, z: 3, ry: -0.5 }], { gy: hf, norm: 1.2 });
    const kp = sign(G, 'KEEP OUT', 4.2, hf(4.2, 3.5), 3.5, -0.4); kp.rotation.z = 0.12;
    // a school of fish circling the wreck
    const fishes = await scatter(G, 'fish', Array.from({ length: 14 }, (_, i) => ({ x: 0, z: 0, y: 0, s: 1 })), { norm: 0.7, shadow: false });
    if (fishes) { const sch = new THREE.Group(); G.add(sch); G.remove(fishes); sch.add(fishes); const ims = fishes.children; const ph = Array.from({ length: 14 }, (_, i) => [i / 14 * 6.28 + rnd() * 0.3, rr(4, 6.5), rr(-2.8, -1.4)]), M = new THREE.Matrix4(), Q = new THREE.Quaternion(), S = new THREE.Vector3(0.7, 0.7, 0.7);
      onTick(t => ph.forEach(([a0, r, y], i) => { const a = a0 + t * 0.35; Q.setFromEuler(new THREE.Euler(0, -a, 0)); const box = 1; M.compose(new THREE.Vector3(Math.cos(a) * r - 1, y + Math.sin(t * 2 + i) * 0.15, Math.sin(a) * r - 2), Q, S.set(box, box, box)); ims.forEach(im => { im.setMatrixAt(i, M); im.instanceMatrix.needsUpdate = true; }); })); }
    // the see-through surface, and the cart-boat floating on it
    const surf = new THREE.PlaneGeometry(200, 200, 60, 60); surf.rotateX(-Math.PI / 2); water(G, surf, { deep: 0x3AB7DA, shallow: 0x9FEAF2, opacity: 0.42 }).position.y = 0;
    const boat = new THREE.Group(); boat.position.set(3, 0, 6); boat.rotation.y = -0.6; G.add(boat); mineCart(boat, 0, -0.75, 0, 0); flag(boat, 0, 0.2, 0, { h: 3 });
    onTick(t => { boat.position.y = Math.sin(t * 1.3) * 0.08; boat.rotation.z = Math.sin(t * 0.9) * 0.05; });
    bubbles(G, 60, [-8, -4, -8], [8, 0, 8]);
    return [['Sunken ship', [4, 0.5, 4], [-2, -2.5, -3]], ['Seaweed & rocks', [6, -1.5, 6], [3, -3.6, 0]], ['KEEP OUT sign', [6, -1.6, 7], [4.2, -2.6, 3.5]], ['Fish', [0, -0.5, 8], [-1, -2, -2]], ['Light on the seabed', [0, 3, 10], [0, -3.6, 0]], ['Cart-boat', [7, 2, 11], [3, 0.5, 6]]];
  },
  props: [['Sunken ship', 'Kenney Pirate Kit (pmndrs market)'], ['Sea surface', 'code', 'see-through, so the seabed shows'], ['Light ripples on the seabed', 'code'], ['Seaweed', 'Kenney Pirate Kit'], ['Rocks', 'Kenney Pirate Kit'], ['Barrels, chest', 'Kenney Pirate Kit'],
    ['Fish', 'Quaternius', 'a school circling the wreck'], ['KEEP OUT sign', 'code'], ['Cart-boat with flag', 'code'], ['Bubbles', 'code']] };

// ======== 6. Frozen sea (stops 13–15)
SETS.ice = { name: 'Frozen sea', stops: [13, 14, 15], light: { sky: 0x9AB2C8, fog: [0xC9D6E2, 14, 70], ambient: 0xDDEBFF, ambientI: 1.3, sunI: 0.9, sunPos: [-8, 16, 6] }, cam: [[4, 4.5, 14], [0, 1, 0]],
  build: async G => {
    // cracked ice plates: a canvas of cells with dark cracks, tinted teal and lavender
    const c = document.createElement('canvas'); c.width = c.height = 1024; const x = c.getContext('2d'); const pts = Array.from({ length: 70 }, () => [rnd() * 1024, rnd() * 1024]);
    const img = x.createImageData(1024, 1024); for (let yy = 0; yy < 1024; yy += 2) for (let xx = 0; xx < 1024; xx += 2) { let d1 = 1e9, d2 = 1e9, k = 0; pts.forEach(([px, py], i) => { for (let ox = -1024; ox <= 1024; ox += 1024) for (let oy = -1024; oy <= 1024; oy += 1024) { const d = Math.hypot(xx - px - ox, yy - py - oy); if (d < d1) { d2 = d1; d1 = d; k = i; } else if (d < d2) d2 = d; } });
      const edge = d2 - d1, crack = edge < 3 ? 1 : edge < 8 ? 0.4 : 0, tint = (k * 37 % 10) / 10; const r = 200 + tint * 25 - crack * 110, g = 228 + tint * 8 - crack * 90, b = 240 - tint * 6 - crack * 50; for (const [a, bb] of [[0, 0], [1, 0], [0, 1], [1, 1]]) { const o = ((yy + bb) * 1024 + xx + a) * 4; img.data[o] = r; img.data[o + 1] = g; img.data[o + 2] = b; img.data[o + 3] = 255; } }
    x.putImageData(img, 0, 0); const it = new THREE.CanvasTexture(c); it.wrapS = it.wrapT = THREE.RepeatWrapping; it.repeat.set(4, 4); it.colorSpace = THREE.SRGBColorSpace;
    const iceM = toon(0xffffff, { map: it, emissive: 0x2E5A70, emissiveIntensity: 0.15 }); const ice = new THREE.PlaneGeometry(160, 160, 2, 2); ice.rotateX(-Math.PI / 2); const im = new THREE.Mesh(ice, iceM); im.receiveShadow = true; G.add(im);
    // the hole where Varn breaks out, with tilted slabs round it and dark water inside
    const hole = new THREE.CircleGeometry(3.4, 32); hole.rotateX(-Math.PI / 2); water(G, hole, { deep: 0x0E3346, shallow: 0x2B6E86 }).position.set(-1, 0.02, -6);
    const slab = new THREE.MeshPhysicalMaterial({ color: 0xCFEFFA, roughness: 0.15, transmission: 0.0, transparent: true, opacity: 0.85, emissive: 0x3A7E98, emissiveIntensity: 0.25 });
    for (let i = 0; i < 9; i++) { const a = i / 9 * 6.28 + rr(-0.2, 0.2); const g = new THREE.BoxGeometry(rr(1.6, 2.6), rr(0.25, 0.4), rr(1.2, 2)); const m = mesh(G, g, toon(0xE4F6FF, { emissive: 0x4E9AB8, emissiveIntensity: 0.2 }), -1 + Math.cos(a) * 3.9, 0.3, -6 + Math.sin(a) * 3.9, { ry: -a, rz: rr(0.25, 0.6) * (i % 2 ? 1 : -1), rx: rr(-0.2, 0.2) }); }
    // ice chunks lying about
    for (let i = 0; i < 18; i++) { const xx = rr(-12, 12), zz = rr(-14, 10); if (Math.hypot(xx + 1, zz + 6) < 5) continue; mesh(G, lumpy(rr(0.25, 0.7), 1, 0.25, 0.7), toon(0xE9F8FF, { emissive: 0x5AA8C8, emissiveIntensity: 0.18, flatShading: true }), xx, 0.15, zz, { ry: rnd() * 6 }); }
    // the boat stuck in the ice
    const boat = new THREE.Group(); boat.position.set(1.5, -0.35, 4); boat.rotation.y = 0.4; boat.rotation.z = 0.06; G.add(boat); mineCart(boat, 0, 0, 0, 0); flag(boat, 0, 0.9, 0, { h: 2.8 });
    // the hometown far off in the fog
    await scatter(G, 'ferris-wheel', [{ x: -26, z: -48, y: -0.5, ry: 0.4 }], { norm: 14, style: (n, mn, o) => [toon(0x8C98AC)] });
    await scatter(G, 'tower', [{ x: -14, z: -50, y: 0, ry: 0.2 }, { x: 12, z: -46, y: 0 }], { norm: 6, style: () => [toon(0x8C98AC)] });
    // low fog and falling snow
    const ct = cloudTex(); for (let i = 0; i < 22; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: ct, color: 0xE6EEF5, transparent: true, opacity: 0.4, depthWrite: false })); s.position.set(rr(-30, 30), rr(0.5, 2.5), rr(-40, 4)); s.scale.set(rr(10, 18), rr(3, 5), 1); G.add(s); const ph = rnd() * 6; onTick(t => { s.position.x += Math.sin(t * 0.2 + ph) * 0.004; }); }
    snow(G, 500);
    const glow = glowSprite(0x7FE9FF, 10, 0.4); glow.position.set(-1, 0.3, -6); G.add(glow); onTick(t => { glow.material.opacity = 0.3 + Math.sin(t * 1.3) * 0.12; });
    const kids = makeLabKids(G); [['leo', 1.0, 3.9], ['mia', 2.0, 4.3]].forEach(([n, xx, zz]) => { kids[n].g.position.set(xx, 0.25, zz); kids[n].g.rotation.y = Math.PI - 0.3; kids[n].pose('scared'); }); kids.toby.g.position.set(2.8, 0, 5.2); kids.toby.g.rotation.y = 3.4;
    return [['Cracked ice', [0, 3, 10], [0, 0, 2]], ['Broken ice and dark water', [3, 3, 1], [-1, 0, -6]], ['Ice chunks', [-4, 1.5, 4], [-6, 0.2, 0]], ['Boat stuck in the ice', [5, 2.5, 8], [1.5, 0.5, 4]], ['Town in the fog', [0, 3, 0], [-10, 5, -48]], ['Snow and fog', [0, 2, 12], [0, 2, 0]]];
  },
  props: [['Cracked ice', 'code', 'plates in teal and lavender with dark cracks, like the panels'], ['Broken slabs, dark water', 'code'], ['Ice chunks', 'code'], ['Ferris wheel in the fog', 'creativetrio (pmndrs market)'], ['Towers in the fog', 'Kenney (pmndrs market)'],
    ['Low fog, snow', 'code'], ['Boat stuck in the ice', 'code']] };

// ---------------------------------------------------------------- page: build a set, camera, side panel
let ctl = null, cur = null, building = false;
const ui = document.createElement('div'); ui.id = 'ui'; ui.innerHTML = '<div id="roster"></div><div id="side"><h2 id="nm"></h2><div id="stops"></div><p class="lead">Now in the game</p><div id="now"></div><p class="lead">Props in this set <small>(tap one to look at it)</small></p><div id="props"></div></div><div id="loading">Building…</div>';
document.body.append(ui); const $ = s => ui.querySelector(s);
const STOPNAMES = { 1: 'The Meadow', 2: 'The Glowing Stone', 3: 'The Dark Tunnel', 4: 'The Drop', 5: 'Crystal Loop', 6: 'The Swift River', 7: 'The Rock Shelf', 8: 'The Crack', 9: 'The Rainbow Cliff', 10: 'The Lost Island', 11: 'Toby’s Dig', 12: 'The Clear Sea', 13: 'Varn Rises', 14: 'Mia’s Choice', 15: 'The Angry Wave' };
let fly = null; const flyTo = (p, t) => { fly = { p0: camera.position.clone(), t0: ctl.target.clone(), p1: new THREE.Vector3(...p), t1: new THREE.Vector3(...t), k: 0 }; };
async function show(id) {
  if (building) return; building = true; $('#loading').style.display = 'block'; cur = id; const S = SETS[id]; setSeed(7 + Object.keys(SETS).indexOf(id) * 31);
  [...$('#roster').children].forEach(b => b.classList.toggle('on', b.dataset.id === id));
  const G = newWorld(Object.assign({ ambient: 0xffffff }, S.light)); renderer.shadowMap.enabled = true;
  setCam(...S.cam); if (ctl) ctl.dispose(); ctl = new OrbitControls(camera, renderer.domElement); ctl.enableDamping = true; ctl.maxPolarAngle = Math.PI * 0.49; ctl.minDistance = 0.8; ctl.maxDistance = 90; ctl.target.set(...S.cam[1]); ctl.update();
  renderer.domElement.addEventListener('pointerdown', () => { fly = null; });
  onTick((t, dt) => { if (fly) { fly.k = Math.min(1, fly.k + (dt || 0.016) / 1.6); const e = fly.k * fly.k * (3 - 2 * fly.k); camera.position.lerpVectors(fly.p0, fly.p1, e); ctl.target.lerpVectors(fly.t0, fly.t1, e); if (fly.k >= 1) fly = null; } ctl.update(); });
  let views = [];
  try { views = await S.build(G) || []; } catch (e) { console.error('BUILDFAIL ' + id + ' ' + e.message + ' ' + (e.stack || '').split('\n')[1]); }
  $('#nm').textContent = S.name;
  $('#stops').innerHTML = S.mapSet ? '<span>Stops 1–15, and where Episode 6 on will go</span>' : S.stops.map(n => `<span>Stop ${n} · ${STOPNAMES[n]}</span>`).join('');
  $('#now').innerHTML = S.mapSet ? '<img src="lab/stops/map.jpg" alt="map now" style="grid-column:span 2">' : S.stops.map(n => `<img src="lab/stops/st${n}.jpg" alt="stop ${n} now" onerror="this.remove()">`).join('');
  const pr = $('#props'); pr.innerHTML = '';
  S.props.forEach(([name, src, note], i) => { const v = views.find(w => name.toLowerCase().startsWith(w[0].toLowerCase().split(' ')[0])) || null;
    const d = document.createElement('div'); d.className = 'prop' + (v ? ' go' : ''); d.innerHTML = `<b>${name}</b><i class="${/^code/.test(src) ? 'code' : 'pack'}">${src}</i>${note ? `<span>${note}</span>` : ''}`; if (v) d.onclick = () => flyTo(v[1], v[2]); pr.append(d); });
  const vb = $('#views') || Object.assign(document.createElement('div'), { id: 'views' }); ui.append(vb); vb.innerHTML = '';
  [['Overview', ...S.cam]].concat(views).forEach(([n, p, t, fn]) => { const b = document.createElement('button'); b.textContent = n; if (fn) b.className = 'play'; b.onclick = () => fn ? fn() : flyTo(p, t); vb.append(b); });
  $('#loading').style.display = 'none'; building = false; window.__ready = id;
}
{ const r = $('#roster'); Object.entries(SETS).forEach(([id, S]) => { const b = document.createElement('button'); b.dataset.id = id; b.innerHTML = `${S.name}<small>${S.mapSet ? 'All stops' : 'Stops ' + S.stops.join(', ')}</small>`; b.onclick = () => show(id); r.append(b); });
  const t = document.createElement('button'); t.className = 'hide'; t.textContent = 'Hide panels'; t.onclick = () => document.body.classList.toggle('clean'); r.append(t); }
if (!location.search.includes('catalog=')) show(new URLSearchParams(location.search).get('set') || 'meadow');
window.__lab = { load, show, flyTo, get ctl() { return ctl; }, cam: (p, t) => { camera.position.set(...p); ctl.target.set(...t); ctl.update(); }, SETS };
// ?catalog=name1,name2 : one row of models for checking
if (location.search.includes('catalog=')) { const names = new URLSearchParams(location.search).get('catalog').split(','); setTimeout(async () => { const G = newWorld({ sky: 0xDDDDDD, ambientI: 1.6, sunI: 1.6 }); setCam([0, 3, names.length * 1.6 + 4], [0, 1.2, 0]);
  for (let i = 0; i < names.length; i++) await scatter(G, names[i], [{ x: (i - (names.length - 1) / 2) * 3, z: 0, y: 0, ry: 0.5 }], { norm: 2.4 }); window.__ready = 'catalog'; }, 1500); }
