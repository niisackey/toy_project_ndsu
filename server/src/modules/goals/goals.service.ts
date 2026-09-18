import { subMonths, format, addMonths } from "date-fns";
import { db } from "../../db/connection";
import { BadRequestError, NotFoundError } from "../../shared/errors";
import { getAccount } from "../accounts/accounts.service";

export interface GoalRow {
  id: number;
  name: string;
  target_amount: number;
  target_date: string | null;
  linked_account_id: number;
  created_at: string;
}

export interface GoalDto {
  id: number;
  name: string;
  targetAmount: number;
  targetDate: string | null;
  linkedAccountId: number;
  linkedAccountName: string;
  currentAmount: number;
  progressPct: number;
  monthlyRate: number;
  projectedCompletionDate: string | null;
  createdAt: string;
}

function monthlyNetInflow(accountId: number): number {
  const threeMonthsAgo = format(subMonths(new Date(), 3), "yyyy-MM-dd");
  const row = db
    .prepare(
      `SELECT
         COALESCE(SUM(CASE WHEN type = 'income' THEN amount
                            WHEN type = 'transfer' AND transfer_to_account_id = ? THEN amount
                            ELSE 0 END), 0) AS inflow,
         COALESCE(SUM(CASE WHEN type = 'expense' THEN amount
                            WHEN type = 'transfer' AND account_id = ? THEN amount
                            ELSE 0 END), 0) AS outflow
       FROM transactions
       WHERE (account_id = ? OR transfer_to_account_id = ?) AND date >= ?`,
    )
    .get(accountId, accountId, accountId, accountId, threeMonthsAgo) as unknown as {
    inflow: number;
    outflow: number;
  };
  return (row.inflow - row.outflow) / 3;
}

function overallMonthlySavingsRate(): number {
  const threeMonthsAgo = format(subMonths(new Date(), 3), "yyyy-MM-dd");
  const row = db
    .prepare(
      `SELECT
         COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS income,
         COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS expense
       FROM transactions
       WHERE date >= ?`,
    )
    .get(threeMonthsAgo) as unknown as { income: number; expense: number };
  return (row.income - row.expense) / 3;
}

function toDto(row: GoalRow): GoalDto {
  const account = getAccount(row.linked_account_id);
  const currentAmount = account.balance;
  const progressPct =
    row.target_amount > 0 ? Math.min(100, Math.round((currentAmount / row.target_amount) * 1000) / 10) : 0;

  let monthlyRate = monthlyNetInflow(row.linked_account_id);
  if (monthlyRate <= 0) {
    monthlyRate = overallMonthlySavingsRate();
  }

  let projectedCompletionDate: string | null = null;
  const remaining = row.target_amount - currentAmount;
  if (remaining <= 0) {
    projectedCompletionDate = format(new Date(), "yyyy-MM-dd");
  } else if (monthlyRate > 0) {
    const monthsRemaining = Math.ceil(remaining / monthlyRate);
    projectedCompletionDate = format(addMonths(new Date(), monthsRemaining), "yyyy-MM-dd");
  }

  return {
    id: row.id,
    name: row.name,
    targetAmount: row.target_amount,
    targetDate: row.target_date,
    linkedAccountId: row.linked_account_id,
    linkedAccountName: account.name,
    currentAmount,
    progressPct,
    monthlyRate: Math.round(monthlyRate * 100) / 100,
    projectedCompletionDate,
    createdAt: row.created_at,
  };
}

export function listGoals(): GoalDto[] {
  const rows = db.prepare(`SELECT * FROM goals ORDER BY id`).all() as unknown as GoalRow[];
  return rows.map(toDto);
}

export function getGoal(id: number): GoalDto {
  const row = db.prepare(`SELECT * FROM goals WHERE id = ?`).get(id) as unknown as GoalRow | undefined;
  if (!row) throw new NotFoundError(`Goal ${id} not found`);
  return toDto(row);
}

export interface CreateGoalInput {
  name: string;
  targetAmount: number;
  targetDate?: string | null;
  linkedAccountId: number;
}

function assertSavingsAccount(accountId: number): void {
  const account = getAccount(accountId);
  if (account.type === "credit_card") {
    throw new BadRequestError("Goals must be linked to a checking, cash, or savings account");
  }
}

export function createGoal(input: CreateGoalInput): GoalDto {
  assertSavingsAccount(input.linkedAccountId);
  const result = db
    .prepare(
      `INSERT INTO goals (name, target_amount, target_date, linked_account_id) VALUES (?, ?, ?, ?)`,
    )
    .run(input.name, input.targetAmount, input.targetDate ?? null, input.linkedAccountId);
  return getGoal(Number(result.lastInsertRowid));
}

export function updateGoal(id: number, input: Partial<CreateGoalInput>): GoalDto {
  const existing = getGoal(id);
  const name = input.name ?? existing.name;
  const targetAmount = input.targetAmount ?? existing.targetAmount;
  const targetDate = input.targetDate !== undefined ? input.targetDate : existing.targetDate;
  const linkedAccountId = input.linkedAccountId ?? existing.linkedAccountId;
  if (input.linkedAccountId !== undefined) assertSavingsAccount(linkedAccountId);
  db.prepare(
    `UPDATE goals SET name = ?, target_amount = ?, target_date = ?, linked_account_id = ? WHERE id = ?`,
  ).run(name, targetAmount, targetDate, linkedAccountId, id);
  return getGoal(id);
}

export function deleteGoal(id: number): void {
  getGoal(id);
  db.prepare(`DELETE FROM goals WHERE id = ?`).run(id);
}
