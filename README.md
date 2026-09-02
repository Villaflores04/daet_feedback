# DAET Pulse

Public tourist feedback and sentiment dashboard for Daet, Camarines Norte.

- Visitors: no login. Set a display name, then rate / comment. Open live analytics.
- Officers: password session at `/admin`. CRUD spots and comments.

## 1. Supabase

1. Create a project.
2. SQL editor → paste `supabase/schema.sql`.
3. Copy URL + anon key + service role key.

## 2. Environment

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_PASSWORD=
ADMIN_SESSION_SECRET=
```

Generate `ADMIN_SESSION_SECRET` as a long random string.

## 3. Run

```bash
npm install
npm run dev
```

## 4. Admin

Open [http://localhost:3000/admin](http://localhost:3000/admin) and enter `ADMIN_PASSWORD`.

## 5. Vercel

Import `Villaflores04/daet_feedback`, add the same env vars, deploy.

Capstone alignment notes: `docs/CAPSTONE.md`.
