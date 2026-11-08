// Episode 6 — The Old Man. Stops 16–18, told in the present tense like Frank's text, staged from the storybook's page-6 panels.
// One place for the whole episode: the gray beach, the misty wood behind it, and the old man's camp in a clearing.
import { S, save, sfx, wait, h, shuffle } from './core.js';
import { THREE, setCam, flyCam, followCam, stopFollow, tween, moveTo, onTick, sparkles, textTexture, cut, dolly, quake, toon, scene, camera, builder } from './gfx.js';
import { buildGrayShore, visionBubble, FIRE } from './sets6.js';
import { letterbox, frost, shardBurst, fogThicken, glowSprite } from './effects.js';
import { tell, beat, seq, tapOn, filled, hideStory, chooseWord, pick3D, spellOn, order, think, offerStretch, earnCard, toby as tobyTip, MODE } from './ui.js';
import { playMusic } from './music.js';

const star = n => { S.stars[n] = 1; save(); sfx('great'); };
const visits = n => (S.stops[n] && S.stops[n].visits) || 0;
const finish = n => { const v = visits(n) + 1; S.stops[n] = Object.assign(S.stops[n] || {}, { done: 1, t: Date.now(), visits: v }); if (MODE.captain && MODE.perfect) { S.captain = S.captain || {}; S.captain[n] = 1; } save(); };
const pickV = (n, pool) => pool[visits(n) % pool.length];
const fadeIn = (col = '#0A0C10', ms = 1400) => { const v = h('div', { class: 'veil', style: { background: col } }); document.body.append(v); setTimeout(() => { v.classList.add('out'); setTimeout(() => v.remove(), ms); }, 200); };
// ---- little staging helpers
const lie = (G, c, x, z, ry, y = 0.26) => { c.g.rotation.order = 'YXZ'; c.g.rotation.set(-Math.PI / 2, ry, 0); c.g.position.set(x, G.hf(x, z) + y, z); c.pose('idle'); };
const stand = (G, c, x, z, ry = 0) => { c.g.rotation.order = 'YXZ'; c.g.rotation.set(0, ry, 0); c.g.position.set(x, G.hf(x, z), z); };
const faceTo = (c, p) => { c.g.rotation.y = Math.atan2(p.x - c.g.position.x, p.z - c.g.position.z); };
const walk = async (G, c, x, z, ms, pose = 'walk') => { c.pose(pose); await moveTo(c.g, [x, G.hf(x, z), z], ms); c.pose('idle'); };
const hitOn = (c, r = 0.8, y = 0.6) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), new THREE.MeshBasicMaterial({ visible: false })); m.position.y = y; c.g.add(m); return m; };
// a steaming bowl of soup in someone's hands
function bowlIn(c, { x = 0, y = -0.62, z = 0.18 } = {}) { const g = new THREE.Group(); g.position.set(x, y, z); c.AR.add(g);
  const b = new THREE.Mesh(new THREE.LatheGeometry([[0, 0], [0.1, 0.01], [0.15, 0.07], [0.16, 0.1]].map(([a, b2]) => new THREE.Vector2(a, b2)), 16), toon(0x8A5A36, { side: THREE.DoubleSide })); g.add(b);
  const s = new THREE.Mesh(new THREE.CircleGeometry(0.14, 14), toon(0xD9944E)); s.rotation.x = -Math.PI / 2; s.position.y = 0.085; g.add(s);
  const st = glowSprite(0xF4F6F8, 0.35, 0.3); g.add(st); onTick(t => { const k = (t * 0.6) % 1; st.position.y = 0.15 + k * 0.5; st.material.opacity = 0.3 * Math.sin(k * Math.PI); }); return g; }
// "z z z" floating up from a sleeper
function zzz(w, at) { const tex = textTexture('z', { w: 128, h: 128, font: '90px Chewy, sans-serif', fg: '#EEF3F6' }); const zs = [0, 1, 2].map(i => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false })); w.add(s); s.userData.ph = i / 3; return s; });
  const off = onTick(t => zs.forEach(s => { const k = (t * 0.35 + s.userData.ph) % 1; s.position.set(at.x + k * 0.5, at.y + 0.3 + k * 1.2, at.z); s.scale.setScalar(0.18 + k * 0.25); s.material.opacity = Math.sin(k * Math.PI); }));
  return () => { off(); zs.forEach(s => w.remove(s)); }; }
