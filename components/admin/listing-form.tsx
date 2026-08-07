"use client";

import { useActionState } from "react";
import Link from "next/link";
import { saveListing, type FormState } from "@/lib/admin-actions";
import { FURNISHINGS, PROPERTY_TYPES, penceToPounds } from "@/lib/listing-form";
import { PhotoManager } from "@/components/admin/photo-manager";
import { PinPicker } from "@/components/admin/pin-picker";
import type { AdminListing } from "@/lib/admin-data";

const EMPTY: FormState = { error: null };

const TYPE_LABELS: Record<string, string> = {
  flat: "Flat",
  house: "House",
  studio: "Studio",
  room: "Room in a shared house",
};

const FURNISHING_LABELS: Record<string, string> = {
  furnished: "Furnished",
  "part-furnished": "Part furnished",
  unfurnished: "Unfurnished",
};

export function ListingForm({ listing }: { listing?: AdminListing }) {
  const [state, action, pending] = useActionState(saveListing, EMPTY);
  const errors = state.errors ?? {};

  return (
    <form action={action} className="space-y-6">
      {listing && (
        <>
          <input type="hidden" name="id" value={listing.id} />
          {/* The existing web address travels with the edit. Without it the slug
              is regenerated from the title, so correcting a typo in a title
              would silently move the property's public URL and break every link
              already shared — and could collide with another listing through a
              field this form does not show. */}
          <input type="hidden" name="slug" value={listing.slug} />
        </>
      )}

      <section className="card space-y-4 p-5">
        <h2 className="font-semibold">The property</h2>

        <Field
          name="title"
          label="Title"
          defaultValue={listing?.title}
          error={errors.title}
          required
          placeholder="Two-bedroom flat on Wilton Way"
          hint="How it appears in search results."
        />

        <div>
          <label htmlFor="description" className="mb-1.5 block text-sm font-semibold">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={5}
            defaultValue={listing?.description}
            maxLength={4000}
            className="field resize-y"
            placeholder="A first-floor flat in a Victorian conversion, with the original cornicing kept…"
          />
          {errors.description && <Err>{errors.description}</Err>}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            name="area"
            label="Area"
            defaultValue={listing?.area}
            error={errors.area}
            required
            placeholder="Hackney"
          />
          <Field
            name="postcode"
            label="Postcode"
            defaultValue={listing?.postcode}
            error={errors.postcode}
            required
            placeholder="E8 3EG"
          />
        </div>
      </section>

      <section className="card space-y-4 p-5">
        <h2 className="font-semibold">Terms</h2>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field
            name="rentPcm"
            label="Rent (£ per month)"
            defaultValue={listing ? penceToPounds(listing.rentPcm) : ""}
            error={errors.rentPcm}
            required
            placeholder="1850"
            inputMode="decimal"
          />
          <Field
            name="bedrooms"
            label="Bedrooms"
            defaultValue={listing ? String(listing.bedrooms) : ""}
            error={errors.bedrooms}
            required
            placeholder="2"
            inputMode="numeric"
            hint="0 for a studio."
          />
          <Field
            name="bathrooms"
            label="Bathrooms"
            defaultValue={listing ? String(listing.bathrooms) : "1"}
            error={errors.bathrooms}
            required
            inputMode="numeric"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Select
            name="propertyType"
            label="Type"
            defaultValue={listing?.propertyType ?? "flat"}
            options={PROPERTY_TYPES.map((v) => [v, TYPE_LABELS[v]])}
            error={errors.propertyType}
          />
          <Select
            name="furnishing"
            label="Furnishing"
            defaultValue={listing?.furnishing ?? "furnished"}
            options={FURNISHINGS.map((v) => [v, FURNISHING_LABELS[v]])}
            error={errors.furnishing}
          />
          <Field
            name="availableFrom"
            label="Available from"
            type="date"
            defaultValue={listing?.availableFrom}
            error={errors.availableFrom}
            required
          />
        </div>

        <div>
          <label htmlFor="features" className="mb-1.5 block text-sm font-semibold">
            Features
          </label>
          <textarea
            id="features"
            name="features"
            rows={4}
            defaultValue={listing?.features.join("\n")}
            className="field resize-y"
            placeholder={"Private garden\nRecently rewired\nCouncil tax band C"}
          />
          <p className="mt-1 text-xs text-muted">One per line.</p>
        </div>
      </section>

      <section className="card p-5">
        <h2 className="mb-4 font-semibold">Photographs</h2>
        <PhotoManager initial={listing?.images ?? []} />
      </section>

      <section className="card p-5">
        <PinPicker
          latitude={listing?.latitude ?? null}
          longitude={listing?.longitude ?? null}
          error={errors.latitude}
        />
      </section>

      <section className="card p-5">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            name="published"
            defaultChecked={listing ? listing.published : false}
            className="mt-0.5 h-4 w-4"
          />
          <span>
            <span className="block text-sm font-semibold">Show on the website</span>
            <span className="block text-xs text-muted">
              Leave this off to save a draft nobody outside the office can see.
            </span>
          </span>
        </label>
        {errors.slug && <Err>{errors.slug}</Err>}
      </section>

      {state.error && (
        <p
          role="alert"
          className="rounded-[--radius] border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger"
        >
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button disabled={pending} className="btn btn-primary">
          {pending ? "Saving…" : listing ? "Save changes" : "Add property"}
        </button>
        <Link href="/admin/listings" className="btn btn-quiet">
          Cancel
        </Link>
      </div>
    </form>
  );
}

/* ------------------------------- small bits ------------------------------- */

function Err({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="mt-1.5 text-sm text-danger">
      {children}
    </p>
  );
}

function Field({
  name,
  label,
  error,
  hint,
  ...rest
}: {
  name: string;
  label: string;
  error?: string;
  hint?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-sm font-semibold">
        {label}
      </label>
      <input id={name} name={name} className="field" {...rest} />
      {hint && !error && <p className="mt-1 text-xs text-muted">{hint}</p>}
      {error && <Err>{error}</Err>}
    </div>
  );
}

function Select({
  name,
  label,
  options,
  error,
  defaultValue,
}: {
  name: string;
  label: string;
  options: [string, string][];
  error?: string;
  defaultValue?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-sm font-semibold">
        {label}
      </label>
      <select id={name} name={name} defaultValue={defaultValue} className="field">
        {options.map(([value, text]) => (
          <option key={value} value={value}>
            {text}
          </option>
        ))}
      </select>
      {error && <Err>{error}</Err>}
    </div>
  );
}
