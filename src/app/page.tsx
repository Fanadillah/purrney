'use client';
import { useMemo } from "react";
import Header from "./component/Header";
import BalanceSummary from "./component/BalanceSummary";
import RecentTransactions from "./component/RecentTransactions";
import BottomNav from "./component/BottomNav";
import ProgressBar from "./component/ProgressBar";
import DashboardGoals from "./component/DashboardGoals";
import QuickMenu from "./component/QuickMenu";
import DashboardSnapshot from "./component/DashboardSnapshot";
import CashflowInsight from "./component/CashflowInsight";
import CalendarActivity from "./component/CalendarActivity";
import DashboardEmptyState from "./component/DashboardEmptyState";
import { useSpreadsheetDashboard } from "./hooks/useSpreadsheetDashboard";
import { calculateDashboardSummary } from "@/lib/dashboardSummary";

export default function PurrneyHome() {
  const {
    dashboard,
    sourceData,
    status,
    error,
    warnings,
    needsReconnect,
    hasNoSpreadsheet,
    isEmpty,
    reconnectGoogleWorkspace,
  } = useSpreadsheetDashboard();
  const summary = useMemo(() => calculateDashboardSummary(dashboard), [dashboard]);
  const activeGoals = useMemo(
    () => sourceData?.goals.filter((goal) => goal.isActive) ?? [],
    [sourceData?.goals]
  );
  const activeBudgets = useMemo(
    () => sourceData?.budgets.filter((budget) => budget.isActive) ?? [],
    [sourceData?.budgets]
  );
  const snapshot = useMemo(() => {
    const netCashflow = summary.income - summary.expense;
    const transactionCount = dashboard.transactions.length;
    const budgetAmount = dashboard.progressData.reduce((sum, budget) => sum + budget.amount, 0);
    const budgetMax = dashboard.progressData.reduce((sum, budget) => sum + budget.amountMax, 0);
    const budgetUsage = budgetMax > 0 ? Math.round((budgetAmount / budgetMax) * 100) : 0;
    const goalProgress =
      activeGoals.length > 0
        ? Math.round(
            activeGoals.reduce((sum, goal) => {
              if (goal.targetAmount <= 0) return sum;
              return sum + Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
            }, 0) / activeGoals.length
          )
        : 0;

    return {
      netCashflow,
      transactionCount,
      budgetUsage,
      goalProgress,
    };
  }, [activeGoals, dashboard.progressData, dashboard.transactions.length, summary.expense, summary.income]);
  const showEmptyState =
    status === "success" &&
    dashboard.transactions.length === 0 &&
    activeGoals.length === 0 &&
    activeBudgets.length === 0;

  return (
    <div className="min-h-screen bg-app-background font-sans md:pl-20">
      <Header />
      <main className="mx-auto max-w-7xl space-y-4 pb-20 md:pb-8">
        {status === "loading" ? (
          <div className="mx-4 mb-3 rounded-md bg-warm-cream p-3 text-sm text-deep-slate shadow">
            Loading dashboard from your spreadsheet...
          </div>
        ) : null}
        {needsReconnect ? (
          <div className="mx-4 mb-3 rounded-md bg-orange-50 p-3 text-sm text-deep-slate shadow">
            <p>Reconnect Google Sheets access to load your spreadsheet dashboard.</p>
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
          <div className="mx-4 mb-3 rounded-md bg-orange-50 p-3 text-sm text-deep-slate shadow">
            Your Purrney spreadsheet is not ready yet.
          </div>
        ) : null}
        {error ? (
          <div className="mx-4 mb-3 rounded-md bg-red-50 p-3 text-sm text-money-out shadow">
            {error}
          </div>
        ) : null}
        {warnings.length > 0 ? (
          <div className="mx-4 mb-3 rounded-md bg-yellow-50 p-3 text-sm text-deep-slate shadow">
            <p className="font-semibold">Spreadsheet warnings</p>
            <ul className="mt-1 list-disc pl-5">
              {warnings.slice(0, 3).map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </div>
        ) : null}
        {isEmpty && !showEmptyState ? (
          <div className="mx-4 mb-3 rounded-md bg-warm-cream p-3 text-sm text-deep-slate shadow">
            Your spreadsheet is connected. Add your first transaction to start seeing activity here.
          </div>
        ) : null}
        {showEmptyState ? <DashboardEmptyState /> : null}
        <section className="grid gap-0 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-4">
            <BalanceSummary
              totalBalance={summary.totalBalance}
              income={summary.income}
              expense={summary.expense}
            />
            <CashflowInsight income={summary.income} expense={summary.expense} />
            <DashboardSnapshot
              netCashflow={snapshot.netCashflow}
              transactionCount={snapshot.transactionCount}
              budgetUsage={snapshot.budgetUsage}
              goalProgress={snapshot.goalProgress}
            />
            <div className="hidden xl:block">
              <ProgressBar data={dashboard.progressData} />
            </div>
          </div>
          <div className="space-y-4">
            <QuickMenu />
            <CalendarActivity transactions={dashboard.transactions} />
            <div className="xl:hidden">
              <ProgressBar data={dashboard.progressData} />
            </div>
            <DashboardGoals goals={sourceData?.goals ?? []} />
            <RecentTransactions data={dashboard.transactions} />
          </div>
        </section>
      </main>
      {/* <FloatingActionButton /> */}
      <BottomNav />
    </div>
  );
}
