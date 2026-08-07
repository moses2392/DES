import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Session refresh, and a courtesy redirect.
 *
 * Supabase access tokens are short-lived, and a Server Component cannot write
 * cookies — so without this the refreshed token would be thrown away and staff
 * would be signed out mid-task.
 *
 * The redirect below is a convenience, not a security boundary. Nothing here
 * decides what anyone may see: every admin page checks `currentStaff()` again,
 * and every query is filtered by row-level security in Postgres. If this file
 * were deleted entirely, the back office would still refuse strangers — it
 * would just show them an empty page instead of a sign-in form.
 */
export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

  // An unconfigured deployment should reach the page that explains itself,
  // rather than failing here with something unreadable.
  if (!url || !key) return NextResponse.next();

  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        for (const { name, value } of list) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of list) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isAdmin = path === "/admin" || path.startsWith("/admin/");
  const isSignIn = path === "/admin/sign-in";

  if (!user && isAdmin && !isSignIn) {
    const signIn = new URL("/admin/sign-in", request.url);
    signIn.searchParams.set("next", path);
    return NextResponse.redirect(signIn);
  }

  // Someone already signed in has no use for the sign-in form.
  if (user && isSignIn) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return response;
}

export const config = {
  // Static assets are excluded so the refresh does not add a round trip to
  // every photograph on the public site.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
