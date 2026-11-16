import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type TrackedInvestment = {
  id: string; institution: string; category: string; productName: string;
  ticker?: string; investedAmount: number; currentValue: number;
  annualRate?: number | null; rateIndex?: string; liquidity: string;
  startDate?: string; maturityDate?: string; notes?: string;
  valuationMode: "manual" | "estimated"; createdAt: string; updatedAt: string;
};
export type InvestmentInput = Omit<TrackedInvestment, "id" | "createdAt" | "updatedAt">;
const STORAGE_KEY = "wr.tracked-investments.v1";
const toRow = (p: InvestmentInput, userId: string) => ({
  user_id:userId, institution:p.institution, category:p.category, product_name:p.productName,
  ticker:p.ticker || null, invested_amount:p.investedAmount, current_value:p.currentValue,
  annual_rate:p.annualRate ?? null, rate_index:p.rateIndex || null, liquidity:p.liquidity,
  start_date:p.startDate || null, maturity_date:p.maturityDate || null, notes:p.notes || null,
  valuation_mode:p.valuationMode,
});
const fromRow = (r:any):TrackedInvestment => ({
  id:r.id, institution:r.institution, category:r.category, productName:r.product_name,
  ticker:r.ticker || undefined, investedAmount:Number(r.invested_amount), currentValue:Number(r.current_value),
  annualRate:r.annual_rate == null ? null : Number(r.annual_rate), rateIndex:r.rate_index || undefined,
  liquidity:r.liquidity, startDate:r.start_date || undefined, maturityDate:r.maturity_date || undefined,
  notes:r.notes || undefined, valuationMode:r.valuation_mode, createdAt:r.created_at, updatedAt:r.updated_at,
});
function readLocal():TrackedInvestment[] {
  if(typeof window==="undefined") return [];
  try { const v=JSON.parse(localStorage.getItem(STORAGE_KEY)||"[]"); return Array.isArray(v)?v:[]; } catch { return []; }
}
export function useTrackedInvestments() {
  const {user,loading:authLoading}=useAuth();
  const [items,setItems]=useState<TrackedInvestment[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState<string|null>(null);
  const persistLocal=(next:TrackedInvestment[])=>{setItems(next);try{localStorage.setItem(STORAGE_KEY,JSON.stringify(next));}catch{}};
  const reload=useCallback(async()=>{
    if(authLoading)return;
    setLoading(true); setError(null);
    if(!user){setItems(readLocal());setLoading(false);return;}
    const {data,error}=await supabase.from("tracked_investments").select("*").order("updated_at",{ascending:false});
    if(error){console.error("[tracked_investments]",error);setItems(readLocal());setError("Não foi possível sincronizar. Exibindo os registros locais deste dispositivo.");}
    else if ((data || []).length > 0) {
      setItems((data || []).map(fromRow));
    } else {
      const local = readLocal();
      if (local.length) {
        const { data: migrated, error: migrationError } = await supabase
          .from("tracked_investments")
          .insert(local.map((item) => toRow(item, user.id)))
          .select("*");
        if (migrationError) {
          console.error("[tracked_investments] local migration", migrationError);
          setItems(local);
          setError("Os registros locais foram preservados, mas ainda não puderam ser enviados à nuvem.");
        } else {
          const cloudItems = (migrated || []).map(fromRow);
          setItems(cloudItems);
          try { localStorage.removeItem(STORAGE_KEY); } catch { /* keep the cloud copy */ }
        }
      } else {
        setItems([]);
      }
    }
    setLoading(false);
  },[user,authLoading]);
  useEffect(()=>{void reload();},[reload]);
  const add=useCallback(async(input:InvestmentInput)=>{
    const now=new Date().toISOString();
    const local:TrackedInvestment={...input,id:crypto.randomUUID(),createdAt:now,updatedAt:now};
    if(!user){persistLocal([local,...items]);return true;}
    const {data,error}=await supabase.from("tracked_investments").insert(toRow(input,user.id)).select("*").single();
    if(error){console.error("[tracked_investments] insert",error);setError("Falha ao salvar na nuvem. Seus dados locais não foram alterados.");return false;}
    setItems(prev=>[fromRow(data),...prev]);return true;
  },[user,items]);
  const update=useCallback(async(id:string,input:InvestmentInput)=>{
    if(!user){persistLocal(items.map(x=>x.id===id?{...x,...input,updatedAt:new Date().toISOString()}:x));return true;}
    const {data,error}=await supabase.from("tracked_investments").update({...toRow(input,user.id),updated_at:new Date().toISOString()}).eq("id",id).select("*").single();
    if(error){console.error("[tracked_investments] update",error);setError("Não foi possível atualizar o registro.");return false;}
    setItems(prev=>prev.map(x=>x.id===id?fromRow(data):x));return true;
  },[user,items]);
  const remove=useCallback(async(id:string)=>{
    if(!user){persistLocal(items.filter(x=>x.id!==id));return true;}
    const {error}=await supabase.from("tracked_investments").delete().eq("id",id);
    if(error){console.error("[tracked_investments] delete",error);setError("Não foi possível excluir o registro.");return false;}
    setItems(prev=>prev.filter(x=>x.id!==id));return true;
  },[user,items]);
  const totals=useMemo(()=>items.reduce((a,x)=>({invested:a.invested+x.investedAmount,current:a.current+x.currentValue}),{invested:0,current:0}),[items]);
  return {items,loading,error,totals,add,update,remove,reload,cloudSynced:!!user && !error};
}
