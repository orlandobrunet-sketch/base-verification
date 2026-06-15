-- =============================================================================
-- Migration 014: cota de IA atômica — corrige o upsert que não incrementava
-- =============================================================================
-- As edge functions ai-mentor / ai-diagnosis usavam:
--   upsert({ ..., count: 1 }, { onConflict })  -> ON CONFLICT DO UPDATE SET count = 1
-- ou seja, SOBRESCREVIAM a contagem para 1 a cada chamada. Resultado: a cota
-- diária grátis (5 mentor / 3 diagnóstico) nunca era aplicada — exposição de
-- custo na API da Anthropic.
--
-- Esta função faz o incremento ATÔMICO e correto. As edge functions passam a
-- chamá-la via rpc('increment_ai_usage', ...). Rodar no SQL Editor.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.increment_ai_usage(
  p_user_id uuid,
  p_feature text,
  p_date    date
) RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  INSERT INTO public.ai_usage (user_id, feature, date, count)
  VALUES (p_user_id, p_feature, p_date, 1)
  ON CONFLICT (user_id, feature, date)
  DO UPDATE SET count = ai_usage.count + 1
  RETURNING count;
$$;

-- Só a service_role (usada pelas edge functions) pode chamar — evita que um
-- usuário autenticado infle a contagem de terceiros via RPC direto.
REVOKE EXECUTE ON FUNCTION public.increment_ai_usage(uuid, text, date) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.increment_ai_usage(uuid, text, date) TO service_role;
