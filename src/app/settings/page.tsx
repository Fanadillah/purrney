"use client";

import { useAuth } from "@/app/api/AuthContext";
import AuthGate from "@/app/component/AuthGate";
import BottomNav from "@/app/component/BottomNav";
import PendingSyncStatus from "@/app/component/PendingSyncStatus";
import { usePendingSpreadsheetSync } from "@/app/hooks/usePendingSpreadsheetSync";
import { useSpreadsheetDashboard } from "@/app/hooks/useSpreadsheetDashboard";
import { getSpreadsheetUrl } from "@/lib/userSpreadsheet";
import { Database, LogOut, RefreshCw, Sheet, Smartphone, UserRound } from "lucide-react";
import Image from "next/image";

function SettingRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-deep-slate/10 py-3 last:border-b-0">
      <p className="text-sm text-deep-slate/60">{label}</p>
      <p className="break-all text-right text-sm font-semibold text-deep-slate">{value}</p>
    </div>
  );
}

export default function SettingsPage() {
  const {
    user,
    registry,
    loading,
    error: authError,
    googleAccessToken,
    googleWorkspacePermissionStatus,
    reconnectGoogleWorkspace,
    ensureUserSpreadsheet,
    spreadsheetBootstrapping,
    spreadsheetError,
    logOut,
  } = useAuth();
  const { reload, status, error: spreadsheetLoadError } = useSpreadsheetDashboard();
  const {
    pendingCount,
    syncStatus,
    syncMessage,
    syncNow,
  } = usePendingSpreadsheetSync({
    uid: user?.uid,
    spreadsheetId: registry?.spreadsheetId,
    accessToken: googleAccessToken,
    onSynced: reload,
  });
  const spreadsheetUrl =
    registry?.spreadsheetUrl ??
    (registry?.spreadsheetId ? getSpreadsheetUrl(registry.spreadsheetId) : "");
  const connectionLabel = registry?.spreadsheetId
    ? googleWorkspacePermissionStatus === "granted"
      ? "Connected"
      : "Needs reconnect"
    : "No spreadsheet";

  return (
    <AuthGate>
      <div className="min-h-screen bg-app-background pb-28 md:pl-20 md:pb-8">
        <header className="rounded-b-lg bg-warm-cream p-4 shadow-lg md:mx-auto md:mt-4 md:max-w-5xl md:rounded-lg">
          <h1 className="text-2xl font-bold text-deep-slate">Settings</h1>
          <p className="text-sm text-deep-slate/60">Account, spreadsheet, and app controls</p>
        </header>

        <main className="mx-auto grid max-w-5xl gap-4 p-4 lg:grid-cols-2">
          <section className="rounded-lg bg-warm-cream p-4 shadow-md lg:col-span-2">
            <div className="mb-4 flex items-center gap-2">
              <UserRound size={18} className="text-soft-orange" />
              <h2 className="text-lg font-bold text-deep-slate">Profile</h2>
            </div>
            <div className="flex items-center gap-4">
              {user?.photoURL ? (
                <Image
                  src={user.photoURL}
                  alt={user.displayName ?? "Profile"}
                  width={64}
                  height={64}
                  unoptimized
                  className="h-16 w-16 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-soft-orange text-xl font-bold text-white">
                  {user?.displayName?.charAt(0).toUpperCase() ?? "P"}
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate text-lg font-bold text-deep-slate">
                  {loading ? "Loading..." : user?.displayName ?? "Guest"}
                </p>
                <p className="truncate text-sm text-deep-slate/60">{user?.email ?? "Not signed in"}</p>
              </div>
            </div>
            {authError ? (
              <p className="mt-3 rounded-md bg-red-50 p-3 text-sm text-money-out">{authError}</p>
            ) : null}
          </section>

          <section className="rounded-lg bg-warm-cream p-4 shadow-md lg:col-span-2">
            <div className="mb-4 flex items-center gap-2">
              <Sheet size={18} className="text-soft-orange" />
              <h2 className="text-lg font-bold text-deep-slate">Spreadsheet Connection</h2>
            </div>
            <div className="space-y-2">
              <SettingRow label="Status" value={connectionLabel} />
              <SettingRow label="Spreadsheet ID" value={registry?.spreadsheetId ?? "-"} />
              <SettingRow label="Schema Version" value={registry?.schemaVersion ?? "-"} />
            </div>
            {spreadsheetError || spreadsheetLoadError ? (
              <p className="mt-3 rounded-md bg-red-50 p-3 text-sm text-money-out">
                {spreadsheetError ?? spreadsheetLoadError}
              </p>
            ) : null}
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              {spreadsheetUrl ? (
                <a
                  href={spreadsheetUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 rounded-md bg-soft-orange px-4 py-2 text-sm font-semibold text-white"
                >
                  <Sheet size={16} /> Open Spreadsheet
                </a>
              ) : (
                <button
                  type="button"
                  onClick={() => void ensureUserSpreadsheet()}
                  disabled={spreadsheetBootstrapping}
                  className="flex items-center justify-center gap-2 rounded-md bg-soft-orange px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  <Sheet size={16} />
                  {spreadsheetBootstrapping ? "Creating..." : "Create Spreadsheet"}
                </button>
              )}
              <button
                type="button"
                onClick={() => void reconnectGoogleWorkspace()}
                className="flex items-center justify-center gap-2 rounded-md border border-soft-orange px-4 py-2 text-sm font-semibold text-soft-orange"
              >
                <RefreshCw size={16} /> Reconnect
              </button>
              <button
                type="button"
                onClick={() => void reload()}
                disabled={status === "loading"}
                className="flex items-center justify-center gap-2 rounded-md border border-deep-slate/20 px-4 py-2 text-sm font-semibold text-deep-slate disabled:opacity-50"
              >
                <RefreshCw size={16} /> Refresh Data
              </button>
            </div>
          </section>

          <section className="rounded-lg bg-warm-cream p-4 shadow-md">
            <div className="mb-4 flex items-center gap-2">
              <Database size={18} className="text-soft-orange" />
              <h2 className="text-lg font-bold text-deep-slate">App Preferences</h2>
            </div>
            <SettingRow label="Currency" value="IDR" />
            <SettingRow label="Timezone" value="Asia/Jakarta" />
            <SettingRow label="Storage" value="Google Spreadsheet" />
          </section>

          <section className="rounded-lg bg-warm-cream p-4 shadow-md">
            <div className="mb-4 flex items-center gap-2">
              <Smartphone size={18} className="text-soft-orange" />
              <h2 className="text-lg font-bold text-deep-slate">PWA And Offline</h2>
            </div>
            <p className="text-sm leading-6 text-deep-slate/70">
              Purrney can be installed from your browser menu. The app shell can open offline,
              but spreadsheet reads and writes still need an internet connection.
            </p>
          </section>

          <section className="rounded-lg bg-warm-cream p-4 shadow-md lg:col-span-2">
            <h2 className="text-lg font-bold text-deep-slate">Pending Sync</h2>
            <p className="mb-3 mt-1 text-sm text-deep-slate/60">
              Offline transactions are stored on this device until Google Sheets can be reached.
            </p>
            <PendingSyncStatus
              pendingCount={pendingCount}
              syncStatus={syncStatus}
              syncMessage={syncMessage}
              onRetry={() => void syncNow()}
            />
            {pendingCount === 0 && !syncMessage ? (
              <p className="rounded-md bg-green-50 p-3 text-sm text-money-in">
                No pending transactions on this device.
              </p>
            ) : null}
          </section>

          <section className="rounded-lg bg-white p-4 shadow-md lg:col-span-2">
            <h2 className="text-lg font-bold text-deep-slate">Account Actions</h2>
            <button
              type="button"
              onClick={() => void logOut()}
              className="mt-4 flex items-center justify-center gap-2 rounded-md border border-money-out px-4 py-2 text-sm font-semibold text-money-out"
            >
              <LogOut size={16} /> Sign Out
            </button>
          </section>
        </main>

        <BottomNav />
      </div>
    </AuthGate>
  );
}
