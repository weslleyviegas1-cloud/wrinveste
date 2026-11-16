import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Search, ArrowUpRight, Landmark, Building2, BarChart3, Globe2,
  ShieldCheck, Layers3, Coins, CalendarDays, BriefcaseBusiness,
  GraduationCap, Gem, Wallet, Banknote, CircleDollarSign, ChartNoAxesCombined,
} from "lucide-react";

export const Route = createFileRoute("/investimentos")({
  head: () => ({ meta: [
    { title: "Investimentos — WR Investimentos" },
    { name: "description", content: "Catálogo de classes e produtos de investimento para organizar e acompanhar seu patrimônio." },
  ] }),
  component: Investimentos,
});

type InvestmentGroup = {
  name: string;
  category: string;
  desc: string;
  icon: typeof BarChart3;
  products: string[];
  detail: string;
};

const groups: InvestmentGroup[] = [
  { name:"Ações", category:"Bolsa", desc:"Participação em empresas negociadas na bolsa brasileira.", icon:BarChart3, products:["Ações ordinárias (ON)","Ações preferenciais (PN)","Units","Blue chips","Small caps","Ações de dividendos","IPO e follow-on"], detail:"Acompanhe quantidade, preço médio, proventos, eventos corporativos e evolução da posição." },
  { name:"Fundos imobiliários (FIIs)", category:"Bolsa", desc:"Fundos listados ligados ao mercado imobiliário.", icon:Building2, products:["Logística","Shopping centers","Lajes corporativas","Renda urbana","Recebíveis imobiliários","Híbridos","Fundos de fundos (FoFs)"], detail:"Acompanhe cotas, preço médio, rendimentos distribuídos e composição por segmento." },
  { name:"ETFs", category:"Bolsa", desc:"Fundos de índice negociados em bolsa no Brasil e no exterior.", icon:Layers3, products:["Ibovespa","S&P 500","Nasdaq","Small caps","Renda fixa","Ouro e commodities","ETFs internacionais"], detail:"Organize exposição por índice, mercado, estratégia e moeda." },
  { name:"BDRs", category:"Internacional", desc:"Certificados que permitem acompanhar ativos internacionais pela B3.", icon:Globe2, products:["BDRs de ações","BDRs de ETFs","Empresas globais","Índices internacionais"], detail:"Visualize exposição internacional, moeda de referência e concentração por região." },
  { name:"Tesouro Direto", category:"Renda fixa", desc:"Títulos públicos federais com diferentes indexadores e vencimentos.", icon:Landmark, products:["Tesouro Selic","Tesouro Prefixado","Tesouro IPCA+","IPCA+ com juros semestrais","Tesouro Renda+","Tesouro Educa+"], detail:"Registre vencimento, taxa contratada, indexador, quantidade e valor aplicado." },
  { name:"CDB e RDB", category:"Renda fixa", desc:"Títulos emitidos por bancos, com diferentes formas de remuneração.", icon:ShieldCheck, products:["CDB com liquidez diária","CDB prefixado","CDB pós-fixado (% CDI)","CDB IPCA+","CDB progressivo","RDB"], detail:"Organize emissor, taxa, indexador, vencimento, liquidez e cobertura aplicável do FGC." },
  { name:"LCI e LCA", category:"Renda fixa", desc:"Letras de crédito imobiliário e do agronegócio.", icon:Landmark, products:["LCI prefixada","LCI pós-fixada","LCI IPCA+","LCA prefixada","LCA pós-fixada","LCA IPCA+"], detail:"Acompanhe emissor, carência, vencimento, taxa e condições de resgate." },
  { name:"Letras financeiras", category:"Renda fixa", desc:"Instrumentos de captação emitidos por instituições financeiras.", icon:Banknote, products:["Letra Financeira (LF)","Letra Financeira Subordinada","Letra de Crédito (LC)"], detail:"Registre prazo, remuneração, emissor e condições específicas da emissão." },
  { name:"Debêntures", category:"Crédito privado", desc:"Títulos de dívida emitidos por empresas para captar recursos.", icon:BriefcaseBusiness, products:["Debêntures comuns","Debêntures incentivadas","Debêntures conversíveis","Debêntures permutáveis","Debêntures de infraestrutura"], detail:"Acompanhe emissor, rating quando disponível, garantias, indexador, juros e vencimento." },
  { name:"CRI e CRA", category:"Crédito privado", desc:"Certificados de recebíveis imobiliários e do agronegócio.", icon:Building2, products:["CRI","CRA","Séries sênior e subordinada","Prefixados","Pós-fixados","IPCA+"], detail:"Organize lastro, devedor, estrutura, riscos, remuneração e datas de pagamento." },
  { name:"Fundos de investimento", category:"Fundos", desc:"Fundos com gestão profissional e diferentes estratégias.", icon:Layers3, products:["Renda fixa","Multimercado","Ações","Cambiais","Crédito privado","Internacionais","Fundo de índice","Fundo de infraestrutura"], detail:"Acompanhe cotas, patrimônio, taxa de administração, performance e documentos do fundo." },
  { name:"Previdência privada", category:"Previdência", desc:"Planos de acumulação e planejamento financeiro de longo prazo.", icon:CalendarDays, products:["PGBL","VGBL","Previdência renda fixa","Previdência multimercado","Previdência ações"], detail:"Organize plano, regime tributário, contribuições, beneficiários e evolução do saldo." },
  { name:"COE", category:"Estruturados", desc:"Certificados de operações estruturadas vinculados a ativos ou índices.", icon:Coins, products:["Capital protegido","Capital em risco","Participação em alta","Estratégias com índices","Estratégias internacionais"], detail:"Registre cenário de retorno, ativo de referência, barreiras, prazo e risco de perda." },
  { name:"Operações compromissadas", category:"Renda fixa", desc:"Operações de compra e venda de títulos com compromisso de recompra ou revenda.", icon:Wallet, products:["Compromissadas lastreadas em títulos públicos","Compromissadas bancárias"], detail:"Acompanhe contraparte, lastro, taxa, prazo e data de liquidação." },
  { name:"Ouro e commodities", category:"Alternativos", desc:"Exposição a metais preciosos e mercados de commodities.", icon:Gem, products:["Ouro","Prata","Commodities agrícolas","Commodities energéticas","ETFs de commodities"], detail:"Organize exposição, instrumento utilizado, moeda e variação de preço." },
  { name:"Moedas e câmbio", category:"Internacional", desc:"Exposição a moedas estrangeiras e instrumentos cambiais.", icon:CircleDollarSign, products:["Dólar","Euro","Fundos cambiais","ETFs cambiais"], detail:"Acompanhe moeda, custo de aquisição, saldo e exposição cambial." },
  { name:"Criptoativos", category:"Alternativos", desc:"Ativos digitais e veículos de investimento relacionados.", icon:Globe2, products:["Bitcoin","Ethereum","Outros criptoativos","ETFs de criptoativos"], detail:"Registre custódia, quantidade, preço médio e exposição. Considere a elevada volatilidade e os riscos de custódia." },
  { name:"Ofertas públicas", category:"Ofertas", desc:"Acompanhamento de distribuições primárias e ofertas subsequentes.", icon:GraduationCap, products:["IPO","Follow-on","Oferta de ações","Oferta de cotas de fundos","Emissões de dívida"], detail:"Organize período de reserva, quantidade solicitada, alocação e liquidação." },
];

