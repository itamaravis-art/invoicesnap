"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SetupAccountantPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (name) {
      await supabase.from("accountant_contacts").insert({
        user_id: user.id,
        name,
        email: email || null,
        phone: phone || null,
        is_primary: true,
      });
    }

    router.push("/first-receipt");
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-secondary-container flex items-center justify-center mx-auto mb-4">
          <span className="material-symbols-outlined text-3xl text-on-secondary-container">contact_mail</span>
        </div>
        <h2 className="text-2xl font-black text-on-surface mb-2">רואה החשבון שלך (לא חובה)</h2>
        <p className="text-on-surface-variant">הוסף את פרטי רואה החשבון כדי לשלוח קבלות בקליק אחד</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="name" className="text-sm font-bold text-on-surface-variant">שם רואה החשבון</label>
          <input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-surface-container-low border border-outline-variant text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="לדוגמה: יעל כהן"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm font-bold text-on-surface-variant">אימייל</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-surface-container-low border border-outline-variant text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="israel@accounting.co.il"
            dir="ltr"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="phone" className="text-sm font-bold text-on-surface-variant">טלפון (WhatsApp)</label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-surface-container-low border border-outline-variant text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="050-1234567"
            dir="ltr"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-on-primary py-3 rounded-full font-bold hover:bg-primary/90 transition-all active:scale-[0.98] disabled:opacity-50"
        >
          {loading ? "שומר..." : "שמור והמשך"}
        </button>

        <button
          type="button"
          onClick={() => router.push("/first-receipt")}
          className="w-full text-on-surface-variant py-2 text-sm font-medium hover:underline"
        >
          אוסיף מאוחר יותר
        </button>
      </form>
    </div>
  );
}
