-- =============================================================================
-- Migration 008: question_ratings — avaliação 5★ de qualidade/aprendizado
-- =============================================================================
-- Objetivo:
--   1. Criar tabela que armazena as avaliações 5 estrelas que o jogador dá a
--      cada questão (qualidade da questão + quanto aprendeu com ela).
--   2. Inserção pública (qualquer jogador, inclusive visitante anônimo, avalia).
--   3. Leitura restrita ao admin (claim JWT app_metadata.is_admin = true) —
--      consumida pelo painel de Analytics em js/admin.js.
--
-- Schema usado pelo cliente (js/game.js → submitQuestionRating):
--   { question_id, question_text, rating_quality, rating_learning,
--     player_email, player_name, created_at }
-- =============================================================================

-- 1. Tabela
CREATE TABLE IF NOT EXISTS public.question_ratings (
    id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    question_id     text        NOT NULL,
    question_text   text,
    rating_quality  smallint    NOT NULL,
    rating_learning smallint    NOT NULL,
    player_email    text,
    player_name     text,
    created_at      timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Sanidade dos valores (bloqueio no banco, não só no cliente): 1–5 estrelas
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_rating_quality_range' AND conrelid = 'public.question_ratings'::regclass) THEN
    ALTER TABLE public.question_ratings ADD CONSTRAINT chk_rating_quality_range CHECK (rating_quality BETWEEN 1 AND 5);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_rating_learning_range' AND conrelid = 'public.question_ratings'::regclass) THEN
    ALTER TABLE public.question_ratings ADD CONSTRAINT chk_rating_learning_range CHECK (rating_learning BETWEEN 1 AND 5);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_question_id_length' AND conrelid = 'public.question_ratings'::regclass) THEN
    ALTER TABLE public.question_ratings ADD CONSTRAINT chk_question_id_length CHECK (char_length(question_id) BETWEEN 1 AND 120);
  END IF;
END $$;

-- 3. Índice para agregação por questão no painel admin
CREATE INDEX IF NOT EXISTS idx_question_ratings_question_id
  ON public.question_ratings (question_id);

-- 4. Ativar Row Level Security
ALTER TABLE public.question_ratings ENABLE ROW LEVEL SECURITY;

-- 5. INSERT público — qualquer jogador (anon ou autenticado) pode avaliar.
--    Os CHECK constraints acima protegem contra valores fora de 1–5.
DROP POLICY IF EXISTS "question_ratings_insert_public" ON public.question_ratings;
CREATE POLICY "question_ratings_insert_public"
  ON public.question_ratings
  FOR INSERT
  WITH CHECK (true);

-- 6. SELECT apenas para admin (claim JWT app_metadata.is_admin = true).
--    Mesma regra de isAdminUser() em js/game.js — a segurança real está aqui.
DROP POLICY IF EXISTS "question_ratings_select_admin" ON public.question_ratings;
CREATE POLICY "question_ratings_select_admin"
  ON public.question_ratings
  FOR SELECT
  USING (
    coalesce((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false) = true
  );

-- 7. Sem políticas de UPDATE/DELETE = ninguém altera/apaga via API pública.
--    Manutenção fica restrita à service_role (SQL Editor / Edge Functions).

-- =============================================================================
-- Comentários
-- =============================================================================
COMMENT ON TABLE  public.question_ratings              IS 'Avaliações 5★ de qualidade e aprendizado por questão. Insert público, leitura só admin.';
COMMENT ON COLUMN public.question_ratings.question_id  IS 'qid da questão em data/topics.js.';
COMMENT ON COLUMN public.question_ratings.rating_quality  IS 'Qualidade percebida da questão (1–5).';
COMMENT ON COLUMN public.question_ratings.rating_learning IS 'Quanto o jogador sentiu que aprendeu (1–5).';
