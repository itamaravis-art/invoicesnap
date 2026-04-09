import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const adminClient = createAdminClient();

  const { data: shareToken } = await adminClient
    .from("portal_share_tokens")
    .select("*")
    .eq("token", token)
    .eq("is_revoked", false)
    .gt("expires_at", new Date().toISOString())
    .single();

  if (!shareToken) return NextResponse.json({ error: "Invalid or expired link" }, { status: 403 });

  // Update access stats
  await adminClient
    .from("portal_share_tokens")
    .update({ last_accessed_at: new Date().toISOString(), access_count: shareToken.access_count + 1 })
    .eq("id", shareToken.id);

  const searchParams = request.nextUrl.searchParams;
  const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));
  const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1));
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDate = new Date(year, month, 0).toISOString().split("T")[0];

  // Get user info
  const { data: settings } = await adminClient
    .from("user_settings")
    .select("business_name, display_name")
    .eq("user_id", shareToken.user_id)
    .single();

  // Get receipts
  const { data: receipts } = await adminClient
    .from("receipts")
    .select("id, vendor_name, receipt_date, total_amount, vat_amount, amount_before_vat, receipt_number, payment_method, receipt_type, category_id, allocation_number")
    .eq("user_id", shareToken.user_id)
    .eq("is_archived", false)
    .gte("receipt_date", startDate)
    .lte("receipt_date", endDate)
    .order("receipt_date", { ascending: false });

  return NextResponse.json({
    business_name: settings?.business_name || settings?.display_name || "\u05E2\u05E1\u05E7",
    receipts: receipts || [],
    year,
    month,
  });
}
