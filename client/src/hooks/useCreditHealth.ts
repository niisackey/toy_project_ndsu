import { useCallback, useEffect, useState } from "react";
import { fetchCreditHealth } from "../api/credit";
import type { CreditHealth } from "../types";

export function useCreditHealth() {
  const [health, setHealth] = useState<CreditHealth | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setHealth(await fetchCreditHealth());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { health, loading, refresh };
}
