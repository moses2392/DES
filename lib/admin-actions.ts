"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { currentStaff, sessionClient } from "@/lib/supabase-server";
import { validate, slugify } from "@/lib/listing-form";
import { ENQUIRY_STATUSES, STATUS_LABELS, type EnquiryStatus } from "@/lib/enquiry-status";

/**
 * Every mutation the back office can make.
 *
 * Two rules hold throughout. Membership of staff is confirmed here before
 * anything is attempted, so a signed-in stranger gets a clear refusal rather
 * than a confusing empty result. And every write still goes through the
 * session client, so row-level security refuses it a second time if this file
 * is ever wrong — the check here is for the error message, not for the
 * security.
 */

export interface FormState {
  error: string | null;
  errors?: Record<string, string>;
  ok?: boolean;
}

async function requireStaff() {
  const staff = await currentStaff();
  if (!staff) redirect("/admin/sign-in");
  return staff;
}

/* -------------------------------------------------------------------------- */
/*                                  listings                                  */
/* -------------------------------------------------------------------------- */

function readListingForm(formData: FormData) {
  const raw: Record<string, string> = {};
  for (const key of [
    "id",
    "slug",
    "title",
    "description",
    "rentPcm",
    "bedrooms",
    "bathrooms",
    "propertyType",
    "furnishing",
    "area",
    "postcode",
    "latitude",
    "longitude",
    "availableFrom",
    "features",
    "published",
  ]) {
    raw[key] = String(formData.get(key) ?? "");
  }
  const images = formData
    .getAll("images")
    .map((v) => String(v).trim())
    .filter(Boolean);
  return { raw, images };
}

export async function saveListing(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireStaff();

  const { raw, images } = readListingForm(formData);
  const result = validate(raw, images);
  if (!result.ok) {
    return { error: "Some details need fixing.", errors: result.errors };
  }

  const supabase = await sessionClient();
  const draft = result.value;
  const id = raw.id.trim();

  const row = {
    slug: draft.slug,
    title: draft.title,
    description: draft.description,
    rent_pcm: draft.rentPcm,
    bedrooms: draft.bedrooms,
    bathrooms: draft.bathrooms,
    property_type: draft.propertyType,
    furnishing: draft.furnishing,
    area: draft.area,
    postcode: draft.postcode,
    latitude: draft.latitude,
    longitude: draft.longitude,
    available_from: draft.availableFrom,
    images: draft.images,
    features: draft.features,
    published: draft.published,
  };

  if (id) {
    // Selecting the row back is what proves the update happened. Postgres
    // reports success for an UPDATE that matches nothing — so if another owner
    // deleted this property while it was being edited, or a policy refused the
    // write, this would otherwise redirect to "Saved." having saved nothing.
    const { data: updated, error } = await supabase
      .from("listings")
      .update(row)
      .eq("id", id)
      .select("id")
      .maybeSingle();

    if (error) return { error: describe(error), errors: slugConflict(error) };
    if (!updated) {
      return {
        error: "That property no longer exists, or you are not allowed to change it.",
      };
    }

    revalidatePath("/admin/listings");
    revalidatePath("/");
    revalidatePath(`/property/${draft.slug}`);
    redirect(`/admin/listings/${id}?saved=1`);
  }

  // A new listing may collide with an existing slug. Rather than failing, try a
  // few suffixed variants — the agent named the property, not the URL, and
  // making them rename it to satisfy a unique index would be rude.
  let slug = draft.slug;
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data, error } = await supabase
      .from("listings")
      .insert({ ...row, slug })
      .select("id")
      .single();

    if (!error && data) {
      revalidatePath("/admin/listings");
      revalidatePath("/");
      redirect(`/admin/listings/${data.id}?saved=1`);
    }
    if (error?.code !== "23505") return { error: describe(error) };
    slug = `${slugify(draft.slug)}-${Math.random().toString(36).slice(2, 6)}`;
  }

  return { error: "Could not find a free web address for that property." };
}

export async function setPublished(formData: FormData) {
  await requireStaff();
  const id = String(formData.get("id") ?? "");
  const published = String(formData.get("published") ?? "") === "true";

  const supabase = await sessionClient();
  await supabase.from("listings").update({ published }).eq("id", id);

  revalidatePath("/admin/listings");
  revalidatePath("/");
}

export async function deleteListing(formData: FormData) {
  // Owners only, in the database as well as here: deleting a property cascades
  // its enquiries, and an agent who wanted it gone can unpublish instead.
  const staff = await requireStaff();
  const id = String(formData.get("id") ?? "");

  if (staff.role !== "owner") redirect("/admin/listings?error=not-allowed");

  const supabase = await sessionClient();
  const { error } = await supabase.from("listings").delete().eq("id", id);
  if (error) redirect("/admin/listings?error=delete-failed");

  revalidatePath("/admin/listings");
  revalidatePath("/");
  redirect("/admin/listings?deleted=1");
}

/* -------------------------------------------------------------------------- */
/*                                  enquiries                                 */
/* -------------------------------------------------------------------------- */

