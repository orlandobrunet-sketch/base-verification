-- Add payment/subscription columns to profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS premium_plan        text,          -- 'monthly' | 'lifetime'
  ADD COLUMN IF NOT EXISTS premium_expires_at  timestamptz,   -- NULL = lifetime / não expira
  ADD COLUMN IF NOT EXISTS premium_updated_at  timestamptz,   -- última atualização de status
  ADD COLUMN IF NOT EXISTS mp_payment_id       text;          -- ID do pagamento no Mercado Pago

-- Index para expiração (útil para job de revogação futura)
CREATE INDEX IF NOT EXISTS idx_profiles_premium_expires
  ON public.profiles (premium_expires_at)
  WHERE is_premium = true AND premium_expires_at IS NOT NULL;

COMMENT ON COLUMN public.profiles.premium_plan       IS 'Plano ativo: monthly ou lifetime';
COMMENT ON COLUMN public.profiles.premium_expires_at IS 'Data de expiração. NULL = acesso vitalício';
COMMENT ON COLUMN public.profiles.mp_payment_id      IS 'ID do pagamento aprovado no Mercado Pago';
