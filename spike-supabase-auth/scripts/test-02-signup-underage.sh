#!/usr/bin/env bash
# test-02-signup-underage.sh
# School-Alrimi — underage signup. Expect 400 + age_too_young error.
set -euo pipefail

: "${SUPABASE_URL:?Set SUPABASE_URL first}"
: "${SUPABASE_ANON_KEY:?Set SUPABASE_ANON_KEY first}"

STAMP=$(date +%Y%m%d%H%M%S)
EMAIL="minor-${STAMP}@school-alrimi.test"

BODY=$(cat <<JSON
{
  "email": "${EMAIL}",
  "password": "Test1234!Aa",
  "options": {
    "data": {
      "birthdate": "2020-01-01",
      "display_name": "미성년테스트",
      "consent_privacy": true
    }
  }
}
JSON
)

echo "POST ${SUPABASE_URL}/auth/v1/signup  email=${EMAIL} (underage)"
HTTP_CODE=$(curl -sS -o /tmp/signup-underage.json -w "%{http_code}" \
  -X POST "${SUPABASE_URL}/auth/v1/signup" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d "${BODY}")

echo "HTTP ${HTTP_CODE}"
cat /tmp/signup-underage.json
echo

if [ "${HTTP_CODE}" != "400" ]; then
  echo "FAIL: expected 400, got ${HTTP_CODE}" >&2
  exit 1
fi
if ! grep -q "age_too_young" /tmp/signup-underage.json; then
  echo "FAIL: expected 'age_too_young' in error body" >&2
  exit 1
fi

echo "PASS: underage signup rejected with age_too_young"
