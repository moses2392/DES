"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import {
  describeBedrooms,
  formatRent,
  search,
  type Filters,
  type Listing,
  type PropertyType,
  type SortKey,
} from "@/lib/search";

// Leaflet touches `window` on import, so the map must never be part of the
// server render.
const ListingsMap = dynamic(
  () => import("@/components/listings-map").then((m) => m.ListingsMap),
  { ssr: false, loading: () => <div className="h-full w-full animate-pulse bg-surface-2" /> }
);

const TYPES: { value: PropertyType; label: string }[] = [
  { value: "flat", label: "Flat" },
  { value: "house", label: "House" },
  { value: "studio", label: "Studio" },
  { value: "room", label: "Room" },
];

const SORTS: { value: SortKey; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price low to high" },
  { value: "price-desc", label: "Price high to low" },
  { value: "beds-desc", label: "Most bedrooms" },
];

export function SearchView({ listings }: { listings: Listing[] }) {
  const [query, setQuery] = useState("");
  const [maxRent, setMaxRent] = useState<number | undefined>();
  const [minBedrooms, setMinBedrooms] = useState<number | undefined>();
  const [types, setTypes] = useState<PropertyType[]>([]);
  const [sort, setSort] = useState<SortKey>("newest");
  const [active, setActive] = useState<string | null>(null);

  const filters: Filters = useMemo(
    () => ({ query, maxRent, minBedrooms, propertyTypes: types }),
    [query, maxRent, minBedrooms, types]
  );

  const results = useMemo(() => search(listings, filters, sort), [listings, filters, sort]);

  const toggleType = (t: PropertyType) =>
    setTypes((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

  const clear = () => {
    setQuery("");
    setMaxRent(undefined);
    setMinBedrooms(undefined);
    setTypes([]);
  };

  const filtersActive =
    query !== "" || maxRent !== undefined || minBedrooms !== undefined || types.length > 0;

  return (
    <div className="flex flex-col">
      {/* ------------------------------------------------------------ Filters */}
      <div className="sticky top-0 z-30 border-b border-line bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-3 px-4 py-3 md:px-6">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Area or postcode — try Hackney or SE15"
            aria-label="Search by area or postcode"
            className="field max-w-xs flex-1"
          />

          <label className="flex items-center gap-2 text-sm">
            <span className="text-muted">Max rent</span>
            <select
              value={maxRent ?? ""}
              onChange={(e) => setMaxRent(e.target.value ? Number(e.target.value) : undefined)}
              className="field w-auto"
            >
              <option value="">Any</option>
              {[100000, 150000, 200000, 250000, 300000].map((p) => (
                <option key={p} value={p}>
                  {formatRent(p)}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-2 text-sm">
            <span className="text-muted">Beds</span>
            <select
              value={minBedrooms ?? ""}
              onChange={(e) => setMinBedrooms(e.target.value ? Number(e.target.value) : undefined)}
              className="field w-auto"
            >
              <option value="">Any</option>
              {[1, 2, 3, 4].map((n) => (
                <option key={n} value={n}>
                  {n}+
                </option>
              ))}
            </select>
          </label>

          <div className="flex flex-wrap gap-2">
            {TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                aria-pressed={types.includes(t.value)}
                onClick={() => toggleType(t.value)}
                className="chip"
              >
                {t.label}
              </button>
            ))}
          </div>

          <label className="ml-auto flex items-center gap-2 text-sm">
            <span className="text-muted">Sort</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="field w-auto"
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>

          {filtersActive && (
            <button type="button" onClick={clear} className="text-sm text-brand hover:underline">
              Clear
            </button>
          )}
        </div>
      </div>

      {/* --------------------------------------------------- Results and map */}
      <div className="mx-auto grid w-full max-w-[1600px] gap-0 lg:grid-cols-2">
        <div className="order-2 px-4 py-5 md:px-6 lg:order-1">
          <p className="mb-4 text-sm text-muted" role="status" aria-live="polite">
            {results.length} {results.length === 1 ? "property" : "properties"}
            {filtersActive ? " matching your search" : " to rent"}
          </p>

          {listings.length === 0 ? (
            <div className="card p-8 text-center">
              <h2 className="mb-2 text-lg font-semibold">No properties loaded yet</h2>
              <p className="text-sm text-muted">
                The listings table is empty. Once properties are added they will appear here
                automatically.
              </p>
            </div>
          ) : results.length === 0 ? (
            <div className="card p-8 text-center">
              <h2 className="mb-2 text-lg font-semibold">Nothing matches those filters</h2>
              <p className="mb-4 text-sm text-muted">
                Try widening the rent range or removing a property type.
              </p>
              <button type="button" onClick={clear} className="btn btn-quiet">
                Clear filters
              </button>
            </div>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2">
              {results.map((l) => (
                <li key={l.id}>
                  <Link
                    href={`/property/${l.slug}`}
                    onMouseEnter={() => setActive(l.slug)}
                    onMouseLeave={() => setActive(null)}
                    onFocus={() => setActive(l.slug)}
                    onBlur={() => setActive(null)}
                    className="card group block overflow-hidden transition-shadow hover:shadow-md"
                  >
                    <div className="relative aspect-[4/3] bg-surface-2">
                      {l.images[0] && (
                        <Image
                          src={l.images[0]}
                          alt={l.title}
                          fill
                          sizes="(max-width: 640px) 100vw, 25vw"
                          className="object-cover"
                        />
                      )}
                      <span className="absolute left-3 top-3 rounded bg-card/95 px-2 py-1 text-xs font-semibold">
                        {formatRent(l.rentPcm)} pcm
                      </span>
                    </div>
                    <div className="p-4">
                      <h3 className="truncate font-semibold group-hover:text-brand">{l.title}</h3>
                      <p className="mt-1 text-sm text-muted">
                        {l.area} · {l.postcode}
                      </p>
                      <p className="mt-2 text-sm text-ink-2">
                        {describeBedrooms(l.bedrooms)} · {l.bathrooms} bath ·{" "}
                        <span className="capitalize">{l.furnishing.replace("-", " ")}</span>
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="order-1 h-[38vh] border-b border-line lg:order-2 lg:sticky lg:top-[57px] lg:h-[calc(100vh-57px)] lg:border-b-0 lg:border-l">
          <ListingsMap listings={results} activeSlug={active} onSelect={setActive} />
        </div>
      </div>
    </div>
  );
}
