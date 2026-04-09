"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { MaterialIcon } from "@/components/shared/MaterialIcon";

interface UploadItem {
  file: File;
  preview: string;
  status: "pending" | "uploading" | "processing" | "done" | "error";
  receiptId?: string;
  error?: string;
}

export function BulkUpload() {
  const [items, setItems] = useState<UploadItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const supabase = createClient();

  function handleFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    const newItems: UploadItem[] = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      status: "pending",
    }));
    setItems((prev) => [...prev, ...newItems]);
  }

  function removeItem(index: number) {
    setItems((prev) => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  }

  async function uploadAll() {
    if (items.length === 0) return;
    setUploading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.status !== "pending") continue;

      // Update status to uploading
      setItems((prev) => {
        const updated = [...prev];
        updated[i] = { ...updated[i], status: "uploading" };
        return updated;
      });

      try {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const fileId = crypto.randomUUID();
        const ext = item.file.name.split(".").pop() || "jpg";
        const path = `${user.id}/${year}/${month}/${fileId}.${ext}`;

        // Upload image
        const { error: uploadError } = await supabase.storage
          .from("receipts")
          .upload(path, item.file, { contentType: item.file.type });

        if (uploadError) throw uploadError;

        // Create receipt
        const { data: receipt, error: insertError } = await supabase
          .from("receipts")
          .insert({
            user_id: user.id,
            image_storage_path: path,
            original_filename: item.file.name,
            ocr_status: "processing",
            receipt_type: "receipt",
            currency: "ILS",
            tags: [],
          })
          .select()
          .single();

        if (insertError) throw insertError;

        // Update to processing
        setItems((prev) => {
          const updated = [...prev];
          updated[i] = { ...updated[i], status: "processing", receiptId: receipt.id };
          return updated;
        });

        // Trigger OCR
        fetch("/api/ocr/process", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ receipt_id: receipt.id, image_path: path }),
        }).then(async (res) => {
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.details || data.error || `OCR failed (${res.status})`);
          }
          setItems((prev) => {
            const updated = [...prev];
            const idx = updated.findIndex((u) => u.receiptId === receipt.id);
            if (idx >= 0) updated[idx] = { ...updated[idx], status: "done" };
            return updated;
          });
        }).catch((ocrErr) => {
          setItems((prev) => {
            const updated = [...prev];
            const idx = updated.findIndex((u) => u.receiptId === receipt.id);
            if (idx >= 0) updated[idx] = { ...updated[idx], status: "error", error: String(ocrErr) };
            return updated;
          });
        });
      } catch (err) {
        setItems((prev) => {
          const updated = [...prev];
          updated[i] = { ...updated[i], status: "error", error: String(err) };
          return updated;
        });
      }
    }

    setUploading(false);
  }

  const pendingCount = items.filter((i) => i.status === "pending").length;
  const doneCount = items.filter((i) => i.status === "done").length;

  return (
    <div className="space-y-4">
      {/* File picker */}
      <button
        onClick={() => fileInputRef.current?.click()}
        className="w-full border-2 border-dashed border-outline-variant rounded-2xl p-6 text-center hover:bg-surface-container transition-all active:scale-[0.98]"
      >
        <MaterialIcon icon="upload_file" size={32} className="text-primary mb-2" />
        <p className="font-bold text-on-surface text-sm">בחר קבלות להעלאה</p>
        <p className="text-xs text-on-surface-variant">אפשר לבחור כמה תמונות בבת אחת</p>
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFilesSelected}
        className="hidden"
      />

      {/* Preview grid */}
      {items.length > 0 && (
        <>
          <div className="grid grid-cols-3 gap-3">
            {items.map((item, index) => (
              <div key={index} className="relative rounded-xl overflow-hidden bg-surface-container aspect-square">
                <img src={item.preview} alt="" className="w-full h-full object-cover" />
                {/* Status overlay */}
                <div className={`absolute inset-0 flex items-center justify-center ${
                  item.status === "done" ? "bg-secondary/30" :
                  item.status === "error" ? "bg-error/30" :
                  item.status === "uploading" || item.status === "processing" ? "bg-black/40" :
                  ""
                }`}>
                  {item.status === "uploading" && (
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  {item.status === "processing" && (
                    <MaterialIcon icon="document_scanner" className="text-white" size={28} />
                  )}
                  {item.status === "done" && (
                    <MaterialIcon icon="check_circle" className="text-white" size={28} />
                  )}
                  {item.status === "error" && (
                    <MaterialIcon icon="error" className="text-white" size={28} />
                  )}
                </div>
                {/* Remove button */}
                {item.status === "pending" && (
                  <button
                    onClick={() => removeItem(index)}
                    title="הסר תמונה"
                    className="absolute top-1 end-1 bg-black/60 text-white rounded-full w-6 h-6 flex items-center justify-center"
                  >
                    <MaterialIcon icon="close" size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Upload button */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-on-surface-variant">
              {doneCount} מתוך {items.length} הועלו בהצלחה
            </p>
            {pendingCount > 0 && (
              <button
                onClick={uploadAll}
                disabled={uploading}
                className="bg-primary text-on-primary px-6 py-2.5 rounded-full font-bold text-sm disabled:opacity-50 active:scale-95 transition-all"
              >
                {uploading ? "מעלה קבלות..." : `העלה ${pendingCount} קבלות לעיבוד`}
              </button>
            )}
            {pendingCount === 0 && doneCount > 0 && (
              <button
                onClick={() => router.push("/receipts")}
                className="bg-secondary text-on-secondary px-6 py-2.5 rounded-full font-bold text-sm active:scale-95 transition-all"
              >
                צפה בקבלות שהועלו
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
