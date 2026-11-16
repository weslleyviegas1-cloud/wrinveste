import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, ArrowUpRight, Landmark, Building2, BarChart3, Globe2, ShieldCheck, Layers3, Coins, CalendarDays, BriefcaseBusiness, GraduationCap } from "lucide-react";

export const Route = createFileRoute("/investimentos")({ head:()=>({meta:[{title:"Investimentos — WR"},{name:"description",content:"Explore classes e produtos de investimento disponíveis no mercado brasileiro."}]}), component:Investimentos });

const groups=[
 {name:"Ações",desc:"Participação em empresas listadas na B3.",icon:BarChart3,examples:"Ações ordinárias e preferenciais, units, small caps, blue chips, dividendos e ETFs de ações.",risk:"Renda variável",route:"/fundos"},
 {name:"Fundos imobiliários (FIIs)",desc:"Fundos de tijolo, papel, híbridos e fundos de fundos.",icon:Building2,examples:"FIIs de logística, shoppings, lajes corporativas, recebíveis (CRI), renda urbana e FoFs.",risk:"Renda variável",route:"/fundos"},
 {name:"ETFs",desc:"Fundos de índice negociados em bolsa.",icon:Layers3,examples:"ETFs de Ibovespa, S&P 500, Nasdaq, renda fixa, ouro, criptoativos e fatores.",risk:"Renda variável",route:"/fundos"},
 {name:"BDRs",desc:"Certificados negociados no Brasil que representam ativos do exterior.",icon:Globe2,examples:"BDRs de ações, ETFs internacionais e empresas globais.",risk:"Renda variável",route:"/fundos"},
 {name:"Tesouro Direto",desc:"Títulos públicos federais com diferentes indexadores e vencimentos.",icon:Landmark,examples:"Tesouro Selic, Prefixado, IPCA+, Renda+, Educa+ e títulos com juros semestrais.",risk:"Renda fixa",route:"/carteira"},
 {name:"CDB e RDB",desc:"Títulos bancários com remuneração prefixada, pós-fixada ou híbrida.",icon:ShieldCheck,examples:"CDB com liquidez diária, CDB com vencimento, CDB progressivo e RDB.",risk:"Renda fixa",route:"/carteira"},
 {name:"LCI e LCA",desc:"Letras de crédito imobiliário e do agronegócio.",icon:Landmark,examples:"LCI/LCA prefixadas, pós-fixadas e híbridas, observando carência e vencimento.",risk:"Renda fixa",route:"/carteira"},
 {name:"Debêntures",desc:"Títulos de dívida emitidos por empresas.",icon:BriefcaseBusiness,examples:"Debêntures comuns, incentivadas, conversíveis e infraestrutura.",risk:"Crédito privado",route:"/carteira"},
 {name:"CRI e CRA",desc:"Certificados de recebíveis imobiliários e do agronegócio.",icon:Building2,examples:"Recebíveis com diferentes indexadores, prazos, garantias e riscos de crédito.",risk:"Crédito privado",route:"/carteira"},
 {name:"Fundos de investimento",desc:"Carteiras geridas profissionalmente com diferentes estratégias.",icon:Layers3,examples:"Fundos de renda fixa, multimercado, ações, cambiais, crédito privado e fundos internacionais.",risk:"Varia por fundo",route:"/recomendacoes"},
 {name:"Previdência privada",desc:"Planos de acumulação de longo prazo.",icon:CalendarDays,examples:"PGBL, VGBL e fundos de previdência com estratégias conservadoras ou arrojadas.",risk:"Longo prazo",route:"/recomendacoes"},
 {name:"COE",desc:"Certificados de operações estruturadas com cenários de retorno e risco.",icon:Coins,examples:"COE com capital protegido ou em risco, vinculados a índices e ativos de referência.",risk:"Estruturado",route:"/recomendacoes"},
 {name:"Ofertas públicas",desc:"Distribuições primárias e ofertas subsequentes de valores mobiliários.",icon:GraduationCap,examples:"IPO, follow-on, ofertas de cotas de fundos e emissões de títulos.",risk:"Varia por oferta",route:"/fundos"},
 {name:"Criptoativos",desc:"Ativos digitais e exposição a esse mercado.",icon:Globe2,examples:"Criptoativos diretamente ou por veículos regulados e ETFs listados.",risk:"Alta volatilidade",route:"/fundos"},
];
const filters=["Todos","Renda fixa","Renda variável","Crédito privado","Longo prazo","Estruturado"];
function Investimentos(){
 const [q,setQ]=useState("");const [filter,setFilter]=useState("Todos");
 const list=useMemo(()=>groups.filter(g=>(filter==="Todos"||g.risk.toLowerCase().includes(filter.toLowerCase()))&&(!q||[g.name,g.desc,g.examples,g.risk].join(" ").toLowerCase().includes(q.toLowerCase()))),[q,filter]);
 return <main className="wr-invest-page"><header className="wr-invest-heading"><div><p className="wr-eyebrow">UNIVERSO DE ATIVOS</p><h1>Investimentos</h1><p className="wr-muted">Explore diferentes mercados, produtos e estratégias em um só lugar.</p></div><Link to="/carteira" className="wr-primary-link">Minha carteira <ArrowUpRight size={16}/></Link></header>
 <div className="wr-invest-search"><Search size={19}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar ações, títulos, fundos, produtos..." aria-label="Buscar investimentos"/></div>
 <div className="wr-filter-row">{filters.map(f=><button key={f} onClick={()=>setFilter(f)} className={filter===f?"selected":""}>{f}</button>)}</div>
 <div className="wr-invest-count">{list.length} categorias de investimento</div>
 <div className="wr-invest-grid">{list.map(g=>{const Icon=g.icon;return <article className="wr-invest-tile" key={g.name}><div className="wr-invest-tile-head"><span className="wr-invest-icon"><Icon size={21}/></span><span className="wr-risk-pill">{g.risk}</span></div><h2>{g.name}</h2><p>{g.desc}</p><div className="wr-examples"><b>Você encontra:</b><span>{g.examples}</span></div><Link to={g.route as "/fundos" | "/carteira" | "/recomendacoes"} className="wr-text-link">Explorar categoria <ArrowUpRight size={15}/></Link></article>})}</div>
 <aside className="wr-invest-note"><b>Importante</b><p>Este catálogo é informativo. A WR permite organizar e acompanhar posições cadastradas; a execução de ordens, disponibilidade de produtos, taxas, liquidez, tributação, garantias e elegibilidade dependem da instituição distribuidora e das condições de cada oferta. Nenhuma rentabilidade é garantida.</p></aside>
 </main>;
}
