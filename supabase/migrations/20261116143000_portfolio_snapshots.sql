-- Histórico real do patrimônio por usuário.
-- Não cria pontos retroativos: o gráfico começa a partir da primeira captura.
CREATE TABLE IF NOT EXISTS public.portfolio_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  total_value NUMERIC(18,2) NOT NULL CHECK (total_value >= 0),
  invested_value NUMERIC(18,2) NOT NULL CHECK (invested_value >= 0)
);

CREATE INDEX IF NOT EXISTS portfolio_snapshots_user_time_idx
  ON public.portfolio_snapshots (user_id, captured_at DESC);

ALTER TABLE public.portfolio_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own portfolio snapshots"
  ON public.portfolio_snapshots FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert their own portfolio snapshots"
  ON public.portfolio_snapshots FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

GRANT SELECT, INSERT ON public.portfolio_snapshots TO authenticated;
