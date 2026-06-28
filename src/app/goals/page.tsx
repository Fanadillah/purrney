"use client";

import AuthGate from "@/app/component/AuthGate";
import BottomNav from "@/app/component/BottomNav";
import { useAuth } from "@/app/api/AuthContext";
import { useSpreadsheetDashboard } from "@/app/hooks/useSpreadsheetDashboard";
import {
  enqueuePendingSpreadsheetWrite,
  isRetryableSpreadsheetWriteError,
} from "@/lib/offlineSync";
import {
  appendGoalContributionToSpreadsheet,
  appendGoalToSpreadsheet,
  createGoalContributionRows,
  createGoalRow,
} from "@/lib/userSpreadsheet";
import type { GoalSheetRow } from "@/lib/spreadsheetSchema";
import Image from "next/image";
import { useMemo, useState } from "react";

function formatRupiah(value: string) {
  const rawValue = value.replace(/\D/g, "");
  return rawValue.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export default function GoalsPage() {
  const { user, registry, googleAccessToken, markGoogleWorkspaceTokenExpired } = useAuth();
  const {
    sourceData,
    dashboard,
    status,
    error,
    needsReconnect,
    hasNoSpreadsheet,
    reconnectGoogleWorkspace,
    reload,
  } = useSpreadsheetDashboard();
  const activeGoals = useMemo(
    () => sourceData?.goals.filter((goal) => goal.isActive) ?? [],
    [sourceData?.goals]
  );
  const [selectedGoalId, setSelectedGoalId] = useState("");
  const selectedGoal = useMemo(
    () => activeGoals.find((goal) => goal.id === selectedGoalId) ?? null,
    [activeGoals, selectedGoalId]
  );
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [currentAmount, setCurrentAmount] = useState("");
  const [accountId, setAccountId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [contributionGoalId, setContributionGoalId] = useState("");
  const [contributionAccountId, setContributionAccountId] = useState("");
  const [contributionAmount, setContributionAmount] = useState("");
  const [contributionDate, setContributionDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [contributionNote, setContributionNote] = useState("");
  const [contributionMessage, setContributionMessage] = useState<string | null>(null);
  const [contributionStatus, setContributionStatus] = useState<"idle" | "saving" | "success" | "error">("idle");

  const numericTarget = Number(targetAmount.replace(/\D/g, ""));
  const numericCurrent = Number(currentAmount.replace(/\D/g, ""));
  const numericContribution = Number(contributionAmount.replace(/\D/g, ""));
  const contributionGoal = useMemo(
    () => activeGoals.find((goal) => goal.id === contributionGoalId) ?? null,
    [activeGoals, contributionGoalId]
  );
  const contributionAccount = useMemo(
    () => dashboard.accounts.find((account) => account.id === contributionAccountId) ?? null,
    [contributionAccountId, dashboard.accounts]
  );
  const canSubmit =
    Boolean(name.trim()) &&
    numericTarget > 0 &&
    Boolean(registry?.spreadsheetId) &&
    Boolean(googleAccessToken) &&
    submitStatus !== "saving";
  const canContribute =
    Boolean(contributionGoal) &&
    Boolean(contributionAccount) &&
    numericContribution > 0 &&
    Boolean(registry?.spreadsheetId) &&
    contributionStatus !== "saving";

  function chooseGoal(goalId: string) {
    const goal = activeGoals.find((item) => item.id === goalId) ?? null;
    setSelectedGoalId(goalId);

    if (!goal) {
      setName("");
      setTargetAmount("");
      setCurrentAmount("");
      setAccountId("");
      setDueDate("");
      setNote("");
      return;
    }

    setName(goal.name);
    setTargetAmount(formatRupiah(String(goal.targetAmount)));
    setCurrentAmount(formatRupiah(String(goal.currentAmount)));
    setAccountId(goal.accountId);
    setDueDate(goal.dueDate);
    setNote(goal.note);
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!googleAccessToken || !registry?.spreadsheetId) {
      setSubmitStatus("error");
      setMessage("Reconnect Google Sheets access before saving a goal.");
      return;
    }

    try {
      setSubmitStatus("saving");
      setMessage(null);
      const goal: GoalSheetRow = selectedGoal
        ? {
            ...selectedGoal,
            name: name.trim(),
            targetAmount: numericTarget,
            currentAmount: numericCurrent,
            accountId,
            dueDate,
            note: note.trim(),
            updatedAt: new Date().toISOString(),
          }
        : createGoalRow({
            name: name.trim(),
            targetAmount: numericTarget,
            currentAmount: numericCurrent,
            accountId,
            dueDate,
            note: note.trim(),
          });

      await appendGoalToSpreadsheet({
        accessToken: googleAccessToken,
        spreadsheetId: registry.spreadsheetId,
        goal,
      });

      setSubmitStatus("success");
      setMessage(selectedGoal ? "Goal updated in your spreadsheet." : "Goal saved to your spreadsheet.");
      chooseGoal("");
      await reload();
    } catch (saveError) {
      console.error("Error saving goal:", saveError);
      const errorMessage =
        saveError instanceof Error ? saveError.message : "Failed to save goal.";
      setSubmitStatus("error");
      setMessage(errorMessage);

      if (/^(401|403)\b/.test(errorMessage)) {
        markGoogleWorkspaceTokenExpired();
      }
    }
  };

  const handleContributionSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!user || !registry?.spreadsheetId || !contributionGoal || !contributionAccount) {
      setContributionStatus("error");
      setContributionMessage("Choose an active goal and wallet before saving a contribution.");
      return;
    }

    if (numericContribution <= 0) {
      setContributionStatus("error");
      setContributionMessage("Contribution amount must be greater than 0.");
      return;
    }

    if (contributionAccount.balance < numericContribution) {
      setContributionStatus("error");
      setContributionMessage("Wallet balance is not enough for this contribution.");
      return;
    }

    const contribution = createGoalContributionRows({
      goal: contributionGoal,
      accountId: contributionAccount.id,
      amount: numericContribution,
      date: contributionDate,
      note: contributionNote,
    });

    try {
      setContributionStatus("saving");
      setContributionMessage(null);

      if (!googleAccessToken) {
        throw new Error("Reconnect Google Sheets access before saving a contribution.");
      }

      await appendGoalContributionToSpreadsheet({
        accessToken: googleAccessToken,
        spreadsheetId: registry.spreadsheetId,
        transaction: contribution.transaction,
        goal: contribution.goal,
      });

      setContributionStatus("success");
      setContributionMessage("Contribution saved. Goal progress and wallet balance are now in sync.");
      setContributionAmount("");
      setContributionNote("");
      await reload();
    } catch (saveError) {
      const errorMessage =
        saveError instanceof Error ? saveError.message : "Failed to save contribution.";

      if (isRetryableSpreadsheetWriteError(saveError)) {
        enqueuePendingSpreadsheetWrite({
          id: `pending_goal_${contribution.transaction.id}`,
          uid: user.uid,
          spreadsheetId: registry.spreadsheetId,
          kind: "goal_contribution",
          transaction: contribution.transaction,
          goal: contribution.goal,
          createdAt: new Date().toISOString(),
          attempts: 0,
          lastError: "",
        });
        setContributionStatus("success");
        setContributionMessage("You are offline. Contribution saved on this device and will sync when reconnected.");
        setContributionAmount("");
        setContributionNote("");
        return;
      }

      console.error("Error saving goal contribution:", saveError);
      setContributionStatus("error");
      setContributionMessage(errorMessage);

      if (/^(401|403)\b/.test(errorMessage)) {
        markGoogleWorkspaceTokenExpired();
      }
    }
  };

  return (
    <AuthGate>
      <div className="min-h-screen bg-app-background pb-28 md:pl-20 md:pb-8">
        <div className="p-4 pb-1 pt-2 flex items-center rounded-b-lg shadow-lg bg-warm-cream md:mx-auto md:mt-4 md:max-w-4xl md:rounded-lg">
          <Image src="/assets/goalsCat.png" alt="Goals" width={64} height={64} />
          <h1 className="text-2xl font-bold text-deep-slate">
            My <span className="text-soft-orange">Goals</span>
          </h1>
        </div>

        <main className="mx-auto max-w-4xl space-y-4 p-4">
          {status === "loading" ? (
            <div className="rounded-md bg-warm-cream p-3 text-sm text-deep-slate shadow">
              Loading goals from your spreadsheet...
            </div>
          ) : null}
          {needsReconnect ? (
            <div className="rounded-md bg-orange-50 p-3 text-sm text-deep-slate shadow">
              <p>Reconnect Google Sheets access to manage goals.</p>
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
            <div className="rounded-md bg-orange-50 p-3 text-sm text-deep-slate shadow">
              Your Purrney spreadsheet is not ready yet.
            </div>
          ) : null}
          {error ? (
            <div className="rounded-md bg-red-50 p-3 text-sm text-money-out shadow">
              {error}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-3 rounded-2xl bg-white p-4 shadow-lg">
            <h2 className="text-lg font-bold text-deep-slate">
              {selectedGoal ? "Edit Goal" : "Add Goal"}
            </h2>
            {message ? (
              <div className={`rounded-md p-3 text-sm ${submitStatus === "success" ? "bg-green-50 text-money-in" : "bg-red-50 text-money-out"}`}>
                {message}
              </div>
            ) : null}
            <select
              value={selectedGoalId}
              onChange={(event) => chooseGoal(event.target.value)}
              className="w-full rounded-lg border bg-soft-orange/10 p-3 text-deep-slate"
            >
              <option value="">New goal</option>
              {activeGoals.map((goal) => (
                <option key={goal.id} value={goal.id}>
                  {goal.name}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Emergency fund"
              className="w-full rounded-lg border p-3 focus:outline-none focus:ring-2 focus:ring-soft-orange"
            />
            <input
              type="text"
              value={targetAmount}
              onChange={(event) => setTargetAmount(formatRupiah(event.target.value))}
              placeholder="Target amount"
              className="w-full rounded-lg border p-3 text-right text-xl font-bold focus:outline-none focus:ring-2 focus:ring-soft-orange"
            />
            <input
              type="text"
              value={currentAmount}
              onChange={(event) => setCurrentAmount(formatRupiah(event.target.value))}
              placeholder="Current amount"
              className="w-full rounded-lg border p-3 text-right text-xl font-bold focus:outline-none focus:ring-2 focus:ring-soft-orange"
            />
            <select
              value={accountId}
              onChange={(event) => setAccountId(event.target.value)}
              className="w-full rounded-lg border bg-soft-orange/10 p-3 text-deep-slate"
            >
              <option value="">No linked account</option>
              {dashboard.accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              className="w-full rounded-lg border p-3 focus:outline-none focus:ring-2 focus:ring-soft-orange"
            />
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Optional note"
              className="min-h-20 w-full rounded-lg border p-3 focus:outline-none focus:ring-2 focus:ring-soft-orange"
            />
            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full rounded-xl bg-soft-orange py-3 font-semibold text-white shadow-lg disabled:opacity-50"
            >
              {submitStatus === "saving" ? "Saving..." : "Save Goal"}
            </button>
          </form>

          <form onSubmit={handleContributionSubmit} className="space-y-3 rounded-lg bg-white p-4 shadow-md">
            <div>
              <h2 className="text-lg font-bold text-deep-slate">Add Contribution</h2>
              <p className="text-sm text-deep-slate/60">
                Move money from a wallet into a goal and keep the activity in transactions.
              </p>
            </div>
            {contributionMessage ? (
              <div className={`rounded-md p-3 text-sm ${contributionStatus === "success" ? "bg-green-50 text-money-in" : "bg-red-50 text-money-out"}`}>
                {contributionMessage}
              </div>
            ) : null}
            <select
              value={contributionGoalId}
              onChange={(event) => setContributionGoalId(event.target.value)}
              className="w-full rounded-lg border bg-soft-orange/10 p-3 text-deep-slate"
            >
              <option value="">Choose goal</option>
              {activeGoals.map((goal) => (
                <option key={goal.id} value={goal.id}>
                  {goal.name}
                </option>
              ))}
            </select>
            <select
              value={contributionAccountId}
              onChange={(event) => setContributionAccountId(event.target.value)}
              className="w-full rounded-lg border bg-soft-orange/10 p-3 text-deep-slate"
            >
              <option value="">Choose source wallet</option>
              {dashboard.accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} - Rp {account.balance.toLocaleString("id-ID")}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={contributionAmount}
              onChange={(event) => setContributionAmount(formatRupiah(event.target.value))}
              placeholder="Contribution amount"
              className="w-full rounded-lg border p-3 text-right text-xl font-bold focus:outline-none focus:ring-2 focus:ring-soft-orange"
            />
            <input
              type="date"
              value={contributionDate}
              onChange={(event) => setContributionDate(event.target.value)}
              className="w-full rounded-lg border p-3 focus:outline-none focus:ring-2 focus:ring-soft-orange"
            />
            <textarea
              value={contributionNote}
              onChange={(event) => setContributionNote(event.target.value)}
              placeholder="Optional contribution note"
              className="min-h-20 w-full rounded-lg border p-3 focus:outline-none focus:ring-2 focus:ring-soft-orange"
            />
            <button
              type="submit"
              disabled={!canContribute}
              className="w-full rounded-xl bg-soft-orange py-3 font-semibold text-white shadow-lg disabled:opacity-50"
            >
              {contributionStatus === "saving" ? "Saving Contribution..." : "Add Contribution"}
            </button>
          </form>

          <section>
            <h2 className="mb-2 text-xl font-bold text-deep-slate">Active Goals</h2>
            {activeGoals.length === 0 ? (
              <div className="rounded-md bg-warm-cream p-4 text-sm text-deep-slate shadow">
                No active goals found.
              </div>
            ) : null}
            <div className="space-y-2">
              {activeGoals.map((goal) => {
                const progress = goal.targetAmount > 0
                  ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100))
                  : 0;

                return (
                  <div
                    key={goal.id}
                    className="w-full rounded-md bg-warm-cream p-3 text-left shadow"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-deep-slate">{goal.name}</p>
                      <p className="text-sm font-semibold text-soft-orange">{progress}%</p>
                    </div>
                    <p className="mt-1 text-sm text-deep-slate">
                      Rp {goal.currentAmount.toLocaleString("id-ID")} / Rp {goal.targetAmount.toLocaleString("id-ID")}
                    </p>
                    <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                      <button
                        type="button"
                        onClick={() => chooseGoal(goal.id)}
                        className="rounded-md border border-deep-slate/20 px-3 py-2 text-sm font-semibold text-deep-slate"
                      >
                        Edit Goal
                      </button>
                      <button
                        type="button"
                        onClick={() => setContributionGoalId(goal.id)}
                        className="rounded-md bg-soft-orange px-3 py-2 text-sm font-semibold text-white"
                      >
                        Add Contribution
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </main>

        <BottomNav />
      </div>
    </AuthGate>
  );
}
