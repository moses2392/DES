import { listListings } from "@/lib/listings";
import { SearchView } from "@/components/search-view";

// Listings change when the landlord edits them, so nothing here is cached.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const listings = await listListings();
  return <SearchView listings={listings} />;
}
