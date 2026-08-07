"use client";

import { useTransition } from "react";
import { setStaffActive } from "@/lib/admin-actions";

export function ActiveToggle({
  id,
  active,
  isSelf,
}: {
  id: string;
  active: boolean;
  isSelf: boolean;
}) {
  const [pending, start] = useTransition();

  if (isSelf) {
    // Deactivating the account you are signed in as locks you out of the only
    // screen that could undo it.
    return <span className="text-xs text-muted">This is you</span>;
  }

  return (
    <form
      action={(formData) => start(() => setStaffActive(formData).then(() => undefined))}
      className="flex items-center gap-2"
    >
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="active" value={active ? "false" : "true"} />
      <span className="text-sm">{active ? "Active" : "Deactivated"}</span>
      <button
        disabled={pending}
        className="text-xs text-muted underline-offset-2 hover:text-brand hover:underline disabled:opacity-50"
      >
        {pending ? "…" : active ? "Deactivate" : "Reactivate"}
      </button>
    </form>
  );
}
