import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";

export function AppHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="flex items-center justify-between px-5 pt-6 pb-4 sm:px-8 sm:pt-8"
    >
      <div>
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
          <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-primary glow-green" />
          FII Premium
        </div>
        <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          {title}
        </h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="relative h-11 w-11 shrink-0">
        <div className="absolute inset-0 rounded-2xl gradient-primary opacity-90 blur-md" />
        <div className="relative flex h-full w-full items-center justify-center rounded-2xl glass-strong">
          <TrendingUp className="h-5 w-5 text-primary" />
        </div>
      </div>
    </motion.header>
  );
}
