-- =============================================================================
-- Migration 010: question_difficulty_votes — classificação de dificuldade
-- pelos usuários (crowd-sourced) para reclassificação inteligente do banco.
-- =============================================================================
-- Cada jogador pode votar a dificuldade percebida de uma questão (Fácil/Médio/
-- Difícil). A agregação desses votos no painel admin sinaliza questões cujo
-- `_d` atual diverge da percepção da comunidade → candidatas a reclassificação.
--
-- Cliente (js/game.js → submitDifficultyVote):
--   { question_id, vote ('easy'|'medium'|'hard'), current_diff, player_email, created_at }
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.question_difficulty_votes (
    id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    question_id  text        NOT NULL,
    vote         text        NOT NULL,
    current_diff text,
    player_email text,
    created_at   timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_qdv_vote' AND conrelid = 'public.question_difficulty_votes'::regclass) THEN
    ALTER TABLE public.question_difficulty_votes ADD CONSTRAINT chk_qdv_vote CHECK (vote IN ('easy','medium','hard'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_qdv_qid_len' AND conrelid = 'public.question_difficulty_votes'::regclass) THEN
    ALTER TABLE public.question_difficulty_votes ADD CONSTRAINT chk_qdv_qid_len CHECK (char_length(question_id) BETWEEN 1 AND 120);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_qdv_question_id ON public.question_difficulty_votes (question_id);

ALTER TABLE public.question_difficulty_votes ENABLE ROW LEVEL SECURITY;

-- INSERT público (qualquer jogador, inclusive visitante)
DROP POLICY IF EXISTS "qdv_insert_public" ON public.question_difficulty_votes;
CREATE POLICY "qdv_insert_public"
  ON public.question_difficulty_votes FOR INSERT WITH CHECK (true);

-- SELECT só admin (claim JWT app_metadata.is_admin) — usado na agregação do painel
DROP POLICY IF EXISTS "qdv_select_admin" ON public.question_difficulty_votes;
CREATE POLICY "qdv_select_admin"
  ON public.question_difficulty_votes FOR SELECT
  USING (coalesce((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false) = true);

COMMENT ON TABLE public.question_difficulty_votes IS 'Votos de dificuldade percebida (crowd) para reclassificação do banco. Insert público, leitura só admin.';
