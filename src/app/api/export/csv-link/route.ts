import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateCSV } from "@/lib/export/csv";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { year, month, all } = body;

    // Build query - either filter by month or get all receipts
    let query = supabase
      .from("receipts")
      .select("*, category:categories(name_he)")
      .eq("user_id", user.id)
      .eq("is_archived", false)
      .order("receipt_date", { ascending: false });

    if (!all) {
      if (!year || !month) {
        return NextResponse.json({ error: "Missing year or month" }, { status: 400 });
      }
      const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
      const endDate = new Date(year, month, 0).toISOString().split("T")[0];
      query = query.gte("receipt_date", startDate).lte("receipt_date", endDate);
    }

    const { data: receipts, error: queryError } = await query;

    if (queryError) {
      return NextResponse.json({ error: `Database error: ${queryError.message}` }, { status: 500 });
    }

    if (!receipts || receipts.length === 0) {
      return NextResponse.json({ error: "לא נמצאו קבלות לתקופה זו" }, { status: 404 });
    }

    // Generate CSV
    const csvRows = receipts.map((r) => ({
      ...r,
      category_name: (r.category as { name_he: string } | null)?.name_he || null,
    }));
    const csv = generateCSV(csvRows, year || new Date().getFullYear(), month || 1);

    // Calculate totals
    const totalAmount = receipts.reduce((sum, r) => sum + (r.total_amount || 0), 0);
    const totalVat = receipts.reduce((sum, r) => sum + (r.vat_amount || 0), 0);

    // Return CSV content directly (no storage upload - client will handle download)
    return NextResponse.json({
      csv,
      total_amount: Math.round(totalAmount * 100) / 100,
      total_vat: Math.round(totalVat * 100) / 100,
      receipt_count: receipts.length,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Server error: ${msg}` }, { status: 500 });
  }
}
