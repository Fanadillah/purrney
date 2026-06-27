export const SPREADSHEET_SCHEMA_VERSION = "1.0.0";

export const SHEET_NAMES = {
  settings: "settings",
  accounts: "accounts",
  categories: "categories",
  transactions: "transactions",
  budgets: "budgets",
  goals: "goals",
} as const;

export const SHEET_HEADERS = {
  settings: ["key", "value", "value_type", "updated_at", "note"],
  accounts: [
    "id",
    "name",
    "kind",
    "opening_balance",
    "currency",
    "is_active",
    "created_at",
    "updated_at",
  ],
  categories: [
    "id",
    "value",
    "label",
    "kind",
    "color_class",
    "is_active",
    "sort_order",
  ],
  transactions: [
    "id",
    "date",
    "description",
    "type",
    "account_id",
    "category_value",
    "amount",
    "currency",
    "note",
    "transfer_group_id",
    "created_at",
    "updated_at",
  ],
  budgets: [
    "id",
    "category_value",
    "period_type",
    "period",
    "amount_max",
    "is_active",
    "created_at",
    "updated_at",
  ],
  goals: [
    "id",
    "name",
    "target_amount",
    "current_amount",
    "account_id",
    "due_date",
    "is_active",
    "created_at",
    "updated_at",
    "note",
  ],
} as const;

export type SheetName = keyof typeof SHEET_NAMES;
export type AccountKind = "cash" | "bank" | "ewallet";
export type CategoryKind = "income" | "expense";
export type TransactionType = "in" | "out";
export type BudgetPeriodType = "daily" | "weekly" | "monthly" | "yearly" | "custom";
export type SettingValueType = "string" | "number" | "boolean" | "date";

export type SettingSheetRow = {
  key: string;
  value: string;
  valueType: SettingValueType;
  updatedAt: string;
  note: string;
};

export type AccountSheetRow = {
  id: string;
  name: string;
  kind: AccountKind;
  openingBalance: number;
  currency: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CategorySheetRow = {
  id: string;
  value: string;
  label: string;
  kind: CategoryKind;
  colorClass: string;
  isActive: boolean;
  sortOrder: number;
};

export type TransactionSheetRow = {
  id: string;
  date: string;
  description: string;
  type: TransactionType;
  accountId: string;
  categoryValue: string;
  amount: number;
  currency: string;
  note: string;
  transferGroupId: string;
  createdAt: string;
  updatedAt: string;
};

export type BudgetSheetRow = {
  id: string;
  categoryValue: string;
  periodType: BudgetPeriodType;
  period: string;
  amountMax: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type GoalSheetRow = {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  accountId: string;
  dueDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  note: string;
};

export const DEFAULT_CURRENCY = "IDR";
export const DEFAULT_CREATED_AT = "2026-01-01T00:00:00.000Z";

export const DEFAULT_SETTINGS: SettingSheetRow[] = [
  {
    key: "schema_version",
    value: SPREADSHEET_SCHEMA_VERSION,
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

export const DEFAULT_ACCOUNTS: AccountSheetRow[] = [
  {
    id: "acc_cash",
    name: "Cash",
    kind: "cash",
    openingBalance: 0,
    currency: DEFAULT_CURRENCY,
    isActive: true,
    createdAt: DEFAULT_CREATED_AT,
    updatedAt: DEFAULT_CREATED_AT,
  },
];

export const DEFAULT_CATEGORIES: CategorySheetRow[] = [
  {
    id: "cat_income",
    value: "income",
    label: "Other Income",
    kind: "income",
    colorClass: "bg-money-in",
    isActive: true,
    sortOrder: 10,
  },
  {
    id: "cat_salary",
    value: "salary",
    label: "Salary",
    kind: "income",
    colorClass: "bg-money-in",
    isActive: true,
    sortOrder: 20,
  },
  {
    id: "cat_freelance",
    value: "freelance",
    label: "Freelance",
    kind: "income",
    colorClass: "bg-money-in",
    isActive: true,
    sortOrder: 30,
  },
  {
    id: "cat_business",
    value: "business",
    label: "Business",
    kind: "income",
    colorClass: "bg-money-in",
    isActive: true,
    sortOrder: 40,
  },
  {
    id: "cat_investment",
    value: "investment",
    label: "Investment",
    kind: "income",
    colorClass: "bg-money-in",
    isActive: true,
    sortOrder: 50,
  },
  {
    id: "cat_food",
    value: "food",
    label: "Food",
    kind: "expense",
    colorClass: "bg-food",
    isActive: true,
    sortOrder: 110,
  },
  {
    id: "cat_transport",
    value: "transport",
    label: "Transport",
    kind: "expense",
    colorClass: "bg-transport",
    isActive: true,
    sortOrder: 120,
  },
  {
    id: "cat_entertainment",
    value: "entertainment",
    label: "Entertainment",
    kind: "expense",
    colorClass: "bg-entertainment",
    isActive: true,
    sortOrder: 130,
  },
  {
    id: "cat_utilities",
    value: "utilities",
    label: "Utilities",
    kind: "expense",
    colorClass: "bg-utilities",
    isActive: true,
    sortOrder: 140,
  },
  {
    id: "cat_shopping",
    value: "shopping",
    label: "Shopping",
    kind: "expense",
    colorClass: "bg-shopping",
    isActive: true,
    sortOrder: 150,
  },
  {
    id: "cat_education",
    value: "education",
    label: "Education",
    kind: "expense",
    colorClass: "bg-education",
    isActive: true,
    sortOrder: 160,
  },
  {
    id: "cat_health",
    value: "health",
    label: "Health",
    kind: "expense",
    colorClass: "bg-health",
    isActive: true,
    sortOrder: 170,
  },
  {
    id: "cat_others",
    value: "others",
    label: "Others",
    kind: "expense",
    colorClass: "bg-others",
    isActive: true,
    sortOrder: 180,
  },
  {
    id: "cat_transfer",
    value: "transfer",
    label: "Transfer",
    kind: "expense",
    colorClass: "bg-blue-400",
    isActive: true,
    sortOrder: 190,
  },
];

export const DEFAULT_BUDGETS: BudgetSheetRow[] = [];
export const DEFAULT_GOALS: GoalSheetRow[] = [];
export const DEFAULT_TRANSACTIONS: TransactionSheetRow[] = [];

export const DEFAULT_SPREADSHEET_ROWS = {
  settings: DEFAULT_SETTINGS,
  accounts: DEFAULT_ACCOUNTS,
  categories: DEFAULT_CATEGORIES,
  transactions: DEFAULT_TRANSACTIONS,
  budgets: DEFAULT_BUDGETS,
  goals: DEFAULT_GOALS,
} as const;
