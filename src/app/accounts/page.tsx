import BottomNav from "../component/BottomNav"
import { accounts } from "@/lib/db";
import Image from "next/image";

export default function AccountPage() {
    const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

    return(
        <>
            <div className="p-4 pb-1 pt-2 flex items-center rounded-b-lg shadow-lg bg-warm-cream ">
            <Image src="/assets/walletCat.png" alt="Wallet Icon" width={60} height={60} className="w-16 h-16"/>
            <h1 className="text-2xl font-bold text-deep-slate">My <span className="text-soft-orange">Wallet</span></h1>
            </div>

        <div className="p-4">
            <BottomNav />
            <div className="mt-4 p-4 rounded-2xl bg-warm-cream shadow-lg">
                <h1 className="font-bold text-2xl mb-4">Total Balance</h1>
                <p className=" text-xl">Rp {totalBalance.toLocaleString('id-ID')}</p>

            </div>
            <div className="border-2 my-3 border-amber-600 shadow-lg"></div>
            <div className="mt-3 mb-20">
                {accounts.map((acc) => (
                    <div className="my-2 bg-warm-cream rounded-lg shadow-lg p-2">
                        <h2 className="font-semibold text-lg">{acc.name}</h2>
                        <p>Rp. {acc.balance.toLocaleString('id-ID')}</p>
                    </div>
                ))}
            </div>
        </div>
        </>
    )
}