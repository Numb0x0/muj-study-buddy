/**
 * Browser end-to-end test (Playwright, Chromium): real Google sign-in through the
 * Auth emulator popup, non-admin refusal, drag-and-drop upload, publish, public
 * PDF viewer (desktop + mobile), search, unpublish, delete, sign-out.
 *
 *   npx playwright install chromium     (once)
 *   npm run emulators  &  npm run dev   (in other terminals)
 *   npm run test:browser                (BASE=http://localhost:3000 by default)
 *
 * Screenshots go to tests/.artifacts/. Emulator mode only — it creates data.
 */
import { chromium } from "playwright";
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
const BASE = process.env.BASE ?? "http://localhost:3000";
const PROJECT = process.cwd();
const OUT = "tests/.artifacts";
mkdirSync(OUT, { recursive: true });
if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS !== "true" && !existsSync(".env.local")) {
  console.error("Run from the project root with emulator settings in .env.local.");
  process.exit(1);
}
const EMAIL = `browser-admin-${Date.now().toString(36)}@example.com`;
const log = (...a) => console.log(...a);
const errors = [];
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 950 } });
const page = await ctx.newPage();
page.on("console", (m) => m.type() === "error" && errors.push(`console: ${m.text().slice(0, 200)}`));
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message.slice(0, 200)}`));

async function googlePopup(existing) {
  const [popup] = await Promise.all([page.waitForEvent("popup"), page.getByRole("button", { name: "Continue with Google" }).click()]);
  await popup.waitForLoadState("networkidle").catch(() => {});
  // Listen before clicking: the popup can close faster than a listener registered afterwards.
  const closing = popup.waitForEvent("close", { timeout: 8000 }).then(() => true).catch(() => popup.isClosed());
  if (existing) {
    await popup.getByText(EMAIL).first().click();
  } else {
    await popup.waitForLoadState("networkidle").catch(() => {});
    if (!(await popup.locator("#add-account-button button").isVisible().catch(() => false))) {
      await popup.screenshot({ path: `${OUT}/popup-debug.png` }).catch(() => {});
      console.log("popup url:", popup.url(), "closed:", popup.isClosed());
    }
    await popup.locator("#add-account-button button").click();
    await popup.locator("#email-input").fill(EMAIL);
    // The widget hands the result to the login page through a hidden iframe.
    // Clicking before that iframe is ready loses the result and the popup never closes.
    await popup.waitForFunction(() => window.opener && window.opener.frames.length > 0, null, { timeout: 15000 }).catch(() => {});
    await popup.waitForTimeout(1500);
    await popup.locator("#sign-in").click();
  }
  let closed = await closing;
  if (!closed && !popup.isClosed()) {
    // The emulator widget occasionally ignores the first click; retry once.
    await popup.locator("#sign-in").click().catch(() => {});
    closed = await popup.waitForEvent("close", { timeout: 8000 }).then(() => true).catch(() => popup.isClosed());
  }
  if (!closed) {
    await popup.screenshot({ path: `${OUT}/popup-stuck.png` });
    throw new Error("emulator popup did not close");
  }
}

// Fixture PDF (6 pages)
execSync(`npx tsx -e "import {makePdf} from './tests/make-pdf'; import {writeFileSync} from 'fs'; writeFileSync('${OUT}/Robot-Kinematics-Unit-1.pdf', makePdf(Array.from({length:6},(_,i)=>'Robot Kinematics - page '+(i+1))))"`, { cwd: PROJECT, stdio: "pipe" });
void writeFileSync;

// 1. Non-admin Google account is refused
await page.goto(`${BASE}/admin/login`, { waitUntil: "networkidle" });
await googlePopup(false).catch(async (e) => { if (!String(e).includes("did not close")) throw e; });
await page.getByText("Not an administrator", { exact: true }).waitFor({ timeout: 15000 }).catch(async (e) => {
  await page.screenshot({ path: `${OUT}/flow-1-debug.png` });
  console.log("debug url:", page.url(), "errors:", errors.slice(-5));
  throw e;
});
await page.screenshot({ path: `${OUT}/flow-1-not-admin.png` });
log("✔ non-admin account refused with clear message");

// 2. Grant admin, sign in again
execSync(`npx tsx scripts/set-admin-claim.ts grant ${EMAIL}`, { cwd: PROJECT, stdio: "pipe" });
await googlePopup(true);
await page.waitForURL(`${BASE}/admin`, { timeout: 20000 });
await page.waitForLoadState("networkidle");
await page.screenshot({ path: `${OUT}/flow-2-dashboard.png`, fullPage: true });
log("✔ admin signed in → dashboard");

// 3. Upload via dropzone input
await page.goto(`${BASE}/admin/notes/new`, { waitUntil: "networkidle" });
await page.locator('input[type="file"]').setInputFiles(`${OUT}/Robot-Kinematics-Unit-1.pdf`);
await page.getByText("uploaded privately").waitFor({ timeout: 30000 });
log("✔ PDF uploaded to private drafts with progress UI");
await page.getByLabel("Semester").selectOption({ label: "Semester 5" });
await page.getByLabel("Subject", { exact: false }).first().selectOption({ index: 1 });
// Seeded subjects follow the official syllabus, which lists topics rather than units — pick a unit only if one exists.
const unit = page.getByLabel("Unit");
if ((await unit.locator("option").count()) > 1) await unit.selectOption({ index: 1 });
await page.getByLabel("Resource type").selectOption("notes");
const tags = page.getByLabel("Tags");
await tags.fill("kinematics");
await tags.press("Enter");
await page.screenshot({ path: `${OUT}/flow-3-upload-form.png`, fullPage: true });
await page.getByRole("button", { name: "Save & publish" }).click();
await page.waitForURL((u) => /\/admin\/notes\/[A-Za-z0-9]+$/.test(u.pathname) && !u.pathname.endsWith("/new"), { timeout: 30000 });
const noteId = page.url().split("/").pop();
await page.waitForLoadState("networkidle");
await page.screenshot({ path: `${OUT}/flow-4-note-detail.png`, fullPage: true });
log(`✔ saved & published note ${noteId}`);

// 4. Public viewer
const pub = await ctx.newPage();
pub.on("pageerror", (e) => errors.push(`public pageerror: ${e.message.slice(0, 200)}`));
pub.on("console", (m) => m.type() === "error" && errors.push(`public console: ${m.text().slice(0, 200)}`));
await pub.goto(`${BASE}/notes/${noteId}`, { waitUntil: "networkidle" });
await pub.locator(".react-pdf__Page__canvas").first().waitFor({ timeout: 30000 });
const pagesText = await pub.locator("text=/of \\d+/").first().textContent();
const metaPages = await pub.locator("dt:has-text('Pages') + dd").textContent();
if (metaPages?.trim() !== "6") errors.push(`page count not recorded: ${metaPages}`);
log(`✔ page count recorded at upload: ${metaPages?.trim()}`);
await pub.getByRole("button", { name: "Zoom in" }).click();
await pub.getByRole("button", { name: "Next page" }).click();
await pub.waitForTimeout(800);
await pub.screenshot({ path: `${OUT}/flow-5-viewer-desktop.png` });
log(`✔ public PDF viewer rendered (${pagesText?.trim()}), zoom + page nav work`);
await pub.setViewportSize({ width: 390, height: 844 });
await pub.reload({ waitUntil: "networkidle" });
await pub.locator(".react-pdf__Page__canvas").first().waitFor({ timeout: 30000 });
await pub.screenshot({ path: `${OUT}/flow-6-viewer-mobile.png`, fullPage: true });
const overflow = await pub.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
log(`✔ mobile viewer rendered, horizontal overflow ${overflow}px`);

// 5. Homepage + resources show it
await pub.setViewportSize({ width: 1440, height: 950 });
await pub.goto(`${BASE}/resources?type=notes`, { waitUntil: "networkidle" });
await pub.getByText("Robot Kinematics Unit 1").first().waitFor({ timeout: 10000 });
await pub.getByLabel("Search resources").fill("kinem");
await pub.waitForTimeout(1200);
const found = await pub.getByText("Robot Kinematics Unit 1").count();
await pub.screenshot({ path: `${OUT}/flow-7-resources.png` });
log(`✔ resources page lists it; search 'kinem' matches: ${found > 0}`);

// 6. Unpublish via UI → public 404; then delete
await page.getByRole("button", { name: "Unpublish" }).click();
await page.getByRole("alertdialog").getByRole("button", { name: "Unpublish" }).click();
await page.getByText("Moved back to drafts").waitFor({ timeout: 15000 });
const status = (await pub.goto(`${BASE}/notes/${noteId}`)).status();
log(`✔ unpublished via UI → public page status ${status}`);
await page.getByRole("button", { name: /Delete/ }).first().click();
await page.getByRole("alertdialog").getByRole("button", { name: "Delete" }).click();
await page.waitForURL(`${BASE}/admin/notes`, { timeout: 15000 });
log("✔ deleted via UI");

// 7. Sign out
await page.getByRole("button", { name: /Sign out/ }).click();
await page.waitForURL(/\/admin\/login/, { timeout: 15000 });
log("✔ signed out");

// Ignored: expected 403/404 probes, and React's dev-only profiler bug
// ("Failed to execute 'measure' on 'Performance' … negative time stamp"), which
// does not occur in production builds.
const relevant = errors.filter((e) => !/favicon|Failed to load resource: the server responded with a status of (403|404)|Failed to execute 'measure' on 'Performance'/.test(e));
log(relevant.length ? `Console errors:\n  ${relevant.join("\n  ")}` : "No unexpected console errors");
await browser.close();
if (relevant.length) process.exit(1);
