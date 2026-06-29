import {
  DEFAULT_CURRENCY,
  DEFAULT_SPREADSHEET_ROWS,
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
  type TransactionSheetRow,
  type SheetName,
} from "./spreadsheetSchema";
import { updateUserSpreadsheetRegistry } from "./userRegistry";

const sheetsApiBaseUrl = "https://sheets.googleapis.com/v4/spreadsheets";
const googleApiTimeoutMs = 30000;
const firestoreTimeoutMs = 20000;

type GoogleSpreadsheetCreateResponse = {
  spreadsheetId: string;
  spreadsheetUrl: string;
};

type ValueRange = {
  range: string;
  values: (string | number | boolean)[][];
};

type AppendValuesResponse = {
  updates?: {
    updatedRange?: string;
  };
};

type SpreadsheetMetadataResponse = {
  sheets?: Array<{
    properties?: {
      sheetId?: number;
      title?: string;
    };
  }>;
};

type TransactionRowLookupResponse = {
  values?: string[][];
};

export type CreatedUserSpreadsheet = {
  spreadsheetId: string;
  spreadsheetUrl: string;
};

export type SpreadsheetBootstrapStep =
  | "creating_spreadsheet"
  | "writing_default_sheets"
  | "saving_registry";

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
    "Content-Type": "application/json",
  };
}

function toTransactionValues(transaction: TransactionSheetRow) {
  return [
    transaction.id,
    transaction.date,
    transaction.description,
    transaction.type,
    transaction.accountId,
    transaction.categoryValue,
    transaction.amount,
    transaction.currency,
    transaction.note,
    transaction.transferGroupId,
    transaction.createdAt,
    transaction.updatedAt,
  ];
}

function toAccountValues(account: AccountSheetRow) {
  return [
    account.id,
    account.name,
    account.kind,
    account.openingBalance,
    account.currency,
    account.isActive,
    account.createdAt,
    account.updatedAt,
  ];
}

function toCategoryValues(category: CategorySheetRow) {
  return [
    category.id,
    category.value,
    category.label,
    category.kind,
    category.colorClass,
    category.isActive,
    category.sortOrder,
  ];
}

function toBudgetValues(budget: BudgetSheetRow) {
  return [
    budget.id,
    budget.categoryValue,
    budget.periodType,
    budget.period,
    budget.amountMax,
    budget.isActive,
    budget.createdAt,
    budget.updatedAt,
  ];
}

function toGoalValues(goal: GoalSheetRow) {
  return [
    goal.id,
    goal.name,
    goal.targetAmount,
    goal.currentAmount,
    goal.accountId,
    goal.dueDate,
    goal.isActive,
    goal.createdAt,
    goal.updatedAt,
    goal.note,
  ];
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

async function requestGoogleApi<T>({
  accessToken,
  url,
  body,
}: {
  accessToken: string;
  url: string;
  body: unknown;
}) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => {
    controller.abort();
  }, googleApiTimeoutMs);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: getAuthHeaders(accessToken),
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(await parseGoogleApiError(response));
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Google API request timed out. Please check the enabled APIs and try again.");
    }

    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

