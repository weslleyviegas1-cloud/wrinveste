import { createFileRoute } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, X, Eraser } from "lucide-react";
import { useState } from "react";

import { AppHeader } from "@/components/AppHeader";
import { usePortfolio } from "@/hooks/usePortfolio";
import { FIIS } from "@/data/fiis";
import { brl, num, pct } from "@/lib/format";
import { useQuotes } from "@/hooks/useQuotes";

export const Route = createFileRoute("/carteira")({
  head: () => ({
    meta: [
      { title: "Carteira — WR Investe" },
      { name: "description", content: "Gerencie seus Fundos Imobiliários e acompanhe o desempenho." },
    ],
  }),
  component: Carteira,
});

type Mode = "valor" | "cotas";

function Carteira() {
  const { positions, totals, addOrUpdate, remove, clearAll } = usePortfolio();
  const [open, setOpen] = useState(false);
  const [ticker, setTicker] = useState("MXRF11");
  const [mode, setMode] = useState<Mode>("valor");
  const [valor, setValor] = useState("");
  const [cotas, setCotas] = useState("");

  // O preço de entrada vem exclusivamente da cotação obtida pelo serviço de mercado.
  const { quotes: liveQuotes, loading: liveLoading, updatedAt: quotesUpdatedAt } = useQuotes(open ? [ticker] : []);
  const livePrice = liveQuotes[ticker]?.price;
  const validLivePrice = typeof livePrice === "number" && Number.isFinite(livePrice) && livePrice > 0;
  const requestedAmount = Number(valor);
  const requestedShares = Number(cotas);
  const calculatedShares = mode === "valor"
    ? (validLivePrice && requestedAmount > 0 ? Math.floor(requestedAmount / livePrice) : 0)
    : (Number.isInteger(requestedShares) && requestedShares > 0 ? requestedShares : 0);
  const calculatedInvested = calculatedShares * (validLivePrice ? livePrice : 0);
  const remainingAmount = mode === "valor" && requestedAmount > 0 ? Math.max(0, requestedAmount - calculatedInvested) : 0;

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!validLivePrice || calculatedShares <= 0) return;
    addOrUpdate(ticker, calculatedShares, livePrice);
    setOpen(false);
    setValor("");
    setCotas("");
  }

  return (
    <div className="px-5 sm:px-8">
      <AppHeader title="Carteira" subtitle={`${positions.length} fundos · ${brl(totals.current)}`} />

      <div className="flex gap-2">
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setOpen(true)}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl gradient-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow-green)] transition-transform"
        >
          <Plus className="h-4 w-4" /> Adicionar Fundo
        </motion.button>
        {positions.length > 0 && (
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => {
              if (confirm("Tem certeza que deseja zerar toda a carteira? Esta ação não pode ser desfeita.")) {
                clearAll();
              }
            }}
            className="flex items-center justify-center gap-2 rounded-2xl glass px-4 text-xs font-semibold text-muted-foreground transition-colors hover:text-danger"
            title="Zerar carteira"
          >
            <Eraser className="h-4 w-4" />
          </motion.button>
        )}
      </div>

      <section className="mt-5 space-y-3">
        {positions.length === 0 ? (
          <div className="rounded-2xl glass p-8 text-center text-sm text-muted-foreground">
            Nenhum fundo na carteira. Adicione seu primeiro FII.
          </div>
        ) : (
          positions.map((p, i) => (
            <motion.article
              key={p.ticker}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              whileHover={{ y: -2 }}
              className="group relative overflow-hidden rounded-2xl glass p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-base font-semibold">{p.ticker}</h3>
                    <span className="rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                      {p.fii.segment}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{p.fii.name}</p>
                </div>
                <button
                  onClick={() => remove(p.ticker)}
                  className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-danger/10 hover:text-danger"
                  aria-label="Remover"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4">
                <Mini label="Cotas" value={num(p.shares, 2)} />
                <Mini label="Investido" value={brl(p.invested)} />
                <Mini label="Atual" value={brl(p.current)} />
                <Mini
                  label="Resultado"
                  value={`${p.profit >= 0 ? "+" : ""}${pct(p.profitPct)}`}
                  tone={p.profit >= 0 ? "success" : "danger"}
                />
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-white/[0.03] p-3">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Dividendos / mês
                  </p>
                  <p className="text-sm font-semibold tabular text-primary">
                    {brl(p.monthlyDividend)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Já recebido {p.monthsHeld > 0 ? `(${p.monthsHeld}m)` : ""}
                  </p>
                  <p className="text-sm font-semibold tabular text-primary">
                    {brl(p.received)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Retorno total
                  </p>
                  <p className={`text-sm font-semibold tabular ${p.totalReturn >= 0 ? "text-success" : "text-danger"}`}>
                    {brl(p.totalReturn)} ({pct(p.totalReturnPct)})
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    % carteira
                  </p>
                  <p className="text-sm font-semibold tabular">{pct(p.weight, 1)}</p>
                </div>
              </div>

              <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-white/5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(p.weight, 100)}%` }}
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  className="h-full gradient-primary"
                />
              </div>
            </motion.article>
          ))
        )}
      </section>

      {/* MODAL */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center"
            onClick={() => setOpen(false)}
          >
            <motion.form
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
              onClick={(e) => e.stopPropagation()}
              onSubmit={handleAdd}
              className="w-full max-w-md rounded-t-3xl glass-strong p-5 sm:rounded-3xl"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg font-semibold">Adicionar Fundo</h3>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-white/5"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <label className="mt-4 block text-xs uppercase tracking-wider text-muted-foreground">
                Ticker
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

              <div className="mt-4 inline-flex w-full rounded-xl bg-white/5 p-1">
                {(["valor", "cotas"] as Mode[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${
                      mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {m === "valor" ? "Por valor (R$)" : "Por quantidade"}
                  </button>
                ))}
              </div>

              <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-muted-foreground">Cotação de mercado</span>
                  <span className="text-sm font-semibold tabular">
                    {liveLoading && !validLivePrice ? "Consultando..." : validLivePrice ? brl(livePrice) : "Indisponível"}
                  </span>
                </div>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  {validLivePrice
                    ? "Preço preenchido automaticamente pela última cotação disponível. Não é necessário informar preço manual."
                    : "Aguardando cotação válida. O cadastro ficará indisponível até obter um preço para evitar valores incorretos."}
                  {quotesUpdatedAt ? ` Atualizado na consulta: ${new Date(quotesUpdatedAt).toLocaleString("pt-BR")}.` : ""}
                </p>
              </div>

              {mode === "valor" ? (
                <Field
                  label="Quanto deseja investir (R$)"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={valor}
                  onChange={setValor}
                  placeholder="Ex.: 1000,00"
                />
              ) : (
                <Field
                  label="Quantidade de cotas"
                  type="number"
                  min="1"
                  step="1"
                  value={cotas}
                  onChange={setCotas}
                  placeholder="Ex.: 10"
                />
              )}

              {validLivePrice && calculatedShares > 0 && (
                <div className="mt-3 space-y-2 rounded-xl bg-primary/5 p-3 text-xs">
                  <div className="flex justify-between gap-3"><span className="text-muted-foreground">Quantidade de cotas</span><b>{num(calculatedShares, 0)}</b></div>
                  <div className="flex justify-between gap-3"><span className="text-muted-foreground">Preço por cota</span><b>{brl(livePrice)}</b></div>
                  <div className="flex justify-between gap-3"><span className="text-muted-foreground">Total calculado</span><b className="text-primary">{brl(calculatedInvested)}</b></div>
                  {mode === "valor" && remainingAmount > 0 && (
                    <p className="border-t border-white/10 pt-2 text-[11px] text-muted-foreground">
                      Saldo não utilizado: {brl(remainingAmount)}. FIIs são negociados em cotas inteiras no mercado à vista.
                    </p>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={!validLivePrice || calculatedShares <= 0 || liveLoading}
                className="mt-5 w-full rounded-xl gradient-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow-green)] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Adicionar {calculatedShares > 0 ? `${num(calculatedShares, 0)} cotas` : "à carteira"}
              </button>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Mini({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "success" | "danger";
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p
        className={`text-sm font-semibold tabular ${
          tone === "success" ? "text-success" : tone === "danger" ? "text-danger" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  ...rest
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value">) {
  return (
    <label className="mt-4 block">
      <span className="block text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <input
        {...rest}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary/50"
      />
    </label>
  );
}
