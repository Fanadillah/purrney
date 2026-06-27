"use client";

import { useAuth } from "../api/AuthContext";

export default function GoogleWorkspaceStatus() {
  const {
    user,
    registry,
    googleWorkspacePermissionStatus,
    spreadsheetBootstrapping,
    spreadsheetBootstrapStep,
    spreadsheetError,
    reconnectGoogleWorkspace,
    ensureUserSpreadsheet,
  } = useAuth();

  if (!user) return null;

  const hasPermission = googleWorkspacePermissionStatus === "granted";
  const spreadsheetUrl = registry?.spreadsheetUrl;
  const hasSpreadsheet = Boolean(registry?.spreadsheetId);
  const bootstrapMessage =
    spreadsheetBootstrapStep === "creating_spreadsheet"
      ? "Creating spreadsheet file in Google Drive..."
      : spreadsheetBootstrapStep === "writing_default_sheets"
      ? "Writing default sheets, headers, and starter data..."
      : spreadsheetBootstrapStep === "saving_registry"
      ? "Saving spreadsheet link to Firestore..."
      : "Creating your Purrney spreadsheet...";

  return (
    <div className="mt-3 space-y-2 text-sm">
      <div
        className={`rounded-md p-3 ${
          hasPermission
            ? "bg-green-50 text-money-in"
            : "bg-orange-50 text-deep-slate"
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <p>
            {hasPermission
              ? "Google Sheets access is connected for this session."
              : "Google Sheets access needs to be reconnected before syncing spreadsheets."}
          </p>
          {!hasPermission ? (
            <button
              type="button"
              onClick={() => void reconnectGoogleWorkspace()}
              className="shrink-0 rounded-md bg-soft-orange px-3 py-2 text-xs font-semibold text-white"
            >
              Reconnect
            </button>
          ) : null}
        </div>
      </div>

      {hasPermission ? (
        <div className="rounded-md bg-white/70 p-3 text-deep-slate">
          <div className="flex items-center justify-between gap-3">
            <p>
              {spreadsheetBootstrapping
                ? bootstrapMessage
                : hasSpreadsheet
                ? "Your Purrney spreadsheet is ready."
                : "Your Purrney spreadsheet has not been created yet."}
            </p>
            {spreadsheetUrl ? (
              <a
                href={spreadsheetUrl}
                target="_blank"
                rel="noreferrer"
                className="shrink-0 rounded-md border border-soft-orange px-3 py-2 text-xs font-semibold text-soft-orange"
              >
                Open
              </a>
            ) : !hasSpreadsheet && !spreadsheetBootstrapping ? (
              <button
                type="button"
                onClick={() => void ensureUserSpreadsheet()}
                className="shrink-0 rounded-md bg-soft-orange px-3 py-2 text-xs font-semibold text-white"
              >
                Create
              </button>
            ) : null}
          </div>

          {spreadsheetError ? (
            <div className="mt-3 rounded-md bg-red-50 p-3 text-money-out">
              <p>{spreadsheetError}</p>
              <button
                type="button"
                onClick={() => void ensureUserSpreadsheet()}
                className="mt-2 rounded-md bg-soft-orange px-3 py-2 text-xs font-semibold text-white"
              >
                Try again
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
