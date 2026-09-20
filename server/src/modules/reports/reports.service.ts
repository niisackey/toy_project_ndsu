import { db } from "../../db/connection";
import { listAccounts } from "../accounts/accounts.service";
import { convert, getBaseCurrency } from "../currency/currency.service";

export interface SpendingByCategoryEntry {
  categoryId: number;
  categoryName: string;
  amount: number;
}

export function spendingByCategory(month: string): SpendingByCategoryEntry[] {
  const baseCurrency = getBaseCurrency();
  const rows = db
    .prepare(
      `SELECT c.id AS categoryId, c.name AS categoryName, t.amount AS amount, a.currency AS currency
       FROM transactions t
       JOIN categories c ON c.id = t.category_id
       JOIN accounts a ON a.id = t.account_id
       WHERE t.type = 'expense' AND substr(t.date, 1, 7) = ?`,
    )
    .all(month) as unknown as {
    categoryId: number;
    categoryName: string;
    amount: number;
    currency: string;
  }[];

  const totals = new Map<number, SpendingByCategoryEntry>();
  for (const row of rows) {
    const converted = convert(row.amount, row.currency, baseCurrency);
    const existing = totals.get(row.categoryId);
    if (existing) {
      existing.amount += converted;
    } else {
      totals.set(row.categoryId, {
        categoryId: row.categoryId,
        categoryName: row.categoryName,
        amount: converted,
      });
    }
  }
  return Array.from(totals.values()).sort((a, b) => b.amount - a.amount);
}

export interface IncomeVsExpenseEntry {
  period: string;
  income: number;
  expense: number;
}

export function incomeVsExpense(from: string, to: string): IncomeVsExpenseEntry[] {
  const baseCurrency = getBaseCurrency();
  const rows = db
    .prepare(
      `SELECT substr(t.date, 1, 7) AS period, t.type AS type, t.amount AS amount, a.currency AS currency
       FROM transactions t
       JOIN accounts a ON a.id = t.account_id
       WHERE t.date >= ? AND t.date <= ? AND t.type IN ('income', 'expense')`,
    )
    .all(from, to) as unknown as {
    period: string;
    type: "income" | "expense";
    amount: number;
    currency: string;
  }[];

  const totals = new Map<string, IncomeVsExpenseEntry>();
  for (const row of rows) {
    const converted = convert(row.amount, row.currency, baseCurrency);
    const bucket = totals.get(row.period) ?? { period: row.period, income: 0, expense: 0 };
    if (row.type === "income") bucket.income += converted;
    else bucket.expense += converted;
    totals.set(row.period, bucket);
  }
  return Array.from(totals.values()).sort((a, b) => a.period.localeCompare(b.period));
}

export interface BalancesOverviewEntry {
  accountId: number;
  accountName: string;
  type: string;
  currency: string;
  balance: number;
  balanceInBaseCurrency: number;
  utilizationPct: number | null;
}

export function balancesOverview(): BalancesOverviewEntry[] {
  const baseCurrency = getBaseCurrency();
  return listAccounts().map((a) => ({
    accountId: a.id,
    accountName: a.name,
    type: a.type,
    currency: a.currency,
    balance: a.balance,
    balanceInBaseCurrency: convert(a.balance, a.currency, baseCurrency),
    utilizationPct: a.utilizationPct,
  }));
}
