"use client";

import AuthGate from "@/app/component/AuthGate";
import BottomNav from "@/app/component/BottomNav";
import { useAuth } from "@/app/api/AuthContext";
import { useSpreadsheetDashboard } from "@/app/hooks/useSpreadsheetDashboard";
import { appendAccountToSpreadsheet } from "@/lib/userSpreadsheet";
import {
  createWalletSummary,
  filterWalletTransactions,
  type WalletActivityFilter,
} from "@/lib/walletSummary";
import type { AccountKind, AccountSheetRow } from "@/lib/spreadsheetSchema";
import { ArrowUp, Pencil, Repeat, Wallet } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";

function formatRupiahInput(value: string) {
  const rawValue = value.replace(/\D/g, "");
  return rawValue.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function formatCurrency(value: number) {
  return `Rp ${value.toLocaleString("id-ID")}`;
}

function MetricCard({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: number;
  tone?: "neutral" | "income" | "expense" | "transfer";
}) {
  const toneClass =
    tone === "income"
      ? "text-money-in"
      : tone === "expense"
        ? "text-money-out"
        : tone === "transfer"
          ? "text-blue-500"
          : "text-deep-slate";

  return (
    <div className="rounded-lg bg-warm-cream p-3 shadow-md">
      <p className="text-xs font-semibold uppercase text-deep-slate/50">{label}</p>
      <p className={`mt-1 break-words text-lg font-bold ${toneClass}`}>
        {formatCurrency(value)}
      </p>
    </div>
  );
}

export default function WalletDetailPage() {
  const params = useParams<{ id: string }>();
  const { registry, googleAccessToken, markGoogleWorkspaceTokenExpired } = useAuth();
  const {
    dashboard,
    sourceData,
    status,
    error,
    needsReconnect,
    hasNoSpreadsheet,
    reconnectGoogleWorkspace,
    reload,
  } = useSpreadsheetDashboard();
  const summary = useMemo(() => {
    if (!sourceData) return null;
    return createWalletSummary({
      data: sourceData,
      dashboard,
      walletId: params.id,
    });
  }, [dashboard, params.id, sourceData]);
  const account = summary?.account ?? null;
  const [activityFilter, setActivityFilter] = useState<WalletActivityFilter>("all");
  const [name, setName] = useState<string | null>(null);
  const [kind, setKind] = useState<AccountKind | null>(null);
  const [openingBalance, setOpeningBalance] = useState<string | null>(null);
  const [isActive, setIsActive] = useState<boolean | null>(null);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  const formName = name ?? account?.name ?? "";
  const formKind = kind ?? account?.kind ?? "cash";
  const formOpeningBalance =
    openingBalance ?? (account ? formatRupiahInput(String(account.openingBalance)) : "");
  const formIsActive = isActive ?? account?.isActive ?? true;
  const numericOpeningBalance = Number(formOpeningBalance.replace(/\D/g, ""));
  const canSubmit =
    Boolean(account) &&
    Boolean(formName.trim()) &&
    Boolean(registry?.spreadsheetId) &&
    Boolean(googleAccessToken) &&
    submitStatus !== "saving";
  const visibleTransactions = summary
    ? filterWalletTransactions({
        transactions: summary.transactions,
        filter: activityFilter,
      }).slice(0, 12)
    : [];

  async function saveAccount(nextIsActive = formIsActive) {
    if (!account || !googleAccessToken || !registry?.spreadsheetId) {
      setSubmitStatus("error");
      setMessage("Reconnect Google Sheets access before saving this wallet.");
      return;
    }

    const updatedAccount: AccountSheetRow = {
      ...account,
      name: formName.trim(),
      kind: formKind,
      openingBalance: numericOpeningBalance,
      isActive: nextIsActive,
      updatedAt: new Date().toISOString(),
    };

    try {
      setSubmitStatus("saving");
      setMessage(null);
      await appendAccountToSpreadsheet({
        accessToken: googleAccessToken,
        spreadsheetId: registry.spreadsheetId,
        account: updatedAccount,
      });
      setSubmitStatus("success");
      setMessage(nextIsActive ? "Wallet updated." : "Wallet deactivated.");
      setIsActive(nextIsActive);
      await reload();
    } catch (saveError) {
      console.error("Error updating wallet:", saveError);
      const errorMessage =
        saveError instanceof Error ? saveError.message : "Failed to update wallet.";
      setSubmitStatus("error");
      setMessage(errorMessage);

      if (/^(401|403)\b/.test(errorMessage)) {
        markGoogleWorkspaceTokenExpired();
      }
    }
  }

  return (
    <AuthGate>
      <div className="min-h-screen bg-app-background pb-28 md:pl-20 md:pb-8">
        <header className="flex items-center gap-3 rounded-b-lg bg-warm-cream p-4 shadow-lg md:mx-auto md:mt-4 md:max-w-6xl md:rounded-lg">
          <Image src="/assets/walletCat.png" alt="Wallet" width={60} height={60} />
          <div className="min-w-0">
            <Link href="/accounts" className="text-xs font-semibold text-soft-orange">
              Back to Wallets
            </Link>
            <h1 className="truncate text-2xl font-bold text-deep-slate">
              {account?.name ?? "Wallet Detail"}
            </h1>
            {account ? (
              <p className="text-xs text-deep-slate/60">
                {account.kind} - {account.isActive ? "Active" : "Inactive"}
              </p>
            ) : null}
          </div>
        </header>

        <main className="mx-auto max-w-6xl space-y-4 p-4">
          {status === "loading" ? (
            <div className="rounded-md bg-warm-cream p-3 text-sm text-deep-slate shadow">
              Loading wallet from your spreadsheet...
            </div>
          ) : null}
          {needsReconnect ? (
            <div className="rounded-md bg-orange-50 p-3 text-sm text-deep-slate shadow">
              <p>Reconnect Google Sheets access to view this wallet.</p>
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
          {!summary && status === "success" ? (
            <div className="rounded-md bg-warm-cream p-4 text-sm text-deep-slate shadow">
              Wallet not found in your spreadsheet.
            </div>
          ) : null}

          {summary ? (
            <>
              <section className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
                <div className="space-y-4">
                  <section className="rounded-lg bg-warm-cream p-4 shadow-md">
                    <div className="mb-3 flex items-center gap-2">
                      <Wallet size={18} className="text-soft-orange" />
                      <h2 className="text-lg font-bold text-deep-slate">Balance Summary</h2>
                    </div>
                    <p className="text-sm text-deep-slate/60">Current Balance</p>
                    <p className="break-words text-3xl font-bold text-deep-slate">
                      {formatCurrency(summary.currentBalance)}
                    </p>
                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <MetricCard label="Opening" value={summary.openingBalance} />
                      <MetricCard label="Income" value={summary.income} tone="income" />
                      <MetricCard label="Expense" value={summary.expense} tone="expense" />
                    </div>
                  </section>

                  <section className="grid grid-cols-2 gap-3 lg:grid-cols-1 xl:grid-cols-2">
                    <MetricCard label="Transfer In" value={summary.transferIn} tone="transfer" />
                    <MetricCard label="Transfer Out" value={summary.transferOut} tone="transfer" />
                    <MetricCard label="Net Movement" value={summary.netMovement} />
                    <div className="rounded-lg bg-warm-cream p-3 shadow-md">
                      <p className="text-xs font-semibold uppercase text-deep-slate/50">Actions</p>
                      <div className="mt-2 grid gap-2">
                        <Link
                          href="/addTransaction"
                          className="flex items-center gap-2 rounded-md bg-soft-orange px-3 py-2 text-sm font-semibold text-white"
                        >
                          <ArrowUp size={16} /> Add Transaction
                        </Link>
                        <a
                          href="#edit-wallet"
                          className="flex items-center gap-2 rounded-md border border-soft-orange px-3 py-2 text-sm font-semibold text-soft-orange"
                        >
                          <Pencil size={16} /> Edit Wallet
                        </a>
                      </div>
                    </div>
                  </section>
                </div>

                <section className="rounded-lg bg-warm-cream p-4 shadow-md">
                  <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                      <Repeat size={18} className="text-soft-orange" />
                      <h2 className="text-lg font-bold text-deep-slate">Wallet Activity</h2>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(["all", "income", "expense", "transfer"] as WalletActivityFilter[]).map((filter) => (
                        <button
                          key={filter}
                          type="button"
                          onClick={() => setActivityFilter(filter)}
                          className={`rounded-md px-3 py-1 text-xs font-semibold ${
                            activityFilter === filter
                              ? "bg-soft-orange text-white"
                              : "bg-white text-deep-slate"
                          }`}
                        >
                          {filter}
                        </button>
                      ))}
                    </div>
                  </div>
                  {visibleTransactions.length === 0 ? (
                    <p className="text-sm text-deep-slate/60">No wallet activity found.</p>
                  ) : (
                    <div className="space-y-3">
                      {visibleTransactions.map((transaction) => {
                        const transfer = Boolean(transaction.transferGroupId);
                        const amountClass = transfer
                          ? "text-blue-500"
                          : transaction.type === "in"
                            ? "text-money-in"
                            : "text-money-out";

                        return (
                          <div
                            key={transaction.id}
                            className="flex items-center justify-between gap-3 border-b border-deep-slate/10 pb-3 last:border-b-0 last:pb-0"
                          >
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-deep-slate">
                                {transaction.description}
                              </p>
                              <p className="text-xs text-deep-slate/50">
                                {transaction.date} - {transfer ? "Transfer" : transaction.categoryValue}
                              </p>
                            </div>
                            <p className={`shrink-0 text-sm font-bold ${amountClass}`}>
                              {transaction.type === "in" ? "+" : "-"}
                              {formatCurrency(transaction.amount)}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
              </section>

              <form
                id="edit-wallet"
                onSubmit={(event) => {
                  event.preventDefault();
                  void saveAccount();
                }}
                className="space-y-3 rounded-2xl bg-white p-4 shadow-lg"
              >
                <h2 className="text-lg font-bold text-deep-slate">Edit Wallet</h2>
                {message ? (
                  <div className={`rounded-md p-3 text-sm ${submitStatus === "success" ? "bg-green-50 text-money-in" : "bg-red-50 text-money-out"}`}>
                    {message}
                  </div>
                ) : null}
                <input
                  type="text"
                  value={formName}
                  onChange={(event) => setName(event.target.value)}
                  className="w-full rounded-lg border p-3 focus:outline-none focus:ring-2 focus:ring-soft-orange"
                />
                <select
                  value={formKind}
                  onChange={(event) => setKind(event.target.value as AccountKind)}
                  className="w-full rounded-lg border bg-soft-orange/10 p-3 text-deep-slate"
                >
                  <option value="cash">Cash</option>
                  <option value="bank">Bank</option>
                  <option value="ewallet">E-Wallet</option>
                </select>
                <input
                  type="text"
                  value={formOpeningBalance}
                  onChange={(event) => setOpeningBalance(formatRupiahInput(event.target.value))}
                  className="w-full rounded-lg border p-3 text-right text-xl font-bold focus:outline-none focus:ring-2 focus:ring-soft-orange"
                />
                <label className="flex items-center justify-between rounded-lg border p-3 text-sm font-semibold text-deep-slate">
                  Active wallet
                  <input
                    type="checkbox"
                    checked={formIsActive}
                    onChange={(event) => setIsActive(event.target.checked)}
                    className="h-5 w-5 accent-soft-orange"
                  />
                </label>
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="w-full rounded-xl bg-soft-orange py-3 font-semibold text-white shadow-lg disabled:opacity-50"
                >
                  {submitStatus === "saving" ? "Saving..." : "Save Wallet"}
                </button>
                {formIsActive ? (
                  <button
                    type="button"
                    disabled={!canSubmit}
                    onClick={() => void saveAccount(false)}
                    className="w-full rounded-xl border border-money-out py-3 font-semibold text-money-out disabled:opacity-50"
                  >
                    Deactivate Wallet
                  </button>
                ) : null}
                <div className="rounded-md bg-warm-cream p-3 text-xs text-deep-slate/60">
                  <p>Wallet ID: {summary.account.id}</p>
                  <p>Created: {summary.account.createdAt}</p>
                  <p>Updated: {summary.account.updatedAt}</p>
                </div>
              </form>
            </>
          ) : null}
        </main>

        <BottomNav />
      </div>
    </AuthGate>
  );
}
