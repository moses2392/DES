import Link from "next/link";
import { notFound } from "next/navigation";
import { EnquiryWorkspace } from "@/components/admin/enquiry-workspace";
import { StatusBadge, when } from "@/components/admin/bits";
import { adminEnquiry, enquiryNotes, team } from "@/lib/admin-data";

export const metadata = { title: "Enquiry" };

export default async function EnquiryPage({ params }: PageProps<"/admin/enquiries/[id]">) {
  const { id } = await params;

  const enquiry = await adminEnquiry(id);
  // Null covers both "no such enquiry" and "not allowed to see it", which is
  // the right thing to tell someone guessing ids.
  if (!enquiry) notFound();

  const [notes, staffList] = await Promise.all([enquiryNotes(id), team()]);

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
        </aside>
      </div>
    </div>
  );
}
