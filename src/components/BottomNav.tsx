import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Wallet, ListOrdered, Calculator, Sparkles, BriefcaseBusiness, Landmark } from "lucide-react";

const items = [
  { to: "/", label: "Início", icon: LayoutDashboard },
  { to: "/carteira", label: "Carteira", icon: Wallet },
  { to: "/investimentos", label: "Investir", icon: BriefcaseBusiness },
  { to: "/patrimonio", label: "Patrimônio", icon: Landmark },
  { to: "/fundos", label: "FIIs", icon: ListOrdered },
  { to: "/simulador", label: "Análises", icon: Calculator },
  { to: "/recomendacoes", label: "Produtos", icon: Sparkles },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return <nav className="wr-mobile-nav" aria-label="Navegação principal">
    {items.map((item) => { const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to); const Icon = item.icon; return <Link key={item.to} to={item.to} aria-current={active ? "page" : undefined} className={`wr-mobile-link ${active ? "active" : ""}`}><Icon size={19} /><span>{item.label}</span></Link>; })}
  </nav>;
}
