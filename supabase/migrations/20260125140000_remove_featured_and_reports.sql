drop table if exists public.analysis_reports;
alter table public.analyses drop column if exists is_featured;
