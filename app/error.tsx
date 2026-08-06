"use client";

/**
 * Catches render errors that a data-fetch try/catch cannot: anything thrown by
 * a child while rendering, which on a hosted deployment otherwise surfaces as
 * an unexplained "a server error occurred" with no route to a diagnosis.
 *
 * React deliberately withholds production error messages from the browser, so
 * the digest is shown instead — it is the key to finding the real exception in
 * the hosting provider's runtime logs.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 md:px-6 md:py-24">
      <div className="card p-8">
        <h1 className="text-2xl font-bold">Something went wrong on this page</h1>
        <p className="mt-3 leading-relaxed text-ink-2">
          The rest of the site is still working — try again, or head back to the search.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <button type="button" onClick={reset} className="btn btn-primary">
            Try again
          </button>
          {/* A plain anchor, not next/link, on purpose: this boundary exists
              because something already failed, and client-side routing may be
              part of it. A full page load is the more dependable escape. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/" className="btn btn-quiet">
            Back to search
          </a>
        </div>

        {error.digest && (
          <p className="mt-8 border-t border-line pt-4 text-sm text-muted">
            Reference for the logs: <span className="font-mono">{error.digest}</span>
          </p>
        )}
      </div>
    </div>
  );
}
