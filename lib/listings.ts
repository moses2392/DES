import { createClient } from "@supabase/supabase-js";
import type { Listing } from "@/lib/search";

/**
 * Data access.
 *
 * Only the publishable key is used — there is no secret key anywhere in this
 * application. Row level security does the enforcing: listings are readable by
 * anyone, enquiries are insert-only and readable by nobody. That means the same
 * client is safe on the server or in the browser, and no credential in this
 * project would be dangerous if it leaked.
 */

/**
 * Whether the database is configured at all.
 *
 * Checked before querying so a missing environment variable produces a page
 * that explains itself, rather than an unhandled throw that the host renders
 * as a bare "a server error occurred" — which tells whoever deployed it
 * nothing about what to fix.
 */
export function isConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim()
  );
}

function client() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error("Missing Supabase configuration. Copy .env.example to .env.local.");
  }
  // Trimmed because values pasted into a hosting dashboard routinely carry a
  // trailing newline, which makes the request fail in a way that looks like
  // a bad key rather than a bad paste.
  return createClient(url.trim(), key.trim(), { auth: { persistSession: false } });
}

interface Row {
  id: string;
  slug: string;
  title: string;
  description: string;
  rent_pcm: number;
  bedrooms: number;
  bathrooms: number;
  property_type: Listing["propertyType"];
  furnishing: Listing["furnishing"];
  area: string;
  postcode: string;
  latitude: number;
  longitude: number;
  available_from: string;
  images: string[] | null;
  features: string[] | null;
}

const toListing = (r: Row): Listing => ({
  id: r.id,
  slug: r.slug,
  title: r.title,
  description: r.description,
  rentPcm: r.rent_pcm,
  bedrooms: r.bedrooms,
  bathrooms: r.bathrooms,
  propertyType: r.property_type,
  furnishing: r.furnishing,
  area: r.area,
  postcode: r.postcode,
  latitude: r.latitude,
  longitude: r.longitude,
  availableFrom: r.available_from,
  images: r.images ?? [],
  features: r.features ?? [],
});

const COLUMNS =
  "id, slug, title, description, rent_pcm, bedrooms, bathrooms, property_type, furnishing, area, postcode, latitude, longitude, available_from, images, features";

export async function listListings(): Promise<Listing[]> {
  const { data, error } = await client()
    .from("listings")
    .select(COLUMNS)
    .eq("published", true)
    .order("available_from");

  if (error) throw new Error(`Could not load listings: ${error.message}`);
  return ((data ?? []) as Row[]).map(toListing);
}

export async function getListing(slug: string): Promise<Listing | null> {
  const { data, error } = await client()
    .from("listings")
    .select(COLUMNS)
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();

  if (error) throw new Error(`Could not load that property: ${error.message}`);
  return data ? toListing(data as Row) : null;
}

export interface EnquiryInput {
  listingId: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  preferredViewing?: string;
}

export async function createEnquiry(input: EnquiryInput): Promise<{ ok: true } | { ok: false; error: string }> {
  const { error } = await client().from("enquiries").insert({
    listing_id: input.listingId,
    name: input.name,
    email: input.email,
    phone: input.phone || null,
    message: input.message,
    preferred_viewing: input.preferredViewing || null,
  });

  if (error) {
    // The insert policy allows the write but there is no select policy, so a
    // failure here is genuine validation or connectivity, not permissions.
    return { ok: false, error: "We could not send that enquiry. Please try again." };
  }
  return { ok: true };
}
