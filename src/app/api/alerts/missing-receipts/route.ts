import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const startDate = `${currentYear}-${String(currentMonth).padStart(2, "0")}-01`;
  const endDate = new Date(currentYear, currentMonth, 0).toISOString().split("T")[0];

  // Get recurring expenses
  const { data: recurring } = await supabase
    .from("recurring_expenses")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_active", true);

  // Get this month's receipts
  const { data: receipts } = await supabase
    .from("receipts")
    .select("vendor_name, vendor_id, total_amount")
    .eq("user_id", user.id)
    .eq("is_archived", false)
    .gte("receipt_date", startDate)
    .lte("receipt_date", endDate);

  const monthReceipts = receipts || [];
  const alerts: Array<{ vendor_name: string; expected_amount: number | null; frequency: string }> = [];

  for (const rec of recurring || []) {
    if (rec.frequency === "monthly") {
      const found = monthReceipts.some(r =>
        (r.vendor_id && r.vendor_id === rec.vendor_id) ||
        (r.vendor_name && rec.vendor_name && r.vendor_name.toLowerCase().includes(rec.vendor_name.toLowerCase()))
      );
      if (!found) {
        alerts.push({
          vendor_name: rec.vendor_name,
          expected_amount: rec.expected_amount,
          frequency: rec.frequency,
        });
      }
    }
  }

  // Auto-detect recurring: vendors seen 3+ times in past 3 months
  const threeMonthsAgo = new Date(currentYear, currentMonth - 4, 1).toISOString().split("T")[0];
  const { data: frequentVendors } = await supabase
    .from("receipts")
    .select("vendor_name, vendor_id")
    .eq("user_id", user.id)
    .eq("is_archived", false)
    .gte("receipt_date", threeMonthsAgo)
    .lt("receipt_date", startDate);

  // Count vendors
  const vendorCounts = new Map<string, number>();
  for (const r of frequentVendors || []) {
    const key = r.vendor_name?.toLowerCase() || "";
    if (key) vendorCounts.set(key, (vendorCounts.get(key) || 0) + 1);
  }

  // Vendors seen 3+ times but not this month
  for (const [name, count] of vendorCounts) {
    if (count >= 3) {
      const foundThisMonth = monthReceipts.some(r =>
        r.vendor_name?.toLowerCase().includes(name)
      );
      const alreadyAlerted = alerts.some(a => a.vendor_name.toLowerCase() === name);
      if (!foundThisMonth && !alreadyAlerted) {
        alerts.push({ vendor_name: name, expected_amount: null, frequency: "auto-detected" });
      }
    }
  }

  return NextResponse.json({ alerts, month: currentMonth, year: currentYear });
}
