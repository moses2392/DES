# DES

Long-term lettings for London. Search flats and houses on a live map, filter by
price, bedrooms and type, and enquire directly with the landlord.

![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square)
![Supabase](https://img.shields.io/badge/Supabase-Postgres-3ECF8E?style=flat-square)
![Leaflet](https://img.shields.io/badge/Leaflet-OpenStreetMap-199900?style=flat-square)

---

## What it does

- **Map search** — listings and map stay in sync; hovering a card highlights its pin
- **Price pins** rather than generic markers, so the market reads at a glance
- **Faceted filters** — area or postcode, maximum rent, minimum bedrooms, property type
- **Property pages** — gallery, specification, features, availability
- **Enquiries** sent straight to the landlord, with an optional viewing date

## Security: no secret key exists in this app

Both credentials it uses are safe in a browser. Enforcement lives in the
database rather than in application code:

| Table | Anyone can | Nobody can |
|---|---|---|
| `listings` | read published rows | write |
| `enquiries` | insert | **read** |

So a visitor can send an enquiry but cannot read anyone else's name, email or
message — even by tampering with the client. And because there is no secret,
nothing dangerous can leak through the repository or the hosting settings.

Reading enquiries is done from the Supabase dashboard, or from a future
authenticated staff area.

## Maps

OpenStreetMap via Leaflet — no API key, no billing account, and no quota that
can lapse and silently break the map later.

## Tested

```bash
npm test
```

14 tests over the search engine, covering the cases that are awkward to reach by
clicking: one-ended price ranges, "3+ bedrooms" meaning three or more, a studio
being zero bedrooms rather than missing data, cleared filter groups meaning
"no preference" rather than "match nothing", postcodes typed with or without the
space, and map bounds that cross the antimeridian — where west is numerically
greater than east and a naive comparison returns nothing at all.

## Running locally

```bash
npm install
cp .env.example .env.local   # then fill in the two Supabase values
npm run dev
```

Database setup: run `supabase/0001_schema.sql` then `supabase/0002_seed.sql` in
the Supabase SQL editor. Both are safe to run more than once.

## Notes

Property photography is from [Unsplash](https://unsplash.com) and the listings
are illustrative. DES is a demonstration build, not a trading letting agent.
