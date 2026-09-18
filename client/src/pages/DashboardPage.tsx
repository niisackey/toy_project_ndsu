import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  PiggyBank,
  Scale,
  Sparkles,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { BalanceBarChart } from "../components/charts/BalanceBarChart";
import { TrendLineChart } from "../components/charts/TrendLineChart";
import { PageLayout } from "../components/layout/PageLayout";
import { Badge } from "../components/ui/badge";
import { Card, CardContent } from "../components/ui/card";
import { fetchBalancesOverview, fetchIncomeVsExpense } from "../api/reports";
import { useBudgets } from "../hooks/useBudgets";
import { useInsights } from "../hooks/useInsights";
import type { BalancesOverviewEntry, IncomeVsExpenseEntry, InsightType } from "../types";

const insightIcon: Record<InsightType, LucideIcon> = {
  warning: AlertTriangle,
  positive: CheckCircle2,
  tip: Lightbulb,
};

const insightIconTone: Record<InsightType, string> = {
  warning: "bg-warning/15 text-warning",
  positive: "bg-success/15 text-success",
  tip: "bg-accent text-primary",
};

function StatCard({
  icon: Icon,
  tone,
  label,
  value,
}: {
  icon: LucideIcon;
  tone: "default" | "success" | "warning" | "destructive";
  label: string;
  value: string;
}) {
  const toneClasses: Record<string, string> = {
    default: "bg-accent text-primary",
    success: "bg-success/15 text-success",
    warning: "bg-warning/15 text-warning",
    destructive: "bg-destructive/10 text-destructive",
  };
  return (
    <Card>
      <CardContent className="flex items-start gap-3.5 pt-5">
        <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${toneClasses[tone]}`}>
          <Icon size={19} />
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {label}
          </div>
          <div className="mt-0.5 text-xl font-extrabold tracking-tight">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const [balances, setBalances] = useState<BalancesOverviewEntry[]>([]);
  const [trend, setTrend] = useState<IncomeVsExpenseEntry[]>([]);
  const { budgets } = useBudgets();
  const { insights, source, loading: insightsLoading } = useInsights();

  useEffect(() => {
    fetchBalancesOverview().then(setBalances);
    fetchIncomeVsExpense().then(setTrend);
  }, []);

  const totalAssets = balances
    .filter((b) => b.type !== "credit_card")
    .reduce((sum, b) => sum + b.balance, 0);
  const totalDebt = balances
    .filter((b) => b.type === "credit_card")
    .reduce((sum, b) => sum + b.balance, 0);
  const overBudget = budgets.filter((b) => b.spent > b.limitAmount);
  const netWorth = totalAssets - totalDebt;

  return (
    <PageLayout title="Dashboard" subtitle="Your financial picture at a glance">
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Wallet} tone="default" label="Total assets" value={`$${totalAssets.toFixed(2)}`} />
        <StatCard icon={PiggyBank} tone="destructive" label="Credit card debt" value={`$${totalDebt.toFixed(2)}`} />
        <StatCard
          icon={Scale}
          tone={netWorth >= 0 ? "success" : "destructive"}
          label="Net worth"
          value={`$${netWorth.toFixed(2)}`}
        />
        <StatCard
          icon={AlertTriangle}
          tone={overBudget.length > 0 ? "warning" : "success"}
          label="Budgets over limit"
          value={String(overBudget.length)}
        />
      </div>

      <div className="mb-8">
        <div className="mb-3.5 flex items-center gap-2">
          <h2 className="text-base font-bold tracking-tight">Insights</h2>
          {!insightsLoading && (
            <Badge variant={source === "ai" ? "success" : "secondary"}>
              {source === "ai" ? (
                <>
                  <Sparkles size={11} /> AI-generated
                </>
              ) : (
                "Rule-based"
              )}
            </Badge>
          )}
        </div>
        {source === "rules" && !insightsLoading && (
          <p className="-mt-2 mb-3 text-sm text-muted-foreground">
            Set ANTHROPIC_API_KEY in your .env to switch these to live AI-generated insights.
          </p>
        )}
        {!insightsLoading && insights.length === 0 && (
          <p className="empty-state">No insights yet - add a few transactions to get personalized feedback.</p>
        )}
        {insights.length > 0 && (
          <Card>
            <CardContent className="divide-y divide-border/60 p-0">
              {insights.slice(0, 5).map((insight, i) => {
                const Icon = insightIcon[insight.type] ?? Lightbulb;
                return (
                  <div key={i} className="flex items-start gap-3.5 px-5 py-4 first:pt-4 last:pb-4">
                    <div
                      className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${insightIconTone[insight.type] ?? insightIconTone.tip}`}
                    >
                      <Icon size={15} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm leading-relaxed">{insight.message}</p>
                      <span className="mt-1 inline-block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                        {insight.category}
                      </span>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}
      </div>

      <div className="mb-8">
        <h2 className="mb-3.5 text-base font-bold tracking-tight">Income vs. expense (last 6 months)</h2>
        <Card>
          <CardContent className="pt-5">
            <TrendLineChart data={trend} />
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="mb-3.5 text-base font-bold tracking-tight">Account balances</h2>
        <Card>
          <CardContent className="pt-5">
            <BalanceBarChart data={balances} />
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
