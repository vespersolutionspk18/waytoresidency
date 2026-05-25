#!/bin/bash
# End-to-end test of every API route handler.
# Requires: dev server running on http://localhost:3000.
# Requires: admin@waytoresidency.com / WtrAdmin2026! seeded in DB.

BASE="${BASE:-http://localhost:3000}"
ADMIN_JAR=.wtr-admin.jar
USER_JAR=.wtr-user.jar
rm -f $ADMIN_JAR $USER_JAR

PASS=0
FAIL=0
FAILURES=()

c_red()   { printf "\033[31m%s\033[0m" "$1"; }
c_green() { printf "\033[32m%s\033[0m" "$1"; }
c_grey()  { printf "\033[90m%s\033[0m" "$1"; }
c_bold()  { printf "\033[1m%s\033[0m" "$1"; }

section() { printf "\n$(c_bold "▸ %s")\n" "$1"; }

check() {
  # check <name> <expected_status> <actual_status> [extra_note]
  local name="$1" expected="$2" actual="$3" note="${4:-}"
  if [ "$expected" = "$actual" ]; then
    PASS=$((PASS + 1))
    printf "  $(c_green "✓") %-58s $(c_grey "[%s]") %s\n" "$name" "$actual" "$note"
  else
    FAIL=$((FAIL + 1))
    FAILURES+=("$name (expected $expected, got $actual)")
    printf "  $(c_red "✗") %-58s $(c_grey "[got %s, expected %s]") %s\n" "$name" "$actual" "$expected" "$note"
  fi
}

# ─── REST helpers ──────────────────────────────────────────────────────
req() {
  # req METHOD URL [JAR] [BODY] → echoes status code, body in .wtr-body.json
  local method="$1" url="$2" jar="${3:-}" body="${4:-}"
  # Origin header — Better Auth rejects mutations without it (CSRF protection).
  local args=(-s -o .wtr-body.json -w '%{http_code}' -X "$method" "$BASE$url"
    -H 'Content-Type: application/json' -H "Origin: $BASE")
  [ -n "$jar" ] && args+=(-b "$jar" -c "$jar")
  [ -n "$body" ] && args+=(-d "$body")
  curl "${args[@]}"
}

jq_get() { python -c "import json,sys; print(json.load(open('.wtr-body.json')).get('$1', ''))" 2>/dev/null; }
jq_path() {
  python -c "
import json, sys
d = json.load(open('.wtr-body.json'))
for key in sys.argv[1].split('.'):
  if key.endswith(']'):
    name, idx = key[:-1].split('[')
    d = d[name][int(idx)]
  else:
    d = d[key]
print(d)
" "$1" 2>/dev/null
}

# ═══ TESTS ═════════════════════════════════════════════════════════════
section "Public — no auth required"
check "GET /api/health" "200" "$(req GET /api/health)"

# Contact: valid submission
status=$(req POST /api/contact "" '{"firstName":"E2E","lastName":"Tester","email":"e2e@example.com","phone":"+92 300 9999999","message":"This is an e2e test submission."}')
check "POST /api/contact (valid)" "201" "$status"
CONTACT_ID=$(python -c "import json; print(json.load(open('.wtr-body.json'))['id'])" 2>/dev/null)

# Contact: validation
check "POST /api/contact (missing email → 400)" "400" "$(req POST /api/contact "" '{"firstName":"X","message":"hi"}')"
check "POST /api/contact (bad email → 400)" "400" "$(req POST /api/contact "" '{"firstName":"X","email":"notanemail","message":"hi"}')"

# /api/me unauth
check "GET /api/me (no cookie → 401)" "401" "$(req GET /api/me)"

section "Auth — Better Auth handler"
check "GET /api/auth/get-session (no cookie)" "200" "$(req GET /api/auth/get-session)"

# Sign in as admin
status=$(req POST /api/auth/sign-in/email "$ADMIN_JAR" '{"email":"admin@waytoresidency.com","password":"WtrAdmin2026!"}')
check "POST /api/auth/sign-in/email (admin)" "200" "$status"

