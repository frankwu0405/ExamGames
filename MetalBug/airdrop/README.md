# Airdrop spelling side mission

Entry: Gate workshop → AIRDROP. The workshop retains its navigation, portrait,
balance and layout. `mountAirdrop()` returns a cleanup function without changing
chapter, card, gate or relic state.

All 10-, 30- and 60-word packages now use scrambled-letter pools, including
reviews. There are no handwriting rounds, tracing, recognition workers or model
downloads in the active page.

## Letter pools

Each pool contains every required letter, including repeated letters, plus four
distinct extra letters absent from the target word. Tiles have unique identities
and are shuffled. Tap tiles to build the answer; tap a filled slot, undo or clear
to revise it. Check becomes available when all slots are filled and accepts only
the exact spelling. A wrong submission records an error, clears the answer and
reshuffles the pool.

All 60 words have picture clues and spoken words/sentences. Pictures are not
penalized hints. The eye button reveals the next unfilled letter without filling
it, counts one error, resets the combo and marks the word assisted. Reopening the
same letter hint does not charge twice. Assisted words return for clean practice;
bounded retries can be parked rather than blocking the activity.

## Rewards and saved progress

Three consecutive clean word rounds earn two parts, then the combo restarts.
Errors, hints, skips and replacing an unfinished package break the combo. An
assisted word cannot contribute until a later clean attempt. Settlement receipts
prevent duplicate payouts on refresh. There is no daily payout cap.

The existing profile/cloud save stores `S.airdrop`, exact question position, tile
order, selected tile IDs, hints, statistics and reward receipts. Engine 6 converts
all pending legacy activities into pools while preserving verified words, wallet,
combo and current question position. Accepted handwriting prefixes become selected
tiles; paid letter hints carry over. Existing valid pools retain their exact order
and partial answer.

## Build the 3D scene

In this directory, run `npm install` and `npm run build`. Commit `scene.js` with
`scene.source.js` and the generated `scene.part-*.js` files; the deployed static page requires no build service or CDN.
The renderer is split at complete statement boundaries into scene.part-*.js
files, loaded in order with ordinary HTTP script URLs inside its isolated iframe.
It does not use eval, Blob scripts, or executable code from a CDN.
Third-party license notices are retained in `THIRD_PARTY_LICENSES.txt`.
The default renderer is WebGL. A CPU canvas fallback projects the same glTF
meshes when a graphics context is unavailable. Its simpler lighting is intentional.

## Assets

The scene uses the same CC0 Kenney/Quaternius models hosted in
`../gate/props/`; see `CREDITS.txt` and `CC0-1.0.txt` there.
All picture clues are locally hosted in `clues/objects.webp` and
`clues/photos.webp`. Source pages, authors and photo licenses are listed in
`clues/CREDITS.md`; Microsoft Fluent illustrations retain their MIT notice in
`clues/LICENSE-Microsoft.txt`. Clue captions do not reveal target spelling.

## Verification

After `npm install`, run `npm test` from this directory. Checks cover all package
sizes and 60 words, solvable shuffled pools, duplicate letters, exact grading,
error and hint handling, combo payouts, legacy migrations and exact resume.
The DOM integration check exercises the active controls, picture clues, wrong
submissions, paid hints, partial-answer resume, rewards and pool-only retries
without recognition dependencies. Device touch layout still needs a real-device
tryout. Older handwriting implementation files remain archived and unreferenced.
