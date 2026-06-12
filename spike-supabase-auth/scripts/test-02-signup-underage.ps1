#!/usr/bin/env pwsh
# test-02-signup-underage.ps1
# School-Alrimi — underage signup. Expect 400 + age_too_young error.

$ErrorActionPreference = "Stop"

if (-not $env:SUPABASE_URL -or -not $env:SUPABASE_ANON_KEY) {
  throw "Set SUPABASE_URL and SUPABASE_ANON_KEY first."
}

$stamp = Get-Date -Format "yyyyMMddHHmmss"
$email = "minor-$stamp@school-alrimi.test"

# 2020-01-01 -> 만 6세 (as of 2026). Must fail age gate.
$body = @{
  email    = $email
  password = "Test1234!Aa"
  options  = @{
    data = @{
      birthdate        = "2020-01-01"
      display_name     = "미성년테스트"
      consent_privacy  = $true
    }
  }
} | ConvertTo-Json -Depth 6 -Compress

$headers = @{
  "apikey"        = $env:SUPABASE_ANON_KEY
  "Content-Type"  = "application/json"
}

Write-Host "POST $env:SUPABASE_URL/auth/v1/signup  email=$email (underage)"
try {
  $response = Invoke-RestMethod `
    -Method POST `
    -Uri "$env:SUPABASE_URL/auth/v1/signup" `
    -Headers $headers `
    -Body $body `
    -StatusCodeVariable status

  # Supabase Auth returns 400 with error body when the trigger raises an exception.
  Write-Host "UNEXPECTED: got HTTP $status" -ForegroundColor Red
  $response | ConvertTo-Json -Depth 6
  exit 1
}
catch {
  $status = $_.Exception.Response.StatusCode.value__
  $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
  $bodyText = $reader.ReadToEnd()
  Write-Host "HTTP $status (expected)"
  Write-Host $bodyText

  if ($status -ne 400) { throw "Expected 400, got $status" }
  if ($bodyText -notmatch "age_too_young") {
    throw "Expected 'age_too_young' in error body, got: $bodyText"
  }
}

Write-Host "`nPASS: underage signup rejected with age_too_young" -ForegroundColor Green
