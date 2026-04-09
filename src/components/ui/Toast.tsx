"use client";

import { useEffect, useState, createContext, useContext, useCallback } from "react";
import { MaterialIcon } from "@/components/shared/MaterialIcon";
import { cn } from "@/lib/utils";

interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

interface ToastContextValue {
  showToast: (message: string, type?: Toast["type"]) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: Toast["type"] = "info") => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-4 inset-x-4 z-[200] flex flex-col gap-2 items-center pointer-events-none">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 3000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const icons = { success: "check_circle", error: "error", info: "info" };

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "pointer-events-auto px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm font-medium animate-[slideDown_0.3s_ease-out]",
        {
          "bg-secondary-container text-on-secondary-container": toast.type === "success",
          "bg-error-container text-on-error-container": toast.type === "error",
          "bg-surface-container-highest text-on-surface": toast.type === "info",
        }
      )}
    >
      <MaterialIcon icon={icons[toast.type]} size={20} />
      <span>{toast.message}</span>
    </div>
  );
}
