-- Create workout_types reference table to replace CHECK constraint.
-- Seed data exactly matches the current CHECK constraint values in 007,
-- so no orphaned rows exist.

create table workout_types (
  name text primary key,
  display_name text not null,
  color text not null
);

insert into workout_types (name, display_name, color) values
  ('pickleball',   'Pickleball',    '#22c55e'),
  ('strength',     'Strength',      '#3b82f6'),
  ('hike',         'Hike',          '#f97316'),
  ('golf',         'Golf',          '#a855f7'),
  ('run',          'Run',           '#ef4444'),
  ('elliptical',   'Elliptical',    '#06b6d4'),
  ('mobility',     'Mobility',      '#eab308'),
  ('sauna',        'Sauna',         '#f59e0b'),
  ('hot_tub',      'Hot Tub',       '#ec4899'),
  ('indoor_cycle', 'Indoor Cycle',  '#f43f5e'),
  ('other',        'Other',         '#737373');

-- Replace CHECK constraint with FK
alter table workouts drop constraint workouts_type_check;
alter table workouts add constraint workouts_type_fk
  foreign key (type) references workout_types(name);

-- RLS: anon can read, service_role can do anything
alter table workout_types enable row level security;
create policy "anon can read workout_types" on workout_types for select to anon using (true);
create policy "service_role full access on workout_types" on workout_types for all to service_role using (true) with check (true);
