// Grown-ups page: what's mastered, what keeps going wrong, and settings.
import { S, save, h, sfx, say, englishVoices, setVoice, resetAll, exportSave, importSave, isProtected, protectStorage, backupLink, shortenLink, unpackSave, writeSave } from './core.js';
import { cloud, syncNow, turnOn, fetchSave, sendMessage, idFor, progressOf as saveProgress, summary } from './cloud.js';
import { CREDITS } from './images.gen.js';
import { SPELLING, SENTENCES, GRAMMAR } from './data.js';
import { progressOf, syncTown, previewFinale } from './shell.js';
import { PLACE_NAMES } from './town3d.js';

export function openParent() {
  sfx('pop');
  // hold-to-open so little fingers don't wander in
  const fill = h('span', { class: 'fill' }); let timer, t0;
  const hold = h('button', { class: 'btn paper hold-btn', onpointerdown: () => { t0 = performance.now(); timer = setInterval(() => { const k = (performance.now() - t0) / 1500; fill.style.width = Math.min(100, k * 100) + '%'; if (k >= 1) { clearInterval(timer); gate.remove(); report(); } }, 30); },
    onpointerup: () => { clearInterval(timer); fill.style.width = '0'; }, onpointerleave: () => { clearInterval(timer); fill.style.width = '0'; } }, fill, h('span', { style: { position: 'relative' } }, 'Hold for grown-ups'));
  const gate = h('div', { class: 'overlay', onclick: e => { if (e.target === gate) gate.remove(); } }, h('div', { class: 'panel', style: { textAlign: 'center', width: 'min(460px,94vw)' } },
    h('h2', {}, 'Grown-ups only'), h('p', { style: { fontWeight: 700 } }, 'Press and hold the button.'), hold));
  document.body.append(gate);
}

