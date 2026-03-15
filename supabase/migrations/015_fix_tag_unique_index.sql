-- Fix: include category in tag uniqueness constraint
-- so the same metric_name can be both a supplement and a sleep_tag on the same date.
drop index if exists idx_metrics_tag_unique;
create unique index idx_metrics_tag_unique on metrics(date, metric_name, category) where numeric_value is null;
