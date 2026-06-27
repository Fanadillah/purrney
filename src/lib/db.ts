import {
  DEFAULT_CREATED_AT,
  DEFAULT_CURRENCY,
  type AccountSheetRow,
  type BudgetSheetRow,
  type CategorySheetRow,
  type GoalSheetRow,
  type SettingSheetRow,
  type TransactionSheetRow,
  type TransactionType,
} from "./spreadsheetSchema";

export type {
  AccountSheetRow,
  BudgetSheetRow,
  CategorySheetRow,
  GoalSheetRow,
  SettingSheetRow,
  TransactionSheetRow,
};

export type UserProfile = {
  name: string;
  avatar: string;
};

export type Transaction = {
  id: string;
  description: string;
  category: string;
  amount: number;
  date: string;
  type: TransactionType;
};

export type ProgressData = {
  id: string;
  category: string;
  amount: number;
  amountMax: number;
  color: string;
};

export type Account = {
  id: string;
  name: string;
  balance: number;
};

export type CategoryOption = {
  value: string;
  label: string;
};

const currentPeriod = "2024-06";

const user: UserProfile = {
  name: "Ilham",
  avatar: "/assets/user-avatar.png",
};

const settingSheet: SettingSheetRow[] = [
  {
    key: "schema_version",
    value: "1.0.0",
    valueType: "string",
    updatedAt: DEFAULT_CREATED_AT,
    note: "Current Purrney spreadsheet schema version.",
  },
  {
    key: "currency",
    value: DEFAULT_CURRENCY,
    valueType: "string",
    updatedAt: DEFAULT_CREATED_AT,
    note: "Default currency for money values.",
  },
  {
    key: "timezone",
    value: "Asia/Jakarta",
    valueType: "string",
    updatedAt: DEFAULT_CREATED_AT,
    note: "Default timezone for date grouping.",
  },
];

const accountSheet: AccountSheetRow[] = [
  {
    id: "acc_cash",
    name: "Cash",
    kind: "cash",
    openingBalance: 500000,
    currency: DEFAULT_CURRENCY,
    isActive: true,
    createdAt: DEFAULT_CREATED_AT,
    updatedAt: DEFAULT_CREATED_AT,
  },
  {
    id: "acc_bca",
    name: "BCA",
    kind: "bank",
    openingBalance: 1500000,
    currency: DEFAULT_CURRENCY,
    isActive: true,
    createdAt: DEFAULT_CREATED_AT,
    updatedAt: DEFAULT_CREATED_AT,
  },
  {
    id: "acc_bri",
    name: "BRI",
    kind: "bank",
    openingBalance: 2000000,
    currency: DEFAULT_CURRENCY,
    isActive: true,
    createdAt: DEFAULT_CREATED_AT,
    updatedAt: DEFAULT_CREATED_AT,
  },
  {
    id: "acc_mandiri",
    name: "Mandiri",
    kind: "bank",
    openingBalance: 3500000,
    currency: DEFAULT_CURRENCY,
    isActive: true,
    createdAt: DEFAULT_CREATED_AT,
    updatedAt: DEFAULT_CREATED_AT,
  },
  {
    id: "acc_gopay",
    name: "Gopay",
    kind: "ewallet",
    openingBalance: 500000,
    currency: DEFAULT_CURRENCY,
    isActive: true,
    createdAt: DEFAULT_CREATED_AT,
    updatedAt: DEFAULT_CREATED_AT,
  },
  {
    id: "acc_ovo",
    name: "OVO",
    kind: "ewallet",
    openingBalance: 1000000,
    currency: DEFAULT_CURRENCY,
    isActive: true,
    createdAt: DEFAULT_CREATED_AT,
    updatedAt: DEFAULT_CREATED_AT,
  },
  {
    id: "acc_dana",
    name: "DANA",
    kind: "ewallet",
    openingBalance: 750000,
    currency: DEFAULT_CURRENCY,
    isActive: true,
    createdAt: DEFAULT_CREATED_AT,
    updatedAt: DEFAULT_CREATED_AT,
  },
  {
    id: "acc_shopeepay",
    name: "ShopeePay",
    kind: "ewallet",
    openingBalance: 1250000,
    currency: DEFAULT_CURRENCY,
    isActive: true,
    createdAt: DEFAULT_CREATED_AT,
    updatedAt: DEFAULT_CREATED_AT,
  },
];

