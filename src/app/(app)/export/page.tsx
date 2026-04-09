import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getHebrewMonthName } from "@/lib/utils";

export default async function ExportPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    return { year: d.getFullYear(), month: d.getMonth() + 1 };
  });

  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-black text-on-surface">ייצוא לרואה חשבון</h2>

      <div className="space-y-3">
        {months.map(({ year, month }) => (
          <div key={`${year}-${month}`} className="bg-surface-container-lowest rounded-3xl p-5">
            <h3 className="font-bold text-on-surface mb-4">
              {getHebrewMonthName(month)} {year}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: "mail", label: "שלח במייל", method: "email" },
                { icon: "folder_zip", label: "הורד ZIP", method: "zip" },
                { icon: "cloud_upload", label: "שתף ב-Drive", method: "gdrive" },
                { icon: "chat", label: "WhatsApp", method: "whatsapp" },
              ].map((action) => (
                <button
                  key={action.method}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl bg-surface-container hover:bg-surface-container-high transition-all text-sm font-bold text-on-surface active:scale-95"
                >
                  <span className="material-symbols-outlined text-lg text-primary">{action.icon}</span>
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
