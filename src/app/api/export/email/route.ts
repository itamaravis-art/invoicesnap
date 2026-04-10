import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateCSV } from "@/lib/export/csv";
import { sendReportEmail } from "@/lib/export/email";

export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { year, month, accountant_id, all } = body;

    if (!accountant_id) {
      return NextResponse.json({ error: "Missing accountant_id" }, { status: 400 });
    }

    // Get accountant email
    const { data: accountant } = await supabase
      .from("accountant_contacts")
      .select("email, name")
      .eq("id", accountant_id)
      .eq("user_id", user.id)
      .single();

    if (!accountant?.email) {
      return NextResponse.json({ error: "לרואה החשבון אין כתובת אימייל" }, { status: 404 });
    }

    // Get user settings for business name
    const { data: settings } = await supabase
      .from("user_settings")
      .select("business_name, display_name")
      .eq("user_id", user.id)
      .maybeSingle();

    const businessName = settings?.business_name || settings?.display_name || "עסק";

    // Build receipts query
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
      return NextResponse.json({ error: "לא נמצאו קבלות לתקופה זו" }, { status: 404 });
    }

    // Generate CSV
    const csvRows = receipts.map((r) => ({
      ...r,
      category_name: (r.category as { name_he: string } | null)?.name_he || null,
    }));
    const csv = generateCSV(csvRows, year || new Date().getFullYear(), month || 1);
    const csvBuffer = Buffer.from(csv, "utf-8");

    // Calculate totals
    const totalAmount = receipts.reduce((sum, r) => sum + (r.total_amount || 0), 0);
    const totalVat = receipts.reduce((sum, r) => sum + (r.vat_amount || 0), 0);

    // Send email via Resend (centralized - one API key for all users)
    // First attempt: send directly to accountant
    let result = await sendReportEmail({
      to: accountant.email,
      fromName: businessName,
      replyTo: user.email || "",
      businessName,
      year: year || new Date().getFullYear(),
      month: month || new Date().getMonth() + 1,
      totalAmount,
      totalVat,
      receiptCount: receipts.length,
      csvBuffer,
      all,
      accountantName: accountant.name,
      accountantEmail: accountant.email,
    });

    let sentViaForwarding = false;

    // Detect Resend sandbox mode (unverified domain) - can only send to account owner
    // When this happens, send to user's own email instead with forward instructions
    const isSandboxError = result.error && (
      result.error.includes("testing emails") ||
      result.error.includes("only send") ||
      result.error.includes("verify a domain") ||
      result.error.includes("You can only send")
    );

    if (!result.success && isSandboxError && user.email) {
      // Fall back: send to user's own email with "forward to accountant" header
      result = await sendReportEmail({
        to: user.email,
        fromName: businessName,
        replyTo: user.email,
        businessName,
        year: year || new Date().getFullYear(),
        month: month || new Date().getMonth() + 1,
        totalAmount,
        totalVat,
        receiptCount: receipts.length,
        csvBuffer,
        all,
        accountantName: accountant.name,
        accountantEmail: accountant.email,
        isForwardMode: true,
      });
      sentViaForwarding = result.success;
    }

    if (!result.success) {
      return NextResponse.json({
        error: result.error || "שליחת המייל נכשלה",
        details: result.error,
      }, { status: 500 });
    }

    // Update monthly report status
    if (!all && year && month && !sentViaForwarding) {
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
    }

    return NextResponse.json({
      success: true,
      sent_to: sentViaForwarding ? user.email : accountant.email,
      forward_to: sentViaForwarding ? accountant.email : null,
      reply_to: user.email,
      receipt_count: receipts.length,
      forwarding_mode: sentViaForwarding,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Server error: ${msg}` }, { status: 500 });
  }
}
