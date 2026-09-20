import { refreshRates } from "./currency.service";

let intervalHandle: NodeJS.Timeout | null = null;

export function startCurrencyScheduler(): void {
  refreshRates().catch((err) => {
    console.error("initial exchange rate fetch failed, using cached/fallback rates:", err.message);
  });
  intervalHandle = setInterval(
    () => {
      refreshRates().catch((err) => {
        console.error("exchange rate refresh failed, keeping cached rates:", err.message);
      });
    },
    1000 * 60 * 60 * 12,
  );
  intervalHandle.unref();
}

export function stopCurrencyScheduler(): void {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
}
