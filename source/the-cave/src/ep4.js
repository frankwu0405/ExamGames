// Episode 4 — The Lost Island. Stops 10–12. Frank's text word for word; each line read once; replays rotate.
import { S, save, sfx, wait, h, shuffle } from './core.js';
import { THREE, setCam, flyCam, followCam, stopFollow, quake, tween, moveTo, onTick, sparkles, camera, scene, cut, dolly, lens } from './gfx.js';
import { letterbox, frost, mist, fogThicken, iceSpread, snow } from './effects.js';
import { makeVarn } from './varn.js';
import { buildIslandTop, buildDigBeach, buildClearSea } from './sets4.js';
import { tell, tapOn, filled, hideStory, chooseWord, pick3D, spellOn, order, think, offerStretch, earnCard, toby, spyglass, MODE } from './ui.js';
import { playMusic } from './music.js';

const star = n => { S.stars[n] = 1; save(); sfx('great'); };
const visits = n => (S.stops[n] && S.stops[n].visits) || 0;
const finish = n => { const v = visits(n) + 1; S.stops[n] = Object.assign(S.stops[n] || {}, { done: 1, t: Date.now(), visits: v }); if (MODE.captain && MODE.perfect) { S.captain = S.captain || {}; S.captain[n] = 1; } save(); };
const pickV = (n, pool) => pool[visits(n) % pool.length];
const run = async (c, to, ms, opt) => { c.pose('run'); await moveTo(c.g, to, ms, opt); c.pose('idle'); };
const walk = async (c, to, ms, opt) => { c.pose('walk'); await moveTo(c.g, to, ms, opt); c.pose('idle'); };

