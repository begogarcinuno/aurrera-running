-- Aurrera Running: ejecutar en el SQL Editor de Supabase
create table if not exists public.running_entries (
 user_id uuid not null references auth.users(id) on delete cascade,
 day_key date not null,
 status text not null default 'pending' check (status in ('pending','done','skipped')),
 actual_km numeric(6,2) check (actual_km is null or (actual_km >= 0 and actual_km <= 100)),
 rpe smallint check (rpe is null or (rpe between 1 and 10)),
 note text not null default '' check (char_length(note) <= 1200),
 result_time text not null default '' check (char_length(result_time) <= 12),
 updated_at timestamptz not null default now(),
 primary key(user_id,day_key)
);
alter table public.running_entries enable row level security;
drop policy if exists "running_entries_select_own" on public.running_entries;
drop policy if exists "running_entries_insert_own" on public.running_entries;
drop policy if exists "running_entries_update_own" on public.running_entries;
drop policy if exists "running_entries_delete_own" on public.running_entries;
create policy "running_entries_select_own" on public.running_entries for select to authenticated using ((select auth.uid())=user_id);
create policy "running_entries_insert_own" on public.running_entries for insert to authenticated with check ((select auth.uid())=user_id);
create policy "running_entries_update_own" on public.running_entries for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy "running_entries_delete_own" on public.running_entries for delete to authenticated using ((select auth.uid())=user_id);
grant select,insert,update,delete on public.running_entries to authenticated;
create index if not exists running_entries_last_changed_idx on public.running_entries(user_id,updated_at desc);