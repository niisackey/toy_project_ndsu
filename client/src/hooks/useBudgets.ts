import { useCallback, useEffect, useState } from "react";
import { fetchBudgets } from "../api/budgets";
import type { Budget } from "../types";

export function useBudgets(month?: string) {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setBudgets(await fetchBudgets(month));
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { budgets, loading, refresh };
}
