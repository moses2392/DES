import Link from "next/link";
import { ListingForm } from "@/components/admin/listing-form";

export const metadata = { title: "Add a property" };

export default function NewListingPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href="/admin/listings" className="text-sm text-muted hover:text-brand">
          ← All properties
        </Link>
        <h1 className="mt-2 text-2xl font-bold">Add a property</h1>
        <p className="mt-1 text-sm text-muted">
          It stays off the website until you tick the box at the bottom.
        </p>
      </div>

      <ListingForm />
    </div>
  );
}
