// Validated categorical order from the design system's default palette
// (references/palette.md) - fixed order, never cycled or re-sorted by rank.
export const CATEGORICAL = [
  "#2a78d6", // blue
  "#eb6834", // orange
  "#1baf7a", // aqua
  "#eda100", // yellow
  "#e87ba4", // magenta
  "#008300", // green
  "#4a3aa7", // violet
  "#e34948", // red
];

export const INCOME_COLOR = CATEGORICAL[0]; // blue
export const EXPENSE_COLOR = CATEGORICAL[1]; // orange

export const STATUS = {
  good: "#0ca30c",
  warning: "#fab219",
  serious: "#ec835a",
  critical: "#d03b3b",
};

export function utilizationStatusColor(pct: number): string {
  if (pct <= 30) return STATUS.good;
  if (pct <= 50) return STATUS.warning;
  if (pct <= 75) return STATUS.serious;
  return STATUS.critical;
}

// Tailwind-class equivalent of utilizationStatusColor, for elements styled
// with Tailwind utilities (e.g. a shadcn Progress indicator) rather than an
// inline hex color.
export function utilizationBarClass(pct: number): string {
  if (pct <= 30) return "bg-emerald-500";
  if (pct <= 50) return "bg-amber-500";
  if (pct <= 75) return "bg-orange-500";
  return "bg-destructive";
}

export const CHART_INK = "#52514e";
export const CHART_GRID = "#e1e0d9";
