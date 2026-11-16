import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuotes } from "@/hooks/useQuotes";
import { getFII } from "@/data/fiis";

export type AssetCategory = "FII" | "ACAO" | "ETF" | "BDR" | "TESOURO" | "CDB" | "LCI_LCA" | "DEBENTURE" | "CRI_CRA" | "FUNDO" | "PREVIDENCIA" | "COE" | "CRIPTO" | "OUTRO";
export interface Position {
  ticker: string;
  shares: number;
  avgPrice: number;
  purchasedAt?: string;
}
export interface PortfolioPosition extends Position {
  category: AssetCategory;
  symbol: string;
  name: string;
  invested: number;
  current: number;
  currentPrice: number;
  profit: number;
  profitPct: number;
  monthlyDividend: number | null;
  yearlyDividend: number | null;
  live: boolean;
  change: number | null;
  priceStatus: "market" | "cost_basis" | "unavailable";
  monthlyDividend:number|null;
  yearlyDividend:number|null;
  fii: { name:string; segment:string; price:number; lastDividend:number; dividendYield:number };
  received:number;
  monthsHeld:number;
  totalReturn:number;
  totalReturnPct:number;
}
const KEY = "fii.portfolio.v1";
const PREFIX = "WRASSET:";
const LABELS: Record<AssetCategory,string> = {
  FII:"FII",ACAO:"Ação",ETF:"ETF",BDR:"BDR",TESOURO:"Tesouro Direto",CDB:"CDB/RDB",LCI_LCA:"LCI/LCA",
  DEBENTURE:"Debênture",CRI_CRA:"CRI/CRA",FUNDO:"Fundo",PREVIDENCIA:"Previdência",COE:"COE",CRIPTO:"Criptoativo",OUTRO:"Outro"
};
function decode(ticker:string): {category:AssetCategory;symbol:string;name:string} {
  if (!ticker.startsWith(PREFIX)) return {category: "FII",symbol:ticker,name:ticker};
  const [,cat,symbol,name] = ticker.split("|");
  const category = (cat in LABELS ? cat : "OUTRO") as AssetCategory;
  return {category,symbol:symbol ?? "",name:decodeURIComponent(name ?? symbol ?? "Ativo")};
}
export function encodeAsset(category:AssetCategory,symbol:string,name:string) {
  return PREFIX + category + "|" + symbol.trim().toUpperCase() + "|" + encodeURIComponent(name.trim());
}
function readLocal(): Position[] {
  if (typeof window === "undefined") return [];
  try { const raw=window.localStorage.getItem(KEY); if(!raw)return[]; const parsed=JSON.parse(raw); return Array.isArray(parsed)?parsed:[]; } catch { return []; }
}
function writeLocal(p:Position[]) { if(typeof window!=="undefined") window.localStorage.setItem(KEY,JSON.stringify(p)); }

