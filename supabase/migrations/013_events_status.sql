alter table events
  add column if not exists status text not null default 'scheduled';

alter table events
  drop constraint if exists events_status_check;

alter table events
  add constraint events_status_check
  check (status in ('scheduled', 'canceled'));
