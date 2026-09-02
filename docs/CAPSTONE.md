# DAET Pulse — Chapters 1–3 alignment

Stored memory (Jul 21–26, 2026) only records that Chapters 1–3 of the DAET tourist-feedback capstone were inconsistent, then redirected to a modern stack: Next.js + Supabase + Vercel + GitHub, with an emoji sentiment dashboard. The full written analysis is not in memory. This document reconstructs the usual failure points and locks the product so the software matches the manuscript.

## Product lock

- No tourist login. Display name only, set once, stored in the browser.
- Rating 1–5 + emoji + derived polarity (negative / mixed / positive). Public analytics.
- Seeded Daet / Camarines Norte spots. Admin CRUD for spots and comments.
- Two actors: Visitor (anonymous + name) and Tourism officer (password session at /admin).

## Sentiment

- rating 1–2 negative, 3 mixed, 4–5 positive
- emoji stored with the row
- dashboard aggregates counts, average rating, and per-spot rank

## Admin auth

Officers open `/admin`, submit ADMIN_PASSWORD, receive an httpOnly session cookie signed with ADMIN_SESSION_SECRET.
