// Episode 3 — Leo's side. Stops 7–9, told as Leo's story on the beach (flashback), then back to the beach.
// Frank's text word for word; each line read once; replays rotate to new versions.
import { S, save, sfx, wait, h, shuffle } from './core.js';
import { THREE, setCam, flyCam, followCam, stopFollow, quake, tween, moveTo, onTick, sparkles, textTexture, toon, builder, cut, dolly, lens } from './gfx.js';
import { letterbox, mist } from './effects.js';
import { makeCast } from './chars.js';
import { cart } from './sets.js';
import { buildShelf, buildCrack, buildCliff } from './sets3.js';
import { buildRiver, buildBeach } from './sets2.js';
import { tell, tapOn, filled, hideStory, chooseWord, pick3D, spellOn, order, think, offerStretch, earnCard, toby, tapAll, MODE } from './ui.js';
import { playMusic } from './music.js';

const star = n => { S.stars[n] = 1; save(); sfx('great'); };
const visits = n => (S.stops[n] && S.stops[n].visits) || 0;
const finish = n => { const v = visits(n) + 1; S.stops[n] = Object.assign(S.stops[n] || {}, { done: 1, t: Date.now(), visits: v }); if (MODE.captain && MODE.perfect) { S.captain = S.captain || {}; S.captain[n] = 1; } save(); };
const pickV = (n, pool) => pool[visits(n) % pool.length];
const run = async (c, to, ms, opt) => { c.pose('run'); await moveTo(c.g, to, ms, opt); c.pose('idle'); };
// a soft white "memory" flash between the beach (now) and Leo's story (then)
const memory = async (ms = 650) => { const v = h('div', { class: 'veil memory' }); document.body.append(v); await wait(ms); return () => { v.classList.add('out'); setTimeout(() => v.remove(), 900); }; };

// ================================================================ stop 7 — the rock shelf
export async function stop7() {
  playMusic('meadow');
  // the beach: Leo tells his story
  const B = buildBeach(); const k = B.cast;
  k.leo.g.position.set(-3.8, 0, 0); k.mia.g.position.set(-2.6, 0, 0.2); k.toby.g.position.set(-4.7, 0, 0.5); k.leo.pose('sit'); k.mia.pose('sit'); k.leo.g.position.y = k.mia.g.position.y = -0.32; k.leo.g.rotation.y = Math.PI - 0.5; k.mia.g.rotation.y = Math.PI + 0.5; k.toby.pose('sit');
  setCam([-3, 1.6, -4.4], [-3.2, 0.8, 0.4]);
  await tell('Mia and Leo sat on the warm, sandy beach. “Leo, how did you get here?” Mia asked. Leo smiled and told his story.');
  // back in time: the cave, the moment the floor tipped
  const lift = await memory(); playMusic('danger');
  const Sh = buildShelf(); const leo = Sh.leo;
  setCam([0, 3.2, 9.5], [0, 1.4, -2]); lift();
  leo.pose('scared'); sfx('rumble'); quake(1.6, 0.18);
  tell('When the cave floor tipped down, huge rocks fell from the roof! It looked like Leo would be crushed.', { wait: false });
  let rain = true; (async () => { while (rain) { Sh.drop(-5 + Math.random() * 10, -2 + Math.random() * 6, 0.25 + Math.random() * 0.25, 7, () => { sfx('crash'); quake(0.25, 0.08); }); await wait(700 + Math.random() * 500); } })();
  await tapOn();
  // ---- activity: pick the shelf that will keep Leo safe
  const sv = pickV(7, [
    { prompt: 'Tap the THICK, strong shelf!', hints: ['Thick means big and fat, not thin.', 'Find the fattest shelf.'] },
    { prompt: 'Not the thin one! Tap the thickest shelf.', hints: ['Thin shelves can break.', 'Find the fattest shelf.'] },
    { prompt: 'Leo needs the strongest shelf. Tap it!', hints: ['A thin shelf can crack.', 'The thick one is the strongest.'] },
  ]);
  tell('But at the last second, he rolled under a {thick}, strong rock shelf.', { wait: false });
  await flyCam([0, 3, 6.5], [0, 1.5, -4], 900);
  await pick3D({ prompt: sv.prompt, answer: 'thick', word: 'thick', hints: sv.hints, targets: Sh.shelves.map(g => ({ id: g.userData.id, obj: g })),
    onWrong: id => { const g = Sh.shelves.find(s => s.userData.id === id); tween(400, e => { g.userData.slab.rotation.z = Math.sin(e * Math.PI * 4) * 0.05; }); sfx('crash'); } });
  rain = false; await filled('thick');
  // Leo dives and rolls under the thick shelf; rocks smash all around it
  const shelf = Sh.shelves.find(g => g.userData.id === 'thick');
  await run(leo, [shelf.position.x, 0, shelf.position.z + 2.2], 700); leo.pose('idle');
  await tween(450, e => { leo.g.position.z = shelf.position.z + 2.2 - e * 2.1; leo.g.rotation.x = -e * 1.45; leo.g.position.y = 0.2 * e; });
  for (let i = 0; i < 9; i++) { Sh.drop(shelf.position.x - 2.4 + Math.random() * 4.8, shelf.position.z + 1 + Math.random() * 2, 0.35 + Math.random() * 0.3, 7, () => { sfx('crash'); quake(0.3, 0.15); }); await wait(160); }
  await earnCard('thick');
  await flyCam([shelf.position.x + 1, 2.2, 3.4], [shelf.position.x, 1, -3.6], 1100);
  await tell('The heavy rocks crashed all around him, but he was safe in his little hiding spot.');
  // ---- what happened, in order (from Leo's side)
  await order({ prompt: 'Put it in order.', compact: true, items: ['The floor tipped down.', 'Rocks fell from the roof.', 'Leo rolled under the shelf.', 'Leo was safe.'], hints: ['What happened first?', 'The rocks fell before Leo hid.'] });
  if (await offerStretch('What do these words mean?')) {
    await think(pickV(7, [
      { prompt: 'What does “at the last second” mean?', options: ['Just in time', 'Very slowly', 'At night'], answer: 'Just in time', hints: ['Leo hid right before the rocks hit.'] },
      { prompt: 'What is a “hiding spot”?', options: ['A safe place to hide', 'A kind of hat', 'A loud sound'], answer: 'A safe place to hide', hints: ['Leo was safe there.'] },
      { prompt: 'What does “crushed” mean here?', options: ['Squashed flat', 'Very happy', 'Very wet'], answer: 'Squashed flat', hints: ['Big rocks were falling on him.'] },
    ]));
    star(7);
  }
  hideStory(); finish(7);
}

