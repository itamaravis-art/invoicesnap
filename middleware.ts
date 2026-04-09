import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  // Skip auth for public portal routes
  if (request.nextUrl.pathname.startsWith("/portal/")) {
    return NextResponse.next({ request });
  }

  // CSRF protection for API routes (exclude webhooks)
  if (request.nextUrl.pathname.startsWith("/api/") && !request.nextUrl.pathname.startsWith("/api/webhooks/") && ["POST", "PATCH", "DELETE"].includes(request.method)) {
    const origin = request.headers.get("origin");
    const host = request.headers.get("host");
    const originUrl = origin ? new URL(origin) : null;
    if (originUrl && host && originUrl.host !== host) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sw\\.js|manifest\\.json|icons/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
