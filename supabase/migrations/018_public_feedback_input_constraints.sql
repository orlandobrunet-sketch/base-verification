-- =============================================================================
-- Migration 018: restringe identificadores e dificuldade recebidos por INSERT
-- público. A renderização no cliente continua responsável por tratar todo dado
-- persistido como não confiável; estas constraints são defesa em profundidade.
--
-- NOT VALID preserva linhas históricas possivelmente fora do contrato, mas o
-- PostgreSQL aplica a regra imediatamente a novos INSERTs e UPDATEs. Depois de
-- auditar/corrigir o legado, as constraints podem ser validadas separadamente.
-- =============================================================================

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_question_ratings_qid_format'
      AND conrelid = 'public.question_ratings'::regclass
  ) THEN
    ALTER TABLE public.question_ratings
      ADD CONSTRAINT chk_question_ratings_qid_format
      CHECK (question_id ~ '^[0-9a-f]{8}$') NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_qdv_qid_format'
      AND conrelid = 'public.question_difficulty_votes'::regclass
  ) THEN
    ALTER TABLE public.question_difficulty_votes
      ADD CONSTRAINT chk_qdv_qid_format
      CHECK (question_id ~ '^[0-9a-f]{8}$') NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_qdv_current_diff'
      AND conrelid = 'public.question_difficulty_votes'::regclass
  ) THEN
    ALTER TABLE public.question_difficulty_votes
      ADD CONSTRAINT chk_qdv_current_diff
      CHECK (current_diff IS NULL OR current_diff IN ('easy', 'medium', 'hard')) NOT VALID;
  END IF;
END $$;

COMMENT ON CONSTRAINT chk_question_ratings_qid_format
  ON public.question_ratings
  IS 'Aceita somente qids canônicos de 8 caracteres hexadecimais em novos registros.';

COMMENT ON CONSTRAINT chk_qdv_qid_format
  ON public.question_difficulty_votes
  IS 'Aceita somente qids canônicos de 8 caracteres hexadecimais em novos registros.';

COMMENT ON CONSTRAINT chk_qdv_current_diff
  ON public.question_difficulty_votes
  IS 'Permite apenas dificuldades reconhecidas pelo jogo em novos registros.';
