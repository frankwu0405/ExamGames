// Cloud curtain shared by Pebble Town and The Cave: clouds roll in to cover the screen before leaving a page,
// and the next page starts covered by the same clouds, which then part. (Same file in both projects.)
const CSS = `
.cloud-curtain { position: fixed; inset: 0; z-index: 10000; pointer-events: none; overflow: hidden; }
.cloud-curtain .fill { position: absolute; inset: 0; background: linear-gradient(#DDF1FB, #F6FBFF 55%, #FFF6E2); opacity: 0; transition: opacity .55s ease .45s; }
.cloud-curtain .cl { position: absolute; width: 74vmax; height: 46vmax; transition: transform 1.05s cubic-bezier(.55,.05,.35,1);
  background:
    radial-gradient(circle at 28% 62%, #fff 0 21%, transparent 21.5%),
    radial-gradient(circle at 47% 44%, #fff 0 27%, transparent 27.5%),
    radial-gradient(circle at 68% 58%, #fff 0 22%, transparent 22.5%),
    radial-gradient(circle at 84% 70%, #fff 0 14%, transparent 14.5%),
    radial-gradient(ellipse 46% 26% at 52% 74%, #fff 0 99%, transparent 100%),
    radial-gradient(ellipse 48% 22% at 52% 82%, #D9ECF7 0 99%, transparent 100%);
  filter: drop-shadow(0 .6vmax 0 rgba(46,42,79,.14)); }
.cloud-curtain.shut .fill { opacity: 1; transition-delay: .35s; }
.cloud-curtain.shut .cl { transform: none !important; }
.cloud-curtain.opening .fill { opacity: 0; transition: opacity .45s ease; }
`;
// where each cloud sits when the screen is covered (as % of the screen) and which side it comes from
const LAYOUT = [[-30, -18, -1], [12, -24, 1], [48, -16, 1], [-34, 14, -1], [8, 8, -1], [46, 16, 1], [-28, 44, -1], [14, 40, 1], [50, 48, 1], [-20, 72, -1], [26, 70, 1], [62, 76, 1], [30, 26, -1], [70, -10, 1]];
function build(shut) {
  if (!document.getElementById('cloud-css')) { const st = document.createElement('style'); st.id = 'cloud-css'; st.textContent = CSS; document.head.append(st); }
  const el = document.createElement('div'); el.className = 'cloud-curtain' + (shut ? ' shut' : '');
  const fill = document.createElement('div'); fill.className = 'fill'; el.append(fill);
  LAYOUT.forEach(([x, y, side], i) => { const c = document.createElement('div'); c.className = 'cl';
    c.style.left = x + 'vw'; c.style.top = y + 'vh'; c.style.transform = `translateX(${side * 120}vw) scale(${0.9 + (i % 3) * 0.1})`; c.style.transitionDelay = (i % 4) * 0.06 + 's'; el.append(c); });
  document.body.append(el); return el;
}
// clouds roll in until the screen is covered
export function cloudsIn() { const el = build(false); el.getBoundingClientRect(); el.classList.add('shut'); return new Promise(r => setTimeout(r, 1250)); }
// the page starts covered (call as early as possible) …
export function cloudsCovered() { return build(true); }
// … and the clouds part to show it
export function cloudsOut(el) { if (!el) return; el.classList.remove('shut'); el.classList.add('opening'); setTimeout(() => el.remove(), 1500); }
