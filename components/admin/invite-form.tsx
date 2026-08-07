"use client";

import { useActionState } from "react";
import { inviteStaff, type FormState } from "@/lib/admin-actions";

const EMPTY: FormState = { error: null };

export function InviteForm() {
  const [state, action, pending] = useActionState(inviteStaff, EMPTY);

  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="fullName" className="mb-1.5 block text-sm font-semibold">
            Name
          </label>
          <input id="fullName" name="fullName" className="field" placeholder="Sam Okonkwo" />
        </div>
        <div>
          <label htmlFor="inviteEmail" className="mb-1.5 block text-sm font-semibold">
            Email
          </label>
          <input
            id="inviteEmail"
            name="email"
            type="email"
            required
            className="field"
            placeholder="sam@deslettings.co.uk"
          />
        </div>
      </div>

      <div>
        <label htmlFor="role" className="mb-1.5 block text-sm font-semibold">
          Role
        </label>
        <select id="role" name="role" defaultValue="agent" className="field sm:max-w-xs">
          <option value="agent">Agent — properties and enquiries</option>
          <option value="owner">Owner — everything, including the team</option>
        </select>
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p role="status" className="text-sm text-brand">
          Added. Create their login in Supabase with the same email.
        </p>
      )}

      <button disabled={pending} className="btn btn-primary">
        {pending ? "Adding…" : "Add to team"}
      </button>
    </form>
  );
}
