"use client"
import { useState } from "react"
import BottomNav from "../component/BottomNav"
import Image from "next/image"
import { Banknote } from "lucide-react"
import { accounts, categories } from "@/lib/db"



export default function AddTransactionPage() {
    const [type, setType] = useState("income")
    const [amount, setAmount] = useState("")
    const [date, setDate] = useState(
        new Date().toISOString().split("T")[0]
    )

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

    return (
        <div className="min-h-screen bg-app-background flex flex-col pb-28">

            {/* Header */}
            <div className="flex bg-soft-orange/20 rounded-b-3xl shadow-md">
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
                    Let’s track your meowney!
                </p>
             </div>
            </div>

            {/* Toggle Buttons */}
            <div className="flex justify-center gap-2 mt-3">
                {["income", "expense", "transfer"].map((item) => (
                    <button
                        key={item}
                        onClick={() => setType(item)}
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
            <form className="flex flex-col mt-4 mx-4 mb-20 space-y-4 rounded-2xl bg-white shadow-lg p-4">

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
                    placeholder="What is this for?"
                    className="p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-soft-orange"
                />

                {/* Account */}
                <select className="p-3 appearance-none border rounded-lg bg-soft-orange/10 text-deep-slate">
                    <option value="">Select Account</option>
                    {accounts.map((acc) => (
                        <option key={acc.name} value={acc.name}>{acc.name}</option>
                    ))}
                </select>

                {/* Category */}
                <select className="p-3 appearance-none border rounded-lg bg-soft-orange/10 text-deep-slate">
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                </select>
            </form>

            {/* Floating Cat */}
            <div className="fixed bottom-32 right-4 text-3xl animate-bounce duration-slow">
                <Image src="/assets/CuriousCat.png" alt="Floating Cat" width={60} height={60} />
            </div>

            {/* Save Button */}
            <div className="fixed bottom-25 left-0 right-0 px-4">
                <button className="w-full bg-soft-orange text-white py-3 rounded-xl shadow-lg font-semibold active:scale-95 transition"><span>
                    <Banknote size={20} className="inline-block mr-2" />
                </span>
                    Save Transaction
                </button>
            </div>

            <BottomNav />
        </div>
    )
}