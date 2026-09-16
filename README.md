# DAET Pulse

Municipality of Daet, Camarines Norte — a public tourism feedback desk.

Visitors leave one official face (🤩 Wow · 😊 Happy · 😐 Medium · 😢 Sad) plus an optional note and photo. No accounts. Officers open the municipal desk with the shared key `daet`.

This build is **device-local** (browser storage). Visitor pulses, wishes, and reacts start **empty**. The six tourism spots are catalog only.

## Places

- Bagasbas Beach
- Cathedral of St. John the Baptist
- First Rizal Monument
- Mercedes Island Views
- Camarines Norte Provincial Capitol
- Friendship Park

## Run

```bash
npm install
npm run dev
```

## Municipal desk

Footer, tiny muted text: **Municipal desk**. Shared key: `daet`.

## Empty data

Demo pulses and wishes are not seeded. First visitors write on a blank board.

## Vercel

This is **TanStack Start** (Vite + Nitro), not Next.js. The old project preset is why the last deploy asked for `next`.

`vercel.json` sets the framework to TanStack Start. After this lands on `main`:

1. Vercel → Project → **Settings → General → Framework Preset** → **TanStack Start** (or Other)
2. **Deployments → Redeploy** the latest commit
3. Turn **off** “Use existing Build Cache” once

Do not keep Framework Preset on Next.js.

## Supabase (optional)

The live app does **not** need Supabase. To wipe the old Next.js tables, run [`supabase/schema.sql`](supabase/schema.sql) in the SQL editor.

## GitHub

https://github.com/Villaflores04/daet_feedback
