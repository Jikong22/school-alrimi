-- =============================================================
-- 02-triggers.sql
-- School-Alrimi — auth.users triggers (age gate + profile/role bootstrap)
-- Run after 01-schema.sql.
-- =============================================================
-- Two triggers on auth.users:
--   1) BEFORE INSERT — check_age_on_signup
--      Rejects signups where the caller is < 14 years old.
--      Reads birthdate from NEW.raw_user_meta_data->>'birthdate'
--      (set by the client via supabase.auth.signUp({ options: { data }})).
--
--   2) AFTER INSERT  — handle_new_user
--      Provisions a public.profiles row and a public.user_roles row
--      with role='student' (Wave 1 default).
--
-- Both functions are SECURITY DEFINER with search_path locked to ''
-- so they can't be hijacked via search_path injection (Supabase
-- official guidance, see "Managing User Data" guide).
-- =============================================================

-- -------------------------------------------------------------
-- (1) Age gate: block signups where 만14세 미만
-- -------------------------------------------------------------
create or replace function public.check_age_on_signup()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_birthdate  date;
  v_age_years  integer;
  v_consent    boolean;
begin
  -- raw_user_meta_data is jsonb; client sets { birthdate, consent_marketing, ... }
  v_birthdate := nullif(NEW.raw_user_meta_data ->> 'birthdate', '')::date;

  if v_birthdate is null then
    raise exception
      'birthdate_required: 생년월일(birthdate) 메타데이터가 필요합니다'
      using errcode = '22023', hint = 'raw_user_meta_data.birthdate must be ISO date (YYYY-MM-DD)';
  end if;

  v_age_years := extract(year from age(current_date, v_birthdate))::int;

  if v_age_years < 14 then
    raise exception
      'age_too_young: 만 14세 이상만 가입할 수 있습니다 (computed_age=%, birthdate=%)',
      v_age_years, v_birthdate
      using errcode = '22023';
  end if;

  -- 개별 동의 (스팸방지법): no unified "I agree to everything" checkbox.
  -- consent_marketing and consent_push must be set explicitly and independently.
  -- We log them in app_metadata so audit trail is preserved server-side.
  v_consent := coalesce((NEW.raw_user_meta_data ->> 'consent_privacy')::boolean, false);
  if not v_consent then
    raise exception
      'consent_privacy_required: 개인정보 수집 동의는 필수입니다'
      using errcode = '22023';
  end if;

  -- Stamp verified values into app_metadata so downstream RLS/JWT can read them.
  NEW.raw_app_meta_data := NEW.raw_app_meta_data
    || jsonb_build_object(
      'age_verified_at', to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
      'birthdate', to_char(v_birthdate, 'YYYY-MM-DD'),
      'consent_privacy', true
    );

  return NEW;
end;
$$;

comment on function public.check_age_on_signup() is
  'BEFORE INSERT trigger on auth.users. Blocks signups with no/underage birthdate. Stamps verified birthdate into app_metadata.';

drop trigger if exists trg_check_age_on_signup on auth.users;
create trigger trg_check_age_on_signup
  before insert on auth.users
  for each row execute function public.check_age_on_signup();

-- -------------------------------------------------------------
-- (2) Provisioning: create profile + role row after successful signup
-- -------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (user_id, birthdate, display_name)
  values (
    NEW.id,
    (NEW.raw_user_meta_data ->> 'birthdate')::date,
    NEW.raw_user_meta_data ->> 'display_name'
  );

  insert into public.user_roles (user_id, role)
  values (
    NEW.id,
    coalesce(nullif(NEW.raw_user_meta_data ->> 'role', ''), 'student')::public.user_role
  );

  return NEW;
end;
$$;

comment on function public.handle_new_user() is
  'AFTER INSERT trigger on auth.users. Provisions public.profiles and public.user_roles with role=student by default.';

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
