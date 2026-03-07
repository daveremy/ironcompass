create table custom_metrics (
  id uuid primary key default gen_random_uuid(),
  date date not null references daily_entries(date) on delete cascade,
  metric_name text not null check (length(metric_name) > 0),
  value decimal(10,2) not null,
  unit text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_custom_metrics_date on custom_metrics(date);
create index idx_custom_metrics_name_date on custom_metrics(metric_name, date);

create trigger set_updated_at before update on custom_metrics
  for each row execute function update_updated_at();

alter table custom_metrics enable row level security;
create policy "anon_read" on custom_metrics for select to anon using (true);
create policy "service_all" on custom_metrics for all to service_role using (true) with check (true);
