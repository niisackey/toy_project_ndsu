import { apiClient } from "./client";
import type { Debt, DebtDirection } from "../types";

export interface DebtInput {
  direction: DebtDirection;
  personName: string;
  principalAmount: number;
  accountId: number;
  description?: string | null;
  date: string;
  dueDate?: string | null;
}

export interface DebtPaymentInput {
  amount: number;
  date: string;
}

export async function fetchDebts(): Promise<Debt[]> {
  const { data } = await apiClient.get<Debt[]>("/debts");
  return data;
}

export async function createDebt(input: DebtInput): Promise<Debt> {
  const { data } = await apiClient.post<Debt>("/debts", input);
  return data;
}

export async function logDebtPayment(id: number, input: DebtPaymentInput): Promise<Debt> {
  const { data } = await apiClient.post<Debt>(`/debts/${id}/payments`, input);
  return data;
}

export async function deleteDebt(id: number): Promise<void> {
  await apiClient.delete(`/debts/${id}`);
}
