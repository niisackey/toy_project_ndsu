import { addDays, addMonths, format, isAfter, parseISO } from "date-fns";
import { db } from "../../db/connection";
import type { RecurringFrequency, RecurringRuleRow } from "./recurring.service";

const DAYS_PER_OCCURRENCE: Record<"daily" | "weekly" | "biweekly", number> = {
  daily: 1,
  weekly: 7,
  biweekly: 14,
};

const MONTHS_PER_OCCURRENCE: Record<"monthly" | "semesterly" | "yearly", number> = {
  monthly: 1,
  semesterly: 6,
  yearly: 12,
};

function isDayBased(frequency: RecurringFrequency): frequency is keyof typeof DAYS_PER_OCCURRENCE {
  return frequency in DAYS_PER_OCCURRENCE;
}

function advance(dateStr: string, frequency: RecurringFrequency, intervalCount: number): string {
  const date = parseISO(dateStr);
  const next = isDayBased(frequency)
    ? addDays(date, DAYS_PER_OCCURRENCE[frequency] * intervalCount)
    : addMonths(date, MONTHS_PER_OCCURRENCE[frequency] * intervalCount);
  return format(next, "yyyy-MM-dd");
}

/**
 * Generates any transactions for recurring rules whose next_due_date has
 * passed, catching up on all missed occurrences. Safe to call repeatedly
 * (idempotent per due date) and safe if the server was off for a while.
 */
export function runDueRules(today: string = format(new Date(), "yyyy-MM-dd")): number {
  const rules = db
    .prepare(`SELECT * FROM recurring_rules WHERE active = 1 AND next_due_date <= ?`)
    .all(today) as unknown as RecurringRuleRow[];

  let generatedCount = 0;

  const insertTransaction = db.prepare(
    `INSERT INTO transactions (type, amount, date, description, account_id, category_id, recurring_rule_id)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  );
  const updateRule = db.prepare(
    `UPDATE recurring_rules SET next_due_date = ?, active = ? WHERE id = ?`,
  );

  for (const rule of rules) {
    let nextDueDate = rule.next_due_date;
    let active = rule.active;
    const todayDate = parseISO(today);

    while (!isAfter(parseISO(nextDueDate), todayDate)) {
      if (rule.end_date && isAfter(parseISO(nextDueDate), parseISO(rule.end_date))) {
        active = 0;
        break;
      }
      insertTransaction.run(
        rule.type,
        rule.amount,
        nextDueDate,
        `${rule.name} (recurring)`,
        rule.account_id,
        rule.category_id,
        rule.id,
      );
      generatedCount += 1;
      nextDueDate = advance(nextDueDate, rule.frequency, rule.interval_count);

      if (rule.end_date && isAfter(parseISO(nextDueDate), parseISO(rule.end_date))) {
        active = 0;
      }
    }

    updateRule.run(nextDueDate, active, rule.id);
  }

  return generatedCount;
}

let intervalHandle: NodeJS.Timeout | null = null;

export function startRecurringScheduler(): void {
  runDueRules();
  intervalHandle = setInterval(
    () => {
      runDueRules();
    },
    1000 * 60 * 60,
  );
  intervalHandle.unref();
}

export function stopRecurringScheduler(): void {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
}
