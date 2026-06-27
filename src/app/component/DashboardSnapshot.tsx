type DashboardSnapshotProps = {
  netCashflow: number;
  transactionCount: number;
  budgetUsage: number;
  goalProgress: number;
};

function formatCurrency(value: number) {
  return `Rp ${value.toLocaleString("id-ID")}`;
}

const SnapshotItem = ({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "positive" | "negative";
}) => {
  const toneClass =
    tone === "positive"
      ? "text-money-in"
      : tone === "negative"
        ? "text-money-out"
        : "text-deep-slate";

  return (
    <div className="rounded-lg bg-warm-cream p-3 shadow-sm">
      <p className="text-xs font-semibold uppercase text-deep-slate/50">{label}</p>
      <p className={`mt-1 truncate text-sm font-bold sm:text-base ${toneClass}`}>{value}</p>
    </div>
  );
};

export default function DashboardSnapshot({
  netCashflow,
  transactionCount,
  budgetUsage,
  goalProgress,
}: DashboardSnapshotProps) {
  return (
    <section className="mx-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
      <SnapshotItem
        label="Net Cashflow"
        value={formatCurrency(netCashflow)}
        tone={netCashflow < 0 ? "negative" : "positive"}
      />
      <SnapshotItem label="Transactions" value={transactionCount.toLocaleString("id-ID")} />
      <SnapshotItem label="Budget Used" value={`${budgetUsage}%`} />
      <SnapshotItem label="Goal Progress" value={`${goalProgress}%`} />
    </section>
  );
}
