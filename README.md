# DAET Pulse

Public tourist feedback and sentiment dashboard for Daet, Camarines Norte.

- Visitors: no login. Set a display name, then rate / comment. Open live analytics.
- Officers: password session at `/admin`. CRUD spots and comments. Upload cover photos from the file picker.

## 1. Supabase

1. Create a project.
2. SQL editor → paste `supabase/schema.sql` (first time).
3. If reviews do not save or photo upload fails, also run `supabase/fix_grants.sql`.
4. Copy URL + anon key + service role key.

## 2. Environment (Vercel, not GitHub)

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_PASSWORD=
ADMIN_SESSION_SECRET=
```

`NEXT_PUBLIC_*` = Config. The other three = Secret.

## 3. Admin

Open `/admin` and enter `ADMIN_PASSWORD`.

The officer header stays on Desk / Spots / Comments. Use **Public site** only when you want the tourist view.
