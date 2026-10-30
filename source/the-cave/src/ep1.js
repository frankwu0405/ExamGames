// Episode 1 — The Cave. Three stops; Frank's text is used word for word, the activities sit inside the action.
import { S, save, sfx, say, wait, h } from './core.js';
import { THREE, setCam, flyCam, followCam, stopFollow, quake, tween, moveTo, onTick, sparkles, textTexture, builder, toon, camera, world } from './gfx.js';
import { buildMeadow, buildChamber, buildTunnel } from './sets.js';
import { tell, fillGap, hideStory, chooseWord, pick3D, spellOn, flashlight, order, think, offerStretch, earnCard, toby, tobyHide } from './ui.js';

const star = n => { S.stars[n] = 1; save(); sfx('great'); };
const finish = n => { S.stops[n] = { done: 1, t: Date.now() }; save(); };
const run = async (c, to, ms, opt) => { c.pose('run'); await moveTo(c.g, to, ms, opt); c.pose('idle'); };
const walk = async (c, to, ms, opt) => { c.pose('walk'); await moveTo(c.g, to, ms, opt); c.pose('idle'); };

// ================================================================ stop 1 — the meadow
export async function stop1() {
  const m = buildMeadow(); const { leo, mia, toby: dog } = m.cast;
  setCam([0, 3.2, 13], [0, 1, 3]);
  // the kids play: chase Toby in a little circle
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
  sparkles(new THREE.Vector3(0, 1.2, -9), 0x9FEAFF, 30); sfx('chime');
  await tell('Suddenly, Toby saw something bright. He barked and ran away!', { wait: false });
  dog.pose('bark'); sfx('bark'); await wait(900);
  run(dog, [0, 0, -9.3], 2200).then(() => { dog.g.visible = false; });
  [leo, mia].forEach(c => c.pose('point')); await wait(2400); [leo, mia].forEach(c => c.pose('idle'));
  // ---- activity: whose tracks? (superlatives + reading the clue)
  await flyCam([0, 11, 9], [0, 0, -2], 1500);
  toby('Woof! My paw prints got mixed up with other animals’ prints!');
  await wait(1800);
  await chooseWord({ prompt: 'Finish the clue to find Toby’s tracks.', sentence: 'Toby was the {_} dog in town.', base: 'small', tiles: ['-er', '-est', '-ly'], answer: 'smallest',
    hints: ['Toby is smaller than ALL the other animals. Which ending means “most of all”?', 'When we compare ALL of them, we add -est.'] });
  const r = await pick3D({ prompt: 'Now tap Toby’s tracks. He is the smallest!', answer: 'toby', word: 'smallest',
    targets: Object.entries(m.trails).map(([id, g]) => ({ id, obj: g.userData.hit })),
    hints: ['Those prints are much too big for a little puppy!', 'Look for the tiniest prints of all.'] });
  m.trails.toby.children.forEach(p => { if (p !== m.trails.toby.userData.hit) p.material = new THREE.MeshBasicMaterial({ color: 0xFFC94A }); });
  if (await offerStretch('Compare two animals.')) {
    const s = await chooseWord({ prompt: 'Bonus! Pick the right spelling.', sentence: 'The fox’s prints were {_} than Toby’s.', tiles: ['biger', 'bigger', 'biggest'], answer: 'bigger',
      note: 'Short words like big double the last letter: big → bigger.', hints: ['Two animals → add -er.', 'Short words like big double the last letter.'] });
    star(1);
  }
  await flyCam([0, 3, 10], [0, 1.2, -6], 1300);
  run(leo, [-0.8, 0, -6.5], 3200); run(mia, [0.8, 0, -6.3], 3000);
  await tell('They followed his paw prints to a dark, scary cave.');
  await flyCam([0, 2.3, 1.8], [0, 2.3, -9], 1200); leo.g.rotation.y = mia.g.rotation.y = Math.PI;
  // ---- activity: spell "enter" on the stones around the cave
  await tell('They had to {enter} it to find their puppy.', { wait: false });
  await spellOn({ prompt: 'Spell the missing word on the stones. It means “go in”.', word: 'enter', decoys: 'au', objs: m.stones,
    hints: ['It starts with E, like egg.', 'E – N – T – E – R'] });
  fillGap('enter'); sfx('great'); await wait(900);
  await earnCard('enter');
  await tell('The air inside was much colder than the warm air. They had to be the bravest kids to save their pet.', { wait: false });
  walk(leo, [-0.6, 0, -9.6], 2600); walk(mia, [0.6, 0, -9.6], 2600);
  await flyCam([0, 1.6, -7.5], [0, 1.2, -10], 2600);
  await wait(400); await tell('They had to be the bravest kids to save their pet.');
  hideStory(); finish(1);
}

