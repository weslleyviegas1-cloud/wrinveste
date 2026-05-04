import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { Sparkles, Shield, Flame, Scale, TrendingUp, Target, Lightbulb } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { usePortfolio } from "@/hooks/usePortfolio";
import { useQuotes } from "@/hooks/useQuotes";
import { FIIS } from "@/data/fiis";
import { brl, pct } from "@/lib/format";

export const Route = createFileRoute("/recomendacoes")({
  head: () => ({
    meta: [
      { title: "Recomendações Inteligentes — WR Investe" },
      { name: "description", content: "Sugestões personalizadas para investir melhor com base na sua carteira." },
    ],
  }),
  component: Recomendacoes,
});

const UNIVERSE = FIIS.map((f) => f.ticker);

function Recomendacoes() {
  const { positions, totals, ready } = usePortfolio();
  const { quotes, loading } = useQuotes(UNIVERSE);
  const [amount, setAmount] = useState<number>(1000);

  const owned = useMemo(() => new Set(positions.map((p) => p.ticker)), [positions]);

  const candidates = useMemo(() => {
    return FIIS.map((f) => {
      const q = quotes[f.ticker];
      const price = q?.price ?? f.price;
      const monthly = q?.monthlyDividend ?? f.lastDividend;
      const dy = price > 0 ? ((monthly * 12) / price) * 100 : 0;
      // Score composto: yield, consistência, baixa volatilidade
      const score =
        dy * 0.45 +
        f.consistency * 4 -
        f.volatility * 1.5 +
        f.score * 2 -
        (owned.has(f.ticker) ? 6 : 0); // diversificar
      return { fii: f, price, monthly, dy, score, live: !!q };
    }).sort((a, b) => b.score - a.score);
  }, [quotes, owned]);

  const top = candidates[0];
  const safest = [...candidates].sort((a, b) => a.fii.volatility - b.fii.volatility || b.fii.consistency - a.fii.consistency)[0];
  const mostProfitable = [...candidates].sort((a, b) => b.dy - a.dy)[0];
  const balanced = candidates.find((c) => c.fii.consistency >= 8.5 && c.dy >= 9 && c.fii.volatility <= 4) ?? candidates[1];

  // Simulação
  const sim = useMemo(() => {
    if (!top) return null;
    const shares = Math.floor(amount / top.price);
    const invested = shares * top.price;
    const monthlyIncome = shares * top.monthly;
    const yearly = monthlyIncome * 12;
    const newMonthly = totals.monthly + monthlyIncome;
    const newPatrim = totals.current + invested;
    return { shares, invested, monthlyIncome, yearly, newMonthly, newPatrim };
  }, [top, amount, totals]);

  return (
    <div className="px-5 sm:px-8 pb-32">
      <AppHeader title="Recomendações" subtitle="Sugestões inteligentes para investir melhor" />

      {/* SUGESTÃO PRINCIPAL */}
      {top && (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden rounded-3xl glass-strong p-6"
        >
          <div className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-primary/25 blur-3xl" />
          <div className="pointer-events-none absolute -left-10 -bottom-16 h-48 w-48 rounded-full bg-accent/20 blur-3xl" />

          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-primary">
            <Sparkles className="h-4 w-4" /> Sugestão de hoje
          </div>
          <div className="mt-2 flex items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-3xl font-semibold tracking-tight">{top.fii.ticker}</h2>
              <p className="text-sm text-muted-foreground">{top.fii.name} · {top.fii.segment}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Cota</p>
              <p className="font-display text-xl tabular">{brl(top.price)}</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <Mini label="DY anual" value={pct(top.dy)} accent="primary" />
            <Mini label="Pgto/mês" value={brl(top.monthly)} accent="primary" />
            <Mini label="Risco" value={top.fii.volatility <= 3.5 ? "Baixo" : top.fii.volatility <= 4.5 ? "Médio" : "Alto"} accent="accent" />
          </div>

          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            <Lightbulb className="mr-1 inline h-4 w-4 text-primary" />
            {owned.has(top.fii.ticker)
              ? "Você já possui — reforçar a posição mantém consistência de renda."
              : `Diversifica sua carteira em ${top.fii.segment.toLowerCase()}, com histórico consistente e bom DY.`}
          </p>
        </motion.section>
      )}

      {/* SIMULAÇÃO */}
      {top && sim && (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.05 }}
          className="mt-4 rounded-3xl glass p-5"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" /> Simulação
            </h3>
            <span className="text-xs text-muted-foreground">Estimativa</span>
          </div>

          <div className="mt-3">
            <label className="text-xs text-muted-foreground">Quanto pretende investir?</label>
            <div className="mt-1 flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-3">
              <span className="text-sm text-muted-foreground">R$</span>
              <input
                type="number"
                min={0}
                value={amount}
                onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))}
                className="w-full bg-transparent py-3 text-base outline-none tabular"
              />
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {[200, 500, 1000, 2000, 5000].map((v) => (
                <button
                  key={v}
                  onClick={() => setAmount(v)}
                  className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-xs hover:bg-primary/10 hover:border-primary/30 transition"
                >
                  {brl(v)}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <Mini label="Cotas" value={String(sim.shares)} accent="accent" />
            <Mini label="Investido real" value={brl(sim.invested)} accent="accent" />
            <Mini label="+Renda/mês" value={brl(sim.monthlyIncome)} accent="primary" />
            <Mini label="+Renda/ano" value={brl(sim.yearly)} accent="primary" />
          </div>

          {ready && totals.current > 0 && (
            <div className="mt-4 rounded-2xl border border-primary/20 bg-primary/5 p-3 text-sm">
              <p className="text-xs uppercase tracking-widest text-primary">Impacto na carteira</p>
              <div className="mt-1 flex justify-between">
                <span className="text-muted-foreground">Nova renda mensal</span>
                <span className="tabular font-semibold">{brl(sim.newMonthly)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Novo patrimônio</span>
                <span className="tabular font-semibold">{brl(sim.newPatrim)}</span>
              </div>
            </div>
          )}
        </motion.section>
      )}

      {/* COMPARAÇÃO */}
      <section className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <CompareCard icon={<Shield className="h-4 w-4" />} title="Mais seguro" data={safest} accent="accent" />
        <CompareCard icon={<Flame className="h-4 w-4" />} title="Mais rentável" data={mostProfitable} accent="primary" />
        <CompareCard icon={<Scale className="h-4 w-4" />} title="Equilibrado" data={balanced} accent="primary" />
      </section>

      {/* TOP 5 */}
      <section className="mt-4 rounded-3xl glass p-5">
        <h3 className="font-display text-lg font-semibold flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" /> Top 5 para considerar agora
        </h3>
        <ul className="mt-3 space-y-2">
          {candidates.slice(0, 5).map((c, i) => (
            <motion.li
              key={c.fii.ticker}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2.5 hover:border-primary/30 hover:bg-primary/5 transition"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15 text-primary text-xs font-semibold">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{c.fii.ticker}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{c.fii.segment}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm tabular font-semibold text-primary">{pct(c.dy)}</p>
                <p className="text-[11px] text-muted-foreground tabular">{brl(c.price)}</p>
              </div>
            </motion.li>
          ))}
        </ul>
        {loading && <p className="mt-3 text-center text-xs text-muted-foreground">Atualizando cotações...</p>}
      </section>

      <p className="mt-5 text-[11px] leading-relaxed text-muted-foreground">
        * Estimativas baseadas em cotações em tempo real do Yahoo Finance e no último dividendo pago. 
        Não constitui recomendação de investimento. Rentabilidade passada não garante resultados futuros.
      </p>
    </div>
  );
}

