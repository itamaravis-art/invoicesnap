"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";

interface PortalReceipt {
  id: string;
  vendor_name: string | null;
  receipt_date: string | null;
  total_amount: number | null;
  vat_amount: number | null;
  receipt_number: string | null;
  payment_method: string | null;
  receipt_type: string;
  allocation_number: string | null;
}

export default function AccountantPortalPage() {
  const { token } = useParams<{ token: string }>();
  const [receipts, setReceipts] = useState<PortalReceipt[]>([]);
  const [businessName, setBusinessName] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const MONTHS = ["\u05D9\u05E0\u05D5\u05D0\u05E8","\u05E4\u05D1\u05E8\u05D5\u05D0\u05E8","\u05DE\u05E8\u05E5","\u05D0\u05E4\u05E8\u05D9\u05DC","\u05DE\u05D0\u05D9","\u05D9\u05D5\u05E0\u05D9","\u05D9\u05D5\u05DC\u05D9","\u05D0\u05D5\u05D2\u05D5\u05E1\u05D8","\u05E1\u05E4\u05D8\u05DE\u05D1\u05E8","\u05D0\u05D5\u05E7\u05D8\u05D5\u05D1\u05E8","\u05E0\u05D5\u05D1\u05DE\u05D1\u05E8","\u05D3\u05E6\u05DE\u05D1\u05E8"];

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/portal/${token}/receipts?year=${year}&month=${month}`);
      if (!res.ok) { setError("\u05E7\u05D9\u05E9\u05D5\u05E8 \u05DC\u05D0 \u05EA\u05E7\u05D9\u05DF \u05D0\u05D5 \u05E9\u05E4\u05D2 \u05EA\u05D5\u05E7\u05E4\u05D5"); return; }
      const data = await res.json();
      setReceipts(data.receipts);
      setBusinessName(data.business_name);
    } catch { setError("\u05E9\u05D2\u05D9\u05D0\u05D4 \u05D1\u05D8\u05E2\u05D9\u05E0\u05EA \u05D4\u05E0\u05EA\u05D5\u05E0\u05D9\u05DD"); }
    finally { setLoading(false); }
  }, [token, year, month]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (error) return (
    <div className="text-center py-20">
      <span className="material-symbols-outlined text-5xl text-error mb-3 block">link_off</span>
      <h2 className="text-xl font-black text-on-surface mb-2">{"\u05D4\u05E7\u05D9\u05E9\u05D5\u05E8 \u05DC\u05D0 \u05EA\u05E7\u05D9\u05DF"}</h2>
      <p className="text-on-surface-variant">{error}</p>
    </div>
  );

  const total = receipts.reduce((s, r) => s + (r.total_amount || 0), 0);
  const totalVat = receipts.reduce((s, r) => s + (r.vat_amount || 0), 0);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-black text-on-surface">{businessName}</h2>
        <p className="text-sm text-on-surface-variant">{"\u05E7\u05D1\u05DC\u05D5\u05EA \u05DC\u05EA\u05E7\u05D5\u05E4\u05D4"}</p>
      </div>

      {/* Period selector */}
      <div className="flex gap-2">
        <select value={month} onChange={e => setMonth(parseInt(e.target.value))}
          className="flex-1 px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant text-sm">
          {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <select value={year} onChange={e => setYear(parseInt(e.target.value))}
          className="px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant text-sm">
          {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-surface-container-lowest rounded-2xl p-4 text-center">
          <p className="text-xs text-on-surface-variant">{"\u05E1\u05D4\u05F4\u05DB"}</p>
          <p className="font-black">{"\u20AA"}{total.toFixed(2)}</p>
        </div>
        <div className="bg-primary-container rounded-2xl p-4 text-center">
          <p className="text-xs text-on-primary-container opacity-80">{"\u05DE\u05E2\u05F4\u05DE"}</p>
          <p className="font-black text-on-primary-container">{"\u20AA"}{totalVat.toFixed(2)}</p>
        </div>
        <div className="bg-surface-container-lowest rounded-2xl p-4 text-center">
          <p className="text-xs text-on-surface-variant">{"\u05E7\u05D1\u05DC\u05D5\u05EA"}</p>
          <p className="font-black">{receipts.length}</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-on-surface-variant">{"\u05D8\u05D5\u05E2\u05DF..."}</div>
      ) : receipts.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-3xl p-8 text-center">
          <span className="material-symbols-outlined text-4xl text-outline mb-2 block">receipt_long</span>
          <p className="text-on-surface-variant">{"\u05D0\u05D9\u05DF \u05E7\u05D1\u05DC\u05D5\u05EA \u05DC\u05EA\u05E7\u05D5\u05E4\u05D4 \u05D6\u05D5"}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {receipts.map(r => (
            <div key={r.id} className="bg-surface-container-lowest p-4 rounded-2xl flex items-center justify-between">
              <div>
                <p className="font-bold text-sm">{r.vendor_name || "\u05E1\u05E4\u05E7 \u05DC\u05D0 \u05D9\u05D3\u05D5\u05E2"}</p>
                <p className="text-xs text-on-surface-variant">
                  {r.receipt_date ? new Date(r.receipt_date).toLocaleDateString("he-IL") : ""}
                  {r.receipt_number && <> &middot; #{r.receipt_number}</>}
                </p>
              </div>
              <div className="text-start">
                <p className="font-black text-sm">{"\u20AA"}{(r.total_amount || 0).toFixed(2)}</p>
                {r.vat_amount && <p className="text-xs text-primary">{"\u20AA"}{r.vat_amount.toFixed(2)} {"\u05DE\u05E2\u05F4\u05DE"}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
