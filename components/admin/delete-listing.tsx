"use client";

import { useState } from "react";
import { deleteListing } from "@/lib/admin-actions";

/**
 * Deletion behind a typed confirmation.
 *
 * A single button here removes the property and cascades every enquiry about
 * it. Making someone type the title is not ceremony — it is the difference
 * between a misplaced click and a decision.
 */
export function DeleteListing({ id, title }: { id: string; title: string }) {
  const [typed, setTyped] = useState("");
  const matches = typed.trim().toLowerCase() === title.trim().toLowerCase();

  return (
    <form action={deleteListing} className="space-y-3">
      <input type="hidden" name="id" value={id} />

      <label htmlFor="confirm" className="block text-sm">
        Type <span className="font-semibold">{title}</span> to confirm.
      </label>
      <input
        id="confirm"
        value={typed}
        onChange={(e) => setTyped(e.target.value)}
        className="field"
        autoComplete="off"
      />

      <button
        disabled={!matches}
        className="btn bg-danger text-white disabled:cursor-not-allowed disabled:bg-line-strong"
      >
        Delete permanently
      </button>
    </form>
  );
}
