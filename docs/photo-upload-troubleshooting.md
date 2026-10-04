# Image upload failures

An image preview is local. Saving a new cover first sends it through
`/api/pulse/photo` to Supabase Storage, then saves the place record. A raw
`fetch failed` from the old photo endpoint indicates an upstream transport
failure; it does not establish whether DNS, a timeout, or project availability
caused it. Production logs are needed to distinguish those cases.

Uploads now retry transient transport failures and HTTP 408/429/500/502/503/504
up to three attempts, using the same object path and upsert. Each attempt has a
six-second request timeout. Database mutations are not retried by this transport.
The client and route reject files over 4 MiB before sending them upstream,
leaving multipart overhead beneath Vercel's 4.5 MB request limit.

If saving still fails after deployment, inspect Vercel function logs for
`Photo upload failed`. The log includes a safe cause code (for example
`ENOTFOUND`, `ECONNRESET`, or a Storage HTTP status), not keys or photo data.

- `STORAGE_UNAVAILABLE`: check Supabase project availability and the deployment's
  `NEXT_PUBLIC_SUPABASE_URL`. Inspect the cause code for DNS/network failures.
- `STORAGE_AUTH`: verify the server-only `SUPABASE_SERVICE_ROLE_KEY` belongs to
  that same project. Do not expose it in a NEXT_PUBLIC variable.
- `STORAGE_BUCKET`: verify the existing `pulse-photos` bucket exists and retains
  the public-read configuration used by this app.
- `STORAGE_CONFIG`: configure the missing server environment values.

Redeploy after changing Vercel environment values. This patch requires no SQL
migration and does not create buckets, change policies, or replace credentials.
Retry tests simulate upstream failures; they do not verify production Supabase
connectivity. Run `node --test tests/storage-upload.test.cjs` and `npm run build`.
