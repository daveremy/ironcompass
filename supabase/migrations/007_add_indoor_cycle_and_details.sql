-- #34: Add indoor_cycle workout type
alter table workouts drop constraint workouts_type_check;
alter table workouts add constraint workouts_type_check
  check (type in ('pickleball', 'strength', 'hike', 'golf', 'run', 'elliptical', 'mobility', 'sauna', 'hot_tub', 'indoor_cycle', 'other'));

-- #35: Add details JSONB column for type-specific data
alter table workouts add column details jsonb;
