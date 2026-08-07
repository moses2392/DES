import Link from "next/link";

/** The public site's chrome. The back office deliberately does not share it. */
export default function PublicLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
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
    </>
  );
}
