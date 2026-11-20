// MARKET — math with 3-digit numbers (matching the teacher's Kahoot): numbers to 1000, column add/subtract
// with regrouping, word problems answered in sentences, length (m, cm) and mass (kg, g).
import { S, h, sfx, pip, mark, setQ, REPLAY, addBricks, giveCoins, burst, shake, cheer, tryAgain, wait } from '../core.js';
import { menu, playRound } from '../shell.js';
import { askChoice, askNumber, numpad } from '../widgets.js';
import { rnd, pick, shuffle, numWord3, numDistractors3, makeSum3, wordProblem3, UNIT_NAMES, LENGTH_UNITS, MASS_UNITS, RULER_THINGS, SCALE_THINGS } from '../mathgen.js';

const meter = k => [Math.min(8, S.bricks['m_' + k] || 0), 8, 'right'];
const brick = k => ok => { if (ok) addBricks('m_' + k); return ok; };

export default {
  id: 'market', title: 'Market — Math',
  bg: 'linear-gradient(#FFE3B8 0 55%, #E2B47E 55%)',
  enter(ui) {
    menu(ui, 'Math Market', [
      { name: 'Number Stall', desc: 'Big numbers', pic: '🔢', count: meter('num'), go: () => round(ui, 'num') },
      { name: 'Column Counter', desc: 'Add and take away', pic: '🧮', count: meter('add'), go: () => round(ui, 'add') },
      { name: 'Story Stall', desc: 'Word problems', pic: '🧺', count: meter('story'), go: () => round(ui, 'story') },
      { name: 'Ruler Stall', desc: 'Length: m and cm', pic: '📏', count: meter('len'), go: () => round(ui, 'len') },
      { name: 'Scale Stall', desc: 'Mass: kg and g', pic: '⚖️', count: meter('mass'), go: () => round(ui, 'mass') },
      { name: 'Puzzle Stall', desc: 'Missing numbers', pic: '🧩', color: '#FFE07A', count: meter('miss'), go: () => round(ui, 'miss') },
    ]);
    pip('Pick a stall!');
  },
};

const ROUNDS = { num: 10, add: 5, story: 6, len: 6, mass: 6, miss: 8 };
function round(ui, k) {
  playRound(ui, { n: ROUNDS[k], again: () => round(ui, k), ask: async (i, host) => brick(k)(await STALLS[k](host, i, 'm:' + k)) });
}
const big = t => `<b style="font-size:40px">${t}</b>`;

