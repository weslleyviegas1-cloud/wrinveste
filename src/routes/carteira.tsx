import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, RefreshCw, Wallet, Search, Calculator, ExternalLink } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { AppHeader } from "@/components/AppHeader";
import { usePortfolio, encodeAsset, ASSET_LABELS, type AssetCategory } from "@/hooks/usePortfolio";
import { useQuotes } from "@/hooks/useQuotes";
import { useTrackedInvestments } from "@/hooks/useTrackedInvestments";
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
  const { items: manualItems, totals: manualTotals, add: addManual, remove: removeManual, loading: manualLoading } = useTrackedInvestments();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<AssetCategory>("FII");
  const [symbol, setSymbol] = useState("MXRF11");
  const [name, setName] = useState("Maxi Renda");
  const [institution, setInstitution] = useState("");
  const [entryMode, setEntryMode] = useState<"amount" | "quantity">("amount");
  const [amount, setAmount] = useState("1000");
  const [shares, setShares] = useState("100");
  const [manualPrice, setManualPrice] = useState("");
  const [manualCurrentValue, setManualCurrentValue] = useState("");
  const [annualRate, setAnnualRate] = useState("");
  const [rateIndex, setRateIndex] = useState("");
  const [liquidity, setLiquidity] = useState("Diária");
  const [startDate, setStartDate] = useState("");
  const [maturityDate, setMaturityDate] = useState("");
  const [notes, setNotes] = useState("");
  const [query, setQuery] = useState("");
  const isMarket = marketCategories.includes(category);
  const normalizedSymbol = symbol.trim().toUpperCase();
  const validSymbol = /^[A-Z0-9]{3,8}$/.test(normalizedSymbol);
  const { quotes, loading: symbolQuoteLoading, error: symbolQuoteError, updatedAt: symbolQuoteUpdatedAt, refresh: refreshSymbolQuote } = useQuotes(isMarket && validSymbol ? [normalizedSymbol] : []);
  const quote = quotes[normalizedSymbol];
  const quoteFresh = Boolean(quote && Number.isFinite(Date.parse(quote.updatedAt)) && Date.now() - Date.parse(quote.updatedAt) < 5 * 60_000);
  const enteredUnitPrice = moneyNumber(manualPrice);
  const unitPrice = enteredUnitPrice > 0 ? enteredUnitPrice : quoteFresh ? quote!.price : 0;
  const desiredAmount = moneyNumber(amount);
  const quantity = entryMode === "amount"
    ? (unitPrice > 0 && desiredAmount > 0 ? (category === "CRIPTO" ? Math.floor((desiredAmount / unitPrice) * 1e8) / 1e8 : Math.floor(desiredAmount / unitPrice)) : 0)
    : moneyNumber(shares);
  const calculatedTotal = quantity > 0 && unitPrice > 0 ? quantity * unitPrice : 0;
  const unusedAmount = entryMode === "amount" && desiredAmount > 0 ? Math.max(0, desiredAmount - calculatedTotal) : 0;
  const filtered = useMemo(() => positions.filter(p => !query || [p.name, p.symbol, p.institution || "", ASSET_LABELS[p.category]].join(" ").toLowerCase().includes(query.toLowerCase())), [positions, query]);
  const consolidatedInvested = totals.invested + manualTotals.invested;
  const consolidatedCurrent = totals.current + manualTotals.current;
  const consolidatedProfit = consolidatedCurrent - consolidatedInvested;
  const consolidatedProfitPct = consolidatedInvested > 0 ? consolidatedProfit / consolidatedInvested * 100 : 0;

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
    setManualCurrentValue(""); setAnnualRate(""); setRateIndex(""); setLiquidity("Diária"); setStartDate(""); setMaturityDate(""); setNotes("");
  }
  function openForm() { resetForm(); setOpen(true); }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !institution.trim()) return;
    if (!isMarket) {
      const investedAmount = desiredAmount;
      const currentValue = manualCurrentValue.trim() ? moneyNumber(manualCurrentValue) : investedAmount;
      if (!Number.isFinite(investedAmount) || !Number.isFinite(currentValue) || investedAmount <= 0 || currentValue < 0) return;
      const saved = await addManual({
        institution: institution.trim(),
        category: ASSET_LABELS[category],
        productName: name.trim(),
        ticker: normalizedSymbol || undefined,
        investedAmount,
        currentValue,
        annualRate: annualRate.trim() ? moneyNumber(annualRate) : null,
        rateIndex: rateIndex.trim(),
        liquidity,
        startDate,
        maturityDate,
        notes,
        valuationMode: "manual",
      });
      if (saved) setOpen(false);
      return;
    }
    if (!normalizedSymbol || !Number.isFinite(quantity) || !Number.isFinite(unitPrice) || quantity <= 0 || unitPrice <= 0 || (isMarket && !Number.isInteger(quantity))) return;
    const key = encodeAsset(category, normalizedSymbol, name, institution);
    await addOrUpdate(key, quantity, unitPrice, institution.trim());
    setOpen(false);
  }
  return <div className="wr-portfolio-page">
    <AppHeader title="Minha carteira" subtitle={ready && !manualLoading ? (positions.length + manualItems.length) + " posições acompanhadas" : "Carregando carteira…"} />
    <section className="wr-portfolio-summary">
      <div><span>Patrimônio acompanhado</span><strong>{brl(consolidatedCurrent)}</strong><small>Inclui ativos cotados e aplicações cadastradas manualmente.</small></div>
      <div><span>Total investido</span><strong>{brl(consolidatedInvested)}</strong></div>
      <div><span>Resultado consolidado</span><strong className={consolidatedProfit >= 0 ? "wr-positive" : "wr-negative"}>{brl(consolidatedProfit)} ({pct(consolidatedProfitPct)})</strong></div>
      <button type="button" onClick={() => void refreshQuotes()} disabled={quotesLoading}><RefreshCw size={16} />{quotesLoading ? "Atualizando…" : "Atualizar cotações"}</button>
    </section>
    <div className="wr-portfolio-toolbar">
      <div className="wr-invest-search"><Search size={18} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar ativo, ticker ou instituição…" /></div>
      <button type="button" className="wr-primary-link" onClick={openForm}><Plus size={16} /> Adicionar investimento</button>
    </div>
    {quotesError && <p className="wr-data-disclaimer">Não foi possível consultar algumas cotações agora. Valores sem cotação não são apresentados como preços atuais.</p>}
    {quotesUpdatedAt && <p className="wr-data-disclaimer">Última consulta geral: {new Date(quotesUpdatedAt).toLocaleString("pt-BR")}. A cotação pode ter atraso e não representa preço de execução.</p>}
    {filtered.length === 0 ? (manualItems.length === 0 ? <div className="wr-invest-note"><Wallet size={24} /><b>{positions.length ? "Nenhum resultado encontrado" : "Sua carteira ainda está vazia"}</b><p>Cadastre FIIs, ações, ETFs, BDRs e aplicações de renda fixa. O sistema calcula quantidades e consolida os valores.</p></div> : null) :
      <div className="wr-portfolio-list">{filtered.map(p => <article className="wr-portfolio-row" key={p.ticker}>
        <div className="wr-portfolio-row-head"><div><span className="wr-risk-pill">{ASSET_LABELS[p.category]}</span><h3>{p.name}</h3><small>{p.symbol}{p.institution ? " · " + p.institution : ""}</small></div><button type="button" onClick={() => void remove(p.ticker)} aria-label="Remover investimento"><Trash2 size={16} /></button></div>
        <div className="wr-portfolio-metrics"><div><span>Quantidade</span><b>{num(p.shares, 6)}</b></div><div><span>Preço médio</span><b>{brl(p.avgPrice)}</b></div><div><span>Preço atual / referência</span><b>{brl(p.currentPrice)}</b></div><div><span>Valor da posição</span><b>{brl(p.current)}</b></div><div><span>Resultado</span><b className={p.profit >= 0 ? "wr-positive" : "wr-negative"}>{brl(p.profit)} ({pct(p.profitPct)})</b></div></div>
        <div className="wr-portfolio-status"><span>{p.live ? "Cotação consultada recentemente pelo provedor" : p.priceStatus === "cost_basis" ? "Sem marcação de mercado: custo de aquisição" : "Cotação indisponível: exibindo custo de aquisição"}</span>{p.change !== null && <b className={p.change >= 0 ? "wr-positive" : "wr-negative"}>{p.change >= 0 ? "+" : ""}{p.change.toFixed(2).replace(".", ",")}%</b>}</div>
        {p.monthlyDividend !== null && <div className="wr-portfolio-income"><span>Proventos mensais indicativos da posição</span><b>{brl(p.monthlyDividend)}</b></div>}
      </article>)}</div>}
    {manualItems.length > 0 && <section className="wr-portfolio-manual-section">
      <div className="wr-portfolio-manual-heading"><h2>Renda fixa e outras aplicações</h2><span>{manualItems.length} registros</span></div>
      {manualItems.map(item => <article className="wr-portfolio-row" key={item.id}>
        <div className="wr-portfolio-row-head"><div><span className="wr-risk-pill">{item.category}</span><h3>{item.productName}</h3><small>{item.institution}{item.ticker ? " · " + item.ticker : ""}</small></div><div className="wr-portfolio-row-actions"><Link to="/patrimonio" className="wr-manual-edit-link">Editar</Link><button type="button" onClick={() => { if (confirm("Excluir esta aplicação do seu patrimônio?")) void removeManual(item.id); }} aria-label="Remover aplicação"><Trash2 size={16} /></button></div></div>
        <div className="wr-portfolio-metrics"><div><span>Valor aplicado</span><b>{brl(item.investedAmount)}</b></div><div><span>Valor atual</span><b>{brl(item.currentValue)}</b></div><div><span>Resultado</span><b className={item.currentValue >= item.investedAmount ? "wr-positive" : "wr-negative"}>{brl(item.currentValue - item.investedAmount)}</b></div><div><span>Liquidez</span><b>{item.liquidity}</b></div><div><span>Taxa / indexador</span><b>{item.annualRate != null ? item.annualRate + "% " + (item.rateIndex || "a.a.") : item.rateIndex || "—"}</b></div></div>
        <div className="wr-portfolio-status"><span>{item.valuationMode === "manual" ? "Valor atualizado conforme extrato informado" : "Valor estimado"}</span>{item.maturityDate && <b>Vencimento: {new Date(item.maturityDate + "T12:00:00").toLocaleDateString("pt-BR")}</b>}</div>
      </article>)}
    </section>}
    {open && <div className="wr-invest-modal-backdrop" onClick={() => setOpen(false)}>
      <form className="wr-invest-modal wr-portfolio-form" onSubmit={submit} onClick={e => e.stopPropagation()}>
        <button type="button" className="wr-invest-modal-close" onClick={() => setOpen(false)}>×</button>
        <p className="wr-eyebrow">NOVA POSIÇÃO</p><h2>Adicionar à minha carteira</h2>
        <p className="wr-data-disclaimer">Informe o ativo e escolha se quer investir por valor ou por quantidade. O WR calcula o outro campo usando a cotação disponível.</p>
        <label>Banco ou corretora<input value={institution} onChange={e => setInstitution(e.target.value)} placeholder="Ex.: Banco Inter, XP, Nubank" required maxLength={100} /></label>
        <label>Classe de investimento<select value={category} onChange={e => { const c = e.target.value as AssetCategory; setCategory(c); setSymbol(c === "FII" ? "MXRF11" : ""); setName(c === "FII" ? "Maxi Renda" : ""); setManualPrice(""); }}>{categories.map(c => <option key={c} value={c}>{ASSET_LABELS[c]}</option>)}</select></label>
        {category === "FII" ? <label>Fundo imobiliário<select value={symbol} onChange={e => setSymbol(e.target.value)}>{FIIS.map(f => <option key={f.ticker} value={f.ticker}>{f.ticker} — {f.name}</option>)}</select></label> :
          <label>Código / ticker (opcional para aplicações sem código)<input value={symbol} onChange={e => setSymbol(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8))} placeholder={isMarket ? "Ex.: PETR4, VALE3, IVVB11" : "Código, ticker ou deixe vazio"} /></label>}
        <label>Nome do ativo / produto<input value={name} onChange={e => setName(e.target.value)} placeholder="Preenchido automaticamente quando a fonte informar" required /></label>
        {isMarket ? <>
          <div className="wr-quote-inline">
            <div><span>Preço de mercado consultado</span><strong>{quoteFresh ? brl(quote!.price) : symbolQuoteLoading ? "Consultando…" : "Indisponível"}</strong></div>
            <button type="button" onClick={() => void refreshSymbolQuote()} disabled={!validSymbol || symbolQuoteLoading}><RefreshCw size={14} /> Atualizar</button>
            <small>{quoteFresh ? "Fonte: " + quote!.source + (quote!.marketTime ? " · Última negociação: " + new Date(quote!.marketTime).toLocaleString("pt-BR") : "") : symbolQuoteError ? "A fonte não retornou cotação. Você pode informar seu preço de compra manualmente." : "A cotação depende da cobertura do provedor e pode ter atraso."}</small>
          </div>
          <div className="wr-entry-mode"><button type="button" className={entryMode === "amount" ? "active" : ""} onClick={() => setEntryMode("amount")}><Calculator size={15} /> Investir por valor</button><button type="button" className={entryMode === "quantity" ? "active" : ""} onClick={() => setEntryMode("quantity")}>Informar quantidade</button></div>
          {entryMode === "amount" ? <label>Quanto deseja investir (R$)<input inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Ex.: 1.000,00" /></label> :
            <label>Quantidade de cotas / ações<input inputMode="decimal" value={shares} onChange={e => setShares(e.target.value)} placeholder="Ex.: 10" /></label>}
          <label>Preço unitário de compra (R$)<input inputMode="decimal" value={manualPrice} onChange={e => setManualPrice(e.target.value)} placeholder={quoteFresh ? "Em branco para usar a cotação consultada" : "Informe o preço se não houver cotação"} /><small className="wr-field-help">{quoteFresh ? "A cotação é preenchida automaticamente. Informe outro preço somente se quiser registrar o preço efetivo da sua compra." : "Sem cotação disponível: informe o preço do comprovante ou extrato."}</small></label>
          <div className="wr-calculation-preview">
            <div><span>Preço utilizado no cálculo</span><b>{unitPrice > 0 ? brl(unitPrice) : "Aguardando preço"}</b></div>
            <div><span>{entryMode === "amount" ? "Quantidade calculada" : "Quantidade informada"}</span><b>{quantity > 0 ? num(quantity, 6) : "—"}</b></div>
            <div><span>Total da posição</span><b>{calculatedTotal > 0 ? brl(calculatedTotal) : "—"}</b></div>
            {entryMode === "amount" && <div><span>Saldo não utilizado</span><b>{brl(unusedAmount)}</b></div>}
          </div>
          <p className="wr-data-disclaimer">O sistema calcula o preço médio ponderado em novas compras do mesmo ativo na mesma instituição. Não envia ordens à corretora.</p>
          <button type="submit" className="wr-primary-link" disabled={!institution.trim() || !normalizedSymbol || !name.trim() || !Number.isFinite(quantity) || !Number.isFinite(unitPrice) || quantity <= 0 || unitPrice <= 0 || !Number.isInteger(quantity) || (entryMode === "amount" && desiredAmount < unitPrice)}>Salvar investimento na carteira</button>
        </> : <>
          <label>Valor aplicado (R$)<input inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Ex.: 1.000,00" /></label>
          <label>Valor atual (R$)<input inputMode="decimal" value={manualCurrentValue} onChange={e => setManualCurrentValue(e.target.value)} placeholder="Deixe vazio para repetir o valor aplicado" /></label>
          <div className="wr-portfolio-two-fields"><label>Taxa anual (%)<input inputMode="decimal" value={annualRate} onChange={e => setAnnualRate(e.target.value)} placeholder="Opcional" /></label><label>Indexador<input value={rateIndex} onChange={e => setRateIndex(e.target.value)} placeholder="CDI, IPCA, prefixado" /></label></div>
          <label>Liquidez<select value={liquidity} onChange={e => setLiquidity(e.target.value)}>{["Diária","Imediata","No vencimento","Após carência","Sem liquidez / não informado"].map(v => <option key={v}>{v}</option>)}</select></label>
          <div className="wr-portfolio-two-fields"><label>Data da aplicação<input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} /></label><label>Vencimento<input type="date" value={maturityDate} onChange={e => setMaturityDate(e.target.value)} /></label></div>
          <label>Observações<textarea value={notes} onChange={e => setNotes(e.target.value)} maxLength={1000} rows={3} placeholder="Informações complementares do investimento" /></label>
          <div className="wr-calculation-preview"><div><span>Resultado registrado</span><b>{brl((manualCurrentValue.trim() ? moneyNumber(manualCurrentValue) : desiredAmount) - desiredAmount)}</b></div><div><span>Valor consolidado</span><b>{brl(manualCurrentValue.trim() ? moneyNumber(manualCurrentValue) : desiredAmount)}</b></div></div>
          <p className="wr-data-disclaimer">Para CDB, LCI/LCA, Tesouro, previdência e produtos sem cotação pública, informe o valor atual conforme o extrato da instituição. O WR não inventa rentabilidade nem consulta o saldo bancário.</p>
          <button type="submit" className="wr-primary-link" disabled={!institution.trim() || !name.trim() || !Number.isFinite(desiredAmount) || desiredAmount <= 0 || (manualCurrentValue.trim() && (!Number.isFinite(moneyNumber(manualCurrentValue)) || moneyNumber(manualCurrentValue) < 0))}>Salvar aplicação na carteira</button>
        </>}
      </form>
    </div>}
    <aside className="wr-invest-note"><b>Patrimônio consolidado e integração</b><p>Esta carteira acompanha as posições cadastradas aqui. Para consultar aplicações manuais de renda fixa e outras instituições já registradas, acesse <Link to="/patrimonio">Meu Patrimônio <ExternalLink size={13} /></Link>. A conexão automática com XP, Inter e outros bancos ainda depende de integrações oficiais e autorização do titular.</p></aside>
  </div>;
}