const categorySheet: CategorySheetRow[] = [
  { id: "cat_income", value: "income", label: "Income", kind: "income", colorClass: "bg-money-in", isActive: true, sortOrder: 10 },
  { id: "cat_food", value: "food", label: "Food", kind: "expense", colorClass: "bg-food", isActive: true, sortOrder: 20 },
  { id: "cat_transport", value: "transport", label: "Transport", kind: "expense", colorClass: "bg-transport", isActive: true, sortOrder: 30 },
  { id: "cat_entertainment", value: "entertainment", label: "Entertainment", kind: "expense", colorClass: "bg-entertainment", isActive: true, sortOrder: 40 },
  { id: "cat_utilities", value: "utilities", label: "Utilities", kind: "expense", colorClass: "bg-utilities", isActive: true, sortOrder: 50 },
  { id: "cat_shopping", value: "shopping", label: "Shopping", kind: "expense", colorClass: "bg-shopping", isActive: true, sortOrder: 60 },
  { id: "cat_education", value: "education", label: "Education", kind: "expense", colorClass: "bg-education", isActive: true, sortOrder: 70 },
  { id: "cat_health", value: "health", label: "Health", kind: "expense", colorClass: "bg-health", isActive: true, sortOrder: 80 },
  { id: "cat_others", value: "others", label: "Others", kind: "expense", colorClass: "bg-others", isActive: true, sortOrder: 90 },
];

const budgetSheet: BudgetSheetRow[] = [
  { id: "budget_food_2024_06", categoryValue: "food", periodType: "monthly", period: currentPeriod, amountMax: 500000, isActive: true, createdAt: DEFAULT_CREATED_AT, updatedAt: DEFAULT_CREATED_AT },
  { id: "budget_utilities_2024_06", categoryValue: "utilities", periodType: "monthly", period: currentPeriod, amountMax: 1000000, isActive: true, createdAt: DEFAULT_CREATED_AT, updatedAt: DEFAULT_CREATED_AT },
  { id: "budget_entertainment_2024_06", categoryValue: "entertainment", periodType: "monthly", period: currentPeriod, amountMax: 400000, isActive: true, createdAt: DEFAULT_CREATED_AT, updatedAt: DEFAULT_CREATED_AT },
  { id: "budget_transport_2024_06", categoryValue: "transport", periodType: "monthly", period: currentPeriod, amountMax: 200000, isActive: true, createdAt: DEFAULT_CREATED_AT, updatedAt: DEFAULT_CREATED_AT },
  { id: "budget_others_2024_06", categoryValue: "others", periodType: "monthly", period: currentPeriod, amountMax: 500000, isActive: true, createdAt: DEFAULT_CREATED_AT, updatedAt: DEFAULT_CREATED_AT },
];

