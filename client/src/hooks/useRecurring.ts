import { useCallback, useEffect, useState } from "react";
import { fetchRecurringRules } from "../api/recurring";
import type { RecurringRule } from "../types";

export function useRecurring() {
  const [rules, setRules] = useState<RecurringRule[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setRules(await fetchRecurringRules());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { rules, loading, refresh };
}
