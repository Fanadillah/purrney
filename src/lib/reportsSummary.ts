import type {
  DashboardAccount,
  DashboardData,
  DashboardTransaction,
  ParsedSpreadsheetData,
} from "./spreadsheetData";
import type { CategoryKind, TransactionSheetRow } from "./spreadsheetSchema";

export type ReportSegment = {
  id: string;
  label: string;
  amount: number;
  percentage: number;
  color: string;
};

export type ReportTransaction = DashboardTransaction & {
  label: string;
  isTransfer: boolean;
};

export type ReportsSummary = {
  period: string;
  income: number;
  expense: number;
  netCashflow: number;
  transactionCount: number;
  incomeExpenseMax: number;
  expenseByCategory: ReportSegment[];
  incomeByCategory: ReportSegment[];
  walletBreakdown: ReportSegment[];
  biggestTransactions: ReportTransaction[];
  budgetWatch: ReportSegment[];
};

const chartColors = [
  "#f59e0b",
  "#10b981",
  "#ef4444",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#64748b",
];

function getColor(index: number) {
  return chartColors[index % chartColors.length];
}

function isInPeriod(transaction: TransactionSheetRow | DashboardTransaction, period: string) {
  return transaction.date.startsWith(period);
}

function isTransfer(transaction: TransactionSheetRow | DashboardTransaction) {
  return Boolean(transaction.transferGroupId);
}

function sumTransactions(transactions: TransactionSheetRow[], type: "in" | "out") {
  return transactions
    .filter((transaction) => transaction.type === type && !isTransfer(transaction))
    .reduce((sum, transaction) => sum + transaction.amount, 0);
}

function buildCategorySegments({
  transactions,
  categories,
  kind,
}: {
  transactions: TransactionSheetRow[];
  categories: ParsedSpreadsheetData["categories"];
  kind: CategoryKind;
}) {
  const categoryByValue = new Map(categories.map((category) => [category.value, category]));
  const targetType = kind === "income" ? "in" : "out";
  const amountByCategory = new Map<string, number>();

  transactions
    .filter((transaction) => transaction.type === targetType && !isTransfer(transaction))
    .forEach((transaction) => {
      amountByCategory.set(
        transaction.categoryValue,
        (amountByCategory.get(transaction.categoryValue) ?? 0) + transaction.amount
      );
    });

  const total = Array.from(amountByCategory.values()).reduce((sum, amount) => sum + amount, 0);

  return Array.from(amountByCategory.entries())
    .map(([categoryValue, amount], index) => {
      const category = categoryByValue.get(categoryValue);

      return {
        id: categoryValue,
        label: category?.label ?? categoryValue,
        amount,
        percentage: total > 0 ? Math.round((amount / total) * 100) : 0,
        color: getColor(index),
      };
    })
    .sort((left, right) => right.amount - left.amount);
}

function buildWalletSegments(accounts: DashboardAccount[]) {
  const positiveAccounts = accounts.filter((account) => account.balance > 0);
  const total = positiveAccounts.reduce((sum, account) => sum + account.balance, 0);

  return positiveAccounts
    .map((account, index) => ({
      id: account.id,
      label: account.name,
      amount: account.balance,
      percentage: total > 0 ? Math.round((account.balance / total) * 100) : 0,
      color: getColor(index),
    }))
    .sort((left, right) => right.amount - left.amount);
}

function buildBiggestTransactions({
  transactions,
  categories,
}: {
  transactions: TransactionSheetRow[];
  categories: ParsedSpreadsheetData["categories"];
}) {
  const categoryByValue = new Map(categories.map((category) => [category.value, category]));

  return transactions
    .map((transaction) => {
      const transfer = isTransfer(transaction);

      return {
        id: transaction.id,
        description: transaction.description,
        category: transaction.categoryValue,
        amount: transaction.amount,
        date: transaction.date,
        type: transaction.type,
        transferGroupId: transaction.transferGroupId,
        label: transfer
          ? "Transfer"
          : categoryByValue.get(transaction.categoryValue)?.label ?? transaction.categoryValue,
        isTransfer: transfer,
      };
    })
    .sort((left, right) => right.amount - left.amount)
    .slice(0, 5);
}

function buildBudgetWatch({
  data,
  period,
}: {
  data: ParsedSpreadsheetData;
  period: string;
}) {
  const expenseByCategory = buildCategorySegments({
    transactions: data.transactions.filter((transaction) => isInPeriod(transaction, period)),
    categories: data.categories,
    kind: "expense",
  });
  const amountByCategory = new Map(
    expenseByCategory.map((segment) => [segment.id, segment.amount])
  );
  const categoryByValue = new Map(data.categories.map((category) => [category.value, category]));

  return data.budgets
    .filter((budget) => budget.isActive && budget.period === period)
    .map((budget, index) => {
      const amount = amountByCategory.get(budget.categoryValue) ?? 0;

      return {
        id: budget.id,
        label: categoryByValue.get(budget.categoryValue)?.label ?? budget.categoryValue,
        amount,
        percentage: budget.amountMax > 0 ? Math.round((amount / budget.amountMax) * 100) : 0,
        color: getColor(index),
      };
    })
    .sort((left, right) => right.percentage - left.percentage)
    .slice(0, 5);
}

export function createReportsSummary({
  data,
  dashboard,
  period,
}: {
  data: ParsedSpreadsheetData;
  dashboard: DashboardData;
  period: string;
}): ReportsSummary {
  const periodTransactions = data.transactions.filter((transaction) =>
    isInPeriod(transaction, period)
  );
  const income = sumTransactions(periodTransactions, "in");
  const expense = sumTransactions(periodTransactions, "out");

  return {
    period,
    income,
    expense,
    netCashflow: income - expense,
    transactionCount: periodTransactions.length,
    incomeExpenseMax: Math.max(income, expense, 1),
    expenseByCategory: buildCategorySegments({
      transactions: periodTransactions,
      categories: data.categories,
      kind: "expense",
    }).slice(0, 5),
    incomeByCategory: buildCategorySegments({
      transactions: periodTransactions,
      categories: data.categories,
      kind: "income",
    }).slice(0, 5),
    walletBreakdown: buildWalletSegments(dashboard.accounts),
    biggestTransactions: buildBiggestTransactions({
      transactions: periodTransactions,
      categories: data.categories,
    }),
    budgetWatch: buildBudgetWatch({ data, period }),
  };
}
