// SCIENCE LAB — Light and Shadows & Heat (from the teacher's Science Kahoot slides). Reading + pictures.
import { S, h, sfx, pip, mark, setQ, REPLAY, addBricks, giveCoins, burst, shake, cheer, wait, picHTML } from '../core.js';
import { menu, playRound } from '../shell.js';
import { askChoice } from '../widgets.js';
import { shuffle, pick } from '../mathgen.js';

const LIGHT = ['s_sun', 's_bulb', 's_candle', 's_fire', 's_torch', 's_traffic', 's_lamp'];
const NOLIGHT = ['v_yarn', 'v_snack', 'bring', 'rose', 'v_own', 'v_house'];
const HOT = ['s_sun', 's_fire', 'hot', 's_candle'], COLD = ['s_ice', 's_snowman', 's_polar', 's_icecream', 's_cold'];
const CHANGES = [['s_melt', 'ice cream', 'shape'], ['s_ice', 'ice cube', 'shape'], ['s_toast', 'bread', 'colour'], ['s_marsh', 'marshmallow', 'colour'], ['s_egg', 'egg', 'colour'], ['s_iron', 'shirt', 'texture'], ['s_candle', 'candle', 'size']];
const SENT = [
  ['_____ helps us to see.', 'Light', ['Shadow', 'Dark']],
  ['We see things when light enters our _____.', 'eyes', ['face', 'shadow']],
  ['When light cannot enter our eyes, we cannot _____.', 'see', ['hear', 'eat']],
  ['A shadow is made when something _____ the light.', 'blocks', ['makes', 'eats']],
  ['The light from the sun cannot _____ through you.', 'shine', ['shadow', 'see']],
  ['When you block the light from the sun, your _____ is formed.', 'shadow', ['light', 'eye']],
  ['Heat is the warmth we feel from the sun, fire, or our _____.', 'bodies', ['shadows', 'ice']],
];
const TF = [['Rubbing two rocks together makes heat.', 'True'], ['Fire gives off heat.', 'True'], ['When it is cold, you rub your hands together.', 'True'], ['Ice cream gives off heat.', 'False'], ['A shadow is a dark shape.', 'True'], ['Light can shine through your body.', 'False'], ['Rubbing and burning give off heat.', 'True']];
const SHADOW_Q = [
  ['A shadow is made when something _____ the light.', 'blocks', ['makes', 'eats']],
  ['A shadow is a dark _____.', 'shape', ['light', 'sound']],
  ['When you block the light from the sun, your _____ is formed.', 'shadow', ['light', 'eye']],
  ['The light from the sun cannot _____ through you.', 'shine', ['shadow', 'see']],
  ['A shadow is dark.', 'True'], ['Light can shine through your body.', 'False'], ['Your shadow is on the side away from the light.', 'True'],
];
const done = ok => { if (ok) addBricks('science'); return ok; };

export default {
  id: 'science', title: 'Science Lab — Light & Heat',
  bg: 'linear-gradient(#E4F4FF 0 60%, #9FC7E0 60% 62%, #C8E3F0 62%)',
  enter(ui) {
    menu(ui, 'Science Lab', [
      { name: 'Light Lab', desc: 'Light', pic: '💡', go: () => round(ui, 'light') },
      { name: 'Shadow Lab', desc: 'Shadows', pic: '🔦', go: () => shadowLab(ui) },
      { name: 'Heat Lab', desc: 'Hot and cold', pic: '🔥', go: () => round(ui, 'heat') },
      { name: 'Science quiz', desc: 'Everything', pic: '🔬', color: '#FFE07A', go: () => round(ui, 'mix') },
    ]);
  },
};
function round(ui, kind) {
  playRound(ui, { n: 8, again: () => round(ui, kind), ask: async (i, host) => {
    const t = kind === 'light' ? pick(['src', 'sent', 'sent', 'tf']) : kind === 'heat' ? pick(['hot', 'change', 'change', 'tf']) : pick(['src', 'sent', 'hot', 'change', 'tf']);
    let q;
    if (t === 'src') { const yes = Math.random() < 0.6; const k = pick(yes ? LIGHT : NOLIGHT); q = { prompt: `${picHTML(k, 150)}<br>Does it give off light?`, options: ['Yes', 'No'], answer: yes ? 'Yes' : 'No', id: 'sci:src:' + k }; }
    else if (t === 'sent') { const s = pick(SENT); q = { prompt: s[0], options: shuffle([s[1], ...s[2]]), answer: s[1], id: 'sci:sent:' + s[1] }; }
    else if (t === 'hot') { const hot = Math.random() < 0.5; const k = pick(hot ? HOT : COLD); q = { prompt: `${picHTML(k, 150)}<br>Is it hot or cold?`, options: ['hot', 'cold'], answer: hot ? 'hot' : 'cold', id: 'sci:hot:' + k }; }
    else if (t === 'change') { const c = pick(CHANGES); q = { prompt: `${picHTML(c[0], 150)}<br>Heat changes the _____ of the ${c[1]}.`, options: ['shape', 'colour', 'size', 'texture'], answer: c[2], id: 'sci:chg:' + c[1] }; }
    else { const f = pick(TF); q = { prompt: f[0], options: ['True', 'False'], answer: f[1], id: 'sci:tf:' + f[0].slice(0, 20) }; }
    return done(await askChoice(host, Object.assign({ hint: 'Look again!' }, q)));
  } });
}

