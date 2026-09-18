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

  // patches in columns for dbs created before they existed. doesn't help with
  // the frequency CHECK though - sqlite can't loosen those via ALTER TABLE,
  // so semesterly/yearly only work on a freshly created server/data/*.sqlite
  ensureColumn("accounts", "statement_closing_day", "INTEGER");
  ensureColumn("accounts", "payment_due_day", "INTEGER");
}
