import { format, parseISO, subMonths } from "date-fns";
import { db } from "../../db/connection";
import { daysUntil } from "../../shared/dates";
import { formatMoney } from "../../shared/money";
import { listAccounts } from "../accounts/accounts.service";
import { listBudgets } from "../budgets/budgets.service";
import { convert, getBaseCurrency } from "../currency/currency.service";
import { listGoals } from "../goals/goals.service";
import { listRecurringRules } from "../recurring/recurring.service";

export type InsightType = "tip" | "warning" | "positive";

export interface Insight {
  type: InsightType;
  category: string;
  message: string;
}

function currentMonth(): string {
  return format(new Date(), "yyyy-MM");
}

function previousMonth(): string {
  return format(subMonths(new Date(), 1), "yyyy-MM");
}

function spendingTrendInsights(): Insight[] {
  const insights: Insight[] = [];
  const baseCurrency = getBaseCurrency();
  const current = currentMonth();
  const previous = previousMonth();
  const rows = db
    .prepare(
      `SELECT c.id AS categoryId, c.name AS categoryName, t.amount AS amount, t.date AS date, a.currency AS currency
       FROM categories c
       LEFT JOIN transactions t ON t.category_id = c.id AND t.type = 'expense'
       LEFT JOIN accounts a ON a.id = t.account_id`,
    )
    .all() as unknown as {
    categoryId: number;
    categoryName: string;
    amount: number | null;
    date: string | null;
    currency: string | null;
  }[];

  const totals = new Map<number, { categoryName: string; current: number; previous: number }>();
  for (const row of rows) {
    if (!row.date || row.amount === null || !row.currency) continue;
    const month = row.date.slice(0, 7);
    if (month !== current && month !== previous) continue;
    const entry = totals.get(row.categoryId) ?? { categoryName: row.categoryName, current: 0, previous: 0 };
    const converted = convert(row.amount, row.currency, baseCurrency);
    if (month === current) entry.current += converted;
    else entry.previous += converted;
    totals.set(row.categoryId, entry);
  }

  for (const { categoryName, current: cur, previous: prev } of totals.values()) {
    if (prev > 0 && cur > prev * 1.2) {
      const pctIncrease = Math.round(((cur - prev) / prev) * 100);
      insights.push({
        type: "warning",
        category: "spending",
        message: `Your ${categoryName} spending is up ${pctIncrease}% vs last month (${formatMoney(cur, baseCurrency)} vs ${formatMoney(prev, baseCurrency)}).`,
      });
    }
  }
  return insights;
}

function budgetOverrunInsights(): Insight[] {
  const baseCurrency = getBaseCurrency();
  const budgets = listBudgets(currentMonth());
  return budgets
    .filter((b) => b.spent > b.limitAmount)
    .map((b) => ({
      type: "warning" as const,
      category: "budget",
      message: `You've spent ${formatMoney(b.spent, baseCurrency)} on ${b.categoryName}, over your ${formatMoney(b.limitAmount, baseCurrency)} budget for this month.`,
    }));
}

function creditUtilizationInsights(): Insight[] {
  const accounts = listAccounts();
  const insights: Insight[] = [];
  for (const a of accounts) {
    if (a.type !== "credit_card" || a.utilizationPct === null) continue;
    if (a.utilizationPct > 50) {
      insights.push({
        type: "warning",
        category: "credit",
        message: `${a.name} is at ${a.utilizationPct}% utilization - paying this down will likely help your credit health score.`,
      });
    } else if (a.utilizationPct > 30) {
      insights.push({
        type: "tip",
        category: "credit",
        message: `${a.name} is at ${a.utilizationPct}% utilization, above the recommended 30% - consider a partial payment before the statement closes.`,
      });
    }
  }
  return insights;
}

export function incomeBySourceLast3Months(): { description: string | null; total: number }[] {
  const threeMonthsAgo = format(subMonths(new Date(), 3), "yyyy-MM-dd");
  const baseCurrency = getBaseCurrency();
  const rows = db
    .prepare(
      `SELECT t.description AS description, t.amount AS amount, a.currency AS currency
       FROM transactions t
       JOIN accounts a ON a.id = t.account_id
       WHERE t.type = 'income' AND t.date >= ?`,
    )
    .all(threeMonthsAgo) as unknown as { description: string | null; amount: number; currency: string }[];

  const totals = new Map<string | null, number>();
  for (const row of rows) {
    const converted = convert(row.amount, row.currency, baseCurrency);
    totals.set(row.description, (totals.get(row.description) ?? 0) + converted);
  }
  return Array.from(totals.entries())
    .map(([description, total]) => ({ description, total }))
    .sort((a, b) => b.total - a.total);
}

export function savingsRateLast3Months(): { income: number; expense: number; rate: number } {
  const threeMonthsAgo = format(subMonths(new Date(), 3), "yyyy-MM-dd");
  const baseCurrency = getBaseCurrency();
  const rows = db
    .prepare(
      `SELECT t.type AS type, t.amount AS amount, a.currency AS currency
       FROM transactions t
       JOIN accounts a ON a.id = t.account_id
       WHERE t.date >= ? AND t.type IN ('income', 'expense')`,
    )
    .all(threeMonthsAgo) as unknown as { type: "income" | "expense"; amount: number; currency: string }[];

  let income = 0;
  let expense = 0;
  for (const row of rows) {
    const converted = convert(row.amount, row.currency, baseCurrency);
    if (row.type === "income") income += converted;
    else expense += converted;
  }
  const rate = income > 0 ? (income - expense) / income : 0;
  return { income, expense, rate };
}

