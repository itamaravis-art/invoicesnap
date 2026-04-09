import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin";

export async function GET() {
  const { authorized, adminClient } = await verifyAdmin();
  if (!authorized || !adminClient) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: { users: authUsers } } = await adminClient.auth.admin.listUsers({ perPage: 100 });
  const { data: allSettings } = await adminClient.from("user_settings").select("*");
  const { data: receiptStats } = await adminClient.from("receipts").select("user_id, total_amount").eq("is_archived", false);

  const userStats = new Map<string, { count: number; amount: number }>();
  for (const r of receiptStats || []) {
    const existing = userStats.get(r.user_id) || { count: 0, amount: 0 };
    existing.count += 1;
    existing.amount += r.total_amount || 0;
    userStats.set(r.user_id, existing);
  }

  const settingsMap = new Map((allSettings || []).map((s) => [s.user_id, s]));
  const users = (authUsers || []).map((u) => {
    const settings = settingsMap.get(u.id);
    const stats = userStats.get(u.id) || { count: 0, amount: 0 };
    return {
      id: u.id,
      email: u.email || "",
      display_name: settings?.display_name || u.user_metadata?.full_name || null,
      business_name: settings?.business_name || null,
      receipt_count: stats.count,
      total_amount: stats.amount,
      onboarding_completed: settings?.onboarding_completed || false,
      created_at: u.created_at,
    };
  });

  return NextResponse.json(users);
}
