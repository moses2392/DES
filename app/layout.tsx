import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: {
    default: "DES — Flats and houses to rent in London",
    template: "%s · DES",
  },
  description:
    "Long-term lettings across London. Search by area, price and bedrooms on a live map, and enquire directly with the landlord.",
};

/**
 * The document shell, and nothing else.
 *
 * The public site's header and footer live in `app/(public)/layout.tsx`, so the
 * back office can have its own chrome without either one inheriting the
 * other's. Route groups do not appear in URLs — every public path is exactly
 * where it was.
 */
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="flex min-h-full flex-col bg-surface text-ink">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-ink focus:px-4 focus:py-2 focus:text-white"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
