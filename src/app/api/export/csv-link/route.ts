import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateCSV } from "@/lib/export/csv";

export async function POST(request: NextRequest) {
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

  const { data: receipts } = await query;

  if (!receipts || receipts.length === 0) {
    return NextResponse.json({ error: "No receipts found for this month" }, { status: 404 });
  }

  // Generate CSV
  const csvRows = receipts.map((r) => ({
    ...r,
    category_name: (r.category as { name_he: string } | null)?.name_he || null,
  }));
  const csv = generateCSV(csvRows, year || new Date().getFullYear(), month || 1);
  const csvBuffer = Buffer.from(csv, "utf-8");

  // Upload to storage under {user_id}/exports/... (must start with user_id for RLS)
  const timestamp = Date.now();
  const suffix = all ? `all_${timestamp}` : `${year}_${String(month).padStart(2, "0")}_${timestamp}`;
  const fileName = `${user.id}/exports/${suffix}.csv`;

  const { error: uploadError } = await supabase.storage
    .from("receipts")
    .upload(fileName, csvBuffer, {
      contentType: "text/csv; charset=utf-8",
      upsert: true,
    });

  if (uploadError) {
    return NextResponse.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 });
  }

  // Create signed URL valid for 30 days
  const { data: signedData } = await supabase.storage
    .from("receipts")
    .createSignedUrl(fileName, 60 * 60 * 24 * 30);

  if (!signedData?.signedUrl) {
    return NextResponse.json({ error: "Failed to create download link" }, { status: 500 });
  }

  // Calculate totals
  const totalAmount = receipts.reduce((sum, r) => sum + (r.total_amount || 0), 0);
  const totalVat = receipts.reduce((sum, r) => sum + (r.vat_amount || 0), 0);

  return NextResponse.json({
    url: signedData.signedUrl,
    total_amount: Math.round(totalAmount * 100) / 100,
    total_vat: Math.round(totalVat * 100) / 100,
    receipt_count: receipts.length,
  });
}
