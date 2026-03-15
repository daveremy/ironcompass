-- Unified Metrics System (#77, #78)
-- Replaces supplements + custom_metrics with a single metrics table
-- backed by a metric_definitions discriminator table.

-- Discriminator table
create table metric_definitions (
  name text primary key,
  display_name text not null,
  type text not null check (type in ('numeric', 'tag')),
  unit text,
  category text not null,
  created_at timestamptz default now()
);

alter table metric_definitions enable row level security;
create policy "anon_read" on metric_definitions for select to anon using (true);
create policy "service_all" on metric_definitions for all to service_role using (true) with check (true);

-- Unified metrics table
create table metrics (
  id uuid primary key default gen_random_uuid(),
  date date not null references daily_entries(date) on delete cascade,
  metric_name text not null references metric_definitions(name),
  numeric_value decimal(10,2),
  text_value text,
  unit text,
  category text not null,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_metrics_date on metrics(date);
create index idx_metrics_name_date on metrics(metric_name, date);
create index idx_metrics_category_date on metrics(category, date);

-- Tag dedup: prevent duplicate tag entries per day per category
-- Only applies to tag rows (numeric_value IS NULL). Numeric metrics allow multiples.
-- Includes category so the same name can be both a supplement and a sleep_tag.
create unique index idx_metrics_tag_unique on metrics(date, metric_name, category) where numeric_value is null;

create trigger set_updated_at before update on metrics
  for each row execute function update_updated_at();

alter table metrics enable row level security;
create policy "anon_read" on metrics for select to anon using (true);
create policy "service_all" on metrics for all to service_role using (true) with check (true);

-- Data migration: supplements → metrics
-- Step 1: Create metric_definitions for all existing supplement names
insert into metric_definitions (name, display_name, type, category)
select distinct
  lower(unnest(s.supplements)),
  initcap(replace(unnest(s.supplements), '-', ' ')),
  'tag',
  'supplement'
from supplements s
on conflict (name) do nothing;

-- Step 2: Explode supplement arrays into individual metrics rows
insert into metrics (date, metric_name, category)
select s.date, lower(supp), 'supplement'
from supplements s, unnest(s.supplements) as supp
on conflict do nothing;

-- Data migration: custom_metrics → metrics
-- Step 3: Create metric_definitions for all existing custom metric names
insert into metric_definitions (name, display_name, type, unit, category)
select distinct
  cm.metric_name,
  initcap(replace(cm.metric_name, '-', ' ')),
  'numeric',
  cm.unit,
  'custom'
from custom_metrics cm
on conflict (name) do nothing;

-- Step 4: Copy custom_metrics rows into metrics (preserving UUIDs)
insert into metrics (id, date, metric_name, numeric_value, unit, category, notes, created_at, updated_at)
select
  cm.id,
  cm.date,
  cm.metric_name,
  cm.value,
  cm.unit,
  'custom',
  cm.notes,
  cm.created_at,
  cm.updated_at
from custom_metrics cm
on conflict (id) do nothing;

-- Old tables NOT dropped — kept for manual recovery if needed
