"use client";

import { useEffect, useMemo, useRef } from "react";
import type { Map as LeafletMap, Marker as LeafletMarker } from "leaflet";
import type { Listing } from "@/lib/search";
import { formatRent } from "@/lib/search";

/**
 * OpenStreetMap via Leaflet rather than Google Maps: no API key, no billing
 * account, and no quota to lapse and silently break the map later.
 *
 * Leaflet is imported dynamically inside an effect because it reaches for
 * `window` at module scope — a static import crashes server rendering before
 * any of this component runs.
 */
export function ListingsMap({
  listings,
  activeSlug,
  onSelect,
}: {
  listings: Listing[];
  activeSlug?: string | null;
  onSelect?: (slug: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<Map<string, LeafletMarker>>(new Map());

  // Re-running on every listings change would tear the map down mid-pan, so the
  // instance is created once and markers are reconciled separately.
  useEffect(() => {
    let cancelled = false;
    // Captured now: by the time cleanup runs, the ref may point elsewhere.
    const markers = markersRef.current;

    (async () => {
      const L = await import("leaflet");
      if (cancelled || !containerRef.current || mapRef.current) return;

      const map = L.map(containerRef.current, {
        center: [51.515, -0.09],
        zoom: 12,
        scrollWheelZoom: false,
        attributionControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      mapRef.current = map;
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markers.clear();
    };
  }, []);

  const points = useMemo(
    () => listings.map((l) => ({ slug: l.slug, lat: l.latitude, lon: l.longitude, rent: l.rentPcm })),
    [listings]
  );

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const L = await import("leaflet");
      const map = mapRef.current;
      if (cancelled || !map) return;

      // Remove markers for listings that have filtered out.
      const wanted = new Set(points.map((p) => p.slug));
      for (const [slug, marker] of markersRef.current) {
        if (!wanted.has(slug)) {
          marker.remove();
          markersRef.current.delete(slug);
        }
      }

      for (const p of points) {
        const isActive = p.slug === activeSlug;
        const existing = markersRef.current.get(p.slug);

        // A price pin reads at a glance; a generic teardrop tells you nothing
        // until you click it.
        const icon = L.divIcon({
          className: "",
          html: `<span class="map-pin${isActive ? " map-pin-active" : ""}">${formatRent(p.rent)}</span>`,
          iconSize: [0, 0],
        });

        if (existing) {
          existing.setIcon(icon);
          continue;
        }

        const marker = L.marker([p.lat, p.lon], { icon }).addTo(map);
        marker.on("click", () => onSelect?.(p.slug));
        markersRef.current.set(p.slug, marker);
      }

      if (points.length > 0) {
        const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lon] as [number, number]));
        map.fitBounds(bounds, { padding: [48, 48], maxZoom: 15 });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [points, activeSlug, onSelect]);

  return (
    <div
      ref={containerRef}
      role="application"
      aria-label="Map of available properties"
      className="h-full w-full bg-surface-2"
    />
  );
}
