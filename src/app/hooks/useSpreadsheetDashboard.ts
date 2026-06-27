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
    } catch (loadError) {
      console.error("Error loading spreadsheet dashboard:", loadError);
      const message =
        loadError instanceof Error
          ? loadError.message
          : "Failed to load dashboard from spreadsheet.";

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
