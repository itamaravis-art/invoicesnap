import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period"); // YYYY-MM format
  const now = new Date();
  const year = period ? parseInt(period.split("-")[0]) : now.getFullYear();
  const month = period ? parseInt(period.split("-")[1]) : now.getMonth() + 1;

  // Current month report
  const { data: report } = await supabase
    .from("monthly_reports")
    .select("*")
    .eq("user_id", user.id)
    .eq("year", year)
    .eq("month", month)
    .maybeSingle();

  // Last 12 months trend
  const { data: trend } = await supabase
    .from("monthly_reports")
    .select("year, month, total_amount")
    .eq("user_id", user.id)
    .order("year", { ascending: false })
    .order("month", { ascending: false })
    .limit(12);

  // Top categories for current month
  const { data: receipts } = await supabase
    .from("receipts")
    .select("total_amount, category:categories(id, name_he, color, icon)")
    .eq("user_id", user.id)
    .eq("is_archived", false)
    .gte("receipt_date", `${year}-${String(month).padStart(2, "0")}-01`)
    .lte("receipt_date", `${year}-${String(month).padStart(2, "0")}-31`);

  // Aggregate by category
  const categoryMap = new Map<string, { name_he: string; color: string; icon: string; amount: number; count: number }>();
  for (const r of receipts || []) {
    const cat = r.category as unknown as { id: string; name_he: string; color: string; icon: string } | null;
    if (cat && r.total_amount) {
      const key = cat.id;
      const existing = categoryMap.get(key);
      if (existing) {
        existing.amount += r.total_amount;
        existing.count += 1;
      } else {
        categoryMap.set(key, {
          name_he: cat.name_he,
          color: cat.color,
          icon: cat.icon,
          amount: r.total_amount,
          count: 1,
        });
      }
    }
  }
  const topCategories = Array.from(categoryMap.entries())
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  // User budget
  const { data: settings } = await supabase
    .from("user_settings")
    .select("monthly_budget")
    .eq("user_id", user.id)
    .single();

  return NextResponse.json({
    totalSpend: report?.total_amount || 0,
    totalVat: report?.total_vat || 0,
    receiptCount: report?.receipt_count || 0,
    topCategories,
    trend: (trend || []).reverse().map((t) => ({
      month: `${t.year}-${String(t.month).padStart(2, "0")}`,
      amount: t.total_amount,
    })),
    budgetUsed: report?.total_amount || 0,
    monthlyBudget: settings?.monthly_budget || null,
  });
}