// ---------------------------------------------------------------- Shadow Lab: a flashlight, a tree, and its shadow
const TREE = '<svg viewBox="0 0 80 120" width="80" height="120"><rect x="34" y="70" width="12" height="46" rx="3" fill="#8A5A3B" stroke="#2E2A4F" stroke-width="3"/><circle cx="40" cy="44" r="32" fill="#3E9B5C" stroke="#2E2A4F" stroke-width="3"/><circle cx="28" cy="36" r="8" fill="#5DBA6B"/></svg>';
const TORCH = '<svg viewBox="0 0 60 60" width="60" height="60"><circle cx="30" cy="30" r="16" fill="#FFE07A" stroke="#2E2A4F" stroke-width="3"/><g stroke="#F2B62B" stroke-width="4" stroke-linecap="round"><path d="M30 4v6M30 50v6M4 30h6M50 30h6M11 11l4 4M45 45l4 4M49 11l-4 4M11 49l4-4"/></g></svg>';
function shadowScene() {
  const shadow = h('div', { class: 'sh-shadow' }), light = h('div', { class: 'sh-light', html: TORCH }), beam = h('div', { class: 'sh-beam' });
  const el = h('div', { class: 'sh-scene' }, h('div', { class: 'sh-ground' }), shadow, h('div', { class: 'sh-tree', html: TREE }), beam, light);
  const set = (x, showShadow = true) => { // x from -1 (far left) to 1 (far right)
    light.style.left = `calc(50% + ${x * 42}% - 30px)`; light.style.top = `${18 + (1 - Math.abs(x)) * -10 + Math.abs(x) * 70}px`;
    const len = 30 + Math.abs(x) * 190; shadow.style.width = len + 'px'; shadow.style.left = x > 0 ? `calc(50% - ${len}px)` : '50%';
    shadow.style.opacity = showShadow ? (Math.abs(x) < 0.15 ? 0.35 : 0.75) : 0;
    beam.style.left = `calc(50% + ${x * 42}%)`; beam.style.transform = `rotate(${x * -55}deg)`; };
  return { el, set };
}
function shadowLab(ui) {
  playRound(ui, { n: 6, again: () => shadowLab(ui), ask: async (i, host) => {
    if (i % 2 === 0) return whereShadow(host);
    const q = pick(SHADOW_Q); return done(await askChoice(host, { prompt: q[0], options: q[0].includes('_') ? shuffle([q[1], ...q[2]]) : ['True', 'False'], answer: q[1], id: 'sci:shq:' + q[0].slice(0, 18), hint: 'Look again!' }));
  } });
}
REPLAY.shadow = (host, d) => whereShadow(host, d.x);
function whereShadow(host, x0) {
  return new Promise(res => {
    const x = x0 ?? (Math.random() < 0.5 ? -0.8 : 0.8); setQ('shadow', { x }, `Light on the ${x < 0 ? 'left' : 'right'}. Where is the shadow?`); const sc = shadowScene(); sc.set(x, false); let first = true;
    const ans = x < 0 ? 'right' : 'left'; const row = h('div', { class: 'choices' });
    for (const o of ['left', 'right']) { const b = h('button', { class: 'choice' }, `on the ${o}`); b.onclick = async () => {
      if (row.dataset.done) return;
      if (o === ans) { row.dataset.done = 1; b.classList.add('right'); sc.set(x, true); sfx('good'); burst(b, cheer()); mark('sci:shadow:where', true, first); if (first) { giveCoins(1, b); addBricks('science'); } pip('The shadow is on the other side!'); await wait(1600); res(first); }
      else { b.classList.add('wrong'); sfx('bad'); shake(b); if (first) mark('sci:shadow:where', false, true, o); first = false; pip('Look away from the light.'); }
    }; if (window.__TEST && o === ans) window.__solve = () => { b.click(); window.__solve = null; }; row.append(b); }
    host.append(h('div', { class: 'prompt' }, `Light on the ${x < 0 ? 'LEFT' : 'RIGHT'}. Where is the shadow?`), sc.el, row);
  });
}
