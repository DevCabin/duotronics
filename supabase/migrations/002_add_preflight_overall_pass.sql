-- H2: distinguish preflight-pass vs preflight-fail rows.
alter table public.results
  add column if not exists preflight_overall_pass boolean not null default true;

create index if not exists results_overall_pass_idx
  on public.results (preflight_overall_pass);
