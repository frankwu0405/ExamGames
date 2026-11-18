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
uses all words. Learning alternates target recognition, chunk connection and
loose-letter assembly. Only unassisted full-alphabet recall verifies a word.
Guided or helped answers return with at least three intervening tasks; bounded
retries can be parked without blocking the activity.

Progress, exact word/selection position, statistics and reward receipts remain
under `S.airdrop`, using the existing profile/cloud save. Earlier airdrop runs
migrate without clearing verified words, earned parts or the daily reward ledger.
Rewards remain one part per ten distinct unaided words, capped at six per Taiwan
calendar day across runs; assisted rounds and same-day repeats cannot farm parts.

Run `node MetalBug/airdrop.test.cjs` from the repository root for the data,
scheduling, migration, resume and reward regression checks.
