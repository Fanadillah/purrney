"use client"
import { useState } from "react"
import AuthGate from "../component/AuthGate"
import BottomNav from "../component/BottomNav"
import PendingSyncStatus from "../component/PendingSyncStatus"
import Image from "next/image"
import { Banknote } from "lucide-react"
import { useSpreadsheetDashboard } from "../hooks/useSpreadsheetDashboard"
import { usePendingSpreadsheetSync } from "../hooks/usePendingSpreadsheetSync"
import { useAuth } from "../api/AuthContext"
import {
    enqueuePendingSpreadsheetWrite,
    isRetryableSpreadsheetWriteError,
} from "@/lib/offlineSync"
import {
    appendTransferToSpreadsheet,
    appendTransactionToSpreadsheet,
    createTransferRows,
    createTransactionRow,
} from "@/lib/userSpreadsheet"



export default function AddTransactionPage() {
    const {
        registry,
        user,
        googleAccessToken,
        markGoogleWorkspaceTokenExpired,
    } = useAuth()
    const {
        dashboard,
        status,
        error,
        needsReconnect,
        hasNoSpreadsheet,
        reconnectGoogleWorkspace,
        reload,
    } = useSpreadsheetDashboard()
    const {
        pendingCount,
        syncStatus,
        syncMessage,
        syncNow,
    } = usePendingSpreadsheetSync({
        uid: user?.uid,
        spreadsheetId: registry?.spreadsheetId,
        accessToken: googleAccessToken,
        onSynced: reload,
        onAuthExpired: markGoogleWorkspaceTokenExpired,
    })
    const [type, setType] = useState("income")
    const [amount, setAmount] = useState("")
    const [date, setDate] = useState(
        new Date().toISOString().split("T")[0]
    )
    const [description, setDescription] = useState("")
    const [accountId, setAccountId] = useState("")
    const [toAccountId, setToAccountId] = useState("")
    const [categoryValue, setCategoryValue] = useState("")
    const [note, setNote] = useState("")
    const [submitStatus, setSubmitStatus] = useState<"idle" | "saving" | "success" | "error">("idle")
    const [submitMessage, setSubmitMessage] = useState<string | null>(null)

    const baseButton =
        "text-sm px-4 py-1.5 rounded-full shadow-md transition-all duration-200"

    // Format Rupiah
    const formatRupiah = (value: string) => {
        const numberString = value.replace(/[^,\d]/g, "")
        const split = numberString.split(",")
        const sisa = split[0].length % 3
        let rupiah = split[0].substr(0, sisa)
        const ribuan = split[0].substr(sisa).match(/\d{3}/gi)

        if (ribuan) {
            const separator = sisa ? "." : ""
            rupiah += separator + ribuan.join(".")
        }

        return rupiah
    }

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value.replace(/\D/g, "")
        setAmount(formatRupiah(rawValue))
    }

    const parseAmount = () => {
        return Number(amount.replace(/\D/g, ""))
    }

    const isTransfer = type === "transfer"
    const transactionType = type === "income" ? "in" : "out"
    const categoryOptions = dashboard.categories.filter((category) => {
        if (type === "income") return category.kind === "income"
        if (type === "expense") return category.kind === "expense"
        return false
    })
    const canSubmit =
        Boolean(user?.uid) &&
        Boolean(registry?.spreadsheetId) &&
        Boolean(accountId) &&
        (isTransfer
            ? Boolean(toAccountId) && accountId !== toAccountId
            : Boolean(categoryValue)) &&
        Boolean(description.trim()) &&
        parseAmount() > 0 &&
        submitStatus !== "saving"

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        const numericAmount = parseAmount()

        if (!user?.uid || !registry?.spreadsheetId) {
            setSubmitStatus("error")
            setSubmitMessage("Your account or spreadsheet is not ready yet.")
            return
        }

        if (!numericAmount || numericAmount <= 0) {
            setSubmitStatus("error")
            setSubmitMessage("Amount must be greater than zero.")
            return
        }

        if (!date || !description.trim() || !accountId) {
            setSubmitStatus("error")
            setSubmitMessage("Please complete date, description, and account.")
            return
        }

        if (isTransfer) {
            if (!toAccountId || accountId === toAccountId) {
                setSubmitStatus("error")
                setSubmitMessage("Choose a different destination account for transfer.")
                return
            }

            const transferRows = createTransferRows({
                date,
                description: description.trim(),
                fromAccountId: accountId,
                toAccountId,
                amount: numericAmount,
                note: note.trim(),
            })

            try {
                setSubmitStatus("saving")
                setSubmitMessage(null)

                if (!googleAccessToken) {
                    enqueuePendingSpreadsheetWrite({
                        id: transferRows.fromTransaction.transferGroupId,
                        uid: user.uid,
                        spreadsheetId: registry.spreadsheetId,
                        kind: "transfer",
                        ...transferRows,
                        createdAt: new Date().toISOString(),
                        attempts: 0,
                        lastError: "Waiting for Google Sheets access.",
                    })
                    setSubmitStatus("success")
                    setSubmitMessage("You are offline. Transfer saved as pending and will sync when you are online.")
                    setAmount("")
                    setDescription("")
                    setNote("")
                    setToAccountId("")
                    return
                }

                await appendTransferToSpreadsheet({
                    accessToken: googleAccessToken,
                    spreadsheetId: registry.spreadsheetId,
                    ...transferRows,
                })

                setSubmitStatus("success")
                setSubmitMessage("Transfer saved to your spreadsheet.")
                setAmount("")
                setDescription("")
                setNote("")
                setToAccountId("")
                await reload()
            } catch (saveError) {
                console.error("Error saving transfer:", saveError)
                const message =
                    saveError instanceof Error
                        ? saveError.message
                        : "Failed to save transfer."
                if (
                    user?.uid &&
                    registry?.spreadsheetId &&
                    isRetryableSpreadsheetWriteError(saveError)
                ) {
                    enqueuePendingSpreadsheetWrite({
                        id: transferRows.fromTransaction.transferGroupId,
                        uid: user.uid,
                        spreadsheetId: registry.spreadsheetId,
                        kind: "transfer",
                        ...transferRows,
                        createdAt: new Date().toISOString(),
                        attempts: 0,
                        lastError: message,
                    })
                    setSubmitStatus("success")
                    setSubmitMessage("You are offline. Transfer saved as pending and will sync when you are online.")
                    setAmount("")
                    setDescription("")
                    setNote("")
                    setToAccountId("")
                    return
                }

                setSubmitStatus("error")
                setSubmitMessage(message)

                if (/^(401|403)\b/.test(message)) {
                    markGoogleWorkspaceTokenExpired()
                }
            }
            return
        }

        if (!categoryValue) {
            setSubmitStatus("error")
            setSubmitMessage("Please choose a category.")
            return
        }

        const transaction = createTransactionRow({
            date,
            description: description.trim(),
            type: transactionType,
            accountId,
            categoryValue,
            amount: numericAmount,
            note: note.trim(),
        })

            try {
                setSubmitStatus("saving")
                setSubmitMessage(null)

                if (!googleAccessToken) {
                    enqueuePendingSpreadsheetWrite({
                        id: transaction.id,
                        uid: user.uid,
                        spreadsheetId: registry.spreadsheetId,
                        kind: "transaction",
                        transaction,
                        createdAt: new Date().toISOString(),
                        attempts: 0,
                        lastError: "Waiting for Google Sheets access.",
                    })
                    setSubmitStatus("success")
                    setSubmitMessage("You are offline. Transaction saved as pending and will sync when you are online.")
                    setAmount("")
                    setDescription("")
                    setNote("")
                    return
                }

                await appendTransactionToSpreadsheet({
                    accessToken: googleAccessToken,
                    spreadsheetId: registry.spreadsheetId,
                transaction,
            })

            setSubmitStatus("success")
            setSubmitMessage("Transaction saved to your spreadsheet.")
            setAmount("")
            setDescription("")
            setNote("")
            await reload()
        } catch (saveError) {
            console.error("Error saving transaction:", saveError)
            const message =
                saveError instanceof Error
                    ? saveError.message
                    : "Failed to save transaction."
            if (
                user?.uid &&
                registry?.spreadsheetId &&
                isRetryableSpreadsheetWriteError(saveError)
            ) {
                enqueuePendingSpreadsheetWrite({
                    id: transaction.id,
                    uid: user.uid,
                    spreadsheetId: registry.spreadsheetId,
                    kind: "transaction",
                    transaction,
                    createdAt: new Date().toISOString(),
                    attempts: 0,
                    lastError: message,
                })
                setSubmitStatus("success")
                setSubmitMessage("You are offline. Transaction saved as pending and will sync when you are online.")
                setAmount("")
                setDescription("")
                setNote("")
                return
            }

            setSubmitStatus("error")
            setSubmitMessage(message)

            if (/^(401|403)\b/.test(message)) {
                markGoogleWorkspaceTokenExpired()
            }
        }
    }

    const handleTypeChange = (nextType: string) => {
        setType(nextType)
        setCategoryValue("")
        setToAccountId("")
        setSubmitMessage(null)
        setSubmitStatus("idle")
    }

    return (
        <AuthGate>
        <div className="flex min-h-screen flex-col bg-app-background pb-28 md:pl-20 md:pb-8">

            {/* Header */}
            <div className="mx-auto flex w-full max-w-3xl rounded-b-3xl bg-soft-orange/20 shadow-md md:mt-4 md:rounded-2xl">
            <Image
                    src="/assets/CatAddTransaction.png"
                    alt="Add Transaction"
                    width={90}
                    height={90}
             className=""/>
             <div className="p-4 pl-1">
                <h1 className="text-2xl font-bold text-deep-slate flex items-center gap-2">
                    Add <span className="text-soft-orange">Transaction</span>
                </h1>
                <p className="text-xs text-deep-slate/60">
                    Let&apos;s track your meowney!
                </p>
             </div>
            </div>

            {/* Toggle Buttons */}
            <div className="mx-auto mt-3 flex w-full max-w-3xl justify-center gap-2 px-4">
                {["income", "expense", "transfer"].map((item) => (
                    <button
                        key={item}
                onClick={() => handleTypeChange(item)}
                        className={`${baseButton} ${
                            type === item
                                ? item === "income"
                                    ? "bg-green-400 text-white scale-105"
                                    : item === "expense"
                                    ? "bg-red-400 text-white scale-105"
                                    : "bg-blue-400 text-white scale-105"
                                : "bg-white border text-gray-600"
                        }`}
                    >
                        {item.charAt(0).toUpperCase() + item.slice(1)}
                    </button>
                ))}
            </div>

            {/* Form */}
            <form id="add-transaction-form" onSubmit={handleSubmit} className="mx-4 mb-20 mt-4 flex flex-col space-y-4 rounded-2xl bg-white p-4 shadow-lg md:mx-auto md:w-full md:max-w-3xl">
                {status === "loading" ? (
                    <div className="rounded-md bg-warm-cream p-3 text-sm text-deep-slate">
                        Loading accounts and categories from your spreadsheet...
                    </div>
                ) : null}
                {needsReconnect ? (
                    <div className="rounded-md bg-orange-50 p-3 text-sm text-deep-slate">
                        <p>Reconnect Google Sheets access before choosing account and category.</p>
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
                    <div className="rounded-md bg-orange-50 p-3 text-sm text-deep-slate">
                        Your Purrney spreadsheet is not ready yet.
                    </div>
                ) : null}
                {error ? (
                    <div className="rounded-md bg-red-50 p-3 text-sm text-money-out">
                        {error}
                    </div>
                ) : null}
                {submitMessage ? (
                    <div className={`rounded-md p-3 text-sm ${
                        submitStatus === "success"
                            ? "bg-green-50 text-money-in"
                            : "bg-red-50 text-money-out"
                    }`}>
                        {submitMessage}
                    </div>
                ) : null}
                <PendingSyncStatus
                    pendingCount={pendingCount}
                    syncStatus={syncStatus}
                    syncMessage={syncMessage}
                    onRetry={() => void syncNow()}
                />

                {/* Amount */}
                <label className="font-semibold text-sm text-deep-slate">
                    Amount
                </label>
                <div className="relative w-full">
                    <span className="absolute left-3 top-3 text-gray-500 font-semibold">
                        Rp
                    </span>
                    <input
                        type="text"
                        value={amount}
                        onChange={handleAmountChange}
                        placeholder="0"
                        className="text-2xl w-full font-bold text-right  p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-soft-orange"
                    />
                </div>

                {/* Date */}
                <label className="font-semibold text-sm text-deep-slate">
                    Date
                </label>
                <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="p-3 w-full border rounded-lg focus:outline-none focus:ring-2 focus:ring-soft-orange"
                />

                {/* Description */}
                <label className="font-semibold text-sm text-deep-slate">
                    Description
                </label>
                <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What is this for?"
                    className="p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-soft-orange"
                />

                {/* Account */}
                <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className="p-3 appearance-none border rounded-lg bg-soft-orange/10 text-deep-slate">
                    <option value="">{isTransfer ? "From Account" : "Select Account"}</option>
                    {dashboard.accounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>{acc.name}</option>
                    ))}
                </select>

                {isTransfer ? (
                    <select value={toAccountId} onChange={(e) => setToAccountId(e.target.value)} className="p-3 appearance-none border rounded-lg bg-soft-orange/10 text-deep-slate">
                        <option value="">To Account</option>
                        {dashboard.accounts.map((acc) => (
                            <option key={acc.id} value={acc.id}>{acc.name}</option>
                        ))}
                    </select>
                ) : (
                    <select value={categoryValue} onChange={(e) => setCategoryValue(e.target.value)} className="p-3 appearance-none border rounded-lg bg-soft-orange/10 text-deep-slate">
                        <option value="">
                            {categoryOptions.length > 0
                                ? `Select ${type} category`
                                : `No ${type} categories yet`}
                        </option>
                        {categoryOptions.map((cat) => (
                            <option key={cat.value} value={cat.value}>{cat.label}</option>
                        ))}
                    </select>
                )}

                <label className="font-semibold text-sm text-deep-slate">
                    Note
                </label>
                <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Optional note"
                    className="min-h-20 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-soft-orange"
                />
            </form>

            {/* Floating Cat */}
            <div className="fixed bottom-32 right-4 text-3xl animate-bounce duration-slow md:hidden">
                <Image src="/assets/CuriousCat.png" alt="Floating Cat" width={60} height={60} />
            </div>

            {/* Save Button */}
            <div className="fixed bottom-25 left-0 right-0 px-4 md:static md:mx-auto md:w-full md:max-w-3xl md:px-0">
                <button form="add-transaction-form" disabled={!canSubmit} className="w-full bg-soft-orange text-white py-3 rounded-xl shadow-lg font-semibold active:scale-95 transition disabled:opacity-50"><span>
                    <Banknote size={20} className="inline-block mr-2" />
                </span>
                    {submitStatus === "saving" ? "Saving..." : "Save Transaction"}
                </button>
            </div>

            <BottomNav />
        </div>
        </AuthGate>
    )
}
