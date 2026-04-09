import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { syncReceiptToDrive } from "@/lib/gdrive/sync";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Get all unsynced receipts
  const { data: receipts } = await supabase
    .from("receipts")
    .select("id")
    .eq("user_id", user.id)
    .eq("gdrive_synced", false)
    .eq("is_archived", false)
    .limit(50);

  if (!receipts || receipts.length === 0) {
    return NextResponse.json({ synced: 0, total: 0 });
  }

  let synced = 0;
  for (const receipt of receipts) {
    const success = await syncReceiptToDrive(user.id, receipt.id);
    if (success) synced++;
    else break; // Stop on first failure
  }

  return NextResponse.json({ synced, total: receipts.length });
}
