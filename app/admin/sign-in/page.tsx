import Link from "next/link";
import { SignInForm } from "@/components/admin/sign-in-form";

export const metadata = { title: "Staff sign in" };

export default async function SignInPage({ searchParams }: PageProps<"/admin/sign-in">) {
  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : "/admin";

  return (
    <main id="main" className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="text-xl font-bold tracking-tight">
            DES<span className="text-brand">.</span>
          </Link>
          <p className="mt-1 text-sm text-muted">Staff area</p>
        </div>

        <div className="card p-6">
          <h1 className="text-lg font-bold">Sign in</h1>
          <p className="mt-1 mb-6 text-sm text-muted">
            Accounts are created by an owner. There is no sign-up.
          </p>
          <SignInForm next={next} />
        </div>

        <p className="mt-6 text-center text-sm text-muted">
          <Link href="/" className="hover:text-brand">
            Back to the website
          </Link>
        </p>
      </div>
    </main>
  );
}
