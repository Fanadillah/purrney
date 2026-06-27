import { BookOpenText, Target, Wallet, WalletCards } from "lucide-react";
import Link from "next/link";

const QuickMenu = () => (
    <div className="m-4 rounded-lg bg-warm-cream p-4 shadow-sm">
    <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-bold text-deep-slate">Quick Actions</h2>
    </div>
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-2">
        <Link href="/addTransaction" className="flex min-h-14 items-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-semibold text-deep-slate shadow-sm transition hover:text-soft-orange">
            <BookOpenText size={18} className="text-soft-orange" />
            <span>Add</span>
        </Link>
        <Link href="/accounts" className="flex min-h-14 items-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-semibold text-deep-slate shadow-sm transition hover:text-soft-orange">
            <Wallet size={18} className="text-soft-orange" />
            <span>Wallets</span>
        </Link>
        <Link href="/budget" className="flex min-h-14 items-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-semibold text-deep-slate shadow-sm transition hover:text-soft-orange">
            <WalletCards size={18} className="text-soft-orange" />
            <span>Budget</span>
        </Link>
        <Link href="/goals" className="flex min-h-14 items-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-semibold text-deep-slate shadow-sm transition hover:text-soft-orange">
            <Target size={18} className="text-soft-orange" />
            <span>Goals</span>
        </Link>
    </div>
    </div>
)

export default QuickMenu;
