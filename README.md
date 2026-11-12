# CONNECT-Daet · Team 9 Feedback

**DAET Tourist Feedback and Sentiment Analysis Emoji-Based System**

A public tourism feedback site for the Municipality of Daet, Camarines Norte, with a private **Municipal Desk** for the Municipal Tourism, Culture and Arts Office (MTCAO). Visitors rate a place or their overall visit with one of four labeled emojis (🤩 Wow · 😊 Happy · 😐 Okay · 😢 Sad), with an optional note and photo, and no account. Staff read the feedback, an attention list and sentiment charts in the Desk.

Team 9: Capistrano, John Mark Daniel T. · Filio, Mark P. · Villaflores, Paul Vincent N.

> In the code the system was first named "Pulse": a **pulse** is a feedback entry, a **channel** is a place, a **wish** is a suggested place, a **face** is the emoji and a **callsign** is the nickname.

## What it does

- **Public pages:** Landing (`/`), Places (`/spots`), Stories (`/live`), Sentiment (`/board`), Feedback (`/transmit`) and Help & Support (`/help`).
- **Municipal Desk (`/desk`):** overview with an attention list, sentiment charts, place and suggestion management, import of outside feedback (paste or CSV, with a source tag), source-tagged links and QR codes, deletion, CSV export, help reports and contacts, and an optional **Ask AI** assistant.
- **Emoji sentiment:** Wow and Happy count as positive, Okay as mixed, Sad as negative. Only original ratings are counted; replies are excluded, and the overall visit is kept apart from places. A place is ranked after at least 3 ratings.
- **Text sentiment:** a rule-based reader for English and Filipino (negators, missing-facility complaints, Mixed and Unclassified). No AI is used for classification.
- **Attention list:** plain thresholds on the counts (see `src/lib/pulse/attention.ts`). The AI never decides what is urgent.
- **Ask AI (optional):** Google Gemini, used only on the server by a signed-in officer. It sees aggregate counts, the attention list and redacted, shortened comments (no names, photos or contact details). Every answer is a draft for officer review.

Saved feedback adds 15 clearly labeled demo points to a browser-only preview; this is not a real wallet.

## Built with

Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS 4, Zustand, Supabase (Postgres and Storage), Leaflet, `qrcode`, hosted on Vercel.

## Run locally

```bash
npm install
npm run dev
```

The dev server starts on port 8080. For a production check:

```bash
npm ci
npm run build
npm run start
```

## Environment variables

Set these in `.env.local` for local work and in the Vercel project settings for deployment. **Never commit real values.**

| Variable | Needed for |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public read access to the database |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only database key. It also signs the Desk session cookie. It must never reach the browser. |
| `ADMIN_DESK_KEY` | The Municipal Desk password |
| `GEMINI_API_KEY`, `GEMINI_MODEL` | Optional. Enables Ask AI. Without them the Desk works and Ask AI shows "not connected". |
| `GEMINI_FALLBACK_MODEL` | Optional. A second model used if the first fails. |
| `NEXT_PUBLIC_DAET_CONNECT_URL`, `NEXT_PUBLIC_DAET_REWARDS_URL`, `NEXT_PUBLIC_FEEDBACK_SHARED_SHELL` | Optional. Links to the central DAET-CONNECT services and shared shell. See [integration status](docs/DAET-CONNECT-INTEGRATION.md). |

## Municipal Desk access

Open **Municipal desk** from the footer, or go to `/desk`, and enter the Desk password. The password is the value of `ADMIN_DESK_KEY` on the server; it is **not stored in this repository**.

After a correct password the server sets a signed cookie (`daet-desk-session`, 8 hours, HttpOnly, SameSite Strict). The cookie holds an expiry time and an HMAC-SHA256 signature of it. Every `/api/desk/*` route recomputes the signature and returns **401** when the cookie is missing, tampered, expired or signed with a different key. See `src/lib/desk-session.ts` and `app/api/desk/session/route.ts`.

