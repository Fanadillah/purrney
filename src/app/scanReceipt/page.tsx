"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, Camera, Check, Loader2, Plus, RotateCcw, Trash2 } from "lucide-react";
import BottomNav from "../component/BottomNav";
import PendingSyncStatus from "../component/PendingSyncStatus";
import { useAuth } from "../api/AuthContext";
import { useSpreadsheetDashboard } from "../hooks/useSpreadsheetDashboard";
import { usePendingSpreadsheetSync } from "../hooks/usePendingSpreadsheetSync";
import {
  formatRupiahInput,
  type ReceiptOcrItem,
} from "@/lib/receiptOcr";
import { preprocessReceiptImages } from "@/lib/receiptImagePreprocessing";
import type { ReceiptOcrApiResponse } from "@/lib/receiptOcrSchema";
import {
  appendTransactionsToSpreadsheet,
  createTransactionRow,
} from "@/lib/userSpreadsheet";
import {
  enqueuePendingSpreadsheetWrite,
  isRetryableSpreadsheetWriteError,
} from "@/lib/offlineSync";

type SaveMode = "total" | "items";
type ScanStatus = "idle" | "reading" | "ready" | "saving" | "success" | "error";
type ExpenseCategoryOption = {
  kind: "income" | "expense";
  value: string;
  label: string;
};

function formatMoney(value: number) {
  return new Intl.NumberFormat("id-ID").format(value);
}

function parseAmountInput(value: string) {
  return Number(value.replace(/\D/g, ""));
}

function getDefaultExpenseCategory(categories: ExpenseCategoryOption[]) {
  return (
    categories.find((category) => category.kind === "expense" && category.value === "shopping") ??
    categories.find((category) => category.kind === "expense") ??
    null
  );
}

async function scanReceiptWithAi(image: Blob) {
  const formData = new FormData();
  formData.append("image", image, "receipt.jpg");

  const response = await fetch("/api/receipt-ocr", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(payload?.message ?? "Failed to scan receipt with AI OCR.");
  }

  return (await response.json()) as ReceiptOcrApiResponse;
}

