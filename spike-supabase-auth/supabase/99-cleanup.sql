-- =============================================================
-- 99-cleanup.sql
-- DROP everything created by 01..03. Use this to tear down the
-- spike for re-runs. Requires the postgres role (service_role).
-- =============================================================

drop trigger if exists trg_check_age_on_signup on auth.users;
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.check_age_on_signup();
drop function if exists public.handle_new_user();
drop function if exists public.get_my_role();

drop table if exists public.homework;
drop table if exists public.user_roles;
drop table if exists public.profiles;
drop type  if exists public.user_role;
