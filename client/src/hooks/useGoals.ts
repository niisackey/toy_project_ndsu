import { useCallback, useEffect, useState } from "react";
import { fetchGoals } from "../api/goals";
import type { Goal } from "../types";

export function useGoals() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setGoals(await fetchGoals());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { goals, loading, refresh };
}
