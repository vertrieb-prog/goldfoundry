// src/middleware.ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // DEV MODE: Skip auth only in development when Supabase is not configured
  if (process.env.NODE_ENV === "development" && !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Protected routes — redirect to login if not authenticated
  const protectedPaths = ["/dashboard", "/chat", "/copier", "/leaderboard", "/admin"];
  const isProtected = protectedPaths.some(p => request.nextUrl.pathname.startsWith(p));

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // Dashboard access — only for paying users (check subscription tier)
  if (request.nextUrl.pathname.startsWith("/dashboard") && user) {
    // Allow upgrade page for everyone (that's where they pay)
    if (request.nextUrl.pathname === "/dashboard/upgrade") {
      return supabaseResponse;
    }

    // Check subscription tier from user metadata or profiles
    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_tier")
      .eq("id", user.id)
      .single();

    const tier = profile?.subscription_tier || "free";
    if (tier === "free") {
      return NextResponse.redirect(new URL("/pricing", request.url));
    }
  }

  // Auth pages — redirect to pricing if already logged in (they pick a plan first)
  if (request.nextUrl.pathname.startsWith("/auth/") && user) {
    return NextResponse.redirect(new URL("/pricing", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/dashboard/:path*", "/chat/:path*", "/copier/:path*", "/leaderboard/:path*", "/admin/:path*", "/auth/:path*", "/pricing"],
};
