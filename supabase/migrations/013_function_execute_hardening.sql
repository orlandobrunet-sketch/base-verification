-- =============================================================================
-- Migration 013: hardening de EXECUTE nas funções SECURITY DEFINER
-- =============================================================================
-- A migration 006 tentou revogar EXECUTE de `is_admin()` e `handle_new_user()`,
-- mas revogou apenas de `anon`/`authenticated` — NÃO de `PUBLIC`. Como anon e
-- authenticated herdam o grant implícito de PUBLIC (toda função nasce com
-- EXECUTE para PUBLIC), o revoke foi inócuo e o Security Advisor seguiu
-- apontando "Public/Signed-In Can Execute SECURITY DEFINER Function".
--
-- Correção: revogar de PUBLIC (o grant que realmente vale) e então conceder
-- explicitamente só onde faz sentido.
--   - handle_new_user(): função de trigger — não deve ser chamável diretamente
--     por nenhum role (o trigger executa no contexto do owner). Revoga de todos.
--   - is_admin(): mantém EXECUTE para `authenticated` (intenção da 006); anon
--     perde o acesso. O app usa o claim JWT app_metadata.is_admin diretamente,
--     então a função SQL não é chamada via RPC pelo cliente.
--
-- Defensiva (só age se a função existir) e idempotente.
-- Rodar manualmente no SQL Editor do Supabase.
-- =============================================================================

DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig, p.proname
    FROM pg_proc p
    WHERE p.pronamespace = 'public'::regnamespace
      AND p.proname IN ('is_admin', 'handle_new_user')
  LOOP
    -- Revoga o grant implícito que realmente concede o acesso.
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC', r.sig);
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM anon', r.sig);

    IF r.proname = 'is_admin' THEN
      -- Usuário logado pode checar o próprio status (intenção da 006).
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', r.sig);
    ELSE
      -- handle_new_user é trigger: ninguém chama diretamente.
      EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM authenticated', r.sig);
    END IF;
  END LOOP;
END $$;
