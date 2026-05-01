import { Outlet, Link, createRootRoute, HeadContent, Scripts, useRouterState } from "@tanstack/react-router";
import { BottomNav } from "@/components/BottomNav";
import { AuthProvider } from "@/contexts/AuthContext";
import { PWARegister } from "@/components/PWARegister";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-7xl font-bold text-gradient-primary">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Página não encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          O conteúdo que você procura não existe ou foi movido.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-xl gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg transition-transform hover:scale-105"
          >
            Voltar ao Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "WR Investe — Assistente Inteligente de Fundos Imobiliários" },
      {
        name: "description",
        content:
          "Acompanhe sua carteira de FIIs, simule investimentos, analise dividendos e visualize sua renda passiva em uma experiência premium.",
      },
      { name: "theme-color", content: "#0B0B0B" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "WR Investe" },
      { name: "mobile-web-app-capable", content: "yes" },
      { property: "og:title", content: "WR Investe — Assistente Inteligente de Fundos Imobiliários" },
      {
        property: "og:description",
        content: "Carteira, simulador, ranking e renda passiva em um app fintech premium.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "WR Investe — Assistente Inteligente de Fundos Imobiliários" },
      { name: "description", content: "WR Investe is a premium financial app for tracking, analyzing, and simulating Real Estate Investment Trust (FII) investments." },
      { property: "og:description", content: "WR Investe is a premium financial app for tracking, analyzing, and simulating Real Estate Investment Trust (FII) investments." },
      { name: "twitter:description", content: "WR Investe is a premium financial app for tracking, analyzing, and simulating Real Estate Investment Trust (FII) investments." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/5a3f1b67-1d3a-4cbd-8a58-edc680cf2a75/id-preview-25b77848--2cfeb623-4cfc-4ad2-94e8-682a93c93967.lovable.app-1777666956959.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/5a3f1b67-1d3a-4cbd-8a58-edc680cf2a75/id-preview-25b77848--2cfeb623-4cfc-4ad2-94e8-682a93c93967.lovable.app-1777666956959.png" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "icon", type: "image/png", sizes: "192x192", href: "/icon-192.png" },
      { rel: "icon", type: "image/png", sizes: "512x512", href: "/icon-512.png" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="dark">
      <head>
        <HeadContent />
      </head>
      <body className="min-h-screen">
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const hideNav = pathname.startsWith("/login");
  return (
    <AuthProvider>
      <PWARegister />
      <div className={`relative min-h-screen ${hideNav ? "" : "pb-28"}`}>
        <div className="mx-auto max-w-2xl">
          <Outlet />
        </div>
        {!hideNav && <BottomNav />}
      </div>
    </AuthProvider>
  );
}
