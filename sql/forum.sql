create table if not exists public.forum_posts (
  id bigint generated always as identity primary key,
  name text not null check (char_length(btrim(name)) between 1 and 40),
  message text not null check (char_length(btrim(message)) between 1 and 1000),
  created_at timestamptz not null default now()
);

alter table public.forum_posts enable row level security;

grant select on public.forum_posts to anon;
grant insert (name, message) on public.forum_posts to anon;
grant usage, select on sequence public.forum_posts_id_seq to anon;

drop policy if exists "Anyone can read forum posts" on public.forum_posts;
create policy "Anyone can read forum posts"
  on public.forum_posts for select
  to anon
  using (true);

drop policy if exists "Anyone can add forum posts" on public.forum_posts;
create policy "Anyone can add forum posts"
  on public.forum_posts for insert
  to anon
  with check (
    char_length(btrim(name)) between 1 and 40
    and char_length(btrim(message)) between 1 and 1000
  );






GamingLTU6960