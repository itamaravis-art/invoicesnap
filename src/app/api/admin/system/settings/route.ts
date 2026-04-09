import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin, logAdminAction } from "@/lib/admin";

export async function GET() {
  const { authorized, adminClient } = await verifyAdmin();
  if (!authorized || !adminClient) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data } = await adminClient.from("system_settings").select("*").order("key");
  return NextResponse.json(data || []);
}

export async function PATCH(request: NextRequest) {
  const { authorized, adminClient, userEmail } = await verifyAdmin();
  if (!authorized || !adminClient) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const { key, value } = body;

  if (!key) return NextResponse.json({ error: "Key required" }, { status: 400 });

  const { error } = await adminClient
    .from("system_settings")
    .upsert({ key, value, updated_at: new Date().toISOString(), updated_by: userEmail });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAdminAction(userEmail!, "update_setting", "system_settings", key, { value });
  return NextResponse.json({ success: true });
}
