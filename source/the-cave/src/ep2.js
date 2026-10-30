// Episode 2 — The Cave 2. Stops 4–6: the drop, the crystal loop, the swift river (to the beach).
// Frank's text word for word; each line read once; replays rotate to new versions.
import { S, save, sfx, wait, h, shuffle } from './core.js';
import { THREE, setCam, flyCam, followCam, stopFollow, quake, tween, moveTo, onTick, sparkles, textTexture, toon, builder, camera } from './gfx.js';
import { buildShaft, buildCrystal, buildRiver, buildBeach } from './sets2.js';
import { tell, tapOn, fillGap, filled, hideStory, chooseWord, pick3D, spellOn, order, think, offerStretch, earnCard, toby, tobyHide, tapAll, steer, MODE } from './ui.js';
import { playMusic } from './music.js';

const star = n => { S.stars[n] = 1; save(); sfx('great'); };
const visits = n => (S.stops[n] && S.stops[n].visits) || 0;
const finish = n => { const v = visits(n) + 1; S.stops[n] = Object.assign(S.stops[n] || {}, { done: 1, t: Date.now(), visits: v }); if (MODE.captain && MODE.perfect) { S.captain = S.captain || {}; S.captain[n] = 1; } save(); };
const pickV = (n, pool) => pool[visits(n) % pool.length];
const veil = async (color, ms = 500) => { const v = h('div', { class: 'veil', style: { background: color } }); document.body.append(v); await wait(ms); return () => { v.classList.add('out'); setTimeout(() => v.remove(), 900); }; };

