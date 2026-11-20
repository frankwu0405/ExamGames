// DETECTIVE'S OFFICE — reading terms: title, author, character, setting.
import { h, sfx, say, pip, mark, setQ, REPLAY, addBricks, giveCoins, burst, shake, cheer, wait, speakBtn } from '../core.js';
import { STORIES, TERMS, STORY_QS } from '../data.js';
import { menu, playRound } from '../shell.js';
import { askChoice } from '../widgets.js';
import { shuffle, pick } from '../mathgen.js';

const ASK = {
  title: ['Find the TITLE.', 'The title is the name of the story.'],
  author: ['Find the AUTHOR.', 'The author is the person who wrote the story.'],
  character: ['Find a CHARACTER.', 'A character is a person or animal in the story.'],
  setting: ['Find the SETTING.', 'The setting is where the story happens.'],
};

export default {
  id: 'detective', dark: true, title: "Detective's Office — Reading",
  bg: 'linear-gradient(#3F3560 0 30%, #5B4C86 30% 62%, #7A5236 62% 64%, #9C6B45 64%)',
  enter(ui) {
    menu(ui, h('span', { style: { color: '#fff', textShadow: '0 2px 0 #2E2A4F' } }, 'New cases!'), [
      { name: 'Solve a case', desc: 'Read a story. Find the clues.', pic: '🔎', go: () => round(ui) },
      { name: 'Detective words', desc: 'Title, author, character, setting', pic: '🕵️', go: () => terms(ui) },
    ]);
    pip('Read the story. Find the clues!');
  },
};

function round(ui) {
  const two = shuffle(STORIES).slice(0, 2);
  const steps = two.flatMap(st => [...shuffle(['title', 'author', 'character', 'setting']).slice(0, 3).map(role => ({ st, role })), ...shuffle(STORY_QS[st.title]).slice(0, 2).map(q => ({ st, q }))]);
  let shown = null, view = null;
  playRound(ui, { n: steps.length, again: () => round(ui), ask: (i, host) => {
    const { st, role, q } = steps[i];
    if (shown !== st) { shown = st; view = caseView(st); }
    host.append(view.el);
    if (q) { setQ('detq', { title: st.title, q }, `${st.title}: ${q[0]}`); view.finds.forEach(f => f.classList.remove('nope')); return askChoice(host, { prompt: `🔎 ${q[0]}`, options: q.slice(1), answer: q[1], id: 'det:q:' + q[0], hint: 'Read the story again.', onRight: async () => { addBricks('detective'); await wait(500); } }); }
    setQ('detfind', { title: st.title, role }, `${st.title}: find the ${role}`); return findTask(host, view, st, role);
  } });
}
REPLAY.detq = (host, d) => { const st = STORIES.find(s => s.title === d.title); const view = caseView(st); host.append(view.el); const q = d.q;
  return askChoice(host, { prompt: `🔎 ${q[0]}`, options: q.slice(1), answer: q[1], id: 'det:q:' + q[0], hint: 'Read the story again.' }); };
REPLAY.detfind = (host, d) => { const st = STORIES.find(s => s.title === d.title); const view = caseView(st); host.append(view.el); return findTask(host, view, st, d.role); };
function terms(ui) {
  const qs = shuffle([...TERMS, ...TERMS]).slice(0, 6);
  playRound(ui, { n: qs.length, again: () => terms(ui), ask: (i, host) => {
    const t = qs[i], flip = i % 2;
    return flip ? askChoice(host, { prompt: `What is the <b>${t.term}</b>?`, speech: `What is the ${t.term}?`, options: TERMS.map(x => x.def), answer: t.def, id: 'term:' + t.term + ':def', onRight: async () => { addBricks('detective'); await wait(300); } })
      : askChoice(host, { prompt: `${cap(t.def)} is the…`, speech: `${t.def}. What is it called?`, options: TERMS.map(x => x.term), answer: t.term, id: 'term:' + t.term, onRight: async () => { addBricks('detective'); await wait(300); } });
  } });
}
const cap = s => s[0].toUpperCase() + s.slice(1);

function caseView(st) {
  const finds = [];
  const f = (txt, role) => { const s = h('span', { class: 'findable', 'data-role': role }, txt); finds.push(s); return s; };
  const book = h('div', { class: 'book', style: { background: st.color } }, h('div', { class: 't' }, f(st.title, 'title')), h('div', { style: { fontSize: '64px' } }, '📖'), h('div', { class: 'a' }, 'by ', f(st.author, 'author')));
  const page = h('div', { class: 'page magnifier-cursor' });
  st.text.split(/(\[[cs]:[^\]]+\])/).forEach(part => {
    const m = part.match(/^\[([cs]):([^\]]+)\]$/);
    if (m) page.append(f(m[2], m[1] === 'c' ? 'character' : 'setting'));
    else part.split(/(\s+)/).forEach(w => { if (!w.trim()) page.append(w); else page.append(f(w, 'none')); });
  });
  book.classList.add('magnifier-cursor');
  const el = h('div', { class: 'case' }, book, page);
  return { el, finds };
}

function findTask(host, view, st, role) {
  return new Promise(res => {
    const [q, def] = ASK[role]; let first = true, done = false;
    const prompt = h('div', { class: 'prompt', style: { color: '#fff', textShadow: '0 2px 0 #2E2A4F' } }, speakBtn(q), q);
    host.prepend(prompt); say(q);
    view.finds.forEach(s => s.classList.remove('nope'));
    const handler = async e => {
      const s = e.currentTarget; if (done || s.classList.contains('found')) return;
      if (s.dataset.role === role) {
        done = true; s.classList.add('found'); sfx('good'); burst(s, cheer()); mark(`det:${role}`, true, first); if (first) { giveCoins(1, s); addBricks('detective'); }
        await say(`${s.textContent} is the ${role}. ${def}`); cleanup(); res(first);
      } else {
        sfx('bad'); s.classList.add('nope'); shake(s); setTimeout(() => s.classList.remove('nope'), 700);
        if (first) mark(`det:${role}`, false, true, s.textContent); first = false; pip(def);
      }
    };
    view.finds.forEach(s => s.addEventListener('click', handler));
    const cleanup = () => view.finds.forEach(s => s.removeEventListener('click', handler));
  });
}
