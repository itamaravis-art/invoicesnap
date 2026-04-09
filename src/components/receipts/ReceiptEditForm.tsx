"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { MaterialIcon } from "@/components/shared/MaterialIcon";
import { PAYMENT_METHODS, RECEIPT_TYPES, DEFAULT_VAT_RATE } from "@/lib/constants";

interface ReceiptData {
  id: string;
  vendor_name: string | null;
  receipt_date: string | null;
  total_amount: number | null;
  vat_amount: number | null;
  amount_before_vat: number | null;
  receipt_number: string | null;
  payment_method: string | null;
  receipt_type: string;
  category_id: string | null;
  notes: string | null;
  tags: string[];
  business_number: string | null;
  allocation_number: string | null;
  is_vat_reclaimable: boolean;
}

interface Category {
  id: string;
  name_he: string;
  icon: string;
  color: string;
}

export function ReceiptEditForm({ receipt }: { receipt: ReceiptData }) {
  const [form, setForm] = useState(receipt);
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.from("categories").select("id, name_he, icon, color").order("sort_order").then(({ data }) => {
      if (data) setCategories(data);
    });
  }, []);

  function handleChange(field: string, value: unknown) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  }

  // Auto-calculate VAT
  function handleAmountChange(total: number) {
    const vat = Math.round((total / (1 + DEFAULT_VAT_RATE / 100)) * (DEFAULT_VAT_RATE / 100) * 100) / 100;
    const before = Math.round((total - vat) * 100) / 100;
    setForm((prev) => ({ ...prev, total_amount: total, vat_amount: vat, amount_before_vat: before }));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const { error } = await fetch(`/api/receipts/${receipt.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendor_name: form.vendor_name,
          receipt_date: form.receipt_date,
          total_amount: form.total_amount,
          vat_amount: form.vat_amount,
          amount_before_vat: form.amount_before_vat,
          receipt_number: form.receipt_number,
          payment_method: form.payment_method,
          receipt_type: form.receipt_type,
          category_id: form.category_id,
          notes: form.notes,
          tags: form.tags,
          business_number: form.business_number,
          allocation_number: form.allocation_number,
          is_vat_reclaimable: form.is_vat_reclaimable,
          is_manually_edited: true,
        }),
      }).then((r) => r.json());

      if (!error) {
        setSaved(true);
        setTimeout(() => router.refresh(), 500);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-surface-container-lowest rounded-3xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-on-surface flex items-center gap-2">
          <MaterialIcon icon="edit" size={20} />
          עריכת פרטי הקבלה
        </h3>
        {saved && (
          <span className="text-xs text-secondary font-bold flex items-center gap-1">
            <MaterialIcon icon="check_circle" size={16} />
            השינויים נשמרו בהצלחה
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Vendor */}
        <div className="col-span-2">
          <label className="text-xs font-bold text-on-surface-variant mb-1 block">ספק</label>
          <input
            value={form.vendor_name || ""}
            onChange={(e) => handleChange("vendor_name", e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="שם הספק"
          />
        </div>

        {/* Amount */}
        <div>
          <label className="text-xs font-bold text-on-surface-variant mb-1 block">סכום כולל</label>
          <input
            type="number"
            step="0.01"
            value={form.total_amount ?? ""}
            onChange={(e) => handleAmountChange(parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            dir="ltr"
            placeholder="0.00 ₪"
          />
        </div>

        {/* Date */}
        <div>
          <label className="text-xs font-bold text-on-surface-variant mb-1 block">תאריך</label>
          <input
            type="date"
            value={form.receipt_date || ""}
            onChange={(e) => handleChange("receipt_date", e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            dir="ltr"
          />
        </div>

        {/* VAT */}
        <div>
          <label className="text-xs font-bold text-on-surface-variant mb-1 block">מע"מ</label>
          <input
            type="number"
            step="0.01"
            value={form.vat_amount ?? ""}
            onChange={(e) => handleChange("vat_amount", parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            dir="ltr"
            placeholder="0.00 ₪"
          />
        </div>

        {/* Before VAT */}
        <div>
          <label className="text-xs font-bold text-on-surface-variant mb-1 block">לפני מע"מ</label>
          <input
            type="number"
            step="0.01"
            value={form.amount_before_vat ?? ""}
            onChange={(e) => handleChange("amount_before_vat", parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            dir="ltr"
            placeholder="0.00 ₪"
          />
        </div>

        {/* Receipt Number */}
        <div>
          <label className="text-xs font-bold text-on-surface-variant mb-1 block">מספר קבלה</label>
          <input
            value={form.receipt_number || ""}
            onChange={(e) => handleChange("receipt_number", e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            dir="ltr"
            placeholder="לדוגמה: 1234"
          />
        </div>

        {/* Payment Method */}
        <div>
          <label className="text-xs font-bold text-on-surface-variant mb-1 block">אמצעי תשלום</label>
          <select
            value={form.payment_method || ""}
            onChange={(e) => handleChange("payment_method", e.target.value || null)}
            className="w-full px-3 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">בחר אמצעי תשלום</option>
            {Object.entries(PAYMENT_METHODS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        {/* Receipt Type */}
        <div>
          <label className="text-xs font-bold text-on-surface-variant mb-1 block">סוג מסמך</label>
          <select
            value={form.receipt_type}
            onChange={(e) => handleChange("receipt_type", e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {Object.entries(RECEIPT_TYPES).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        {/* Category */}
        <div className="col-span-2">
          <label className="text-xs font-bold text-on-surface-variant mb-1 block">קטגוריה</label>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleChange("category_id", form.category_id === cat.id ? null : cat.id)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  form.category_id === cat.id
                    ? "bg-primary text-on-primary"
                    : "bg-surface-container text-on-surface-variant"
                }`}
              >
                <MaterialIcon icon={cat.icon} size={14} />
                {cat.name_he}
              </button>
            ))}
          </div>
        </div>

        {/* Business Number */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-bold text-on-surface-variant">ח.פ./ע.מ.</label>
          <input
            type="text"
            dir="ltr"
            value={form.business_number || ""}
            onChange={(e) => setForm({ ...form, business_number: e.target.value || null })}
            className="w-full px-4 py-3 rounded-xl bg-surface-container-low border border-outline-variant text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="לדוגמה: 514532891"
          />
        </div>
        {/* Allocation Number */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-bold text-on-surface-variant">מספר הקצאה (שע״מ)</label>
          <input
            type="text"
            dir="ltr"
            value={form.allocation_number || ""}
            onChange={(e) => setForm({ ...form, allocation_number: e.target.value || null })}
            className="w-full px-4 py-3 rounded-xl bg-surface-container-low border border-outline-variant text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="מספר הקצאה"
          />
        </div>
        {/* VAT Reclaimable */}
        <div className="col-span-2 flex items-center gap-3">
          <input
            type="checkbox"
            id="is_vat_reclaimable"
            checked={form.is_vat_reclaimable ?? true}
            onChange={(e) => setForm({ ...form, is_vat_reclaimable: e.target.checked })}
            className="w-5 h-5 rounded accent-primary"
          />
          <label htmlFor="is_vat_reclaimable" className="text-sm font-bold text-on-surface-variant">מע״מ לניכוי</label>
        </div>

        {/* Notes */}
        <div className="col-span-2">
          <label className="text-xs font-bold text-on-surface-variant mb-1 block">הערות</label>
          <textarea
            value={form.notes || ""}
            onChange={(e) => handleChange("notes", e.target.value)}
            rows={2}
            className="w-full px-3 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            placeholder="הוסף הערה (לא חובה)"
          />
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-primary text-on-primary py-3 rounded-full font-bold hover:bg-primary/90 transition-all active:scale-[0.98] disabled:opacity-50"
      >
        {saving ? "שומר שינויים..." : "שמור את השינויים"}
      </button>
    </div>
  );
}
