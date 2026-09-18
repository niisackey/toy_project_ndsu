export type AccountType = "checking" | "cash" | "savings" | "credit_card";

export interface AccountRow {
  id: number;
  name: string;
  type: AccountType;
  initial_balance: number;
  credit_limit: number | null;
  next_statement_closing_date: string | null;
  next_payment_due_date: string | null;
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
  nextStatementClosingDate: string | null;
  nextPaymentDueDate: string | null;
  createdAt: string;
}
