import type { DashboardData } from "./spreadsheetData";

function getCurrentPeriod() {
  return new Date().toISOString().slice(0, 7);
}

export function calculateDashboardSummary(dashboard: DashboardData, period = getCurrentPeriod()) {
  const periodTransactions = dashboard.transactions.filter((transaction) =>
    transaction.date.startsWith(period)
  );
  const income = periodTransactions
    .filter((transaction) => transaction.type === "in" && !transaction.transferGroupId)
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const expense = periodTransactions
    .filter((transaction) => transaction.type === "out" && !transaction.transferGroupId)
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const totalBalance = dashboard.accounts.reduce(
    (sum, account) => sum + account.balance,
    0
  );

  return { income, expense, totalBalance };
}
