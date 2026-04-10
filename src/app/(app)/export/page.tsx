"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { useSearchParams } from "next/navigation";

interface Accountant {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
}

export default function ExportPage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-on-surface-variant">טוען...</div>}>
      <ExportContent />
    </Suspense>
  );
}

function ExportContent() {
  const searchParams = useSearchParams();
  const [year, setYear] = useState(parseInt(searchParams.get("year") || String(new Date().getFullYear())));
  const [month, setMonth] = useState(parseInt(searchParams.get("month") || String(new Date().getMonth() + 1)));
  const [accountants, setAccountants] = useState<Accountant[]>([]);
  const [selectedAccountant, setSelectedAccountant] = useState<string>("");
  const [sending, setSending] = useState("");
  const [result, setResult] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const supabase = createClient();

  const MONTHS = ["ינואר","פברואר","מרץ","אפריל","מאי","יוני","יולי","אוגוסט","ספטמבר","אוקטובר","נובמבר","דצמבר"];

  const fetchAccountants = useCallback(async () => {
    const res = await fetch("/api/accountants", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      // API returns array directly, not wrapped in { accountants: [...] }
      const list: Accountant[] = Array.isArray(data) ? data : (data.accountants || []);
      setAccountants(list);
      if (list.length > 0) setSelectedAccountant(list[0].id);
    }
  }, []);

  useEffect(() => { fetchAccountants(); }, [fetchAccountants]);

  function showResult(type: "success" | "error", msg: string) {
    setResult({ type, msg });
    setTimeout(() => setResult(null), 4000);
  }

  async function sendEmail() {
    const acct = accountants.find(a => a.id === selectedAccountant);
    if (!acct?.email) { showResult("error", "לרואה החשבון אין כתובת אימייל"); return; }
    setSending("email");
    try {
      // Generate CSV and get signed download link
      const res = await fetch("/api/export/csv-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year, month }),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        showResult("error", d.error || "לא נמצאו קבלות לחודש זה");
        return;
      }

      const data = await res.json();
      const monthName = MONTHS[month - 1];
      const formatNis = (n: number) => new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS" }).format(n);

      const subject = `דוח קבלות ${monthName} ${year}`;
      const cleanBody = [
        `שלום ${acct.name},`,
        ``,
        `מצורף דוח הקבלות לחודש ${monthName} ${year}:`,
        ``,
        `סה״כ הוצאות: ${formatNis(data.total_amount)}`,
        `מע״מ לניכוי: ${formatNis(data.total_vat)}`,
        `מספר קבלות: ${data.receipt_count}`,
        ``,
        `להורדת קובץ CSV מלא (פותח באקסל):`,
        data.url,
        ``,
        `תודה!`,
      ].join("\n");

      const mailto = `mailto:${acct.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(cleanBody)}`;
      window.location.href = mailto;
      showResult("success", `נפתחה אפליקציית המייל עם לינק להורדה (${data.receipt_count} קבלות)`);
    } catch {
      showResult("error", "שגיאה ביצירת הדוח. בדוק את החיבור.");
    }
    finally { setSending(""); }
  }

  async function downloadZip() {
    setSending("zip");
    try {
      const res = await fetch("/api/export/zip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year, month }),
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `invoicesnap_${year}_${String(month).padStart(2, "0")}.zip`;
        a.click();
        URL.revokeObjectURL(url);
        showResult("success", "הקובץ הורד בהצלחה");
      } else showResult("error", "שגיאה בהורדה");
    } catch { showResult("error", "שגיאה בהורדה"); }
    finally { setSending(""); }
  }

  async function sendWhatsApp() {
    const acct = accountants.find(a => a.id === selectedAccountant);
    if (!acct?.phone) { showResult("error", "לרואה החשבון אין מספר טלפון"); return; }
    setSending("whatsapp");
    try {
      const res = await fetch("/api/export/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year, month, accountant_id: selectedAccountant }),
      });
      if (res.ok) {
        const data = await res.json();
        window.open(data.url, "_blank");
        showResult("success", "נפתח WhatsApp לשליחה");
      } else showResult("error", "שגיאה ביצירת הקישור");
    } catch { showResult("error", "שגיאה"); }
    finally { setSending(""); }
  }

  async function shareDrive() {
    const acct = accountants.find(a => a.id === selectedAccountant);
    if (!acct?.email) { showResult("error", "לרואה החשבון אין כתובת אימייל"); return; }
    setSending("drive");
    try {
      const res = await fetch("/api/export/gdrive-share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year, month, accountant_email: acct.email }),
      });
      if (res.ok) showResult("success", `התיקייה שותפה עם ${acct.email}`);
      else showResult("error", "שגיאה בשיתוף. ודא שחיברת Google Drive.");
    } catch { showResult("error", "שגיאה בשיתוף"); }
    finally { setSending(""); }
  }

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-black text-on-surface">שליחה לרואה חשבון</h2>
      <p className="text-sm text-on-surface-variant">בחר תקופה ודרך שליחה</p>

      {/* Result toast */}
      {result && (
        <div className={`p-4 rounded-2xl font-bold text-sm flex items-center gap-2 animate-slide-up ${
          result.type === "success" ? "bg-secondary-container text-on-secondary-container" : "bg-error-container text-on-error-container"
        }`}>
          <span className="material-symbols-outlined text-lg">
            {result.type === "success" ? "check_circle" : "error"}
          </span>
          {result.msg}
        </div>
      )}

      {/* Period selector */}
      <div className="bg-surface-container-lowest rounded-3xl p-4 space-y-3">
        <h3 className="font-bold text-on-surface text-sm">תקופה</h3>
        <div className="flex gap-2">
          <select
            value={month}
            onChange={(e) => setMonth(parseInt(e.target.value))}
            className="flex-1 px-4 py-3 rounded-xl bg-surface-container-low border border-outline-variant text-on-surface text-sm"
          >
            {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="px-4 py-3 rounded-xl bg-surface-container-low border border-outline-variant text-on-surface text-sm"
          >
            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Accountant selector */}
      <div className="bg-surface-container-lowest rounded-3xl p-4 space-y-3">
        <h3 className="font-bold text-on-surface text-sm">רואה חשבון</h3>
        {accountants.length > 0 ? (
          <select
            value={selectedAccountant}
            onChange={(e) => setSelectedAccountant(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-surface-container-low border border-outline-variant text-on-surface text-sm"
          >
            {accountants.map(a => (
              <option key={a.id} value={a.id}>{a.name} {a.email ? `(${a.email})` : ""}</option>
            ))}
          </select>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-on-surface-variant mb-2">עדיין לא הוספת רואה חשבון</p>
            <a href="/settings/accountants" className="text-primary font-bold text-sm">הוסף רואה חשבון</a>
          </div>
        )}
      </div>

      {/* Export actions */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={sendEmail}
          disabled={sending !== "" || !selectedAccountant}
          className="bg-primary text-on-primary p-4 rounded-2xl font-bold text-sm flex flex-col items-center gap-2 active:scale-95 transition-all disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-2xl">email</span>
          {sending === "email" ? "שולח..." : "שלח בדוא״ל"}
        </button>
        <button
          onClick={downloadZip}
          disabled={sending !== ""}
          className="bg-surface-container-lowest border border-outline-variant p-4 rounded-2xl font-bold text-sm flex flex-col items-center gap-2 active:scale-95 transition-all disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-2xl text-primary">folder_zip</span>
          {sending === "zip" ? "מכין..." : "הורד ZIP"}
        </button>
        <button
          onClick={sendWhatsApp}
          disabled={sending !== "" || !selectedAccountant}
          className="bg-surface-container-lowest border border-outline-variant p-4 rounded-2xl font-bold text-sm flex flex-col items-center gap-2 active:scale-95 transition-all disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-2xl text-secondary">chat</span>
          {sending === "whatsapp" ? "פותח..." : "שלח בוואטסאפ"}
        </button>
        <button
          onClick={shareDrive}
          disabled={sending !== "" || !selectedAccountant}
          className="bg-surface-container-lowest border border-outline-variant p-4 rounded-2xl font-bold text-sm flex flex-col items-center gap-2 active:scale-95 transition-all disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-2xl text-tertiary">cloud_upload</span>
          {sending === "drive" ? "משתף..." : "שתף ב-Drive"}
        </button>
      </div>
    </section>
  );
}
