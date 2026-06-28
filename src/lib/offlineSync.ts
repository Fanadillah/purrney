import type { GoalSheetRow, TransactionSheetRow } from "./spreadsheetSchema";
import {
  appendGoalContributionToSpreadsheet,
  appendTransactionToSpreadsheet,
  appendTransferToSpreadsheet,
} from "./userSpreadsheet";

export type PendingSpreadsheetWrite =
  | {
      id: string;
      uid: string;
      spreadsheetId: string;
      kind: "transaction";
      transaction: TransactionSheetRow;
      createdAt: string;
      attempts: number;
      lastError: string;
    }
  | {
      id: string;
      uid: string;
      spreadsheetId: string;
      kind: "transfer";
      fromTransaction: TransactionSheetRow;
      toTransaction: TransactionSheetRow;
      createdAt: string;
      attempts: number;
      lastError: string;
    }
  | {
      id: string;
      uid: string;
      spreadsheetId: string;
      kind: "goal_contribution";
      transaction: TransactionSheetRow;
      goal: GoalSheetRow;
      createdAt: string;
      attempts: number;
      lastError: string;
    };

const storageKey = "purrney.pendingSpreadsheetWrites.v1";
const changeEventName = "purrney-pending-sync-change";
let syncInProgress = false;

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function emitPendingChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(changeEventName));
  }
}

export function getPendingSpreadsheetWrites({
  uid,
  spreadsheetId,
}: {
  uid?: string;
  spreadsheetId?: string;
} = {}) {
  if (!canUseStorage()) return [];

  try {
    const rawValue = window.localStorage.getItem(storageKey);
    const items = rawValue ? (JSON.parse(rawValue) as PendingSpreadsheetWrite[]) : [];

    return items.filter((item) => {
      if (uid && item.uid !== uid) return false;
      if (spreadsheetId && item.spreadsheetId !== spreadsheetId) return false;
      return true;
    });
  } catch {
    return [];
  }
}

function savePendingSpreadsheetWrites(items: PendingSpreadsheetWrite[]) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(storageKey, JSON.stringify(items));
  emitPendingChange();
}

export function enqueuePendingSpreadsheetWrite(item: PendingSpreadsheetWrite) {
  const items = getPendingSpreadsheetWrites();
  const exists = items.some((pendingItem) => pendingItem.id === item.id);

  if (exists) return;

  savePendingSpreadsheetWrites([...items, item]);
}

function removePendingSpreadsheetWrite(id: string) {
  const items = getPendingSpreadsheetWrites();
  savePendingSpreadsheetWrites(items.filter((item) => item.id !== id));
}

function updatePendingSpreadsheetWriteError({
  id,
  error,
}: {
  id: string;
  error: string;
}) {
  const items = getPendingSpreadsheetWrites();

  savePendingSpreadsheetWrites(
    items.map((item) =>
      item.id === id
        ? {
            ...item,
            attempts: item.attempts + 1,
            lastError: error,
          }
        : item
    )
  );
}

export function subscribePendingSpreadsheetWrites(listener: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  window.addEventListener(changeEventName, listener);
  window.addEventListener("storage", listener);

  return () => {
    window.removeEventListener(changeEventName, listener);
    window.removeEventListener("storage", listener);
  };
}

export function isRetryableSpreadsheetWriteError(error: unknown) {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return true;
  }

  const message = error instanceof Error ? error.message : String(error);
  return /failed to fetch|network|load failed|timed out/i.test(message);
}

export async function syncPendingSpreadsheetWrites({
  uid,
  spreadsheetId,
  accessToken,
}: {
  uid: string;
  spreadsheetId: string;
  accessToken: string;
}) {
  const result = {
    synced: 0,
    failed: 0,
    lastError: "",
  };

  if (syncInProgress) {
    return result;
  }

  syncInProgress = true;
  const pendingItems = getPendingSpreadsheetWrites({ uid, spreadsheetId });

  try {
    for (const item of pendingItems) {
      try {
        if (item.kind === "transaction") {
          await appendTransactionToSpreadsheet({
            accessToken,
            spreadsheetId,
            transaction: item.transaction,
          });
        } else if (item.kind === "transfer") {
          await appendTransferToSpreadsheet({
            accessToken,
            spreadsheetId,
            fromTransaction: item.fromTransaction,
            toTransaction: item.toTransaction,
          });
        } else {
          await appendGoalContributionToSpreadsheet({
            accessToken,
            spreadsheetId,
            transaction: item.transaction,
            goal: item.goal,
          });
        }

        removePendingSpreadsheetWrite(item.id);
        result.synced += 1;
      } catch (syncError) {
        const message =
          syncError instanceof Error ? syncError.message : "Failed to sync pending write.";

        updatePendingSpreadsheetWriteError({
          id: item.id,
          error: message,
        });
        result.failed += 1;
        result.lastError = message;
        break;
      }
    }
  } finally {
    syncInProgress = false;
  }

  return result;
}
