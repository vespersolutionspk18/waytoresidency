#!/bin/bash
# Comprehensive smoke test for the attempts API.
# Usage: bash scripts/smoke-test.sh
set -u

BASE="http://localhost:3000"
ORIGIN="http://localhost:3000"
JAR=/tmp/wtr.smoke.cookies
EMAIL="smoke-$(date +%s)@example.com"
PASS="hunter2hunter2"

fail=0
pass=0
expect() {
  local label="$1"; shift
  local expected="$1"; shift
  local actual="$1"; shift
  if [[ "$actual" == "$expected" ]]; then
    echo "  ✓ $label"
    pass=$((pass+1))
  else
    echo "  ✗ $label — expected '$expected', got '$actual'"
    fail=$((fail+1))
  fi
}

curl_status() {
  curl -s -b "$JAR" -c "$JAR" -H 'Origin: '"$ORIGIN" -o /dev/null -w "%{http_code}" "$@"
}
curl_body() {
  curl -s -b "$JAR" -c "$JAR" -H 'Origin: '"$ORIGIN" "$@"
}

rm -f "$JAR"

echo "=== 0. Sign up new user ($EMAIL) ==="
code=$(curl -s -c "$JAR" -H 'Content-Type: application/json' -H "Origin: $ORIGIN" -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\",\"name\":\"Smoke User\"}" -o /dev/null -w "%{http_code}" "$BASE/api/auth/sign-up/email")
expect "sign-up 200" 200 "$code"

echo ""
echo "=== 1. GET /attempts (empty list) ==="
body=$(curl_body "$BASE/api/backend/attempts")
echo "  body: $body"
expect "empty list" '{"attempts":[]}' "$body"

echo ""
echo "=== 2. POST /attempts validation ==="
code=$(curl_status -X POST -H 'Content-Type: application/json' -d '{"mode":"tutor"}' "$BASE/api/backend/attempts")
expect "missing questionCount → 400" 400 "$code"

code=$(curl_status -X POST -H 'Content-Type: application/json' -d '{"mode":"tutor","questionCount":-5}' "$BASE/api/backend/attempts")
expect "negative questionCount → 400" 400 "$code"

echo ""
echo "=== 3. POST /attempts create tutor (N=5) ==="
body=$(curl_body -X POST -H 'Content-Type: application/json' -d '{"mode":"tutor","questionCount":5}' "$BASE/api/backend/attempts")
echo "  body: $body"
ATTID=$(echo "$body" | python -c "import json,sys; d=json.load(sys.stdin); print(d['id'])")
echo "  attempt id: $ATTID"

echo ""
echo "=== 4. GET /attempts/<bogus> → 404 ==="
code=$(curl_status "$BASE/api/backend/attempts/00000000-0000-0000-0000-000000000000")
expect "bogus → 404" 404 "$code"

echo ""
echo "=== 5. GET /attempts/:id (hydrate) ==="
state=$(curl_body "$BASE/api/backend/attempts/$ATTID")
qcount=$(echo "$state" | python -c "import json,sys; d=json.load(sys.stdin); print(len(d['questions']))")
expect "5 questions hydrated" 5 "$qcount"
mode=$(echo "$state" | python -c "import json,sys; d=json.load(sys.stdin); print(d['mode'])")
expect "mode tutor" tutor "$mode"

AQ0=$(echo "$state" | python -c "import json,sys; d=json.load(sys.stdin); print(d['questions'][0]['attemptQuestionId'])")
AQ1=$(echo "$state" | python -c "import json,sys; d=json.load(sys.stdin); print(d['questions'][1]['attemptQuestionId'])")
AQ2=$(echo "$state" | python -c "import json,sys; d=json.load(sys.stdin); print(d['questions'][2]['attemptQuestionId'])")
C0_ANY=$(echo "$state" | python -c "import json,sys; d=json.load(sys.stdin); print(d['questions'][0]['choices'][0]['id'])")
C0_CORRECT=$(echo "$state" | python -c "import json,sys,os; d=json.load(sys.stdin); cs=d['questions'][0]['choices']; print(cs[1]['id'])")

# Real correct from DB
PSQL="/c/Users/Hassan/AppData/Local/com.tinyapp.DBngin/Binaries/postgresql/17.0/bin/psql.exe"
Q0_ID=$(echo "$state" | python -c "import json,sys; d=json.load(sys.stdin); cs=d['questions'][0]['choices']; print(cs[0]['id'])")
C0_CORRECT=$("$PSQL" -U postgres -h localhost -d waytoresidency -tAc "SELECT id FROM choice WHERE is_correct=true AND question_id=(SELECT question_id FROM choice WHERE id='$Q0_ID');")
echo "  AQ0=$AQ0 correctChoice=$C0_CORRECT"

echo ""
echo "=== 6. POST /answer validation ==="
code=$(curl_status -X POST -H 'Content-Type: application/json' -d '{}' "$BASE/api/backend/attempts/$ATTID/answer")
expect "missing body → 400" 400 "$code"

code=$(curl_status -X POST -H 'Content-Type: application/json' -d "{\"attemptQuestionId\":\"00000000-0000-0000-0000-000000000000\",\"selectedChoiceId\":\"$C0_CORRECT\"}" "$BASE/api/backend/attempts/$ATTID/answer")
expect "bogus aqId → 404" 404 "$code"

code=$(curl_status -X POST -H 'Content-Type: application/json' -d "{\"attemptQuestionId\":\"$AQ0\",\"selectedChoiceId\":\"00000000-0000-0000-0000-000000000000\"}" "$BASE/api/backend/attempts/$ATTID/answer")
expect "bogus choiceId → 400" 400 "$code"

