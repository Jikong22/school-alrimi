# Spike: Supabase Auth + RLS — School-Alrimi (학교 알리미)

> Wave 0 spike. Validates that Supabase Auth + Row Level Security can host
> our user model (student/teacher/parent roles) and enforce the 만 14 세
> age gate at the database level, before we write any production app code.

**Status:** artifact complete. Live execution requires a real Supabase
project; see "Runbook" below for the 5-minute verification path.

---

## 1. Scope

This spike answers four questions, and only four:

1. Can Supabase Auth carry per-user `birthdate` through `raw_user_meta_data`
   so a server-side trigger can enforce the 만 14 세 gate?
2. Can we model `student | teacher | parent` roles in a single
   `user_roles` table with a SECURITY DEFINER helper, and is the
   RLS performance pattern `(select auth.uid())` + a STABLE
   `get_my_role()` enough for the Wave 1 query plan?
3. Can Row Level Security keep user A from reading or writing user B's
   data without a single explicit `WHERE user_id = $1` in app code?
4. Is the free tier (500 MB DB / 50 K MAU / 1 GB storage, 7-day
   inactivity pause) sufficient for the MVP we are about to build?

Answers (1)–(3) are validated by the SQL + scripts in this spike.
(4) is "yes" — see the "Free tier" section below.

---

## 2. Architecture

```
┌────────────────────────────────────────────────────────────────┐
│  Browser (Next.js client)                                       │
│  supabase.auth.signUp({                                         │
│    email, password,                                             │
│    options: { data: { birthdate, display_name, consent_privacy, │
│                       consent_marketing, consent_push } }       │
│  })                                                             │
└──────────────────────────┬─────────────────────────────────────┘
                           │ HTTPS
                           ▼
┌────────────────────────────────────────────────────────────────┐
│  Supabase Auth (GoTrue)                                         │
│  POST /auth/v1/signup  → INSERT INTO auth.users ...             │
└──────────────────────────┬─────────────────────────────────────┘
                           │ triggers fire (in this order):
                           ▼
   ┌──────────────────────────────────────────────────────┐
   │ BEFORE INSERT — public.check_age_on_signup()        │
   │   * reads NEW.raw_user_meta_data->>'birthdate'      │
   │   * RAISE EXCEPTION 'age_too_young' if < 14         │
   │   * stamps age_verified_at into raw_app_meta_data   │
   └──────────────────────────────────────────────────────┘
                           │
                           ▼
   ┌──────────────────────────────────────────────────────┐
   │ AFTER INSERT — public.handle_new_user()             │
   │   * INSERT INTO public.profiles (...)               │
   │   * INSERT INTO public.user_roles (..., 'student')  │
   └──────────────────────────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────────────┐
│  public schema                                                  │
│  profiles (1:1 auth.users)  — birthdate, display_name           │
│  user_roles (1:1 auth.users) — role enum + default 'student'    │
│  homework (sample owned-by-student table for RLS demo)          │
│                                                                 │
│  RLS enabled + FORCE on all three.                              │
│  (select auth.uid()) wraps the per-row auth check;             │
│   public.get_my_role() is SECURITY DEFINER + STABLE.            │
└────────────────────────────────────────────────────────────────┘
```

### Why a trigger on `auth.users` (not the Before-User-Created hook)?

Supabase ships a "Before User Created Hook" (an Edge Function-style
hook) that can return a deny decision for new signups. As of 2026 it
sits behind the **Advanced** add-on, which requires a paid plan.

A `BEFORE INSERT` trigger on `auth.users` with `RAISE EXCEPTION` is
free-tier compatible and gives us the same guarantee: if the
exception fires, the INSERT rolls back, no `auth.users` row is
created, the response to the GoTrue client is 400, and no JWT is
ever issued. This is the only path that lets us stay on the free
tier for the spike.

### Why `(select auth.uid())` and not `auth.uid()` directly?

Postgres re-evaluates a non-subquery scalar `auth.uid()` once **per
row** in an RLS policy. Wrapping it as a subquery makes the planner
materialize it once per query, which combined with the
`(user_id = ...)` index on the table yields an index scan instead
of a sequential scan. This is the Supabase-documented performance
pattern (see "RLS Performance" guide, 2024+).

### Why a SECURITY DEFINER `get_my_role()`?

`user_roles` has RLS enabled. That means a plain `SELECT role FROM
user_roles WHERE user_id = auth.uid()` would itself be subject to
RLS, leading to either an infinite recursion (policy → fn → policy)
or a chicken-and-egg bootstrap problem. Marking `get_my_role()` as
`SECURITY DEFINER` lets it bypass RLS for this single indexed
lookup. The `STABLE` mark tells the planner it is safe to call
once per query.

---

## 3. Deliverables

