import { db } from "../../db/connection";
import { NotFoundError } from "../../shared/errors";

export interface CategoryRuleRow {
  id: number;
  keyword: string;
  category_id: number;
  created_at: string;
}

export interface CategoryRuleDto {
  id: number;
  keyword: string;
  categoryId: number;
  categoryName: string;
  createdAt: string;
}

function toDto(row: CategoryRuleRow & { category_name: string }): CategoryRuleDto {
  return {
    id: row.id,
    keyword: row.keyword,
    categoryId: row.category_id,
    categoryName: row.category_name,
    createdAt: row.created_at,
  };
}

const SELECT_WITH_CATEGORY = `
  SELECT r.*, c.name AS category_name
  FROM category_rules r
  JOIN categories c ON c.id = r.category_id
`;

export function listCategoryRules(): CategoryRuleDto[] {
  const rows = db
    .prepare(`${SELECT_WITH_CATEGORY} ORDER BY r.keyword`)
    .all() as unknown as (CategoryRuleRow & { category_name: string })[];
  return rows.map(toDto);
}

export function getCategoryRule(id: number): CategoryRuleDto {
  const row = db.prepare(`${SELECT_WITH_CATEGORY} WHERE r.id = ?`).get(id) as unknown as
    | (CategoryRuleRow & { category_name: string })
    | undefined;
  if (!row) throw new NotFoundError(`Category rule ${id} not found`);
  return toDto(row);
}

export interface CreateCategoryRuleInput {
  keyword: string;
  categoryId: number;
}

export function createCategoryRule(input: CreateCategoryRuleInput): CategoryRuleDto {
  const result = db
    .prepare(`INSERT INTO category_rules (keyword, category_id) VALUES (?, ?)`)
    .run(input.keyword.trim().toLowerCase(), input.categoryId);
  return getCategoryRule(Number(result.lastInsertRowid));
}

export function deleteCategoryRule(id: number): void {
  getCategoryRule(id);
  db.prepare(`DELETE FROM category_rules WHERE id = ?`).run(id);
}

export function matchCategoryRule(description: string): number | null {
  const rows = db.prepare(`SELECT keyword, category_id FROM category_rules`).all() as unknown as {
    keyword: string;
    category_id: number;
  }[];
  const lowerDescription = description.toLowerCase();
  const match = rows.find((r) => lowerDescription.includes(r.keyword));
  return match?.category_id ?? null;
}