// ================================================================ stop 2 — the glowing stone
export async function stop2() {
  const c = buildChamber(); const { leo, mia, toby: dog } = c.cast; const floor = c.floorG.children[0];
  setCam([0, 2.6, 11], [0, 1.4, 4]);
  walk(leo, [-0.8, 0, 3.5], 3000); walk(mia, [0.8, 0, 3.6], 3000);
  await tell('They walked slowly into the dark.');
  // ---- activity: sweep the flashlight to find Toby
  c.spot.position.set(0, 2.4, 5);
  await flyCam([0, 2.4, 7], [0, 1.2, -2], 900);
  sfx('bark');
  await flashlight({ spot: c.spot, surfaces: [c.shell, floor], prompt: 'It’s so dark! Move your finger to shine the flashlight. Find Toby!', find: { obj: dog.g },
    hints: ['Listen… the barking comes from the back of the cave!'] });
  dog.pose('wag'); sfx('bark'); sfx('glow');
  tween(1500, e => { c.gemLight.intensity = e * 16; c.w.children[0].intensity = 0.25 + e * 0.9; });
  await tell('Then, Mia saw Toby! He was sitting next to a glowing blue stone on a rock.');
  walk(leo, [-0.9, 0, -2.6], 2400); walk(mia, [0.5, 0, -2.8], 2400);
  await flyCam([2.2, 2.2, 0.5], [0, 1.3, -5], 2400);
  // ---- activity: the walls hide comparing words; she finds the one that fits
  [['bright', -6.5, 2.8, -6.5], ['brightest', -2.4, 3.9, -9.4], ['brighter', 2.6, 3.6, -9.3], ['darker', 6.6, 2.7, -6.2]].forEach(a => c.place(...a));
  await tell('It was the coolest and best treasure ever! Its beautiful blue light was much {brighter} than their flashlights.', { wait: false });
  await flyCam([0, 2.3, 4.5], [0, 2.8, -6], 900);
  await flashlight({ spot: c.spot, surfaces: [c.shell, floor], words: c.words, answer: 'brighter',
    prompt: 'Words are hiding on the cave walls! Shine your light, then tap the word that fits: much ___ than their flashlights.',
    hints: ['“much ___ THAN” compares TWO things: the stone and the flashlights.', 'Two things → the -er word.'] });
  fillGap('brighter'); c.words.forEach(w => w.visible = false); await wait(700);
  await flyCam([2.2, 2.2, 0.5], [0, 1.3, -5], 1000);
  mia.g.rotation.y = Math.PI - 0.3; mia.pose('reach');
  await tell('It made the room look magical. “Wow,” Mia said. She reached out to grab it.');
  if (await offerStretch('A tricky word that breaks the rules.')) {
    await chooseWord({ prompt: 'Bonus! Pick the right word.', sentence: 'It was the coolest and {_} treasure ever!', tiles: ['goodest', 'better', 'best'], answer: 'best',
      note: 'good → better → best. No -er or -est here!', hints: ['“goodest” is not a real word!', 'The MOST good of all is… best.'] });
    star(2);
  }
  // Mia grabs the stone
  await moveTo(mia.g, [0.25, 0, -4.1], 600, { face: false }); c.gem.parent.remove(c.gem); mia.pose('hold'); sfx('click');
  const held = builder(mia.g).add(new THREE.OctahedronGeometry(0.2), toon(0x5AD1FF, { emissive: 0x2AA8E8, emissiveIntensity: 0.9 }), 0, 0.95, 0.38, { line: 0.02 }); held.scale.y = 1.6;
  // ---- activity: shades of loudness, to find the missing sound word
  await tell('Click! When she grabbed the stone, the cave gave a loud {rumble}.', { wait: false });
  await order({ prompt: 'What sound is louder than a roaring lion? Put these sounds in order, quietest first.', items: ['whisper', 'squeak', 'bark', 'rumble'], labels: ['quiet 🤫', 'LOUD 💥'], word: 'rumble',
    hints: ['A whisper is the quietest sound of all.', 'A squeak is small. A bark is bigger. What shakes a whole cave?'] });
  fillGap('rumble'); sfx('rumble'); quake(2.2, 0.25); [leo, mia].forEach(k => k.pose('scared')); dog.pose('bark'); sfx('bark');
  await wait(1200); await earnCard('rumble');
  await tell('The sound was louder than a roaring lion. The flat rock floor tipped down. It became the steepest slide in the cave!', { wait: false });
  await flyCam([-2, 3.5, 5], [1, 0.5, -3], 1300);
  sfx('rumble'); quake(1.4, 0.15); await tween(1400, e => { c.floorG.rotation.z = -e * 0.12; c.floorG.rotation.x = e * 0.05; });
  await wait(1200); await tell('It became the steepest slide in the cave!');
  // falling rocks hang in the air (slow motion) with letters on them
  const rocks = []; const rb = builder(world);
  [[-1.5, 3.4, 1.5], [0, 3.9, 1], [1.5, 3.3, 1.4], [-0.8, 2.4, 2], [0.9, 2.5, 2], [2.2, 4, 0.5]].forEach(([x, y, z]) => { const r = rb.rock(0.42, 0x6B7086, x, y, z, { line: 0.03 }); rocks.push(r); });
  const wob = onTick(t => rocks.forEach((r, i) => { r.rotation.x = t * 0.3 + i; r.position.y += Math.sin(t * 2 + i) * 0.002; }));
  await flyCam([0.3, 2.9, 7], [0.3, 2.9, 0], 1100);
  await tell('Small rocks fell from the roof. Mia and Toby jumped into a rusty old {cart} to stay safe.', { wait: false });
  await spellOn({ prompt: 'Rocks are falling! Tap the letters to spell what they jumped into: a box on wheels.', word: 'cart', decoys: 'ko', objs: rocks,
    hints: ['It sounds like “car” with a T at the end.', 'C – A – R – T'] });
  fillGap('cart'); wob();
  rocks.forEach((r, i) => tween(700 + i * 90, e => { r.position.y = Math.max(0.3, r.position.y - e * 0.25); }));
  sfx('crash'); quake(0.8, 0.12);
  await earnCard('cart');
  // Mia and Toby jump in; Leo is left behind
  await flyCam([-1.5, 3.4, 4], [3.5, 0.6, -2.5], 1000);
  run(dog, [4.4, 0.55, -1.6], 900, { hop: 1 }); await run(mia, [4.4, 0.45, -1.6], 1000, { hop: 1 }); mia.pose('hold');
  leo.pose('scared');
  await tell('But Leo was left behind on the stone floor as the cart began to roll!', { wait: false });
  const cart0 = c.cart.position.clone(); mia.g.position.set(4.4, 0.45, -1.6);
  const riders = [mia.g, dog.g]; const offs = riders.map(g => g.position.clone().sub(cart0));
  await tween(2600, e => { const p = cart0.clone().add(new THREE.Vector3(Math.sin(0.27) * e * 9, 0, -Math.cos(0.27) * e * 9)); c.cart.position.copy(p); riders.forEach((g, i) => g.position.copy(p).add(offs[i])); });
  await wait(600); await tell('But Leo was left behind on the stone floor as the cart began to roll!');
  hideStory(); finish(2);
}

