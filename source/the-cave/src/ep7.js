// Episode 7 — Out of the Fog. Stops 19–21, in Frank's present-tense text, staged from the page-7 panels and the four covers.
// One sea for the whole episode: the gray beach behind, the fog (dark sea stacks looming), the giant rock on the beam's line,
// then the clear blue water with the fog standing behind them — and a crystal fin cutting a long trail after them.
// New here: voice answers (voice.js). The mic opens only inside those tasks, with all sound held while it listens.
import { S, save, sfx, wait, h, shuffle } from './core.js';
import { THREE, setCam, flyCam, followCam, stopFollow, tween, onTick, sparkles, cut, dolly, quake, scene, camera } from './gfx.js';
import { buildFogSea, ROCK, FOG_END, BEAM_TO } from './sets7.js';
import { letterbox, glowSprite } from './effects.js';
import { tell, beat, seq, tapOn, filled, hideStory, hideTask, chooseWord, pick3D, order, think, offerStretch, earnCard, steer, task, toby as tobyTip, MODE } from './ui.js';
import { speakIt, sayAnswer, chant } from './voice.js';
import { playMusic } from './music.js';

const star = n => { S.stars[n] = 1; save(); sfx('great'); };
const visits = n => (S.stops[n] && S.stops[n].visits) || 0;
const finish = n => { const v = visits(n) + 1; S.stops[n] = Object.assign(S.stops[n] || {}, { done: 1, t: Date.now(), visits: v }); if (MODE.captain && MODE.perfect) { S.captain = S.captain || {}; S.captain[n] = 1; } save(); };
const pickV = (n, pool) => pool[visits(n) % pool.length];
const fadeIn = (col = '#C4CBD0', ms = 1400) => { const v = h('div', { class: 'veil', style: { background: col } }); document.body.append(v); setTimeout(() => { v.classList.add('out'); setTimeout(() => v.remove(), ms); }, 200); };

// ---- the boat on its route: d = distance along the route; it glides toward dMax at speed sp (and bobs on the swell)
function sailing(G, d0 = 0) {
  const { B, route: R, RL } = G; const st = { d: d0, sp: 0, dMax: d0, roll: 0, yawOff: 0, bob: 1 };
  const pp = new THREE.Vector3(), tg = new THREE.Vector3();
  const place = t => { const u = Math.min(1, st.d / RL); R.getPointAt(u, pp); R.getTangentAt(u, tg);
    B.g.position.set(pp.x, 0.15 + Math.sin(t * 1.6) * 0.06 * st.bob, pp.z); B.g.rotation.set(Math.sin(t * 1.3) * 0.04 * st.bob, Math.atan2(tg.x, tg.z) + st.yawOff, Math.sin(t * 1.7) * 0.05 * st.bob + st.roll); G.W.at.copy(pp); };
  onTick((t, dt) => { st.d = Math.min(st.dMax, st.d + st.sp * dt); place(t); }); place(0);
  st.pp = pp; st.tg = tg;
  st.to = async (to, speed = 2.4) => { st.dMax = to; st.sp = speed; while (st.d < to - 0.05) await wait(50); };
  st.go = (to, speed = 2.4) => { st.dMax = to; st.sp = speed; };
  return st;
}
// the kids row: arms pull, paddles dip, a splash now and then on each side
function rowing(G, who = ['leo', 'mia']) {
  const cs = who.map(n => G.k[n]); cs.forEach(c => { c.pose('row'); c.g.position.y = 0.2; }); who.forEach(n => { G.paddles[n].visible = true; }); let last = 0;
  const off = onTick(t => { if (t - last > 0.75) { last = t; sfx('splash'); } });
  return () => { off(); cs.forEach(c => c.pose('sit')); who.forEach(n => { G.paddles[n].visible = false; }); };
}
// seated in the boat: legs folded, sitting low on the cart's floor
const seat = c => { c.pose('sit'); c.g.position.y = 0.2; };   // (cart floor at 0.4, rim at about 1.0: a seated child shows from the chest up)
const standUp = c => { c.pose('idle'); c.g.position.y = 0.45; };
// a camera that rides with the boat: back / side / up from the boat, looking ahead
function ride(st, { back = 8, side = 4, up = 3.2, ahead = 6, across = 0, y = 0.9, snap = true } = {}) {
  const cam = new THREE.Vector3(), look = new THREE.Vector3(), { pp, tg } = st;
  const f = () => { cam.copy(pp).addScaledVector(tg, -back).add(new THREE.Vector3(-tg.z * side, up, tg.x * side)); look.copy(pp).addScaledVector(tg, ahead).add(new THREE.Vector3(-tg.z * across, 0, tg.x * across)).setY(y); return [cam, look]; };
  if (snap) { f(); setCam(cam.toArray(), look.toArray()); } followCam(f);   // (snap: start right there, no swoop through the boat)
}
// a fixed shot placed relative to the boat (boat-local offsets: x right, y up, z forward)
const boatShot = (G, [x, y, z], [lx, ly, lz], fov = 46) => { const B = G.B.g; B.updateMatrixWorld(true); const p = B.localToWorld(new THREE.Vector3(x, y, z)), l = B.localToWorld(new THREE.Vector3(lx, ly, lz)); cut(p.toArray(), l.toArray(), fov); return [p, l]; };
const boatDolly = (G, [x, y, z], [lx, ly, lz], ms = 6000) => { const B = G.B.g; B.updateMatrixWorld(true); const p = B.localToWorld(new THREE.Vector3(x, y, z)), l = B.localToWorld(new THREE.Vector3(lx, ly, lz)); dolly(p.toArray(), l.toArray(), ms); };
const boatFly = (G, [x, y, z], [lx, ly, lz], ms = 1400) => { const B = G.B.g; B.updateMatrixWorld(true); const p = B.localToWorld(new THREE.Vector3(x, y, z)), l = B.localToWorld(new THREE.Vector3(lx, ly, lz)); return flyCam(p.toArray(), l.toArray(), ms); };
// the gem's place: in Leo's hand (held up), or set on the boat's front rim so they can both row
function gemTo(G, where) {
  const { gem, k, B } = G; gem.visible = true; if (G._gemOff) G._gemOff();
  if (where === 'bow') { B.g.add(gem); gem.position.set(0, 1.05, 0.95); G._gemOff = null; return; }
  G.w.add(gem); const hand = new THREE.Vector3(); G._gemOff = onTick(() => { k.leo.AR.updateMatrixWorld(true); k.leo.AR.localToWorld(hand.set(0, -0.5, 0.08)); gem.position.copy(hand); });
}
// Mia, sad: drooping face, head down, a tear running down her cheek now and then (undo() lifts her face again)
function sadMia(G) { const m = G.k.mia; m.forceFace = 'sad'; m.head.rotation.x = 0.32;
  const tear = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), new THREE.MeshBasicMaterial({ color: 0x9FDFFF })); tear.scale.y = 1.5; m.head.add(tear);
  const off = onTick(t => { const k2 = (t * 0.45) % 1; tear.position.set(-0.13, 0.02 - k2 * 0.2, 0.33); tear.visible = k2 < 0.8; });
  return () => { off(); m.head.remove(tear); m.forceFace = null; m.head.rotation.x = 0; }; }