function buildItemsNote({
  merchant,
  items,
  rawText,
}: {
  merchant: string;
  items: ReceiptOcrItem[];
  rawText: string;
}) {
  const selectedItems = items.filter((item) => item.selected);
  const itemLines = selectedItems.map(
    (item) => `- ${item.name}: Rp ${formatMoney(item.amount)}`
  );
  const rawPreview = rawText.trim().slice(0, 1000);

  return [
    `Scanned receipt: ${merchant}`,
    itemLines.length > 0 ? "Items:" : "",
    ...itemLines,
    rawPreview ? "" : "",
    rawPreview ? `OCR text: ${rawPreview}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export default function ScanReceiptPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const {
    registry,
    user,
    googleAccessToken,
    loading,
    signInWithGoogle,
    markGoogleWorkspaceTokenExpired,
  } = useAuth();
  const {
    dashboard,
    status,
    error,
    needsReconnect,
    hasNoSpreadsheet,
    reconnectGoogleWorkspace,
    reload,
  } = useSpreadsheetDashboard();
  const {
    pendingCount,
    syncStatus,
    syncMessage,
    syncNow,
  } = usePendingSpreadsheetSync({
    uid: user?.uid,
    spreadsheetId: registry?.spreadsheetId,
    accessToken: googleAccessToken,
    onSynced: reload,
    onAuthExpired: markGoogleWorkspaceTokenExpired,
  });

  const expenseCategories = useMemo(
    () => dashboard.categories.filter((category) => category.kind === "expense"),
    [dashboard.categories]
  );
  const defaultCategory = useMemo(
    () => getDefaultExpenseCategory(dashboard.categories),
    [dashboard.categories]
  );

  const [scanStatus, setScanStatus] = useState<ScanStatus>("idle");
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [processedImagePreview, setProcessedImagePreview] = useState<string | null>(null);
  const [processedImageLabel, setProcessedImageLabel] = useState<string | null>(null);
  const [ocrConfidence, setOcrConfidence] = useState<number | null>(null);
  const [merchant, setMerchant] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [total, setTotal] = useState("");
  const [items, setItems] = useState<ReceiptOcrItem[]>([]);
  const [rawText, setRawText] = useState("");
  const [accountId, setAccountId] = useState("");
  const [categoryValue, setCategoryValue] = useState("");
  const [saveMode, setSaveMode] = useState<SaveMode>("total");

  const selectedItems = items.filter((item) => item.selected);
  const selectedItemsTotal = selectedItems.reduce((sum, item) => sum + item.amount, 0);
  const numericTotal = parseAmountInput(total);
  const totalDifference = saveMode === "items" ? selectedItemsTotal - numericTotal : 0;
  const hasValidReceiptDraft =
    Boolean(date) &&
    scanStatus !== "saving" &&
    (saveMode === "total"
      ? numericTotal > 0
      : selectedItems.length > 0 &&
        selectedItems.every((item) => item.name.trim() && item.amount > 0));
  const canSave =
    hasValidReceiptDraft &&
    (!user ||
      (Boolean(registry?.spreadsheetId) &&
    Boolean(accountId) &&
    (saveMode === "total"
        ? Boolean(categoryValue)
        : selectedItems.every((item) => item.categoryValue))));

  const resetScan = () => {
    setScanStatus("idle");
    setScanMessage(null);
    setProgress(0);
    setImagePreview(null);
    setProcessedImagePreview(null);
    setProcessedImageLabel(null);
    setOcrConfidence(null);
    setMerchant("");
    setDate(new Date().toISOString().split("T")[0]);
    setTotal("");
    setItems([]);
    setRawText("");
    setSaveMode("total");
  };

  const applyCategoryToAll = (nextCategoryValue: string) => {
    setItems((currentItems) =>
      currentItems.map((item) => ({
        ...item,
        categoryValue: nextCategoryValue,
      }))
    );
  };

  const updateItem = (id: string, patch: Partial<ReceiptOcrItem>) => {
    setItems((currentItems) =>
      currentItems.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );
  };

  const addItem = () => {
    setItems((currentItems) => [
      ...currentItems,
      {
        id: `manual_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        name: "",
        amount: 0,
        categoryValue: defaultCategory?.value ?? "others",
        selected: true,
      },
    ]);
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    try {
      setScanStatus("reading");
      setScanMessage("Preparing receipt image for OCR...");
      setProgress(0);
      setImagePreview(URL.createObjectURL(file));
      setProcessedImagePreview(null);
      setOcrConfidence(null);

      const processedImages = await preprocessReceiptImages(file);
      const previewImage = processedImages[0] ?? null;
      if (!previewImage) {
        throw new Error("Failed to prepare receipt image for OCR.");
      }
      const grayscaleImage =
        processedImages.find((image) => image.label === "Enhanced grayscale") ?? previewImage;
      setProcessedImagePreview(grayscaleImage.dataUrl);
      setProcessedImageLabel(`${grayscaleImage.label} for AI OCR`);
      setProgress(45);
      setScanMessage("Reading receipt with Gemini AI OCR...");

      const scannedReceipt = await scanReceiptWithAi(grayscaleImage.blob);
      setProgress(90);

      const fallbackCategory = defaultCategory?.value ?? "others";
      const parsedItems: ReceiptOcrItem[] = scannedReceipt.items.map((item, index) => ({
        id: `ai_${index}_${Math.random().toString(36).slice(2, 8)}`,
        name: item.name,
        amount: item.amount,
        categoryValue:
          expenseCategories.some((category) => category.value === item.categoryValue)
            ? item.categoryValue
            : fallbackCategory,
        selected: item.selected,
      }));

      setMerchant(scannedReceipt.merchant);
      setDate(scannedReceipt.date);
      setTotal(formatRupiahInput(scannedReceipt.total));
      setItems(parsedItems);
      setRawText(scannedReceipt.rawText);
      setOcrConfidence(scannedReceipt.confidence);
      setCategoryValue(fallbackCategory);
      setSaveMode(parsedItems.length > 0 ? "items" : "total");
      setScanStatus("ready");
      setProgress(100);
      setScanMessage(
        parsedItems.length > 0
          ? `${parsedItems.length} item detected with AI OCR. Review before saving.${
              scannedReceipt.warnings.length > 0 ? ` ${scannedReceipt.warnings.join(" ")}` : ""
            }`
          : `No item rows detected. You can still save the receipt total.${
              scannedReceipt.warnings.length > 0 ? ` ${scannedReceipt.warnings.join(" ")}` : ""
            }`
      );
    } catch (scanError) {
      console.error("Receipt OCR failed:", scanError);
      setScanStatus("error");
      setScanMessage(
        scanError instanceof Error
          ? scanError.message
          : "Failed to scan receipt. Please try again."
      );
    }
  };

  const buildTransactions = () => {
    if (saveMode === "items") {
      return selectedItems.map((item) =>
        createTransactionRow({
          date,
          description: item.name.trim(),
          type: "out",
          accountId,
          categoryValue: item.categoryValue,
          amount: item.amount,
          note: `Scanned receipt: ${merchant.trim() || "Unknown merchant"}`,
        })
      );
    }

    return [
      createTransactionRow({
        date,
        description: merchant.trim() || "Scanned receipt",
        type: "out",
        accountId,
        categoryValue,
        amount: numericTotal,
        note: buildItemsNote({ merchant: merchant.trim() || "Unknown merchant", items, rawText }),
      }),
    ];
  };

  const handleSave = async () => {
    if (!user) {
      try {
        setScanStatus("saving");
        setScanMessage("Sign in first, then choose wallet/category to save this scan.");
        await signInWithGoogle();
        setScanStatus("ready");
        setScanMessage("Signed in. Choose wallet/category, then save the scanned transaction.");
      } catch {
        setScanStatus("error");
        setScanMessage("Sign in was cancelled or failed. You can still review the scan.");
      }
      return;
    }

    if (!registry?.spreadsheetId) {
      setScanStatus("error");
      setScanMessage("Your account or spreadsheet is not ready yet.");
      return;
    }

    if (!canSave) {
      setScanStatus("error");
      setScanMessage("Please complete wallet, category, amount, and receipt item details.");
      return;
    }

    const uid = user.uid;
    const spreadsheetId = registry.spreadsheetId;
    const transactions = buildTransactions();

    try {
      setScanStatus("saving");
      setScanMessage("Saving scanned transaction...");

      if (!googleAccessToken) {
        transactions.forEach((transaction) => {
          enqueuePendingSpreadsheetWrite({
            id: transaction.id,
            uid,
            spreadsheetId,
            kind: "transaction",
            transaction,
            createdAt: new Date().toISOString(),
            attempts: 0,
            lastError: "Waiting for Google Sheets access.",
          });
        });

        setScanStatus("success");
        setScanMessage("You are offline. Scanned transaction saved as pending sync.");
        return;
      }

      await appendTransactionsToSpreadsheet({
        accessToken: googleAccessToken,
        spreadsheetId,
        transactions,
      });

      setScanStatus("success");
      setScanMessage(
        transactions.length === 1
          ? "Scanned transaction saved to your spreadsheet."
          : `${transactions.length} scanned transactions saved to your spreadsheet.`
      );
      await reload();
    } catch (saveError) {
      console.error("Error saving scanned receipt:", saveError);
      const message =
        saveError instanceof Error ? saveError.message : "Failed to save scanned receipt.";

      if (isRetryableSpreadsheetWriteError(saveError)) {
        transactions.forEach((transaction) => {
          enqueuePendingSpreadsheetWrite({
            id: transaction.id,
            uid,
            spreadsheetId,
            kind: "transaction",
            transaction,
            createdAt: new Date().toISOString(),
            attempts: 0,
            lastError: message,
          });
        });

        setScanStatus("success");
        setScanMessage("You are offline. Scanned transaction saved as pending sync.");
        return;
      }

      setScanStatus("error");
      setScanMessage(message);

      if (/^(401|403)\b/.test(message)) {
        markGoogleWorkspaceTokenExpired();
      }
    }
  };

  return (
      <div className="flex min-h-screen flex-col bg-app-background pb-28 md:pl-20 md:pb-8">
        <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-4 py-4">
          <div className="flex items-center gap-3 rounded-2xl bg-soft-orange/20 p-4 shadow-md">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-deep-slate shadow-sm"
              aria-label="Back"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-deep-slate">
                Scan <span className="text-soft-orange">Struk</span>
              </h1>
              <p className="text-xs text-deep-slate/60">
                Scan receipt with AI OCR, review the items, then save.
              </p>
            </div>
          </div>

          {status === "loading" ? (
            <div className="rounded-md bg-warm-cream p-3 text-sm text-deep-slate">
              Loading accounts and categories from your spreadsheet...
            </div>
          ) : null}
          {needsReconnect ? (
            <div className="rounded-md bg-orange-50 p-3 text-sm text-deep-slate">
              <p>Reconnect Google Sheets access before saving scanned transactions.</p>
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
            <div className="rounded-md bg-orange-50 p-3 text-sm text-deep-slate">
              Your Purrney spreadsheet is not ready yet.
            </div>
          ) : null}
          {error ? (
            <div className="rounded-md bg-red-50 p-3 text-sm text-money-out">{error}</div>
          ) : null}

          <PendingSyncStatus
            pendingCount={pendingCount}
            syncStatus={syncStatus}
            syncMessage={syncMessage}
            onRetry={() => void syncNow()}
          />

          {!user ? (
            <div className="rounded-md bg-warm-cream p-3 text-sm text-deep-slate">
              You can test AI OCR without signing in. Sign in is only needed when you save the result.
            </div>
          ) : null}

          <section className="rounded-2xl bg-white p-4 shadow-lg">
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={scanStatus === "reading" || scanStatus === "saving"}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-soft-orange px-4 py-3 font-semibold text-white shadow-md transition active:scale-95 disabled:opacity-60"
            >
              {scanStatus === "reading" ? <Loader2 className="animate-spin" size={20} /> : <Camera size={20} />}
              {scanStatus === "reading" ? `Scanning... ${progress}%` : "Open Camera / Choose Receipt"}
            </button>
            {imagePreview ? (
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div>
                  <p className="mb-1 text-xs font-semibold text-deep-slate/60">Original</p>
                  <Image
                    src={imagePreview}
                    alt="Original receipt preview"
                    width={720}
                    height={480}
                    unoptimized
                    className="max-h-72 w-full rounded-xl object-contain bg-warm-cream"
                  />
                </div>
                {processedImagePreview ? (
                  <div>
                    <p className="mb-1 text-xs font-semibold text-deep-slate/60">
                      Enhanced for AI OCR{processedImageLabel ? `: ${processedImageLabel}` : ""}
                    </p>
                    <Image
                      src={processedImagePreview}
                      alt="Preprocessed receipt preview"
                      width={720}
                      height={480}
                      unoptimized
                      className="max-h-72 w-full rounded-xl object-contain bg-warm-cream"
                    />
                  </div>
                ) : null}
              </div>
            ) : null}
            {scanMessage ? (
              <div
                className={`mt-4 rounded-md p-3 text-sm ${
                  scanStatus === "success"
                    ? "bg-green-50 text-money-in"
                    : scanStatus === "error"
                      ? "bg-red-50 text-money-out"
                      : "bg-warm-cream text-deep-slate"
                }`}
              >
              {scanMessage}
              {ocrConfidence !== null ? (
                <span className="mt-1 block text-xs text-deep-slate/60">
                  OCR confidence: {ocrConfidence}%
                </span>
              ) : null}
              </div>
            ) : null}
          </section>

          {scanStatus !== "idle" && scanStatus !== "reading" ? (
            <section className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-lg">
              <div className="grid gap-3 md:grid-cols-2">
                <label className="text-sm font-semibold text-deep-slate">
                  Merchant / Description
                  <input
                    value={merchant}
                    onChange={(event) => setMerchant(event.target.value)}
                    className="mt-1 w-full rounded-lg border p-3 font-normal focus:outline-none focus:ring-2 focus:ring-soft-orange"
                  />
                </label>
                <label className="text-sm font-semibold text-deep-slate">
                  Date
                  <input
                    type="date"
                    value={date}
                    onChange={(event) => setDate(event.target.value)}
                    className="mt-1 w-full rounded-lg border p-3 font-normal focus:outline-none focus:ring-2 focus:ring-soft-orange"
                  />
                </label>
                <label className="text-sm font-semibold text-deep-slate">
                  Total Receipt
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-3 text-gray-500">Rp</span>
                    <input
                      value={total}
                      onChange={(event) => setTotal(formatRupiahInput(parseAmountInput(event.target.value)))}
                      className="w-full rounded-lg border p-3 pl-10 text-right font-normal focus:outline-none focus:ring-2 focus:ring-soft-orange"
                    />
                  </div>
                </label>
                <label className="text-sm font-semibold text-deep-slate">
                  Wallet
                  <select
                    value={accountId}
                    onChange={(event) => setAccountId(event.target.value)}
                    className="mt-1 w-full appearance-none rounded-lg border bg-soft-orange/10 p-3 font-normal text-deep-slate"
                  >
                    <option value="">Select Account</option>
                    {dashboard.accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-2 rounded-xl bg-warm-cream p-1">
                <button
                  type="button"
                  onClick={() => setSaveMode("total")}
                  className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                    saveMode === "total" ? "bg-white text-soft-orange shadow-sm" : "text-deep-slate/70"
                  }`}
                >
                  Save Total
                </button>
                <button
                  type="button"
                  onClick={() => setSaveMode("items")}
                  className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                    saveMode === "items" ? "bg-white text-soft-orange shadow-sm" : "text-deep-slate/70"
                  }`}
                >
                  Save Items
                </button>
              </div>

              {saveMode === "total" ? (
                <label className="text-sm font-semibold text-deep-slate">
                  Category
                  <select
                    value={categoryValue}
                    onChange={(event) => setCategoryValue(event.target.value)}
                    className="mt-1 w-full appearance-none rounded-lg border bg-soft-orange/10 p-3 font-normal text-deep-slate"
                  >
                    <option value="">Select Category</option>
                    {expenseCategories.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <div className="rounded-xl border border-orange-100 bg-orange-50 p-3 text-sm text-deep-slate">
                  Selected item total: Rp {formatMoney(selectedItemsTotal)}
                  {numericTotal > 0 && totalDifference !== 0 ? (
                    <span className="block text-money-out">
                      Difference from receipt total: Rp {formatMoney(Math.abs(totalDifference))}
                    </span>
                  ) : null}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-bold text-deep-slate">
                  Items ({items.length})
                </h2>
                <div className="flex flex-wrap gap-2">
                  <select
                    onChange={(event) => {
                      if (event.target.value) applyCategoryToAll(event.target.value);
                      event.target.value = "";
                    }}
                    className="rounded-lg border bg-white px-3 py-2 text-sm text-deep-slate"
                    aria-label="Apply category to all items"
                  >
                    <option value="">Apply category to all</option>
                    {expenseCategories.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={addItem}
                    className="inline-flex items-center gap-1 rounded-lg bg-soft-orange px-3 py-2 text-sm font-semibold text-white"
                  >
                    <Plus size={16} />
                    Add Item
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {items.length === 0 ? (
                  <div className="rounded-xl bg-warm-cream p-4 text-sm text-deep-slate/70">
                    No item detected yet. You can add items manually or save the receipt total.
                  </div>
                ) : null}
                {items.map((item) => (
                  <div
                    key={item.id}
                    className={`rounded-xl border p-3 ${
                      item.selected ? "border-orange-100 bg-white" : "border-gray-100 bg-gray-50 opacity-70"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={item.selected}
                        onChange={(event) => updateItem(item.id, { selected: event.target.checked })}
                        className="h-5 w-5"
                        aria-label={`Include ${item.name || "item"}`}
                      />
                      <input
                        value={item.name}
                        onChange={(event) => updateItem(item.id, { name: event.target.value })}
                        placeholder="Item name"
                        className="min-w-0 flex-1 rounded-lg border p-2 text-sm focus:outline-none focus:ring-2 focus:ring-soft-orange"
                      />
                      <button
                        type="button"
                        onClick={() => setItems((currentItems) => currentItems.filter((currentItem) => currentItem.id !== item.id))}
                        className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-money-out"
                        aria-label={`Delete ${item.name || "item"}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="mt-2 grid gap-2 md:grid-cols-2">
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-sm text-gray-500">Rp</span>
                        <input
                          value={formatRupiahInput(item.amount)}
                          onChange={(event) =>
                            updateItem(item.id, { amount: parseAmountInput(event.target.value) })
                          }
                          className="w-full rounded-lg border p-2 pl-10 text-right text-sm focus:outline-none focus:ring-2 focus:ring-soft-orange"
                        />
                      </div>
                      <select
                        value={item.categoryValue}
                        onChange={(event) => updateItem(item.id, { categoryValue: event.target.value })}
                        className="appearance-none rounded-lg border bg-soft-orange/10 p-2 text-sm text-deep-slate"
                      >
                        {expenseCategories.map((category) => (
                          <option key={category.value} value={category.value}>
                            {category.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid gap-2 md:grid-cols-2">
                <button
                  type="button"
                  onClick={resetScan}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-soft-orange px-4 py-3 font-semibold text-soft-orange"
                >
                  <RotateCcw size={18} />
                  Reset Scan
                </button>
                <button
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={!canSave}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-soft-orange px-4 py-3 font-semibold text-white shadow-md transition active:scale-95 disabled:opacity-50"
                >
                  {scanStatus === "saving" ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
                  {scanStatus === "saving"
                    ? loading
                      ? "Signing in..."
                      : "Saving..."
                    : user
                      ? "Save Scanned Transaction"
                      : "Sign in to Save"}
                </button>
              </div>
            </section>
          ) : null}
        </main>
        <BottomNav />
      </div>
  );
}