// ================================================================ stop 8 — the crack
const blackout = async (ms = 500) => { const v = h('div', { class: 'veil' }); document.body.append(v); await wait(ms); return () => { v.classList.add('out'); setTimeout(() => v.remove(), 900); }; };
export async function stop8() {
  playMusic('cave');
  // ---- under the shelf: the dust settles, and Leo spots a tiny crack in the wall behind him
  const Sh = buildShelf(); const shelf = Sh.shelves.find(g => g.userData.id === 'thick'); const X = shelf.position.x, Z = shelf.position.z; let leo = Sh.leo;
  Sh.pile.forEach(r => r.visible = true);
  leo.g.position.set(X, 0.2, Z + 0.1); leo.g.rotation.set(-1.45, 0, 0); leo.pose('idle');
  const dust = mist(Sh.w, { count: 18, center: new THREE.Vector3(X, 0, Z + 2.5), spread: 5, y: [0.3, 2.4], size: [3, 6], color: 0xA89886, opacity: 0.7, drift: 0.3 }); dust.show(1, 10);
  letterbox(true); cut([X + 0.8, 1.4, Z + 4.6], [X, 0.7, Z - 0.1], 46); dolly([X + 0.5, 1.1, Z + 3.6], [X, 0.6, Z - 0.1], 6000);
  const sp = pickV(8, [
    { text: 'When the dust is gone, Leo found a tiny crack in the cave wall. It was a dark {tunnel} and the only way out.', word: 'tunnel', decoys: 'ma', prompt: 'Tap the letters to spell the word. It is a long hole to go through.', hints: ['It has two n’s in the middle.', 'T – U – N – N – E – L'] },
    { text: 'When the dust is gone, Leo found a tiny {crack} in the cave wall. It was a dark tunnel and the only way out.', word: 'crack', decoys: 'ois', prompt: 'Tap the letters to spell the word. It is a thin gap in a wall.', hints: ['It ends with c-k.', 'C – R – A – C – K'] },
    { text: 'He had to squeeze on his tummy and crawl like a {worm}.', word: 'worm', decoys: 'aite', prompt: 'Tap the letters to spell the word. It is long and wiggly.', hints: ['It sounds like “wurm” but has an o.', 'W – O – R – M'] },
  ]);
  tell(sp.word === 'worm' ? 'When the dust is gone, Leo found a tiny crack in the cave wall. It was a dark tunnel and the only way out.' : sp.text, { wait: false });
  dust.show(0, 4500); await wait(2200);
  // he rolls over, and a thin line of light shows in the wall behind him
  leo.g.rotation.order = 'YXZ'; leo.g.rotation.set(Math.PI / 2, Math.PI, 0); leo.g.position.set(X, 0.22, Z + 0.9); leo.head.rotation.x = -0.7;
  cut([X - 0.45, 1.15, Z + 3], [X, 0.45, -5.8], 44); dolly([X - 0.35, 1.1, Z + 2.3], [X, 0.45, -5.8], 5000);
  sfx('glow'); await tween(1400, e => { Sh.crackGlow.intensity = e * 7; });
  await tapOn();
  // he crawls into the crack
  leo.pose('walk'); await tween(1700, e => { leo.g.position.z = Z + 0.9 - e * 2.3; });
  const lift = await blackout(500);
  // ---- inside the tunnel: tight, muddy, full of bugs. We see Leo's face as he squeezes towards us.
  const C = buildCrack(); leo = C.leo; const { crawler } = C; let z = 1; leo.head.rotation.x = -1.1;
  const cam = new THREE.Vector3(), look = new THREE.Vector3(); let front = true;
  followCam(() => { if (front) { cam.set(0.45, -0.55, z - 5); look.set(0, -0.7, z - 1.4); } else { cam.set(0.35, 0.25, z + 2.2); look.set(0, -0.4, z - 4); } return [cam, look]; });
  const crawlTo = async (nz, ms) => { leo.pose('walk'); const z0 = z; await tween(ms, e => { z = z0 + (nz - z0) * e; crawler.position.z = z; }); leo.pose('idle'); };
  lift(); letterbox(true);
  if (sp.word === 'worm') tell(sp.text, { wait: false });
  await crawlTo(0.2, 1400);
  // ---- spell the gap word: the letters float by the mud blobs; every right letter pulls Leo forward
  await spellOn({ prompt: sp.prompt, word: sp.word, decoys: sp.decoys, objs: C.blobs, hints: sp.hints,
    onLetter: (blob) => { blob.visible = false; sparkles(blob.position, 0x8A6A4A, 10); crawlTo(z - 1.0, 600); } });
  await filled(sp.word); if (sp.word === 'tunnel') await earnCard('tunnel');
  // squeezing on, through the mud (panel: Leo crawling towards us, bugs on the walls)
  letterbox(true);
  tell(sp.word === 'worm' ? 'The path was covered in yucky, sticky mud and all kinds of scary bugs crawling everywhere! His clothes got dirty.' : 'He had to squeeze on his tummy and crawl like a worm. The path was covered in yucky, sticky mud and all kinds of scary bugs crawling everywhere! His clothes got dirty.', { wait: false });
  await crawlTo(-8.5, 3000);
  leo.g.traverse(o => { if (o.material && o.material.color && !o.userData.isOutline && o.material.color.getHex() === 0x5DBB4A) { o.material = o.material.clone(); o.material.color.set(0x6E7A3A); } });
  await tapOn();
  // ---- the bugs carry words: tap the ones that fit (rotates on replays)
  const set = pickV(8, [
    { prompt: 'Tap the bugs with words that tell how the mud feels.', yes: ['sticky', 'yucky', 'wet', 'slimy'], no: ['happy', 'tall', 'fast', 'blue'], hints: ['How does mud feel in your hands?', 'sticky feels like mud!'] },
    { prompt: 'Tap the bugs with doing words (things you can do).', yes: ['crawl', 'squeeze', 'dig', 'wiggle'], no: ['mud', 'dark', 'bug', 'small'], hints: ['Can you do it? Then tap it!', 'You can crawl!'] },
    { prompt: 'Tap the bugs with words that rhyme with mud.', yes: ['bud', 'thud', 'spud', 'flood'], no: ['map', 'mop', 'bed', 'mix'], hints: ['Say mud. Listen to the end: -ud.', 'thud rhymes with mud!'] },
  ]);
  front = false; await crawlTo(-10, 900);
  const words = shuffle([...set.yes.map(w => ({ w, ok: true })), ...set.no.map(w => ({ w, ok: false }))]);
  const items = C.wordBugs.map((g, i) => ({ obj: g, ok: words[i].ok, label: words[i].w }));
  await tapAll({ prompt: set.prompt, items, hints: set.hints, onRight: it => { it.obj.visible = false; } });
  items.forEach(it => it.obj.visible = false);
  // ---- a simile
  await chooseWord(pickV(8, [
    { prompt: 'Which word fits?', sentence: 'He had to crawl like a {_}.', tiles: ['worm', 'bird', 'fish'], answer: 'worm', note: 'like a worm = low and slow, on his tummy', hints: ['Leo is on his tummy in the mud.', 'Which one wiggles in the mud?'] },
    { prompt: 'Which word fits?', sentence: 'The tunnel was as dark as {_}.', tiles: ['night', 'snow', 'sun'], answer: 'night', note: 'as dark as night = very dark', hints: ['When is it dark outside?', 'Snow and sun are bright.'] },
    { prompt: 'Which word fits?', sentence: 'The mud was as sticky as {_}.', tiles: ['glue', 'water', 'air'], answer: 'glue', note: 'as sticky as glue = very sticky', hints: ['What sticks paper together?', 'glue!'] },
  ]));
  // light ahead… he crawls towards it
  letterbox(true); sfx('glow'); await crawlTo(-31, 3600);
  const lift2 = await memoryWhite();
  // ---- out of the tunnel: he crawls out of a hole in the rock onto a high ledge, stands up — and we see his face
  const K = buildCliff(); K.leo.g.visible = false; K.ride.on = false; K.tiny.visible = false;
  const hold = new THREE.Group(); hold.position.set(K.MOUTH.x, K.LEDGE.y + 0.1, K.MOUTH.z + 0.4); hold.rotation.y = Math.PI; K.w.add(hold);
  const hc = makeCast(hold); hc.mia.g.visible = false; hc.toby.g.visible = false; const L2 = hc.leo; L2.g.rotation.x = Math.PI / 2; L2.g.position.set(0, 0.28, 0.6); L2.head.rotation.x = -0.8;
  L2.g.traverse(o => { if (o.material && o.material.color && !o.userData.isOutline && o.material.color.getHex() === 0x5DBB4A) { o.material = o.material.clone(); o.material.color.set(0x6E7A3A); } });
  const flick = new THREE.PointLight(0xFFFFFF, 14, 9, 1.4); flick.position.set(K.MOUTH.x + 0.5, K.LEDGE.y + 1.8, K.MOUTH.z - 3.4); K.w.add(flick);
  onTick(t => flick.color.setHSL((t * 0.12) % 1, 0.8, 0.6));
  cut([K.MOUTH.x + 1.2, K.LEDGE.y + 1.1, K.MOUTH.z - 5.2], [K.MOUTH.x, K.LEDGE.y + 0.6, K.MOUTH.z], 46); lift2(); letterbox(true);
  L2.pose('walk'); await tween(2200, e => { hold.position.z = K.MOUTH.z + 0.4 - e * 2.4; });
  // he stands up slowly, looking out at something we cannot see yet
  L2.pose('idle'); await tween(900, e => { L2.g.rotation.x = Math.PI / 2 * (1 - e); L2.g.position.set(0, 0.28 * (1 - e), 0.6 * (1 - e)); L2.head.rotation.x = -0.8 * (1 - e); });
  L2.pose('wow'); sfx('glow');
  tell('But finally, the tight path opened up, and Leo cannot believe what he saw.', { wait: false });
  const hp = hold.position; dolly([hp.x + 0.45, hp.y + 1.45, hp.z - 2.1], [hp.x, hp.y + 1.25, hp.z], 6000);
  await wait(2200); await tapOn();
  if (await offerStretch('Make two words into one.')) {
    await chooseWord(pickV(8, [
      { prompt: 'Bonus! cannot = ?', sentence: 'Leo {_} believe what he saw.', tiles: ['can’t', 'cant', 'ca’nt'], answer: 'can’t', note: 'cannot → can’t (the ’ goes where the letters left)', hints: ['The ’ goes between n and t.', 'can’t'] },
      { prompt: 'Bonus! did not = ?', sentence: 'Leo {_} give up.', tiles: ['didn’t', 'did’nt', 'didnt'], answer: 'didn’t', note: 'did not → didn’t', hints: ['The ’ takes the place of the o.', 'didn’t'] },
      { prompt: 'Bonus! it is = ?', sentence: '{_} so dark in here!', tiles: ['It’s', 'Its', 'Its’'], answer: 'It’s', note: 'it is → it’s', hints: ['The ’ takes the place of the i in is.', 'It’s'] },
    ]));
    star(8);
  }
  hideStory(); letterbox(false); finish(8);
}
const memoryWhite = async (ms = 650) => { const v = h('div', { class: 'veil memory' }); v.style.background = '#FFF8E8'; document.body.append(v); await wait(ms); return () => { v.classList.add('out'); setTimeout(() => v.remove(), 900); }; };

