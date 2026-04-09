import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin";

export async function GET() {
  const { authorized, adminClient } = await verifyAdmin();
  if (!authorized || !adminClient) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { count: userCount } = await adminClient.from("user_settings").select("user_id", { count: "exact", head: true });
  const { count: receiptCount } = await adminClient.from("receipts").select("id", { count: "exact", head: true }).eq("is_archived", false);
  const { count: todayReceipts } = await adminClient.from("receipts").select("id", { count: "exact", head: true }).gte("created_at", new Date(new Date().setHours(0,0,0,0)).toISOString());
  const { count: ocrCompleted } = await adminClient.from("receipts").select("id", { count: "exact", head: true }).eq("ocr_status", "completed");
  const { count: ocrFailed } = await adminClient.from("receipts").select("id", { count: "exact", head: true }).eq("ocr_status", "failed");
  const { count: pendingOcr } = await adminClient.from("receipts").select("id", { count: "exact", head: true }).in("ocr_status", ["pending", "processing"]);

  const { data: amounts } = await adminClient.from("receipts").select("total_amount").eq("is_archived", false);
  const totalAmount = (amounts || []).reduce((s, r) => s + (r.total_amount || 0), 0);
  const ocrRate = receiptCount ? Math.round(((ocrCompleted || 0) / receiptCount) * 100) : 0;

  return NextResponse.json({
    users: userCount || 0,
    receipts: receiptCount || 0,
    todayReceipts: todayReceipts || 0,
    totalAmount,
    ocrRate,
    ocrFailed: ocrFailed || 0,
    pendingOcr: pendingOcr || 0,
  });
}