function Mini({ label, value, accent }: { label: string; value: string; accent: "primary" | "accent" }) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className={`mt-1 font-display text-base font-semibold tabular ${accent === "primary" ? "text-primary" : "text-accent"}`}>
        {value}
      </p>
    </div>
  );
}

function CompareCard({
  icon,
  title,
  data,
  accent,
}: {
  icon: React.ReactNode;
  title: string;
  data: { fii: { ticker: string; name: string; segment: string }; price: number; dy: number; monthly: number } | undefined;
  accent: "primary" | "accent";
}) {
  if (!data) return null;
  return (
    <motion.div
      whileHover={{ y: -3 }}
      className="rounded-2xl glass p-4"
    >
      <div className={`flex items-center gap-2 text-xs uppercase tracking-widest ${accent === "primary" ? "text-primary" : "text-accent"}`}>
        {icon} {title}
      </div>
      <p className="mt-2 font-display text-xl font-semibold">{data.fii.ticker}</p>
      <p className="text-xs text-muted-foreground truncate">{data.fii.segment}</p>
      <div className="mt-3 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">DY</span>
        <span className="tabular font-semibold text-primary">{pct(data.dy)}</span>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Cota</span>
        <span className="tabular">{brl(data.price)}</span>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Pgto/mês</span>
        <span className="tabular text-primary">{brl(data.monthly)}</span>
      </div>
    </motion.div>
  );
}
