import Link from "next/link";
import { EmptyState, Stat, StatusBadge, when } from "@/components/admin/bits";
import { dashboard } from "@/lib/admin-data";
import { currentStaff } from "@/lib/supabase-server";

export const metadata = { title: "Overview" };

export default async function AdminOverview() {
  const [staff, data] = await Promise.all([currentStaff(), dashboard()]);

  const firstName = (staff?.fullName || staff?.email || "").split(/[\s@]/)[0];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            {firstName ? `Good to see you, ${firstName}` : "Overview"}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {data.counts.new > 0
              ? `${data.counts.new} ${data.counts.new === 1 ? "enquiry needs" : "enquiries need"} a first reply.`
              : "Every enquiry has been picked up."}
          </p>
        </div>
        <Link href="/admin/listings/new" className="btn btn-primary">
          Add a property
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat label="New" value={data.counts.new} href="/admin/enquiries?status=new" tone="attention" />
        <Stat label="Contacted" value={data.counts.contacted} href="/admin/enquiries?status=contacted" />
        <Stat
          label="Viewings booked"
          value={data.counts.viewing_booked}
          href="/admin/enquiries?status=viewing_booked"
        />
        <Stat label="Live properties" value={data.publishedListings} href="/admin/listings" />
        <Stat label="Drafts" value={data.draftListings} href="/admin/listings" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 font-semibold">Latest enquiries</h2>
          {data.recent.length === 0 ? (
            <EmptyState
              title="No enquiries yet"
              body="They will appear here as soon as someone gets in touch through the website."
            />
          ) : (
            <ul className="card divide-y divide-line">
              {data.recent.map((e) => (
                <li key={e.id}>
                  <Link
                    href={`/admin/enquiries/${e.id}`}
                    className="flex items-center justify-between gap-3 p-4 hover:bg-surface-2"
                  >
                    <div className="min-w-0">
                      <div className="truncate font-semibold">{e.name}</div>
                      <div className="truncate text-sm text-muted">{e.listingTitle}</div>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="hidden text-xs text-muted sm:block">{when(e.createdAt)}</span>
                      <StatusBadge status={e.status} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="mb-3 font-semibold">Viewings coming up</h2>
          {data.upcomingViewings.length === 0 ? (
            <EmptyState
              title="Nothing in the diary"
              body="Book a viewing from an enquiry and it will show here."
            />
          ) : (
            <ul className="card divide-y divide-line">
              {data.upcomingViewings.map((e) => (
                <li key={e.id}>
                  <Link
                    href={`/admin/enquiries/${e.id}`}
                    className="flex items-center justify-between gap-3 p-4 hover:bg-surface-2"
                  >
                    <div className="min-w-0">
                      <div className="truncate font-semibold">{when(e.viewingAt, true)}</div>
                      <div className="truncate text-sm text-muted">
                        {e.name} · {e.listingTitle}
                      </div>
                    </div>
                    {e.assignedName && (
                      <span className="shrink-0 text-xs text-muted">{e.assignedName}</span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
