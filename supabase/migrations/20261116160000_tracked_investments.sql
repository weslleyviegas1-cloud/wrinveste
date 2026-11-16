-- Carteira patrimonial consolidada: registros manuais independentes por instituição.
-- Não integra nem envia ordens a bancos/corretoras. Cada usuário só acessa seus próprios registros.
CREATE TABLE IF NOT EXISTS public.tracked_investments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  institution TEXT NOT NULL CHECK (char_length(institution) BETWEEN 1 AND 100),
  category TEXT NOT NULL CHECK (char_length(category) BETWEEN 1 AND 60),
  product_name TEXT NOT NULL CHECK (char_length(product_name) BETWEEN 1 AND 140),
  ticker TEXT,
  invested_amount NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK (invested_amount >= 0),
  current_value NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK (current_value >= 0),
  annual_rate NUMERIC(9,4),
  rate_index TEXT,
  liquidity TEXT NOT NULL DEFAULT 'Não informado',
  start_date DATE,
  maturity_date DATE,
  notes TEXT,
  valuation_mode TEXT NOT NULL DEFAULT 'manual' CHECK (valuation_mode IN ('manual','estimated')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS tracked_investments_user_idx ON public.tracked_investments(user_id, institution, category);
ALTER TABLE public.tracked_investments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage their own tracked investments" ON public.tracked_investments;
CREATE POLICY "Users manage their own tracked investments" ON public.tracked_investments
  FOR ALL TO authenticated USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tracked_investments TO authenticated;
