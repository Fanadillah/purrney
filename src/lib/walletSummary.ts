import type { DashboardData, ParsedSpreadsheetData } from "./spreadsheetData";
import type { AccountSheetRow, TransactionSheetRow } from "./spreadsheetSchema";

export type WalletActivityFilter = "all" | "income" | "expense" | "transfer";

export type WalletSummary = {
  account: AccountSheetRow;
  currentBalance: number;
  openingBalance: number;
  income: number;
  expense: number;
  transferIn: number;
  transferOut: number;
  netMovement: number;
  transactions: TransactionSheetRow[];
};

function getCurrentPeriod() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${now.getFullYear()}-${month}`;
}

function isTransfer(transaction: TransactionSheetRow) {
  return Boolean(transaction.transferGroupId);
}

export function createWalletSummary({
  data,
  dashboard,
  walletId,
  period = getCurrentPeriod(),
}: {
  data: ParsedSpreadsheetData;
  dashboard: DashboardData;
  walletId: string;
  period?: string;
}): WalletSummary | null {
  const account = data.accounts.find((item) => item.id === walletId);
  if (!account) return null;

  const dashboardAccount = dashboard.accounts.find((item) => item.id === walletId);
  const transactions = data.transactions
    .filter((transaction) => transaction.accountId === walletId)
    .sort((left, right) => right.date.localeCompare(left.date));
  const periodTransactions = transactions.filter((transaction) =>
    transaction.date.startsWith(period)
  );
  const income = periodTransactions
    .filter((transaction) => transaction.type === "in" && !isTransfer(transaction))
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const expense = periodTransactions
    .filter((transaction) => transaction.type === "out" && !isTransfer(transaction))
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const transferIn = periodTransactions
    .filter((transaction) => transaction.type === "in" && isTransfer(transaction))
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const transferOut = periodTransactions
    .filter((transaction) => transaction.type === "out" && isTransfer(transaction))
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  return {
    account,
    currentBalance: dashboardAccount?.balance ?? account.openingBalance,
    openingBalance: account.openingBalance,
    income,
    expense,
    transferIn,
    transferOut,
    netMovement: income - expense + transferIn - transferOut,
    transactions,
  };
}

export function filterWalletTransactions({
  transactions,
  filter,
}: {
  transactions: TransactionSheetRow[];
  filter: WalletActivityFilter;
}) {
  if (filter === "income") {
    return transactions.filter(
      (transaction) => transaction.type === "in" && !isTransfer(transaction)
    );
  }

  if (filter === "expense") {
    return transactions.filter(
      (transaction) => transaction.type === "out" && !isTransfer(transaction)
    );
  }

  if (filter === "transfer") {
    return transactions.filter(isTransfer);
  }

  return transactions;
}
