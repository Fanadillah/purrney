"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../api/AuthContext";
import {
  mapSpreadsheetDataToDashboard,
  readUserSpreadsheet,
  SpreadsheetServiceError,
  type DashboardData,
  type ParsedSpreadsheetData,
} from "@/lib/spreadsheetData";

type DashboardStatus = "idle" | "loading" | "success" | "error";

const emptyDashboard: DashboardData = {
  accounts: [],
  categories: [],
  transactions: [],
  progressData: [],
};

const cachedDashboardPrefix = "purrney.cachedSpreadsheetData.v1";

function getCachedDashboardKey(uid: string, spreadsheetId: string) {
  return `${cachedDashboardPrefix}.${uid}.${spreadsheetId}`;
}

function readCachedSpreadsheetData({
  uid,
  spreadsheetId,
}: {
  uid: string;
  spreadsheetId: string;
}) {
  if (typeof window === "undefined") return null;

  try {
    const rawValue = window.localStorage.getItem(getCachedDashboardKey(uid, spreadsheetId));
    return rawValue ? (JSON.parse(rawValue) as ParsedSpreadsheetData) : null;
  } catch {
    return null;
  }
}

function saveCachedSpreadsheetData({
  uid,
  spreadsheetId,
  data,
}: {
  uid: string;
  spreadsheetId: string;
  data: ParsedSpreadsheetData;
}) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(getCachedDashboardKey(uid, spreadsheetId), JSON.stringify(data));
  } catch {
    // Cache failures should never block the source-of-truth spreadsheet flow.
  }
}

export function useSpreadsheetDashboard() {
  const {
    user,
    registry,
    googleAccessToken,
    googleWorkspacePermissionStatus,
    reconnectGoogleWorkspace,
    markGoogleWorkspaceTokenExpired,
  } = useAuth();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [dashboardSpreadsheetId, setDashboardSpreadsheetId] = useState<string | null>(null);
  const [sourceData, setSourceData] = useState<ParsedSpreadsheetData | null>(null);
  const [status, setStatus] = useState<DashboardStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  const loadDashboard = useCallback(async () => {
    const spreadsheetId = registry?.spreadsheetId ?? "";
    const accessToken = googleAccessToken ?? "";

    if (!user || !spreadsheetId || !accessToken) {
      return;
    }

    setStatus("loading");
    setError(null);
    setWarnings([]);

    try {
      const spreadsheetData = await readUserSpreadsheet({
        accessToken,
        spreadsheetId,
      });
      const mappedDashboard = mapSpreadsheetDataToDashboard(spreadsheetData);

      setDashboard(mappedDashboard);
      setSourceData(spreadsheetData);
      setDashboardSpreadsheetId(spreadsheetId);
      setWarnings(spreadsheetData.warnings);
      setStatus("success");
      saveCachedSpreadsheetData({
        uid: user.uid,
        spreadsheetId,
        data: spreadsheetData,
      });
    } catch (loadError) {
      console.error("Error loading spreadsheet dashboard:", loadError);
      const message =
        loadError instanceof Error
          ? loadError.message
          : "Failed to load dashboard from spreadsheet.";
      const cachedSpreadsheetData = readCachedSpreadsheetData({
        uid: user.uid,
        spreadsheetId,
      });

      if (cachedSpreadsheetData) {
        setDashboard(mapSpreadsheetDataToDashboard(cachedSpreadsheetData));
        setSourceData(cachedSpreadsheetData);
        setDashboardSpreadsheetId(spreadsheetId);
        setWarnings(cachedSpreadsheetData.warnings);
        setStatus("success");
        setError("Showing the last saved data on this device. Reconnect to refresh from Google Sheets.");
        return;
      }

      setStatus("error");
      setDashboardSpreadsheetId(spreadsheetId);
      setError(message);

      if (
        loadError instanceof SpreadsheetServiceError &&
        loadError.code === "google_api_error" &&
        /^(401|403)\b/.test(loadError.message)
      ) {
        markGoogleWorkspaceTokenExpired();
      }
    }
  }, [googleAccessToken, markGoogleWorkspaceTokenExpired, registry?.spreadsheetId, user]);

  useEffect(() => {
    if (!user || !registry?.spreadsheetId || !googleAccessToken) {
      return;
    }
    let ignore = false;

    async function loadIfCurrent() {
      await loadDashboard();
    }

    if (!ignore) {
      void loadIfCurrent();
    }

    return () => {
      ignore = true;
    };
  }, [googleAccessToken, loadDashboard, registry?.spreadsheetId, user]);

  useEffect(() => {
    if (!user || !registry?.spreadsheetId || googleAccessToken) {
      return;
    }

    const timeout = window.setTimeout(() => {
      const cachedSpreadsheetData = readCachedSpreadsheetData({
        uid: user.uid,
        spreadsheetId: registry.spreadsheetId as string,
      });

      if (!cachedSpreadsheetData || !registry?.spreadsheetId) {
        return;
      }

      setDashboard(mapSpreadsheetDataToDashboard(cachedSpreadsheetData));
      setSourceData(cachedSpreadsheetData);
      setDashboardSpreadsheetId(registry.spreadsheetId);
      setWarnings(cachedSpreadsheetData.warnings);
      setStatus("success");
      setError("Showing the last saved data on this device. Reconnect to refresh from Google Sheets.");
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [googleAccessToken, registry?.spreadsheetId, user]);

  const activeDashboard = useMemo(() => {
    if (
      dashboard &&
      dashboardSpreadsheetId === registry?.spreadsheetId
    ) {
      return dashboard;
    }

    return emptyDashboard;
  }, [dashboard, dashboardSpreadsheetId, registry?.spreadsheetId]);
  const activeWarnings =
    dashboardSpreadsheetId === registry?.spreadsheetId ? warnings : [];
  const activeError =
    dashboardSpreadsheetId === registry?.spreadsheetId ? error : null;

  return {
    dashboard: activeDashboard,
    sourceData:
      dashboardSpreadsheetId === registry?.spreadsheetId ? sourceData : null,
    status,
    error: activeError,
    warnings: activeWarnings,
    needsReconnect:
      Boolean(user && registry?.spreadsheetId) &&
      googleWorkspacePermissionStatus !== "granted",
    hasNoSpreadsheet: Boolean(user && !registry?.spreadsheetId),
    isEmpty:
      Boolean(user) &&
      status === "success" &&
      activeDashboard.transactions.length === 0,
    reconnectGoogleWorkspace,
    reload: loadDashboard,
  };
}
