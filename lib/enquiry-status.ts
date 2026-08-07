/**
 * The enquiry pipeline, as plain data.
 *
 * Deliberately importless. These constants are needed by client components
 * (the status chips), by server components (the badges), and by server actions
 * — and if they lived in `admin-data.ts` alongside the database client, every
 * client component that wanted a label would drag `next/headers` into the
 * browser bundle and fail the build.
 */

export const ENQUIRY_STATUSES = ["new", "contacted", "viewing_booked", "closed"] as const;

export type EnquiryStatus = (typeof ENQUIRY_STATUSES)[number];

export const STATUS_LABELS: Record<EnquiryStatus, string> = {
  new: "New",
  contacted: "Contacted",
  viewing_booked: "Viewing booked",
  closed: "Closed",
};

export interface EnquiryNote {
  id: string;
  body: string;
  kind: "note" | "status";
  authorName: string;
  createdAt: string;
}
