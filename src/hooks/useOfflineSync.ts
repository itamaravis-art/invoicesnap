"use client";

import { useEffect, useState, useCallback } from "react";
import { getSyncQueue, removeSyncQueueItem, getDirtyReceipts, saveLocalReceipt, type SyncQueueItem } from "@/lib/offline/db";
import { createClient } from "@/lib/supabase/client";

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      syncNow();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Check pending count
    updatePendingCount();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const updatePendingCount = useCallback(async () => {
    try {
      const queue = await getSyncQueue();
      setPendingCount(queue.length);
    } catch {
      setPendingCount(0);
    }
  }, []);

  const syncNow = useCallback(async () => {
    if (syncing || !navigator.onLine) return;
    setSyncing(true);

    try {
      const queue = await getSyncQueue();
      for (const item of queue) {
        try {
          const response = await fetch(item.url, {
            method: item.method,
            headers: item.headers,
            body: item.body,
          });

          if (response.ok && item.id) {
            await removeSyncQueueItem(item.id);
          }
        } catch {
          break; // Stop on first failure, will retry later
        }
      }
      // Sync locally saved receipts
      try {
        const dirtyReceipts = await getDirtyReceipts();
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user && dirtyReceipts.length > 0) {
          for (const local of dirtyReceipts) {
            try {
              const now = new Date();
              const path = `${user.id}/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}/${local.id}.jpg`;

              // Upload image
              if (local.localImage) {
                await supabase.storage.from("receipts").upload(path, local.localImage, { contentType: local.localImage.type || "image/jpeg" });
              }

              // Create receipt record
              await supabase.from("receipts").insert({
                user_id: user.id,
                image_storage_path: path,
                original_filename: (local.data?.original_filename as string) || "offline-receipt.jpg",
                ocr_status: "pending",
                receipt_type: "receipt",
                currency: "ILS",
                tags: ["offline"],
              });

              // Trigger OCR
              fetch("/api/ocr/process", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ receipt_id: local.id, image_path: path }),
              }).catch(() => {});

              // Mark as synced
              await saveLocalReceipt({ ...local, dirty: false });
            } catch {
              // Will retry next sync
            }
          }
        }
      } catch {
        // IndexedDB not available
      }
    } finally {
      setSyncing(false);
      await updatePendingCount();
    }
  }, [syncing, updatePendingCount]);

  return { isOnline, pendingCount, syncing, syncNow };
}