// ================================================================ stop 9 — the rainbow cavern, the slide, the river, out to the beach
export async function stop9() {
  playMusic('wonder');
  const K = buildCliff(); const { leo, LEDGE, SPRING } = K; K.ride.on = false; K.tiny.visible = false;
  leo.pose('wow'); letterbox(true);
  // the view Leo sees (like the picture in the book): over his shoulder, the rainbow cavern opens up
  cut([LEDGE.x - 2.4, LEDGE.y + 1.9, LEDGE.z - 0.6], [LEDGE.x + 0.4, LEDGE.y + 1.2, LEDGE.z - 6], 50);
  await flyCam([LEDGE.x + 0.8, LEDGE.y + 1.9, LEDGE.z - 0.5], [-0.5, 6.5, -18], 2600, { fov: 58 });
  dolly([LEDGE.x + 0.7, LEDGE.y + 2, LEDGE.z - 0.9], [-0.5, 6.3, -18], 9000);
  // ---- the gap word (rotates on replays)
  const cv = pickV(9, [
    { text: 'It was an amazing sight! He was standing on a high {cliff} looking down at a huge room filled with rainbow-colored crystals.', sentence: 'He was standing on a high {_}.', tiles: ['cliff', 'clip', 'click'], answer: 'cliff', note: 'cliff = a high, rocky edge', hints: ['A high, rocky edge.', 'c – l – i – f – f, two f’s'] },
    { text: 'It was an {amazing} sight! He was standing on a high cliff looking down at a huge room filled with rainbow-colored crystals.', sentence: 'It was an {_} sight!', tiles: ['amazing', 'amazed', 'amaze'], answer: 'amazing', note: 'an amazing sight = a WOW thing to see', hints: ['It ends with -ing.', 'amazing!'] },
    { text: 'It was an amazing sight! He was standing on a high cliff looking down at a huge room filled with {rainbow}-colored crystals.', sentence: 'a huge room filled with {_}-colored crystals', tiles: ['rainbow', 'rainbo', 'reinbow'], answer: 'rainbow', note: 'rain + bow = rainbow', hints: ['Two small words: rain + bow.', 'r-a-i-n-b-o-w'] },
  ]);
  tell(cv.text, { wait: false }); await wait(2600);
  await chooseWord({ prompt: 'Which word fits?', sentence: cv.sentence, tiles: cv.tiles, answer: cv.answer, note: cv.note, hints: cv.hints });
  await filled(cv.answer); if (cv.answer === 'cliff') await earnCard('cliff');
  // ---- Mia and Toby come out of the tunnel and make ONE loop through the green crystals
  letterbox(true); K.ride.s = -0.02; K.ride.on = true;
  tell('Zoom! He watched Mia and Toby in the minecart rush over a giant loop right where the green crystals were.', { wait: false });
  await flyCam([LEDGE.x + 1.5, LEDGE.y + 1.8, LEDGE.z - 2], [K.G.x, K.G.y + 4, K.G.z], 1600, { fov: 30 });
  { const t0 = performance.now(); while (K.ride.s < K.sB + 0.06 && performance.now() - t0 < 14000) await wait(60); }
  leo.pose('point'); sfx('great');
  await pick3D({ prompt: 'Find Mia and Toby! Tap their cart.', answer: 'cart', targets: [{ id: 'cart', obj: K.hitBox }], hints: ['Look at the green loop!', 'It comes out of the tunnel and goes round.'] });
  // ---- the water slide: a spring pours into a stone pool, then a smooth path of rushing water goes down the cliff
  letterbox(true); leo.pose('idle');
  tell('Next to the cliff, he found a smooth rock path filled with rushing water. It looked just like a fun water slide! Leo took a deep breath, pinched his nose, and jumped right in.', { wait: false });
  cut([LEDGE.x - 3.4, LEDGE.y + 3.2, LEDGE.z - 7.5], [SPRING.x + 1, LEDGE.y - 1, LEDGE.z + 2], 52); dolly([LEDGE.x - 2.6, LEDGE.y + 3.6, LEDGE.z - 8.2], [SPRING.x + 1.5, LEDGE.y - 1.5, LEDGE.z + 1], 8000);
  await run(leo, [SPRING.x - 1.6, LEDGE.y + 0.05, LEDGE.z + 2.2], 1400);
  const sp0 = K.slidePath.getPointAt(0.04); leo.g.rotation.y = Math.PI / 2; await wait(1500); await tapOn();
  // whee! sitting down, all the way down the slide…
  playMusic('danger'); sfx('whoosh'); await moveTo(leo.g, [sp0.x, sp0.y + 0.05, sp0.z], 450, { hop: 0.8 }); leo.pose('slide');
  const cam = new THREE.Vector3(), look = new THREE.Vector3(); let sl = 0.04; leo.g.rotation.order = 'YXZ';
  followCam(() => { const p = K.slidePath.getPointAt(Math.min(sl, 1)), q = K.slidePath.getPointAt(Math.max(0, sl - 0.07)); cam.copy(q).add(new THREE.Vector3(1.2, 2.2, 0)); look.copy(p).add(new THREE.Vector3(0, 0.6, 0)); return [cam, look]; });
  await tween(4200, (e, k) => { sl = 0.04 + k * 0.96; const p = K.slidePath.getPointAt(sl), tg = K.slidePath.getTangentAt(sl); leo.g.position.copy(p).add(new THREE.Vector3(0, -0.12, 0)); leo.g.rotation.y = Math.atan2(tg.x, tg.z); leo.g.rotation.x = -Math.asin(Math.max(-1, Math.min(1, tg.y))) * 0.8; });
  // …off the end and SPLASH into the river
  stopFollow(); const endP = K.slidePath.getPointAt(1), endT = K.slidePath.getTangentAt(1);
  cut([endP.x + 6, endP.y + 2.2, endP.z + 3], [endP.x + 1, endP.y, endP.z - 2], 50);
  await tween(600, (e, k) => { leo.g.position.copy(endP).addScaledVector(endT, k * 2.5).add(new THREE.Vector3(0, Math.sin(k * Math.PI) * 1.2 - k * 0.9, 0)); });
  sfx('crash'); sparkles(endP.clone().addScaledVector(endT, 2.5).add(new THREE.Vector3(0, 0.3, 0)), 0xE6F6FF, 50); leo.g.visible = false; await wait(700);
  // ---- the river: spinning in the swift water
  const V = buildRiver({ exitZ: -62 }); V.R.g.visible = false; V.gates.forEach(g => g.visible = false);
  const L = V.leo; V.leoLog.remove(L.g); V.w.add(L.g); L.pose('scared'); L.g.position.set(0, -0.6, -6);
  V.leoLog.position.set(-2.2, 0.1, 2); V.leoLog.rotation.y = Math.PI / 2;
  let spin = true; const sOff = onTick((t, dt) => { if (spin) { L.g.rotation.y += dt * 3; L.g.position.y = -0.6 + Math.sin(t * 3) * 0.08; } });
  sfx('crash'); sparkles(new THREE.Vector3(0, 0.3, -6), 0xE6F6FF, 40);
  letterbox(true); cut([3.2, 3.4, 0], [0, 0, -6], 50);
  await tell('Whoosh! The slide dropped him into the deep river. The water was far too swift, and Leo spun around in the fast water.');
  // ---- science: what floats?
  tell('He needed something to help him stay up.', { wait: false });
  await think(pickV(9, [
    { prompt: 'What could help Leo stay up in the water?', options: ['A floating log', 'A heavy rock', 'A metal cart wheel'], answer: 'A floating log', hints: ['Which one floats?'] },
    { prompt: 'Which one will FLOAT?', options: ['A wooden log', 'A big stone', 'An iron key'], answer: 'A wooden log', hints: ['Wood floats. Stone and iron sink.'] },
    { prompt: 'Why does a log help Leo?', options: ['Wood floats on water', 'Logs are warm', 'Logs can swim'], answer: 'Wood floats on water', hints: ['Think: float or sink?'] },
  ]));
  letterbox(true);
  tell('Luckily, he bumped into an old log floating by. He grabbed it tight and drifted down the dark river until he saw a bright light, and Mia paddled over to {fetch} him.', { wait: false });
  await moveTo(V.leoLog, [0, 0.1, -5.6], 1400, { face: false });
  // he grabs the log and holds on tight, lying across it (like the picture in the book)
  spin = false; sOff(); V.w.remove(L.g); const grip = new THREE.Group(); grip.rotation.y = -Math.PI / 2; V.leoLog.add(grip); grip.add(L.g);
  L.g.rotation.set(Math.PI / 2, 0, 0); L.g.position.set(0, 0.42, 0.55); L.head.rotation.x = -0.8; L.pose('hug');
  // drifting to the light; Mia's cart comes paddling up behind
  let z = -5.6, logFree = false; const dOff = onTick((t, dt) => { z = Math.max(-54, z - dt * 2.6); if (!logFree) V.leoLog.position.z = z; else { V.leoLog.position.z -= dt * 1.2; V.leoLog.position.x += (-3.2 - V.leoLog.position.x) * dt * 0.6; } });
  followCam(() => { cam.set(-2.6, 1.9, z - 5.5); look.set(0.6, 0.5, z + 1.5); return [cam, look]; });
  await wait(2600);
  V.R.g.visible = true; V.R.g.rotation.set(0, Math.PI, 0); V.paddle.visible = true; const M = V.R.cast.mia; const row = onTick(t => { M.AR.rotation.x = -0.6 + Math.sin(t * 6) * 0.7; });
  let rz = z + 7; const rOff = onTick((t, dt) => { rz = Math.max(z + 1.6, rz - dt * 4); V.R.g.position.set(1.7, 0.1 + Math.sin(t * 2.2) * 0.05, rz); });
  while (z > -30) await wait(40);
  // ---- fetch (rotates on replays)
  await chooseWord(pickV(9, [
    { prompt: 'Which word is spelled right?', sentence: 'Mia paddled over to {_} him.', tiles: ['fetch', 'fech', 'fetsh'], answer: 'fetch', note: 'fetch = go and get. It ends with -tch, like catch.', hints: ['It ends like catch: -tch.', 'f – e – t – c – h'] },
    { prompt: 'Which word fits?', sentence: 'Mia paddled over to {_} him.', tiles: ['fetch', 'fence', 'feather'], answer: 'fetch', note: 'fetch = go and get', hints: ['It means go and get.', 'Toby likes to play ___ with a ball!'] },
    { prompt: 'Which word means “go and get”?', sentence: 'Mia paddled over to {_} him.', tiles: ['fetch', 'forget', 'follow'], answer: 'fetch', note: 'fetch = go and get', hints: ['A dog can ___ a ball.', 'fetch!'] },
  ]));
  row(); M.pose('reach'); await filled('fetch');
  // Mia reaches out and pulls Leo up off the log into the cart
  { stopFollow(); const lw = L.g.getWorldPosition(new THREE.Vector3()); cut([V.R.g.position.x + 3.2, 2.1, z - 3.6], [V.R.g.position.x - 0.6, 0.8, z + 0.6], 48);
    await wait(500); sfx('pop'); grip.remove(L.g); V.w.add(L.g); L.g.position.copy(lw); L.g.rotation.set(0, Math.PI, 0); L.head.rotation.x = 0; L.pose('reach');
    const seat = new THREE.Vector3(-0.3, 0.45, -0.25); const to = () => V.R.g.localToWorld(seat.clone());
    await tween(900, (e, k) => { L.g.position.lerpVectors(lw, to(), e); L.g.position.y += Math.sin(k * Math.PI) * 0.9; });
    V.R.g.attach(L.g); L.g.position.copy(seat); L.g.rotation.set(0, 0, 0); L.pose('cheer'); L.L.rotation.x = L.R.rotation.x = -1.4;
    M.g.position.x = 0.3; M.pose('cheer'); logFree = true; sfx('great');
    followCam(() => { cam.set(-2.6, 2.2, z - 5); look.set(1.2, 0.6, z + 1.5); return [cam, look]; }); await wait(1200); }
  await earnCard('fetch');
  if (await offerStretch('Three words that sound the same.')) {
    await chooseWord(pickV(9, [
      { prompt: 'Bonus! Which word fits?', sentence: 'The water was far {_} swift.', tiles: ['to', 'too', 'two'], answer: 'too', note: 'too = very / also · two = 2 · to = toward', hints: ['It means VERY.', 'too has two o’s.'] },
      { prompt: 'Bonus! Which word fits?', sentence: 'Mia paddled {_} the log.', tiles: ['to', 'too', 'two'], answer: 'to', note: 'to = toward', hints: ['It means toward.', 'Just one o.'] },
      { prompt: 'Bonus! Which word fits?', sentence: 'Leo and Mia are {_} friends.', tiles: ['to', 'too', 'two'], answer: 'two', note: 'two = 2', hints: ['It is a number.', 't-w-o'] },
    ]));
    star(9);
  }
  // ---- the river carries them out through the bright cave mouth…
  hideStory(); letterbox(true); stopFollow();
  cut([4, 2.2, -40], [0, 1, -62], 52);
  while (z > -53.5) await wait(40);
  const lift = await memoryWhite(600); dOff(); rOff();
  // …and out onto the beach, along the stream from the cave to the sea
  const B = buildBeach(); const k = B.cast; [k.leo, k.mia, k.toby].forEach(c => c.g.visible = false);
  const out = new THREE.Group(); B.w.add(out); const ob = builder(out);
  const boat = new THREE.Group(); out.add(boat); cart(builder(boat), 0, 0, 0); const bc = makeCast(boat); bc.leo.g.position.set(-0.3, 0.45, -0.25); bc.leo.pose('cheer'); bc.leo.L.rotation.x = bc.leo.R.rotation.x = -1.4; bc.mia.g.position.set(0.3, 0.45, 0.15); bc.mia.pose('cheer'); bc.mia.L.rotation.x = bc.mia.R.rotation.x = -1.4; bc.toby.g.position.set(0, 0.85, 0.6); bc.toby.g.scale.setScalar(0.9); boat.rotation.y = Math.PI;
  cut([4.5, 1.8, -6], [0, 1, 10], 50); lift(); sfx('whoosh');
  await tween(5200, (e, kk) => { boat.position.set(0.2, 0.12 + Math.sin(kk * 20) * 0.04, 15 - kk * 15); boat.rotation.z = Math.sin(kk * 14) * 0.05; });
  // ---- back to the beach (now): Leo finishes his story
  const lift3 = await memory(800); playMusic('meadow');
  const B2 = buildBeach(); const k2 = B2.cast;
  k2.leo.g.position.set(-3.8, 0, 0); k2.mia.g.position.set(-2.6, 0, 0.2); k2.toby.g.position.set(-4.7, 0, 0.5); k2.leo.g.rotation.y = Math.PI - 0.5; k2.mia.g.rotation.y = Math.PI + 0.5;
  setCam([-3, 1.7, -4.6], [-3.2, 0.9, 0.4]); lift3(); letterbox(false);
  k2.leo.pose('cheer'); k2.mia.pose('cheer'); k2.toby.pose('wag');
  await tell('Leo is finally safe...');
  hideStory(); sfx('great'); sparkles(new THREE.Vector3(-3.2, 1.6, 0.4), 0xFFE58A, 40);
  await flyCam([5, 12, -20], [-1.5, 0, -2], 3600);
  finish(9);
  const end = h('div', { class: 'tbc end' }, h('div', {}, h('div', { class: 'end-ep' }, 'The Cave 3 · Leo’s Side'), 'The End')); document.body.append(end); sfx('card'); await wait(3000); end.classList.add('fade'); await wait(800); end.remove();
}

// ================================================================ sum up the episode
export async function sumUp3() {
  playMusic('cave');
  const ov = h('div', { class: 'sumup' }, h('div', { class: 'sumup-title' }, 'Sum it up!'), h('div', { class: 'sumup-sub' }, 'Pass the challenge to finish Episode 3'));
  document.body.append(ov); await wait(600);
  await order({ prompt: 'Put Leo’s story in order.', compact: true, items: ['Leo hid under a thick shelf.', 'He crawled through a dark tunnel.', 'He stood on a high cliff.', 'He slid down the water slide.', 'Mia came to fetch him.'], hints: ['What happened first?', 'The tunnel came before the cliff.'] });
  await think({ prompt: 'Who is telling this story?', options: ['Leo', 'Toby', 'Mia'], answer: 'Leo', hints: ['Who told Mia how he got there?'] });
  await think({ prompt: 'Why did Leo go through the crack?', options: ['It was the only way out.', 'He wanted to find bugs.', 'He was looking for mud.'], answer: 'It was the only way out.', hints: ['Read again: “the only way out”.'] });
  ov.remove(); S.ep3 = 1; save();
}
