import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("./session", () => ({
  checkIsPlatformAdmin: vi.fn(),
  getOwnerShop: vi.fn(),
  getStaffProfile: vi.fn(),
}));
import { checkIsPlatformAdmin, getOwnerShop, getStaffProfile } from "./session";
import { getWorkspaceDestination, safeDestination } from "./destination";

beforeEach(() => vi.resetAllMocks());
describe("workspace routing", () => {
  it("routes administrators from trusted membership", async () => {
    vi.mocked(checkIsPlatformAdmin).mockResolvedValue(true);
    expect(await getWorkspaceDestination("admin-id")).toBe("/admin");
    expect(getOwnerShop).not.toHaveBeenCalled();
  });
  it("routes staff without a shop to their schedule", async () => {
    vi.mocked(getStaffProfile).mockResolvedValue({ id: "staff" } as never);
    expect(await getWorkspaceDestination("staff-id")).toBe("/staff");
  });
  it("gives owners their dashboard even when they also have a staff profile", async () => {
    vi.mocked(getOwnerShop).mockResolvedValue({ id: "shop" } as never);
    vi.mocked(getStaffProfile).mockResolvedValue({ id: "staff" } as never);
    expect(await getWorkspaceDestination("owner-id")).toBe("/dashboard");
  });
  it("sends a new account to onboarding", async () => {
    expect(await getWorkspaceDestination("new-id")).toBe("/onboard");
  });
  it.each(["https://evil.example", "//evil.example", "/\\evil.example", null])(
    "rejects external or malformed destinations: %s",
    (value) => {
      expect(safeDestination(value)).toBeNull();
    },
  );
  it("preserves an internal destination", () =>
    expect(safeDestination("/dashboard/settings")).toBe("/dashboard/settings"));
});
