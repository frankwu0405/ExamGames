// Episode 6 — The Old Man. Stops 16–18. Told in the present tense, like Frank's text.
import { S, save, sfx, wait, h, shuffle } from './core.js';
import { THREE, setCam, flyCam, tween, onTick, sparkles, textTexture, cut, dolly, quake, toon, scene } from './gfx.js';
import { buildGrayShore } from './sets6.js';
import { letterbox, frost, shardBurst, fogThicken } from './effects.js';
import { tell, tapOn, filled, hideStory, chooseWord, order, think, offerStretch, earnCard, toby, tapAll, MODE } from './ui.js';
import { playMusic } from './music.js';

const star = n => { S.stars[n] = 1; save(); sfx('great'); };
const visits = n => (S.stops[n] && S.stops[n].visits) || 0;
const finish = n => { const v = visits(n) + 1; S.stops[n] = Object.assign(S.stops[n] || {}, { done: 1, t: Date.now(), visits: v }); if (MODE.captain && MODE.perfect) { S.captain = S.captain || {}; S.captain[n] = 1; } save(); };
const pickV = (n, pool) => pool[visits(n) % pool.length];
// floating word labels in the scene (tap the ones that fit)
function labels(w, words, around, r = 6, y0 = 2) {
  return words.map((o, i) => { const g = new THREE.Group(); const a = Math.PI * (0.15 + 0.7 * i / Math.max(1, words.length - 1)); g.position.set(around.x + Math.cos(a) * r, around.y + y0 + (i % 2) * 1.2, around.z + Math.sin(a) * 1.5);
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: textTexture(o.w, { w: 512, h: 150, font: '70px Chewy, sans-serif', bg: '#FFF6E2', fg: '#2E2A4F' }), depthTest: false })); sp.scale.set(3.2, 0.94, 1); g.add(sp);
    const hit = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1, 0.3), new THREE.MeshBasicMaterial({ visible: false })); g.add(hit); w.add(g);
    const ph = i; onTick(t => { g.position.y = around.y + y0 + (i % 2) * 1.2 + Math.sin(t * 1.4 + ph) * 0.12; });
    return { obj: g, ok: o.ok, label: o.w }; });
}
const ring = (w, words) => labels(w, shuffle(words.map(([t, ok]) => ({ w: t, ok }))), new THREE.Vector3(0, 0, 0), 0, 0);
// lay the labels out in a row in front of the camera (the shots here are close and low)
function row(items, at, spread = 3.6, face = 0) { items.forEach((it, i) => { const k = i - (items.length - 1) / 2; it.obj.position.set(at.x + Math.cos(face) * k * spread, at.y + (i % 2) * 1.0, at.z - Math.sin(face) * k * spread); it.obj.userData.base = it.obj.position.y; }); }
const pick = (w, words, at, spread, face) => { const it = ring(w, words); row(it, at, spread, face); it.forEach(x => { const base = x.obj.position.y, ph = Math.random() * 6; onTick(t => { x.obj.position.y = base + Math.sin(t * 1.4 + ph) * 0.1; }); }); return it; };
const splash = (w, at, n = 40) => shardBurst(w, at, { n, power: 7, color: 0xDDEFF4 });

// the figures look towards +z when rotation.y is 0; this turns one to look at a point or at another figure
const look = (c, t) => { const p = t.g ? t.g.position : t; c.g.rotation.y = Math.atan2(p.x - c.g.position.x, p.z - c.g.position.z); };
const manAt = (I, x, z, st = 'idle') => { I.man.g.visible = true; I.man.g.position.set(x, 0, z); I.man.pose(st); };

