-- Add hot_tub to workout type enum
alter table workouts drop constraint workouts_type_check;
alter table workouts add constraint workouts_type_check
  check (type in ('pickleball', 'strength', 'hike', 'golf', 'run', 'elliptical', 'mobility', 'sauna', 'hot_tub', 'other'));
