import { ArrowDown, ArrowUp, Repeat } from "lucide-react";
import Link from "next/link";

type TransactionItemProps = {
  category: string;
  description: string;
  amount: string;
  type: "in" | "out";
  date: string;
  transferGroupId?: string;
};

interface Transaction {
  id: string;
  description: string;
  category: string;
  amount: number;
  date: string;
  type: "in" | "out";
  transferGroupId?: string;
}

type RecentTransactionsProps = {
  data: Transaction[];
};

const TransactionIcon = ({ type, isTransfer }: { type: "in" | "out"; isTransfer: boolean }) => {
  if (isTransfer) {
    return (
      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-50 text-blue-500">
        <Repeat size={16} />
      </div>
    );
  }

  return (
    <div className={`flex h-9 w-9 items-center justify-center rounded-md ${type === "in" ? "bg-green-50 text-money-in" : "bg-red-50 text-money-out"}`}>
      {type === "in" ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
    </div>
  );
};

const TransactionItem = ({
  category,
  description,
  amount,
  type,
  date,
  transferGroupId,
}: TransactionItemProps) => {
  const isTransfer = Boolean(transferGroupId);
  const amountClass = isTransfer
    ? "text-blue-500"
    : type === "in"
      ? "text-money-in"
      : "text-money-out";

  return (
    <div className="flex min-h-16 items-center justify-between gap-3 border-b border-deep-slate/10 py-3 last:border-b-0">
      <div className="flex min-w-0 items-center gap-3">
        <TransactionIcon type={type} isTransfer={isTransfer} />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-deep-slate">{description}</p>
          <div className="mt-1 flex items-center gap-2">
            <span className="rounded-full bg-app-background px-2 py-0.5 text-xs font-semibold text-deep-slate/60">
              {isTransfer ? "Transfer" : category}
            </span>
            <span className="text-xs text-deep-slate/50">{date}</span>
          </div>
        </div>
      </div>
      <p className={`shrink-0 text-right text-sm font-bold ${amountClass}`}>
        {type === "in" ? "+" : "-"}Rp {amount}
      </p>
    </div>
  );
};

const RecentTransactions = ({ data }: RecentTransactionsProps) => {
  const recentTransactions = data.slice(0, 5);

  return (
    <section className="m-4 rounded-lg bg-warm-cream p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-bold text-deep-slate">Recent Transactions</h2>
        <Link href="/reports" className="text-sm font-semibold text-soft-orange">
          View Reports
        </Link>
      </div>
      {recentTransactions.length === 0 ? (
        <div className="rounded-md bg-white p-3 text-sm text-deep-slate/70 shadow-sm">
          No transactions found.
        </div>
      ) : (
        <div className="rounded-md bg-white px-3 shadow-sm">
          {recentTransactions.map((transaction) => (
            <TransactionItem
              key={transaction.id}
              category={transaction.category}
              description={transaction.description}
              date={transaction.date}
              amount={Math.abs(transaction.amount).toLocaleString("id-ID")}
              type={transaction.type}
              transferGroupId={transaction.transferGroupId}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default RecentTransactions;
