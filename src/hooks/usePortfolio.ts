import { useEffect, useState, useCallback } from "react";
import { getFII } from "@/data/fiis";

export interface Position {
  ticker: string;
  shares: number;
  avgPrice: number; // preço médio por cota
}

const KEY = "fii.portfolio.v1";

function read(): Position[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return seed();
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function seed(): Position[] {
  // Carteira de exemplo para primeira experiência
  const initial: Position[] = [
    { ticker: "MXRF11", shares: 320, avgPrice: 9.8 },
    { ticker: "HGLG11", shares: 18, avgPrice: 158.0 },
    { ticker: "KNCR11", shares: 25, avgPrice: 100.2 },
    { ticker: "VISC11", shares: 22, avgPrice: 104.5 },
  ];
  if (typeof window !== "undefined") {
    window.localStorage.setItem(KEY, JSON.stringify(initial));
  }
  return initial;
}

export function usePortfolio() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setPositions(read());
    setReady(true);
  }, []);

  const persist = useCallback((next: Position[]) => {
    setPositions(next);
    window.localStorage.setItem(KEY, JSON.stringify(next));
  }, []);

  const addOrUpdate = useCallback(
    (ticker: string, shares: number, avgPrice: number) => {
      const t = ticker.toUpperCase();
      setPositions((curr) => {
        const existing = curr.find((p) => p.ticker === t);
        let next: Position[];
        if (existing) {
          const totalShares = existing.shares + shares;
          const newAvg =
            totalShares > 0
              ? (existing.shares * existing.avgPrice + shares * avgPrice) / totalShares
              : avgPrice;
          next = curr.map((p) =>
            p.ticker === t ? { ...p, shares: totalShares, avgPrice: newAvg } : p
          );
        } else {
          next = [...curr, { ticker: t, shares, avgPrice }];
        }
        window.localStorage.setItem(KEY, JSON.stringify(next));
        return next;
      });
    },
    []
  );

  const remove = useCallback((ticker: string) => {
    setPositions((curr) => {
      const next = curr.filter((p) => p.ticker !== ticker);
      window.localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  // Cálculos derivados
  const enriched = positions
    .map((p) => {
      const fii = getFII(p.ticker);
      if (!fii) return null;
      const invested = p.shares * p.avgPrice;
      const current = p.shares * fii.price;
      const monthlyDividend = p.shares * fii.lastDividend;
      const yearlyDividend = monthlyDividend * 12;
      const profit = current - invested;
      const profitPct = invested > 0 ? (profit / invested) * 100 : 0;
      return { ...p, fii, invested, current, monthlyDividend, yearlyDividend, profit, profitPct };
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
    }
  >;

  const totals = enriched.reduce(
    (acc, p) => {
      acc.invested += p.invested;
      acc.current += p.current;
      acc.monthly += p.monthlyDividend;
      return acc;
    },
    { invested: 0, current: 0, monthly: 0 }
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
    setAll: persist,
  };
}
