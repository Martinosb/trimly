import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  headless: true,
  args: ["--no-sandbox"],
});
const results = [];
for (const viewport of [
  { width: 1440, height: 1000 },
  { width: 390, height: 844 },
]) {
  const page = await browser.newPage({ viewport });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.route("**/api/shops?*", (route) =>
    route.fulfill({ json: { shops: [], total: 0 } }),
  );
  await page.goto("http://localhost:3000");
  await page
    .getByRole("heading", { name: "Good grooming. On your time." })
    .waitFor();
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await page
    .getByRole("heading", { name: "Good things start with a first booking." })
    .waitFor();
  assert(
    await page
      .locator(".hero-photo img")
      .evaluate((i) => i.complete && i.naturalWidth > 0),
  );
  assert(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  await page.getByRole("link", { name: "Find your next appointment" }).click();
  assert(await page.evaluate(() => location.hash === "#shops"));
  await page.screenshot({
    path: `docs/review-${viewport.width}.png`,
    fullPage: true,
  });
  await page.goto("http://localhost:3000/login");
  await page
    .getByRole("heading", { name: "Sign-in is temporarily unavailable" })
    .waitFor();
  assert(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  assert.deepEqual(errors, []);
  results.push({ viewport, errors });
  await page.close();
}
console.log(JSON.stringify(results, null, 2));
await browser.close();