async function requestGoogleApiGet<T>({
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
      throw new Error(await parseGoogleApiError(response));
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Google API request timed out. Please check the enabled APIs and try again.");
    }

    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

function toSpreadsheetRows(sheetName: SheetName) {
  if (sheetName === "settings") {
    const rows = DEFAULT_SPREADSHEET_ROWS.settings;
    return rows.map((row) => [
      row.key,
      row.value,
      row.valueType,
      row.updatedAt,
      row.note,
    ]);
  }

  if (sheetName === "accounts") {
    const rows = DEFAULT_SPREADSHEET_ROWS.accounts;
    return rows.map((row) => [
      row.id,
      row.name,
      row.kind,
      row.openingBalance,
      row.currency,
      row.isActive,
      row.createdAt,
      row.updatedAt,
    ]);
  }

  if (sheetName === "categories") {
    const rows = DEFAULT_SPREADSHEET_ROWS.categories;
    return rows.map((row) => [
      row.id,
      row.value,
      row.label,
      row.kind,
      row.colorClass,
      row.isActive,
      row.sortOrder,
    ]);
  }

  if (sheetName === "transactions") {
    const rows = DEFAULT_SPREADSHEET_ROWS.transactions;
    return rows.map((row) => [
      row.id,
      row.date,
      row.description,
      row.type,
      row.accountId,
      row.categoryValue,
      row.amount,
      row.currency,
      row.note,
      row.transferGroupId,
      row.createdAt,
      row.updatedAt,
    ]);
  }

  if (sheetName === "budgets") {
    const rows = DEFAULT_SPREADSHEET_ROWS.budgets;
    return rows.map((row) => [
      row.id,
      row.categoryValue,
      row.periodType,
      row.period,
      row.amountMax,
      row.isActive,
      row.createdAt,
      row.updatedAt,
    ]);
  }

  const rows = DEFAULT_SPREADSHEET_ROWS.goals;
  return rows.map((row) => [
    row.id,
    row.name,
    row.targetAmount,
    row.currentAmount,
    row.accountId,
    row.dueDate,
    row.isActive,
    row.createdAt,
    row.updatedAt,
    row.note,
  ]);
}

function getInitialValueRanges(): ValueRange[] {
  return sheetOrder.map((sheetName) => ({
    range: `${SHEET_NAMES[sheetName]}!A1`,
    values: [[...SHEET_HEADERS[sheetName]], ...toSpreadsheetRows(sheetName)],
  }));
}

export async function createUserSpreadsheet({
  accessToken,
  displayName,
  onStep,
}: {
  accessToken: string;
  displayName: string | null;
  onStep?: (step: SpreadsheetBootstrapStep) => void;
}) {
  const title = displayName
    ? `Purrney - ${displayName}`
    : "Purrney Personal Finance";

  onStep?.("creating_spreadsheet");
  const createResponse = await requestGoogleApi<GoogleSpreadsheetCreateResponse>({
    accessToken,
    url: sheetsApiBaseUrl,
    body: {
      properties: {
        title,
      },
      sheets: sheetOrder.map((sheetName) => ({
        properties: {
          title: SHEET_NAMES[sheetName],
        },
      })),
    },
  });

  onStep?.("writing_default_sheets");
  await requestGoogleApi({
    accessToken,
    url: `${sheetsApiBaseUrl}/${createResponse.spreadsheetId}/values:batchUpdate`,
    body: {
      valueInputOption: "RAW",
      data: getInitialValueRanges(),
    },
  });

  return {
    spreadsheetId: createResponse.spreadsheetId,
    spreadsheetUrl: createResponse.spreadsheetUrl,
  };
}

function withTimeout<T>({
  promise,
  timeoutMs,
  errorMessage,
}: {
  promise: Promise<T>;
  timeoutMs: number;
  errorMessage: string;
}) {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      window.setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
    }),
  ]);
}

export async function createAndSaveUserSpreadsheet({
  accessToken,
  uid,
  displayName,
  onStep,
}: {
  accessToken: string;
  uid: string;
  displayName: string | null;
  onStep?: (step: SpreadsheetBootstrapStep) => void;
}): Promise<CreatedUserSpreadsheet> {
  const spreadsheet = await createUserSpreadsheet({
    accessToken,
    displayName,
    onStep,
  });

  onStep?.("saving_registry");
  await withTimeout({
    promise: updateUserSpreadsheetRegistry({
      uid,
      spreadsheetId: spreadsheet.spreadsheetId,
      spreadsheetUrl: spreadsheet.spreadsheetUrl,
    }),
    timeoutMs: firestoreTimeoutMs,
    errorMessage: "Saving spreadsheet metadata to Firestore timed out.",
  });

  return spreadsheet;
}

export async function appendTransactionToSpreadsheet({
  accessToken,
  spreadsheetId,
  transaction,
}: {
  accessToken: string;
  spreadsheetId: string;
  transaction: TransactionSheetRow;
}) {
  return requestGoogleApi<AppendValuesResponse>({
    accessToken,
    url: `${sheetsApiBaseUrl}/${spreadsheetId}/values/${SHEET_NAMES.transactions}!A:L:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
    body: {
      values: [toTransactionValues(transaction)],
    },
  });
}

export async function appendTransactionsToSpreadsheet({
  accessToken,
  spreadsheetId,
  transactions,
}: {
  accessToken: string;
  spreadsheetId: string;
  transactions: TransactionSheetRow[];
}) {
  return requestGoogleApi<AppendValuesResponse>({
    accessToken,
    url: `${sheetsApiBaseUrl}/${spreadsheetId}/values/${SHEET_NAMES.transactions}!A:L:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
    body: {
      values: transactions.map(toTransactionValues),
    },
  });
}

export async function appendAccountToSpreadsheet({
  accessToken,
  spreadsheetId,
  account,
}: {
  accessToken: string;
  spreadsheetId: string;
  account: AccountSheetRow;
}) {
  return requestGoogleApi<AppendValuesResponse>({
    accessToken,
    url: `${sheetsApiBaseUrl}/${spreadsheetId}/values/${SHEET_NAMES.accounts}!A:H:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
    body: {
      values: [toAccountValues(account)],
    },
  });
}

export async function appendCategoryToSpreadsheet({
  accessToken,
  spreadsheetId,
  category,
}: {
  accessToken: string;
  spreadsheetId: string;
  category: CategorySheetRow;
}) {
  return requestGoogleApi<AppendValuesResponse>({
    accessToken,
    url: `${sheetsApiBaseUrl}/${spreadsheetId}/values/${SHEET_NAMES.categories}!A:G:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
    body: {
      values: [toCategoryValues(category)],
    },
  });
}

