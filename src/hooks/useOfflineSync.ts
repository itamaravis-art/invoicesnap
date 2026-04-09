"use client";

import { useEffect, useState, useCallback } from "react";
import { getSyncQueue, removeSyncQueueItem, type SyncQueueItem } from "@/lib/offline/db";

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
    } finally {
      setSyncing(false);
      await updatePendingCount();
    }
  }, [syncing, updatePendingCount]);

  return { isOnline, pendingCount, syncing, syncNow };
}
