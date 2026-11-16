import { Outlet, Link, createRootRoute, HeadContent, Scripts, useRouterState } from "@tanstack/react-router";
import { AuthProvider } from "@/contexts/AuthContext";
import { PWARegister } from "@/components/PWARegister";
import { BottomNav } from "@/components/BottomNav";
import { Home, Wallet, PieChart, Search, Calculator, Sparkles, BriefcaseBusiness, Landmark } from "lucide-react";
import appCss from "../styles.css?url";

const navigation = [
  { to: "/", label: "Início", icon: Home },
  { to: "/investimentos", label: "Investimentos", icon: BriefcaseBusiness },
  { to: "/patrimonio", label: "Meu patrimônio", icon: Landmark },
  { to: "/fundos", label: "Pesquisar FIIs", icon: Search },
  { to: "/carteira", label: "Carteira", icon: Wallet },
  { to: "/simulador", label: "Análises", icon: PieChart },
  { to: "/recomendacoes", label: "Produtos", icon: Sparkles },
] as const;

function NotFoundComponent() {
  return <div className="flex min-h-screen items-center justify-center bg-background px-4"><div className="max-w-md text-center"><h1 className="font-display text-7xl font-bold text-gradient-primary">404</h1><h2 className="mt-4 text-xl font-semibold text-foreground">Página não encontrada</h2><p className="mt-2 text-sm text-muted-foreground">O conteúdo que você procura não existe ou foi movido.</p><Link to="/" className="mt-6 inline-flex rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">Voltar ao início</Link></div></div>;
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "WR Investimentos — Sua plataforma financeira" },
      { name: "description", content: "Acompanhe sua carteira, pesquise ativos e analise seus investimentos na WR." },
      { name: "theme-color", content: "#090909" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "WR Investimentos" },
      { name: "mobile-web-app-capable", content: "yes" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "icon", type: "image/png", href: "/favicon.png" },
      { rel: "icon", type: "image/png", sizes: "192x192", href: "/icon-192.png" },
      { rel: "icon", type: "image/png", sizes: "512x512", href: "/icon-512.png" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;600;700&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return <html lang="pt-BR" className="dark"><head><HeadContent /></head><body className="min-h-screen"><div id="app-shell">{children}</div><Scripts /></body></html>;
}

function RootComponent() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const hideNav = pathname.startsWith("/login");
  return <AuthProvider><PWARegister />{hideNav ? <Outlet /> : <div className="wr-app-shell">
    <aside className="wr-sidebar">
      <Link to="/" className="wr-brand" aria-label="WR Investimentos"><img src="/icon-512.png" alt="WR Investe" className="wr-brand-logo" /></Link>
      <nav className="wr-side-nav" aria-label="Navegação principal">
        {navigation.map((item) => { const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to); const Icon = item.icon; return <Link key={item.to} to={item.to} className={`wr-side-link ${active ? "active" : ""}`}><Icon size={21} strokeWidth={2.2} /><span>{item.label}</span></Link>; })}
      </nav>
      <div className="wr-sidebar-foot"><span className="wr-foot-mark">WR</span><span>Mais controle<br/>para investir.</span></div>
    </aside>
    <main className="wr-main"><div className="wr-content"><Outlet /></div></main>
    <BottomNav />
  </div>}</AuthProvider>;
}
