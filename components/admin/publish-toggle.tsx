"use client";

import { useTransition } from "react";
import { setPublished } from "@/lib/admin-actions";

/**
 * Publishes or unpublishes without leaving the list.
 *
 * A form rather than a checkbox with an onChange: unpublishing removes a
 * property from the public website, and a control that fires on hover-adjacent
 * interactions is the wrong shape for that.
 */
export function PublishToggle({ id, published }: { id: string; published: boolean }) {
  const [pending, start] = useTransition();

  return (
    <form
      action={(formData) => start(() => setPublished(formData).then(() => undefined))}
      className="flex items-center gap-2"
    >
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="published" value={published ? "false" : "true"} />

      <span
        className={`inline-block h-2 w-2 shrink-0 rounded-full ${
          published ? "bg-brand" : "bg-line-strong"
        }`}
        aria-hidden="true"
      />
      <span className="text-sm">{published ? "Live" : "Draft"}</span>

      <button
        disabled={pending}
        className="text-xs text-muted underline-offset-2 hover:text-brand hover:underline disabled:opacity-50"
      >
        {pending ? "…" : published ? "Unpublish" : "Publish"}
      </button>
    </form>
  );
}
