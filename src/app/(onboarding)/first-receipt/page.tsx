"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

export default function FirstReceiptPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  async function handleFinish() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("user_settings")
      .update({ onboarding_completed: true })
      .eq("user_id", user.id);

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="space-y-6 text-center">
      <div className="w-20 h-20 rounded-full bg-primary-container flex items-center justify-center mx-auto">
        <span className="material-symbols-outlined text-4xl text-on-primary-container">photo_camera</span>
      </div>
      <h2 className="text-2xl font-black text-on-surface">הגיע הרגע! בואו נסרוק קבלה</h2>
      <p className="text-on-surface-variant">
        צלם קבלה והאפליקציה תזהה את כל הפרטים אוטומטית
      </p>

      <div className="flex flex-col gap-3 pt-4">
        <button
          onClick={() => {
            handleFinish().then(() => router.push("/receipts/new"));
          }}
          className="w-full bg-primary text-on-primary py-3 rounded-full font-bold hover:bg-primary/90 transition-all active:scale-[0.98]"
        >
          <span className="flex items-center justify-center gap-2">
            <span className="material-symbols-outlined">photo_camera</span>
            סרוק קבלה עכשיו
          </span>
        </button>

        <button
          onClick={handleFinish}
          disabled={loading}
          className="w-full text-on-surface-variant py-2 text-sm font-medium hover:underline disabled:opacity-50"
        >
          {loading ? "מסיים..." : "אעשה את זה אחר כך"}
        </button>
      </div>
    </div>
  );
}
