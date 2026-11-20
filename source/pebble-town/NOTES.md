# Pebble Town — handoff notes (Oct 25)

Build: `npm install` then `node build.mjs` → dist/pebble-town.html (single offline file).
Test build with hooks: `DEV=1 ENTRY=src/test-entry.js node build.mjs`.

## Done
- 3D town (src/town3d.js), townsfolk + Storm Cloud (src/folk.js), story/opening/finale/festival (src/story.js), shell/HUD (src/shell.js)
- Quiet mode (read-aloud off by default). Grown-ups page: "Preview the finale", "Replay the opening".
- Activities: signs, train, bridge, library (VOCAB meaning only), workshop, detective, market (3-digit, column H T O, word problems), science (basic), storm (practice quiz)
- Spelling words = spelling only (picture + blanked sentence); VOCAB (L4–7) = meaning only.

## Unfinished / next session
1. PICTURES: src/images.gen.js is EMPTY → pictures show "?" placeholders. Plan: pick Openverse CC0/PD images
   for every key (spelling word `w`, vocab `v_<word>`, science `s_*`), downscale ~200px, embed as data URIs in IMG.
   Query list is in this file's history (see keys used in data.js / science.js). Browser pane can reach api.openverse.org.
2. Market + Science + new Library/Signs/Bridge modes NOT yet robot-tested after the last changes.
3. Science Lab: add a shadow-direction mini lab (flashlight + object).
4. Kahoot notes: kahoot/science.txt (40 items), kahoot/math.txt (66 of 125). Math exam uses numbers to 1000.

## 2026-10-26 update
- Removed non-exam activities: Picture memory (library), balance game (Scale Stall → kg/g word problems), shadow slider (→ shadow concept questions).
- Decorations: 33 kinds in town3d.js DECOR_MAKERS/DECOR_LIST; spots from a seeded pool, big items use reserved spots; S.decor is the buy order. Shop shows 3D thumbnails (decorThumb).
- Oops Book: every question calls setQ(kind,data) (askChoice/askNumber do it automatically); first wrong answer → S.oops. REPLAY[kind] replays; correct first try removes it. HUD "📕 Oops" button; Grown-ups page lists them.
- Activity tiles keep best stars in S.done['area|card name'].
- HUD "👁 Hide signs" toggles body.no-labels. Pip bubbles auto-hide sooner and close on tap.