// ================================================================ stop 3 — the dark tunnel
export async function stop3() {
  const T = buildTunnel(); const { mia, toby: dog } = T.cast;
  let s = 0.0, speed = 0, target = 0;
  const behind = new THREE.Vector3(), ahead = new THREE.Vector3();
  followCam(() => { const f = T.frame(Math.min(s, 0.985)), b = T.frame(Math.max(0, s - 0.018));
    behind.copy(b.p).addScaledVector(f.side, 0.3).setY(b.p.y - 0.4); ahead.copy(T.frame(Math.min(0.99, s + 0.02)).p).setY(f.p.y - 1.9); return [behind, ahead]; });
  onTick((t, dt) => { speed += (target - speed) * Math.min(1, dt * 1.5); s = Math.min(0.985, s + speed * dt / T.L); T.placeAt(s); });
  const rideTo = async to => { target = 9; while (s < to - 0.004) await wait(40); target = 0; await wait(500); };
  sfx('clack'); tell('The cart rolled faster and {faster} into the tunnel.', { wait: false }); await rideTo(0.08);
  // three forks: pick the sign with the right comparing word
  const fork = async (j, sentence, words, answer, hints, gapWord) => {
    target = 7; while (s < T.junctions[j].s - 0.035) await wait(40); target = 0;
    const jn = T.junctions[j]; const order = Math.random() < 0.5 ? words : words.slice().reverse();
    jn.signs.forEach((b, i) => { b.material = [toon(0xC9A46A), toon(0xC9A46A), toon(0xC9A46A), toon(0xC9A46A), new THREE.MeshBasicMaterial({ map: textTexture(order[i], { bg: '#F4E1B5', w: 512, h: 190, font: '92px Chewy, sans-serif' }) }), new THREE.MeshBasicMaterial({ map: textTexture(order[i], { bg: '#F4E1B5', w: 512, h: 190, font: '92px Chewy, sans-serif' }) })]; b.userData.word = order[i]; });
    await wait(400); if (sentence) await tell(sentence, { wait: false });
    await pick3D({ prompt: 'The track splits! Tap the sign with the word that fits.', targets: jn.signs.map(b => ({ id: b.userData.word, obj: b })), answer, hints, word: gapWord || answer,
      onWrong: () => { quake(0.5, 0.12); sfx('crash'); } });
    fillGap(answer); sfx('clack'); await wait(900);
  };
  await fork(0, null, ['faster', 'fastest'], 'faster',
    ['“faster and faster” means it keeps speeding up.', 'Both words in “faster and ___” match.']);
  await rideTo(0.36);
  await fork(1, 'The tunnel got {darker}, and the cold wind blew hard.', ['darker', 'darkest'], 'darker',
    ['It got darker than before. Comparing to before → -er.', 'We only say “the darkest” with THE in front.']);
  await rideTo(0.6);
  await fork(2, 'Mia held Toby tight. The wind blew {harder} than before.', ['harder', 'hardest'], 'harder',
    ['“___ THAN before” compares two times.', '-er goes with THAN.']);
  await tell('Mia held Toby tight.');
  // the tracks stop
  target = 12; while (s < 0.97) await wait(40); target = 0; await wait(300); sfx('crash'); quake(0.6, 0.15);
  mia.pose('scared'); dog.pose('bark'); sfx('bark');
  stopFollow(); const endF = T.frame(0.985);
  await flyCam([endF.p.x + endF.side.x * 3, endF.p.y - 0.6, endF.p.z + 3], [T.hole.position.x, T.hole.position.y, T.hole.position.z], 1300);
  await tell('Then, the metal tracks just stopped!');
  // ---- activity: hole or whole?
  await tell('In front of them was a giant black {hole} with no bottom.', { wait: false });
  await chooseWord({ prompt: 'Which word fits? Careful — they sound the same!', sentence: 'a giant black {_} with no bottom', tiles: ['hole', 'whole'], answer: 'hole',
    note: 'whole means “all of something”.', hints: ['This one is a space in the ground you could fall into.', 'h-o-l-e: a hole in the ground.'] });
  fillGap('hole'); await wait(600); await earnCard('hole');
  if (await offerStretch('Use the other word that sounds the same.')) {
    await chooseWord({ prompt: 'Bonus! Which word fits now?', sentence: 'The {_} cart was falling, wheels and all!', tiles: ['hole', 'whole'], answer: 'whole',
      hints: ['It means ALL of the cart.', 'whole = all of it.'] });
    star(3);
  }
  await tell('The cart was falling right into the empty air!', { wait: false });
  sfx('fall'); const p0 = T.rider.position.clone(), hp = T.hole.position;
  await tween(1700, e => { T.rider.position.set(p0.x + (hp.x - p0.x) * Math.min(1, e * 1.6), p0.y - e * e * 9, p0.z + (hp.z - p0.z) * Math.min(1, e * 1.6)); T.rider.rotation.x = e * 0.8; });
  await tell('It was the deepest hole they had ever seen. Will they be okay?');
  hideStory(); finish(3);
  const cont = h('div', { class: 'tbc' }, h('div', {}, 'To be continued…')); document.body.append(cont); await wait(2600); cont.remove();
}

// ================================================================ sum up the episode
export async function sumUp() {
  const ov = h('div', { class: 'sumup' }, h('div', { class: 'sumup-title' }, 'Sum it up!'), h('div', { class: 'sumup-sub' }, 'Pass the challenge to finish Episode 1'));
  document.body.append(ov);
  await wait(600);
  await order({ prompt: 'Put what happened in order.', compact: true, items: ['Toby ran into a dark cave.', 'Mia grabbed the glowing blue stone.', 'The floor tipped and the cart rolled.', 'The tracks stopped at a giant hole.'],
    hints: ['What made them go into the cave in the first place?', 'The stone came before the rumble and the slide.'] });
  await think({ prompt: 'Why was Leo left behind?', options: ['The floor tipped and the cart rolled before he could jump in.', 'He wanted to stay and look at the crystals.', 'Mia told him to wait outside the cave.'],
    answer: 'The floor tipped and the cart rolled before he could jump in.', hints: ['Think about what happened right after the rumble.'] });
  ov.remove(); S.ep1 = 1; save();
}
