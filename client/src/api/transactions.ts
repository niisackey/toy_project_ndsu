import { apiClient } from "./client";
import type { Transaction, TransactionType } from "../types";

export interface TransactionInput {
  type: TransactionType;
  amount: number;
  date: string;
  description?: string | null;
  accountId: number;
  transferToAccountId?: number | null;
  categoryId?: number | null;
}

export interface TransactionFilters {
  accountId?: number;
  categoryId?: number;
  from?: string;
  to?: string;
  type?: TransactionType;
}

export async function fetchTransactions(filters: TransactionFilters = {}): Promise<Transaction[]> {
  const { data } = await apiClient.get<Transaction[]>("/transactions", { params: filters });
  return data;
}

export async function createTransaction(input: TransactionInput): Promise<Transaction> {
  const { data } = await apiClient.post<Transaction>("/transactions", input);
  return data;
}

export async function updateTransaction(
  id: number,
  input: Partial<TransactionInput>,
): Promise<Transaction> {
  const { data } = await apiClient.put<Transaction>(`/transactions/${id}`, input);
  return data;
}

export async function deleteTransaction(id: number): Promise<void> {
  await apiClient.delete(`/transactions/${id}`);
}
