"use client";

import AuthGate from "@/app/component/AuthGate";
import BottomNav from "@/app/component/BottomNav";
import { useAuth } from "@/app/api/AuthContext";
import { useSpreadsheetDashboard } from "@/app/hooks/useSpreadsheetDashboard";
import {
  appendAccountToSpreadsheet,
  createAccountRow,
} from "@/lib/userSpreadsheet";
import type { AccountKind } from "@/lib/spreadsheetSchema";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const accountKinds: Array<{ value: AccountKind; label: string }> = [
  { value: "cash", label: "Cash" },
  { value: "bank", label: "Bank" },
  { value: "ewallet", label: "E-Wallet" },
];

function formatRupiah(value: string) {
  const rawValue = value.replace(/\D/g, "");
  return rawValue.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export default function NewAccountPage() {
  const { registry, googleAccessToken, markGoogleWorkspaceTokenExpired } = useAuth();
  const {
    error,
    needsReconnect,
    hasNoSpreadsheet,
    reconnectGoogleWorkspace,
    reload,
  } = useSpreadsheetDashboard();
  const [name, setName] = useState("");
  const [kind, setKind] = useState<AccountKind>("cash");
  const [openingBalance, setOpeningBalance] = useState("");
  const [submitStatus, setSubmitStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);

  const numericOpeningBalance = Number(openingBalance.replace(/\D/g, ""));
  const canSubmit =
    Boolean(name.trim()) &&
    Boolean(googleAccessToken) &&
    Boolean(registry?.spreadsheetId) &&
    submitStatus !== "saving";

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!googleAccessToken || !registry?.spreadsheetId) {
      setSubmitStatus("error");
      setSubmitMessage("Reconnect Google Sheets access before adding a wallet.");
      return;
    }

    if (!name.trim()) {
      setSubmitStatus("error");
      setSubmitMessage("Wallet name is required.");
      return;
    }

    try {
      setSubmitStatus("saving");
      setSubmitMessage(null);

      const account = createAccountRow({
        name: name.trim(),
        kind,
        openingBalance: numericOpeningBalance,
      });

      await appendAccountToSpreadsheet({
        accessToken: googleAccessToken,
        spreadsheetId: registry.spreadsheetId,
        account,
      });

      setSubmitStatus("success");
      setSubmitMessage("Wallet saved to your spreadsheet.");
      setName("");
      setKind("cash");
      setOpeningBalance("");
      await reload();
    } catch (saveError) {
      console.error("Error saving wallet:", saveError);
      const message =
        saveError instanceof Error ? saveError.message : "Failed to save wallet.";

      setSubmitStatus("error");
      setSubmitMessage(message);

      if (/^(401|403)\b/.test(message)) {
        markGoogleWorkspaceTokenExpired();
      }
    }
  };

  return (
    <AuthGate>
      <div className="min-h-screen bg-app-background pb-28 md:pl-20 md:pb-8">
        <div className="p-4 pb-1 pt-2 flex items-center rounded-b-lg shadow-lg bg-warm-cream md:mx-auto md:mt-4 md:max-w-3xl md:rounded-lg">
          <Image
            src="/assets/walletCat.png"
            alt="Wallet Icon"
            width={60}
            height={60}
            className="w-16 h-16"
          />
          <div>
            <h1 className="text-2xl font-bold text-deep-slate">
              Add <span className="text-soft-orange">Wallet</span>
            </h1>
            <Link href="/accounts" className="text-xs text-deep-slate/60">
              Back to wallets
            </Link>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="m-4 flex flex-col space-y-4 rounded-2xl bg-white p-4 shadow-lg md:mx-auto md:w-full md:max-w-3xl"
        >
          {needsReconnect ? (
            <div className="rounded-md bg-orange-50 p-3 text-sm text-deep-slate">
              <p>Reconnect Google Sheets access before adding a wallet.</p>
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
            <div
              className={`rounded-md p-3 text-sm ${
                submitStatus === "success"
                  ? "bg-green-50 text-money-in"
                  : "bg-red-50 text-money-out"
              }`}
            >
              {submitMessage}
            </div>
          ) : null}

          <label className="font-semibold text-sm text-deep-slate">Wallet Name</label>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="BCA, Cash, Gopay"
            className="p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-soft-orange"
          />

          <label className="font-semibold text-sm text-deep-slate">Wallet Type</label>
          <select
            value={kind}
            onChange={(event) => setKind(event.target.value as AccountKind)}
            className="p-3 appearance-none border rounded-lg bg-soft-orange/10 text-deep-slate"
          >
            {accountKinds.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>

          <label className="font-semibold text-sm text-deep-slate">Opening Balance</label>
          <div className="relative w-full">
            <span className="absolute left-3 top-3 text-gray-500 font-semibold">
              Rp
            </span>
            <input
              type="text"
              value={openingBalance}
              onChange={(event) => setOpeningBalance(formatRupiah(event.target.value))}
              placeholder="0"
              className="text-2xl w-full font-bold text-right p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-soft-orange"
            />
          </div>

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full rounded-xl bg-soft-orange py-3 font-semibold text-white shadow-lg transition active:scale-95 disabled:opacity-50"
          >
            {submitStatus === "saving" ? "Saving..." : "Save Wallet"}
          </button>
        </form>

        <BottomNav />
      </div>
    </AuthGate>
  );
}
