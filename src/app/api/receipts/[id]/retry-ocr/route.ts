import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 60;

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Get the receipt
    const { data: receipt } = await supabase
      .from("receipts")
      .select("id, image_storage_path")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (!receipt?.image_storage_path) {
      return NextResponse.json({ error: "קבלה לא נמצאה" }, { status: 404 });
    }

    // Reset status to processing
    await supabase
      .from("receipts")
      .update({ ocr_status: "processing" })
      .eq("id", id);

    // Call the OCR process endpoint
    const origin = _request.nextUrl.origin;
    const ocrRes = await fetch(`${origin}/api/ocr/process`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: _request.headers.get("cookie") || "",
      },
      body: JSON.stringify({
        receipt_id: id,
        image_path: receipt.image_storage_path,
      }),
    });

    if (!ocrRes.ok) {
      const err = await ocrRes.json().catch(() => ({}));
      return NextResponse.json({
        error: err.error || "OCR נכשל שוב",
      }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Server error: ${msg}` }, { status: 500 });
  }
}