// a splash of water: droplets thrown up and falling back, and a ring of foam
function splashUp(w, at) { const m = new THREE.MeshBasicMaterial({ color: 0xF2FAFF }), drops = [];
  for (let i = 0; i < 46; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(0.05 + Math.random() * 0.08, 6, 5), m); d.position.copy(at); w.add(d); const a = Math.random() * 6.28, sp = 1 + Math.random() * 2.2; d.userData.v = new THREE.Vector3(Math.cos(a) * sp, 3 + Math.random() * 3.5, Math.sin(a) * sp); drops.push(d); }
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.5, 0.8, 32), new THREE.MeshBasicMaterial({ color: 0xF2FAFF, transparent: true, opacity: 0.9, side: THREE.DoubleSide })); ring.rotation.x = -Math.PI / 2; ring.position.copy(at).setY(0); w.add(ring);
  const t0 = performance.now(); const off = onTick((t, dt) => { const k = (performance.now() - t0) / 1000; drops.forEach(d => { d.userData.v.y -= 12 * (dt || 0.016); d.position.addScaledVector(d.userData.v, dt || 0.016); d.visible = d.position.y > -0.2; });
    ring.scale.setScalar(1 + k * 3); ring.material.opacity = Math.max(0, 0.9 - k * 0.8); if (k > 1.6) { off(); drops.forEach(d => w.remove(d)); w.remove(ring); } }); }
// shivering in the cold
const shiver = c => onTick(t => { c.g.rotation.z = Math.sin(t * 40) * 0.015; });

// ================================================================ stop 16 — the gray shore
export async function stop16() {
  playMusic('cave');
  const G = buildGrayShore(), { leo, mia, toby: dog, w } = G;
  // as in the panel: the two of them lying on the gray sand, Toby standing over Mia, the boat stuck on the rocks behind
  lie(G, leo, -1.6, 1.4, -0.35); lie(G, mia, 1.0, 1.2, 0.3); leo.forceFace = 'blink'; mia.forceFace = 'blink';
  const mHead = new THREE.Vector3(1.0 - Math.sin(0.3) * 0.95, 0.35, 1.2 - Math.cos(0.3) * 0.95);
  stand(G, dog, mHead.x + 0.75, mHead.z - 0.2, -1.9); dog.pose('wag');
  cut([mHead.x + 2.6, 2.4, mHead.z + 3.4], [mHead.x - 0.6, 0.3, mHead.z - 0.4], 46); fadeIn();
  dolly([mHead.x + 2.0, 1.9, mHead.z + 2.6], [mHead.x - 0.4, 0.3, mHead.z - 0.2], 9000);
  // Toby licks her face (his head dips again and again)
  let licking = true; const lick = onTick(t => { if (licking) { dog.g.position.y = G.hf(dog.g.position.x, dog.g.position.z) + Math.max(0, Math.sin(t * 7)) * 0.06; dog.g.rotation.x = Math.max(0, Math.sin(t * 7)) * 0.25; } });
  await beat('Mia slowly opens her eyes.', { hold: 300 }); mia.forceFace = null; mia.pose('wow');
  sfx('pop'); await beat('She feels something warm and wet on her face.');
  await flyCam([mHead.x + 2.6, 1.7, mHead.z + 2.4], [mHead.x + 0.3, 0.4, mHead.z], 1200);
  dog.pose('bark'); sfx('bark'); await beat('It is Toby! He is licking her cheeks to wake her up.');
  licking = false; lick(); dog.g.rotation.x = 0; dog.pose('wag');
  // she sits up; the camera pulls back into the fog
  await tween(1000, e => { mia.g.rotation.x = -Math.PI / 2 * (1 - e); mia.g.position.y = G.hf(1, 1.2) + 0.26 * (1 - e) - 0.36 * e; }); mia.pose('sit');
  flyCam([5.5, 2.6, 7.5], [0.4, 0.6, -2], 2600); await beat('Mia sits up in the sand.');
  // ---- fog: the letters drift by on puffs of mist
  const sp = pickV(16, [
    { word: 'fog', decoys: 'dlk', prompt: 'Tap the puffs of mist to spell the word. It is a low, gray cloud.', hints: ['It rhymes with frog.', 'F – O – G'] },
    { word: 'fog', decoys: 'gbs', prompt: 'Tap the puffs to spell the word. You can hardly see through it!', hints: ['f… o… g…', 'F – O – G'] },
    { word: 'fog', decoys: 'hrt', prompt: 'Tap the puffs to spell the word: thick white ___.', hints: ['It starts with f.', 'F – O – G'] },
  ]);
  tell('They are on a quiet, gray beach with thick white {fog}.', { wait: false });
  const puffs = []; const n = sp.word.length + sp.decoys.length;
  for (let i = 0; i < n; i++) { const o = new THREE.Object3D(); const a = -0.9 + i / (n - 1) * 1.8; o.position.set(1 + Math.sin(a) * 4.2, 1.4 + (i % 2) * 0.7, -1.5 - Math.cos(a) * 1.6); w.add(o); const s = glowSprite(0xF4F7F9, 1.6, 0.55); o.add(s); o.userData.ph = i; puffs.push(o); }
  const drift = onTick(t => puffs.forEach(o => { o.position.y += Math.sin(t * 1.2 + o.userData.ph) * 0.002; }));
  await spellOn({ prompt: sp.prompt, word: sp.word, decoys: sp.decoys, objs: puffs, hints: sp.hints });
  drift(); puffs.forEach(o => w.remove(o)); await filled('fog'); await earnCard('fog');
  // ---- Leo is still asleep
  const zOff = zzz(w, new THREE.Vector3(-1.6 + Math.sin(0.35) * 0.95, 0.4, 1.4 - Math.cos(0.35) * 0.95));
  await flyCam([-3.4, 1.6, 3.4], [-1.6, 0.3, 1.0], 1400); await beat('Leo is still fast asleep.');
  // ---- she gets up, looks out to sea and gasps: the boat is stuck on the rocks
  mia.pose('idle'); await tween(500, e => { mia.g.position.y = G.hf(1, 1.2) - 0.36 * (1 - e); }); faceTo(mia, G.RK); mia.pose('wow'); sfx('whoosh'); stand(G, dog, -0.1, 1.7); faceTo(dog, G.RK); dog.pose('sit');   // (Toby sits beside her, looking out too)
  cut([2.4, 1.9, 3.6], [3.4, 0.6, -10], 46); dolly([2.0, 1.8, 3.0], [3.8, 0.8, -12], 7000);
  await beat('Mia looks out at the cold sea and gasps.');
  await pick3D({ prompt: 'Where is their boat? Tap it!', answer: 'boat', targets: [{ id: 'boat', obj: G.boatHit }, { id: 'wreck', obj: G.wreck }], hints: ['It has their pirate flag.', 'Look at the sharp rocks, not far away.'], onWrong: () => tobyTip('That is an old ship, far out in the fog. Ours is closer!') });
  await flyCam([G.RK.x + 6, 2.6, G.RK.z + 9], [G.RK.x, 0.6, G.RK.z], 1600);
  await tell('Their small wooden boat is stuck on sharp rocks not far in the water.');
  // ---- cold, hungry, and no way home
  const sh = shiver(mia); mia.pose('hug'); cut([3.4, 1.5, 4.6], [0.6, 0.9, 1.2], 44);
  tell('They are cold and hungry, and their only way home is trapped.', { wait: false });
  await think(pickV(16, [
    { prompt: 'Why is their “only way home” trapped?', options: ['The boat is stuck on the rocks.', 'The boat sank to the bottom.', 'They lost the map home.'], answer: 'The boat is stuck on the rocks.', hints: ['What is their way home? Where is it?'] },
    { prompt: 'What is their only way home?', options: ['Their little wooden boat', 'A long bridge', 'A big airplane'], answer: 'Their little wooden boat', hints: ['They sailed here in it.'] },
    { prompt: 'How do Mia and Leo feel?', options: ['Cold and hungry', 'Warm and full', 'Sleepy and bored'], answer: 'Cold and hungry', hints: ['Read the last line again.'] },
  ]));
  sh(); mia.g.rotation.z = 0;
  if (await offerStretch('Words that rhyme with cold.')) {
    await chooseWord(pickV(16, [
      { prompt: 'Bonus! Which word rhymes with cold?', sentence: 'The sea is {_}.', tiles: ['cold', 'cool', 'cloud'], answer: 'cold', note: 'cold · gold · told · old', hints: ['Listen for -old.'] },
      { prompt: 'Bonus! Which word rhymes with cold?', sentence: 'Pirates hide their {_}.', tiles: ['gold', 'good', 'goat'], answer: 'gold', note: 'cold · gold · told · old', hints: ['-old, like cold.'] },
      { prompt: 'Bonus! Which word rhymes with cold?', sentence: 'The man is very {_}.', tiles: ['old', 'odd', 'oak'], answer: 'old', note: 'cold · gold · told · old', hints: ['It sounds like c-old without the c.'] },
    ]));
    star(16);
  }
  zOff(); hideStory(); finish(16);
}

