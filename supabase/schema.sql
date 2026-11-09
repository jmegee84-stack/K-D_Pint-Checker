-- Pint Checker database. Paste this whole file into Supabase > SQL Editor > Run.

create table if not exists public.profiles (
  id                uuid primary key references auth.users(id) on delete cascade,
  name              text not null,
  email             text not null,
  marketing_consent boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create table if not exists public.ratings (
  user_id    uuid not null references auth.users(id) on delete cascade,
  beer_id    text not null,
  price      smallint check (price between 1 and 5),
  taste      smallint check (taste between 1 and 5),
  score      smallint check (score between 0 and 10),
  size       text check (size in ('third','half','full')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, beer_id)
);

-- Row level security: people can only see and change their own rows.
alter table public.profiles enable row level security;
alter table public.ratings  enable row level security;

drop policy if exists "own profile read"   on public.profiles;
drop policy if exists "own profile insert" on public.profiles;
drop policy if exists "own profile update" on public.profiles;
create policy "own profile read"   on public.profiles for select to authenticated using (auth.uid() = id);
create policy "own profile insert" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "own profile update" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "own ratings read"   on public.ratings;
drop policy if exists "own ratings insert" on public.ratings;
drop policy if exists "own ratings update" on public.ratings;
create policy "own ratings read"   on public.ratings for select to authenticated using (auth.uid() = user_id);
create policy "own ratings insert" on public.ratings for insert to authenticated with check (auth.uid() = user_id);
create policy "own ratings update" on public.ratings for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Public per-beer totals (no names or emails). Runs as the owner on purpose,
-- so everyone can see the averages without seeing anyone's individual ratings.
create or replace view public.beer_stats as
select beer_id,
       count(score)                         as n,
       round(avg(score)::numeric, 2)        as avg_score,
       count(*) filter (where size='third') as third,
       count(*) filter (where size='half')  as half,
       count(*) filter (where size='full')  as full
from public.ratings
group by beer_id;

grant select on public.beer_stats to anon, authenticated;
