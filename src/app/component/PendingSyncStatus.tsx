"use client";

type PendingSyncStatusProps = {
  pendingCount: number;
  syncStatus: "idle" | "syncing" | "success" | "error";
  syncMessage: string | null;
  onRetry: () => void;
};

export default function PendingSyncStatus({
  pendingCount,
  syncStatus,
  syncMessage,
  onRetry,
}: PendingSyncStatusProps) {
  if (pendingCount === 0 && !syncMessage) {
    return null;
  }

  const toneClass =
    syncStatus === "success"
      ? "bg-green-50 text-money-in"
      : syncStatus === "error"
        ? "bg-red-50 text-money-out"
        : "bg-yellow-50 text-deep-slate";

  return (
    <div className={`rounded-md p-3 text-sm shadow ${toneClass}`}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold">
            {pendingCount > 0
              ? `${pendingCount} pending transaction${pendingCount === 1 ? "" : "s"}`
              : "Pending sync"}
          </p>
          {syncMessage ? <p className="mt-1">{syncMessage}</p> : null}
        </div>
        {pendingCount > 0 ? (
          <button
            type="button"
            onClick={onRetry}
            disabled={syncStatus === "syncing"}
            className="rounded-md bg-soft-orange px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
          >
            {syncStatus === "syncing" ? "Syncing..." : "Retry Sync"}
          </button>
        ) : null}
      </div>
    </div>
  );
}
