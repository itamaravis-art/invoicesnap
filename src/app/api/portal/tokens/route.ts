import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generatePortalToken } from "@/lib/portal/token";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: tokens } = await supabase
    .from("portal_share_tokens")
    .select("*, accountant:accountant_contacts(name, email)")
    .eq("user_id", user.id)
    .eq("is_revoked", false)
    .order("created_at", { ascending: false });

  return NextResponse.json({ tokens: tokens || [] });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { accountant_id, days = 30 } = body;

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + Math.min(days, 365));

  const { data: token, error } = await supabase
    .from("portal_share_tokens")
    .insert({
      user_id: user.id,
      accountant_id: accountant_id || null,
      token: generatePortalToken(),
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: "Failed to create token" }, { status: 500 });
  return NextResponse.json({ token }, { status: 201 });
}
