-- =============================================================================
-- Migration 002: Leaderboard — RLS + user_id + upsert support
-- =============================================================================
-- Objetivo:
--   1. Adicionar coluna user_id na leaderboard (FK para auth.users)
--   2. Ativar Row Level Security na tabela
--   3. Criar políticas: leitura pública, escrita apenas pelo próprio usuário
--   4. Adicionar índice único por user_id para suporte a upsert (merge-duplicates)
--   5. Limitar score máximo aceito via check constraint
-- =============================================================================

-- 1. Adicionar user_id (nullable para manter compatibilidade com entradas anônimas antigas)
ALTER TABLE public.leaderboard
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2. Índice único por user_id (NULL não quebra a unicidade — padrão SQL)
--    Permite upsert por user_id: cada usuário autenticado tem 1 entrada no ranking
CREATE UNIQUE INDEX IF NOT EXISTS idx_leaderboard_user_id_unique
  ON public.leaderboard (user_id)
  WHERE user_id IS NOT NULL;

-- 3. Check constraints de sanidade (bloqueio no banco, não só no cliente)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_score_range' AND conrelid = 'public.leaderboard'::regclass) THEN
    ALTER TABLE public.leaderboard ADD CONSTRAINT chk_score_range CHECK (score >= 0 AND score <= 9999999);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_level_range' AND conrelid = 'public.leaderboard'::regclass) THEN
    ALTER TABLE public.leaderboard ADD CONSTRAINT chk_level_range CHECK (level >= 1 AND level <= 999);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_player_name_length' AND conrelid = 'public.leaderboard'::regclass) THEN
    ALTER TABLE public.leaderboard ADD CONSTRAINT chk_player_name_length CHECK (char_length(player_name) <= 40 AND char_length(player_name) >= 1);
  END IF;
END $$;

-- 4. Ativar RLS
ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;

-- 5. Política: leitura pública (SELECT) — qualquer um pode ver o ranking
DROP POLICY IF EXISTS "leaderboard_select_public" ON public.leaderboard;
CREATE POLICY "leaderboard_select_public"
  ON public.leaderboard
  FOR SELECT
  USING (true);

-- 6. Política: INSERT apenas para usuário autenticado inserindo seu próprio user_id
--    OU entradas sem user_id (jogadores anônimos ainda podem entrar)
DROP POLICY IF EXISTS "leaderboard_insert_own" ON public.leaderboard;
CREATE POLICY "leaderboard_insert_own"
  ON public.leaderboard
  FOR INSERT
  WITH CHECK (
    user_id IS NULL                        -- entrada anônima
    OR user_id = auth.uid()                -- usuário inserindo por si mesmo
  );

-- 7. Política: UPDATE apenas pelo próprio usuário (suporte ao upsert)
DROP POLICY IF EXISTS "leaderboard_update_own" ON public.leaderboard;
CREATE POLICY "leaderboard_update_own"
  ON public.leaderboard
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 8. Nenhum usuário pode DELETE entradas (apenas admin via service_role)
--    (sem política de DELETE = ninguém pode deletar via API pública)

-- =============================================================================
-- Comentários
-- =============================================================================
COMMENT ON COLUMN public.leaderboard.user_id IS
  'UUID do usuário autenticado (auth.users). NULL = entrada anônima.';
