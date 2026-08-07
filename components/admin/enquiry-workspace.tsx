"use client";

import { useActionState, useState } from "react";
import { addNote, updateEnquiry, type FormState } from "@/lib/admin-actions";
import {
  ENQUIRY_STATUSES,
  STATUS_LABELS,
  type EnquiryNote,
  type EnquiryStatus,
} from "@/lib/enquiry-status";

const EMPTY: FormState = { error: null };

/** Turns an ISO timestamp into the value a datetime-local input expects. */
function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function EnquiryWorkspace({
  enquiryId,
  status,
  assignedTo,
  viewingAt,
  staff,
  notes,
}: {
  enquiryId: string;
  status: EnquiryStatus;
  assignedTo: string | null;
  viewingAt: string | null;
  staff: { id: string; name: string }[];
  notes: EnquiryNote[];
}) {
  const [updateState, update, updating] = useActionState(updateEnquiry, EMPTY);
  const [noteState, note, noting] = useActionState(addNote, EMPTY);

  // Local so the viewing field can appear the moment "Viewing booked" is
  // chosen, rather than after a round trip.
  const [chosen, setChosen] = useState<EnquiryStatus>(status);

  return (
    <>
      <section className="card p-5">
        <h2 className="mb-4 font-semibold">Move it along</h2>

        <form action={update} className="space-y-4">
          <input type="hidden" name="id" value={enquiryId} />
          <input type="hidden" name="previousStatus" value={status} />

          <div>
            <span className="mb-1.5 block text-sm font-semibold">Status</span>
            <div className="flex flex-wrap gap-2">
              {ENQUIRY_STATUSES.map((s) => (
                <label key={s} className="cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    value={s}
                    checked={chosen === s}
                    onChange={() => setChosen(s)}
                    className="sr-only"
                  />
                  <span className="chip block" aria-pressed={chosen === s}>
                    {STATUS_LABELS[s]}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {chosen === "viewing_booked" && (
            <div>
              <label htmlFor="viewingAt" className="mb-1.5 block text-sm font-semibold">
                Viewing date and time
              </label>
              <input
                id="viewingAt"
                name="viewingAt"
                type="datetime-local"
                defaultValue={toLocalInput(viewingAt)}
                className="field"
              />
            </div>
          )}

          <div>
            <label htmlFor="assignedTo" className="mb-1.5 block text-sm font-semibold">
              Looked after by
            </label>
            <select
              id="assignedTo"
              name="assignedTo"
              defaultValue={assignedTo ?? ""}
              className="field"
            >
              <option value="">Nobody yet</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {updateState.error && (
            <p role="alert" className="text-sm text-danger">
              {updateState.error}
            </p>
          )}
          {updateState.ok && (
            <p role="status" className="text-sm text-brand">
              Saved.
            </p>
          )}

          <button disabled={updating} className="btn btn-primary">
            {updating ? "Saving…" : "Save"}
          </button>
        </form>
      </section>

      <section className="card p-5">
        <h2 className="mb-1 font-semibold">History</h2>
        <p className="mb-4 text-xs text-muted">
          Notes cannot be edited or deleted once written — including by an owner.
        </p>

        {notes.length === 0 ? (
          <p className="mb-4 text-sm text-muted">Nothing recorded yet.</p>
        ) : (
          <ol className="mb-5 space-y-3">
            {notes.map((n) => (
              <li
                key={n.id}
                className={`border-l-2 pl-3 ${n.kind === "status" ? "border-line-strong" : "border-brand"}`}
              >
                <p
                  className={`text-sm whitespace-pre-wrap ${
                    n.kind === "status" ? "text-muted italic" : "text-ink-2"
                  }`}
                >
                  {n.body}
                </p>
                <p className="mt-0.5 text-xs text-muted">
                  {n.authorName} ·{" "}
                  {new Date(n.createdAt).toLocaleString("en-GB", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                    timeZone: "Europe/London",
                  })}
                </p>
              </li>
            ))}
          </ol>
        )}

        <form action={note} className="space-y-3">
          <input type="hidden" name="id" value={enquiryId} />
          <label htmlFor="body" className="sr-only">
            Add a note
          </label>
          <textarea
            id="body"
            name="body"
            rows={3}
            required
            maxLength={4000}
            className="field resize-y"
            placeholder="Called, left a voicemail…"
          />
          {noteState.error && (
            <p role="alert" className="text-sm text-danger">
              {noteState.error}
            </p>
          )}
          <button disabled={noting} className="btn btn-quiet">
            {noting ? "Adding…" : "Add note"}
          </button>
        </form>
      </section>
    </>
  );
}
