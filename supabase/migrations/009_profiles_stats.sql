-- =============================================================================
-- Migration 009: profiles_stats — Leaderboard de Perfil Global (DC-4)
-- =============================================================================
-- Ranking por desempenho ACUMULADO (acertos totais), não só o recorde de uma
-- partida. Uma linha por usuário autenticado (upsert por user_id).
--
-- Schema usado pelo cliente (js/leaderboard.js → profileStatsPush):
--   { user_id, player_name, character_name, total_correct, total_games,
--     best_level, updated_at }
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.profiles_stats (
    user_id        uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    player_name    text        NOT NULL,
    character_name text,
    total_correct  integer     NOT NULL DEFAULT 0,
    total_games    integer     NOT NULL DEFAULT 0,
    best_level     integer     NOT NULL DEFAULT 1,
    updated_at     timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Sanidade dos valores (bloqueio no banco)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_ps_total_correct' AND conrelid = 'public.profiles_stats'::regclass) THEN
    ALTER TABLE public.profiles_stats ADD CONSTRAINT chk_ps_total_correct CHECK (total_correct >= 0 AND total_correct <= 100000000);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_ps_total_games' AND conrelid = 'public.profiles_stats'::regclass) THEN
    ALTER TABLE public.profiles_stats ADD CONSTRAINT chk_ps_total_games CHECK (total_games >= 0 AND total_games <= 1000000);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_ps_best_level' AND conrelid = 'public.profiles_stats'::regclass) THEN
    ALTER TABLE public.profiles_stats ADD CONSTRAINT chk_ps_best_level CHECK (best_level >= 1 AND best_level <= 999);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_ps_name_length' AND conrelid = 'public.profiles_stats'::regclass) THEN
    ALTER TABLE public.profiles_stats ADD CONSTRAINT chk_ps_name_length CHECK (char_length(player_name) BETWEEN 1 AND 40);
  END IF;
END $$;

-- Índice para ordenar o ranking por acertos acumulados
CREATE INDEX IF NOT EXISTS idx_profiles_stats_total_correct
  ON public.profiles_stats (total_correct DESC, best_level DESC);

ALTER TABLE public.profiles_stats ENABLE ROW LEVEL SECURITY;

-- Leitura pública (qualquer um vê o ranking global)
DROP POLICY IF EXISTS "profiles_stats_select_public" ON public.profiles_stats;
CREATE POLICY "profiles_stats_select_public"
  ON public.profiles_stats FOR SELECT USING (true);

-- Inserção/atualização APENAS da própria linha (user_id = auth.uid())
DROP POLICY IF EXISTS "profiles_stats_insert_own" ON public.profiles_stats;
CREATE POLICY "profiles_stats_insert_own"
  ON public.profiles_stats FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "profiles_stats_update_own" ON public.profiles_stats;
CREATE POLICY "profiles_stats_update_own"
  ON public.profiles_stats FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Sem política de DELETE = ninguém apaga via API pública.

COMMENT ON TABLE public.profiles_stats IS 'Leaderboard de perfil global — desempenho acumulado por usuário (acertos totais). Leitura pública, escrita só do próprio usuário.';
