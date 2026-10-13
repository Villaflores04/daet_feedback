# DAET-CONNECT — Team 9 handoff

## Implemented in this repository

- `/feedback` is the module entry. `/` redirects there; `/transmit` remains compatible.
- Direct place / overall-trip selection, four emoji ratings, optional public note/photo/nickname.
- A successful submission is shown only after photo upload and database confirmation. The draft remains on errors; retries reuse the submission ID.
- Overall feedback uses reserved channel `feedback-overall-daet`. The server creates it on first submission. It is excluded from place discovery/editing and protected from administrative channel deletion. Existing foreign keys, replies, photos and moderation continue working. Existing records are not renamed or removed.
- Sentiment offers distinct place and overall-trip scopes. Emoji counts exclude replies. Text sentiment continues using the existing English/Filipino lexicon, including replies; it is not a trained AI model.
- Current summaries cover the latest 500 entries, not an unlimited historical report. This limitation is disclosed in the UI.
- Existing admin password/session security and CRUD remain in place for this standalone deployment.

## Integration status — do not mistake navigation for shared authentication

The faculty repository, authentication/session contract, Team 1 destination schema and Team 11 reward implementation have not been supplied. No shared wallet balance, point award, central login, destination synchronization or crisis dispatch is claimed by this module. The rewards panel explicitly communicates this state. No arbitrary 15-point rule has been enabled.

`NEXT_PUBLIC_DAET_CONNECT_URL` adds an HTTPS return link to the main dashboard. The main dashboard can link to `/feedback`, or `/feedback?place=<existing-channel-id>`. This query selects a place only; it never authorizes a user or changes points.

`NEXT_PUBLIC_FEEDBACK_SHARED_SHELL=true` removes this module's standalone header/footer/dock when rendered within the faculty application's own shell. Leave false for Vercel standalone hosting. This flag does not mount routes in the faculty repository automatically.

## Faculty repository migration

This existing project uses root `app/`. The implemented route is `app/(subsystems)/feedback/page.tsx`. In the faculty repository, place it under `src/app/(subsystems)/feedback/` and copy its components/libraries into the faculty `src/` structure. Do not introduce a second `src/app` in this standalone project while root `app` still exists. Reuse the faculty root layout, providers, UI components and authenticated session.

Before moving, namespace legacy `/live`, `/board`, `/spots`, `/desk` and `/api/pulse` routes inside the agreed module route/API prefix and update their links. They remain backward compatible in this standalone repo. Do not merge those legacy routes over other teams' routes.

## Contracts to agree before enabling connected mode

| Owner | Required agreement | Team 9 responsibility |
|---|---|---|
| Faculty / authentication | Verified Supabase session, `profiles.id`, admin role policy | Derive identity server-side; never trust a query-string user ID. Keep guest feedback if approved; reward eligibility requires authenticated identity. |
| Team 1 / destinations | Stable destination UUID and authorized read source | Map existing channel IDs to shared destination IDs; do not create a second master catalogue. Move standalone place CRUD behind the agreed deployment mode. |
| Team 11 / rewards | Actual server helper/RPC, approved point rule, eligibility, caps and reversal policy | Request an award only after feedback persists. Use `feedback:<feedback-id>` as a unique event key. Verify ownership. Never directly increment points from browser code. |
| Team 10 / analytics | Authorized aggregate schema, period filters, pagination and export format | Supply emoji/text counts separately and identify overall vs destination scope. Exclude reply emojis from visit ratings. |
| Team 6 / concerns | Human review workflow and accepted concern payload | Forward reviewed concerns only through the agreed API. Negative sentiment is not an emergency determination. |

Recommended reward event fields: unique feedback ID, authenticated profile ID, source `feedback`, server-created timestamp. Team 11 determines the award amount. Persist pending events and retry delivery idempotently; a reward outage must not discard feedback or duplicate awards. A browser callback is not proof of eligibility.

New central tables must use the `feedback_` prefix and reference shared `profiles.id` / destination IDs after their actual types and policies are confirmed. Back up and migrate existing records with an ID mapping; do not rename live `channels`, `pulses`, or `wishes` without migration and rollback plans.

## Deployment and teacher review

Existing Supabase URL/key and service-role configuration remain required. Overall-trip support uses the existing channels/pulses schema and requires server permission to insert the reserved channel; no new SQL is required for this standalone change. Keep service-role credentials server-only.

Review on a Vercel preview before merge. Check 375px and desktop layouts; place and overall submissions; photo processing/upload failure; duplicate retry; stories/replies/lightbox; admin sign-in and moderation; sentiment scope separation. Test persistence from a second browser against the configured database. Build/unit checks alone do not verify production Supabase policies or actual cross-device operation.

Use a `team-9/...` feature branch and faculty-reviewed pull request for shared-platform integration.
