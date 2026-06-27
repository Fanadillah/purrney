import { Progress } from "@/components/ui/progress";
import Link from "next/link";

type CardProgress = {
  id: string;
  category: string;
  amount: number;
  amountMax: number;
};

type ProgressBarComponentProps = {
  data: CardProgress[];
};

function calculatedPercentage(amount: number, amountMax: number) {
  if (amountMax === 0) return 0;
  return Math.min(999, Math.round((amount / amountMax) * 100));
}

function getBudgetStatus(percentage: number) {
  if (percentage >= 100) return "Over";
  if (percentage >= 75) return "Near";
  return "Safe";
}

const BudgetRow = ({ category, amount, amountMax }: CardProgress) => {
  const percentage = calculatedPercentage(amount, amountMax);
  const status = getBudgetStatus(percentage);
  const statusClass =
    status === "Over"
      ? "text-money-out"
      : status === "Near"
        ? "text-soft-orange"
        : "text-money-in";

  return (
    <div className="rounded-md bg-white p-3 shadow-sm">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-bold text-deep-slate">{category}</h3>
          <p className="text-xs text-deep-slate/60">
            Rp {amount.toLocaleString("id-ID")} / Rp {amountMax.toLocaleString("id-ID")}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-deep-slate">{percentage}%</p>
          <p className={`text-xs font-semibold ${statusClass}`}>{status}</p>
        </div>
      </div>
      <Progress value={Math.min(100, percentage)} className="h-2 rounded-full bg-soft-orange/20" />
    </div>
  );
};

const ProgressBar = ({ data }: ProgressBarComponentProps) => {
  const topBudgets = [...data]
    .sort((left, right) => calculatedPercentage(right.amount, right.amountMax) - calculatedPercentage(left.amount, left.amountMax))
    .slice(0, 3);

  return (
    <section className="m-4 rounded-lg bg-warm-cream p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-bold text-deep-slate">Budget Overview</h2>
        <Link href="/budget" className="text-sm font-semibold text-soft-orange">
          View All
        </Link>
      </div>

      {topBudgets.length === 0 ? (
        <Link href="/budget" className="block rounded-md bg-white p-3 text-sm text-deep-slate/70 shadow-sm">
          No active budgets yet.
        </Link>
      ) : (
        <div className="space-y-3">
          {topBudgets.map((budget) => (
            <BudgetRow key={budget.id} {...budget} />
          ))}
        </div>
      )}
    </section>
  );
};

export default ProgressBar;
