import { addMonths, format, parseISO } from "date-fns";
import { db } from "../../db/connection";
import { NotFoundError } from "../../shared/errors";
import { convert, getBaseCurrency } from "../currency/currency.service";

export interface BudgetDto {
  id: number;
  categoryId: number;
  categoryName: string;
  month: string;
  limitAmount: number;
  spent: number;
}

interface BudgetWithTxRow {
  budget_id: number;
  category_id: number;
  category_name: string;
  month: string;
  limit_amount: number;
  tx_amount: number | null;
  tx_currency: string | null;
}

const SELECT_WITH_TX = `
  SELECT b.id AS budget_id, b.category_id, c.name AS category_name, b.month, b.limit_amount,
    t.amount AS tx_amount, a.currency AS tx_currency
  FROM budgets b
  JOIN categories c ON c.id = b.category_id
  LEFT JOIN transactions t ON t.category_id = b.category_id AND t.type = 'expense' AND substr(t.date, 1, 7) = b.month
  LEFT JOIN accounts a ON a.id = t.account_id
`;

function rowsToBudgets(rows: BudgetWithTxRow[]): BudgetDto[] {
  const baseCurrency = getBaseCurrency();
  const byId = new Map<number, BudgetDto>();
  for (const row of rows) {
    let budget = byId.get(row.budget_id);
    if (!budget) {
      budget = {
        id: row.budget_id,
        categoryId: row.category_id,
        categoryName: row.category_name,
        month: row.month,
        limitAmount: row.limit_amount,
        spent: 0,
      };
      byId.set(row.budget_id, budget);
    }
    if (row.tx_amount !== null && row.tx_currency !== null) {
      budget.spent += convert(row.tx_amount, row.tx_currency, baseCurrency);
    }
  }
  return Array.from(byId.values());
}

export function listBudgets(month?: string): BudgetDto[] {
  const rows = month
    ? (db.prepare(`${SELECT_WITH_TX} WHERE b.month = ?`).all(month) as unknown as BudgetWithTxRow[])
    : (db.prepare(SELECT_WITH_TX).all() as unknown as BudgetWithTxRow[]);
  return rowsToBudgets(rows).sort(
    (a, b) => b.month.localeCompare(a.month) || a.categoryName.localeCompare(b.categoryName),
  );
}

export function getBudget(id: number): BudgetDto {
  const rows = db.prepare(`${SELECT_WITH_TX} WHERE b.id = ?`).all(id) as unknown as BudgetWithTxRow[];
  if (rows.length === 0) throw new NotFoundError(`Budget ${id} not found`);
  return rowsToBudgets(rows)[0];
}

export interface CreateBudgetInput {
  categoryId: number;
  month: string;
  limitAmount: number;
}

export function createBudget(input: CreateBudgetInput): BudgetDto {
  db.prepare(
    `INSERT INTO budgets (category_id, month, limit_amount) VALUES (?, ?, ?)
     ON CONFLICT(category_id, month) DO UPDATE SET limit_amount = excluded.limit_amount`,
  ).run(input.categoryId, input.month, input.limitAmount);
  const rows = db
    .prepare(`${SELECT_WITH_TX} WHERE b.category_id = ? AND b.month = ?`)
    .all(input.categoryId, input.month) as unknown as BudgetWithTxRow[];
  return rowsToBudgets(rows)[0];
}

export function createBudgetSeries(input: CreateBudgetInput, months: number): BudgetDto[] {
  const created: BudgetDto[] = [];
  for (let i = 0; i < months; i++) {
    const month = format(addMonths(parseISO(`${input.month}-01`), i), "yyyy-MM");
    created.push(createBudget({ ...input, month }));
  }
  return created;
}

export function updateBudget(id: number, input: Partial<CreateBudgetInput>): BudgetDto {
  const existing = getBudget(id);
  const categoryId = input.categoryId ?? existing.categoryId;
  const month = input.month ?? existing.month;
  const limitAmount = input.limitAmount ?? existing.limitAmount;
  db.prepare(`UPDATE budgets SET category_id = ?, month = ?, limit_amount = ? WHERE id = ?`).run(
    categoryId,
    month,
    limitAmount,
    id,
  );
  return getBudget(id);
}

export function deleteBudget(id: number): void {
  getBudget(id);
  db.prepare(`DELETE FROM budgets WHERE id = ?`).run(id);
}
