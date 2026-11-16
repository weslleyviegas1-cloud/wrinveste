import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Trash2, RefreshCw, Wallet, Search } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { usePortfolio, encodeAsset, ASSET_LABELS, type AssetCategory } from "@/hooks/usePortfolio";
import { brl, num, pct } from "@/lib/format";
import { FIIS } from "@/data/fiis";

export const Route = createFileRoute("/carteira")({
  head: () => ({ meta: [{ title: "Carteira — WR Investimentos" }, { name: "description", content: "Acompanhe investimentos de diferentes classes em uma carteira consolidada." }] }),
  component: Carteira,
});
const categories = Object.keys(ASSET_LABELS) as AssetCategory[];
const marketCategories: AssetCategory[] = ["FII","ACAO","ETF","BDR","CRIPTO"];
function Carteira() {
  const {positions,totals,addOrUpdate,remove,quotesLoading,quotesError,quotesUpdatedAt,refreshQuotes,ready}=usePortfolio();
  const [open,setOpen]=useState(false);
  const [category,setCategory]=useState<AssetCategory>("ACAO");
  const [symbol,setSymbol]=useState("PETR4");
  const [name,setName]=useState("Petrobras");
  const [shares,setShares]=useState("10");
  const [price,setPrice]=useState("");
  const [query,setQuery]=useState("");
  const filtered=useMemo(()=>positions.filter(p=>!query||[p.name,p.symbol,ASSET_LABELS[p.category]].join(" ").toLowerCase().includes(query.toLowerCase())),[positions,query]);
  const isMarket=marketCategories.includes(category);
  function submit(e:React.FormEvent){
    e.preventDefault();
    const qty=Number(shares.replace(",","."));
    const unit=Number(price.replace(",","."));
    if(!name.trim()||!symbol.trim()||qty<=0||unit<=0)return;
    const key=category==="FII"?symbol.trim().toUpperCase():encodeAsset(category,symbol,name);
    void addOrUpdate(key,qty,unit);
    setOpen(false);setPrice("");
  }
  return <div className="wr-portfolio-page">
    <AppHeader title="Minha carteira" subtitle={ready?positions.length+" posições acompanhadas":"Carregando carteira…"}/>
    <section className="wr-portfolio-summary">
      <div><span>Patrimônio acompanhado</span><strong>{brl(totals.current)}</strong><small>Valor de mercado quando há cotação; custo de aquisição nos demais casos.</small></div>
      <div><span>Total investido</span><strong>{brl(totals.invested)}</strong></div>
      <div><span>Resultado de mercado</span><strong className={totals.profit>=0?"wr-positive":"wr-negative"}>{brl(totals.profit)} ({pct(totals.profitPct)})</strong></div>
      <button type="button" onClick={()=>void refreshQuotes()} disabled={quotesLoading}><RefreshCw size={16}/>{quotesLoading?"Atualizando…":"Atualizar cotações"}</button>
    </section>
    <div className="wr-portfolio-toolbar"><div className="wr-invest-search"><Search size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar na carteira…"/></div><button type="button" className="wr-primary-link" onClick={()=>setOpen(true)}><Plus size={16}/> Adicionar investimento</button></div>
    {quotesError&&<p className="wr-data-disclaimer">Não foi possível consultar algumas cotações agora. Valores sem cotação não são apresentados como preços atuais.</p>}
    {quotesUpdatedAt&&<p className="wr-data-disclaimer">Última consulta ao provedor: {new Date(quotesUpdatedAt).toLocaleString("pt-BR")}. Isso não significa cotação em tempo real.</p>}
    {filtered.length===0?<div className="wr-invest-note"><Wallet size={24}/><b>{positions.length?"Nenhum resultado encontrado":"Sua carteira ainda está vazia"}</b><p>Adicione ações, FIIs, ETFs, BDRs, títulos e outros investimentos para acompanhar tudo em um só lugar.</p></div>:
    <div className="wr-portfolio-list">{filtered.map(p=><article className="wr-portfolio-row" key={p.ticker}>
      <div className="wr-portfolio-row-head"><div><span className="wr-risk-pill">{ASSET_LABELS[p.category]}</span><h3>{p.name}</h3><small>{p.symbol}</small></div><button type="button" onClick={()=>void remove(p.ticker)} aria-label="Remover investimento"><Trash2 size={16}/></button></div>
      <div className="wr-portfolio-metrics"><div><span>Quantidade</span><b>{num(p.shares,4)}</b></div><div><span>Preço médio</span><b>{brl(p.avgPrice)}</b></div><div><span>Preço atual / referência</span><b>{brl(p.currentPrice)}</b></div><div><span>Valor da posição</span><b>{brl(p.current)}</b></div><div><span>Resultado</span><b className={p.profit>=0?"wr-positive":"wr-negative"}>{brl(p.profit)} ({pct(p.profitPct)})</b></div></div>
      <div className="wr-portfolio-status"><span>{p.live?"Cotação retornada pelo provedor":p.priceStatus==="cost_basis"?"Sem marcação de mercado: custo de aquisição":"Cotação indisponível: custo de aquisição"}</span>{p.change!==null&&<b className={p.change>=0?"wr-positive":"wr-negative"}>{p.change>=0?"+":""}{p.change.toFixed(2).replace(".",",")}%</b>}</div>
      {p.monthlyDividend!==null&&<div className="wr-portfolio-income"><span>Proventos mensais indicativos da posição</span><b>{brl(p.monthlyDividend)}</b></div>}
    </article>)}</div>}
    {open&&<div className="wr-invest-modal-backdrop" onClick={()=>setOpen(false)}><form className="wr-invest-modal wr-portfolio-form" onSubmit={submit} onClick={e=>e.stopPropagation()}>
      <button type="button" className="wr-invest-modal-close" onClick={()=>setOpen(false)}>×</button><p className="wr-eyebrow">NOVA POSIÇÃO</p><h2>Adicionar investimento</h2>
      <label>Classe de investimento<select value={category} onChange={e=>{const c=e.target.value as AssetCategory;setCategory(c);if(c==="FII"){setSymbol("MXRF11");setName("Maxi Renda");}else{setSymbol(c==="ACAO"?"PETR4":c==="ETF"?"IVVB11":c==="BDR"?"AAPL34":c==="CRIPTO"?"BTC-USD":"");setName("");}}}>{categories.map(c=><option key={c} value={c}>{ASSET_LABELS[c]}</option>)}</select></label>
      {category==="FII"?<label>Fundo imobiliário<select value={symbol} onChange={e=>{setSymbol(e.target.value);setName(FIIS.find(f=>f.ticker===e.target.value)?.name??e.target.value);}}>{FIIS.map(f=><option key={f.ticker} value={f.ticker}>{f.ticker} — {f.name}</option>)}</select></label>:<><label>Ticker ou identificador<input value={symbol} onChange={e=>setSymbol(e.target.value.toUpperCase())} placeholder={isMarket?"Ex.: PETR4, IVVB11, AAPL34":"Código ou identificação do título"}/></label><label>Nome / emissor<input value={name} onChange={e=>setName(e.target.value)} placeholder="Nome do investimento ou emissor"/></label></>}
      <label>Quantidade / unidades<input inputMode="decimal" value={shares} onChange={e=>setShares(e.target.value)} placeholder="10"/></label>
      <label>{isMarket?"Preço médio de aquisição por unidade (R$)":"Valor aplicado por unidade (R$)"}<input inputMode="decimal" value={price} onChange={e=>setPrice(e.target.value)} placeholder="100,00"/></label>
      <p className="wr-data-disclaimer">{isMarket?"A cotação será consultada quando o ticker for coberto pelo provedor. O preço informado serve para calcular o resultado.":"Registro manual: saldo, taxa contratada, marcação e pagamentos ainda não vêm automaticamente da instituição."}</p>
      <button type="submit" className="wr-primary-link" disabled={!symbol.trim()||!name.trim()||Number(shares.replace(",","."))<=0||Number(price.replace(",","."))<=0}>Salvar na carteira</button>
    </form></div>}
    <aside className="wr-invest-note"><b>Atualização e integração</b><p>Ações, FIIs, ETFs, BDRs e criptoativos usam a última cotação retornada pelo provedor, quando disponível. Para renda fixa, fundos não listados, previdência e COE, a posição é manual e usa o custo informado até haver integração de dados da instituição. A conexão XP/Open Finance ainda não está ativa.</p></aside>
  </div>;
}
