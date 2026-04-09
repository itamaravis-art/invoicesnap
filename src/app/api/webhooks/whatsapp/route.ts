import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { processReceiptImage } from "@/lib/ocr/process";
import { twimlResponse } from "@/lib/whatsapp/reply";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const from = (formData.get("From") as string || "").replace("whatsapp:", "");
  const mediaUrl = formData.get("MediaUrl0") as string | null;
  const messageSid = formData.get("MessageSid") as string || "";

  const adminClient = createAdminClient();

  // Log the webhook
  const logEntry = {
    from_number: from,
    media_url: mediaUrl,
    message_sid: messageSid,
    status: "received" as const,
  };

  // Find user by phone
  const normalizedPhone = from.replace(/\D/g, "").replace(/^972/, "0");
  const { data: userSettings } = await adminClient
    .from("user_settings")
    .select("user_id")
    .eq("phone_number", normalizedPhone)
    .single();

  if (!userSettings) {
    await adminClient.from("whatsapp_webhook_log").insert({ ...logEntry, status: "user_not_found" });
    return twimlResponse("\u05DE\u05E1\u05E4\u05E8 \u05D4\u05D8\u05DC\u05E4\u05D5\u05DF \u05DC\u05D0 \u05DE\u05D6\u05D5\u05D4\u05D4. \u05D4\u05D2\u05D3\u05E8 \u05DE\u05E1\u05E4\u05E8 \u05D8\u05DC\u05E4\u05D5\u05DF \u05D1\u05D4\u05D2\u05D3\u05E8\u05D5\u05EA InvoiceSnap.");
  }

  if (!mediaUrl) {
    await adminClient.from("whatsapp_webhook_log").insert({ ...logEntry, matched_user_id: userSettings.user_id, status: "failed", error_message: "No media" });
    return twimlResponse("\u05E9\u05DC\u05D7 \u05EA\u05DE\u05D5\u05E0\u05D4 \u05E9\u05DC \u05E7\u05D1\u05DC\u05D4 \u05DB\u05D3\u05D9 \u05DC\u05D4\u05D5\u05E1\u05D9\u05E3 \u05D0\u05D5\u05EA\u05D4 \u05DC\u05DE\u05E2\u05E8\u05DB\u05EA.");
  }

  try {
    // Download image from Twilio
    const twilioSid = process.env.TWILIO_ACCOUNT_SID || "";
    const twilioToken = process.env.TWILIO_AUTH_TOKEN || "";
    const imgRes = await fetch(mediaUrl, {
      headers: { Authorization: "Basic " + Buffer.from(`${twilioSid}:${twilioToken}`).toString("base64") },
    });
    if (!imgRes.ok) throw new Error("Failed to download image from Twilio");

    const buffer = Buffer.from(await imgRes.arrayBuffer());
    const mimeType = imgRes.headers.get("content-type") || "image/jpeg";

    // Upload to Supabase storage
    const now = new Date();
    const path = `${userSettings.user_id}/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}/wa_${Date.now()}.jpg`;
    await adminClient.storage.from("receipts").upload(path, buffer, { contentType: mimeType });

    // Create receipt
    const { data: receipt } = await adminClient
      .from("receipts")
      .insert({
        user_id: userSettings.user_id,
        image_storage_path: path,
        original_filename: `whatsapp_${messageSid}.jpg`,
        ocr_status: "processing",
        receipt_type: "receipt",
        currency: "ILS",
        tags: ["whatsapp"],
      })
      .select("id")
      .single();

    if (!receipt) throw new Error("Failed to create receipt");

    // Run OCR
    const ocrResult = await processReceiptImage(buffer, mimeType);

    // Update receipt
    await adminClient.from("receipts").update({
      vendor_name: ocrResult.vendor_name,
      receipt_date: ocrResult.receipt_date,
      total_amount: ocrResult.total_amount,
      vat_amount: ocrResult.vat_amount,
      amount_before_vat: ocrResult.amount_before_vat,
      receipt_number: ocrResult.receipt_number,
      payment_method: ocrResult.payment_method,
      receipt_type: ocrResult.receipt_type,
      currency: ocrResult.currency,
      ocr_status: ocrResult.confidence > 0.1 ? "completed" : "failed",
      ocr_confidence: ocrResult.confidence,
      ocr_language: ocrResult.language,
      business_number: ocrResult.business_number,
      allocation_number: ocrResult.allocation_number,
    }).eq("id", receipt.id);

    await adminClient.from("whatsapp_webhook_log").insert({
      ...logEntry, matched_user_id: userSettings.user_id, receipt_id: receipt.id, status: "completed",
    });

    const vendor = ocrResult.vendor_name || "\u05E1\u05E4\u05E7 \u05DC\u05D0 \u05D9\u05D3\u05D5\u05E2";
    const amount = ocrResult.total_amount ? `\u20AA${ocrResult.total_amount.toFixed(2)}` : "\u05E1\u05DB\u05D5\u05DD \u05DC\u05D0 \u05D6\u05D5\u05D4\u05D4";
    return twimlResponse(`\u2705 \u05D4\u05E7\u05D1\u05DC\u05D4 \u05E0\u05E7\u05DC\u05D8\u05D4!\n\u05E1\u05E4\u05E7: ${vendor}\n\u05E1\u05DB\u05D5\u05DD: ${amount}`);

  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    await adminClient.from("whatsapp_webhook_log").insert({
      ...logEntry, matched_user_id: userSettings.user_id, status: "failed", error_message: errMsg.slice(0, 500),
    });
    return twimlResponse("\u05E9\u05D2\u05D9\u05D0\u05D4 \u05D1\u05E2\u05D9\u05D1\u05D5\u05D3 \u05D4\u05E7\u05D1\u05DC\u05D4. \u05E0\u05E1\u05D4 \u05E9\u05D5\u05D1.");
  }
}
