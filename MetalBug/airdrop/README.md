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
uses all words. Four of five initial rounds use letter-by-letter handwriting:
dictation, sentence dictation, faint tracing, and a brief look-hide-write round.
Occasional signal hunting adds a change of pace; sixty-word challenges use
independent dictation throughout. Each recognized letter must match the next
letter before it docks. The checkmark requests recognition; it cannot award
success. The word-completion path verifies a full set of letter receipts, not
just the existence of ink. Tracing and hints are guided practice, not mastery.
Guided or helped answers return with at least three intervening tasks; bounded
retries can be parked without blocking the activity.

Progress, exact question position, statistics and reward receipts remain
under `S.airdrop`, using the existing profile/cloud save. Earlier airdrop runs
migrate without clearing verified words, earned parts or the daily reward ledger.
Rewards remain one part per ten distinct unaided words, capped at six per Taiwan
calendar day across runs; assisted rounds and same-day repeats cannot farm parts.

Run `node MetalBug/airdrop.test.cjs` from the repository root for the data,
scheduling, migration, resume and reward regression checks.

## Automatic single-letter recognition

The reader starts automatically on entering a writing round. It uses a small
EMNIST CNN through ONNX Runtime Web 1.21.0, in a dedicated single-thread WASM
worker. The pinned model is approximately 1.5 MB, plus about 13 MB of runtime.
Runtime files come from jsDelivr and the model from a pinned public GitHub
commit. The model uses Cache Storage; runtime files use browser HTTP caching.
There are no API keys, inference uploads or word-correction model downloads.
If loading fails, recognition and rewards stay blocked with a retry control.

Only a cropped, centered 28x28 image of the current letter is sent to the worker.
Trace guides, expected letters, words and context are excluded. The model outputs
all 47 EMNIST classes. Upper/lowercase probabilities are folded; an identical
round zero shape is treated as O, while other digit predictions cannot pass.
The predicted letter must be top-ranked, with probability >= 0.65 and a >= 0.20
margin. Low-confidence predictions stay on the pad; they never advance a slot.
These thresholds do not make recognition perfect. I/l and unusual handwriting
can be ambiguous; the interface suggests a capital letter. It is spelling
practice, not a handwriting-quality assessment.

Recognition waits 550 ms after the last stroke, or runs immediately when ✓ is
pressed. Wrong or incomplete letters remain editable. Tiny marks and dense
scribbling are filtered before inference. Only one inference runs at a time;
only the latest queued request is retained. Ink revisions discard stale results,
including results from a previous letter in doubled-letter words.

Validated letter receipts are saved in the existing profile with every accepted
letter. A refresh resumes the exact letter; raw ink drafts stay in localStorage,
scoped by player/run/question/letter. They are not uploaded in the cloud save.
Earlier runs retain their completed words and reward ledger.

## Verification

`npm test` runs data/scheduling/rewards, stroke capture, queue/stale-result and
strict letter-validation regressions. After `npm install`,
`npm run test:ink-integration` rasterizes real stroke fixtures, runs the actual
model with the WASM backend, and drives the real DOM handlers through wrong
ink, automatic acceptance, repeated letters and mid-word resume. Its model is
cached locally; `AIRDROP_LETTER_MODEL` may point to an existing model file.
Device/browser network loading and child handwriting still need an actual-device
tryout; desktop WASM timing is not a mobile speed guarantee.

Recognition model credits: Bryan Dhaniel / Monacrh, model training credited to
yeogaa, EMNIST by Cohen, Afshar, Tapson and van Schaik / NIST SD19.
Source (project declared MIT):
https://github.com/BryanDhaniel/Handwriting-Recognition-with-EMNIST-and-CNN/tree/6f3456cad42cd56c987d367fa225285619c92e47
ONNX Runtime Web is MIT, copyright Microsoft Corporation.
