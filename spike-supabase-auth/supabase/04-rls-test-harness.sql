-- =============================================================
-- 04-rls-test-harness.sql
-- School-Alrimi — RLS isolation tests (run in psql with two roles)
-- =============================================================
-- This file does NOT assert against a live Supabase project; it's
-- the manual harness for verifying RLS via psql when a real
-- project is available. See scripts/README.md for the runbook.
--
-- Approach:
--   1. Create two test users via the Supabase Dashboard (or
--      Admin API). Save their UUIDs as :user_a and :user_b.
--   2. Insert one homework row owned by :user_a and one owned by :user_b.
--   3. SET ROLE authenticated; SET request.jwt.claim.sub = '<uuid>';
--      Then SELECT/INSERT/UPDATE/DELETE and confirm the row counts.
-- =============================================================

-- Pre-condition: run 01..03 first.

-- 1. Seed data (run as service_role, not as authenticated)
-- Replace the UUIDs with real test user IDs created via Dashboard.
-- insert into public.homework (student_id, title, body) values
--   ('11111111-1111-1111-1111-111111111111', 'A의 숙제', 'A 본문'),
--   ('22222222-2222-2222-2222-222222222222', 'B의 숙제', 'B 본문');

-- 2. RLS isolation: switch to user A and confirm they see only their row.
-- set local role authenticated;
-- select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
-- select count(*) as rows_visible_to_a from public.homework;
--   -- expect: 1 (only A's row)
--
-- 3. Switch to user B and confirm they see only their row.
-- set local role authenticated;
-- select set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', true);
-- select count(*) as rows_visible_to_b from public.homework;
--   -- expect: 1 (only B's row)

-- 4. User A cannot INSERT a row owned by B (WITH CHECK fails).
-- insert into public.homework (student_id, title)
--   values ('22222222-2222-2222-2222-222222222222', '위조된 B의 숙제');
--   -- expect: ERROR: new row violates row-level security policy

-- 5. get_my_role() returns the caller's role.
-- select public.get_my_role();  -- expect: student

-- 6. anon (unauthenticated) cannot read.
-- set local role anon;
-- select count(*) from public.profiles;
--   -- expect: 0 (RLS denies)
