-- Basketball Manager: one-time "full game" purchases. Paste into Supabase > SQL Editor and run once (after setup.sql).
-- Only the Stripe webhook (Edge Function bm-stripe-webhook, service role) writes rows; a player can only read their own.
create table if not exists public.purchases (
  user_id        uuid primary key references auth.users(id) on delete cascade,
  product        text not null default 'full_game',
  stripe_session text unique,
  amount         integer,
  currency       text,
  paid_at        timestamptz not null default now()
);
alter table public.purchases enable row level security;
drop policy if exists "purchases: read own" on public.purchases;
create policy "purchases: read own" on public.purchases for select to authenticated using ((select auth.uid()) = user_id);
-- no insert, update or delete policies: players cannot mark themselves as paid
