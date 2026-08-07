import Image from "next/image";
import { isOptimisable } from "@/lib/image-hosts";

/**
 * next/image throws when a remote host is not listed in next.config's
 * remotePatterns, and a throw during render takes down the whole page with a
 * server error — not just the picture.
 *
 * That is a poor trade for a photograph. Listing images come from whatever URL
 * a landlord happens to paste, so an unexpected host is a matter of time rather
 * than a hypothetical. Anything outside the allowlist falls back to a neutral
 * panel, and the page still renders.
 *
 * The allowlist lives in lib/image-hosts.ts because next.config.ts needs the
 * same answer, and two copies of it would eventually disagree.
 */
export function SafeImage({
  src,
  alt,
  sizes,
  priority,
  className,
}: {
  src: string | undefined;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  if (!isOptimisable(src)) {
    return (
      <div
        aria-hidden={alt === "" ? true : undefined}
        role={alt === "" ? undefined : "img"}
        aria-label={alt || undefined}
        className="flex h-full w-full items-center justify-center bg-surface-2 text-xs text-muted"
      >
        No photograph
      </div>
    );
  }

  return (
    <Image src={src!} alt={alt} fill priority={priority} sizes={sizes} className={className} />
  );
}