function startWorld(G) { const { k } = G; seat(k.mia); seat(k.leo); k.toby.pose('sit'); k.mia.holding = false; }

// ================================================================ stop 19 — into the fog
export async function stop19() {
  playMusic('cave');
  const G = buildFogSea(), { k, B } = G, { leo, mia, toby: dog } = k; window.__ep7 = G; startWorld(G);
  const st = sailing(G, 0);
  // they push off from the gray beach: seen from the sand behind them, rowing away into the white
  const stopRow = rowing(G); st.go(24, 1.7);
  cut([1.6, 2.2, 15], [0, 0.8, 2], 44); fadeIn();
  dolly([1.2, 2.4, 13], [0, 0.6, -6], 9000);
  await beat('They push their small boat away from the gray beach and row deep into the thick, white fog.', { min: 5200 });
  // the panel: Leo standing, a hand over his eyes; Mia hugging her knees; Toby beside her; fog everywhere
  // high and wide, out to the side: nothing but gray all round them
  await wait(2600); boatShot(G, [8, 4.2, 4], [0, 0.8, -4], 46); boatDolly(G, [7, 3.4, 6], [0, 0.8, -2], 7000);
  await beat('It hides the sky and the water in front of them.', { min: 3600 });
  stopRow(); standUp(leo); leo.pose('shade'); st.go(st.d + 4, 0.6);
  // Mia stops rowing: shoulders down, her paddle across her lap, a sad face
  G.paddles.mia.visible = true; mia.pose('sit'); mia.forceFace = 'sad'; mia.head.rotation.x = 0.25;
  // the panel: from in front, a little to the right — Leo standing with a hand over his eyes, Mia hugging her knees, Toby behind her
  boatShot(G, [3.0, 1.9, 4.2], [0, 1.25, 0], 40); boatDolly(G, [2.6, 1.8, 3.6], [0, 1.2, 0], 8000);
  playMusic('cave'); await beat('The air feels heavy and cold, and the whole world is quiet.', { min: 4200 });
  // Mia: “We are very lost,” and the paddle drops into the boat with a clatter
  G.paddles.mia.visible = true; await boatFly(G, [2.2, 1.8, 1.4], [0.3, 1.1, -0.15], 1000);
  mia.holding = false; mia.pose('sit'); const pm = G.paddles.mia; await tween(500, e => { pm.rotation.x = e * 1.2; pm.position.y = -0.44 - e * 0.2; }); pm.visible = false; sfx('clack');
  await beat('“We are very lost,” Mia says sadly, dropping her paddle into the boat.');
  // she hugs her knees, head down; a tear runs down her cheek (the panel), and Leo turns to look at her
  mia.holding = true; const unSad = sadMia(G); leo.pose('idle'); leo.g.rotation.y = 0.5; sfx('whine');
  // ---- VOICE: read Mia's “sorry” the way she would say it
  boatShot(G, [1.7, 1.75, 1.3], [0.3, 1.2, -0.15], 36);
  tell('“I am so sorry, Leo. If I did not lie to Varn, we would be safe at home right now.”', { wait: false });
  // the whole of what she says, read aloud, every word (Mia's own sad words)
  await speakIt({ prompt: 'Mia is very sad. Read all of her words out loud, slowly and gently, the way Mia would say them.', line: 'I am so sorry, Leo. If I did not lie to Varn, we would be safe at home right now.', key: ['sorry', 'lie', 'safe'], hints: ['Start with “I am so sorry…”', 'Read the gray words again.'] });
  // no choices shown: she says why
  const why = pickV(19, [
    { prompt: 'Why does Mia say sorry? Say your answer.', fb: { prompt: 'Why does Mia say sorry?', options: ['She lied to Varn.', 'She lost her paddle.', 'She is cold.'], answer: 'She lied to Varn.', hints: ['Read her words again: “If I did not…”'] } },
    { prompt: 'Whose fault does Mia think it is? Say who, and why.', fb: { prompt: 'Mia thinks they are lost because…', options: ['she lied to Varn.', 'Toby ran away.', 'Leo broke the boat.'], answer: 'she lied to Varn.', hints: ['What did Mia do in Episode 5?'] } },
  ]);
  await sayAnswer({ prompt: why.prompt, accept: ['lie', 'lied', 'lying', 'lies', 'liar', 'not the truth', 'not true', 'tricked', 'trick'], word: 'sorry',
    hints: ['Think about what Mia did to Varn in Episode 5.', 'She did not tell Varn the truth. She told a…'], fallback: () => think(why.fb) });
  // ---- the pocket starts to glow
  sfx('glow'); G.pocketLight.intensity = 0; const glowOn = tween(2400, e => { G.pocketGlow.scale.setScalar(0.01 + e * 0.6); G.pocketGlow.material.opacity = e * 0.9; G.pocketLight.intensity = e * 2.2; });
  unSad(); mia.holding = false; mia.pose('wow'); standUp(leo); leo.g.rotation.y = 0; boatShot(G, [-2.5, 1.75, 2.9], [-0.25, 1.2, 0.25], 40); leo.pose('wow');
  tell('As soon as she says she is sorry, a bright, warm light begins to shine from the {pocket} on Leo’s shorts.', { wait: false }); await glowOn;
  onTick(t => { G.pocketGlow.material.opacity = 0.8 + Math.sin(t * 4) * 0.15; });
  await pick3D({ prompt: 'Something is glowing! Tap where the light is coming from.', answer: 'pocket', targets: [{ id: 'pocket', obj: G.pocketHit }, { id: 'mia', obj: (() => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.45, 8, 6), new THREE.MeshBasicMaterial({ visible: false })); m.position.y = 0.8; mia.g.add(m); return m; })() }, { id: 'toby', obj: (() => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 6), new THREE.MeshBasicMaterial({ visible: false })); m.position.y = 0.4; dog.g.add(m); return m; })() }],
    hints: ['Look at Leo’s shorts.', 'It is on Leo, low down by his hand.'], onWrong: () => tobyTip('Not there! Look at Leo’s shorts.') });
  // say the missing word (nothing to pick from), then spell it from four close spellings
  await sayAnswer({ prompt: 'Say the missing word out loud!', sub: 'A light shines from the ______ on Leo’s shorts.', accept: ['pocket', 'pockets'], word: 'pocket',
    hints: ['It is part of his shorts. You keep things in it.', 'It starts with p… po…'], fallback: () => chooseWord({ prompt: 'Which word fits?', sentence: 'The light shines from the {_} on Leo’s shorts.', tiles: ['pocket', 'packet', 'rocket', 'locket'], answer: 'pocket', note: 'pocket = a little bag sewn into your clothes', hints: ['It is part of his shorts.', 'You keep things in it.'] }) });
  await chooseWord(pickV(19, [
    { prompt: 'Now, which spelling is right?', sentence: 'The light shines from the {_} on Leo’s shorts.', tiles: ['pocket', 'poket', 'pockit', 'pokket'], answer: 'pocket', note: 'pocket: short o, then ck — like rocket and socket', hints: ['After a short o, we write ck.', 'p – o – c – k – e – t'] },
    { prompt: 'Now, which spelling is right?', sentence: 'The light shines from the {_} on Leo’s shorts.', tiles: ['pocket', 'pocet', 'pokcet', 'pockett'], answer: 'pocket', note: 'pocket — ck after a short vowel', hints: ['c and k together.', 'p… o… ck… et'] },
  ]));
  await filled('pocket'); await earnCard('pocket');
  if (await offerStretch('More words with ck.')) {
    await chooseWord(pickV(19, [
      { prompt: 'Bonus! Which word is spelled right?', sentence: 'The {_} flew up to the moon.', tiles: ['rocket', 'roket', 'rokcet'], answer: 'rocket', note: 'rocket · pocket · socket · locket', hints: ['Like pocket, with ck.'] },
      { prompt: 'Bonus! Which word is spelled right?', sentence: 'Mia wears a pink {_}.', tiles: ['jacket', 'jaket', 'jackit'], answer: 'jacket', note: 'jacket · packet · bucket', hints: ['Short a, then ck.'] },
    ]));
    star(19);
  }
  hideStory(); finish(19);
}

