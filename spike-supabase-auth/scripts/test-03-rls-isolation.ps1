#!/usr/bin/env pwsh
# test-03-rls-isolation.ps1
# School-Alrimi — RLS cross-user isolation.
# Requires two already-signed-up users (run test-01-signup-adult twice).
# Inserts one homework row as user A via service_role (bypasses RLS),
# then queries as user A and as user B, expecting A=1 / B=0.

$ErrorActionPreference = "Stop"

if (-not $env:SUPABASE_URL -or -not $env:SUPABASE_ANON_KEY) {
  throw "Set SUPABASE_URL and SUPABASE_ANON_KEY first."
}
if (-not $env:SUPABASE_SERVICE_ROLE_KEY) {
  throw "Set SUPABASE_SERVICE_ROLE_KEY (Dashboard -> Settings -> API -> service_role) for seeding test data."
}

# 1) Sign up two adults.
function New-AdultUser([string]$tag) {
  $stamp = Get-Date -Format "yyyyMMddHHmmss"
  $email = "rls-$tag-$stamp@school-alrimi.test"
  $body  = @{
    email = $email; password = "Test1234!Aa"
    options = @{ data = @{
      birthdate = "2008-01-01"; display_name = "RLS-$tag"; consent_privacy = $true
    } }
  } | ConvertTo-Json -Depth 6 -Compress
  $resp = Invoke-RestMethod -Method POST `
    -Uri "$env:SUPABASE_URL/auth/v1/signup" `
    -Headers @{ "apikey" = $env:SUPABASE_ANON_KEY; "Content-Type" = "application/json" } `
    -Body $body
  return [pscustomobject]@{
    id           = $resp.user.id
    email        = $email
    access_token = $resp.access_token
  }
}

$userA = New-AdultUser "A"
$userB = New-AdultUser "B"
Write-Host "userA id=$($userA.id)"
Write-Host "userB id=$($userB.id)"

# 2) Seed: insert one homework row owned by userA using service_role.
$serviceHeaders = @{
  "apikey"        = $env:SUPABASE_SERVICE_ROLE_KEY
  "Authorization" = "Bearer $env:SUPABASE_SERVICE_ROLE_KEY"
  "Content-Type"  = "application/json"
}
$seed = @{
  student_id = $userA.id
  title      = "A only"
  body       = "rls isolation test row"
} | ConvertTo-Json -Compress

Invoke-RestMethod -Method POST `
  -Uri "$env:SUPABASE_URL/rest/v1/homework" `
  -Headers $serviceHeaders `
  -Body $seed | Out-Null
Write-Host "Seeded 1 homework row owned by userA."

# 3) As userA: SELECT — expect 1 row.
$userAHeaders = @{
  "apikey"        = $env:SUPABASE_ANON_KEY
  "Authorization" = "Bearer $($userA.access_token)"
}
$rowsA = Invoke-RestMethod -Method GET `
  -Uri "$env:SUPABASE_URL/rest/v1/homework?select=id,title" `
  -Headers $userAHeaders
Write-Host "userA sees: $($rowsA.Count) row(s)"
if ($rowsA.Count -ne 1) { throw "RLS FAIL: userA expected to see 1 row, saw $($rowsA.Count)" }

# 4) As userB: SELECT — expect 0 rows.
$userBHeaders = @{
  "apikey"        = $env:SUPABASE_ANON_KEY
  "Authorization" = "Bearer $($userB.access_token)"
}
$rowsB = Invoke-RestMethod -Method GET `
  -Uri "$env:SUPABASE_URL/rest/v1/homework?select=id,title" `
  -Headers $userBHeaders
Write-Host "userB sees: $($rowsB.Count) row(s)"
if ($rowsB.Count -ne 0) { throw "RLS FAIL: userB expected to see 0 rows, saw $($rowsB.Count)" }

# 5) userB attempts INSERT as userA — expect 401/403 (RLS WITH CHECK fails).
$evil = @{
  student_id = $userA.id
  title      = "evil"
} | ConvertTo-Json -Compress
try {
  Invoke-RestMethod -Method POST `
    -Uri "$env:SUPABASE_URL/rest/v1/homework" `
    -Headers $userBHeaders `
    -Body $evil | Out-Null
  throw "RLS FAIL: userB was able to INSERT a row with student_id=userA.id"
} catch {
  $status = $_.Exception.Response.StatusCode.value__
  Write-Host "userB INSERT attempt rejected with HTTP $status (expected 401/403)"
  if ($status -ne 401 -and $status -ne 403) {
    throw "Expected 401/403, got $status"
  }
}

Write-Host "`nPASS: RLS isolates userA from userB on public.homework" -ForegroundColor Green
