import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

interface VerifyAdminResult {
  authorized: boolean;
  adminClient: ReturnType<typeof createAdminClient> | null;
  userEmail: string | null;
}

export async function verifyAdmin(): Promise<VerifyAdminResult> {
  const adminEmail = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  if (!adminEmail) {
    return { authorized: false, adminClient: null, userEmail: null };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.email?.toLowerCase() !== adminEmail) {
    return { authorized: false, adminClient: null, userEmail: user?.email || null };
  }

  return {
    authorized: true,
    adminClient: createAdminClient(),
    userEmail: user.email,
  };
}

export async function logAdminAction(
  adminEmail: string,
  action: string,
  targetType: string,
  targetId?: string,
  details?: Record<string, unknown>
): Promise<void> {
  const adminClient = createAdminClient();
  await adminClient.from("admin_logs").insert({
    admin_email: adminEmail,
    action,
    target_type: targetType,
    target_id: targetId || null,
    details: details || null,
  });
}