function report() {
  const it = id => S.items[id] || { c: 0, w: 0, box: 0, miss: [] };
  const sec = (t, ...k) => [h('h3', {}, t), ...k];
  // places
  const places = h('table', { class: 'report' }, h('tr', {}, h('th', {}, 'Place'), h('th', {}, 'Built')),
    ...Object.entries(PLACE_NAMES).map(([a, n]) => h('tr', {}, h('td', {}, n), h('td', {}, Math.round(progressOf(a) * 100) + '%'))));
  // spelling
  const trouble = SPELLING.filter(s => it('sp:' + s.w).w > 0).sort((a, b) => it('sp:' + b.w).w - it('sp:' + a.w).w);
  const mastered = SPELLING.filter(s => it('sp:' + s.w).box >= 2);
  const notYet = SPELLING.filter(s => !S.items['sp:' + s.w]);
  const spellTbl = trouble.length ? h('table', { class: 'report' }, h('tr', {}, h('th', {}, 'Word'), h('th', {}, 'Lesson'), h('th', {}, 'Missed'), h('th', {}, 'Wrong tries')),
    ...trouble.slice(0, 30).map(s => h('tr', {}, h('td', {}, h('b', {}, s.w)), h('td', {}, String(s.L)), h('td', {}, String(it('sp:' + s.w).w)), h('td', {}, (it('sp:' + s.w).miss || []).join(', ')))))
    : h('p', {}, 'No spelling mistakes yet.');
  // sentences
  const sTrouble = SENTENCES.filter(s => it('sb:' + s.id).w + it('sw:' + s.id).w + it('sm:' + s.id).w > 0);
  const sentTbl = sTrouble.length ? h('div', {}, ...sTrouble.map(s => h('div', { style: { margin: '4px 0' } }, h('span', { class: 'tag' }, 'L' + s.L), ' ', s.t))) : h('p', {}, 'No sentence mistakes yet.');
  // grammar
  const gram = h('table', { class: 'report' }, h('tr', {}, h('th', {}, 'Lesson'), h('th', {}, 'Topic'), h('th', {}, 'Right'), h('th', {}, 'Wrong')),
    ...Object.entries(GRAMMAR).map(([L, g]) => { let c = 0, w = 0; for (const [k, r] of Object.entries(S.items)) if (k.startsWith('g' + L + ':')) { c += r.c; w += r.w; }
      return h('tr', {}, h('td', {}, L), h('td', {}, g.topic), h('td', {}, String(c)), h('td', {}, w > c ? h('b', { style: { color: '#B83A2E' } }, String(w)) : String(w))); }));
  // math
  const MATH = { num: 'Numbers to 100', add: 'Add & subtract (blocks)', story: 'Word problems', len: 'Length (m, cm)', mass: 'Mass (kg, g)' };
  const mathTbl = h('table', { class: 'report' }, h('tr', {}, h('th', {}, 'Skill'), h('th', {}, 'Right'), h('th', {}, 'Wrong')),
    ...Object.entries(MATH).map(([k, n]) => { const r = it('m:' + k); return h('tr', {}, h('td', {}, n), h('td', {}, String(r.c)), h('td', {}, String(r.w))); }));
  // mistakes log
  const oops = S.oops || [];
  const oopsTbl = oops.length ? h('table', { class: 'report' }, h('tr', {}, h('th', {}, 'Place'), h('th', {}, 'Question'), h('th', {}, 'Her answer'), h('th', {}, 'Times')),
    ...oops.map(e => h('tr', {}, h('td', {}, PLACE_NAMES[e.area] || '—'), h('td', {}, e.label || e.kind), h('td', {}, e.wrong || ''), h('td', {}, String(e.n)))))
    : h('p', {}, S.fixed ? `All mistakes fixed (${S.fixed} so far).` : 'No mistakes saved yet.');
  // settings
  const rate = h('input', { type: 'range', min: '0.6', max: '1.1', step: '0.05', value: String(S.settings.rate), oninput: e => { S.settings.rate = +e.target.value; save(); } });
  const voices = englishVoices();
  const vsel = h('select', { style: { font: 'inherit', padding: '6px', borderRadius: '8px', border: '2px solid #2E2A4F', maxWidth: '100%' }, onchange: e => { setVoice(e.target.value); say('Hello! Let us rebuild Pebble Town.'); } },
    h('option', { value: '' }, 'Automatic (best voice on this device)'), ...voices.map((v, i) => h('option', { value: v.name, selected: S.settings.voice === v.name ? '' : null }, `${i === 0 ? '★ ' : ''}${v.name} (${v.lang})`)));
  const sfxBox = h('input', { type: 'checkbox', checked: S.settings.sfx ? '' : null, onchange: e => { S.settings.sfx = e.target.checked; save(); } });
  const print = h('button', { class: 'btn small blue', onclick: () => printList(trouble, sTrouble) }, 'Print practice list');
  const reset = h('button', { class: 'btn small red', onclick: () => { if (confirm('Erase all progress and coins? This cannot be undone.')) { resetAll(); syncTown(false); location.reload(); } } }, 'Erase progress');
  const ov = h('div', { class: 'overlay', onclick: e => { if (e.target === ov) ov.remove(); } }, h('div', { class: 'panel', style: { width: 'min(900px,96vw)' } },
    h('button', { class: 'btn small paper close', onclick: () => ov.remove() }, 'Close'),
    h('h2', {}, `${S.name || 'Player'}'s progress`),
    h('div', { style: { display: 'flex', gap: '10px', flexWrap: 'wrap', margin: '0 0 12px' } }, h('button', { class: 'btn small red', onclick: () => { ov.remove(); previewFinale(); } }, '⚡ Preview the finale'), h('button', { class: 'btn small purple', onclick: () => { S.intro = false; save(); location.reload(); } }, '▶ Replay the opening'), h('button', { class: 'btn small paper', onclick: () => { S.story.wordIsle3 = 0; save(); location.reload(); } }, '🏝 Show the Word Island scene again'), h('button', { class: 'btn small paper', onclick: () => { if (!confirm('Take down the Word Island bridge and start it again?')) return; S.wb = { marks: '' }; save(); location.reload(); } }, '🌉 Restart the bridge')),
    h('p', { style: { margin: 0 } }, `Spelling words mastered (typed right twice): ${mastered.length} of ${SPELLING.length}. Not tried yet: ${notYet.length}.`),
    ...sec('☁️ Cloud save (short code)', cloudBox()),
    ...sec('Keep her progress safe', backupBox()),
    ...sec('✉️ Message Frank', messageBox()),
    ...sec(`Oops Book — mistakes to redo (${oops.length})${S.fixed ? ` · fixed so far: ${S.fixed}` : ''}`, h('p', { style: { margin: '0 0 6px', fontSize: '15px' } }, 'She can redo these from the 📕 Oops button in town. A question leaves the list when she gets it right first try.'), oopsTbl),
    ...sec('Places', places), ...sec('Spelling words to practise', spellTbl), ...sec('Weekly sentences with mistakes', sentTbl),
    ...sec('Grammar', gram), ...sec('Math', mathTbl),
    ...sec('Settings',
      h('p', {}, h('label', {}, 'Speaking speed ', rate)), h('p', {}, h('label', {}, 'Voice ', vsel)), h('p', {}, h('label', {}, sfxBox, ' Sound effects')),
      h('details', { style: { fontSize: '14px', margin: '8px 0' } }, h('summary', {}, 'Picture credits (Wikimedia Commons)'), ...Object.entries(CREDITS).map(([k, c]) => h('div', {}, `${k}: “${c.t}” by ${c.by || 'unknown'}, ${c.lic} — `, h('a', { href: c.url, target: '_blank' }, 'source')))),
      h('p', { style: { fontSize: '16px' } }, 'Progress is saved in this browser on this device. '),
      h('div', { style: { display: 'flex', gap: '12px', flexWrap: 'wrap' } }, print, reset))));
  document.body.append(ov);
}

