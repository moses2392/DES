"use client";

import { useActionState } from "react";
import { sendEnquiry, type EnquiryState } from "@/lib/enquiry-actions";

const INITIAL: EnquiryState = { error: null };

export function EnquiryForm({ listingId, title }: { listingId: string; title: string }) {
  const [state, formAction, pending] = useActionState(sendEnquiry, INITIAL);

  if (state.sent) {
    return (
      <div className="card p-6">
        <h2 className="mb-2 text-lg font-semibold">Enquiry sent</h2>
        <p className="text-sm leading-relaxed text-ink-2">
          The landlord has your details and will reply directly. Nobody else can read your
          message.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="card flex flex-col gap-4 p-6">
      <input type="hidden" name="listingId" value={listingId} />

      <div>
        <h2 className="text-lg font-semibold">Enquire about this property</h2>
        <p className="mt-1 text-sm text-muted">{title}</p>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Your name</span>
        <input name="name" required autoComplete="name" className="field" />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Email</span>
        <input name="email" type="email" required autoComplete="email" className="field" />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">
          Phone <span className="font-normal text-muted">(optional)</span>
        </span>
        <input name="phone" autoComplete="tel" className="field" />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">
          Preferred viewing date <span className="font-normal text-muted">(optional)</span>
        </span>
        <input name="preferredViewing" type="date" className="field" />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Message</span>
        <textarea
          name="message"
          required
          rows={4}
          className="field resize-y"
          placeholder="When you would like to move, who would be living there, and anything you want to ask."
        />
      </label>

      {state.error && (
        <p role="alert" className="rounded border-l-2 border-danger bg-surface-2 p-3 text-sm text-danger">
          {state.error}
        </p>
      )}

      <button type="submit" disabled={pending} className="btn btn-primary">
        {pending ? "Sending…" : "Send enquiry"}
      </button>

      <p className="text-xs leading-relaxed text-muted">
        Your details go only to this landlord. Enquiries cannot be read by other visitors.
      </p>
    </form>
  );
}
