"use client";

import { useState, useEffect } from "react";

interface Alert {
  vendor_name: string;
  expected_amount: number | null;
  frequency: string;
}

export function MissingAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    fetch("/api/alerts/missing-receipts")
      .then(r => r.ok ? r.json() : { alerts: [] })
      .then(d => setAlerts(d.alerts || []))
      .catch(() => {});
  }, []);

  if (alerts.length === 0) return null;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-2">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-amber-600 text-lg">notification_important</span>
        <h3 className="font-bold text-amber-900 text-sm">קבלות חסרות החודש</h3>
      </div>
      {alerts.slice(0, 5).map((a, i) => (
        <div key={i} className="flex items-center justify-between py-1">
          <span className="text-sm text-amber-800">{a.vendor_name}</span>
          {a.expected_amount && (
            <span className="text-xs text-amber-600 font-bold">~₪{a.expected_amount.toFixed(0)}</span>
          )}
        </div>
      ))}
      {alerts.length > 5 && (
        <p className="text-xs text-amber-600">ועוד {alerts.length - 5} הוצאות...</p>
      )}
    </div>
  );
}
