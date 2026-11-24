/**
 * Illustrative geolocation. IOCs are mostly IPs/domains/hashes and this app does not do
 * GeoIP lookups, so each indicator is placed deterministically on one of these cities
 * (same indicator, same place). The map is labelled accordingly in the UI.
 */
export interface Place {
  city: string;
  lat: number;
  lng: number;
}

export const PLACES: Place[] = [
  { city: "New York", lat: 40.71, lng: -74.0 },
  { city: "Toronto", lat: 43.65, lng: -79.38 },
  { city: "Mexico City", lat: 19.43, lng: -99.13 },
  { city: "São Paulo", lat: -23.55, lng: -46.63 },
  { city: "Buenos Aires", lat: -34.6, lng: -58.38 },
  { city: "London", lat: 51.5, lng: -0.12 },
  { city: "Frankfurt", lat: 50.11, lng: 8.68 },
  { city: "Moscow", lat: 55.75, lng: 37.62 },
  { city: "Istanbul", lat: 41.01, lng: 28.98 },
  { city: "Cairo", lat: 30.04, lng: 31.24 },
  { city: "Lagos", lat: 6.52, lng: 3.38 },
  { city: "Johannesburg", lat: -26.2, lng: 28.04 },
  { city: "Dubai", lat: 25.2, lng: 55.27 },
  { city: "Tehran", lat: 35.69, lng: 51.39 },
  { city: "Karachi", lat: 24.86, lng: 67.0 },
  { city: "Mumbai", lat: 19.08, lng: 72.88 },
  { city: "Singapore", lat: 1.35, lng: 103.82 },
  { city: "Jakarta", lat: -6.2, lng: 106.85 },
  { city: "Beijing", lat: 39.9, lng: 116.4 },
  { city: "Shanghai", lat: 31.23, lng: 121.47 },
  { city: "Seoul", lat: 37.57, lng: 126.98 },
  { city: "Tokyo", lat: 35.68, lng: 139.69 },
  { city: "Sydney", lat: -33.87, lng: 151.21 },
];

/** Where arcs converge: the protected network. */
export const HUB: Place = { city: "Protected network", lat: 50.11, lng: 8.68 };

export function placeFor(value: string): Place {
  let h = 5381;
  for (let i = 0; i < value.length; i++) h = ((h << 5) + h + value.charCodeAt(i)) | 0;
  return PLACES[Math.abs(h) % PLACES.length];
}

export const severityColor = (score: number) => (score >= 80 ? "#ef4444" : score >= 50 ? "#f59e0b" : "#38bdf8");
