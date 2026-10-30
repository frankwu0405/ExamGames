// Episode 5 — Guard of the Stones. Stops 13–15. Told in the present tense, like Frank's text.
import { S, save, sfx, wait, h, shuffle } from './core.js';
import { THREE, setCam, flyCam, followCam, stopFollow, quake, tween, moveTo, onTick, sparkles, textTexture, cut, dolly, lens, scene, toon } from './gfx.js';
import { buildIce } from './sets5.js';
import { letterbox, frost, shardBurst, fogThicken, glowSprite } from './effects.js';
import { tell, tapOn, filled, hideStory, chooseWord, spellOn, order, think, offerStretch, earnCard, toby, tapAll, MODE } from './ui.js';
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
// a quick white flash
const flash = () => { const f = h('div', { class: 'veil memory' }); f.style.background = '#EAF7FF'; document.body.append(f); setTimeout(() => f.classList.add('out'), 80); setTimeout(() => f.remove(), 900); };
// ---- cinematic beats
async function burstOut(I) {
  const V = I.varn; V.state.glow = 1.1; sfx('crash'); sfx('rumble'); quake(2.2, 0.35);
  I.hole.scale.setScalar(1); const c = new THREE.Vector3(1.3, 0.2, -15);
  shardBurst(I.w, c, { n: 36, power: 10 }); I.slabs.forEach((m, i) => { m.visible = true; const u = m.userData; tween(700 + i * 20, e => { m.rotation.x = u.rx * e; m.rotation.z = u.rz * e; m.position.y = 0.1 + u.y * e + Math.sin(e * Math.PI) * 1.5; }); });
  V.to('arch', 2400); await wait(500); sparkles(c.clone().setY(2), 0xDFF8FF, 70);
  await V.lookAt(new THREE.Vector3(0, 3, 2), 0.75, 1600); await wait(300);
}
function settled(I, pose) {     // later stops: he is already out of the ice
  I.hole.scale.setScalar(1); I.slabs.forEach(m => { const u = m.userData; m.visible = true; m.rotation.x = u.rx; m.rotation.z = u.rz; m.position.y = 0.1 + u.y; });
  I.varn.set(pose); I.varn.state.glow = 1.1; I.varn.lookAt(new THREE.Vector3(0, 3, 2), 0.8, 10);
}
const near = (I, off) => { const h = I.varn.headPos(); return [[h.x + off[0], h.y + off[1], h.z + off[2]], [h.x, h.y + 0.2, h.z]]; };
// a big wave of water that rises and rolls the boat away
function makeWave(w) {
  const g = new THREE.Group(); w.add(g);
  const sheet = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 3.4, 18, 30, 1, true, Math.PI * 0.5, Math.PI * 1.15), toon(0x3C9FB8, { side: THREE.DoubleSide, transparent: true, opacity: 0.93, emissive: 0x0E4A5E, emissiveIntensity: 0.4 }));
  sheet.rotation.z = Math.PI / 2; g.add(sheet);
  const foamM = new THREE.MeshBasicMaterial({ color: 0xF4FBFF });
  for (let i = 0; i < 26; i++) { const f = new THREE.Mesh(new THREE.SphereGeometry(0.45 + Math.random() * 0.4, 8, 6), foamM); f.position.set(-9 + i * 0.72, 3.2 + Math.random() * 0.4, -0.4 + Math.random() * 0.8); g.add(f); }
  g.position.set(0, -7, -6); g.visible = false; return g;
}