| Path                                             | Purpose                                       |
|--------------------------------------------------|-----------------------------------------------|
| `spike-supabase-auth.md`                         | This document.                                |
| `.env.local`                                     | Template with the two `NEXT_PUBLIC_*` keys.  |
| `spike-supabase-auth/supabase/01-schema.sql`     | Tables + enum + CHECK constraint.             |
| `spike-supabase-auth/supabase/02-triggers.sql`   | Age gate + new-user provisioning.             |
| `spike-supabase-auth/supabase/03-rls-policies.sql` | RLS policies + `get_my_role()`.            |
| `spike-supabase-auth/supabase/04-rls-test-harness.sql` | psql harness for RLS isolation.         |
| `spike-supabase-auth/supabase/99-cleanup.sql`   | Drop-everything (for re-runs).                |
| `spike-supabase-auth/scripts/test-01-signup-adult.{ps1,sh}`  | happy-path signup.            |
| `spike-supabase-auth/scripts/test-02-signup-underage.{ps1,sh}` | underage block.             |
| `spike-supabase-auth/scripts/test-03-rls-isolation.{ps1,sh}`   | cross-user RLS isolation.   |
| `.omo/evidence/task-3-signup.json`               | Expected 200 response shape.                  |
| `.omo/evidence/task-3-age-gate.json`             | Expected 400 response shape.                  |
| `.omo/evidence/task-3-rls.json`                  | Expected RLS isolation results.               |

---

## 4. Free tier (2026)

| Resource             | Free tier            | Wave 1 need          | Verdict          |
|----------------------|----------------------|----------------------|------------------|
| Database             | 500 MB               | ~10 MB               | OK               |
| Storage              | 1 GB                 | ~50 MB (icons)       | OK               |
| Auth MAU             | 50 000               | < 1 000 (pilot)      | OK               |
| Egress               | 5 GB / month         | < 100 MB             | OK               |
| Edge Function invocs | 500 K / month        | n/a                  | OK               |
| Inactivity pause     | 7 days               | daily NEIS pulls     | **WATCH**        |
| Active projects      | 2                    | 1 used               | OK               |

The 7-day inactivity pause is the only real risk: if no
authenticated request hits the DB for a week, the project pauses
and must be unpaused from the dashboard. We can avoid it cheaply
by hitting a no-op RPC from a cron job (e.g., GitHub Actions
scheduled at 03:00 KST daily). Documented as a follow-up for Wave 1
infra, not a blocker.

---

## 5. Runbook — verify in 5 minutes (human required)

A live Supabase project is required. The agent that produced this
spike does not have a Supabase account; the human owner of the
project should follow these steps.

1. **Create a project**
   <https://supabase.com/dashboard/new> → name it `school-alrimi-dev`
   → region `Northeast Asia (Seoul)` → free plan.
2. **Apply the SQL**
   Dashboard → SQL Editor → New query → paste contents of
   `01-schema.sql`, run. Repeat for `02-triggers.sql` and
   `03-rls-policies.sql`. Order matters: schema → triggers → RLS.
3. **Get the keys**
   Project Settings → API. Copy the URL and `anon` key into
   `.env.local` (replace placeholders).
4. **Run the three tests**
   ```bash
   export SUPABASE_URL=...
   export SUPABASE_ANON_KEY=...
   pwsh spike-supabase-auth/scripts/test-01-signup-adult.ps1
   pwsh spike-supabase-auth/scripts/test-02-signup-underage.ps1
   export SUPABASE_SERVICE_ROLE_KEY=...
   pwsh spike-supabase-auth/scripts/test-03-rls-isolation.ps1
   ```
5. **Confirm**
   - test-01 prints `PASS: signup returned access_token`.
   - test-02 prints `PASS: underage signup rejected with age_too_young`.
   - test-03 prints `PASS: RLS isolates userA from userB on public.homework`.
6. **Capture evidence**
   Pipe each script's stdout into `.omo/evidence/task-3-*.json`
   (trim the trailing PASS line; the body of the curl response is
   the real artifact).
7. **Tear down (optional)**
   `99-cleanup.sql` drops everything the spike created.

---

## 6. Findings (summary)

These are the bullet points that should land in
`.omo/notepads/school-alrimi/learnings.md`. The notepad write is
performed by this same task.

- **Age gate lives on the database, not the client.** A
  `BEFORE INSERT` trigger on `auth.users` reading
  `raw_user_meta_data->>'birthdate'` is the only free-tier path.
  The Before-User-Created Hook is a paid Advanced add-on.
- **No unified consent checkbox.** Per Korea's spam-prevention
  guidance (스팸방지법 7판), `consent_privacy`, `consent_marketing`,
  and `consent_push` must be independently toggled. The trigger
  also enforces `consent_privacy=true` server-side.
- **주민등록번호 is never collected.** Birthdate alone is enough to
  compute 만 14 세 and is not a resident-registration number.
- **RLS pattern:** wrap `auth.uid()` as `(select auth.uid())` so the
  planner can cache it per query.
- **Role lookup:** a `SECURITY DEFINER` + `STABLE` `get_my_role()`
  function gives the planner a single index lookup per query and
  sidesteps the bootstrap problem of "policy reads table whose
  policy reads...".
- **All RLS tables use `FORCE`** so even the table owner (service
  role aside) is subject to RLS. Service-role writes only happen
  via explicit admin scripts.
- **Free tier 7-day pause** is the only operational gotcha;
  mitigation: a daily no-op ping cron. Not a blocker for spike.

---

## 7. Open questions for Wave 1

- Should the teacher/parent role elevation happen in-DB (a service
  function called from an admin-only Edge Function) or via the
  Supabase dashboard? My recommendation: a service function, so
  the audit log is in our hands.
- Magic link vs password? The trigger does not care which auth
  method produced the user; either works. Wave 1: password first
  (simpler UX for high-schoolers on shared devices), magic link
  optional later.
- Email confirm enforcement. By default Supabase Auth sends a
  confirmation email and blocks login until clicked. For Wave 1
  we should keep this on (compliance). Document for parent role
  where re-confirmation may be required.
