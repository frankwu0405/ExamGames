// Math generators — Numbers to 100, addition & subtraction within 100,
// metric length (m, cm) and mass (kg, g). All numbers stay within 100.
export const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
export const pick = arr => arr[Math.floor(Math.random() * arr.length)];
export const shuffle = arr => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

const ONES = ['zero','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen'];
const TENS = ['','','twenty','thirty','forty','fifty','sixty','seventy','eighty','ninety'];
export function numWord(n) {
  if (n === 100) return 'one hundred';
  if (n < 20) return ONES[n];
  const t = Math.floor(n / 10), o = n % 10;
  return TENS[t] + (o ? '-' + ONES[o] : '');
}
export const ORD = ['1st','2nd','3rd','4th','5th','6th','7th'];
export const ORD_WORD = ['first','second','third','fourth','fifth','sixth','seventh'];

// Distractors for a two-digit number: swapped digits, ±1, ±10
export function numDistractors(n, count = 2) {
  const t = Math.floor(n / 10), o = n % 10, out = new Set();
  const c = [o * 10 + t, n + 1, n - 1, n + 10, n - 10, t * 10 + ((o + 2) % 10)];
  for (const x of shuffle(c)) { if (x !== n && x > 0 && x < 100) out.add(x); if (out.size >= count) break; }
  return [...out];
}

// Two-digit addition/subtraction, with or without regrouping
export function makeSum(kind) {
  for (let g = 0; g < 200; g++) {
    const a = rnd(11, 89), b = rnd(5, 89);
    if (kind === 'add' || kind === 'addR') {
      const s = a + b; if (s > 99) continue;
      const regroup = (a % 10) + (b % 10) >= 10;
      if ((kind === 'addR') !== regroup) continue;
      return { op: '+', a, b, ans: s, regroup };
    } else {
      const [x, y] = a > b ? [a, b] : [b, a]; if (x - y < 1 || y < 10) continue;
      const regroup = (x % 10) < (y % 10);
      if ((kind === 'subR') !== regroup) continue;
      return { op: '−', a: x, b: y, ans: x - y, regroup };
    }
  }
  return { op: '+', a: 23, b: 45, ans: 68, regroup: false };
}

const WHO = ['Bear','Bunny','Fox','Granny Goat','Mr. Mule','Pip'];
const ITEMS = ['plums','grapes','eggs','stamps','apples','pencils','books','roses'];
export function wordProblem() {
  const who = pick(WHO), it = pick(ITEMS), kind = pick(['add','addR','sub','subR','sub','add']);
  const s = makeSum(kind);
  let text;
  if (s.op === '+') {
    text = pick([
      `${who} has ${s.a} ${it}. ${who} gets ${s.b} more. How many ${it} now?`,
      `There are ${s.a} red ${it} and ${s.b} green ${it}. How many ${it} in all?`,
      `${who} sold ${s.a} ${it} on Monday and ${s.b} on Tuesday. How many ${it} in all?`,
    ]);
  } else {
    text = pick([
      `${who} has ${s.a} ${it}. ${who} gives away ${s.b}. How many are left?`,
      `There are ${s.a} ${it} in a box. ${who} takes out ${s.b}. How many ${it} are left?`,
      `${who} has ${s.a} ${it}. Fox has ${s.b} ${it}. How many more does ${who} have?`,
    ]);
    if (who === 'Fox') text = text.replace('Fox has', 'Bear has');
  }
  return { text, ans: s.ans, sum: s };
}

// Unit choice — which unit fits?
export const LENGTH_UNITS = [
  ['A pencil is about 15 ___ long.','cm'],['A door is about 2 ___ tall.','m'],['A bus is about 10 ___ long.','m'],
  ['A crayon is about 9 ___ long.','cm'],['A bed is about 2 ___ long.','m'],['An eraser is about 4 ___ long.','cm'],
  ['A classroom is about 8 ___ long.','m'],['A spoon is about 14 ___ long.','cm'],['A tall tree is about 20 ___ tall.','m'],
  ['A book is about 25 ___ long.','cm'],['A swimming pool is about 25 ___ long.','m'],['A stamp is about 3 ___ wide.','cm'],
];
export const MASS_UNITS = [
  ['An apple is about 200 ___.','g'],['A watermelon is about 4 ___.','kg'],['A dog is about 10 ___.','kg'],
  ['A pencil is about 5 ___.','g'],['A bag of rice is about 5 ___.','kg'],['A grape is about 6 ___.','g'],
  ['A bike is about 12 ___.','kg'],['A feather is about 1 ___.','g'],['A baby is about 4 ___.','kg'],
  ['An egg is about 50 ___.','g'],['A big pumpkin is about 8 ___.','kg'],['A stamp is about 1 ___.','g'],
];
export const RULER_THINGS = [
  {name:'pencil', color:'#FFC94A'}, {name:'crayon', color:'#EF5B4C'}, {name:'ribbon', color:'#7A5BA6'},
  {name:'worm', color:'#E89AA0'}, {name:'key', color:'#C9A227'}, {name:'carrot', color:'#F08A2E'}, {name:'leaf', color:'#3E9B5C'},
];
export const SCALE_THINGS = [
  {name:'pumpkin', pic:'🎃'}, {name:'watermelon', pic:'🍉'}, {name:'bag of rice', pic:'🍚'}, {name:'puppy', pic:'🐶'},
  {name:'box of books', pic:'📚'}, {name:'cabbage', pic:'🥬'},
];