// ================================================================ stop 20 — the blue beam
export async function stop20() {
  playMusic('cave');
  const G = buildFogSea(), { k, B } = G, { leo, mia, toby: dog } = k; window.__ep7 = G; startWorld(G);
  const st = sailing(G, G.dAt(-24)); st.bob = 0.7; mia.holding = true;
  G.pocketGlow.scale.setScalar(0.6); G.pocketGlow.material.opacity = 0.85; G.pocketLight.intensity = 2.2;
  standUp(leo); leo.g.rotation.y = 0.5; leo.pose('wow');
  boatShot(G, [-2.5, 1.75, 2.9], [-0.25, 1.2, 0.25], 40); fadeIn();
  await beat('Leo looks down in big surprise.');
  // he reaches into the pocket… and pulls out a tiny shard of the blue gem
  leo.pose('idle'); await tween(700, e => { leo.AR.rotation.x = -0.2 * e; });
  await beat('He reaches deep inside and pulls his hand out.');
  leo.pose('point'); gemTo(G, 'hand'); G.gemLight.intensity = 1.1; G.pocketGlow.material.opacity = 0; G.pocketLight.intensity = 0; sfx('chime');
  boatShot(G, [0.9, 1.9, 2.6], [-0.1, 1.35, 0.1], 38); mia.holding = false; mia.pose('wow');
  await beat('“Mia, look at this!” he cries.');
  { const gp = new THREE.Vector3(); G.gem.getWorldPosition(gp); sparkles(gp, 0x9FEFFF); }
  await beat('It is a tiny, piece of the blue gem!');
  tell('“It must have fallen in when I was finding you in the water,” he says.', { wait: false });
  // said, not picked: where does Leo THINK it came from?
  const wq = pickV(20, [
    { prompt: 'Where does Leo THINK the gem came from? Say it.', fb: { prompt: 'Where does Leo THINK the gem came from?', options: ['It fell into his pocket in the water.', 'Varn gave it to him.', 'He found it in the fog.'], answer: 'It fell into his pocket in the water.', hints: ['Read what Leo says: “It must have…”'] } },
    { prompt: 'When does Leo think the gem fell into his pocket? Say it.', fb: { prompt: 'Leo thinks the gem fell into his pocket when…', options: ['he was finding Mia in the water.', 'he was eating soup.', 'he was asleep on the beach.'], answer: 'he was finding Mia in the water.', hints: ['Read Leo’s words again.'] } },
  ]);
  await sayAnswer({ prompt: wq.prompt, accept: ['water', 'sea', 'ocean', 'finding mia', 'finding you', 'swimming', 'wave'], hints: ['Read Leo’s words again: “It must have fallen in when…”', 'He was finding Mia in the…'], fallback: () => think(wq.fb) });
  tobyTip('Hmm… is Leo right? Keep it in mind!');
  await beat('It has a bright, warm glow.');
  // the beam: straight out of the little stone into the dark fog (the panel's side shot)
  G.beam.visible = true; G.BM.on = 0; sfx('beam'); quake(0.4, 0.04);
  { const B2 = B.g; B2.updateMatrixWorld(true); const p = B2.localToWorld(new THREE.Vector3(5.5, 2.2, -1.5)), l = B2.localToWorld(new THREE.Vector3(-0.4, 1.4, 4)); cut(p.toArray(), l.toArray(), 50); }
  tween(900, e => { G.BM.on = e; }); leo.pose('point'); mia.pose('wow'); dog.pose('bark'); sfx('bark');
  tell('Suddenly, the little stone shoots a straight, glowing {beam} of blue light right into the dark fog.', { wait: false });
  await wait(1200); dog.pose('sit');
  await sayAnswer({ prompt: 'What is a long, straight line of light called? Say the missing word!', sub: 'The stone shoots a straight, glowing ______ of blue light.', accept: ['beam', 'beams'], word: 'beam',
    hints: ['A flashlight makes one. It rhymes with dream.', 'It starts with b… be…'], fallback: () => chooseWord({ prompt: 'Which word fits?', sentence: 'The stone shoots a straight, glowing {_} of blue light.', tiles: ['beam', 'bean', 'bead', 'bear'], answer: 'beam', note: 'beam = a long, straight line of light', hints: ['A line of light.', 'It ends with m.'] }) });
  await chooseWord(pickV(20, [
    { prompt: 'Now, which spelling is right?', sentence: 'The stone shoots a straight, glowing {_} of blue light.', tiles: ['beam', 'beem', 'bem', 'beme'], answer: 'beam', note: 'beam: ea says “ee”, like sea and dream', hints: ['ea, like in sea.', 'b – e – a – m'] },
    { prompt: 'Now, which spelling is right?', sentence: 'The stone shoots a straight, glowing {_} of blue light.', tiles: ['beam', 'beim', 'biem', 'beeam'], answer: 'beam', note: 'beam · dream · team · cream — all ea', hints: ['Like dream: e and a.', 'b – e – a – m'] },
  ]));
  await filled('beam'); await earnCard('beam');
  // “It is telling us where to go!” — then the shout that sends them off
  mia.pose('cheer'); boatShot(G, [1.2, 1.4, 2.6], [0.2, 1.1, 0], 42);
  tell('“It is telling us where to go!” says Mia with a big smile.', { wait: false });
  await speakIt({ prompt: 'Read Mia’s happy words out loud, with a big smile!', line: 'It is telling us where to go! Follow that blue light!', key: ['telling', 'follow', 'light'], hints: ['Start with “It is telling…”', 'Read the gray words again.'] });
  // off they go: the gem set on the bow, both kids rowing, the camera chasing along the beam
  mia.pose('sit'); seat(leo); leo.g.rotation.y = 0; gemTo(G, 'bow'); const stopRow = rowing(G); sfx('whoosh');
  ride(st, { back: 9, side: 3.4, up: 3.4, ahead: 8, across: -0.6 }); st.go(st.d + 22, 3.2);
  await beat('“Follow that blue light!”', { min: 3000 });
  // the fog pushes them off the line: which way back to the light?
  const side = visits(20) % 2 ? 'right' : 'left'; st.yawOff = 0; await tween(1600, e => { st.yawOff = (side === 'left' ? -1 : 1) * 0.45 * e; });
  stopFollow(); boatShot(G, [0, 3.2, -6.5], [0, 0.6, 6], 52);
  await steer({ prompt: 'The fog pushed the boat off the blue line! Which way to the light?', clue: 'Look at the blue beam. Is it to the left or the right of the boat?', answer: side, hints: ['Find the thin blue line.', 'Turn the boat toward the light.'] });
  await tween(1200, e => { st.yawOff = (side === 'left' ? -1 : 1) * 0.45 * (1 - e); }); sfx('good');
  ride(st, { back: 9, side: 3.4, up: 3.4, ahead: 8, across: -0.6 }); await st.to(st.d + 8, 3.2); stopRow();
  if (await offerStretch('More words with ea.')) {
    await chooseWord(pickV(20, [
      { prompt: 'Bonus! Which word has ea, like beam?', sentence: 'They row across the {_}.', tiles: ['sea', 'see', 'sae'], answer: 'sea', note: 'beam · sea · team · dream', hints: ['The ocean is the…', 's – e – a'] },
      { prompt: 'Bonus! Which word has ea, like beam?', sentence: 'Leo had a strange {_}.', tiles: ['dream', 'dreem', 'drem'], answer: 'dream', note: 'beam · dream · cream', hints: ['ea says “ee”.'] },
    ]));
    star(20);
  }
  hideStory(); finish(20);
}

