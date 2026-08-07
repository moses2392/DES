import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminNav } from "@/components/admin/admin-nav";
import { access } from "@/lib/supabase-server";
import { signOut } from "@/lib/auth-actions";

/**
 * The back office shell, and the check that actually guards it.
 *
 * The sign-in page lives at `app/admin/sign-in`, outside this route group, so
 * it is deliberately not wrapped by this layout — otherwise the page you visit
 * to obtain a session would require one. Route groups do not appear in URLs, so
 * every path here is still `/admin/...`.
 *
 * proxy.ts also redirects signed-out visitors, but that is a convenience. This
 * is the boundary: a signed-in person who is not staff, or who has been
 * deactivated, is sent away from here — and every query their page would have
 * run is refused by row-level security regardless.
 */
export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const result = await access();

  if (result.state === "signed-out") redirect("/admin/sign-in");

  // Signed in, but not a member of staff. Bouncing back to the sign-in page
  // would loop forever — the proxy sends anyone holding a session on to /admin.
  if (result.state === "not-staff") return <NoAccess email={result.email} />;

  const { staff } = result;

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b border-line bg-card">
        <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="text-lg font-bold tracking-tight">
              DES<span className="text-brand">.</span>
            </Link>
            <span className="rounded-full border border-line-strong px-2 py-0.5 text-xs text-muted">
              Staff
            </span>
          </div>

          <div className="flex items-center gap-4 text-sm">
            <Link href="/" className="hidden text-ink-2 hover:text-brand sm:block">
              View website
            </Link>
            <span className="hidden text-muted md:block">
              {staff.fullName || staff.email}
              {staff.role === "owner" && " · owner"}
            </span>
            <form action={signOut}>
              <button className="text-ink-2 hover:text-brand">Sign out</button>
            </form>
          </div>
        </div>

        <AdminNav isOwner={staff.role === "owner"} />
      </header>

      <main id="main" className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-8 md:px-6">
        {children}
      </main>
    </div>
  );
}

/**
 * A real account that is not on the staff list.
 *
 * Also what you see before `0003_staff_and_admin.sql` has been run, because the
 * table does not exist yet — so this doubles as the setup message.
 */
function NoAccess({ email }: { email: string }) {
  return (
    <main id="main" className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="card max-w-md p-6 text-center">
        <h1 className="text-lg font-bold">No access to the back office</h1>
        <p className="mt-2 text-sm text-muted">
          You are signed in as <span className="font-semibold text-ink-2">{email}</span>, but that
          address is not on the staff list. Ask an owner to add it.
        </p>
        <div className="mt-5 flex items-center justify-center gap-3">
          <form action={signOut}>
            <button className="btn btn-quiet">Sign out</button>
          </form>
          <Link href="/" className="btn btn-primary">
            Back to the website
          </Link>
        </div>
      </div>
    </main>
  );
}
