alter table meals add column type text check (type in ('breakfast', 'lunch', 'dinner', 'snack'));
alter table meals add column items jsonb;
