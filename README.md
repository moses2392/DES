# DES

Long-term lettings for London. A public site to search flats and houses on a
live map, and the back office the agency runs it from.

![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square)
![Supabase](https://img.shields.io/badge/Supabase-Postgres-3ECF8E?style=flat-square)
![Leaflet](https://img.shields.io/badge/Leaflet-OpenStreetMap-199900?style=flat-square)

---

## The public site

- **Map search** — listings and map stay in sync; hovering a card highlights its pin
- **Price pins** rather than generic markers, so the market reads at a glance
- **Faceted filters** — area or postcode, maximum rent, minimum bedrooms, property type
- **Property pages** — gallery, specification, features, availability
- **Enquiries** with an optional viewing date

## The back office — `/admin`

- **Properties** — add, edit, publish, unpublish. Photographs upload from the
  browser and can be reordered. Location is set by **clicking a map**, because
  typing coordinates is how a flat ends up in the Atlantic.
- **Enquiries** — a pipeline: New → Contacted → Viewing booked → Closed.
  Assignable, with a notes trail, and upcoming viewings on the dashboard.
- **Team** — owners add staff and deactivate leavers.

Two roles. Agents manage properties and enquiries. Only owners can delete a
property, delete an enquiry, or change the team — and deleting a property sits
behind typing its name, because it cascades every enquiry about it.

Setting it up is documented in [docs/back-office.md](docs/back-office.md).

## Security: this app still holds no secret key

Both credentials it uses are safe in a browser, and adding a back office did not
change that. Staff powers come from **being signed in**, not from a privileged
key — every admin rule is a question the database asks about who you are:

```sql
create policy "enquiries_staff_read" on public.enquiries
  for select to authenticated using (public.is_staff());
```

| Table | Public | Signed in, not staff | Agent | Owner |
|---|---|---|---|---|
| `listings` | read published | read published | read all, write | + delete |
| `enquiries` | **insert only** | nothing | read, update | + delete |
| `enquiry_notes` | nothing | nothing | read, append | read, append |
| `staff` | nothing | nothing | read | read, write |

The same key sitting in a visitor's browser cannot read a single enquiry.
Photograph uploads go straight from the browser to storage under a policy that
checks the same thing, which is why no upload endpoint exists here.

The practical consequence: **a mistake in application code returns fewer rows,
never someone else's.** Security does not depend on remembering a filter.

`enquiry_notes` has an insert policy and a select policy and **no update or
delete policy at all** — not for agents, not for owners. A pipeline whose
history can be rewritten afterwards cannot settle an argument about who
promised what. Status changes are written into the same trail, so it reads as
one sequence.

## Maps

OpenStreetMap via Leaflet — no API key, no billing account, and no quota that
can lapse and silently break the map later.

## Tested

```bash
npm test          # 30 tests, no network
```

**Search (14)** — the cases awkward to reach by clicking: one-ended price
ranges, "3+ bedrooms" meaning three or more, a studio being zero bedrooms rather
than missing data, cleared filter groups meaning "no preference" rather than
"match nothing", postcodes typed with or without the space, and map bounds that
cross the antimeridian, where west is numerically greater than east and a naive
comparison returns nothing at all.

**Listing validation (16)** — rent parsed to integer pence, because a float
cannot hold £1,850.10 exactly and rent drifting by a penny a month is a bug
nobody finds for a year; a pin outside London refused, since the public map fits
itself to every pin and one bad coordinate stretches the map for everyone;
£185,000 a month caught as a pounds-and-pence mix-up rather than published; and
every problem on a form reported at once, because revealing one error per submit
takes five round trips to fill in.

### Proving the permissions

```bash
SUPABASE_SERVICE_ROLE_KEY=... npm run verify:staff
```

Creates a real owner, a real agent and a real signed-in outsider, then checks
what each can actually do — through ordinary sessions with the publishable key,
never the service key, since a check that bypasses row-level security proves
nothing about it. It confirms an agent cannot delete a property or promote
themselves, that a signed-in non-staff account sees no enquiries, that neither
an agent nor an owner can rewrite a note, that authorship cannot be forged, and
that deactivating someone takes effect immediately while their password still
works.

Several checks assert on the **stored row afterwards** rather than on an error,
because Postgres reports success for an `UPDATE` that matches zero rows — a test
looking only for an error code would pass while data changed.

The service key is read from the environment for that one command and never
written to a file. This app holds no secret, and that stays true after the tests.

## Running locally

```bash
npm install
cp .env.example .env.local   # then fill in the two Supabase values
npm run dev
```

Database setup, in order, in the Supabase SQL editor. All are safe to run more
than once:

| File | |
|---|---|
| `supabase/0001_schema.sql` | listings and enquiries |
| `supabase/0002_seed.sql` | demo properties |
| `supabase/0003_staff_and_admin.sql` | staff, notes, photo storage, permissions |

After the third, create the first login — see
[docs/back-office.md](docs/back-office.md#2-create-the-first-login).

## Notes

Property photography is from [Unsplash](https://unsplash.com) and the listings
are illustrative. DES is a demonstration build, not a trading letting agent.
