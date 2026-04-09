import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateCSV } from "@/lib/export/csv";
import { sendReportEmail } from "@/lib/export/email";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { year, month, accountant_id } = body;

  if (!year || !month || !accountant_id) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Get accountant email
  const { data: accountant } = await supabase
    .from("accountant_contacts")
    .select("email, name")
    .eq("id", accountant_id)
    .eq("user_id", user.id)
    .single();

  if (!accountant?.email) {
    return NextResponse.json({ error: "Accountant email not found" }, { status: 404 });
  }

  // Get user settings
  const { data: settings } = await supabase
    .from("user_settings")
    .select("business_name")
    .eq("user_id", user.id)
    .maybeSingle();

  // Get receipts for the month
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDate = `${year}-${String(month).padStart(2, "0")}-31`;

  const { data: receipts } = await supabase
    .from("receipts")
    .select("*, category:categories(name_he)")
    .eq("user_id", user.id)
    .eq("is_archived", false)
    .gte("receipt_date", startDate)
    .lte("receipt_date", endDate)
    .order("receipt_date");

  if (!receipts || receipts.length === 0) {
    return NextResponse.json({ error: "No receipts found for this month" }, { status: 404 });
  }

  // Generate CSV
  const csvRows = receipts.map((r) => ({
    ...r,
    category_name: (r.category as { name_he: string } | null)?.name_he || null,
  }));
  const csv = generateCSV(csvRows, year, month);
  const csvBuffer = Buffer.from(csv, "utf-8");

  // Calculate totals
  const totalAmount = receipts.reduce((sum, r) => sum + (r.total_amount || 0), 0);
  const totalVat = receipts.reduce((sum, r) => sum + (r.vat_amount || 0), 0);

  // Send email
  const sent = await sendReportEmail({
    to: accountant.email,
    businessName: settings?.business_name || "\u05E2\u05E1\u05E7",
    year,
    month,
    totalAmount,
    totalVat,
    receiptCount: receipts.length,
    csvBuffer,
  });

  if (!sent) {
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }

  // Update monthly report
  await supabase
    .from("monthly_reports")
    .update({
      sent_to_accountant_at: new Date().toISOString(),
      sent_method: "email",
      status: "sent",
    })
    .eq("user_id", user.id)
    .eq("year", year)
    .eq("month", month);

  return NextResponse.json({ success: true });
}
