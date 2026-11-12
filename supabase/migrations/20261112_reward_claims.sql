-- One-time reward claim per device.
-- The server writes a row the first time a device earns demo points. A second claim for the
-- same device_hash is refused by the primary key. Only hashes are stored: the device key and
-- the network address are never saved in readable form.
create table if not exists public.reward_claims (
  device_hash text primary key,
  ip_hash text not null,
  feedback_id text not null,
  points integer not null default 15,
  created_at timestamptz not null default now()
);

create index if not exists reward_claims_ip_idx on public.reward_claims (ip_hash, created_at);

-- Row-level security on with no public policy: only the server (service key) can read or write.
alter table public.reward_claims enable row level security;
