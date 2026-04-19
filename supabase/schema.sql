-- PERSON 3 — Run this in your Supabase SQL editor to set up the database.

create table bottles (
  id            uuid primary key default gen_random_uuid(),
  message       text not null,
  author_name   text default 'Anonymous',
  start_lat     float not null,
  start_lng     float not null,
  current_lat   float not null,
  current_lng   float not null,
  path          jsonb default '[]'::jsonb,
  status        text default 'drifting' check (status in ('drifting', 'garbage_patch', 'ashore')),
  dropped_at    timestamptz default now(),
  days_drifted  float default 0,
  destination   text
);

-- Enable realtime so useBottles.ts receives live updates
alter publication supabase_realtime add table bottles;

-- Optional: allow anonymous inserts (for the hackathon, no auth)
create policy "Anyone can drop a bottle"
  on bottles for insert
  with check (true);

create policy "Anyone can read bottles"
  on bottles for select
  using (true);

create policy "Anyone can update bottles"
  on bottles for update
  using (true);

alter table bottles enable row level security;
