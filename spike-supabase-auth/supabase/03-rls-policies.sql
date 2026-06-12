-- =============================================================
-- 03-rls-policies.sql
-- School-Alrimi — Row Level Security policies + get_my_role()
-- Run after 01-schema.sql AND 02-triggers.sql.
-- =============================================================
-- Key design choices:
--   * (select auth.uid()) — wraps auth.uid() in a subquery so Postgres
--     caches the result once per query and reuses it for every row
--     (Supabase RLS performance best practice, 2024+).
--   * get_my_role() is SECURITY DEFINER + STABLE so the optimizer
--     can call it once per query and the planner can index-scan.
--   * All tables get RLS ENABLED + FORCE (so even table owner via
--     PostgREST is subject to RLS, unless they are postgres role).
-- =============================================================

-- -------------------------------------------------------------
-- Helper: SECURITY DEFINER function returning the caller's role.
-- Wraps a single index lookup on user_roles.user_id (PK).
-- -------------------------------------------------------------
create or replace function public.get_my_role()
returns public.user_role
language sql
stable
security definer
set search_path = ''
as $$
  select role
  from public.user_roles
  where user_id = (select auth.uid())
  limit 1;
$$;

comment on function public.get_my_role() is
  'Returns the call''s user_role. SECURITY DEFINER + STABLE so it is called once per query and the result is cached by the planner.';

grant execute on function public.get_my_role() to authenticated, anon;

-- =============================================================
-- public.profiles
-- =============================================================
alter table public.profiles enable row level security;
alter table public.profiles force row level security;

-- SELECT: a user can read only their own profile.
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own
  on public.profiles
  for select
  to authenticated
  using (user_id = (select auth.uid()));

-- UPDATE: a user can update only their own profile. (Insert is done by trigger.)
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own
  on public.profiles
  for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- DELETE: not allowed from client. Account deletion is a service-role op.
-- (intentionally no policy — denied by RLS)

-- =============================================================
-- public.user_roles
-- =============================================================
alter table public.user_roles enable row level security;
alter table public.user_roles force row level security;

-- SELECT: a user can read only their own role.
-- Teachers/parents can be granted broader SELECT later via additional policies.
drop policy if exists user_roles_select_own on public.user_roles;
create policy user_roles_select_own
  on public.user_roles
  for select
  to authenticated
  using (user_id = (select auth.uid()));

-- INSERT/UPDATE/DELETE: only service_role (postgres) writes these.
-- (intentionally no policies — denied by RLS for authenticated/anon)

-- =============================================================
-- public.homework  (sample student-owned table for RLS demo)
-- =============================================================
alter table public.homework enable row level security;
alter table public.homework force row level security;

drop policy if exists homework_select_own on public.homework;
create policy homework_select_own
  on public.homework
  for select
  to authenticated
  using (student_id = (select auth.uid()));

drop policy if exists homework_insert_own on public.homework;
create policy homework_insert_own
  on public.homework
  for insert
  to authenticated
  with check (student_id = (select auth.uid()));

drop policy if exists homework_update_own on public.homework;
create policy homework_update_own
  on public.homework
  for update
  to authenticated
  using (student_id = (select auth.uid()))
  with check (student_id = (select auth.uid()));

drop policy if exists homework_delete_own on public.homework;
create policy homework_delete_own
  on public.homework
  for delete
  to authenticated
  using (student_id = (select auth.uid()));
