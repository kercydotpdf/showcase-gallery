/**
 * Browser E2E for the EduWow registration flow.
 * Covers: Sign up link -> register form -> success -> login -> correct dashboard.
 * Cleans up the accounts it creates.
 */
const { chromium } = require("playwright");

const BASE = "http://localhost:5173";
const API = "http://localhost:5000/api";
const TS = Date.now();

const results = [];
function ok(m) { results.push(`  ok   ${m}`); console.log(`  ok   ${m}`); }
function bad(m) { results.push(`FAIL   ${m}`); console.log(`FAIL   ${m}`); }
async function check(label, fn) {
  console.log(`== ${label} ==`);
  try { await fn(); } catch (e) { bad(`${label} -> ${String(e.message).split("\n")[0]}`); }
}

const errs = [];
function hook(page, tag) {
  page.on("pageerror", (e) => errs.push(`[${tag}] ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error" && !/favicon|Download the React DevTools/.test(m.text()))
      errs.push(`[${tag}] ${m.text()}`);
  });
}

async function registerViaUi(page, { name, email, password, confirm, role }) {
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('a[href="/register"]', { timeout: 15000 });
  await page.click('a[href="/register"]');
  await page.waitForURL("**/register", { timeout: 15000 });

  // Full name
  await page.fill('input[placeholder="Juan Dela Cruz"]', name);
  // Email
  await page.fill('input[placeholder="you@school.edu"]', email);
  // Password + confirm (both are type=password initially)
  const pw = page.locator('input[autocomplete="new-password"]');
  await pw.nth(0).fill(password);
  await pw.nth(1).fill(confirm);
  // Account type
  await page.click(`button:has-text("${role}")`);
  await page.click('button:has-text("Create account")');
}

(async () => {
  const browser = await chromium.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage"] });
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await ctx.newPage();
  hook(page, "reg");

  const studentEmail = `ui-reg-student-${TS}@example.com`;
  const teacherEmail = `ui-reg-teacher-${TS}@example.com`;
  const PW = "secret123";

  /* ---- 1. Sign up link present on login page ---- */
  await check("login page has Sign up link", async () => {
    await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
    const link = page.locator('a[href="/register"]');
    if (!(await link.count())) throw new Error("no /register link on login page");
    const text = await link.first().textContent();
    if (!/sign up/i.test(text)) throw new Error(`link text was "${text}"`);
    ok(`Sign up link visible ("${text.trim()}")`);
  });

  /* ---- 2. Register a student via the UI ---- */
  await check("register student via UI form", async () => {
    await registerViaUi(page, {
      name: "UI Reg Student",
      email: studentEmail,
      password: PW,
      confirm: PW,
      role: "Student",
    });
    await page.waitForSelector('text=Account created', { timeout: 15000 });
    ok("success message shown after student registration");
    // waits for redirect to /login
    await page.waitForURL("**/login", { timeout: 15000 });
    ok("auto-redirected to /login");
  });

  /* ---- 3. Login as the new student, land on student dashboard ---- */
  await check("new student logs in and reaches student dashboard", async () => {
    await page.fill('input[type="email"]', studentEmail);
    await page.fill('input[type="password"]', PW);
    await page.click('button[type="submit"]');
    await page.waitForURL((u) => u.pathname === "/student", { timeout: 20000 });
    await page.waitForSelector("text=No classes", { timeout: 15000 });
    const body = await page.textContent("body");
    if (!/student/i.test(body)) throw new Error("dashboard doesn't look like student portal");
    ok("landed on /student dashboard");
    if (!/no classes/i.test(body))
      throw new Error("missing empty-state for unenrolled student");
    ok("empty state shown (student not enrolled in any class)");
  });

  /* ---- 4. Logout ---- */
  await check("logout", async () => {
    await page.click('button:has-text("Logout")');
    await page.waitForURL("**/login", { timeout: 15000 });
    ok("logged out back to /login");
  });

  /* ---- 5. Register a teacher via the UI ---- */
  await check("register teacher via UI form", async () => {
    await registerViaUi(page, {
      name: "UI Reg Teacher",
      email: teacherEmail,
      password: PW,
      confirm: PW,
      role: "Teacher",
    });
    await page.waitForSelector('text=Account created', { timeout: 15000 });
    ok("success message shown after teacher registration");
    await page.waitForURL("**/login", { timeout: 15000 });
    ok("auto-redirected to /login");
  });

  /* ---- 6. Login as new teacher, land on teacher dashboard ---- */
  await check("new teacher logs in and reaches teacher dashboard", async () => {
    await page.fill('input[type="email"]', teacherEmail);
    await page.fill('input[type="password"]', PW);
    await page.click('button[type="submit"]');
    await page.waitForURL((u) => u.pathname === "/teacher", { timeout: 20000 });
    await page.waitForSelector("text=No classes", { timeout: 15000 });
    const body = await page.textContent("body");
    if (!/teacher/i.test(body)) throw new Error("dashboard doesn't look like teacher portal");
    ok("landed on /teacher dashboard");
    if (!/no classes/i.test(body))
      throw new Error("missing empty-state for teacher with no classes");
    ok("empty state shown (teacher has no classes assigned)");
  });

  /* ---- 7. Confirm-password client-side validation ---- */
  await check("confirm-password mismatch blocks submit", async () => {
    await page.click('button:has-text("Logout")');
    await page.waitForURL("**/login", { timeout: 15000 });
    await page.goto(`${BASE}/register`, { waitUntil: "networkidle" });
    await page.fill('input[placeholder="Juan Dela Cruz"]', "Mismatch");
    await page.fill('input[placeholder="you@school.edu"]', `mismatch-${TS}@example.com`);
    const pw = page.locator('input[autocomplete="new-password"]');
    await pw.nth(0).fill("secret123");
    await pw.nth(1).fill("different123");
    await page.click('button:has-text("Create account")');
    await page.waitForSelector('text=Passwords do not match', { timeout: 10000 });
    // still on register page
    if (!page.url().includes("/register")) throw new Error("navigated away despite validation error");
    ok("mismatch error shown, form not submitted");
  });

  await browser.close();

  /* ---- cleanup accounts created by this run ---- */
  const { chromium: _ } = require("playwright");
  const res = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@school.edu", password: "Admin@123" }),
  });
  const { token } = await res.json();
  for (const email of [studentEmail, teacherEmail]) {
    const list = await fetch(`${API}/users?search=${encodeURIComponent(email)}`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((r) => r.json());
    const u = Array.isArray(list) ? list.find((x) => x.email === email) : null;
    if (u?._id) {
      await fetch(`${API}/users/${u._id}?hard=true`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log(`  cleanup: deleted ${email}`);
    } else {
      console.log(`  cleanup: ${email} not found (already removed)`);
    }
  }

  const fails = results.filter((r) => r.startsWith("FAIL")).length;
  console.log("\n==============================");
  console.log(`PASS: ${results.length - fails}   FAIL: ${fails}`);
  console.log("==============================");
  if (errs.length) {
    console.log("\nCONSOLE/PAGE ERRORS:");
    [...new Set(errs)].forEach((e) => console.log("  " + e));
  }
  process.exit(fails || errs.length ? 1 : 0);
})();