// ---------------------------------------------------------------- 3-digit numbers (the Kahoot uses numbers to 1000)
export function numWord3(n) {
  if (n < 100) return numWord(n);
  const hnd = Math.floor(n / 100), rest = n % 100;
  return ONES[hnd] + ' hundred' + (rest ? ' and ' + numWord(rest) : '');
}
export function numDistractors3(n, count = 3) {
  const d = String(n).padStart(3, '0').split('').map(Number), out = new Set();
  const swaps = [[d[0], d[2], d[1]], [d[1], d[0], d[2]], [d[2], d[1], d[0]], [d[0], 0, d[2] ? d[2] : d[1]]].map(x => +x.join(''));
  const c = [...swaps, n + 10, n - 10, n + 1, n - 1, n + 100, n - 100];
  for (const x of shuffle(c)) { if (x !== n && x >= 10 && x <= 999) out.add(x); if (out.size >= count) break; }
  return [...out];
}
// 3-digit add/sub. kind: add | addR (regroup) | sub | subR | sub0 (across zero)
export function makeSum3(kind) {
  for (let g = 0; g < 400; g++) {
    if (kind === 'sub0') { const a = pick([200, 300, 400, 500, 600, 700, 800, 900, 205, 304, 402, 501, 603, 700]); const b = rnd(11, a - 100); return { op: '−', a, b, ans: a - b, regroup: true }; }
    const a = rnd(102, 899), b = rnd(kind.startsWith('add') ? 12 : 11, 499);
    if (kind.startsWith('add')) { const s = a + b; if (s > 999) continue; const r = (a % 10) + (b % 10) >= 10 || (Math.floor(a / 10) % 10) + (Math.floor(b / 10) % 10) >= 10;
      if ((kind === 'addR') !== r) continue; return { op: '+', a, b, ans: s, regroup: r }; }
    const [x, y] = a > b ? [a, b] : [b, a]; if (x - y < 5) continue; const r = (x % 10) < (y % 10) || (Math.floor(x / 10) % 10) < (Math.floor(y / 10) % 10);
    if ((kind === 'subR') !== r) continue; return { op: '−', a: x, b: y, ans: x - y, regroup: r };
  }
  return { op: '+', a: 236, b: 145, ans: 381, regroup: true };
}
// Word problems in the teacher's style: answer goes into a sentence.
const NAMES3 = ['Ms. Cray', 'Mr. Lin', 'Grandma', 'Ben', 'Lily', 'Coach Tom', 'Ms. Gugu'];
export function wordProblem3() {
  const who = pick(NAMES3); const t = pick(['take', 'rest', 'join', 'three', 'more', 'unitAdd', 'unitSub']);
  if (t === 'three') { const a = rnd(100, 300), b = rnd(100, 300), c = rnd(10, 300); if (a + b + c > 999) return wordProblem3();
    return { text: `${who} has ${a} red stickers, ${b} blue stickers and ${c} green stickers. How many stickers does ${who} have altogether?`, ans: a + b + c, sent: `${who} has ___ stickers altogether.`, plan: `${a} + ${b} + ${c}` }; }
  if (t === 'unitAdd' || t === 'unitSub') { const [u, thing] = pick([['kg', 'a box'], ['kg', 'a bag of rice'], ['cm', 'a ribbon'], ['m', 'a rope'], ['g', 'a packet of sugar']]);
    const a = rnd(20, 95), b = rnd(5, a - 5);
    return t === 'unitAdd' ? { text: `${thing[0].toUpperCase() + thing.slice(1)} is ${a} ${u}. Another one is ${b} ${u}. What is the total?`, ans: a + b, unit: u, sent: `The total is ___ ${u}.`, plan: `${a} + ${b}` }
      : { text: `${thing[0].toUpperCase() + thing.slice(1)} is ${a} ${u}. ${who} uses ${b} ${u}. How much is left?`, ans: a - b, unit: u, sent: `There is ___ ${u} left.`, plan: `${a} − ${b}` }; }
  const q = makeSum3(t === 'join' ? pick(['add', 'addR']) : pick(['sub', 'subR', 'sub0']));
  if (t === 'join') return { text: `A shop sold ${q.a} cups of juice in the morning and ${q.b} cups in the afternoon. How many cups did it sell altogether?`, ans: q.ans, sent: 'The shop sold ___ cups of juice altogether.', plan: `${q.a} + ${q.b}` };
  if (t === 'rest') return { text: `There are ${q.a} books in the library. ${q.b} are storybooks and the rest are not. How many books are not storybooks?`, ans: q.ans, sent: 'There are ___ books that are not storybooks.', plan: `${q.a} − ${q.b}` };
  if (t === 'more') { const o = who === 'Ben' ? 'Sam' : 'Ben'; return { text: `${who} has ${q.a} stamps. ${o} has ${q.b} stamps. How many more stamps does ${who} have than ${o}?`, ans: q.ans, sent: `${who} has ___ more stamps than ${o}.`, plan: `${q.a} − ${q.b}` }; }
  return { text: `${who} had ${q.a} beads. ${who} gave away ${q.b} beads. How many beads are left?`, ans: q.ans, sent: `${who} has ___ beads left.`, plan: `${q.a} − ${q.b}` };
}
export const UNIT_NAMES = { m: 'meter', cm: 'centimeter', g: 'gram', kg: 'kilogram' };
