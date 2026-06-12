# Test scripts — School-Alrimi Supabase auth spike

These scripts hit a real Supabase project's REST API. They are
**not** run during the spike artifact production (no live project
exists in the agent environment). They are committed so that the
human owner of the Supabase project can verify the schema in
under five minutes.

## Prerequisites

1. A Supabase project exists (free tier OK).
2. You have run the three SQL files in order against the project's
   `postgres` database (use the SQL editor in the dashboard or
   `psql` against the connection string).
3. `pwsh` (PowerShell 7+) is on PATH for `.ps1` scripts.
4. `bash` is on PATH (Git Bash, WSL, or Linux/macOS) for `.sh`.

## One-time setup

```bash
# In PowerShell 7+
$env:SUPABASE_URL       = "https://YOUR_PROJECT_REF.supabase.co"
$env:SUPABASE_ANON_KEY  = "eyJhbGciOi...your-anon-key..."

# Or in bash
export SUPABASE_URL="https://YOUR_PROJECT_REF.supabase.co"
export SUPABASE_ANON_KEY="eyJhbGciOi...your-anon-key..."
```

Both values come from:
**Supabase Dashboard → Project Settings → API**

## Run order (happy path)

1. `test-01-signup-adult.ps1` (or `.sh`)   — expect 200 + access_token
2. `test-02-signup-underage.ps1` (or `.sh`) — expect 400 + age_too_young
3. `test-03-rls-isolation.ps1` (or `.sh`)   — expect user A cannot see user B's row

Each script writes its captured response to stdout; capture to a
file and paste into `.omo/evidence/` once verified.
