import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateCSV } from "@/lib/export/csv";
import { decrypt } from "@/lib/gdrive/crypto";
import { refreshAccessToken } from "@/lib/gdrive/auth";
import { getHebrewMonthName } from "@/lib/utils";

export const maxDuration = 30;

function base64url(input: string | Buffer): string {
  const buf = typeof input === "string" ? Buffer.from(input, "utf-8") : input;
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function buildMimeMessage(params: {
  from: string;
  to: string;
  subject: string;
  bodyText: string;
  csv: string;
  csvFilename: string;
}): string {
  const boundary = `====InvoiceSnap_${Date.now()}====`;
  // UTF-8 BOM + CSV content for Excel Hebrew
  const csvBase64 = Buffer.from(params.csv, "utf-8").toString("base64");
  const subjectEncoded = `=?UTF-8?B?${Buffer.from(params.subject, "utf-8").toString("base64")}?=`;

  return [
    `From: ${params.from}`,
    `To: ${params.to}`,
    `Subject: ${subjectEncoded}`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    ``,
    `--${boundary}`,
    `Content-Type: text/plain; charset=UTF-8`,
    `Content-Transfer-Encoding: base64`,
    ``,
    Buffer.from(params.bodyText, "utf-8").toString("base64"),
    ``,
    `--${boundary}`,
    `Content-Type: text/csv; charset=UTF-8; name="${params.csvFilename}"`,
    `Content-Disposition: attachment; filename="${params.csvFilename}"`,
    `Content-Transfer-Encoding: base64`,
    ``,
    csvBase64,
    ``,
    `--${boundary}--`,
  ].join("\r\n");
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { year, month, all, accountant_id } = body;

    if (!accountant_id) {
      return NextResponse.json({ error: "Missing accountant_id" }, { status: 400 });
    }

    // Get accountant
    const { data: accountant } = await supabase
      .from("accountant_contacts")
      .select("email, name")
      .eq("id", accountant_id)
      .eq("user_id", user.id)
      .single();

    if (!accountant?.email) {
      return NextResponse.json({ error: "לרואה החשבון אין כתובת אימייל" }, { status: 404 });
    }

    // Get Google connection
    const { data: connection } = await supabase
      .from("gdrive_connections")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .maybeSingle();

    if (!connection) {
      return NextResponse.json({
        error: "צריך לחבר את חשבון Google כדי לשלוח דרך Gmail",
        needs_connect: true,
      }, { status: 403 });
    }

    // Decrypt and refresh access token
    const refreshToken = decrypt(connection.refresh_token_encrypted);
    const { access_token } = await refreshAccessToken(refreshToken);

    // Fetch receipts
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

    // Calculate totals
    const totalAmount = receipts.reduce((sum, r) => sum + (r.total_amount || 0), 0);
    const totalVat = receipts.reduce((sum, r) => sum + (r.vat_amount || 0), 0);
    const formatNis = (n: number) =>
      new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS" }).format(n);

    const periodLabel = all ? "כל הקבלות" : `${getHebrewMonthName(month)} ${year}`;
    const subject = `דוח קבלות ${periodLabel}`;
    const bodyText = [
      `שלום ${accountant.name},`,
      ``,
      `מצורף דוח ${periodLabel}:`,
      ``,
      `סה״כ הוצאות: ${formatNis(totalAmount)}`,
      `מע״מ לניכוי: ${formatNis(totalVat)}`,
      `מספר קבלות: ${receipts.length}`,
      ``,
      `קובץ ה-CSV מצורף להודעה זו ויכול להיפתח ישירות באקסל.`,
      ``,
      `תודה!`,
      ``,
      `נשלח אוטומטית מ-InvoiceSnap`,
    ].join("\n");

    const csvFilename = all
      ? `invoicesnap_all_receipts.csv`
      : `invoicesnap_${year}_${String(month).padStart(2, "0")}.csv`;

    // Build MIME message
    const mime = buildMimeMessage({
      from: connection.google_email,
      to: accountant.email,
      subject,
      bodyText,
      csv,
      csvFilename,
    });

    // Send via Gmail API
    const raw = base64url(mime);
    const gmailRes = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ raw }),
    });

    if (!gmailRes.ok) {
      const errText = await gmailRes.text();
      if (gmailRes.status === 403 && errText.includes("insufficient")) {
        return NextResponse.json({
          error: "חסרה הרשאה ל-Gmail. אנא חבר מחדש את Google בהגדרות.",
          needs_reconnect: true,
        }, { status: 403 });
      }
      return NextResponse.json({
        error: `Gmail error: ${errText.slice(0, 200)}`,
      }, { status: 500 });
    }

    // Update monthly report status (if applicable)
    if (!all && year && month) {
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
      sent_to: accountant.email,
      from: connection.google_email,
      receipt_count: receipts.length,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Server error: ${msg}` }, { status: 500 });
  }
}
