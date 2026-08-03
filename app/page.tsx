import { isConfigured, listListings } from "@/lib/listings";
import type { Listing } from "@/lib/search";
import { SearchView } from "@/components/search-view";
import { SetupNotice } from "@/components/setup-notice";

// Listings change when the landlord edits them, so nothing here is cached.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  if (!isConfigured()) return <SetupNotice />;

  // Only the fetch is guarded. Wrapping the JSX as well would also swallow
  // render errors thrown by the children, which belong to an error boundary
  // rather than to this catch.
  let listings: Listing[] = [];
  let failure: string | null = null;

  try {
    listings = await listListings();
  } catch (err) {
    failure = err instanceof Error ? err.message : "Unknown error";
  }

  if (failure) return <SetupNotice detail={failure} />;
  return <SearchView listings={listings} />;
}
