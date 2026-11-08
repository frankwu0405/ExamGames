// Character Lab: every character in one place, to settle the design before building scenes.
import { THREE, init, newWorld, onTick, setCam, renderer, camera, toon } from './gfx.js';
import { makeLabKids, makeJackBoy, makeJackMan, makeOldMan } from './chars.js';
import { makeVarn, SHOW } from './varn.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

init(document.body);
const world = newWorld({ sky: 0x2A3340, ambientI: 1.5, sunI: 1.5, sunPos: [6, 12, 8] });
renderer.shadowMap.enabled = true;
const ground = new THREE.Mesh(new THREE.CircleGeometry(60, 48), toon(0x5E6A55)); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; world.add(ground);
const ring = new THREE.Mesh(new THREE.RingGeometry(1.1, 1.18, 64), new THREE.MeshBasicMaterial({ color: 0xFFE58A, transparent: true, opacity: 0.5, side: THREE.DoubleSide })); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.01; world.add(ring);

const kids = makeLabKids(world), jackB = makeJackBoy(world), jackM = makeJackMan(world), oldM = makeOldMan(world);
const V = makeVarn(world); V.state.waterY = -999; V.state.sway = 0.2; V.set('show');
const V2 = makeVarn(world); V2.state.waterY = -999; V2.state.sway = 0.35; V2.set('show'); V2.state.glow = 0.8;
const KID_POSES = ['idle', 'walk', 'run', 'scared', 'cheer', 'point', 'wow', 'hold', 'sit'], KID_FACES = ['auto', 'happy', 'scared', 'surprised', 'determined', 'sad'];
const R = n => 'lab/ref/' + n;
const CAST = [
  { id: 'leo', name: 'Leo', o: kids.leo, poses: KID_POSES, faces: true, h: 1.55, ref: [R('kids.jpg')], note: 'Sleeves/trousers in olive & green, curly dark hair. Story: the older boy, brave, a bit bossy.' },
  { id: 'mia', name: 'Mia', o: kids.mia, poses: KID_POSES, faces: true, h: 1.5, ref: [R('kids.jpg')], note: 'Pink overalls, yellow pigtails with pink bobbles. Story: kind, clever.' },
  { id: 'toby', name: 'Toby', o: kids.toby, poses: ['idle', 'run', 'wag', 'bark', 'sit'], h: 0.75, ref: [R('kids.jpg')], note: 'Golden puppy, red collar.' },
  { id: 'varn', name: 'Varn', v: V, h: 3.2, scale: 1, ref: [R('varn.jpg')], poses: ['show'], note: 'Giant guardian: teal scales, purple frills, glowing eyes. The sculpted model (varn.glb).' },
  { id: 'yvarn', name: 'Young Varn', v: V2, h: 1.7, scale: 0.5, ref: [R('yvarn.jpg')], poses: ['show'], note: 'Same model shrunk (0.5x) with a softer glow. Needs its own design: rounder head, bigger eyes, smaller frills.' },
  { id: 'jack', name: 'Jack (boy)', o: jackB, poses: KID_POSES, faces: true, h: 1.5, ref: [R('jackboy.jpg')], note: 'The lost boy Varn befriends. Brown hair, blue eyes, cream shirt, navy waistcoat.' },
  { id: 'jackm', name: 'Jack (grown)', o: jackM, poses: KID_POSES, faces: true, h: 2.0, ref: [R('jackman.jpg')], note: 'Pirate captain: tricorn hat, rough beard, blue coat, red sash.' },
  { id: 'old', name: 'Old Man Jack', o: oldM, poses: ['idle', 'talk', 'kind', 'soup', 'point', 'grab', 'cold'], h: 1.9, ref: [R('oldman.jpg'), R('oldman2.jpg')], note: 'The hooded stranger on the gray shore.' },
];
const all = () => CAST.map(c => c.o ? c.o.g : c.v.g);
let cur = null, mode = 'one';
const place = (c, x, z = 0, ry = 0) => { const g = c.o ? c.o.g : c.v.g; g.visible = true; g.position.set(x, c.v ? 1.6 + (c.id === 'varn' ? 0.6 : 0) : 0, z); g.rotation.y = ry; if (c.v) g.scale.setScalar(c.scale); };
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
  const h = cur.h, tgt = [0, cur.v ? 1.9 : h * 0.5, 0];
  cam([h * 1.0, h * 0.7 + 0.4, h * 2.3 + 1.2], tgt); ctl.target.set(...tgt);
  $('#nm').textContent = cur.name; $('#note').textContent = cur.note;
  $('#refs').innerHTML = cur.ref.map(r => `<img src="${r}" alt="story art" onerror="this.style.display='none'">`).join('') + '<small>Story art (reference)</small>';
  const pr = $('#pr'); pr.innerHTML = '<b>Pose</b>'; cur.poses.forEach((p, i) => { const b = btn(pr, p, b => { sel(pr, b); if (cur.o) cur.o.pose(p); }); if (i === 0) b.classList.add('on'); }); if (cur.o) cur.o.pose(cur.poses[0]);
  const fr = $('#fr'); fr.innerHTML = ''; if (cur.faces) { fr.innerHTML = '<b>Face</b>'; KID_FACES.forEach((f, i) => { const b = btn(fr, f, b => { sel(fr, b); cur.o.forceFace = f === 'auto' ? null : f; if (cur.o.fp) cur.o.fp.set(f === 'auto' ? 'happy' : f); }); if (i === 0) b.classList.add('on'); }); cur.o.forceFace = null; }
  const mr = $('#mr'); mr.innerHTML = '<b>View</b>';
  [['Front', [0.2, h * 0.55, h * 2.4 + 1]], ['Face', [0, h * 0.95, h * 0.75 + 0.6]], ['Side', [h * 2.4 + 1, h * 0.55, 0]], ['Back', [-0.2, h * 0.55, -(h * 2.4 + 1)]]].forEach(([n, p]) => btn(mr, n, () => { const t = n === 'Face' ? [0, h * 0.92, 0] : tgt; cam(cur.v ? [p[0], p[1] + 1.4, p[2]] : p, t); }));
  [...$('#roster').children].forEach(b => b.classList.toggle('on', b.dataset.id === id));
}
function lineup() {
  mode = 'all'; cur = null; $('#nm').textContent = 'Lineup'; $('#note').textContent = 'All eight at the same stage. Kids and people are to scale with each other; the two Varns are shown at about a third of story size so they fit.';
  $('#refs').innerHTML = ''; $('#pr').innerHTML = ''; $('#fr').innerHTML = ''; $('#mr').innerHTML = '';
  const xs = [-4.2, -3, -2.2, 0, 0, 1.4, 2.8, 4.2]; ring.visible = false;
  CAST.forEach((c, i) => { place(c, c.id === 'varn' ? -4 : c.id === 'yvarn' ? 0.5 : xs[i], c.v ? -6 : 0, c.v ? 0.9 : 0.15); if (c.v) { c.v.g.scale.setScalar(c.scale * (c.id === 'varn' ? 0.4 : 0.55)); c.v.g.position.y = 1.2; } if (c.o && c.o.pose) c.o.pose('idle'); });
  cam([0, 2.6, 9.5], [0, 1.1, -1]); $('#side').style.width = '220px';
  [...$('#roster').children].forEach(b => b.classList.toggle('on', b.dataset.id === 'all'));
}
{ const r = $('#roster'); btn(r, 'Lineup', lineup).dataset.id = 'all'; CAST.forEach(c => { const b = btn(r, c.name, () => show(c.id)); b.dataset.id = c.id; }); }
const bgs = [['Cave', 0x0E1A22, 0x37424B], ['Gray shore', 0x9AA4A8, 0x6F7770], ['Daylight', 0x9FD8F5, 0x8CC95E], ['Studio', 0xDDDDDD, 0xBDBDBD]];
{ const r = document.createElement('div'); r.id = 'bg'; ui.append(r); bgs.forEach(([n, sky, gr]) => btn(r, n, () => { world.background = new THREE.Color(sky); if (world.fog) world.fog.color.set(sky); ground.material.color.set(gr); })); }
show(new URLSearchParams(location.search).get('c') || 'leo'); if (location.search.includes('lineup')) lineup();
window.__lab = { show, lineup, CAST, ctl, cam };

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
