"use client";

import AuthGate from "@/app/component/AuthGate";
import BottomNav from "@/app/component/BottomNav";
import { useSpreadsheetDashboard } from "@/app/hooks/useSpreadsheetDashboard";
import {
  createReportsSummary,
  type ReportSegment,
  type ReportTransaction,
} from "@/lib/reportsSummary";
import { ArrowUp, Calendar, ReceiptText, Tags, Wallet } from "lucide-react";
import { useMemo, useState } from "react";

function getCurrentPeriod() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${now.getFullYear()}-${month}`;
}

function formatCurrency(value: number) {
  return `Rp ${value.toLocaleString("id-ID")}`;
}

function DonutChart({ segments }: { segments: ReportSegment[] }) {
  const total = segments.reduce((sum, segment) => sum + segment.amount, 0);

  if (total <= 0 || segments.length === 0) {
    return (
      <div className="flex h-32 w-32 items-center justify-center rounded-full bg-app-background text-center text-xs font-semibold text-deep-slate/60 sm:h-40 sm:w-40">
        No data
      </div>
    );
  }

  const gradientStops = segments
    .map((segment, index) => {
      const start = segments
        .slice(0, index)
        .reduce((sum, currentSegment) => sum + (currentSegment.amount / total) * 100, 0);
      const end = start + (segment.amount / total) * 100;
      return `${segment.color} ${start}% ${end}%`;
    })
    .join(", ");

  return (
    <div
      className="relative h-32 w-32 rounded-full sm:h-40 sm:w-40"
      style={{ background: `conic-gradient(${gradientStops})` }}
    >
      <div className="absolute inset-8 flex flex-col items-center justify-center rounded-full bg-warm-cream text-center">
        <span className="text-xs text-deep-slate/60">Total</span>
        <span className="text-sm font-bold text-deep-slate">{formatCurrency(total)}</span>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  tone = "neutral",
}: {
  title: string;
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
    <div className="rounded-lg bg-warm-cream p-3 shadow-md">
      <p className="text-xs font-semibold uppercase text-deep-slate/50">{title}</p>
      <p className={`mt-1 text-lg font-bold ${toneClass}`}>{value}</p>
    </div>
  );
}

function SegmentLegend({ segments }: { segments: ReportSegment[] }) {
  if (segments.length === 0) {
    return <p className="text-sm text-deep-slate/60">No data for this period.</p>;
  }

  return (
    <div className="space-y-3">
      {segments.map((segment) => (
        <div key={segment.id}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <span
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: segment.color }}
              />
              <p className="truncate text-sm font-semibold text-deep-slate">{segment.label}</p>
            </div>
            <p className="text-sm font-semibold text-deep-slate">
              {formatCurrency(segment.amount)}
            </p>
          </div>
          <p className="mt-1 text-xs text-deep-slate/50">{segment.percentage}% of total</p>
        </div>
      ))}
    </div>
  );
}

function DonutSection({
  title,
  icon,
  segments,
}: {
  title: string;
  icon: React.ReactNode;
  segments: ReportSegment[];
}) {
  return (
    <section className="rounded-lg bg-warm-cream p-4 shadow-md">
      <div className="mb-4 flex items-center gap-2">
        {icon}
        <h2 className="text-lg font-bold text-deep-slate">{title}</h2>
      </div>
      <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
        <DonutChart segments={segments} />
        <div className="w-full flex-1">
          <SegmentLegend segments={segments} />
        </div>
      </div>
    </section>
  );
}

function IncomeExpenseSection({
  income,
  expense,
  max,
}: {
  income: number;
  expense: number;
  max: number;
}) {
  const incomeWidth = `${Math.max(4, (income / max) * 100)}%`;
  const expenseWidth = `${Math.max(4, (expense / max) * 100)}%`;

  return (
    <section className="rounded-lg bg-warm-cream p-4 shadow-md">
      <h2 className="text-lg font-bold text-deep-slate">Income vs Expense</h2>
      <div className="mt-4 space-y-4">
        <div>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-semibold text-money-in">Income</span>
            <span className="font-semibold text-deep-slate">{formatCurrency(income)}</span>
          </div>
          <div className="h-3 rounded-full bg-app-background">
            <div className="h-3 rounded-full bg-money-in" style={{ width: incomeWidth }} />
          </div>
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-semibold text-money-out">Expense</span>
            <span className="font-semibold text-deep-slate">{formatCurrency(expense)}</span>
          </div>
          <div className="h-3 rounded-full bg-app-background">
            <div className="h-3 rounded-full bg-money-out" style={{ width: expenseWidth }} />
          </div>
        </div>
      </div>
    </section>
  );
}

function BudgetWatch({ segments }: { segments: ReportSegment[] }) {
  return (
    <section className="rounded-lg bg-warm-cream p-4 shadow-md">
      <h2 className="text-lg font-bold text-deep-slate">Budget Watch</h2>
      {segments.length === 0 ? (
        <p className="mt-3 text-sm text-deep-slate/60">No active budget for this period.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {segments.map((segment) => {
            const status =
              segment.percentage >= 100
                ? "Over"
                : segment.percentage >= 75
                  ? "Near Limit"
                  : "Safe";

            return (
              <div key={segment.id}>
                <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                  <span className="font-semibold text-deep-slate">{segment.label}</span>
                  <span className="font-semibold text-deep-slate/70">
                    {segment.percentage}% - {status}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-app-background">
                  <div
                    className="h-2 rounded-full"
                    style={{
                      width: `${Math.min(100, segment.percentage)}%`,
                      backgroundColor: segment.color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function BiggestTransactions({ transactions }: { transactions: ReportTransaction[] }) {
  return (
    <section className="rounded-lg bg-warm-cream p-4 shadow-md">
      <div className="mb-4 flex items-center gap-2">
        <ReceiptText size={18} className="text-soft-orange" />
        <h2 className="text-lg font-bold text-deep-slate">Biggest Transactions</h2>
      </div>
      {transactions.length === 0 ? (
        <p className="text-sm text-deep-slate/60">No transactions for this period.</p>
      ) : (
        <div className="space-y-3">
          {transactions.map((transaction) => {
            const amountClass = transaction.isTransfer
              ? "text-blue-500"
              : transaction.type === "in"
                ? "text-money-in"
                : "text-money-out";

            return (
              <div key={transaction.id} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-deep-slate">
                    {transaction.description}
                  </p>
                  <p className="text-xs text-deep-slate/50">
                    {transaction.date} - {transaction.label}
                  </p>
                </div>
                <p className={`shrink-0 text-sm font-bold ${amountClass}`}>
                  {formatCurrency(transaction.amount)}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default function ReportsPage() {
  const [period, setPeriod] = useState(getCurrentPeriod());
  const {
    dashboard,
    sourceData,
    status,
    error,
    needsReconnect,
    hasNoSpreadsheet,
    reconnectGoogleWorkspace,
  } = useSpreadsheetDashboard();
  const summary = useMemo(() => {
    if (!sourceData) return null;
    return createReportsSummary({ data: sourceData, dashboard, period });
  }, [dashboard, period, sourceData]);

  const netTone = summary && summary.netCashflow < 0 ? "expense" : "income";

  return (
    <AuthGate>
      <div className="min-h-screen bg-app-background pb-28 md:pl-20 md:pb-8">
        <header className="rounded-b-lg bg-warm-cream p-4 shadow-lg md:mx-auto md:mt-4 md:max-w-6xl md:rounded-lg">
          <h1 className="text-2xl font-bold text-deep-slate">Reports</h1>
          <p className="text-sm text-deep-slate/60">
            Monthly insight from your spreadsheet
          </p>
        </header>

        <main className="mx-auto max-w-6xl space-y-4 p-4">
          <section className="flex flex-col gap-3 rounded-lg bg-warm-cream p-4 shadow-md sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-soft-orange" />
              <p className="font-semibold text-deep-slate">Report Period</p>
            </div>
            <div className="flex gap-2">
              <input
                type="month"
                value={period}
                onChange={(event) => setPeriod(event.target.value)}
                className="w-full rounded-md border bg-white p-2 text-deep-slate focus:outline-none focus:ring-2 focus:ring-soft-orange sm:w-auto"
              />
              <button
                type="button"
                onClick={() => setPeriod(getCurrentPeriod())}
                className="shrink-0 rounded-md bg-soft-orange px-3 py-2 text-sm font-semibold text-white"
              >
                This Month
              </button>
            </div>
          </section>

          {status === "loading" ? (
            <div className="rounded-md bg-warm-cream p-3 text-sm text-deep-slate shadow">
              Loading reports from your spreadsheet...
            </div>
          ) : null}
          {needsReconnect ? (
            <div className="rounded-md bg-orange-50 p-3 text-sm text-deep-slate shadow">
              <p>Reconnect Google Sheets access to load reports.</p>
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

          {summary ? (
            <>
              <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <MetricCard title="Income" value={formatCurrency(summary.income)} tone="income" />
                <MetricCard title="Expense" value={formatCurrency(summary.expense)} tone="expense" />
                <MetricCard
                  title="Net Cashflow"
                  value={formatCurrency(summary.netCashflow)}
                  tone={netTone}
                />
                <MetricCard
                  title="Transactions"
                  value={summary.transactionCount.toLocaleString("id-ID")}
                />
              </section>

              {summary.transactionCount === 0 ? (
                <div className="rounded-md bg-warm-cream p-4 text-sm text-deep-slate shadow">
                  No transactions found for {summary.period}.
                </div>
              ) : null}

              <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
                <div className="space-y-4">
                  <IncomeExpenseSection
                    income={summary.income}
                    expense={summary.expense}
                    max={summary.incomeExpenseMax}
                  />
                  <DonutSection
                    title="Expense By Category"
                    icon={<Tags size={18} className="text-soft-orange" />}
                    segments={summary.expenseByCategory}
                  />
                  <BudgetWatch segments={summary.budgetWatch} />
                </div>

                <div className="space-y-4">
                  <DonutSection
                    title="Wallet Breakdown"
                    icon={<Wallet size={18} className="text-soft-orange" />}
                    segments={summary.walletBreakdown}
                  />
                  <DonutSection
                    title="Income By Category"
                    icon={<ArrowUp size={18} className="text-money-in" />}
                    segments={summary.incomeByCategory}
                  />
                  <BiggestTransactions transactions={summary.biggestTransactions} />
                </div>
              </div>
            </>
          ) : status !== "loading" ? (
            <div className="rounded-md bg-warm-cream p-4 text-sm text-deep-slate shadow">
              Reports will appear after your spreadsheet data is loaded.
            </div>
          ) : null}
        </main>

        <BottomNav />
      </div>
    </AuthGate>
  );
}