# Create a fresh user too (so we have two distinct sessions)
TEST_EMAIL="e2e-user-$(date +%s)@test.com"
status=$(req POST /api/auth/sign-up/email "$USER_JAR" "{\"email\":\"$TEST_EMAIL\",\"password\":\"e2etest12345\",\"name\":\"E2E User\"}")
check "POST /api/auth/sign-up/email (new user)" "200" "$status"

section "Authed user — /api/me, /api/subjects, /api/courses"
check "GET /api/me (as user)" "200" "$(req GET /api/me $USER_JAR)"
check "GET /api/me (as admin)" "200" "$(req GET /api/me $ADMIN_JAR)"
check "GET /api/subjects (as user)" "200" "$(req GET /api/subjects $USER_JAR)"
check "GET /api/courses (as user)" "200" "$(req GET /api/courses $USER_JAR)"
check "GET /api/me/transactions (as user, empty)" "200" "$(req GET /api/me/transactions $USER_JAR)"

section "Billing — plan, checkout, transaction, mock-complete, cancel"
check "GET /api/billing/plan" "200" "$(req GET /api/billing/plan $USER_JAR)"
check "GET /api/billing/subscription (none yet)" "200" "$(req GET /api/billing/subscription $USER_JAR)"

# checkout creates a pending transaction
status=$(req POST /api/billing/checkout $USER_JAR '{}')
check "POST /api/billing/checkout" "201" "$status"
ORDER_ID=$(jq_path "transaction.orderId" 2>/dev/null)

if [ -n "$ORDER_ID" ]; then
  check "GET /api/billing/transactions/:orderId" "200" "$(req GET /api/billing/transactions/$ORDER_ID $USER_JAR)"

  # Mock the HBL callback as success → subscription created
  status=$(req POST /api/billing/mock-complete $USER_JAR "{\"orderId\":\"$ORDER_ID\",\"outcome\":\"success\",\"method\":\"card\"}")
  check "POST /api/billing/mock-complete (success)" "200" "$status"

  # Now the user has an active subscription
  check "GET /api/billing/subscription (has sub now)" "200" "$(req GET /api/billing/subscription $USER_JAR)"

  # Cancel it
  check "POST /api/billing/cancel-subscription" "200" "$(req POST /api/billing/cancel-subscription $USER_JAR '')"
  # Second cancel → 409
  check "POST /api/billing/cancel-subscription (already canceled → 409)" "409" "$(req POST /api/billing/cancel-subscription $USER_JAR '')"
fi

# Cart checkout (book order)
status=$(req POST /api/billing/cart-checkout $USER_JAR '{"items":[{"slug":"fcps-manual","title":"FCPS Manual","priceMinor":350000,"qty":1}],"shipping":{"city":"Lahore"},"paymentMethod":"cod"}')
check "POST /api/billing/cart-checkout (cod)" "201" "$status"

# Cart checkout validation
check "POST /api/billing/cart-checkout (empty → 400)" "400" "$(req POST /api/billing/cart-checkout $USER_JAR '{"items":[]}')"

section "Attempts — create, hydrate, answer, skip, flag, complete"
status=$(req POST /api/attempts $USER_JAR '{"mode":"tutor","questionCount":3}')
check "POST /api/attempts (tutor, 3 q)" "201" "$status"
ATTEMPT_ID=$(jq_get id 2>/dev/null)

