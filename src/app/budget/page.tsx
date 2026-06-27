"use client";

import AuthGate from "@/app/component/AuthGate";
import BottomNav from "@/app/component/BottomNav";
import { useAuth } from "@/app/api/AuthContext";
import { useSpreadsheetDashboard } from "@/app/hooks/useSpreadsheetDashboard";
import {
  appendBudgetToSpreadsheet,
  createBudgetRow,
} from "@/lib/userSpreadsheet";
import type { BudgetPeriodType } from "@/lib/spreadsheetSchema";
import Image from "next/image";
import { useState } from "react";

function formatRupiah(value: string) {
  const rawValue = value.replace(/\D/g, "");
  return rawValue.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export default function BudgetPage() {
  const { registry, googleAccessToken, markGoogleWorkspaceTokenExpired } = useAuth();
  const {
    sourceData,
    dashboard,
    status,
    error,
    needsReconnect,
    hasNoSpreadsheet,
    reconnectGoogleWorkspace,
    reload,
  } = useSpreadsheetDashboard();
  const expenseCategories =
    sourceData?.categories.filter(
      (category) => category.isActive && category.kind === "expense"
    ) ?? [];
  const [categoryValue, setCategoryValue] = useState("");
  const [periodType, setPeriodType] = useState<BudgetPeriodType>("monthly");
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7));
  const [amountMax, setAmountMax] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "saving" | "success" | "error">("idle");

  const numericAmount = Number(amountMax.replace(/\D/g, ""));
  const canSubmit =
    Boolean(categoryValue) &&
    Boolean(period) &&
    numericAmount > 0 &&
    Boolean(registry?.spreadsheetId) &&
    Boolean(googleAccessToken) &&
    submitStatus !== "saving";

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!googleAccessToken || !registry?.spreadsheetId) {
      setSubmitStatus("error");
      setMessage("Reconnect Google Sheets access before saving a budget.");
      return;
    }

    try {
      setSubmitStatus("saving");
      setMessage(null);
      const budget = createBudgetRow({
        categoryValue,
        periodType,
        period,
        amountMax: numericAmount,
      });

      await appendBudgetToSpreadsheet({
        accessToken: googleAccessToken,
        spreadsheetId: registry.spreadsheetId,
        budget,
      });

      setSubmitStatus("success");
      setMessage("Budget saved to your spreadsheet.");
      setAmountMax("");
      await reload();
    } catch (saveError) {
      console.error("Error saving budget:", saveError);
      const errorMessage =
        saveError instanceof Error ? saveError.message : "Failed to save budget.";
      setSubmitStatus("error");
      setMessage(errorMessage);

      if (/^(401|403)\b/.test(errorMessage)) {
        markGoogleWorkspaceTokenExpired();
      }
    }
  };

  return (
    <AuthGate>
      <div className="min-h-screen bg-app-background pb-28 md:pl-20 md:pb-8">
        <div className="p-4 pb-1 pt-2 flex items-center rounded-b-lg shadow-lg bg-warm-cream md:mx-auto md:mt-4 md:max-w-4xl md:rounded-lg">
          <Image src="/assets/BudgetCat.png" alt="Budget" width={64} height={64} />
          <h1 className="text-2xl font-bold text-deep-slate">
            My <span className="text-soft-orange">Budget</span>
          </h1>
        </div>

        <main className="mx-auto max-w-4xl space-y-4 p-4">
          {status === "loading" ? (
            <div className="rounded-md bg-warm-cream p-3 text-sm text-deep-slate shadow">
              Loading budgets from your spreadsheet...
            </div>
          ) : null}
          {needsReconnect ? (
            <div className="rounded-md bg-orange-50 p-3 text-sm text-deep-slate shadow">
              <p>Reconnect Google Sheets access to manage budgets.</p>
              <button
                type="button"
                onClick={() => void reconnectGoogleWorkspace()}
                className="mt-2 rounded-md bg-soft-orange px-3 py-2 text-xs font-semibold text-white"
              >
                Reconnect
              </button>
            </div>
          ) : null}
          {hasNoSpreadsheet ? (
            <div className="rounded-md bg-orange-50 p-3 text-sm text-deep-slate shadow">
              Your Purrney spreadsheet is not ready yet.
            </div>
          ) : null}
          {error ? (
            <div className="rounded-md bg-red-50 p-3 text-sm text-money-out shadow">
              {error}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-3 rounded-2xl bg-white p-4 shadow-lg">
            <h2 className="text-lg font-bold text-deep-slate">Add or Update Budget</h2>
            {message ? (
              <div className={`rounded-md p-3 text-sm ${submitStatus === "success" ? "bg-green-50 text-money-in" : "bg-red-50 text-money-out"}`}>
                {message}
              </div>
            ) : null}
            <select
              value={categoryValue}
              onChange={(event) => setCategoryValue(event.target.value)}
              className="w-full rounded-lg border bg-soft-orange/10 p-3 text-deep-slate"
            >
              <option value="">Select Category</option>
              {expenseCategories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
            <select
              value={periodType}
              onChange={(event) => setPeriodType(event.target.value as BudgetPeriodType)}
              className="w-full rounded-lg border bg-soft-orange/10 p-3 text-deep-slate"
            >
              <option value="monthly">Monthly</option>
              <option value="weekly">Weekly</option>
              <option value="yearly">Yearly</option>
              <option value="custom">Custom</option>
            </select>
            <input
              type="text"
              value={period}
              onChange={(event) => setPeriod(event.target.value)}
              placeholder="2026-06"
              className="w-full rounded-lg border p-3 focus:outline-none focus:ring-2 focus:ring-soft-orange"
            />
            <input
              type="text"
              value={amountMax}
              onChange={(event) => setAmountMax(formatRupiah(event.target.value))}
              placeholder="Budget amount"
              className="w-full rounded-lg border p-3 text-right text-xl font-bold focus:outline-none focus:ring-2 focus:ring-soft-orange"
            />
            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full rounded-xl bg-soft-orange py-3 font-semibold text-white shadow-lg disabled:opacity-50"
            >
              {submitStatus === "saving" ? "Saving..." : "Save Budget"}
            </button>
          </form>

          <section>
            <h2 className="mb-2 text-xl font-bold text-deep-slate">Active Budgets</h2>
            {dashboard.progressData.length === 0 ? (
              <div className="rounded-md bg-warm-cream p-4 text-sm text-deep-slate shadow">
                No active budgets found.
              </div>
            ) : null}
            <div className="space-y-2">
              {dashboard.progressData.map((budget) => (
                <div key={budget.id} className="rounded-md bg-warm-cream p-3 shadow">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-deep-slate">{budget.category}</p>
                    <p className="text-sm text-deep-slate">
                      Rp {budget.amount.toLocaleString("id-ID")} / Rp {budget.amountMax.toLocaleString("id-ID")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>

        <BottomNav />
      </div>
    </AuthGate>
  );
}
