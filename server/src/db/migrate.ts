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

  ensureColumn("accounts", "next_statement_closing_date", "TEXT");
  ensureColumn("accounts", "next_payment_due_date", "TEXT");
  ensureColumn("accounts", "currency", "TEXT NOT NULL DEFAULT 'USD'");
  ensureColumn("transactions", "transfer_amount_converted", "REAL");

  db.prepare(`INSERT OR IGNORE INTO settings (key, value) VALUES ('base_currency', 'USD')`).run();

  db.prepare(`INSERT OR IGNORE INTO categories (name, icon) VALUES ('Lending', '🤝')`).run();
  db.prepare(`INSERT OR IGNORE INTO categories (name, icon) VALUES ('Borrowed Funds', '🙏')`).run();
  db.prepare(`INSERT OR IGNORE INTO categories (name, icon) VALUES ('Miscellaneous', '📦')`).run();
}
