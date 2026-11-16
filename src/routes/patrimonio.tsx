import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { useTrackedInvestments, type InvestmentInput, type TrackedInvestment } from "@/hooks/useTrackedInvestments";
import { usePortfolio } from "@/hooks/usePortfolio";
import { brl, pct } from "@/lib/format";
import { Plus, Trash2, Download, Building2, X, FileDown, Pencil } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const Route=createFileRoute("/patrimonio")({head:()=>({meta:[{title:"Patrimônio — WR Investe"},{name:"description",content:"Consolide seus investimentos de diferentes instituições em um só lugar."}]}),component:Patrimonio});
const categories=["Renda fixa","FIIs","Ações","ETFs","Tesouro Direto","Fundos de investimento","Criptomoedas","Poupança","Previdência","Outros"];
const blank:InvestmentInput={institution:"",category:"Renda fixa",productName:"",ticker:"",investedAmount:0,currentValue:0,annualRate:null,rateIndex:"",liquidity:"Diária",startDate:"",maturityDate:"",notes:"",valuationMode:"manual"};
function csvCell(v:unknown){return '"'+String(v??"").replace(/"/g,'""')+'"';}
function exportCsv(items:TrackedInvestment[],fiis:any[]){
 const header=["Instituição","Categoria","Produto","Código","Valor aplicado","Valor atual","Resultado","Taxa anual (%)","Indexador","Liquidez","Data aplicação","Vencimento","Método de atualização"];
 const rows=[...items.map(x=>[x.institution,x.category,x.productName,x.ticker||"",x.investedAmount.toFixed(2),x.currentValue.toFixed(2),(x.currentValue-x.investedAmount).toFixed(2),x.annualRate??"",x.rateIndex||"",x.liquidity,x.startDate||"",x.maturityDate||"",x.valuationMode]),...fiis.map(x=>["Carteira de FIIs","FIIs",x.ticker,x.ticker,x.invested.toFixed(2),x.current.toFixed(2),(x.current-x.invested).toFixed(2),"","","Mercado secundário","","",x.live?"Cotação consultada":"Cotação indisponível"])];
 const content="\uFEFF"+[header,...rows].map(r=>r.map(csvCell).join(";")).join("\r\n");
 const url=URL.createObjectURL(new Blob([content],{type:"text/csv;charset=utf-8"}));const a=document.createElement("a");a.href=url;a.download="wr-investe-patrimonio.csv";a.click();URL.revokeObjectURL(url);
}
function exportPdf(items:TrackedInvestment[], fiis:any[], invested:number, current:number){
 const doc=new jsPDF({unit:"pt",format:"a4"}); const result=current-invested;
 doc.setFillColor(12,16,23);doc.rect(0,0,595,842,"F");
 doc.setTextColor(245,247,250);doc.setFont("helvetica","bold");doc.setFontSize(20);doc.text("WR Investe — Patrimônio consolidado",40,48);
 doc.setFont("helvetica","normal");doc.setFontSize(10);doc.setTextColor(160,170,185);doc.text("Gerado em "+new Date().toLocaleString("pt-BR"),40,68);
 doc.setFontSize(12);doc.setTextColor(245,247,250);doc.text("Valor atual: "+brl(current),40,105);doc.text("Total aplicado: "+brl(invested),230,105);doc.text("Resultado: "+brl(result),420,105);
 autoTable(doc,{startY:130,head:[["Instituição","Categoria","Produto","Aplicado","Valor atual","Liquidez"]],body:[...items.map(x=>[x.institution,x.category,x.productName,brl(x.investedAmount),brl(x.currentValue),x.liquidity]),...fiis.map(x=>["Carteira de FIIs","FIIs",x.ticker,brl(x.invested),brl(x.current), "Mercado secundário"])],theme:"grid",styles:{fontSize:8,cellPadding:6},headStyles:{fillColor:[25,90,65],textColor:255},margin:{left:40,right:40}});
 const y=(doc as any).lastAutoTable?.finalY||150;doc.setTextColor(160,170,185);doc.setFontSize(8);doc.text("Valores informados ou calculados no aplicativo; não são confirmação de saldo pelas instituições.",40,Math.min(y+28,810));
 doc.save("wr-investe-patrimonio-"+new Date().toISOString().slice(0,10)+".pdf");
}
function Patrimonio(){
 const {items,loading,error,totals,add,update,remove,cloudSynced}=useTrackedInvestments();
 const {positions:fiiPositions,totals:fiiTotals}=usePortfolio();
 const totalInvested=totals.invested+fiiTotals.invested;
 const totalCurrent=totals.current+fiiTotals.current;
 const [editingId,setEditingId]=useState<string|null>(null);
 const [open,setOpen]=useState(false);const [form,setForm]=useState<InvestmentInput>(blank);
 const [filter,setFilter]=useState("Todas");
 const categoriesInUse=useMemo(()=>["Todas",...Array.from(new Set(items.map(x=>x.category)))],[items]);
 const visible=items.filter(x=>filter==="Todas"||x.category===filter);
 const result=totalCurrent-totalInvested;
 const set=(key:keyof InvestmentInput,value:any)=>setForm(p=>({...p,[key]:value}));
 async function submit(e:React.FormEvent){e.preventDefault();if(!form.institution.trim()||!form.productName.trim()||form.investedAmount<0||form.currentValue<0)return;const payload={...form,institution:form.institution.trim(),productName:form.productName.trim()};const ok=editingId?await update(editingId,payload):await add(payload);if(ok){setForm(blank);setEditingId(null);setOpen(false);}}
 function edit(item:TrackedInvestment){setEditingId(item.id);setForm({institution:item.institution,category:item.category,productName:item.productName,ticker:item.ticker||"",investedAmount:item.investedAmount,currentValue:item.currentValue,annualRate:item.annualRate??null,rateIndex:item.rateIndex||"",liquidity:item.liquidity,startDate:item.startDate||"",maturityDate:item.maturityDate||"",notes:item.notes||"",valuationMode:item.valuationMode});setOpen(true);}
 return <div className="px-5 pb-5 sm:px-8">
 <AppHeader title="Meu patrimônio" subtitle="Todos os seus investimentos, em um só lugar"/>
 <section className="rounded-3xl glass-strong p-5">
  <p className="text-xs uppercase tracking-wider text-muted-foreground">Patrimônio consolidado cadastrado</p>
  <p className="mt-2 font-display text-3xl font-bold tabular">{brl(totalCurrent)}</p>
  <div className="mt-4 grid grid-cols-2 gap-3">
   <div><p className="text-xs text-muted-foreground">Total aplicado</p><p className="font-semibold tabular">{brl(totalInvested)}</p></div>
   <div><p className="text-xs text-muted-foreground">Resultado registrado</p><p className={`font-semibold tabular ${result>=0?"text-success":"text-danger"}`}>{result>=0?"+":""}{brl(result)} ({pct(totalInvested?result/totalInvested*100:0)})</p></div>
  </div>
  <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">Soma dos valores atuais informados ou calculados neste aplicativo. Não representa saldo bancário confirmado nem consulta automática às instituições.</p>
 </section>
 <div className="mt-4 grid grid-cols-2 gap-2">
  <button onClick={()=>{setEditingId(null);setForm(blank);setOpen(true)}} className="flex items-center justify-center gap-2 rounded-xl gradient-primary px-3 py-3 text-sm font-semibold text-primary-foreground"><Plus className="h-4 w-4"/>Adicionar investimento</button>
  <button onClick={()=>exportCsv(items,fiiPositions)} disabled={!items.length&&!fiiPositions.length} className="flex items-center justify-center gap-2 rounded-xl glass px-3 py-3 text-sm font-semibold disabled:opacity-40"><Download className="h-4 w-4"/>CSV</button>
  <button onClick={()=>exportPdf(items,fiiPositions,totalInvested,totalCurrent)} disabled={!items.length&&!fiiPositions.length} className="col-span-2 flex items-center justify-center gap-2 rounded-xl glass px-3 py-2.5 text-sm font-semibold disabled:opacity-40"><FileDown className="h-4 w-4"/>Baixar relatório PDF</button>
 </div>
 <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground"><span>{items.length} aplicações cadastradas</span><span>{cloudSynced?"Sincronização na nuvem":"Salvo neste dispositivo"}</span></div>
 {error&&<p className="mt-3 rounded-xl border border-amber-400/20 bg-amber-400/5 p-3 text-xs text-amber-200">{error}</p>}
 <section className="mt-5 rounded-2xl glass p-4"><h2 className="text-sm font-semibold">Patrimônio por instituição</h2><div className="mt-3 space-y-3">{Array.from([...items.reduce((map,x)=>map.set(x.institution,(map.get(x.institution)||0)+x.currentValue),new Map<string,number>()).entries(),...(fiiTotals.current>0?[["Carteira de FIIs",fiiTotals.current] as [string,number]]:[])]).sort((a,b)=>b[1]-a[1]).map(([name,value])=><div key={name}><div className="mb-1 flex justify-between gap-3 text-xs"><span className="text-muted-foreground">{name}</span><b className="tabular">{brl(value)}</b></div><div className="h-1.5 overflow-hidden rounded-full bg-white/5"><div className="h-full rounded-full bg-primary" style={{width:totalCurrent>0?`${Math.min(100,value/totalCurrent*100)}%`:"0%"}}/></div></div>)}</div><p className="mt-3 text-[10px] text-muted-foreground">Os FIIs da aba FIIs já entram no total consolidado. Não os cadastre novamente nesta lista para evitar duplicidade.</p></section>
 <div className="mt-5 flex gap-2 overflow-x-auto pb-1">{categoriesInUse.map(c=><button key={c} onClick={()=>setFilter(c)} className={`shrink-0 rounded-full px-3 py-1.5 text-xs ${filter===c?"bg-primary text-primary-foreground":"glass text-muted-foreground"}`}>{c}</button>)}</div>
 <div className="mt-3 space-y-3">
 {loading?<div className="rounded-xl glass p-6 text-center text-sm text-muted-foreground">Carregando patrimônio...</div>:visible.length===0?<div className="rounded-2xl glass p-8 text-center"><Building2 className="mx-auto h-8 w-8 text-muted-foreground"/><p className="mt-3 text-sm font-medium">Nenhum investimento cadastrado nesta categoria</p><p className="mt-1 text-xs text-muted-foreground">Adicione aplicações de qualquer banco ou corretora para consolidar seu patrimônio.</p></div>:visible.map(x=><article key={x.id} className="rounded-2xl glass p-4">
  <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="font-semibold">{x.productName}</p><p className="text-xs text-muted-foreground">{x.institution} · {x.category}{x.ticker?" · "+x.ticker:""}</p></div><div className="flex shrink-0 gap-1"><button onClick={()=>edit(x)} className="rounded-lg p-2 text-muted-foreground hover:text-primary" aria-label="Editar investimento"><Pencil className="h-4 w-4"/></button><button onClick={()=>{if(confirm("Excluir este investimento do seu controle?"))void remove(x.id)}} className="rounded-lg p-2 text-muted-foreground hover:text-danger" aria-label="Excluir investimento"><Trash2 className="h-4 w-4"/></button></div></div>
  <div className="mt-3 grid grid-cols-2 gap-3"><div><p className="text-[10px] uppercase text-muted-foreground">Valor atual</p><p className="font-semibold tabular">{brl(x.currentValue)}</p></div><div><p className="text-[10px] uppercase text-muted-foreground">Aplicado</p><p className="font-semibold tabular">{brl(x.investedAmount)}</p></div><div><p className="text-[10px] uppercase text-muted-foreground">Resultado</p><p className={`text-sm font-semibold tabular ${x.currentValue>=x.investedAmount?"text-success":"text-danger"}`}>{x.currentValue>=x.investedAmount?"+":""}{brl(x.currentValue-x.investedAmount)}</p></div><div><p className="text-[10px] uppercase text-muted-foreground">Liquidez</p><p className="text-sm font-medium">{x.liquidity}</p></div></div>
  <div className="mt-3 flex flex-wrap gap-2 text-[10px] text-muted-foreground">{x.annualRate!=null&&<span>{x.annualRate}% a.a. {x.rateIndex||"prefixado"}</span>}<span>{x.valuationMode==="manual"?"Valor informado manualmente":"Estimativa matemática"}</span>{x.maturityDate&&<span>Vence em {new Date(x.maturityDate+"T12:00:00").toLocaleDateString("pt-BR")}</span>}</div>
 </article>)}
 </div>
 {open&&<div className="fixed inset-0 z-[60] flex items-end justify-center overflow-y-auto bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={()=>setOpen(false)}>
 <form onSubmit={submit} onClick={e=>e.stopPropagation()} className="my-auto max-h-[92vh] w-full max-w-lg space-y-3 overflow-y-auto rounded-t-3xl glass-strong p-5 sm:rounded-3xl">
  <div className="flex items-center justify-between"><h2 className="font-display text-lg font-semibold">{editingId?"Editar investimento":"Novo investimento"}</h2><button type="button" onClick={()=>{setOpen(false);setEditingId(null)}}><X className="h-5 w-5"/></button></div>
  <p className="text-xs text-muted-foreground">Cadastre aplicações de qualquer instituição. Nenhuma compra ou transferência será realizada.</p>
  <label className="block text-xs text-muted-foreground">Banco ou corretora<input required maxLength={100} value={form.institution} onChange={e=>set("institution",e.target.value)} placeholder="Ex.: Banco Inter, XP, Nubank" className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-foreground"/></label>
  <label className="block text-xs text-muted-foreground">Categoria<select value={form.category} onChange={e=>set("category",e.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-[#171717] p-3 text-sm">{categories.map(c=><option key={c}>{c}</option>)}</select></label>
  <label className="block text-xs text-muted-foreground">Nome do investimento<input required maxLength={140} value={form.productName} onChange={e=>set("productName",e.target.value)} placeholder="Ex.: CDB liquidez diária 100% CDI" className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-foreground"/></label>
  <label className="block text-xs text-muted-foreground">Código / ticker (opcional)<input value={form.ticker||""} onChange={e=>set("ticker",e.target.value.toUpperCase())} placeholder="Ex.: MXRF11" className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-foreground"/></label>
  <div className="grid grid-cols-2 gap-3"><label className="block text-xs text-muted-foreground">Valor aplicado (R$)<input required type="number" min="0" step="0.01" value={form.investedAmount||""} onChange={e=>set("investedAmount",Number(e.target.value))} className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm"/></label><label className="block text-xs text-muted-foreground">Valor atual (R$)<input required type="number" min="0" step="0.01" value={form.currentValue||""} onChange={e=>set("currentValue",Number(e.target.value))} className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm"/></label></div>
  <div className="grid grid-cols-2 gap-3"><label className="block text-xs text-muted-foreground">Taxa anual (%)<input type="number" min="0" step="0.0001" value={form.annualRate??""} onChange={e=>set("annualRate",e.target.value===""?null:Number(e.target.value))} placeholder="Opcional" className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm"/></label><label className="block text-xs text-muted-foreground">Indexador<input value={form.rateIndex||""} onChange={e=>set("rateIndex",e.target.value)} placeholder="CDI, IPCA, prefixado" className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm"/></label></div>
  <label className="block text-xs text-muted-foreground">Liquidez<select value={form.liquidity} onChange={e=>set("liquidity",e.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-[#171717] p-3 text-sm">{["Diária","Imediata","No vencimento","Após carência","Sem liquidez / não informado"].map(x=><option key={x}>{x}</option>)}</select></label>
  <div className="grid grid-cols-2 gap-3"><label className="block text-xs text-muted-foreground">Data da aplicação<input type="date" value={form.startDate||""} onChange={e=>set("startDate",e.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm"/></label><label className="block text-xs text-muted-foreground">Vencimento<input type="date" value={form.maturityDate||""} onChange={e=>set("maturityDate",e.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm"/></label></div>
  <label className="block text-xs text-muted-foreground">Observações<textarea maxLength={1000} value={form.notes||""} onChange={e=>set("notes",e.target.value)} className="mt-1 min-h-16 w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm"/></label>
  <button type="submit" className="w-full rounded-xl gradient-primary p-3 text-sm font-semibold text-primary-foreground">{editingId?"Salvar alterações":"Salvar investimento"}</button>
 </form></div>}
 </div>;
}
