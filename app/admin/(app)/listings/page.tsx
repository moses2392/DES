import Link from "next/link";
import { EmptyState, money, when } from "@/components/admin/bits";
import { PublishToggle } from "@/components/admin/publish-toggle";
import { adminListings } from "@/lib/admin-data";

export const metadata = { title: "Properties" };

const NOTICES: Record<string, { tone: "good" | "bad"; text: string }> = {
  deleted: { tone: "good", text: "That property has been deleted." },
  "not-allowed": { tone: "bad", text: "Only an owner can delete a property." },
  "delete-failed": { tone: "bad", text: "That property could not be deleted." },
};

export default async function ListingsPage({ searchParams }: PageProps<"/admin/listings">) {
  const params = await searchParams;
  const listings = await adminListings();

  const key =
    (params.deleted === "1" && "deleted") ||
    (typeof params.error === "string" ? params.error : "");
  const notice = NOTICES[key];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Properties</h1>
          <p className="mt-1 text-sm text-muted">
            {listings.filter((l) => l.published).length} live,{" "}
            {listings.filter((l) => !l.published).length} in draft.
          </p>
        </div>
        <Link href="/admin/listings/new" className="btn btn-primary">
          Add a property
        </Link>
      </div>

      {notice && (
        <p
          role="status"
          className={`rounded-[--radius] border px-3 py-2 text-sm ${
            notice.tone === "good"
              ? "border-brand/30 bg-brand/5 text-brand"
              : "border-danger/30 bg-danger/5 text-danger"
          }`}
        >
          {notice.text}
        </p>
      )}

      {listings.length === 0 ? (
        <EmptyState
          title="No properties yet"
          body="Add the first one and it will appear on the website straight away."
        />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-line bg-surface-2 text-left">
              <tr>
                <th className="px-4 py-2.5 font-semibold">Property</th>
                <th className="hidden px-4 py-2.5 font-semibold sm:table-cell">Rent</th>
                <th className="hidden px-4 py-2.5 font-semibold lg:table-cell">Available</th>
                <th className="px-4 py-2.5 font-semibold">On the website</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {listings.map((l) => (
                <tr key={l.id} className="hover:bg-surface-2">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/listings/${l.id}`}
                      className="font-semibold hover:text-brand"
                    >
                      {l.title}
                    </Link>
                    <div className="text-xs text-muted">
                      {l.area} · {l.postcode} ·{" "}
                      {l.bedrooms === 0 ? "Studio" : `${l.bedrooms} bed`}
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 whitespace-nowrap tabular-nums sm:table-cell">
                    {money(l.rentPcm)}
                    <span className="text-xs text-muted"> pcm</span>
                  </td>
                  <td className="hidden px-4 py-3 whitespace-nowrap text-muted lg:table-cell">
                    {when(l.availableFrom)}
                  </td>
                  <td className="px-4 py-3">
                    <PublishToggle id={l.id} published={l.published} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