export async function updateEnquiry(_prev: FormState, formData: FormData): Promise<FormState> {
  const staff = await requireStaff();

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as EnquiryStatus;
  const assignedTo = String(formData.get("assignedTo") ?? "");
  const viewingAt = String(formData.get("viewingAt") ?? "").trim();
  const previousStatus = String(formData.get("previousStatus") ?? "");

  if (!ENQUIRY_STATUSES.includes(status)) return { error: "Choose a status." };

  // A booked viewing without a time is a status that says nothing.
  if (status === "viewing_booked" && !viewingAt) {
    return { error: "Set the date and time of the viewing." };
  }

  const supabase = await sessionClient();
  // Selected back on purpose: an UPDATE matching zero rows is a success in
  // Postgres, so a deleted enquiry would report "Saved" and change nothing.
  const { data: updated, error } = await supabase
    .from("enquiries")
    .update({
      status,
      assigned_to: assignedTo || null,
      viewing_at: viewingAt ? new Date(viewingAt).toISOString() : null,
    })
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) return { error: "Could not save that change. Please try again." };
  if (!updated) return { error: "That enquiry no longer exists." };

  // The status change is recorded as a note, so the history reads as one
  // sequence rather than a field that quietly changed at some point.
  if (previousStatus && previousStatus !== status) {
    await supabase.from("enquiry_notes").insert({
      enquiry_id: id,
      author_id: staff.id,
      kind: "status",
      body: `Moved from ${label(previousStatus)} to ${label(status)}.`,
    });
  }

  revalidatePath(`/admin/enquiries/${id}`);
  revalidatePath("/admin/enquiries");
  revalidatePath("/admin");
  return { error: null, ok: true };
}

export async function addNote(_prev: FormState, formData: FormData): Promise<FormState> {
  const staff = await requireStaff();

  const id = String(formData.get("id") ?? "");
  const body = String(formData.get("body") ?? "").trim();

  if (!body) return { error: "Write something first." };
  if (body.length > 4000) return { error: "That note is too long." };

  const supabase = await sessionClient();
  // author_id is the signed-in person's own staff id. The insert policy checks
  // the same thing in the database, so a forged author cannot get through even
  // if this line were wrong.
  const { error } = await supabase
    .from("enquiry_notes")
    .insert({ enquiry_id: id, author_id: staff.id, kind: "note", body });

  if (error) return { error: "Could not save that note. Please try again." };

  revalidatePath(`/admin/enquiries/${id}`);
  return { error: null, ok: true };
}

export async function deleteEnquiry(formData: FormData) {
  // Owners only, in the database as well as here. Deleting an enquiry destroys
  // its whole note trail, which is the one record of what was promised to
  // somebody — so it is not an agent's call, and closing is the usual answer.
  const staff = await requireStaff();
  const id = String(formData.get("id") ?? "");

  if (staff.role !== "owner") redirect(`/admin/enquiries/${id}?error=not-allowed`);

  const supabase = await sessionClient();
  const { error } = await supabase.from("enquiries").delete().eq("id", id);
  if (error) redirect(`/admin/enquiries/${id}?error=delete-failed`);

  revalidatePath("/admin/enquiries");
  revalidatePath("/admin");
  redirect("/admin/enquiries?deleted=1");
}

/* -------------------------------------------------------------------------- */
/*                                    team                                    */
/* -------------------------------------------------------------------------- */

export async function inviteStaff(_prev: FormState, formData: FormData): Promise<FormState> {
  const staff = await requireStaff();
  if (staff.role !== "owner") return { error: "Only an owner can add people." };

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const fullName = String(formData.get("fullName") ?? "").trim();
  const role = String(formData.get("role") ?? "agent");

  if (!email.includes("@") || email.length > 254) {
    return { error: "Enter a valid email address." };
  }
  if (role !== "owner" && role !== "agent") return { error: "Choose a role." };

  const supabase = await sessionClient();
  const { error } = await supabase
    .from("staff")
    .insert({ email, full_name: fullName, role, active: true });

  if (error) {
    if (error.code === "23505") return { error: "Someone with that email is already on the team." };
    return { error: "Could not add that person. Please try again." };
  }

  revalidatePath("/admin/team");
  return { error: null, ok: true };
}

export async function setStaffActive(formData: FormData) {
  const staff = await requireStaff();
  const id = String(formData.get("id") ?? "");
  const active = String(formData.get("active") ?? "") === "true";

  if (staff.role !== "owner") redirect("/admin/team?error=not-allowed");
  // Locking yourself out of the only owner account is a support call nobody
  // enjoys. The database cannot express this rule, so it is enforced here.
  if (id === staff.id) redirect("/admin/team?error=self");

  const supabase = await sessionClient();
  await supabase.from("staff").update({ active }).eq("id", id);

  revalidatePath("/admin/team");
}

/* -------------------------------------------------------------------------- */

function label(status: string): string {
  return STATUS_LABELS[status as EnquiryStatus] ?? status;
}

function slugConflict(error: { code?: string } | null): Record<string, string> | undefined {
  return error?.code === "23505"
    ? { slug: "Another property already uses that web address." }
    : undefined;
}

function describe(error: { code?: string; message?: string } | null): string {
  if (error?.code === "23505") return "Another property already uses that web address.";
  if (error?.code === "42501") {
    return "Your account is not allowed to do that. Ask an owner.";
  }
  return "Could not save that property. Please try again.";
}
