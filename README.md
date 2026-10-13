# EduWow ELMS — E-Learning Management System

A simple academic Learning Management System branded **EduWow**. Administrators manage
people, subjects and classes; teachers publish course content, assignments and quizzes and
grade student work; students study, submit work and follow their grades. New students and
teachers can also sign up for an account themselves.

- **Frontend:** React 19 + Vite + React Router + Tailwind CSS 4 + lucide-react icons
- **Backend:** Express 5 + Mongoose 9 + JWT auth + bcrypt password hashing
- **Database:** MongoDB Atlas (dedicated database `elms_db`, separate from any pre-existing data)

---

## Features

| Area | Administrator | Teacher | Student |
| --- | --- | --- | --- |
| Accounts | create / edit / deactivate / delete students & teachers | view roster | own profile |
| Subjects & classes | full CRUD, assign teacher, enrol / remove students | read-only | read-only |
| Modules & lessons | — | create, edit, delete | read lessons |a
| Learning materials | — | upload file (≤ 5 MB) or share link | download / open |
| Assignments | — | create, edit, delete, review submissions, give score + feedback | submit work (re-submit until graded) |
| Quizzes | — | builder with multiple-choice questions, points, retake/result settings, attempts list | take quiz, automatic scoring |
| Announcements | post to any class | post to own classes | read class announcements |
| Grades | — | per-class gradebook (assignments + quizzes) | personal grade report with overall % |
| Dashboards | counts + recent activity | classes, pending grading, deadlines | classes, pending work, recent results |

Role-based access is enforced on every API route (`admin`, `teacher`, `student`), plus
class-scoped checks: teachers only see their own classes, students only classes they are
enrolled in, and correct answers are stripped from quiz payloads sent to students.

### Public registration

Anyone can create an account from the **Sign up** link on the login page. Registration is
open to **students** and **teachers** only — administrator accounts cannot be self-created
(the API rejects them with `403`).

| Field | Rules |
| --- | --- |
| Full name | required |
| Email | required, must be a valid, unique address |
| Password | required, minimum 6 characters |
| Confirm password | must match password (enforced client- and server-side) |
| Account type | **Student** or **Teacher** |

A freshly registered student lands on an empty student dashboard (not enrolled in any
class yet); a freshly registered teacher lands on an empty teacher dashboard (no classes
assigned yet). Admin grants class access afterwards by enrolling the student in, or
assigning the teacher to, a class. Passwords are hashed with bcrypt before storage and are
never returned by the API.

---

## Project structure

```
showcase-gallery/
├── server/                 # Express API
│   ├── config/db.js        # MongoDB connection (uses MONGO_DB_NAME)
│   ├── controllers/        # route handlers (users, classes, content, assessments, grades…)
│   ├── middleware/auth.js  # protect + requireRole
│   ├── models/             # User, Subject, Class, Module, Lesson, Material,
│   │                       # Assignment, Submission, Quiz, QuizAttempt, Announcement
│   ├── routes/             # /auth /users /subjects /classes /stats /announcements + content & assessment
│   ├── seed/seed.js        # idempotent demo seed
│   ├── utils/access.js     # asyncHandler, httpError, getClassForUser…
│   └── server.js
├── client/                 # React SPA
│   └── src/
│       ├── api/            # fetch wrapper + endpoint helpers
│       ├── components/     # ui kit, layout (AppShell), classroom panels
│       ├── context/        # AuthContext (login, token, role home)
│       ├── hooks/          # useAsync
│       ├── pages/          # admin / teacher / student / shared views
│       └── routes/         # route table + role guards
├── scripts/
│   ├── api-smoke.sh          # 61-check backend regression suite (curl + python3)
│   ├── ui-smoke.js           # 40-check Playwright end-to-end suite
│   └── register-smoke.js     # 11-check Playwright sign-up suite
└── .env.example              # all environment keys (copy values into real .env files)
```

---

## Getting started

Requirements: **Node.js 18+** (developed on Node 22), npm, `curl` + `python3` for the
API test script, and a MongoDB Atlas connection string.

### 1. Install

