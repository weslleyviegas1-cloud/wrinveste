import { useEffect, useRef, useState, useCallback } from "react";
import { getQuotes, type Quote } from "@/server/quotes.functions";

const REFRESH_MS = 60_000; // 1 min

export function useQuotes(tickers: string[]) {
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const key = [...new Set(tickers.map((t) => t.toUpperCase()))].sort().join(",");
  const tickerListRef = useRef<string[]>([]);
  tickerListRef.current = key ? key.split(",") : [];

  const fetchNow = useCallback(async () => {
    const list = tickerListRef.current;
    if (list.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getQuotes({ data: { tickers: list } });
      setQuotes((prev) => ({ ...prev, ...res.quotes }));
      setUpdatedAt(res.fetchedAt);
    } catch (e: any) {
      console.error("[useQuotes]", e);
      setError(e?.message ?? "Erro ao buscar cotações");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!key) return;
    fetchNow();
    const id = setInterval(fetchNow, REFRESH_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") fetchNow();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [key, fetchNow]);

  return { quotes, loading, error, updatedAt, refresh: fetchNow };
}
