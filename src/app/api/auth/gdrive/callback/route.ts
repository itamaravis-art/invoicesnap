import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { exchangeCodeForTokens } from "@/lib/gdrive/auth";
import { encrypt } from "@/lib/gdrive/crypto";
import { DriveClient } from "@/lib/gdrive/client";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", request.url));

  const code = request.nextUrl.searchParams.get("code");
  if (!code) return NextResponse.redirect(new URL("/settings/gdrive?error=no_code", request.url));

  try {
    const tokens = await exchangeCodeForTokens(code);

    // Create root folder in Drive
    const client = new DriveClient(tokens.access_token);
    const rootFolderId = await client.ensureFolder("InvoiceSnap");

    // Get Google email from userinfo
    const userinfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const userinfo = await userinfoRes.json();

    // Store encrypted tokens
    await supabase.from("gdrive_connections").upsert({
      user_id: user.id,
      google_email: userinfo.email || "unknown",
      access_token_encrypted: encrypt(tokens.access_token),
      refresh_token_encrypted: encrypt(tokens.refresh_token),
      token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      root_folder_id: rootFolderId,
      is_active: true,
    });

    return NextResponse.redirect(new URL("/settings/gdrive?success=true", request.url));
  } catch {
    return NextResponse.redirect(new URL("/settings/gdrive?error=auth_failed", request.url));
  }
}
