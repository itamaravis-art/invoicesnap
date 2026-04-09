"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export default function WhatsAppSettingsPage() {
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("user_settings").select("phone_number").eq("user_id", user.id).maybeSingle();
      if (data?.phone_number) setPhone(data.phone_number);
    })();
  }, [supabase]);

  async function savePhone() {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone_number: phone || null }),
      });
      if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2000); }
    } finally { setSaving(false); }
  }

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-on-surface">{"\u05E9\u05DC\u05D9\u05D7\u05EA \u05E7\u05D1\u05DC\u05D5\u05EA \u05D1\u05D5\u05D5\u05D0\u05D8\u05E1\u05D0\u05E4"}</h2>
        <p className="text-sm text-on-surface-variant mt-1">{"\u05E9\u05DC\u05D7 \u05EA\u05DE\u05D5\u05E0\u05EA \u05E7\u05D1\u05DC\u05D4 \u05D1\u05D5\u05D5\u05D0\u05D8\u05E1\u05D0\u05E4 \u05D5\u05D4\u05D9\u05D0 \u05EA\u05D9\u05E7\u05DC\u05D8 \u05D0\u05D5\u05D8\u05D5\u05DE\u05D8\u05D9\u05EA"}</p>
      </div>

      <div className="bg-surface-container-lowest rounded-3xl p-6 space-y-4">
        <h3 className="font-bold text-on-surface">{"\u05D4\u05D2\u05D3\u05E8\u05EA \u05DE\u05E1\u05E4\u05E8 \u05D8\u05DC\u05E4\u05D5\u05DF"}</h3>
        <p className="text-sm text-on-surface-variant">{"\u05D4\u05D6\u05DF \u05D0\u05EA \u05DE\u05E1\u05E4\u05E8 \u05D4\u05D8\u05DC\u05E4\u05D5\u05DF \u05E9\u05DC\u05DA \u05DB\u05D3\u05D9 \u05E9\u05E0\u05D6\u05D4\u05D4 \u05D0\u05D5\u05EA\u05DA \u05DB\u05E9\u05E9\u05D5\u05DC\u05D7\u05D9\u05DD \u05E7\u05D1\u05DC\u05D4"}</p>
        <div className="flex gap-2">
          <input
            type="tel"
            dir="ltr"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="flex-1 px-4 py-3 rounded-xl bg-surface-container-low border border-outline-variant text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="050-1234567"
          />
          <button
            onClick={savePhone}
            disabled={saving}
            className="bg-primary text-on-primary px-6 py-3 rounded-xl font-bold disabled:opacity-50"
          >
            {saved ? "\u05E0\u05E9\u05DE\u05E8 \u2713" : saving ? "\u05E9\u05D5\u05DE\u05E8..." : "\u05E9\u05DE\u05D5\u05E8"}
          </button>
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-3xl p-6 space-y-4">
        <h3 className="font-bold text-on-surface">{"\u05D0\u05D9\u05DA \u05D6\u05D4 \u05E2\u05D5\u05D1\u05D3?"}</h3>
        <div className="space-y-3">
          {[
            { icon: "phone_android", text: "\u05E9\u05DE\u05D5\u05E8 \u05D0\u05EA \u05DE\u05E1\u05E4\u05E8 \u05D4\u05D5\u05D5\u05D0\u05D8\u05E1\u05D0\u05E4 \u05E9\u05DC InvoiceSnap \u05D1\u05D0\u05E0\u05E9\u05D9 \u05D4\u05E7\u05E9\u05E8" },
            { icon: "photo_camera", text: "\u05E9\u05DC\u05D7 \u05EA\u05DE\u05D5\u05E0\u05EA \u05E7\u05D1\u05DC\u05D4 \u05DB\u05D4\u05D5\u05D3\u05E2\u05D4 \u05E8\u05D2\u05D9\u05DC\u05D4" },
            { icon: "auto_awesome", text: "\u05D4\u05E7\u05D1\u05DC\u05D4 \u05EA\u05D9\u05E1\u05E8\u05E7 \u05D0\u05D5\u05D8\u05D5\u05DE\u05D8\u05D9\u05EA \u05D5\u05EA\u05EA\u05D5\u05D5\u05E1\u05E3 \u05DC\u05D7\u05E9\u05D1\u05D5\u05DF \u05E9\u05DC\u05DA" },
            { icon: "check_circle", text: "\u05EA\u05E7\u05D1\u05DC \u05D0\u05D9\u05E9\u05D5\u05E8 \u05E2\u05DD \u05E4\u05E8\u05D8\u05D9 \u05D4\u05E7\u05D1\u05DC\u05D4 \u05E9\u05D6\u05D5\u05D4\u05D5" },
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-8 h-8 bg-primary-container rounded-full flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-on-primary-container text-sm">{step.icon}</span>
              </div>
              <p className="text-sm text-on-surface pt-1">{step.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
