-- 017: impede que usuários autenticados auto-concedam premium na tabela profiles
--
-- ACHADO (auditoria de segurança, jun/2026): as policies RLS de profiles
-- (`profiles_update_own`, `profiles_insert_own`) permitem INSERT/UPDATE quando
-- auth.uid() = id, SEM restrição de coluna. Logo, um usuário autenticado pode setar
-- is_premium=true / premium_plan / premium_expires_at / mp_payment_id no próprio
-- registro via PostgREST (UPDATE, ou DELETE + INSERT) e se conceder premium.
-- Premium deve ser definido SOMENTE pelo webhook do Mercado Pago (service_role).
--
-- Mitigante: a cota de IA usa app_metadata.premium (não alterável pelo usuário),
-- então isso não concede IA grátis; mas é um bypass de paywall que deve ser fechado
-- antes do lançamento. O cliente nunca escreve essas colunas legitimamente
-- (verificado), então o trigger não quebra nenhum fluxo do app.
--
-- Correção: trigger BEFORE INSERT OR UPDATE.
--   - UPDATE por usuário autenticado que altere colunas de premium -> rejeita.
--   - INSERT por usuário autenticado -> força colunas de premium para o default
--     seguro (não premium). O service_role (webhook) não tem role 'authenticated'
--     no JWT e continua podendo definir premium.

CREATE OR REPLACE FUNCTION public.profiles_block_premium_self_update()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
AS $function$
BEGIN
  IF (auth.jwt() ->> 'role') = 'authenticated' THEN
    IF TG_OP = 'INSERT' THEN
      NEW.is_premium         := false;
      NEW.premium_plan       := NULL;
      NEW.premium_expires_at := NULL;
      NEW.mp_payment_id      := NULL;
    ELSIF TG_OP = 'UPDATE' THEN
      IF NEW.is_premium         IS DISTINCT FROM OLD.is_premium
         OR NEW.premium_plan       IS DISTINCT FROM OLD.premium_plan
         OR NEW.premium_expires_at IS DISTINCT FROM OLD.premium_expires_at
         OR NEW.mp_payment_id      IS DISTINCT FROM OLD.mp_payment_id THEN
        RAISE EXCEPTION 'As colunas de premium só podem ser alteradas pelo servidor (webhook).';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS profiles_block_premium_self_update ON public.profiles;
CREATE TRIGGER profiles_block_premium_self_update
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.profiles_block_premium_self_update();
