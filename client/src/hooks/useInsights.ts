import { useCallback, useEffect, useState } from "react";
import { fetchInsights } from "../api/insights";
import type { Insight, InsightsSource } from "../types";

export function useInsights() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [source, setSource] = useState<InsightsSource>("rules");
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchInsights();
      setInsights(result.insights);
      setSource(result.source);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { insights, source, loading, refresh };
}
