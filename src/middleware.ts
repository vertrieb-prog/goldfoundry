// src/middleware.ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const RESERVED_SUBDOMAINS = ["www", "api", "admin", "app", "mail", "ftp"];

function extractSubdomain(host: string): { niche: string | null; locale: string | null } {
  const hostname = host.split(":")[0];
  const mainDomain = "goldfoundry.de";

  if (!hostname.endsWith(mainDomain) && hostname !== "localhost") {
    return { niche: null, locale: null };
  }

  const subdomain = hostname.replace(`.${mainDomain}`, "").replace("localhost", "");
  if (!subdomain || subdomain === hostname || RESERVED_SUBDOMAINS.includes(subdomain)) {
    return { niche: null, locale: null };
  }

  if (subdomain.length === 2) {
    return { niche: null, locale: subdomain };
  }

  return { niche: subdomain, locale: null };
}

export async function middleware(request: NextRequest) {
  const host = request.headers.get("host") || "";
  const { niche, locale } = extractSubdomain(host);

  // DEV MODE
  if (process.env.NODE_ENV === "development" && !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    if (niche) {
      const url = request.nextUrl.clone();
      url.pathname = `/_subdomain${url.pathname}`;
      const response = NextResponse.rewrite(url);
      response.headers.set("x-subdomain-niche", niche);
      return response;
    }
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  if (niche) supabaseResponse.headers.set("x-subdomain-niche", niche);
  if (locale) supabaseResponse.headers.set("x-subdomain-locale", locale);

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
          if (niche) supabaseResponse.headers.set("x-subdomain-niche", niche);
          if (locale) supabaseResponse.headers.set("x-subdomain-locale", locale);
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Subdomain-Seiten: Rewrite auf /_subdomain/ Route
  if (niche) {
    const url = request.nextUrl.clone();
    url.pathname = `/_subdomain${url.pathname}`;
    const response = NextResponse.rewrite(url);
    response.headers.set("x-subdomain-niche", niche);
    if (locale) response.headers.set("x-subdomain-locale", locale);
    return response;
  }

  const { data: { user } } = await supabase.auth.getUser();

  const protectedPaths = ["/dashboard", "/admin"];
  const isProtected = protectedPaths.some(p => request.nextUrl.pathname.startsWith(p));

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  const authRedirectPaths = ["/auth/login", "/auth/register"];
  const isAuthPage = authRedirectPaths.some(p => request.nextUrl.pathname === p);

  if (isAuthPage && user) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.json|icons/).*)"],
};
