// Episode 3 — Leo's side. Stops 7–9, told as Leo's story on the beach (flashback), then back to the beach.
// Frank's text word for word; each line read once; replays rotate to new versions.
import { S, save, sfx, wait, h, shuffle } from './core.js';
import { THREE, setCam, flyCam, followCam, stopFollow, quake, tween, moveTo, onTick, sparkles, textTexture, toon, builder } from './gfx.js';
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
  k.leo.g.position.set(-0.6, 0, 0); k.mia.g.position.set(0.6, 0, 0.2); k.leo.pose('sit'); k.mia.pose('sit'); k.leo.g.position.y = k.mia.g.position.y = -0.32; k.leo.g.rotation.y = Math.PI - 0.5; k.mia.g.rotation.y = Math.PI + 0.5; k.toby.pose('sit');
  setCam([0.2, 1.6, -4.4], [0, 0.8, 0.4]);
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
export async function stop8() {
  playMusic('cave');
  const C = buildCrack(); const { leo, crawler } = C; let z = 1;
  const cam = new THREE.Vector3(), look = new THREE.Vector3();
  followCam(() => { cam.set(0.35, 0.25, z + 2.2); look.set(0, -0.4, z - 4); return [cam, look]; });
  const crawlTo = async (nz, ms) => { leo.pose('walk'); const z0 = z; await tween(ms, e => { z = z0 + (nz - z0) * e; crawler.position.z = z; }); leo.pose('idle'); };
  // ---- spell the gap word on the mud blobs: every right letter pulls Leo forward (rotates on replays)
  const sp = pickV(8, [
    { text: 'When the dust is gone, Leo found a tiny crack in the cave wall. It was a dark {tunnel} and the only way out.', word: 'tunnel', decoys: 'ma', prompt: 'Tap the letters to spell the word. It is a long hole to go through.', hints: ['It has two n’s in the middle.', 'T – U – N – N – E – L'] },
    { text: 'When the dust is gone, Leo found a tiny {crack} in the cave wall. It was a dark tunnel and the only way out.', word: 'crack', decoys: 'ois', prompt: 'Tap the letters to spell the word. It is a thin gap in a wall.', hints: ['It ends with c-k.', 'C – R – A – C – K'] },
    { text: 'He had to squeeze on his tummy and crawl like a {worm}.', word: 'worm', decoys: 'aite', prompt: 'Tap the letters to spell the word. It is long and wiggly.', hints: ['It sounds like “wurm” but has an o.', 'W – O – R – M'] },
  ]);
  tell(sp.text, { wait: false });
  await spellOn({ prompt: sp.prompt, word: sp.word, decoys: sp.decoys, objs: C.blobs, hints: sp.hints,
    onLetter: (blob, i) => { blob.visible = false; sparkles(blob.position, 0x8A6A4A, 10); crawlTo(z - 1.0, 600); } });
  await filled(sp.word); if (sp.word === 'tunnel') await earnCard('tunnel');
  // squeezing on, through the mud
  tell(sp.word === 'worm' ? 'The path was covered in yucky, sticky mud and all kinds of scary bugs crawling everywhere! His clothes got dirty.' : 'He had to squeeze on his tummy and crawl like a worm. The path was covered in yucky, sticky mud and all kinds of scary bugs crawling everywhere! His clothes got dirty.', { wait: false });
  await crawlTo(-8.5, 2600);
  leo.g.traverse(o => { if (o.material && o.material.color && !o.userData.isOutline && o.material.color.getHex() === 0x5DBB4A) { o.material = o.material.clone(); o.material.color.set(0x6E7A3A); } });
  await tapOn();
  // ---- the bugs carry words: tap the ones that fit (rotates on replays)
  const set = pickV(8, [
    { prompt: 'Tap the bugs with words that tell how the mud feels.', yes: ['sticky', 'yucky', 'wet', 'slimy'], no: ['happy', 'tall', 'fast', 'blue'], hints: ['How does mud feel in your hands?', 'sticky feels like mud!'] },
    { prompt: 'Tap the bugs with doing words (things you can do).', yes: ['crawl', 'squeeze', 'dig', 'wiggle'], no: ['mud', 'dark', 'bug', 'small'], hints: ['Can you do it? Then tap it!', 'You can crawl!'] },
    { prompt: 'Tap the bugs with words that rhyme with mud.', yes: ['bud', 'thud', 'spud', 'flood'], no: ['map', 'mop', 'bed', 'mix'], hints: ['Say mud. Listen to the end: -ud.', 'thud rhymes with mud!'] },
  ]);
  await crawlTo(-10, 900);
  const words = shuffle([...set.yes.map(w => ({ w, ok: true })), ...set.no.map(w => ({ w, ok: false }))]);
  const items = C.wordBugs.map((g, i) => { const lab = new THREE.Sprite(new THREE.SpriteMaterial({ map: textTexture(words[i].w, { w: 384, h: 140, font: '82px Chewy, sans-serif', fg: '#FFFDF4', glow: '#2B1A0E' }), depthTest: false })); lab.scale.set(1.3, 0.48, 1); lab.position.set(0, 0.55, 0); g.add(lab); return { obj: g, ok: words[i].ok, label: words[i].w }; });
  await tapAll({ prompt: set.prompt, items, hints: set.hints, onRight: it => { it.obj.visible = false; } });
  items.forEach(it => it.obj.visible = false);
  // ---- a simile
  await chooseWord(pickV(8, [
    { prompt: 'Which word fits?', sentence: 'He had to crawl like a {_}.', tiles: ['worm', 'bird', 'fish'], answer: 'worm', note: 'like a worm = low and slow, on his tummy', hints: ['Leo is on his tummy in the mud.', 'Which one wiggles in the mud?'] },
    { prompt: 'Which word fits?', sentence: 'The tunnel was as dark as {_}.', tiles: ['night', 'snow', 'sun'], answer: 'night', note: 'as dark as night = very dark', hints: ['When is it dark outside?', 'Snow and sun are bright.'] },
    { prompt: 'Which word fits?', sentence: 'The mud was as sticky as {_}.', tiles: ['glue', 'water', 'air'], answer: 'glue', note: 'as sticky as glue = very sticky', hints: ['What sticks paper together?', 'glue!'] },
  ]));
  // the tight path opens up
  sfx('glow'); await crawlTo(-30, 3200);
  tell('But finally, the tight path opened up, and Leo cannot believe what he saw.', { wait: false });
  await tween(700, e => { leo.g.rotation.x = Math.PI / 2 * (1 - e); leo.g.position.y = 0.28 + e * 0.5; }); leo.pose('scared');
  await tapOn();
  if (await offerStretch('Make two words into one.')) {
    await chooseWord(pickV(8, [
      { prompt: 'Bonus! cannot = ?', sentence: 'Leo {_} believe what he saw.', tiles: ['can’t', 'cant', 'ca’nt'], answer: 'can’t', note: 'cannot → can’t (the ’ goes where the letters left)', hints: ['The ’ goes between n and t.', 'can’t'] },
      { prompt: 'Bonus! did not = ?', sentence: 'Leo {_} give up.', tiles: ['didn’t', 'did’nt', 'didnt'], answer: 'didn’t', note: 'did not → didn’t', hints: ['The ’ takes the place of the o.', 'didn’t'] },
      { prompt: 'Bonus! it is = ?', sentence: '{_} so dark in here!', tiles: ['It’s', 'Its', 'Its’'], answer: 'It’s', note: 'it is → it’s', hints: ['The ’ takes the place of the i in is.', 'It’s'] },
    ]));
    star(8);
  }
  hideStory(); finish(8);
}

