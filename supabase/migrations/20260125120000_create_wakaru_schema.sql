/*
  migration: create wakaru schema
  purpose: initial schema for analyses, saved items, and reports
  affected tables: analyses, user_saved_items, analysis_reports
  notes:
    - rls is enabled on all new tables
    - policies are defined per role and per action (select/insert/update/delete)
*/

-- enable required extensions for search and uuid generation
create extension if not exists pg_trgm;
create extension if not exists pgcrypto;

-- main analysis results table (shared across users)
create table if not exists public.analyses (
  id uuid primary key default gen_random_uuid(),
  original_text text not null,
  translation text,
  data jsonb not null,
  text_hash text not null unique,
  is_featured boolean not null default false,
  created_at timestamptz not null default now()
);

-- join table for user saved items (personal library)
create table if not exists public.user_saved_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  analysis_id uuid not null references public.analyses(id) on delete restrict,
  saved_at timestamptz not null default now(),
  constraint user_saved_items_user_analysis_unique unique (user_id, analysis_id)
);

-- user-submitted reports for incorrect analyses
create table if not exists public.analysis_reports (
  id uuid primary key default gen_random_uuid(),
  analysis_id uuid not null references public.analyses(id) on delete restrict,
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reason text,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

-- indexes for search, deduplication, and library queries
create index if not exists analyses_original_text_gin_idx
  on public.analyses
  using gin (original_text gin_trgm_ops);

create index if not exists analyses_translation_gin_idx
  on public.analyses
  using gin (translation gin_trgm_ops);

create index if not exists user_saved_items_user_saved_at_idx
  on public.user_saved_items (user_id, saved_at desc);

create index if not exists user_saved_items_analysis_id_idx
  on public.user_saved_items (analysis_id);

-- enable row level security for all new tables
alter table public.analyses enable row level security;
alter table public.user_saved_items enable row level security;
alter table public.analysis_reports enable row level security;

-- rls policies for analyses
-- anon users can only read featured analyses
create policy analyses_select_anon
  on public.analyses
  for select
  to anon
  using (is_featured = true);

-- authenticated users can read featured analyses or ones they saved
create policy analyses_select_authenticated
  on public.analyses
  for select
  to authenticated
  using (
    is_featured = true
    or exists (
      select 1
      from public.user_saved_items
      where user_saved_items.analysis_id = analyses.id
        and user_saved_items.user_id = auth.uid()
    )
  );

-- analyses are managed by server-side logic; deny direct writes from clients
create policy analyses_insert_anon
  on public.analyses
  for insert
  to anon
  with check (false);

create policy analyses_insert_authenticated
  on public.analyses
  for insert
  to authenticated
  with check (false);

create policy analyses_update_anon
  on public.analyses
  for update
  to anon
  using (false)
  with check (false);

create policy analyses_update_authenticated
  on public.analyses
  for update
  to authenticated
  using (false)
  with check (false);

create policy analyses_delete_anon
  on public.analyses
  for delete
  to anon
  using (false);

create policy analyses_delete_authenticated
  on public.analyses
  for delete
  to authenticated
  using (false);

-- rls policies for user_saved_items
-- anon users cannot access saved items
create policy user_saved_items_select_anon
  on public.user_saved_items
  for select
  to anon
  using (false);

-- authenticated users can read only their own saved items
create policy user_saved_items_select_authenticated
  on public.user_saved_items
  for select
  to authenticated
  using (user_id = auth.uid());

-- authenticated users can save items for themselves only
create policy user_saved_items_insert_anon
  on public.user_saved_items
  for insert
  to anon
  with check (false);

create policy user_saved_items_insert_authenticated
  on public.user_saved_items
  for insert
  to authenticated
  with check (user_id = auth.uid());

-- updates are not part of the product flow; deny direct updates
create policy user_saved_items_update_anon
  on public.user_saved_items
  for update
  to anon
  using (false)
  with check (false);

create policy user_saved_items_update_authenticated
  on public.user_saved_items
  for update
  to authenticated
  using (false)
  with check (false);

-- authenticated users can delete only their own saved items
create policy user_saved_items_delete_anon
  on public.user_saved_items
  for delete
  to anon
  using (false);

create policy user_saved_items_delete_authenticated
  on public.user_saved_items
  for delete
  to authenticated
  using (user_id = auth.uid());

-- rls policies for analysis_reports
-- anon users cannot create or view reports
create policy analysis_reports_select_anon
  on public.analysis_reports
  for select
  to anon
  using (false);

create policy analysis_reports_insert_anon
  on public.analysis_reports
  for insert
  to anon
  with check (false);

create policy analysis_reports_update_anon
  on public.analysis_reports
  for update
  to anon
  using (false)
  with check (false);

create policy analysis_reports_delete_anon
  on public.analysis_reports
  for delete
  to anon
  using (false);

-- authenticated users can view and create their own reports
create policy analysis_reports_select_authenticated
  on public.analysis_reports
  for select
  to authenticated
  using (reporter_id = auth.uid());

create policy analysis_reports_insert_authenticated
  on public.analysis_reports
  for insert
  to authenticated
  with check (reporter_id = auth.uid());

-- updates/deletes are restricted to server-side moderation workflows
create policy analysis_reports_update_authenticated
  on public.analysis_reports
  for update
  to authenticated
  using (false)
  with check (false);

create policy analysis_reports_delete_authenticated
  on public.analysis_reports
  for delete
  to authenticated
  using (false);
