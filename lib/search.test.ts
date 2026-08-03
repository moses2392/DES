import { test } from "node:test";
import assert from "node:assert/strict";
import {
  applyFilters,
  distanceKm,
  formatRent,
  search,
  sortListings,
  withinBounds,
  type Listing,
} from "./search.ts";

/** Run with: npm test */

const make = (over: Partial<Listing> & { id: string }): Listing => ({
  slug: over.id,
  title: "A flat",
  rentPcm: 150000,
  bedrooms: 2,
  bathrooms: 1,
  propertyType: "flat",
  furnishing: "furnished",
  area: "Hackney",
  postcode: "E8 3DL",
  latitude: 51.545,
  longitude: -0.055,
  availableFrom: "2026-09-01",
  images: [],
  description: "",
  features: [],
  ...over,
});

const LISTINGS: Listing[] = [
  make({ id: "a", rentPcm: 120000, bedrooms: 1, area: "Peckham", postcode: "SE15 4TP", availableFrom: "2026-08-15" }),
  make({ id: "b", rentPcm: 180000, bedrooms: 3, propertyType: "house", availableFrom: "2026-09-01" }),
  make({ id: "c", rentPcm: 95000, bedrooms: 0, propertyType: "studio", furnishing: "unfurnished", availableFrom: "2026-10-01" }),
  make({ id: "d", rentPcm: 250000, bedrooms: 4, propertyType: "house", availableFrom: "2026-08-01" }),
];

test("a price range applies at both ends", () => {
  const ids = applyFilters(LISTINGS, { minRent: 100000, maxRent: 200000 }).map((l) => l.id);
  assert.deepEqual(ids.sort(), ["a", "b"]);
});

test("only one end of a price range is enough", () => {
  assert.deepEqual(applyFilters(LISTINGS, { maxRent: 100000 }).map((l) => l.id), ["c"]);
  assert.deepEqual(applyFilters(LISTINGS, { minRent: 200000 }).map((l) => l.id), ["d"]);
});

test("bedrooms means that many or more", () => {
  const ids = applyFilters(LISTINGS, { minBedrooms: 3 }).map((l) => l.id);
  assert.deepEqual(ids.sort(), ["b", "d"]);
});

test("a studio is zero bedrooms, not missing data", () => {
  const studios = applyFilters(LISTINGS, { propertyTypes: ["studio"] });
  assert.equal(studios.length, 1);
  assert.equal(studios[0].bedrooms, 0);
  // ...and must not be swept up by a "1+ bedrooms" search.
  assert.ok(!applyFilters(LISTINGS, { minBedrooms: 1 }).some((l) => l.id === "c"));
});

test("available-by includes anything free on or before that date", () => {
  const ids = applyFilters(LISTINGS, { availableBy: "2026-09-01" }).map((l) => l.id);
  assert.deepEqual(ids.sort(), ["a", "b", "d"]);
  assert.ok(!ids.includes("c"), "October is too late for a September move");
});

test("empty filter arrays do not exclude everything", () => {
  // A cleared checkbox group must behave as "no preference", not "match none".
  assert.equal(applyFilters(LISTINGS, { propertyTypes: [], furnishing: [] }).length, 4);
});

test("text search covers area and postcode, with or without the space", () => {
  assert.deepEqual(applyFilters(LISTINGS, { query: "peckham" }).map((l) => l.id), ["a"]);
  assert.deepEqual(applyFilters(LISTINGS, { query: "SE154TP" }).map((l) => l.id), ["a"]);
  assert.deepEqual(applyFilters(LISTINGS, { query: "se15 4tp" }).map((l) => l.id), ["a"]);
});

test("sorting by price runs both ways", () => {
  assert.deepEqual(sortListings(LISTINGS, "price-asc").map((l) => l.id), ["c", "a", "b", "d"]);
  assert.deepEqual(sortListings(LISTINGS, "price-desc").map((l) => l.id), ["d", "b", "a", "c"]);
});

test("sorting never reorders the caller's array", () => {
  const before = LISTINGS.map((l) => l.id);
  sortListings(LISTINGS, "price-desc");
  assert.deepEqual(LISTINGS.map((l) => l.id), before);
});

test("distance is roughly right between two known points", () => {
  // King's Cross to Canary Wharf is about 8 km.
  const km = distanceKm(51.5308, -0.1238, 51.5054, -0.0235);
  assert.ok(km > 7 && km < 9, `expected ~8 km, got ${km.toFixed(2)}`);
  assert.equal(distanceKm(51.5, -0.1, 51.5, -0.1), 0);
});

test("map bounds include and exclude correctly", () => {
  const bounds = { north: 51.6, south: 51.5, east: 0, west: -0.2 };
  assert.equal(withinBounds(51.55, -0.1, bounds), true);
  assert.equal(withinBounds(51.45, -0.1, bounds), false, "south of the window");
  assert.equal(withinBounds(51.55, 0.5, bounds), false, "east of the window");
});

test("bounds crossing the antimeridian still match", () => {
  // A window from 170°E to -170°E wraps the date line; naive comparison
  // would return nothing at all.
  const wrapped = { north: 10, south: -10, east: -170, west: 170 };
  assert.equal(withinBounds(0, 175, wrapped), true);
  assert.equal(withinBounds(0, -175, wrapped), true);
  assert.equal(withinBounds(0, 0, wrapped), false);
});

test("search combines filters, bounds and sorting", () => {
  const bounds = { north: 52, south: 51, east: 1, west: -1 };
  const ids = search(LISTINGS, { minBedrooms: 3 }, "price-asc", bounds).map((l) => l.id);
  assert.deepEqual(ids, ["b", "d"]);
});

test("rent is formatted from pence without stray decimals", () => {
  assert.equal(formatRent(150000), "£1,500");
  assert.equal(formatRent(95000), "£950");
});
