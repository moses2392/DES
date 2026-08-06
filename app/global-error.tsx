"use client";

/**
 * Last resort: an error thrown by the root layout itself, where app/error.tsx
 * cannot help because the layout that would wrap it is the thing that failed.
 * It must therefore render its own <html> and <body>, and cannot rely on the
 * stylesheet having loaded — hence the inline styles.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#f7f8fa",
          color: "#10192b",
          fontFamily: "system-ui, sans-serif",
          padding: "2rem",
        }}
      >
        <div style={{ maxWidth: "34rem" }}>
          <h1 style={{ fontSize: "1.5rem", margin: 0 }}>This page could not be loaded</h1>
          <p style={{ lineHeight: 1.6, color: "#3c4759" }}>
            Something failed before the page could be built. Reloading sometimes clears it.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              background: "#1f4ed8",
              color: "#fff",
              border: 0,
              borderRadius: 8,
              padding: "0.7rem 1.2rem",
              fontSize: "0.9rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Reload
          </button>
          {error.digest && (
            <p style={{ marginTop: "2rem", fontSize: "0.85rem", color: "#6b7688" }}>
              Reference for the logs: <code>{error.digest}</code>
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
