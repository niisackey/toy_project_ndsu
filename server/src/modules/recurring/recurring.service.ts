import { db } from "../../db/connection";
import { NotFoundError } from "../../shared/errors";

export type RecurringType = "income" | "expense";
export type RecurringFrequency =
  | "daily"
  | "weekly"
  | "biweekly"
  | "monthly"
  | "semesterly"
  | "yearly";

export interface RecurringRuleRow {
  id: number;
  name: string;
  type: RecurringType;
  amount: number;
  account_id: number;
  category_id: number | null;
  frequency: RecurringFrequency;
  interval_count: number;
  start_date: string;
  next_due_date: string;
  end_date: string | null;
  active: number;
}

export interface RecurringRuleDto {
  id: number;
  name: string;
  type: RecurringType;
  amount: number;
  accountId: number;
  categoryId: number | null;
  frequency: RecurringFrequency;
  intervalCount: number;
  startDate: string;
  nextDueDate: string;
  endDate: string | null;
  active: boolean;
}

function toDto(row: RecurringRuleRow): RecurringRuleDto {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    amount: row.amount,
    accountId: row.account_id,
    categoryId: row.category_id,
    frequency: row.frequency,
    intervalCount: row.interval_count,
    startDate: row.start_date,
    nextDueDate: row.next_due_date,
    endDate: row.end_date,
    active: row.active === 1,
  };
}

export function listRecurringRules(): RecurringRuleDto[] {
  const rows = db.prepare(`SELECT * FROM recurring_rules ORDER BY next_due_date`).all() as unknown as RecurringRuleRow[];
  return rows.map(toDto);
}

export function getRecurringRule(id: number): RecurringRuleDto {
  const row = db.prepare(`SELECT * FROM recurring_rules WHERE id = ?`).get(id) as unknown as
    | RecurringRuleRow
    | undefined;
  if (!row) throw new NotFoundError(`Recurring rule ${id} not found`);
  return toDto(row);
}

export interface CreateRecurringRuleInput {
  name: string;
  type: RecurringType;
  amount: number;
  accountId: number;
  categoryId?: number | null;
  frequency: RecurringFrequency;
  intervalCount?: number;
  startDate: string;
  endDate?: string | null;
  active?: boolean;
}

export function createRecurringRule(input: CreateRecurringRuleInput): RecurringRuleDto {
  const result = db
    .prepare(
      `INSERT INTO recurring_rules (name, type, amount, account_id, category_id, frequency, interval_count, start_date, next_due_date, end_date, active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      input.name,
      input.type,
      input.amount,
      input.accountId,
      input.categoryId ?? null,
      input.frequency,
      input.intervalCount ?? 1,
      input.startDate,
      input.startDate,
      input.endDate ?? null,
      input.active === false ? 0 : 1,
    );
  return getRecurringRule(Number(result.lastInsertRowid));
}

export function updateRecurringRule(
  id: number,
  input: Partial<CreateRecurringRuleInput> & { nextDueDate?: string },
): RecurringRuleDto {
  const existing = getRecurringRule(id);
  const merged = {
    name: input.name ?? existing.name,
    type: input.type ?? existing.type,
    amount: input.amount ?? existing.amount,
    accountId: input.accountId ?? existing.accountId,
    categoryId: input.categoryId !== undefined ? input.categoryId : existing.categoryId,
    frequency: input.frequency ?? existing.frequency,
    intervalCount: input.intervalCount ?? existing.intervalCount,
    startDate: input.startDate ?? existing.startDate,
    nextDueDate: input.nextDueDate ?? existing.nextDueDate,
    endDate: input.endDate !== undefined ? input.endDate : existing.endDate,
    active: input.active !== undefined ? input.active : existing.active,
  };
  db.prepare(
    `UPDATE recurring_rules SET name = ?, type = ?, amount = ?, account_id = ?, category_id = ?, frequency = ?, interval_count = ?, start_date = ?, next_due_date = ?, end_date = ?, active = ?
     WHERE id = ?`,
  ).run(
    merged.name,
    merged.type,
    merged.amount,
    merged.accountId,
    merged.categoryId,
    merged.frequency,
    merged.intervalCount,
    merged.startDate,
    merged.nextDueDate,
    merged.endDate,
    merged.active ? 1 : 0,
    id,
  );
  return getRecurringRule(id);
}

export function deleteRecurringRule(id: number): void {
  getRecurringRule(id);
  db.prepare(`DELETE FROM recurring_rules WHERE id = ?`).run(id);
}
