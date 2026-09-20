export type AccountType = "checking" | "cash" | "savings" | "credit_card";

export interface Account {
  id: number;
  name: string;
  type: AccountType;
  initialBalance: number;
  currency: string;
  creditLimit: number | null;
  balance: number;
  utilizationPct: number | null;
  nextStatementClosingDate: string | null;
  nextPaymentDueDate: string | null;
  createdAt: string;
}

export type TransactionType = "income" | "expense" | "transfer";

export interface Transaction {
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

export interface Category {
  id: number;
  name: string;
  icon: string | null;
}

export interface Budget {
  id: number;
  categoryId: number;
  categoryName: string;
  month: string;
  limitAmount: number;
  spent: number;
}

export type RecurringFrequency =
  | "daily"
  | "weekly"
  | "biweekly"
  | "monthly"
  | "semesterly"
  | "yearly";

export interface RecurringRule {
  id: number;
  name: string;
  type: "income" | "expense";
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

export interface Goal {
  id: number;
  name: string;
  targetAmount: number;
  currency: string;
  targetDate: string | null;
  linkedAccountId: number;
  linkedAccountName: string;
  currentAmount: number;
  progressPct: number;
  monthlyRate: number;
  projectedCompletionDate: string | null;
  createdAt: string;
}

export interface CreditFactor {
  key: string;
  label: string;
  weightPct: number;
  scoreOutOf100: number;
  explanation: string;
}

export interface CardUtilization {
  accountId: number;
  accountName: string;
  currency: string;
  balance: number;
  creditLimit: number;
  utilizationPct: number;
  advice: string;
}

export interface CreditTip {
  id: string;
  title: string;
  detail: string;
}

export interface CreditHealth {
  simulatedScore: number;
  scoreRangeLabel: string;
  factors: CreditFactor[];
  cardUtilization: CardUtilization[];
  hasCreditCards: boolean;
  disclaimer: string;
  educationTips: CreditTip[];
}

export interface CardPayment {
  id: number;
  accountId: number;
  statementMonth: string;
  paidOnTime: boolean;
  loggedAt: string;
}

export type InsightType = "tip" | "warning" | "positive";

export interface Insight {
  type: InsightType;
  category: string;
  message: string;
}

export type InsightsSource = "ai" | "rules";

export interface InsightsResponse {
  source: InsightsSource;
  insights: Insight[];
}

export interface SpendingByCategoryEntry {
  categoryId: number;
  categoryName: string;
  amount: number;
}

export interface IncomeVsExpenseEntry {
  period: string;
  income: number;
  expense: number;
}

export interface BalancesOverviewEntry {
  accountId: number;
  accountName: string;
  type: string;
  currency: string;
  balance: number;
  balanceInBaseCurrency: number;
  utilizationPct: number | null;
}

export interface RatesSummary {
  baseCurrency: string;
  lastFetchedAt: string | null;
  rates: { currency: string; rateToUsd: number; live: boolean }[];
}

export type DebtDirection = "lent" | "borrowed";
export type DebtStatus = "open" | "paid";

export interface DebtPayment {
  id: number;
  amount: number;
  date: string;
}

export interface Debt {
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
  payments: DebtPayment[];
  createdAt: string;
}
