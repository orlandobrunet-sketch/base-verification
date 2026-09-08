-- 019 — tira a função de trigger da superfície pública da API
--
-- `profiles_block_premium_self_update()` é uma função de TRIGGER: existe para
-- impedir que um usuário autenticado edite as próprias colunas de premium
-- (is_premium, premium_plan, premium_expires_at, mp_payment_id), deixando isso
-- só para o webhook de pagamento.
--
-- Ela estava com EXECUTE para PUBLIC, anon e authenticated. Como toda função
-- em `public` é publicada pelo PostgREST, isso a tornava chamável por qualquer
-- visitante em /rest/v1/rpc/profiles_block_premium_self_update.
--
-- Chamar não conseguiria burlar nada: o Postgres recusa invocar função que
-- retorna `trigger` fora de um trigger. Mas superfície de API que não serve a
-- ninguém é superfície a menos para defender, e o linter de segurança do
-- Supabase aponta o caso (lint 0028/0029).
--
-- O trigger continua disparando: a permissão de EXECUTE é verificada quando o
-- trigger é CRIADO, não a cada disparo. Quem executa o corpo é o dono da
-- função (SECURITY DEFINER), não quem fez o INSERT/UPDATE.
--
-- `is_admin()` foi avaliada no mesmo lint e deixada como está de propósito:
-- ela só lê o próprio JWT de quem chama e devolve booleano — não revela nada
-- que o chamador já não tivesse em mãos.

REVOKE EXECUTE ON FUNCTION public.profiles_block_premium_self_update() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.profiles_block_premium_self_update() FROM anon;
REVOKE EXECUTE ON FUNCTION public.profiles_block_premium_self_update() FROM authenticated;

-- Verificação: depois de aplicar, o ACL não deve mais listar `=X` (PUBLIC),
-- `anon=X` nem `authenticated=X`.
--
--   select proname, array_to_string(proacl::text[], ' | ')
--     from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--    where n.nspname = 'public'
--      and proname = 'profiles_block_premium_self_update';
--
-- Esperado: postgres=X/postgres | service_role=X/postgres
--
-- Reversão, se algo inesperado aparecer:
--
--   GRANT EXECUTE ON FUNCTION public.profiles_block_premium_self_update()
--     TO PUBLIC, anon, authenticated;
