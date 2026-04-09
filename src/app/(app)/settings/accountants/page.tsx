"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface Accountant {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  is_primary: boolean;
}

export default function AccountantsPage() {
  const [accountants, setAccountants] = useState<Accountant[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchAccountants = useCallback(async () => {
    try {
      const res = await fetch("/api/accountants");
      if (res.ok) setAccountants(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAccountants(); }, [fetchAccountants]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/accountants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email: email || null, phone: phone || null, is_primary: accountants.length === 0 }),
      });
      if (res.ok) {
        setShowForm(false);
        setName(""); setEmail(""); setPhone("");
        await fetchAccountants();
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("בטוח שאתה רוצה למחוק?")) return;
    await fetch(`/api/accountants/${id}`, { method: "DELETE" });
    await fetchAccountants();
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/settings" className="text-primary font-bold text-sm flex items-center gap-1">
          <span className="material-symbols-outlined text-lg">arrow_forward</span>
          הגדרות
        </Link>
      </div>
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black text-on-surface">רואי חשבון</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-primary text-on-primary px-4 py-2 rounded-full text-sm font-bold flex items-center gap-1 active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          הוסף
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="bg-surface-container-lowest rounded-3xl p-6 space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-on-surface-variant">שם</label>
            <input
              value={name} onChange={(e) => setName(e.target.value)} required
              className="w-full px-4 py-3 rounded-xl bg-surface-container-low border border-outline-variant text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="שם רואה החשבון"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-on-surface-variant">אימייל</label>
            <input
              type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-surface-container-low border border-outline-variant text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="accountant@email.com" dir="ltr"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-on-surface-variant">טלפון (WhatsApp)</label>
            <input
              type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-surface-container-low border border-outline-variant text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="050-1234567" dir="ltr"
            />
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={saving}
              className="flex-1 bg-primary text-on-primary py-2.5 rounded-full font-bold disabled:opacity-50">
              {saving ? "שומר..." : "שמור"}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="px-6 py-2.5 rounded-full font-bold text-on-surface-variant border border-outline-variant">
              ביטול
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : accountants.length > 0 ? (
        <div className="space-y-3">
          {accountants.map((acc) => (
            <div key={acc.id} className="bg-surface-container-lowest rounded-3xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-secondary-container rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-on-secondary-container">contact_mail</span>
                </div>
                <div>
                  <p className="font-bold text-on-surface">{acc.name}</p>
                  <p className="text-xs text-on-surface-variant">
                    {acc.email && <span>{acc.email}</span>}
                    {acc.email && acc.phone && <span> &bull; </span>}
                    {acc.phone && <span dir="ltr">{acc.phone}</span>}
                  </p>
                </div>
              </div>
              <button onClick={() => handleDelete(acc.id)}
                className="text-error hover:bg-error-container p-2 rounded-xl transition-all">
                <span className="material-symbols-outlined">delete</span>
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-surface-container-lowest rounded-3xl p-8 text-center">
          <span className="material-symbols-outlined text-4xl text-outline mb-2 block">contact_mail</span>
          <p className="text-on-surface-variant">אין רואי חשבון</p>
          <p className="text-sm text-outline mt-1">הוסף את רואה החשבון שלך כדי לשלוח קבלות בקלות</p>
        </div>
      )}
    </section>
  );
}