if [ -n "$ATTEMPT_ID" ]; then
  check "GET /api/attempts (list)" "200" "$(req GET /api/attempts $USER_JAR)"
  check "GET /api/attempts/:id" "200" "$(req GET /api/attempts/$ATTEMPT_ID $USER_JAR)"

  # Pull out a question + choice id from the hydrated attempt
  AQ_ID=$(python -c "import json; d=json.load(open('.wtr-body.json')); print(d['questions'][0]['attemptQuestionId'])" 2>/dev/null)
  CH_ID=$(python -c "import json; d=json.load(open('.wtr-body.json')); print(d['questions'][0]['choices'][0]['id'])" 2>/dev/null)
  AQ2_ID=$(python -c "import json; d=json.load(open('.wtr-body.json')); print(d['questions'][1]['attemptQuestionId'])" 2>/dev/null)
  AQ3_ID=$(python -c "import json; d=json.load(open('.wtr-body.json')); print(d['questions'][2]['attemptQuestionId'])" 2>/dev/null)

  if [ -n "$AQ_ID" ] && [ -n "$CH_ID" ]; then
    status=$(req POST /api/attempts/$ATTEMPT_ID/answer $USER_JAR "{\"attemptQuestionId\":\"$AQ_ID\",\"selectedChoiceId\":\"$CH_ID\",\"timeSpentSeconds\":10}")
    check "POST /api/attempts/:id/answer" "200" "$status"

    # Validation: invalid choice
    BAD=$(req POST /api/attempts/$ATTEMPT_ID/answer $USER_JAR "{\"attemptQuestionId\":\"$AQ_ID\",\"selectedChoiceId\":\"00000000-0000-0000-0000-000000000000\",\"timeSpentSeconds\":1}")
    check "POST /api/attempts/:id/answer (bad choice → 400)" "400" "$BAD"
  fi
  if [ -n "$AQ2_ID" ]; then
    check "POST /api/attempts/:id/skip" "200" "$(req POST /api/attempts/$ATTEMPT_ID/skip $USER_JAR "{\"attemptQuestionId\":\"$AQ2_ID\",\"timeSpentSeconds\":5}")"
  fi
  if [ -n "$AQ3_ID" ]; then
    check "POST /api/attempts/:id/flag" "200" "$(req POST /api/attempts/$ATTEMPT_ID/flag $USER_JAR "{\"attemptQuestionId\":\"$AQ3_ID\",\"flagged\":true}")"
  fi

  # Complete it (tally)
  check "POST /api/attempts/:id/complete" "200" "$(req POST /api/attempts/$ATTEMPT_ID/complete $USER_JAR '')"
  # Idempotent on second call
  check "POST /api/attempts/:id/complete (already done)" "200" "$(req POST /api/attempts/$ATTEMPT_ID/complete $USER_JAR '')"
fi

# Attempt not found → 404
check "GET /api/attempts/:bad-id → 404" "404" "$(req GET /api/attempts/00000000-0000-0000-0000-000000000000 $USER_JAR)"

section "Admin permissions — user without isAdmin"
check "GET /api/admin/whoami (regular user → 403)" "403" "$(req GET /api/admin/whoami $USER_JAR)"
check "GET /api/admin/stats (no cookie → 401)" "401" "$(req GET /api/admin/stats)"

section "Admin — whoami / stats / payment-stats"
check "GET /api/admin/whoami" "200" "$(req GET /api/admin/whoami $ADMIN_JAR)"
check "GET /api/admin/stats" "200" "$(req GET /api/admin/stats $ADMIN_JAR)"
check "GET /api/admin/payment-stats" "200" "$(req GET /api/admin/payment-stats $ADMIN_JAR)"

section "Admin — contact submissions"
check "GET /api/admin/contact-submissions" "200" "$(req GET /api/admin/contact-submissions $ADMIN_JAR)"
if [ -n "$CONTACT_ID" ]; then
  check "PATCH .../$CONTACT_ID (handled=true)" "200" "$(req PATCH /api/admin/contact-submissions/$CONTACT_ID $ADMIN_JAR '{"handled":true}')"
  check "PATCH .../$CONTACT_ID (bad body → 400)" "400" "$(req PATCH /api/admin/contact-submissions/$CONTACT_ID $ADMIN_JAR '{}')"
  check "DELETE .../$CONTACT_ID" "200" "$(req DELETE /api/admin/contact-submissions/$CONTACT_ID $ADMIN_JAR)"
fi

