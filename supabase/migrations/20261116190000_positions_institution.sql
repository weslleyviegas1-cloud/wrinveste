-- Add the custodian/broker to each portfolio position.
-- Existing rows remain valid and are assigned an empty institution label.
ALTER TABLE public.positions
  ADD COLUMN IF NOT EXISTS institution TEXT NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS positions_user_institution_idx
  ON public.positions (user_id, institution);