// ================================================================ stop 17 — the old man's fire
export async function stop17() {
  playMusic('cave');
  const G = buildGrayShore(), { leo, mia, toby: dog, man, w } = G;
  lie(G, leo, -1.6, 1.4, -0.35); leo.forceFace = 'blink'; stand(G, mia, 1.0, 1.4, 0.4); stand(G, dog, 0.2, 2.4, 0);
  const zOff = zzz(w, new THREE.Vector3(-1.6 + Math.sin(0.35) * 0.95, 0.4, 1.4 - Math.cos(0.35) * 0.95));
  // the old man by his fire, hood up, staff beside him
  const C = G.camp.position, ST = C.clone().add(G.STUMP), SE = C.clone().add(G.SEAT);
  man.g.visible = true; man.g.position.set(ST.x, C.y - 0.42, ST.z); man.pose('sit');   // (hips on the stump) faceTo(man, C);
  cut([4, 1.9, 7], [0.4, 1.2, 10], 48); fadeIn('#C4CDD1', 900);
  // ---- Toby sniffs the air and runs for the trees
  dog.pose('idle'); const sniff = onTick(t => { dog.g.rotation.x = -0.25 + Math.sin(t * 14) * 0.06; });
  await beat('Toby sniffs the wet air and runs to the dark trees.', { min: 1800 }); sniff(); dog.g.rotation.x = 0;
  dog.pose('run'); moveTo(dog.g, [1.2, G.hf(1.2, 10), 10], 1500); sfx('bark');
  // ---- wake Leo up
  tell('Mia wakes Leo up, and they follow Toby into the trees.', { wait: false });
  await flyCam([-0.4, 2.4, 4.2], [-1.4, 0.3, 1.2], 1200);
  const leoHit = hitOn(leo, 0.9, 0); mia.pose('point');
  await pick3D({ prompt: 'Help Mia wake Leo up. Tap him!', answer: 'leo', targets: [{ id: 'leo', obj: leoHit }], hints: ['He is asleep on the sand.'] });
  leo.g.remove(leoHit); zOff(); leo.forceFace = null; sfx('pop');
  await tween(900, e => { leo.g.rotation.x = -Math.PI / 2 * (1 - e); leo.g.position.y = G.hf(-1.6, 1.4) + 0.26 * (1 - e); }); leo.pose('wow');
  // ---- into the wood, along the path
  const P = G.pathCurve; let u = 0.02; const pp = new THREE.Vector3(), tg = new THREE.Vector3(), cam = new THREE.Vector3(), look = new THREE.Vector3();
  const place = () => { P.getPointAt(Math.min(1, u), pp); P.getTangentAt(Math.min(1, u), tg); const side = new THREE.Vector3(tg.z, 0, -tg.x);
    [[mia, 0.5, 0], [leo, -0.5, -0.6]].forEach(([c, s, b]) => { const q = pp.clone().addScaledVector(side, s).addScaledVector(tg, b); c.g.position.set(q.x, G.hf(q.x, q.z), q.z); c.g.rotation.y = Math.atan2(tg.x, tg.z); });
    const d = pp.clone().addScaledVector(tg, 2.2); dog.g.position.set(d.x, G.hf(d.x, d.z), d.z); dog.g.rotation.y = Math.atan2(tg.x, tg.z); };
  [mia, leo].forEach(c => c.pose('walk')); dog.pose('run'); place();
  followCam(() => { cam.copy(pp).addScaledVector(tg, -5).add(new THREE.Vector3(tg.z * 2, 2.6, -tg.x * 2)); look.copy(pp).addScaledVector(tg, 5).setY(pp.y + 1.2); return [cam, look]; });
  await tween(4200, e => { u = 0.02 + e * 0.26; place(); });
  // ---- the fork: which way did Toby go? (his paw prints run to the glow)
  [mia, leo].forEach(c => c.pose('idle')); dog.pose('sit'); stopFollow();
  tell('Soon, they see a fire glowing in the woods.', { wait: false });
  await flyCam([G.FORK.x + 1, G.hf(G.FORK.x, G.FORK.z) + 3.4, G.FORK.z - 4], [G.FORK.x - 0.6, 0.8, G.FORK.z + 8], 1400);
  await pick3D({ prompt: 'Which way did Toby go? Follow his paw prints to the glow!', answer: 'prints', targets: G.forks.map(f => ({ id: f.userData.id, obj: f })), hints: ['Look for little paw prints on the ground.', 'The prints go towards the orange light.'], onWrong: () => tobyTip('No paw prints that way… and no light!') });
  [mia, leo].forEach(c => c.pose('walk')); dog.pose('run');
  followCam(() => { cam.copy(pp).addScaledVector(tg, -5).add(new THREE.Vector3(tg.z * 2, 2.6, -tg.x * 2)); look.copy(pp).addScaledVector(tg, 5).setY(pp.y + 1.2); return [cam, look]; });
  await tween(4600, e => { u = 0.28 + e * 0.6; place(); });
  stopFollow(); const F = C.clone();
  // they step out of the trees into the clearing: seen over their shoulders, the old man by his fire
  stand(G, mia, F.x + 1.0, F.z - 3.6); stand(G, leo, F.x - 0.4, F.z - 3.9); stand(G, dog, F.x + 0.3, F.z - 2.9); [mia, leo, dog].forEach(c => { c.g.position.y = F.y; faceTo(c, ST); c.pose('idle'); }); mia.pose('wow');
  cut([F.x + 1.6, F.y + 2.0, F.z - 7.4], [F.x - 0.8, F.y + 1.0, F.z], 46); dolly([F.x + 1.3, F.y + 1.8, F.z - 6.6], [F.x - 0.9, F.y + 1.0, F.z], 8000);
  await beat('An old man wearing a dirty coat sits by the fire.', { min: 2400 });
  // ---- kind: he smiles and hands out bowls of soup
  man.forceFace = 'kind'; faceTo(man, mia.g.position);
  const kv = pickV(17, [
    { prompt: 'Which word fits?', tiles: ['kind', 'kid', 'mean'], note: 'kind = nice and caring to others', hints: ['A smile that is nice and caring.', 'k – i – n – d'] },
    { prompt: 'Which word means nice and caring?', tiles: ['kind', 'cold', 'grumpy'], note: 'kind = nice and caring', hints: ['Is a soup-giving smile cold or kind?'] },
    { prompt: 'Which word is spelled right?', tiles: ['kind', 'kined', 'kynd'], note: 'kind has a long i, like find', hints: ['It rhymes with find.', 'k – i – n – d'] },
  ]);
  tell('He gives them a {kind} smile and hands them bowls of hot soup.', { wait: false });
  await chooseWord({ prompt: kv.prompt, sentence: 'He gives them a {_} smile.', tiles: kv.tiles, answer: 'kind', note: kv.note, hints: kv.hints });
  await filled('kind'); await earnCard('kind');
  // they sit on the log with their bowls; Toby lies down by the fire
  stand(G, mia, SE.x + 0.5, SE.z - 0.3); stand(G, leo, SE.x - 0.4, SE.z + 0.35); [mia, leo].forEach(c => { c.g.position.y = C.y - 0.04; faceTo(c, C); c.pose('sit'); bowlIn(c); c.AR.rotation.x = -1.0; });
  stand(G, dog, SE.x + 0.6, SE.z - 1.6); dog.g.position.y = C.y; faceTo(dog, C); dog.pose('sit');
  const mb = bowlIn(man); man.AR.rotation.x = -1.0;
  cut([F.x + 0.3, F.y + 1.9, F.z - 6.4], [F.x, F.y + 0.8, F.z + 0.3], 50); dolly([F.x + 0.2, F.y + 1.7, F.z - 5.8], [F.x, F.y + 0.8, F.z + 0.3], 9000);
  await beat('As they eat and warm their hands, he listens to their story.');
  const nod = onTick(t => { man.head.rotation.x = Math.max(0, Math.sin(t * 3)) * 0.25; });
  await tell('He nods and says he will walk with them to help them get their boat back.'); nod(); man.head.rotation.x = 0;
  await order({ prompt: 'Put what happened in order.', compact: true, items: ['Toby runs to the dark trees.', 'Mia wakes Leo up.', 'They see a fire in the woods.', 'The old man gives them soup.'], hints: ['What did Toby do first?', 'The soup comes last.'] });
  if (await offerStretch('Another word for kind.')) {
    await think(pickV(17, [
      { prompt: 'Bonus! Which word means almost the same as kind?', options: ['friendly', 'angry', 'sleepy'], answer: 'friendly', hints: ['A kind person is nice to you.'] },
      { prompt: 'Bonus! Which is the OPPOSITE of kind?', options: ['mean', 'nice', 'gentle'], answer: 'mean', hints: ['Opposite means the other way.'] },
      { prompt: 'Bonus! Which one shows he is kind?', options: ['He gives them hot soup.', 'He wears a dirty coat.', 'He sits by a fire.'], answer: 'He gives them hot soup.', hints: ['What does he DO for them?'] },
    ]));
    star(17);
  }
  hideStory(); finish(17);
}

