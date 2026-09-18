import { apiClient } from "./client";
import type { BalancesOverviewEntry, IncomeVsExpenseEntry, SpendingByCategoryEntry } from "../types";

export async function fetchSpendingByCategory(month?: string): Promise<SpendingByCategoryEntry[]> {
  const { data } = await apiClient.get<SpendingByCategoryEntry[]>("/reports/spending-by-category", {
    params: month ? { month } : {},
  });
  return data;
}

export async function fetchIncomeVsExpense(from?: string, to?: string): Promise<IncomeVsExpenseEntry[]> {
  const { data } = await apiClient.get<IncomeVsExpenseEntry[]>("/reports/income-vs-expense", {
    params: { from, to },
  });
  return data;
}

export async function fetchBalancesOverview(): Promise<BalancesOverviewEntry[]> {
  const { data } = await apiClient.get<BalancesOverviewEntry[]>("/reports/balances-overview");
  return data;
}
