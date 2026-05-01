import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { Sparkles } from "lucide-react";

import { AppHeader } from "@/components/AppHeader";
import { FIIS, getFII } from "@/data/fiis";
import { brl, num, pct } from "@/lib/format";

export const Route = createFileRoute("/simulador")({
  head: () => ({
    meta: [
      { title: "Simulador — FII Premium" },
      { name: "description", content: "Simule investimentos em FIIs e veja sua renda passiva projetada." },
    ],
  }),
  component: Simulador,
});

function Simulador() {
  const [ticker, setTicker] = useState("HGLG11");
  const [valor, setValor] = useState("5000");

  const fii = getFII(ticker)!;
  const v = parseFloat(valor) || 0;

  const result = useMemo(() => {
    const cotas = v / fii.price;
    const monthly = cotas * fii.lastDividend;
    const yearly = monthly * 12;
    // Crescimento estimado em 12 meses: dividendos reinvestidos + leve apreciação
    const reinvested = (yearly + v) * 1.04; // 4% appreciation hipotética
    const growthPct = v > 0 ? ((reinvested - v) / v) * 100 : 0;
    return { cotas, monthly, yearly, reinvested, growthPct };
  }, [v, fii]);

  return (
    <div className="px-5 sm:px-8">
      <AppHeader title="Simulador" subtitle="Projete seus dividendos e crescimento" />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl glass-strong p-5 sm:p-6"
      >
        <label className="block text-xs uppercase tracking-wider text-muted-foreground">
          Fundo
        </label>
        <select
          value={ticker}
          onChange={(e) => setTicker(e.target.value)}
          className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-primary/50"
        >
          {FIIS.map((f) => (
            <option key={f.ticker} value={f.ticker} className="bg-[#1a1a1a]">
              {f.ticker} — {f.name}
            </option>
          ))}
        </select>

        <div className="mt-3 flex items-center justify-between rounded-xl bg-white/[0.03] px-3 py-2 text-xs">
          <span className="text-muted-foreground">Preço atual</span>
          <span className="font-semibold tabular">{brl(fii.price)}</span>
        </div>
        <div className="mt-1 flex items-center justify-between rounded-xl bg-white/[0.03] px-3 py-2 text-xs">
          <span className="text-muted-foreground">Último dividendo / cota</span>
          <span className="font-semibold tabular text-primary">{brl(fii.lastDividend)}</span>
        </div>

        <label className="mt-5 block text-xs uppercase tracking-wider text-muted-foreground">
          Valor a investir
        </label>
        <div className="mt-1 flex items-center rounded-xl border border-white/10 bg-white/5 px-3 focus-within:border-primary/50">
          <span className="text-sm text-muted-foreground">R$</span>
          <input
            type="number"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            className="ml-2 w-full bg-transparent py-2.5 text-sm outline-none"
            placeholder="0"
          />
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {[1000, 5000, 10000, 25000].map((preset) => (
            <button
              key={preset}
              onClick={() => setValor(String(preset))}
              className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              {brl(preset)}
            </button>
          ))}
        </div>
      </motion.div>

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mt-4 grid grid-cols-2 gap-3"
      >
        <Result label="Cotas estimadas" value={num(result.cotas, 2)} />
        <Result label="Crescimento 12m" value={`${pct(result.growthPct)}`} accent />
        <Result label="Renda mensal" value={brl(result.monthly)} highlight />
        <Result label="Renda anual" value={brl(result.yearly)} highlight />
      </motion.section>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-4 overflow-hidden rounded-3xl glass-strong p-6"
      >
        <div className="flex items-center gap-2 text-primary">
          <Sparkles className="h-4 w-4" />
          <span className="text-xs uppercase tracking-wider">Projeção em 12 meses</span>
        </div>
        <p className="mt-2 font-display text-3xl font-semibold tabular">
          {brl(result.reinvested)}
        </p>
        <p className="text-xs text-muted-foreground">
          considerando dividendos somados e leve apreciação estimada
        </p>

        <div className="mt-5 space-y-3">
          <Bar label="Investido" value={v} max={result.reinvested || 1} tone="muted" />
          <Bar label="+ Dividendos" value={result.yearly} max={result.reinvested || 1} tone="primary" />
          <Bar
            label="+ Apreciação"
            value={Math.max(result.reinvested - v - result.yearly, 0)}
            max={result.reinvested || 1}
            tone="accent"
          />
        </div>
      </motion.div>

      <p className="mt-5 text-[11px] leading-relaxed text-muted-foreground">
        * Valores aproximados, baseados em dividendos recentes e premissas ilustrativas.
        Rentabilidade futura não é garantida. Esta ferramenta não constitui recomendação de
        investimento.
      </p>
    </div>
  );
}

function Result({
  label,
  value,
  highlight,
  accent,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  accent?: boolean;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl glass p-4">
      {highlight && (
        <div className="pointer-events-none absolute -right-6 -top-6 h-16 w-16 rounded-full bg-primary/25 blur-2xl" />
      )}
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p
        className={`mt-1 font-display text-xl font-semibold tabular ${
          highlight ? "text-primary" : accent ? "text-accent" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function Bar({
  label,
  value,
  max,
  tone,
}: {
  label: string;
  value: number;
  max: number;
  tone: "primary" | "accent" | "muted";
}) {
  const w = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const cls =
    tone === "primary" ? "gradient-primary" : tone === "accent" ? "gradient-accent" : "bg-white/15";
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold tabular">{brl(value)}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${w}%` }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className={`h-full ${cls}`}
        />
      </div>
    </div>
  );
}
