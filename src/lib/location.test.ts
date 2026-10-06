import { describe, expect, it } from "vitest";
import { EMPTY_LOCATION, GHANA_REGIONS, directionsUrl, hasCoordinates, locationError } from "./location";

describe("Nationwide shop locations", () => {
  it("accepts an unlisted village without a map pin", () => {
    expect(GHANA_REGIONS).toHaveLength(16);
    expect(locationError({ ...EMPTY_LOCATION, region: "Volta", city: "My village", address: "Opposite the school" })).toBeNull();
  });
  it("rejects missing regions and incomplete or invalid coordinates", () => {
    const location = { ...EMPTY_LOCATION, region: "Ashanti", city: "Berekum", address: "Market Road" };
    expect(locationError({ ...location, region: "" })).toBeTruthy();
    expect(locationError({ ...location, latitude: 6 })).toBeTruthy();
    expect(hasCoordinates({ latitude: NaN, longitude: 0 })).toBe(false);
    expect(hasCoordinates({ latitude: 91, longitude: 0 })).toBe(false);
    expect(hasCoordinates({ latitude: 0, longitude: 0 })).toBe(true);
  });
  it("uses an exact pin for directions or falls back to the Ghana address", () => {
    const location = { ...EMPTY_LOCATION, city: "Kpando", address: "Market & Main Street", region: "Volta" };
    expect(new URL(directionsUrl(location)).searchParams.get("destination")).toBe("Market & Main Street, Kpando, Volta, Ghana");
    expect(new URL(directionsUrl({ ...location, latitude: 6.9, longitude: 0.3 })).searchParams.get("destination")).toBe("6.9,0.3");
  });
});
