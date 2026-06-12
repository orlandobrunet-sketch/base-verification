-- =============================================================================
-- Migration 011: question_error_reasons — PED-1 Raciocínio guiado no erro
-- =============================================================================
-- Ao errar uma questão na jornada, o jogador pode nomear o próprio erro de
-- raciocínio ("por que você escolheu essa?"). O agregado por questão/distrator
-- no painel admin prepara o mapeamento automático de distratores no futuro.
--
-- Cliente (js/game.js → submitErrorReason):
--   { question_id, chosen_idx, reason, player_email, created_at }
--   reason ∈ knowledge | between_two | confusion | anchoring | misread | guess
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.question_error_reasons (
    id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    question_id  text,
    chosen_idx   smallint,
    reason       text        NOT NULL,
    player_email text,
    created_at   timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_qer_reason' AND conrelid = 'public.question_error_reasons'::regclass) THEN
    ALTER TABLE public.question_error_reasons ADD CONSTRAINT chk_qer_reason CHECK (reason IN ('knowledge','between_two','confusion','anchoring','misread','guess'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_qer_qid_len' AND conrelid = 'public.question_error_reasons'::regclass) THEN
    ALTER TABLE public.question_error_reasons ADD CONSTRAINT chk_qer_qid_len CHECK (question_id IS NULL OR char_length(question_id) BETWEEN 1 AND 120);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_qer_question_id ON public.question_error_reasons (question_id);

ALTER TABLE public.question_error_reasons ENABLE ROW LEVEL SECURITY;

-- INSERT público (qualquer jogador, inclusive visitante)
DROP POLICY IF EXISTS "qer_insert_public" ON public.question_error_reasons;
CREATE POLICY "qer_insert_public"
  ON public.question_error_reasons FOR INSERT WITH CHECK (true);

-- SELECT só admin (claim JWT app_metadata.is_admin)
DROP POLICY IF EXISTS "qer_select_admin" ON public.question_error_reasons;
CREATE POLICY "qer_select_admin"
  ON public.question_error_reasons FOR SELECT
  USING (coalesce((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false) = true);

COMMENT ON TABLE public.question_error_reasons IS 'PED-1: motivos de erro auto-relatados (metacognição). Insert público, leitura só admin.';
