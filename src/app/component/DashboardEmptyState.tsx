import Image from "next/image";
import Link from "next/link";

export default function DashboardEmptyState() {
  return (
    <section className="mx-4 rounded-lg bg-warm-cream p-4 text-center shadow-sm">
      <Image
        src="/assets/NoTransactionCat.png"
        alt="No transaction"
        width={160}
        height={160}
        className="mx-auto h-32 w-32 object-contain"
      />
      <h2 className="mt-2 text-base font-bold text-deep-slate">
        Kamu belum ada transaksi apapun
      </h2>
      <p className="mx-auto mt-1 max-w-sm text-sm leading-5 text-deep-slate/60">
        Tambah transaksi, budget, atau goal pertama supaya dashboard mulai punya insight.
      </p>
      <Link
        href="/addTransaction"
        className="mt-4 inline-flex items-center justify-center rounded-md bg-soft-orange px-4 py-2 text-sm font-semibold text-white"
      >
        Add Transaction
      </Link>
    </section>
  );
}
