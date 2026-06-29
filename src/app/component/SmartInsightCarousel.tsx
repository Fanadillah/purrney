"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import type { DashboardProgressData, DashboardTransaction } from "@/lib/spreadsheetData";

type SmartInsightCarouselProps = {
  transactions: DashboardTransaction[];
  budgets: DashboardProgressData[];
  income: number;
  expense: number;
};

type InsightSlide = {
  id: string;
  image: string;
  eyebrow: string;
  title: string;
  body: string;
  tone: string;
};

function formatCurrency(value: number) {
  return `Rp ${value.toLocaleString("id-ID")}`;
}

function getCurrentPeriod() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${now.getFullYear()}-${month}`;
}

function getBudgetPercentage(amount: number, amountMax: number) {
  if (amountMax <= 0) return 0;
  return Math.round((amount / amountMax) * 100);
}

function getTopExpenseCategory(transactions: DashboardTransaction[]) {
  const expenseByCategory = new Map<string, number>();

  transactions
    .filter((transaction) => transaction.type === "out" && !transaction.transferGroupId)
    .forEach((transaction) => {
      expenseByCategory.set(
        transaction.category,
        (expenseByCategory.get(transaction.category) ?? 0) + transaction.amount
      );
    });

  return Array.from(expenseByCategory.entries())
    .map(([category, amount]) => ({ category, amount }))
    .sort((first, second) => second.amount - first.amount)[0];
}

function buildSlides({
  transactions,
  budgets,
  income,
  expense,
}: SmartInsightCarouselProps): InsightSlide[] {
  const currentPeriod = getCurrentPeriod();
  const periodTransactions = transactions.filter((transaction) =>
    transaction.date.startsWith(currentPeriod)
  );
  const slides: InsightSlide[] = [];
  const overBudget = [...budgets]
    .filter((budget) => budget.amountMax > 0 && budget.amount >= budget.amountMax)
    .sort((first, second) => getBudgetPercentage(second.amount, second.amountMax) - getBudgetPercentage(first.amount, first.amountMax))[0];
  const nearBudget = [...budgets]
    .filter((budget) => {
      const percentage = getBudgetPercentage(budget.amount, budget.amountMax);
      return percentage >= 80 && percentage < 100;
    })
    .sort((first, second) => getBudgetPercentage(second.amount, second.amountMax) - getBudgetPercentage(first.amount, first.amountMax))[0];
  const topExpense = getTopExpenseCategory(periodTransactions);
  const netCashflow = income - expense;

  if (overBudget) {
    const percentage = getBudgetPercentage(overBudget.amount, overBudget.amountMax);
    slides.push({
      id: "over-budget",
      image: "/assets/anxiousCat.png",
      eyebrow: "Budget Alert",
      title: `${overBudget.category} sudah lewat budget`,
      body: `${overBudget.category} sudah kepakai ${percentage}%. Coba tahan pengeluaran di kategori ini sampai periode berikutnya.`,
      tone: "bg-red-50 text-money-out",
    });
  } else if (nearBudget) {
    const remaining = Math.max(0, nearBudget.amountMax - nearBudget.amount);
    const percentage = getBudgetPercentage(nearBudget.amount, nearBudget.amountMax);
    slides.push({
      id: "near-budget",
      image: "/assets/anxiousCat.png",
      eyebrow: "Budget Watch",
      title: `${nearBudget.category} hampir penuh`,
      body: `${nearBudget.category} sudah ${percentage}%. Sisa budget sekitar ${formatCurrency(remaining)}.`,
      tone: "bg-orange-50 text-soft-orange",
    });
  }

  if (topExpense && expense > 0) {
    const categoryShare = Math.round((topExpense.amount / expense) * 100);
    const image =
      /food|makan|minum/i.test(topExpense.category)
        ? "/assets/foodCat.png"
        : /transport|bensin|parkir/i.test(topExpense.category)
          ? "/assets/transportCat.png"
          : "/assets/BudgetCat.png";

    slides.push({
      id: "top-category",
      image,
      eyebrow: "Monthly Pattern",
      title: `${topExpense.category} paling banyak bulan ini`,
      body: `${formatCurrency(topExpense.amount)} keluar untuk ${topExpense.category}, sekitar ${categoryShare}% dari total expense bulan ini.`,
      tone: categoryShare >= 45 ? "bg-orange-50 text-soft-orange" : "bg-white text-deep-slate",
    });
  }

  if (periodTransactions.length > 0) {
    if (netCashflow < 0) {
      slides.push({
        id: "negative-cashflow",
        image: "/assets/sadCat.png",
        eyebrow: "Cashflow Check",
        title: "Cashflow bulan ini negatif",
        body: `Expense lebih besar ${formatCurrency(Math.abs(netCashflow))} dibanding income. Coba cek transaksi terbesar bulan ini.`,
        tone: "bg-red-50 text-money-out",
      });
    } else if (income > 0 && expense / income >= 0.85) {
      slides.push({
        id: "thin-cashflow",
        image: "/assets/anxiousCat.png",
        eyebrow: "Cashflow Check",
        title: "Cashflow mulai mepet",
        body: `Expense sudah ${Math.round((expense / income) * 100)}% dari income bulan ini. Masih aman, tapi ruang nabung makin tipis.`,
        tone: "bg-orange-50 text-soft-orange",
      });
    } else if (netCashflow > 0) {
      slides.push({
        id: "positive-cashflow",
        image: "/assets/happyCat.png",
        eyebrow: "Cashflow Check",
        title: "Masih ada ruang buat nabung",
        body: `Cashflow positif ${formatCurrency(netCashflow)} bulan ini. Bisa dialokasikan ke goal atau disimpan.`,
        tone: "bg-green-50 text-money-in",
      });
    }
  }

  if (slides.length === 0) {
    slides.push({
      id: "empty",
      image: "/assets/CuriousCat.png",
      eyebrow: "Monthly Insight",
      title: "Belum ada pola yang bisa dibaca",
      body: "Tambah transaksi dan budget agar Purrney bisa kasih insight bulanan yang lebih tajam.",
      tone: "bg-white text-deep-slate",
    });
  }

  return slides.slice(0, 4);
}

export default function SmartInsightCarousel(props: SmartInsightCarouselProps) {
  const slides = useMemo(() => buildSlides(props), [props]);
  const [activeIndex, setActiveIndex] = useState(0);
  const safeActiveIndex = slides.length > 0 ? Math.min(activeIndex, slides.length - 1) : 0;
  const activeSlide = slides[safeActiveIndex] ?? slides[0];

  useEffect(() => {
    if (slides.length <= 1) return;

    const intervalId = window.setInterval(() => {
      setActiveIndex((currentIndex) => (currentIndex + 1) % slides.length);
    }, 5500);

    return () => window.clearInterval(intervalId);
  }, [slides.length]);

  if (!activeSlide) return null;

  return (
    <section className="m-4 rounded-lg bg-warm-cream p-4 shadow-sm">
      <div className="flex min-w-0 gap-3">
        <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-lg ${activeSlide.tone}`}>
          <Image src={activeSlide.image} alt="" width={56} height={56} className="h-14 w-14 object-contain" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase text-deep-slate/50">{activeSlide.eyebrow}</p>
              <h2 className="mt-1 text-base font-bold text-deep-slate">{activeSlide.title}</h2>
            </div>
            <p className="shrink-0 text-xs font-semibold text-deep-slate/40">
              {safeActiveIndex + 1}/{slides.length}
            </p>
          </div>
          <p className="mt-1 text-sm leading-5 text-deep-slate/70">{activeSlide.body}</p>
          {slides.length > 1 ? (
            <div className="mt-3 flex items-center justify-end gap-1">
              {slides.map((slide, index) => (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  className="flex min-h-0 h-6 w-6 items-center justify-center rounded-full"
                  aria-label={`Show insight ${index + 1}`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full transition-colors ${
                      index === safeActiveIndex ? "bg-soft-orange" : "bg-deep-slate/20"
                    }`}
                  />
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
