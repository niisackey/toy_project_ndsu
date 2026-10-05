import { apiClient } from "./client";
import type { CategoryRule } from "../types";

export interface CategoryRuleInput {
  keyword: string;
  categoryId: number;
}

export async function fetchCategoryRules(): Promise<CategoryRule[]> {
  const { data } = await apiClient.get<CategoryRule[]>("/category-rules");
  return data;
}

export async function createCategoryRule(input: CategoryRuleInput): Promise<CategoryRule> {
  const { data } = await apiClient.post<CategoryRule>("/category-rules", input);
  return data;
}

export async function deleteCategoryRule(id: number): Promise<void> {
  await apiClient.delete(`/category-rules/${id}`);
}
