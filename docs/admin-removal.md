# Suggestion removal

Sign in to the admin desk once. Add to places and Remove suggestion execute directly without another password or confirmation form. Sign-in creates an eight-hour HttpOnly session checked by both server actions. Lock desk clears the session. Older browser-only sessions require signing in once after deployment.

The municipal desk password is read from the private `ADMIN_DESK_KEY` hosting variable. Set it in the hosting dashboard; it is never stored in the repository or sent to visitors. The existing `SUPABASE_SERVICE_ROLE_KEY` must be configured server-side for database writes and session signing. No SQL migration is required for these changes.

Add to places creates a shared channel and marks the suggestion accepted. Stable channel IDs prevent duplicate places on retries, including retrying after a partial database failure. Success appears only after both operations finish. The accepted place can be opened directly from the suggestion.

Removal sets the existing `wishes.status` to `burned`. It preserves an accepted place and its feedback, and prevents older browser caches from recreating the suggestion. Credentials are not saved in browser storage.

Failed requests keep the suggestion visible and show a retryable error. Successful removal returns to the inbox. The API rejects missing or invalid sessions before accessing Supabase.

Text sentiment is a deterministic English/Filipino keyword estimate with whole-word matching, short negation scope and phrase matching. It includes replies; unmatched text is shown separately rather than discarded. Sarcasm and unfamiliar language still require human review.

Run `node tests/words.test.cjs` for sentiment regressions and `npm run build` for production/type validation.
