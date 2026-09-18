import { apiClient } from "./client";
import type { InsightsResponse } from "../types";

export async function fetchInsights(): Promise<InsightsResponse> {
  const { data } = await apiClient.get<InsightsResponse>("/insights");
  return data;
}
