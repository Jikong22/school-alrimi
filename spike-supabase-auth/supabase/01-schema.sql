-- =============================================================
-- 01-schema.sql
-- School-Alrimi (학교 알리미) — Supabase Auth + Roles schema
-- Run order: this file FIRST, then 02-triggers.sql, then 03-rls-policies.sql
-- =============================================================
-- Conventions:
--   * snake_case tables, singular names (profiles, user_roles)
--   * public schema for app data; auth schema is managed by Supabase
--   * All FKs to auth.users(id) use ON DELETE CASCADE
--   * RLS is enabled in 03-rls-policies.sql (after policies are defined)
-- =============================================================

-- Required Supabase extension for gen_random_uuid() (uuid v4)
create extension if not exists "pgcrypto";

-- -------------------------------------------------------------
-- public.profiles
-- 1:1 with auth.users. Holds demographic data we never want in
-- auth schema (birthdate, display name, school affiliation, etc.)
-- -------------------------------------------------------------
create table if not exists public.profiles (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  birthdate    date not null,
  display_name text,
  school_code  text,             -- NEIS school code (optional, filled later)
  grade        smallint,         -- 1..3 (high school grades)
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  -- Server-side defensive check. The trigger in 02-triggers.sql is the
  -- primary gate; this is a belt-and-suspenders for direct INSERTs.
  constraint profiles_age_14_plus check (
    extract(year from age(current_date, birthdate)) >= 14
  )
);

comment on table public.profiles is
  'Per-user demographic data. RLS: each user can SELECT/UPDATE only their own row.';

-- -------------------------------------------------------------
-- public.user_roles
-- One row per user. role defaults to ''student'' for Wave 1 (high school).
-- -------------------------------------------------------------
create type public.user_role as enum ('student', 'teacher', 'parent');

create table if not exists public.user_roles (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  role       public.user_role not null default 'student',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.user_roles is
  'Single role per user. RLS: each user can SELECT their own role only.';

-- -------------------------------------------------------------
-- public.homework  (example "student-owned" table for RLS demo)
-- Wave 1 will add real tables; this one exists so the RLS spike
-- can prove cross-user isolation.
-- -------------------------------------------------------------
create table if not exists public.homework (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  body        text,
  due_date    date,
  created_at  timestamptz not null default now()
);

comment on table public.homework is
  'Sample student-owned table. RLS: students see/modify only their own rows.';
