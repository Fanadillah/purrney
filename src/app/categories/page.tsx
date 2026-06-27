"use client";

import AuthGate from "@/app/component/AuthGate";
import BottomNav from "@/app/component/BottomNav";
import { useAuth } from "@/app/api/AuthContext";
import { useSpreadsheetDashboard } from "@/app/hooks/useSpreadsheetDashboard";
import { appendCategoryToSpreadsheet } from "@/lib/userSpreadsheet";
import type { CategoryKind, CategorySheetRow } from "@/lib/spreadsheetSchema";
import Image from "next/image";
import { useMemo, useState } from "react";

const colorOptions = [
  "bg-food",
  "bg-transport",
  "bg-entertainment",
  "bg-utilities",
  "bg-shopping",
  "bg-education",
  "bg-health",
  "bg-others",
  "bg-money-in",
];

function slugifyId(value: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return slug || "category";
}

export default function CategoriesPage() {
  const { registry, googleAccessToken, markGoogleWorkspaceTokenExpired } = useAuth();
  const {
    sourceData,
    status,
    error,
    needsReconnect,
    hasNoSpreadsheet,
    reconnectGoogleWorkspace,
    reload,
  } = useSpreadsheetDashboard();
  const categories = useMemo(() => sourceData?.categories ?? [], [sourceData?.categories]);
  const [selectedValue, setSelectedValue] = useState("");
  const selectedCategory = useMemo(
    () => categories.find((category) => category.value === selectedValue) ?? null,
    [categories, selectedValue]
  );
  const [label, setLabel] = useState("");
  const [kind, setKind] = useState<CategoryKind>("expense");
  const [colorClass, setColorClass] = useState("bg-others");
  const [isActive, setIsActive] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "saving" | "success" | "error">("idle");

  function chooseCategory(value: string) {
    const category = categories.find((item) => item.value === value) ?? null;
    setSelectedValue(value);

    if (!category) {
      setLabel("");
      setKind("expense");
      setColorClass("bg-others");
      setIsActive(true);
      return;
    }

    setLabel(category.label);
    setKind(category.kind);
    setColorClass(category.colorClass || "bg-others");
    setIsActive(category.isActive);
  }

  const canSubmit =
    Boolean(label.trim()) &&
    Boolean(registry?.spreadsheetId) &&
    Boolean(googleAccessToken) &&
    submitStatus !== "saving";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await saveCategory(isActive);
  }

  async function saveCategory(nextIsActive: boolean) {
    if (!googleAccessToken || !registry?.spreadsheetId) {
      setSubmitStatus("error");
      setMessage("Reconnect Google Sheets access before saving a category.");
      return;
    }

    const sortOrder =
      selectedCategory?.sortOrder ??
      categories.reduce((max, category) => Math.max(max, category.sortOrder), 0) + 10;
    const value = selectedCategory?.value ?? slugifyId(label);
    const category: CategorySheetRow = {
      id: selectedCategory?.id ?? `cat_${value}`,
      value,
      label: label.trim(),
      kind,
      colorClass,
      isActive: nextIsActive,
      sortOrder,
    };

    try {
      setSubmitStatus("saving");
      setMessage(null);
      await appendCategoryToSpreadsheet({
        accessToken: googleAccessToken,
        spreadsheetId: registry.spreadsheetId,
        category,
      });
      setSubmitStatus("success");
      setMessage(
        nextIsActive
          ? selectedCategory
            ? "Category updated."
            : "Category added."
          : "Category deactivated."
      );
      chooseCategory("");
      await reload();
    } catch (saveError) {
      console.error("Error saving category:", saveError);
      const errorMessage =
        saveError instanceof Error ? saveError.message : "Failed to save category.";
      setSubmitStatus("error");
      setMessage(errorMessage);

      if (/^(401|403)\b/.test(errorMessage)) {
        markGoogleWorkspaceTokenExpired();
      }
    }
  }

  return (
    <AuthGate>
      <div className="min-h-screen bg-app-background pb-28 md:pl-20 md:pb-8">
        <div className="flex items-center rounded-b-lg bg-warm-cream p-4 pb-1 pt-2 shadow-lg md:mx-auto md:mt-4 md:max-w-4xl md:rounded-lg">
          <Image src="/assets/CatAddTransaction.png" alt="Categories" width={64} height={64} />
          <h1 className="text-2xl font-bold text-deep-slate">
            My <span className="text-soft-orange">Categories</span>
          </h1>
        </div>

        <main className="mx-auto max-w-4xl space-y-4 p-4">
          {status === "loading" ? (
            <div className="rounded-md bg-warm-cream p-3 text-sm text-deep-slate shadow">
              Loading categories from your spreadsheet...
            </div>
          ) : null}
          {needsReconnect ? (
            <div className="rounded-md bg-orange-50 p-3 text-sm text-deep-slate shadow">
              <p>Reconnect Google Sheets access to manage categories.</p>
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
            <div className="rounded-md bg-orange-50 p-3 text-sm text-deep-slate shadow">
              Your Purrney spreadsheet is not ready yet.
            </div>
          ) : null}
          {error ? (
            <div className="rounded-md bg-red-50 p-3 text-sm text-money-out shadow">
              {error}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-3 rounded-2xl bg-white p-4 shadow-lg">
            <h2 className="text-lg font-bold text-deep-slate">
              {selectedCategory ? "Edit Category" : "Add Category"}
            </h2>
            {message ? (
              <div className={`rounded-md p-3 text-sm ${submitStatus === "success" ? "bg-green-50 text-money-in" : "bg-red-50 text-money-out"}`}>
                {message}
              </div>
            ) : null}
            <select
              value={selectedValue}
              onChange={(event) => chooseCategory(event.target.value)}
              className="w-full rounded-lg border bg-soft-orange/10 p-3 text-deep-slate"
            >
              <option value="">New category</option>
              {categories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              placeholder="Category name"
              className="w-full rounded-lg border p-3 focus:outline-none focus:ring-2 focus:ring-soft-orange"
            />
            <select
              value={kind}
              onChange={(event) => setKind(event.target.value as CategoryKind)}
              className="w-full rounded-lg border bg-soft-orange/10 p-3 text-deep-slate"
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
            <select
              value={colorClass}
              onChange={(event) => setColorClass(event.target.value)}
              className="w-full rounded-lg border bg-soft-orange/10 p-3 text-deep-slate"
            >
              {colorOptions.map((color) => (
                <option key={color} value={color}>
                  {color}
                </option>
              ))}
            </select>
            <label className="flex items-center justify-between rounded-lg border p-3 text-sm font-semibold text-deep-slate">
              Active category
              <input
                type="checkbox"
                checked={isActive}
                onChange={(event) => setIsActive(event.target.checked)}
                className="h-5 w-5 accent-soft-orange"
              />
            </label>
            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full rounded-xl bg-soft-orange py-3 font-semibold text-white shadow-lg disabled:opacity-50"
            >
              {submitStatus === "saving" ? "Saving..." : "Save Category"}
            </button>
            {selectedCategory?.isActive ? (
              <button
                type="button"
                disabled={!canSubmit}
                onClick={() => void saveCategory(false)}
                className="w-full rounded-xl border border-money-out py-3 font-semibold text-money-out disabled:opacity-50"
              >
                Deactivate Category
              </button>
            ) : null}
          </form>

          <section>
            <h2 className="mb-2 text-xl font-bold text-deep-slate">Categories</h2>
            <div className="space-y-2">
              {categories.map((category) => (
                <button
                  type="button"
                  key={category.value}
                  onClick={() => chooseCategory(category.value)}
                  className="flex w-full items-center justify-between rounded-md bg-warm-cream p-3 text-left shadow"
                >
                  <span>
                    <span className="font-semibold text-deep-slate">{category.label}</span>
                    <span className="ml-2 text-xs text-deep-slate/60">{category.kind}</span>
                  </span>
                  <span className={`h-4 w-4 rounded-full ${category.colorClass || "bg-others"}`} />
                </button>
              ))}
            </div>
          </section>
        </main>

        <BottomNav />
      </div>
    </AuthGate>
  );
}
