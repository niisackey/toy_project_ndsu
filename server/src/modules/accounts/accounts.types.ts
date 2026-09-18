export type AccountType = "checking" | "cash" | "savings" | "credit_card";

export interface AccountRow {
  id: number;
  name: string;
  type: AccountType;
  initial_balance: number;
  credit_limit: number | null;
  statement_closing_day: number | null;
  payment_due_day: number | null;
  created_at: string;
}

export interface AccountDto {
  id: number;
  name: string;
  type: AccountType;
  initialBalance: number;
  creditLimit: number | null;
  balance: number;
  utilizationPct: number | null;
  statementClosingDay: number | null;
  paymentDueDay: number | null;
  nextStatementClosingDate: string | null;
  nextPaymentDueDate: string | null;
  createdAt: string;
}
