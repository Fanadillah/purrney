import { Progress } from "@/components/ui/progress";
import type { GoalSheetRow } from "@/lib/spreadsheetSchema";
import Link from "next/link";

type DashboardGoalsProps = {
  goals: GoalSheetRow[];
};

function calculateGoalProgress(goal: GoalSheetRow) {
  if (goal.targetAmount <= 0) return 0;
  return Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
}

const DashboardGoals = ({ goals }: DashboardGoalsProps) => {
  const activeGoals = goals
    .filter((goal) => goal.isActive)
    .sort((left, right) => calculateGoalProgress(right) - calculateGoalProgress(left))
    .slice(0, 3);

  return (
    <section className="m-4 rounded-lg bg-warm-cream p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-bold text-deep-slate">Goals Overview</h2>
        <Link href="/goals" className="text-sm font-semibold text-soft-orange">
          View All
        </Link>
      </div>

      {activeGoals.length === 0 ? (
        <Link href="/goals" className="block rounded-md bg-white p-3 text-sm text-deep-slate/70 shadow-sm">
          No active goals yet.
        </Link>
      ) : (
        <div className="space-y-3">
          {activeGoals.map((goal) => {
            const progress = calculateGoalProgress(goal);

            return (
              <Link href="/goals" key={goal.id} className="block rounded-md bg-white p-3 shadow-sm">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-bold text-deep-slate">{goal.name}</h3>
                    <p className="text-xs text-deep-slate/60">
                      Rp {goal.currentAmount.toLocaleString("id-ID")} / Rp {goal.targetAmount.toLocaleString("id-ID")}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-deep-slate">{progress}%</p>
                </div>
                <Progress value={progress} className="h-2 rounded-full bg-soft-orange/20" />
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default DashboardGoals;
