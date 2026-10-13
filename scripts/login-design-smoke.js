/**
 * Visual + functional verification for the redesigned login & registration pages.
 * Screenshots at 1920 / 1366 / 768 / 390 and checks for slogan, demo removal, overflow.
 */
const { chromium } = require("playwright");
const path = require("path");

const BASE = "http://localhost:5173";
const OUT = "/tmp/opencode/shots";
const WIDTHS = [
  { w: 1920, h: 1080, name: "1920" },
  { w: 1366, h: 768, name: "1366" },
  { w: 768, h: 1024, name: "768" },
  { w: 390, h: 844, name: "390" },
];

const results = [];
const fails = [];
function ok(m) { results.push(`  ok   ${m}`); console.log(`  ok   ${m}`); }
function bad(m) { results.push(`FAIL   ${m}`); fails.push(m); console.log(`FAIL   ${m}`); }
async function check(label, fn) {
  console.log(`== ${label} ==`);
  try { await fn(); } catch (e) { bad(`${label} -> ${String(e.message).split("\n")[0]}`); }
}

async function pageOverflow(pg) {
  return await pg.evaluate(() => ({
    scrollW: document.documentElement.scrollWidth,
    clientW: document.documentElement.clientWidth,
    bodyScrollW: document.body.scrollWidth,
  }));
}