// ================================================================ stop 13 — Varn rises
export async function stop13() {
  playMusic('cave');
  const I = buildIce(); const { leo, mia, toby: dog } = I.boat.cast; const V = I.varn; V.set('circle'); V.state.glow = 1.6;
  letterbox(true); frost(0.45, 2000);
  // close on the kids: the ice cracks under them
  cut([2.4, 2.0, -4.8], [0, 1.15, 0], 40); dolly([1.8, 1.9, -4.0], [0, 1.2, 0], 6000);
  [leo, mia].forEach(c => c.pose('scared')); dog.pose('bark');
  tell('The thick ice cracks loudly. *CRACK!* A giant, scary beast rises from the dark water!', { wait: false });
  sfx('crash'); quake(0.6, 0.12); await wait(2500); await tapOn();
  // high above: a long glowing shape circles under the ice
  await flyCam([0, 21, 7], [0, 0, -1.5], 2200, { fov: 55 }); dolly([0, 19, 4], [0, 0, -1.5], 9000);
  await tell('It swims quickly in circles around their little boat, keeping its huge body hidden under the water.');
  // low behind the boat — it bursts out of the ice (like the picture in the book)
  playMusic('danger'); letterbox(true);
  cut([2.4, 1.2, 4.6], [1.2, 4.8, -11], 56);
  tell('Then, it breaks out of the ice right in front of them! Toby barks. Mia is scared.', { wait: false });
  await wait(600); dolly([2, 1.1, 3.8], [1.2, 5.4, -11], 7000);
  await burstOut(I); sfx('bark'); dog.pose('bark');
  await tapOn();
  // ---- read the description: tap what Varn really has
  const dv = pickV(13, [
    { prompt: 'The story says Varn has two of these. Tap them!', yes: ['glowing white eyes', 'long, sharp claws'], no: ['big wings', 'a tiny hat', 'pink spots'], hints: ['Read again: It has glowing white eyes and long, sharp claws.', 'Look for eyes and claws.'] },
    { prompt: 'Tap the words that tell what Varn is like.', yes: ['giant', 'scary'], no: ['tiny', 'fluffy', 'sleepy'], hints: ['Read again: A giant, scary beast…', 'giant and scary!'] },
    { prompt: 'Tap the things Varn does.', yes: ['swims in circles', 'breaks the ice'], no: ['flies away', 'eats a cake', 'goes to sleep'], hints: ['Read again what Varn does in the water.', 'swims and breaks!'] },
  ]);
  const items = labels(I.w, shuffle([...dv.yes.map(w => ({ w, ok: true })), ...dv.no.map(w => ({ w, ok: false }))]), new THREE.Vector3(0, 0, -6), 6.5, 3.2);
  await tapAll({ prompt: dv.prompt, items, hints: dv.hints, onRight: it => { it.obj.scale.setScalar(1.15); } });
  items.forEach(it => it.obj.visible = false);
  // ---- the voice: he lifts his great head over the boat and looks down at them
  letterbox(true); V.to('rear', 2600); V.lookAt(new THREE.Vector3(0, 4, 4), 0.85, 2000);
  await flyCam([8.5, 4.6, 5.5], [0, 6.4, -6], 2400, { fov: 52 }); dolly([6.4, 5.4, 2.6], [0, 7, -6], 8000);
  tell('A cold, deep {voice} speaks right inside their heads: “I am Varn, guard of the deep stones! Give me back my blue gem!”', { wait: false });
  V.state.anger = 1; sfx('rumble'); V.roar(1600); frost(0.7, 2500);
  await wait(2200);
  await chooseWord(pickV(13, [
    { prompt: 'Which word fits?', sentence: 'A cold, deep {_} speaks inside their heads.', tiles: ['voice', 'noise', 'choice'], answer: 'voice', note: 'voice = the sound a person makes when talking', hints: ['Varn is talking. What do you hear?', 'v – oi – ce'] },
    { prompt: 'Which word is spelled right?', sentence: 'A cold, deep {_} speaks inside their heads.', tiles: ['voice', 'voyce', 'vois'], answer: 'voice', note: 'oi in the middle, ce at the end', hints: ['It has oi, like in coin.', 'v – o – i – c – e'] },
    { prompt: 'Which word fits?', sentence: 'A cold, deep {_} speaks inside their heads.', tiles: ['voice', 'vase', 'van'], answer: 'voice', note: 'voice = the sound of talking', hints: ['You talk with your…', 'voice'] },
  ]));
  await filled('voice'); await earnCard('voice');
  // ---- speech marks: where do they go?
  await think(pickV(13, [
    { prompt: 'Which one has the speech marks in the right place?', options: ['“Give me back my blue gem!”', 'Give me back “my blue gem!”', '“Give me” back my blue gem!'], answer: '“Give me back my blue gem!”', hints: ['Speech marks go around ALL the words Varn says.'] },
    { prompt: 'Who says “Give me back my blue gem”?', options: ['Varn', 'Mia', 'Toby'], answer: 'Varn', hints: ['Who is the guard of the deep stones?'] },
    { prompt: 'Where does Varn’s voice speak?', options: ['Right inside their heads', 'Out of the boat', 'From the Ferris wheel'], answer: 'Right inside their heads', hints: ['Read again: …speaks right inside their heads.'] },
  ]));
  if (await offerStretch('What does this word mean?')) {
    await think(pickV(13, [
      { prompt: 'Bonus! A guard is someone who…', options: ['keeps things safe', 'steals things', 'sleeps all day'], answer: 'keeps things safe', hints: ['Varn guards the deep stones.'] },
      { prompt: 'Bonus! “Deep” stones are…', options: ['far down under the water', 'very small', 'very loud'], answer: 'far down under the water', hints: ['Deep water goes far down.'] },
      { prompt: 'Bonus! A beast is…', options: ['a big wild animal', 'a kind of boat', 'a tiny bug'], answer: 'a big wild animal', hints: ['Varn is a giant beast.'] },
    ]));
    star(13);
  }
  hideStory(); finish(13);
}

