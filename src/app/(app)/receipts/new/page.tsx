"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { BulkUpload } from "@/components/receipts/BulkUpload";

export default function NewReceiptPage() {
  const [mode, setMode] = useState<"single" | "bulk">("single");
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const supabase = createClient();

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setPreview(URL.createObjectURL(file));
    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const fileId = crypto.randomUUID();
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/${year}/${month}/${fileId}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("receipts")
        .upload(path, file, { contentType: file.type });

      if (uploadError) throw uploadError;

      const { data: receipt, error: insertError } = await supabase
        .from("receipts")
        .insert({
          user_id: user.id,
          image_storage_path: path,
          original_filename: file.name,
          ocr_status: "processing",
          receipt_type: "receipt",
          currency: "ILS",
          tags: [],
        })
        .select()
        .single();

      if (insertError) throw insertError;

      fetch("/api/ocr/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receipt_id: receipt.id, image_path: path }),
      });

      setUploading(false);
      router.push(`/receipts/${receipt.id}`);
    } catch (err) {
      setError("שגיאה בהעלאת הקבלה. נסה שוב.");
      setUploading(false);
      console.error(err);
    }
  }

  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-black text-on-surface">סרוק קבלה</h2>

      {/* Mode tabs */}
      <div className="flex gap-2 bg-surface-container-low rounded-xl p-1">
        <button
          onClick={() => setMode("single")}
          className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
            mode === "single" ? "bg-primary text-on-primary" : "text-on-surface-variant"
          }`}
        >
          צילום בודד
        </button>
        <button
          onClick={() => setMode("bulk")}
          className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
            mode === "bulk" ? "bg-primary text-on-primary" : "text-on-surface-variant"
          }`}
        >
          העלאה מרובה
        </button>
      </div>

      {mode === "single" ? (
        <>
          {!preview ? (
            <div className="flex flex-col items-center gap-6">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full max-w-sm aspect-[3/4] rounded-3xl border-2 border-dashed border-outline-variant bg-surface-container-low flex flex-col items-center justify-center gap-4 hover:bg-surface-container transition-all active:scale-[0.98] cursor-pointer"
              >
                <div className="w-20 h-20 rounded-full bg-primary-container flex items-center justify-center">
                  <span className="material-symbols-outlined text-4xl text-on-primary-container">photo_camera</span>
                </div>
                <div className="text-center">
                  <p className="font-bold text-on-surface">לחץ לצילום או בחירת תמונה</p>
                  <p className="text-sm text-on-surface-variant mt-1">JPG, PNG, HEIC עד 10MB</p>
                </div>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="w-full max-w-sm rounded-3xl overflow-hidden bg-surface-container">
                <img src={preview} alt="Receipt preview" className="w-full object-contain" />
              </div>
              {uploading && (
                <div className="flex items-center gap-3 text-primary">
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span className="font-bold">מעבד את הקבלה...</span>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <BulkUpload />
      )}

      {error && (
        <div className="bg-error-container text-on-error-container p-4 rounded-xl text-sm font-medium text-center">
          {error}
        </div>
      )}
    </section>
  );
}
