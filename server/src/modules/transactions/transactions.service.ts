import { db } from "../../db/connection";
import { BadRequestError, NotFoundError } from "../../shared/errors";
import type { TransactionDto, TransactionRow, TransactionType } from "./transactions.types";

function toDto(row: TransactionRow): TransactionDto {
  return {
    id: row.id,
    type: row.type,
    amount: row.amount,
    date: row.date,
    description: row.description,
    accountId: row.account_id,
    transferToAccountId: row.transfer_to_account_id,
    categoryId: row.category_id,
    recurringRuleId: row.recurring_rule_id,
    createdAt: row.created_at,
  };
}

export interface TransactionFilters {
  accountId?: number;
  categoryId?: number;
  from?: string;
  to?: string;
  type?: TransactionType;
}

export function listTransactions(filters: TransactionFilters): TransactionDto[] {
  const clauses: string[] = [];
  const params: (string | number)[] = [];

  if (filters.accountId !== undefined) {
    clauses.push("(account_id = ? OR transfer_to_account_id = ?)");
    params.push(filters.accountId, filters.accountId);
  }
  if (filters.categoryId !== undefined) {
    clauses.push("category_id = ?");
    params.push(filters.categoryId);
  }
  if (filters.from) {
    clauses.push("date >= ?");
    params.push(filters.from);
  }
  if (filters.to) {
    clauses.push("date <= ?");
    params.push(filters.to);
  }
  if (filters.type) {
    clauses.push("type = ?");
    params.push(filters.type);
  }

  const where = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";
  const rows = db
    .prepare(`SELECT * FROM transactions ${where} ORDER BY date DESC, id DESC`)
    .all(...params) as unknown as TransactionRow[];
  return rows.map(toDto);
}

export function getTransaction(id: number): TransactionDto {
  const row = db.prepare(`SELECT * FROM transactions WHERE id = ?`).get(id) as unknown as
    | TransactionRow
    | undefined;
  if (!row) throw new NotFoundError(`Transaction ${id} not found`);
  return toDto(row);
}

export interface CreateTransactionInput {
  type: TransactionType;
  amount: number;
  date: string;
  description?: string | null;
  accountId: number;
  transferToAccountId?: number | null;
  categoryId?: number | null;
  recurringRuleId?: number | null;
}

function assertAccountExists(id: number): void {
  const row = db.prepare(`SELECT id FROM accounts WHERE id = ?`).get(id);
  if (!row) throw new BadRequestError(`Account ${id} does not exist`);
}

function validateInput(input: CreateTransactionInput): void {
  assertAccountExists(input.accountId);
  if (input.type === "transfer") {
    if (!input.transferToAccountId) {
      throw new BadRequestError("transferToAccountId is required for transfer transactions");
    }
    if (input.transferToAccountId === input.accountId) {
      throw new BadRequestError("Cannot transfer to the same account");
    }
    assertAccountExists(input.transferToAccountId);
  }
}

export function createTransaction(input: CreateTransactionInput): TransactionDto {
  validateInput(input);
  const result = db
    .prepare(
      `INSERT INTO transactions (type, amount, date, description, account_id, transfer_to_account_id, category_id, recurring_rule_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      input.type,
      input.amount,
      input.date,
      input.description ?? null,
      input.accountId,
      input.type === "transfer" ? (input.transferToAccountId ?? null) : null,
      input.categoryId ?? null,
      input.recurringRuleId ?? null,
    );
  return getTransaction(Number(result.lastInsertRowid));
}

export function updateTransaction(
  id: number,
  input: Partial<CreateTransactionInput>,
): TransactionDto {
  const existing = getTransaction(id);
  const merged: CreateTransactionInput = {
    type: input.type ?? existing.type,
    amount: input.amount ?? existing.amount,
    date: input.date ?? existing.date,
    description: input.description !== undefined ? input.description : existing.description,
    accountId: input.accountId ?? existing.accountId,
    transferToAccountId:
      input.transferToAccountId !== undefined
        ? input.transferToAccountId
        : existing.transferToAccountId,
    categoryId: input.categoryId !== undefined ? input.categoryId : existing.categoryId,
    recurringRuleId:
      input.recurringRuleId !== undefined ? input.recurringRuleId : existing.recurringRuleId,
  };
  validateInput(merged);
  db.prepare(
    `UPDATE transactions SET type = ?, amount = ?, date = ?, description = ?, account_id = ?, transfer_to_account_id = ?, category_id = ?, recurring_rule_id = ?
     WHERE id = ?`,
  ).run(
    merged.type,
    merged.amount,
    merged.date,
    merged.description ?? null,
    merged.accountId,
    merged.type === "transfer" ? (merged.transferToAccountId ?? null) : null,
    merged.categoryId ?? null,
    merged.recurringRuleId ?? null,
    id,
  );
  return getTransaction(id);
}

export function deleteTransaction(id: number): void {
  getTransaction(id);
  db.prepare(`DELETE FROM transactions WHERE id = ?`).run(id);
}
