import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { processReceiptImage } from "@/lib/ocr/process";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { receipt_id, image_path } = body;

  if (!receipt_id || !image_path) {
    return NextResponse.json({ error: "Missing receipt_id or image_path" }, { status: 400 });
  }

  // Verify receipt belongs to user
  const { data: receipt } = await supabase
    .from("receipts")
    .select("id")
    .eq("id", receipt_id)
    .eq("user_id", user.id)
    .single();

  if (!receipt) {
    return NextResponse.json({ error: "Receipt not found" }, { status: 404 });
  }

  try {
    // Update status to processing
    await supabase
      .from("receipts")
      .update({ ocr_status: "processing" })
      .eq("id", receipt_id);

    // Download image from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("receipts")
      .download(image_path);

    if (downloadError || !fileData) {
      throw new Error("Failed to download image");
    }

    const buffer = Buffer.from(await fileData.arrayBuffer());
    const mimeType = fileData.type || "image/jpeg";

    // Process with Gemini Vision
    const ocrResult = await processReceiptImage(buffer, mimeType);

    // Try to match/create vendor
    let vendorId: string | null = null;
    let categoryId: string | null = null;

    if (ocrResult.vendor_name) {
      const normalized = ocrResult.vendor_name.toLowerCase().trim();

      // Try exact match first
      const { data: existingVendor } = await supabase
        .from("vendors")
        .select("id, default_category_id")
        .eq("user_id", user.id)
        .eq("name_normalized", normalized)
        .maybeSingle();

      if (existingVendor) {
        vendorId = existingVendor.id;
        categoryId = existingVendor.default_category_id;
        // Increment count
        await supabase
          .from("vendors")
          .update({
            occurrence_count: (existingVendor as Record<string, unknown>).occurrence_count as number + 1 || 1,
            last_seen_at: new Date().toISOString(),
          })
          .eq("id", existingVendor.id);
      } else {
        // Create new vendor
        const { data: newVendor } = await supabase
          .from("vendors")
          .insert({
            user_id: user.id,
            name: ocrResult.vendor_name,
            name_normalized: normalized,
          })
          .select("id")
          .single();
        if (newVendor) vendorId = newVendor.id;
      }
    }

    // Update receipt with OCR results
    const updateData = {
      vendor_name: ocrResult.vendor_name,
      vendor_id: vendorId,
      receipt_date: ocrResult.receipt_date,
      total_amount: ocrResult.total_amount,
      vat_amount: ocrResult.vat_amount,
      amount_before_vat: ocrResult.amount_before_vat,
      receipt_number: ocrResult.receipt_number,
      payment_method: ocrResult.payment_method,
      receipt_type: ocrResult.receipt_type,
      currency: ocrResult.currency,
      category_id: categoryId,
      ocr_status: ocrResult.confidence > 0.1 ? "completed" : "failed",
      ocr_confidence: ocrResult.confidence,
      ocr_raw_response: ocrResult as unknown as Record<string, unknown>,
      ocr_language: ocrResult.language,
    };

    await supabase.from("receipts").update(updateData).eq("id", receipt_id);

    return NextResponse.json(ocrResult);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("OCR processing failed:", errorMsg, error);

    await supabase
      .from("receipts")
      .update({ ocr_status: "failed" })
      .eq("id", receipt_id);

    return NextResponse.json({ error: "OCR processing failed", details: errorMsg }, { status: 500 });
  }
}
