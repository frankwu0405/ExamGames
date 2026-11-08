// The lost island with its lookout hill, the clear sea, the secret tunnel under the seabed and the far mainland with home.
// Shared by the Prop Lab and the game (stop 10).
import { THREE, onTick, toon, builder } from './gfx.js';
import { glowSprite } from './effects.js';
import { setSeed, rnd, rr, pick, nz, small, scatter, ground, grass, water, rockMat, lumpy, mesh, ferris, clouds, cutHoles, rockTube, caveMouth } from './props.js';
import { cart as cartModel } from './sets.js';
export async function buildIsland(G) {
  setSeed(7 + 2 * 31);
    // a big island: a sandy beach facing home (west) where the river runs out of a cave in the cliff, palms along the sand,
    // and behind it the tall lookout hill with a path that spirals up to the top
    const HC = [-6, -5], HR = 16, TOP = 16, CAVE = [21, -13];
    const PATH = []; for (let i = 0; i <= 220; i++) { const t = i / 220, a = Math.PI * 0.12 + t * Math.PI * 1.9, r = 17.2 - 14.4 * t; PATH.push([HC[0] + Math.cos(a) * r, HC[1] + Math.sin(a) * r, 0.75 + (TOP - 0.6) * Math.pow(t, 0.95)]); }
    const shoreR = a => 40 + nz(Math.cos(a) * 9, Math.sin(a) * 9, 0.5) * 3 + Math.sin(a * 3 + 1) * 2.2;
    // the stream: out of the cave mouth, curling across the beach to the sea
    const SP = [[CAVE[0] - 3, CAVE[1]], [CAVE[0] + 1, CAVE[1]], [CAVE[0] + 6, CAVE[1] - 1.5], [CAVE[0] + 11, CAVE[1] + 1.5], [CAVE[0] + 20, CAVE[1] + 2.5]];
    const sCurve = new THREE.CatmullRomCurve3(SP.map(([x, z]) => new THREE.Vector3(x, 0, z))), sPts = sCurve.getSpacedPoints(80);
    const sDist = (x, z) => { let d = 1e9; for (const q of sPts) d = Math.min(d, Math.hypot(q.x - x, q.z - z)); return d; };
    const hBase = (x, z) => { const a = Math.atan2(z, x), d = Math.hypot(x, z), sr = shoreR(a), land = 0.75 + nz(x, z, 0.3) * 0.12; return d < sr - 5 ? land : d < sr ? land - (d - sr + 5) / 5 * 1.2 : -0.45 - (d - sr) * 0.35; };
    const hHill = (x, z) => { const d = Math.hypot(x - HC[0], z - HC[1]) * (1 + nz(x, z, 0.4) * 0.08), k = 1 - Math.min(1, d / HR); if (k <= 0) return 0; let h = TOP * Math.pow(k, 0.7); const terr = TOP / 5; h = Math.floor(h / terr) * terr + terr * Math.pow((h % terr) / terr, 3); return d < 2.6 ? TOP + nz(x, z, 1.4) * 0.12 : h; };
    const hf0 = (x, z) => { let h = Math.max(hBase(x, z), hBase(x, z) + hHill(x, z)); let best = 9, ph = 0; for (let i = 0; i < PATH.length; i += 2) { const p = PATH[i], dd = Math.hypot(x - p[0], z - p[1]); if (dd < best) { best = dd; ph = p[2]; } }
      if (best < 1.5 && h > 0.5) { const k = sm(1 - (best - 0.9) / 0.6); h = h + (ph - h) * k; } return Math.max(-4, h); };
    const hf = (x, z) => { let h = hf0(x, z); if (x > CAVE[0] - 4 && x < CAVE[0] + 24) { const d = sDist(x, z); if (d < 4) h = Math.min(h, -0.2 + Math.max(0, d - 1.5) * 0.45); }
      if (x <= CAVE[0] && x > CAVE[0] - 8.5 && Math.abs(z - CAVE[1]) < 2.8) h = Math.min(h, -0.3); return h; };   // (the cave runs back under the cliff)
    function sm(v) { v = Math.max(0, Math.min(1, v)); return v * v * (3 - 2 * v); }
    const beachy = (x, z) => x > CAVE[0] - 4 && hf(x, z) < 1.1;
    const isl = ground(G, 124, 330, hf, (x, z, c) => { const h = hf(x, z); if (h < 0.55 || (beachy(x, z) && Math.hypot(x - HC[0], z - HC[1]) > HR + 1)) c.setRGB(0.93, 0.83, 0.6); else c.setHSL(0.26 + nz(x, z, 0.5) * 0.02, 0.5, 0.47 + nz(x + 9, z, 0.9) * 0.04); }, rockMat(0xffffff, 0.22, { steep: true }));
    { const rg = new THREE.TubeGeometry(sCurve, 80, 1, 2, false), pos = [], idx = []; sPts.forEach((q, i) => { const t = sCurve.getTangentAt(Math.min(1, i / 80)); [-1, 1].forEach(sd => pos.push(q.x - t.z * 1.7 * sd, -0.12, q.z + t.x * 1.7 * sd)); if (i < 80) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } });
      const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); sg.setIndex(idx); water(G, sg, { deep: 0x3FA7D6, shallow: 0x8FE6F2, flow: [1.4, 0], speed: 1.2, opacity: 0.92 }); }
    // the path's stepping stones, sandy and worn
    const stoneM = toon(0xD9C7A2); for (let i = 4; i < PATH.length; i += 5) { const p = PATH[i]; mesh(G, lumpy(0.36, 1, 0.15, 0.35), stoneM, p[0] + rr(-0.15, 0.15), hf(p[0], p[1]) + 0.04, p[1] + rr(-0.15, 0.15), { ry: rnd() * 6, ink: false }); }
    // boulders round the hill so its outline is rocky, not smooth
    const bm = rockMat(0xA59C92, 0.35); for (let i = 0; i < 90; i++) { const a = rnd() * 6.28, r = i < 30 ? rr(3.5, 6.5) : rr(6, HR), x = HC[0] + Math.cos(a) * r, z = HC[1] + Math.sin(a) * r; let near = 9; for (const p of PATH) near = Math.min(near, Math.hypot(x - p[0], z - p[1])); if (near < 1.9) continue; const big = i < 30 ? rr(0.8, 1.5) : rr(0.8, 1.9); mesh(G, lumpy(big, 2, 0.28, i < 30 ? 1.3 : 0.9), bm, x, hf(x, z) + big * 0.3, z, { ry: rnd() * 6 }); }
    // the sandstone cliff with the river cave in it (the cave they were flushed out of), the stream running out of it
    { const cliffM = cutHoles(rockMat(0xD7B48A, 0.2), [{ p: new THREE.Vector3(CAVE[0] - 1.5, -0.3, CAVE[1]), d: new THREE.Vector3(-1, 0, 0), r: 2.2, depth: 6 }]);
      [[CAVE[0] - 7, 2.4, CAVE[1], 6.5, [0.8, 0.85, 1.5]], [CAVE[0] - 5, 1.8, CAVE[1] - 9, 4.5, [1, 0.8, 1]], [CAVE[0] - 5, 1.8, CAVE[1] + 9, 5, [1, 0.8, 1]]].forEach(([x, y, z, r, sc]) => mesh(G, lumpy(r, 3, 0.14, 1), cliffM, x, y, z, { sc, shadow: false }));
      rockTube(G, new THREE.LineCurve3(new THREE.Vector3(CAVE[0] - 2.2, -0.2, CAVE[1]), new THREE.Vector3(CAVE[0] - 8.5, -0.2, CAVE[1])), { r: 2.5, lift: 1.0, tint: 0x5A4A3A, scale: 0.3, seg: 30 });
      const back = new THREE.Mesh(new THREE.CircleGeometry(3, 20), new THREE.MeshBasicMaterial({ color: 0x0A0806 })); back.position.set(CAVE[0] - 8.2, 0.6, CAVE[1]); back.rotation.y = Math.PI / 2; G.add(back);
      caveMouth(G, new THREE.Vector3(CAVE[0] - 1.3, -0.25, CAVE[1]), new THREE.Vector3(1, 0, 0), { r: 2.2, mat: rockMat(0xC9A884, 0.35), hf }); }
    // the tipped cart they rode out on, lying on the bank
    { const tg = new THREE.Group(); tg.position.set(CAVE[0] + 5, hf(CAVE[0] + 5, CAVE[1] + 4.2), CAVE[1] + 4.2); tg.rotation.set(0, 0.6, 1.2); G.add(tg); cartModel(builder(tg), 0, 0, 0); }
    scatter(G, 'palm-detailed-long', Array.from({ length: 9 }, (_, i) => { const z = CAVE[1] - 22 + i * 3.2 + rr(-1, 1), x = CAVE[0] + rr(3, 12); return sDist(x, z) > 3.5 && hf(x, z) > 0.4 ? { x, z, ry: rr(0, 6), rz: rr(-0.12, 0.12) } : null; }).filter(Boolean), { gy: hf, norm: 7.5 });
    scatter(G, 'palm-detailed-short', Array.from({ length: 7 }, () => { const z = CAVE[1] + rr(-24, 5), x = CAVE[0] + rr(2, 13); return sDist(x, z) > 3.5 && hf(x, z) > 0.4 ? { x, z, ry: rr(0, 6) } : null; }).filter(Boolean), { gy: hf, norm: 5 });
    // trees, palms and bushes on the island, flowers and grass
    const onLand = (x, z) => hf(x, z) > 0.6 && hf(x, z) < 1.3 && Math.hypot(x - HC[0], z - HC[1]) > HR + 1 && x < CAVE[0] - 6;
    const spot = () => { for (let k = 0; k < 300; k++) { const x = rr(-38, 38), z = rr(-38, 38); if (onLand(x, z)) return [x, z]; } return null; };
    const T = { tree_oak: [], tree_fat: [], tree_pine: [], 'palm-detailed-long': [], 'palm-detailed-short': [] }; Object.keys(T).forEach((k, j) => { for (let i = 0; i < 12; i++) { const s = spot(); if (s) T[k].push({ x: s[0], z: s[1], s: k.startsWith('palm') ? 1 : rr(1.4, 2.2) }); } });
    for (const k in T) await scatter(G, k, T[k], { gy: hf, norm: k.startsWith('palm') ? rr(3.8, 4.8) : 0 });
    await scatter(G, 'bush_large', Array.from({ length: 40 }, () => { const s = spot() || [20, 20]; return { x: s[0], z: s[1], s: rr(0.8, 1.4) }; }), { gy: hf });
    // bushes up on the terraces of the hill too
    await scatter(G, 'bush', Array.from({ length: 30 }, () => { const a = rnd() * 6.28, r = rr(4, HR - 2), x = HC[0] + Math.cos(a) * r, z = HC[1] + Math.sin(a) * r; return { x, z, s: rr(0.6, 1.0) }; }), { gy: hf });
    grass(G, small ? 9000 : 22000, () => { const x = rr(-30, 24), z = rr(-30, 30); if (beachy(x, z)) return null; const h = hf(x, z); if (h < 0.62) return null; const sl = Math.abs(hf(x + 0.3, z) - hf(x - 0.3, z)) + Math.abs(hf(x, z + 0.3) - hf(x, z - 0.3)); return sl < 0.25 ? [x, z] : null; }, hf);
    // sea (clear, so the seabed and the tunnel show through), seabed
    const bed = new THREE.PlaneGeometry(400, 400, 80, 80); bed.rotateX(-Math.PI / 2); { const p = bed.attributes.position, c = new Float32Array(p.count * 3), col = new THREE.Color(); for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i); p.setY(i, -4 + nz(x, z, 0.08) * 0.5); col.setHSL(0.12, 0.35, 0.55 + nz(x, z, 0.2) * 0.05); c.set([col.r, col.g, col.b], i * 3); } bed.setAttribute('color', new THREE.BufferAttribute(c, 3)); bed.computeVertexNormals(); }
    G.add(new THREE.Mesh(bed, toon(0xffffff, { vertexColors: true })));
    const sea = new THREE.PlaneGeometry(500, 500, 2, 2); sea.rotateX(-Math.PI / 2); water(G, sea, { deep: 0x2F9FD0, shallow: 0x8FE6EE, opacity: 0.55, foamFn: '1.0 - smoothstep(0.0, 0.8, abs(length(vW.xz) - 39.2 - sin(atan(vW.z, vW.x) * 3.0 + 1.0) * 2.2 - sin(uT) * 0.3))' }).position.y = -0.05;
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
    const TP = [[HC[0] - 15, 0.2, HC[1] + 3], [HC[0] - 24, -2.4, HC[1] + 4], [-44, -3.9, 6], [-60, -3.9, 15], [-78, -3.9, 21], [CH[0] - 2, -2.5, CH[1]], [CH[0] + 4.5, 1.0, CH[1]]].map(a => new THREE.Vector3(...a));
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
    const START = [[PATH[0][0] + 2.2, PATH[0][1] - 1.6], [PATH[0][0] + 3.2, PATH[0][1] - 0.6], [PATH[0][0] + 2.6, PATH[0][1] - 2.4]];
    const along = u => { u = Math.max(0, Math.min(1, u)); const f = u * (PATH.length - 1), i = Math.floor(f), j = Math.min(PATH.length - 1, i + 1), k = f - i, a = PATH[i], b = PATH[j]; return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]; };
    clouds(G, 12, 24, 40, -60);
    return { hf, PATH, HC, CAVE, START, along, showTunnel, wheel, tc, TOP };
}