const STALLS = {
  // ------------------------------------------------ numbers to 1000 (the Kahoot's question types)
  num: (host, i, id) => {
    const t = ['w2n', 'pv', 'pattern', 'more', 'cmp', 'n2w', 'pv', 'more', 'order', 'w2n'][i % 10];
    const n = rnd(101, 989);
    if (t === 'w2n') return askChoice(host, { prompt: `Which number is ${big(numWord3(n))}?`, options: [n, ...numDistractors3(n)], answer: n, id, hint: 'Hundreds, tens, ones.' });
    if (t === 'n2w') return askChoice(host, { prompt: `How do you write ${big(n)} in words?`, options: [n, ...numDistractors3(n, 2)].map(numWord3), answer: numWord3(n), id, long: true });
    if (t === 'pv') { const d = String(n).split(''); const pos = rnd(0, 2); const lab = ['hundreds', 'tens', 'ones']; const parts = d.map((x, k) => k === pos ? `_ ${lab[k]}` : `${x} ${lab[k]}`).join(' ');
      return askChoice(host, { prompt: `${big(n)} = ${parts}`, options: [...new Set([+d[pos], ...shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9].filter(x => x !== +d[pos])).slice(0, 3)])], answer: +d[pos], id, hint: 'H T O: hundreds, tens, ones.' }); }
    if (t === 'pattern') { const step = pick([1, 10, 100, 1, 10]); const start = rnd(100, 999 - step * 5); const seq = [start, start + step, start + 2 * step]; const ans = [3, 4, 5].map(k => start + k * step).join(', ');
      const wrong = [[3, 4, 5].map(k => start + 2 * step + k).join(', '), [3, 4, 5].map(k => start + k * (step === 100 ? 10 : step * 10)).join(', '), [1, 2, 3].map(k => start + 2 * step + k * step + 1).join(', ')];
      return askChoice(host, { prompt: `What comes next?<br>${big(seq.join(', ') + ', ___, ___, ___')}`, options: [ans, ...new Set(wrong.filter(w => w !== ans))].slice(0, 4), answer: ans, id, long: true, hint: 'Up by 1? 10? 100?' }); }
    if (t === 'more') { const by = pick([1, 10, 100]); const more = Math.random() < 0.5; const m = more ? rnd(100, 999 - by) : rnd(100 + by, 999); const ans = more ? m + by : m - by;
      return askChoice(host, { prompt: `What number is ${big(by + ' ' + (more ? 'more' : 'less') + ' than ' + m)}?`, options: [ans, ...numDistractors3(ans)], answer: ans, id, hint: by === 1 ? 'Change the ones.' : by === 10 ? 'Change the tens.' : 'Change the hundreds.' }); }
    if (t === 'cmp') { let m = pick([String(n).split('').reverse().join(''), n + pick([-10, 10, -1, 1, 90, -90])]); m = Math.min(999, Math.max(100, +m)); if (m === n) m = n + 1;
      return askChoice(host, { prompt: big(`${n} ___ ${m}`), options: ['>', '<'], answer: n > m ? '>' : '<', id, hint: 'Look at the hundreds first.' }); }
    const greatest = Math.random() < 0.5; const set = shuffle([...new Set([n, ...numDistractors3(n, 3)])]).slice(0, 4); const sorted = [...set].sort((a, b) => greatest ? b - a : a - b);
    return askChoice(host, { prompt: `Put in order. Begin with the <b>${greatest ? 'GREATEST' : 'SMALLEST'}</b>.<br>${big(set.join(', '))}`, options: [sorted.join(', '), [...sorted].reverse().join(', '), shuffle(sorted).join(', ')].filter((v, k, a) => a.indexOf(v) === k), answer: sorted.join(', '), id, long: true });
  },
  // ------------------------------------------------ column add / subtract
  add: (host, i, id) => columns(host, makeSum3(['addR', 'subR', 'sub0', 'addR', 'subR'][i % 5]), id),
  // ------------------------------------------------ word problems in the teacher's sentence style
  story: (host, i, id) => storyTask(host, wordProblem3(), id),
  // ------------------------------------------------ length
  len: (host, i, id) => [() => ruler(host, id, i % 2 === 1), () => unitWord(host, 'len', id), () => unitChoice(host, LENGTH_UNITS, ['cm', 'm'], id), () => unitMeaning(host, ['m', 'cm'], id)][i % 4](),
  // ------------------------------------------------ mass
  mass: (host, i, id) => [() => unitWord(host, 'mass', id), () => unitChoice(host, MASS_UNITS, ['g', 'kg'], id), () => unitWord(host, 'mass', id), () => unitMeaning(host, ['g', 'kg'], id)][i % 4](),
  // ------------------------------------------------ missing numbers
  miss: (host, i, id) => {
    const q = makeSum3(pick(['add', 'addR', 'sub', 'subR'])); const hideA = Math.random() < 0.5; const ans = hideA ? q.a : q.b;
    const shown = q.op === '+' ? (hideA ? `___ + ${q.b} = ${q.ans}` : `${q.a} + ___ = ${q.ans}`) : (hideA ? `___ − ${q.b} = ${q.ans}` : `${q.a} − ___ = ${q.ans}`);
    const tip = q.op === '+' ? `Take away to find it: ${q.ans} − ${hideA ? q.b : q.a}.` : hideA ? `Add to find it: ${q.ans} + ${q.b}.` : `Take away to find it: ${q.a} − ${q.ans}.`;
    return askNumber(host, { prompt: `What is the missing number?<br>${big(shown)}`, answer: ans, id, hint: tip, maxLen: 3 });
  },
};

function unitChoice(host, list, opts, id) {
  const [t, a] = pick(list);
  return askChoice(host, { prompt: t.replace('___', '_____'), options: opts, answer: a, id, hint: a === 'cm' || a === 'm' ? 'small = cm, long = m' : 'light = g, heavy = kg' });
}
function unitMeaning(host, units, id) {
  const u = pick(units); return askChoice(host, { prompt: `${big(u)} stands for…`, options: Object.values(UNIT_NAMES), answer: UNIT_NAMES[u], id });
}

