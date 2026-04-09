import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: settings } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", user.id)
    .single();

  const { data: driveConnection } = await supabase
    .from("gdrive_connections")
    .select("google_email, is_active")
    .eq("user_id", user.id)
    .maybeSingle();

  const settingsItems = [
    {
      icon: "person",
      title: "פרופיל עסקי",
      subtitle: settings?.business_name || "עדיין לא הוגדר",
      href: "/settings",
    },
    {
      icon: "contact_mail",
      title: "רואי חשבון",
      subtitle: "ניהול אנשי קשר",
      href: "/settings/accountants",
    },
    {
      icon: "cloud",
      title: "Google Drive",
      subtitle: driveConnection?.is_active ? `מחובר: ${driveConnection.google_email}` : "עדיין לא מחובר",
      href: "/settings/gdrive",
    },
  ];

  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-black text-on-surface">הגדרות</h2>

      <div className="space-y-3">
        {settingsItems.map((item) => (
          <Link
            key={item.href + item.icon}
            href={item.href}
            className="bg-surface-container-lowest hover:bg-surface-bright transition-all p-4 rounded-3xl flex items-center gap-4"
          >
            <div className="w-12 h-12 bg-surface-container-high rounded-full flex items-center justify-center text-primary">
              <span className="material-symbols-outlined">{item.icon}</span>
            </div>
            <div className="flex-1">
              <p className="font-bold text-on-surface">{item.title}</p>
              <p className="text-xs text-on-surface-variant">{item.subtitle}</p>
            </div>
            <span className="material-symbols-outlined text-outline">chevron_left</span>
          </Link>
        ))}
      </div>

      <div className="pt-4">
        <form action="/api/auth/signout" method="POST">
          <button
            type="submit"
            className="w-full border-2 border-error text-error py-3 rounded-full font-bold hover:bg-error-container transition-all active:scale-[0.98]"
          >
            התנתק מהחשבון
          </button>
        </form>
      </div>
    </section>
  );
}
