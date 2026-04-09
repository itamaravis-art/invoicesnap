import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const searchParams = request.nextUrl.searchParams;
  const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));

  const periods = [];
  for (let p = 1; p <= 6; p++) {
    const m1 = p * 2 - 1;
    const m2 = p * 2;
    const startDate = `${year}-${String(m1).padStart(2, "0")}-01`;
    const endDate = new Date(year, m2, 0).toISOString().split("T")[0];

    const { data: receipts } = await supabase
      .from("receipts")
      .select("total_amount, vat_amount, is_vat_reclaimable")
      .eq("user_id", user.id)
      .eq("is_archived", false)
      .gte("receipt_date", startDate)
      .lte("receipt_date", endDate);

    const items = receipts || [];
    const totalAmount = items.reduce((s, r) => s + (r.total_amount || 0), 0);
    const totalVat = items.reduce((s, r) => s + (r.vat_amount || 0), 0);
    const reclaimableVat = items
      .filter(r => r.is_vat_reclaimable !== false)
      .reduce((s, r) => s + (r.vat_amount || 0), 0);

    periods.push({
      period: p,
      year,
      total_amount: Math.round(totalAmount * 100) / 100,
      total_vat: Math.round(totalVat * 100) / 100,
      reclaimable_vat: Math.round(reclaimableVat * 100) / 100,
      receipt_count: items.length,
    });
  }

  return NextResponse.json({ periods });
}
