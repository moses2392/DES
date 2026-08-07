import { sessionClient } from "@/lib/supabase-server";

/**
 * Reads for the back office.
 *
 * Every query runs as the signed-in member of staff. Row-level security is what
 * limits them, not any filter written here — so a bug in this file shows fewer
 * rows than it should, never rows belonging to someone who should not see them.
 */

// The pipeline constants live in lib/enquiry-status.ts, which imports nothing —
// client components need them, and importing them from here would pull
// next/headers into the browser bundle. Re-exported so server callers have one
// place to import from.
export {
  ENQUIRY_STATUSES,
  STATUS_LABELS,
  type EnquiryStatus,
  type EnquiryNote,
} from "@/lib/enquiry-status";
import type { EnquiryNote, EnquiryStatus } from "@/lib/enquiry-status";

export interface AdminListing {
  id: string;
  slug: string;
  title: string;
  area: string;
  postcode: string;
  rentPcm: number;
  bedrooms: number;
  bathrooms: number;
  propertyType: string;
  furnishing: string;
  availableFrom: string;
  published: boolean;
  images: string[];
  features: string[];
  description: string;
  latitude: number;
  longitude: number;
  createdAt: string;
  enquiryCount?: number;
}

const LISTING_COLUMNS =
  "id, slug, title, description, rent_pcm, bedrooms, bathrooms, property_type, furnishing, area, postcode, latitude, longitude, available_from, images, features, published, created_at";

/* eslint-disable @typescript-eslint/no-explicit-any */
const toListing = (r: any): AdminListing => ({
  id: r.id,
  slug: r.slug,
  title: r.title,
  description: r.description ?? "",
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
  published: r.published,
  createdAt: r.created_at,
});
/* eslint-enable @typescript-eslint/no-explicit-any */

export async function adminListings(): Promise<AdminListing[]> {
  const supabase = await sessionClient();
  const { data, error } = await supabase
    .from("listings")
    .select(LISTING_COLUMNS)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Could not load listings: ${error.message}`);
  return (data ?? []).map(toListing);
}

export async function adminListing(id: string): Promise<AdminListing | null> {
  const supabase = await sessionClient();
  const { data, error } = await supabase
    .from("listings")
    .select(LISTING_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Could not load that property: ${error.message}`);
  return data ? toListing(data) : null;
}

export interface AdminEnquiry {
  id: string;
  listingId: string;
  listingTitle: string;
  listingSlug: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  preferredViewing: string | null;
  viewingAt: string | null;
  status: EnquiryStatus;
  assignedTo: string | null;
  assignedName: string | null;
  createdAt: string;
  updatedAt: string;
}

const ENQUIRY_COLUMNS = `
  id, listing_id, name, email, phone, message, preferred_viewing, viewing_at,
  status, assigned_to, created_at, updated_at,
  listings ( title, slug ),
  staff:assigned_to ( full_name, email )
`;

/* eslint-disable @typescript-eslint/no-explicit-any */
const toEnquiry = (r: any): AdminEnquiry => ({
  id: r.id,
  listingId: r.listing_id,
  listingTitle: r.listings?.title ?? "Deleted property",
  listingSlug: r.listings?.slug ?? "",
  name: r.name,
  email: r.email,
  phone: r.phone,
  message: r.message,
  preferredViewing: r.preferred_viewing,
  viewingAt: r.viewing_at,
  status: r.status,
  assignedTo: r.assigned_to,
  assignedName: r.staff?.full_name || r.staff?.email || null,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});
/* eslint-enable @typescript-eslint/no-explicit-any */

export async function adminEnquiries(status?: EnquiryStatus): Promise<AdminEnquiry[]> {
  const supabase = await sessionClient();
  let query = supabase.from("enquiries").select(ENQUIRY_COLUMNS);
  if (status) query = query.eq("status", status);

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw new Error(`Could not load enquiries: ${error.message}`);
  return (data ?? []).map(toEnquiry);
}

export async function adminEnquiry(id: string): Promise<AdminEnquiry | null> {
  const supabase = await sessionClient();
  const { data, error } = await supabase
    .from("enquiries")
    .select(ENQUIRY_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Could not load that enquiry: ${error.message}`);
  return data ? toEnquiry(data) : null;
}

export async function enquiryNotes(enquiryId: string): Promise<EnquiryNote[]> {
  const supabase = await sessionClient();
  const { data, error } = await supabase
    .from("enquiry_notes")
    .select("id, body, kind, created_at, staff:author_id ( full_name, email )")
    .eq("enquiry_id", enquiryId)
    .order("created_at");

  if (error) throw new Error(`Could not load the history: ${error.message}`);
  /* eslint-disable @typescript-eslint/no-explicit-any */
  return (data ?? []).map((r: any) => ({
    id: r.id,
    body: r.body,
    kind: r.kind,
    // A note outlives the person who wrote it — the author reference is set to
    // null if their staff row is ever removed, and the note still stands.
    authorName: r.staff?.full_name || r.staff?.email || "A former colleague",
    createdAt: r.created_at,
  }));
  /* eslint-enable @typescript-eslint/no-explicit-any */
}

export interface TeamMember {
  id: string;
  email: string;
  fullName: string;
  role: "owner" | "agent";
  active: boolean;
  claimed: boolean;
  createdAt: string;
}

export async function team(): Promise<TeamMember[]> {
  const supabase = await sessionClient();
  const { data, error } = await supabase
    .from("staff")
    .select("id, email, full_name, role, active, user_id, created_at")
    .order("created_at");

  if (error) throw new Error(`Could not load the team: ${error.message}`);
  return (data ?? []).map((r) => ({
    id: r.id,
    email: r.email,
    fullName: r.full_name,
    role: r.role,
    active: r.active,
    claimed: Boolean(r.user_id),
    createdAt: r.created_at,
  }));
}

export interface Dashboard {
  counts: Record<EnquiryStatus, number>;
  publishedListings: number;
  draftListings: number;
  recent: AdminEnquiry[];
  upcomingViewings: AdminEnquiry[];
}

export async function dashboard(): Promise<Dashboard> {
  const supabase = await sessionClient();

  const [enquiries, listings] = await Promise.all([
    supabase.from("enquiries").select(ENQUIRY_COLUMNS).order("created_at", { ascending: false }),
    supabase.from("listings").select("id, published"),
  ]);

  if (enquiries.error) throw new Error(`Could not load enquiries: ${enquiries.error.message}`);
  if (listings.error) throw new Error(`Could not load listings: ${listings.error.message}`);

  const all = (enquiries.data ?? []).map(toEnquiry);

  const counts = { new: 0, contacted: 0, viewing_booked: 0, closed: 0 } as Record<
    EnquiryStatus,
    number
  >;
  for (const e of all) if (e.status in counts) counts[e.status]++;

  const now = Date.now();

  return {
    counts,
    publishedListings: (listings.data ?? []).filter((l) => l.published).length,
    draftListings: (listings.data ?? []).filter((l) => !l.published).length,
    recent: all.slice(0, 6),
    // Only viewings still ahead of us, soonest first — a list of appointments
    // that already happened is a to-do list nobody can action.
    upcomingViewings: all
      .filter((e) => e.viewingAt && new Date(e.viewingAt).getTime() > now)
      .sort((a, b) => new Date(a.viewingAt!).getTime() - new Date(b.viewingAt!).getTime())
      .slice(0, 6),
  };
}
