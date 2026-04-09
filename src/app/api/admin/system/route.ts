import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin";

export async function GET() {
  const { authorized, adminClient } = await verifyAdmin();
  if (!authorized || !adminClient) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { count: totalReceipts } = await adminClient.from("receipts").select("id", { count: "exact", head: true });
  const { count: pendingOcr } = await adminClient.from("receipts").select("id", { count: "exact", head: true }).in("ocr_status", ["pending", "processing"]);
  const { count: failedOcr } = await adminClient.from("receipts").select("id", { count: "exact", head: true }).eq("ocr_status", "failed");
  const { count: unsyncedDrive } = await adminClient.from("receipts").select("id", { count: "exact", head: true }).eq("gdrive_synced", false).eq("is_archived", false);
  const { count: driveErrors } = await adminClient.from("gdrive_connections").select("id", { count: "exact", head: true }).not("last_sync_error", "is", null);
  const { count: totalUsers } = await adminClient.from("user_settings").select("user_id", { count: "exact", head: true });
  const { data: sysSettings } = await adminClient.from("system_settings").select("*");

  return NextResponse.json({
    totalReceipts: totalReceipts || 0,
    totalUsers: totalUsers || 0,
    pendingOcr: pendingOcr || 0,
    failedOcr: failedOcr || 0,
    unsyncedDrive: unsyncedDrive || 0,
    driveErrors: driveErrors || 0,
    settings: sysSettings || [],
  });
}
