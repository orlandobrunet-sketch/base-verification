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
-- Conteúdo:
--   1. Reescreve policies de 002/003/004/009 (auth.uid) com (select auth.uid())
--   2. Reescreve policies admin de 008/010/011 (auth.jwt) com (select auth.jwt())
--   3. Índice de ordenação do ranking por recorde (leaderboard.score DESC)
--   4. Fixa search_path das funções is_admin()/handle_new_user() (Security Advisor)
--
-- Idempotente: pode rodar mais de uma vez sem efeito colateral.
-- Rodar manualmente no SQL Editor do Supabase.
-- =============================================================================

-- 1. leaderboard (migration 002) --------------------------------------------
DROP POLICY IF EXISTS "leaderboard_insert_own" ON public.leaderboard;
CREATE POLICY "leaderboard_insert_own"
  ON public.leaderboard
  FOR INSERT
  WITH CHECK (
    user_id IS NULL
    OR user_id = (select auth.uid())
  );

DROP POLICY IF EXISTS "leaderboard_update_own" ON public.leaderboard;
CREATE POLICY "leaderboard_update_own"
  ON public.leaderboard
  FOR UPDATE
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- 2. ai_usage (migration 003) -----------------------------------------------
DROP POLICY IF EXISTS "read own usage" ON public.ai_usage;
CREATE POLICY "read own usage"
  ON public.ai_usage FOR SELECT
  USING ((select auth.uid()) = user_id);

-- 3. push_subscriptions (migration 004) -------------------------------------
--    Lógica preservada (inclui o caso user_id IS NULL — ver nota da auditoria).
DROP POLICY IF EXISTS "users_own_subscriptions" ON public.push_subscriptions;
CREATE POLICY "users_own_subscriptions"
  ON public.push_subscriptions
  FOR ALL
  USING      ((select auth.uid()) = user_id OR user_id IS NULL)
  WITH CHECK ((select auth.uid()) = user_id OR user_id IS NULL);

-- 4. profiles_stats (migration 009) -----------------------------------------
DROP POLICY IF EXISTS "profiles_stats_insert_own" ON public.profiles_stats;
CREATE POLICY "profiles_stats_insert_own"
  ON public.profiles_stats FOR INSERT
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "profiles_stats_update_own" ON public.profiles_stats;
CREATE POLICY "profiles_stats_update_own"
  ON public.profiles_stats FOR UPDATE
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- 5. Policies admin com auth.jwt() (migrations 008 / 010 / 011) --------------
DROP POLICY IF EXISTS "question_ratings_select_admin" ON public.question_ratings;
CREATE POLICY "question_ratings_select_admin"
  ON public.question_ratings FOR SELECT
  USING (coalesce(((select auth.jwt()) -> 'app_metadata' ->> 'is_admin')::boolean, false) = true);

DROP POLICY IF EXISTS "qdv_select_admin" ON public.question_difficulty_votes;
CREATE POLICY "qdv_select_admin"
  ON public.question_difficulty_votes FOR SELECT
  USING (coalesce(((select auth.jwt()) -> 'app_metadata' ->> 'is_admin')::boolean, false) = true);

DROP POLICY IF EXISTS "qer_select_admin" ON public.question_error_reasons;
CREATE POLICY "qer_select_admin"
  ON public.question_error_reasons FOR SELECT
  USING (coalesce(((select auth.jwt()) -> 'app_metadata' ->> 'is_admin')::boolean, false) = true);

-- 6. Índice de ordenação do ranking por recorde -----------------------------
--    O leaderboard "Recorde" ordena por score DESC LIMIT N. Havia índice único
--    por user_id (upsert), mas nenhum para a ordenação. Paridade com o índice
--    de profiles_stats (total_correct DESC, best_level DESC) da migration 009.
CREATE INDEX IF NOT EXISTS idx_leaderboard_score
  ON public.leaderboard (score DESC);

-- 7. Hardening: search_path fixo nas funções (Security Advisor) --------------
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
