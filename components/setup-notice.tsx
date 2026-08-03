/**
 * Shown when the database credentials are absent — almost always a fresh
 * deployment where the environment variables have not been added yet.
 *
 * It names the two variables and where to put them, because the alternative
 * is a blank error page that gives whoever deployed it nothing to act on. Both
 * values are publishable by design, so naming them here leaks nothing.
 */
export function SetupNotice({ detail }: { detail?: string }) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 md:px-6 md:py-24">
      <div className="card p-8">
        <h1 className="text-2xl font-bold">Almost there — two settings missing</h1>
        <p className="mt-3 leading-relaxed text-ink-2">
          The site is deployed but has not been told where its database is, so there are no
          properties to show yet.
        </p>

        <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-muted">
          Add these environment variables
        </h2>
        <ul className="mt-3 flex flex-col gap-2">
          {["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"].map((name) => (
            <li key={name} className="rounded bg-surface-2 px-3 py-2 font-mono text-sm">
              {name}
            </li>
          ))}
        </ul>

        <p className="mt-6 leading-relaxed text-ink-2">
          Both come from Supabase under <strong>Settings → API</strong>. In Vercel they go in{" "}
          <strong>Settings → Environment Variables</strong>.
        </p>

        <p className="mt-4 rounded border-l-2 border-amber bg-surface-2 p-3 text-sm leading-relaxed text-ink-2">
          Environment variables only apply to new deployments. After adding them, open the{" "}
          <strong>Deployments</strong> tab and choose <strong>Redeploy</strong> — otherwise nothing
          changes and it looks as though the settings did not work.
        </p>

        {detail && (
          <p className="mt-6 border-t border-line pt-4 text-sm text-muted">
            Reported error: <span className="font-mono">{detail}</span>
          </p>
        )}
      </div>
    </div>
  );
}
