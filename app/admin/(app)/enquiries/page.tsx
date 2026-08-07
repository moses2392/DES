import Link from "next/link";
import { EmptyState, StatusBadge, when } from "@/components/admin/bits";
import {
  ENQUIRY_STATUSES,
  STATUS_LABELS,
  adminEnquiries,
  type EnquiryStatus,
} from "@/lib/admin-data";

export const metadata = { title: "Enquiries" };

export default async function EnquiriesPage({ searchParams }: PageProps<"/admin/enquiries">) {
  const params = await searchParams;
  const raw = typeof params.status === "string" ? params.status : "";
  const status = ENQUIRY_STATUSES.includes(raw as EnquiryStatus)
    ? (raw as EnquiryStatus)
    : undefined;

  const enquiries = await adminEnquiries(status);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Enquiries</h1>
        <p className="mt-1 text-sm text-muted">
          Everyone who has asked about a property, newest first.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link href="/admin/enquiries" aria-pressed={!status} className="chip">
          All
        </Link>
        {ENQUIRY_STATUSES.map((s) => (
          <Link
            key={s}
            href={`/admin/enquiries?status=${s}`}
            aria-pressed={status === s}
            className="chip"
          >
            {STATUS_LABELS[s]}
          </Link>
        ))}
      </div>

      {enquiries.length === 0 ? (
        <EmptyState
          title={status ? `Nothing at "${STATUS_LABELS[status]}"` : "No enquiries yet"}
          body={
            status
              ? "Try another status, or clear the filter to see everything."
              : "They will appear here as soon as someone gets in touch through the website."
          }
        />
      ) : (
        <>
          {/* A table on a wide screen, cards on a phone. An agent checking
              between viewings is on a phone, and a table that scrolls sideways
              is unusable there. */}
          <div className="card hidden overflow-hidden md:block">
            <table className="w-full text-sm">
              <thead className="border-b border-line bg-surface-2 text-left">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">Name</th>
                  <th className="px-4 py-2.5 font-semibold">Property</th>
                  <th className="px-4 py-2.5 font-semibold">Received</th>
                  <th className="px-4 py-2.5 font-semibold">Assigned</th>
                  <th className="px-4 py-2.5 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {enquiries.map((e) => (
                  <tr key={e.id} className="hover:bg-surface-2">
                    <td className="px-4 py-3">
                      <Link href={`/admin/enquiries/${e.id}`} className="font-semibold hover:text-brand">
                        {e.name}
                      </Link>
                      <div className="text-xs text-muted">{e.email}</div>
                    </td>
                    <td className="max-w-[22ch] truncate px-4 py-3 text-ink-2">{e.listingTitle}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-muted">{when(e.createdAt)}</td>
                    <td className="px-4 py-3 text-muted">{e.assignedName ?? "—"}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={e.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="space-y-3 md:hidden">
            {enquiries.map((e) => (
              <li key={e.id}>
                <Link href={`/admin/enquiries/${e.id}`} className="card block p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate font-semibold">{e.name}</div>
                      <div className="truncate text-sm text-muted">{e.listingTitle}</div>
                    </div>
                    <StatusBadge status={e.status} />
                  </div>
                  <div className="mt-2 text-xs text-muted">{when(e.createdAt)}</div>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
