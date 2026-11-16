import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, RefreshCw } from "lucide-react";

import { AppHeader } from "@/components/AppHeader";
import { FIIS, TYPE_LABEL, type FII } from "@/data/fiis";
import { brl, pct } from "@/lib/format";
import { useQuotes } from "@/hooks/useQuotes";

export const Route = createFileRoute("/fundos")({
  head: () => ({
    meta: [
      { title: "Pesquisar FIIs — WR Investe" },
      { name: "description", content: "Pesquise Fundos Imobiliários por ticker ou nome e consulte as últimas cotações disponíveis." },
    ],
  }),
  component: Fundos,
});

type Filter = "score" | "yield" | "estabilidade" | "menorRisco";

const filters: { id: Filter; label: string }[] = [
  { id: "score", label: "Melhores análises" },
  { id: "yield", label: "Maior DY" },
  { id: "estabilidade", label: "Estabilidade" },
  { id: "menorRisco", label: "Menor risco" },
];

interface EnrichedFII extends FII {
  livePrice: number | null;
  liveDividend: number | null;
  liveDY: number | null;
  hasQuote: boolean;
}

function sortBy(list: EnrichedFII[], filter: Filter) {
  const arr = [...list];
  const descNullable = (a: number | null, b: number | null) =>
    a === null ? (b === null ? 0 : 1) : b === null ? -1 : b - a;

  switch (filter) {
    case "score":
      return arr.sort((a, b) =>
        Number(b.metricsVerified) - Number(a.metricsVerified) ||
        (b.metricsVerified ? b.score - a.score : 0)
      );
    case "yield":
      return arr.sort((a, b) => descNullable(a.liveDY, b.liveDY));
    case "estabilidade":
      return arr.sort((a, b) =>
        Number(b.metricsVerified) - Number(a.metricsVerified) ||
        (b.metricsVerified ? b.consistency - a.consistency : 0)
      );
    case "menorRisco":
      return arr.sort((a, b) =>
        Number(b.metricsVerified) - Number(a.metricsVerified) ||
        (a.metricsVerified && b.metricsVerified ? a.volatility - b.volatility : 0)
      );
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

const ALL_TICKERS = FIIS.map((f) => f.ticker);

function Fundos() {
  const [filter, setFilter] = useState<Filter>("score");
  const [query, setQuery] = useState("");
  const { quotes, loading, error, updatedAt, refresh } = useQuotes(ALL_TICKERS);

  const enriched = useMemo<EnrichedFII[]>(
    () => FIIS.map((f) => {
      const quote = quotes[f.ticker];
      return {
        ...f,
        livePrice: quote?.price ?? null,
        liveDividend: quote?.lastDividend ?? null,
        liveDY: quote?.dividendYield ?? null,
        hasQuote: Boolean(quote),
      };
    }),
    [quotes]
  );

  const list = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("pt-BR");
    const filtered = enriched.filter((f) =>
      !normalized ||
      f.ticker.toLocaleLowerCase("pt-BR").includes(normalized) ||
      f.name.toLocaleLowerCase("pt-BR").includes(normalized)
    );
    return sortBy(filtered, filter);
  }, [enriched, filter, query]);

  const checkedAt = updatedAt
    ? new Date(updatedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <div className="px-5 sm:px-8">
      <AppHeader title="Pesquisar FIIs" subtitle={`${FIIS.length} fundos no catálogo · busque por ticker ou nome`} />

      <div className="mb-3 flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <span>
          {loading ? "Consultando provedor…" : checkedAt ? `Última consulta: ${checkedAt}` : "Cotações ainda não consultadas"}
        </span>
        <button
          type="button"
          onClick={() => void refresh()}
          disabled={loading}
          className="flex shrink-0 items-center gap-1 rounded-full px-2 py-1 transition hover:bg-white/5 disabled:opacity-50"
          aria-label="Atualizar cotações"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
          <span>Atualizar</span>
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Digite o ticker (ex.: MXRF11) ou nome do fundo…"
          aria-label="Pesquisar fundos imobiliários"
          className="w-full rounded-2xl glass border-white/10 py-3 pl-10 pr-4 text-sm outline-none focus:border-primary/50"
        />
      </div>

      <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto py-1">
        {filters.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            aria-pressed={filter === item.id}
            className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              filter === item.id
                ? "border-primary/50 bg-primary/15 text-primary"
                : "border-white/10 bg-white/[0.03] text-muted-foreground hover:text-foreground"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <span>{list.length} resultado(s)</span>
        {error && <span role="status" className="text-warning">Falha ao atualizar cotações</span>}
      </div>

      <section className="mt-3 space-y-2.5" aria-live="polite">
        {list.map((f) => (
          <article key={f.ticker} className="rounded-2xl glass p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-base font-semibold">{f.ticker}</h3>
                  <span className="rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                    {TYPE_LABEL[f.type]}
                  </span>
                  <span className="text-[11px] text-muted-foreground">· {f.segment}</span>
                </div>
                <p className="truncate text-xs text-muted-foreground">{f.name}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Última cotação</p>
                <p className="text-sm font-semibold tabular">
                  {f.livePrice === null ? "Indisponível" : brl(f.livePrice)}
                </p>
                {quotes[f.ticker]?.marketTime && (
                  <p className="text-[10px] text-muted-foreground">
                    Negociação: {new Date(quotes[f.ticker].marketTime!).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">DY anual</p>
                <p className="text-sm font-semibold tabular text-primary">{f.liveDY === null ? "—" : pct(f.liveDY)}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Último provento</p>
                <p className="text-sm font-semibold tabular text-primary">{f.liveDividend === null ? "—" : brl(f.liveDividend)}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Consistência</p>
                <p className="text-sm font-semibold tabular">{f.metricsVerified ? f.consistency.toFixed(1) : "Sem análise"}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Score</p>
                <p className={`text-sm font-semibold tabular ${f.metricsVerified ? scoreColor(f.score) : "text-muted-foreground"}`}>
                  {f.metricsVerified ? f.score.toFixed(1) : "—"}
                </p>
              </div>
            </div>

            {f.metricsVerified && (
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                <div
                  className={`h-full ${scoreBar(f.score)}`}
                  style={{ width: `${Math.max(0, Math.min(100, (f.score / 10) * 100))}%` }}
                />
              </div>
            )}
          </article>
        ))}

        {list.length === 0 && (
          <div className="rounded-2xl glass px-4 py-10 text-center">
            <Search className="mx-auto mb-2 h-5 w-5 text-muted-foreground" />
            <p className="text-sm font-medium">Nenhum fundo encontrado</p>
            <p className="mt-1 text-xs text-muted-foreground">Confira o ticker ou tente pesquisar pelo nome.</p>
          </div>
        )}
      </section>

      <p className="mt-6 text-[11px] leading-relaxed text-muted-foreground">
        As cotações são obtidas do Yahoo Finance e podem ter atraso; não são garantidas em tempo real.
        O horário de consulta não representa necessariamente o horário da última negociação.
        DY e proventos são calculados a partir do histórico disponibilizado pelo provedor. Scores e métricas
        só aparecem para fundos com análise cadastrada; não são recomendação de investimento.
      </p>
    </div>
  );
}
