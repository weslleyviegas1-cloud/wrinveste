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
  // Histórico de proventos (últimos 12 meses)
  lastDividend: number; // último provento por cota (R$)
  monthlyDividend: number; // média mensal últimos 12m
  yearlyDividend: number; // soma últimos 12m
  dividendYield: number; // % anual sobre o preço atual
  updatedAt: string; // ISO
  source: string;
}

const InputSchema = z.object({
  tickers: z.array(z.string().min(3).max(8).regex(/^[A-Z0-9]+$/)).min(1).max(50),
});

// Cache em memória do worker — TTL 60s
type CacheEntry = { quote: Quote; expiresAt: number };
const cache = new Map<string, CacheEntry>();
const TTL_MS = 60_000;

async function fetchOneFromBrapi(ticker: string, token?: string): Promise<Quote | null> {
  // brapi.dev — endpoint público para cotações de FIIs e ações brasileiras
  const url = new URL(`https://brapi.dev/api/quote/${ticker}`);
  url.searchParams.set("range", "1d");
  url.searchParams.set("interval", "1d");
  url.searchParams.set("modules", "balanceSheetHistory");
  url.searchParams.set("dividends", "true");
  if (token) url.searchParams.set("token", token);

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
    });
  } catch (e) {
    console.error(`[quotes] network error ${ticker}`, e);
    return null;
  }
  if (!res.ok) {
    console.warn(`[quotes] brapi ${ticker} ${res.status}`);
    return null;
  }
  const data = (await res.json()) as any;
  const r = data?.results?.[0];
  if (!r || typeof r.regularMarketPrice !== "number") return null;

  // Proventos dos últimos 12 meses
  const cashDividends: Array<{ paymentDate?: string; rate?: number; assetIssued?: string }> =
    r?.dividendsData?.cashDividends ?? [];
  const now = Date.now();
  const oneYearAgo = now - 365 * 24 * 60 * 60 * 1000;
  const last12 = cashDividends
    .filter((d) => d?.paymentDate && new Date(d.paymentDate).getTime() >= oneYearAgo)
    .map((d) => Number(d.rate ?? 0))
    .filter((n) => Number.isFinite(n) && n > 0);

  const yearlyDividend = last12.reduce((a, b) => a + b, 0);
  const monthlyDividend = last12.length > 0 ? yearlyDividend / 12 : 0;

  // último provento (mais recente)
  const sorted = [...cashDividends].sort(
    (a, b) => new Date(b.paymentDate ?? 0).getTime() - new Date(a.paymentDate ?? 0).getTime()
  );
  const lastDividend = Number(sorted[0]?.rate ?? monthlyDividend ?? 0);

  const price = Number(r.regularMarketPrice);
  const dividendYield = price > 0 ? (yearlyDividend / price) * 100 : 0;

  return {
    ticker: ticker.toUpperCase(),
    price,
    change: Number(r.regularMarketChangePercent ?? 0),
    prevClose: Number(r.regularMarketPreviousClose ?? price),
    currency: String(r.currency ?? "BRL"),
    shortName: r.shortName,
    longName: r.longName,
    lastDividend,
    monthlyDividend,
    yearlyDividend,
    dividendYield,
    updatedAt: new Date().toISOString(),
    source: "brapi.dev",
  };
}

export const getQuotes = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => InputSchema.parse(d))
  .handler(async ({ data }) => {
    const token = process.env.BRAPI_TOKEN; // opcional — se configurado, sobe o limite
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

    // Busca em paralelo (limitado)
    const results = await Promise.all(toFetch.map((t) => fetchOneFromBrapi(t, token)));
    results.forEach((q, i) => {
      const T = toFetch[i];
      if (q) {
        cache.set(T, { quote: q, expiresAt: Date.now() + TTL_MS });
        out[T] = q;
      }
    });

    return { quotes: out, fetchedAt: new Date().toISOString() };
  });
