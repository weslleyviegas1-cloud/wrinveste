import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useMemo, useState } from "react";
import { ArrowDownRight, ArrowUpRight, Coins, Wallet, PiggyBank, Calendar, Radio, RefreshCw, FileDown } from "lucide-react";

import { AppHeader } from "@/components/AppHeader";
import { usePortfolio, type PortfolioSnapshot } from "@/hooks/usePortfolio";
import { brl, pct } from "@/lib/format";
import { exportPortfolioPdf } from "@/lib/exportPdf";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — WR Investe" },
      {
        name: "description",
        content: "Visão geral da sua carteira de Fundos Imobiliários, lucro e renda passiva.",
      },
    ],
  }),
  component: Dashboard,
});

const PIE_COLORS = [
  "oklch(0.78 0.22 145)",
  "oklch(0.62 0.22 260)",
  "oklch(0.78 0.18 80)",
  "oklch(0.7 0.22 320)",
  "oklch(0.7 0.2 30)",
  "oklch(0.7 0.18 200)",
  "oklch(0.75 0.2 110)",
  "oklch(0.65 0.22 350)",
];

type HistoryRange = "1M" | "3M" | "6M" | "1A" | "Tudo";

function buildPortfolioSeries(history: PortfolioSnapshot[], range: HistoryRange) {
  const now = Date.now();
  const days: Record<Exclude<HistoryRange, "Tudo">, number> = { "1M": 30, "3M": 90, "6M": 180, "1A": 365 };
  const cutoff = range === "Tudo" ? 0 : now - days[range] * 24 * 60 * 60 * 1000;
  return history
    .filter((point) => new Date(point.capturedAt).getTime() >= cutoff)
    .map((point) => ({
      date: new Date(point.capturedAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      timestamp: new Date(point.capturedAt).getTime(),
      value: point.totalValue,
      invested: point.investedValue,
    }))
    .sort((a, b) => a.timestamp - b.timestamp);
}

function Dashboard() {
  const { positions, totals, ready, history, quotesLoading, quotesUpdatedAt, quotesError, refreshQuotes } = usePortfolio();
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  const [historyRange, setHistoryRange] = useState<HistoryRange>("1M");
  const series = useMemo(() => buildPortfolioSeries(history, historyRange), [history, historyRange]);

  const pieData = positions.map((p) => ({ name: p.ticker, value: p.current }));
  const profitPositive = totals.profit >= 0;
  const isEmpty = ready && positions.length === 0;
  const updatedLabel = quotesUpdatedAt
    ? new Date(quotesUpdatedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : null;

  return (
    <div className="px-5 sm:px-8">
      <AppHeader title="Olá, Investidor" subtitle="Sua visão geral de hoje" />

      {/* LIVE STATUS */}
      {!isEmpty && (
        <div className="mt-2 flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className={`absolute inline-flex h-full w-full rounded-full ${quotesError ? "bg-destructive" : "bg-success"} opacity-60 animate-ping`} />
              <span className={`relative inline-flex h-2 w-2 rounded-full ${quotesError ? "bg-destructive" : "bg-success"}`} />
            </span>
            <Radio className="h-3 w-3" />
            <span className="tabular">
              {quotesError ? "Sem conexão" : updatedLabel ? `Cotações ao vivo · ${updatedLabel}` : "Buscando cotações..."}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {positions.length > 0 && (
              <button
                onClick={() =>
                  exportPortfolioPdf(
                    positions.map((p) => ({
                      ticker: p.ticker,
                      name: p.fii.name,
                      segment: p.fii.segment,
                      shares: p.shares,
                      avgPrice: p.avgPrice,
                      price: p.fii.price,
                      invested: p.invested,
                      current: p.current,
                      monthlyDividend: p.monthlyDividend,
                      yearlyDividend: p.yearlyDividend,
                      profit: p.profit,
                      profitPct: p.profitPct,
                      weight: p.weight,
                      live: p.live,
                      received: p.received,
                      monthsHeld: p.monthsHeld,
                      totalReturn: p.totalReturn,
                      totalReturnPct: p.totalReturnPct,
                    })),
                    {
                      invested: totals.invested,
                      current: totals.current,
                      monthly: totals.monthly,
                      yearly: totals.yearly,
                      profit: totals.profit,
                      profitPct: totals.profitPct,
                      yieldOnCost: totals.yieldOnCost,
                      received: totals.received,
                    }
                  )
                }
                className="flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-1 text-primary hover:bg-primary/25 transition"
                aria-label="Exportar relatório PDF"
              >
                <FileDown className="h-3 w-3" />
                <span>PDF</span>
              </button>
            )}
            <button
              onClick={() => refreshQuotes()}
              className="flex items-center gap-1 rounded-full px-2 py-1 hover:bg-white/5 transition"
              aria-label="Atualizar cotações"
            >
              <RefreshCw className={`h-3 w-3 ${quotesLoading ? "animate-spin" : ""}`} />
              <span>Atualizar</span>
            </button>
          </div>
        </div>
      )}

      {/* HERO BALANCE */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-3xl glass-strong p-6 sm:p-7"
      >
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-accent/20 blur-3xl" />

        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Patrimônio atual</p>
        <div className="mt-1 flex items-baseline gap-3">
          <h2 className="font-display text-4xl font-semibold tracking-tight tabular sm:text-5xl">
            {ready ? brl(totals.current) : "R$ —"}
          </h2>
        </div>
        {!isEmpty && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <div
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                profitPositive
                  ? "bg-success/15 text-success"
                  : "bg-danger/15 text-danger"
              }`}
            >
              {profitPositive ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
              {brl(Math.abs(totals.profit))} ({pct(totals.profitPct)})
            </div>
            <span className="text-xs text-muted-foreground">vs. investido {brl(totals.invested)}</span>
          </div>
        )}

        {isEmpty ? (
          <div className="mt-5 rounded-2xl border border-dashed border-white/10 p-5 text-center">
            <p className="text-sm font-medium">Você ainda não tem investimentos.</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Adicione seu primeiro fundo na aba Carteira para começar a acompanhar.
            </p>
          </div>
        ) : (
          <>
            <div className="mt-5 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Evolução do patrimônio</p>
                <p className="text-xs text-muted-foreground">Histórico registrado · {series.length} pontos</p>
              </div>
              <div className="flex gap-1 rounded-full bg-white/5 p-1">
                {(["1M", "3M", "6M", "1A", "Tudo"] as HistoryRange[]).map((range) => (
                  <button key={range} onClick={() => setHistoryRange(range)}
                    className={`rounded-full px-2 py-1 text-[10px] transition ${historyRange === range ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                    {range}
                  </button>
                ))}
              </div>
            </div>
            <div className="-mx-2 mt-3 h-40">
              {series.length < 2 ? (
                <div className="flex h-full flex-col items-center justify-center rounded-xl border border-dashed border-white/10 px-4 text-center">
                  <p className="text-sm font-medium">Histórico sendo construído</p>
                  <p className="mt-1 max-w-md text-xs text-muted-foreground">
                    {series.length === 1
                      ? "O primeiro registro foi salvo. Novos pontos serão adicionados após as próximas atualizações de cotação."
                      : "Ainda não há registros históricos. O gráfico começará a ganhar forma após as primeiras capturas."}
                  </p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={series} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                    <defs>
                      <linearGradient id="portfolioHistoryFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#eab308" stopOpacity={0.42} />
                        <stop offset="100%" stopColor="#eab308" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tick={{ fill: "oklch(0.7 0 0)", fontSize: 10 }} axisLine={false} tickLine={false} minTickGap={24} />
                    <YAxis hide domain={["dataMin - 10", "dataMax + 10"]} />
                    <Tooltip
                      contentStyle={{ background: "oklch(0.18 0 0 / 0.96)", border: "1px solid oklch(1 0 0 / 0.1)", borderRadius: 12, color: "oklch(0.985 0 0)", fontSize: 12 }}
                      formatter={(value, name) => [brl(Number(value)), name === "invested" ? "Total investido" : "Patrimônio"]}
                    />
                    <Area type="monotone" dataKey="invested" stroke="#64748b" strokeWidth={1.5} strokeDasharray="4 4" fill="none" dot={false} />
                    <Area type="monotone" dataKey="value" stroke="#eab308" strokeWidth={2.5} fill="url(#portfolioHistoryFill)" dot={false} activeDot={{ r: 4 }} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </>
        )}
      </motion.section>

      {/* STATS GRID */}
      <section className="mt-4 grid grid-cols-2 gap-3 sm:gap-4">
        <StatCard
          icon={<Wallet className="h-4 w-4" />}
          label="Investido"
          value={brl(totals.invested)}
          tint="accent"
          delay={0.05}
        />
        <StatCard
          icon={<PiggyBank className="h-4 w-4" />}
          label="Total recebido"
          value={brl(totals.received)}
          tint="primary"
          delay={0.08}
        />
        <StatCard
          icon={<Coins className="h-4 w-4" />}
          label="Renda mensal"
          value={brl(totals.monthly)}
          tint="primary"
          delay={0.12}
        />
        <StatCard
          icon={<Calendar className="h-4 w-4" />}
          label="Renda anual"
          value={brl(totals.yearly)}
          tint="primary"
          delay={0.16}
        />
        <StatCard
          icon={<PiggyBank className="h-4 w-4" />}
          label="Yield on Cost"
          value={pct(totals.yieldOnCost)}
          tint="accent"
          delay={0.2}
        />
        <StatCard
          icon={<ArrowUpRight className="h-4 w-4" />}
          label="Variação cota"
          value={`${totals.profit >= 0 ? "+" : ""}${pct(totals.profitPct)}`}
          tint={totals.profit >= 0 ? "primary" : "accent"}
          delay={0.24}
        />
      </section>

      {/* PORTFOLIO CIRCLE */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="mt-5 rounded-3xl glass-strong p-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display text-lg font-semibold">Distribuição da Carteira</h3>
            <p className="text-xs text-muted-foreground">Toque em um fundo para ver detalhes</p>
          </div>
        </div>

        {positions.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Sua carteira está vazia. Adicione um fundo na aba Carteira.
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-1 items-center gap-4 sm:grid-cols-[220px_1fr]">
            <div className="relative mx-auto h-[220px] w-[220px]">
              <div className="absolute inset-0 animate-spin-slow rounded-full bg-[conic-gradient(from_0deg,oklch(0.78_0.22_145/0.25),transparent_40%,oklch(0.62_0.22_260/0.25),transparent_70%)] blur-md" />
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    innerRadius={62}
                    outerRadius={92}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                    onMouseEnter={(_, idx) => setActiveIdx(idx)}
                    onMouseLeave={() => setActiveIdx(null)}
                    animationDuration={900}
                  >
                    {pieData.map((_, i) => (
                      <Cell
                        key={i}
                        fill={PIE_COLORS[i % PIE_COLORS.length]}
                        opacity={activeIdx === null || activeIdx === i ? 1 : 0.35}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  {activeIdx !== null ? positions[activeIdx]?.ticker : "Total"}
                </span>
                <span className="font-display text-lg font-semibold tabular">
                  {activeIdx !== null
                    ? pct(positions[activeIdx]?.weight ?? 0, 1)
                    : brl(totals.current)}
                </span>
              </div>
            </div>

            <ul className="space-y-2">
              {positions.map((p, i) => (
                <li
                  key={p.ticker}
                  onMouseEnter={() => setActiveIdx(i)}
                  onMouseLeave={() => setActiveIdx(null)}
                  className={`flex items-center justify-between rounded-xl border px-3 py-2 transition-all ${
                    activeIdx === i
                      ? "border-primary/40 bg-primary/5"
                      : "border-white/5 bg-white/[0.02]"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{p.ticker}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{p.fii.segment}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold tabular">{pct(p.weight, 1)}</p>
                    <p className="text-[11px] text-muted-foreground tabular">{brl(p.current)}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="mt-5 text-[11px] leading-relaxed text-muted-foreground">
          * Valores estimados baseados em dados ilustrativos. Não constitui recomendação de
          investimento. Rentabilidade passada não garante resultados futuros.
        </p>
      </motion.section>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  tint,
  delay = 0,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tint: "primary" | "accent";
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -2 }}
      className="relative overflow-hidden rounded-2xl glass p-4"
    >
      <div
        className={`absolute -right-8 -top-8 h-20 w-20 rounded-full blur-2xl ${
          tint === "primary" ? "bg-primary/25" : "bg-accent/25"
        }`}
      />
      <div className="relative flex items-center gap-2 text-muted-foreground">
        <span
          className={`flex h-7 w-7 items-center justify-center rounded-lg ${
            tint === "primary" ? "bg-primary/15 text-primary" : "bg-accent/15 text-accent"
          }`}
        >
          {icon}
        </span>
        <span className="text-[11px] uppercase tracking-wider">{label}</span>
      </div>
      <p className="relative mt-2 font-display text-xl font-semibold tabular">{value}</p>
    </motion.div>
  );
}
