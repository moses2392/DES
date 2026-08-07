import Link from "next/link";
import { notFound } from "next/navigation";
import { ListingForm } from "@/components/admin/listing-form";
import { DeleteListing } from "@/components/admin/delete-listing";
import { adminListing } from "@/lib/admin-data";
import { currentStaff } from "@/lib/supabase-server";

export const metadata = { title: "Edit property" };

export default async function EditListingPage({ params, searchParams }: PageProps<"/admin/listings/[id]">) {
  const { id } = await params;
  const query = await searchParams;

  const [listing, staff] = await Promise.all([adminListing(id), currentStaff()]);
  if (!listing) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href="/admin/listings" className="text-sm text-muted hover:text-brand">
          ← All properties
        </Link>
        <h1 className="mt-2 text-2xl font-bold">{listing.title}</h1>
        <p className="mt-1 text-sm text-muted">
          {listing.published ? (
            <>
              Live at{" "}
              <Link href={`/property/${listing.slug}`} className="text-brand hover:underline">
                /property/{listing.slug}
              </Link>
            </>
          ) : (
            "Draft — not visible on the website."
          )}
        </p>
      </div>

      {query.saved === "1" && (
        <p
          role="status"
          className="rounded-[--radius] border border-brand/30 bg-brand/5 px-3 py-2 text-sm text-brand"
        >
          Saved.
        </p>
      )}

      <ListingForm listing={listing} />

      {staff?.role === "owner" && (
        <section className="card border-danger/30 p-5">
          <h2 className="font-semibold text-danger">Delete this property</h2>
          <p className="mt-1 mb-4 text-sm text-muted">
            This also deletes every enquiry about it, permanently. Unpublishing is usually what
            you want instead.
          </p>
          <DeleteListing id={listing.id} title={listing.title} />
        </section>
      )}
    </div>
  );
}