section "Admin — users"
check "GET /api/admin/users" "200" "$(req GET /api/admin/users $ADMIN_JAR)"
# Get current admin id from whoami
req GET /api/admin/whoami $ADMIN_JAR > /dev/null
ADMIN_ID=$(jq_path "user.id" 2>/dev/null)
check "GET /api/admin/users/:adminId" "200" "$(req GET /api/admin/users/$ADMIN_ID $ADMIN_JAR)"
check "PATCH /api/admin/users/:adminId (no fields → 400)" "400" "$(req PATCH /api/admin/users/$ADMIN_ID $ADMIN_JAR '{}')"
check "PATCH /api/admin/users/:adminId (emailVerified=true)" "200" "$(req PATCH /api/admin/users/$ADMIN_ID $ADMIN_JAR '{"emailVerified":true}')"

section "Admin — transactions"
check "GET /api/admin/transactions" "200" "$(req GET /api/admin/transactions $ADMIN_JAR)"
check "GET /api/admin/transactions?status=succeeded" "200" "$(req GET '/api/admin/transactions?status=succeeded' $ADMIN_JAR)"

section "Admin — courses CRUD"
check "GET /api/admin/courses" "200" "$(req GET /api/admin/courses $ADMIN_JAR)"
SLUG="e2e-course-$(date +%s)"
status=$(req POST /api/admin/courses $ADMIN_JAR "{\"slug\":\"$SLUG\",\"name\":\"E2E Course\",\"sortOrder\":99}")
check "POST /api/admin/courses (create)" "201" "$status"
COURSE_ID=$(jq_path "course.id" 2>/dev/null)
if [ -n "$COURSE_ID" ]; then
  check "PATCH /api/admin/courses/:id" "200" "$(req PATCH /api/admin/courses/$COURSE_ID $ADMIN_JAR '{"name":"E2E Course Updated"}')"
fi
check "POST /api/admin/courses (missing slug → 400)" "400" "$(req POST /api/admin/courses $ADMIN_JAR '{"name":"X"}')"

section "Admin — subjects CRUD"
check "GET /api/admin/subjects" "200" "$(req GET /api/admin/subjects $ADMIN_JAR)"
SLUG="e2e-subj-$(date +%s)"
status=$(req POST /api/admin/subjects $ADMIN_JAR "{\"slug\":\"$SLUG\",\"name\":\"E2E Subject\",\"sortOrder\":99}")
check "POST /api/admin/subjects (create)" "201" "$status"
SUBJECT_ID=$(jq_path "subject.id" 2>/dev/null)
if [ -n "$SUBJECT_ID" ]; then
  check "PATCH /api/admin/subjects/:id" "200" "$(req PATCH /api/admin/subjects/$SUBJECT_ID $ADMIN_JAR '{"name":"E2E Subject Updated"}')"
fi
check "POST /api/admin/subjects (missing slug → 400)" "400" "$(req POST /api/admin/subjects $ADMIN_JAR '{"name":"X"}')"

section "Admin — questions"
check "GET /api/admin/questions" "200" "$(req GET /api/admin/questions $ADMIN_JAR)"
check "GET /api/admin/questions?subjectId=$SUBJECT_ID" "200" "$(req GET "/api/admin/questions?subjectId=$SUBJECT_ID" $ADMIN_JAR)"

