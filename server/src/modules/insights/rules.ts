import { format, parseISO, subMonths } from "date-fns";
import { db } from "../../db/connection";
import { daysUntil } from "../../shared/dates";
import { listAccounts } from "../accounts/accounts.service";
import { listBudgets } from "../budgets/budgets.service";
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
  const rows = db
    .prepare(
      `SELECT c.name AS categoryName,
         COALESCE(SUM(CASE WHEN substr(t.date,1,7) = ? THEN t.amount END), 0) AS current,
         COALESCE(SUM(CASE WHEN substr(t.date,1,7) = ? THEN t.amount END), 0) AS previous
       FROM categories c
       LEFT JOIN transactions t ON t.category_id = c.id AND t.type = 'expense'
       GROUP BY c.id, c.name`,
    )
    .all(currentMonth(), previousMonth()) as unknown as {
    categoryName: string;
    current: number;
    previous: number;
  }[];

  for (const row of rows) {
    if (row.previous > 0 && row.current > row.previous * 1.2) {
      const pctIncrease = Math.round(((row.current - row.previous) / row.previous) * 100);
      insights.push({
        type: "warning",
        category: "spending",
        message: `Your ${row.categoryName} spending is up ${pctIncrease}% vs last month ($${row.current.toFixed(2)} vs $${row.previous.toFixed(2)}).`,
      });
    }
  }
  return insights;
}

function budgetOverrunInsights(): Insight[] {
  const budgets = listBudgets(currentMonth());
  return budgets
    .filter((b) => b.spent > b.limitAmount)
    .map((b) => ({
      type: "warning" as const,
      category: "budget",
      message: `You've spent $${b.spent.toFixed(2)} on ${b.categoryName}, over your $${b.limitAmount.toFixed(2)} budget for this month.`,
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
  return db
    .prepare(
      `SELECT description, SUM(amount) AS total FROM transactions
       WHERE type = 'income' AND date >= ?
       GROUP BY description
       ORDER BY total DESC`,
    )
    .all(threeMonthsAgo) as unknown as { description: string | null; total: number }[];
}

export function savingsRateLast3Months(): { income: number; expense: number; rate: number } {
  const threeMonthsAgo = format(subMonths(new Date(), 3), "yyyy-MM-dd");
  const row = db
    .prepare(
      `SELECT
         COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS income,
         COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS expense
       FROM transactions WHERE date >= ?`,
    )
    .get(threeMonthsAgo) as unknown as { income: number; expense: number };
  const rate = row.income > 0 ? (row.income - row.expense) / row.income : 0;
  return { income: row.income, expense: row.expense, rate };
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
  for (const rule of listRecurringRules()) {
    if (!rule.active) continue;
    const days = daysUntil(rule.nextDueDate);
    if (days >= 0 && days <= UPCOMING_WINDOW_DAYS) {
      const when = days === 0 ? "today" : days === 1 ? "tomorrow" : `in ${days} days`;
      insights.push({
        type: "tip",
        category: "upcoming",
        message: `${rule.name} (${rule.type === "expense" ? "-" : "+"}$${rule.amount.toFixed(2)}) is due ${when}, on ${rule.nextDueDate}.`,
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
          message: `${a.name}'s payment of $${a.balance.toFixed(2)} is due ${when} (${a.nextPaymentDueDate}) - a missed due date is one of the fastest ways to hurt your credit score.`,
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
        message: `To hit "${goal.name}" ($${goal.targetAmount}) by ${goal.targetDate}, try saving about $${shortfall.toFixed(2)} more per month than your recent average.`,
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
