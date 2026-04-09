"use client";

import { useEffect, useState } from "react";
import { MaterialIcon } from "@/components/shared/MaterialIcon";

export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    setIsOffline(!navigator.onLine);
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed top-0 inset-x-0 z-[100] bg-amber-500 text-white text-center py-2 text-sm font-medium flex items-center justify-center gap-2">
      <MaterialIcon icon="cloud_off" size={18} />
      <span>אין חיבור לאינטרנט. הנתונים יסונכרנו אוטומטית כשתתחבר</span>
    </div>
  );
}
