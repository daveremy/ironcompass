-- Body composition: one reading per day from Hume Body Pod (via Apple Health sync or manual entry)
create table body_composition (
  date date primary key references daily_entries(date) on delete cascade,
  body_fat_pct decimal(4,1) check (body_fat_pct between 1 and 60),
  muscle_mass_lbs decimal(5,1) check (muscle_mass_lbs > 0),
  bone_mass_lbs decimal(4,1) check (bone_mass_lbs > 0),
  body_water_pct decimal(4,1) check (body_water_pct between 10 and 90),
  visceral_fat integer check (visceral_fat between 1 and 30),
  bmr integer check (bmr > 0),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Updated_at trigger
create trigger set_updated_at before update on body_composition
  for each row execute function update_updated_at();

-- RLS: anon read-only, service_role full access
alter table body_composition enable row level security;
create policy "anon_read" on body_composition for select to anon using (true);
create policy "service_all" on body_composition for all to service_role using (true) with check (true);
