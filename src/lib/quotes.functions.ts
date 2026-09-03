import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export interface Quote {
  ticker: string;
  price: number;
  change: number; // % do dia
  prevClose: number;
  currency: string;
  shortName?: string;
  longName?: string;
  lastDividend: number;
  monthlyDividend: number;
  yearlyDividend: number;
  dividendYield: number;
  updatedAt: string;
  source: string;
}

const InputSchema = z.object({
  tickers: z
    .array(z.string().min(3).max(8).regex(/^[A-Z0-9]+$/))
    .min(1)
    .max(600),
});

// Cache 5min (Yahoo rate-limits Worker IPs aggressively)
type CacheEntry = { quote: Quote; expiresAt: number };
const cache = new Map<string, CacheEntry>();
const TTL_MS = 5 * 60_000;
// Stale fallback: serve last known quote if fresh fetch fails
const staleCache = new Map<string, Quote>();

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

async function fetchYahooHost(ticker: string, host: "query1" | "query2"): Promise<Quote | null> {
  const symbol = `${ticker}.SA`;
  const url = `https://${host}.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1mo&range=1y&events=div`;

  let res: Response;
  try {
    res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" } });
  } catch (e) {
    console.error(`[quotes] yahoo ${host} network ${ticker}`, e);
    return null;
  }
  if (!res.ok) {
    console.warn(`[quotes] yahoo ${host} ${ticker} http ${res.status}`);
    return null;
  }

  const data: any = await res.json().catch(() => null);
  const r = data?.chart?.result?.[0];
  const meta = r?.meta;
  if (!r || !meta || typeof meta.regularMarketPrice !== "number") return null;

  const price = Number(meta.regularMarketPrice);
  const prevClose = Number(meta.chartPreviousClose ?? price);
  const change = prevClose > 0 ? ((price - prevClose) / prevClose) * 100 : 0;

  const divs: Record<string, { amount: number; date: number }> = r?.events?.dividends ?? {};
  const nowSec = Math.floor(Date.now() / 1000);
  const oneYearAgo = nowSec - 365 * 24 * 60 * 60;
  const list = Object.values(divs)
    .filter((d) => Number.isFinite(d?.amount) && d.amount > 0 && d.date >= oneYearAgo)
    .sort((a, b) => b.date - a.date);

  const sumLast12 = list.reduce((a, b) => a + Number(b.amount), 0);
  const avgLast12 = list.length > 0 ? sumLast12 / 12 : 0;
  const lastDividend = Number(list[0]?.amount ?? avgLast12 ?? 0);
  const monthlyDividend = lastDividend > 0 ? lastDividend : avgLast12;
  const yearlyDividend = monthlyDividend * 12;
  const dividendYield = price > 0 ? (yearlyDividend / price) * 100 : 0;

  return {
    ticker: ticker.toUpperCase(),
    price,
    change,
    prevClose,
    currency: String(meta.currency ?? "BRL"),
    shortName: meta.shortName,
    longName: meta.longName,
    lastDividend,
    monthlyDividend,
    yearlyDividend,
    dividendYield,
    updatedAt: new Date().toISOString(),
    source: `yahoo:${host}`,
  };
}

async function fetchOne(ticker: string): Promise<Quote | null> {
  // Try query1, fallback to query2 (different IP/rate-limit pool)
  const a = await fetchYahooHost(ticker, "query1");
  if (a) return a;
  return fetchYahooHost(ticker, "query2");
}

export const getQuotes = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => InputSchema.parse(d))
  .handler(async ({ data }) => {
    const now = Date.now();
    const out: Record<string, Quote> = {};
    const toFetch: string[] = [];

    for (const t of data.tickers) {
      const T = t.toUpperCase();
      const c = cache.get(T);
      if (c && c.expiresAt > now) {
        out[T] = c.quote;
      } else {
        toFetch.push(T);
      }
    }

    // Limita concorrência para não sobrecarregar Yahoo (rate limit)
    const CONCURRENCY = 8;
    const results: (Quote | null)[] = new Array(toFetch.length);
    let cursor = 0;
    async function worker() {
      while (cursor < toFetch.length) {
        const i = cursor++;
        results[i] = await fetchOne(toFetch[i]);
      }
    }
    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, toFetch.length) }, worker));
    results.forEach((q, i) => {
      const T = toFetch[i];
      if (q) {
        cache.set(T, { quote: q, expiresAt: Date.now() + TTL_MS });
        staleCache.set(T, q);
        out[T] = q;
      } else {
        const stale = staleCache.get(T);
        if (stale) out[T] = stale;
      }
    });

    return { quotes: out, fetchedAt: new Date().toISOString() };
  });

