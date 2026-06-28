import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { ArrowUp, ArrowDown } from "lucide-react";
import Image from "next/image";

type SummaryItemProps = {
  totalBalance: number;
  income: number;
  expense: number;
}

  const today = new Date();
  const formattedDate = today.toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });


const BalanceSummary = ({totalBalance, income, expense}: SummaryItemProps) => (
  <Card className="relative m-4 mt-1 overflow-hidden rounded-lg border-none bg-warm-cream shadow-sm">
    <Image
      src="/assets/balance-cat.png"
      width={900}
      height={420}
      alt="Balance Summary"
      priority
      className="absolute inset-0 z-0 h-full w-full object-cover opacity-25"
    />
    <div className="absolute inset-0 z-0 bg-gradient-to-r from-warm-cream via-warm-cream/90 to-warm-cream/45" />
    <div className="relative z-10 flex flex-col gap-1 px-4 pb-2 pt-4 sm:flex-row sm:items-center sm:justify-between">
      <CardTitle className="text-base text-deep-slate">Total Balance</CardTitle>
      <p className="text-xs text-deep-slate/60">{formattedDate}</p>
    </div>
    <CardContent className="relative z-10">
      <p className="break-words text-4xl font-bold tracking-normal text-deep-slate">Rp {totalBalance.toLocaleString("id-ID")}</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="flex min-w-0 items-center rounded-lg bg-white/60 p-3">
          <div className="mr-3 rounded-full bg-money-in p-2">
            <ArrowUp className="text-white" size={16} />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-deep-slate/60">Income</p>
            <p className="truncate text-base font-semibold text-money-in">Rp {income.toLocaleString("id-ID")}</p>
          </div>
        </div>
        <div className="flex min-w-0 items-center rounded-lg bg-white/60 p-3">
          <div className="mr-3 rounded-full bg-money-out p-2">
            <ArrowDown className="text-white" size={16} />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-deep-slate/60">Expense</p>
            <p className="truncate text-base font-semibold text-money-out">Rp {expense.toLocaleString("id-ID")}</p>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

export default BalanceSummary;
