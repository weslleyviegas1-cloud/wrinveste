import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Wallet, ListOrdered, Calculator, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const items = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/carteira", label: "Carteira", icon: Wallet },
  { to: "/recomendacoes", label: "Investir", icon: Sparkles },
  { to: "/fundos", label: "Fundos", icon: ListOrdered },
  { to: "/simulador", label: "Simular", icon: Calculator },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 px-3 pb-3 pt-2 sm:px-6 sm:pb-5">
      <div className="mx-auto flex max-w-2xl items-center justify-between gap-1 rounded-2xl glass-strong px-2 py-2">
        {items.map((item) => {
          const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className="relative flex flex-1 flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-xs font-medium transition-colors"
            >
              {active && (
                <motion.div
                  layoutId="nav-active"
                  className="absolute inset-0 rounded-xl bg-primary/15 ring-1 ring-primary/30"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
              <Icon
                className={`relative h-5 w-5 transition-colors ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              />
              <span
                className={`relative ${
                  active ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
