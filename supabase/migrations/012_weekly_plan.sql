-- Weekly plan template table
-- Stores reusable weekly workout schedules and targets
create table weekly_plan (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'default',
  active boolean not null default true,
  schedule jsonb not null,
  targets jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Trigger for updated_at
create trigger set_updated_at before update on weekly_plan
  for each row execute function update_updated_at();

-- RLS
alter table weekly_plan enable row level security;
create policy "anon can read weekly_plan" on weekly_plan for select to anon using (true);
create policy "anon can insert weekly_plan" on weekly_plan for insert to anon with check (true);
create policy "anon can update weekly_plan" on weekly_plan for update to anon using (true);
create policy "anon can delete weekly_plan" on weekly_plan for delete to anon using (true);

-- Service role full access (implicit via RLS bypass)
