import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin, logAdminAction } from "@/lib/admin";
import { processReceiptImage } from "@/lib/ocr/process";
import { OCR_MIN_CONFIDENCE } from "@/lib/constants";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { authorized, adminClient, userEmail } = await verifyAdmin();
  if (!authorized || !adminClient) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: receipt } = await adminClient.from("receipts").select("id, image_storage_path").eq("id", id).single();
  if (!receipt) return NextResponse.json({ error: "Receipt not found" }, { status: 404 });

  await adminClient.from("receipts").update({ ocr_status: "processing" }).eq("id", id);

  try {
    const { data: fileData } = await adminClient.storage.from("receipts").download(receipt.image_storage_path);
    if (!fileData) throw new Error("Failed to download");

    const buffer = Buffer.from(await fileData.arrayBuffer());
    const ocrResult = await processReceiptImage(buffer, fileData.type || "image/jpeg");

    await adminClient.from("receipts").update({
      vendor_name: ocrResult.vendor_name,
      receipt_date: ocrResult.receipt_date,
      total_amount: ocrResult.total_amount,
      vat_amount: ocrResult.vat_amount,
      amount_before_vat: ocrResult.amount_before_vat,
      receipt_number: ocrResult.receipt_number,
      payment_method: ocrResult.payment_method,
      receipt_type: ocrResult.receipt_type,
      ocr_status: ocrResult.confidence > OCR_MIN_CONFIDENCE ? "completed" : "failed",
      ocr_confidence: ocrResult.confidence,
      ocr_raw_response: ocrResult as unknown as Record<string, unknown>,
    }).eq("id", id);

    await logAdminAction(userEmail!, "reprocess_ocr", "receipt", id);
    return NextResponse.json({ success: true, result: ocrResult });
  } catch (error) {
    await adminClient.from("receipts").update({ ocr_status: "failed" }).eq("id", id);
    return NextResponse.json({ error: "OCR reprocess failed" }, { status: 500 });
  }
}
