import Link from "next/link";
import { notFound } from "next/navigation";
import { EnquiryWorkspace } from "@/components/admin/enquiry-workspace";
import { StatusBadge, when } from "@/components/admin/bits";
import { DeleteEnquiry } from "@/components/admin/delete-enquiry";
import { adminEnquiry, enquiryNotes, team } from "@/lib/admin-data";
import { currentStaff } from "@/lib/supabase-server";

export const metadata = { title: "Enquiry" };

const ERRORS: Record<string, string> = {
  "not-allowed": "Only an owner can delete an enquiry.",
  "delete-failed": "That enquiry could not be deleted.",
};

export default async function EnquiryPage({ params, searchParams }: PageProps<"/admin/enquiries/[id]">) {
  const { id } = await params;
  const query = await searchParams;

  const enquiry = await adminEnquiry(id);
  // Null covers both "no such enquiry" and "not allowed to see it", which is
  // the right thing to tell someone guessing ids.
  if (!enquiry) notFound();

  const [notes, staffList, staff] = await Promise.all([
    enquiryNotes(id),
    team(),
    currentStaff(),
  ]);

  const error = typeof query.error === "string" ? ERRORS[query.error] : null;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/enquiries" className="text-sm text-muted hover:text-brand">
          ← All enquiries
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold">{enquiry.name}</h1>
          <StatusBadge status={enquiry.status} />
        </div>
        <p className="mt-1 text-sm text-muted">Received {when(enquiry.createdAt, true)}</p>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-[--radius] border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger"
        >
          {error}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          <section className="card p-5">
            <h2 className="mb-3 font-semibold">What they said</h2>
            <p className="text-[15px] leading-relaxed whitespace-pre-wrap text-ink-2">
              {enquiry.message}
            </p>

            {enquiry.preferredViewing && (
              <p className="mt-4 border-t border-line pt-3 text-sm text-muted">
                They suggested viewing on{" "}
                <span className="font-semibold text-ink-2">{when(enquiry.preferredViewing)}</span>
              </p>
            )}
          </section>

          <EnquiryWorkspace
            enquiryId={enquiry.id}
            status={enquiry.status}
            assignedTo={enquiry.assignedTo}
            viewingAt={enquiry.viewingAt}
            staff={staffList.filter((s) => s.active).map((s) => ({
              id: s.id,
              name: s.fullName || s.email,
            }))}
            notes={notes}
          />
        </div>

        <aside className="space-y-4">
          <section className="card p-5">
            <h2 className="mb-3 font-semibold">Contact</h2>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-muted">Email</dt>
                <dd>
                  <a href={`mailto:${enquiry.email}`} className="break-all text-brand hover:underline">
                    {enquiry.email}
                  </a>
                </dd>
              </div>
              {enquiry.phone && (
                <div>
                  <dt className="text-muted">Phone</dt>
                  <dd>
                    <a href={`tel:${enquiry.phone}`} className="text-brand hover:underline">
                      {enquiry.phone}
                    </a>
                  </dd>
                </div>
              )}
            </dl>
          </section>

          <section className="card p-5">
            <h2 className="mb-3 font-semibold">Property</h2>
            <p className="text-sm font-semibold">{enquiry.listingTitle}</p>
            {enquiry.listingSlug && (
              <Link
                href={`/property/${enquiry.listingSlug}`}
                className="mt-2 inline-block text-sm text-brand hover:underline"
              >
                View on the website →
              </Link>
            )}
          </section>

          {staff?.role === "owner" && (
            <section className="card border-danger/30 p-5">
              <DeleteEnquiry id={enquiry.id} name={enquiry.name} />
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
