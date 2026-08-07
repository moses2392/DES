"use client";

import { useState } from "react";
import { deleteEnquiry } from "@/lib/admin-actions";

/**
 * Deletion behind a typed confirmation.
 *
 * Deleting an enquiry destroys its note trail, which is the only record of what
 * was said to that person. Closing it is almost always the right answer, so
 * this is deliberately more effort than the button next to it.
 */
export function DeleteEnquiry({ id, name }: { id: string; name: string }) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const matches = typed.trim().toLowerCase() === name.trim().toLowerCase();

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm text-muted underline-offset-2 hover:text-danger hover:underline"
      >
        Delete this enquiry
      </button>
    );
  }

  return (
    <form action={deleteEnquiry} className="space-y-3">
      <input type="hidden" name="id" value={id} />

      <p className="text-sm text-muted">
        This permanently removes the enquiry and every note on it. Type{" "}
        <span className="font-semibold text-ink">{name}</span> to confirm.
      </p>

      <input
        value={typed}
        onChange={(e) => setTyped(e.target.value)}
        className="field"
        autoComplete="off"
        aria-label={`Type ${name} to confirm deletion`}
      />

      <div className="flex items-center gap-3">
        <button
          disabled={!matches}
          className="btn bg-danger text-white disabled:cursor-not-allowed disabled:bg-line-strong"
        >
          Delete permanently
        </button>
        <button type="button" onClick={() => setOpen(false)} className="btn btn-quiet">
          Cancel
        </button>
      </div>
    </form>
  );
}
