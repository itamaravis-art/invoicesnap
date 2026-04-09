"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function WelcomePage() {
  const [businessName, setBusinessName] = useState("");
  const [businessId, setBusinessId] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("user_settings").upsert({
      user_id: user.id,
      display_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "",
      business_name: businessName || null,
      business_id: businessId || null,
      vat_rate: 17.0,
      locale: "he",
      currency: "ILS",
      onboarding_completed: false,
    });

    router.push("/setup-accountant");
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-primary-container flex items-center justify-center mx-auto mb-4">
          <span className="material-symbols-outlined text-3xl text-on-primary-container">waving_hand</span>
        </div>
        <h2 className="text-2xl font-black text-on-surface mb-2">ברוך הבא!</h2>
        <p className="text-on-surface-variant">בוא נגדיר את העסק שלך</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="businessName" className="text-sm font-bold text-on-surface-variant">שם העסק</label>
          <input
            id="businessName"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-surface-container-low border border-outline-variant text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="לדוגמה: סטודיו דיגיטל בע״מ"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="businessId" className="text-sm font-bold text-on-surface-variant">ח.פ / עוסק מורשה</label>
          <input
            id="businessId"
            value={businessId}
            onChange={(e) => setBusinessId(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-surface-container-low border border-outline-variant text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="מספר עוסק מורשה"
            dir="ltr"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-on-primary py-3 rounded-full font-bold hover:bg-primary/90 transition-all active:scale-[0.98] disabled:opacity-50"
        >
          {loading ? "שומר..." : "הבא"}
        </button>

        <button
          type="button"
          onClick={() => router.push("/setup-accountant")}
          className="w-full text-on-surface-variant py-2 text-sm font-medium hover:underline"
        >
          דלג
        </button>
      </form>
    </div>
  );
}
