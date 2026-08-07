import { test } from "node:test";
import assert from "node:assert/strict";
import {
  penceToPounds,
  poundsToPence,
  slugify,
  splitLines,
  validate,
} from "./listing-form.ts";

/** Run with: npm test */

const GOOD: Record<string, string> = {
  title: "Two-bedroom flat on Wilton Way",
  description: "A first-floor flat in a Victorian conversion.",
  rentPcm: "2150",
  bedrooms: "2",
  bathrooms: "1",
  propertyType: "flat",
  furnishing: "furnished",
  area: "Hackney",
  postcode: "E8 3EG",
  latitude: "51.5453",
  longitude: "-0.0561",
  availableFrom: "2026-09-01",
  features: "Sash windows\nGas central heating",
  published: "on",
};

test("a complete, sensible property validates", () => {
  const result = validate(GOOD, ["https://example.com/a.jpg"]);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.value.rentPcm, 215000);
  assert.equal(result.value.published, true);
  assert.deepEqual(result.value.features, ["Sash windows", "Gas central heating"]);
});

test("rent is stored as an integer number of pence", () => {
  // A float cannot hold 1850.10 exactly, and rent that drifts by a penny a
  // month is a bug nobody finds for a year.
  assert.equal(poundsToPence("1850"), 185000);
  assert.equal(poundsToPence("1,850"), 185000);
  assert.equal(poundsToPence("£1850"), 185000);
  assert.equal(poundsToPence("1850.50"), 185050);
  assert.equal(poundsToPence("1850.1"), 185010);
});

test("rent that is not a number is rejected rather than becoming NaN", () => {
  assert.equal(poundsToPence("about 2k"), null);
  assert.equal(poundsToPence(""), null);
  assert.equal(poundsToPence("1850.999"), null);
  assert.equal(poundsToPence("-500"), null);
});

test("pence round-trip back to pounds without stray decimals", () => {
  assert.equal(penceToPounds(185000), "1850");
  assert.equal(penceToPounds(185050), "1850.50");
});

test("an absurd rent is caught as a pounds/pence mix-up", () => {
  // Someone typing 185000 meaning pence would otherwise list a flat at
  // £185,000 per month and nobody would notice until a tenant laughed.
  const result = validate({ ...GOOD, rentPcm: "185000" }, []);
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.match(result.errors.rentPcm, /pounds/);
});

test("a studio is zero bedrooms, not missing data", () => {
  const result = validate({ ...GOOD, bedrooms: "0", propertyType: "studio" }, []);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.value.bedrooms, 0);
});

test("a pin outside London is refused", () => {
  // The public map fits itself to every pin, so one bad coordinate stretches
  // the map for every other property too.
  const paris = validate({ ...GOOD, latitude: "48.8566", longitude: "2.3522" }, []);
  assert.equal(paris.ok, false);
  if (paris.ok) return;
  assert.match(paris.errors.latitude, /outside London/);
});

test("a missing pin is refused rather than defaulting to zero", () => {
  // Latitude 0, longitude 0 is in the Atlantic, and Number("") is 0.
  const result = validate({ ...GOOD, latitude: "", longitude: "" }, []);
  assert.equal(result.ok, false);
});

test("bedrooms must be whole — half a bedroom is a typo", () => {
  assert.equal(validate({ ...GOOD, bedrooms: "2.5" }, []).ok, false);
  assert.equal(validate({ ...GOOD, bedrooms: "-1" }, []).ok, false);
});

test("property type and furnishing must match the database constraint", () => {
  assert.equal(validate({ ...GOOD, propertyType: "castle" }, []).ok, false);
  assert.equal(validate({ ...GOOD, furnishing: "sort of" }, []).ok, false);
});

test("postcodes are accepted loosely and stored uppercase", () => {
  const result = validate({ ...GOOD, postcode: "e8 3eg" }, []);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.value.postcode, "E8 3EG");

  assert.equal(validate({ ...GOOD, postcode: "SW1A" }, []).ok, true);
  assert.equal(validate({ ...GOOD, postcode: "not a postcode" }, []).ok, false);
});

test("an unparseable date is refused instead of becoming Invalid Date", () => {
  assert.equal(validate({ ...GOOD, availableFrom: "next Tuesday" }, []).ok, false);
  assert.equal(validate({ ...GOOD, availableFrom: "2026-13-45" }, []).ok, false);
  assert.equal(validate({ ...GOOD, availableFrom: "" }, []).ok, false);
});

test("several problems are reported at once, not one at a time", () => {
  // A form that reveals one error per submit takes five round trips to fill in.
  const result = validate({ ...GOOD, title: "No", rentPcm: "abc", postcode: "?" }, []);
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.ok(Object.keys(result.errors).length >= 3);
});

test("slugs are url-safe, deduplicated of punctuation, and bounded", () => {
  assert.equal(slugify("Two-bedroom flat on Wilton Way", "Hackney"), "hackney-two-bedroom-flat-on-wilton-way");
  assert.equal(slugify("Flat  —  £2,150 p/m!!"), "flat-2150-pm");
  assert.ok(slugify("x".repeat(200)).length <= 70);
});

test("editing keeps the existing web address instead of regenerating it", () => {
  // The edit form submits the current slug. Without it the slug is rebuilt from
  // the title, so fixing a typo in a title would move the property's public URL
  // and break every link already shared.
  const renamed = validate(
    { ...GOOD, slug: "e8-wilton-way-two-bed", title: "Two-bedroom flat on Wilton Way (updated)" },
    []
  );
  assert.equal(renamed.ok, true);
  if (!renamed.ok) return;
  assert.equal(renamed.value.slug, "e8-wilton-way-two-bed");
});

test("a new property with no slug supplied derives one from area and title", () => {
  const created = validate(GOOD, []);
  assert.equal(created.ok, true);
  if (!created.ok) return;
  assert.equal(created.value.slug, "hackney-two-bedroom-flat-on-wilton-way");
});

test("a title with no usable characters still produces a slug", () => {
  // "***" would otherwise slugify to an empty string and violate NOT NULL.
  assert.equal(slugify("***"), "property");
  assert.equal(slugify(""), "property");
});

test("feature lines are trimmed and blanks dropped", () => {
  assert.deepEqual(splitLines("  Garden \n\n\n  New kitchen  \n"), ["Garden", "New kitchen"]);
  assert.deepEqual(splitLines(""), []);
});
