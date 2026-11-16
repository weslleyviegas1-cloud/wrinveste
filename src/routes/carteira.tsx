import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, RefreshCw, Wallet, Search, Calculator, ExternalLink } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { AppHeader } from "@/components/AppHeader";
import { usePortfolio, encodeAsset, ASSET_LABELS, type AssetCategory } from "@/hooks/usePortfolio";
import { useQuotes } from "@/hooks/useQuotes";
import { brl, num, pct } from "@/lib/format";
import { FIIS, getFII } from "@/data/fiis";

export const Route = createFileRoute("/carteira")({
  head: () => ({ meta: [{ title: "Minha carteira — WR Investimentos" }, { name: "description", content: "Cadastre e acompanhe seus investimentos com cálculos automáticos." }] }),
  component: Carteira,
});
const categories = Object.keys(ASSET_LABELS) as AssetCategory[];
const marketCategories: AssetCategory[] = ["FII", "ACAO", "ETF", "BDR"];
const moneyNumber = (value: string) => {
  const normalized = value.trim().replace(/\s/g, "").replace(/\.(?=\d{3}(?:\D|$))/g, "").replace(",", ".");
  return Number(normalized);
};
function Carteira() {
  const { positions, totals, addOrUpdate, remove, quotesLoading, quotesError, quotesUpdatedAt, refreshQuotes, ready } = usePortfolio();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<AssetCategory>("FII");
  const [symbol, setSymbol] = useState("MXRF11");
  const [name, setName] = useState("Maxi Renda");
  const [institution, setInstitution] = useState("");
  const [entryMode, setEntryMode] = useState<"amount" | "quantity">("amount");
  const [amount, setAmount] = useState("1000");
  const [shares, setShares] = useState("100");
  const [manualPrice, setManualPrice] = useState("");
  const [query, setQuery] = useState("");
  const isMarket = marketCategories.includes(category);
  const normalizedSymbol = symbol.trim().toUpperCase();
  const validSymbol = /^[A-Z0-9]{3,8}$/.test(normalizedSymbol);
  const { quotes, loading: symbolQuoteLoading, error: symbolQuoteError, updatedAt: symbolQuoteUpdatedAt, refresh: refreshSymbolQuote } = useQuotes(isMarket && validSymbol ? [normalizedSymbol] : []);
  const quote = quotes[normalizedSymbol];
  const quoteFresh = Boolean(quote && Number.isFinite(Date.parse(quote.updatedAt)) && Date.now() - Date.parse(quote.updatedAt) < 5 * 60_000);
  const unitPrice = quoteFresh ? quote!.price : moneyNumber(manualPrice);
  const desiredAmount = moneyNumber(amount);
  const quantity = entryMode === "amount"
    ? (unitPrice > 0 && desiredAmount > 0 ? (category === "CRIPTO" ? Math.floor((desiredAmount / unitPrice) * 1e8) / 1e8 : Math.floor(desiredAmount / unitPrice)) : 0)
    : moneyNumber(shares);
  const calculatedTotal = quantity > 0 && unitPrice > 0 ? quantity * unitPrice : 0;
  const unusedAmount = entryMode === "amount" && desiredAmount > 0 ? Math.max(0, desiredAmount - calculatedTotal) : 0;
  const filtered = useMemo(() => positions.filter(p => !query || [p.name, p.symbol, p.institution || "", ASSET_LABELS[p.category]].join(" ").toLowerCase().includes(query.toLowerCase())), [positions, query]);

  useEffect(() => {
    if (category === "FII") {
      const fii = getFII(normalizedSymbol);
      if (fii) setName(fii.name);
    } else if (quote?.longName || quote?.shortName) {
      setName(quote.longName || quote.shortName || normalizedSymbol);
    }
  }, [category, normalizedSymbol, quote?.longName, quote?.shortName]);

  function resetForm() {
    setCategory("FII"); setSymbol("MXRF11"); setName("Maxi Renda"); setInstitution("");
    setEntryMode("amount"); setAmount("1000"); setShares("100"); setManualPrice("");
  }
  function openForm() { resetForm(); setOpen(true); }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !normalizedSymbol || !institution.trim() || quantity <= 0 || unitPrice <= 0) return;
    const key = encodeAsset(category, normalizedSymbol, name, institution);
    await addOrUpdate(key, quantity, unitPrice, institution.trim());
    setOpen(false);
  }
  return <div className="wr-portfolio-page">
    <AppHeader title="Minha carteira" subtitle={ready ? positions.length + " posições acompanhadas" : "Carregando carteira…"} />
    <section className="wr-portfolio-summary">
      <div><span>Patrimônio acompanhado</span><strong>{brl(totals.current)}</strong><small>Valor de mercado quando há cotação recente; custo de aquisição nos demais casos.</small></div>
      <div><span>Total investido</span><strong>{brl(totals.invested)}</strong></div>
      <div><span>Resultado de mercado</span><strong className={totals.profit >= 0 ? "wr-positive" : "wr-negative"}>{brl(totals.profit)} ({pct(totals.profitPct)})</strong></div>
      <button type="button" onClick={() => void refreshQuotes()} disabled={quotesLoading}><RefreshCw size={16} />{quotesLoading ? "Atualizando…" : "Atualizar cotações"}</button>
    </section>
    <div className="wr-portfolio-toolbar">
      <div className="wr-invest-search"><Search size={18} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar ativo, ticker ou instituição…" /></div>
      <button type="button" className="wr-primary-link" onClick={openForm}><Plus size={16} /> Adicionar investimento</button>
    </div>
    {quotesError && <p className="wr-data-disclaimer">Não foi possível consultar algumas cotações agora. Valores sem cotação não são apresentados como preços atuais.</p>}
    {quotesUpdatedAt && <p className="wr-data-disclaimer">Última consulta geral: {new Date(quotesUpdatedAt).toLocaleString("pt-BR")}. A cotação pode ter atraso e não representa preço de execução.</p>}
    {filtered.length === 0 ? <div className="wr-invest-note"><Wallet size={24} /><b>{positions.length ? "Nenhum resultado encontrado" : "Sua carteira ainda está vazia"}</b><p>Cadastre FIIs, ações, ETFs, BDRs e outros investimentos. O sistema calcula quantidade, preço médio, valor aplicado e resultado.</p></div> :
      <div className="wr-portfolio-list">{filtered.map(p => <article className="wr-portfolio-row" key={p.ticker}>
        <div className="wr-portfolio-row-head"><div><span className="wr-risk-pill">{ASSET_LABELS[p.category]}</span><h3>{p.name}</h3><small>{p.symbol}{p.institution ? " · " + p.institution : ""}</small></div><button type="button" onClick={() => void remove(p.ticker)} aria-label="Remover investimento"><Trash2 size={16} /></button></div>
        <div className="wr-portfolio-metrics"><div><span>Quantidade</span><b>{num(p.shares, 6)}</b></div><div><span>Preço médio</span><b>{brl(p.avgPrice)}</b></div><div><span>Preço atual / referência</span><b>{brl(p.currentPrice)}</b></div><div><span>Valor da posição</span><b>{brl(p.current)}</b></div><div><span>Resultado</span><b className={p.profit >= 0 ? "wr-positive" : "wr-negative"}>{brl(p.profit)} ({pct(p.profitPct)})</b></div></div>
        <div className="wr-portfolio-status"><span>{p.live ? "Cotação consultada recentemente pelo provedor" : p.priceStatus === "cost_basis" ? "Sem marcação de mercado: custo de aquisição" : "Cotação indisponível: exibindo custo de aquisição"}</span>{p.change !== null && <b className={p.change >= 0 ? "wr-positive" : "wr-negative"}>{p.change >= 0 ? "+" : ""}{p.change.toFixed(2).replace(".", ",")}%</b>}</div>
        {p.monthlyDividend !== null && <div className="wr-portfolio-income"><span>Proventos mensais indicativos da posição</span><b>{brl(p.monthlyDividend)}</b></div>}
      </article>)}</div>}
    {open && <div className="wr-invest-modal-backdrop" onClick={() => setOpen(false)}>
      <form className="wr-invest-modal wr-portfolio-form" onSubmit={submit} onClick={e => e.stopPropagation()}>
        <button type="button" className="wr-invest-modal-close" onClick={() => setOpen(false)}>×</button>
        <p className="wr-eyebrow">NOVA POSIÇÃO</p><h2>Adicionar à minha carteira</h2>
        <p className="wr-data-disclaimer">Informe o ativo e escolha se quer investir por valor ou por quantidade. O WR calcula o outro campo usando a cotação disponível.</p>
        <label>Banco ou corretora<input value={institution} onChange={e => setInstitution(e.target.value)} placeholder="Ex.: Banco Inter, XP, Nubank" required maxLength={100} /></label>
        <label>Classe de investimento<select value={category} onChange={e => { const c = e.target.value as AssetCategory; setCategory(c); setSymbol(c === "FII" ? "MXRF11" : ""); setName(c === "FII" ? "Maxi Renda" : ""); setManualPrice(""); }}>{categories.map(c => <option key={c} value={c}>{ASSET_LABELS[c]}</option>)}</select></label>
        {category === "FII" ? <label>Fundo imobiliário<select value={symbol} onChange={e => setSymbol(e.target.value)}>{FIIS.map(f => <option key={f.ticker} value={f.ticker}>{f.ticker} — {f.name}</option>)}</select></label> :
          <label>Código / ticker<input value={symbol} onChange={e => setSymbol(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8))} placeholder="Ex.: PETR4, VALE3, IVVB11" /></label>}
        <label>Nome do ativo<input value={name} onChange={e => setName(e.target.value)} placeholder="Preenchido automaticamente quando a fonte informar" required /></label>
        {isMarket && <div className="wr-quote-inline">
          <div><span>Preço de mercado consultado</span><strong>{quoteFresh ? brl(quote!.price) : symbolQuoteLoading ? "Consultando…" : "Indisponível"}</strong></div>
          <button type="button" onClick={() => void refreshSymbolQuote()} disabled={!validSymbol || symbolQuoteLoading}><RefreshCw size={14} /> Atualizar</button>
          <small>{quoteFresh ? "Fonte: " + quote!.source + (quote!.marketTime ? " · Última negociação: " + new Date(quote!.marketTime).toLocaleString("pt-BR") : "") : symbolQuoteError ? "A fonte não retornou cotação. Você pode informar seu preço de compra manualmente." : "A cotação depende da cobertura do provedor e pode ter atraso."}</small>
        </div>}
        <div className="wr-entry-mode"><button type="button" className={entryMode === "amount" ? "active" : ""} onClick={() => setEntryMode("amount")}><Calculator size={15} /> Investir por valor</button><button type="button" className={entryMode === "quantity" ? "active" : ""} onClick={() => setEntryMode("quantity")}>Informar quantidade</button></div>
        {entryMode === "amount" ? <label>Quanto deseja investir (R$)<input inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Ex.: 1.000,00" /></label> :
          <label>Quantidade de cotas / ações<input inputMode="decimal" value={shares} onChange={e => setShares(e.target.value)} placeholder="Ex.: 10" /></label>}
        {!quoteFresh && <label>Seu preço de compra por unidade (R$)<input inputMode="decimal" value={manualPrice} onChange={e => setManualPrice(e.target.value)} placeholder="Informe o preço se não houver cotação" /></label>}
        <div className="wr-calculation-preview">
          <div><span>Preço utilizado no cálculo</span><b>{unitPrice > 0 ? brl(unitPrice) : "Aguardando preço"}</b></div>
          <div><span>{entryMode === "amount" ? "Quantidade calculada" : "Quantidade informada"}</span><b>{quantity > 0 ? num(quantity, 6) : "—"}</b></div>
          <div><span>Total da posição</span><b>{calculatedTotal > 0 ? brl(calculatedTotal) : "—"}</b></div>
          {entryMode === "amount" && <div><span>Saldo não utilizado</span><b>{brl(unusedAmount)}</b></div>}
        </div>
        <p className="wr-data-disclaimer">O sistema registra a posição e calcula o preço médio ponderado em novas compras do mesmo ativo na mesma instituição. Não envia ordens à corretora. Para títulos e produtos sem cotação pública, o preço precisa vir do comprovante ou extrato da instituição.</p>
        <button type="submit" className="wr-primary-link" disabled={!institution.trim() || !normalizedSymbol || !name.trim() || quantity <= 0 || unitPrice <= 0 || (entryMode === "amount" && desiredAmount < unitPrice)}>Salvar investimento na carteira</button>
      </form>
    </div>}
    <aside className="wr-invest-note"><b>Patrimônio consolidado e integração</b><p>Esta carteira acompanha as posições cadastradas aqui. Para consultar aplicações manuais de renda fixa e outras instituições já registradas, acesse <Link to="/patrimonio">Meu Patrimônio <ExternalLink size={13} /></Link>. A conexão automática com XP, Inter e outros bancos ainda depende de integrações oficiais e autorização do titular.</p></aside>
  </div>;
}