echo ""
echo "=== 7. POST /answer correctly (tutor → expect feedback) ==="
body=$(curl_body -X POST -H 'Content-Type: application/json' -d "{\"attemptQuestionId\":\"$AQ0\",\"selectedChoiceId\":\"$C0_CORRECT\",\"timeSpentSeconds\":12}" "$BASE/api/backend/attempts/$ATTID/answer")
isCorrect=$(echo "$body" | python -c "import json,sys; d=json.load(sys.stdin); print(d['isCorrect'])")
hasExpl=$(echo "$body" | python -c "import json,sys; d=json.load(sys.stdin); print(bool(d.get('explanation')))")
expect "tutor answer.isCorrect=True" True "$isCorrect"
expect "tutor answer has explanation" True "$hasExpl"

echo ""
echo "=== 8. POST /skip ==="
body=$(curl_body -X POST -H 'Content-Type: application/json' -d "{\"attemptQuestionId\":\"$AQ1\",\"timeSpentSeconds\":3}" "$BASE/api/backend/attempts/$ATTID/skip")
expect "skip ack" '{"ack":true}' "$body"

code=$(curl_status -X POST -H 'Content-Type: application/json' -d '{}' "$BASE/api/backend/attempts/$ATTID/skip")
expect "skip missing aqId → 400" 400 "$code"

echo ""
echo "=== 9. POST /flag ==="
body=$(curl_body -X POST -H 'Content-Type: application/json' -d "{\"attemptQuestionId\":\"$AQ2\",\"flagged\":true}" "$BASE/api/backend/attempts/$ATTID/flag")
flagged=$(echo "$body" | python -c "import json,sys; d=json.load(sys.stdin); print(d['flagged'])")
expect "flag true" True "$flagged"

code=$(curl_status -X POST -H 'Content-Type: application/json' -d "{\"attemptQuestionId\":\"$AQ2\"}" "$BASE/api/backend/attempts/$ATTID/flag")
expect "flag missing flagged → 400" 400 "$code"

echo ""
echo "=== 10. POST /complete ==="
body=$(curl_body -X POST "$BASE/api/backend/attempts/$ATTID/complete")
already=$(echo "$body" | python -c "import json,sys; d=json.load(sys.stdin); print(d['alreadyCompleted'])")
correct=$(echo "$body" | python -c "import json,sys; d=json.load(sys.stdin); print(d['score']['correct'])")
expect "alreadyCompleted False" False "$already"
expect "correct=1" 1 "$correct"

echo ""
echo "=== 11. POST /complete again (idempotent) ==="
body=$(curl_body -X POST "$BASE/api/backend/attempts/$ATTID/complete")
already=$(echo "$body" | python -c "import json,sys; d=json.load(sys.stdin); print(d['alreadyCompleted'])")
expect "alreadyCompleted True" True "$already"

echo ""
echo "=== 12. POST /answer after complete → 409 ==="
code=$(curl_status -X POST -H 'Content-Type: application/json' -d "{\"attemptQuestionId\":\"$AQ0\",\"selectedChoiceId\":\"$C0_CORRECT\"}" "$BASE/api/backend/attempts/$ATTID/answer")
expect "post-complete answer → 409" 409 "$code"

echo ""
echo "=== 13. GET /attempts (list now non-empty) ==="
body=$(curl_body "$BASE/api/backend/attempts")
n=$(echo "$body" | python -c "import json,sys; d=json.load(sys.stdin); print(len(d['attempts']))")
expect "1 attempt in list" 1 "$n"

echo ""
echo "=== 14. Quiz mode flow ==="
body=$(curl_body -X POST -H 'Content-Type: application/json' -d '{"mode":"quiz","questionCount":3,"timeLimitSeconds":120}' "$BASE/api/backend/attempts")
QATTID=$(echo "$body" | python -c "import json,sys; d=json.load(sys.stdin); print(d['id'])")
qstate=$(curl_body "$BASE/api/backend/attempts/$QATTID")
qmode=$(echo "$qstate" | python -c "import json,sys; d=json.load(sys.stdin); print(d['mode'])")
expect "quiz mode" quiz "$qmode"

QAQ0=$(echo "$qstate" | python -c "import json,sys; d=json.load(sys.stdin); print(d['questions'][0]['attemptQuestionId'])")
QC0=$(echo "$qstate" | python -c "import json,sys; d=json.load(sys.stdin); print(d['questions'][0]['choices'][0]['id'])")
body=$(curl_body -X POST -H 'Content-Type: application/json' -d "{\"attemptQuestionId\":\"$QAQ0\",\"selectedChoiceId\":\"$QC0\"}" "$BASE/api/backend/attempts/$QATTID/answer")
hasExpl=$(echo "$body" | python -c "import json,sys; d=json.load(sys.stdin); print(bool(d.get('explanation')))")
expect "quiz answer has NO explanation (silent)" False "$hasExpl"

# Hydrate during quiz — feedback should be hidden
qstate2=$(curl_body "$BASE/api/backend/attempts/$QATTID")
isC=$(echo "$qstate2" | python -c "import json,sys; d=json.load(sys.stdin); print(d['questions'][0]['isCorrect'])")
expect "quiz hydrate hides isCorrect" None "$isC"

# Complete and re-hydrate — now feedback should appear
curl_body -X POST "$BASE/api/backend/attempts/$QATTID/complete" > /dev/null
qstate3=$(curl_body "$BASE/api/backend/attempts/$QATTID")
expl=$(echo "$qstate3" | python -c "import json,sys; d=json.load(sys.stdin); print(bool(d['questions'][0]['explanation']))")
expect "post-complete quiz reveals explanation" True "$expl"

echo ""
echo "=============================="
echo "Passed: $pass   Failed: $fail"
echo "=============================="
exit $fail