// ================================================================ stop 16 — the gray shore
export async function stop16() {
  playMusic('cave');
  const I = buildGrayShore(); const { leo, mia, toby: dog } = I; const w = I.w;
  letterbox(true);
  // wide: the gray beach and the thick white fog
  cut([-5.5, 2.4, -8.5], [0.4, 0.9, 1.6], 52); dolly([-4.2, 2.2, -6.2], [0.4, 0.9, 1.6], 9000);
  await tell('Mia slowly opens her eyes. She feels something warm and wet on her face. It is Toby! He is licking her cheeks to wake her up.', { wait: false });
  mia.g.position.set(-0.4, 0, 1.5); mia.g.rotation.set(-1.05, 0.2, 0); mia.pose('idle'); dog.g.position.set(-0.3, 0, 0.55); look(dog, mia); dog.pose('bark');
  sfx('bark'); await wait(2400);
  cut([2.6, 1.6, 4.6], [-0.4, 0.7, 1.4], 42); dolly([2.0, 1.5, 3.8], [-0.4, 0.8, 1.4], 6000); sfx('bark'); await wait(1800); await tapOn();
  // ---- she sits up: what does the beach feel like?
  tween(900, e => { mia.g.rotation.x = -1.05 * (1 - e); }); mia.g.position.set(-0.4, -0.36, 1.5); mia.pose('sit'); dog.pose('wag');
  cut([-4.8, 1.9, -5.4], [0.2, 0.9, 1.8], 55); dolly([-3.6, 1.8, -3.8], [0.2, 0.9, 1.8], 8000);
  tell('Mia sits up in the sand. They are on a quiet, gray beach with thick white {fog}. Leo is still fast asleep.', { wait: false });
  await wait(2200);
  const lv = pickV(16, [
    { prompt: 'Tap the TWO words that tell about the beach.', yes: ['quiet', 'gray'], no: ['sunny', 'noisy', 'colorful'], hints: ['Read again: a quiet, gray beach.', 'quiet and gray'] },
    { prompt: 'Tap the TWO things you see on the beach.', yes: ['thick white fog', 'Leo, fast asleep'], no: ['a big castle', 'a pink balloon', 'a pizza'], hints: ['Read again: thick white fog… Leo is still fast asleep.', 'fog and Leo'] },
    { prompt: 'Tap the TWO words that tell about the fog.', yes: ['thick', 'white'], no: ['thin', 'red', 'hot'], hints: ['Read again: thick white fog.', 'thick and white'] },
  ]);
  setCam([-0.4, 2.0, -6.5], [0.2, 1.1, 1.8]);
  const items = pick(w, [...lv.yes.map(t => [t, true]), ...lv.no.map(t => [t, false])], new THREE.Vector3(0.2, 1.7, -0.6), 3.6, 0);
  await tapAll({ prompt: lv.prompt, items, hints: lv.hints, onRight: it => it.obj.scale.setScalar(1.15) });
  items.forEach(it => it.obj.visible = false);
  // ---- the word: fog
  await chooseWord(pickV(16, [
    { prompt: 'Which word fits?', sentence: 'a quiet, gray beach with thick white {_}', tiles: ['fog', 'frog', 'log'], answer: 'fog', note: 'fog = low gray cloud near the ground that is hard to see through', hints: ['You cannot see far in it.', 'f – o – g'] },
    { prompt: 'Which word is spelled right?', sentence: 'thick white {_}', tiles: ['fog', 'fogg', 'fug'], answer: 'fog', note: 'fog rhymes with dog and log', hints: ['It rhymes with dog.', 'f – o – g'] },
    { prompt: 'Which word means “a cloud close to the ground”?', sentence: 'thick white {_}', tiles: ['fog', 'fox', 'fan'], answer: 'fog', note: 'fog = a thick cloud near the ground', hints: ['You cannot see far in it.', 'fog'] },
  ]));
  await filled('fog'); await earnCard('fog');
  // ---- the sea: their boat is trapped
  letterbox(true); cut([-3, 1.6, -3.2], [4.4, 1.0, -12.6], 46); dolly([-1.2, 1.6, -4.4], [4.8, 0.9, -12.6], 7000);
  tell('Mia looks out at the cold sea and gasps. Their small wooden boat is stuck on sharp rocks not far in the water. They are cold and hungry, and their only way home is trapped.', { wait: false });
  mia.pose('scared'); sfx('glow'); await wait(2000); await tapOn();
  await think(pickV(16, [
    { prompt: 'Why can’t they go home?', options: ['Their boat is stuck on sharp rocks', 'They do not want to go', 'The beach is too warm'], answer: 'Their boat is stuck on sharp rocks', hints: ['Look at the boat. Where is it?', 'Read again: …stuck on sharp rocks.'] },
    { prompt: 'How do Mia and Leo feel?', options: ['Cold and hungry', 'Hot and full', 'Happy and sleepy'], answer: 'Cold and hungry', hints: ['Read again: They are cold and hungry.'] },
    { prompt: 'Where is the little boat?', options: ['Stuck on rocks in the water', 'Under Leo', 'Up in a tree'], answer: 'Stuck on rocks in the water', hints: ['Read again: stuck on sharp rocks not far in the water.'] },
  ]));
  if (await offerStretch('What does this word mean?')) {
    await think(pickV(16, [
      { prompt: 'Bonus! A quiet beach is…', options: ['not noisy', 'very loud', 'very hot'], answer: 'not noisy', hints: ['There is no sound but the sea.'] },
      { prompt: 'Bonus! Something sharp can…', options: ['cut or poke you', 'make you sleepy', 'make you laugh'], answer: 'cut or poke you', hints: ['The rocks are sharp.'] },
      { prompt: 'Bonus! “Trapped” means…', options: ['stuck and cannot get out', 'lost in a game', 'very happy'], answer: 'stuck and cannot get out', hints: ['The boat is stuck.'] },
    ]));
    star(16);
  }
  hideStory(); letterbox(false); finish(16);
}