export function usePortfolio() {
  const {user,loading:authLoading}=useAuth();
  const [positions,setPositions]=useState<Position[]>([]);
  const [ready,setReady]=useState(false);
  useEffect(()=>{
    if(authLoading)return; let cancelled=false;
    async function load(){
      if(!user){setPositions(readLocal());setReady(true);return;}
      const {data,error}=await supabase.from("positions").select("ticker, shares, avg_price, created_at").order("ticker");
      if(cancelled)return;
      if(error){console.error("[positions] load error",error);setPositions(readLocal());setReady(true);return;}
      const cloud:Position[]=(data??[]).map((r:any)=>({ticker:r.ticker,shares:Number(r.shares),avgPrice:Number(r.avg_price),purchasedAt:r.created_at??undefined}));
      if(cloud.length===0){const local=readLocal();if(local.length){const rows=local.map(p=>({user_id:user.id,ticker:p.ticker,shares:p.shares,avg_price:p.avgPrice}));await supabase.from("positions").upsert(rows,{onConflict:"user_id,ticker"});setPositions(local);setReady(true);return;}}
      setPositions(cloud);setReady(true);
    }
    void load();return()=>{cancelled=true;};
  },[user,authLoading]);

  const addOrUpdate=useCallback(async(ticker:string,shares:number,avgPrice:number)=>{
    const existing=positions.find(p=>p.ticker===ticker);
    const total=(existing?.shares??0)+shares;
    const avg=existing ? (existing.shares*existing.avgPrice+shares*avgPrice)/total : avgPrice;
    const next=existing?positions.map(p=>p.ticker===ticker?{...p,shares:total,avgPrice:avg}:{...p}):[...positions,{ticker,shares,avgPrice:avg,purchasedAt:new Date().toISOString()}];
    setPositions(next);
    if(user){const {error}=await supabase.from("positions").upsert({user_id:user.id,ticker,shares:total,avg_price:avg},{onConflict:"user_id,ticker"});if(error)console.error("[positions] upsert",error);}
    else writeLocal(next);
  },[positions,user]);

  const remove=useCallback(async(ticker:string)=>{
    const next=positions.filter(p=>p.ticker!==ticker);setPositions(next);
    if(user){const {error}=await supabase.from("positions").delete().eq("user_id",user.id).eq("ticker",ticker);if(error)console.error("[positions] delete",error);}
    else writeLocal(next);
  },[positions,user]);
  const clearAll=useCallback(async()=>{
    setPositions([]);
    if(user){const {error}=await supabase.from("positions").delete().eq("user_id",user.id);if(error)console.error("[positions] clear",error);}
    if(typeof window!=="undefined")window.localStorage.removeItem(KEY);
  },[user]);

  const quoteTickers=useMemo(()=>positions.map(p=>decode(p.ticker)).filter(d=>["FII","ACAO","ETF","BDR","CRIPTO"].includes(d.category)&&d.symbol).map(d=>d.symbol),[positions]);
  const {quotes,loading:quotesLoading,error:quotesError,updatedAt:quotesUpdatedAt,refresh:refreshQuotes}=useQuotes(quoteTickers);
  const enriched:PortfolioPosition[]=positions.map(p=>{
    const d=decode(p.ticker); const quote=quotes[d.symbol];
    const marketCategory=["FII","ACAO","ETF","BDR","CRIPTO"].includes(d.category);
    const quoteFresh=Boolean(quote&&Number.isFinite(Date.parse(quote.updatedAt))&&Date.now()-Date.parse(quote.updatedAt)<5*60_000);
    const live=Boolean(marketCategory&&quoteFresh);
    const currentPrice=live?quote!.price:p.avgPrice;
    const invested=p.shares*p.avgPrice;
    const current=p.shares*currentPrice;
    const profit=current-invested;
    const profitPct=invested>0?profit/invested*100:0;
    const baseFii=getFII(d.symbol);
    const monthlyDividend=d.category==="FII"&&quote?quote.monthlyDividend*p.shares:null;
    const yearlyDividend=d.category==="FII"&&quote?quote.yearlyDividend*p.shares:null;
    return {...p,...d,invested,current,currentPrice,profit,profitPct,
      monthlyDividend,yearlyDividend,received:0,monthsHeld:0,totalReturn:profit,totalReturnPct:profitPct,
      fii:{name:baseFii?.name??d.name,segment:baseFii?.segment??LABELS[d.category],price:currentPrice,lastDividend:quote?.lastDividend??0,dividendYield:quote?.dividendYield??0},
      live,change:live?quote!.change:null,priceStatus:live?"market":marketCategory?"unavailable":"cost_basis"};
  });
  const totals=enriched.reduce((a,p)=>({invested:a.invested+p.invested,current:a.current+p.current}),{invested:0,current:0});
  const profit=totals.current-totals.invested;
  const withWeights=enriched.map(p=>({...p,weight:totals.current>0?p.current/totals.current*100:0}));
  return {ready,positions:withWeights,totals:{...totals,profit,profitPct:totals.invested>0?profit/totals.invested*100:0,
    monthly:withWeights.reduce((s,p)=>s+(p.monthlyDividend??0),0),yearly:withWeights.reduce((s,p)=>s+(p.yearlyDividend??0),0),
    received:0,yieldOnCost:totals.invested>0?withWeights.reduce((s,p)=>s+(p.yearlyDividend??0),0)/totals.invested*100:0},addOrUpdate,remove,clearAll,setAll:(next:Position[])=>{setPositions(next);if(user)return;writeLocal(next);},
    cloudSynced:!!user,quotes,quotesLoading,quotesError,quotesUpdatedAt,refreshQuotes};
}
export const ASSET_LABELS=LABELS;
