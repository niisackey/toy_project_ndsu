import { apiClient } from "./client";
import type { RatesSummary } from "../types";
import type { CurrencyInfo } from "../lib/currency";

export async function fetchCurrencyList(): Promise<CurrencyInfo[]> {
  const { data } = await apiClient.get<CurrencyInfo[]>("/currency/list");
  return data;
}

export async function fetchRates(): Promise<RatesSummary> {
  const { data } = await apiClient.get<RatesSummary>("/currency/rates");
  return data;
}

export async function setBaseCurrency(currency: string): Promise<RatesSummary> {
  const { data } = await apiClient.put<RatesSummary>("/currency/base", { currency });
  return data;
}

export async function refreshRates(): Promise<RatesSummary> {
  const { data } = await apiClient.post<RatesSummary>("/currency/refresh");
  return data;
}