// ================================================================ stop 17 — the old man
export async function stop17() {
  playMusic('cave');
  const I = buildGrayShore(); const { leo, mia, toby: dog, man } = I; const w = I.w;
  // morning on the beach: Leo is awake now
  leo.g.rotation.set(0, 0.5, 0); leo.g.position.set(1.0, 0, 1.4); leo.forceFace = null; leo.pose('idle'); mia.g.position.set(-0.4, 0, 1.6); mia.g.rotation.y = 0.2; mia.pose('idle'); dog.g.position.set(-1.2, 0, 1.4);
  letterbox(true); cut([-4, 1.5, -3.6], [-0.6, 1.0, 3.6], 50);
  tell('Toby sniffs the wet air and runs to the dark trees. Mia wakes Leo up, and they follow Toby into the trees. Soon, they see a fire glowing in the woods.', { wait: false });
  dog.pose('run'); tween(3200, e => { dog.g.position.set(-1.2 - e * 1.5, 0, 1.4 + e * 17); dog.g.rotation.y = 0.05; });
  await wait(900); leo.pose('walk'); mia.pose('walk'); tween(3600, e => { mia.g.position.set(-0.4 - e * 2.8, 0, 1.6 + e * 14.6); leo.g.position.set(1.0 - e * 4.6, 0, 1.4 + e * 14); mia.g.rotation.y = leo.g.rotation.y = 0.12; });
  dolly([-5, 1.9, 4.2], [-3, 1.0, 20], 5200);
  await wait(3200); I.fire.userData.set(true); sfx('glow'); await tapOn();
  // ---- the old man by the fire
  letterbox(true); manAt(I, I.fireAt.x - 1.0, I.fireAt.z + 1.1, 'idle'); dog.g.position.set(I.fireAt.x + 1.6, 0, I.fireAt.z + 0.4); dog.pose('sit');
  leo.pose('idle'); mia.pose('idle'); leo.g.position.set(I.fireAt.x + 2.6, 0, I.fireAt.z + 2.9); mia.g.position.set(I.fireAt.x + 1.0, 0, I.fireAt.z + 3.4); [leo, mia, dog].forEach(c => look(c, man)); look(man, mia);
  cut([I.fireAt.x + 4.2, 1.7, I.fireAt.z + 4.6], [I.fireAt.x - 1.0, 1.4, I.fireAt.z + 0.6], 46); dolly([I.fireAt.x + 3.4, 1.6, I.fireAt.z + 4.0], [I.fireAt.x - 1.0, 1.5, I.fireAt.z + 0.6], 8000);
  tell('An old man wearing a dirty coat sits by the fire. He gives them a {kind} smile and hands them bowls of hot soup.', { wait: false });
  man.pose('kind'); await wait(2800); man.pose('soup'); await wait(1600); await tapOn();
  const kv = pickV(17, [
    { prompt: 'Tap the TWO things the old man has.', yes: ['a dirty coat', 'hot soup'], no: ['a red hat', 'a big dog', 'a pizza'], hints: ['Read again: a dirty coat… bowls of hot soup.', 'coat and soup'] },
    { prompt: 'Tap the TWO things the old man does.', yes: ['gives them soup', 'smiles at them'], no: ['runs away', 'sings a song', 'goes to sleep'], hints: ['Read again: He gives them a kind smile and hands them bowls of hot soup.', 'soup and smile'] },
    { prompt: 'Tap the TWO things they see in the woods.', yes: ['a glowing fire', 'an old man'], no: ['a big castle', 'a flying cow', 'a school bus'], hints: ['Read again: they see a fire glowing… An old man…', 'fire and old man'] },
  ]);
  setCam([I.fireAt.x + 3.2, 1.7, I.fireAt.z + 9], [I.fireAt.x - 0.6, 1.9, I.fireAt.z + 0.6]);
  const it1 = pick(w, [...kv.yes.map(t => [t, true]), ...kv.no.map(t => [t, false])], new THREE.Vector3(I.fireAt.x - 0.4, 2.0, I.fireAt.z + 3.2), 3.6, 0);
  await tapAll({ prompt: kv.prompt, items: it1, hints: kv.hints, onRight: it => it.obj.scale.setScalar(1.15) });
  it1.forEach(it => it.obj.visible = false);
  // ---- the word: kind
  letterbox(true); man.pose('kind'); cut([I.fireAt.x - 0.2, 2.0, I.fireAt.z + 3.6], [I.fireAt.x - 1.0, 1.65, I.fireAt.z + 1.1], 34);
  await chooseWord(pickV(17, [
    { prompt: 'Which word fits?', sentence: 'He gives them a {_} smile.', tiles: ['kind', 'kid', 'king'], answer: 'kind', note: 'kind = nice and caring to others', hints: ['He is nice to them.', 'k – i – n – d'] },
    { prompt: 'Which word is spelled right?', sentence: 'He gives them a {_} smile.', tiles: ['kind', 'kined', 'kynd'], answer: 'kind', note: 'kind ends with nd', hints: ['It ends with nd.', 'k – i – n – d'] },
    { prompt: 'Which word means “nice and caring”?', sentence: 'He gives them a {_} smile.', tiles: ['kind', 'mean', 'loud'], answer: 'kind', note: 'kind = nice and caring', hints: ['A kind person helps others.', 'kind'] },
  ]));
  await filled('kind'); await earnCard('kind');
  // ---- he says he will walk with them
  letterbox(true); man.pose('talk'); cut([I.fireAt.x + 3.4, 1.6, I.fireAt.z + 4.0], [I.fireAt.x - 1.0, 1.5, I.fireAt.z + 0.8], 46);
  tell('As they eat and warm their hands, he listens to their story. He nods and says he will walk with them to help them get their boat back.', { wait: false });
  await wait(2600); await tapOn();
  await think(pickV(17, [
    { prompt: 'What does the old man say he will do?', options: ['Walk with them to get their boat back', 'Sail to the moon', 'Take their soup'], answer: 'Walk with them to get their boat back', hints: ['Read again: …he will walk with them to help them get their boat back.'] },
    { prompt: 'What does the old man do while they eat?', options: ['He listens to their story', 'He sings loudly', 'He falls asleep'], answer: 'He listens to their story', hints: ['Read again: he listens to their story.'] },
    { prompt: 'Why is the old man nice to the kids?', options: ['He gives them hot soup', 'He is hiding from them', 'He wants to be alone'], answer: 'He gives them hot soup', hints: ['What does he hand them?'] },
  ]));
  // ---- the walk back: the secret
  letterbox(true); man.pose('walk'); [leo, mia].forEach(c => c.pose('walk')); dog.pose('run');
  const sx = I.fireAt.x, sz = I.fireAt.z;
  cut([sx + 1.8, 1.4, sz - 4], [sx - 0.6, 1.4, sz - 10], 50);
  man.g.position.set(sx - 1.0, 0, sz - 1.4); man.g.rotation.y = Math.PI; leo.g.position.set(sx + 0.8, 0, sz - 1.7); mia.g.position.set(sx - 2.8, 0, sz - 1.9); leo.g.rotation.y = mia.g.rotation.y = Math.PI; dog.g.position.set(sx - 0.3, 0, sz - 3.6); dog.g.rotation.y = Math.PI;
  tween(7000, e => { [man, leo, mia, dog].forEach(c => c.g.position.z = (c === dog ? sz - 3.6 : c === man ? sz - 1.4 : sz - 1.8) - e * 16); });
  await wait(900);
  tell('They walk together from the woods to the shore. On the way, the old man tells them a secret. “Varn is not a true guard!” he says in a low, angry voice. “He is a {greedy} beast! Long ago, that monster stole those gems from brave sailors like me. I was trapped on this beach for years. I have no boat, but I want my gems back.” Mia knows this is a lie. She knows that the gems grow in the cave, but she does not say a word.', { wait: false });
  man.pose('talk'); await wait(1600); dolly([sx + 2, 1.6, sz - 12], [sx - 1.0, 1.5, sz - 18], 7000); await wait(5200);
  await chooseWord(pickV(17, [
    { prompt: 'Which word fits?', sentence: '“He is a {_} beast!”', tiles: ['greedy', 'greedily', 'green'], answer: 'greedy', note: 'greedy = always wanting more for yourself', hints: ['A greedy person wants everything.', 'g – r – ee – d – y'] },
    { prompt: 'Which word is spelled right?', sentence: '“He is a {_} beast!”', tiles: ['greedy', 'gredy', 'greedee'], answer: 'greedy', note: 'greedy has ee in the middle and y at the end', hints: ['It has ee, like in see.', 'g – r – ee – d – y'] },
    { prompt: 'Which word means “wanting more and more for yourself”?', sentence: '“He is a {_} beast!”', tiles: ['greedy', 'sleepy', 'happy'], answer: 'greedy', note: 'greedy = wanting too much', hints: ['A greedy man takes all the gems.', 'greedy'] },
  ]));
  await filled('greedy'); await earnCard('greedy');
  // ---- is the old man telling the truth?
  letterbox(true); mia.pose('idle'); cut([sx - 4.6, 1.5, sz - 21], [sx - 3.0, 1.2, sz - 19], 40);
  await think(pickV(17, [
    { prompt: 'Mia knows the old man is not telling the truth. How does she know?', options: ['She knows the gems grow in the cave', 'Toby told her', 'She saw it on a map'], answer: 'She knows the gems grow in the cave', hints: ['Read again: She knows that the gems grow in the cave.'] },
    { prompt: 'What does Mia say to the old man?', options: ['Nothing. She does not say a word.', '“You are a liar!”', '“Thank you for the gems!”'], answer: 'Nothing. She does not say a word.', hints: ['Read again: …she does not say a word.'] },
    { prompt: 'What does the old man say about Varn?', options: ['Varn is a greedy beast who stole the gems', 'Varn is his best friend', 'Varn is a tiny fish'], answer: 'Varn is a greedy beast who stole the gems', hints: ['Read again: “Varn is not a true guard!”'] },
  ]));
  if (await offerStretch('Words that tell WHEN.')) {
    await chooseWord(pickV(17, [
      { prompt: 'Bonus! When did the monster steal the gems?', sentence: '“{_} ago, that monster stole those gems.”', tiles: ['Long', 'Soon', 'Never'], answer: 'Long', hints: ['The old man says it happened a very long time back.', 'Long ago'] },
      { prompt: 'Bonus! How long was the old man on the beach?', sentence: 'He was trapped there for {_}.', tiles: ['years', 'a second', 'a sneeze'], answer: 'years', hints: ['Read again: …trapped on this beach for years.', 'years'] },
      { prompt: 'Bonus! What does the old man want back?', sentence: '“I want my {_} back.”', tiles: ['gems', 'socks', 'soup'], answer: 'gems', hints: ['Read again: …I want my gems back.', 'gems'] },
    ]));
    star(17);
  }
  hideStory(); finish(17);
}

