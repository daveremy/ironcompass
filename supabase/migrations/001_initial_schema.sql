-- IronCompass: Initial Schema
-- Tables: daily_entries, sleep, fasting, blood_pressure, workouts, meals, pullups, supplements

-- Daily entries: the anchor table. One row per day.
create table daily_entries (
  date date primary key,
  weight decimal(5,1),
  energy integer check (energy between 1 and 5),
  alcohol boolean default false,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Sleep: one row per day, linked to daily_entries.
create table sleep (
  date date primary key references daily_entries(date) on delete cascade,
  apple_score integer,
  oura_score integer,
  hours decimal(3,1),
  cpap boolean,
  mouth_tape boolean,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Fasting: one row per day.
create table fasting (
  date date primary key references daily_entries(date) on delete cascade,
  protocol text,
  window_start time,
  window_end time,
  compliant boolean,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Blood pressure: multiple readings per day possible.
create table blood_pressure (
  id uuid primary key default gen_random_uuid(),
  date date not null references daily_entries(date) on delete cascade,
  systolic integer not null,
  diastolic integer not null,
  time time,
  created_at timestamptz default now()
);

-- Workouts: multiple per day.
create table workouts (
  id uuid primary key default gen_random_uuid(),
  date date not null references daily_entries(date) on delete cascade,
  type text not null check (type in ('pickleball', 'strength', 'hike', 'golf', 'run', 'elliptical', 'mobility', 'sauna', 'other')),
  duration_min integer,
  distance_mi decimal(5,2),
  elevation_ft integer,
  calories integer,
  avg_hr integer,
  notes text,
  planned boolean default true,
  completed boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Meals: multiple per day.
create table meals (
  id uuid primary key default gen_random_uuid(),
  date date not null references daily_entries(date) on delete cascade,
  time time,
  name text,
  description text,
  protein_g decimal(5,1),
  fat_g decimal(5,1),
  carbs_g decimal(5,1),
  calories integer,
  notes text,
  created_at timestamptz default now()
);

-- Pullups: one row per day.
create table pullups (
  date date primary key references daily_entries(date) on delete cascade,
  total_count integer not null,
  sets integer[],
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Supplements: one row per day.
create table supplements (
  date date primary key references daily_entries(date) on delete cascade,
  supplements text[] not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes for common queries
create index idx_blood_pressure_date on blood_pressure(date);
create index idx_workouts_date on workouts(date);
create index idx_workouts_type on workouts(type);
create index idx_meals_date on meals(date);

-- Updated_at trigger function
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply updated_at triggers
create trigger set_updated_at before update on daily_entries
  for each row execute function update_updated_at();

create trigger set_updated_at before update on sleep
  for each row execute function update_updated_at();

create trigger set_updated_at before update on fasting
  for each row execute function update_updated_at();

create trigger set_updated_at before update on workouts
  for each row execute function update_updated_at();

create trigger set_updated_at before update on pullups
  for each row execute function update_updated_at();

create trigger set_updated_at before update on supplements
  for each row execute function update_updated_at();
