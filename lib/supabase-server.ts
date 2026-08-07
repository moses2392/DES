import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * The signed-in staff member's database client.
 *
 * Still the publishable key — this application holds no secret key, and adding
 * a back office did not change that. What separates a member of staff from a
 * visitor is the session cookie, not the key: every admin policy in
 * `0003_staff_and_admin.sql` asks `is_staff()`, which answers from the signed-in
 * user id. The same key in a stranger's browser can read published listings and
 * write an enquiry, and nothing else.
 *
 * The practical consequence is that a mistake in this file cannot leak data.
 * Forgetting a filter returns fewer rows, never someone else's.
 */

function config() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!url || !key) {
    throw new Error("Missing Supabase configuration. Copy .env.example to .env.local.");
  }
  return { url, key };
}

export async function sessionClient() {
  const { url, key } = config();
  const store = await cookies();

  return createServerClient(url, key, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          for (const { name, value, options } of list) store.set(name, value, options);
        } catch {
          // Server Components cannot write cookies. The refresh is done in
          // proxy.ts, which can; this is the harmless no-op half of the pair.
        }
      },
    },
  });
}

export interface StaffMember {
  id: string;
  userId: string | null;
  email: string;
  fullName: string;
  role: "owner" | "agent";
  active: boolean;
}

/**
 * Who is asking.
 *
 * Signed-out and signed-in-but-not-staff are deliberately different answers.
 * Collapsing them into "null" causes a redirect loop: the proxy sends anyone
 * with a session on to /admin, and a layout that bounces every non-staff person
 * back to the sign-in page would send them straight round again. They need to
 * be told what is wrong instead.
 *
 * "Not staff" also covers a deactivated account and — before the migration in
 * `0003_staff_and_admin.sql` has been run — a missing `staff` table, which is
 * why the query failing is treated as "not staff" rather than thrown.
 */
export type Access =
  | { state: "signed-out" }
  | { state: "not-staff"; email: string }
  | { state: "staff"; staff: StaffMember };

export async function access(): Promise<Access> {
  const supabase = await sessionClient();

  // getUser, not getSession: this revalidates the token with Supabase rather
  // than trusting what the cookie claims about itself.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { state: "signed-out" };

  const { data } = await supabase
    .from("staff")
    .select("id, user_id, email, full_name, role, active")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!data || !data.active) {
    return { state: "not-staff", email: user.email ?? "" };
  }

  return {
    state: "staff",
    staff: {
      id: data.id,
      userId: data.user_id,
      email: data.email,
      fullName: data.full_name,
      role: data.role,
      active: data.active,
    },
  };
}

/** Convenience for pages that only care whether there is a staff member. */
export async function currentStaff(): Promise<StaffMember | null> {
  const result = await access();
  return result.state === "staff" ? result.staff : null;
}
