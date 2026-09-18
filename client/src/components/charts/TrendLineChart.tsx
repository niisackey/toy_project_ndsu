import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import type { IncomeVsExpenseEntry } from "../../types";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "../ui/chart";
import { EXPENSE_COLOR, INCOME_COLOR } from "./chartColors";

const chartConfig: ChartConfig = {
  income: { label: "Income", color: INCOME_COLOR },
  expense: { label: "Expense", color: EXPENSE_COLOR },
};

export function TrendLineChart({ data }: { data: IncomeVsExpenseEntry[] }) {
  if (data.length === 0) {
    return <p className="empty-state">Not enough history yet to show a trend.</p>;
  }

  return (
    <ChartContainer config={chartConfig} className="h-[280px] w-full">
      <LineChart data={data} margin={{ left: -12, right: 12, top: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="period" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
        <YAxis tickLine={false} axisLine={false} tickMargin={8} fontSize={12} width={56} />
        <ChartTooltip content={<ChartTooltipContent formatter={(v) => `$${Number(v).toFixed(2)}`} />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Line
          type="monotone"
          dataKey="income"
          stroke="var(--color-income)"
          strokeWidth={2.5}
          dot={{ r: 3, fill: "var(--color-income)", strokeWidth: 0 }}
          activeDot={{ r: 5 }}
        />
        <Line
          type="monotone"
          dataKey="expense"
          stroke="var(--color-expense)"
          strokeWidth={2.5}
          dot={{ r: 3, fill: "var(--color-expense)", strokeWidth: 0 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ChartContainer>
  );
}
