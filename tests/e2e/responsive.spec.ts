import { test, expect } from "@playwright/test";

const VIEWPORTS = [
  { name: "Small Mobile (320x640)", width: 320, height: 640 },
  { name: "Standard Mobile (375x667)", width: 375, height: 667 },
  { name: "Modern Mobile (390x844)", width: 390, height: 844 },
  { name: "Tablet Portrait (768x1024)", width: 768, height: 1024 },
  { name: "Tablet Landscape (1024x768)", width: 1024, height: 768 },
  { name: "Laptop (1280x800)", width: 1280, height: 800 },
  { name: "Desktop (1920x1080)", width: 1920, height: 1080 },
];

const PAGES_TO_TEST = [
  { path: "/", title: "Trimly Landing Page" },
  { path: "/book/gentlemens-cut", title: "Public Booking Portal" },
  { path: "/book/gentlemens-cut/manage", title: "Booking Management" },
  { path: "/dashboard", title: "Live Timeline Dashboard" },
  { path: "/dashboard/services", title: "Services & Pricing" },
  { path: "/dashboard/staff", title: "Barbers & Chairs" },
  { path: "/dashboard/settings", title: "Shop Settings" },
  { path: "/staff", title: "Staff Mobile View" },
  { path: "/onboard", title: "Onboarding Wizard" },
  { path: "/login", title: "Shop Login" },
  { path: "/admin", title: "Platform Admin Console" },
];

test.describe("Cross-Device Responsive Viewport Matrix", () => {
  for (const vp of VIEWPORTS) {
    test.describe(`Viewport: ${vp.name}`, () => {
      test.use({ viewport: { width: vp.width, height: vp.height } });

      for (const targetPage of PAGES_TO_TEST) {
        test(`${targetPage.title} (${targetPage.path}) has zero horizontal overflow`, async ({ page }) => {
          await page.goto(targetPage.path, { waitUntil: "domcontentloaded" });

          // Wait for content rendering
          await page.waitForTimeout(300);

          // Mathematically verify that document width does NOT exceed viewport width
          const overflowData = await page.evaluate(() => {
            const docWidth = document.documentElement.scrollWidth;
            const winWidth = window.innerWidth;
            const bodyWidth = document.body.scrollWidth;
            return {
              docWidth,
              winWidth,
              bodyWidth,
              overflows: docWidth > winWidth || bodyWidth > winWidth,
            };
          });

          expect(
            overflowData.overflows,
            `Expected ${targetPage.path} not to have horizontal overflow at ${vp.width}px wide, but docWidth=${overflowData.docWidth}, bodyWidth=${overflowData.bodyWidth}, winWidth=${overflowData.winWidth}`
          ).toBe(false);
        });
      }
    });
  }
});
