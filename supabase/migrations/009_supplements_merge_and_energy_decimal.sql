-- #44: Change energy from integer to numeric to support decimal values (e.g. 3.5)
alter table daily_entries drop constraint daily_entries_energy_check;
alter table daily_entries alter column energy type numeric(3,1) using energy::numeric(3,1);
alter table daily_entries add constraint daily_entries_energy_check check (energy between 1 and 5);
