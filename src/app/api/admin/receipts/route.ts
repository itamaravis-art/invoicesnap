import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin";

export async function GET(request: NextRequest) {
  const { authorized, adminClient } = await verifyAdmin();
  if (!authorized || !adminClient) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
  const status = searchParams.get("status");
  const offset = (page - 1) * limit;

  let query = adminClient
    .from("receipts")
    .select("*, category:categories(name_he)", { count: "exact" })
    .eq("is_archived", false)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) query = query.eq("ocr_status", status);

  const { data, count, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ receipts: data || [], total: count || 0, page, limit });
}
