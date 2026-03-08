-- #32: Add start_time and end_time to workouts
alter table workouts add column start_time timestamptz;
alter table workouts add column end_time timestamptz;

-- #33: Add source field to workouts
alter table workouts add column source text;
