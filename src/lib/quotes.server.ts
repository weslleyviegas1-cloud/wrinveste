import type { Quote, QuotesResponse } from "./quotes.types";

type CacheEntry = { quote: Quote; expiresAt: number };

const cache = new Map<string, CacheEntry>();
const staleCache = new Map<string, Quote>();
const TTL_MS = 60_000;
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

async function fetchYahooHost(
  ticker: string,
  host: "query1" | "query2",
): Promise<Quote | null> {
  const symbol = ticker.includes("-") ? ticker : `${ticker}.SA`;
  const url = `https://${host}.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1mo&range=1y&events=div`;

  let response: Response;
  try {
    response = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    });
  } catch (error) {
    console.error(`[quotes] yahoo ${host} network ${ticker}`, error);
    return null;
  }

  if (!response.ok) {
    console.warn(`[quotes] yahoo ${host} ${ticker} http ${response.status}`);
    return null;
  }

  const payload: unknown = await response.json().catch(() => null);
  if (!payload || typeof payload !== "object") return null;

  const chart = (payload as { chart?: { result?: unknown[] } }).chart;
  const result = chart?.result?.[0] as
    | {
        meta?: {
          regularMarketPrice?: number;
          regularMarketTime?: number;
          chartPreviousClose?: number;
          currency?: string;
          shortName?: string;
          longName?: string;
        };
        events?: { dividends?: Record<string, { amount: number; date: number }> };
      }
    | undefined;
  const meta = result?.meta;
  if (!meta || typeof meta.regularMarketPrice !== "number") return null;

  const price = meta.regularMarketPrice;
  const prevClose = Number(meta.chartPreviousClose ?? price);
  const change = prevClose > 0 ? ((price - prevClose) / prevClose) * 100 : 0;
  const nowSeconds = Math.floor(Date.now() / 1000);
  const oneYearAgo = nowSeconds - 365 * 24 * 60 * 60;
  const dividends = Object.values(result?.events?.dividends ?? {})
    .filter((dividend) =>
      Number.isFinite(dividend.amount) && dividend.amount > 0 && dividend.date >= oneYearAgo
    )
    .sort((a, b) => b.date - a.date);
  const sumLast12 = dividends.reduce((total, dividend) => total + dividend.amount, 0);
  const averageLast12 = dividends.length > 0 ? sumLast12 / 12 : 0;
  const lastDividend = Number(dividends[0]?.amount ?? averageLast12);
  const monthlyDividend = averageLast12;
  const yearlyDividend = sumLast12;
  const marketTime = typeof meta.regularMarketTime === "number"
    ? new Date(meta.regularMarketTime * 1000).toISOString()
    : undefined;

  return {
    ticker,
    price,
    change,
    prevClose,
    currency: String(meta.currency ?? "BRL"),
    shortName: meta.shortName,
    longName: meta.longName,
    lastDividend,
    monthlyDividend,
    yearlyDividend,
    dividendYield: price > 0 ? (yearlyDividend / price) * 100 : 0,
    ...(marketTime ? { marketTime } : {}),
    updatedAt: new Date().toISOString(),
    source: `yahoo:${host}`,
  };
}

async function fetchOne(ticker: string): Promise<Quote | null> {
  return (await fetchYahooHost(ticker, "query1")) ?? fetchYahooHost(ticker, "query2");
}

export async function fetchQuotes(tickers: string[]): Promise<QuotesResponse> {
  const now = Date.now();
  const quotes: Record<string, Quote> = {};
  const toFetch: string[] = [];

  for (const ticker of [...new Set(tickers.map((item) => item.toUpperCase()))]) {
    const cached = cache.get(ticker);
    if (cached && cached.expiresAt > now) quotes[ticker] = cached.quote;
    else toFetch.push(ticker);
  }

  const results: Array<Quote | null> = new Array(toFetch.length);
  let cursor = 0;
  async function worker() {
    while (cursor < toFetch.length) {
      const index = cursor++;
      const ticker = toFetch[index];
      if (!ticker) continue;
      results[index] = await fetchOne(ticker);
    }
  }

  const concurrency = Math.min(8, toFetch.length);
  await Promise.all(Array.from({ length: concurrency }, () => worker()));

  results.forEach((quote, index) => {
    const ticker = toFetch[index];
    if (!ticker) return;
    if (quote) {
      cache.set(ticker, { quote, expiresAt: Date.now() + TTL_MS });
      staleCache.set(ticker, quote);
      quotes[ticker] = quote;
      return;
    }
    const stale = staleCache.get(ticker);
    if (stale) quotes[ticker] = stale;
  });

  return { quotes, fetchedAt: new Date().toISOString() };
}
