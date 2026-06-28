"use client";

import { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowRightLeft,
  ArrowUp,
  CircleAlert,
  Plus,
  ReceiptText,
  Search,
  Wallet,
} from "lucide-react";
import BottomNav from "../component/BottomNav";
import AuthGate from "../component/AuthGate";
import Image from "next/image";
import Link from "next/link";
import { useSpreadsheetDashboard } from "../hooks/useSpreadsheetDashboard";
import type { AccountKind, AccountSheetRow, TransactionSheetRow } from "@/lib/spreadsheetSchema";

type WalletStatusFilter = "all" | "active" | "inactive";
type WalletTypeFilter = "all" | AccountKind;

type WalletCardData = {
  account: AccountSheetRow;
  balance: number;
  income: number;
  expense: number;
  lastTransactionDate: string;
  transactionCount: number;
};

const typeOptions: Array<{ value: WalletTypeFilter; label: string }> = [
  { value: "all", label: "All types" },
  { value: "cash", label: "Cash" },
  { value: "bank", label: "Bank" },
  { value: "ewallet", label: "E-wallet" },
];

const statusOptions: Array<{ value: WalletStatusFilter; label: string }> = [
  { value: "all", label: "All status" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

function getCurrentPeriod() {
  return new Date().toISOString().slice(0, 7);
}

function formatCurrency(value: number) {
  return `Rp ${value.toLocaleString("id-ID")}`;
}

function formatKind(kind: AccountKind) {
  if (kind === "ewallet") return "E-wallet";
  return kind.charAt(0).toUpperCase() + kind.slice(1);
}

function getWalletBalance(account: AccountSheetRow, transactions: TransactionSheetRow[]) {
  const delta = transactions
    .filter((transaction) => transaction.accountId === account.id)
    .reduce((sum, transaction) => {
      return transaction.type === "in"
        ? sum + transaction.amount
        : sum - transaction.amount;
    }, 0);

  return account.openingBalance + delta;
}

function createWalletCards({
  accounts,
  transactions,
  period,
}: {
  accounts: AccountSheetRow[];
  transactions: TransactionSheetRow[];
  period: string;
}): WalletCardData[] {
  return accounts.map((account) => {
    const walletTransactions = transactions
      .filter((transaction) => transaction.accountId === account.id)
      .sort((left, right) => right.date.localeCompare(left.date));
    const periodTransactions = walletTransactions.filter((transaction) =>
      transaction.date.startsWith(period)
    );
    const income = periodTransactions
      .filter((transaction) => transaction.type === "in" && !transaction.transferGroupId)
      .reduce((sum, transaction) => sum + transaction.amount, 0);
    const expense = periodTransactions
      .filter((transaction) => transaction.type === "out" && !transaction.transferGroupId)
      .reduce((sum, transaction) => sum + transaction.amount, 0);

    return {
      account,
      balance: getWalletBalance(account, transactions),
      income,
      expense,
      lastTransactionDate: walletTransactions[0]?.date ?? "",
      transactionCount: walletTransactions.length,
    };
  });
}

function MetricCard({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "income" | "expense";
}) {
  const toneClass =
    tone === "income"
      ? "text-money-in"
      : tone === "expense"
        ? "text-money-out"
        : "text-deep-slate";

  return (
    <div className="rounded-lg bg-white p-3 shadow-sm">
      <p className="text-xs font-semibold uppercase text-deep-slate/50">{label}</p>
      <p className={`mt-1 truncate text-base font-bold ${toneClass}`}>{value}</p>
    </div>
  );
}

function WalletDistribution({ wallets }: { wallets: WalletCardData[] }) {
  const positiveWallets = wallets
    .filter((wallet) => wallet.account.isActive && wallet.balance > 0)
    .sort((left, right) => right.balance - left.balance);
  const totalPositiveBalance = positiveWallets.reduce((sum, wallet) => sum + wallet.balance, 0);

  return (
    <section className="rounded-lg bg-warm-cream p-4 shadow-md">
      <h2 className="text-base font-bold text-deep-slate">Wallet Distribution</h2>
      <p className="mt-1 text-sm text-deep-slate/60">Saldo aktif tersebar di wallet berikut.</p>

      {positiveWallets.length === 0 ? (
        <div className="mt-3 rounded-md bg-white p-3 text-sm text-deep-slate/70 shadow-sm">
          No positive active wallet balance yet.
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          <div className="flex h-3 overflow-hidden rounded-full bg-white">
            {positiveWallets.map((wallet) => {
              const percentage =
                totalPositiveBalance > 0 ? (wallet.balance / totalPositiveBalance) * 100 : 0;

              return (
                <div
                  key={wallet.account.id}
                  className="bg-soft-orange first:rounded-l-full last:rounded-r-full odd:bg-money-in even:bg-soft-orange"
                  style={{ width: `${percentage}%` }}
                  title={`${wallet.account.name} ${Math.round(percentage)}%`}
                />
              );
            })}
          </div>
          {positiveWallets.slice(0, 5).map((wallet) => {
            const percentage =
              totalPositiveBalance > 0
                ? Math.round((wallet.balance / totalPositiveBalance) * 100)
                : 0;

            return (
              <Link
                key={wallet.account.id}
                href={`/accounts/${wallet.account.id}`}
                className="flex items-center justify-between gap-3 rounded-md bg-white p-3 shadow-sm"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-deep-slate">{wallet.account.name}</p>
                  <p className="text-xs text-deep-slate/60">{formatCurrency(wallet.balance)}</p>
                </div>
                <p className="text-sm font-bold text-soft-orange">{percentage}%</p>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default function AccountPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<WalletTypeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<WalletStatusFilter>("all");
  const {
    dashboard,
    sourceData,
    status,
    error,
    needsReconnect,
    hasNoSpreadsheet,
    reconnectGoogleWorkspace,
  } = useSpreadsheetDashboard();
  const period = getCurrentPeriod();
  const accounts = sourceData?.accounts ?? [];
  const transactions = sourceData?.transactions ?? [];
  const walletCards = useMemo(
    () => createWalletCards({ accounts, transactions, period }),
    [accounts, period, transactions]
  );
  const activeWallets = walletCards.filter((wallet) => wallet.account.isActive);
  const totalBalance = activeWallets.reduce((sum, wallet) => sum + wallet.balance, 0);
  const monthlyIncome = activeWallets.reduce((sum, wallet) => sum + wallet.income, 0);
  const monthlyExpense = activeWallets.reduce((sum, wallet) => sum + wallet.expense, 0);
  const largestWallet = activeWallets.reduce<WalletCardData | null>((largest, wallet) => {
    if (!largest || wallet.balance > largest.balance) return wallet;
    return largest;
  }, null);
  const filteredWallets = walletCards.filter((wallet) => {
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      query.length === 0 ||
      [wallet.account.name, wallet.account.kind, wallet.account.currency]
        .join(" ")
        .toLowerCase()
        .includes(query);
    const matchesType = typeFilter === "all" || wallet.account.kind === typeFilter;
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && wallet.account.isActive) ||
      (statusFilter === "inactive" && !wallet.account.isActive);

    return matchesSearch && matchesType && matchesStatus;
  });
  const isOnlyDefaultWallet =
    accounts.length <= 1 && accounts[0]?.id === "acc_cash" && transactions.length === 0;

  return (
    <AuthGate>
      <div className="min-h-screen bg-app-background pb-24 md:pl-20 md:pb-8">
        <header className="rounded-b-lg bg-warm-cream p-4 shadow-lg md:mx-auto md:mt-4 md:max-w-6xl md:rounded-lg">
          <div className="flex items-center gap-3">
            <Image
              src="/assets/walletCat.png"
              alt="Wallet Icon"
              width={64}
              height={64}
              className="h-16 w-16 object-contain"
            />
            <div>
              <h1 className="text-2xl font-bold text-deep-slate">
                Wallet <span className="text-soft-orange">Center</span>
              </h1>
              <p className="text-sm text-deep-slate/60">Manage balances, activity, and wallet spread</p>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-6xl space-y-4 p-4">
          {status === "loading" ? (
            <div className="rounded-md bg-warm-cream p-3 text-sm text-deep-slate shadow">
              Loading accounts from your spreadsheet...
            </div>
          ) : null}
          {needsReconnect ? (
            <div className="rounded-md bg-orange-50 p-3 text-sm text-deep-slate shadow">
              <p>Reconnect Google Sheets access to load your accounts.</p>
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

          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard label="Total Balance" value={formatCurrency(totalBalance)} />
            <MetricCard label="Active Wallets" value={String(activeWallets.length)} />
            <MetricCard
              label="Monthly Inflow"
              value={formatCurrency(monthlyIncome)}
              tone="income"
            />
            <MetricCard
              label="Monthly Outflow"
              value={formatCurrency(monthlyExpense)}
              tone="expense"
            />
          </section>

          <section className="rounded-lg bg-warm-cream p-4 shadow-md">
            <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <p className="text-xs font-semibold uppercase text-deep-slate/50">Largest Wallet</p>
                <h2 className="mt-1 text-xl font-bold text-deep-slate">
                  {largestWallet ? largestWallet.account.name : "No active wallet yet"}
                </h2>
                <p className="mt-1 text-sm text-deep-slate/60">
                  {largestWallet
                    ? `${formatCurrency(largestWallet.balance)} in ${formatKind(largestWallet.account.kind)}`
                    : "Add a wallet to start tracking your money spread."}
                </p>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <Link
                  href="/accounts/new"
                  className="flex items-center justify-center gap-2 rounded-md bg-soft-orange px-4 py-2 text-sm font-semibold text-white"
                >
                  <Plus size={16} /> Add Wallet
                </Link>
                <Link
                  href="/addTransaction"
                  className="flex items-center justify-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-semibold text-deep-slate shadow-sm"
                >
                  <ArrowRightLeft size={16} className="text-soft-orange" /> Transfer
                </Link>
                <Link
                  href="/transactions"
                  className="flex items-center justify-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-semibold text-deep-slate shadow-sm"
                >
                  <ReceiptText size={16} className="text-soft-orange" /> Transactions
                </Link>
              </div>
            </div>
          </section>

          {isOnlyDefaultWallet ? (
            <section className="rounded-lg bg-warm-cream p-4 text-center shadow-md">
              <Image
                src="/assets/walletCat.png"
                alt="Wallet"
                width={140}
                height={140}
                className="mx-auto h-28 w-28 object-contain"
              />
              <h2 className="mt-2 text-lg font-bold text-deep-slate">
                Belum ada wallet tambahan
              </h2>
              <p className="mx-auto mt-1 max-w-sm text-sm text-deep-slate/60">
                Tambahkan wallet seperti bank, cash, atau e-wallet supaya sebaran saldo lebih jelas.
              </p>
              <Link
                href="/accounts/new"
                className="mt-4 inline-flex items-center justify-center gap-2 rounded-md bg-soft-orange px-4 py-2 text-sm font-semibold text-white"
              >
                <Plus size={16} /> Add Wallet
              </Link>
            </section>
          ) : null}

          <section className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
            <div className="space-y-4">
              <section className="rounded-lg bg-warm-cream p-4 shadow-md">
                <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h2 className="text-base font-bold text-deep-slate">Wallets</h2>
                    <p className="text-sm text-deep-slate/60">
                      {filteredWallets.length} of {walletCards.length} wallet{walletCards.length === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-3">
                    <label className="relative">
                      <Search
                        size={16}
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-deep-slate/40"
                      />
                      <input
                        type="search"
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        placeholder="Search wallet"
                        className="w-full rounded-md border border-deep-slate/10 bg-white py-2 pl-9 pr-3 text-sm text-deep-slate focus:outline-none focus:ring-2 focus:ring-soft-orange"
                      />
                    </label>
                    <select
                      value={typeFilter}
                      onChange={(event) => setTypeFilter(event.target.value as WalletTypeFilter)}
                      className="w-full rounded-md border border-deep-slate/10 bg-white px-3 py-2 text-sm text-deep-slate focus:outline-none focus:ring-2 focus:ring-soft-orange"
                    >
                      {typeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <select
                      value={statusFilter}
                      onChange={(event) => setStatusFilter(event.target.value as WalletStatusFilter)}
                      className="w-full rounded-md border border-deep-slate/10 bg-white px-3 py-2 text-sm text-deep-slate focus:outline-none focus:ring-2 focus:ring-soft-orange"
                    >
                      {statusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {walletCards.length === 0 ? (
                  <div className="rounded-md bg-white p-4 text-sm text-deep-slate/70 shadow-sm">
                    No accounts found in your spreadsheet.
                  </div>
                ) : filteredWallets.length === 0 ? (
                  <div className="rounded-md bg-white p-4 text-sm text-deep-slate/70 shadow-sm">
                    No wallets match your search or filter.
                  </div>
                ) : (
                  <div className="grid gap-3 md:grid-cols-2">
                    {filteredWallets.map((wallet) => {
                      const isLowBalance = wallet.balance <= 0;

                      return (
                        <Link
                          key={wallet.account.id}
                          href={`/accounts/${wallet.account.id}`}
                          className="block rounded-lg bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="truncate text-base font-bold text-deep-slate">
                                  {wallet.account.name}
                                </h3>
                                <span className="rounded-full bg-app-background px-2 py-0.5 text-xs font-semibold text-deep-slate/60">
                                  {formatKind(wallet.account.kind)}
                                </span>
                              </div>
                              <p className="mt-2 text-xl font-bold text-deep-slate">
                                {formatCurrency(wallet.balance)}
                              </p>
                            </div>
                            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-app-background text-soft-orange">
                              <Wallet size={18} />
                            </div>
                          </div>

                          <div className="mt-3 grid grid-cols-2 gap-2">
                            <div className="rounded-md bg-green-50 p-2">
                              <div className="flex items-center gap-1 text-xs font-semibold text-money-in">
                                <ArrowUp size={12} /> Income
                              </div>
                              <p className="mt-1 truncate text-sm font-bold text-money-in">
                                {formatCurrency(wallet.income)}
                              </p>
                            </div>
                            <div className="rounded-md bg-red-50 p-2">
                              <div className="flex items-center gap-1 text-xs font-semibold text-money-out">
                                <ArrowDown size={12} /> Expense
                              </div>
                              <p className="mt-1 truncate text-sm font-bold text-money-out">
                                {formatCurrency(wallet.expense)}
                              </p>
                            </div>
                          </div>

                          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-deep-slate/60">
                            <span>
                              Last activity: {wallet.lastTransactionDate || "No activity yet"}
                            </span>
                            <span
                              className={`rounded-full px-2 py-0.5 font-semibold ${
                                wallet.account.isActive
                                  ? "bg-green-50 text-money-in"
                                  : "bg-slate-100 text-deep-slate/60"
                              }`}
                            >
                              {wallet.account.isActive ? "Active" : "Inactive"}
                            </span>
                          </div>

                          {isLowBalance ? (
                            <div className="mt-3 flex items-center gap-2 rounded-md bg-orange-50 p-2 text-xs font-semibold text-soft-orange">
                              <CircleAlert size={14} /> Low balance
                            </div>
                          ) : null}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>

            <div className="space-y-4">
              <WalletDistribution wallets={walletCards} />
            </div>
          </section>
        </main>

        <BottomNav />
      </div>
    </AuthGate>
  );
}
