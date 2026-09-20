export type TransactionType = "income" | "expense" | "transfer";

export interface TransactionRow {
  id: number;
  type: TransactionType;
  amount: number;
  date: string;
  description: string | null;
  account_id: number;
  transfer_to_account_id: number | null;
  transfer_amount_converted: number | null;
  category_id: number | null;
  recurring_rule_id: number | null;
  created_at: string;
}

export interface TransactionDto {
  id: number;
  type: TransactionType;
  amount: number;
  date: string;
  description: string | null;
  accountId: number;
  transferToAccountId: number | null;
  transferAmountConverted: number | null;
  categoryId: number | null;
  recurringRuleId: number | null;
  createdAt: string;
}
