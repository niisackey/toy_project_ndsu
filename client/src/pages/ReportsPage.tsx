import { useEffect, useState } from "react";
import { format } from "date-fns";
import { CategoryPieChart } from "../components/charts/CategoryPieChart";
import { TrendLineChart } from "../components/charts/TrendLineChart";
import { BalanceBarChart } from "../components/charts/BalanceBarChart";
import { PageLayout } from "../components/layout/PageLayout";
import { Card, CardContent } from "../components/ui/card";
import { Label } from "../components/ui/label";
import { MonthPicker } from "../components/ui/month-picker";
import { fetchBalancesOverview, fetchIncomeVsExpense, fetchSpendingByCategory } from "../api/reports";
import type { BalancesOverviewEntry, IncomeVsExpenseEntry, SpendingByCategoryEntry } from "../types";

export default function ReportsPage() {
  const [month, setMonth] = useState(format(new Date(), "yyyy-MM"));
  const [spending, setSpending] = useState<SpendingByCategoryEntry[]>([]);
  const [trend, setTrend] = useState<IncomeVsExpenseEntry[]>([]);
  const [balances, setBalances] = useState<BalancesOverviewEntry[]>([]);

  useEffect(() => {
    fetchSpendingByCategory(month).then(setSpending);
  }, [month]);

  useEffect(() => {
    fetchIncomeVsExpense().then(setTrend);
    fetchBalancesOverview().then(setBalances);
  }, []);

  return (
    <PageLayout title="Reports" subtitle="Where your money comes from and where it goes">
      <div className="mb-8">
        <div className="mb-3 max-w-[260px] space-y-1.5">
          <Label htmlFor="month">Spending by category - month</Label>
          <MonthPicker id="month" value={month} onChange={setMonth} />
        </div>
        <Card>
          <CardContent className="pt-5">
            <CategoryPieChart data={spending} />
          </CardContent>
        </Card>
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
