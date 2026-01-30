/*
  migration: disable RLS temporarily for development
  purpose: Remove RLS restrictions until authentication is implemented
  affected tables: analyses, user_saved_items
  notes:
    - This is a temporary measure for development
    - RLS should be re-enabled when authentication is implemented
    - All policies are dropped and RLS is disabled on all tables
*/

-- Drop all RLS policies for analyses table
drop policy if exists analyses_select_anon on public.analyses;
drop policy if exists analyses_select_authenticated on public.analyses;
drop policy if exists analyses_insert_anon on public.analyses;
drop policy if exists analyses_insert_authenticated on public.analyses;
drop policy if exists analyses_update_anon on public.analyses;
drop policy if exists analyses_update_authenticated on public.analyses;
drop policy if exists analyses_delete_anon on public.analyses;
drop policy if exists analyses_delete_authenticated on public.analyses;

-- Drop all RLS policies for user_saved_items table
drop policy if exists user_saved_items_select_anon on public.user_saved_items;
drop policy if exists user_saved_items_select_authenticated on public.user_saved_items;
drop policy if exists user_saved_items_insert_anon on public.user_saved_items;
drop policy if exists user_saved_items_insert_authenticated on public.user_saved_items;
drop policy if exists user_saved_items_update_anon on public.user_saved_items;
drop policy if exists user_saved_items_update_authenticated on public.user_saved_items;
drop policy if exists user_saved_items_delete_anon on public.user_saved_items;
drop policy if exists user_saved_items_delete_authenticated on public.user_saved_items;

-- Disable RLS on all tables
alter table public.analyses disable row level security;
alter table public.user_saved_items disable row level security;