// ------------------------------------------------ column calculator (H T O), one column at a time
REPLAY.mcol = (host, d) => columns(host, d.q, d.id);
REPLAY.mstory = (host, d) => storyTask(host, d.p, d.id);
function columns(host, q, id) {
  setQ('mcol', { q, id }, `${q.a} ${q.op} ${q.b} = ?`);
  return new Promise(async res => {
    let first = true; const miss = v => { if (first) mark(id, false, true, v); first = false; };
    const A = String(q.a).padStart(3, ' ').split(''), B = String(q.b).padStart(3, ' ').split('');
    const head = h('div', { class: 'col-row head' }, h('span'), ...['H', 'T', 'O'].map(x => h('span', {}, x)));
    const marks = h('div', { class: 'col-row marks' }, h('span'), h('span'), h('span'), h('span'));
    const rowA = h('div', { class: 'col-row' }, h('span'), ...A.map(d => h('span', {}, d.trim())));
    const rowB = h('div', { class: 'col-row' }, h('span', {}, q.op), ...B.map(d => h('span', {}, d.trim())));
    const ans = h('div', { class: 'col-row ans' }, h('span'), ...[0, 1, 2].map(() => h('span', { class: 'digit' })));
    const board = h('div', { class: 'colboard' }, head, marks, rowA, rowB, h('div', { class: 'line' }), ans);
    const talk = h('div', { class: 'prompt' }); const work = h('div', { class: 'col-work' });
    host.append(h('div', { class: 'prompt' }, big(`${q.a} ${q.op} ${q.b}`)), board, talk, work);
    const say2 = t => talk.innerHTML = t;
    const askDigit = (text, answer, col) => new Promise(r => { if (window.__TEST) window.__ans = answer; work.innerHTML = ''; say2(text); [...ans.children].forEach((c, k) => c.classList.toggle('active', k === col + 1));
      let val = ''; const box = h('div', { class: 'answer-box' }, '?'); work.append(box, numpad(k => {
        if (k === 'back') val = ''; else if (k === 'enter') { if (val === '') return; if (+val === answer) { sfx('good'); ans.children[col + 1].textContent = val; ans.children[col + 1].classList.remove('active'); r(); return; } sfx('bad'); shake(box); miss(val); pip(tryAgain()); val = ''; }
        else val = k; box.textContent = val || '?'; })); });
    const yesNo = (text, want) => new Promise(r => { if (window.__TEST) window.__ans = null; work.innerHTML = ''; say2(text); const row = h('div', { class: 'choices' });
      for (const [lbl, v] of [['Yes', true], ['No, I need to regroup', false]]) row.append(h('button', { class: 'choice', onclick: e => { if (v === want) { sfx('good'); if (window.__TEST) window.__yn = null; r(); } else { sfx('bad'); shake(e.currentTarget); miss(lbl); pip(want ? 'Yes! Just take away.' : 'Too small! Regroup first.'); } } }, lbl));
      if (window.__TEST) window.__yn = want ? 0 : 1; work.append(row); });
    const setMark = (col, t) => { marks.children[col + 1].innerHTML = t; };
    const COL = ['hundreds', 'tens', 'ones'];
    if (q.op === '+') {
      let carry = 0; const a = String(q.a).padStart(3, '0').split('').map(Number), b = String(q.b).padStart(3, '0').split('').map(Number);
      for (let c = 2; c >= 0; c--) {
        const s = a[c] + b[c] + carry; const expr = `${carry ? carry + ' + ' : ''}${a[c]} + ${b[c]}`;
        if (c === 0 && s >= 10) { await askDigit(`Add the hundreds: ${expr} = ?`, s, -1); break; }
        await askDigit(`Add the ${COL[c]}: ${expr} = ${s >= 10 ? s + '. What do you write in the ' + COL[c] + ' place?' : '?'}`, s % 10, c);
        carry = s >= 10 ? 1 : 0; if (carry && c > 0) { setMark(c - 1, '<i class="carry1">1</i>'); sfx('pop'); }
        if (c === 0) break;
      }
    } else {
      const top = String(q.a).padStart(3, '0').split('').map(Number), b = String(q.b).padStart(3, '0').split('').map(Number);
      for (let c = 2; c >= 0; c--) {
        if (c === 0 && top[0] - b[0] === 0) { ans.children[1].textContent = ''; break; }
        const need = top[c] < b[c];
        if (b[c] > 0 || need) await yesNo(`${COL[c][0].toUpperCase() + COL[c].slice(1)}: can you take ${b[c]} from ${top[c]}?`, !need);
        if (need) {
          let k = c - 1; while (top[k] === 0) k--;            // borrow across zeros
          top[k]--; setMark(k, `<i class="carry1">${top[k]}</i>`); rowA.children[k + 1].classList.add('crossed');
          for (let m = k + 1; m < c; m++) { top[m] = 9; setMark(m, `<i class="carry1">9</i>`); rowA.children[m + 1].classList.add('crossed'); }
          top[c] += 10; setMark(c, `<i class="carry1">${top[c]}</i>`); rowA.children[c + 1].classList.add('crossed'); sfx('build');
          say2(`Regroup! Now the ${COL[c]} have ${top[c]}.`); await wait(1300);
        }
        await askDigit(`Take away the ${COL[c]}: ${top[c]} − ${b[c]} = ?`, top[c] - b[c], c);
      }
    }
    work.innerHTML = ''; sfx('great'); burst(board, cheer()); say2(`${q.a} ${q.op} ${q.b} = <b>${q.ans}</b>`);
    mark(id, true, first); if (first) giveCoins(3, board); await wait(1800); res(first);
  });
}

