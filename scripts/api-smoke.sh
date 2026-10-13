#!/usr/bin/env bash
# Local API smoke test for the ELMS backend.
set -u
API=${API:-http://localhost:5000}
PASS=0
FAIL=0

check() { # check "label" expected_regex actual
  local label="$1" expect="$2" actual="$3"
  if echo "$actual" | grep -Eq "$expect"; then
    PASS=$((PASS+1)); echo "  ok   $label"
  else
    FAIL=$((FAIL+1)); echo "  FAIL $label"; echo "       got: $(echo "$actual" | head -c 300)"
  fi
}

jq() { python3 -c "import sys,json;d=json.load(sys.stdin);
import functools
p='$1'
for k in p.split('.'):
    if k=='': continue
    if '[' in k:
        name,idx=k.split('['); d=d[name][int(idx.strip(']'))]
    else: d=d[k]
print(json.dumps(d) if not isinstance(d,str) else d)"; }

login() { curl -s -m 10 -X POST "$API/api/auth/login" -H 'Content-Type: application/json' \
  -d "{\"email\":\"$1\",\"password\":\"$2\"}"; }

echo "== 1. public endpoint =="
check "health" "ELMS API is running" "$(curl -s -m 10 $API/)"

echo "== 2. login =="
ADMIN_TOKEN=$(login admin@school.edu Admin@123 | python3 -c "import sys,json;print(json.load(sys.stdin).get('token',''))")
TEACHER_TOKEN=$(login teacher@school.edu Teacher@123 | python3 -c "import sys,json;print(json.load(sys.stdin).get('token',''))")
STUDENT_TOKEN=$(login student@school.edu Student@123 | python3 -c "import sys,json;print(json.load(sys.stdin).get('token',''))")
check "admin login" "^[A-Za-z0-9._-]{20,}$" "$ADMIN_TOKEN"
check "teacher login" "^[A-Za-z0-9._-]{20,}$" "$TEACHER_TOKEN"
check "student login" "^[A-Za-z0-9._-]{20,}$" "$STUDENT_TOKEN"
check "bad password rejected" "Incorrect email or password" "$(login admin@school.edu wrongpass)"
check "no token -> 401" "401" "$(curl -s -m 10 -o /dev/null -w '%{http_code}' $API/api/auth/me)"

A=(-H "Authorization: Bearer $ADMIN_TOKEN" -H 'Content-Type: application/json')
T=(-H "Authorization: Bearer $TEACHER_TOKEN" -H 'Content-Type: application/json')
S=(-H "Authorization: Bearer $STUDENT_TOKEN" -H 'Content-Type: application/json')

echo "== 3. role protection =="
check "student blocked from /api/users" "403" "$(curl -s -m 10 -o /dev/null -w '%{http_code}' "${S[@]}" $API/api/users)"
check "teacher blocked from /api/users" "403" "$(curl -s -m 10 -o /dev/null -w '%{http_code}' "${T[@]}" $API/api/users)"

echo "== 4. admin stats + user CRUD =="
check "admin stats counts" '"students":4' "$(curl -s -m 10 "${A[@]}" $API/api/stats)"
NEW=$(curl -s -m 10 "${A[@]}" -X POST $API/api/users -d '{"name":"Test Teacher","email":"test.teacher@school.edu","password":"Pass@1234","role":"teacher","department":"Science"}')
check "create teacher" '"role":"teacher"' "$NEW"
NEW_ID=$(echo "$NEW" | python3 -c "import sys,json;print(json.load(sys.stdin)['_id'])")
check "list teachers" "Test Teacher" "$(curl -s -m 10 "${A[@]}" "$API/api/users?role=teacher&search=Test")"
check "update teacher" 'Physics' "$(curl -s -m 10 "${A[@]}" -X PUT $API/api/users/$NEW_ID -d '{"department":"Physics"}')"
check "duplicate email rejected" "already exists" "$(curl -s -m 10 "${A[@]}" -X POST $API/api/users -d '{"name":"Dup","email":"test.teacher@school.edu","password":"Pass@1234","role":"teacher"}')"
check "deactivate teacher" "deactivated" "$(curl -s -m 10 "${A[@]}" -X DELETE $API/api/users/$NEW_ID)"
check "deactivated cannot login" "deactivated" "$(login test.teacher@school.edu Pass@1234)"
check "hard delete teacher" "Account deleted" "$(curl -s -m 10 "${A[@]}" -X DELETE "$API/api/users/$NEW_ID?hard=true")"

echo "== 5. subjects =="
SUBJ=$(curl -s -m 10 "${A[@]}" -X POST $API/api/subjects -d '{"code":"TEST101","title":"Test Subject","description":"desc"}')
check "create subject" '"code":"TEST101"' "$SUBJ"
SUBJ_ID=$(echo "$SUBJ" | python3 -c "import sys,json;print(json.load(sys.stdin)['_id'])")
check "list subjects" "INF232" "$(curl -s -m 10 "${A[@]}" $API/api/subjects)"
check "update subject" "Updated Title" "$(curl -s -m 10 "${A[@]}" -X PUT $API/api/subjects/$SUBJ_ID -d '{"title":"Updated Title"}')"

echo "== 6. classes + enrollment =="
CLASSES=$(curl -s -m 10 "${A[@]}" $API/api/classes)
check "list classes" "BSIT 2A" "$CLASSES"
CLASS_ID=$(echo "$CLASSES" | python3 -c "
import sys,json
d=json.load(sys.stdin)
print(next(c['_id'] for c in d if c['name']=='BSIT 2A'))")
check "class populated teacher" "Maria Santos" "$(curl -s -m 10 "${A[@]}" $API/api/classes/$CLASS_ID)"
TEMPSTU=$(curl -s -m 10 "${A[@]}" -X POST $API/api/users -d '{"name":"Temp Student","email":"temp.student@school.edu","password":"Pass@1234","role":"student"}')
STUD_ID=$(echo "$TEMPSTU" | python3 -c "import sys,json;print(json.load(sys.stdin)['_id'])")
check "enroll student" "Temp Student" "$(curl -s -m 10 "${A[@]}" -X POST $API/api/classes/$CLASS_ID/students -d "{\"studentId\":\"$STUD_ID\"}" | grep -o 'Temp Student')"
check "duplicate enroll rejected" "already enrolled" "$(curl -s -m 10 "${A[@]}" -X POST $API/api/classes/$CLASS_ID/students -d "{\"studentId\":\"$STUD_ID\"}")"
check "unenroll removes student" "^0$" "$(curl -s -m 10 "${A[@]}" -X DELETE $API/api/classes/$CLASS_ID/students/$STUD_ID | grep -c 'Temp Student')"

echo "== 7. teacher content =="
MOD=$(curl -s -m 10 "${T[@]}" -X POST $API/api/modules -d "{\"title\":\"Test Module\",\"classId\":\"$CLASS_ID\"}")
check "create module" '"Test Module"' "$MOD"
MOD_ID=$(echo "$MOD" | python3 -c "import sys,json;print(json.load(sys.stdin)['_id'])")
check "list modules" "Test Module" "$(curl -s -m 10 "${T[@]}" "$API/api/modules?classId=$CLASS_ID")"
LES=$(curl -s -m 10 "${T[@]}" -X POST $API/api/lessons -d "{\"title\":\"Test Lesson\",\"content\":\"Hello world\",\"moduleId\":\"$MOD_ID\",\"classId\":\"$CLASS_ID\"}")
check "create lesson" '"Test Lesson"' "$LES"
LES_ID=$(echo "$LES" | python3 -c "import sys,json;print(json.load(sys.stdin)['_id'])")
check "student reads lesson" "Hello world" "$(curl -s -m 10 "${S[@]}" $API/api/lessons/$LES_ID)"
check "student cannot create lesson" "403" "$(curl -s -m 10 -o /dev/null -w '%{http_code}' "${S[@]}" -X POST $API/api/lessons -d "{\"title\":\"x\",\"moduleId\":\"$MOD_ID\",\"classId\":\"$CLASS_ID\"}")"
MAT=$(curl -s -m 10 "${T[@]}" -X POST $API/api/materials -d "{\"title\":\"Link\",\"type\":\"link\",\"url\":\"https://example.com/x\",\"classId\":\"$CLASS_ID\"}")
check "create material link" '"Link"' "$MAT"
MAT_ID=$(echo "$MAT" | python3 -c "import sys,json;print(json.load(sys.stdin)['_id'])")
check "student lists materials" "Link" "$(curl -s -m 10 "${S[@]}" "$API/api/materials?classId=$CLASS_ID")"

echo "== 8. assignments + submission + grading =="
ASSIGN=$(curl -s -m 10 "${T[@]}" -X POST $API/api/assignments -d "{\"title\":\"Test Assignment\",\"instructions\":\"Do it\",\"points\":20,\"dueDate\":\"2027-01-01\",\"classId\":\"$CLASS_ID\"}")
check "create assignment" '"Test Assignment"' "$ASSIGN"
ASSIGN_ID=$(echo "$ASSIGN" | python3 -c "import sys,json;print(json.load(sys.stdin)['_id'])")
check "student sees assignment with no submission" '"mySubmission":null' "$(curl -s -m 10 "${S[@]}" $API/api/assignments/$ASSIGN_ID)"
SUB=$(curl -s -m 10 "${S[@]}" -X POST $API/api/assignments/$ASSIGN_ID/submit -d '{"content":"My answer"}')
check "student submits" '"My answer"' "$SUB"
check "duplicate submit allowed before grading" '"My updated answer"' "$(curl -s -m 10 "${S[@]}" -X POST $API/api/assignments/$ASSIGN_ID/submit -d '{"content":"My updated answer"}')"
SUBM=$(curl -s -m 10 "${T[@]}" $API/api/assignments/$ASSIGN_ID/submissions)
check "teacher lists submissions" '"My updated answer"' "$SUBM"
SUB_ID=$(echo "$SUBM" | python3 -c "import sys,json;print(json.load(sys.stdin)['submissions'][0]['_id'])")
check "grade submission" '"status":"graded"' "$(curl -s -m 10 "${T[@]}" -X PUT $API/api/submissions/$SUB_ID/grade -d '{"grade":18,"feedback":"Nice work"}')"
check "grade over max rejected" "cannot be greater" "$(curl -s -m 10 "${T[@]}" -X PUT $API/api/submissions/$SUB_ID/grade -d '{"grade":99}')"
check "student sees grade + feedback" '"Nice work"' "$(curl -s -m 10 "${S[@]}" $API/api/submissions/$SUB_ID)"
check "student cannot grade" "403" "$(curl -s -m 10 -o /dev/null -w '%{http_code}' "${S[@]}" -X PUT $API/api/submissions/$SUB_ID/grade -d '{"grade":1}')"
check "resubmit blocked after grading" "already been graded" "$(curl -s -m 10 "${S[@]}" -X POST $API/api/assignments/$ASSIGN_ID/submit -d '{"content":"again"}')"

echo "== 9. quizzes + scoring =="
QUIZ=$(curl -s -m 10 "${T[@]}" -X POST $API/api/quizzes -d "{\"title\":\"Test Quiz\",\"allowRetake\":false,\"showResult\":true,\"classId\":\"$CLASS_ID\",\"questions\":[{\"question\":\"Q1?\",\"options\":[\"a\",\"b\"],\"correct\":1,\"points\":2}]}")
check "create quiz" '"Test Quiz"' "$QUIZ"
QUIZ_ID=$(echo "$QUIZ" | python3 -c "import sys,json;print(json.load(sys.stdin)['_id'])")
SQ=$(curl -s -m 10 "${S[@]}" $API/api/quizzes/$QUIZ_ID)
if echo "$SQ" | grep -q '"correct"'; then
  FAIL=$((FAIL+1)); echo "  FAIL correct answers leaked to student"
else
  PASS=$((PASS+1)); echo "  ok   correct answers NOT sent to student"
fi
check "student can take" '"canTake":true' "$SQ"
check "wrong answer scores 0" '"score":0' "$(curl -s -m 10 "${S[@]}" -X POST $API/api/quizzes/$QUIZ_ID/attempt -d '{"answers":[0]}')"
check "retake blocked" "already taken" "$(curl -s -m 10 "${S[@]}" -X POST $API/api/quizzes/$QUIZ_ID/attempt -d '{"answers":[1]}')"
check "teacher sees attempts" '"score":0' "$(curl -s -m 10 "${T[@]}" $API/api/quizzes/$QUIZ_ID/attempts)"

echo "== 10. announcements + grades =="
check "teacher posts announcement" '"Announcement Posted"' "$(curl -s -m 10 "${T[@]}" -X POST $API/api/announcements -d "{\"title\":\"Announcement Posted\",\"content\":\"Hello class\",\"classId\":\"$CLASS_ID\"}" | head -c 120)"
check "student reads announcements" "Announcement Posted" "$(curl -s -m 10 "${S[@]}" $API/api/announcements)"
check "student blocked from posting" "403" "$(curl -s -m 10 -o /dev/null -w '%{http_code}' "${S[@]}" -X POST $API/api/announcements -d "{\"title\":\"x\",\"content\":\"y\",\"classId\":\"$CLASS_ID\"}")"
check "student grades endpoint" '"percentage"' "$(curl -s -m 10 "${S[@]}" $API/api/grades/me)"
check "teacher gradebook" '"rows"' "$(curl -s -m 10 "${T[@]}" $API/api/grades/class/$CLASS_ID)"
check "student blocked from gradebook" "403" "$(curl -s -m 10 -o /dev/null -w '%{http_code}' "${S[@]}" $API/api/grades/class/$CLASS_ID)"

echo "== 11. student stats =="
check "student stats" '"pending"' "$(curl -s -m 10 "${S[@]}" $API/api/stats)"

echo "== 12. cleanup test records =="
check "delete test quiz" "deleted" "$(curl -s -m 10 "${T[@]}" -X DELETE $API/api/quizzes/$QUIZ_ID)"
check "delete test assignment" "deleted" "$(curl -s -m 10 "${T[@]}" -X DELETE $API/api/assignments/$ASSIGN_ID)"
check "delete test material" "deleted" "$(curl -s -m 10 "${T[@]}" -X DELETE $API/api/materials/$MAT_ID)"
check "delete test lesson" "deleted" "$(curl -s -m 10 "${T[@]}" -X DELETE $API/api/lessons/$LES_ID)"
check "delete test module" "deleted" "$(curl -s -m 10 "${T[@]}" -X DELETE $API/api/modules/$MOD_ID)"
check "delete test subject" "deleted" "$(curl -s -m 10 "${A[@]}" -X DELETE $API/api/subjects/$SUBJ_ID)"
check "delete temp student" "Account deleted" "$(curl -s -m 10 "${A[@]}" -X DELETE "$API/api/users/$STUD_ID?hard=true")"

echo
echo "=============================="
echo "PASS: $PASS   FAIL: $FAIL"
echo "=============================="
[ "$FAIL" -eq 0 ]
