import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const adminEmail = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  if (!user || user.email?.toLowerCase() !== adminEmail) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen bg-surface" dir="rtl">
      <AdminSidebar userEmail={user.email || ""} />
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
