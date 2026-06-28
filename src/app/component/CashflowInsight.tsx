import Image from "next/image";

type CashflowInsightProps = {
  income: number;
  expense: number;
};

type CashflowStatus = "empty" | "healthy" | "thin" | "warning";

function formatCurrency(value: number) {
  return `Rp ${value.toLocaleString("id-ID")}`;
}

function getCashflowStatus(income: number, expense: number): CashflowStatus {
  if (income === 0 && expense === 0) return "empty";

  const netCashflow = income - expense;
  if (netCashflow < 0) return "warning";
  if (income > 0 && expense / income > 0.8) return "thin";
  if (income > 0 && netCashflow > income * 0.2) return "healthy";
  return "thin";
}

function getInsightCopy(status: CashflowStatus) {
  if (status === "empty") {
    return {
      image: "/assets/NoTransactionCat.png",
      title: "Belum ada data bulan ini",
      body: "Tambah transaksi pertama untuk mulai membaca pola cashflow.",
      tone: "bg-white text-deep-slate",
    };
  }

  if (status === "healthy") {
    return {
      image: "/assets/happyCat.png",
      title: "Cashflow kamu positif",
      body: "Nice, bulan ini masih ada ruang buat nabung.",
      tone: "bg-green-50 text-money-in",
    };
  }

  if (status === "thin") {
    return {
      image: "/assets/anxiousCat.png",
      title: "Cashflow mulai tipis",
      body: "Expense mulai mendekati income. Coba cek kategori paling besar.",
      tone: "bg-orange-50 text-soft-orange",
    };
  }

  return {
    image: "/assets/sadCat.png",
    title: "Cashflow negatif",
    body: "Bulan ini uang keluar lebih besar dari masuk.",
    tone: "bg-red-50 text-money-out",
  };
}

function DonutChart({ income, expense }: { income: number; expense: number }) {
  const total = income + expense;
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const incomeLength = total > 0 ? (income / total) * circumference : 0;
  const expenseLength = total > 0 ? (expense / total) * circumference : 0;
  const netCashflow = income - expense;

  return (
    <div className="flex items-center gap-4">
      <div className="relative h-28 w-28">
        <svg viewBox="0 0 100 100" className="h-28 w-28 -rotate-90">
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="#ffedd5"
            strokeWidth="12"
          />
          {total > 0 ? (
            <>
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke="#16A34A"
                strokeDasharray={`${incomeLength} ${circumference - incomeLength}`}
                strokeDashoffset="0"
                strokeLinecap="round"
                strokeWidth="12"
              />
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke="#EF4444"
                strokeDasharray={`${expenseLength} ${circumference - expenseLength}`}
                strokeDashoffset={-incomeLength}
                strokeLinecap="round"
                strokeWidth="12"
              />
            </>
          ) : null}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-[10px] font-semibold uppercase text-deep-slate/50">Net</span>
          <span className={`text-xs font-bold ${netCashflow < 0 ? "text-money-out" : "text-money-in"}`}>
            {formatCurrency(netCashflow)}
          </span>
        </div>
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-money-in" />
          <span className="text-deep-slate/60">Income</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-money-out" />
          <span className="text-deep-slate/60">Expense</span>
        </div>
      </div>
    </div>
  );
}

export default function CashflowInsight({ income, expense }: CashflowInsightProps) {
  const status = getCashflowStatus(income, expense);
  const insight = getInsightCopy(status);

  return (
    <section className="m-4 rounded-lg bg-warm-cream p-4 shadow-sm">
      <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="flex min-w-0 gap-3">
          <div className={`flex h-16 w-16 items-center justify-center rounded-lg ${insight.tone}`}>
            <Image src={insight.image} alt="" width={56} height={56} className="h-14 w-14 object-contain" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase text-deep-slate/50">Cashflow Insight</p>
            <h2 className="mt-1 text-base font-bold text-deep-slate">{insight.title}</h2>
            <p className="mt-1 text-sm leading-5 text-deep-slate/70">{insight.body}</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="rounded-md bg-white p-2">
                <p className="text-xs text-deep-slate/50">Income</p>
                <p className="truncate text-sm font-bold text-money-in">{formatCurrency(income)}</p>
              </div>
              <div className="rounded-md bg-white p-2">
                <p className="text-xs text-deep-slate/50">Expense</p>
                <p className="truncate text-sm font-bold text-money-out">{formatCurrency(expense)}</p>
              </div>
            </div>
          </div>
        </div>
        <DonutChart income={income} expense={expense} />
      </div>
    </section>
  );
}
