-- =============================================================================
-- Migration 015: RLS performance — consolidação de políticas + initplan (jun/2026)
-- =============================================================================
-- NENHUMA mudança de SEGURANÇA: todas as alterações são SEMANTICAMENTE
-- IDÊNTICAS (mesmas linhas visíveis/graváveis pelos mesmos papéis). Apenas
-- PERFORMANCE — resolve os WARNs do Performance Advisor da Supabase:
--   - auth_rls_initplan        (auth.uid()/auth.email() cru → reavalia por linha)
--   - multiple_permissive_policies (políticas redundantes avaliadas por query)
--   - duplicate_index          (dois índices idênticos em leaderboard(score DESC))
--
-- Verificado contra as definições ao vivo (pg_policies) antes de escrever:
--   - leaderboard_select_all  == leaderboard_select_public  (ambas USING true)
--   - leaderboard_insert_any  == leaderboard_insert_own     (mesma lógica; a
--     versão _own já usa (select auth.uid()), então removemos a _any redundante)
--   - profiles_* e "Users check own whitelist" usavam auth.*() cru → envolvemos
--     em (select ...) para o planner avaliar uma vez (InitPlan).
--
-- Idempotente e defensiva: cada bloco só roda se a tabela existir.
-- Rodar manualmente no SQL Editor do Supabase (ou via `supabase db query`).
-- =============================================================================

-- 1. leaderboard: remover políticas e índice DUPLICADOS -----------------------
DO $$ BEGIN
  IF to_regclass('public.leaderboard') IS NOT NULL THEN
    -- SELECT: leaderboard_select_all (USING true) é idêntica a
    -- leaderboard_select_public (USING true) → mantém só uma.
    DROP POLICY IF EXISTS "leaderboard_select_all" ON public.leaderboard;

    -- INSERT: leaderboard_insert_any tem a MESMA lógica de leaderboard_insert_own
    -- mas chama auth.uid() cru (initplan). A _own já é a versão otimizada
    -- (migration 012) → removemos a _any redundante.
    DROP POLICY IF EXISTS "leaderboard_insert_any" ON public.leaderboard;

    -- Índice duplicado: leaderboard_score_idx == idx_leaderboard_score
    -- (ambos btree(score DESC)). Mantém idx_leaderboard_score (migration 012).
    DROP INDEX IF EXISTS public.leaderboard_score_idx;
  END IF;
END $$;

-- 2. profiles: envolver auth.uid() em (select ...) -- mesma semântica ---------
DO $$ BEGIN
  IF to_regclass('public.profiles') IS NOT NULL THEN
    DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
    CREATE POLICY "profiles_select_own"
      ON public.profiles FOR SELECT
      USING ((select auth.uid()) = id);

    DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
    CREATE POLICY "profiles_insert_own"
      ON public.profiles FOR INSERT
      WITH CHECK ((select auth.uid()) = id);

    DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
    CREATE POLICY "profiles_update_own"
      ON public.profiles FOR UPDATE
      USING ((select auth.uid()) = id)
      WITH CHECK ((select auth.uid()) = id);
  END IF;
END $$;

-- 3. access_whitelist: envolver auth.email() em (select ...) ------------------
--    Lógica preservada: usuário vê a própria linha pelo e-mail. A política de
--    admin ("Admin manages whitelist", FOR ALL com is_admin()) é mantida — a
--    sobreposição admin+self em SELECT é de baixo impacto (tabela pequena) e
--    consolidá-la mudaria a estrutura de papéis sem ganho real.
DO $$ BEGIN
  IF to_regclass('public.access_whitelist') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Users check own whitelist" ON public.access_whitelist;
    CREATE POLICY "Users check own whitelist"
      ON public.access_whitelist FOR SELECT
      USING (email = (select auth.email()));
  END IF;
END $$;

-- =============================================================================
-- NÃO incluído de propósito (decisão de auditoria — requer mudança de feature):
--   - rls_policy_always_true em question_ratings / question_difficulty_votes /
--     question_error_reasons: INSERT público com WITH CHECK (true) é INTENCIONAL
--     (crowd-sourcing anônimo). Mitigação real = rate-limit no app + validação
--     de colunas; não alteramos aqui para não quebrar inserts legítimos.
--   - authenticated_security_definer_function_executable em is_admin(): a RLS
--     depende de is_admin() ser chamável; endurecer (revoke/ schema privado)
--     é follow-up cuidadoso, fora do escopo desta migration de performance.
-- =============================================================================
