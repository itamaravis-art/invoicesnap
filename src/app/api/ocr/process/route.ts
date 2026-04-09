import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { processReceiptImage } from "@/lib/ocr/process";
import { OCR_MIN_CONFIDENCE } from "@/lib/constants";
import { generateReceiptHash } from "@/lib/utils";

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

    // Try matching by business_number first
    if (ocrResult.business_number) {
      const { data: vendorByBn } = await supabase
        .from("vendors")
        .select("id, default_category_id")
        .eq("user_id", user.id)
        .eq("business_number", ocrResult.business_number)
        .maybeSingle();
      if (vendorByBn) {
        vendorId = vendorByBn.id;
        categoryId = vendorByBn.default_category_id;
      }
    }

    if (!vendorId && ocrResult.vendor_name) {
      const normalized = ocrResult.vendor_name.toLowerCase().trim();

      // Try exact match by name
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
            business_number: ocrResult.business_number,
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
      business_number: ocrResult.business_number,
      allocation_number: ocrResult.allocation_number,
      category_id: categoryId,
      ocr_status: ocrResult.confidence > OCR_MIN_CONFIDENCE ? "completed" : "failed",
      ocr_confidence: ocrResult.confidence,
      ocr_raw_response: ocrResult as unknown as Record<string, unknown>,
      ocr_language: ocrResult.language,
    };

    // Generate content hash for duplicate detection
    const contentHash = generateReceiptHash(ocrResult.vendor_name, ocrResult.receipt_date, ocrResult.total_amount);
    if (contentHash) {
      (updateData as Record<string, unknown>).content_hash = contentHash;

      // Check for duplicates
      const { data: duplicates } = await supabase
        .from("receipts")
        .select("id, vendor_name, receipt_date, total_amount")
        .eq("user_id", user.id)
        .eq("content_hash", contentHash)
        .eq("is_archived", false)
        .neq("id", receipt_id)
        .limit(1);

      if (duplicates && duplicates.length > 0) {
        (updateData as Record<string, unknown>).tags = ["duplicate"];
      }
    }

    await supabase.from("receipts").update(updateData).eq("id", receipt_id);

    return NextResponse.json(ocrResult);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("OCR processing failed:", errorMsg, error);

    await supabase
      .from("receipts")
      .update({ ocr_status: "failed" })
      .eq("id", receipt_id);

    return NextResponse.json({ error: "OCR processing failed" }, { status: 500 });
  }
}
