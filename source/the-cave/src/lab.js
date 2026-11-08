// Character Lab: every character in one place, to settle the design before building scenes.
import { THREE, init, newWorld, onTick, setCam, renderer, camera, toon } from './gfx.js';
import { makeLabKids, makeJackBoy, makeJackMan, makeOldJack } from './chars.js';
import { makeVarn, SHOW } from './varn.js';
import { glowSprite } from './effects.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

init(document.body);
const world = newWorld({ sky: 0x2A3340, ambientI: 1.5, sunI: 1.5, sunPos: [6, 12, 8] });
renderer.shadowMap.enabled = true;
const ground = new THREE.Mesh(new THREE.CircleGeometry(60, 48), toon(0x5E6A55)); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; world.add(ground);
const ring = new THREE.Mesh(new THREE.RingGeometry(1.1, 1.18, 64), new THREE.MeshBasicMaterial({ color: 0xFFE58A, transparent: true, opacity: 0.5, side: THREE.DoubleSide })); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.01; world.add(ring);

const kids = makeLabKids(world), jackB = makeJackBoy(world), jackM = makeJackMan(world), oldM = makeOldJack(world);
const V = makeVarn(world); V.state.waterY = -999; V.state.sway = 0; V.set('inplace'); SHOW.flap = 1; SHOW.tail = 1; SHOW.rate = 1;
// both Varns move on the spot: 'swim' (full stroke), 'glide' (slow, gentle), 'still' (just breathing)
const MOVES = { swim: { amp: 0.9, speed: 1, bob: 0.5, flap: 1, tail: 0.6 }, glide: { amp: 0.4, speed: 0.55, bob: 0.35, flap: 0.6, tail: 0.5 }, still: { amp: 0.05, speed: 0.4, bob: 0.15, flap: 0.08, tail: 0.05 } };
V.pose = m => { const M = MOVES[m]; Object.assign(SHOW.inplace, { amp: M.amp, speed: M.speed, bob: M.bob }); SHOW.flap = M.flap; SHOW.tail = M.tail; SHOW.rate = M.speed; };
// young Varn is one sculpted mesh, so he is moved in the vertex shader: a vertical body wave, paddling flippers and a beating tail fluke
const YU = { uT: { value: 0 }, uA: { value: 1 }, uS: { value: 1 }, uF: { value: 1 }, uK: { value: 1 }, uB: { value: 1 } }; let yT = 0;
onTick((t, dt = 0.016) => { yT += (dt || 0.016) * YU.uS.value; YU.uT.value = yT; });
const YDEF = `
  vec3 p = position; float hx = p.x, az = abs(p.z), sd = sign(p.z) + (p.z == 0.0 ? 1.0 : 0.0);
  float T = uT * 3.1;
  // flippers: front pair rooted near x 0.1, back pair near x -0.32; a full paddle stroke (down-and-back, up-and-forward)
  float ff = smoothstep(0.125, 0.2, az) * smoothstep(-0.06, 0.0, hx) * smoothstep(0.26, 0.2, hx);
  float bf = smoothstep(0.1, 0.16, az) * smoothstep(-0.43, -0.38, hx) * smoothstep(-0.2, -0.25, hx) * step(p.y, 0.33);
  float fa = (sin(T * 0.8) * 0.75 * ff + sin(T * 0.8 + 1.9) * 0.6 * bf) * uF;
  vec2 rt = vec2(ff > bf ? 0.12 : 0.1, ff > bf ? 0.2 : 0.25);
  if (ff + bf > 0.0) { float reach = smoothstep(0.1, 0.32, az); vec2 d = vec2(az - rt.x, p.y - rt.y); float c = cos(fa), s = sin(fa); d = vec2(c * d.x - s * d.y, s * d.x + c * d.y); p.y = rt.y + d.y; p.z = sd * (rt.x + d.x);
    p.x += sin(T * 0.8 - 1.4) * 0.07 * (ff + bf) * uF * reach; }
  // tail: the upright stalk and fluke beat fore and aft, with a flick that lags towards the tip
  float tw = smoothstep(-0.3, -0.42, hx) * smoothstep(0.24, 0.62, p.y);
  float ta = (sin(T - 2.2) * 0.42 + sin(T - 2.9) * 0.25 * smoothstep(0.5, 0.7, p.y)) * tw * uK;
  { vec2 pv = vec2(-0.37, 0.28), d = p.xy - pv; float c = cos(ta), s = sin(ta); p.xy = pv + vec2(c * d.x - s * d.y, s * d.x + c * d.y); }
  // head: looks about and nods
  float hw = smoothstep(0.18, 0.32, hx);
  { float na = sin(uT * 1.3) * 0.12 * hw * uA; vec2 pv = vec2(0.22, 0.24), d = p.xy - pv; float c = cos(na), s = sin(na); p.xy = pv + vec2(c * d.x - s * d.y, s * d.x + c * d.y); }
  { float ya = sin(uT * 0.8 + 0.6) * 0.18 * hw * uA; vec2 pv = vec2(0.22, 0.0), d = vec2(p.x, p.z) - pv; float c = cos(ya), s = sin(ya); d = vec2(c * d.x - s * d.y, s * d.x + c * d.y); p.x = pv.x + d.x; p.z = pv.y + d.y; }
  // the whole spine: a travelling S-wave (sideways) and a whale-like up-down wave, both growing towards the tail
  float body = pow(smoothstep(0.3, -0.48, hx), 1.15);
  p.z += sin(T - hx * 4.5) * 0.065 * body * uA;
  p.y += sin(T - hx * 5.0 + 1.2) * 0.05 * body * uA;
  // roll, bob and breathing
  { float r = sin(T * 0.5) * 0.07 * uA; vec2 d = vec2(p.y - 0.3, p.z); float c = cos(r), s = sin(r); p.y = 0.3 + c * d.x - s * d.y; p.z = s * d.x + c * d.y; }
  p.y += sin(uT * 0.9) * 0.03 * uB;
`;
const deform = (m, extra = '') => { m.onBeforeCompile = sh => { Object.assign(sh.uniforms, YU); sh.vertexShader = 'uniform float uT, uA, uS, uF, uK, uB;\n' + sh.vertexShader.replace('#include <begin_vertex>', YDEF + 'vec3 transformed = p' + extra + ';'); }; return m; };

