import { apiClient } from "./client";
import type { Budget } from "../types";

export interface BudgetInput {
  categoryId: number;
  month: string;
  limitAmount: number;
  months?: number;
}

export async function fetchBudgets(month?: string): Promise<Budget[]> {
  const { data } = await apiClient.get<Budget[]>("/budgets", { params: month ? { month } : {} });
  return data;
}

export async function createBudget(input: BudgetInput): Promise<Budget | Budget[]> {
  const { data } = await apiClient.post<Budget | Budget[]>("/budgets", input);
  return data;
}

export async function deleteBudget(id: number): Promise<void> {
  await apiClient.delete(`/budgets/${id}`);
}
