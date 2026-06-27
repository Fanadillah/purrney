"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getPendingSpreadsheetWrites,
  subscribePendingSpreadsheetWrites,
  syncPendingSpreadsheetWrites,
  type PendingSpreadsheetWrite,
} from "@/lib/offlineSync";

type SyncStatus = "idle" | "syncing" | "success" | "error";

export function usePendingSpreadsheetSync({
  uid,
  spreadsheetId,
  accessToken,
  onSynced,
  onAuthExpired,
}: {
  uid?: string;
  spreadsheetId?: string | null;
  accessToken?: string | null;
  onSynced?: () => Promise<void> | void;
  onAuthExpired?: () => void;
}) {
  const [pendingItems, setPendingItems] = useState<PendingSpreadsheetWrite[]>([]);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const loadPendingItems = useCallback(() => {
    setPendingItems(getPendingSpreadsheetWrites({ uid, spreadsheetId: spreadsheetId ?? undefined }));
  }, [spreadsheetId, uid]);

  useEffect(() => {
    const timeout = window.setTimeout(loadPendingItems, 0);
    const unsubscribe = subscribePendingSpreadsheetWrites(loadPendingItems);

    return () => {
      window.clearTimeout(timeout);
      unsubscribe();
    };
  }, [loadPendingItems]);

  const syncNow = useCallback(async () => {
    if (!uid || !spreadsheetId || !accessToken) {
      setSyncStatus("error");
      setSyncMessage("Reconnect Google Sheets access to sync pending transactions.");
      return;
    }

    const currentPendingItems = getPendingSpreadsheetWrites({ uid, spreadsheetId });
    if (currentPendingItems.length === 0) {
      setSyncStatus("idle");
      setSyncMessage(null);
      return;
    }

    try {
      setSyncStatus("syncing");
      setSyncMessage("Syncing pending transactions...");
      const result = await syncPendingSpreadsheetWrites({
        uid,
        spreadsheetId,
        accessToken,
      });

      loadPendingItems();

      if (result.failed > 0) {
        setSyncStatus("error");
        setSyncMessage(result.lastError || "Some pending transactions failed to sync.");

        if (/^(401|403)\b/.test(result.lastError)) {
          onAuthExpired?.();
        }
        return;
      }

      setSyncStatus("success");
      setSyncMessage(`${result.synced} pending transaction${result.synced === 1 ? "" : "s"} synced.`);
      await onSynced?.();
    } catch (syncError) {
      const message =
        syncError instanceof Error ? syncError.message : "Failed to sync pending transactions.";
      setSyncStatus("error");
      setSyncMessage(message);

      if (/^(401|403)\b/.test(message)) {
        onAuthExpired?.();
      }
    }
  }, [accessToken, loadPendingItems, onAuthExpired, onSynced, spreadsheetId, uid]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOnline = () => {
      void syncNow();
    };

    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [syncNow]);

  useEffect(() => {
    if (!accessToken || pendingItems.length === 0) return;
    if (typeof navigator !== "undefined" && !navigator.onLine) return;
    const timeout = window.setTimeout(() => {
      void syncNow();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [accessToken, pendingItems.length, syncNow]);

  return {
    pendingItems,
    pendingCount: pendingItems.length,
    syncStatus,
    syncMessage,
    syncNow,
    reloadPendingItems: loadPendingItems,
  };
}
