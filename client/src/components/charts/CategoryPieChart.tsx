import { Cell, Label, Pie, PieChart } from "recharts";
import type { SpendingByCategoryEntry } from "../../types";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "../ui/chart";
import { CATEGORICAL } from "./chartColors";

export function CategoryPieChart({ data }: { data: SpendingByCategoryEntry[] }) {
  if (data.length === 0) {
    return <p className="empty-state">No expenses recorded for this month yet.</p>;
  }

  const MAX_SLICES = 8;
  const top = data.slice(0, MAX_SLICES);
  const rest = data.slice(MAX_SLICES);
  const chartData = rest.length
    ? [...top, { categoryId: -1, categoryName: "Other", amount: rest.reduce((s, r) => s + r.amount, 0) }]
    : top;

  const total = chartData.reduce((sum, d) => sum + d.amount, 0);

  const chartConfig: ChartConfig = Object.fromEntries(
    chartData.map((d, i) => [
      d.categoryName,
      { label: d.categoryName, color: CATEGORICAL[i % CATEGORICAL.length] },
    ]),
  );

  return (
    <ChartContainer config={chartConfig} className="mx-auto h-[300px] w-full max-w-[380px]">
      <PieChart>
        <ChartTooltip content={<ChartTooltipContent formatter={(v) => `$${Number(v).toFixed(2)}`} />} />
        <Pie
          data={chartData}
          dataKey="amount"
          nameKey="categoryName"
          innerRadius={68}
          outerRadius={104}
          paddingAngle={2}
          strokeWidth={2}
        >
          {chartData.map((entry, i) => (
            <Cell key={entry.categoryId} fill={CATEGORICAL[i % CATEGORICAL.length]} />
          ))}
          <Label
            content={({ viewBox }) => {
              if (!viewBox || !("cx" in viewBox)) return null;
              return (
                <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                  <tspan x={viewBox.cx} y={(viewBox.cy ?? 0) - 6} className="fill-foreground text-lg font-bold">
                    ${total.toFixed(0)}
                  </tspan>
                  <tspan x={viewBox.cx} y={(viewBox.cy ?? 0) + 14} className="fill-muted-foreground text-xs">
                    total spent
                  </tspan>
                </text>
              );
            }}
          />
        </Pie>
        <ChartLegend content={<ChartLegendContent />} />
      </PieChart>
    </ChartContainer>
  );
}
