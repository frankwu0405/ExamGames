# Airdrop spelling side mission

Entry: Gate workshop → AIRDROP. The workshop continues to own its back arrow,
portrait, balance, bottom tabs and main layout. `mountAirdrop()` installs a view
and returns a cleanup function; it does not modify chapter, card, gate or relic state.

The activity uses the same CC0 Kenney/Quaternius crate, chest, speeder, generator
and barrel models already hosted in `../gate/props/`. Attribution and licensing:
`../gate/props/CREDITS.txt` and `../gate/props/CC0-1.0.txt`.
Three.js and its included Meshopt decoder retain their bundled license notices.

## Build the 3D scene

In this directory, run `npm install` and `npm run build`. Commit `scene.js` with
`scene.source.js` and the generated `scene.part-*.js` files; the deployed static page requires no build service or CDN.
The renderer is split at complete statement boundaries into scene.part-*.js
files, loaded in order with ordinary HTTP script URLs inside its isolated iframe.
It does not use eval, Blob scripts, or executable code from a CDN.
Third-party license notices are retained in `THIRD_PARTY_LICENSES.txt`.
The default renderer is WebGL. A CPU canvas fallback projects the same glTF
meshes when a graphics context is unavailable. Its simpler lighting is intentional.

## Practice and persistence

All 60 school words live in `../airdrop.js`. Ten-word runs may use one school
set or a weighted mixture; thirty-word runs sample five per school set; sixty
uses all words. Four of five initial rounds use whole-word handwriting:
dictation, sentence dictation, faint tracing, and a brief look-hide-write round.
Occasional signal hunting adds a change of pace; sixty-word challenges use
independent dictation throughout. Only teacher-confirmed, unassisted dictation
verifies a word. The teacher checks the original ink with the checkmark stamp;
the clock/loop control schedules another attempt. Empty ink cannot be stamped.
Guided or helped answers return with at least three intervening tasks; bounded
retries can be parked without blocking the activity.

Progress, exact question position, statistics and reward receipts remain
under `S.airdrop`, using the existing profile/cloud save. Earlier airdrop runs
migrate without clearing verified words, earned parts or the daily reward ledger.
Rewards remain one part per ten distinct unaided words, capped at six per Taiwan
calendar day across runs; assisted rounds and same-day repeats cannot farm parts.

Run `node MetalBug/airdrop.test.cjs` from the repository root for the data,
scheduling, migration, resume and reward regression checks.

## Optional local handwriting reader

Enable in Airdrop settings. `ink.worker.js` imports pinned Transformers.js 3.8.1
from jsDelivr and runs `Xenova/trocr-small-handwritten` (MIT) on device using WASM.
Quantized encoder and decoder weights total about 64 MB, plus runtime/tokenizer
files (allow about 100 MB for the first download). Browser HTTP/model caching
reduces subsequent downloads; eviction/private browsing can require a reload.
There are no API keys or inference uploads. Network access to jsDelivr and
Hugging Face is required for the first load. Failure never blocks writing.

The model receives only cropped ink pixels, never the target word, word bank,
trace guides or sentence. Its transcription is a preview, not an automatic
spelling grade: generative OCR can normalize a child's misspelling. A teacher
must verify the visible ink. The reader does not measure handwriting quality.
Recognition runs off the main thread after a pause, with one active job and only
the newest waiting job. Revision checks discard stale results when ink changes.

Ink drafts stay in localStorage, scoped to the current question; they are not
saved into the cloud profile. Touch, mouse and pen input use pointer events;
undo, erasing, DPR resize and a pen/touch palm guard are supported.
Run `node MetalBug/airdrop/ink.test.cjs` for stroke and reader queue regressions.
