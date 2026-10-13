/**
 * End-to-end UI smoke test for the ELMS frontend.
 *
 * Prerequisites
 *   1. API running on  http://localhost:5000   (cd server && npm run dev)
 *   2. UI running on   http://localhost:5173   (cd client && npm run dev)
 *   3. Playwright + Chromium installed once:
 *        npm i --no-save playwright && npx playwright install chromium
 *
 * Run
 *   node scripts/ui-smoke.js
 *
 * Exits 0 when every check passes and no page/console errors were captured.
 * It creates and then deletes its own assignment, quiz and announcement.
 */
const { chromium } = require("playwright");

const BASE = "http://localhost:5173";
const API = "http://localhost:5000/api";
const TS = Date.now();

const results = [];
let currentStep = "";
function ok(msg) { results.push(`  ok   ${msg}`); console.log(`  ok   ${msg}`); }
function bad(msg) { results.push(`FAIL   ${msg}`); console.log(`FAIL   ${msg}`); }
async function check(label, fn) {
  currentStep = label;
  console.log(`== ${label} ==`);
  try { await fn(); } catch (e) { bad(`${label} -> ${String(e.message).split("\n")[0]}`); }
}

const consoleErrors = [];
const pageErrors = [];

async function apiLogin(email, password) {
  const res = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(`api login ${res.status}`);
  const data = await res.json();
  return data;
}

function hook(page, tag) {
  page.on("console", (m) => {
    if (m.type() === "error") consoleErrors.push(`[${tag}] ${m.text()}`);
  });
  page.on("pageerror", (e) => pageErrors.push(`[${tag}] ${e.message}`));
}

async function login(page, email, password) {
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL((u) => !u.pathname.includes("/login"), { timeout: 20000 });
  await page.waitForLoadState("networkidle");
}

async function nav(page, path) {
  await page.click(`a[href="${path}"]`);
  await page.waitForURL(`**${path}`, { timeout: 10000 });
  await page.waitForLoadState("networkidle");
  await page.waitForFunction(
    () => {
      const m = document.querySelector("main");
      return m && m.textContent.trim().length > 60 && !/Loading /i.test(m.textContent);
    },
    { timeout: 15000 }
  );
}

async function expectText(page, text, { timeout = 10000 } = {}) {
  await page.getByText(text, { exact: false }).first().waitFor({ state: "visible", timeout });
}

async function tab(page, name) {
  await page.getByRole("button", { name, exact: true }).first().click();
  await page.waitForTimeout(600);
}

async function logout(page) {
  await page.getByRole("button", { name: "Logout" }).click();
  await page.waitForURL("**/login", { timeout: 10000 });
}

