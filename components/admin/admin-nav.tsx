"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/admin", label: "Overview", exact: true },
  { href: "/admin/enquiries", label: "Enquiries" },
  { href: "/admin/listings", label: "Properties" },
  { href: "/admin/team", label: "Team", ownerOnly: true },
];

export function AdminNav({ isOwner }: { isOwner: boolean }) {
  const pathname = usePathname();

  return (
    <nav className="mx-auto max-w-[1400px] px-4 md:px-6" aria-label="Back office">
      <ul className="-mb-px flex gap-1 overflow-x-auto">
        {TABS.filter((tab) => !tab.ownerOnly || isOwner).map((tab) => {
          const active = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={`block border-b-2 px-3 py-2.5 text-sm whitespace-nowrap transition ${
                  active
                    ? "border-brand font-semibold text-ink"
                    : "border-transparent text-muted hover:text-ink-2"
                }`}
              >
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
