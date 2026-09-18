import fs from "node:fs";
import path from "node:path";
import { db } from "./connection";

function ensureColumn(table: string, column: string, definition: string): void {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all() as unknown as {
    name: string;
  }[];
  if (!columns.some((c) => c.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

export function migrate(): void {
  const schemaPath = path.join(__dirname, "schema.sql");
  const schema = fs.readFileSync(schemaPath, "utf-8");
  db.exec(schema);

  // Additive migrations for databases created before these columns existed.
  // (SQLite can't loosen a CHECK constraint via ALTER TABLE - the
  // recurring_rules.frequency CHECK gaining 'semesterly'/'yearly' only takes
  // effect on a freshly created table, i.e. a fresh server/data/*.sqlite.)
  ensureColumn("accounts", "statement_closing_day", "INTEGER");
  ensureColumn("accounts", "payment_due_day", "INTEGER");
}
