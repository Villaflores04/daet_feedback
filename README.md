# DAET Pulse

Municipality of Daet, Camarines Norte — a public tourism feedback desk.

Visitors leave one official face (🤩 Wow · 😊 Happy · 😐 Medium · 😢 Sad) plus an optional note and photo. No accounts. Officers open the municipal desk with the shared key `daet`.

This build is **device-local** (browser storage). Visitor pulses, wishes, and photos start **empty**. The six tourism spots are catalog only.

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

If you still see old faces from a previous preview, the app wipes `daet-pulse-v5` (and earlier) on first load of `daet-pulse-v6`.

## Supabase (optional)

The live app does **not** need Supabase. To wipe the old Next.js tables in your existing project and create empty Pulse tables, run:

[`supabase/schema.sql`](supabase/schema.sql)

in the Supabase SQL editor. That file:

1. Drops old `spots` / `feedback` / `community` tables and all of their rows
2. Creates empty `channels`, `pulses`, `wishes`
3. Inserts the six places only — **zero** visitor rows

## GitHub

https://github.com/Villaflores04/daet_feedback
