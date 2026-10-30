// Episode 1 — The Cave. Three stops; Frank's text is used word for word, the activities sit inside the action.
// Every line is shown and read ONCE. On later visits the activities rotate to new versions (variant pools).
import { S, save, sfx, wait, h, shuffle } from './core.js';
import { THREE, setCam, flyCam, followCam, stopFollow, quake, tween, moveTo, onTick, sparkles, textTexture, builder, toon, world } from './gfx.js';
import { buildMeadow, buildChamber, buildTunnel } from './sets.js';
import { tell, tapOn, fillGap, filled, hideStory, chooseWord, pick3D, spellOn, flashlight, order, think, offerStretch, earnCard, toby, tobyHide, MODE } from './ui.js';
import { playMusic } from './music.js';

const star = n => { S.stars[n] = 1; save(); sfx('great'); };
const visits = n => (S.stops[n] && S.stops[n].visits) || 0;
const finish = n => { const v = visits(n) + 1; S.stops[n] = Object.assign(S.stops[n] || {}, { done: 1, t: Date.now(), visits: v }); if (MODE.captain && MODE.perfect) { S.captain = S.captain || {}; S.captain[n] = 1; } save(); };
const pickV = (n, pool) => pool[visits(n) % pool.length];    // first visit = the story's own version
const run = async (c, to, ms, opt) => { c.pose('run'); await moveTo(c.g, to, ms, opt); c.pose('idle'); };
const walk = async (c, to, ms, opt) => { c.pose('walk'); await moveTo(c.g, to, ms, opt); c.pose('idle'); };