// ================================================================ stop 4 — the drop
export async function stop4() {
  playMusic('danger');
  const D = buildShaft(); const { mia, toby: dog } = D.R.cast; let y = 0, vy = 0, g = 0;
  const cam = new THREE.Vector3(), look = new THREE.Vector3();
  followCam(() => { cam.set(2.6, y + 1.5, 4.6); look.set(0, y + 0.4, -0.6); return [cam, look]; });
  onTick((t, dt) => { vy = Math.min(vy + g * dt, 30); y = Math.max(D.BOTTOM + 0.05, y - vy * dt); D.R.g.position.y = y; D.R.g.rotation.z = Math.sin(t * 7) * 0.04 * Math.min(1, vy / 10); });
  mia.pose('scared'); dog.pose('bark'); sfx('fall'); g = 18; D.wind.speed = 16;
  // ---- the gap sentence (rotates on replays), then everything slows down: glowing pebbles float by with letters
  const sp = pickV(4, [
    { gapIn: 0, word: 'drop', decoys: 'ab', prompt: 'Tap the letters to spell the word. It means a fall down.', hints: ['It starts with dr.', 'D – R – O – P'] },
    { gapIn: 1, word: 'wind', decoys: 'ae', prompt: 'Tap the letters to spell the word. It blows hard!', hints: ['It ends with nd.', 'W – I – N – D'] },
    { gapIn: 1, word: 'tight', decoys: 'a', prompt: 'Tap the letters to spell the word. Mia held Toby ___.', hints: ['It has a quiet gh.', 'T – I – G – H – T'] },
  ]);
  const s1 = sp.gapIn === 0 ? 'Mia and Toby fell down into the big dark pit! It was the longest {drop} of their lives.' : 'Mia and Toby fell down into the big dark pit! It was the longest drop of their lives.';
  const s2 = sp.word === 'wind' ? 'The {wind} blew hard, and Mia held the puppy tight.' : sp.word === 'tight' ? 'The wind blew hard, and Mia held the puppy {tight}.' : 'The wind blew hard, and Mia held the puppy tight.';
  tell(s1 + ' ' + s2, { wait: false });
  await wait(2200);
  g = 0; await tween(900, e => { vy = 18 * (1 - e) + 0.6 * e; D.wind.speed = 16 * (1 - e) + 1 * e; });
  D.floaters.visible = true; sfx('glow');
  await spellOn({ prompt: sp.prompt, word: sp.word, decoys: sp.decoys, objs: D.fl, hints: sp.hints });
  D.floaters.visible = false; await filled(sp.word);
  if (sp.word === 'drop') await earnCard('drop');
  // fast again… BANG! onto the hidden track
  g = 22; D.wind.speed = 18; sfx('fall');
  while (y > D.BOTTOM + 0.1) await wait(40);
  g = 0; vy = 0; D.wind.speed = 0; sfx('crash'); quake(1, 0.35); sparkles(new THREE.Vector3(0, D.BOTTOM + 0.3, 0), 0xFFD27A, 30);
  tell('But BANG! The cart did not crash. It landed on a hidden track.', { wait: false });
  mia.pose('hold'); dog.pose('idle'); await wait(900);
  // racing along the new track; Mia looks back — no Leo
  let z = 0, sp2 = 0; stopFollow(); const off = onTick((t, dt) => { sp2 = Math.min(sp2 + dt * 9, 16); z -= sp2 * dt; if (z < -52) z = -52; D.R.g.position.z = z; D.R.g.rotation.y = Math.PI; });
  D.R.g.rotation.y = Math.PI; mia.g.rotation.y = 0;
  followCam(() => { cam.set(1.6, D.BOTTOM + 2.2, z + 4.2); look.set(0, D.BOTTOM + 0.8, z - 3); return [cam, look]; });
  await tapOn();
  tell('The new track was much faster than the old one. Mia looked back, but Leo was not there.', { wait: false });
  await wait(1500); followCam(() => { cam.set(2.3, D.BOTTOM + 1.9, z - 0.6); look.set(0, D.BOTTOM + 1.3, z + 0.2); return [cam, look]; });
  await wait(500); mia.pose('idle'); await tween(900, e => { mia.g.rotation.y = e * Math.PI * 0.85; }); mia.pose('point'); await wait(500); mia.pose('scared');
  await tapOn();
  // ---- feelings and predictions (reading between the lines)
  await think(pickV(4, [
    { prompt: 'Leo is not there. How does Mia feel?', options: ['Worried', 'Bored', 'Sleepy'], answer: 'Worried', hints: ['Leo is her friend. Where is he?'] },
    { prompt: 'What will Mia want to do next?', options: ['Find Leo', 'Take a nap', 'Eat a snack'], answer: 'Find Leo', hints: ['Who is missing?'] },
    { prompt: 'Why did Mia look back?', options: ['To see if Leo was there', 'To see the stars', 'To find her shoes'], answer: 'To see if Leo was there', hints: ['Who was left behind?'] },
  ]));
  tween(700, e => { mia.g.rotation.y = Math.PI * 0.85 * (1 - e); }).then(() => mia.pose('hold'));
  if (await offerStretch('A word that does not use -ed.')) {
    await chooseWord(pickV(4, [
      { prompt: 'Bonus! Pick the right word.', sentence: 'Mia and Toby {_} down into the pit.', tiles: ['falled', 'fell', 'fall'], answer: 'fell', note: 'fall → fell', hints: ['falled is not a word!', 'fall, fell.'] },
      { prompt: 'Bonus! Pick the right word.', sentence: 'The wind {_} hard.', tiles: ['blowed', 'blew', 'blow'], answer: 'blew', note: 'blow → blew', hints: ['blowed is not a word!', 'blow, blew.'] },
      { prompt: 'Bonus! Pick the right word.', sentence: 'Mia {_} the puppy tight.', tiles: ['holded', 'held', 'hold'], answer: 'held', note: 'hold → held', hints: ['holded is not a word!', 'hold, held.'] },
    ]));
    star(4);
  }
  off(); hideStory(); finish(4);
}

