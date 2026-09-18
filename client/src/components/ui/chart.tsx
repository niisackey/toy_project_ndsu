import * as React from "react";
import * as RechartsPrimitive from "recharts";
import { cn } from "../../lib/utils";

export type ChartConfig = {
  [key: string]: {
    label?: React.ReactNode;
    color?: string;
  };
};

type ChartContextProps = { config: ChartConfig };
const ChartContext = React.createContext<ChartContextProps | null>(null);

function useChart() {
  const context = React.useContext(ChartContext);
  if (!context) throw new Error("useChart must be used within a <ChartContainer />");
  return context;
}

const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    config: ChartConfig;
    children: React.ComponentProps<typeof RechartsPrimitive.ResponsiveContainer>["children"];
  }
>(({ id, className, children, config, ...props }, ref) => {
  const uniqueId = React.useId();
  const chartId = `chart-${id ?? uniqueId.replace(/:/g, "")}`;

  const colorConfig = Object.entries(config).filter(([, cfg]) => cfg.color);
  const styleTag = colorConfig.length
    ? `[data-chart=${chartId}] {\n${colorConfig
        .map(([key, cfg]) => `  --color-${key}: ${cfg.color};`)
        .join("\n")}\n}`
    : null;

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={chartId}
        ref={ref}
        className={cn(
          "flex justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line]:stroke-border/60 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-none [&_.recharts-sector]:outline-none [&_.recharts-sector[stroke='#fff']]:stroke-background [&_.recharts-surface]:outline-none",
          className,
        )}
        {...props}
      >
        {styleTag && <style dangerouslySetInnerHTML={{ __html: styleTag }} />}
        <RechartsPrimitive.ResponsiveContainer width="100%" height="100%">
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
});
ChartContainer.displayName = "Chart";

const ChartTooltip = RechartsPrimitive.Tooltip;

const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof RechartsPrimitive.Tooltip> & {
    className?: string;
    indicator?: "dot" | "line";
    hideLabel?: boolean;
    formatter?: (value: number | string) => string;
    labelFormatter?: (label: string) => React.ReactNode;
  }
>(
  (
    { active, payload, label, className, indicator = "dot", hideLabel = false, formatter, labelFormatter },
    ref,
  ) => {
    const { config } = useChart();

    if (!active || !payload?.length) return null;

    return (
      <div
        ref={ref}
        className={cn(
          "grid min-w-[10rem] items-start gap-1.5 rounded-lg border border-border/60 bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md",
          className,
        )}
      >
        {!hideLabel && label !== undefined && (
          <div className="font-medium">{labelFormatter ? labelFormatter(String(label)) : label}</div>
        )}
        <div className="grid gap-1.5">
          {payload.map((item, i) => {
            // pie slices all share one dataKey but have distinct names, so try
            // name first; line/bar series are the opposite (dataKey = series name)
            const nameKey = item.name !== undefined ? String(item.name) : undefined;
            const dataKeyKey = item.dataKey !== undefined ? String(item.dataKey) : undefined;
            const key = nameKey && config[nameKey] ? nameKey : (dataKeyKey ?? nameKey ?? "value");
            const cfg = config[key];
            const color = item.color ?? cfg?.color;
            const value = typeof item.value === "number" ? item.value : Number(item.value ?? 0);
            return (
              <div key={i} className="flex w-full items-center gap-2">
                {indicator === "dot" && (
                  <span
                    className="h-2 w-2 shrink-0 rounded-[2px]"
                    style={{ backgroundColor: color }}
                  />
                )}
                <span className="flex flex-1 items-center justify-between gap-3 leading-none">
                  {(cfg?.label ?? item.name) && (
                    <span className="text-muted-foreground">{cfg?.label ?? item.name}</span>
                  )}
                  <span className="ml-auto font-mono font-medium tabular-nums text-foreground">
                    {formatter ? formatter(value) : value}
                  </span>
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  },
);
ChartTooltipContent.displayName = "ChartTooltip";

const ChartLegend = RechartsPrimitive.Legend;

const ChartLegendContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    payload?: { value?: string; dataKey?: string | number; color?: string }[];
  }
>(({ className, payload }, ref) => {
  const { config } = useChart();
  if (!payload?.length) return null;

  return (
    <div ref={ref} className={cn("flex flex-wrap items-center justify-center gap-4 pt-3", className)}>
      {payload.map((item) => {
        const nameKey = item.value !== undefined ? String(item.value) : undefined;
        const dataKeyKey = item.dataKey !== undefined ? String(item.dataKey) : undefined;
        const key = nameKey && config[nameKey] ? nameKey : (dataKeyKey ?? nameKey ?? "value");
        const cfg = config[key];
        return (
          <div key={key} className="flex items-center gap-1.5">
            <span className="h-2 w-2 shrink-0 rounded-[2px]" style={{ backgroundColor: item.color }} />
            <span className="text-xs text-muted-foreground">{cfg?.label ?? item.value}</span>
          </div>
        );
      })}
    </div>
  );
});
ChartLegendContent.displayName = "ChartLegend";

export { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, useChart };
