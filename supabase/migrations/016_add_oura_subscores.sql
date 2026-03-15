-- Add Oura sleep sub-scores as structured columns
alter table sleep add column oura_deep integer check (oura_deep between 0 and 100);
alter table sleep add column oura_efficiency integer check (oura_efficiency between 0 and 100);
alter table sleep add column oura_latency integer check (oura_latency between 0 and 100);
alter table sleep add column oura_rem integer check (oura_rem between 0 and 100);
alter table sleep add column oura_restfulness integer check (oura_restfulness between 0 and 100);
alter table sleep add column oura_timing integer check (oura_timing between 0 and 100);
alter table sleep add column oura_total integer check (oura_total between 0 and 100);
