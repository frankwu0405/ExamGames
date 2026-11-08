// The lost island with its lookout hill, the clear sea, the secret tunnel under the seabed and the far mainland with home.
// Shared by the Prop Lab and the game (stop 10).
import { THREE, onTick, toon, builder } from './gfx.js';
import { glowSprite } from './effects.js';
import { setSeed, rnd, rr, pick, nz, small, scatter, ground, grass, water, rockMat, lumpy, mesh, ferris, clouds } from './props.js';
export async function buildIsland(G) {
  setSeed(7 + 2 * 31);
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
    const wheel = ferris(G, coastX(homeZ - 10) - 14, 1.2, homeZ - 10, 0.9, Math.PI / 2);   // facing out to sea
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
    const START = [[-7.8, 2.9], [-7.4, 1.9], [-7.0, 2.6]];
    const along = u => { u = Math.max(0, Math.min(1, u)); const f = u * (PATH.length - 1), i = Math.floor(f), j = Math.min(PATH.length - 1, i + 1), k = f - i, a = PATH[i], b = PATH[j]; return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]; };
    clouds(G, 12, 24, 40, -60);
    return { hf, PATH, HC, CAVE, START, along, showTunnel, wheel, tc };
}
