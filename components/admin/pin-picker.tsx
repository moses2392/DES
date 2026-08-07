"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, Marker as LeafletMarker } from "leaflet";

/**
 * Placing the property on the map.
 *
 * Typing coordinates by hand is how a flat ends up in the Atlantic, so the pin
 * is placed by clicking. The numbers stay visible and editable underneath,
 * because occasionally someone genuinely has them from a floor plan.
 *
 * Leaflet is imported inside an effect: it reaches for `window` at module
 * scope, and a static import crashes server rendering before this component
 * runs at all.
 */
export function PinPicker({
  latitude,
  longitude,
  error,
}: {
  latitude: number | null;
  longitude: number | null;
  error?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);

  const [lat, setLat] = useState<number | null>(latitude);
  const [lon, setLon] = useState<number | null>(longitude);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const L = await import("leaflet");
      if (cancelled || !containerRef.current || mapRef.current) return;

      const start: [number, number] = latitude != null && longitude != null
        ? [latitude, longitude]
        : [51.515, -0.09];

      const map = L.map(containerRef.current, {
        center: start,
        zoom: latitude != null ? 16 : 11,
        scrollWheelZoom: false,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      const icon = L.divIcon({
        className: "",
        html: '<span class="map-pin map-pin-active">Here</span>',
        iconSize: [0, 0],
      });

      if (latitude != null && longitude != null) {
        markerRef.current = L.marker([latitude, longitude], { icon }).addTo(map);
      }

      map.on("click", (e: { latlng: { lat: number; lng: number } }) => {
        const { lat: clickedLat, lng } = e.latlng;
        // Six decimals is about 10cm — more is noise from a mouse click.
        const rounded: [number, number] = [
          Number(clickedLat.toFixed(6)),
          Number(lng.toFixed(6)),
        ];
        setLat(rounded[0]);
        setLon(rounded[1]);

        if (markerRef.current) markerRef.current.setLatLng(rounded);
        else markerRef.current = L.marker(rounded, { icon }).addTo(map);
      });

      mapRef.current = map;
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // Deliberately once: re-running would tear the map down while it is in use.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <span className="mb-1.5 block text-sm font-semibold">Location</span>
      <p className="mb-2 text-xs text-muted">
        Click the map to drop the pin. This is what places the property on the public map.
      </p>

      <div
        ref={containerRef}
        className="h-72 w-full overflow-hidden rounded-[--radius] border border-line-strong"
      />

      <div className="mt-2 grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="latitude" className="mb-1 block text-xs text-muted">
            Latitude
          </label>
          <input
            id="latitude"
            name="latitude"
            value={lat ?? ""}
            onChange={(e) => setLat(e.target.value === "" ? null : Number(e.target.value))}
            inputMode="decimal"
            className="field"
            placeholder="51.5453"
          />
        </div>
        <div>
          <label htmlFor="longitude" className="mb-1 block text-xs text-muted">
            Longitude
          </label>
          <input
            id="longitude"
            name="longitude"
            value={lon ?? ""}
            onChange={(e) => setLon(e.target.value === "" ? null : Number(e.target.value))}
            inputMode="decimal"
            className="field"
            placeholder="-0.0561"
          />
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-1.5 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
