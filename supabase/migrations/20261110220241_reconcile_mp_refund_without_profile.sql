-- Mantém a conciliação de estornos mesmo após a exclusão do perfil.
-- A assinatura da RPC e o contrato com mp-webhook permanecem os mesmos.
BEGIN;

CREATE OR REPLACE FUNCTION public.process_mp_payment(
  p_payment_id text,
  p_user_id uuid,
  p_plan text,
  p_status text,
  p_amount numeric,
  p_currency text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
SET timezone = 'UTC'
AS $function$
DECLARE
  current_profile public.profiles%ROWTYPE;
  granted public.processed_payments%ROWTYPE;
  refund_owner uuid;
  has_profile boolean;
  has_grant boolean;
  marker text;
  expected_amount numeric;
  expires timestamptz;
  final_plan text;
  changed boolean := false;
BEGIN
  IF p_payment_id IS NULL OR p_payment_id !~ '^[0-9]+$' OR p_user_id IS NULL THEN
    RAISE EXCEPTION 'Invalid payment identity' USING ERRCODE = '22023';
  END IF;
  IF p_status IS NULL OR p_status NOT IN ('approved', 'refunded', 'charged_back') THEN
    RETURN jsonb_build_object('outcome', 'ignored');
  END IF;
  marker := p_payment_id || ':estorno';

  IF p_status = 'approved' THEN
    expected_amount := CASE p_plan WHEN 'monthly' THEN 14.90 WHEN 'lifetime' THEN 199.00 ELSE NULL END;
    IF expected_amount IS NULL OR p_currency IS DISTINCT FROM 'BRL' OR p_amount IS NULL
       OR p_amount::text IN ('NaN', 'Infinity', '-Infinity') OR p_amount < expected_amount THEN
      RETURN jsonb_build_object('outcome', 'invalid_payment');
    END IF;
  END IF;

  -- Serializa eventos do mesmo pagamento mesmo sem uma linha de perfil.
  -- O bloqueio do perfil também serializa pagamentos distintos da mesma conta.
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('nefroquest:mp:' || p_payment_id, 0));
  SELECT * INTO current_profile FROM public.profiles WHERE id = p_user_id FOR UPDATE;
  has_profile := FOUND;

  -- O histórico e o acesso continuam na mesma transação.
  SELECT * INTO granted FROM public.processed_payments WHERE payment_id = p_payment_id;
  has_grant := FOUND;
  IF has_grant AND granted.user_id IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Payment owner mismatch' USING ERRCODE = '22023';
  END IF;
  SELECT user_id INTO refund_owner FROM public.processed_payments WHERE payment_id = marker;
  IF FOUND THEN
    IF refund_owner IS DISTINCT FROM p_user_id THEN
      RAISE EXCEPTION 'Payment owner mismatch' USING ERRCODE = '22023';
    END IF;
    RETURN jsonb_build_object('outcome', 'already_refunded');
  END IF;

  IF p_status IN ('refunded', 'charged_back') THEN
    -- Guarda inclusive o estorno que chegou antes da aprovação.
    INSERT INTO public.processed_payments(payment_id, user_id, plan)
      VALUES(marker, p_user_id, 'refund');

    IF NOT has_profile THEN
      RETURN jsonb_build_object('outcome', 'refund_recorded');
    END IF;

    IF NOT has_grant THEN
      -- Compatibilidade com pagamentos anteriores ao histórico da migration 007.
      IF current_profile.mp_payment_id = p_payment_id THEN
        UPDATE public.profiles SET is_premium = false, premium_expires_at = NULL,
          premium_updated_at = now() WHERE id = p_user_id;
        changed := true;
      END IF;
    ELSIF current_profile.is_premium AND current_profile.premium_plan = 'lifetime' THEN
      IF granted.plan = 'lifetime' AND NOT EXISTS (
        SELECT FROM public.processed_payments paid
        WHERE paid.user_id = p_user_id AND paid.plan = 'lifetime'
          AND NOT EXISTS (SELECT FROM public.processed_payments refunded
            WHERE refunded.payment_id = paid.payment_id || ':estorno')
      ) THEN
        UPDATE public.profiles SET is_premium = false, premium_expires_at = NULL,
          premium_updated_at = now() WHERE id = p_user_id;
        changed := true;
      END IF;
    ELSIF current_profile.is_premium AND granted.plan = 'monthly'
          AND current_profile.premium_expires_at IS NOT NULL THEN
      expires := current_profile.premium_expires_at - interval '32 days';
      UPDATE public.profiles SET is_premium = expires > now(),
        premium_expires_at = CASE WHEN expires > now() THEN expires ELSE NULL END,
        premium_updated_at = now() WHERE id = p_user_id;
      changed := true;
    END IF;
    RETURN jsonb_build_object('outcome', CASE WHEN changed THEN 'revoked' ELSE 'refund_recorded' END);
  END IF;

  IF has_grant THEN
    RETURN jsonb_build_object('outcome', 'already_processed');
  END IF;
  IF NOT has_profile THEN
    -- Uma compra inédita precisa de um perfil para conceder acesso.
    RAISE EXCEPTION 'Payment profile not found' USING ERRCODE = 'P0002';
  END IF;

  final_plan := CASE WHEN current_profile.is_premium AND current_profile.premium_plan = 'lifetime'
    THEN 'lifetime' ELSE p_plan END;
  IF final_plan = 'monthly' THEN
    expires := greatest(now(), CASE WHEN current_profile.is_premium
      THEN current_profile.premium_expires_at ELSE NULL END) + interval '32 days';
  END IF;

  INSERT INTO public.processed_payments(payment_id, user_id, plan)
    VALUES(p_payment_id, p_user_id, p_plan);
  UPDATE public.profiles SET is_premium = true, premium_plan = final_plan,
    premium_expires_at = expires, premium_updated_at = now(),
    mp_payment_id = CASE WHEN current_profile.is_premium AND current_profile.premium_plan = 'lifetime'
      THEN current_profile.mp_payment_id ELSE p_payment_id END
    WHERE id = p_user_id;
  RETURN jsonb_build_object('outcome', 'activated', 'plan', final_plan, 'expires_at', expires);
END;
$function$;

REVOKE ALL ON FUNCTION public.process_mp_payment(text, uuid, text, text, numeric, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.process_mp_payment(text, uuid, text, text, numeric, text)
  TO service_role;

COMMIT;
