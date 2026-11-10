type VerifiedUser = { id: string; is_anonymous?: boolean };

export type AccountDeletionAuth = {
  getUser(token: string): PromiseLike<{ data: { user: VerifiedUser | null }; error: unknown }>;
  admin: { deleteUser(userId: string, shouldSoftDelete: boolean): PromiseLike<{ error: unknown }> };
};

export async function handleDeleteAccount(req: Request, auth: AccountDeletionAuth | null): Promise<Response> {
  const origin = req.headers.get('Origin');
  const allowed = origin === null || origin === 'https://nefroquest.com' ||
    origin === 'https://www.nefroquest.com' ||
    /^https:\/\/[a-z0-9-]+-[a-z0-9-]+-[a-z0-9-]+\.vercel\.app$/.test(origin) ||
    /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
    'Vary': 'Origin',
    'Access-Control-Allow-Origin': allowed && origin ? origin : 'https://nefroquest.com',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
  const json = (body: object, status: number) => new Response(JSON.stringify(body), { headers, status });
  if (!allowed) return json({ error: 'Origem não permitida' }, 403);
  if (req.method === 'OPTIONS') return new Response(null, { headers, status: 204 });
  if (req.method !== 'POST') return json({ error: 'Método não permitido' }, 405);
  const token = req.headers.get('Authorization')?.match(/^Bearer (\S+)$/i)?.[1];
  if (!token) return json({ error: 'Sessão necessária' }, 401);
  if (!auth) return json({ error: 'Serviço indisponível' }, 503);

  try {
    const { data, error: authError } = await auth.getUser(token);
    const user = data.user;
    if (authError || !user || user.is_anonymous) return json({ error: 'Sessão inválida' }, 401);

    const body = await req.json().catch(() => null);
    if (typeof body?.userId !== 'string') return json({ error: 'Confirmação inválida' }, 400);
    // O ID do formulário serve para detectar troca de sessão. Só a conta
    // autenticada pelo servidor pode ser o alvo da operação privilegiada.
    if (body.userId !== user.id) return json({ error: 'A sessão mudou' }, 409);

    const { error: deleteError } = await auth.admin.deleteUser(user.id, false);
    if (deleteError) return json({ error: 'Não foi possível excluir a conta' }, 500);
    return json({ deleted: true, userId: user.id }, 200);
  } catch {
    return json({ error: 'Não foi possível confirmar a exclusão' }, 500);
  }
}
