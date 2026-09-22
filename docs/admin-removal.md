# Suggestion removal

Set `ADMIN_DESK_KEY` to a private, strong value in the hosting environment and keep `SUPABASE_SERVICE_ROLE_KEY` configured server-side. Redeploy, then enter the private key when confirming removal in the suggestion detail page. The old browser-only desk key is not authorization for database deletion.

Removal sets the existing `wishes.status` to `burned`. It preserves an accepted place and its feedback, and prevents older browser caches from recreating the suggestion. The supplied schema already supports this status; no schema migration is required. The key is neither saved in browser storage nor bundled into client code.

Failed requests keep the suggestion visible and show a retryable error. Successful removal returns to the inbox. The API rejects missing or incorrect credentials before accessing Supabase.

Text sentiment is a deterministic English/Filipino keyword estimate with whole-word matching, short negation scope and phrase matching. It includes replies; unmatched text is shown separately rather than discarded. Sarcasm and unfamiliar language still require human review.

Run `node tests/words.test.cjs` for sentiment regressions and `npm run build` for production/type validation.
