import { db } from "../../db/connection";
import { BadRequestError, NotFoundError } from "../../shared/errors";
import { getAccount } from "../accounts/accounts.service";
import { createTransaction, deleteTransaction } from "../transactions/transactions.service";

export type DebtDirection = "lent" | "borrowed";
export type DebtStatus = "open" | "paid";

export interface DebtRow {
  id: number;
  direction: DebtDirection;
  person_name: string;
  principal_amount: number;
  account_id: number;
  category_id: number | null;
  description: string | null;
  date: string;
  due_date: string | null;
  status: DebtStatus;
  settled_at: string | null;
  transaction_id: number | null;
  created_at: string;
}

export interface DebtPaymentDto {
  id: number;
  amount: number;
  date: string;
}

export interface DebtDto {
  id: number;
  direction: DebtDirection;
  personName: string;
  principalAmount: number;
  currency: string;
  accountId: number;
  accountName: string;
  description: string | null;
  date: string;
  dueDate: string | null;
  status: DebtStatus;
  settledAt: string | null;
  paidAmount: number;
  remainingAmount: number;
  payments: DebtPaymentDto[];
  createdAt: string;
}

const CATEGORY_NAME: Record<DebtDirection, string> = {
  lent: "Lending",
  borrowed: "Borrowed Funds",
};

function categoryIdFor(direction: DebtDirection): number {
  const row = db.prepare(`SELECT id FROM categories WHERE name = ?`).get(CATEGORY_NAME[direction]) as
    | { id: number }
    | undefined;
  if (!row) throw new Error(`${CATEGORY_NAME[direction]} category is missing - migration did not run`);
  return row.id;
}

function paymentsForDebt(debtId: number): DebtPaymentDto[] {
  return db
    .prepare(`SELECT id, amount, date FROM debt_payments WHERE debt_id = ? ORDER BY date, id`)
    .all(debtId) as unknown as DebtPaymentDto[];
}

function toDto(row: DebtRow): DebtDto {
  const account = getAccount(row.account_id);
  const payments = paymentsForDebt(row.id);
  const paidAmount = Math.round(payments.reduce((sum, p) => sum + p.amount, 0) * 100) / 100;
  const remainingAmount = Math.round((row.principal_amount - paidAmount) * 100) / 100;
  return {
    id: row.id,
    direction: row.direction,
    personName: row.person_name,
    principalAmount: row.principal_amount,
    currency: account.currency,
    accountId: row.account_id,
    accountName: account.name,
    description: row.description,
    date: row.date,
    dueDate: row.due_date,
    status: row.status,
    settledAt: row.settled_at,
    paidAmount,
    remainingAmount,
    payments,
    createdAt: row.created_at,
  };
}

function getDebtRow(id: number): DebtRow {
  const row = db.prepare(`SELECT * FROM debts WHERE id = ?`).get(id) as unknown as DebtRow | undefined;
  if (!row) throw new NotFoundError(`Debt ${id} not found`);
  return row;
}

export function listDebts(): DebtDto[] {
  const rows = db
    .prepare(`SELECT * FROM debts ORDER BY status, date DESC, id DESC`)
    .all() as unknown as DebtRow[];
  return rows.map(toDto);
}

export function getDebt(id: number): DebtDto {
  return toDto(getDebtRow(id));
}

export interface CreateDebtInput {
  direction: DebtDirection;
  personName: string;
  principalAmount: number;
  accountId: number;
  description?: string | null;
  date: string;
  dueDate?: string | null;
}

export function createDebt(input: CreateDebtInput): DebtDto {
  getAccount(input.accountId);
  const categoryId = categoryIdFor(input.direction);
  const label =
    input.direction === "lent" ? `Lent to ${input.personName}` : `Borrowed from ${input.personName}`;
  const transaction = createTransaction({
    type: input.direction === "lent" ? "expense" : "income",
    amount: input.principalAmount,
    date: input.date,
    description: input.description || label,
    accountId: input.accountId,
    categoryId,
  });
  const result = db
    .prepare(
      `INSERT INTO debts (direction, person_name, principal_amount, account_id, category_id, description, date, due_date, transaction_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      input.direction,
      input.personName,
      input.principalAmount,
      input.accountId,
      categoryId,
      input.description ?? null,
      input.date,
      input.dueDate ?? null,
      transaction.id,
    );
  return getDebt(Number(result.lastInsertRowid));
}

export interface LogDebtPaymentInput {
  amount: number;
  date: string;
}

export function logDebtPayment(debtId: number, input: LogDebtPaymentInput): DebtDto {
  const row = getDebtRow(debtId);
  if (row.status === "paid") throw new BadRequestError("This debt is already fully paid");

  const existing = toDto(row);
  if (input.amount > existing.remainingAmount + 0.01) {
    throw new BadRequestError(`Amount exceeds the remaining balance of ${existing.remainingAmount}`);
  }

  const label =
    row.direction === "lent" ? `Repayment from ${row.person_name}` : `Repayment to ${row.person_name}`;
  const transaction = createTransaction({
    type: row.direction === "lent" ? "income" : "expense",
    amount: input.amount,
    date: input.date,
    description: label,
    accountId: row.account_id,
    categoryId: row.category_id,
  });
  db.prepare(`INSERT INTO debt_payments (debt_id, amount, date, transaction_id) VALUES (?, ?, ?, ?)`).run(
    debtId,
    input.amount,
    input.date,
    transaction.id,
  );

  const paidSoFar = existing.paidAmount + input.amount;
  if (paidSoFar >= row.principal_amount - 0.01) {
    db.prepare(`UPDATE debts SET status = 'paid', settled_at = datetime('now') WHERE id = ?`).run(debtId);
  }
  return getDebt(debtId);
}

export function deleteDebt(id: number): void {
  const row = getDebtRow(id);
  const payments = db
    .prepare(`SELECT transaction_id FROM debt_payments WHERE debt_id = ?`)
    .all(id) as unknown as { transaction_id: number | null }[];
  db.prepare(`DELETE FROM debt_payments WHERE debt_id = ?`).run(id);
  db.prepare(`DELETE FROM debts WHERE id = ?`).run(id);
  for (const payment of payments) {
    if (payment.transaction_id) deleteTransaction(payment.transaction_id);
  }
  if (row.transaction_id) deleteTransaction(row.transaction_id);
}
