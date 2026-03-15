import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  <Card className="relative m-4 mt-1 overflow-hidden bg-warm-cream shadow-lg border-none">
    <Image src="/assets/balance-cat.png" width={100} height={100} alt="Balance Summary" className="absolute inset-0 w-full h-full object-cover opacity-10 z-0" />
    <div className="flex justify-between items-center space-y-1 pb-2 pl-6 pt-2 pr-1 z-10">
      <CardTitle className="text-lg text-deep-slate">Total Balance</CardTitle>
      <p className="text-sm text-deep-slate">{formattedDate}</p>
    </div>
    <CardContent className="relative z-10">
      <p className="text-3xl font-bold text-deep-slate">Rp {totalBalance.toLocaleString("id-ID")}</p>
      <div className="flex mt-4">
        <div className="flex items-center mr-6">
          <div className="bg-money-in p-2 rounded-full mr-2">
            <ArrowUp className="text-white" size={16} />
          </div>
          <div>
            <p className="text-sm text-deep-slate">Income</p>
            <p className="text-lg font-semibold text-money-in">Rp {income.toLocaleString("id-ID")}</p>
          </div>
        </div>
        <div className="flex items-center">
          <div className="bg-money-out p-2 rounded-full mr-2">
            <ArrowDown className="text-white" size={16} />
          </div>
          <div>
            <p className="text-sm text-deep-slate">Expense</p>
            <p className="text-lg font-semibold text-money-out">Rp {expense.toLocaleString("id-ID")}</p>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

export default BalanceSummary;
