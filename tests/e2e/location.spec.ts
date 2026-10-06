import { test, expect } from "@playwright/test";

test.use({ serviceWorkers: "block" });

const shop = { id: "village-shop", name: "Village Cuts", slug: "village-cuts", tagline: null, city: "Unlisted Village", region: "Volta", address: "Opposite the school", latitude: 6.9, longitude: 0.3, distance_km: null, total_count: 1 };

test("nationwide discovery searches towns and regions and keeps denied geolocation usable", async ({ page, context }) => {
  const queries: URL[] = [];
  await page.route("**/api/shops?*", async route => {
    queries.push(new URL(route.request().url()));
    await route.fulfill({ json: { shops: [shop], total: 1 } });
  });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Village Cuts" })).toBeVisible();
  await page.getByLabel("Town, area, or shop name").fill("Unlisted Village");
  await page.getByLabel("Region", { exact: true }).selectOption("Volta");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect.poll(() => queries.at(-1)?.searchParams.get("q")).toBe("Unlisted Village");
  expect(queries.at(-1)?.searchParams.get("region")).toBe("Volta");
  await page.evaluate(() => { Object.defineProperty(navigator, "geolocation", { configurable: true, value: { getCurrentPosition: (_success: unknown, failure: (error: { code: number }) => void) => failure({ code: 1 }) } }); });
  await page.getByRole("button", { name: "Near me", exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Location permission" })).toContainText("permission was denied");
  await expect(page.getByRole("heading", { name: "Village Cuts" })).toBeVisible();
  await context.grantPermissions(["geolocation"]);
  await context.setGeolocation({ latitude: 6.9, longitude: 0.3 });
  await page.reload();
  await page.getByRole("button", { name: "Near me", exact: true }).click();
  await expect.poll(() => queries.at(-1)?.searchParams.get("lat")).toBe("6.9");
  await expect(page.getByLabel("Within")).toBeVisible();
  await page.getByRole("button", { name: "Clear nearby filter" }).click();
  await expect.poll(() => queries.at(-1)?.searchParams.has("lat")).toBe(false);
});

test("owners can register an unlisted village and confirm or remove a manual pin", async ({ page }) => {
  await page.goto("/onboard");
  await page.getByLabel("Region", { exact: false }).selectOption("Volta");
  await page.getByLabel("City, town, or village").fill("Unlisted Village");
  await page.getByLabel("Area, street address, or landmark").fill("Opposite the school");
  await page.getByText("Enter coordinates manually", { exact: true }).click();
  await page.getByLabel("Latitude, longitude").fill("6.9, 0.3");
  await page.getByRole("button", { name: "Set pin", exact: true }).click();
  await expect(page.getByText("Pin: 6.90000, 0.30000")).toBeVisible();
  const confirmation = page.getByRole("checkbox", { name: /I confirm/ });
  await confirmation.check();
  await page.getByLabel("City, town, or village").fill("Another village");
  await expect(confirmation).not.toBeChecked();
  await page.getByRole("button", { name: "Remove pin", exact: true }).click();
  await expect(page.getByText("Pin: 6.90000, 0.30000")).not.toBeVisible();
  await expect(confirmation).not.toBeChecked();
});