const filters = ["Todas", "Bolsa", "Renda fixa", "Crédito privado", "Fundos", "Internacional", "Previdência", "Estruturados", "Alternativos", "Ofertas"];

function Investimentos() {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("Todas");
  const [selected, setSelected] = useState<InvestmentGroup | null>(null);
  const list = useMemo(() => groups.filter(g =>
    (filter === "Todas" || g.category === filter) &&
    (!q || [g.name, g.category, g.desc, ...g.products].join(" ").toLowerCase().includes(q.toLowerCase()))
  ), [q, filter]);

  return (
    <main className="wr-invest-page">
      <header className="wr-invest-heading">
        <div><p className="wr-eyebrow">UNIVERSO DE ATIVOS</p><h1>Investimentos</h1><p className="wr-muted">Explore as modalidades de investimento e organize seu patrimônio em um só lugar.</p></div>
        <Link to="/carteira" className="wr-primary-link">Minha carteira <ArrowUpRight size={16}/></Link>
      </header>

      <section className="wr-invest-sync">
        <div className="wr-invest-sync-icon"><ChartNoAxesCombined size={20}/></div>
        <div><b>Visão consolidada dos seus investimentos</b><p>Este catálogo prepara a WR para reunir, no futuro, os investimentos mantidos em instituições conectadas por cada usuário.</p></div>
        <span className="wr-risk-pill">Integração bancária futura</span>
      </section>

      <div className="wr-invest-search"><Search size={19}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar ações, CDB, Tesouro, fundos, previdência..." aria-label="Buscar investimentos"/></div>
      <div className="wr-filter-row">{filters.map(f=><button key={f} onClick={()=>setFilter(f)} className={filter===f?"selected":""}>{f}</button>)}</div>
      <div className="wr-invest-count">{list.length} modalidades</div>

      <div className="wr-invest-grid">
        {list.map(g => { const Icon = g.icon; return (
          <article className="wr-invest-tile" key={g.name}>
            <div className="wr-invest-tile-head"><span className="wr-invest-icon"><Icon size={21}/></span><span className="wr-risk-pill">{g.category}</span></div>
            <h2>{g.name}</h2><p>{g.desc}</p>
            <div className="wr-examples"><b>Modalidades</b><div className="wr-product-chips">{g.products.map(p=><span key={p}>{p}</span>)}</div></div>
            <button type="button" className="wr-text-link" onClick={()=>setSelected(g)}>Ver detalhes <ArrowUpRight size={15}/></button>
          </article>
        ); })}
      </div>

      {selected && <div className="wr-invest-modal-backdrop" role="presentation" onClick={()=>setSelected(null)}>
        <section className="wr-invest-modal" role="dialog" aria-modal="true" aria-labelledby="wr-invest-modal-title" onClick={e=>e.stopPropagation()}>
          <button type="button" className="wr-invest-modal-close" onClick={()=>setSelected(null)} aria-label="Fechar">×</button>
          <p className="wr-eyebrow">{selected.category}</p><h2 id="wr-invest-modal-title">{selected.name}</h2>
          <p>{selected.desc}</p><h3>Modalidades disponíveis no mercado</h3>
          <ul>{selected.products.map(p=><li key={p}>{p}</li>)}</ul>
          <div className="wr-invest-modal-note">{selected.detail}</div>
          <p className="wr-muted">A disponibilidade depende da instituição financeira, do perfil do investidor e das condições de cada produto.</p>
        </section>
      </div>}

      <aside className="wr-invest-note"><b>Como a WR vai funcionar com suas instituições</b><p>O objetivo futuro é conectar, com autorização individual, as instituições financeiras escolhidas por cada usuário e importar suas posições e movimentações para uma visão consolidada. Até essa integração ser implementada e autorizada, este catálogo é informativo: não conecta contas, não importa investimentos automaticamente e não executa ordens. A disponibilidade, liquidez, riscos, taxas e tributação dependem de cada produto e instituição.</p></aside>
    </main>
  );
}
