import { useEffect, useRef, useState, useCallback } from "react";
import { getQuotes } from "@/lib/quotes.functions";
import type { Quote } from "@/lib/quotes.types";

const REFRESH_MS = 60_000; // 1 min
const STORAGE_KEY = "fii.quotes.cache.v1";

// Module-level cache — persists across route navigation (component remounts)
const quoteCache: Record<string, Quote> = {};
let lastFetchedAt: string | null = null;
let inflight: Promise<void> | null = null;
let lastFetchTs = 0;

// Hydrate from localStorage once (survives full reloads)
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
  } catch {}
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ quotes: quoteCache, fetchedAt: lastFetchedAt })
    );
  } catch {}
}

export function useQuotes(tickers: string[]) {
  const key = [...new Set(tickers.map((t) => t.toUpperCase()))].sort().join(",");

  // Initial state seeded from module cache → no flash of stale mock data
  const [quotes, setQuotes] = useState<Record<string, Quote>>(() => ({ ...quoteCache }));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(lastFetchedAt);

  const tickerListRef = useRef<string[]>([]);
  tickerListRef.current = key ? key.split(",") : [];

  const fetchNow = useCallback(async (force = false) => {
    const list = tickerListRef.current;
    if (list.length === 0) return;

    // Throttle: skip if a recent fetch already happened (unless forced)
    const now = Date.now();
    if (!force && now - lastFetchTs < 5_000) return;

    if (inflight) return inflight;

    setLoading(true);
    setError(null);
    lastFetchTs = now;

    inflight = (async () => {
      try {
        const res = await getQuotes({ data: { tickers: list } });
        Object.assign(quoteCache, res.quotes);
        lastFetchedAt = res.fetchedAt;
        persist();
        setQuotes({ ...quoteCache });
        setUpdatedAt(res.fetchedAt);
      } catch (e: any) {
        console.error("[useQuotes]", e);
        setError(e?.message ?? "Erro ao buscar cotações");
      } finally {
        setLoading(false);
        inflight = null;
      }
    })();

    return inflight;
  }, []);

  useEffect(() => {
    if (!key) return;
    fetchNow();
    const id = setInterval(() => fetchNow(true), REFRESH_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") fetchNow();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [key, fetchNow]);

  return { quotes, loading, error, updatedAt, refresh: () => fetchNow(true) };
}
