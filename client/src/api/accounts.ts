import { apiClient } from "./client";
import type { Account, AccountType } from "../types";

export interface AccountInput {
  name: string;
  type: AccountType;
  initialBalance: number;
  creditLimit?: number | null;
  nextStatementClosingDate?: string | null;
  nextPaymentDueDate?: string | null;
}

export async function fetchAccounts(): Promise<Account[]> {
  const { data } = await apiClient.get<Account[]>("/accounts");
  return data;
}

export async function createAccount(input: AccountInput): Promise<Account> {
  const { data } = await apiClient.post<Account>("/accounts", input);
  return data;
}

export async function updateAccount(id: number, input: Partial<AccountInput>): Promise<Account> {
  const { data } = await apiClient.put<Account>(`/accounts/${id}`, input);
  return data;
}

export async function deleteAccount(id: number): Promise<void> {
  await apiClient.delete(`/accounts/${id}`);
}
