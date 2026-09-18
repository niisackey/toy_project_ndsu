import { apiClient } from "./client";
import type { CardPayment, CreditHealth } from "../types";

export async function fetchCreditHealth(): Promise<CreditHealth> {
  const { data } = await apiClient.get<CreditHealth>("/credit/health");
  return data;
}

export async function fetchCardPayments(accountId?: number): Promise<CardPayment[]> {
  const { data } = await apiClient.get<CardPayment[]>("/credit/payments", {
    params: accountId ? { accountId } : {},
  });
  return data;
}

export async function logCardPayment(input: {
  accountId: number;
  statementMonth: string;
  paidOnTime: boolean;
}): Promise<CardPayment> {
  const { data } = await apiClient.post<CardPayment>("/credit/payments", input);
  return data;
}