export async function appendBudgetToSpreadsheet({
  accessToken,
  spreadsheetId,
  budget,
}: {
  accessToken: string;
  spreadsheetId: string;
  budget: BudgetSheetRow;
}) {
  return requestGoogleApi<AppendValuesResponse>({
    accessToken,
    url: `${sheetsApiBaseUrl}/${spreadsheetId}/values/${SHEET_NAMES.budgets}!A:H:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
    body: {
      values: [toBudgetValues(budget)],
    },
  });
}

export async function appendGoalToSpreadsheet({
  accessToken,
  spreadsheetId,
  goal,
}: {
  accessToken: string;
  spreadsheetId: string;
  goal: GoalSheetRow;
}) {
  return requestGoogleApi<AppendValuesResponse>({
    accessToken,
    url: `${sheetsApiBaseUrl}/${spreadsheetId}/values/${SHEET_NAMES.goals}!A:J:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
    body: {
      values: [toGoalValues(goal)],
    },
  });
}

export async function appendTransferToSpreadsheet({
  accessToken,
  spreadsheetId,
  fromTransaction,
  toTransaction,
}: {
  accessToken: string;
  spreadsheetId: string;
  fromTransaction: TransactionSheetRow;
  toTransaction: TransactionSheetRow;
}) {
  return requestGoogleApi<AppendValuesResponse>({
    accessToken,
    url: `${sheetsApiBaseUrl}/${spreadsheetId}/values/${SHEET_NAMES.transactions}!A:L:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
    body: {
      values: [
        toTransactionValues(fromTransaction),
        toTransactionValues(toTransaction),
      ],
    },
  });
}

export async function deleteTransactionFromSpreadsheet({
  accessToken,
  spreadsheetId,
  transactionId,
  transferGroupId,
}: {
  accessToken: string;
  spreadsheetId: string;
  transactionId: string;
  transferGroupId?: string;
}) {
  const metadata = await requestGoogleApiGet<SpreadsheetMetadataResponse>({
    accessToken,
    url: `${sheetsApiBaseUrl}/${spreadsheetId}?fields=sheets.properties(sheetId,title)`,
  });
  const transactionsSheet = metadata.sheets?.find(
    (sheet) => sheet.properties?.title === SHEET_NAMES.transactions
  );
  const sheetId = transactionsSheet?.properties?.sheetId;

  if (typeof sheetId !== "number") {
    throw new Error("Transactions sheet was not found.");
  }

  const rows = await requestGoogleApiGet<TransactionRowLookupResponse>({
    accessToken,
    url: `${sheetsApiBaseUrl}/${spreadsheetId}/values/${encodeURIComponent(`${SHEET_NAMES.transactions}!A:J`)}`,
  });
  const rowIndexes = (rows.values ?? [])
    .map((row, index) => ({
      index,
      id: row[0] ?? "",
      rowTransferGroupId: row[9] ?? "",
    }))
    .filter(({ index, id, rowTransferGroupId }) => {
      if (index === 0) {
        return false;
      }

      return id === transactionId || Boolean(transferGroupId && rowTransferGroupId === transferGroupId);
    })
    .map(({ index }) => index)
    .sort((first, second) => second - first);

  if (rowIndexes.length === 0) {
    throw new Error("Transaction was not found in the spreadsheet.");
  }

  return requestGoogleApi({
    accessToken,
    url: `${sheetsApiBaseUrl}/${spreadsheetId}:batchUpdate`,
    body: {
      requests: rowIndexes.map((rowIndex) => ({
        deleteDimension: {
          range: {
            sheetId,
            dimension: "ROWS",
            startIndex: rowIndex,
            endIndex: rowIndex + 1,
          },
        },
      })),
    },
  });
}

export async function appendGoalContributionToSpreadsheet({
  accessToken,
  spreadsheetId,
  transaction,
  goal,
}: {
  accessToken: string;
  spreadsheetId: string;
  transaction: TransactionSheetRow;
  goal: GoalSheetRow;
}) {
  await appendTransactionToSpreadsheet({
    accessToken,
    spreadsheetId,
    transaction,
  });

  return appendGoalToSpreadsheet({
    accessToken,
    spreadsheetId,
    goal,
  });
}

export function createTransactionId() {
  const now = new Date();
  const timestamp = now
    .toISOString()
    .replace(/[-:.TZ]/g, "")
    .slice(0, 14);
  const random = Math.random().toString(36).slice(2, 8);

  return `tx_${timestamp}_${random}`;
}

function slugifyId(value: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return slug || "wallet";
}

export function createAccountRow({
  name,
  kind,
  openingBalance,
}: {
  name: string;
  kind: AccountKind;
  openingBalance: number;
}): AccountSheetRow {
  const timestamp = new Date().toISOString();
  const random = Math.random().toString(36).slice(2, 8);

  return {
    id: `acc_${slugifyId(name)}_${random}`,
    name,
    kind,
    openingBalance,
    currency: DEFAULT_CURRENCY,
    isActive: true,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function createCategoryRow({
  label,
  kind,
  colorClass,
  sortOrder,
}: {
  label: string;
  kind: CategoryKind;
  colorClass: string;
  sortOrder: number;
}): CategorySheetRow {
  return {
    id: `cat_${slugifyId(label)}`,
    value: slugifyId(label),
    label,
    kind,
    colorClass,
    isActive: true,
    sortOrder,
  };
}

export function createBudgetRow({
  categoryValue,
  periodType,
  period,
  amountMax,
}: {
  categoryValue: string;
  periodType: BudgetPeriodType;
  period: string;
  amountMax: number;
}): BudgetSheetRow {
  const timestamp = new Date().toISOString();

  return {
    id: `budget_${categoryValue}_${period.replace(/[^a-zA-Z0-9]+/g, "_")}`,
    categoryValue,
    periodType,
    period,
    amountMax,
    isActive: true,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function createGoalRow({
  name,
  targetAmount,
  currentAmount,
  accountId,
  dueDate,
  note = "",
}: {
  name: string;
  targetAmount: number;
  currentAmount: number;
  accountId: string;
  dueDate: string;
  note?: string;
}): GoalSheetRow {
  const timestamp = new Date().toISOString();
  const random = Math.random().toString(36).slice(2, 8);

  return {
    id: `goal_${slugifyId(name)}_${random}`,
    name,
    targetAmount,
    currentAmount,
    accountId,
    dueDate,
    isActive: true,
    createdAt: timestamp,
    updatedAt: timestamp,
    note,
  };
}

export function createTransferRows({
  date,
  description,
  fromAccountId,
  toAccountId,
  amount,
  note = "",
}: {
  date: string;
  description: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  note?: string;
}) {
  const timestamp = new Date().toISOString();
  const transferGroupId = `trf_${timestamp.replace(/[-:.TZ]/g, "").slice(0, 14)}_${Math.random().toString(36).slice(2, 8)}`;

  const base = {
    date,
    description,
    amount,
    currency: DEFAULT_CURRENCY,
    note,
    transferGroupId,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  return {
    fromTransaction: {
      ...base,
      id: createTransactionId(),
      type: "out" as const,
      accountId: fromAccountId,
      categoryValue: "transfer",
    },
    toTransaction: {
      ...base,
      id: createTransactionId(),
      type: "in" as const,
      accountId: toAccountId,
      categoryValue: "transfer",
    },
  };
}

export function createTransactionRow({
  date,
  description,
  type,
  accountId,
  categoryValue,
  amount,
  note = "",
}: {
  date: string;
  description: string;
  type: TransactionSheetRow["type"];
  accountId: string;
  categoryValue: string;
  amount: number;
  note?: string;
}): TransactionSheetRow {
  const timestamp = new Date().toISOString();

  return {
    id: createTransactionId(),
    date,
    description,
    type,
    accountId,
    categoryValue,
    amount,
    currency: DEFAULT_CURRENCY,
    note,
    transferGroupId: "",
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function createGoalContributionRows({
  goal,
  accountId,
  amount,
  date,
  note = "",
}: {
  goal: GoalSheetRow;
  accountId: string;
  amount: number;
  date: string;
  note?: string;
}) {
  const timestamp = new Date().toISOString();
  const nextCurrentAmount = goal.currentAmount + amount;

  return {
    transaction: createTransactionRow({
      date,
      description: `Goal Contribution - ${goal.name}`,
      type: "out",
      accountId,
      categoryValue: "goal_contribution",
      amount,
      note: note.trim() || `Contribution to ${goal.name}`,
    }),
    goal: {
      ...goal,
      currentAmount: nextCurrentAmount,
      accountId: goal.accountId || accountId,
      updatedAt: timestamp,
    },
  };
}

export function getSpreadsheetUrl(spreadsheetId: string) {
  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
}

export { SPREADSHEET_SCHEMA_VERSION };
