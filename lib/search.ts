/**
 * Listing search: filtering, geospatial distance, and map-bounds queries.
 *
 * Pure functions over plain data so the fiddly parts — a price range with only
 * one end supplied, "3+ bedrooms" meaning three or more, a map window that
 * crosses the antimeridian — are testable directly rather than only by dragging
 * a map around.
 */

export type PropertyType = "flat" | "house" | "studio" | "room";
export type Furnishing = "furnished" | "part-furnished" | "unfurnished";

export interface Listing {
  id: string;
  slug: string;
  title: string;
  /** Monthly rent in pence. Money is never a float. */
  rentPcm: number;
  bedrooms: number;
  bathrooms: number;
  propertyType: PropertyType;
  furnishing: Furnishing;
  area: string;
  postcode: string;
  latitude: number;
  longitude: number;
  availableFrom: string;
  images: string[];
  description: string;
  features: string[];
}

export interface Filters {
  /** Pence. Either end may be omitted. */
  minRent?: number;
  maxRent?: number;
  /** Treated as "this many or more" — nobody searching for 2 beds wants exactly 2. */
  minBedrooms?: number;
  propertyTypes?: PropertyType[];
  furnishing?: Furnishing[];
  /** ISO date; excludes anything not available by then. */
  availableBy?: string;
  /** Free text across title, area and postcode. */
  query?: string;
}

export interface Bounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export type SortKey = "newest" | "price-asc" | "price-desc" | "beds-desc";

/* ------------------------------- geography -------------------------------- */

const EARTH_RADIUS_KM = 6371;

const toRadians = (deg: number) => (deg * Math.PI) / 180;

/** Great-circle distance in kilometres. */
export function distanceKm(
  aLat: number,
  aLon: number,
  bLat: number,
  bLon: number
): number {
  const dLat = toRadians(bLat - aLat);
  const dLon = toRadians(bLon - aLon);
  const lat1 = toRadians(aLat);
  const lat2 = toRadians(bLat);

  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

/**
 * Whether a point sits inside a map window.
 *
 * Longitude is handled separately because a window can straddle the
 * antimeridian, where west is numerically greater than east. Comparing
 * naively there excludes everything, and the map silently returns nothing.
 */
export function withinBounds(lat: number, lon: number, bounds: Bounds): boolean {
  if (lat < bounds.south || lat > bounds.north) return false;

  return bounds.west <= bounds.east
    ? lon >= bounds.west && lon <= bounds.east
    : lon >= bounds.west || lon <= bounds.east;
}

/* -------------------------------- filtering ------------------------------- */

function matchesQuery(listing: Listing, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  // Postcodes are written with and without the space, so compare both stripped.
  const haystack = [listing.title, listing.area, listing.postcode]
    .join(" ")
    .toLowerCase();
  return (
    haystack.includes(needle) ||
    haystack.replace(/\s+/g, "").includes(needle.replace(/\s+/g, ""))
  );
}

export function applyFilters(listings: Listing[], filters: Filters): Listing[] {
  return listings.filter((l) => {
    if (filters.minRent !== undefined && l.rentPcm < filters.minRent) return false;
    if (filters.maxRent !== undefined && l.rentPcm > filters.maxRent) return false;
    if (filters.minBedrooms !== undefined && l.bedrooms < filters.minBedrooms) return false;

    if (filters.propertyTypes?.length && !filters.propertyTypes.includes(l.propertyType)) {
      return false;
    }
    if (filters.furnishing?.length && !filters.furnishing.includes(l.furnishing)) {
      return false;
    }
    // Available "by" a date means on or before it — a place free from the 1st
    // still suits someone who needs it by the 15th.
    if (filters.availableBy && l.availableFrom > filters.availableBy) return false;
    if (filters.query && !matchesQuery(l, filters.query)) return false;

    return true;
  });
}

export function sortListings(listings: Listing[], sort: SortKey): Listing[] {
  const copy = [...listings];
  switch (sort) {
    case "price-asc":
      return copy.sort((a, b) => a.rentPcm - b.rentPcm);
    case "price-desc":
      return copy.sort((a, b) => b.rentPcm - a.rentPcm);
    case "beds-desc":
      return copy.sort((a, b) => b.bedrooms - a.bedrooms || a.rentPcm - b.rentPcm);
    default:
      // Newest first; ties broken by price so the order is never arbitrary.
      return copy.sort(
        (a, b) => b.availableFrom.localeCompare(a.availableFrom) || a.rentPcm - b.rentPcm
      );
  }
}

export function search(
  listings: Listing[],
  filters: Filters,
  sort: SortKey = "newest",
  bounds?: Bounds
): Listing[] {
  const filtered = applyFilters(listings, filters);
  const inView = bounds
    ? filtered.filter((l) => withinBounds(l.latitude, l.longitude, bounds))
    : filtered;
  return sortListings(inView, sort);
}

/* -------------------------------- display --------------------------------- */

export function formatRent(pence: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(pence / 100);
}

export function describeBedrooms(count: number): string {
  return count === 0 ? "Studio" : `${count} bed${count === 1 ? "" : "s"}`;
}
