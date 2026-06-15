-- =============================================================================
-- Migration 012: RLS performance + hardening (auditoria jun/2026)
-- =============================================================================
-- NENHUMA mudança de SEGURANÇA: as políticas reescritas aqui são
-- SEMANTICAMENTE IDÊNTICAS às originais (mesmas linhas visíveis/graváveis).
-- A única diferença é de PERFORMANCE.
--
-- Por quê: chamar `auth.uid()` / `auth.jwt()` direto numa policy faz o Postgres
-- RE-AVALIAR a função PARA CADA LINHA varrida. Envolvendo em subquery
-- `(select auth.uid())` o planner avalia UMA vez (InitPlan) e reusa o resultado.
-- É a recomendação oficial da Supabase para RLS em escala.
-- Ref: https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select
--
-- DEFENSIVA: cada bloco só roda se a tabela/função existir (to_regclass / pg_proc).
-- Assim a migration não falha se alguma migration anterior (008/010/011, etc.)
-- ainda não tiver sido aplicada neste banco — ela apenas pula o que não existe.
--
-- Idempotente: pode rodar mais de uma vez sem efeito colateral.
-- Rodar manualmente no SQL Editor do Supabase.
-- =============================================================================

-- 1. leaderboard (migration 002) + índice de ordenação do ranking -----------
DO $$ BEGIN
  IF to_regclass('public.leaderboard') IS NOT NULL THEN
    DROP POLICY IF EXISTS "leaderboard_insert_own" ON public.leaderboard;
    CREATE POLICY "leaderboard_insert_own"
      ON public.leaderboard FOR INSERT
      WITH CHECK (user_id IS NULL OR user_id = (select auth.uid()));

    DROP POLICY IF EXISTS "leaderboard_update_own" ON public.leaderboard;
    CREATE POLICY "leaderboard_update_own"
      ON public.leaderboard FOR UPDATE
      USING (user_id = (select auth.uid()))
      WITH CHECK (user_id = (select auth.uid()));

    -- O ranking "Recorde" ordena por score DESC LIMIT N e não tinha índice
    -- de ordenação (paridade com o índice de profiles_stats da migration 009).
    CREATE INDEX IF NOT EXISTS idx_leaderboard_score
      ON public.leaderboard (score DESC);
  END IF;
END $$;

-- 2. ai_usage (migration 003) -----------------------------------------------
DO $$ BEGIN
  IF to_regclass('public.ai_usage') IS NOT NULL THEN
    DROP POLICY IF EXISTS "read own usage" ON public.ai_usage;
    CREATE POLICY "read own usage"
      ON public.ai_usage FOR SELECT
      USING ((select auth.uid()) = user_id);
  END IF;
END $$;

-- 3. push_subscriptions (migration 004) -------------------------------------
--    Lógica preservada (inclui o caso user_id IS NULL — ver nota da auditoria).
DO $$ BEGIN
  IF to_regclass('public.push_subscriptions') IS NOT NULL THEN
    DROP POLICY IF EXISTS "users_own_subscriptions" ON public.push_subscriptions;
    CREATE POLICY "users_own_subscriptions"
      ON public.push_subscriptions FOR ALL
      USING      ((select auth.uid()) = user_id OR user_id IS NULL)
      WITH CHECK ((select auth.uid()) = user_id OR user_id IS NULL);
  END IF;
END $$;

-- 4. profiles_stats (migration 009) -----------------------------------------
DO $$ BEGIN
  IF to_regclass('public.profiles_stats') IS NOT NULL THEN
    DROP POLICY IF EXISTS "profiles_stats_insert_own" ON public.profiles_stats;
    CREATE POLICY "profiles_stats_insert_own"
      ON public.profiles_stats FOR INSERT
      WITH CHECK (user_id = (select auth.uid()));

    DROP POLICY IF EXISTS "profiles_stats_update_own" ON public.profiles_stats;
    CREATE POLICY "profiles_stats_update_own"
      ON public.profiles_stats FOR UPDATE
      USING (user_id = (select auth.uid()))
      WITH CHECK (user_id = (select auth.uid()));
  END IF;
END $$;

-- 5. Policies admin com auth.jwt() (migrations 008 / 010 / 011) --------------
DO $$ BEGIN
  IF to_regclass('public.question_ratings') IS NOT NULL THEN
    DROP POLICY IF EXISTS "question_ratings_select_admin" ON public.question_ratings;
    CREATE POLICY "question_ratings_select_admin"
      ON public.question_ratings FOR SELECT
      USING (coalesce(((select auth.jwt()) -> 'app_metadata' ->> 'is_admin')::boolean, false) = true);
  END IF;

  IF to_regclass('public.question_difficulty_votes') IS NOT NULL THEN
    DROP POLICY IF EXISTS "qdv_select_admin" ON public.question_difficulty_votes;
    CREATE POLICY "qdv_select_admin"
      ON public.question_difficulty_votes FOR SELECT
      USING (coalesce(((select auth.jwt()) -> 'app_metadata' ->> 'is_admin')::boolean, false) = true);
  END IF;

  IF to_regclass('public.question_error_reasons') IS NOT NULL THEN
    DROP POLICY IF EXISTS "qer_select_admin" ON public.question_error_reasons;
    CREATE POLICY "qer_select_admin"
      ON public.question_error_reasons FOR SELECT
      USING (coalesce(((select auth.jwt()) -> 'app_metadata' ->> 'is_admin')::boolean, false) = true);
  END IF;
END $$;

-- 6. Hardening: search_path fixo nas funções (Security Advisor) --------------
--    "Function Search Path Mutable" — funções SECURITY DEFINER sem search_path
--    fixo são vulneráveis a search_path injection. Fixamos para um valor
--    determinístico. Usamos `pg_catalog, public` (em vez de '') para não quebrar
--    referências não-qualificadas no corpo das funções, cujo código não temos aqui.
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p
    WHERE p.pronamespace = 'public'::regnamespace
      AND p.proname IN ('is_admin', 'handle_new_user')
  LOOP
    EXECUTE format('ALTER FUNCTION %s SET search_path = pg_catalog, public', r.sig);
  END LOOP;
END $$;