function incomeDiversificationInsights(): Insight[] {
  const rows = incomeBySourceLast3Months();

  const totalIncome = rows.reduce((sum, r) => sum + r.total, 0);
  if (totalIncome === 0 || rows.length === 0) return [];

  const topShare = rows[0].total / totalIncome;
  if (topShare > 0.9 && totalIncome > 0) {
    return [
      {
        type: "tip",
        category: "income",
        message: `About ${Math.round(topShare * 100)}% of your income over the last 3 months came from a single source (${rows[0].description ?? "one source"}). A side gig, freelance work, or campus job can add a second stream and cushion any gap in the first.`,
      },
    ];
  }
  return [];
}

function savingsRateInsights(): Insight[] {
  const { income, rate: savingsRate } = savingsRateLast3Months();

  if (income <= 0) return [];
  const pct = Math.round(savingsRate * 100);

  if (savingsRate < 0) {
    return [
      {
        type: "warning",
        category: "savings",
        message: `You're spending more than you're earning over the last 3 months (savings rate ${pct}%). Review your recurring expenses and biggest categories first.`,
      },
    ];
  }
  if (savingsRate < 0.15) {
    return [
      {
        type: "tip",
        category: "savings",
        message: `Your savings rate over the last 3 months is about ${pct}%. Many financial guides suggest aiming for 15-20% if your budget allows it.`,
      },
    ];
  }
  return [
    {
      type: "positive",
      category: "savings",
      message: `Nice work - your savings rate over the last 3 months is about ${pct}%, at or above the commonly recommended 15-20% range.`,
    },
  ];
}

const UPCOMING_WINDOW_DAYS = 5;

function upcomingRecurringDueInsights(): Insight[] {
  const insights: Insight[] = [];
  const accountCurrency = new Map(listAccounts().map((a) => [a.id, a.currency]));
  for (const rule of listRecurringRules()) {
    if (!rule.active) continue;
    const days = daysUntil(rule.nextDueDate);
    if (days >= 0 && days <= UPCOMING_WINDOW_DAYS) {
      const when = days === 0 ? "today" : days === 1 ? "tomorrow" : `in ${days} days`;
      const currency = accountCurrency.get(rule.accountId) ?? "USD";
      const signedAmount = `${rule.type === "expense" ? "-" : "+"}${formatMoney(rule.amount, currency)}`;
      insights.push({
        type: "tip",
        category: "upcoming",
        message: `${rule.name} (${signedAmount}) is due ${when}, on ${rule.nextDueDate}.`,
      });
    }
  }
  return insights;
}

function creditCardDueDateInsights(): Insight[] {
  const insights: Insight[] = [];
  for (const a of listAccounts()) {
    if (a.type !== "credit_card") continue;
    if (a.nextPaymentDueDate) {
      const days = daysUntil(a.nextPaymentDueDate);
      if (days >= 0 && days <= UPCOMING_WINDOW_DAYS) {
        const when = days === 0 ? "today" : days === 1 ? "tomorrow" : `in ${days} days`;
        insights.push({
          type: days <= 2 ? "warning" : "tip",
          category: "credit",
          message: `${a.name}'s payment of ${formatMoney(a.balance, a.currency)} is due ${when} (${a.nextPaymentDueDate}) - a missed due date is one of the fastest ways to hurt your credit score.`,
        });
      }
    }
    if (a.nextStatementClosingDate) {
      const days = daysUntil(a.nextStatementClosingDate);
      if (days >= 0 && days <= 2) {
        insights.push({
          type: "tip",
          category: "credit",
          message: `${a.name}'s statement closes ${days === 0 ? "today" : days === 1 ? "tomorrow" : `in ${days} days`} (${a.nextStatementClosingDate}) - a payment made before it closes lowers the utilization reported on your statement.`,
        });
      }
    }
  }
  return insights;
}

function goalPacingInsights(): Insight[] {
  const insights: Insight[] = [];
  for (const goal of listGoals()) {
    if (!goal.targetDate) continue;
    const monthsUntilTarget = Math.max(
      1,
      Math.round((parseISO(goal.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30.44)),
    );
    const remaining = goal.targetAmount - goal.currentAmount;
    if (remaining <= 0) {
      insights.push({
        type: "positive",
        category: "goals",
        message: `You've reached your "${goal.name}" goal!`,
      });
      continue;
    }
    const neededMonthlyRate = remaining / monthsUntilTarget;
    if (goal.monthlyRate < neededMonthlyRate) {
      const shortfall = Math.round((neededMonthlyRate - goal.monthlyRate) * 100) / 100;
      insights.push({
        type: "tip",
        category: "goals",
        message: `To hit "${goal.name}" (${formatMoney(goal.targetAmount, goal.currency)}) by ${goal.targetDate}, try saving about ${formatMoney(shortfall, goal.currency)} more per month than your recent average.`,
      });
    } else {
      insights.push({
        type: "positive",
        category: "goals",
        message: `You're on pace for your "${goal.name}" goal by ${goal.targetDate} at your current savings rate.`,
      });
    }
  }
  return insights;
}

export function generateInsights(): Insight[] {
  return [
    ...creditCardDueDateInsights(),
    ...upcomingRecurringDueInsights(),
    ...budgetOverrunInsights(),
    ...creditUtilizationInsights(),
    ...spendingTrendInsights(),
    ...savingsRateInsights(),
    ...incomeDiversificationInsights(),
    ...goalPacingInsights(),
  ];
}
