"use client";

import BottomNav from "../component/BottomNav"
import AuthGate from "../component/AuthGate";
import Image from "next/image";
import Link from "next/link";
import { useSpreadsheetDashboard } from "../hooks/useSpreadsheetDashboard";
import { calculateDashboardSummary } from "@/lib/dashboardSummary";


export default function AccountPage() {
    const {
        dashboard,
        status,
        error,
        needsReconnect,
        hasNoSpreadsheet,
        reconnectGoogleWorkspace,
    } = useSpreadsheetDashboard();
    const { totalBalance } = calculateDashboardSummary(dashboard);

    return(
        <AuthGate>
        <div className="min-h-screen bg-app-background pb-24 md:pl-20 md:pb-8">
            <div className="p-4 pb-1 pt-2 flex items-center rounded-b-lg shadow-lg bg-warm-cream md:mx-auto md:max-w-5xl md:rounded-lg md:mt-4">
            <Image src="/assets/walletCat.png" alt="Wallet Icon" width={60} height={60} className="w-16 h-16"/>
            <h1 className="text-2xl font-bold text-deep-slate">My <span className="text-soft-orange">Wallet</span></h1>
            </div>

        <div className="mx-auto max-w-5xl p-4">
            <BottomNav />
            <div className="mt-4 p-4 rounded-2xl bg-warm-cream shadow-lg">
                <h1 className="font-bold text-2xl mb-4">Total Balance</h1>
                <p></p>

                <p className=" text-xl">Rp {totalBalance.toLocaleString('id-ID')}</p>

            </div>
            {status === "loading" ? (
                <div className="mt-3 rounded-md bg-warm-cream p-3 text-sm text-deep-slate shadow">
                    Loading accounts from your spreadsheet...
                </div>
            ) : null}
            {needsReconnect ? (
                <div className="mt-3 rounded-md bg-orange-50 p-3 text-sm text-deep-slate shadow">
                    <p>Reconnect Google Sheets access to load your accounts.</p>
                    <button
                        type="button"
                        onClick={() => void reconnectGoogleWorkspace()}
                        className="mt-2 rounded-md bg-soft-orange px-3 py-2 text-xs font-semibold text-white"
                    >
                        Reconnect
                    </button>
                </div>
            ) : null}
            {hasNoSpreadsheet ? (
                <div className="mt-3 rounded-md bg-orange-50 p-3 text-sm text-deep-slate shadow">
                    Your Purrney spreadsheet is not ready yet.
                </div>
            ) : null}
            {error ? (
                <div className="mt-3 rounded-md bg-red-50 p-3 text-sm text-money-out shadow">
                    {error}
                </div>
            ) : null}
            <div className="border-2 my-3 border-amber-600 shadow-lg"></div>
            <div className="flex justify-between items-center">
                <h1 className="font-bold text-2xl">Accounts</h1>
                <Link href="/accounts/new" className="text-soft-orange border-2 p-1 px-3 border-amber-500 rounded-2xl hover:text-orange-600">
                    + add Wallet
                </Link>
            </div>
            <div className="mt-3 mb-20 grid gap-2 md:mb-0 md:grid-cols-2">
                {dashboard.accounts.length === 0 ? (
                    <div className="rounded-md bg-warm-cream p-4 text-sm text-deep-slate shadow">
                        No accounts found in your spreadsheet.
                    </div>
                ) : null}
                {dashboard.accounts.map((acc) => (
                    <Link key={acc.id} href={`/accounts/${acc.id}`} className="my-2 bg-warm-cream flex justify-between items-center active:bg-amber-500 active:border-amber-50 active:text-amber-50 active:border-2 rounded-md shadow-lg p-2">
                        <div>
                            <h2 className="font-semibold text-lg">{acc.name}</h2>
                            <p>Rp. {acc.balance.toLocaleString('id-ID')}</p>

                        </div>
                        <p className="font-bold mr-4">&gt;</p>
                    </Link>
                ))}
            </div>
        </div>
        </div>
        </AuthGate>
    )
}
