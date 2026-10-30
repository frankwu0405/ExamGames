// Episode 5 — Guard of the Stones. Stops 13–15. Told in the present tense, like Frank's text.
import { S, save, sfx, wait, h, shuffle } from './core.js';
import { THREE, setCam, flyCam, followCam, stopFollow, quake, tween, moveTo, onTick, sparkles, textTexture } from './gfx.js';
import { buildIce } from './sets5.js';
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
async function varnRises(I, quick = false) {
  const V = I.varn; V.g.visible = true; V.state.swim = 1;
  I.front.forEach(m => tween(500, e => { m.scale.z = Math.max(0.001, e); })); I.hole.scale.setScalar(1);
  sfx('crash'); sfx('rumble'); quake(1.6, 0.3);
  await tween(quick ? 300 : 1700, e => { V.g.position.y = -9 + e * 10.8; V.g.rotation.x = -0.75 + e * 0.37; V.eyeLight.intensity = e * 14; });   // he towers, head raised
  I.chunks.forEach(m => { m.visible = true; m.position.y = 0.2; }); I.shade.material.opacity = 0;
  V.state.swim = 0.3;
}

// ================================================================ stop 13 — Varn rises
export async function stop13() {
  playMusic('cave');
  const I = buildIce(); const { leo, mia, toby: dog } = I.boat.cast;
  setCam([5.5, 4.2, 7], [0, 0.4, -3]);
  // something circles under the ice
  let circling = true; const off = onTick(t => { if (!circling) return; const a = t * 0.9; I.shade.position.set(Math.cos(a) * 6.5, 0.0, -2 + Math.sin(a) * 6.5); I.shade.rotation.z = -a; I.shade.material.opacity = 0.55; });
  [leo, mia].forEach(c => c.pose('scared')); dog.pose('bark');
  tell('The thick ice cracks loudly. *CRACK!* A giant, scary beast rises from the dark water!', { wait: false });
  sfx('crash'); quake(0.5, 0.1); await wait(2500); await tapOn();
  await flyCam([3, 6, 9], [0, 0, -2], 1000);
  await tell('It swims quickly in circles around their little boat, keeping its huge body hidden under the water.');
  // it breaks out of the ice
  circling = false; off(); playMusic('danger');
  tell('Then, it breaks out of the ice right in front of them! Toby barks. Mia is scared.', { wait: false });
  await flyCam([3.4, 2.6, 6], [0, 2.6, -8], 900);
  await varnRises(I); sfx('bark'); dog.pose('bark');
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
  // ---- the voice
  tell('A cold, deep {voice} speaks right inside their heads: “I am Varn, guard of the deep stones! Give me back my blue gem!”', { wait: false });
  I.varn.state.anger = 1; sfx('rumble');
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
  const I = buildIce(); const { leo, mia, toby: dog } = I.boat.cast; await varnRises(I, true); I.varn.state.anger = 1;
  setCam([3.6, 2.8, 5], [0, 1.6, -6]);
  mia.pose('scared'); leo.pose('scared');
  tell('Mia is very scared, but she is also brave. She wants to keep the gem. They worked so hard in the dark cave to find this beautiful treasure!', { wait: false });
  await wait(1500); await tapOn();
  // ---- feelings: tap the words that fit Mia right now
  const fv = pickV(14, [
    { prompt: 'Tap the TWO words that tell how Mia feels.', yes: ['scared', 'brave'], no: ['sleepy', 'bored', 'silly'], hints: ['Read again: Mia is very scared, but she is also brave.', 'scared and brave'] },
    { prompt: 'Tap the TWO words that tell what Mia wants.', yes: ['keep the gem', 'not give it away'], no: ['go to sleep', 'eat lunch', 'fly away'], hints: ['Read again: She wants to keep the gem.', 'She does not want to give it away.'] },
    { prompt: 'Tap the TWO words that tell about the gem.', yes: ['beautiful', 'treasure'], no: ['ugly', 'tiny bug', 'muddy'], hints: ['Read again: this beautiful treasure!', 'beautiful treasure'] },
  ]);
  const items = labels(I.w, shuffle([...fv.yes.map(w => ({ w, ok: true })), ...fv.no.map(w => ({ w, ok: false }))]), new THREE.Vector3(0, 0, -5), 6, 2.6);
  await tapAll({ prompt: fv.prompt, items, hints: fv.hints, onRight: it => it.obj.scale.setScalar(1.15) });
  items.forEach(it => it.obj.visible = false);
  // she hides the gem behind her back
  await flyCam([-2.2, 1.9, 2.2], [0.2, 1.1, -0.2], 1000);
  tell('Mia is not ready to give it away to a scary sea monster. She has to think fast, so she hides her hands behind her back. “We don’t have it!” she yells at the water. “We are just lost kids!” Toby barks again.', { wait: false });
  mia.pose('hold'); sfx('bark'); dog.pose('bark');
  await wait(1800); await tapOn();
  // ---- is she telling the truth?
  await think(pickV(14, [
    { prompt: 'Is Mia telling the truth?', options: ['No. The gem is behind her back.', 'Yes. They lost it in the cave.', 'Yes. Toby has it.'], answer: 'No. The gem is behind her back.', hints: ['Where are Mia’s hands? What is in them?'] },
    { prompt: 'Why does Mia hide her hands?', options: ['To hide the gem from Varn', 'Her hands are cold', 'To wave at Leo'], answer: 'To hide the gem from Varn', hints: ['What does Varn want?'] },
    { prompt: '“We don’t have it!” Is that true?', options: ['No, it is not true', 'Yes, it is true'], answer: 'No, it is not true', hints: ['Look behind Mia’s back.'] },
  ]));
  // the gem glows; Varn is not fooled
  await flyCam([3.6, 2.8, 5], [0, 2, -7], 900);
  tell('You cannot trick an old magic beast. Varn stops swimming and looks right at Mia with its giant, glowing eyes. The air turns freezing cold. Suddenly, the blue gem behind Mia’s back starts to shine. It glows so brightly that a strong blue light shines all around her!', { wait: false });
  sfx('glow'); await tween(1600, e => { I.gemLight.intensity = e * 40; I.varn.eyeLight.intensity = 14 + e * 10; });
  await tapOn();
  // ---- the lie
  tell('Varn is very angry. Its voice yells in their heads: “You {lie}! You are greedy and bad, just like the greedy men on the island long ago!”', { wait: false });
  sfx('rumble'); quake(1.2, 0.2); I.varn.state.swim = 1;
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
  const I = buildIce(); const { leo, mia, toby: dog } = I.boat.cast; await varnRises(I, true); I.varn.state.anger = 1; I.gemLight.intensity = 40; mia.pose('hold');
  setCam([7, 4, 8], [0, 1.5, -6]);
  // ---- cause and effect, in order
  await tell('Varn lifts a big, heavy tail to {smash} the ice.', { wait: false });
  await order({ prompt: 'What happens? Put it in order.', compact: true, items: ['Varn lifts his heavy tail.', 'The tail smashes the ice.', 'A huge wave rises.', 'The wave pushes the boat away.'], hints: ['First Varn lifts…', 'The wave comes after the smash.'] });
  // the tail lifts…
  await flyCam([9, 5, 6], [0, 3, -9], 900);
  await tween(1200, e => { I.varn.state.lift = e; }); await wait(300);
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
  await tween(260, e => { I.varn.state.lift = 1 - e * 1.6; }); sfx('crash'); sfx('rumble'); quake(1.6, 0.45);
  I.chunks.forEach((m, i) => tween(900, e => { m.position.y = 0.2 + Math.sin(e * Math.PI) * (1 + i % 3); m.rotation.x += 0.05; }));
  sparkles(new THREE.Vector3(0, 1, -6), 0xE6F6FF, 60);
  await chooseWord(pickV(15, [
    { prompt: 'Which word is spelled right?', sentence: 'a huge, angry {_}', tiles: ['wave', 'wav', 'waiv'], answer: 'wave', note: 'wave has a magic e at the end', hints: ['The e at the end is quiet.', 'w – a – v – e'] },
    { prompt: 'Which word fits?', sentence: 'a huge, angry {_}', tiles: ['wave', 'cave', 'save'], answer: 'wave', note: 'wave = a big moving hill of water', hints: ['It is made of water and it moves.', 'wave'] },
    { prompt: 'Which word fits?', sentence: 'a huge, angry {_}', tiles: ['wave', 'wove', 'wife'], answer: 'wave', note: 'wave = water that rises and rolls', hints: ['It pushes the boat.', 'w – a – v – e'] },
  ]));
  await filled('wave'); await earnCard('wave');
  // the wave pushes the boat away; the gem flies to Varn
  const B = I.boat.g; const z0 = B.position.z;
  tween(2600, e => { B.position.z = z0 + e * 9; B.position.y = 0.12 + Math.sin(e * Math.PI) * 1.4; B.rotation.z = Math.sin(e * 9) * 0.15; });
  await flyCam([6, 4, 16], [0, 1, 2], 1600);
  tell('Suddenly, Mia feels something moved in her hands. The blue gem flies up into the air and floats away to Varn! Mia, Leo, and Toby watched as their boat drifts away...', { wait: false });
  const gp = I.gem.getWorldPosition(new THREE.Vector3()); I.boat.cast.mia.g.remove(I.gem); I.w.add(I.gem); I.gem.position.copy(gp); mia.pose('reach'); sfx('glow');
  const vh = I.varn.head.getWorldPosition(new THREE.Vector3());
  await tween(2400, e => { I.gem.position.lerpVectors(gp, vh.clone().add(new THREE.Vector3(0, 1.4, 1.6)), e); I.gem.position.y += Math.sin(e * Math.PI) * 3; I.gem.rotation.y += 0.1; });
  [leo, mia].forEach(c => c.pose('scared'));
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
  hideStory(); finish(15);
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
