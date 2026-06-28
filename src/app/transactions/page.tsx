"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Repeat, Search, Trash2 } from "lucide-react";
import { useAuth } from "@/app/api/AuthContext";
import AuthGate from "@/app/component/AuthGate";
import BottomNav from "@/app/component/BottomNav";
import { useSpreadsheetDashboard } from "@/app/hooks/useSpreadsheetDashboard";
import type { DashboardTransaction } from "@/lib/spreadsheetData";
import { deleteTransactionFromSpreadsheet } from "@/lib/userSpreadsheet";

type FilterMode = "all" | "date" | "month" | "year";

const pageSizeOptions = [10, 25, 50];

function formatAmount(value: number) {
  return Math.abs(value).toLocaleString("id-ID");
}

export default function TransactionsPage() {
  const { registry, googleAccessToken } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [dateFilter, setDateFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [transactionToDelete, setTransactionToDelete] = useState<DashboardTransaction | null>(null);
  const [deleteStatus, setDeleteStatus] = useState<"idle" | "deleting">("idle");
  const [deleteMessage, setDeleteMessage] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const {
    dashboard,
    status,
    error,
    needsReconnect,
    hasNoSpreadsheet,
    reconnectGoogleWorkspace,
    reload,
  } = useSpreadsheetDashboard();
  const transactions = useMemo(
    () =>
      [...dashboard.transactions].sort((first, second) => {
        const dateCompare = second.date.localeCompare(first.date);
        return dateCompare || second.id.localeCompare(first.id);
      }),
    [dashboard.transactions]
  );
  const filteredTransactions = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return transactions.filter((transaction) => {
      const matchesSearch =
        normalizedQuery.length === 0 ||
        [
          transaction.description,
          transaction.category,
          transaction.date,
          transaction.type,
          String(transaction.amount),
          transaction.transferGroupId ? "transfer" : "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);
      const matchesFilter =
        filterMode === "all" ||
        (filterMode === "date" && (!dateFilter || transaction.date === dateFilter)) ||
        (filterMode === "month" && (!monthFilter || transaction.date.startsWith(monthFilter))) ||
        (filterMode === "year" && (!yearFilter || transaction.date.startsWith(yearFilter)));

      return matchesSearch && matchesFilter;
    });
  }, [dateFilter, filterMode, monthFilter, searchQuery, transactions, yearFilter]);
  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / pageSize));
  const activePage = Math.min(page, totalPages);
  const paginatedTransactions = filteredTransactions.slice(
    (activePage - 1) * pageSize,
    activePage * pageSize
  );
  const resultStart =
    filteredTransactions.length === 0 ? 0 : (activePage - 1) * pageSize + 1;
  const resultEnd = Math.min(activePage * pageSize, filteredTransactions.length);

  function resetToFirstPage() {
    setPage(1);
  }

  async function handleDeleteTransaction() {
    if (!transactionToDelete) {
      return;
    }

    if (!registry?.spreadsheetId || !googleAccessToken) {
      setDeleteError("Reconnect Google Sheets access before deleting transactions.");
      return;
    }

    try {
      setDeleteStatus("deleting");
      setDeleteError(null);
      setDeleteMessage(null);

      await deleteTransactionFromSpreadsheet({
        accessToken: googleAccessToken,
        spreadsheetId: registry.spreadsheetId,
        transactionId: transactionToDelete.id,
        transferGroupId: transactionToDelete.transferGroupId,
      });
      await reload();

      setDeleteMessage(
        transactionToDelete.transferGroupId
          ? "Transfer transaction deleted."
          : "Transaction deleted."
      );
      setTransactionToDelete(null);
    } catch (deleteTransactionError) {
      console.error("Error deleting transaction:", deleteTransactionError);
      setDeleteError(
        deleteTransactionError instanceof Error
          ? deleteTransactionError.message
          : "Failed to delete transaction."
      );
    } finally {
      setDeleteStatus("idle");
    }
  }

  return (
    <AuthGate>
      <div className="min-h-screen bg-app-background pb-28 md:pl-20 md:pb-8">
        <header className="rounded-b-lg bg-warm-cream p-4 shadow-lg md:mx-auto md:mt-4 md:max-w-5xl md:rounded-lg">
          <h1 className="text-2xl font-bold text-deep-slate">All Transactions</h1>
          <p className="text-sm text-deep-slate/60">Full activity history from your spreadsheet</p>
        </header>

        <main className="mx-auto max-w-5xl space-y-4 p-4">
          {status === "loading" ? (
            <div className="rounded-md bg-warm-cream p-3 text-sm text-deep-slate shadow">
              Loading transactions from your spreadsheet...
            </div>
          ) : null}
          {needsReconnect ? (
            <div className="rounded-md bg-orange-50 p-3 text-sm text-deep-slate shadow">
              <p>Reconnect Google Sheets access to load transactions.</p>
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
          {deleteMessage ? (
            <div className="rounded-md bg-green-50 p-3 text-sm text-money-in shadow">
              {deleteMessage}
            </div>
          ) : null}
          {deleteError ? (
            <div className="rounded-md bg-red-50 p-3 text-sm text-money-out shadow">
              {deleteError}
            </div>
          ) : null}

          <section className="rounded-lg bg-warm-cream p-4 shadow-md">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-deep-slate">Transaction History</h2>
                <p className="text-sm text-deep-slate/60">
                  {filteredTransactions.length} of {transactions.length} transaction{transactions.length === 1 ? "" : "s"}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-white text-soft-orange shadow-sm">
                <Search size={18} />
              </div>
            </div>

            <div className="mb-3 grid gap-2 rounded-md bg-white p-3 shadow-sm lg:grid-cols-[1.4fr_0.8fr_1fr_0.6fr]">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-deep-slate/60">Search</span>
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(event) => {
                    setSearchQuery(event.target.value);
                    resetToFirstPage();
                  }}
                  placeholder="Search description, category, amount..."
                  className="w-full rounded-md border border-deep-slate/10 bg-app-background px-3 py-2 text-sm text-deep-slate focus:outline-none focus:ring-2 focus:ring-soft-orange"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-deep-slate/60">Filter</span>
                <select
                  value={filterMode}
                  onChange={(event) => {
                    setFilterMode(event.target.value as FilterMode);
                    resetToFirstPage();
                  }}
                  className="w-full rounded-md border border-deep-slate/10 bg-app-background px-3 py-2 text-sm text-deep-slate focus:outline-none focus:ring-2 focus:ring-soft-orange"
                >
                  <option value="all">All time</option>
                  <option value="date">By date</option>
                  <option value="month">By month</option>
                  <option value="year">By year</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-deep-slate/60">Period</span>
                {filterMode === "date" ? (
                  <input
                    type="date"
                    value={dateFilter}
                    onChange={(event) => {
                      setDateFilter(event.target.value);
                      resetToFirstPage();
                    }}
                    className="w-full rounded-md border border-deep-slate/10 bg-app-background px-3 py-2 text-sm text-deep-slate focus:outline-none focus:ring-2 focus:ring-soft-orange"
                  />
                ) : null}
                {filterMode === "month" ? (
                  <input
                    type="month"
                    value={monthFilter}
                    onChange={(event) => {
                      setMonthFilter(event.target.value);
                      resetToFirstPage();
                    }}
                    className="w-full rounded-md border border-deep-slate/10 bg-app-background px-3 py-2 text-sm text-deep-slate focus:outline-none focus:ring-2 focus:ring-soft-orange"
                  />
                ) : null}
                {filterMode === "year" ? (
                  <input
                    type="number"
                    min="2000"
                    max="2100"
                    value={yearFilter}
                    onChange={(event) => {
                      setYearFilter(event.target.value.slice(0, 4));
                      resetToFirstPage();
                    }}
                    placeholder="2026"
                    className="w-full rounded-md border border-deep-slate/10 bg-app-background px-3 py-2 text-sm text-deep-slate focus:outline-none focus:ring-2 focus:ring-soft-orange"
                  />
                ) : null}
                {filterMode === "all" ? (
                  <div className="flex min-h-11 items-center rounded-md bg-app-background px-3 text-sm text-deep-slate/50">
                    No period filter
                  </div>
                ) : null}
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-deep-slate/60">Per page</span>
                <select
                  value={pageSize}
                  onChange={(event) => {
                    setPageSize(Number(event.target.value));
                    resetToFirstPage();
                  }}
                  className="w-full rounded-md border border-deep-slate/10 bg-app-background px-3 py-2 text-sm text-deep-slate focus:outline-none focus:ring-2 focus:ring-soft-orange"
                >
                  {pageSizeOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {transactions.length === 0 ? (
              <div className="rounded-md bg-white p-4 text-sm text-deep-slate/70 shadow-sm">
                No transactions found.
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="rounded-md bg-white p-4 text-sm text-deep-slate/70 shadow-sm">
                No transactions match your search or filter.
              </div>
            ) : (
              <>
                <div className="mb-2 flex flex-col gap-2 text-sm text-deep-slate/60 sm:flex-row sm:items-center sm:justify-between">
                  <p>
                    Showing {resultStart}-{resultEnd} of {filteredTransactions.length}
                  </p>
                  <p>
                    Page {activePage} of {totalPages}
                  </p>
                </div>
                <div className="overflow-hidden rounded-md bg-white shadow-sm">
                  {paginatedTransactions.map((transaction) => {
                    const isTransfer = Boolean(transaction.transferGroupId);
                    const amountClass = isTransfer
                      ? "text-blue-500"
                      : transaction.type === "in"
                        ? "text-money-in"
                        : "text-money-out";

                    return (
                      <div
                        key={transaction.id}
                        className="flex min-h-16 items-center justify-between gap-3 border-b border-deep-slate/10 p-3 last:border-b-0"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className={`flex h-9 w-9 items-center justify-center rounded-md ${
                            isTransfer
                              ? "bg-blue-50 text-blue-500"
                              : transaction.type === "in"
                                ? "bg-green-50 text-money-in"
                                : "bg-red-50 text-money-out"
                          }`}>
                            {isTransfer ? <Repeat size={16} /> : transaction.type === "in" ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-deep-slate">
                              {transaction.description}
                            </p>
                            <div className="mt-1 flex flex-wrap items-center gap-2">
                              <span className="rounded-full bg-app-background px-2 py-0.5 text-xs font-semibold text-deep-slate/60">
                                {isTransfer ? "Transfer" : transaction.category}
                              </span>
                              <span className="text-xs text-deep-slate/50">{transaction.date}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <p className={`text-right text-sm font-bold ${amountClass}`}>
                            {transaction.type === "in" ? "+" : "-"}Rp {formatAmount(transaction.amount)}
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setDeleteError(null);
                              setDeleteMessage(null);
                              setTransactionToDelete(transaction);
                            }}
                            className="flex h-10 w-10 items-center justify-center rounded-md border border-red-100 bg-red-50 text-money-out"
                            aria-label={`Delete ${transaction.description}`}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="button"
                    onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
                    disabled={activePage === 1}
                    className="rounded-md border border-deep-slate/10 bg-white px-4 py-2 text-sm font-semibold text-deep-slate disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <div className="flex items-center justify-center gap-2">
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, index) => {
                      const firstPage = Math.max(1, Math.min(activePage - 2, totalPages - 4));
                      const pageNumber = firstPage + index;

                      if (pageNumber > totalPages) return null;

                      return (
                        <button
                          type="button"
                          key={pageNumber}
                          onClick={() => setPage(pageNumber)}
                          className={`flex h-10 w-10 items-center justify-center rounded-md text-sm font-semibold ${
                            activePage === pageNumber
                              ? "bg-soft-orange text-white"
                              : "bg-white text-deep-slate"
                          }`}
                        >
                          {pageNumber}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    onClick={() => setPage((currentPage) => Math.min(totalPages, currentPage + 1))}
                    disabled={activePage === totalPages}
                    className="rounded-md border border-deep-slate/10 bg-white px-4 py-2 text-sm font-semibold text-deep-slate disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </>
            )}
          </section>
        </main>

        {transactionToDelete ? (
          <div className="fixed inset-0 z-50 flex items-end bg-deep-slate/40 p-4 sm:items-center sm:justify-center">
            <div className="w-full rounded-lg bg-white p-4 shadow-xl sm:max-w-md">
              <h2 className="text-lg font-bold text-deep-slate">Delete transaction?</h2>
              <p className="mt-2 text-sm leading-6 text-deep-slate/70">
                This will remove <span className="font-semibold text-deep-slate">{transactionToDelete.description}</span> from your spreadsheet.
                {transactionToDelete.transferGroupId
                  ? " Because this is a transfer, the matching transfer row will be deleted too."
                  : ""}
              </p>
              <div className="mt-3 rounded-md bg-app-background p-3">
                <p className="text-sm font-semibold text-deep-slate">
                  {transactionToDelete.type === "in" ? "+" : "-"}Rp{" "}
                  {formatAmount(transactionToDelete.amount)}
                </p>
                <p className="mt-1 text-xs text-deep-slate/60">
                  {transactionToDelete.date} -{" "}
                  {transactionToDelete.transferGroupId ? "Transfer" : transactionToDelete.category}
                </p>
              </div>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={() => void handleDeleteTransaction()}
                  disabled={deleteStatus === "deleting"}
                  className="rounded-md bg-money-out px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {deleteStatus === "deleting" ? "Deleting..." : "Delete"}
                </button>
                <button
                  type="button"
                  onClick={() => setTransactionToDelete(null)}
                  disabled={deleteStatus === "deleting"}
                  className="rounded-md border border-deep-slate/20 px-4 py-2 text-sm font-semibold text-deep-slate disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <BottomNav />
      </div>
    </AuthGate>
  );
}
