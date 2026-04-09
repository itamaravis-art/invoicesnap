import { openDB, type IDBPDatabase } from "idb";

const DB_NAME = "invoicesnap-offline";
const DB_VERSION = 1;

export interface SyncQueueItem {
  id?: number;
  method: string;
  url: string;
  headers: Record<string, string>;
  body: string | null;
  timestamp: number;
  retryCount: number;
}

export interface LocalReceipt {
  id: string;
  localImage?: Blob;
  dirty: boolean;
  data: Record<string, unknown>;
  createdAt: number;
}

export async function getDB(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("syncQueue")) {
        db.createObjectStore("syncQueue", { keyPath: "id", autoIncrement: true });
      }
      if (!db.objectStoreNames.contains("receipts")) {
        const store = db.createObjectStore("receipts", { keyPath: "id" });
        store.createIndex("byDirty", "dirty");
      }
      if (!db.objectStoreNames.contains("categories")) {
        db.createObjectStore("categories", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("vendors")) {
        db.createObjectStore("vendors", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("metadata")) {
        db.createObjectStore("metadata");
      }
    },
  });
}

export async function addToSyncQueue(item: Omit<SyncQueueItem, "id">): Promise<void> {
  const db = await getDB();
  await db.add("syncQueue", item);

  // Register background sync if available
  if ("serviceWorker" in navigator && "SyncManager" in window) {
    const registration = await navigator.serviceWorker.ready;
    await (registration as unknown as { sync: { register: (tag: string) => Promise<void> } }).sync.register("sync-receipts");
  }
}

export async function getSyncQueue(): Promise<SyncQueueItem[]> {
  const db = await getDB();
  return db.getAll("syncQueue");
}

export async function removeSyncQueueItem(id: number): Promise<void> {
  const db = await getDB();
  await db.delete("syncQueue", id);
}

export async function saveLocalReceipt(receipt: LocalReceipt): Promise<void> {
  const db = await getDB();
  await db.put("receipts", receipt);
}

export async function getLocalReceipts(): Promise<LocalReceipt[]> {
  const db = await getDB();
  return db.getAll("receipts");
}

export async function getDirtyReceipts(): Promise<LocalReceipt[]> {
  const db = await getDB();
  const tx = db.transaction("receipts", "readonly");
  const index = tx.store.index("byDirty");
  return index.getAll(IDBKeyRange.only(1));
}

export async function setMetadata(key: string, value: unknown): Promise<void> {
  const db = await getDB();
  await db.put("metadata", value, key);
}

export async function getMetadata(key: string): Promise<unknown> {
  const db = await getDB();
  return db.get("metadata", key);
}
