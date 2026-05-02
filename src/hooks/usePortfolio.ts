import { useEffect, useState, useCallback, useMemo } from "react";
import { getFII } from "@/data/fiis";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuotes } from "@/hooks/useQuotes";

export interface Position {
  ticker: string;
  shares: number;
  avgPrice: number;
  purchasedAt?: string; // ISO date — quando a posição foi criada
}

const KEY = "fii.portfolio.v1";

function readLocal(): Position[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocal(p: Position[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(p));
}

export function usePortfolio() {
  const { user, loading: authLoading } = useAuth();
  const [positions, setPositions] = useState<Position[]>([]);
  const [ready, setReady] = useState(false);

  // Carrega/sync conforme estado do usuário
  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;

    async function load() {
      if (!user) {
        setPositions(readLocal());
        setReady(true);
        return;
      }

      // Carrega da nuvem
      const { data, error } = await supabase
        .from("positions")
        .select("ticker, shares, avg_price, created_at")
        .order("ticker");

      if (cancelled) return;

      if (error) {
        console.error("[positions] load error", error);
        setPositions(readLocal());
        setReady(true);
        return;
      }

      const cloud: Position[] = (data ?? []).map((r: any) => ({
        ticker: r.ticker,
        shares: Number(r.shares),
        avgPrice: Number(r.avg_price),
        purchasedAt: r.created_at ?? undefined,
      }));

      // Se nuvem vazia e há dados locais, faz upload (migração inicial)
      if (cloud.length === 0) {
        const local = readLocal();
        if (local.length > 0) {
          const rows = local.map((p) => ({
            user_id: user.id,
            ticker: p.ticker,
            shares: p.shares,
            avg_price: p.avgPrice,
          }));
          await supabase.from("positions").upsert(rows, { onConflict: "user_id,ticker" });
          setPositions(local);
          setReady(true);
          return;
        }
      }

      setPositions(cloud);
      setReady(true);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  const persist = useCallback(
    async (next: Position[]) => {
      setPositions(next);
      if (!user) {
        writeLocal(next);
      }
    },
    [user]
  );

  const addOrUpdate = useCallback(
    async (ticker: string, shares: number, avgPrice: number) => {
      const t = ticker.toUpperCase();
      const existing = positions.find((p) => p.ticker === t);
      let nextShares = shares;
      let nextAvg = avgPrice;
      if (existing) {
        const total = existing.shares + shares;
        nextShares = total;
        nextAvg = total > 0 ? (existing.shares * existing.avgPrice + shares * avgPrice) / total : avgPrice;
      }
      const nowIso = new Date().toISOString();
      const next = existing
        ? positions.map((p) => (p.ticker === t ? { ...p, shares: nextShares, avgPrice: nextAvg } : p))
        : [...positions, { ticker: t, shares: nextShares, avgPrice: nextAvg, purchasedAt: nowIso }];

      setPositions(next);

      if (user) {
        const { error } = await supabase
          .from("positions")
          .upsert(
            { user_id: user.id, ticker: t, shares: nextShares, avg_price: nextAvg },
            { onConflict: "user_id,ticker" }
          );
        if (error) console.error("[positions] upsert", error);
      } else {
        writeLocal(next);
      }
    },
    [positions, user]
  );

  const remove = useCallback(
    async (ticker: string) => {
      const next = positions.filter((p) => p.ticker !== ticker);
      setPositions(next);
      if (user) {
        const { error } = await supabase
          .from("positions")
          .delete()
          .eq("user_id", user.id)
          .eq("ticker", ticker);
        if (error) console.error("[positions] delete", error);
      } else {
        writeLocal(next);
      }
    },
    [positions, user]
  );

  const clearAll = useCallback(async () => {
    setPositions([]);
    if (user) {
      const { error } = await supabase.from("positions").delete().eq("user_id", user.id);
      if (error) console.error("[positions] clear", error);
    }
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(KEY);
    }
  }, [user]);

  // Cotações em tempo real (server function -> brapi.dev, refresh 60s)
  const tickers = useMemo(() => positions.map((p) => p.ticker), [positions]);
  const { quotes, loading: quotesLoading, error: quotesError, updatedAt: quotesUpdatedAt, refresh: refreshQuotes } =
    useQuotes(tickers);

  const now = Date.now();
  const enriched = positions
    .map((p) => {
      const fii = getFII(p.ticker);
      if (!fii) return null;
      const live = quotes[p.ticker];
      const price = live?.price ?? fii.price;
      const lastDiv = live?.lastDividend ?? fii.lastDividend;
      const monthlyAvg = live?.monthlyDividend ?? fii.lastDividend;
      const dy = live?.dividendYield ?? fii.dividendYield;
      const change = live?.change ?? 0;

      const invested = p.shares * p.avgPrice;
      const current = p.shares * price;
      const monthlyDividend = p.shares * monthlyAvg;
      const yearlyDividend = monthlyDividend * 12;
      const profit = current - invested;
      const profitPct = invested > 0 ? (profit / invested) * 100 : 0;

      // Proventos já recebidos desde a compra (meses inteiros)
      let monthsHeld = 0;
      if (p.purchasedAt) {
        const ms = now - new Date(p.purchasedAt).getTime();
        monthsHeld = Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24 * 30.4375)));
      }
      const received = monthlyDividend * monthsHeld;
      const totalReturn = profit + received;
      const totalReturnPct = invested > 0 ? (totalReturn / invested) * 100 : 0;

      return {
        ...p,
        fii: { ...fii, price, lastDividend: lastDiv, dividendYield: dy },
        invested,
        current,
        monthlyDividend,
        yearlyDividend,
        profit,
        profitPct,
        received,
        monthsHeld,
        totalReturn,
        totalReturnPct,
        live: !!live,
        change,
      };
    })
    .filter(Boolean) as Array<
    Position & {
      fii: NonNullable<ReturnType<typeof getFII>>;
      invested: number;
      current: number;
      monthlyDividend: number;
      yearlyDividend: number;
      profit: number;
      profitPct: number;
      received: number;
      monthsHeld: number;
      totalReturn: number;
      totalReturnPct: number;
      live: boolean;
      change: number;
    }
  >;

  const totals = enriched.reduce(
    (acc, p) => {
      acc.invested += p.invested;
      acc.current += p.current;
      acc.monthly += p.monthlyDividend;
      acc.received += p.received;
      return acc;
    },
    { invested: 0, current: 0, monthly: 0, received: 0 }
  );

  const profit = totals.current - totals.invested;
  const profitPct = totals.invested > 0 ? (profit / totals.invested) * 100 : 0;
  const yearly = totals.monthly * 12;
  const yieldOnCost = totals.invested > 0 ? (yearly / totals.invested) * 100 : 0;

  const withWeights = enriched.map((p) => ({
    ...p,
    weight: totals.current > 0 ? (p.current / totals.current) * 100 : 0,
  }));

  return {
    ready,
    positions: withWeights,
    totals: { ...totals, profit, profitPct, yearly, yieldOnCost },
    addOrUpdate,
    remove,
    clearAll,
    setAll: persist,
    cloudSynced: !!user,
    quotes,
    quotesLoading,
    quotesError,
    quotesUpdatedAt,
    refreshQuotes,
  };
}
