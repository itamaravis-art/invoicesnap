import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin, logAdminAction } from "@/lib/admin";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { authorized, adminClient } = await verifyAdmin();
  if (!authorized || !adminClient) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: { user }, error } = await adminClient.auth.admin.getUserById(id);
  if (error || !user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { data: settings } = await adminClient.from("user_settings").select("*").eq("user_id", id).maybeSingle();
  const { data: receipts } = await adminClient.from("receipts").select("*").eq("user_id", id).eq("is_archived", false).order("created_at", { ascending: false }).limit(20);
  const { data: accountants } = await adminClient.from("accountant_contacts").select("*").eq("user_id", id);
  const { data: drive } = await adminClient.from("gdrive_connections").select("google_email, is_active, last_sync_at").eq("user_id", id).maybeSingle();

  return NextResponse.json({ user, settings, receipts, accountants, drive });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { authorized, adminClient, userEmail } = await verifyAdmin();
  if (!authorized || !adminClient) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const allowedFields = ["display_name", "business_name", "business_id", "vat_rate", "monthly_budget"];
  const updateData: Record<string, unknown> = {};
  for (const f of allowedFields) { if (f in body) updateData[f] = body[f]; }
  const { data, error } = await adminClient.from("user_settings").update(updateData).eq("user_id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAdminAction(userEmail!, "update_user", "user", id, body);
  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { authorized, adminClient, userEmail } = await verifyAdmin();
  if (!authorized || !adminClient) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { error } = await adminClient.auth.admin.deleteUser(id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAdminAction(userEmail!, "delete_user", "user", id);
  return NextResponse.json({ success: true });
}
