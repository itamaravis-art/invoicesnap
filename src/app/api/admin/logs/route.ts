import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin";

export async function GET(request: NextRequest) {
  const { authorized, adminClient } = await verifyAdmin();
  if (!authorized || !adminClient) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "100"), 500);

  const { data, error } = await adminClient
    .from("admin_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}
