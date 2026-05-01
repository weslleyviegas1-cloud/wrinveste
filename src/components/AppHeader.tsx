import { motion } from "framer-motion";
import { Cloud, CloudOff, LogOut } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useAuth } from "@/contexts/AuthContext";

export function AppHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const { user, signOut } = useAuth();

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="flex items-center justify-between gap-3 px-5 pt-6 pb-4 sm:px-8 sm:pt-8"
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
          <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-primary glow-green" />
          WR Investe
        </div>
        <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-3xl truncate">
          {title}
        </h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground truncate">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-2">
        {user ? (
          <>
            <div
              className="flex h-11 items-center gap-1.5 rounded-2xl glass px-3 text-xs font-medium text-primary"
              title={user.email ?? "Conectado"}
            >
              <Cloud className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sincronizado</span>
            </div>
            <button
              onClick={() => signOut()}
              className="flex h-11 w-11 items-center justify-center rounded-2xl glass text-muted-foreground transition-colors hover:text-danger"
              aria-label="Sair"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </>
        ) : (
          <Link
            to="/login"
            className="flex h-11 items-center gap-2 rounded-2xl gradient-primary px-4 text-xs font-semibold text-primary-foreground shadow-[var(--shadow-glow-green)]"
          >
            <CloudOff className="h-4 w-4" />
            Entrar
          </Link>
        )}
      </div>
    </motion.header>
  );
}
