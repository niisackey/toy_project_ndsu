import { db } from "../../db/connection";
import { NotFoundError } from "../../shared/errors";

export interface BudgetDto {
  id: number;
  categoryId: number;
  categoryName: string;
  month: string;
  limitAmount: number;
  spent: number;
}

interface BudgetRow {
  id: number;
  category_id: number;
  category_name: string;
  month: string;
  limit_amount: number;
  spent: number;
}

function toDto(row: BudgetRow): BudgetDto {
  return {
    id: row.id,
    categoryId: row.category_id,
    categoryName: row.category_name,
    month: row.month,
    limitAmount: row.limit_amount,
    spent: row.spent,
  };
}

const SELECT_WITH_SPENT = `
  SELECT b.id, b.category_id, c.name AS category_name, b.month, b.limit_amount,
    COALESCE((
      SELECT SUM(t.amount) FROM transactions t
      WHERE t.category_id = b.category_id AND t.type = 'expense' AND substr(t.date, 1, 7) = b.month
    ), 0) AS spent
  FROM budgets b
  JOIN categories c ON c.id = b.category_id
`;

export function listBudgets(month?: string): BudgetDto[] {
  const rows = month
    ? (db.prepare(`${SELECT_WITH_SPENT} WHERE b.month = ? ORDER BY c.name`).all(month) as unknown as BudgetRow[])
    : (db.prepare(`${SELECT_WITH_SPENT} ORDER BY b.month DESC, c.name`).all() as unknown as BudgetRow[]);
  return rows.map(toDto);
}

export function getBudget(id: number): BudgetDto {
  const row = db.prepare(`${SELECT_WITH_SPENT} WHERE b.id = ?`).get(id) as unknown as BudgetRow | undefined;
  if (!row) throw new NotFoundError(`Budget ${id} not found`);
  return toDto(row);
}

export interface CreateBudgetInput {
  categoryId: number;
  month: string;
  limitAmount: number;
}

export function createBudget(input: CreateBudgetInput): BudgetDto {
  const result = db
    .prepare(`INSERT INTO budgets (category_id, month, limit_amount) VALUES (?, ?, ?)`)
    .run(input.categoryId, input.month, input.limitAmount);
  return getBudget(Number(result.lastInsertRowid));
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
