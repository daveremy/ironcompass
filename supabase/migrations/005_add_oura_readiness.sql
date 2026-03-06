-- Add Oura readiness score and sleep HR/HRV to sleep table
alter table sleep add column oura_readiness integer check (oura_readiness between 0 and 100);
alter table sleep add column avg_hr_sleep integer;
alter table sleep add column avg_hrv integer;