// ================================================================ stop 21 — the sharp rock, and out of the fog
export async function stop21() {
  playMusic('danger');
  const G = buildFogSea(), { k, B } = G, { leo, mia, toby: dog } = k; window.__ep7 = G; startWorld(G);
  const st = sailing(G, G.dAt(-36)); gemTo(G, 'bow'); G.beam.visible = true; G.BM.on = 1;
  let stopRow = rowing(G); ride(st, { back: 9, side: 3.4, up: 3.4, ahead: 8, across: -0.6 }); fadeIn(); st.go(G.dAt(-44), 3.4);
  await beat('They row fast along the bright blue line.');
  await beat('But the thick fog is tricky and hides many hidden dangers in the sea.');
  // listen…: a soft sound of moving water
  stopRow(); st.go(st.d + 3, 0.8); playMusic('cave'); sfx('lap');
  boatShot(G, [1.4, 1.3, -1.6], [0.2, 1.0, 3], 46); mia.pose('idle'); leo.pose('idle');
  tell('Suddenly, they hear a soft sound of moving water.', { wait: false });
  await think(pickV(21, [
    { prompt: 'Listen! 🔊 What do they hear?', options: ['Water moving', 'A bird singing', 'A loud drum'], answer: 'Water moving', hints: ['It is soft and splashy.', 'Read the line again.'] },
    { prompt: 'The sound is soft. Which word means soft?', options: ['quiet', 'loud', 'fast'], answer: 'quiet', hints: ['A soft sound is not loud.'] },
  ]));
  // the dark shape grows in the mist, dead ahead: the beam runs straight into it
  st.go(G.dAt(ROCK.z + 15), 1.0); boatShot(G, [0.6, 2.0, -5], [0, 4, 14], 46);
  dolly(...(() => { const p = B.g.localToWorld(new THREE.Vector3(0.3, 1.8, -3.5)), l = B.g.localToWorld(new THREE.Vector3(0, 5, 14)); return [p.toArray(), l.toArray()]; })(), 7000);
  await beat('They can slowly see a huge, dark shape coming right in front of them in the mist.', { min: 4600 });
  await sayAnswer({ prompt: 'Look hard into the mist. What is the huge, dark shape? Say what you see!', accept: ['rock', 'rocks', 'stone', 'cliff', 'boulder'], hints: ['Look where the blue light ends. It is hard and gray-black.', 'It is a giant, sharp…'],
    fallback: () => pick3D({ prompt: 'What is the huge, dark shape? Tap it!', answer: 'rock', targets: [{ id: 'rock', obj: G.rockHit }], hints: ['Look where the blue light ends.', 'It is big and dark, right in front.'] }) });
  playMusic('danger'); quake(0.6, 0.05);
  await beat('It is a giant, sharp rock!');
  // the panel's two scared faces
  boatShot(G, [0.3, 1.85, 2.6], [0, 1.3, 0], 38); mia.pose('scared'); leo.pose('scared'); dog.pose('bark'); sfx('bark');
  tell('“Look out!” yells Mia. “Row harder!” Leo shouts.', { wait: false });
  await speakIt({ prompt: 'Quick! Shout it with them, every word:', line: 'Look out! Row harder!', mode: 'shout', need: ['look', 'out', 'row', 'harder'], hints: ['Say: Look out! Row harder!'] });
  // HARD TURN: Leo digs his paddle in, the boat swings round, and they scrape past the stone
  mia.pose('scared'); dog.pose('sit'); const stopLeo = rowing(G, ['leo']);
  // seen from the left, riding along: the boat swings hard right and the black rock slides past, close enough to touch
  ride(st, { back: 4, side: 7.5, up: 2.8, ahead: 3, across: -2.5, y: 1.6 });   // (from the open-water side, the rock beyond the boat)
  tell('He uses his {paddle} to turn the boat as fast as he can.', { wait: false });
  // PADDLE! PADDLE! — every time she says “paddle”, Leo takes a stroke and the boat swings further round the rock
  const d0 = st.d, d1 = G.dAt(ROCK.z - 9), N = 8; let scraped = false;
  const lean = onTick(t => { st.roll = Math.sin(t * 3) * 0.04 + 0.12; if (!scraped && st.d > G.dAt(ROCK.z + 1)) { scraped = true; sfx('scrape'); quake(1.0, 0.09); G.BM.blocked = false; } });
  await chant({ prompt: 'Help Leo turn the boat! Say “paddle!” again and again — each time, he takes a stroke!', word: 'paddle', count: N, onBeat: n => { st.go(d0 + (d1 - d0) * n / N, 4.6); sfx('splash'); } });
  while (st.d < d1 - 0.1) await wait(50); lean(); st.roll = 0; st.sp = 1.0;
  stopLeo(); G.paddles.leo.visible = true; leo.pose('row');   // (he still has the paddle in his hands for the question)
  stopFollow(); boatShot(G, [-2.4, 1.9, 2.4], [-0.25, 1.0, 0.1], 42);
  await pick3D({ prompt: 'What did Leo use to turn the boat? Tap it!', answer: 'paddle', targets: [{ id: 'paddle', obj: (() => { const m = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.6, 0.5), new THREE.MeshBasicMaterial({ visible: false })); m.position.y = -0.6; G.paddles.leo.add(m); return m; })() }, { id: 'flag', obj: (() => { const m = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.1, 0.3), new THREE.MeshBasicMaterial({ visible: false })); m.position.set(0.78, 2.9, -0.2); B.g.add(m); return m; })() }, { id: 'gem', obj: (() => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 6), new THREE.MeshBasicMaterial({ visible: false })); G.gem.add(m); return m; })() }],
    hints: ['He pushes it in the water.', 'It is long and wooden, in his hands.'], onWrong: id => tobyTip(id === 'flag' ? 'The flag catches wind, but Leo used something in his hands!' : 'The gem shows the way. What did he push the water with?') });
  await chooseWord(pickV(21, [
    { prompt: 'Which spelling is right?', sentence: 'He uses his {_} to turn the boat.', tiles: ['paddle', 'padle', 'paddel', 'padel'], answer: 'paddle', note: 'paddle: dd, then -le — like puddle and middle', hints: ['Two d’s.', 'It ends in -le.'] },
    { prompt: 'Which spelling is right?', sentence: 'He uses his {_} to turn the boat.', tiles: ['paddle', 'paddul', 'padall', 'paddal'], answer: 'paddle', note: 'paddle = a short oar — dd + le', hints: ['The end sound “ul” is spelled -le.', 'p – a – dd – le'] },
  ]));
  await filled('paddle'); await earnCard('paddle');
  leo.pose('sit'); G.paddles.leo.visible = false;
  // looking back: the rock behind them, the little boat safely past it
  ride(st, { back: -8, side: 3, up: 2.6, ahead: -14, across: 2, y: 2.5 });
  await beat('They brush past the hard stone, missing a huge crash just in time.', { min: 3800 });
  // ---- the fog finally clears: out into sunshine and calm, flat water (and the gray wall left behind them)
  stopRow = rowing(G); ride(st, { back: 9, side: 4, up: 3.2, ahead: 9, across: 0 }); st.go(G.dAt(FOG_END - 22), 4.2);
  playMusic('wonder');
  const fz0 = Math.min(st.pp.z - 2, FOG_END + 16), fz1 = FOG_END - 2; let clearing = 0;
  const wx = onTick(() => { const z = st.pp.z, e = Math.max(0, Math.min(1, (fz0 - z) / (fz0 - fz1))); if (e > clearing) { clearing = e; G.weather(e); } });
  await beat('The fog finally clears away.', { min: 3000 });
  while (clearing < 0.98) await wait(60); wx(); G.weather(1); stopRow(); st.go(st.d + 6, 1.0); st.bob = 0.6;
  G.BM.on = 0.6; boatShot(G, [2.2, 1.6, 5.6], [0, 1.2, -2], 46);   // (the panel: from the front, the fog wall behind them)
  await beat('They sail out into the bright sunshine and calm, flat water.', { min: 3200 });
  standUp(leo); standUp(mia); leo.pose('cheer'); mia.pose('cheer'); dog.pose('wag'); sfx('great');
  await beat('Mia and Leo cheer loudly, and Toby wags his little tail.');
  await beat('They are finally safe again.', { hold: 600 });
  // ---- but just then: something dark under the water, behind them… a crystal fin, and a long trail
  playMusic('cave'); leo.pose('idle'); mia.pose('idle'); dog.pose('sit'); [leo, mia, dog].forEach(c => { c.g.rotation.y = Math.PI; });   // (they turn round to look behind the boat)
  const finP = new THREE.Vector3(); const F = G.fin; F.visible = true; G.trail.visible = true; let fk = 0;
  const finGo = onTick((t, dt) => { fk += dt; const bp = st.pp, tg = st.tg; const back = 16 - Math.min(6, fk * 0.4); finP.copy(bp).addScaledVector(tg, -back).add(new THREE.Vector3(-tg.z * (2.5 + Math.sin(fk * 0.7) * 1.5), 0, tg.x * (2.5 + Math.sin(fk * 0.7) * 1.5)));
    F.position.set(finP.x, Math.min(0.15, -1.6 + fk * 0.45), finP.z); F.rotation.y = Math.atan2(tg.x, tg.z) + Math.cos(fk * 0.7) * 0.25; G.trailHit.position.copy(finP).addScaledVector(tg, -7); G.trailHit.rotation.y = F.rotation.y; });
  st.go(st.d + 40, 1.4);
  // over the kids' shoulders, looking back: the dark shape coming up in the water behind the boat
  ride(st, { back: -2.4, side: -1.0, up: 2.0, ahead: -13, across: 2.5, y: 0.2 }); camera.fov = 44; camera.updateProjectionMatrix();
  await beat('But just then, something dark moves under the water right behind them.', { min: 3800 });
  // from low on the water behind the fin, looking up its long trail to the little boat
  ride(st, { back: 24, side: 6.5, up: 1.4, ahead: 0, across: 2, y: 1.0 });
  tell('A sharp and shiny fin quietly cuts through the sea, leaving a long {trail} in the water.', { wait: false });
  await wait(2400);
  await pick3D({ prompt: 'Tap the long trail the fin leaves in the water.', answer: 'trail', targets: [{ id: 'trail', obj: G.trailHit }, { id: 'fin', obj: G.finHit }],
    hints: ['Not the fin itself — the white line behind it.', 'Look for the long white line on the water.'], onWrong: () => tobyTip('That is the fin! The trail is the white line it leaves behind.') });
  await sayAnswer({ prompt: 'What do we call the long line it leaves behind? Say the missing word!', sub: 'The fin leaves a long ______ in the water.', accept: ['trail', 'trails'], word: 'trail',
    hints: ['A snail leaves one too! It rhymes with snail.', 'It starts with tr… tra…'], fallback: () => chooseWord({ prompt: 'Which word fits?', sentence: 'The fin leaves a long {_} in the water.', tiles: ['trail', 'tail', 'train', 'trial'], answer: 'trail', note: 'trail = a line left behind by something moving', hints: ['It is the line left behind.', 't – r – ai – l'] }) });
  await chooseWord(pickV(21, [
    { prompt: 'Which spelling is right?', sentence: 'The fin leaves a long {_} in the water.', tiles: ['trail', 'trale', 'trayl', 'treil'], answer: 'trail', note: 'trail: ai says “ay”, like rain and sail', hints: ['ai, like in rain.'] },
    { prompt: 'Which spelling is right?', sentence: 'The fin leaves a long {_} in the water.', tiles: ['trail', 'trial', 'traal', 'trael'], answer: 'trail', note: 'trail — a, then i, in the middle', hints: ['Like rain and snail.'] },
  ]));
  await filled('trail'); await earnCard('trail');
  // ---- someone they know…: what does she think? (any guess is a good guess)
  // their faces, looking back at it (seen from the fin's side of the boat, just behind it)
  stopFollow(); boatShot(G, [-1.9, 1.75, -2.6], [0, 1.3, 0.1], 40); leo.pose('scared'); mia.pose('wow'); dog.pose('bark'); sfx('bark');
  tell('Someone they know is following them again...', { wait: false });
  const guess = () => new Promise(res => { const opts = ['Varn', 'The old man', 'A shark']; let done = false;
    const row = h('div', { class: 'think' }, ...opts.map(o => h('button', { class: 'idea', onclick: async e => { if (done) return; done = true; e.target.classList.add('right'); sfx('good');
      tobyTip(o === 'Varn' ? 'A crystal fin… Varn has crystal fins! We will find out in Episode 8.' : 'Maybe! But look — the fin is made of crystal… We will find out in Episode 8.'); await wait(2600); hideTask(); res({}); } }, o)));
    window.__solve = () => row.children[0].click(); task('Who do YOU think it is? Look at the shiny fin!', row); });
  // her own guess, said out loud (any guess is a good guess; Toby answers it)
  await sayAnswer({ prompt: 'Who do YOU think is following them? Say your guess!', any: true, accept: [], fallback: guess,
    reply: said => said.some(w => /varn|vern|barn/.test(w)) ? 'Varn! He has crystal fins… We will find out in Episode 8!' : said.some(w => /man|jack/.test(w)) ? 'The old man? Hmm… but that fin is made of crystal! We will find out in Episode 8.' : 'Maybe! But look — the fin is made of crystal… We will find out in Episode 8.' });
  finGo();
  // pull back and up from behind the fin: the trail, the boat, the open sea
  ride(st, { back: 30, side: 7, up: 6.5, ahead: 6, across: 1, y: 0.5 });
  await beat('To be continued…', { min: 3200 });
  hideStory(); finish(21);
}

export async function sumUp7() {
  playMusic('cave');
  const ov = h('div', { class: 'sumup' }, h('div', { class: 'sumup-title' }, 'Sum it up!'), h('div', { class: 'sumup-sub' }, 'Pass the challenge to finish Episode 7'));
  document.body.append(ov); await wait(600);
  await order({ prompt: 'Put what happened in order.', compact: true, items: ['They row into the thick fog.', 'Mia says sorry to Leo.', 'Leo finds the gem in his pocket.', 'A blue beam shows the way.', 'They turn just in time to miss a rock.', 'A shiny fin follows them.'], hints: ['What happened first?', 'The pocket glows after Mia says sorry.'] });
  await think({ prompt: 'What made the gem start to glow?', options: ['Mia said sorry.', 'The sun came out.', 'Toby barked.'], answer: 'Mia said sorry.', hints: ['“As soon as she says she is sorry…”'] });
  await think({ prompt: 'How did the gem help them?', options: ['Its beam showed them the way.', 'It kept them warm.', 'It fixed the boat.'], answer: 'Its beam showed them the way.', hints: ['“It is telling us where to go!”'] });
  ov.remove(); S.ep7 = 1; save();
}