## Routes

Public pages: `/`, `/spots`, `/spots/[slug]`, `/live`, `/board`, `/help`, `/transmit`, `/rewards`, `/feedback`.
Desk pages: `/desk`, `/desk/board`, `/desk/channels`, `/desk/wishes`, `/desk/help`, `/desk/import`, `/desk/log`.

| API route | Access | Purpose |
| --- | --- | --- |
| `GET, POST /api/pulse` | Public | Read data; save a rating, a reply, a suggestion; edit or delete your own entry (checked by a hashed device key) |
| `POST /api/pulse/reaction` | Public | Agree or disagree on a story |
| `POST /api/pulse/photo` | Public | Upload a photo (consent required, image under 4 MB) |
| `POST /api/support/report` | Public | Help & Support report |
| `GET /api/support/contacts` | Public | Published office contacts |
| `GET, POST, DELETE /api/desk/session` | Login door | Check, open, close the Desk session |
| `DELETE /api/desk/pulses` | Desk only | Delete feedback |
| `POST, PATCH, DELETE /api/desk/channels` | Desk only | Manage places |
| `POST, DELETE /api/desk/wishes` | Desk only | Keep or remove suggestions |
| `POST /api/desk/import` | Desk only | Add outside feedback (star ratings: 5 Wow, 4 Happy, 3 Okay, 1–2 Sad) |
| `POST /api/desk/chat` | Desk only | Ask AI |
| `GET, PATCH, DELETE /api/desk/support/reports` | Desk only | Help reports |
| `GET, POST, PUT, DELETE /api/desk/support/contacts` | Desk only | Office contacts |

## Project layout

```text
app/            pages and server routes (app/api)
src/views/      page screens
src/components/ reusable UI (map, charts, Ask AI panel, QR card)
src/lib/pulse/  scoring rules: faces, words, sentiment, insights, attention, briefing
src/lib/        desk-session, desk-ai, supabase-server, support helpers
supabase/       schema.sql and dated migrations
tests/          Node test files
docs/           integration and troubleshooting notes
```

## Database (Supabase)

The site loads and saves feedback through `/api/pulse`, so the same data appears on every browser and device.

1. In the Supabase SQL Editor, run [`supabase/schema.sql`](supabase/schema.sql), then each file in [`supabase/migrations/`](supabase/migrations) in date order (help and support, categories, feedback sources, QR source, author key). They are safe to run more than once and do not delete existing rows.
2. Set the environment variables above in the deployment.
3. Redeploy the site.

Row-level security is on for every table. The public can read places, feedback, suggestions and contacts, and can insert a rating only with one of the four allowed emojis and a suggestion only with a name of at least 3 characters. Changes, deletions and help reports go only through the Desk routes, which check the signed session. Photos are saved in the public `pulse-photos` Storage bucket.

## Deploy on Vercel

Framework Preset: **Next.js**. Root directory: repository root. Each merge to `main` deploys automatically.

## Tests

```bash
node tests/words.test.cjs
node tests/storage-upload.test.cjs
node tests/feedback-scope.test.cjs
node tests/feedback-save.test.cjs
```

The `tests/` folder also has `rewards-preview`, `shared-snapshot`, `dean-api` and `dean-review` tests. The access-control, cross-device and functional tests reported in the manuscript were run separately with Playwright and command-line requests.

## Interface notes

The interface adapts to phone, tablet and desktop screens, with a bottom navigation bar on phones and a burger menu on laptops and desktops. Shared dialogs contain keyboard focus, close with Escape and restore focus to their trigger. Reduced-motion preferences render a static landing scene. Photos and names shown in screenshots are test data.

## Integration with the central DAET-CONNECT system

Read the [integration status and faculty handoff](docs/DAET-CONNECT-INTEGRATION.md) before connecting shared authentication, the Team 1 destination catalogue or Team 11 rewards. These central services are not connected by this standalone version.

## Links

https://github.com/Villaflores04/daet_feedback
