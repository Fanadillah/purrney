import {
  SHEET_HEADERS,
  SHEET_NAMES,
  SPREADSHEET_SCHEMA_VERSION,
  type AccountKind,
  type AccountSheetRow,
  type BudgetPeriodType,
  type BudgetSheetRow,
  type CategoryKind,
  type CategorySheetRow,
  type GoalSheetRow,
  type SettingSheetRow,
  type SettingValueType,
  type SheetName,
  type TransactionSheetRow,
  type TransactionType,
} from "./spreadsheetSchema";

export type SpreadsheetServiceErrorCode =
  | "google_api_error"
  | "google_api_timeout"
  | "missing_sheet"
  | "invalid_schema"
  | "invalid_row";

export class SpreadsheetServiceError extends Error {
  code: SpreadsheetServiceErrorCode;
  details?: string[];

  constructor({
    code,
    message,
    details,
  }: {
    code: SpreadsheetServiceErrorCode;
    message: string;
    details?: string[];
  }) {
    super(message);
    this.name = "SpreadsheetServiceError";
    this.code = code;
    this.details = details;
  }
}

export type RawSheetTable = {
  sheetName: SheetName;
  rows: string[][];
};

export type ParsedSpreadsheetData = {
  settings: SettingSheetRow[];
  accounts: AccountSheetRow[];
  categories: CategorySheetRow[];
  transactions: TransactionSheetRow[];
  budgets: BudgetSheetRow[];
  goals: GoalSheetRow[];
  warnings: string[];
};

export type DashboardAccount = {
  id: string;
  name: string;
  balance: number;
};

export type DashboardTransaction = {
  id: string;
  description: string;
  category: string;
  amount: number;
  date: string;
  type: TransactionType;
  transferGroupId?: string;
};

export type DashboardProgressData = {
  id: string;
  category: string;
  amount: number;
  amountMax: number;
  color: string;
};

export type CategoryOption = {
  value: string;
  label: string;
  kind: CategoryKind;
};

export type DashboardData = {
  accounts: DashboardAccount[];
  categories: CategoryOption[];
  transactions: DashboardTransaction[];
  progressData: DashboardProgressData[];
};

const googleApiTimeoutMs = 30000;
const sheetsApiBaseUrl = "https://sheets.googleapis.com/v4/spreadsheets";
const sheetOrder: SheetName[] = [
  "settings",
  "accounts",
  "categories",
  "transactions",
  "budgets",
  "goals",
];

function getAuthHeaders(accessToken: string) {
  return {
    Authorization: `Bearer ${accessToken}`,
  };
}

async function parseGoogleApiError(response: Response) {
  try {
    const payload = await response.json();
    const message =
      typeof payload?.error?.message === "string"
        ? payload.error.message
        : response.statusText;

    return `${response.status} ${message}`;
  } catch {
    return `${response.status} ${response.statusText}`;
  }
}

async function requestGoogleSheetsValues<T>({
  accessToken,
  url,
}: {
  accessToken: string;
  url: string;
}) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => {
    controller.abort();
  }, googleApiTimeoutMs);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: getAuthHeaders(accessToken),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new SpreadsheetServiceError({
        code: "google_api_error",
        message: await parseGoogleApiError(response),
      });
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new SpreadsheetServiceError({
        code: "google_api_timeout",
        message: "Google Sheets read request timed out.",
      });
    }

    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

function toBoolean(value: string) {
  return value.trim().toLowerCase() === "true";
}

function toNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function assertEnum<T extends string>({
  value,
  allowed,
  fallback,
}: {
  value: string;
  allowed: readonly T[];
  fallback: T;
}) {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

function normalizeRow(row: string[], width: number) {
  return Array.from({ length: width }, (_, index) => row[index] ?? "");
}

function validateHeader({
  sheetName,
  rows,
}: RawSheetTable) {
  const expected = SHEET_HEADERS[sheetName];
  const actual = rows[0] ?? [];
  const matches = expected.every((header, index) => actual[index] === header);

  if (!matches) {
    return `${SHEET_NAMES[sheetName]} header does not match schema ${SPREADSHEET_SCHEMA_VERSION}.`;
  }

  return null;
}

function withoutHeader(table: RawSheetTable) {
  return table.rows.slice(1).filter((row) => row.some((cell) => cell.trim() !== ""));
}

function parseSettings(table: RawSheetTable): SettingSheetRow[] {
  return withoutHeader(table).map((row) => {
    const [key, value, valueType, updatedAt, note] = normalizeRow(
      row,
      SHEET_HEADERS.settings.length
    );

    return {
      key,
      value,
      valueType: assertEnum<SettingValueType>({
        value: valueType,
        allowed: ["string", "number", "boolean", "date"],
        fallback: "string",
      }),
      updatedAt,
      note,
    };
  });
}

function parseAccounts(table: RawSheetTable): AccountSheetRow[] {
  const rows = withoutHeader(table).map((row) => {
    const [id, name, kind, openingBalance, currency, isActive, createdAt, updatedAt] =
      normalizeRow(row, SHEET_HEADERS.accounts.length);

    return {
      id,
      name,
      kind: assertEnum<AccountKind>({
        value: kind,
        allowed: ["cash", "bank", "ewallet"],
        fallback: "cash",
      }),
      openingBalance: toNumber(openingBalance),
      currency,
      isActive: toBoolean(isActive),
      createdAt,
      updatedAt,
    };
  });
  return Array.from(new Map(rows.map((row) => [row.id, row])).values());
}

function parseCategories(table: RawSheetTable): CategorySheetRow[] {
  const rows = withoutHeader(table).map((row) => {
    const [id, value, label, kind, colorClass, isActive, sortOrder] = normalizeRow(
      row,
      SHEET_HEADERS.categories.length
    );

    return {
      id,
      value,
      label,
      kind: assertEnum<CategoryKind>({
        value: kind,
        allowed: ["income", "expense"],
        fallback: "expense",
      }),
      colorClass,
      isActive: toBoolean(isActive),
      sortOrder: toNumber(sortOrder),
    };
  });
  return Array.from(new Map(rows.map((row) => [row.value, row])).values());
}

function parseTransactions(table: RawSheetTable): TransactionSheetRow[] {
  const rows = withoutHeader(table).map((row) => {
    const [
      id,
      date,
      description,
      type,
      accountId,
      categoryValue,
      amount,
      currency,
      note,
      transferGroupId,
      createdAt,
      updatedAt,
    ] = normalizeRow(row, SHEET_HEADERS.transactions.length);

    return {
      id,
      date,
      description,
      type: assertEnum<TransactionType>({
        value: type,
        allowed: ["in", "out"],
        fallback: "out",
      }),
      accountId,
      categoryValue,
      amount: toNumber(amount),
      currency,
      note,
      transferGroupId,
      createdAt,
      updatedAt,
    };
  });
  return Array.from(new Map(rows.map((row) => [row.id, row])).values());
}

function parseBudgets(table: RawSheetTable): BudgetSheetRow[] {
  const rows = withoutHeader(table).map((row) => {
    const [
      id,
      categoryValue,
      periodType,
      period,
      amountMax,
      isActive,
      createdAt,
      updatedAt,
    ] = normalizeRow(row, SHEET_HEADERS.budgets.length);

    return {
      id,
      categoryValue,
      periodType: assertEnum<BudgetPeriodType>({
        value: periodType,
        allowed: ["daily", "weekly", "monthly", "yearly", "custom"],
        fallback: "monthly",
      }),
      period,
      amountMax: toNumber(amountMax),
      isActive: toBoolean(isActive),
      createdAt,
      updatedAt,
    };
  });
  return Array.from(new Map(rows.map((row) => [row.id, row])).values());
}

function parseGoals(table: RawSheetTable): GoalSheetRow[] {
  const rows = withoutHeader(table).map((row) => {
    const [
      id,
      name,
      targetAmount,
      currentAmount,
      accountId,
      dueDate,
      isActive,
      createdAt,
      updatedAt,
      note,
    ] = normalizeRow(row, SHEET_HEADERS.goals.length);

    return {
      id,
      name,
      targetAmount: toNumber(targetAmount),
      currentAmount: toNumber(currentAmount),
      accountId,
      dueDate,
      isActive: toBoolean(isActive),
      createdAt,
      updatedAt,
      note,
    };
  });
  return Array.from(new Map(rows.map((row) => [row.id, row])).values());
}

function validateData(data: Omit<ParsedSpreadsheetData, "warnings">) {
  const warnings: string[] = [];
  const accountIds = new Set(data.accounts.map((account) => account.id));
  const categoryValues = new Set(data.categories.map((category) => category.value));

  data.transactions.forEach((transaction) => {
    if (!accountIds.has(transaction.accountId)) {
      warnings.push(`Transaction ${transaction.id} references missing account ${transaction.accountId}.`);
    }

    if (!transaction.transferGroupId && !categoryValues.has(transaction.categoryValue)) {
      warnings.push(`Transaction ${transaction.id} references missing category ${transaction.categoryValue}.`);
    }

    if (transaction.amount < 0) {
      warnings.push(`Transaction ${transaction.id} has a negative amount.`);
    }
  });

  data.budgets.forEach((budget) => {
    if (!categoryValues.has(budget.categoryValue)) {
      warnings.push(`Budget ${budget.id} references missing category ${budget.categoryValue}.`);
    }
  });

  data.goals.forEach((goal) => {
    if (goal.accountId && !accountIds.has(goal.accountId)) {
      warnings.push(`Goal ${goal.id} references missing account ${goal.accountId}.`);
    }
  });

  return warnings;
}

export function parseSpreadsheetTables(tables: RawSheetTable[]): ParsedSpreadsheetData {
  const tableByName = new Map(tables.map((table) => [table.sheetName, table]));
  const warnings: string[] = [];

  sheetOrder.forEach((sheetName) => {
    const table = tableByName.get(sheetName);

    if (!table) {
      throw new SpreadsheetServiceError({
        code: "missing_sheet",
        message: `Missing sheet ${SHEET_NAMES[sheetName]}.`,
      });
    }

    const headerWarning = validateHeader(table);
    if (headerWarning) warnings.push(headerWarning);
  });

  const data = {
    settings: parseSettings(tableByName.get("settings") as RawSheetTable),
    accounts: parseAccounts(tableByName.get("accounts") as RawSheetTable),
    categories: parseCategories(tableByName.get("categories") as RawSheetTable),
    transactions: parseTransactions(tableByName.get("transactions") as RawSheetTable),
    budgets: parseBudgets(tableByName.get("budgets") as RawSheetTable),
    goals: parseGoals(tableByName.get("goals") as RawSheetTable),
  };

  return {
    ...data,
    warnings: [...warnings, ...validateData(data)],
  };
}

type BatchGetValuesResponse = {
  valueRanges?: Array<{
    range: string;
    values?: string[][];
  }>;
};

export async function readSpreadsheetTables({
  accessToken,
  spreadsheetId,
}: {
  accessToken: string;
  spreadsheetId: string;
}) {
  const ranges = sheetOrder
    .map((sheetName) => `ranges=${encodeURIComponent(`${SHEET_NAMES[sheetName]}!A:Z`)}`)
    .join("&");
  const url = `${sheetsApiBaseUrl}/${spreadsheetId}/values:batchGet?${ranges}`;
  const response = await requestGoogleSheetsValues<BatchGetValuesResponse>({
    accessToken,
    url,
  });

  return sheetOrder.map((sheetName, index) => ({
    sheetName,
    rows: response.valueRanges?.[index]?.values ?? [],
  }));
}

export async function readUserSpreadsheet({
  accessToken,
  spreadsheetId,
}: {
  accessToken: string;
  spreadsheetId: string;
}) {
  const tables = await readSpreadsheetTables({ accessToken, spreadsheetId });
  return parseSpreadsheetTables(tables);
}

export async function readAccounts(params: {
  accessToken: string;
  spreadsheetId: string;
}) {
  return (await readUserSpreadsheet(params)).accounts;
}

export async function readCategories(params: {
  accessToken: string;
  spreadsheetId: string;
}) {
  return (await readUserSpreadsheet(params)).categories;
}

export async function readTransactions(params: {
  accessToken: string;
  spreadsheetId: string;
}) {
  return (await readUserSpreadsheet(params)).transactions;
}

export async function readBudgets(params: {
  accessToken: string;
  spreadsheetId: string;
}) {
  return (await readUserSpreadsheet(params)).budgets;
}

export async function readGoals(params: {
  accessToken: string;
  spreadsheetId: string;
}) {
  return (await readUserSpreadsheet(params)).goals;
}

export function mapSpreadsheetDataToDashboard({
  accounts,
  categories,
  transactions,
  budgets,
}: ParsedSpreadsheetData): DashboardData {
  const activeAccounts = accounts.filter((account) => account.isActive);
  const activeCategories = categories.filter((category) => category.isActive);
  const categoryByValue = new Map(activeCategories.map((category) => [category.value, category]));

  const dashboardAccounts = activeAccounts.map((account) => {
    const transactionDelta = transactions
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

  const dashboardTransactions = transactions.map((transaction) => ({
    id: transaction.id,
    description: transaction.description,
    category: transaction.categoryValue,
    amount: transaction.amount,
    date: transaction.date,
    type: transaction.type,
    transferGroupId: transaction.transferGroupId,
  }));

  const progressData = budgets
    .filter((budget) => budget.isActive)
    .map((budget) => {
      const amount = transactions
        .filter(
          (transaction) =>
            transaction.type === "out" &&
            !transaction.transferGroupId &&
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

  return {
    accounts: dashboardAccounts,
    categories: activeCategories.map((category) => ({
      value: category.value,
      label: category.label,
      kind: category.kind,
    })),
    transactions: dashboardTransactions,
    progressData,
  };
}
