import { redirect } from "next/navigation";
import { InviteForm } from "@/components/admin/invite-form";
import { ActiveToggle } from "@/components/admin/active-toggle";
import { when } from "@/components/admin/bits";
import { team } from "@/lib/admin-data";
import { currentStaff } from "@/lib/supabase-server";

export const metadata = { title: "Team" };

const NOTICES: Record<string, string> = {
  "not-allowed": "Only an owner can change the team.",
  self: "You cannot deactivate your own account.",
};

export default async function TeamPage({ searchParams }: PageProps<"/admin/team">) {
  const params = await searchParams;
  const staff = await currentStaff();

  // The nav hides this tab from agents, but hiding a link is not a permission.
  // An agent who types the URL is refused here, and would be refused by the
  // database in any case.
  if (!staff || staff.role !== "owner") redirect("/admin");

  const members = await team();
  const notice = typeof params.error === "string" ? NOTICES[params.error] : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Team</h1>
        <p className="mt-1 text-sm text-muted">
          Who can sign in to the back office. Only owners can change this.
        </p>
      </div>

      {notice && (
        <p
          role="alert"
          className="rounded-[--radius] border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger"
        >
          {notice}
        </p>
      )}

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-line bg-surface-2 text-left">
            <tr>
              <th className="px-4 py-2.5 font-semibold">Person</th>
              <th className="px-4 py-2.5 font-semibold">Role</th>
              <th className="hidden px-4 py-2.5 font-semibold sm:table-cell">Added</th>
              <th className="px-4 py-2.5 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {members.map((m) => (
              <tr key={m.id} className={m.active ? "" : "opacity-60"}>
                <td className="px-4 py-3">
                  <div className="font-semibold">{m.fullName || "—"}</div>
                  <div className="text-xs text-muted">{m.email}</div>
                </td>
                <td className="px-4 py-3 capitalize">{m.role}</td>
                <td className="hidden px-4 py-3 whitespace-nowrap text-muted sm:table-cell">
                  {when(m.createdAt)}
                </td>
                <td className="px-4 py-3">
                  {!m.claimed ? (
                    <span className="text-xs text-amber">Has not signed in yet</span>
                  ) : (
                    <ActiveToggle id={m.id} active={m.active} isSelf={m.id === staff.id} />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card max-w-xl p-5">
        <h2 className="font-semibold">Add someone</h2>
        <p className="mt-1 mb-4 text-sm text-muted">
          Adding them here is half of it. You also need to create their login in Supabase →
          Authentication → Users, with the same email. They join the moment they first sign in.
        </p>
        <InviteForm />
      </div>
    </div>
  );
}