// ================================================================ stop 14 — Mia's choice
export async function stop14() {
  playMusic('cave');
  const I = buildIce(); const { leo, mia, toby: dog } = I.boat.cast; const V = I.varn; settled(I, 'loom'); V.state.anger = 0.4;
  // his huge head right beside the little boat (like the picture in the book)
  letterbox(true); frost(0.5, 1500);
  cut([4, 2.3, -7.8], [-3.2, 1.8, -2], 50); dolly([3.2, 2.2, -6.8], [-3.2, 1.9, -2], 9000);
  mia.pose('scared'); leo.pose('scared');
  tell('Mia is very scared, but she is also brave. She wants to keep the gem. They worked so hard in the dark cave to find this beautiful treasure!', { wait: false });
  await wait(1500); await tapOn();
  // ---- feelings: tap the words that fit Mia right now
  const fv = pickV(14, [
    { prompt: 'Tap the TWO words that tell how Mia feels.', yes: ['scared', 'brave'], no: ['sleepy', 'bored', 'silly'], hints: ['Read again: Mia is very scared, but she is also brave.', 'scared and brave'] },
    { prompt: 'Tap the TWO words that tell what Mia wants.', yes: ['keep the gem', 'not give it away'], no: ['go to sleep', 'eat lunch', 'fly away'], hints: ['Read again: She wants to keep the gem.', 'She does not want to give it away.'] },
    { prompt: 'Tap the TWO words that tell about the gem.', yes: ['beautiful', 'treasure'], no: ['ugly', 'tiny bug', 'muddy'], hints: ['Read again: this beautiful treasure!', 'beautiful treasure'] },
  ]);
  setCam([3.6, 2.8, 5.5], [0, 1.8, -6]);
  const items = labels(I.w, shuffle([...fv.yes.map(w => ({ w, ok: true })), ...fv.no.map(w => ({ w, ok: false }))]), new THREE.Vector3(0.8, 0, -5), 6, 2.6);
  await tapAll({ prompt: fv.prompt, items, hints: fv.hints, onRight: it => it.obj.scale.setScalar(1.15) });
  items.forEach(it => it.obj.visible = false);
  // she hides the gem behind her back
  // from behind: the gem glows in Mia’s hands, hidden behind her back
  letterbox(true); cut([-1.4, 1.9, 2.8], [-2.4, 1.4, -2.2], 50); dolly([-1.3, 1.8, 2.2], [-2.5, 1.5, -2.2], 7000);
  tell('Mia is not ready to give it away to a scary sea monster. She has to think fast, so she hides her hands behind her back. “We don’t have it!” she yells at the water. “We are just lost kids!” Toby barks again.', { wait: false });
  mia.pose('hide'); leo.pose('reach'); sfx('bark'); dog.pose('bark'); tween(1200, e => { I.gemLight.intensity = e * 6; I.gemGlow.scale.setScalar(0.01 + e * 0.9); });
  await wait(1800); await tapOn();
  // ---- is she telling the truth?
  await think(pickV(14, [
    { prompt: 'Is Mia telling the truth?', options: ['No. The gem is behind her back.', 'Yes. They lost it in the cave.', 'Yes. Toby has it.'], answer: 'No. The gem is behind her back.', hints: ['Where are Mia’s hands? What is in them?'] },
    { prompt: 'Why does Mia hide her hands?', options: ['To hide the gem from Varn', 'Her hands are cold', 'To wave at Leo'], answer: 'To hide the gem from Varn', hints: ['What does Varn want?'] },
    { prompt: '“We don’t have it!” Is that true?', options: ['No, it is not true', 'Yes, it is true'], answer: 'No, it is not true', hints: ['Look behind Mia’s back.'] },
  ]));
  // the gem glows; Varn is not fooled
  // close on his glowing eye… the air turns freezing cold
  letterbox(true); V.state.sway = 0.25; V.lookAt(mia.g.getWorldPosition(new THREE.Vector3()).setY(1.3), 1, 1200);
  { const hp = V.headPos(), o = (a, b, c) => [hp.x + a, hp.y + b, hp.z + c], L = o(0, 0.6, 0); await flyCam(o(7.5, 2.8, -2.4), L, 1600, { fov: 44 }); dolly(o(6.4, 2.4, -2), L, 7000); }
  tell('You cannot trick an old magic beast. Varn stops swimming and looks right at Mia with its giant, glowing eyes. The air turns freezing cold. Suddenly, the blue gem behind Mia’s back starts to shine. It glows so brightly that a strong blue light shines all around her!', { wait: false });
  V.state.anger = 1; frost(1, 3000); await wait(2600);
  // the gem shines — blue light all around her
  cut([2.6, 2.2, 4.4], [-1, 1.8, -2.5], 52); dolly([2.2, 2.4, 3.6], [-1, 2, -2.5], 6000);
  sfx('glow'); await tween(1600, e => { I.gemLight.intensity = 6 + e * 34; I.gemGlow.scale.setScalar(0.9 + e * 3.4); V.eyeLight.intensity = 14 + e * 10; });
  await tapOn();
  // ---- the lie
  tell('Varn is very angry. Its voice yells in their heads: “You {lie}! You are greedy and bad, just like the greedy men on the island long ago!”', { wait: false });
  letterbox(true); V.state.sway = 1; V.to('rear', 1300); V.roar(1800); sfx('rumble'); quake(1.6, 0.25);
  cut([1.8, 1.1, 6.5], [0, 6, -6], 60); dolly([1.4, 1.0, 5.4], [0, 6.6, -6], 6000); await wait(1800);
  await chooseWord(pickV(14, [
    { prompt: 'Which word fits?', sentence: '“You {_}!”', tiles: ['lie', 'line', 'lay'], answer: 'lie', note: 'lie = say something that is not true', hints: ['Mia did not tell the truth.', 'l – i – e'] },
    { prompt: 'Which word means “say something that is not true”?', sentence: '“You {_}!”', tiles: ['lie', 'cry', 'fly'], answer: 'lie', note: 'lie = say something not true', hints: ['Not true…', 'lie'] },
    { prompt: 'Which word is spelled right?', sentence: '“You {_}!”', tiles: ['lie', 'ly', 'lye'], answer: 'lie', note: 'lie rhymes with pie and tie', hints: ['It rhymes with pie.', 'l – i – e'] },
  ]));
  await filled('lie'); await earnCard('lie');
  await think(pickV(14, [
    { prompt: 'What does greedy mean?', options: ['Wanting more and more for yourself', 'Kind and sharing', 'Very sleepy'], answer: 'Wanting more and more for yourself', hints: ['The greedy men took the gems.'] },
    { prompt: 'Why does Varn call Mia greedy?', options: ['She wants to keep his gem', 'She ate his lunch', 'She is too loud'], answer: 'She wants to keep his gem', hints: ['What is Mia hiding?'] },
    { prompt: 'Who else was greedy, long ago?', options: ['The men on the island', 'Toby', 'The fish'], answer: 'The men on the island', hints: ['Read again: …just like the greedy men on the island long ago!'] },
  ]));
  if (await offerStretch('Words that tell WHERE.')) {
    await chooseWord(pickV(14, [
      { prompt: 'Bonus! Where is the gem?', sentence: 'The gem is {_} Mia’s back.', tiles: ['behind', 'on top of', 'under'], answer: 'behind', hints: ['She hides her hands at the back.', 'behind'] },
      { prompt: 'Bonus! Where is Varn?', sentence: 'Varn is {_} of the boat.', tiles: ['in front', 'inside', 'on top'], answer: 'in front', hints: ['It breaks out of the ice right in front of them.', 'in front'] },
      { prompt: 'Bonus! Where does Varn’s voice speak?', sentence: 'It speaks {_} their heads.', tiles: ['inside', 'under', 'behind'], answer: 'inside', hints: ['Not out loud, but…', 'inside'] },
    ]));
    star(14);
  }
  hideStory(); finish(14);
}