// ================================================================ stop 9 — the rainbow cliff, the slide, the river, home to the beach
export async function stop9() {
  playMusic('wonder');
  const K = buildCliff(); const { leo } = K;
  setCam([K.CL.x + 4.5, 13.2, K.CL.z + 5], [K.CL.x + 1.6, 11.6, K.CL.z - 1.2]);
  // ---- the gap word (rotates on replays)
  const cv = pickV(9, [
    { text: 'It was an amazing sight! He was standing on a high {cliff} looking down at a huge room filled with rainbow-colored crystals.', sentence: 'He was standing on a high {_}.', tiles: ['cliff', 'clip', 'click'], answer: 'cliff', note: 'cliff = a high, rocky edge', hints: ['A high, rocky edge.', 'c – l – i – f – f, two f’s'] },
    { text: 'It was an {amazing} sight! He was standing on a high cliff looking down at a huge room filled with rainbow-colored crystals.', sentence: 'It was an {_} sight!', tiles: ['amazing', 'amazed', 'amaze'], answer: 'amazing', note: 'an amazing sight = a WOW thing to see', hints: ['It ends with -ing.', 'amazing!'] },
    { text: 'It was an amazing sight! He was standing on a high cliff looking down at a huge room filled with {rainbow}-colored crystals.', sentence: 'a huge room filled with {_}-colored crystals', tiles: ['rainbow', 'rainbo', 'reinbow'], answer: 'rainbow', note: 'rain + bow = rainbow', hints: ['Two small words: rain + bow.', 'r-a-i-n-b-o-w'] },
  ]);
  tell(cv.text, { wait: false });
  await flyCam([K.CL.x - 2, 14.5, K.CL.z + 6], [K.CL.x + 10, 7, K.CL.z - 10], 1600);
  await chooseWord({ prompt: 'Which word fits?', sentence: cv.sentence, tiles: cv.tiles, answer: cv.answer, note: cv.note, hints: cv.hints });
  await filled(cv.answer); if (cv.answer === 'cliff') await earnCard('cliff');
  // ---- spot Mia and Toby zooming round the loop below
  tell('Zoom! He watched Mia and Toby in the minecart rush over a giant loop right where the green crystals were.', { wait: false });
  await flyCam([K.CL.x + 2, 13, K.CL.z + 2], [6, 7, -8], 1400);
  await pick3D({ prompt: 'Find Mia and Toby! Tap their cart.', answer: 'cart', targets: [{ id: 'cart', obj: K.hitBox }], hints: ['Look at the green loop!', 'It goes round and round.'] });
  leo.pose('point'); sfx('great');
  // the water slide
  tell('Next to the cliff, he found a smooth rock path filled with rushing water. It looked just like a fun water slide! Leo took a deep breath, pinched his nose, and jumped right in.', { wait: false });
  await flyCam([K.CL.x + 7, 14, K.CL.z + 8], [K.CL.x + 2, 10.5, K.CL.z + 2], 1300);
  await tapOn();
  playMusic('danger'); sfx('whoosh'); leo.pose('cheer');
  const cam = new THREE.Vector3(), look = new THREE.Vector3(); let sl = 0;
  followCam(() => { const p = K.slidePath.getPointAt(Math.min(sl, 1)), q = K.slidePath.getPointAt(Math.max(0, sl - 0.06)); cam.copy(q).add(new THREE.Vector3(0, 2.4, 0)); look.copy(p); return [cam, look]; });
  await tween(3600, e => { sl = e; const p = K.slidePath.getPointAt(e), tg = K.slidePath.getTangentAt(e); leo.g.position.copy(p).add(new THREE.Vector3(0, 0.1, 0)); leo.g.rotation.set(0, Math.atan2(tg.x, tg.z), 0); });
  stopFollow();
  // ---- the river: spinning in the swift water
  const V = buildRiver(); V.R.g.visible = false; V.gates.forEach(g => g.visible = false);
  const L = V.leo; V.leoLog.remove(L.g); V.w.add(L.g); L.pose('scared'); L.g.position.set(0, -0.6, -6);
  V.leoLog.position.set(-2.2, 0.1, 2);
  let spin = true; const sOff = onTick((t, dt) => { if (spin) { L.g.rotation.y += dt * 3; L.g.position.y = -0.6 + Math.sin(t * 3) * 0.08; } });
  sfx('crash'); sparkles(new THREE.Vector3(0, 0.3, -6), 0xE6F6FF, 40);
  setCam([3.2, 3.4, 0], [0, 0, -6]);
  await tell('Whoosh! The slide dropped him into the deep river. The water was far too swift, and Leo spun around in the fast water.');
  // ---- science: what floats?
  tell('He needed something to help him stay up.', { wait: false });
  await think(pickV(9, [
    { prompt: 'What could help Leo stay up in the water?', options: ['A floating log', 'A heavy rock', 'A metal cart wheel'], answer: 'A floating log', hints: ['Which one floats?'] },
    { prompt: 'Which one will FLOAT?', options: ['A wooden log', 'A big stone', 'An iron key'], answer: 'A wooden log', hints: ['Wood floats. Stone and iron sink.'] },
    { prompt: 'Why does a log help Leo?', options: ['Wood floats on water', 'Logs are warm', 'Logs can swim'], answer: 'Wood floats on water', hints: ['Think: float or sink?'] },
  ]));
  tell('Luckily, he bumped into an old log floating by. He grabbed it tight and drifted down the dark river until he saw a bright light, and Mia paddled over to {fetch} him.', { wait: false });
  await moveTo(V.leoLog, [0, 0.1, -5.6], 1400, { face: false });
  spin = false; sOff(); V.w.remove(L.g); V.leoLog.add(L.g); L.g.position.set(0, 0.32, 0); L.g.rotation.set(0, Math.PI * 0.15, 0); L.pose('hold');
  // drifting to the light; Mia's cart comes paddling up behind
  let z = -5.6; const dOff = onTick((t, dt) => { z = Math.max(-40, z - dt * 2.6); V.leoLog.position.z = z; });
  followCam(() => { cam.set(2.4, 3.0, z + 6); look.set(0, 0.4, z - 4); return [cam, look]; });
  await wait(2600);
  V.R.g.visible = true; V.R.g.rotation.set(0, Math.PI, 0); V.paddle.visible = true; const M = V.R.cast.mia; const row = onTick(t => { M.AR.rotation.x = -0.6 + Math.sin(t * 6) * 0.7; });
  let rz = z + 7; const rOff = onTick((t, dt) => { rz = Math.max(z + 1.3, rz - dt * 4); V.R.g.position.set(0.9, 0.1 + Math.sin(t * 2.2) * 0.05, rz); });
  while (z > -30) await wait(40);
  // ---- fetch (rotates on replays)
  await chooseWord(pickV(9, [
    { prompt: 'Which word is spelled right?', sentence: 'Mia paddled over to {_} him.', tiles: ['fetch', 'fech', 'fetsh'], answer: 'fetch', note: 'fetch = go and get. It ends with -tch, like catch.', hints: ['It ends like catch: -tch.', 'f – e – t – c – h'] },
    { prompt: 'Which word fits?', sentence: 'Mia paddled over to {_} him.', tiles: ['fetch', 'fence', 'feather'], answer: 'fetch', note: 'fetch = go and get', hints: ['It means go and get.', 'Toby likes to play ___ with a ball!'] },
    { prompt: 'Which word means “go and get”?', sentence: 'Mia paddled over to {_} him.', tiles: ['fetch', 'forget', 'follow'], answer: 'fetch', note: 'fetch = go and get', hints: ['A dog can ___ a ball.', 'fetch!'] },
  ]));
  row(); M.pose('reach'); await filled('fetch'); await earnCard('fetch');
  if (await offerStretch('Three words that sound the same.')) {
    await chooseWord(pickV(9, [
      { prompt: 'Bonus! Which word fits?', sentence: 'The water was far {_} swift.', tiles: ['to', 'too', 'two'], answer: 'too', note: 'too = very / also · two = 2 · to = toward', hints: ['It means VERY.', 'too has two o’s.'] },
      { prompt: 'Bonus! Which word fits?', sentence: 'Mia paddled {_} the log.', tiles: ['to', 'too', 'two'], answer: 'to', note: 'to = toward', hints: ['It means toward.', 'Just one o.'] },
      { prompt: 'Bonus! Which word fits?', sentence: 'Leo and Mia are {_} friends.', tiles: ['to', 'too', 'two'], answer: 'two', note: 'two = 2', hints: ['It is a number.', 't-w-o'] },
    ]));
    star(9);
  }
  dOff(); rOff(); stopFollow();
  // ---- back to the beach (now): Leo finishes his story
  const lift = await memory(800); playMusic('meadow');
  const B = buildBeach(); const k = B.cast;
  k.leo.g.position.set(-0.6, 0, 0); k.mia.g.position.set(0.6, 0, 0.2); k.leo.g.rotation.y = Math.PI - 0.5; k.mia.g.rotation.y = Math.PI + 0.5;
  setCam([0.2, 1.7, -4.6], [0, 0.9, 0.4]); lift();
  k.leo.pose('cheer'); k.mia.pose('cheer'); k.toby.pose('wag');
  await tell('Leo is finally safe...');
  hideStory(); sfx('great'); sparkles(new THREE.Vector3(0, 1.6, 0.4), 0xFFE58A, 40);
  await flyCam([5, 12, -20], [0, 0, -2], 3600);
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
