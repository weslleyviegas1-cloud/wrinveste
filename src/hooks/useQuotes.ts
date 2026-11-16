import { useEffect, useRef, useState, useCallback } from "react";
import { getQuotes } from "@/lib/quotes.functions";
import type { Quote } from "@/lib/quotes.types";

const REFRESH_MS = 60_000;
const THROTTLE_MS = 5_000;
const STORAGE_KEY = "fii.quotes.cache.v2";

const quoteCache: Record<string, Quote> = {};
const inflightByKey = new Map<string, Promise<void>>();
const lastFetchByKey = new Map<string, number>();
let lastFetchedAt: string | null = null;

if (typeof window !== "undefined" && Object.keys(quoteCache).length === 0) {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        Object.assign(quoteCache, parsed.quotes ?? {});
        lastFetchedAt = parsed.fetchedAt ?? null;
      }
    }
  } catch {
    // Cache local corrompido não deve impedir a consulta ao provedor.
  }
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ quotes: quoteCache, fetchedAt: lastFetchedAt })
    );
  } catch {
    // A aplicação continua funcionando mesmo sem espaço no armazenamento local.
  }
}

export function useQuotes(tickers: string[]) {
  const key = [...new Set(tickers.map((ticker) => ticker.toUpperCase()))].sort().join(",");
  const activeKeyRef = useRef(key);
  activeKeyRef.current = key;

  const [quotes, setQuotes] = useState<Record<string, Quote>>(() => ({ ...quoteCache }));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(lastFetchedAt);

  const fetchNow = useCallback(async (force = false) => {
    const requestKey = activeKeyRef.current;
    const list = requestKey ? requestKey.split(",") : [];
    if (list.length === 0) return;

    const now = Date.now();
    if (!force && now - (lastFetchByKey.get(requestKey) ?? 0) < THROTTLE_MS) return;

    const existing = inflightByKey.get(requestKey);
    if (existing) return existing;

    setLoading(true);
    setError(null);
    lastFetchByKey.set(requestKey, now);

    const request = (async () => {
      try {
        const response = await getQuotes({ data: { tickers: list } });
        Object.assign(quoteCache, response.quotes);
        lastFetchedAt = response.fetchedAt;
        persist();

        if (activeKeyRef.current === requestKey) {
          setQuotes({ ...quoteCache });
          setUpdatedAt(response.fetchedAt);
        }
      } catch (cause) {
        console.error("[useQuotes]", cause);
        if (activeKeyRef.current === requestKey) {
          setError(cause instanceof Error ? cause.message : "Erro ao buscar cotações");
        }
      } finally {
        inflightByKey.delete(requestKey);
        if (activeKeyRef.current === requestKey) setLoading(false);
      }
    })();

    inflightByKey.set(requestKey, request);
    return request;
  }, []);

  useEffect(() => {
    if (!key) return;
    setQuotes({ ...quoteCache });
    void fetchNow();
    const intervalId = window.setInterval(() => void fetchNow(true), REFRESH_MS);
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") void fetchNow();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [key, fetchNow]);

  return { quotes, loading, error, updatedAt, refresh: () => fetchNow(true) };
}