// ================================================================ stop 1 — the meadow
export async function stop1() {
  playMusic('meadow');
  const m = buildMeadow(); const { leo, mia, toby: dog } = m.cast;
  setCam([0, 3.2, 13], [0, 1, 3]);
  let playing = true; const t0 = performance.now();
  const off = onTick(() => { if (!playing) return; const k = (performance.now() - t0) / 1000;
    dog.g.position.set(Math.cos(k * 1.6) * 2.2, 0, 4 + Math.sin(k * 1.6) * 1.4); dog.g.rotation.y = k * 1.6 + Math.PI; dog.pose('run');
    leo.g.position.set(Math.cos(k * 1.6 - 1.2) * 2.6, 0, 4 + Math.sin(k * 1.6 - 1.2) * 1.8); leo.g.rotation.y = k * 1.6 - 1.2 + Math.PI; leo.pose('run');
    mia.g.position.set(Math.cos(k * 1.6 + 2.6) * 2.8, 0, 4 + Math.sin(k * 1.6 + 2.6) * 1.9); mia.g.rotation.y = k * 1.6 + 2.6 + Math.PI; mia.pose('run'); });
  await tell('Leo and Mia were playing in the bright sun with Toby the puppy.');
  playing = false; off(); [leo, mia].forEach(c => c.pose('idle'));
  dog.g.position.set(0, 0, 4); dog.g.rotation.y = 0; leo.g.position.set(-1.3, 0, 5); mia.g.position.set(1.3, 0, 5.2); leo.g.rotation.y = 0.3; mia.g.rotation.y = -0.3; dog.pose('wag');
  flyCam([1.2, 1.6, 7.2], [0, 0.6, 4], 1200);
  await tell('He had soft brown fur. He was the smallest and fastest dog in town.');
  flyCam([0, 3.5, 12], [0, 1, -3], 1200); dog.g.rotation.y = Math.PI;
  sparkles(new THREE.Vector3(0, 1.2, -8.6), 0x9FEAFF, 30); sfx('chime');
  tell('Suddenly, Toby saw something bright. He barked and ran away!', { wait: false });
  dog.pose('bark'); sfx('bark'); await wait(900);
  run(dog, [0, 0, -9.2], 2300).then(() => { dog.g.visible = false; });
  [leo, mia].forEach(c => c.pose('point')); await wait(2300); [leo, mia].forEach(c => c.pose('idle'));
  await tapOn();
  // ---- activity: whose tracks? (comparing words + reading the clue). Replays use other comparing words from the story.
  await flyCam([0, 11, 9], [0, 0, -2], 1500);
  toby('Woof! My tracks got mixed up!');
  await wait(1500);
  const clue = pickV(1, [
    { sentence: 'Toby was the {_} dog in town.', base: 'small', tiles: ['-er', '-est', '-ly'], answer: 'smallest', hints: ['Toby is the smallest of ALL.', 'Use -est.'] },
    { sentence: 'Toby was the {_} dog in town. Zoom!', base: 'fast', tiles: ['-er', '-est', '-ly'], answer: 'fastest', hints: ['Toby is the fastest of ALL.', 'Use -est.'] },
    { sentence: 'Toby’s paws are {_} than a fox’s paws.', base: 'small', tiles: ['-er', '-est', '-ly'], answer: 'smaller', hints: ['Only TWO animals.', 'Two things? Use -er.'] },
  ]);
  await chooseWord({ prompt: 'Finish the clue.', ...clue });
  await pick3D({ prompt: 'Tap Toby’s tracks. They are the smallest.', answer: 'toby', word: 'smallest',
    targets: Object.entries(m.trails).map(([id, g]) => ({ id, obj: g.userData.hit })),
    hints: ['Too big for a puppy!', 'Find the tiniest prints.'] });
  m.trails.toby.children.forEach(p => { if (p !== m.trails.toby.userData.hit) p.material = new THREE.MeshBasicMaterial({ color: 0xFFC94A }); });
  if (await offerStretch('Compare two animals.')) {
    await chooseWord(pickV(1, [
      { prompt: 'Bonus! Pick the right one.', sentence: 'The fox’s prints were {_} than Toby’s.', tiles: ['biger', 'bigger', 'biggest'], answer: 'bigger', note: 'Short words like big double the last letter: big → bigger.', hints: ['Two animals? Use -er.', 'big → bigger. Two g’s!'] },
      { prompt: 'Bonus! Pick the right one.', sentence: 'The big dog’s prints were the {_} of all.', tiles: ['bigest', 'biggest', 'bigger'], answer: 'biggest', note: 'big → bigger → biggest (double the g!).', hints: ['All of them? Use -est.', 'big → biggest. Two g’s!'] },
      { prompt: 'Bonus! Pick the right one.', sentence: 'The cave looked {_} than the sunny meadow.', tiles: ['scaryer', 'scarier', 'scariest'], answer: 'scarier', note: 'Words ending in y change y to i: scary → scarier.', hints: ['Two places? Use -er.', 'scary → scarier. y turns into i.'] },
    ]));
    star(1);
  }
  await flyCam([0, 3, 10], [0, 1.2, -6], 1300);
  run(leo, [-0.8, 0, -5.8], 3000); run(mia, [0.8, 0, -5.6], 2800);
  await tell('They followed his paw prints to a dark, scary cave.');
  await flyCam([0, 2.1, 1.2], [0, 1.9, -8.4], 1200); leo.g.rotation.y = mia.g.rotation.y = Math.PI;
  // ---- activity: spell a missing word on the stones around the cave mouth (rotates on replays)
  const sp = pickV(1, [
    { text: 'They had to {explore} it to find their puppy.', word: 'explore', decoys: 'a', prompt: 'Tap the stones to spell the word. It means “look around”.', hints: ['It starts with EX.', 'E – X – P – L – O – R – E'] },
    { text: 'The air inside was much {colder} than the warm air.', word: 'colder', decoys: 'ia', prompt: 'Tap the stones to spell: cold + er.', hints: ['Start with cold.', 'C – O – L – D – E – R'] },
    { text: 'They had to be the {bravest} kids to save their pet.', word: 'bravest', decoys: 'u', prompt: 'Tap the stones to spell: brave + est.', hints: ['brave has an e. Just add -st.', 'B – R – A – V – E – S – T'] },
  ]);
  const para = ['They had to {explore} it to find their puppy.', 'The air inside was much {colder} than the warm air.', 'They had to be the {bravest} kids to save their pet.'].map(t => t === sp.text ? t : t.replace(/[{}]/g, '')).join(' ');
  tell(para, { wait: false });
  await spellOn({ prompt: sp.prompt, word: sp.word, decoys: sp.decoys, objs: m.stones, hints: sp.hints });
  sfx('great'); await filled(sp.word);
  if (sp.word === 'explore') await earnCard('explore');
  walk(leo, [-0.6, 0, -8.6], 2600); walk(mia, [0.6, 0, -8.6], 2600);
  await flyCam([0, 1.6, -5.5], [0, 1.2, -10], 2600);
  [leo, mia].forEach(c => c.g.visible = false);
  hideStory(); finish(1);
}