// ================================================================ stop 5 — the crystal loop
export async function stop5() {
  playMusic('wonder');
  const C = buildCrystal(); const { mia, toby: dog } = C.R.cast; let s = 0, speed = 0, target = 0, lean = 0;
  const cam = new THREE.Vector3(), look = new THREE.Vector3();
  followCam(() => { const { p, f, u } = C.frame(Math.min(s, 0.999)); cam.copy(p).addScaledVector(f, -4.2).addScaledVector(u, 2.3); look.copy(p).addScaledVector(f, 3).addScaledVector(u, 0.6); return [cam, look]; });
  onTick((t, dt) => { speed += (target - speed) * Math.min(1, dt * 2); s = Math.min(0.999, s + speed * dt / C.L); C.place(s); C.R.g.rotateZ(lean); });
  const rideTo = async (to, v = 8) => { target = v; while (s < to) await wait(30); target = 0; await wait(350); };
  tell('The track twisted left and right. It pushed the cart harder than a racecar.', { wait: false });
  mia.pose('hold'); await rideTo(0.07);
  // ---- three bends: read the clue, lean the right way (one clue says to lean AWAY)
  const bends = pickV(5, [
    [{ at: 0.1, clue: 'The track turns right. Lean right!', answer: 'right' }, { at: 0.2, clue: 'A big crystal is on the right. Lean AWAY from it!', answer: 'left' }, { at: 0.3, clue: 'Toby is on the right side. Lean to Toby’s side!', answer: 'right' }],
    [{ at: 0.1, clue: 'The wall is on the left. Lean AWAY from the wall!', answer: 'right' }, { at: 0.2, clue: 'The track bends left. Lean left!', answer: 'left' }, { at: 0.3, clue: 'Do NOT lean left. Lean the other way!', answer: 'right' }],
    [{ at: 0.1, clue: 'Mia sees a green light on her right. Lean toward it!', answer: 'right' }, { at: 0.2, clue: 'Rocks are on the right. Lean away from the rocks!', answer: 'left' }, { at: 0.3, clue: 'Lean the opposite of left!', answer: 'right' }],
  ]);
  for (const bd of bends) {
    await rideTo(bd.at, 7);
    await steer({ prompt: 'Read the sign. Which way?', clue: bd.clue, answer: bd.answer, hints: ['Read it again slowly.', bd.clue.includes('AWAY') || bd.clue.includes('NOT') || bd.clue.includes('opposite') ? 'Away means the other side.' : 'The sign tells you the side.'] });
    const dir = bd.answer === 'left' ? 1 : -1; sfx('whoosh');
    target = 10; await tween(500, e => { lean = dir * 0.012 * Math.sin(e * Math.PI); }); lean = 0;
  }
  dog.pose('wag');
  await rideTo(0.42, 9);
  const followRide = () => followCam(() => { const { p, f, u } = C.frame(Math.min(s, 0.999)); cam.copy(p).addScaledVector(f, -4.2).addScaledVector(u, 2.3); look.copy(p).addScaledVector(f, 3).addScaledVector(u, 0.6); return [cam, look]; });
  stopFollow(); await flyCam([0, 9, -2], [0, 3, -16], 1600);
  await tell('They rolled into a big room full of glowing green crystals. It was the brightest room in the cave!');
  followRide(); await rideTo(C.sA - 0.025, 8);
  // ---- the eight big crystals carry words: tap every one with the target sound
  const sort = pickV(5, [
    { sound: 'oo', like: 'loop', yes: ['room', 'zoom', 'cool', 'moon'], no: ['cart', 'rock', 'wind', 'bark'] },
    { sound: 'oo', like: 'loop', yes: ['food', 'pool', 'boot', 'spoon'], no: ['fish', 'sand', 'jump', 'sock'] },
    { sound: 'oo', like: 'loop', yes: ['roof', 'tooth', 'broom', 'hoop'], no: ['rope', 'hat', 'drum', 'bell'] },
  ]);
  const words = shuffle([...sort.yes.map(w => ({ w, ok: true })), ...sort.no.map(w => ({ w, ok: false }))]);
  const items = C.big.map((g, i) => { const lab = new THREE.Sprite(new THREE.SpriteMaterial({ map: textTexture(words[i].w, { w: 384, h: 140, font: '80px Chewy, sans-serif', fg: '#FFFDF4', glow: '#0B3B22' }), depthTest: false })); lab.scale.set(2.6, 0.95, 1); lab.position.y = 4.6; g.add(lab);
    return { obj: g, ok: words[i].ok, label: words[i].w }; });
  tell('The track went up in a giant {loop}.', { wait: false });
  stopFollow(); await flyCam(...(() => { const { p } = C.frame(s); return [[p.x, p.y + 5.5, p.z + 7.5], [p.x, 1.6, p.z - 3]]; })(), 1200);
  await tapAll({ prompt: `Tap every crystal with ${sort.sound}, like in ${sort.like}.`, items, word: 'loop',
    hints: [`Say ${sort.like}. Listen for ${sort.sound}.`, `${sort.yes[0]} has ${sort.sound}!`],
    onRight: it => { const m = it.obj.userData.crystal; m.material = toon(0xB6FFD0, { emissive: 0x6BFFA8, emissiveIntensity: 1 }); } });
  await filled('loop'); await earnCard('loop');
  // the loop!
  tell('The cart went high into the air. Toby gave a happy bark.', { wait: false });
  mia.pose('cheer'); sfx('whoosh');
  followRide();
  target = 13; while (s < C.sB) await wait(30); dog.pose('bark'); sfx('bark');
  await rideTo(0.995, 9); mia.pose('hold');
  await tapOn();
  if (await offerStretch('Pick the word that compares.')) {
    await chooseWord(pickV(5, [
      { prompt: 'Bonus! Pick the right word.', sentence: 'It was the {_} room in the cave!', tiles: ['bright', 'brighter', 'brightest'], answer: 'brightest', hints: ['THE ___ in the cave means most of all.', 'Use -est.'] },
      { prompt: 'Bonus! Pick the right word.', sentence: 'It pushed the cart {_} than a racecar.', tiles: ['hard', 'harder', 'hardest'], answer: 'harder', hints: ['THAN means two things.', 'Use -er.'] },
      { prompt: 'Bonus! Pick the right word.', sentence: 'The cart went {_} and higher.', tiles: ['high', 'higher', 'highest'], answer: 'higher', hints: ['higher and higher. Both match!', 'Pick higher.'] },
    ]));
    star(5);
  }
  hideStory(); finish(5);
}

