"use client";

import { useMemo, useState } from "react";
import type { DashboardTransaction } from "@/lib/spreadsheetData";

type CalendarActivityProps = {
  transactions: DashboardTransaction[];
};

type DayMarker = "none" | "income" | "expense" | "mixed" | "transfer";
type MonthDay = {
  day: number;
  marker: DayMarker;
  count: number;
  transactions: DashboardTransaction[];
};

const dayLabels = ["S", "M", "T", "W", "T", "F", "S"];

function getCurrentPeriod() {
  return new Date().toISOString().slice(0, 7);
}

function getMarkerClass(marker: DayMarker) {
  if (marker === "income") return "bg-money-in";
  if (marker === "expense") return "bg-money-out";
  if (marker === "mixed") return "bg-soft-orange";
  if (marker === "transfer") return "bg-blue-500";
  return "bg-transparent";
}

function formatAmount(transaction: DashboardTransaction) {
  const sign = transaction.type === "in" ? "+" : "-";
  return `${sign}Rp ${transaction.amount.toLocaleString("id-ID")}`;
}

function buildMonthDays(transactions: DashboardTransaction[]) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const period = getCurrentPeriod();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOffset = new Date(year, month, 1).getDay();
  const transactionsByDay = new Map<number, DashboardTransaction[]>();

  transactions
    .filter((transaction) => transaction.date.startsWith(period))
    .forEach((transaction) => {
      const day = Number(transaction.date.slice(8, 10));
      if (!Number.isFinite(day)) return;
      transactionsByDay.set(day, [...(transactionsByDay.get(day) ?? []), transaction]);
    });

  const blankDays = Array.from({ length: firstDayOffset }, () => null);
  const monthDays = Array.from({ length: daysInMonth }, (_, index) => {
    const day = index + 1;
    const dayTransactions = transactionsByDay.get(day) ?? [];
    const hasIncome = dayTransactions.some(
      (transaction) => transaction.type === "in" && !transaction.transferGroupId
    );
    const hasExpense = dayTransactions.some(
      (transaction) => transaction.type === "out" && !transaction.transferGroupId
    );
    const hasTransfer = dayTransactions.some((transaction) => transaction.transferGroupId);
    let marker: DayMarker = "none";

    if (hasIncome && hasExpense) marker = "mixed";
    else if (hasIncome) marker = "income";
    else if (hasExpense) marker = "expense";
    else if (hasTransfer) marker = "transfer";

    return {
      day,
      marker,
      count: dayTransactions.length,
      transactions: dayTransactions,
    };
  });

  return [...blankDays, ...monthDays];
}

export default function CalendarActivity({ transactions }: CalendarActivityProps) {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const monthDays = useMemo(() => buildMonthDays(transactions), [transactions]);
  const selectedDayData = monthDays.find(
    (day): day is MonthDay => Boolean(day && day.day === selectedDay)
  );
  const activeDays = monthDays.filter((day) => day && day.count > 0).length;
  const periodTransactionCount = transactions.filter((transaction) =>
    transaction.date.startsWith(getCurrentPeriod())
  ).length;
  const monthLabel = new Date().toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  });

  return (
    <section className="m-4 rounded-lg bg-warm-cream p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-deep-slate">Calendar Activity</h2>
          <p className="text-sm text-deep-slate/60">{monthLabel}</p>
        </div>
        <div className="rounded-md bg-white px-3 py-2 text-right shadow-sm">
          <p className="text-xs text-deep-slate/50">Active days</p>
          <p className="text-sm font-bold text-deep-slate">{activeDays}</p>
        </div>
      </div>

      <div className="rounded-md bg-white p-3 shadow-sm">
        <div className="mb-2 grid grid-cols-7 gap-1">
          {dayLabels.map((label, index) => (
            <div key={`${label}-${index}`} className="text-center text-xs font-semibold text-deep-slate/50">
              {label}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {monthDays.map((day, index) =>
            day ? (
              <button
                type="button"
                key={day.day}
                onClick={() => setSelectedDay(day.count > 0 ? day.day : null)}
                disabled={day.count === 0}
                className={`flex min-h-9 flex-col items-center justify-center rounded-md text-xs text-deep-slate transition ${
                  selectedDay === day.day
                    ? "bg-soft-orange/15 ring-1 ring-soft-orange"
                    : day.count > 0
                      ? "hover:bg-app-background"
                      : "opacity-50"
                }`}
                aria-label={
                  day.count > 0
                    ? `Show ${day.count} transaction${day.count === 1 ? "" : "s"} on day ${day.day}`
                    : `No transactions on day ${day.day}`
                }
              >
                <span>{day.day}</span>
                <span className={`mt-1 h-1.5 w-1.5 rounded-full ${getMarkerClass(day.marker)}`} />
              </button>
            ) : (
              <div key={`blank-${index}`} className="min-h-9" />
            )
          )}
        </div>

        {selectedDayData ? (
          <div className="mt-3 rounded-md border border-soft-orange/20 bg-app-background p-3 shadow-sm">
            <div className="mb-2 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-deep-slate">
                  Day {selectedDayData.day}
                </p>
                <p className="text-xs text-deep-slate/60">
                  {selectedDayData.count} transaction{selectedDayData.count === 1 ? "" : "s"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDay(null)}
                className="min-h-0 rounded-md px-2 py-1 text-xs font-semibold text-deep-slate/60 hover:bg-white"
              >
                Close
              </button>
            </div>
            <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
              {selectedDayData.transactions.map((transaction) => {
                const isTransfer = Boolean(transaction.transferGroupId);
                const amountClass = isTransfer
                  ? "text-blue-500"
                  : transaction.type === "in"
                    ? "text-money-in"
                    : "text-money-out";

                return (
                  <div
                    key={transaction.id}
                    className="flex items-start justify-between gap-3 rounded-md bg-white p-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-deep-slate">
                        {transaction.description}
                      </p>
                      <p className="mt-0.5 text-xs text-deep-slate/60">
                        {isTransfer ? "Transfer" : transaction.category}
                      </p>
                    </div>
                    <p className={`shrink-0 text-right text-sm font-bold ${amountClass}`}>
                      {formatAmount(transaction)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>

      <p className="mt-3 text-sm text-deep-slate/60">
        {periodTransactionCount === 0
          ? "Belum ada transaksi bulan ini."
          : `${periodTransactionCount} transaksi tercatat bulan ini.`}
      </p>
    </section>
  );
}
