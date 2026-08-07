import type { NextConfig } from "next";

/**
 * Hosts next/image is allowed to optimise.
 *
 * The Supabase host is derived from the same environment variable the app uses
 * rather than hardcoded, so a deployment pointed at a different project does
 * not silently lose every uploaded photograph. `lib/image-hosts.ts` derives the
 * same list at runtime for `SafeImage`; the two must agree, which is why both
 * read the same variable.
 */
function supabaseHost(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!url) return null;
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

const host = supabaseHost();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
      // Photographs uploaded through the back office.
      ...(host
        ? [{ protocol: "https" as const, hostname: host, pathname: "/storage/v1/object/public/**" }]
        : []),
    ],
  },
};

export default nextConfig;