// ================================================================ stop 2 — the glowing stone
export async function stop2() {
  playMusic('cave');
  const c = buildChamber(); const { leo, mia, toby: dog } = c.cast; const floor = c.floorG.children[0];
  setCam([0, 2.6, 11], [0, 1.4, 4]);
  walk(leo, [-0.8, 0, 3.5], 3000); walk(mia, [0.8, 0, 3.6], 3000);
  await tell('They walked slowly into the dark.');
  // ---- activity: sweep the flashlight to find Toby
  c.spot.position.set(0, 2.4, 5);
  await flyCam([0, 2.4, 7], [0, 1.2, -2], 900);
  sfx('bark');
  await flashlight({ spot: c.spot, surfaces: [c.shell, floor], prompt: 'It is dark! Move your finger to find Toby.', find: { obj: dog.g },
    hints: ['Look at the back of the cave!'] });
  dog.pose('wag'); sfx('bark'); sfx('glow');
  tween(1500, e => { c.gemLight.intensity = e * 16; c.w.children[0].intensity = 0.25 + e * 0.9; });
  await tell('Then, Mia saw Toby! He was sitting next to a glowing blue stone on a rock.');
  walk(leo, [-0.9, 0, -2.6], 2400); walk(mia, [0.5, 0, -2.8], 2400);
  await flyCam([2.2, 2.2, 0.5], [0, 1.3, -5], 2400);
  // ---- activity: comparing words hidden on the walls (rotates on replays)
  const wv = pickV(2, [
    { text: 'It was the coolest and best treasure ever! Its beautiful blue light was much {brighter} than their flashlights.', words: ['bright', 'brightest', 'brighter', 'darker'], answer: 'brighter', prompt: 'Shine your light on the walls. Tap the word that fits.', hints: ['THAN means two things.', 'Two things? Use -er.'] },
    { text: 'It was the {coolest} and best treasure ever! Its beautiful blue light was much brighter than their flashlights.', words: ['cool', 'cooler', 'coolest', 'warmest'], answer: 'coolest', prompt: 'Shine your light on the walls. Tap the word that fits.', hints: ['The best EVER means most of all.', 'Most of all? Use -est.'] },
    { text: 'It was the coolest and best treasure ever! Its {beautiful} blue light was much brighter than their flashlights.', words: ['beautiful', 'beautyful', 'beautifull', 'butiful'], answer: 'beautiful', prompt: 'Shine your light. Tap the word spelled right.', hints: ['beauty + ful. y turns into i.', 'Only one L at the end.'] },
  ]);
  [[-6.5, 2.8, -6.5], [-2.4, 3.9, -9.4], [2.6, 3.6, -9.3], [6.6, 2.7, -6.2]].forEach((p, i) => c.place(wv.words[(i + visits(2)) % 4], ...p));
  tell(wv.text, { wait: false });
  await flyCam([0, 2.3, 4.5], [0, 2.8, -6], 900);
  await flashlight({ spot: c.spot, surfaces: [c.shell, floor], words: c.words, answer: wv.answer, prompt: wv.prompt, hints: wv.hints });
  c.words.forEach(w => w.visible = false); await filled(wv.answer);
  await flyCam([2.2, 2.2, 0.5], [0, 1.3, -5], 1000);
  mia.g.rotation.y = Math.PI - 0.3; mia.pose('reach');
  await tell('It made the room look magical. “Wow,” Mia said. She reached out to grab it.');
  if (await offerStretch('A tricky word that breaks the rules.')) {
    await chooseWord(pickV(2, [
      { prompt: 'Bonus! Pick the right word.', sentence: 'It was the coolest and {_} treasure ever!', tiles: ['goodest', 'better', 'best'], answer: 'best', note: 'good → better → best. No -er or -est here!', hints: ['goodest is not a word!', 'good, better, best.'] },
      { prompt: 'Bonus! Pick the right word.', sentence: 'The dark was {_} than the meadow, but the stone made it better.', tiles: ['badder', 'worse', 'worst'], answer: 'worse', note: 'bad → worse → worst.', hints: ['badder is not a word!', 'bad, worse, worst.'] },
      { prompt: 'Bonus! Pick the right word.', sentence: 'Toby found {_} treasure than the kids did!', tiles: ['more', 'most', 'mucher'], answer: 'more', note: 'much → more → most.', hints: ['THAN means two things.', 'much, more, most.'] },
    ]));
    star(2);
  }
  // Mia lifts the stone… CLICK. Cracks race out from the rock: the stone was holding the floor up!
  await moveTo(mia.g, [0.25, 0, -4.1], 600, { face: false }); c.gem.parent.remove(c.gem); mia.pose('hold');
  const held = builder(mia.g).add(new THREE.OctahedronGeometry(0.2), toon(0x5AD1FF, { emissive: 0x2AA8E8, emissiveIntensity: 0.9 }), 0, 0.95, 0.38, { line: 0.02 }); held.scale.y = 1.6;
  sfx('click'); await wait(300);
  await flyCam([1.5, 5.5, 2.5], [0.5, 0, -3.5], 900);
  const grow = (segs, ms) => segs.reduce((p, seg, i) => p.then(() => tween(ms / segs.length, e => { seg.scale.z = Math.max(0.001, e); })), Promise.resolve());
  sfx('rumble'); quake(1.2, 0.08);
  await Promise.all(c.cracks.slice(0, 4).map(sg => grow(sg, 1100)));
  // ---- activity: shades of loudness, to find the missing sound word (rotates on replays)
  tell('Click! When she grabbed the stone, the cave gave a loud {rumble}.', { wait: false });
  const ladderSet = pickV(2, [['whisper', 'squeak', 'bark', 'rumble'], ['tap', 'knock', 'bang', 'rumble'], ['hum', 'chirp', 'shout', 'rumble']]);
  await order({ prompt: 'Put the sounds in order. Quiet first, loud last.', items: ladderSet, labels: ['quiet 🤫', 'LOUD 💥'], word: 'rumble',
    hints: [`${ladderSet[0]} is the quietest.`, `The loudest can shake a cave!`] });
  fillGap('rumble'); playMusic('danger'); sfx('rumble'); quake(2.2, 0.25); [leo, mia].forEach(k => k.pose('scared')); dog.pose('bark'); sfx('bark');
  Promise.all(c.cracks.slice(4).map(sg => grow(sg, 900)));
  await filled('rumble'); await earnCard('rumble');
  // the floor tips toward the dark tunnel; small stones roll, rocks start to fall
  tell('The sound was louder than a roaring lion. The flat rock floor tipped down. It became the steepest slide in the cave!', { wait: false });
  await flyCam([-3, 3.2, 6], [2, 0.5, -3], 1100);
  sfx('rumble'); quake(2.0, 0.2);
  await tween(1800, e => { c.floorG.rotation.x = -e * 0.09; c.floorG.rotation.z = -e * 0.12; });
  for (let i = 0; i < 5; i++) { c.drop(-3 + Math.random() * 8, -6 + Math.random() * 7, 0.25 + Math.random() * 0.2, 6.8, () => { sfx('crash'); quake(0.3, 0.08); }); await wait(260); }
  await tapOn();
  // ---- activity: loose rocks shake in the roof, carrying letters. Each right letter knocks one down — the kids dodge toward the cart.
  const sw = pickV(2, [
    { text: 'Small rocks fell from the roof. Mia and Toby jumped into a rusty old {cart} to stay safe.', word: 'cart', decoys: 'ko', prompt: 'Tap the letters to spell the word. It is a box on wheels.', hints: ['car + t', 'C – A – R – T'] },
    { text: 'Small {rocks} fell from the roof. Mia and Toby jumped into a rusty old cart to stay safe.', word: 'rocks', decoys: 'a', prompt: 'Tap the letters to spell the word.', hints: ['It ends with c-k-s.', 'R – O – C – K – S'] },
    { text: 'Small rocks fell from the {roof}. Mia and Toby jumped into a rusty old cart to stay safe.', word: 'roof', decoys: 'ue', prompt: 'Tap the letters to spell the word. It is the top of the cave.', hints: ['It has o-o in the middle.', 'R – O – O – F'] },
  ]);
  tell(sw.text, { wait: false });
  tween(800, e => { c.spot.intensity = 60 * (1 - e * 0.8); });
  await flyCam([0.6, 3.1, 7.6], [1.1, 2.6, -2.2], 1100);
  const shakeRocks = onTick(t => c.loose.forEach((r, i) => { if (!r.userData.fell) { r.rotation.z = Math.sin(t * 22 + i) * 0.08; r.rotation.x = Math.cos(t * 19 + i) * 0.06; } }));
  let rain = true; (async () => { while (rain) { c.drop(-4 + Math.random() * 9, -7 + Math.random() * 6, 0.2 + Math.random() * 0.15, 6.8, () => sfx('crash')); await wait(900 + Math.random() * 700); } })();
  const path = [[0.9, 0, -2.0], [1.6, 0, -1.4], [2.2, 0, -0.9], [2.6, 0, -0.5], [2.9, 0, -0.3]];
  await spellOn({ prompt: sw.prompt, word: sw.word, decoys: sw.decoys, objs: c.loose, hints: sw.hints,
    onLetter: (rock, i) => { rock.userData.fell = true; const wp = rock.getWorldPosition(new THREE.Vector3()); world.remove(rock);
      c.drop(wp.x, wp.z, 0.45, wp.y, () => { sfx('crash'); quake(0.4, 0.12); sparkles(new THREE.Vector3(wp.x, 0.4, wp.z), 0x9A9EAC, 14); });
      const st = path[Math.min(i, path.length - 1)]; run(mia, st, 500); run(dog, [st[0] + 0.5, 0, st[2] + 0.3], 450); } });
  rain = false; shakeRocks(); filled(sw.word);
  // the roof gives way behind them: Mia and Toby leap into the cart
  for (let i = 0; i < 8; i++) { c.drop(-1.5 + Math.random() * 3, -1 + Math.random() * 2, 0.3 + Math.random() * 0.3, 6.8, () => { sfx('crash'); quake(0.35, 0.15); }); await wait(140); }
  const cp = c.cart.position;
  run(dog, [cp.x, 0, cp.z], 600, { hop: 1.2 }); await run(mia, [cp.x, 0, cp.z], 700, { hop: 1.2 });
  c.cart.add(mia.g); mia.g.position.set(0, 0.45, 0.15); mia.g.rotation.set(0, 0, 0); mia.pose('hold'); mia.L.rotation.x = mia.R.rotation.x = -1.4;
  c.cart.add(dog.g); dog.g.position.set(0, 0.85, 0.6); dog.g.rotation.set(0, 0, 0); dog.pose('bark');
  if (sw.word === 'cart') await earnCard('cart');
  // Leo runs for the cart — a big stalactite crashes down between them
  tell('But Leo was left behind on the stone floor as the cart began to roll!', { wait: false });
  await flyCam([5.2, 2.6, 3.6], [1.6, 0.8, -1.2], 900);
  run(leo, [0.6, 0, -1.6], 900);
  const big = c.stal.slice().sort((a, b) => a.position.distanceTo(new THREE.Vector3(1.6, 6, -1.2)) - b.position.distanceTo(new THREE.Vector3(1.6, 6, -1.2)))[0];
  big.position.set(1.3, big.position.y, -1.9);
  await wait(500); sfx('whoosh');
  await tween(450, e => { big.position.y = 7 - e * (7 - big.userData.h / 2 + 0.2); });
  sfx('crash'); quake(0.9, 0.3); sparkles(new THREE.Vector3(1.3, 0.4, -1.9), 0x9A9EAC, 30); leo.pose('scared');
  // the cart rolls down the curved track and into the dark tunnel
  await wait(600); flyCam([4.4, 2.8, 2.2], [6.2, 0.4, -9], 1600);
  sfx('clack'); let k = 0.1;
  await tween(2400, e => { k = 0.1 + e * e * 0.9; c.placeCart(k); });
  await tapOn();
  hideStory(); finish(2);
}

