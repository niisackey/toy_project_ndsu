import { db } from "../../db/connection";
import { ConflictError, NotFoundError } from "../../shared/errors";
import { nextOccurrenceFromAnchor } from "../../shared/dates";
import type { AccountDto, AccountRow, AccountType } from "./accounts.types";

const NET_MOVEMENT_SQL = `
  COALESCE((SELECT SUM(amount) FROM transactions WHERE account_id = a.id AND type = 'income'), 0)
  - COALESCE((SELECT SUM(amount) FROM transactions WHERE account_id = a.id AND type = 'expense'), 0)
  - COALESCE((SELECT SUM(amount) FROM transactions WHERE account_id = a.id AND type = 'transfer'), 0)
  + COALESCE((SELECT SUM(amount) FROM transactions WHERE transfer_to_account_id = a.id AND type = 'transfer'), 0)
`;

interface AccountWithMovementRow extends AccountRow {
  net_movement: number;
}

function toDto(row: AccountWithMovementRow): AccountDto {
  const balance =
    row.type === "credit_card"
      ? row.initial_balance - row.net_movement
      : row.initial_balance + row.net_movement;
  const utilizationPct =
    row.type === "credit_card" && row.credit_limit
      ? Math.round((balance / row.credit_limit) * 1000) / 10
      : null;
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    initialBalance: row.initial_balance,
    creditLimit: row.credit_limit,
    balance: Math.round(balance * 100) / 100,
    utilizationPct,
    nextStatementClosingDate: row.next_statement_closing_date
      ? nextOccurrenceFromAnchor(row.next_statement_closing_date)
      : null,
    nextPaymentDueDate: row.next_payment_due_date
      ? nextOccurrenceFromAnchor(row.next_payment_due_date)
      : null,
    createdAt: row.created_at,
  };
}

export function listAccounts(): AccountDto[] {
  const rows = db
    .prepare(`SELECT a.*, (${NET_MOVEMENT_SQL}) AS net_movement FROM accounts a ORDER BY a.id`)
    .all() as unknown as AccountWithMovementRow[];
  return rows.map(toDto);
}

export function getAccount(id: number): AccountDto {
  const row = db
    .prepare(`SELECT a.*, (${NET_MOVEMENT_SQL}) AS net_movement FROM accounts a WHERE a.id = ?`)
    .get(id) as unknown as AccountWithMovementRow | undefined;
  if (!row) throw new NotFoundError(`Account ${id} not found`);
  return toDto(row);
}

export interface CreateAccountInput {
  name: string;
  type: AccountType;
  initialBalance: number;
  creditLimit?: number | null;
  nextStatementClosingDate?: string | null;
  nextPaymentDueDate?: string | null;
}

export function createAccount(input: CreateAccountInput): AccountDto {
  const result = db
    .prepare(
      `INSERT INTO accounts (name, type, initial_balance, credit_limit, next_statement_closing_date, next_payment_due_date)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run(
      input.name,
      input.type,
      input.initialBalance,
      input.creditLimit ?? null,
      input.nextStatementClosingDate ?? null,
      input.nextPaymentDueDate ?? null,
    );
  return getAccount(Number(result.lastInsertRowid));
}

export function updateAccount(id: number, input: Partial<CreateAccountInput>): AccountDto {
  const existing = getAccount(id);
  const name = input.name ?? existing.name;
  const type = input.type ?? existing.type;
  const initialBalance = input.initialBalance ?? existing.initialBalance;
  const creditLimit = input.creditLimit !== undefined ? input.creditLimit : existing.creditLimit;
  const nextStatementClosingDate =
    input.nextStatementClosingDate !== undefined
      ? input.nextStatementClosingDate
      : existing.nextStatementClosingDate;
  const nextPaymentDueDate =
    input.nextPaymentDueDate !== undefined
      ? input.nextPaymentDueDate
      : existing.nextPaymentDueDate;
  db.prepare(
    `UPDATE accounts SET name = ?, type = ?, initial_balance = ?, credit_limit = ?, next_statement_closing_date = ?, next_payment_due_date = ?
     WHERE id = ?`,
  ).run(name, type, initialBalance, creditLimit, nextStatementClosingDate, nextPaymentDueDate, id);
  return getAccount(id);
}

export function deleteAccount(id: number): void {
  getAccount(id);
  const refCount = db
    .prepare(
      `SELECT COUNT(*) AS count FROM transactions WHERE account_id = ? OR transfer_to_account_id = ?`,
    )
    .get(id, id) as unknown as { count: number };
  if (refCount.count > 0) {
    throw new ConflictError(
      "Cannot delete an account that has transactions. Delete its transactions first.",
    );
  }
  db.prepare(`DELETE FROM accounts WHERE id = ?`).run(id);
}
