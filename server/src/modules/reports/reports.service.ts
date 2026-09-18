import { db } from "../../db/connection";
import { listAccounts } from "../accounts/accounts.service";

export interface SpendingByCategoryEntry {
  categoryId: number;
  categoryName: string;
  amount: number;
}

export function spendingByCategory(month: string): SpendingByCategoryEntry[] {
  const rows = db
    .prepare(
      `SELECT c.id AS categoryId, c.name AS categoryName, SUM(t.amount) AS amount
       FROM transactions t
       JOIN categories c ON c.id = t.category_id
       WHERE t.type = 'expense' AND substr(t.date, 1, 7) = ?
       GROUP BY c.id, c.name
       ORDER BY amount DESC`,
    )
    .all(month) as unknown as SpendingByCategoryEntry[];
  return rows;
}

export interface IncomeVsExpenseEntry {
  period: string;
  income: number;
  expense: number;
}

export function incomeVsExpense(from: string, to: string): IncomeVsExpenseEntry[] {
  const rows = db
    .prepare(
      `SELECT substr(date, 1, 7) AS period,
         SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS income,
         SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS expense
       FROM transactions
       WHERE date >= ? AND date <= ? AND type IN ('income', 'expense')
       GROUP BY period
       ORDER BY period`,
    )
    .all(from, to) as unknown as IncomeVsExpenseEntry[];
  return rows;
}

export interface BalancesOverviewEntry {
  accountId: number;
  accountName: string;
  type: string;
  balance: number;
  utilizationPct: number | null;
}

export function balancesOverview(): BalancesOverviewEntry[] {
  return listAccounts().map((a) => ({
    accountId: a.id,
    accountName: a.name,
    type: a.type,
    balance: a.balance,
    utilizationPct: a.utilizationPct,
  }));
}