// ================================================================ stop 3 — the dark tunnel
export async function stop3() {
  playMusic('danger');
  const T = buildTunnel(); const { mia, toby: dog } = T.cast;
  let s = 0.0, speed = 0, target = 0;
  const behind = new THREE.Vector3(), ahead = new THREE.Vector3();
  followCam(() => { const f = T.frame(Math.min(s, 0.985)), b = T.frame(Math.max(0, s - 0.018));
    behind.copy(b.p).addScaledVector(f.side, 0.3).setY(b.p.y + 0.35); ahead.copy(T.frame(Math.min(0.99, s + 0.02)).p).setY(f.p.y - 2.1); return [behind, ahead]; });
  let riding = true;
  onTick((t, dt) => { if (!riding) return; speed += (target - speed) * Math.min(1, dt * 1.5); s = Math.min(0.985, s + speed * dt / T.L); T.placeAt(s); });
  const rideTo = async to => { target = 15; while (s < to - 0.004) await wait(40); target = 0; await wait(500); };
  // forks: pick the sign with the right word. Replays draw other sentences (some need -est, some -er).
  const FORKS = [
    { text: 'The cart rolled faster and {faster} into the tunnel.', words: ['faster', 'fastest'], answer: 'faster', hints: ['Faster and faster. Both words match!', 'Pick faster.'] },
    { text: 'The tunnel got {darker}, and the cold wind blew hard.', words: ['darker', 'darkest'], answer: 'darker', hints: ['Darker than before. Use -er.', 'Pick darker.'] },
    { text: 'The cold wind blew {harder} than before.', words: ['harder', 'hardest'], answer: 'harder', hints: ['THAN? Use -er.', 'Pick harder.'] },
    { text: 'This was the {scariest} ride of their lives!', words: ['scarier', 'scariest'], answer: 'scariest', hints: ['THE ___ of their lives means most of all.', 'Use -est.'] },
    { text: 'The wheels got {louder} and louder.', words: ['louder', 'loudest'], answer: 'louder', hints: ['Louder and louder. Both words match!', 'Pick louder.'] },
    { text: 'It was the {longest} tunnel Mia had ever seen.', words: ['longer', 'longest'], answer: 'longest', hints: ['THE ___ ever seen means most of all.', 'Use -est.'] },
    { text: 'The air felt {colder} than the meadow.', words: ['colder', 'coldest'], answer: 'colder', hints: ['THAN? Use -er.', 'Pick colder.'] },
  ];
  const v = visits(3); const forks = v === 0 ? FORKS.slice(0, 3) : shuffle(FORKS).slice(0, 3);
  sfx('clack');
  if (v === 0) tell(forks[0].text, { wait: false });
  await rideTo(0.08);
  const fork = async (j, f, showText) => {
    target = 11; while (s < T.junctions[j].s - 0.085) await wait(30); target = 3; while (s < T.junctions[j].s - 0.05) await wait(30); target = 0; speed = Math.min(speed, 1.5);
    const jn = T.junctions[j]; const ord = Math.random() < 0.5 ? f.words : f.words.slice().reverse();
    jn.signs.forEach((b, i) => { const mt = new THREE.MeshBasicMaterial({ map: textTexture(ord[i], { bg: '#F4E1B5', w: 512, h: 190, font: '92px Chewy, sans-serif' }) }); b.material = [toon(0xC9A46A), toon(0xC9A46A), toon(0xC9A46A), toon(0xC9A46A), mt, mt]; b.userData.word = ord[i]; });
    await wait(300); if (showText) tell(f.text, { wait: false });
    await pick3D({ backupWords: true, prompt: 'Tap the right sign!', targets: jn.signs.map(b => ({ id: b.userData.word, obj: b })), answer: f.answer, hints: f.hints, word: f.answer,
      onWrong: () => { quake(0.5, 0.12); sfx('crash'); } });
    sfx('clack'); await filled(f.answer);
  };
  await fork(0, forks[0], v !== 0);
  await rideTo(0.36);
  await fork(1, forks[1], true);
  await rideTo(0.6);
  await fork(2, forks[2], true);
  tell('Mia held Toby tight. Then, the metal tracks just stopped!', { wait: false });
  // the tracks stop at the edge
  target = 20; while (s < 0.97) await wait(40); target = 0; await wait(300); sfx('crash'); quake(0.6, 0.15);
  mia.pose('scared'); dog.pose('bark'); sfx('bark');
  stopFollow(); const endF = T.frame(0.985);
  await flyCam([endF.p.x + endF.side.x * 3, endF.p.y - 0.6, endF.p.z + 3], [T.hole.position.x, T.hole.position.y, T.hole.position.z], 1300);
  await tapOn();
  // ---- activity: words that sound the same (rotates on replays)
  const AFTER = 'The cart was falling right into the empty air! It was the deepest hole they had ever seen. Will they be okay?';
  const hv = pickV(3, [
    { text: 'In front of them was a giant black {pit} with no bottom.', after: AFTER, sentence: 'a giant black {_} with no bottom', tiles: ['pit', 'pet', 'pot'], answer: 'pit', note: 'pit = a very deep hole', hints: ['A pet is an animal. A pot is for cooking.', 'p – i – t, like sit.'] },
    { text: 'In front of them was a giant black hole with no bottom. The cart was falling {right} into the empty air!', after: 'It was the deepest hole they had ever seen. Will they be okay?', sentence: 'The cart was falling {_} into the empty air!', tiles: ['right', 'write'], answer: 'right', note: 'write = use a pencil', hints: ['You write with a pencil. Not this one!', 'Pick right.'] },
    { text: 'In front of them was a giant black hole with {no} bottom.', after: AFTER, sentence: 'a giant black hole with {_} bottom', tiles: ['no', 'know'], answer: 'no', note: 'know = in your head', hints: ['This one means not any.', 'Pick no.'] },
  ]);
  tell(hv.text, { wait: false });
  await chooseWord({ prompt: hv.answer === 'pit' ? 'Which word fits?' : 'Which word fits? They sound the same!', sentence: hv.sentence, tiles: hv.tiles, answer: hv.answer, note: hv.note, hints: hv.hints });
  await filled(hv.answer); if (hv.answer === 'pit') await earnCard('pit');
  if (await offerStretch(hv.answer === 'pit' ? 'Two words that sound the same: hole and whole.' : 'Use the other word that sounds the same.')) {
    await chooseWord(pickV(3, [
      { prompt: 'Bonus! Which word fits now?', sentence: 'The {_} cart was falling, wheels and all!', tiles: ['hole', 'whole'], answer: 'whole', hints: ['It means ALL of the cart.', 'whole = all of it.'] },
      { prompt: 'Bonus! Which word fits now?', sentence: 'Mia will {_} a story about the cave.', tiles: ['right', 'write'], answer: 'write', hints: ['You use a pencil.', 'w-r-i-t-e'] },
      { prompt: 'Bonus! Which word fits now?', sentence: 'Mia did not {_} what to do.', tiles: ['no', 'know'], answer: 'know', hints: ['It is in your head.', 'k-n-o-w'] },
    ]));
    star(3);
  }
  tell(hv.after, { wait: false });
  riding = false; sfx('fall'); const p0 = T.rider.position.clone(), hp = T.hole.position;
  await tween(1700, e => { T.rider.position.set(p0.x + (hp.x - p0.x) * Math.min(1, e * 1.6), p0.y - e * e * 9, p0.z + (hp.z - p0.z) * Math.min(1, e * 1.6)); T.rider.rotation.x = e * 0.8; });
  await tapOn();
  hideStory(); finish(3);
  const cont = h('div', { class: 'tbc' }, h('div', {}, 'To be continued…')); document.body.append(cont); await wait(2600); cont.remove();
}

// ================================================================ sum up the episode
export async function sumUp() {
  playMusic('cave');
  const ov = h('div', { class: 'sumup' }, h('div', { class: 'sumup-title' }, 'Sum it up!'), h('div', { class: 'sumup-sub' }, 'Pass the challenge to finish Episode 1'));
  document.body.append(ov);
  await wait(600);
  await order({ prompt: 'Put what happened in order.', compact: true, items: ['Toby ran into a dark cave.', 'Mia grabbed the glowing blue stone.', 'The floor tipped and the cart rolled.', 'The tracks stopped at a giant pit.'],
    hints: ['What happened first?', 'The stone came before the rumble.'] });
  await think({ prompt: 'Why did the floor tip down?', options: ['Mia took the stone, and the cave shook.', 'Toby was digging under the floor.', 'Leo jumped too hard.'],
    answer: 'Mia took the stone, and the cave shook.', hints: ['What did Mia do before the CLICK?'] });
  await think({ prompt: 'Why was Leo left behind?', options: ['A big rock fell in his way.', 'He wanted to look at the crystals.', 'Mia told him to wait.'],
    answer: 'A big rock fell in his way.', hints: ['What fell down before the cart rolled?'] });
  ov.remove(); S.ep1 = 1; save();
}
