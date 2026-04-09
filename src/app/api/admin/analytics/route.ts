import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin";

export async function GET() {
  const { authorized, adminClient } = await verifyAdmin();
  if (!authorized || !adminClient) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: receipts } = await adminClient
    .from("receipts")
    .select("vendor_name, total_amount, ocr_status, ocr_confidence, gdrive_synced, category:categories(name_he)")
    .eq("is_archived", false);

  const { count: userCount } = await adminClient.from("user_settings").select("user_id", { count: "exact", head: true });

  const vendorMap = new Map<string, { count: number; amount: number }>();
  const categoryMap = new Map<string, { count: number; amount: number }>();
  let totalConfidence = 0, confidenceCount = 0, driveCount = 0;

  for (const r of receipts || []) {
    if (r.vendor_name) {
      const v = vendorMap.get(r.vendor_name) || { count: 0, amount: 0 };
      v.count++; v.amount += r.total_amount || 0;
      vendorMap.set(r.vendor_name, v);
    }
    const cat = (r.category as { name_he?: string } | null)?.name_he;
    if (cat) {
      const c = categoryMap.get(cat) || { count: 0, amount: 0 };
      c.count++; c.amount += r.total_amount || 0;
      categoryMap.set(cat, c);
    }
    if (r.ocr_confidence) { totalConfidence += r.ocr_confidence; confidenceCount++; }
    if (r.gdrive_synced) driveCount++;
  }

  return NextResponse.json({
    topVendors: Array.from(vendorMap.entries()).sort((a, b) => b[1].amount - a[1].amount).slice(0, 10).map(([name, d]) => ({ name, ...d })),
    topCategories: Array.from(categoryMap.entries()).sort((a, b) => b[1].amount - a[1].amount).slice(0, 10).map(([name, d]) => ({ name, ...d })),
    avgReceiptsPerUser: userCount ? Math.round((receipts?.length || 0) / userCount) : 0,
    avgAmountPerReceipt: receipts?.length ? Math.round((receipts || []).reduce((s, r) => s + (r.total_amount || 0), 0) / receipts.length) : 0,
    avgOcrConfidence: confidenceCount ? Math.round((totalConfidence / confidenceCount) * 100) : 0,
    driveUsageRate: receipts?.length ? Math.round((driveCount / receipts.length) * 100) : 0,
  });
}
