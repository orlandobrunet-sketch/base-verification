-- 016: remove o fallback de email hardcoded do is_admin()
--
-- A função is_admin() tinha um fallback "durante transição":
--   ... OR auth.email() = 'orlandobrunet@gmail.com'
-- que concedia admin a um email fixo. Verificado que a conta dona já possui
-- app_metadata.is_admin = true, portanto remover o fallback é seguro e passa a
-- exigir o mecanismo correto (app_metadata.is_admin) para qualquer admin.
--
-- Mantém SECURITY DEFINER + search_path setado (boas práticas) e o comportamento
-- de só retornar o status do próprio chamador (auth.jwt()).

CREATE OR REPLACE FUNCTION public.is_admin()
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO 'pg_catalog', 'public'
AS $function$
  SELECT COALESCE(
    (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean,
    false
  );
$function$;
