import { verifyAdmin } from "@/lib/admin";
import { redirect, notFound } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { authorized, adminClient } = await verifyAdmin();
  if (!authorized || !adminClient) redirect("/dashboard");

  // Get user from auth
  const { data: { user: authUser }, error } = await adminClient.auth.admin.getUserById(id);
  if (error || !authUser) notFound();

  // Get settings
  const { data: settings } = await adminClient
    .from("user_settings")
    .select("*")
    .eq("user_id", id)
    .maybeSingle();

  // Get receipts
  const { data: receipts } = await adminClient
    .from("receipts")
    .select("*, category:categories(name_he)")
    .eq("user_id", id)
    .eq("is_archived", false)
    .order("created_at", { ascending: false })
    .limit(20);

  // Get accountants
  const { data: accountants } = await adminClient
    .from("accountant_contacts")
    .select("*")
    .eq("user_id", id);

  // Get drive connection
  const { data: drive } = await adminClient
    .from("gdrive_connections")
    .select("google_email, is_active, last_sync_at")
    .eq("user_id", id)
    .maybeSingle();

  const totalAmount = (receipts || []).reduce((sum, r) => sum + (r.total_amount || 0), 0);
  const totalVat = (receipts || []).reduce((sum, r) => sum + (r.vat_amount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/admin/users" className="text-blue-600 text-sm font-bold flex items-center gap-1">
          <span className="material-symbols-outlined text-lg">arrow_forward</span>
          משתמשים
        </Link>
      </div>

      {/* User header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-black text-slate-900">
              {settings?.display_name || authUser.email?.split("@")[0]}
            </h1>
            <p className="text-slate-500" dir="ltr">{authUser.email}</p>
            {settings?.business_name && (
              <p className="text-sm text-slate-700 mt-1">{settings.business_name}</p>
            )}
          </div>
          <span className={`text-xs px-3 py-1 rounded-full font-bold ${
            settings?.onboarding_completed
              ? "bg-emerald-100 text-emerald-700"
              : "bg-amber-100 text-amber-700"
          }`}>
            {settings?.onboarding_completed ? "פעיל" : "onboarding"}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-slate-50 rounded-xl p-3 text-center">
            <p className="text-2xl font-black text-slate-900">{receipts?.length || 0}</p>
            <p className="text-xs text-slate-500">קבלות</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 text-center">
            <p className="text-2xl font-black text-slate-900">{formatCurrency(totalAmount)}</p>
            <p className="text-xs text-slate-500">סה&quot;כ</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 text-center">
            <p className="text-2xl font-black text-slate-900">{formatCurrency(totalVat)}</p>
            <p className="text-xs text-slate-500">מע&quot;מ</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 text-center">
            <p className="text-2xl font-black text-slate-900">
              {drive?.is_active ? "מחובר" : "לא"}
            </p>
            <p className="text-xs text-slate-500">Drive</p>
          </div>
        </div>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h3 className="font-bold text-slate-900 mb-3">פרטים</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-slate-500">ח.פ</dt><dd className="font-medium">{settings?.business_id || "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">מע&quot;מ</dt><dd className="font-medium">{settings?.vat_rate || 17}%</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">מטבע</dt><dd className="font-medium">{settings?.currency || "ILS"}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">תקציב</dt><dd className="font-medium">{settings?.monthly_budget ? formatCurrency(settings.monthly_budget) : "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">הצטרף</dt><dd className="font-medium">{new Date(authUser.created_at).toLocaleDateString("he-IL")}</dd></div>
          </dl>
        </div>

        {/* Accountants */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h3 className="font-bold text-slate-900 mb-3">רואי חשבון ({accountants?.length || 0})</h3>
          <div className="space-y-2">
            {(accountants || []).map((a) => (
              <div key={a.id} className="bg-slate-50 rounded-lg p-2">
                <p className="text-sm font-bold">{a.name}</p>
                {a.email && <p className="text-xs text-slate-500" dir="ltr">{a.email}</p>}
              </div>
            ))}
            {(!accountants || accountants.length === 0) && (
              <p className="text-sm text-slate-400">אין רואי חשבון</p>
            )}
          </div>
        </div>

        {/* Drive */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h3 className="font-bold text-slate-900 mb-3">Google Drive</h3>
          {drive ? (
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-slate-500">חשבון</dt><dd className="font-medium" dir="ltr">{drive.google_email}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">סטטוס</dt><dd className={drive.is_active ? "text-emerald-600 font-bold" : "text-red-600 font-bold"}>{drive.is_active ? "פעיל" : "מנותק"}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">סנכרון אחרון</dt><dd className="font-medium">{drive.last_sync_at ? new Date(drive.last_sync_at).toLocaleString("he-IL") : "—"}</dd></div>
            </dl>
          ) : (
            <p className="text-sm text-slate-400">לא מחובר</p>
          )}
        </div>
      </div>

      {/* Receipts */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <h3 className="font-bold text-slate-900 mb-4">קבלות אחרונות ({receipts?.length || 0})</h3>
        <div className="divide-y divide-slate-100">
          {(receipts || []).map((r) => (
            <div key={r.id} className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-bold text-slate-900">{r.vendor_name || "ספק לא ידוע"}</p>
                <p className="text-xs text-slate-500">
                  {r.receipt_date ? new Date(r.receipt_date).toLocaleDateString("he-IL") : "—"}
                  {(r.category as { name_he?: string } | null)?.name_he && ` · ${(r.category as { name_he: string }).name_he}`}
                </p>
              </div>
              <div className="text-end">
                <p className="font-bold text-sm">{r.total_amount ? formatCurrency(r.total_amount) : "—"}</p>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  r.ocr_status === "completed" ? "bg-emerald-100 text-emerald-700" :
                  r.ocr_status === "failed" ? "bg-red-100 text-red-700" :
                  "bg-amber-100 text-amber-700"
                }`}>{r.ocr_status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
