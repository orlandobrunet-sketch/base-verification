-- Migration 006: corrige warnings do Security Advisor
-- 1. Revoga EXECUTE público em funções SECURITY DEFINER
-- 2. Habilita Leaked Password Protection (via SQL — requer Supabase Auth config)

-- handle_new_user: é trigger interno, não deve ser chamável por anon/authenticated
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;

-- is_admin: só deve ser chamável por authenticated (usuário logado verifica o próprio status)
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon;
