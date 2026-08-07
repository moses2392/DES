import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 md:px-6 md:py-20">
      <h1 className="text-3xl font-bold md:text-4xl">About DES</h1>

      <p className="mt-6 leading-relaxed text-ink-2">
        DES lists long-term rentals across London. Every property is shown on a map with its real
        location, so you can judge a place by where it actually is rather than by which station the
        advert claims is nearby.
      </p>

      <p className="mt-4 leading-relaxed text-ink-2">
        Enquiries go straight to the landlord. There are no agency fees, and no third party sits
        between you and a viewing.
      </p>

      <h2 className="mt-10 text-lg font-semibold">Your details</h2>
      <p className="mt-3 leading-relaxed text-ink-2">
        When you send an enquiry it is stored so the landlord can reply, and nothing more. Enquiries
        cannot be read by other visitors to the site — not by other renters, and not by anyone
        inspecting the page. That is enforced by the database rather than by the website being
        careful.
      </p>

      <h2 className="mt-10 text-lg font-semibold">Maps</h2>
      <p className="mt-3 leading-relaxed text-ink-2">
        Map data comes from OpenStreetMap, which is built and maintained by volunteers.
      </p>

      <div className="mt-10">
        <Link href="/" className="btn btn-primary">
          Search properties
        </Link>
      </div>
    </div>
  );
}
