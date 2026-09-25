import { test, expect } from "@playwright/test";

test.describe("Trimly End-to-End User Journeys", () => {
  test("1. Landing page displays Ghanaian locations, slogan, and featured shop", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Trimly/);
    await expect(page.locator("h1")).toContainText("The new way to get a beautiful cut");
    await expect(page.getByText("Accra • Kumasi • Tema")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Gentlemen's Cut" })).toBeVisible();
  });

  test("2. Full Public Booking Flow with real slot hold, QR code pass, and confirmation", async ({ page }) => {
    await page.goto("/book/gentlemens-cut");

    // Step 1: Select Service
    await expect(page.getByRole("heading", { name: "Select a Service" })).toBeVisible();
    const serviceCard = page.getByText("The Executive Cut").first();
    await expect(serviceCard).toBeVisible();
    await serviceCard.click();

    // Click Continue
    const continueBtn = page.getByRole("button", { name: /Continue with The Executive Cut/i });
    await expect(continueBtn).toBeEnabled();
    await continueBtn.click();

    // Step 2: Choose Barber
    await expect(page.getByText("Choose your Barber")).toBeVisible();
    const anyBarber = page.getByText("Any Available Barber");
    await expect(anyBarber).toBeVisible();
    await anyBarber.click();

    // Click Continue
    await page.getByRole("button", { name: /Continue to Date & Time/i }).click();

    // Step 3: Pick Date & Time
    await expect(page.getByText("Pick Date & Time")).toBeVisible();
    // Wait for slots to load
    const firstSlot = page.locator("button:has-text('AM'), button:has-text('PM')").first();
    await expect(firstSlot).toBeVisible({ timeout: 10000 });
    await firstSlot.click();

    // Click Continue
    await page.getByRole("button", { name: /Book for/i }).click();

    // Step 4: Client Details & Payment Choice
    await expect(page.getByText("Client Details & Payment")).toBeVisible();
    await page.fill("input[placeholder='e.g. Kwesi Arthur']", "Kwame Playwright");
    await page.fill("input[placeholder='+233 24 000 0000']", "+233 24 555 1234");
    await page.fill("input[placeholder='name@example.com']", "playwright@test.com");

    // Select Pay at Shop if available or MoMo
    const payAtShopOption = page.getByText("Reserve & Pay at Shop");
    if (await payAtShopOption.isVisible()) {
      await payAtShopOption.click();
    }

    // Confirm & Reserve
    await page.getByRole("button", { name: /Confirm & Reserve Slot/i }).click();

    // Step 5: Booking Confirmed & Pass with QR Code
    await expect(page.getByText("Booking Confirmed!")).toBeVisible({ timeout: 15000 });
    await expect(page.locator("img[alt='Booking QR Code']")).toBeVisible();
    await expect(page.getByText("Booking Pass")).toBeVisible();
    await expect(page.getByText(/#[a-f0-9]{6,12}/i)).toBeVisible();
  });

  test("3. Owner Live Timeline and Walk-In Seat Booking", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByText("Live Chairs")).toBeVisible();
    await expect(page.getByText("Today's Revenue")).toBeVisible();

    // Check staff chairs exist
    await expect(page.getByText("Kojo Mensah")).toBeVisible();
    await expect(page.getByText("Kwame Asante")).toBeVisible();
    await expect(page.getByText("Emmanuel Osei")).toBeVisible();

    // Open Walk-In Modal
    await page.getByRole("button", { name: /Walk-In/i }).click();
    await expect(page.getByText("Add Walk-In Client")).toBeVisible();
    await page.fill("input[placeholder='e.g. Yaw Osei']", "Walkin Client");
    await page.getByRole("button", { name: /Confirm Walk-In Seat/i }).click();
  });

  test("4. Platform Admin Console for developer Martin", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.getByText("Trimly Platform Admin")).toBeVisible();
    await expect(page.getByText("Active Shops")).toBeVisible();
    await expect(page.getByText("Gentlemen's Cut")).toBeVisible();
    await expect(page.getByRole("button", { name: /Drilldown/i }).first()).toBeVisible();
  });

  test("5. Shop Owner Login via quick shortcut redirects to /dashboard", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /Demo Shop Owner/i }).click();
    await page.locator("form button[type='submit']").click();
    await page.waitForURL("**/dashboard", { timeout: 15000 });
    await expect(page.getByText("Live Chairs")).toBeVisible();
  });
});


