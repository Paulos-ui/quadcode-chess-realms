-- ─────────────────────────────────────────────────────────────────────────────
-- Jayking's Chess Realms — initial schema
--
-- Run this once in your Supabase project (SQL Editor → New query → paste → Run).
-- After running, the app can write to the `profiles` and `games` tables.
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── profiles ────────────────────────────────────────────────────────────────
-- One row per authenticated user. Linked 1:1 to auth.users via the id column.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 32),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-create a profile row when a new user signs up.
-- Pulls display_name from the user's signup metadata if present.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data->>'display_name', ''),
      split_part(new.email, '@', 1),
      'Player'
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS on profiles
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ─── games ───────────────────────────────────────────────────────────────────
-- Every completed game played by a logged-in user.

create table if not exists public.games (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  opponent_type text not null check (opponent_type in ('ai', 'friend')),
  opponent_label text not null,
  opponent_skill smallint check (opponent_skill is null or opponent_skill between 0 and 5),
  player_color text not null check (player_color in ('w', 'b')),
  winner text not null check (winner in ('w', 'b', 'draw')),
  result_reason text not null check (result_reason in (
    'checkmate', 'stalemate', 'draw', 'resign', 'insufficient', 'threefold'
  )),
  pgn text not null,
  move_count integer not null default 0,
  played_at timestamptz not null default now()
);

create index if not exists games_user_played_at_idx
  on public.games (user_id, played_at desc);

-- RLS on games
alter table public.games enable row level security;

drop policy if exists "games_select_own" on public.games;
create policy "games_select_own"
  on public.games for select
  using (auth.uid() = user_id);

drop policy if exists "games_insert_own" on public.games;
create policy "games_insert_own"
  on public.games for insert
  with check (auth.uid() = user_id);

drop policy if exists "games_delete_own" on public.games;
create policy "games_delete_own"
  on public.games for delete
  using (auth.uid() = user_id);