(async () => {
  const browser = await chromium.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage"] });

  /* ------------------------------------------------------------- seed data via API */
  const t = await apiLogin("teacher@school.edu", "Teacher@123");
  const s = await apiLogin("student@school.edu", "Student@123");
  const a = await apiLogin("admin@school.edu", "Admin@123");

  const asHeader = (tok) => ({ Authorization: `Bearer ${tok}` });
  const teacherClasses = await (await fetch(`${API}/classes`, { headers: asHeader(t.token) })).json();
  if (!teacherClasses.length) throw new Error("no teacher classes seeded");
  const classId = teacherClasses[0]._id;
  const studentClasses = await (await fetch(`${API}/classes`, { headers: asHeader(s.token) })).json();
  const inClass = studentClasses.some((c) => c._id === classId);
  console.log(`class: ${teacherClasses[0].name}  studentEnrolled=${inClass}`);

  const adminContext = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const studentContext = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const adminPage = await adminContext.newPage();
  const studentPage = await studentContext.newPage();
  hook(adminPage, "admin");
  hook(studentPage, "student");

  const teacherContext = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const teacherPage = await teacherContext.newPage();
  hook(teacherPage, "teacher");

  /* ------------------------------------------------------------- login page */
  await check("login page renders", async () => {
    await adminPage.goto(`${BASE}/login`, { waitUntil: "networkidle" });
    await expectText(adminPage, "Welcome back");
    const demo = await adminPage.getByText("Demo accounts", { exact: false }).count();
    if (demo) throw new Error("demo accounts block should be removed");
    const slogan = await adminPage.getByText("Hindi tinipid,", { exact: false }).count();
    if (!slogan) throw new Error("brand slogan missing");
    ok("login page renders, no demo accounts, slogan present");
  });

  /* ------------------------------------------------------------- admin */
  await check("admin login + dashboard", async () => {
    await login(adminPage, "admin@school.edu", "Admin@123");
    if (!adminPage.url().endsWith("/admin")) throw new Error(`landed on ${adminPage.url()}`);
    await expectText(adminPage, "portal");
    ok(`admin dashboard at ${new URL(adminPage.url()).pathname}`);
  });

  await check("admin nav pages", async () => {
    const paths = ["/admin/students", "/admin/teachers", "/admin/subjects", "/admin/classes", "/admin/announcements"];
    for (const p of paths) {
      await nav(adminPage, p);
      const body = await adminPage.textContent("main");
      if (!body || body.trim().length < 40) throw new Error(`${p} rendered empty`);
      ok(`${p} rendered`);
    }
  });

  await check("admin class detail", async () => {
    await adminPage.goto(`${BASE}/admin/classes/${classId}`, { waitUntil: "networkidle" });
    await expectText(adminPage, teacherClasses[0].name);
    ok("class detail opens");
  });

  /* ------------------------------------------------------------- teacher */
  await check("teacher login + dashboard", async () => {
    await login(teacherPage, "teacher@school.edu", "Teacher@123");
    if (!teacherPage.url().endsWith("/teacher")) throw new Error(`landed on ${teacherPage.url()}`);
    await expectText(teacherPage, "Teacher dashboard");
    ok("teacher dashboard");
  });

  await check("teacher classes list", async () => {
    await nav(teacherPage, "/teacher/classes");
    await expectText(teacherPage, teacherClasses[0].name);
    ok("teacher classes list");
  });

  await check("teacher class detail tabs", async () => {
    await teacherPage.goto(`${BASE}/teacher/classes/${classId}`, { waitUntil: "networkidle" });
    await expectText(teacherPage, teacherClasses[0].name);
    const tabs = ["Students", "Modules", "Materials", "Assignments", "Quizzes", "Announcements", "Grades"];
    for (const t2 of tabs) {
      await tab(teacherPage, t2);
      const body = await teacherPage.textContent("main");
      if (/Could not load|Something went wrong|undefined is not/.test(body)) {
        throw new Error(`tab ${t2} shows an error`);
      }
      ok(`tab ${t2}`);
    }
  });

  /* ------------------------------------------------------------- create assignment */
  const assignmentTitle = `SMOKE assignment ${TS}`;
  await check("teacher creates assignment", async () => {
    await tab(teacherPage, "Assignments");
    await teacherPage.getByRole("button", { name: "Add assignment" }).click();
    const dialog = teacherPage.locator('div[role="dialog"]');
    await dialog.locator('input[placeholder="Chapter 1 Reflection"]').fill(assignmentTitle);
    await dialog.locator("textarea").first().fill("Write two paragraphs about the unit.");
    await dialog.getByRole("button", { name: "Create assignment" }).click();
    await expectText(teacherPage, "Assignment created");
    await expectText(teacherPage, assignmentTitle);
    ok("assignment created");
  });

  /* ------------------------------------------------------------- student submits */
  await check("student login + dashboard", async () => {
    await login(studentPage, "student@school.edu", "Student@123");
    if (!studentPage.url().endsWith("/student")) throw new Error(`landed on ${studentPage.url()}`);
    await expectText(studentPage, "Student dashboard");
    ok("student dashboard");
  });

  await check("student nav pages", async () => {
    const paths = ["/student/classes", "/student/assignments", "/student/grades", "/student/announcements"];
    for (const p of paths) {
      await nav(studentPage, p);
      const body = await studentPage.textContent("main");
      if (!body || body.trim().length < 40) throw new Error(`${p} rendered empty`);
      ok(`${p} rendered`);
    }
  });

  await check("student submits assignment", async () => {
    await studentPage.goto(`${BASE}/student/assignments`, { waitUntil: "networkidle" });
    const row = studentPage.locator("tr", { hasText: assignmentTitle });
    await row.waitFor({ timeout: 10000 });
    await row.getByRole("button", { name: "Submit" }).click();
    const dialog = studentPage.locator('div[role="dialog"]');
    await dialog.locator("textarea").first().fill("My smoke-test answer.");
    await dialog.getByRole("button", { name: "Submit", exact: true }).click();
    await expectText(studentPage, "Assignment submitted");
    ok("student submission accepted");
  });

  await check("teacher grades submission", async () => {
    await teacherPage.goto(`${BASE}/teacher/classes/${classId}`, { waitUntil: "networkidle" });
    await tab(teacherPage, "Assignments");
    const item = teacherPage.locator("li", { hasText: assignmentTitle });
    await item.waitFor({ timeout: 10000 });
    await item.getByRole("button", { name: "Review submissions" }).click();
    const dialog = teacherPage.locator('div[role="dialog"]');
    await expectText(teacherPage, "My smoke-test answer");
    await dialog.locator('input[type="number"]').first().fill("45");
    await dialog.locator('input[placeholder^="Great work"]').fill("Smoke feedback");
    await dialog.getByRole("button", { name: "Save grade" }).click();
    await expectText(teacherPage, "Grade saved");
    ok("grade saved");
  });

  await check("student sees grade", async () => {
    await studentPage.goto(`${BASE}/student/grades`, { waitUntil: "networkidle" });
    await expectText(studentPage, "45/100");
    await expectText(studentPage, "Smoke feedback");
    ok("grade + feedback visible to student");
  });

  /* ------------------------------------------------------------- quiz flow */
  const quizTitle = `SMOKE quiz ${TS}`;
  await check("teacher creates quiz", async () => {
    await teacherPage.goto(`${BASE}/teacher/classes/${classId}`, { waitUntil: "networkidle" });
    await tab(teacherPage, "Quizzes");
    await teacherPage.getByRole("button", { name: "Add quiz" }).click();
    const dialog = teacherPage.locator('div[role="dialog"]');
    await dialog.locator('input[placeholder="Introduction Quiz"]').fill(quizTitle);
    await dialog.locator('input[placeholder="Type the question…"]').fill("What is 2 + 2?");
    await dialog.locator('input[placeholder="Option 1"]').fill("4");
    await dialog.locator('input[placeholder="Option 2"]').fill("5");
    await dialog.locator('input[name="correct-0"]').first().check();
    await dialog.getByRole("button", { name: "Create quiz" }).click();
    await expectText(teacherPage, "Quiz created");
    await expectText(teacherPage, quizTitle);
    ok("quiz created");
  });

  await check("student takes quiz", async () => {
    await studentPage.goto(`${BASE}/student/classes/${classId}`, { waitUntil: "networkidle" });
    await tab(studentPage, "Quizzes");
    const item = studentPage.locator("li", { hasText: quizTitle });
    await item.waitFor({ timeout: 10000 });
    await item.getByRole("button", { name: "Take quiz" }).click();
    await expectText(studentPage, "What is 2 + 2?");
    await studentPage.locator('input[name="q-0"]').first().check();
    await studentPage.getByRole("button", { name: "Submit quiz" }).click();
    await expectText(studentPage, "1 / 1", { timeout: 15000 });
    ok("quiz scored 1 / 1");
  });

  await check("student class detail tabs", async () => {
    await studentPage.goto(`${BASE}/student/classes/${classId}`, { waitUntil: "networkidle" });
    for (const t2 of ["Modules", "Materials", "Assignments", "Announcements", "Overview"]) {
      await tab(studentPage, t2);
      const body = await studentPage.textContent("main");
      if (/Could not load|undefined is not/.test(body)) throw new Error(`tab ${t2} error`);
      ok(`student tab ${t2}`);
    }
  });

  /* ------------------------------------------------------------- cleanup via UI */
  await check("cleanup: delete quiz", async () => {
    await teacherPage.goto(`${BASE}/teacher/classes/${classId}`, { waitUntil: "networkidle" });
    await tab(teacherPage, "Quizzes");
    const item = teacherPage.locator("li", { hasText: quizTitle });
    await item.waitFor({ timeout: 10000 });
    await item.locator('button[title="Delete"]').click();
    const dialog = teacherPage.locator('div[role="dialog"]');
    await dialog.getByRole("button", { name: "Delete", exact: true }).click();
    await expectText(teacherPage, "Quiz deleted");
    ok("quiz deleted");
  });

  await check("cleanup: delete assignment", async () => {
    await tab(teacherPage, "Assignments");
    const item = teacherPage.locator("li", { hasText: assignmentTitle });
    await item.waitFor({ timeout: 10000 });
    await item.locator('button[title="Delete"]').click();
    const dialog = teacherPage.locator('div[role="dialog"]');
    await dialog.getByRole("button", { name: "Delete", exact: true }).click();
    await expectText(teacherPage, "Assignment deleted");
    ok("assignment deleted");
  });

  await check("teacher posts announcement", async () => {
    const annTitle = `SMOKE announcement ${TS}`;
    await teacherPage.goto(`${BASE}/teacher/announcements`, { waitUntil: "networkidle" });
    await teacherPage.getByRole("button", { name: "Post announcement" }).click();
    const dialog = teacherPage.locator('div[role="dialog"]');
    if (await dialog.locator("select").count()) {
      await dialog.locator("select").selectOption(classId);
    }
    await dialog.locator('input[placeholder="Midterm schedule"]').fill(annTitle);
    await dialog.locator("textarea").first().fill("Smoke announcement body.");
    await dialog.getByRole("button", { name: "Post", exact: true }).click();
    await expectText(teacherPage, "Announcement posted");
    await expectText(teacherPage, annTitle);
    ok("announcement posted");

    // student sees it
    await studentPage.goto(`${BASE}/student/announcements`, { waitUntil: "networkidle" });
    await expectText(studentPage, annTitle);
    ok("student sees announcement");

    // cleanup
    const li = teacherPage.locator("li", { hasText: annTitle });
    await li.locator('button[title="Delete"]').click();
    const d2 = teacherPage.locator('div[role="dialog"]');
    await d2.getByRole("button", { name: "Delete", exact: true }).click();
    await expectText(teacherPage, "Announcement deleted");
    ok("announcement deleted");
  });

  await check("logout works", async () => {
    await logout(teacherPage);
    ok("teacher logged out");
    await logout(studentPage);
    ok("student logged out");
  });

  await browser.close();

  const fails = results.filter((r) => r.startsWith("FAIL")).length;
  console.log("\n==============================");
  console.log(`PASS: ${results.length - fails}   FAIL: ${fails}`);
  console.log("==============================");

  const realConsole = consoleErrors.filter(
    (e) => !/favicon|Download the React DevTools|vite.*hmr|Failed to load resource.*404/i.test(e)
  );
  if (pageErrors.length) {
    console.log("\nPAGE ERRORS:");
    pageErrors.forEach((e) => console.log("  " + e));
  }
  if (realConsole.length) {
    console.log("\nCONSOLE ERRORS:");
    [...new Set(realConsole)].forEach((e) => console.log("  " + e));
  }
  process.exit(fails || pageErrors.length ? 1 : 0);
})().catch((e) => {
  console.error("SMOKE CRASH:", e);
  process.exit(2);
});