// ================================================================ stop 10 — the lost island
export async function stop10() {
  playMusic('meadow');
  const I = buildIslandTop(); const { leo, mia, toby: dog } = I.cast;
  setCam([12, 6, 20], [-2, 4, 0]);
  // climbing the cliff
  const pathUp = [[1, 1.4, 5], [-1, 3.6, 3.6], [-2.6, 6.2, 2.2], [-3.8, 9.4, 0.6]];
  tell('Mia and Leo climbed the high, rocky cliff.', { wait: false });
  (async () => { for (const p of pathUp) await walk(leo, p, 900); })(); (async () => { await wait(300); for (const p of pathUp) await walk(mia, [p[0] + 0.9, p[1], p[2] + 0.4], 900); })(); (async () => { await wait(150); for (const p of pathUp) await run(dog, [p[0] + 0.4, p[1], p[2] + 1], 850); })();
  await flyCam([4, 12, 10], [-4, 8.5, 0], 3600);
  [leo, mia].forEach(c => { c.g.rotation.y = -2.4; c.pose('scared'); });
  // ---- the gap word: island (rotates on replays)
  const iv = pickV(10, [
    { text: 'When they reached the top, they gasped. They were on a wild, lost {island} in the middle of the sea!', sentence: 'They were on a wild, lost {_} in the middle of the sea!', tiles: ['island', 'iland', 'eyeland'], answer: 'island', note: 'island has a quiet s: is-land', hints: ['It has a quiet letter in the middle.', 'i – s – l – a – n – d'] },
    { text: 'When they reached the top, they {gasped}. They were on a wild, lost island in the middle of the sea!', sentence: 'When they reached the top, they {_}.', tiles: ['gasped', 'gaspped', 'gaspt'], answer: 'gasped', note: 'gasp + ed = gasped', hints: ['Just add -ed.', 'g – a – s – p – e – d'] },
    { text: 'When they reached the top, they gasped. They were on a {wild}, lost island in the middle of the sea!', sentence: 'They were on a {_}, lost island.', tiles: ['wild', 'mild', 'wide'], answer: 'wild', note: 'wild = nobody lives there; nature everywhere', hints: ['Nobody lives there. Lots of trees and animals.', 'w – i – l – d'] },
  ]);
  tell(iv.text, { wait: false });
  await chooseWord({ prompt: 'Which word fits?', sentence: iv.sentence, tiles: iv.tiles, answer: iv.answer, note: iv.note, hints: iv.hints });
  await filled(iv.answer); if (iv.answer === 'island') await earnCard('island');
  // ---- the spyglass: find the hometown's Ferris wheel far across the sea
  tell('Far across the blue water, they spotted the tiny, spinning Ferris wheel of their hometown.', { wait: false });
  setCam([-4, 11, 1.2], [-20, 8, -30]);
  await spyglass({ prompt: 'Drag to look around. Find the Ferris wheel of home!', target: I.wheel, hints: ['Look far away, across the water.', 'It is red and it spins.'] });
  sfx('great'); [leo, mia].forEach(c => c.pose('cheer')); dog.pose('wag');
  // the secret path under the sea
  await flyCam([-10, 18, 2], [-26, -3.4, -38], 1600);
  await tell('Leo looked back at the cave. Someone had dug a huge, secret path all the way under the ocean.');
  await think(pickV(10, [
    { prompt: 'Who could have dug the secret path?', options: ['People with shovels and carts', 'Toby the puppy', 'The fish'], answer: 'People with shovels and carts', hints: ['Remember the metal tracks and the old cart in the cave.'] },
    { prompt: 'Why is the path a secret?', options: ['Someone hid it on purpose', 'It is too small to see', 'It was made today'], answer: 'Someone hid it on purpose', hints: ['A secret is something hidden.'] },
    { prompt: 'Where does the secret path go?', options: ['Under the sea to their hometown', 'Up into the sky', 'Into the island’s trees'], answer: 'Under the sea to their hometown', hints: ['They came through it from the cave near home!'] },
  ]));
  if (await offerStretch('Two small words make one big word.')) {
    await chooseWord(pickV(10, [
      { prompt: 'Bonus! home + town = ?', sentence: 'the Ferris wheel of their {_}', tiles: ['hometown', 'townhome', 'homtown'], answer: 'hometown', hints: ['Keep the order: home, then town.', 'home + town'] },
      { prompt: 'Bonus! sail + boat = ?', sentence: 'They will build a {_}.', tiles: ['sailboat', 'boatsail', 'salboat'], answer: 'sailboat', hints: ['sail first, then boat.', 'sail + boat'] },
      { prompt: 'Bonus! sun + shine = ?', sentence: 'They stood in the warm {_}.', tiles: ['sunshine', 'sunshin', 'shinesun'], answer: 'sunshine', hints: ['sun first, then shine.', 'sun + shine'] },
    ]));
    star(10);
  }
  hideStory(); finish(10);
}