# Create a question with 5 choices
status=$(req POST /api/admin/questions $ADMIN_JAR "{
  \"vignette\":\"E2E test vignette: 25yo F with rash.\",
  \"explanation\":\"E2E explanation.\",
  \"difficulty\":\"medium\",
  \"subjectId\":\"$SUBJECT_ID\",
  \"choices\":[
    {\"label\":\"A\",\"text\":\"Choice A\",\"isCorrect\":true},
    {\"label\":\"B\",\"text\":\"Choice B\",\"isCorrect\":false},
    {\"label\":\"C\",\"text\":\"Choice C\",\"isCorrect\":false},
    {\"label\":\"D\",\"text\":\"Choice D\",\"isCorrect\":false},
    {\"label\":\"E\",\"text\":\"Choice E\",\"isCorrect\":false}
  ]
}")
check "POST /api/admin/questions (create)" "201" "$status"
QUESTION_ID=$(jq_get id 2>/dev/null)

if [ -n "$QUESTION_ID" ]; then
  check "GET /api/admin/questions/:id" "200" "$(req GET /api/admin/questions/$QUESTION_ID $ADMIN_JAR)"

  # Grab a choice id for the PUT + choice PATCH
  CHOICE_A_ID=$(python -c "import json; d=json.load(open('.wtr-body.json')); print([c for c in d['choices'] if c['label']=='A'][0]['id'])" 2>/dev/null)
  CHOICE_B_ID=$(python -c "import json; d=json.load(open('.wtr-body.json')); print([c for c in d['choices'] if c['label']=='B'][0]['id'])" 2>/dev/null)

  check "PATCH /api/admin/questions/:id (vignette)" "200" "$(req PATCH /api/admin/questions/$QUESTION_ID $ADMIN_JAR '{"vignette":"E2E updated vignette"}')"

  # PUT (full atomic save)
  status=$(req PUT /api/admin/questions/$QUESTION_ID $ADMIN_JAR "{
    \"vignette\":\"E2E PUT vignette\",
    \"explanation\":\"E2E PUT explanation\",
    \"difficulty\":\"hard\",
    \"subjectId\":\"$SUBJECT_ID\",
    \"choices\":[
      {\"id\":\"$CHOICE_A_ID\",\"text\":\"PUT A\",\"isCorrect\":true},
      {\"id\":\"$CHOICE_B_ID\",\"text\":\"PUT B\",\"isCorrect\":false}
    ]
  }")
  check "PUT /api/admin/questions/:id (full save)" "200" "$status"

  if [ -n "$CHOICE_B_ID" ]; then
    check "PATCH /api/admin/questions/:id/choices/:choiceId (text)" "200" "$(req PATCH /api/admin/questions/$QUESTION_ID/choices/$CHOICE_B_ID $ADMIN_JAR '{"text":"choice B v2"}')"
    check "PATCH .../choices/:choiceId (set isCorrect=true)" "200" "$(req PATCH /api/admin/questions/$QUESTION_ID/choices/$CHOICE_B_ID $ADMIN_JAR '{"isCorrect":true}')"
  fi

  check "DELETE /api/admin/questions/:id" "200" "$(req DELETE /api/admin/questions/$QUESTION_ID $ADMIN_JAR)"
fi

# Question 404
check "GET /api/admin/questions/:bad → 404" "404" "$(req GET /api/admin/questions/00000000-0000-0000-0000-000000000000 $ADMIN_JAR)"

# Clean up subject + course we created
if [ -n "$SUBJECT_ID" ]; then
  check "DELETE /api/admin/subjects/:id (cleanup)" "200" "$(req DELETE /api/admin/subjects/$SUBJECT_ID $ADMIN_JAR)"
fi
if [ -n "$COURSE_ID" ]; then
  check "DELETE /api/admin/courses/:id (cleanup)" "200" "$(req DELETE /api/admin/courses/$COURSE_ID $ADMIN_JAR)"
fi

section "Auth — sign out"
check "POST /api/auth/sign-out" "200" "$(req POST /api/auth/sign-out $USER_JAR '{}')"
check "GET /api/me after signout → 401" "401" "$(req GET /api/me $USER_JAR)"

# ─── Summary ──────────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════════════"
printf "$(c_bold "Total:") %d  $(c_green "passed: %d")  " "$((PASS + FAIL))" "$PASS"
if [ "$FAIL" -gt 0 ]; then
  printf "$(c_red "failed: %d")\n" "$FAIL"
  echo ""
  echo "Failures:"
  for f in "${FAILURES[@]}"; do
    echo "  - $f"
  done
  exit 1
else
  printf "$(c_green "failed: 0")\n"
  exit 0
fi
