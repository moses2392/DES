/**
 * Which image hosts next/image is allowed to optimise.
 *
 * This must agree with `remotePatterns` in next.config.ts — next/image throws
 * for any host missing there, and a throw during render takes down the whole
 * page rather than one photograph. Both derive the Supabase host from the same
 * environment variable so they cannot drift apart when a deployment is pointed
 * at a different project.
 */

function supabaseHost(): string | null {
  // Inlined at build time by Next, so this works in the browser too.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!url) return null;
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

export function allowedHosts(): Set<string> {
  const hosts = new Set(["images.unsplash.com"]);
  const supabase = supabaseHost();
  if (supabase) hosts.add(supabase);
  return hosts;
}

export function isOptimisable(src: string | undefined): boolean {
  if (!src) return false;
  try {
    return allowedHosts().has(new URL(src).hostname);
  } catch {
    // Not a parseable absolute URL — a relative path, or plain nonsense.
    return false;
  }
}