// ================================================================ stop 11 — Toby's dig, and building the sailboat
export async function stop11() {
  playMusic('meadow');
  const D = buildDigBeach(); const { leo, mia, toby: dog } = D.cast;
  setCam([0, 3.4, 9.5], [0, 0.6, -2]);
  dog.pose('sit');
  tell('Down on the beach, Toby started sniffing and digging in the sand.', { wait: false });
  await run(dog, [-2, 0, -1.5], 900); dog.pose('bark'); sfx('bark'); await wait(600);
  // ---- read the clue: where should Toby dig?
  const dv = pickV(11, [
    { clue: 'Dig next to the palm tree, NOT by the rock.', answer: 'palm' },
    { clue: 'Do not dig by the water. Do not dig by the rock. Dig where the tree is!', answer: 'palm' },
    { clue: 'Toby smells something under the tall, leafy tree. Dig there!', answer: 'palm' },
  ]);
  await flyCam([0, 7, 7], [0, 0, -4], 1000);
  await pick3D({ prompt: dv.clue, answer: 'palm', targets: D.mounds.map(m => ({ id: m.userData.id, obj: m })), hints: ['Read the clue again slowly.', 'Find the palm tree.'], onWrong: () => { dog.pose('sit'); sfx('whine'); } });
  await run(dog, [-4.3, 0, -1.4], 700); dog.g.rotation.y = Math.PI; dog.pose('bark');
  const mound = D.mounds.find(m => m.userData.id === 'palm');
  for (let i = 0; i < 6; i++) { sparkles(new THREE.Vector3(-4.3, 0.3, -2.4), 0xE6C886, 10); sfx('pop'); await wait(220); }
  await tween(900, e => { mound.scale.y = 0.35 * (1 - e); D.pole.position.y = -3.4 + e * 3.1; }); sfx('great');
  // ---- the gap word, spelled on shells (rotates on replays)
  const sp = pickV(11, [
    { text: 'Mia and Leo watched as he pulled out something crazy: a giant, old pirate {flag} still hanging onto a long wooden pole!', word: 'flag', decoys: 'tae', prompt: 'Tap the shells to spell the word. It waves on a pole.', hints: ['It starts with fl.', 'F – L – A – G'] },
    { text: 'Mia and Leo watched as he pulled out something crazy: a giant, old {pirate} flag still hanging onto a long wooden pole!', word: 'pirate', decoys: 'o', prompt: 'Tap the shells to spell the word. They sail ships and look for gold!', hints: ['pi – rate', 'P – I – R – A – T – E'] },
    { text: 'Mia and Leo watched as he pulled out something crazy: a giant, old pirate flag still hanging onto a long wooden {pole}!', word: 'pole', decoys: 'ais', prompt: 'Tap the shells to spell the word. It is long and holds the flag.', hints: ['It ends with a quiet e.', 'P – O – L – E'] },
  ]);
  tell(sp.text, { wait: false });
  await flyCam([0, 4.6, 4], [0, 0.2, -4.6], 1000);
  await spellOn({ prompt: sp.prompt, word: sp.word, decoys: sp.decoys, objs: D.shells, hints: sp.hints });
  await filled(sp.word); if (sp.word === 'flag') await earnCard('flag');
  // the flag can't get them home… but the cart is made of wood
  await flyCam([3, 3, 9], [1.4, 0.8, 1.5], 1100);
  tell('It could catch the wind, but it could not get them home. Then, Leo tapped on the tipped over minecart. Thump, thump. It was made of thick wood and not metal! That is why they didn’t sink in the river.', { wait: false });
  await walk(leo, [1.6, 0, 2.2], 900); leo.g.rotation.y = 0.9; leo.pose('reach'); sfx('clack'); await wait(300); sfx('clack');
  await think(pickV(11, [
    { prompt: 'Why didn’t the cart sink in the river?', options: ['It is made of wood, and wood floats.', 'It has four wheels.', 'Toby was inside it.'], answer: 'It is made of wood, and wood floats.', hints: ['Think: wood or metal? Which floats?'] },
    { prompt: 'What would happen to a METAL cart in the river?', options: ['It would sink.', 'It would fly.', 'It would float away.'], answer: 'It would sink.', hints: ['Heavy metal does not float.'] },
    { prompt: 'Which one floats on water?', options: ['A wooden cart', 'A metal key', 'A big rock'], answer: 'A wooden cart', hints: ['Wood floats.'] },
  ]));
  // ---- building the sailboat: put the steps in order (the boat gets built)
  tell('Using strong vines, they tied the pole to the cart to build a sailboat.', { wait: false });
  await order({ prompt: 'How do you build the sailboat? Put the steps in order.', compact: true, items: ['Turn the cart right side up.', 'Stand the pole in the cart.', 'Tie it on with strong vines.', 'Let the flag catch the wind.'], hints: ['First, the cart has to sit the right way up.', 'The pole goes in before you tie it.'] });
  await tween(700, e => { D.theCart.rotation.z = 1.25 * (1 - e); }); sfx('clack');
  D.pole.position.set(D.theCart.position.x, 0.3, D.theCart.position.z); D.pole.rotation.set(0, 0, 0); sfx('pop');
  for (let i = 0; i < 2; i++) { const v = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.04, 6, 16), new THREE.MeshBasicMaterial({ color: 0x3E8E41 })); v.rotation.x = Math.PI / 2; v.position.set(D.theCart.position.x, 0.9 + i * 0.3, D.theCart.position.z); D.w.add(v); sfx('pop'); await wait(250); }
  sparkles(new THREE.Vector3(D.theCart.position.x, 2.5, D.theCart.position.z), 0xFFE58A, 30); sfx('great'); [leo, mia].forEach(c => c.pose('cheer')); dog.pose('wag');
  await tapOn();
  if (await offerStretch('Squeeze two words into one.')) {
    await chooseWord(pickV(11, [
      { prompt: 'Bonus! could not = ?', sentence: 'It {_} get them home.', tiles: ['couldn’t', 'could’nt', 'couldnt'], answer: 'couldn’t', note: 'could not → couldn’t', hints: ['The ’ takes the place of the o in not.', 'couldn’t'] },
      { prompt: 'Bonus! did not = ?', sentence: 'That is why they {_} sink.', tiles: ['didn’t', 'did’nt', 'didnt'], answer: 'didn’t', note: 'did not → didn’t', hints: ['The ’ takes the place of the o.', 'didn’t'] },
      { prompt: 'Bonus! it is = ?', sentence: '{_} made of thick wood!', tiles: ['It’s', 'Its', 'Its’'], answer: 'It’s', note: 'it is → it’s', hints: ['The ’ takes the place of the i in is.', 'It’s'] },
    ]));
    star(11);
  }
  hideStory(); finish(11);
}

