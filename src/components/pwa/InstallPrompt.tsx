"use client";

import { useEffect, useState } from "react";
import { MaterialIcon } from "@/components/shared/MaterialIcon";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  }

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-28 inset-x-4 z-[70] bg-surface-container-lowest rounded-2xl shadow-xl border border-outline-variant p-4 flex items-center gap-4 animate-[slideUp_0.3s_ease-out]">
      <div className="w-12 h-12 rounded-xl bg-primary-container flex items-center justify-center shrink-0">
        <MaterialIcon icon="install_mobile" className="text-on-primary-container" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-on-surface text-sm">התקן את InvoiceSnap על הטלפון</p>
        <p className="text-xs text-on-surface-variant">גישה מהירה מהמסך הראשי, גם בלי אינטרנט</p>
      </div>
      <div className="flex gap-2 shrink-0">
        <button
          onClick={() => setShowPrompt(false)}
          className="text-xs text-on-surface-variant px-3 py-1.5 rounded-full hover:bg-surface-container"
        >
          לא עכשיו
        </button>
        <button
          onClick={handleInstall}
          className="text-xs bg-primary text-on-primary px-4 py-1.5 rounded-full font-bold"
        >
          התקן
        </button>
      </div>
    </div>
  );
}
