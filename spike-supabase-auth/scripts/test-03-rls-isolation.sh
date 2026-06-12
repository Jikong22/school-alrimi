#!/usr/bin/env bash
# test-03-rls-isolation.sh
# School-Alrimi — RLS cross-user isolation.
# Requires: $SUPABASE_URL, $SUPABASE_ANON_KEY, $SUPABASE_SERVICE_ROLE_KEY
set -euo pipefail

: "${SUPABASE_URL:?Set SUPABASE_URL first}"
: "${SUPABASE_ANON_KEY:?Set SUPABASE_ANON_KEY first}"
: "${SUPABASE_SERVICE_ROLE_KEY:?Set SUPABASE_SERVICE_ROLE_KEY first (for seeding only)}"

signup() {
  local tag="$1"
  local stamp email body resp
  stamp=$(date +%Y%m%d%H%M%S)
  email="rls-${tag}-${stamp}@school-alrimi.test"
  body=$(cat <<JSON
{
  "email": "${email}",
  "password": "Test1234!Aa",
  "options": {
    "data": {
      "birthdate": "2008-01-01",
      "display_name": "RLS-${tag}",
      "consent_privacy": true
    }
  }
}
JSON
)
  resp=$(curl -sS -X POST "${SUPABASE_URL}/auth/v1/signup" \
    -H "apikey: ${SUPABASE_ANON_KEY}" \
    -H "Content-Type: application/json" \
    -d "${body}")
  echo "${resp}"
}

A_RESP=$(signup "A")
B_RESP=$(signup "B")
USER_A_ID=$(echo "${A_RESP}" | grep -oE '"id":"[a-f0-9-]+"' | head -1 | cut -d'"' -f4)
USER_A_TOKEN=$(echo "${A_RESP}" | grep -oE '"access_token":"[^"]+"' | cut -d'"' -f4)
USER_B_TOKEN=$(echo "${B_RESP}" | grep -oE '"access_token":"[^"]+"' | cut -d'"' -f4)
echo "userA id=${USER_A_ID}"

# Seed: 1 homework row owned by userA, via service_role.
SEED_BODY=$(cat <<JSON
{ "student_id": "${USER_A_ID}", "title": "A only", "body": "rls isolation" }
JSON
)
curl -sS -X POST "${SUPABASE_URL}/rest/v1/homework" \
  -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d "${SEED_BODY}" > /dev/null
echo "Seeded 1 homework row owned by userA."

# As userA: SELECT — expect 1 row.
ROWS_A=$(curl -sS "${SUPABASE_URL}/rest/v1/homework?select=id" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${USER_A_TOKEN}")
echo "userA sees: ${ROWS_A}"

# As userB: SELECT — expect [].
ROWS_B=$(curl -sS "${SUPABASE_URL}/rest/v1/homework?select=id" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${USER_B_TOKEN}")
echo "userB sees: ${ROWS_B}"

if [ "${ROWS_A}" = "[]" ]; then echo "FAIL: userA should see 1 row"; exit 1; fi
if [ "${ROWS_B}" != "[]" ]; then echo "FAIL: userB should see 0 rows"; exit 1; fi

# userB tries to INSERT a row owned by userA — must be denied.
EVIL=$(cat <<JSON
{ "student_id": "${USER_A_ID}", "title": "evil" }
JSON
)
HTTP=$(curl -sS -o /tmp/evil.json -w "%{http_code}" \
  -X POST "${SUPABASE_URL}/rest/v1/homework" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${USER_B_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "${EVIL}")
echo "userB INSERT attempt HTTP=${HTTP} body=$(cat /tmp/evil.json)"
if [ "${HTTP}" != "401" ] && [ "${HTTP}" != "403" ]; then
  echo "FAIL: expected 401/403, got ${HTTP}"; exit 1
fi

echo "PASS: RLS isolates userA from userB on public.homework"
