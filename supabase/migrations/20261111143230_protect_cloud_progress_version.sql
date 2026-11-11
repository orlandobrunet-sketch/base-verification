-- Cada gravação do progresso informa a revisão que sucede a versão lida.
-- A condição de versão no UPDATE evita que um aparelho antigo substitua outro.
BEGIN;

ALTER TABLE public.profiles
  ADD COLUMN game_progress_version bigint NOT NULL DEFAULT 0
    CONSTRAINT profiles_game_progress_version_nonnegative CHECK (game_progress_version >= 0);

CREATE FUNCTION public.profiles_guard_game_progress_version()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $function$
BEGIN
  IF NEW.game_progress IS NOT DISTINCT FROM OLD.game_progress
     AND NEW.game_progress_version IS NOT DISTINCT FROM OLD.game_progress_version THEN
    RETURN NEW;
  END IF;
  IF NEW.game_progress_version IS DISTINCT FROM OLD.game_progress_version + 1 THEN
    RAISE EXCEPTION 'Cloud progress changed. Read the current version before saving.'
      USING ERRCODE = '40001';
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER profiles_guard_game_progress_version
  BEFORE UPDATE OF game_progress, game_progress_version ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.profiles_guard_game_progress_version();

REVOKE ALL ON FUNCTION public.profiles_guard_game_progress_version()
  FROM PUBLIC, anon, authenticated;

COMMIT;
