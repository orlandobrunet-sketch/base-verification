/**
 * Cota das funções de IA: um crédito só é gasto por uma resposta entregue.
 *
 * Defeitos medidos antes do conserto (ai-mentor e ai-diagnosis):
 * - a cota era contada ANTES de validar o pedido: um pedido inválido (400)
 *   consumia um crédito do dia;
 * - uma falha da Anthropic (502) também consumia, sem entregar nada.
 *
 * Supabase e Anthropic são simulados trocando o fetch global; nada sai da
 * máquina. Rodar: npx deno test -A supabase/functions/_testes/cota_test.ts
 */
import { assertEquals } from 'jsr:@std/assert@1';

type Chamada = { metodo: string; url: string; corpo: string };

async function montar(funcao: 'ai-mentor' | 'ai-diagnosis', { anthropicOk = true, contagem = 1 } = {}) {
  const chamadas: Chamada[] = [];
  Deno.env.set('ANTHROPIC_API_KEY', 'teste');
  Deno.env.set('SUPABASE_URL', 'https://supabase.teste');
  Deno.env.set('SUPABASE_SERVICE_ROLE_KEY', 'service-teste');

  const fetchOriginal = globalThis.fetch;
  globalThis.fetch = async (entrada: RequestInfo | URL, init?: RequestInit) => {
    const req = new Request(entrada, init);
    const url = req.url;
    if (!url.startsWith('https://supabase.teste') && !url.startsWith('https://api.anthropic.com')) {
      return fetchOriginal(entrada, init); // só os módulos do esm.sh
    }
    chamadas.push({ metodo: req.method, url, corpo: await req.clone().text() });
    const json = (dado: unknown, status = 200) =>
      new Response(JSON.stringify(dado), { status, headers: { 'Content-Type': 'application/json' } });
    if (url.includes('/auth/v1/user')) return json({ id: 'u1', app_metadata: {}, aud: 'authenticated' });
    if (url.includes('/rest/v1/rpc/increment_ai_usage')) return json(contagem);
    if (url.includes('/rest/v1/ai_usage')) return new Response(null, { status: 204 });
    if (url.startsWith('https://api.anthropic.com')) {
      return anthropicOk ? json({ content: [{ text: 'ok' }] }) : new Response('fora do ar', { status: 529 });
    }
    return json({}, 404);
  };

  let handler: ((r: Request) => Promise<Response>) | null = null;
  const serveOriginal = Deno.serve;
  // deno-lint-ignore no-explicit-any
  (Deno as any).serve = (h: (r: Request) => Promise<Response>) => { handler = h; return {}; };
  await import(`../${funcao}/index.ts?instancia=${crypto.randomUUID()}`);
  // deno-lint-ignore no-explicit-any
  (Deno as any).serve = serveOriginal;

  const pedir = (corpo: unknown) => handler!(new Request('https://funcao.teste', {
    method: 'POST',
    headers: { Authorization: 'Bearer token-do-usuario', 'Content-Type': 'application/json', Origin: 'https://nefroquest.com' },
    body: typeof corpo === 'string' ? corpo : JSON.stringify(corpo),
  }));
  const restaurar = () => { globalThis.fetch = fetchOriginal; };
  const cotas = () => chamadas.filter(c => c.url.includes('increment_ai_usage')).length;
  const devolucoes = () => chamadas.filter(c => c.metodo === 'PATCH' && c.url.includes('/rest/v1/ai_usage'));
  const ia = () => chamadas.filter(c => c.url.startsWith('https://api.anthropic.com')).length;
  return { pedir, restaurar, cotas, devolucoes, ia };
}

const VALIDO = {
  'ai-mentor': { userQuestion: 'Por que a resposta é a C?', questionText: 'Enunciado', options: ['a', 'b', 'c'] },
  'ai-diagnosis': { axes: [{ name: 'DRC', correct: 3, wrong: 2 }], totalCorrect: 3, totalWrong: 2, accuracy: 60 },
} as const;
const INVALIDO = {
  'ai-mentor': { userQuestion: '' },
  'ai-diagnosis': { axes: 'não é lista' },
} as const;

for (const funcao of ['ai-mentor', 'ai-diagnosis'] as const) {
  Deno.test(`${funcao}: pedido inválido não gasta crédito`, async () => {
    const t = await montar(funcao);
    try {
      const r = await t.pedir(INVALIDO[funcao]);
      assertEquals(r.status, 400);
      assertEquals(t.cotas(), 0, 'a cota foi contada para um pedido inválido');
      const r2 = await t.pedir('{ json quebrado');
      assertEquals(r2.status, 400);
      assertEquals(t.cotas(), 0, 'a cota foi contada para um JSON inválido');
    } finally { t.restaurar(); }
  });

  Deno.test(`${funcao}: falha da IA devolve o crédito, só se a contagem não mudou`, async () => {
    const t = await montar(funcao, { anthropicOk: false, contagem: 2 });
    try {
      const r = await t.pedir(VALIDO[funcao]);
      assertEquals(r.status, 502);
      assertEquals(t.cotas(), 1);
      const dev = t.devolucoes();
      assertEquals(dev.length, 1, 'a falha da IA não devolveu o crédito');
      assertEquals(JSON.parse(dev[0].corpo), { count: 1 });
      const q = new URL(dev[0].url).searchParams;
      assertEquals(q.get('count'), 'eq.2', 'a devolução precisa ser condicional à contagem gravada');
      assertEquals(q.get('user_id'), 'eq.u1');
    } finally { t.restaurar(); }
  });

  Deno.test(`${funcao}: resposta entregue gasta o crédito`, async () => {
    const t = await montar(funcao);
    try {
      const r = await t.pedir(VALIDO[funcao]);
      assertEquals(r.status, 200);
      assertEquals(t.cotas(), 1);
      assertEquals(t.devolucoes().length, 0);
    } finally { t.restaurar(); }
  });

  Deno.test(`${funcao}: acima do limite não chama a IA`, async () => {
    const t = await montar(funcao, { contagem: 99 });
    try {
      const r = await t.pedir(VALIDO[funcao]);
      assertEquals(r.status, 429);
      assertEquals(t.ia(), 0);
    } finally { t.restaurar(); }
  });
}
