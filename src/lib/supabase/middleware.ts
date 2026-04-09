import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!supabaseUrl || !supabaseAnonKey) {
    const { pathname } = request.nextUrl;
    const publicRoutes = ["/", "/login", "/signup"];
    const isPublicRoute = publicRoutes.some(
      (route) => pathname === route || pathname.startsWith("/callback")
    );
    if (isPublicRoute || pathname.startsWith("/api") || pathname === "/sw.js" || pathname === "/manifest.json") {
      return supabaseResponse;
    }
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;

  const publicRoutes = ["/", "/login", "/signup"];
  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith("/callback")
  );
  const isPublicApi = pathname === "/api/health";
  const isOnboardingRoute = ["/welcome", "/setup-accountant", "/first-receipt"].includes(pathname);

  // Not logged in → redirect to login
  if (!user && !isPublicRoute && !isPublicApi) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Logged in on auth pages → redirect to dashboard
  if (user && (pathname === "/login" || pathname === "/signup")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // Admin routes - require ADMIN_EMAIL match
  if (pathname.startsWith("/admin")) {
    const adminEmail = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
    if (!adminEmail || !user || user.email?.toLowerCase() !== adminEmail) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
    return supabaseResponse; // Skip onboarding check for admin
  }

  // Check onboarding for authenticated users on app routes
  if (user && !isPublicRoute && !isOnboardingRoute && !pathname.startsWith("/api")) {
    const { data: settings } = await supabase
      .from("user_settings")
      .select("onboarding_completed")
      .eq("user_id", user.id)
      .single();

    if (!settings || !settings.onboarding_completed) {
      const url = request.nextUrl.clone();
      url.pathname = "/welcome";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
