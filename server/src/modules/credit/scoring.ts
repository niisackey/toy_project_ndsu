import { differenceInMonths } from "date-fns";
import { db } from "../../db/connection";
import { listAccounts } from "../accounts/accounts.service";
import type { AccountDto } from "../accounts/accounts.types";

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
  balance: number;
  creditLimit: number;
  utilizationPct: number;
  advice: string;
}

export interface CreditHealthResult {
  simulatedScore: number;
  scoreRangeLabel: string;
  factors: CreditFactor[];
  cardUtilization: CardUtilization[];
  hasCreditCards: boolean;
  disclaimer: string;
}

function utilizationAdvice(pct: number): string {
  if (pct <= 10) return "Excellent - well under the recommended 30% threshold.";
  if (pct <= 30) return "Good - within the commonly recommended range, but lower is better.";
  if (pct <= 50) return "Elevated - try to pay this down below 30%.";
  return "High - this is likely hurting your score. Prioritize paying this down.";
}

function utilizationFactorScore(avgUtilizationPct: number): number {
  if (avgUtilizationPct <= 10) return 100;
  if (avgUtilizationPct <= 30) return 85;
  if (avgUtilizationPct <= 50) return 60;
  if (avgUtilizationPct <= 75) return 35;
  return 15;
}

function ageFactorScore(avgAgeMonths: number): number {
  if (avgAgeMonths >= 24) return 100;
  if (avgAgeMonths >= 12) return 80;
  if (avgAgeMonths >= 6) return 60;
  if (avgAgeMonths >= 1) return 40;
  return 25;
}

function scoreLabel(score: number): string {
  if (score >= 740) return "Very Good";
  if (score >= 670) return "Good";
  if (score >= 580) return "Fair";
  return "Needs Attention";
}

export function computeCreditHealth(): CreditHealthResult {
  const accounts = listAccounts();
  const cards = accounts.filter((a: AccountDto) => a.type === "credit_card" && a.creditLimit);

  const cardUtilization: CardUtilization[] = cards.map((c) => ({
    accountId: c.id,
    accountName: c.name,
    balance: c.balance,
    creditLimit: c.creditLimit as number,
    utilizationPct: c.utilizationPct ?? 0,
    advice: utilizationAdvice(c.utilizationPct ?? 0),
  }));

  const hasCreditCards = cards.length > 0;

  // Payment history factor
  const paymentRows = db
    .prepare(
      `SELECT paid_on_time FROM credit_card_payments WHERE account_id IN (${cards.map(() => "?").join(",") || "NULL"})`,
    )
    .all(...cards.map((c) => c.id)) as unknown as { paid_on_time: number }[];
  const onTimePct =
    paymentRows.length > 0
      ? (paymentRows.filter((p) => p.paid_on_time === 1).length / paymentRows.length) * 100
      : 70;
  const paymentHistoryScore = paymentRows.length > 0 ? onTimePct : 70;

  // Utilization factor
  const avgUtilization =
    cardUtilization.length > 0
      ? cardUtilization.reduce((sum, c) => sum + c.utilizationPct, 0) / cardUtilization.length
      : 0;
  const utilizationScore = hasCreditCards ? utilizationFactorScore(avgUtilization) : 70;

  // Credit age factor
  const now = new Date();
  const cardAges = cards.map((c) => differenceInMonths(now, new Date(c.createdAt)));
  const avgAgeMonths = cardAges.length > 0 ? cardAges.reduce((s, a) => s + a, 0) / cardAges.length : 0;
  const ageScore = hasCreditCards ? ageFactorScore(avgAgeMonths) : 40;

  // Credit mix factor
  const hasNonCreditAccount = accounts.some((a) => a.type !== "credit_card");
  let mixScore = 50;
  if (hasCreditCards) mixScore += 10;
  if (cards.length >= 2) mixScore += 20;
  if (hasNonCreditAccount) mixScore += 20;
  mixScore = Math.min(100, mixScore);

  const factors: CreditFactor[] = [
    {
      key: "payment_history",
      label: "Payment History",
      weightPct: 35,
      scoreOutOf100: Math.round(paymentHistoryScore),
      explanation:
        paymentRows.length > 0
          ? `${Math.round(onTimePct)}% of your logged statements were paid on time.`
          : "No payments logged yet - log your statements on the Credit Health page for an accurate picture.",
    },
    {
      key: "utilization",
      label: "Credit Utilization",
      weightPct: 30,
      scoreOutOf100: Math.round(utilizationScore),
      explanation: hasCreditCards
        ? `Average utilization across your cards is ${Math.round(avgUtilization)}%.`
        : "No credit cards on file yet.",
    },
    {
      key: "credit_age",
      label: "Credit Age",
      weightPct: 15,
      scoreOutOf100: Math.round(ageScore),
      explanation: hasCreditCards
        ? `Your average card age is about ${Math.round(avgAgeMonths)} month(s).`
        : "No credit cards on file yet.",
    },
    {
      key: "credit_mix",
      label: "Credit Mix",
      weightPct: 20,
      scoreOutOf100: Math.round(mixScore),
      explanation: "Based on the variety of account types and number of active cards.",
    },
  ];

  const weightedScore0to100 = factors.reduce(
    (sum, f) => sum + (f.scoreOutOf100 * f.weightPct) / 100,
    0,
  );
  const simulatedScore = Math.round(300 + (weightedScore0to100 / 100) * 550);

  return {
    simulatedScore,
    scoreRangeLabel: scoreLabel(simulatedScore),
    factors,
    cardUtilization,
    hasCreditCards,
    disclaimer:
      "This is a simulated, educational estimate computed from your own logged data - not a real FICO or VantageScore, and it is not connected to any credit bureau.",
  };
}