const YV = new THREE.Group(); world.add(YV); const V2 = { g: YV, pose: m => { const M = MOVES[m]; YU.uA.value = M.amp / 0.9; YU.uS.value = M.speed; YU.uF.value = M.flap; YU.uK.value = M.tail; YU.uB.value = M.bob / 0.5; } };
{ const tl = new THREE.TextureLoader(), tx = u => { const t = tl.load(u); t.flipY = false; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
  new GLTFLoader().load('varn/yvarn.glb', gl => { let src; gl.scene.traverse(o => { if (o.isMesh && !src) src = o; }); if (!src) return;
    const mat = deform(toon(0xFFFFFF, { map: tx('varn/yvarn-skin.jpg'), emissiveMap: tx('varn/yvarn-glow.jpg'), emissive: 0xFFFFFF, emissiveIntensity: 1.3 }));
    src.geometry.computeBoundingBox(); const bb = src.geometry.boundingBox; src.geometry.translate(-(bb.min.x + bb.max.x) / 2, 0, -(bb.min.z + bb.max.z) / 2); const m = new THREE.Mesh(src.geometry, mat); m.castShadow = true; m.rotation.y = -Math.PI / 2; const ink = new THREE.Mesh(src.geometry, new THREE.MeshBasicMaterial({ color: 0x1B2A55, side: THREE.BackSide })); ink.material.onBeforeCompile = s => { s.vertexShader = s.vertexShader.replace('#include <begin_vertex>', 'vec3 transformed = position + normal * 0.004;'); };
    deform(ink.material, ' + normal * 0.004'); m.customDepthMaterial = deform(new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking })); m.add(ink);
    const rim = new THREE.ShaderMaterial({ uniforms: Object.assign({ uColor: { value: new THREE.Color(0x9FF6FF) }, uKr: { value: 0.4 } }, YU), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
      vertexShader: 'uniform float uT, uA, uS, uF, uK, uB; varying float vRim;\nvoid main(){' + YDEF + ' vec4 mv = modelViewMatrix * vec4(p + normal * 0.006, 1.0); vec3 n = normalize(normalMatrix * normal); vRim = pow(1.0 - abs(dot(n, normalize(-mv.xyz))), 2.4); gl_Position = projectionMatrix * mv; }',
      fragmentShader: 'uniform vec3 uColor; uniform float uKr; varying float vRim; void main(){ gl_FragColor = vec4(uColor * vRim * uKr, 1.0); }' });
    m.add(new THREE.Mesh(src.geometry, rim));
    // aura: a soft glow over the crown and back (like grown Varn's), crystal sparks along the spine and halos on the eyes
    const aura = []; const add = (c, sz, op, x, y, z, ph) => { const g = glowSprite(c, sz, op); g.position.set(x, y, z); m.add(g); aura.push({ g, op, ph }); };
    add(0xA8F4FF, 0.42, 0.45, 0.2, 0.44, 0, 0); add(0xB48CFF, 0.5, 0.3, -0.04, 0.56, 0, 1.5);
    [[0.14, 0.47], [0.03, 0.55], [-0.08, 0.6], [-0.18, 0.55], [-0.28, 0.47]].forEach(([x, y], i) => add(i % 2 ? 0xB48CFF : 0x6FF0E6, 0.22, 0.6, x, y, 0, i * 1.3));
    [-1, 1].forEach(sd => add(0x9FFFF0, 0.14, 0.55, 0.405, 0.216, sd * 0.07, sd));
    onTick(t => aura.forEach(a => { a.g.material.opacity = a.op * (0.75 + 0.25 * Math.sin(t * 1.6 + a.ph)); }));
    YV.add(m); YV.userData.mesh = m; }); }