// ================================================================ stop 15 — the angry wave
export async function stop15() {
  playMusic('danger');
  const I = buildIce(); const { leo, mia, toby: dog } = I.boat.cast; const V = I.varn; settled(I, 'rear'); V.state.anger = 1;
  I.gemLight.intensity = 30; I.gemGlow.scale.setScalar(3); mia.pose('hide'); frost(0.6, 1500);
  letterbox(true); cut([13, 4.2, 5], [0, 5, -7], 50); dolly([11, 4.8, 3], [0, 5.6, -7], 9000);
  // ---- cause and effect, in order
  await tell('Varn lifts a big, heavy tail to {smash} the ice.', { wait: false });
  await order({ prompt: 'What happens? Put it in order.', compact: true, items: ['Varn lifts his heavy tail.', 'The tail smashes the ice.', 'A huge wave rises.', 'The wave pushes the boat away.'], hints: ['First Varn lifts…', 'The wave comes after the smash.'] });
  // the tail lifts…
  letterbox(true); V.lookAt(null, 0, 600); V.to('tailUp', 2200); sfx('rumble');
  await flyCam([11, 4, 6], [4, 6.5, -7], 2000, { fov: 60 }); await wait(500);
  setCam([0.6, 3.6, 5.6], [0, 0.6, -5]);
  // ---- spell SMASH on the cracked ice (each letter cracks it more) — rotates on replays
  const sp = pickV(15, [
    { word: 'smash', decoys: 'tl', prompt: 'Tap the letters to spell the word. It means hit very hard and break.', hints: ['It ends with sh.', 'S – M – A – S – H'] },
    { word: 'crash', decoys: 'ot', prompt: 'Tap the letters to spell the sound word: CRASH!', hints: ['It ends with sh.', 'C – R – A – S – H'] },
    { word: 'tail', decoys: 'eho', prompt: 'Tap the letters to spell what Varn lifts.', hints: ['It has ai, like rain.', 'T – A – I – L'] },
  ]);
  I.chunks.forEach(m => m.visible = true);
  await spellOn({ prompt: sp.prompt, word: sp.word, decoys: sp.decoys, objs: I.chunks.slice(0, sp.word.length + sp.decoys.length), hints: sp.hints, onLetter: (c) => { sfx('crash'); quake(0.25, 0.1); c.rotation.z += 0.3; } });
  if (sp.word !== 'smash') toby('Great! Now… SMASH!');
  await filled('smash'); await earnCard('smash');
  // CRASH!
  tell('*CRASH!* The hard hit breaks the ice and makes a huge, angry {wave}. The water catches their small boat and pushes them away from the Ferris wheel.', { wait: false });
  letterbox(true); cut([10, 3, 7], [3, 1.8, -4], 56); await V.to('tailSmash', 420);
  sfx('crash'); sfx('rumble'); quake(2, 0.6); flash();
  shardBurst(I.w, new THREE.Vector3(5.2, 0.3, -2.4), { n: 40, power: 12 }); I.hole.scale.setScalar(3.4);
  I.chunks.forEach((m, i) => tween(900, e => { m.position.y = 0.2 + Math.sin(e * Math.PI) * (1 + i % 3); m.rotation.x += 0.05; }));
  sparkles(new THREE.Vector3(5, 1, -2.4), 0xE6F6FF, 80);
  const wave = makeWave(I.w); wave.visible = true; tween(1600, e => { wave.position.set(0, -7 + e * 5.6, -6 + e * 2.5); });
  dolly([7, 2.6, 9.5], [0, 2.2, -3], 5000);
  await chooseWord(pickV(15, [
    { prompt: 'Which word is spelled right?', sentence: 'a huge, angry {_}', tiles: ['wave', 'wav', 'waiv'], answer: 'wave', note: 'wave has a magic e at the end', hints: ['The e at the end is quiet.', 'w – a – v – e'] },
    { prompt: 'Which word fits?', sentence: 'a huge, angry {_}', tiles: ['wave', 'cave', 'save'], answer: 'wave', note: 'wave = a big moving hill of water', hints: ['It is made of water and it moves.', 'wave'] },
    { prompt: 'Which word fits?', sentence: 'a huge, angry {_}', tiles: ['wave', 'wove', 'wife'], answer: 'wave', note: 'wave = water that rises and rolls', hints: ['It pushes the boat.', 'w – a – v – e'] },
  ]));
  await filled('wave'); await earnCard('wave');
  // the wave pushes the boat away; the gem flies to Varn
  const B = I.boat.g; const z0 = B.position.z; letterbox(true);
  tween(3400, e => { B.position.z = z0 + e * 9; B.position.y = 0.12 + Math.sin(e * Math.PI) * 1.4; B.rotation.z = Math.sin(e * 9) * 0.15; wave.position.z = -3.5 + e * 9; wave.position.y = -1.4 - e * 2.5; });
  cut([5.5, 2.4, 15], [-0.5, 3, -2], 58); dolly([6, 3, 17], [-0.5, 4, -3], 7000);
  tell('Suddenly, Mia feels something moved in her hands. The blue gem flies up into the air and floats away to Varn! Mia, Leo, and Toby watched as their boat drifts away...', { wait: false });
  const gp = I.gem.getWorldPosition(new THREE.Vector3()); I.boat.cast.mia.g.remove(I.gem); I.w.add(I.gem); I.gem.position.copy(gp); mia.pose('reach'); sfx('glow');
  V.to('rear', 1400); I.gemGlow.scale.setScalar(2.2);
  await tween(2400, e => { const vh = V.headPos().add(new THREE.Vector3(0, 1.8, 1.2)); I.gem.position.lerpVectors(gp, vh, e); I.gem.position.y += Math.sin(e * Math.PI) * 4; I.gem.rotation.y += 0.1; });
  // he takes the gem and dives back into the deep (like the picture in the book)
  const hold = onTick(() => { I.gem.position.copy(V.headPos().add(new THREE.Vector3(0, 1.8, 0.8))); });
  [leo, mia].forEach(c => c.pose('scared'));
  V.lookAt(null, 0, 800); V.to('dive', 2600); await wait(2200); hold(); tween(1600, e => { I.gem.position.y -= e * 0.4; I.gemGlow.material.opacity = 1 - e; I.gem.scale.setScalar(Math.max(0.01, 1 - e)); });
  V.to('gone', 3000); sfx('crash'); fogThicken(scene, { near: 4, far: 22, ms: 4500 }); frost(0.3, 3000);
  await tapOn();
  // ---- the story is told in NOW words
  await chooseWord(pickV(15, [
    { prompt: 'This story uses NOW words. Pick the NOW word.', sentence: 'Varn {_} a big, heavy tail.', tiles: ['lifts', 'lifted'], answer: 'lifts', note: 'lifts = happening now · lifted = already happened', hints: ['NOW words often end in -s here.', 'lifts'] },
    { prompt: 'This story uses NOW words. Pick the NOW word.', sentence: 'The blue gem {_} up into the air.', tiles: ['flies', 'flew'], answer: 'flies', note: 'flies = now · flew = before', hints: ['flew already happened.', 'flies'] },
    { prompt: 'This story uses NOW words. Pick the NOW word.', sentence: 'Mia {_} something moved in her hands.', tiles: ['feels', 'felt'], answer: 'feels', note: 'feels = now · felt = before', hints: ['felt already happened.', 'feels'] },
  ]));
  if (await offerStretch('Find the sound word.')) {
    await think(pickV(15, [
      { prompt: 'Bonus! Which one is a SOUND word?', options: ['CRASH', 'ice', 'tail'], answer: 'CRASH', hints: ['Which one can you hear?'] },
      { prompt: 'Bonus! Which one is a SOUND word?', options: ['CRACK', 'boat', 'gem'], answer: 'CRACK', hints: ['Which one can you hear?'] },
      { prompt: 'Bonus! Which one is a SOUND word?', options: ['SPLASH', 'water', 'blue'], answer: 'SPLASH', hints: ['Which one can you hear?'] },
    ]));
    star(15);
  }
  hideStory(); letterbox(false); finish(15);
  const cont = h('div', { class: 'tbc' }, h('div', {}, 'To be continued…')); document.body.append(cont); await wait(2600); cont.remove();
}

