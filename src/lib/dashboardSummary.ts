import type { DashboardData } from "./spreadsheetData";

export function calculateDashboardSummary(dashboard: DashboardData) {
  const income = dashboard.transactions
    .filter((transaction) => transaction.type === "in" && !transaction.transferGroupId)
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const expense = dashboard.transactions
    .filter((transaction) => transaction.type === "out" && !transaction.transferGroupId)
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const totalBalance = dashboard.accounts.reduce(
    (sum, account) => sum + account.balance,
    0
  );

  return { income, expense, totalBalance };
}