// ================================================================ stop 18 — the secret, and the stolen boat
export async function stop18() {
  playMusic('danger');
  const G = buildGrayShore(), { leo, mia, toby: dog, man, w, boat } = G;
  man.g.visible = true;
  // ---- they walk back along the path from the woods to the shore together (panel 3: the kids, the old man, Toby)
  const P = G.pathCurve; let u = 0.62; const pp = new THREE.Vector3(), tg = new THREE.Vector3(), cam = new THREE.Vector3(), look = new THREE.Vector3();
  const place = () => { P.getPointAt(u, pp); P.getTangentAt(u, tg); tg.negate(); const side = new THREE.Vector3(tg.z, 0, -tg.x);
    [[leo, -1.0, 0], [mia, -0.4, 0.3], [man, 0.5, 0.6], [dog, 1.3, 1.0]].forEach(([c, s, f]) => { const q = pp.clone().addScaledVector(side, s).addScaledVector(tg, f); c.g.position.set(q.x, G.hf(q.x, q.z), q.z); c.g.rotation.y = Math.atan2(tg.x, tg.z); }); };
  [leo, mia, man].forEach(c => c.pose('walk')); dog.pose('run'); place();
  // seen from in front, a little to the side, so all four faces show as they come down the path (the mist thins while they walk)
  followCam(() => { const side = new THREE.Vector3(tg.z, 0, -tg.x); cam.copy(pp).addScaledVector(side, 3.6).addScaledVector(tg, 6.5).setY(pp.y + 2.2); look.copy(pp).addScaledVector(side, 0.1).setY(pp.y + 1.0); return [cam, look]; });
  { const p0 = P.getPointAt(u), t0 = P.getTangentAt(u).negate(), s0 = new THREE.Vector3(t0.z, 0, -t0.x); camera.position.copy(p0).addScaledVector(s0, 3.6).addScaledVector(t0, 6.5).setY(p0.y + 2.2); }
  G.fogA.show(0.3, 600); G.fogB.show(0.3, 600); fadeIn('#C4CDD1', 900);
  const walking = tween(16000, e => { u = 0.62 - e * 0.5; place(); });
  await beat('They walk together from the woods to the shore.');
  man.pose('talk'); await beat('On the way, the old man tells them a secret.');
  man.forceFace = 'angry'; frost(0.2, 1500); await beat('“Varn is not a true guard!” he says in a low, angry voice.');
  // ---- greedy
  const gv = pickV(18, [
    { prompt: 'Which word fits?', tiles: ['greedy', 'gentle', 'grassy'], note: 'greedy = always wanting more for yourself', hints: ['Someone who wants everything for himself.', 'g – r – ee – d – y'] },
    { prompt: 'Which word is spelled right?', tiles: ['greedy', 'gready', 'greedie'], note: 'greedy has ee in the middle', hints: ['ee, like in see.', 'g – r – ee – d – y'] },
    { prompt: 'Which word means wanting MORE and MORE?', tiles: ['greedy', 'sleepy', 'friendly'], note: 'greedy = always wanting more', hints: ['Not sharing anything.'] },
  ]);
  tell('“He is a {greedy} beast!”', { wait: false });
  await chooseWord({ prompt: gv.prompt, sentence: '“He is a {_} beast!”', tiles: gv.tiles, answer: 'greedy', note: gv.note, hints: gv.hints });
  await filled('greedy'); await earnCard('greedy');
  // ---- his story, in a thought bubble over his head (Varn clutching the gems, the pirate ship beside him)
  await walking; [leo, mia, man].forEach(c => c.pose('idle')); dog.pose('idle'); stopFollow(); G.fogA.show(1, 3000); G.fogB.show(1, 3000);
  const VB = visionBubble(w); const hp = man.g.position.clone().add(new THREE.Vector3(0, 4.4, 0));
  const bb = onTick(() => { VB.group.position.copy(man.g.position).add(new THREE.Vector3(0, 4.5, 0)); VB.group.quaternion.copy(camera.quaternion); });
  man.pose('talk'); faceTo(man, mia.g.position);
  { const side = new THREE.Vector3(tg.z, 0, -tg.x); const c0 = man.g.position.clone().addScaledVector(side, -8).addScaledVector(tg, 1).setY(hp.y - 1.6); cut(c0.toArray(), hp.clone().setY(hp.y - 1.2).toArray(), 52); }
  VB.show(true); sfx('glow');
  await beat('“Long ago, that monster stole those gems from brave sailors like me.”', { hold: 800 });
  await beat('“I was trapped in this beach for years.”');
  await beat('“I have no boat, but I want my gems back.”', { hold: 400 });
  VB.show(false);
  // ---- Mia knows it is a lie
  mia.forceFace = 'determined'; { const m = mia.g.position, ry = mia.g.rotation.y, fx = Math.sin(ry), fz = Math.cos(ry); cut([m.x + fx * 2.3 + fz * 0.8, m.y + 1.3, m.z + fz * 2.3 - fx * 0.8], [m.x, m.y + 1.05, m.z], 40); }
  await beat('Mia knows this is a lie.');
  tell('She knows that the gems grow in the cave, but she does not say a word.', { wait: false });
  await think(pickV(18, [
    { prompt: 'Which part of the old man’s story is a LIE?', options: ['Varn stole the gems from sailors.', 'The gems grow in the cave.', 'They walked to the shore.'], answer: 'Varn stole the gems from sailors.', hints: ['Where do the gems really come from?'] },
    { prompt: 'How does Mia know he is lying?', options: ['She knows the gems grow in the cave.', 'He has a dirty coat.', 'Toby told her.'], answer: 'She knows the gems grow in the cave.', hints: ['Read the last line again.'] },
    { prompt: 'Why does Mia not say a word?', options: ['She wants to be careful with him.', 'She is too sleepy.', 'She cannot talk.'], answer: 'She wants to be careful with him.', hints: ['Can they trust him now?'] },
  ]));
  bb(); mia.forceFace = null; man.forceFace = 'kind';
  // ---- at the water: push the boat off the rocks (three good pushes)
  const B = boat.g, RK = G.RK; const wade = [[leo, -1.4, 1.6], [mia, -0.2, 1.9], [man, 1.4, 1.7]];
  wade.forEach(([c, dx, dz]) => { c.g.position.set(RK.x + dx, G.hf(RK.x + dx, RK.z + dz), RK.z + dz); faceTo(c, B.position); c.pose('reach'); });
  dog.g.position.set(RK.x - 2.4, G.hf(RK.x - 2.4, RK.z + 3), RK.z + 3); dog.pose('wag');
  cut([RK.x - 4.5, 2.6, RK.z + 8], [RK.x + 0.2, 0.5, RK.z + 0.6], 48);
  tell('They push hard on the boat and set it free!', { wait: false });
  for (let i = 1; i <= 3; i++) {
    await pick3D({ prompt: `Push the boat! (${i} / 3)`, answer: 'boat', targets: [{ id: 'boat', obj: G.boatHit }], hints: ['Tap the boat.'] });
    sfx('clack'); quake(0.2, 0.06); const z0 = B.position.z; await tween(350, e => { B.position.z = z0 - e * 0.35; B.rotation.z = -0.2 * (1 - i / 3) + Math.sin(e * Math.PI) * 0.05; });
  }
  sfx('whoosh'); await tween(900, e => { B.rotation.set(0.1 * (1 - e), 0.25, 0); B.position.y = 0.1 + 0.05 * e; });
  // the kids and Toby climb in; the old man keeps hold of the side
  [leo, mia, dog].forEach(c => c.g.visible = false); const k = boat.cast; [k.leo, k.mia, k.toby].forEach(c => c.g.visible = true);
  k.leo.g.position.set(-0.3, 0.45, 0.2); k.mia.g.position.set(0.3, 0.45, -0.1); k.toby.g.position.set(0.15, 0.85, -0.5); k.toby.g.scale.setScalar(0.9);   // (Toby up at the front, out of the way of the close-ups; he leaps from there)
  // he stands in the shallows at the back of the boat (the beach side), both hands on it
  const grip = new THREE.Vector3(0.3, 0, 1.55); man.g.rotation.order = 'YXZ'; const holdOn = onTick(() => { const p = B.localToWorld(grip.clone()); man.g.position.set(p.x, G.hf(p.x, p.z), p.z); faceTo(man, B.position); });
  man.pose('reach');
  cut([RK.x - 3, 2.2, RK.z + 7], [RK.x + 0.8, 0.9, RK.z + 0.4], 46);
  await beat('But the man does not let go.');
  // ---- his kind smile is gone: the hood comes off (panel 4)
  man.forceFace = 'sly'; man.hood(true); sfx('rumble'); playMusic('danger');
  // close on his face, from the boat's side of him (the gray beach behind him)
  { const hp2 = man.g.position.clone().add(new THREE.Vector3(0, 1.7, 0)), fd = B.position.clone().sub(man.g.position).setY(0).normalize(), sd = new THREE.Vector3(fd.z, 0, -fd.x);
    const c2 = hp2.clone().addScaledVector(fd, 1.5).addScaledVector(sd, 1.1).add(new THREE.Vector3(0, 0.1, 0)); cut(c2.toArray(), hp2.toArray(), 42); dolly(c2.clone().addScaledVector(fd, -0.35).toArray(), hp2.toArray(), 5000); }
  await beat('His kind smile is gone.', { min: 2200 });
  await beat('“Thank you for my new ship, kids,” he says with a cold laugh.');
  await beat('“I am not taking you home.');
  // ---- treasure
  const tv = pickV(18, [
    { prompt: 'Which word fits?', tiles: ['treasure', 'tractor', 'teacher'], note: 'treasure = gold, gems and other precious things', hints: ['Gold and gems!', 't – r – ea – s – ure'] },
    { prompt: 'Which word is spelled right?', tiles: ['treasure', 'treshure', 'treasur'], note: 'trea-sure: the ea sounds like the e in bed', hints: ['It ends in -sure.'] },
    { prompt: 'What does the old man really want?', tiles: ['treasure', 'soup', 'friends'], note: 'treasure = gold and gems', hints: ['He wants all the gems in the cave.'] },
  ]);
  tell('I am sailing back to the cave to take all the {treasure}!”', { wait: false });
  await chooseWord({ prompt: tv.prompt, sentence: 'take all the {_}!', tiles: tv.tiles, answer: 'treasure', note: tv.note, hints: tv.hints });
  await filled('treasure'); await earnCard('treasure');
  // ---- he tries to climb in — Toby jumps, bites his coat and pulls him into the water. SPLASH!
  letterbox(true); holdOn();
  { const bp = B.position; cut([bp.x - 3.6, 2.3, bp.z + 5.2], [bp.x + 0.1, 0.9, bp.z + 1.0], 50); }
  const climbing = beat('He tries to climb inside, but Toby jumps, bites the man’s coat, and pulls him in the water.');
  const m0 = man.g.position.clone(), away = m0.clone().sub(B.position).setY(0).normalize(); man.pose('reach'); await tween(900, e => { man.g.position.copy(m0).lerp(B.position.clone().setY(m0.y + 0.5), e * 0.3); man.g.rotation.x = 0.35 * e; });
  // Toby leaps at him and grabs the coat
  const T = k.toby.g, tw0 = T.getWorldPosition(new THREE.Vector3()); B.remove(T); w.add(T); T.position.copy(tw0); sfx('bark');
  const coat = man.g.position.clone().add(new THREE.Vector3(0, 1.2, 0));
  await tween(500, (e, kk) => { T.position.lerpVectors(tw0, coat, e); T.position.y += Math.sin(kk * Math.PI) * 0.8; }); k.toby.pose('bark');
  // and down he goes, backwards into the water
  const m1 = man.g.position.clone();
  // (falls over backwards, away from the boat, Toby still hanging on to the coat)
  await tween(900, (e, kk) => { man.g.rotation.x = 0.35 - 1.75 * e; man.g.position.copy(m1).addScaledVector(away, e * 1.4).setY(m1.y - e * 0.9); T.position.copy(man.g.position).addScaledVector(away, -0.45).setY(man.g.position.y + 1.0 - e * 0.4); });
  sfx('crash'); quake(0.5, 0.12); splashUp(w, man.g.position.clone().setY(-0.1)); sparkles(man.g.position.clone().setY(0.4), 0xF2FAFF, 50);
  await climbing; await beat('*SPLASH!*', { min: 1200 });
  // Leo pulls Toby back inside the boat
  k.leo.pose('reach'); const tp = T.position.clone();
  await beat('Leo pulls Toby back inside the boat.');
  await tween(800, (e, kk) => { const to = B.localToWorld(new THREE.Vector3(0, 0.85, 0.6)); T.position.lerpVectors(tp, to, e); T.position.y += Math.sin(kk * Math.PI) * 0.6; });
  w.remove(T); B.add(T); T.position.set(0, 0.85, 0.6); k.toby.pose('wag'); k.leo.pose('hold'); k.mia.pose('hold');
  // the boat drifts away into the fog; the old man stands up in the water, shaking his fist
  man.g.rotation.x = 0; man.g.position.y = G.hf(man.g.position.x, man.g.position.z) - 0.2; man.pose('point');
  boat.wind.k = 0.7; const bz = B.position.clone();
  // (from the beach, looking out through the gap between the two rocks: the old man in the shallows, the boat going away into the fog)
  cut([RK.x + 1.5, 3.2, RK.z + 9], [RK.x - 1.2, 0.8, RK.z - 8], 48); dolly([RK.x + 1.3, 3.0, RK.z + 8], [RK.x - 2, 0.8, RK.z - 10], 7000);
  tween(7000, e => { B.position.set(bz.x - e * 3, 0.1 + Math.sin(e * 20) * 0.05, bz.z - e * 16); });
  fogThicken(scene, { near: 8, far: 40, ms: 6000 }); await wait(4200);
  if (await offerStretch('How did he change?')) {
    await chooseWord(pickV(18, [
      { prompt: 'Bonus! Which word fits?', sentence: 'At first he seemed {_}, but really he was greedy.', tiles: ['kind', 'wet', 'small'], answer: 'kind', hints: ['How did he seem at the fire?'] },
      { prompt: 'Bonus! Which word fits?', sentence: 'He seemed kind, but really he was {_}.', tiles: ['greedy', 'gentle', 'happy'], answer: 'greedy', hints: ['He wants ALL the treasure.'] },
      { prompt: 'Bonus! Which word fits?', sentence: 'His {_} smile was gone.', tiles: ['kind', 'kid', 'kite'], answer: 'kind', hints: ['k – i – n – d'] },
    ]));
    star(18);
  }
  hideStory(); letterbox(false); finish(18);
  const cont = h('div', { class: 'tbc' }, h('div', {}, 'To be continued…')); document.body.append(cont); await wait(2600); cont.remove();
}

// ================================================================ sum up the episode
export async function sumUp6() {
  playMusic('cave');
  const ov = h('div', { class: 'sumup' }, h('div', { class: 'sumup-title' }, 'Sum it up!'), h('div', { class: 'sumup-sub' }, 'Pass the challenge to finish Episode 6'));
  document.body.append(ov); await wait(600);
  await order({ prompt: 'Put what happened in order.', compact: true, items: ['Toby wakes Mia on the gray beach.', 'The old man gives them hot soup.', 'He tells them a secret about Varn.', 'They push the boat free.', 'Toby pulls the old man into the water.'], hints: ['What happened first?', 'The soup comes before the secret.'] });
  await think({ prompt: 'Was the old man really kind?', options: ['No. He wanted the treasure.', 'Yes. He wanted to help.', 'We do not know.'], answer: 'No. He wanted the treasure.', hints: ['What did he say at the boat?'] });
  await think({ prompt: 'Why did Mia not say a word?', options: ['She knew he was not telling the truth.', 'She was asleep.', 'She lost her voice.'], answer: 'She knew he was not telling the truth.', hints: ['Mia knew the gems grow in the cave.'] });
  ov.remove(); S.ep6 = 1; save();
}
