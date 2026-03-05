-- Review fixes: nullable alcohol, updated_at on blood_pressure/meals,
-- CHECK constraints, RLS policies

-- 1. Make alcohol nullable (NULL = not logged, false = confirmed no alcohol)
alter table daily_entries alter column alcohol drop default;

-- 2. Add updated_at to blood_pressure and meals
alter table blood_pressure add column updated_at timestamptz default now();
alter table meals add column updated_at timestamptz default now();

create trigger set_updated_at before update on blood_pressure
  for each row execute function update_updated_at();

create trigger set_updated_at before update on meals
  for each row execute function update_updated_at();

-- 3. CHECK constraints for health value ranges
alter table daily_entries add constraint chk_weight check (weight > 0 and weight < 500);

alter table sleep add constraint chk_apple_score check (apple_score between 0 and 100);
alter table sleep add constraint chk_oura_score check (oura_score between 0 and 100);
alter table sleep add constraint chk_hours check (hours >= 0 and hours <= 24);

alter table blood_pressure add constraint chk_systolic check (systolic between 50 and 300);
alter table blood_pressure add constraint chk_diastolic check (diastolic between 30 and 200);

alter table workouts add constraint chk_duration check (duration_min >= 0);
alter table workouts add constraint chk_calories check (calories >= 0);

alter table meals add constraint chk_protein check (protein_g >= 0);
alter table meals add constraint chk_fat check (fat_g >= 0);
alter table meals add constraint chk_carbs check (carbs_g >= 0);
alter table meals add constraint chk_meal_calories check (calories >= 0);

alter table pullups add constraint chk_total_count check (total_count >= 0);

-- 4. RLS: enable row-level security, allow anon read-only, service_role full access
alter table daily_entries enable row level security;
alter table sleep enable row level security;
alter table fasting enable row level security;
alter table blood_pressure enable row level security;
alter table workouts enable row level security;
alter table meals enable row level security;
alter table pullups enable row level security;
alter table supplements enable row level security;

-- Anon can read all tables
create policy "anon_read" on daily_entries for select to anon using (true);
create policy "anon_read" on sleep for select to anon using (true);
create policy "anon_read" on fasting for select to anon using (true);
create policy "anon_read" on blood_pressure for select to anon using (true);
create policy "anon_read" on workouts for select to anon using (true);
create policy "anon_read" on meals for select to anon using (true);
create policy "anon_read" on pullups for select to anon using (true);
create policy "anon_read" on supplements for select to anon using (true);

-- Service role has full access (bypasses RLS by default, but explicit for clarity)
create policy "service_all" on daily_entries for all to service_role using (true) with check (true);
create policy "service_all" on sleep for all to service_role using (true) with check (true);
create policy "service_all" on fasting for all to service_role using (true) with check (true);
create policy "service_all" on blood_pressure for all to service_role using (true) with check (true);
create policy "service_all" on workouts for all to service_role using (true) with check (true);
create policy "service_all" on meals for all to service_role using (true) with check (true);
create policy "service_all" on pullups for all to service_role using (true) with check (true);
create policy "service_all" on supplements for all to service_role using (true) with check (true);
