import { apiClient } from "./client";
import type { RecurringFrequency, RecurringRule } from "../types";

export interface RecurringInput {
  name: string;
  type: "income" | "expense";
  amount: number;
  accountId: number;
  categoryId?: number | null;
  frequency: RecurringFrequency;
  intervalCount?: number;
  startDate: string;
  endDate?: string | null;
  active?: boolean;
}

export async function fetchRecurringRules(): Promise<RecurringRule[]> {
  const { data } = await apiClient.get<RecurringRule[]>("/recurring");
  return data;
}

export async function createRecurringRule(input: RecurringInput): Promise<RecurringRule> {
  const { data } = await apiClient.post<RecurringRule>("/recurring", input);
  return data;
}

export async function updateRecurringRule(
  id: number,
  input: Partial<RecurringInput>,
): Promise<RecurringRule> {
  const { data } = await apiClient.put<RecurringRule>(`/recurring/${id}`, input);
  return data;
}

export async function deleteRecurringRule(id: number): Promise<void> {
  await apiClient.delete(`/recurring/${id}`);
}

export async function runDueRecurringRules(): Promise<{ generatedCount: number }> {
  const { data } = await apiClient.post<{ generatedCount: number }>("/recurring/run-due");
  return data;
}
