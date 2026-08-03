import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
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

        <header className="border-b border-line bg-card">
          <div className="mx-auto flex h-14 max-w-[1600px] items-center justify-between px-4 md:px-6">
            <Link href="/" className="text-lg font-bold tracking-tight">
              DES<span className="text-brand">.</span>
            </Link>
            <nav className="flex items-center gap-5 text-sm" aria-label="Main">
              <Link href="/" className="text-ink-2 hover:text-brand">
                Search
              </Link>
              <Link href="/about" className="text-ink-2 hover:text-brand">
                About
              </Link>
            </nav>
          </div>
        </header>

        <main id="main" className="flex-1">
          {children}
        </main>

        <footer className="border-t border-line bg-card">
          <div className="mx-auto flex max-w-[1600px] flex-col justify-between gap-2 px-4 py-6 text-sm text-muted md:flex-row md:px-6">
            <p>© {new Date().getFullYear()} DES Lettings, London</p>
            <p>Map data © OpenStreetMap contributors</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
