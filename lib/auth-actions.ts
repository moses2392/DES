"use server";

import { redirect } from "next/navigation";
import { sessionClient } from "@/lib/supabase-server";

/**
 * Sign in and sign out.
 *
 * There is no sign-up. Staff accounts are created by an owner, and a lettings
 * agency with a public registration form on its back office would be an odd
 * thing to build. The only way in is an account someone gave you.
 */

export interface AuthState {
  error: string | null;
}

/** Only ever redirect within this site — an open redirect is a phishing tool. */
function safeNext(next: string): string {
  return next.startsWith("/admin") && !next.startsWith("//") ? next : "/admin";
}

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(String(formData.get("next") ?? "/admin"));

  if (!email || !password) return { error: "Enter your email and password." };

  const supabase = await sessionClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Deliberately not "no account with that email". Distinguishing the two
    // turns this form into a way to find out who works here.
    return { error: "That email and password do not match an account." };
  }

  await claimStaffRow();
  redirect(next);
}

export async function signOut() {
  const supabase = await sessionClient();
  await supabase.auth.signOut();
  redirect("/admin/sign-in");
}

/**
 * Links a staff row to the auth account that just signed in.
 *
 * An owner invites someone by email before that person has an account, so the
 * row's `user_id` is null and `is_staff()` — which matches on `user_id` — does
 * not yet see them. This fills in the link on first sign-in, which is what
 * makes the invitation take effect.
 *
 * The match is against the email inside the verified session token, never
 * anything supplied by a form: otherwise an unverified email could be used to
 * claim a colleague's invitation.
 */
export async function claimStaffRow() {
  const supabase = await sessionClient();

  // Done in the database rather than here, because it cannot be done here: an
  // unclaimed invitation means is_staff() is false, so no staff policy applies
  // and a plain UPDATE would silently affect zero rows. `claim_staff_row` is a
  // narrow SECURITY DEFINER function that attaches the caller's own auth id to
  // a row whose email matches their verified address, and only while that row
  // is unclaimed. See supabase/0003_staff_and_admin.sql.
  await supabase.rpc("claim_staff_row");
}