// ================================================================ stop 12 — the clear sea, the sunken ship, the sign… the ice
export async function stop12() {
  playMusic('map');
  const C = buildClearSea(); const B = C.boat; const { leo, mia, toby: dog } = B.cast;
  let z = 6, sp = 0; const off = onTick((t, dt) => { z -= sp * dt; B.g.position.set(Math.sin(z * 0.05) * 1.5, 0.15 + Math.sin(t * 1.6) * 0.06, z); B.g.rotation.set(Math.sin(t * 1.3) * 0.04, Math.PI, Math.sin(t * 1.7) * 0.05); });
  const cam = new THREE.Vector3(), look = new THREE.Vector3();
  followCam(() => { cam.set(B.g.position.x + 3.5, 3.4, z + 7.5); look.set(B.g.position.x, 0.6, z - 6); return [cam, look]; });
  B.wind.k = 1; mia.pose('cheer'); leo.pose('point');
  sp = 3; tell('They pushed their wooden cart into the sea, and the wind filled the giant flag.', { wait: false });
  await wait(2600); await tapOn();
  // ---- look down through the water: spot the sunken ship, then name the clue word
  tell('The ocean water was very {clear}. As they sailed, they looked down and saw a sunken pirate ship in the deep sand.', { wait: false });
  while (z > -14) await wait(40); sp = 0.4;
  stopFollow(); await flyCam([-1, 4.5, z - 6], [-5, -5, -28], 1400);
  await pick3D({ prompt: 'Look into the water. Tap the sunken ship!', answer: 'ship', targets: [{ id: 'ship', obj: C.shipHit }], hints: ['Look down, under the water.', 'It is big and brown, on the sand.'] });
  const cv = pickV(12, [
    { prompt: 'They could SEE the ship on the sand. So the water was very…', tiles: ['clear', 'dirty', 'dark'], answer: 'clear', note: 'clear = you can see right through it', hints: ['Could you see the ship through dirty water?', 'You can see through clear water.'] },
    { prompt: 'Which word is spelled right?', tiles: ['clear', 'cleer', 'clere'], answer: 'clear', note: 'clear has ea, like in sea', hints: ['It has ea, like sea.', 'c – l – e – a – r'] },
    { prompt: 'Which word means “you can see through it”?', tiles: ['clear', 'cloudy', 'muddy'], answer: 'clear', note: 'clear = see-through', hints: ['Cloudy and muddy water is hard to see through.', 'clear'] },
  ]);
  await chooseWord({ prompt: cv.prompt, sentence: 'The ocean water was very {_}.', tiles: cv.tiles, answer: cv.answer, note: cv.note, hints: cv.hints });
  await filled('clear'); await earnCard('clear');
  // Leo's puzzle
  tell('“If the ship is down there, how did the flag get up on the beach?” Leo asked.', { wait: false });
  await think(pickV(12, [
    { prompt: 'What do you think? How did the flag get onto the beach?', options: ['Someone carried it there', 'It flew there by itself', 'A fish brought it'], answer: 'Someone carried it there', hints: ['A flag cannot walk. Who could bring it?'] },
    { prompt: 'Who used to sail the sunken ship?', options: ['Pirates', 'Puppies', 'Penguins'], answer: 'Pirates', hints: ['Look at the black flag with the skull.'] },
    { prompt: 'Why is Leo puzzled?', options: ['The ship is under the sea, but its flag was on land', 'He lost his shoe', 'The water is too warm'], answer: 'The ship is under the sea, but its flag was on land', hints: ['Where was the ship? Where was the flag?'] },
  ]));
  // ---- the sign
  tell('Just then, they saw a {sign} stuck between the underwater rocks. Mia read it slowly: “Keep... Out...?”', { wait: false });
  await flyCam([9.5, 1.6, -35.5], [6, -2.2, -44], 1600);
  await chooseWord(pickV(12, [
    { prompt: 'Which word is spelled right?', sentence: 'they saw a {_} stuck between the rocks', tiles: ['sign', 'sine', 'sighn'], answer: 'sign', note: 'sign has a quiet g', hints: ['It has a quiet letter.', 's – i – g – n'] },
    { prompt: 'Which word fits?', sentence: 'they saw a {_} stuck between the rocks', tiles: ['sign', 'sing', 'sink'], answer: 'sign', note: 'sign = a board with words on it', hints: ['It is a board with words on it.', 's – i – g – n'] },
    { prompt: 'Which word fits?', sentence: 'they saw a {_} stuck between the rocks', tiles: ['sign', 'swing', 'spin'], answer: 'sign', note: 'sign = a board with words on it', hints: ['It tells you something.', 'sign'] },
  ]));
  await filled('sign'); await earnCard('sign');
  await think({ prompt: 'What does KEEP OUT mean?', options: ['Do not come in here', 'Please come in', 'Keep the boat'], answer: 'Do not come in here', hints: ['Out is the opposite of in.'] });
  // ---- the cold, the fog, the ice… and the shadow
  playMusic('cave'); letterbox(true);
  const bx = () => B.g.position.x;
  // a wall of grey fog rolls over the sea and swallows the town
  const wall = mist(C.w, { count: 46, center: new THREE.Vector3(bx(), 0, z - 75), spread: 42, y: [0.5, 10], size: [16, 28], color: 0xD3DAE4, opacity: 0.9, drift: 0.2 });
  wall.show(1, 2500); wall.rollTo(new THREE.Vector3(bx(), 0, z - 10), 0.12);
  followCam(() => { cam.set(B.g.position.x + 3, 2.2, z + 9); look.set(B.g.position.x - 1, 2.6, z - 40); return [cam, look]; });
  sp = 2; tell('They were drifting closer to the Ferris wheel when the water suddenly turned freezing cold. A thick, grey fog rolled in, hiding the town from view.', { wait: false });
  fogThicken(scene, { near: 16, far: 75, color: 0xB4C0CE, ms: 6000 }); frost(0.4, 5000);
  await wait(5000); [leo, mia].forEach(c => c.pose('scared')); await tapOn();
  // ---- shades of cold: put the words in order
  await order({ prompt: 'Put the words in order. A little cold first, the coldest last.', items: ['cool', 'cold', 'freezing', 'frozen'], labels: ['a little cold', 'coldest 🧊'], hints: ['Cool is just a little cold.', 'Frozen means it turned to ice!'] });
  // the sea freezes ahead of them and races towards the boat
  sp = 0.8; letterbox(true); stopFollow();
  tell('Suddenly, the water ahead of them froze into solid ice, and their little wooden cart got stuck right in place!', { wait: false });
  const iceAt = new THREE.Vector3(bx(), 0, z - 16); const sheet = iceSpread(C.w, iceAt, { radius: 46, y: 0.12 }); sheet.m.material.opacity = 0.62;
  cut([bx() + 9, 2.4, z - 5], [bx() - 1, 0.2, z - 9], 50); dolly([bx() + 8, 2.8, z - 3.5], [bx() - 1, 0.2, z - 8], 4000);
  sfx('crash'); frost(0.65, 2500); let stuck = false;
  await sheet.grow(2800, r => { if (!stuck && r > 15.5) { stuck = true; sp = 0; quake(0.7, 0.15); sfx('clack'); B.wind.k = 0.1; } if (Math.random() < 0.12) { sfx('clack'); const a = Math.random() * Math.PI * 2; sheet.spike(new THREE.Vector3(iceAt.x + Math.cos(a) * r * 0.9, 0, iceAt.z + Math.sin(a) * r * 0.9), 0.6 + Math.random()); } });
  sp = 0; snow(C.w, { center: new THREE.Vector3(bx(), 0, z), area: 40, size: 0.14, fall: 0.3 }).show(0.8, 1500);
  await flyCam([bx() + 4, 3.2, z + 6], [bx(), 0.6, z - 2], 1800);
  await tapOn();
  // bubbles… a huge glowing shape rises under the ice
  playMusic('danger');
  tell('Then, the dark water began to bubble. A massive, glowing shadow started to rise from the deep water in front of them...', { wait: false });
  C.bubbles.position.set(bx(), 0, z); C.bubbles.visible = true;
  const V = makeVarn(C.w); V.g.position.set(bx(), -9.5, z - 2); V.set('swim'); V.state.glow = 2.4; V.state.sway = 0.6;
  letterbox(true); cut([bx() + 2.4, 5.5, z + 7], [bx(), -2, z - 13], 50); dolly([bx() + 1.6, 4.6, z + 4.5], [bx(), -2, z - 14], 7000);
  sfx('rumble'); quake(3, 0.12); dog.pose('bark'); sfx('bark');
  await tween(5000, e => { V.g.position.y = -9.5 + e * 3.6; V.state.glow = 2.4 + e; V.state.anger = e; });
  if (await offerStretch('A word that means the same.')) {
    await chooseWord(pickV(12, [
      { prompt: 'Bonus! massive means…', sentence: 'A {_} shadow rose from the water.', tiles: ['huge', 'tiny', 'thin'], answer: 'huge', note: 'massive = huge', hints: ['Massive is very, very big.', 'huge!'] },
      { prompt: 'Bonus! freezing means…', sentence: 'The water was {_}.', tiles: ['very cold', 'very hot', 'very fast'], answer: 'very cold', note: 'freezing = very cold', hints: ['Freezing makes ice.', 'very cold'] },
      { prompt: 'Bonus! solid ice is…', sentence: 'The water froze into {_} ice.', tiles: ['hard', 'soft', 'warm'], answer: 'hard', note: 'solid = hard all the way through', hints: ['You could stand on solid ice.', 'hard'] },
    ]));
    star(12);
  }
  off(); hideStory(); letterbox(false); frost(0, 600); finish(12);
  const cont = h('div', { class: 'tbc' }, h('div', {}, 'To be continued…')); document.body.append(cont); await wait(2600); cont.remove();
}

// ================================================================ sum up the episode
export async function sumUp4() {
  playMusic('cave');
  const ov = h('div', { class: 'sumup' }, h('div', { class: 'sumup-title' }, 'Sum it up!'), h('div', { class: 'sumup-sub' }, 'Pass the challenge to finish Episode 4'));
  document.body.append(ov); await wait(600);
  await order({ prompt: 'Put what happened in order.', compact: true, items: ['They climbed the high cliff.', 'Toby dug up a pirate flag.', 'They built a sailboat.', 'They saw a sunken ship.', 'The sea froze into ice.'], hints: ['What happened first?', 'The flag came before the sailboat.'] });
  await think({ prompt: 'Why did they build a sailboat?', options: ['To sail home across the sea', 'To catch fish', 'To play a game'], answer: 'To sail home across the sea', hints: ['Where did they want to go?'] });
  await think({ prompt: 'Who do you think is rising from the water?', options: ['A giant sea creature', 'A little duck', 'A friendly boat'], answer: 'A giant sea creature', hints: ['It is massive and it glows!'] });
  ov.remove(); S.ep4 = 1; save();
}