// ================================================================ stop 18 — the stolen boat
export async function stop18() {
  playMusic('danger');
  const I = buildGrayShore(); const { leo, mia, toby: dog, man } = I; const w = I.w; const B = I.boat.g;
  // they stand in the shallows beside the stuck boat
  const bx = 5.2, bz = -12.4;
  leo.g.position.set(bx - 2.4, -0.05, bz + 1.8); leo.forceFace = null; mia.g.position.set(bx - 3.6, -0.05, bz + 2.6); leo.pose('idle'); mia.pose('idle'); dog.g.position.set(bx - 1.4, 0, bz + 3.2); dog.pose('idle');
  manAt(I, bx - 0.8, bz + 3.0, 'idle'); man.g.position.y = -0.05; [leo, mia, dog, man].forEach(c => look(c, B.position));
  letterbox(true); cut([bx - 6.5, 1.8, bz + 6], [bx - 0.4, 0.9, bz + 0.4], 50); dolly([bx - 5.4, 1.7, bz + 5.2], [bx - 0.4, 0.9, bz + 0.4], 7000);
  tell('They push hard on the boat and set it free! But the man does not let go. His kind smile is gone.', { wait: false });
  [leo, mia].forEach(c => c.pose('reach')); sfx('whoosh'); tween(1500, e => { B.position.x = bx - e * 1.2; B.position.z = bz + e * 1.8; B.rotation.z = -0.16 * (1 - e); B.rotation.x = 0.08 * (1 - e); B.position.y = 0.3 + Math.sin(e * 3) * 0.04; });
  await wait(1800); splash(w, new THREE.Vector3(bx - 1, 0.1, bz + 1.5), 24); sfx('crash');
  man.pose('cold'); I.boat.cast.leo.g.visible = false; await wait(1400); await tapOn();
  // ---- close on the old man: the cold laugh
  letterbox(true); cut([bx - 3.8, 1.9, bz + 5.6], [bx - 0.8, 1.7, bz + 3.0], 34); man.pose('cold');
  tell('“Thank you for my new ship, kids,” he says with a cold laugh. “I am not taking you home. I am sailing back to the cave to take all the {treasure}!”', { wait: false });
  sfx('rumble'); quake(0.8, 0.1); frost(0.35, 2000); await wait(3200);
  await chooseWord(pickV(18, [
    { prompt: 'Which word fits?', sentence: '“I am sailing back to the cave to take all the {_}!”', tiles: ['treasure', 'measure', 'pleasure'], answer: 'treasure', note: 'treasure = gold, gems and other precious things', hints: ['The gems are the…', 't – r – ea – s – ure'] },
    { prompt: 'Which word is spelled right?', sentence: '“…to take all the {_}!”', tiles: ['treasure', 'tresure', 'treasur'], answer: 'treasure', note: 'treasure has ea in the middle and ure at the end', hints: ['It has ea, like in sea.', 't – r – ea – s – ure'] },
    { prompt: 'Which word means “gold, gems and other precious things”?', sentence: '“…to take all the {_}!”', tiles: ['treasure', 'trash', 'trouble'], answer: 'treasure', note: 'treasure = a hoard of precious things', hints: ['Pirates hide it in a chest.', 'treasure'] },
  ]));
  await filled('treasure'); await earnCard('treasure');
  await think(pickV(18, [
    { prompt: 'What does the old man really want?', options: ['The treasure in the cave', 'To help the kids', 'To go to sleep'], answer: 'The treasure in the cave', hints: ['Read again: …to take all the treasure!'] },
    { prompt: 'Is the old man really kind?', options: ['No. He tricked them.', 'Yes. He is a friend.', 'Yes. He is taking them home.'], answer: 'No. He tricked them.', hints: ['He said, “I am not taking you home.”'] },
    { prompt: 'What does the old man do with the boat?', options: ['He tries to take it for himself', 'He gives it back', 'He sinks it'], answer: 'He tries to take it for himself', hints: ['He says, “Thank you for my new ship.”'] },
  ]));
  // ---- Toby saves the day
  letterbox(true); cut([bx - 4.8, 1.0, bz + 6.4], [bx - 1.2, 0.8, bz + 2.4], 46);
  man.pose('grab'); tell('He tries to climb inside, but Toby jumps, bites the man’s coat, and pulls him in the water. *SPLASH!* Leo pulls Toby back inside the boat.', { wait: false });
  await wait(1400); dog.pose('bark'); sfx('bark');
  dog.g.position.set(bx - 1.3, 0.2, bz + 3.3); await tween(520, e => { dog.g.position.set(bx - 1.4 + e * 0.5, 0.2 + Math.sin(e * Math.PI) * 1.3, bz + 3.2 - e * 0.9); });
  await tween(1500, e => { man.g.rotation.x = e * 1.4; man.g.rotation.z = e * 0.3; man.g.position.y = -0.05 - e * 0.5; man.g.position.z = bz + 3.0 - e * 0.5; });
  splash(w, new THREE.Vector3(bx - 1.2, 0.2, bz + 2.5), 60); sfx('crash'); quake(0.9, 0.15); sparkles(new THREE.Vector3(bx - 1.2, 1, bz + 2.5), 0xE6F6FF, 50);
  await wait(1200);
  leo.pose('reach'); mia.pose('scared'); await wait(1800); await tapOn();
  // ---- what happened, in order
  await order(pickV(18, [
    { prompt: 'What happens? Put it in order.', compact: true, items: ['The kids push the boat free.', 'The man says he will take the treasure.', 'Toby bites the man’s coat.', 'The man falls in the water. SPLASH!'], hints: ['First they set the boat free…', 'Toby bites before the splash.'] },
    { prompt: 'Put the story in order.', compact: true, items: ['The old man gives them soup.', 'He says he will help them.', 'The boat is set free.', 'He says, “I am not taking you home.”'], hints: ['The soup came first.', 'He tells the truth at the end.'] },
  ]));
  await chooseWord(pickV(18, [
    { prompt: 'This story uses NOW words. Pick the NOW word.', sentence: 'Toby {_} the man’s coat.', tiles: ['bites', 'bit'], answer: 'bites', note: 'bites = happening now · bit = already happened', hints: ['NOW words often end in -s here.', 'bites'] },
    { prompt: 'This story uses NOW words. Pick the NOW word.', sentence: 'The man {_} a cold laugh.', tiles: ['says', 'said'], answer: 'says', note: 'says = now · said = before', hints: ['said already happened.', 'says'] },
    { prompt: 'This story uses NOW words. Pick the NOW word.', sentence: 'Leo {_} Toby back inside the boat.', tiles: ['pulls', 'pulled'], answer: 'pulls', note: 'pulls = now · pulled = before', hints: ['pulled already happened.', 'pulls'] },
  ]));
  if (await offerStretch('Find the sound word.')) {
    await think(pickV(18, [
      { prompt: 'Bonus! Which one is a SOUND word?', options: ['SPLASH', 'coat', 'boat'], answer: 'SPLASH', hints: ['Which one can you hear?'] },
      { prompt: 'Bonus! Which one is a SOUND word?', options: ['CRASH', 'rock', 'gem'], answer: 'CRASH', hints: ['Which one can you hear?'] },
      { prompt: 'Bonus! Which one is a SOUND word?', options: ['WOOF', 'old', 'soup'], answer: 'WOOF', hints: ['Which one can you hear?'] },
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
  await order({ prompt: 'Put what happened in order.', compact: true, items: ['Toby woke Mia on the gray beach.', 'The old man gave them hot soup.', 'He told them a secret about Varn.', 'The kids set the boat free.', 'Toby pulled the old man into the water.'], hints: ['What happened first?', 'The soup came before the secret.'] });
  await think({ prompt: 'Was the old man really kind?', options: ['No. He wanted the treasure.', 'Yes. He wanted to help.', 'We do not know.'], answer: 'No. He wanted the treasure.', hints: ['What did he say at the boat?'] });
  await think({ prompt: 'Why did Mia not say a word?', options: ['She knew the gems grow in the cave', 'She was asleep', 'She lost her voice'], answer: 'She knew the gems grow in the cave', hints: ['Mia knew the old man was not telling the truth.'] });
  ov.remove(); S.ep6 = 1; save();
}
