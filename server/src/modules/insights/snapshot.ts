import { format } from "date-fns";
import { listAccounts } from "../accounts/accounts.service";
import { listBudgets } from "../budgets/budgets.service";
import { computeCreditHealth } from "../credit/scoring";
import { getBaseCurrency } from "../currency/currency.service";
import { listGoals } from "../goals/goals.service";
import { listRecurringRules } from "../recurring/recurring.service";
import { spendingByCategory } from "../reports/reports.service";
import { incomeBySourceLast3Months, savingsRateLast3Months } from "./rules";

export function buildFinancialSnapshot() {
  const today = format(new Date(), "yyyy-MM-dd");
  const currentMonth = format(new Date(), "yyyy-MM");
  const lastMonth = format(new Date(new Date().setMonth(new Date().getMonth() - 1)), "yyyy-MM");
  const baseCurrency = getBaseCurrency();

  const allAccounts = listAccounts();
  const accountCurrency = new Map(allAccounts.map((a) => [a.id, a.currency]));

  const accounts = allAccounts.map((a) => ({
    name: a.name,
    type: a.type,
    currency: a.currency,
    balance: a.balance,
    creditLimit: a.creditLimit,
    utilizationPct: a.utilizationPct,
    nextPaymentDueDate: a.nextPaymentDueDate,
    nextStatementClosingDate: a.nextStatementClosingDate,
  }));

  const budgets = listBudgets(currentMonth).map((b) => ({
    category: b.categoryName,
    limit: b.limitAmount,
    spent: b.spent,
  }));

  const goals = listGoals().map((g) => ({
    name: g.name,
    targetAmount: g.targetAmount,
    currency: g.currency,
    currentAmount: g.currentAmount,
    progressPct: g.progressPct,
    targetDate: g.targetDate,
    recentMonthlySavingsRate: g.monthlyRate,
    projectedCompletionDate: g.projectedCompletionDate,
  }));

  const recurringRules = listRecurringRules().map((r) => ({
    name: r.name,
    type: r.type,
    amount: r.amount,
    currency: accountCurrency.get(r.accountId) ?? "USD",
    frequency: r.frequency,
    nextDueDate: r.nextDueDate,
    active: r.active,
  }));

  const { rate: savingsRate3mo, income: income3mo } = savingsRateLast3Months();
  const incomeSources3mo = incomeBySourceLast3Months().map((r) => ({
    source: r.description ?? "Unlabeled",
    total: r.total,
  }));

  const creditHealth = computeCreditHealth();

  return {
    today,
    baseCurrency,
    note: "amounts in accounts/goals/recurringBillsAndIncome are in each item's own currency (see its currency field); spendingByCategory*, budgets, totalIncomeLast3Months, and incomeSourcesLast3Months are already converted into baseCurrency",
    accounts,
    spendingByCategoryThisMonth: spendingByCategory(currentMonth),
    spendingByCategoryLastMonth: spendingByCategory(lastMonth),
    budgets,
    incomeSourcesLast3Months: incomeSources3mo,
    totalIncomeLast3Months: income3mo,
    savingsRatePctLast3Months: Math.round(savingsRate3mo * 1000) / 10,
    recurringBillsAndIncome: recurringRules,
    goals,
    creditHealth: {
      simulatedScore: creditHealth.simulatedScore,
      scoreRangeLabel: creditHealth.scoreRangeLabel,
      factors: creditHealth.factors.map((f) => ({
        label: f.label,
        scoreOutOf100: f.scoreOutOf100,
        explanation: f.explanation,
      })),
      cardUtilization: creditHealth.cardUtilization,
    },
  };
}

export type FinancialSnapshot = ReturnType<typeof buildFinancialSnapshot>;
