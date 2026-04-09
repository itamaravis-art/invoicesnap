"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface DriveStatus {
  connected: boolean;
  email: string | null;
  lastSync: string | null;
  lastError: string | null;
  unsyncedCount: number;
}

export default function GDriveSettingsPage() {
  const [status, setStatus] = useState<DriveStatus | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatus();
  }, []);

  async function fetchStatus() {
    try {
      const res = await fetch("/api/gdrive/status");
      if (res.ok) setStatus(await res.json());
    } finally {
      setLoading(false);
    }
  }

  async function handleSync() {
    setSyncing(true);
    try {
      await fetch("/api/gdrive/sync", { method: "POST" });
      await fetchStatus();
    } finally {
      setSyncing(false);
    }
  }

  async function handleDisconnect() {
    if (!confirm("בטוח שאתה רוצה לנתק את Google Drive?")) return;
    await fetch("/api/auth/gdrive/disconnect", { method: "POST" });
    await fetchStatus();
  }

  if (loading) {
    return (
      <section className="space-y-6">
        <div className="flex items-center gap-2">
          <Link href="/settings" className="text-primary font-bold text-sm flex items-center gap-1">
            <span className="material-symbols-outlined text-lg">arrow_forward</span>
            הגדרות
          </Link>
        </div>
        <h2 className="text-2xl font-black text-on-surface">Google Drive</h2>
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/settings" className="text-primary font-bold text-sm flex items-center gap-1">
          <span className="material-symbols-outlined text-lg">arrow_forward</span>
          הגדרות
        </Link>
      </div>
      <h2 className="text-2xl font-black text-on-surface">Google Drive</h2>

      <div className="bg-surface-container-lowest rounded-3xl p-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
            status?.connected ? "bg-secondary-container" : "bg-surface-container-high"
          }`}>
            <span className="material-symbols-outlined text-2xl">
              {status?.connected ? "cloud_done" : "cloud_off"}
            </span>
          </div>
          <div className="flex-1">
            <p className="font-bold text-on-surface">
              {status?.connected ? "מחובר ופעיל" : "עדיין לא מחובר"}
            </p>
            {status?.email && (
              <p className="text-sm text-on-surface-variant">{status.email}</p>
            )}
          </div>
        </div>

        {status?.connected ? (
          <>
            <div className="h-px bg-outline-variant" />

            <div className="space-y-3">
              {status.unsyncedCount > 0 && (
                <div className="flex items-center justify-between bg-tertiary-container/30 rounded-xl p-3">
                  <span className="text-sm text-on-surface">
                    {status.unsyncedCount} קבלות ממתינות לסנכרון
                  </span>
                  <button
                    onClick={handleSync}
                    disabled={syncing}
                    className="bg-primary text-on-primary px-4 py-1.5 rounded-full text-xs font-bold disabled:opacity-50"
                  >
                    {syncing ? "מסנכרן..." : "סנכרן עכשיו"}
                  </button>
                </div>
              )}

              {status.lastSync && (
                <p className="text-xs text-on-surface-variant">
                  סנכרון אחרון: {new Date(status.lastSync).toLocaleString("he-IL")}
                </p>
              )}

              {status.lastError && (
                <div className="bg-error-container rounded-xl p-3">
                  <p className="text-xs text-on-error-container">{status.lastError}</p>
                </div>
              )}
            </div>

            <div className="h-px bg-outline-variant" />

            <button
              onClick={handleDisconnect}
              className="w-full border-2 border-error text-error py-2.5 rounded-full text-sm font-bold hover:bg-error-container transition-all active:scale-[0.98]"
            >
              נתק את Google Drive
            </button>
          </>
        ) : (
          <>
            <p className="text-sm text-on-surface-variant">
              חבר את Google Drive כדי לגבות את כל הקבלות שלך אוטומטית בתיקייה מסודרת לפי חודשים.
            </p>
            <a
              href="/api/auth/gdrive/connect"
              className="w-full bg-primary text-on-primary py-3 rounded-full font-bold text-center block hover:bg-primary/90 transition-all active:scale-[0.98]"
            >
              <span className="flex items-center justify-center gap-2">
                <span className="material-symbols-outlined">cloud_upload</span>
                חבר את Google Drive לגיבוי
              </span>
            </a>
          </>
        )}
      </div>

      <div className="bg-surface-container-lowest rounded-3xl p-6">
        <h3 className="font-bold text-on-surface mb-3">איך זה עובד?</h3>
        <ul className="space-y-2 text-sm text-on-surface-variant">
          <li className="flex items-start gap-2">
            <span className="material-symbols-outlined text-primary text-lg mt-0.5">folder</span>
            <span>ניצור תיקיית InvoiceSnap ב-Drive שלך</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="material-symbols-outlined text-primary text-lg mt-0.5">calendar_month</span>
            <span>כל קבלה נשמרת בתיקייה לפי שנה וחודש</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="material-symbols-outlined text-primary text-lg mt-0.5">sync</span>
            <span>כל קבלה חדשה תסונכרן אוטומטית</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="material-symbols-outlined text-primary text-lg mt-0.5">share</span>
            <span>תוכל לשתף תיקייה חודשית עם רואה החשבון</span>
          </li>
        </ul>
      </div>
    </section>
  );
}