// ================================================================ sum up the episode
export async function sumUp5() {
  playMusic('cave');
  const ov = h('div', { class: 'sumup' }, h('div', { class: 'sumup-title' }, 'Sum it up!'), h('div', { class: 'sumup-sub' }, 'Pass the challenge to finish Episode 5'));
  document.body.append(ov); await wait(600);
  await order({ prompt: 'Put what happened in order.', compact: true, items: ['Varn rose out of the ice.', 'Varn asked for his blue gem.', 'Mia hid the gem and said “We don’t have it!”', 'The gem started to shine.', 'Varn smashed the ice and took the gem.'], hints: ['What happened first?', 'Mia hid the gem before it shone.'] });
  await think({ prompt: 'Why was Varn so angry?', options: ['Mia lied and kept his gem', 'Toby barked too loudly', 'The boat was too small'], answer: 'Mia lied and kept his gem', hints: ['What did Mia say? Was it true?'] });
  await think({ prompt: 'What could Mia have done instead?', options: ['Told the truth and given the gem back', 'Hidden the gem better', 'Thrown the gem at Varn'], answer: 'Told the truth and given the gem back', hints: ['What would an honest friend do?'] });
  ov.remove(); S.ep5 = 1; save();
}

// debug: look at Varn in a pose from a camera (for checking the look)
export function debugVarn(pose = 'arch', cam = [1.8, 1.3, 7.5], tgt = [-1, 4.2, -10], fov = 60) {
  const I = buildIce(); settled(I, pose); cut(cam, tgt, fov); window.__I = I;
  if (tgt === 'head') setTimeout(() => { const hp = I.varn.headPos(); cut(cam, [hp.x, hp.y + 0.6, hp.z], fov); }, 300);
  if (tgt === 'headoff') setTimeout(() => { I.varn.lookAt(new THREE.Vector3(-0.3, 1.3, 0.1), 1, 10); setTimeout(() => { const hp = I.varn.headPos(); cut([hp.x + cam[0], hp.y + cam[1], hp.z + cam[2]], [hp.x, hp.y + 0.6, hp.z], fov); }, 200); }, 300);
  return I;
}
