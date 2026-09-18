import { db } from "../../db/connection";
import { BadRequestError } from "../../shared/errors";
import { getAccount } from "../accounts/accounts.service";
import { creditEducationTips } from "./education-tips";
import { computeCreditHealth, type CreditHealthResult } from "./scoring";

export interface CreditHealthResponse extends CreditHealthResult {
  educationTips: typeof creditEducationTips;
}

export function getCreditHealth(): CreditHealthResponse {
  return {
    ...computeCreditHealth(),
    educationTips: creditEducationTips,
  };
}

export interface CardPaymentDto {
  id: number;
  accountId: number;
  statementMonth: string;
  paidOnTime: boolean;
  loggedAt: string;
}

interface CardPaymentRow {
  id: number;
  account_id: number;
  statement_month: string;
  paid_on_time: number;
  logged_at: string;
}

function toDto(row: CardPaymentRow): CardPaymentDto {
  return {
    id: row.id,
    accountId: row.account_id,
    statementMonth: row.statement_month,
    paidOnTime: row.paid_on_time === 1,
    loggedAt: row.logged_at,
  };
}

export function listCardPayments(accountId?: number): CardPaymentDto[] {
  const rows = accountId
    ? (db
        .prepare(`SELECT * FROM credit_card_payments WHERE account_id = ? ORDER BY statement_month DESC`)
        .all(accountId) as unknown as CardPaymentRow[])
    : (db.prepare(`SELECT * FROM credit_card_payments ORDER BY statement_month DESC`).all() as unknown as CardPaymentRow[]);
  return rows.map(toDto);
}

export interface LogPaymentInput {
  accountId: number;
  statementMonth: string;
  paidOnTime: boolean;
}

export function logCardPayment(input: LogPaymentInput): CardPaymentDto {
  const account = getAccount(input.accountId);
  if (account.type !== "credit_card") {
    throw new BadRequestError("Payments can only be logged for credit_card accounts");
  }
  db.prepare(
    `INSERT INTO credit_card_payments (account_id, statement_month, paid_on_time)
     VALUES (?, ?, ?)
     ON CONFLICT(account_id, statement_month) DO UPDATE SET paid_on_time = excluded.paid_on_time, logged_at = datetime('now')`,
  ).run(input.accountId, input.statementMonth, input.paidOnTime ? 1 : 0);
  const row = db
    .prepare(`SELECT * FROM credit_card_payments WHERE account_id = ? AND statement_month = ?`)
    .get(input.accountId, input.statementMonth) as unknown as CardPaymentRow;
  return toDto(row);
}
