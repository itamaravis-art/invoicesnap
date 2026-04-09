import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getHebrewMonthName } from "@/lib/utils";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { year, month, accountant_id } = body;

  if (!year || !month) {
    return NextResponse.json({ error: "Missing year or month" }, { status: 400 });
  }

  // Get report data
  const { data: report } = await supabase
    .from("monthly_reports")
    .select("*")
    .eq("user_id", user.id)
    .eq("year", year)
    .eq("month", month)
    .maybeSingle();

  // Get accountant phone
  let phone = "";
  if (accountant_id) {
    const { data: accountant } = await supabase
      .from("accountant_contacts")
      .select("phone, name")
      .eq("id", accountant_id)
      .eq("user_id", user.id)
      .single();
    phone = accountant?.phone || "";
  }

  // Get user business name
  const { data: settings } = await supabase
    .from("user_settings")
    .select("business_name")
    .eq("user_id", user.id)
    .single();

  const monthName = getHebrewMonthName(month);
  const totalFormatted = new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS" }).format(report?.total_amount || 0);
  const vatFormatted = new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS" }).format(report?.total_vat || 0);

  const message = `שלום,
מצורפות קבלות לחודש ${monthName} ${year}.
${settings?.business_name ? `עסק: ${settings.business_name}` : ""}
סה"כ הוצאות: ${totalFormatted}
סה"כ מע"מ: ${vatFormatted}
מספר קבלות: ${report?.receipt_count || 0}`;

  const cleanPhone = phone.replace(/[^0-9]/g, "");
  const whatsappUrl = cleanPhone
    ? `https://wa.me/${cleanPhone.startsWith("0") ? "972" + cleanPhone.slice(1) : cleanPhone}?text=${encodeURIComponent(message)}`
    : `https://wa.me/?text=${encodeURIComponent(message)}`;

  return NextResponse.json({ share_url: whatsappUrl, message_text: message });
}