function printList(trouble, sTrouble) {
  const w = window.open('', '_blank'); if (!w) return;
  const words = (trouble.length ? trouble : SPELLING).map(s => `<li><b>${s.w}</b> — ${s.ctx}</li>`).join('');
  const sents = sTrouble.map(s => `<li>${s.t}</li>`).join('');
  w.document.write(`<title>Practice list</title><body style="font-family:Andika,Arial;font-size:18px;line-height:1.6;padding:24px"><h1>Practice list</h1>
    <h2>Spelling words</h2><ol>${words}</ol>${sents ? `<h2>Weekly sentences</h2><ol>${sents}</ol>` : ''}<script>print()<\/script>`);
  w.document.close();
}

// ---------------------------------------------------------------- backup / restore
function backupBox() {
  const when = S.savedAt ? new Date(S.savedAt).toLocaleString() : '—';
  const status = h('span', {}, 'checking…');
  isProtected().then(p => { status.textContent = p === true ? 'Yes ✓' : p === false ? 'Not yet — tap "Protect"' : 'This browser cannot say'; });
  const msg = h('p', { style: { fontWeight: 700, minHeight: '1.3em', margin: '6px 0' } });
  const btn = (cls, label, fn) => h('button', { class: 'btn small ' + cls, onclick: fn }, label);
  // 1) backup link
  const linkOut = h('div', { class: 'backup-link' });
  const makeLink = async () => {
    linkOut.innerHTML = ''; msg.textContent = 'Making the link…';
    const long = await backupLink(); let url = long, short = false;
    try { url = await shortenLink(long); short = true; } catch (e) { }
    msg.textContent = short ? 'Done! Keep this link. Opening it on any device brings her progress back.' : 'Done! (The short-link service did not answer, so this is the full link. It works the same.)';
    const share = async () => { try { if (navigator.share) { await navigator.share({ title: `${S.name || 'Pebble Town'} backup`, text: `Pebble Town backup for ${S.name || 'her'} (${new Date().toLocaleDateString()})`, url }); return; } } catch (e) { if (e.name === 'AbortError') return; } copy(); };
    const copy = async () => { try { await navigator.clipboard.writeText(url); msg.textContent = 'Link copied.'; } catch (e) { box.select(); msg.textContent = 'Select the link and copy it.'; } };
    const box = h('input', { value: url, readonly: '', onclick: e => e.target.select(), style: { width: '100%', font: short ? '700 26px var(--display)' : '12px monospace', textAlign: short ? 'center' : 'left', padding: '8px', border: '3px solid #2E2A4F', borderRadius: '12px', boxSizing: 'border-box' } });
    linkOut.append(box, h('div', { style: { display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '8px' } }, btn('green', '📤 Share', share), btn('paper', '📋 Copy', copy)));
  };
  // 2) restore from a link, a code, or a file
  const restoreCloud = async (c, soft) => {
    msg.textContent = 'Looking for ' + c + '…';
    try { const { save: o } = await fetchSave(c); if (!confirm(`Replace the progress on this device with ${o.name || 'the cloud save'} (${o.coins || 0} coins)?`)) { msg.textContent = ''; return true; } writeSave(o); location.reload(); return true; }
    catch (e) { if (e.message === 'nocode' && soft) { msg.textContent = ''; return false; } msg.textContent = e.message === 'nocode' ? 'No cloud save with that name.' : 'Could not reach the cloud. Check the internet and try again.'; return true; }
  };
  const restoreText = async text => {
    const t = String(text || '').trim(); if (!t) return;
    if (/^[\p{L}\p{N} ]{1,20}$/u.test(t) && idFor(t) && await restoreCloud(idFor(t), t.length >= 5)) return;
    if (/^(https?:\/\/)?(is\.gd|v\.gd)\//i.test(t)) { location.href = t.startsWith('http') ? t : 'https://' + t; return; }
    if (/^[A-Za-z0-9_]{5,30}$/.test(t)) { location.href = 'https://is.gd/' + t; return; }       // just the short code
    try {
      let o; if (/^[zj][A-Za-z0-9_-]{40,}$/.test(t)) { o = await unpackSave(t); if (!confirm(`Replace the progress on this device with ${o.name || 'this backup'} (${o.coins || 0} coins)?`)) return; writeSave(o); location.reload(); return; }
      const m = t.match(/[?&]r=([^&#\s]+)/); if (m) o = await unpackSave(m[1]); else { importSave(t); location.reload(); return; }
      if (!confirm(`Replace the progress on this device with ${o.name || 'this backup'} (${o.coins || 0} coins)?`)) return;
      writeSave(o); location.reload();
    } catch (e) { msg.textContent = 'That is not a Pebble Town backup.'; }
  };
  const fileIn = h('input', { type: 'file', accept: '.txt,.json,text/plain,application/json', style: { display: 'none' }, onchange: e => { const f = e.target.files[0]; if (f) f.text().then(restoreText); } });
  const code = h('input', { placeholder: 'Her name (cloud save) or backup link', style: { flex: '1', minWidth: '200px', font: '16px inherit', padding: '8px', borderRadius: '10px', border: '2px solid #2E2A4F' } });
  const download = () => { const a = h('a', { href: URL.createObjectURL(new Blob([exportSave()], { type: 'text/plain' })), download: `pebble-town-${(S.name || 'save').toLowerCase()}-${new Date().toISOString().slice(0, 10)}.txt` }); document.body.append(a); a.click(); a.remove(); msg.textContent = 'Backup file saved.'; };
  return h('div', {},
    h('p', { style: { margin: '0 0 6px' } }, `Progress saves automatically in this browser (last saved: ${when}). It can be lost if site data is cleared, in a private window, or on iPad Safari if the game isn't opened for 7 days. Make a backup link now and then — it holds everything.`),
    h('div', { style: { display: 'flex', gap: '10px', flexWrap: 'wrap' } }, btn('green', '🔗 Make backup link', makeLink)),
    linkOut, msg,
    h('h4', { style: { margin: '14px 0 6px' } }, 'Restore'),
    h('div', { style: { display: 'flex', gap: '10px', flexWrap: 'wrap' } }, code, btn('red', 'Restore', () => restoreText(code.value))),
    h('details', { style: { marginTop: '10px', fontSize: '15px' } }, h('summary', {}, 'More: backup file, storage protection'),
      h('p', {}, h('b', {}, 'Protected from auto-clearing: '), status, ' ', btn('paper', '🛡 Protect', async () => { const p = await protectStorage(); status.textContent = p ? 'Yes ✓' : 'The browser said no — keep backup links.'; })),
      h('div', { style: { display: 'flex', gap: '10px', flexWrap: 'wrap' } }, btn('paper', '⬇ Save backup file', download), btn('paper', '⬆ Load backup file', () => fileIn.click()), fileIn)));
}

// ---------------------------------------------------------------- cloud save + messages
function cloudBox() {
  const out = h('div'), msg = h('p', { style: { fontWeight: 700, minHeight: '1.3em', margin: '6px 0' } });
  const btn = (cls, label, fn) => h('button', { class: 'btn small ' + cls, onclick: fn }, label);
  const draw = () => {
    out.innerHTML = '';
    if (!S.cloudCode) { out.append(h('p', { style: { margin: '0 0 8px' } }, 'Saves her progress online under her name. It turns on by itself when she starts the game online and updates while she plays.'), btn('green', '☁️ Turn on cloud save', async () => { msg.textContent = 'Setting up…'; try { await turnOn(); msg.textContent = 'On! Her cloud name is shown below.'; draw(); } catch (e) { msg.textContent = 'Could not reach the cloud. Check the internet and try again.'; } })); return; }
    const when = cloud.last ? 'just now' : S.savedAt ? 'updates by itself while she plays' : '';
    out.append(h('div', { style: { font: '700 34px var(--display)', letterSpacing: '3px', textAlign: 'center', padding: '8px', border: '3px solid #2E2A4F', borderRadius: '12px', background: '#fff' } }, S.cloudCode),
      h('p', { style: { margin: '6px 0', fontSize: '15px' } }, `On ✓ (${when}). On another device, just start the game and type the same name: it offers to bring her game back. Or use Grown-ups → Restore → type the name.`),
      h('div', { style: { display: 'flex', gap: '10px', flexWrap: 'wrap' } }, btn('green', '⬆️ Save this device to cloud', async () => { msg.textContent = 'Checking…';
        let g = null; try { g = await fetchSave(S.cloudCode); } catch (e) { }
        if (g && saveProgress(g.save) > saveProgress(S) && !confirm(`The cloud has MORE progress:\n${summary(g.save)}\n(saved ${new Date(g.t).toLocaleString()})\n\nThis device:\n${summary(S)}\n\nOverwrite the cloud with this device anyway?`)) { msg.textContent = 'Nothing changed.'; return; }
        msg.textContent = 'Saving…'; msg.textContent = (await syncNow(true)) ? `Saved to the cloud ✓ (${summary(S)})` : 'Could not reach the cloud. Try again in a moment.'; }),
        btn('paper', '⬇️ Load from cloud', async () => { msg.textContent = 'Loading…'; let g;
        try { g = await fetchSave(S.cloudCode); } catch (e) { msg.textContent = e.message === 'nocode' ? 'No cloud save yet.' : 'Could not reach the cloud. Try again in a moment.'; return; }
        if (!confirm(`Cloud copy:\n${summary(g.save)}\n(saved ${new Date(g.t).toLocaleString()})\n\nThis device:\n${summary(S)}\n\nReplace this device's progress with the cloud copy?`)) { msg.textContent = 'Nothing changed.'; return; }
        writeSave(g.save); location.reload(); })),
      h('p', { style: { margin: '8px 0 0', fontSize: '15px' } }, 'This device: ' + summary(S)));
  };
  draw(); return h('div', {}, out, msg);
}
function messageBox() {
  const from = h('input', { placeholder: 'Your name (optional)', style: { width: '100%', boxSizing: 'border-box', font: '16px inherit', padding: '8px', borderRadius: '10px', border: '2px solid #2E2A4F', marginBottom: '6px' } });
  const text = h('textarea', { rows: '3', placeholder: 'Idea, problem, or hello…', style: { width: '100%', boxSizing: 'border-box', font: '16px inherit', padding: '8px', borderRadius: '10px', border: '2px solid #2E2A4F' } });
  const msg = h('p', { style: { fontWeight: 700, minHeight: '1.3em', margin: '6px 0' } });
  return h('div', {}, h('p', { style: { margin: '0 0 6px', fontSize: '15px' } }, 'Send a note to the game maker. Only grown-ups should use this. Do not put phone numbers or addresses in it.'), from, text,
    h('button', { class: 'btn small green', onclick: async () => { const t = text.value.trim(); if (!t) return; msg.textContent = 'Sending…'; try { await sendMessage(from.value, t); text.value = ''; msg.textContent = 'Sent ✓ Thank you!'; } catch (e) { msg.textContent = 'Could not send. Check the internet and try again.'; } } }, 'Send'), msg);
}
