import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";
import type { BalancesOverviewEntry } from "../../types";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "../ui/chart";
import { formatMoney } from "../../lib/currency";
import { CATEGORICAL } from "./chartColors";

export function BalanceBarChart({
  data,
  currency = "USD",
}: {
  data: BalancesOverviewEntry[];
  currency?: string;
}) {
  if (data.length === 0) {
    return <p className="empty-state">No accounts yet.</p>;
  }

  const chartConfig: ChartConfig = Object.fromEntries(
    data.map((d, i) => [d.accountName, { label: d.accountName, color: CATEGORICAL[i % CATEGORICAL.length] }]),
  );

  return (
    <ChartContainer config={chartConfig} className="h-[280px] w-full">
      <BarChart data={data} margin={{ left: -12, right: 12, top: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="accountName" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
        <YAxis tickLine={false} axisLine={false} tickMargin={8} fontSize={12} width={56} />
        <ChartTooltip
          cursor={{ fill: "hsl(var(--muted))" }}
          content={<ChartTooltipContent formatter={(v) => formatMoney(Number(v), currency)} />}
        />
        <Bar dataKey="balanceInBaseCurrency" radius={[6, 6, 0, 0]} maxBarSize={56}>
          {data.map((entry, i) => (
            <Cell key={entry.accountId} fill={CATEGORICAL[i % CATEGORICAL.length]} />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
