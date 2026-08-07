/**
 * Validating a property before it reaches the database.
 *
 * Pure, with no imports, so it can be tested directly and used from both the
 * server action and the form. The database has check constraints on most of
 * this — those are the real guarantee — but a constraint violation surfaces as
 * "new row violates check constraint listings_rent_pcm_check", which is not
 * something to show an estate agent at half past five.
 */

export const PROPERTY_TYPES = ["flat", "house", "studio", "room"] as const;
export const FURNISHINGS = ["furnished", "part-furnished", "unfurnished"] as const;

export type PropertyType = (typeof PROPERTY_TYPES)[number];
export type Furnishing = (typeof FURNISHINGS)[number];

export interface ListingDraft {
  slug: string;
  title: string;
  description: string;
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
  features: string[];
  published: boolean;
}

export type Validated =
  | { ok: true; value: ListingDraft }
  | { ok: false; errors: Record<string, string> };

/** London-ish bounds. A property outside these is a typo, not a listing. */
const LONDON = { minLat: 51.2, maxLat: 51.75, minLon: -0.55, maxLon: 0.35 };

export function slugify(title: string, area = ""): string {
  const base = `${area} ${title}`
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 70)
    .replace(/^-|-$/g, "");
  return base || "property";
}

/**
 * Pounds as typed by a person, to pence as stored.
 *
 * Accepts "1,850", "£1850", "1850.50". Money is stored as an integer because a
 * float cannot hold 1850.10 exactly, and rent that drifts by a penny a month is
 * the kind of bug nobody finds for a year.
 */
export function poundsToPence(input: string): number | null {
  const cleaned = input.replace(/[£,\s]/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  return Math.round(Number(cleaned) * 100);
}

export function penceToPounds(pence: number): string {
  return (pence / 100).toFixed(pence % 100 === 0 ? 0 : 2);
}

/** Splits a textarea of one-per-line values, dropping blanks. */
export function splitLines(input: string): string[] {
  return input
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
}

export function validate(raw: Record<string, string>, imageList: string[]): Validated {
  const errors: Record<string, string> = {};
  const text = (k: string) => (raw[k] ?? "").trim();

  const title = text("title");
  if (title.length < 5) errors.title = "Give the property a title of at least 5 characters.";
  if (title.length > 160) errors.title = "That title is too long.";

  const area = text("area");
  if (!area) errors.area = "Which area is it in?";

  const postcode = text("postcode").toUpperCase();
  // Deliberately loose: a full UK postcode regex rejects valid edge cases, and
  // being unable to list a flat because of a regex is worse than a typo.
  if (!/^[A-Z]{1,2}\d[A-Z\d]?\s*\d?[A-Z]{0,2}$/.test(postcode)) {
    errors.postcode = "That does not look like a postcode.";
  }

  const rentPcm = poundsToPence(text("rentPcm"));
  if (rentPcm === null || rentPcm <= 0) {
    errors.rentPcm = "Enter the monthly rent, for example 1850.";
  } else if (rentPcm > 5_000_000) {
    // £50,000 a month. Almost certainly pence typed into a pounds field.
    errors.rentPcm = "That rent looks like a mistake — check whether you meant pounds.";
  }

  const bedrooms = Number(text("bedrooms"));
  if (!Number.isInteger(bedrooms) || bedrooms < 0 || bedrooms > 20) {
    errors.bedrooms = "Bedrooms must be a whole number. Use 0 for a studio.";
  }

  const bathrooms = Number(text("bathrooms"));
  if (!Number.isInteger(bathrooms) || bathrooms < 0 || bathrooms > 20) {
    errors.bathrooms = "Bathrooms must be a whole number.";
  }

  const propertyType = text("propertyType") as PropertyType;
  if (!PROPERTY_TYPES.includes(propertyType)) errors.propertyType = "Choose a property type.";

  const furnishing = text("furnishing") as Furnishing;
  if (!FURNISHINGS.includes(furnishing)) errors.furnishing = "Choose a furnishing option.";

  const latitude = Number(text("latitude"));
  const longitude = Number(text("longitude"));
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    errors.latitude = "Set the location by clicking the map.";
  } else if (
    latitude < LONDON.minLat ||
    latitude > LONDON.maxLat ||
    longitude < LONDON.minLon ||
    longitude > LONDON.maxLon
  ) {
    // The pin drives the map on the public site. One outside London does not
    // just look wrong, it stretches everyone else's map to fit it.
    errors.latitude = "That pin is outside London. Click the map to place it.";
  }

  const availableFrom = text("availableFrom");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(availableFrom) || Number.isNaN(Date.parse(availableFrom))) {
    errors.availableFrom = "Choose the date it becomes available.";
  }

  const description = text("description");
  if (description.length > 4000) errors.description = "That description is too long.";

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  const slugSource = text("slug");
  return {
    ok: true,
    value: {
      slug: slugSource ? slugify(slugSource) : slugify(title, area),
      title,
      description,
      rentPcm: rentPcm!,
      bedrooms,
      bathrooms,
      propertyType,
      furnishing,
      area,
      postcode,
      latitude,
      longitude,
      availableFrom,
      images: imageList,
      features: splitLines(text("features")),
      published: raw.published === "on" || raw.published === "true",
    },
  };
}