```bash
cd server && npm install
cd ../client && npm install
```

### 2. Configure environment

Copy the keys from `.env.example` into the two real (git-ignored) env files:

```bash
# server/.env
MONGO_URI=mongodb+srv://USER:PASSWORD@CLUSTER.mongodb.net/
MONGO_DB_NAME=elms_db
PORT=5000
JWT_SECRET=<long random string>
JWT_EXPIRES_IN=7d
SEED_ADMIN_NAME=Administrator
SEED_ADMIN_EMAIL=admin@school.edu
SEED_ADMIN_PASSWORD=Admin@123

# client/.env   (must be UTF-8)
VITE_API_URL=http://localhost:5000
```

### 3. Seed the demo data (idempotent — safe to re-run)

```bash
cd server && npm run seed
```

### 4. Run

```bash
# terminal 1 — API on http://localhost:5000
cd server && npm run dev      # or: npm start

# terminal 2 — UI on http://localhost:5173
cd client && npm run dev
```

Open <http://localhost:5173> and sign in, or click **Sign up** to register a new
student/teacher account.

---

## Demo accounts

The login page has one-click demo chips that fill these credentials
(created by `npm run seed`, local development only):

| Role | Email | Password |
| --- | --- | --- |
| Administrator | `admin@school.edu` | `Admin@123` |
| Teacher | `teacher@school.edu` | `Teacher@123` |
| Student | `student@school.edu` | `Student@123` |

### 5-minute demo script

1. **Register** a new student from the login page's *Sign up* link, then sign in and see the empty student dashboard.
2. **Student** → *My Subjects* → open the class → *Modules* → read a lesson; *Materials* → download a file.
2. **Student** → *Assignments* → *Submit work* → type an answer → submit; note the status badge.
3. **Teacher** → *My Classes* → open the class → *Assignments* → *Review submissions* → enter a score + feedback → *Save grade*.
4. **Student** → *Grades* → see the score, feedback and overall percentage.
5. **Teacher** → class → *Quizzes* → *Add quiz* → add a question with options → *Create quiz*.
6. **Student** → class → *Quizzes* → *Take quiz* → submit → instant auto-score.
7. **Teacher** → *Announcements* → *Post announcement* → check it appears for the student.
8. **Admin** → *Students / Teachers / Subjects / Classes* → create records, enrol students into a class.

---

## Verification

All checks below were run against a live API + UI (results in parentheses).

```bash
# lint (0 errors, 3 warnings limited to the react-refresh HMR rule)
cd client && npx eslint .

# production build
cd client && npm run build

# backend regression suite — needs the API running  (61 checks, 0 failures)
bash scripts/api-smoke.sh

# end-to-end UI suite — needs API :5000 + UI :5173   (40 checks, 0 failures)
npm i --no-save --package-lock=false playwright && npx playwright install chromium
node scripts/ui-smoke.js

# public sign-up suite — needs API :5000 + UI :5173  (11 checks, 0 failures)
node scripts/register-smoke.js
```

The UI suite logs in as all three roles, walks every navigation item and class tab,
creates an assignment → submits it as the student → grades it as the teacher → verifies
the student's grade page, then builds and takes a quiz and posts/deletes an announcement.
It cleans up everything it creates and fails on any React console/page error.

The sign-up suite registers a student and a teacher through the real registration form,
logs each in, confirms the correct empty-state dashboard, checks the confirm-password
validation, and deletes the accounts it created.

---

## Notes & constraints

- The API connects to the existing Atlas cluster but uses a **separate database name
  (`elms_db`)**, so no existing production data is touched.
- Uploaded material/assignment files are stored as data URLs in the database, capped at
  5 MB, which keeps the project free of object-storage setup.
- JWT sessions last 7 days (`JWT_EXPIRES_IN`); tokens are kept in `localStorage`.
- Passwords are hashed with bcrypt (`$2b$`) before storage; the API never returns a stored hash.
- Administrator accounts are seeded and can only be created by an admin — public sign-up is limited to students and teachers.
- No GitHub push or production deployment was performed; everything runs locally.