const KID_POSES = ['idle', 'walk', 'run', 'scared', 'cheer', 'point', 'wow', 'hold', 'sit'], KID_FACES = ['auto', 'happy', 'scared', 'surprised', 'determined', 'sad'];
const R = n => 'lab/ref/' + n;
const CAST = [
  { id: 'leo', name: 'Leo', o: kids.leo, poses: KID_POSES, faces: true, h: 1.55, ref: [R('kids.jpg')], note: 'Sleeves/trousers in olive & green, curly dark hair. Story: the older boy, brave, a bit bossy.' },
  { id: 'mia', name: 'Mia', o: kids.mia, poses: KID_POSES, faces: true, h: 1.5, ref: [R('kids.jpg')], note: 'Pink overalls, yellow pigtails with pink bobbles. Story: kind, clever.' },
  { id: 'toby', name: 'Toby', o: kids.toby, poses: ['idle', 'run', 'wag', 'bark', 'sit'], h: 0.75, ref: [R('kids.jpg')], note: 'Golden puppy, red collar.' },
  { id: 'varn', name: 'Varn', v: V, h: 3.2, scale: 1, ref: [R('varn.jpg')], poses: ['swim', 'glide', 'still'], note: 'Giant guardian: teal scales, purple frills, glowing eyes. The sculpted model (varn.glb).' },
  { id: 'yvarn', name: 'Young Varn', v: V2, h: 1.4, scale: 3.2, yv: true, ref: [R('yvarn.jpg')], poses: ['swim', 'glide', 'still'], note: 'Its own sculpt (rounder, friendlier), painted with grown Varn\'s own colour palette, glowing rune lines and spine crystals (turquoise to blue to violet), eyes painted onto the eyeballs, and the tail fin turned flat like a whale fluke.' },
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
  place(cur, 0, 0, cur.id === 'varn' ? 0 : 0.3); ring.visible = true;
  $('#side').style.display = '';
  const h = cur.h, tgt = [cur.yv ? 0.5 : 0, cur.yv ? 0.55 : cur.v ? 1.9 : h * 0.5, cur.yv ? 0.5 : 0];
  if (cur.id === 'varn') { tgt[0] = 3; tgt[1] = 2.4; cam([3, 6, 38], tgt); } else if (cur.yv) cam([2.4, 1.2, 3.6], tgt); else cam([h * 1.0, h * 0.7 + 0.4, h * 2.3 + 1.2], tgt); ctl.target.set(...tgt);
  $('#nm').textContent = cur.name; $('#note').textContent = cur.note;
  $('#refs').innerHTML = cur.ref.map(r => `<img src="${r}" alt="story art" onerror="this.style.display='none'">`).join('') + '<small>Story art (reference)</small>';
  const pr = $('#pr'); pr.innerHTML = '<b>Pose</b>'; cur.poses.forEach((p, i) => { const b = btn(pr, p, b => { sel(pr, b); (cur.o || cur.v).pose && (cur.o || cur.v).pose(p); }); if (i === 0) b.classList.add('on'); }); (cur.o || cur.v).pose && (cur.o || cur.v).pose(cur.poses[0]);
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
window.__lab = { show, lineup, CAST, ctl, cam, V, SHOW, YU, setYT: v => { yT = v; } };

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