// ================================================================ stop 6 — the swift river, out to the beach
export async function stop6() {
  playMusic('danger');
  const V = buildRiver(); const { mia, toby: dog } = V.R.cast; const R = V.R.g;
  setCam([2.6, 3.4, 20], [0, 1, 8]);
  tell('After the crazy ride, the cart zoomed to the bottom of the deep cave. The tracks just stopped!', { wait: false });
  mia.pose('hold'); await moveTo(R, [0, 1.45, 10.6], 1400, { face: false }); sfx('crash'); quake(0.4, 0.1);
  await tapOn();
  tell('The cart fell off the edge and hit the cold river with a giant SPLASH.', { wait: false });
  mia.pose('scared'); sfx('fall');
  await tween(700, (e, k) => { R.position.set(0, 1.45 - 1.35 * k * k, 10.6 - 3.5 * k); R.rotation.x = -0.3 * Math.sin(k * Math.PI); });
  sfx('crash'); sfx('whoosh'); quake(0.7, 0.25); sparkles(new THREE.Vector3(0, 0.4, 7), 0xE6F6FF, 50); sparkles(new THREE.Vector3(0.6, 0.4, 7.4), 0xBFE8FF, 30);
  let z = 7.1, x = 0, drift = 1.2, tx = 0; const off = onTick((t, dt) => { z -= drift * dt; x += (tx - x) * Math.min(1, dt * 1.5); R.position.set(x, 0.1 + Math.sin(t * 2.2) * 0.05, z); R.rotation.set(Math.sin(t * 1.7) * 0.04, Math.PI + Math.sin(t * 1.1) * 0.06, Math.sin(t * 2) * 0.05); });
  const cam = new THREE.Vector3(), look = new THREE.Vector3();
  followCam(() => { cam.set(x + 2.2, 3.2, z + 6.2); look.set(x * 0.5, 0.6, z - 5); return [cam, look]; });
  await tapOn();
  // the light ahead
  tell('Then, Mia saw a bright light from ahead! The exit was near.', { wait: false });
  mia.pose('point'); await wait(900); await tapOn();
  // ---- three channels with word signs: paddle down the one that means FAST (that is where Leo is)
  const ch = pickV(6, [
    { clue: 'Paddle to the sign that means FAST.', words: ['swift', 'slow', 'still'], answer: 'swift', hints: ['Slow and still are not fast.', 'swift = very fast'] },
    { clue: 'Paddle to the sign that means FAST.', words: ['quick', 'calm', 'lazy'], answer: 'quick', hints: ['Calm and lazy are not fast.', 'quick = fast'] },
    { clue: 'Paddle to the sign that is the OPPOSITE of slow.', words: ['speedy', 'sleepy', 'heavy'], answer: 'speedy', hints: ['Opposite means the other way.', 'speedy = fast'] },
  ]);
  const ord = shuffle(ch.words);
  V.gates.forEach((g, i) => { const mt = new THREE.MeshBasicMaterial({ map: textTexture(ord[i], { bg: '#F4E1B5', w: 512, h: 190, font: '92px Chewy, sans-serif' }) }); g.userData.board.material = [toon(0xC9A46A), toon(0xC9A46A), toon(0xC9A46A), toon(0xC9A46A), mt, mt]; g.userData.word = ord[i]; });
  drift = 0.9; while (z > -11) await wait(40); drift = 0;
  tell('“Look!” Mia said to the puppy. “That is Leo!” He was drifting in the water on a floating log. Mia paddled the cart over to fetch him.', { wait: false });
  V.paddle.visible = true; mia.pose('reach');
  await pick3D({ backupWords: true, prompt: ch.clue, targets: V.gates.map(g => ({ id: g.userData.word, obj: g.userData.board })), answer: ch.answer, hints: ch.hints, word: 'swift' });
  const gi = ord.indexOf(ch.answer); tx = V.gates[gi].position.x;
  // paddling: the paddle swings, the cart goes down the right channel to Leo
  const row = onTick(t => { mia.AR.rotation.x = -0.6 + Math.sin(t * 6) * 0.7; });
  drift = 3.2; while (z > -28) await wait(40); tx = 0; while (z > -39) await wait(40); drift = 0.25; row();
  // Leo climbs in
  const lw = V.leo.g.getWorldPosition(new THREE.Vector3()); V.leoLog.remove(V.leo.g); R.add(V.leo.g); V.leo.g.position.set(-0.3, 0.45, -0.4); V.leo.g.rotation.set(0, 0, 0); V.leo.pose('cheer'); V.leo.L.rotation.x = V.leo.R.rotation.x = -1.4;
  sfx('great'); dog.pose('wag'); mia.pose('cheer'); V.paddle.visible = false;
  await earnCard('swift');
  // ---- flush: out of the dark cave
  tell('As Mia got Leo into the cart, the {swift} water quickly helped them {flush} out of the dark cave.', { wait: false });
  await wait(1000); fillGap('swift');
  await chooseWord(pickV(6, [
    { prompt: 'Which word fits?', sentence: 'the swift water quickly helped them {_} out of the dark cave', tiles: ['flush', 'flash', 'brush'], answer: 'flush', note: 'flush = wash out fast with water', hints: ['Water pushed them out fast.', 'f – l – u – s – h'] },
    { prompt: 'Which word is spelled right?', sentence: 'the swift water quickly helped them {_} out of the dark cave', tiles: ['flush', 'flosh', 'fllush'], answer: 'flush', note: 'flush rhymes with rush', hints: ['It rhymes with rush.', 'f – l – u – s – h'] },
    { prompt: 'Which word fits?', sentence: 'the swift water quickly helped them {_} out of the dark cave', tiles: ['flush', 'fresh', 'flesh'], answer: 'flush', note: 'flush = wash out fast with water', hints: ['It has a u, like rush.', 'f – l – u – s – h'] },
  ]));
  await filled('flush'); V.flow.speed = 12; drift = 9; sfx('whoosh'); sfx('glow');
  while (z > -80) await wait(40);
  const lift = await veil('#FFF6D8', 700); off(); stopFollow();
  await earnCard('flush');
  // ---- the beach
  playMusic('meadow');
  const B = buildBeach(); const k = B.cast;
  setCam([0, 2.2, -8], [0, 1, 1]); lift();
  [k.leo, k.mia].forEach(c => c.pose('cheer')); k.toby.pose('wag');
  await tell('They landed on the softest sandy beach and jumped out into the warm sun.');
  // they hug
  moveTo(k.leo.g, [-0.32, 0, 0], 600, { face: false }); await moveTo(k.mia.g, [0.32, 0, 0], 600, { face: false });
  k.leo.g.rotation.y = 0.5; k.mia.g.rotation.y = -0.5; k.leo.pose('hold'); k.mia.pose('hold'); sparkles(new THREE.Vector3(0.3, 1.2, 0.5), 0x9FEAFF, 30); sfx('glow');
  await flyCam([0.6, 1.6, -4.2], [0, 1, 0.5], 1400);
  await tell('They hugged each other, so glad to be together. They had the puppy AND the treasure. It was the best adventure.');
  if (await offerStretch('Pick the word that compares.')) {
    await chooseWord(pickV(6, [
      { prompt: 'Bonus! Pick the right word.', sentence: 'They landed on the {_} sandy beach.', tiles: ['soft', 'softer', 'softest'], answer: 'softest', hints: ['THE ___ beach means most of all.', 'Use -est.'] },
      { prompt: 'Bonus! Pick the right word.', sentence: 'The sun was {_} than the cave.', tiles: ['warm', 'warmer', 'warmest'], answer: 'warmer', hints: ['THAN means two things.', 'Use -er.'] },
      { prompt: 'Bonus! Pick the right word.', sentence: 'It was the {_} adventure.', tiles: ['good', 'better', 'best'], answer: 'best', hints: ['good, better, best.', 'Most of all → best.'] },
    ]));
    star(6);
  }
  hideStory(); finish(6);
  const end = h('div', { class: 'tbc' }, h('div', {}, 'The End')); document.body.append(end); await wait(2400); end.remove();
}

// ================================================================ sum up the episode
export async function sumUp2() {
  playMusic('cave');
  const ov = h('div', { class: 'sumup' }, h('div', { class: 'sumup-title' }, 'Sum it up!'), h('div', { class: 'sumup-sub' }, 'Pass the challenge to finish Episode 2'));
  document.body.append(ov); await wait(600);
  await order({ prompt: 'Put what happened in order.', compact: true, items: ['The cart landed on a hidden track.', 'They went round a giant loop.', 'The cart splashed into a river.', 'Mia got Leo into the cart.', 'They came out on a sunny beach.'],
    hints: ['What happened first?', 'The loop came before the river.'] });
  await think({ prompt: 'How did Mia feel when she saw Leo?', options: ['Happy and glad', 'Angry', 'Sleepy'], answer: 'Happy and glad', hints: ['She was looking for him!'] });
  await think({ prompt: 'What does swift mean?', options: ['Very fast', 'Very cold', 'Very dark'], answer: 'Very fast', hints: ['The swift water pushed them out fast.'] });
  ov.remove(); S.ep2 = 1; save();
}
