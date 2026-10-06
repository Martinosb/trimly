export const GHANA_REGIONS = [
  "Ahafo", "Ashanti", "Bono", "Bono East", "Central", "Eastern", "Greater Accra",
  "North East", "Northern", "Oti", "Savannah", "Upper East", "Upper West", "Volta", "Western", "Western North",
] as const;

export interface ShopLocation {
  region: string;
  city: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
}
export const EMPTY_LOCATION: ShopLocation = { region: "", city: "", address: "", latitude: null, longitude: null };
export function hasCoordinates(location: { latitude?: number | null; longitude?: number | null }): boolean {
  return typeof location.latitude === "number" && Number.isFinite(location.latitude) && Math.abs(location.latitude) <= 90
    && typeof location.longitude === "number" && Number.isFinite(location.longitude) && Math.abs(location.longitude) <= 180;
}
export function locationError(location: ShopLocation): string | null {
  if (!GHANA_REGIONS.some(region => region === location.region)) return "Select your shop’s region.";
  if (!location.city.trim()) return "Enter your shop’s city, town, or village.";
  if (!location.address.trim()) return "Enter an area, street address, or landmark so customers can find your shop.";
  if ((location.latitude !== null || location.longitude !== null) && !hasCoordinates(location)) return "Set a valid map pin or remove it to continue.";
  return null;
}
export function locationPayload(location: ShopLocation) {
  return { ...location, city: location.city.trim(), address: location.address.trim() };
}
export function directionsUrl(location: { latitude?: number | null; longitude?: number | null; address: string; city: string; region?: string | null }) {
  const destination = hasCoordinates(location) ? `${location.latitude},${location.longitude}`
    : [location.address, location.city, location.region, "Ghana"].filter(Boolean).join(", ");
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
}
export function getDeviceLocation(): Promise<{ latitude: number; longitude: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error("Location isn’t available in this browser. Enter your location manually."));
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({ latitude: coords.latitude, longitude: coords.longitude }),
      error => reject(new Error(error.code === 1 ? "Location permission was denied. You can still choose your location manually."
        : "Couldn’t get your location. Try again or choose it manually.")),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  });
}
