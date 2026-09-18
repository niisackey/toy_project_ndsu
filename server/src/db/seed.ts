import { addDays, format, subMonths } from "date-fns";
import { db } from "./connection";
import { migrate } from "./migrate";

function dateOffset(monthsAgo: number, day: number): string {
  const base = subMonths(new Date(), monthsAgo);
  const dt = new Date(base.getFullYear(), base.getMonth(), day);
  return format(dt, "yyyy-MM-dd");
}

function today(): string {
  return format(new Date(), "yyyy-MM-dd");
}

function daysFromNow(days: number): string {
  return format(addDays(new Date(), days), "yyyy-MM-dd");
}

function clearAll(): void {
  db.exec(`
    DELETE FROM credit_card_payments;
    DELETE FROM goals;
    DELETE FROM budgets;
    DELETE FROM transactions;
    DELETE FROM recurring_rules;
    DELETE FROM categories;
    DELETE FROM accounts;
    DELETE FROM sqlite_sequence;
  `);
}

function seedDatabase(): void {
  db.exec("BEGIN");
  try {
    clearAll();

    const insertAccount = db.prepare(
      `INSERT INTO accounts (name, type, initial_balance, credit_limit, statement_closing_day, payment_due_day)
       VALUES (?, ?, ?, ?, ?, ?)`,
    );
    const accounts = {
      checking: Number(
        insertAccount.run("Checking", "checking", 900, null, null, null).lastInsertRowid,
      ),
      cash: Number(insertAccount.run("Cash", "cash", 60, null, null, null).lastInsertRowid),
      carFund: Number(
        insertAccount.run("Car Fund", "savings", 300, null, null, null).lastInsertRowid,
      ),
      chase: Number(
        insertAccount.run("Chase Freedom", "credit_card", 0, 2000, 22, 17).lastInsertRowid,
      ),
      discover: Number(
        insertAccount.run("Discover it", "credit_card", 0, 1500, 5, 28).lastInsertRowid,
      ),
    };

    const insertCategory = db.prepare(`INSERT INTO categories (name, icon) VALUES (?, ?)`);
    const categories = {
      groceries: Number(insertCategory.run("Groceries", "🛒").lastInsertRowid),
      rent: Number(insertCategory.run("Rent", "🏠").lastInsertRowid),
      utilities: Number(insertCategory.run("Utilities", "💡").lastInsertRowid),
      tuition: Number(insertCategory.run("Tuition/Fees", "🎓").lastInsertRowid),
      dining: Number(insertCategory.run("Dining Out", "🍔").lastInsertRowid),
      transportation: Number(insertCategory.run("Transportation", "🚌").lastInsertRowid),
      entertainment: Number(insertCategory.run("Entertainment", "🎬").lastInsertRowid),
      textbooks: Number(insertCategory.run("Textbooks/Supplies", "📚").lastInsertRowid),
      subscriptions: Number(insertCategory.run("Subscriptions", "📱").lastInsertRowid),
    };

    const insertTx = db.prepare(
      `INSERT INTO transactions (type, amount, date, description, account_id, transfer_to_account_id, category_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    );

    for (const monthsAgo of [2, 1]) {
      insertTx.run(
        "income",
        1800,
        dateOffset(monthsAgo, 1),
        "Graduate Stipend",
        accounts.checking,
        null,
        null,
      );
      insertTx.run(
        "expense",
        900,
        dateOffset(monthsAgo, 2),
        "Rent",
        accounts.checking,
        null,
        categories.rent,
      );
      insertTx.run(
        "expense",
        80,
        dateOffset(monthsAgo, 3),
        "Electric & internet",
        accounts.checking,
        null,
        categories.utilities,
      );
      insertTx.run(
        "expense",
        220,
        dateOffset(monthsAgo, 5),
        "Weekly groceries",
        accounts.chase,
        null,
        categories.groceries,
      );
      insertTx.run(
        "expense",
        95,
        dateOffset(monthsAgo, 9),
        "More groceries",
        accounts.chase,
        null,
        categories.groceries,
      );
      insertTx.run(
        "expense",
        60,
        dateOffset(monthsAgo, 10),
        "Dinner with friends",
        accounts.chase,
        null,
        categories.dining,
      );
      insertTx.run(
        "expense",
        45,
        dateOffset(monthsAgo, 14),
        "Bus pass",
        accounts.discover,
        null,
        categories.transportation,
      );
      insertTx.run(
        "expense",
        25,
        dateOffset(monthsAgo, 15),
        "Movie night",
        accounts.discover,
        null,
        categories.entertainment,
      );
      insertTx.run(
        "expense",
        15.99,
        dateOffset(monthsAgo, 18),
        "Streaming subscription",
        accounts.chase,
        null,
        categories.subscriptions,
      );
      insertTx.run(
        "transfer",
        300,
        dateOffset(monthsAgo, 20),
        "Credit card payment",
        accounts.checking,
        accounts.chase,
        null,
      );
      insertTx.run(
        "transfer",
        200,
        dateOffset(monthsAgo, 22),
        "Car Fund contribution",
        accounts.checking,
        accounts.carFund,
        null,
      );
    }

    insertTx.run(
      "income",
      150,
      dateOffset(1, 12),
      "Freelance Tutoring",
      accounts.checking,
      null,
      null,
    );
    insertTx.run(
      "expense",
      140,
      dateOffset(0, 3),
      "Weekly groceries",
      accounts.chase,
      null,
      categories.groceries,
    );
    insertTx.run(
      "expense",
      110,
      dateOffset(0, 5),
      "Dinner out twice",
      accounts.discover,
      null,
      categories.dining,
    );
    insertTx.run(
      "expense",
      60,
      dateOffset(0, 6),
      "New textbook",
      accounts.chase,
      null,
      categories.textbooks,
    );
    insertTx.run(
      "expense",
      40,
      dateOffset(0, 8),
      "Weekend trip transportation",
      accounts.discover,
      null,
      categories.transportation,
    );

    const insertBudget = db.prepare(
      `INSERT INTO budgets (category_id, month, limit_amount) VALUES (?, ?, ?)`,
    );
    const currentMonth = format(new Date(), "yyyy-MM");
    insertBudget.run(categories.groceries, currentMonth, 400);
    insertBudget.run(categories.dining, currentMonth, 80); // intentionally tight, to demo an over-budget insight
    insertBudget.run(categories.entertainment, currentMonth, 100);
    insertBudget.run(categories.transportation, currentMonth, 120);
    insertBudget.run(categories.textbooks, currentMonth, 200);

    const insertRecurring = db.prepare(
      `INSERT INTO recurring_rules (name, type, amount, account_id, category_id, frequency, interval_count, start_date, next_due_date, end_date, active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    insertRecurring.run(
      "Graduate Stipend",
      "income",
      1800,
      accounts.checking,
      null,
      "monthly",
      1,
      dateOffset(2, 1),
      today(),
      null,
      1,
    );
    insertRecurring.run(
      "Rent",
      "expense",
      900,
      accounts.checking,
      categories.rent,
      "monthly",
      1,
      dateOffset(2, 2),
      today(),
      null,
      1,
    );
    insertRecurring.run(
      "Streaming Subscription",
      "expense",
      15.99,
      accounts.chase,
      categories.subscriptions,
      "monthly",
      1,
      dateOffset(2, 18),
      today(),
      null,
      1,
    );
    insertRecurring.run(
      "Student Activity Fee",
      "expense",
      175,
      accounts.checking,
      categories.tuition,
      "semesterly",
      1,
      dateOffset(4, 1),
      daysFromNow(4),
      null,
      1,
    );
    insertRecurring.run(
      "Renters Insurance",
      "expense",
      140,
      accounts.checking,
      null,
      "yearly",
      1,
      dateOffset(11, 10),
      daysFromNow(18),
      null,
      1,
    );
    insertRecurring.run(
      "Part-time TA Paycheck",
      "income",
      210,
      accounts.checking,
      null,
      "biweekly",
      1,
      dateOffset(1, 5),
      daysFromNow(2),
      null,
      1,
    );

    const insertGoal = db.prepare(
      `INSERT INTO goals (name, target_amount, target_date, linked_account_id) VALUES (?, ?, ?, ?)`,
    );
    const targetDate = format(subMonths(new Date(), -12), "yyyy-MM-dd");
    insertGoal.run("Buy a car", 7000, targetDate, accounts.carFund);

    const insertPayment = db.prepare(
      `INSERT INTO credit_card_payments (account_id, statement_month, paid_on_time) VALUES (?, ?, ?)`,
    );
    insertPayment.run(accounts.chase, format(subMonths(new Date(), 2), "yyyy-MM"), 1);
    insertPayment.run(accounts.chase, format(subMonths(new Date(), 1), "yyyy-MM"), 1);
    insertPayment.run(accounts.discover, format(subMonths(new Date(), 2), "yyyy-MM"), 1);
    insertPayment.run(accounts.discover, format(subMonths(new Date(), 1), "yyyy-MM"), 0);
    db.exec("COMMIT");
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
}

export function seedIfEmpty(): void {
  const row = db.prepare(`SELECT COUNT(*) AS count FROM accounts`).get() as unknown as {
    count: number;
  };
  if (row.count === 0) {
    seedDatabase();
  }
}

if (require.main === module) {
  migrate();
  seedDatabase();
  console.log("Database reseeded with demo data.");
}
