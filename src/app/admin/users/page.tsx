import { verifyAdmin } from "@/lib/admin";
import { redirect } from "next/navigation";
import { UsersTable } from "@/components/admin/UsersTable";

export default async function AdminUsersPage() {
  const { authorized, adminClient } = await verifyAdmin();
  if (!authorized || !adminClient) redirect("/dashboard");

  // Get all users via auth admin API
  const { data: { users: authUsers } } = await adminClient.auth.admin.listUsers({ perPage: 100 });

  // Get user settings for all users
  const { data: allSettings } = await adminClient
    .from("user_settings")
    .select("*");

  // Get receipt counts and amounts per user
  const { data: receiptStats } = await adminClient
    .from("receipts")
    .select("user_id, total_amount")
    .eq("is_archived", false);

  // Aggregate receipt stats
  const userStats = new Map<string, { count: number; amount: number }>();
  for (const r of receiptStats || []) {
    const existing = userStats.get(r.user_id) || { count: 0, amount: 0 };
    existing.count += 1;
    existing.amount += r.total_amount || 0;
    userStats.set(r.user_id, existing);
  }

  // Build user rows
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-900">משתמשים</h1>
          <p className="text-slate-500 mt-1">{users.length} משתמשים רשומים</p>
        </div>
      </div>
      <UsersTable users={users} />
    </div>
  );
}
