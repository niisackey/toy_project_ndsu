import { db } from "../../db/connection";
import { ConflictError, NotFoundError } from "../../shared/errors";

export interface CategoryDto {
  id: number;
  name: string;
  icon: string | null;
}

export function listCategories(): CategoryDto[] {
  return db.prepare(`SELECT * FROM categories ORDER BY name`).all() as unknown as CategoryDto[];
}

export function getCategory(id: number): CategoryDto {
  const row = db.prepare(`SELECT * FROM categories WHERE id = ?`).get(id) as unknown as
    | CategoryDto
    | undefined;
  if (!row) throw new NotFoundError(`Category ${id} not found`);
  return row;
}

export function createCategory(input: { name: string; icon?: string | null }): CategoryDto {
  const result = db
    .prepare(`INSERT INTO categories (name, icon) VALUES (?, ?)`)
    .run(input.name, input.icon ?? null);
  return getCategory(Number(result.lastInsertRowid));
}

export function updateCategory(
  id: number,
  input: { name?: string; icon?: string | null },
): CategoryDto {
  const existing = getCategory(id);
  const name = input.name ?? existing.name;
  const icon = input.icon !== undefined ? input.icon : existing.icon;
  db.prepare(`UPDATE categories SET name = ?, icon = ? WHERE id = ?`).run(name, icon, id);
  return getCategory(id);
}

export function deleteCategory(id: number): void {
  getCategory(id);
  const refCount = db
    .prepare(`SELECT COUNT(*) AS count FROM transactions WHERE category_id = ?`)
    .get(id) as unknown as { count: number };
  if (refCount.count > 0) {
    throw new ConflictError(
      "Cannot delete a category that has transactions. Reassign or delete them first.",
    );
  }
  db.prepare(`DELETE FROM categories WHERE id = ?`).run(id);
}
