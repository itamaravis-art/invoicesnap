import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: connection } = await supabase
    .from("gdrive_connections")
    .select("google_email, is_active, last_sync_at, last_sync_error")
    .eq("user_id", user.id)
    .maybeSingle();

  const { count: unsyncedCount } = await supabase
    .from("receipts")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("gdrive_synced", false)
    .eq("is_archived", false);

  return NextResponse.json({
    connected: !!connection?.is_active,
    email: connection?.google_email || null,
    lastSync: connection?.last_sync_at || null,
    lastError: connection?.last_sync_error || null,
    unsyncedCount: unsyncedCount || 0,
  });
}