// ------------------------------------------------ word problem: Understand, Plan, Answer
function storyTask(host, p, id) {
  setQ('mstory', { p, id }, p.text);
  return new Promise(res => {
    let val = '', first = true, done = false; if (window.__TEST) window.__ans = p.ans;
    const sent = h('div', { class: 'sentence-card' }); const draw = () => sent.innerHTML = p.sent.replace('___', `<span class="gap ${val ? 'filled' : ''}">${val || ''}</span>`);
    draw();
    host.append(h('div', { class: 'story-card' }, h('div', { class: 'upa' }, h('b', {}, 'Understand'), ' · ', h('b', {}, 'Plan'), ' · ', h('b', {}, 'Answer')), h('div', { class: 'story-text' }, p.text)), sent,
      numpad(async k => {
        if (done) return;
        if (k === 'back') val = val.slice(0, -1); else if (k === 'enter') { if (!val) return;
          if (+val === p.ans) { done = true; sfx('good'); burst(sent, cheer()); mark(id, true, first); if (first) giveCoins(2, sent); await wait(1400); res(first); return; }
          sfx('bad'); shake(sent); if (first) mark(id, false, true, val); first = false; pip(`Plan: ${p.plan} = ?`); val = ''; }
        else if (val.length < 3) val += k;
        draw();
      }, { enterLabel: 'Done' }));
  });
}

// ------------------------------------------------ ruler
function ruler(host, id, offset) {
  const thing = pick(RULER_THINGS), len = rnd(3, 14), start = offset ? rnd(1, 4) : 0, MAX = 20;
  const r = h('div', { class: 'ruler' });
  for (let i = 0; i <= MAX; i++) { r.append(h('i', { style: { left: (i / MAX * 100) + '%', height: i % 5 === 0 ? '30px' : '18px' } })); r.append(h('b', { style: { left: (i / MAX * 100) + '%' } }, String(i))); }
  const bar = h('div', { class: 'thing', style: { left: (start / MAX * 100) + '%', width: (len / MAX * 100) + '%', background: thing.color } });
  const wrap = h('div', { class: 'ruler-wrap' }, bar, r);
  const tip = offset ? `It starts at ${start}, not at 0! Count from ${start} to ${start + len}.` : 'Start at 0 and look where the end is.';
  return askNumber(host, { prompt: `How long is the ${thing.name}?`, answer: len, id, extra: wrap, unit: 'cm', hint: tip, maxLen: 2 });
}


// ------------------------------------------------ length / mass word problems (like the teacher's Kahoot)
const LEN_T = [['ribbon', 'cm'], ['string', 'cm'], ['rope', 'm'], ['road', 'm'], ['fence', 'm'], ['stick', 'cm']];
const MASS_T = [['box', 'kg'], ['bag of rice', 'kg'], ['watermelon', 'kg'], ['pumpkin', 'kg'], ['bag of sand', 'kg'], ['packet of sugar', 'g']];
function unitWord(host, kind, id) {
  const [thing, u] = pick(kind === 'len' ? LEN_T : MASS_T); const add = Math.random() < 0.5;
  const a = rnd(20, 95), b = rnd(5, a - 5); const ans = add ? a + b : a - b;
  const L = kind === 'len' ? ' long' : '';
  const text = add ? `A ${thing} is ${a} ${u}${L}. Another ${thing} is ${b} ${u}${L}. How much in all?`
    : `A ${thing} is ${a} ${u}. ${pick(['Sam', 'Mia', 'Dad', 'Grandma'])} ${kind === 'len' ? 'cuts off' : 'takes out'} ${b} ${u}. How much is left?`;
  const other = { cm: 'm', m: 'cm', kg: 'g', g: 'kg' }[u];
  const opts = [`${ans} ${u}`, `${ans} ${other}`, `${add ? a - b : a + b} ${u}`, `${ans + 10} ${u}`];
  return askChoice(host, { prompt: text, options: [...new Set(opts)], answer: `${ans} ${u}`, id, hint: add ? 'Add them!' : 'Take away!' });
}
