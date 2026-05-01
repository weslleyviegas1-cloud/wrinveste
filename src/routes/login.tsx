import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Mail, Lock, Loader2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Entrar — FII Premium" },
      { name: "description", content: "Acesse sua carteira na nuvem e sincronize entre dispositivos." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: "error" | "info"; text: string } | null>(null);

  useEffect(() => {
    if (user) navigate({ to: "/" });
  }, [user, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/` },
        });
        if (error) throw error;
        setMsg({ type: "info", text: "Conta criada! Você já está conectado." });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      const m = err instanceof Error ? err.message : "Erro inesperado";
      setMsg({ type: "error", text: traduzir(m) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="px-5 pb-10 pt-6 sm:px-8 sm:pt-10">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Voltar
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-6 rounded-3xl glass-strong p-6 sm:p-7"
      >
        <div className="mb-1 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
          Sincronização na Nuvem
        </div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          {mode === "signin" ? "Entrar" : "Criar conta"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sua carteira fica salva e sincroniza entre dispositivos.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-3">
          <Field
            icon={<Mail className="h-4 w-4" />}
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={setEmail}
            required
          />
          <Field
            icon={<Lock className="h-4 w-4" />}
            type="password"
            placeholder="Senha (mín. 6 caracteres)"
            value={password}
            onChange={setPassword}
            required
            minLength={6}
          />

          {msg && (
            <div
              className={`rounded-xl border px-3 py-2 text-xs ${
                msg.type === "error"
                  ? "border-danger/30 bg-danger/10 text-danger"
                  : "border-primary/30 bg-primary/10 text-primary"
              }`}
            >
              {msg.text}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-xl gradient-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow-green)] transition-transform disabled:opacity-60"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === "signin" ? "Entrar" : "Criar conta"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setMode((m) => (m === "signin" ? "signup" : "signin"));
            setMsg(null);
          }}
          className="mt-4 w-full text-center text-xs text-muted-foreground hover:text-foreground"
        >
          {mode === "signin" ? "Ainda não tem conta? Criar agora" : "Já tem conta? Entrar"}
        </button>
      </motion.div>

      <p className="mt-5 text-[11px] leading-relaxed text-muted-foreground">
        Sua carteira atual no dispositivo será migrada automaticamente para a nuvem ao entrar pela
        primeira vez.
      </p>
    </div>
  );
}

function traduzir(msg: string) {
  if (/Invalid login credentials/i.test(msg)) return "E-mail ou senha incorretos.";
  if (/already registered/i.test(msg)) return "Este e-mail já tem uma conta. Faça login.";
  if (/Password should be/i.test(msg)) return "A senha deve ter pelo menos 6 caracteres.";
  return msg;
}

function Field({
  icon,
  value,
  onChange,
  ...rest
}: {
  icon: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  return (
    <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 focus-within:border-primary/50">
      <span className="text-muted-foreground">{icon}</span>
      <input
        {...rest}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
      />
    </label>
  );
}