(async () => {
  const fs = require("fs");
  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

  const browser = await chromium.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage"] });

  /* ---- LOGIN PAGE ---- */
  for (const { w, h, name } of WIDTHS) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h } });
    const page = await ctx.newPage();
    const pageErrors = [];
    page.on("pageerror", (e) => pageErrors.push(e.message));

    await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(OUT, `login-${name}.png`), fullPage: true });

    const body = await page.textContent("body");

    // Slogan present (exact spelling TINIPID)
    if (!/Hindi tinipid,\s*pero tinamad\./i.test(body.replace(/\s+/g, " ")))
      bad(`[${name}] slogan missing or misspelled`);
    else ok(`[${name}] slogan correct ("Hindi tinipid, pero tinamad.")`);

    // Old headline gone
    if (/Everything your class needs, in one place/i.test(body))
      bad(`[${name}] old headline still present`);
    else ok(`[${name}] old headline removed`);

    // Demo accounts fully removed
    if (/DEMO ACCOUNTS|npm run seed|Development accounts|Administrator account|Teacher account|Student account/i.test(body))
      bad(`[${name}] demo-account panel still present`);
    else ok(`[${name}] demo-account panel removed`);

    // Role boxes removed
    if (/Manage people|Teach & grade|Learn & submit/i.test(body))
      bad(`[${name}] role boxes still present`);
    else ok(`[${name}] role boxes removed`);

    // No horizontal overflow
    const ov = await pageOverflow(page);
    if (ov.scrollW > ov.clientW + 1) bad(`[${name}] horizontal overflow: ${ov.scrollW} > ${ov.clientW}`);
    else ok(`[${name}] no horizontal overflow (${ov.scrollW} <= ${ov.clientW})`);

    // Form width check on desktop (>=1024 where two-column applies)
    if (w >= 1024) {
      const formW = await page.evaluate(() => {
        const el = document.querySelector("form")?.parentElement;
        return el ? Math.round(el.getBoundingClientRect().width) : 0;
      });
      if (formW < 400 || formW > 470) bad(`[${name}] form container width ${formW}px not in 400-470 range`);
      else ok(`[${name}] form width ~${formW}px (target 400-450)`);

      // Input height check
      const inputH = await page.evaluate(() => {
        const el = document.querySelector('input[type="email"]');
        return el ? Math.round(el.getBoundingClientRect().height) : 0;
      });
      if (inputH < 44 || inputH > 50) bad(`[${name}] email input height ${inputH}px not in 44-48 range`);
      else ok(`[${name}] input height ~${inputH}px`);

      // Button same width as inputs
      const dims = await page.evaluate(() => {
        const input = document.querySelector('input[type="email"]');
        const btn = document.querySelector('button[type="submit"]');
        return {
          iw: input ? Math.round(input.getBoundingClientRect().width) : 0,
          bw: btn ? Math.round(btn.getBoundingClientRect().width) : 0,
        };
      });
      if (Math.abs(dims.iw - dims.bw) > 4) bad(`[${name}] button ${dims.bw}px != input ${dims.iw}px`);
      else ok(`[${name}] Sign-in button width matches inputs (${dims.bw}px)`);

      // Left panel proportion (45%)
      const leftPct = await page.evaluate(() => {
        const panels = document.querySelectorAll("body > #root > div > div, #root > div > div");
        // find the sage panel
        const sage = [...document.querySelectorAll("div")].find(
          (d) => getComputedStyle(d).backgroundColor === "rgb(53, 94, 82)"
        );
        return sage ? (sage.getBoundingClientRect().width / window.innerWidth) * 100 : 0;
      });
      if (leftPct && (leftPct < 40 || leftPct > 50)) bad(`[${name}] left panel ${leftPct.toFixed(1)}% not ~45%`);
      else if (leftPct) ok(`[${name}] left panel ~${leftPct.toFixed(1)}% (target ~45%)`);
    }

    // Heading size
    const h2 = await page.evaluate(() => {
      const el = document.querySelector("h2");
      return el ? getComputedStyle(el).fontSize : "";
    });
    if (w >= 1024 && h2) {
      const px = parseFloat(h2);
      if (px < 28) bad(`[${name}] heading ${h2} too small`);
      else ok(`[${name}] heading size ${h2}`);
    }

    if (pageErrors.length) bad(`[${name}] page errors: ${pageErrors.join("; ")}`);
    else ok(`[${name}] no page errors`);

    await ctx.close();
  }

  /* ---- REGISTER PAGE ---- */
  for (const { w, h, name } of WIDTHS) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h } });
    const page = await ctx.newPage();
    const pageErrors = [];
    page.on("pageerror", (e) => pageErrors.push(e.message));

    await page.goto(`${BASE}/register`, { waitUntil: "networkidle" });
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(OUT, `register-${name}.png`), fullPage: true });

    const body = await page.textContent("body");

    if (!/Hindi tinipid,\s*pero tinamad\./i.test(body.replace(/\s+/g, " ")))
      bad(`[reg ${name}] slogan missing or misspelled`);
    else ok(`[reg ${name}] slogan correct`);

    if (/DEMO ACCOUNTS|npm run seed|Development accounts|Administrator account/i.test(body))
      bad(`[reg ${name}] demo-account panel still present`);
    else ok(`[reg ${name}] demo-account panel removed`);

    if (/Manage people|Teach & grade|Learn & submit/i.test(body))
      bad(`[reg ${name}] role boxes still present`);
    else ok(`[reg ${name}] role boxes removed`);

    const ov = await pageOverflow(page);
    if (ov.scrollW > ov.clientW + 1) bad(`[reg ${name}] horizontal overflow`);
    else ok(`[reg ${name}] no horizontal overflow`);

    // Registration form fields present
    const hasFields = await page.evaluate(() => ({
      name: !!document.querySelector('input[placeholder="Juan Dela Cruz"]'),
      email: !!document.querySelector('input[placeholder="you@school.edu"]'),
      pw: document.querySelectorAll('input[autocomplete="new-password"]').length === 2,
      submit: !!document.querySelector('button[type="submit"]'),
    }));
    if (!hasFields.name || !hasFields.email || !hasFields.pw || !hasFields.submit)
      bad(`[reg ${name}] missing form fields: ${JSON.stringify(hasFields)}`);
    else ok(`[reg ${name}] all registration fields present`);

    if (pageErrors.length) bad(`[reg ${name}] page errors: ${pageErrors.join("; ")}`);
    else ok(`[reg ${name}] no page errors`);

    await ctx.close();
  }

  await browser.close();

  console.log("\n==============================");
  console.log(`PASS: ${results.length - fails.length}   FAIL: ${fails.length}`);
  console.log(`Screenshots in ${OUT}`);
  console.log("==============================");
  process.exit(fails.length ? 1 : 0);
})();
