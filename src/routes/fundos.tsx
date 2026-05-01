import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { AppHeader } from "@/components/AppHeader";
import { FIIS, TYPE_LABEL, type FII } from "@/data/fiis";
import { brl, pct } from "@/lib/format";

export const Route = createFileRoute("/fundos")({
  head: () => ({
    meta: [
      { title: "Fundos — FII Premium" },
      { name: "description", content: "Explore e analise dezenas de Fundos Imobiliários com score inteligente." },
    ],
  }),
  component: Fundos,
});

type Filter = "score" | "yield" | "estabilidade" | "menorRisco";

const filters: { id: Filter; label: string }[] = [
  { id: "score", label: "Melhores" },
  { id: "yield", label: "Maior rendimento" },
  { id: "estabilidade", label: "Estabilidade" },
  { id: "menorRisco", label: "Menor risco" },
];

function sortBy(list: FII[], filter: Filter) {
  const arr = [...list];
  switch (filter) {
    case "score":
      return arr.sort((a, b) => b.score - a.score);
    case "yield":
      return arr.sort((a, b) => b.dividendYield - a.dividendYield);
    case "estabilidade":
      return arr.sort((a, b) => b.consistency - a.consistency);
    case "menorRisco":
      return arr.sort((a, b) => a.volatility - b.volatility);
  }
}

function scoreColor(score: number) {
  if (score >= 8.5) return "text-success";
  if (score >= 7.5) return "text-yellow-400";
  return "text-danger";
}

function scoreBar(score: number) {
  if (score >= 8.5) return "gradient-primary";
  if (score >= 7.5) return "bg-yellow-400";
  return "bg-danger";
}

function Fundos() {
  const [filter, setFilter] = useState<Filter>("score");
  const [q, setQ] = useState("");

  const list = useMemo(() => {
    const filtered = FIIS.filter(
      (f) =>
        f.ticker.toLowerCase().includes(q.toLowerCase()) ||
        f.name.toLowerCase().includes(q.toLowerCase())
    );
    return sortBy(filtered, filter);
  }, [filter, q]);

  return (
    <div className="px-5 sm:px-8">
      <AppHeader title="Fundos" subtitle={`${FIIS.length} FIIs analisados`} />

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por ticker ou nome..."
          className="w-full rounded-2xl glass border-white/10 py-3 pl-10 pr-4 text-sm outline-none focus:border-primary/50"
        />
      </div>

      <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto py-1">
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all ${
              filter === f.id
                ? "border-primary/50 bg-primary/15 text-primary"
                : "border-white/10 bg-white/[0.03] text-muted-foreground hover:text-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <section className="mt-4 space-y-2.5">
        {list.map((f, i) => (
          <motion.article
            key={f.ticker}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.025, 0.4) }}
            whileHover={{ y: -2 }}
            className="rounded-2xl glass p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-base font-semibold">{f.ticker}</h3>
                  <span className="rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                    {TYPE_LABEL[f.type]}
                  </span>
                  <span className="text-[11px] text-muted-foreground">· {f.segment}</span>
                </div>
                <p className="text-xs text-muted-foreground truncate">{f.name}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Preço</p>
                <p className="text-sm font-semibold tabular">{brl(f.price)}</p>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">DY anual</p>
                <p className="text-sm font-semibold tabular text-primary">{pct(f.dividendYield)}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Consistência</p>
                <p className="text-sm font-semibold tabular">{f.consistency.toFixed(1)}/10</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Score</p>
                <p className={`text-sm font-semibold tabular ${scoreColor(f.score)}`}>
                  {f.score.toFixed(1)}
                </p>
              </div>
            </div>

            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(f.score / 10) * 100}%` }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                className={`h-full ${scoreBar(f.score)}`}
              />
            </div>
          </motion.article>
        ))}
      </section>

      <p className="mt-6 text-[11px] leading-relaxed text-muted-foreground">
        * Score calculado a partir de dividend yield, consistência histórica e volatilidade. Dados
        ilustrativos para fins de estudo. Não é recomendação de investimento.
      </p>
    </div>
  );
}
