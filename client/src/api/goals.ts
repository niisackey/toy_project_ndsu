import { apiClient } from "./client";
import type { Goal } from "../types";

export interface GoalInput {
  name: string;
  targetAmount: number;
  targetDate?: string | null;
  linkedAccountId: number;
}

export async function fetchGoals(): Promise<Goal[]> {
  const { data } = await apiClient.get<Goal[]>("/goals");
  return data;
}

export async function createGoal(input: GoalInput): Promise<Goal> {
  const { data } = await apiClient.post<Goal>("/goals", input);
  return data;
}

export async function updateGoal(id: number, input: Partial<GoalInput>): Promise<Goal> {
  const { data } = await apiClient.put<Goal>(`/goals/${id}`, input);
  return data;
}

export async function deleteGoal(id: number): Promise<void> {
  await apiClient.delete(`/goals/${id}`);
}
