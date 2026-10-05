import { useCallback, useEffect, useState } from "react";
import { fetchCategoryRules } from "../api/categoryRules";
import type { CategoryRule } from "../types";

export function useCategoryRules() {
  const [rules, setRules] = useState<CategoryRule[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setRules(await fetchCategoryRules());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { rules, loading, refresh };
}
