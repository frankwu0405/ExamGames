// Character Lab: every character in one place, to settle the design before building scenes.
import { THREE, init, newWorld, onTick, setCam, renderer, camera, toon } from './gfx.js';
import { makeLabKids, makeJackBoy, makeJackMan, makeOldJack } from './chars.js';
import { makeVarn, SHOW } from './varn.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

init(document.body);
const world = newWorld({ sky: 0x2A3340, ambientI: 1.5, sunI: 1.5, sunPos: [6, 12, 8] });
renderer.shadowMap.enabled = true;
const ground = new THREE.Mesh(new THREE.CircleGeometry(60, 48), toon(0x5E6A55)); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; world.add(ground);
const ring = new THREE.Mesh(new THREE.RingGeometry(1.1, 1.18, 64), new THREE.MeshBasicMaterial({ color: 0xFFE58A, transparent: true, opacity: 0.5, side: THREE.DoubleSide })); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.01; world.add(ring);

const kids = makeLabKids(world), jackB = makeJackBoy(world), jackM = makeJackMan(world), oldM = makeOldJack(world);
const V = makeVarn(world); V.state.waterY = -999; V.state.sway = 0.2; V.set('show');
const YV = new THREE.Group(); world.add(YV); const V2 = { g: YV };
{ const tl = new THREE.TextureLoader(), tx = u => { const t = tl.load(u); t.flipY = false; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
  new GLTFLoader().load('varn/yvarn.glb', gl => { let src; gl.scene.traverse(o => { if (o.isMesh && !src) src = o; }); if (!src) return;
    const mat = toon(0xFFFFFF, { map: tx('varn/yvarn-skin.jpg'), emissiveMap: tx('varn/yvarn-glow.jpg'), emissive: 0xFFFFFF, emissiveIntensity: 1.3 });
    src.geometry.computeBoundingBox(); const bb = src.geometry.boundingBox; src.geometry.translate(-(bb.min.x + bb.max.x) / 2, 0, -(bb.min.z + bb.max.z) / 2); const m = new THREE.Mesh(src.geometry, mat); m.castShadow = true; m.rotation.y = -Math.PI / 2; const ink = new THREE.Mesh(src.geometry, new THREE.MeshBasicMaterial({ color: 0x1B2A55, side: THREE.BackSide })); ink.material.onBeforeCompile = s => { s.vertexShader = s.vertexShader.replace('#include <begin_vertex>', 'vec3 transformed = position + normal * 0.004;'); };
    m.add(ink); YV.add(m); YV.userData.mesh = m; }); }
const KID_POSES = ['idle', 'walk', 'run', 'scared', 'cheer', 'point', 'wow', 'hold', 'sit'], KID_FACES = ['auto', 'happy', 'scared', 'surprised', 'determined', 'sad'];
const R = n => 'lab/ref/' + n;
const CAST = [
  { id: 'leo', name: 'Leo', o: kids.leo, poses: KID_POSES, faces: true, h: 1.55, ref: [R('kids.jpg')], note: 'Sleeves/trousers in olive & green, curly dark hair. Story: the older boy, brave, a bit bossy.' },
  { id: 'mia', name: 'Mia', o: kids.mia, poses: KID_POSES, faces: true, h: 1.5, ref: [R('kids.jpg')], note: 'Pink overalls, yellow pigtails with pink bobbles. Story: kind, clever.' },
  { id: 'toby', name: 'Toby', o: kids.toby, poses: ['idle', 'run', 'wag', 'bark', 'sit'], h: 0.75, ref: [R('kids.jpg')], note: 'Golden puppy, red collar.' },
  { id: 'varn', name: 'Varn', v: V, h: 3.2, scale: 1, ref: [R('varn.jpg')], poses: ['show'], note: 'Giant guardian: teal scales, purple frills, glowing eyes. The sculpted model (varn.glb).' },
  { id: 'yvarn', name: 'Young Varn', v: V2, h: 1.4, scale: 3.2, yv: true, ref: [R('yvarn.jpg')], poses: ['show'], note: 'Its own sculpt (rounder, friendlier), repainted in a lighter aqua than grown Varn, with glowing rune lines. The eyes are painted onto the eyeballs themselves.' },
  { id: 'jack', name: 'Jack (boy)', o: jackB, poses: KID_POSES, faces: true, h: 1.5, ref: [R('jackboy.jpg')], note: 'The lost boy Varn befriends, built like Leo and Mia: messy brown hair, teal eyes, freckles, cream shirt with rolled sleeves, open teal waistcoat, red-brown sash, knee-length trousers.' },
  { id: 'jackm', name: 'Jack (grown)', o: jackM, poses: KID_POSES, faces: true, h: 2.2, ref: [R('jackman.jpg')], note: 'Same face, grown up: messy brown hair, short beard as a raised block of colour, open-necked cream shirt, long torn teal vest, red-brown sash, leather bracers, boots. No hat.' },
  { id: 'old', name: 'Old Man Jack', o: oldM, poses: KID_POSES.concat(['talk']), faces: true, h: 2.2, ref: [R('oldman.jpg'), R('oldman2.jpg')], note: 'Jack, old: olive hood and long ragged cloak, grey beard, shepherd\'s crook. The hood only shades his brow and eyes; his face stays visible.' },
];
const all = () => CAST.map(c => c.o ? c.o.g : c.v.g);
let cur = null, mode = 'one';
const place = (c, x, z = 0, ry = 0) => { const g = c.o ? c.o.g : c.v.g; g.visible = true; g.position.set(x, c.v ? (c.yv ? 0 : 1.6 + (c.id === 'varn' ? 0.6 : 0)) : 0, z); g.rotation.y = ry; if (c.v) g.scale.setScalar(c.scale); };
const cam = (pos, tgt) => { camera.position.set(...pos); ctl.target.set(...tgt); ctl.update(); };
const ctl = new OrbitControls(camera, renderer.domElement); ctl.enableDamping = true; ctl.maxPolarAngle = Math.PI * 0.55; ctl.minDistance = 0.8; ctl.maxDistance = 40;
onTick(() => ctl.update());

const ui = document.createElement('div'); ui.id = 'ui';
ui.innerHTML = `<div id="roster"></div><div id="side"><div id="refs"></div><h2 id="nm"></h2><p id="note"></p><div id="pr"></div><div id="fr"></div><div id="mr"></div></div>`;
document.body.append(ui);
const $ = s => ui.querySelector(s);
const btn = (parent, label, on, cls = '') => { const b = document.createElement('button'); b.textContent = label; b.className = cls; b.onclick = () => on(b); parent.append(b); return b; };
const sel = (parent, b) => { [...parent.children].forEach(x => x.classList.remove('on')); b.classList.add('on'); };

function show(id) {
  $('#side').style.width = ''; mode = 'one'; cur = CAST.find(c => c.id === id);
  CAST.forEach(c => { (c.o ? c.o.g : c.v.g).visible = false; });
  place(cur, 0, 0, 0.3); ring.visible = true;
  $('#side').style.display = '';
  const h = cur.h, tgt = [cur.yv ? 0.5 : 0, cur.yv ? 0.55 : cur.v ? 1.9 : h * 0.5, cur.yv ? 0.5 : 0];
  if (cur.yv) cam([2.4, 1.2, 3.6], tgt); else cam([h * 1.0, h * 0.7 + 0.4, h * 2.3 + 1.2], tgt); ctl.target.set(...tgt);
  $('#nm').textContent = cur.name; $('#note').textContent = cur.note;
  $('#refs').innerHTML = cur.ref.map(r => `<img src="${r}" alt="story art" onerror="this.style.display='none'">`).join('') + '<small>Story art (reference)</small>';
  const pr = $('#pr'); pr.innerHTML = '<b>Pose</b>'; cur.poses.forEach((p, i) => { const b = btn(pr, p, b => { sel(pr, b); if (cur.o) cur.o.pose(p); }); if (i === 0) b.classList.add('on'); }); if (cur.o) cur.o.pose(cur.poses[0]);
  const fr = $('#fr'); fr.innerHTML = ''; if (cur.faces) { fr.innerHTML = '<b>Face</b>'; KID_FACES.forEach((f, i) => { const b = btn(fr, f, b => { sel(fr, b); cur.o.forceFace = f === 'auto' ? null : f; if (cur.o.fp) cur.o.fp.set(f === 'auto' ? 'happy' : f); }); if (i === 0) b.classList.add('on'); }); cur.o.forceFace = null; }
  const mr = $('#mr'); mr.innerHTML = '<b>View</b>';
  [['Front', [0.2, h * 0.55, h * 2.4 + 1]], ['Face', [0, h * 0.95, h * 0.75 + 0.6]], ['Side', [h * 2.4 + 1, h * 0.55, 0]], ['Back', [-0.2, h * 0.55, -(h * 2.4 + 1)]]].forEach(([n, p]) => btn(mr, n, () => { const t = n === 'Face' ? [0, h * 0.92, 0] : tgt; cam(cur.yv ? [p[0] * 1.2, p[1], p[2] * 1.2] : cur.v ? [p[0], p[1] + 1.4, p[2]] : p, t); }));
  [...$('#roster').children].forEach(b => b.classList.toggle('on', b.dataset.id === id));
}
function lineup() {
  mode = 'all'; cur = null; $('#nm').textContent = 'Lineup'; $('#note').textContent = 'All eight at the same stage. Kids and people are to scale with each other; the two Varns are shown at about a third of story size so they fit.';
  $('#refs').innerHTML = ''; $('#pr').innerHTML = ''; $('#fr').innerHTML = ''; $('#mr').innerHTML = '';
  const xs = [-3.6, -2.5, -1.7, 0, 0, 0.6, 2.0, 3.4]; ring.visible = false;
  CAST.forEach((c, i) => { place(c, c.id === 'varn' ? -2 : c.id === 'yvarn' ? 4.6 : xs[i], c.id === 'varn' ? -10 : c.v ? -1.5 : 0, c.id === 'yvarn' ? -0.6 : c.v ? 0.9 : 0.15); if (c.v) { c.v.g.scale.setScalar(c.scale * (c.id === 'varn' ? 0.4 : c.yv ? 0.8 : 0.55)); c.v.g.position.y = c.yv ? 0 : 1.2; } if (c.o && c.o.pose) c.o.pose('idle'); });
  cam([0, 2.4, 9.8], [0, 1.1, -1]); $('#side').style.display = 'none';
  [...$('#roster').children].forEach(b => b.classList.toggle('on', b.dataset.id === 'all'));
}
{ const r = $('#roster'); btn(r, 'Lineup', lineup).dataset.id = 'all'; CAST.forEach(c => { const b = btn(r, c.name, () => show(c.id)); b.dataset.id = c.id; }); }
const bgs = [['Cave', 0x0E1A22, 0x37424B], ['Gray shore', 0x9AA4A8, 0x6F7770], ['Daylight', 0x9FD8F5, 0x8CC95E], ['Studio', 0xDDDDDD, 0xBDBDBD]];
{ const r = document.createElement('div'); r.id = 'bg'; ui.append(r); bgs.forEach(([n, sky, gr]) => btn(r, n, () => { world.background = new THREE.Color(sky); if (world.fog) world.fog.color.set(sky); ground.material.color.set(gr); })); }
show(new URLSearchParams(location.search).get('c') || 'leo'); if (location.search.includes('lineup')) lineup();
window.__lab = { show, lineup, CAST, ctl, cam, V, SHOW };

// ---- ?backdrop=1 : the 3D kids standing in front of the story illustration (style option B)
if (location.search.includes('backdrop')) {
  document.getElementById('ui').style.display = 'none';
  new THREE.TextureLoader().load('lab/ref/s16.jpg', t => {
    t.colorSpace = THREE.SRGBColorSpace; const pl = new THREE.Mesh(new THREE.PlaneGeometry(16, 16 * 308 / 550), new THREE.MeshBasicMaterial({ map: t, toneMapped: false })); pl.position.set(0, 4.6, -6); world.add(pl); });
  ground.visible = false; ring.visible = false; world.background = new THREE.Color(0x777f84);
  CAST.forEach(c => { (c.o ? c.o.g : c.v.g).visible = false; });
  const k = [[kids.leo, -1.7, 'sit'], [kids.mia, -0.8, 'sit'], [kids.toby, 0.1, 'sit']];
  k.forEach(([c, x, p]) => { c.g.visible = true; c.g.position.set(x, c === kids.toby ? 0 : -0.38, 0.5); c.g.rotation.y = 0.2; c.pose(p); });
  const fl = new THREE.Mesh(new THREE.CircleGeometry(5, 32), toon(0xB7A98C)); fl.rotation.x = -Math.PI / 2; fl.position.set(-1, -0.01, 0); world.add(fl);
  cam([0, 1.9, 6.2], [0, 1.9, -6]); ctl.enabled = false;
}
