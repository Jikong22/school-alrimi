#!/usr/bin/env bash
# test-01-signup-adult.sh
# School-Alrimi — happy-path signup. Expect 200 + access_token.
# Requires: $SUPABASE_URL, $SUPABASE_ANON_KEY
set -euo pipefail

: "${SUPABASE_URL:?Set SUPABASE_URL first}"
: "${SUPABASE_ANON_KEY:?Set SUPABASE_ANON_KEY first}"

STAMP=$(date +%Y%m%d%H%M%S)
EMAIL="adult-${STAMP}@school-alrimi.test"

BODY=$(cat <<JSON
{
  "email": "${EMAIL}",
  "password": "Test1234!Aa",
  "options": {
    "data": {
      "birthdate": "2008-01-01",
      "display_name": "성인테스트",
      "consent_privacy": true
    }
  }
}
JSON
)

echo "POST ${SUPABASE_URL}/auth/v1/signup  email=${EMAIL}"
HTTP_CODE=$(curl -sS -o /tmp/signup-adult.json -w "%{http_code}" \
  -X POST "${SUPABASE_URL}/auth/v1/signup" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d "${BODY}")

echo "HTTP ${HTTP_CODE}"
cat /tmp/signup-adult.json
echo

if [ "${HTTP_CODE}" != "200" ]; then
  echo "FAIL: expected 200, got ${HTTP_CODE}" >&2
  exit 1
fi
if ! grep -q '"access_token"' /tmp/signup-adult.json; then
  echo "FAIL: response missing access_token" >&2
  exit 1
fi

echo "PASS: signup returned access_token for ${EMAIL}"
