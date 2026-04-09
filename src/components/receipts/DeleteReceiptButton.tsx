"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeleteReceiptButton({ receiptId }: { receiptId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/receipts/${receiptId}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/receipts");
        router.refresh();
      }
    } finally {
      setDeleting(false);
      setConfirming(false);
    }
  }

  if (confirming) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6">
        <div className="bg-surface rounded-3xl p-6 w-full max-w-sm space-y-4 animate-scale-in">
          <div className="text-center">
            <span className="material-symbols-outlined text-error text-4xl mb-2 block">delete_forever</span>
            <h3 className="text-lg font-black text-on-surface">מחיקת קבלה</h3>
            <p className="text-sm text-on-surface-variant mt-1">הקבלה תועבר לארכיון ולא תופיע ברשימות ובדוחות.</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setConfirming(false)}
              className="flex-1 bg-surface-container py-3 rounded-full font-bold text-sm"
            >
              ביטול
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1 bg-error text-on-error py-3 rounded-full font-bold text-sm disabled:opacity-50"
            >
              {deleting ? "מוחק..." : "מחק קבלה"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="w-full flex items-center justify-center gap-2 text-error bg-error-container py-3 rounded-full font-bold text-sm active:scale-95 transition-all"
    >
      <span className="material-symbols-outlined text-lg">delete</span>
      מחק קבלה
    </button>
  );
}
