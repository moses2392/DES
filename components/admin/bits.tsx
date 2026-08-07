import Link from "next/link";
import { STATUS_LABELS, type EnquiryStatus } from "@/lib/enquiry-status";

/** Small pieces shared across the back office. */

const STATUS_STYLE: Record<EnquiryStatus, string> = {
  // Amber is reserved for "needs attention" throughout the site; a new enquiry
  // that nobody has touched is exactly that.
  new: "border-amber/40 bg-amber/10 text-amber",
  contacted: "border-line-strong bg-surface-2 text-ink-2",
  viewing_booked: "border-brand/40 bg-brand/10 text-brand",
  closed: "border-line bg-surface text-muted",
};

export function StatusBadge({ status }: { status: EnquiryStatus }) {
  return (
    <span
      className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${
        STATUS_STYLE[status] ?? STATUS_STYLE.closed
      }`}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

export function Stat({
  label,
  value,
  href,
  tone = "plain",
}: {
  label: string;
  value: number | string;
  href?: string;
  tone?: "plain" | "attention";
}) {
  const body = (
    <div
      className={`card h-full p-4 transition ${href ? "hover:border-brand" : ""} ${
        tone === "attention" && Number(value) > 0 ? "border-amber/50 bg-amber/5" : ""
      }`}
    >
      <div className="text-2xl font-bold tabular-nums">{value}</div>
      <div className="mt-0.5 text-sm text-muted">{label}</div>
    </div>
  );
  return href ? (
    <Link href={href} className="block">
      {body}
    </Link>
  ) : (
    body
  );
}

/** A date the way a person says it, in UK format and London time. */
export function when(iso: string | null, withTime = false): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Europe/London",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}

export function money(pence: number): string {
  return `£${(pence / 100).toLocaleString("en-GB", { maximumFractionDigits: 0 })}`;
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="card p-10 text-center">
      <p className="font-semibold">{title}</p>
      <p className="mt-1 text-sm text-muted">{body}</p>
    </div>
  );
}
