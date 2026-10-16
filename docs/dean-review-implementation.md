# Dean review implementation

Implemented against the existing Supabase tables; no database deletion, reseeding, or migration is required.

- Municipal Desk overview: original ratings/replies/classified-note counts, reaction totals, separate place/trip emoji distributions, seven UTC days of original-feedback activity, keyword topic counts, review queue, and automatic rule-based narrative.
- Public text sentiment shows aggregate charts only. Detailed note/classification pairs and agreement counts remain in the Desk sentiment view. Public stories and replies remain available.
- Reply faces never enter original visitor rating totals. Server checks that a reply belongs to an original story in the selected place.
- Agree/disagree saves to existing `pulses.reacts_up` / `reacts_down`. Updates use compare-and-swap to avoid overwriting another visitor's increment. The client waits for success and preserves counts on failure. Signed HttpOnly receipts track previous votes; Web Locks serialize same-browser tabs where supported.
- Reactions are browser-scoped, not unique verified users. Clearing cookies or using another browser permits another vote. A server response lost after a successful database update can require refresh; exactly-once delivery and account-wide voting require a transactional per-user reaction ledger when shared login is integrated. Reaction totals are context, not spam evidence.
- Photo picker requires permission before attachment. Upload endpoint validates consent version and records version/time as Storage object metadata. Older local photo drafts must be reattached with consent. Existing remote images remain untouched.
- Suggestions now wait for confirmed save, show errors, and retain the user's draft on failure; optional photos are uploaded and saved.
- Home is explicit in desktop and mobile navigation. Points open `/rewards` with demo rules and future integration information. Original saved feedback earns 15 preview points; replies/reactions do not.
- Landing uses existing Bagasbas Beach imagery compressed as responsive WebP. Decorative leaves are removed. Blue remains primary with a yellow rewards accent. Existing reduced-motion and requestAnimationFrame parallax handling remains.

## Optional integration configuration

Set server-only `GEMINI_API_KEY` and `GEMINI_MODEL` in Vercel to enable the admin-only AI briefing. Select an available text-generation model for the configured API account. Never prefix the API key with `NEXT_PUBLIC_`. The route follows Google's generateContent API: https://ai.google.dev/api/generate-content . It sends computed aggregate counts and topic totals, not names, raw notes, or photos. Output is a draft for officer review; the deterministic summary remains available without AI configuration or on failure. This integration has not been tested with a live provider key.

Set `NEXT_PUBLIC_DAET_REWARDS_URL` to the actual HTTPS rewards subsystem URL when provided. Until then, the page clearly says the connection is coming soon. No redemption or automatic transfer of demo balances is implemented.

## Scope of analytics

All analysis covers the latest 500 loaded entries, including replies. It does not count unique visitors or represent all tourism activity. Topic matching is not aspect-based sentiment: a mixed comment mentioning cleanliness does not prove cleanliness caused the negative sentiment. Seven-day counts are short-window activity, not a long-term trend. Data connection status is displayed, and incomplete/cached results are labeled.

## Validation

`npm run build`

Existing sentiment, scope, rewards, save, snapshot and storage tests plus `node tests/dean-review.test.cjs` and `node tests/dean-api.test.cjs`. The new tests cover original/reply separation, place/trip separation, neutral/unclassified handling, dates, topic matches, reaction transitions/concurrency/failure, server authorization, and photo consent metadata. Database/provider interactions in automated tests are mocked; no fabricated feedback was inserted into production for testing.
