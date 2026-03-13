-- Change default for planned from true to null
-- Previously, all logged workouts defaulted to planned=true, which broke
-- plan-vs-actual matching (every workout appeared to be part of the plan)
alter table workouts alter column planned set default null;

-- Backfill existing workouts: set planned=null where it was set by the old default
-- Only update rows that were not explicitly planned (source != 'plan')
update workouts set planned = null where planned = true and (source is null or source != 'plan');
