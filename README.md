# DAET Pulse

Municipality of Daet, Camarines Norte — a public tourism feedback desk.

Built with **Next.js** (App Router). Visitors leave one official face (🤩 Wow · 😊 Happy · 😐 Medium · 😢 Sad) plus an optional note and photo. No accounts. Officers open the municipal desk with the shared key `daet`.

Visitor pulses and place suggestions are shared through Supabase. The six tourism spots are catalog only.

## Run

```bash
npm install
npm run dev
```

## Municipal desk

Open **Municipal desk** from the footer. Shared key: `daet`.

## Vercel

Framework Preset: **Next.js**. Root directory: repository root.

## Shared Supabase data

The site loads and saves visitor feedback through `/api/pulse`, so the same data appears on other browsers and devices.

1. In the Supabase SQL Editor, run [`supabase/schema.sql`](supabase/schema.sql). It is safe to run more than once and does not delete existing rows.
2. In the deployment environment, set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`.
3. Redeploy the site.

Browser-local feedback from the old preview is migrated when that browser next opens the updated site. Image uploads are saved in the public `pulse-photos` Supabase Storage bucket and appear with shared feedback on every device.

## GitHub

https://github.com/Villaflores04/daet_feedback

## Interface and motion

The white, blue, and blue-green interface adapts to phone, tablet, and desktop screens. Explore supports place search and category filters. Visitor and municipal-desk routes, local storage, emoji mappings, and text sentiment rules are preserved.

The landing page alone mounts `CoastalHero`. Its sky, coastal image, water, and foreground foliage move independently with native scroll; scroll listeners are detached when the scene is offscreen. Reduced-motion preferences render a static scene. There is no forced loading delay.

Shared dialogs contain keyboard focus, close with Escape, and restore focus to their trigger. Mobile layouts include bottom navigation and safe-area spacing.

```bash
npm ci
npm run build
```
