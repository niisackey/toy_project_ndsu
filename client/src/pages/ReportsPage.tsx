import { useEffect, useState } from "react";
import { format } from "date-fns";
import { jsPDF } from "jspdf";
import { Download, FileText } from "lucide-react";
import { CategoryPieChart } from "../components/charts/CategoryPieChart";
import { TrendLineChart } from "../components/charts/TrendLineChart";
import { BalanceBarChart } from "../components/charts/BalanceBarChart";
import { PageLayout } from "../components/layout/PageLayout";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Label } from "../components/ui/label";
import { MonthPicker } from "../components/ui/month-picker";
import { fetchBalancesOverview, fetchIncomeVsExpense, fetchSpendingByCategory } from "../api/reports";
import { fetchRates } from "../api/currency";
import { downloadCsv, toCsv } from "../lib/csv";
import { formatMoney } from "../lib/currency";
import type { BalancesOverviewEntry, IncomeVsExpenseEntry, SpendingByCategoryEntry } from "../types";

export default function ReportsPage() {
  const [month, setMonth] = useState(format(new Date(), "yyyy-MM"));
  const [spending, setSpending] = useState<SpendingByCategoryEntry[]>([]);
  const [trend, setTrend] = useState<IncomeVsExpenseEntry[]>([]);
  const [balances, setBalances] = useState<BalancesOverviewEntry[]>([]);
  const [baseCurrency, setBaseCurrency] = useState("USD");

  useEffect(() => {
    fetchSpendingByCategory(month).then(setSpending);
  }, [month]);

  useEffect(() => {
    fetchIncomeVsExpense().then(setTrend);
    fetchBalancesOverview().then(setBalances);
    fetchRates().then((r) => setBaseCurrency(r.baseCurrency));
  }, []);

  function handleExportCsv() {
    const sections = [
      `Spending by category - ${month}`,
      toCsv(spending, [
        { header: "Category", value: (r) => r.categoryName },
        { header: "Amount", value: (r) => r.amount },
      ]),
      "",
      "Income vs. expense (last 6 months)",
      toCsv(trend, [
        { header: "Period", value: (r) => r.period },
        { header: "Income", value: (r) => r.income },
        { header: "Expense", value: (r) => r.expense },
      ]),
      "",
      `Account balances (in ${baseCurrency})`,
      toCsv(balances, [
        { header: "Account", value: (r) => r.accountName },
        { header: "Balance", value: (r) => r.balanceInBaseCurrency },
      ]),
    ];
    downloadCsv(`reports-${format(new Date(), "yyyy-MM-dd")}.csv`, sections.join("\n"));
  }

  function handleExportPdf() {
    const doc = new jsPDF();
    let y = 18;
    const lineHeight = 7;

    doc.setFontSize(16);
    doc.text("Financial Report", 14, y);
    doc.setFontSize(10);
    doc.text(format(new Date(), "yyyy-MM-dd"), 196, y, { align: "right" });
    y += 10;

    function section(title: string) {
      doc.setFontSize(12);
      doc.text(title, 14, y);
      y += lineHeight;
      doc.setFontSize(10);
    }

    function row(label: string, value: string) {
      doc.text(label, 14, y);
      doc.text(value, 196, y, { align: "right" });
      y += lineHeight;
    }

    section(`Spending by category - ${month}`);
    if (spending.length === 0) {
      doc.text("No data", 14, y);
      y += lineHeight;
    }
    spending.forEach((r) => row(r.categoryName, formatMoney(r.amount, baseCurrency)));
    y += 4;

    section("Income vs. expense (last 6 months)");
    trend.forEach((r) =>
      row(r.period, `+${formatMoney(r.income, baseCurrency)} / -${formatMoney(r.expense, baseCurrency)}`),
    );
    y += 4;

    section(`Account balances (in ${baseCurrency})`);
    balances.forEach((r) => row(r.accountName, formatMoney(r.balanceInBaseCurrency, baseCurrency)));

    doc.save(`reports-${format(new Date(), "yyyy-MM-dd")}.pdf`);
  }

  return (
    <PageLayout
      title="Reports"
      subtitle="Where your money comes from and where it goes"
      actions={
        <>
          <Button variant="outline" onClick={handleExportCsv}>
            <Download size={16} /> Export CSV
          </Button>
          <Button variant="outline" onClick={handleExportPdf}>
            <FileText size={16} /> Export PDF
          </Button>
        </>
      }
    >
      <div className="mb-8">
        <div className="mb-3 max-w-[260px] space-y-1.5">
          <Label htmlFor="month">Spending by category - month</Label>
          <MonthPicker id="month" value={month} onChange={setMonth} />
        </div>
        <Card>
          <CardContent className="pt-5">
            <CategoryPieChart data={spending} currency={baseCurrency} />
          </CardContent>
        </Card>
      </div>

      <div className="mb-8">
        <h2 className="mb-3.5 text-base font-bold tracking-tight">Income vs. expense (last 6 months)</h2>
        <Card>
          <CardContent className="pt-5">
            <TrendLineChart data={trend} currency={baseCurrency} />
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="mb-3.5 text-base font-bold tracking-tight">Account balances</h2>
        <Card>
          <CardContent className="pt-5">
            <BalanceBarChart data={balances} currency={baseCurrency} />
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
