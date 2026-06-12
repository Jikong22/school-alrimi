#!/usr/bin/env pwsh
# test-01-signup-adult.ps1
# School-Alrimi — happy-path signup (만14세 이상). Expect 200 + access_token.
# Requires: $env:SUPABASE_URL, $env:SUPABASE_ANON_KEY

$ErrorActionPreference = "Stop"

if (-not $env:SUPABASE_URL -or -not $env:SUPABASE_ANON_KEY) {
  throw "Set SUPABASE_URL and SUPABASE_ANON_KEY first."
}

# Use a unique email each run so the test is repeatable.
$stamp = Get-Date -Format "yyyyMMddHHmmss"
$email = "adult-$stamp@school-alrimi.test"

# 2008-01-01 -> 만 18세 (as of 2026). Must pass age gate.
$body = @{
  email    = $email
  password = "Test1234!Aa"
  options  = @{
    data = @{
      birthdate        = "2008-01-01"
      display_name     = "성인테스트"
      consent_privacy  = $true
    }
  }
} | ConvertTo-Json -Depth 6 -Compress

$headers = @{
  "apikey"        = $env:SUPABASE_ANON_KEY
  "Content-Type"  = "application/json"
}

Write-Host "POST $env:SUPABASE_URL/auth/v1/signup  email=$email"
$response = Invoke-RestMethod `
  -Method POST `
  -Uri "$env:SUPABASE_URL/auth/v1/signup" `
  -Headers $headers `
  -Body $body `
  -StatusCodeVariable status

Write-Host "HTTP $status"
$response | ConvertTo-Json -Depth 6

if ($status -ne 200) { throw "Expected 200, got $status" }
if (-not $response.access_token) { throw "Response missing access_token" }

Write-Host "`nPASS: signup returned access_token for $email" -ForegroundColor Green
Write-Host "Save this access_token for follow-up tests."
