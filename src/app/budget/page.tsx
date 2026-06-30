"use client";

import AuthGate from "@/app/component/AuthGate";
import BottomNav from "@/app/component/BottomNav";
import { useAuth } from "@/app/api/AuthContext";
import { useSpreadsheetDashboard } from "@/app/hooks/useSpreadsheetDashboard";
import {
  appendBudgetToSpreadsheet,
  createBudgetRow,
} from "@/lib/userSpreadsheet";
import type { BudgetPeriodType, BudgetSheetRow } from "@/lib/spreadsheetSchema";
import Image from "next/image";
import { useMemo, useState } from "react";

function formatRupiah(value: string) {
  const rawValue = value.replace(/\D/g, "");
  return rawValue.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function formatRupiahNumber(value: number) {
  return Math.max(0, Math.round(value)).toLocaleString("id-ID");
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
  const [editingBudget, setEditingBudget] = useState<BudgetSheetRow | null>(null);
  const [deleteStatus, setDeleteStatus] = useState<"idle" | "deleting">("idle");
  const [deletingBudgetId, setDeletingBudgetId] = useState<string | null>(null);

  const categoryLabelByValue = useMemo(
    () => new Map(dashboard.categories.map((category) => [category.value, category.label])),
    [dashboard.categories]
  );
  const activeBudgets = useMemo(() => {
    const transactions = sourceData?.transactions ?? [];

    return (sourceData?.budgets ?? [])
      .filter((budget) => budget.isActive)
      .map((budget) => {
        const amount = transactions
          .filter(
            (transaction) =>
              transaction.type === "out" &&
              !transaction.transferGroupId &&
              transaction.categoryValue === budget.categoryValue &&
              transaction.date.startsWith(budget.period)
          )
          .reduce((sum, transaction) => sum + transaction.amount, 0);

        return {
          budget,
          amount,
          categoryLabel:
            categoryLabelByValue.get(budget.categoryValue) ?? budget.categoryValue,
        };
      });
  }, [categoryLabelByValue, sourceData?.budgets, sourceData?.transactions]);

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
      const timestamp = new Date().toISOString();
      const budget = editingBudget
        ? {
            ...editingBudget,
            categoryValue,
            periodType,
            period,
            amountMax: numericAmount,
            isActive: true,
            updatedAt: timestamp,
          }
        : createBudgetRow({
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
      setMessage(editingBudget ? "Budget updated in your spreadsheet." : "Budget saved to your spreadsheet.");
      setAmountMax("");
      setEditingBudget(null);
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

  const handleEditBudget = (budget: BudgetSheetRow) => {
    setEditingBudget(budget);
    setCategoryValue(budget.categoryValue);
    setPeriodType(budget.periodType);
    setPeriod(budget.period);
    setAmountMax(formatRupiahNumber(budget.amountMax));
    setSubmitStatus("idle");
    setMessage("Editing selected budget. Save to apply changes.");
  };

  const handleCancelEdit = () => {
    setEditingBudget(null);
    setCategoryValue("");
    setPeriodType("monthly");
    setPeriod(new Date().toISOString().slice(0, 7));
    setAmountMax("");
    setSubmitStatus("idle");
    setMessage(null);
  };

  const handleDeleteBudget = async (budget: BudgetSheetRow) => {
    if (!googleAccessToken || !registry?.spreadsheetId) {
      setSubmitStatus("error");
      setMessage("Reconnect Google Sheets access before deleting a budget.");
      return;
    }

    const confirmed = window.confirm(
      `Delete budget for ${categoryLabelByValue.get(budget.categoryValue) ?? budget.categoryValue}?`
    );

    if (!confirmed) return;

    try {
      setDeleteStatus("deleting");
      setDeletingBudgetId(budget.id);
      setMessage(null);

      await appendBudgetToSpreadsheet({
        accessToken: googleAccessToken,
        spreadsheetId: registry.spreadsheetId,
        budget: {
          ...budget,
          isActive: false,
          updatedAt: new Date().toISOString(),
        },
      });

      if (editingBudget?.id === budget.id) {
        handleCancelEdit();
      }

      setSubmitStatus("success");
      setMessage("Budget deleted from active budgets.");
      await reload();
    } catch (deleteError) {
      console.error("Error deleting budget:", deleteError);
      const errorMessage =
        deleteError instanceof Error ? deleteError.message : "Failed to delete budget.";
      setSubmitStatus("error");
      setMessage(errorMessage);

      if (/^(401|403)\b/.test(errorMessage)) {
        markGoogleWorkspaceTokenExpired();
      }
    } finally {
      setDeleteStatus("idle");
      setDeletingBudgetId(null);
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
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-bold text-deep-slate">
                {editingBudget ? "Edit Budget" : "Add Budget"}
              </h2>
              {editingBudget ? (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="rounded-md border border-soft-orange px-3 py-2 text-xs font-semibold text-soft-orange"
                >
                  Cancel Edit
                </button>
              ) : null}
            </div>
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
              {submitStatus === "saving"
                ? "Saving..."
                : editingBudget
                  ? "Update Budget"
                  : "Save Budget"}
            </button>
          </form>

          <section>
            <h2 className="mb-2 text-xl font-bold text-deep-slate">Active Budgets</h2>
            {activeBudgets.length === 0 ? (
              <div className="rounded-md bg-warm-cream p-4 text-sm text-deep-slate shadow">
                No active budgets found.
              </div>
            ) : null}
            <div className="space-y-2">
              {activeBudgets.map(({ budget, amount, categoryLabel }) => (
                <div key={budget.id} className="rounded-md bg-warm-cream p-3 shadow">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-deep-slate">{categoryLabel}</p>
                      <p className="text-xs text-deep-slate/60">
                        {budget.periodType} · {budget.period}
                      </p>
                    </div>
                    <p className="text-right text-sm text-deep-slate">
                      Rp {formatRupiahNumber(amount)} / Rp {formatRupiahNumber(budget.amountMax)}
                    </p>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleEditBudget(budget)}
                      disabled={submitStatus === "saving" || deleteStatus === "deleting"}
                      className="rounded-lg border border-soft-orange px-3 py-2 text-sm font-semibold text-soft-orange disabled:opacity-50"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDeleteBudget(budget)}
                      disabled={submitStatus === "saving" || deleteStatus === "deleting"}
                      className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-money-out disabled:opacity-50"
                    >
                      {deleteStatus === "deleting" && deletingBudgetId === budget.id
                        ? "Deleting..."
                        : "Delete"}
                    </button>
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
