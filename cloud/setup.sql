-- Basketball Manager: accounts and cloud saves. Paste into Supabase > SQL Editor and run once.
-- Each career save is a gzip file in the private 'saves' bucket at <user id>/<slot id>.gz; the table holds the summary for the
-- load screen. Row Level Security and storage policies let a signed-in player reach only their own rows and files.

create table if not exists public.saves (
  user_id    uuid not null references auth.users(id) on delete cascade,
  slot_id    text not null check (slot_id ~ '^[a-z0-9]{4,40}$'),
  meta       jsonb not null default '{}'::jsonb,
  size       integer,
  updated_at timestamptz not null default now(),
  primary key (user_id, slot_id)
);
alter table public.saves enable row level security;

drop policy if exists "saves: read own"   on public.saves;
drop policy if exists "saves: add own"    on public.saves;
drop policy if exists "saves: change own" on public.saves;
drop policy if exists "saves: remove own" on public.saves;
create policy "saves: read own"   on public.saves for select to authenticated using ((select auth.uid()) = user_id);
create policy "saves: add own"    on public.saves for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "saves: change own" on public.saves for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "saves: remove own" on public.saves for delete to authenticated using ((select auth.uid()) = user_id);

-- at most 10 careers per player
create or replace function public.saves_limit() returns trigger language plpgsql set search_path = '' as $$
begin
  if (select count(*) from public.saves where user_id = new.user_id) >= 10 then
    raise exception 'You can keep at most 10 careers in the cloud.';
  end if;
  return new;
end $$;
drop trigger if exists saves_limit on public.saves;
create trigger saves_limit before insert on public.saves for each row execute function public.saves_limit();

-- private bucket, 25 MB per file
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('saves', 'saves', false, 26214400, array['application/gzip'])
on conflict (id) do update set public = false, file_size_limit = 26214400, allowed_mime_types = array['application/gzip'];

drop policy if exists "save files: read own"   on storage.objects;
drop policy if exists "save files: add own"    on storage.objects;
drop policy if exists "save files: change own" on storage.objects;
drop policy if exists "save files: remove own" on storage.objects;
create policy "save files: read own"   on storage.objects for select to authenticated using (bucket_id = 'saves' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "save files: add own"    on storage.objects for insert to authenticated with check (bucket_id = 'saves' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "save files: change own" on storage.objects for update to authenticated using (bucket_id = 'saves' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "save files: remove own" on storage.objects for delete to authenticated using (bucket_id = 'saves' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- "Delete my account": the game first removes the player's save files, then calls this, which deletes the rows and the account.
create or replace function public.delete_my_account() returns void language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'Not signed in.'; end if;
  delete from public.saves where user_id = uid;
  delete from auth.users where id = uid;
end $$;
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
