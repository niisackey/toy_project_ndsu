import { useCallback, useEffect, useState } from "react";
import { fetchDebts } from "../api/debts";
import type { Debt } from "../types";

export function useDebts() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setDebts(await fetchDebts());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { debts, loading, refresh };
}