const transactionSheet: TransactionSheetRow[] = [
  {
    id: "tx_demo_001",
    date: "2024-06-01",
    description: "Grocery Shopping",
    type: "out",
    accountId: "acc_cash",
    categoryValue: "food",
    amount: 150000,
    currency: DEFAULT_CURRENCY,
    note: "",
    transferGroupId: "",
    createdAt: DEFAULT_CREATED_AT,
    updatedAt: DEFAULT_CREATED_AT,
  },
  {
    id: "tx_demo_002",
    date: "2024-06-01",
    description: "Salary",
    type: "in",
    accountId: "acc_bca",
    categoryValue: "income",
    amount: 5000000,
    currency: DEFAULT_CURRENCY,
    note: "",
    transferGroupId: "",
    createdAt: DEFAULT_CREATED_AT,
    updatedAt: DEFAULT_CREATED_AT,
  },
  {
    id: "tx_demo_003",
    date: "2024-06-02",
    description: "Electricity Bill",
    type: "out",
    accountId: "acc_bca",
    categoryValue: "utilities",
    amount: 300000,
    currency: DEFAULT_CURRENCY,
    note: "",
    transferGroupId: "",
    createdAt: DEFAULT_CREATED_AT,
    updatedAt: DEFAULT_CREATED_AT,
  },
  {
    id: "tx_demo_004",
    date: "2024-06-03",
    description: "Dinner with Friends",
    type: "out",
    accountId: "acc_cash",
    categoryValue: "food",
    amount: 200000,
    currency: DEFAULT_CURRENCY,
    note: "",
    transferGroupId: "",
    createdAt: DEFAULT_CREATED_AT,
    updatedAt: DEFAULT_CREATED_AT,
  },
  {
    id: "tx_demo_005",
    date: "2024-06-04",
    description: "Freelance Project",
    type: "in",
    accountId: "acc_bca",
    categoryValue: "income",
    amount: 2000000,
    currency: DEFAULT_CURRENCY,
    note: "",
    transferGroupId: "",
    createdAt: DEFAULT_CREATED_AT,
    updatedAt: DEFAULT_CREATED_AT,
  },
  {
    id: "tx_demo_006",
    date: "2024-06-05",
    description: "Movie Night",
    type: "out",
    accountId: "acc_gopay",
    categoryValue: "entertainment",
    amount: 100000,
    currency: DEFAULT_CURRENCY,
    note: "",
    transferGroupId: "",
    createdAt: DEFAULT_CREATED_AT,
    updatedAt: DEFAULT_CREATED_AT,
  },
  {
    id: "tx_demo_007",
    date: "2024-06-06",
    description: "Bus Pass",
    type: "out",
    accountId: "acc_gopay",
    categoryValue: "transport",
    amount: 50000,
    currency: DEFAULT_CURRENCY,
    note: "",
    transferGroupId: "",
    createdAt: DEFAULT_CREATED_AT,
    updatedAt: DEFAULT_CREATED_AT,
  },
  {
    id: "tx_demo_008",
    date: "2024-06-07",
    description: "Gym Membership",
    type: "out",
    accountId: "acc_bca",
    categoryValue: "others",
    amount: 250000,
    currency: DEFAULT_CURRENCY,
    note: "",
    transferGroupId: "",
    createdAt: DEFAULT_CREATED_AT,
    updatedAt: DEFAULT_CREATED_AT,
  },
];

const goalSheet: GoalSheetRow[] = [];

const categoryByValue = new Map(
  categorySheet.map((category) => [category.value, category])
);

const data: Transaction[] = transactionSheet.map((transaction) => ({
  id: transaction.id,
  description: transaction.description,
  category: transaction.categoryValue,
  amount: transaction.amount,
  date: transaction.date,
  type: transaction.type,
}));

const progressData: ProgressData[] = budgetSheet
  .filter((budget) => budget.isActive && budget.period === currentPeriod)
  .map((budget) => {
    const amount = transactionSheet
      .filter(
        (transaction) =>
          transaction.type === "out" &&
          transaction.categoryValue === budget.categoryValue &&
          transaction.date.startsWith(budget.period)
      )
      .reduce((sum, transaction) => sum + transaction.amount, 0);

    const category = categoryByValue.get(budget.categoryValue);

    return {
      id: budget.id,
      category: category?.label ?? budget.categoryValue,
      amount,
      amountMax: budget.amountMax,
      color: category?.colorClass ?? "bg-others",
    };
  });

const accounts: Account[] = accountSheet
  .filter((account) => account.isActive)
  .map((account) => {
    const transactionDelta = transactionSheet
      .filter((transaction) => transaction.accountId === account.id)
      .reduce((sum, transaction) => {
        return transaction.type === "in"
          ? sum + transaction.amount
          : sum - transaction.amount;
      }, 0);

    return {
      id: account.id,
      name: account.name,
      balance: account.openingBalance + transactionDelta,
    };
  });

const categories: CategoryOption[] = categorySheet.map((category) => ({
  value: category.value,
  label: category.label,
}));

export {
  user,
  settingSheet,
  accountSheet,
  categorySheet,
  budgetSheet,
  goalSheet,
  transactionSheet,
  data,
  progressData,
  accounts,
  categories,
};
