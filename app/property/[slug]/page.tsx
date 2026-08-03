import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getListing, isConfigured } from "@/lib/listings";
import { SetupNotice } from "@/components/setup-notice";
import { describeBedrooms, formatRent } from "@/lib/search";
import { EnquiryForm } from "@/components/enquiry-form";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  // Runs before the page and would otherwise throw first, turning a missing
  // setting back into an unexplained server error.
  if (!isConfigured()) return { title: "Setup required" };

  const listing = await getListing(slug);
  if (!listing) return { title: "Property not found" };
  return {
    title: listing.title,
    description: listing.description.slice(0, 160),
    openGraph: { images: listing.images.slice(0, 1) },
  };
}

export default async function PropertyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isConfigured()) return <SetupNotice />;

  const listing = await getListing(slug);
  if (!listing) notFound();

  // Deliberately no "available soon" comparison against the current time:
  // reading the clock during render is impure, and the date itself is the
  // information a renter actually needs.
  const available = new Date(`${listing.availableFrom}T12:00:00Z`);

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6 md:px-6 md:py-10">
      <nav aria-label="Breadcrumb" className="mb-5 text-sm text-muted">
        <Link href="/" className="hover:text-brand">
          Search
        </Link>
        <span aria-hidden className="mx-2">
          /
        </span>
        <span>{listing.area}</span>
      </nav>

      {/* Gallery: one lead image with the rest beside it, as portals set it. */}
      <div className="mb-8 grid gap-2 md:grid-cols-3">
        <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-surface-2 md:col-span-2 md:aspect-[16/10]">
          {listing.images[0] && (
            <Image
              src={listing.images[0]}
              alt={listing.title}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 66vw"
              className="object-cover"
            />
          )}
        </div>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-1">
          {listing.images.slice(1, 3).map((src, i) => (
            <div key={src} className="relative aspect-[4/3] overflow-hidden rounded-lg bg-surface-2">
              <Image
                src={src}
                alt={`${listing.title}, view ${i + 2}`}
                fill
                sizes="(max-width: 768px) 50vw, 33vw"
                className="object-cover"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold md:text-3xl">{listing.title}</h1>
              <p className="mt-1 text-muted">
                {listing.area} · {listing.postcode}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">{formatRent(listing.rentPcm)}</p>
              <p className="text-sm text-muted">per month</p>
            </div>
          </div>

          <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-4">
            {[
              ["Bedrooms", describeBedrooms(listing.bedrooms)],
              ["Bathrooms", String(listing.bathrooms)],
              ["Type", listing.propertyType],
              ["Furnishing", listing.furnishing.replace("-", " ")],
            ].map(([term, detail]) => (
              <div key={term} className="bg-card p-4">
                <dt className="text-xs uppercase tracking-wide text-muted">{term}</dt>
                <dd className="mt-1 font-medium capitalize">{detail}</dd>
              </div>
            ))}
          </dl>

          <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-line bg-card px-3 py-1.5 text-sm">
            <span aria-hidden className="text-amber">
              ●
            </span>
            Available from{" "}
            {available.toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
              timeZone: "UTC",
            })}
          </p>

          <section className="mt-8">
            <h2 className="mb-3 text-lg font-semibold">About this property</h2>
            <p className="max-w-[68ch] leading-relaxed text-ink-2">{listing.description}</p>
          </section>

          {listing.features.length > 0 && (
            <section className="mt-8">
              <h2 className="mb-3 text-lg font-semibold">Features</h2>
              <ul className="grid gap-2 sm:grid-cols-2">
                {listing.features.map((f) => (
                  <li key={f} className="flex gap-2 text-sm text-ink-2">
                    <span aria-hidden className="text-brand">
                      —
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <aside className="lg:col-span-1">
          <div className="lg:sticky lg:top-6">
            <EnquiryForm listingId={listing.id} title={listing.title} />
          </div>
        </aside>
      </div>
    </div>
  );
}
