import { db } from "../../db/connection";
import { BadRequestError } from "../../shared/errors";
import { FALLBACK_RATES_TO_USD, SUPPORTED_CURRENCY_CODES } from "../../shared/currencies";

const RATES_URL = "https://open.er-api.com/v6/latest/USD";

interface RateRow {
  currency: string;
  rate_to_usd: number;
  fetched_at: string;
}

export function getBaseCurrency(): string {
  const row = db.prepare(`SELECT value FROM settings WHERE key = 'base_currency'`).get() as
    | { value: string }
    | undefined;
  return row?.value ?? "USD";
}

export function setBaseCurrency(currency: string): void {
  if (!SUPPORTED_CURRENCY_CODES.includes(currency)) {
    throw new BadRequestError(`Unsupported currency: ${currency}`);
  }
  db.prepare(
    `INSERT INTO settings (key, value) VALUES ('base_currency', ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
  ).run(currency);
}

function getCachedRate(currency: string): number | null {
  const row = db.prepare(`SELECT rate_to_usd FROM exchange_rates WHERE currency = ?`).get(currency) as
    | { rate_to_usd: number }
    | undefined;
  return row?.rate_to_usd ?? null;
}

function rateToUsd(currency: string): number {
  if (currency === "USD") return 1;
  const cached = getCachedRate(currency);
  if (cached !== null) return cached;
  return FALLBACK_RATES_TO_USD[currency] ?? 1;
}

export function convert(amount: number, from: string, to: string): number {
  if (from === to) return amount;
  const amountInUsd = amount / rateToUsd(from);
  const converted = amountInUsd * rateToUsd(to);
  return Math.round(converted * 100) / 100;
}

export async function refreshRates(): Promise<void> {
  const response = await fetch(RATES_URL);
  if (!response.ok) throw new Error(`exchange rate fetch failed: ${response.status}`);
  const data = (await response.json()) as { result: string; rates: Record<string, number> };
  if (data.result !== "success") throw new Error("exchange rate fetch returned an error result");

  const now = new Date().toISOString();
  const upsert = db.prepare(
    `INSERT INTO exchange_rates (currency, rate_to_usd, fetched_at) VALUES (?, ?, ?)
     ON CONFLICT(currency) DO UPDATE SET rate_to_usd = excluded.rate_to_usd, fetched_at = excluded.fetched_at`,
  );
  db.exec("BEGIN");
  try {
    for (const code of SUPPORTED_CURRENCY_CODES) {
      const rate = data.rates[code];
      if (typeof rate === "number") {
        upsert.run(code, rate, now);
      }
    }
    db.exec("COMMIT");
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
}

export interface RatesSummary {
  baseCurrency: string;
  lastFetchedAt: string | null;
  rates: { currency: string; rateToUsd: number; live: boolean }[];
}

export function getRatesSummary(): RatesSummary {
  const rows = db
    .prepare(`SELECT currency, rate_to_usd, fetched_at FROM exchange_rates`)
    .all() as unknown as RateRow[];
  const lastFetchedAt = rows.reduce<string | null>(
    (latest, r) => (!latest || r.fetched_at > latest ? r.fetched_at : latest),
    null,
  );
  return {
    baseCurrency: getBaseCurrency(),
    lastFetchedAt,
    rates: SUPPORTED_CURRENCY_CODES.map((code) => {
      const cached = rows.find((r) => r.currency === code);
      return {
        currency: code,
        rateToUsd: cached?.rate_to_usd ?? FALLBACK_RATES_TO_USD[code] ?? 1,
        live: Boolean(cached),
      };
    }),
  };
}
