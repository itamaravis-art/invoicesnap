"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RetryOcrButton({ receiptId }: { receiptId: string }) {
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleRetry(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setRetrying(true);
    setError("");
    try {
      const res = await fetch(`/api/receipts/${receiptId}/retry-ocr`, { method: "POST" });
      if (res.ok) {
        router.refresh();
      } else {
        const d = await res.json().catch(() => ({}));
        setError(d.error || "נכשל");
        setTimeout(() => setError(""), 3000);
      }
    } catch {
      setError("שגיאת רשת");
      setTimeout(() => setError(""), 3000);
    } finally {
      setRetrying(false);
    }
  }

  return (
    <button
      onClick={handleRetry}
      disabled={retrying}
      className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-primary text-on-primary disabled:opacity-50 flex items-center gap-1 ms-1"
      title="נסה לעבד שוב את הקבלה"
    >
      <span className="material-symbols-outlined text-[12px]">refresh</span>
      {retrying ? "מנסה..." : error || "נסה שוב"}
    </button>
  );
}
