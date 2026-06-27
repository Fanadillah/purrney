"use client";

import { useAuth } from "../api/AuthContext";
import { usePendingSpreadsheetSync } from "../hooks/usePendingSpreadsheetSync";

export default function PendingSyncManager() {
  const {
    user,
    registry,
    googleAccessToken,
    markGoogleWorkspaceTokenExpired,
  } = useAuth();

  usePendingSpreadsheetSync({
    uid: user?.uid,
    spreadsheetId: registry?.spreadsheetId,
    accessToken: googleAccessToken,
    onAuthExpired: markGoogleWorkspaceTokenExpired,
  });

  return null;
}
