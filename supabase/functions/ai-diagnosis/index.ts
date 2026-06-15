/**
 * Supabase Edge Function: ai-diagnosis
 *
 * Recebe estatísticas de uma sessão de estudo por eixo temático e retorna
 * um diagnóstico personalizado de lacunas de conhecimento gerado pelo Claude Haiku.
 * Para usuários autenticados, aplica cota diária server-side (3/dia free).
 *
 * Variáveis de ambiente necessárias:
 *   ANTHROPIC_API_KEY         — chave da API da Anthropic
 *   SUPABASE_URL              — URL do projeto (injetada automaticamente)
 *   SUPABASE_SERVICE_ROLE_KEY — service role key (injetada automaticamente)
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ALLOWED_ORIGINS = [
  'https://nefroquest.com',
  'https://www.nefroquest.com',
];

function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowed =
    origin != null && (
      ALLOWED_ORIGINS.includes(origin) ||
      /^https:\/\/[a-z0-9-]+-[a-z0-9]+-[a-z0-9]+\.vercel\.app$/.test(origin) ||
      /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
    );

  return {
    'Access-Control-Allow-Origin': allowed ? origin! : 'https://nefroquest.com',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages';
const DIAG_LIMIT    = 3;

const SYSTEM_PROMPT = `Você é o Analisador NefroQuest, especialista em aprendizado médico adaptativo.
Analise o desempenho do estudante por eixo temático e gere um relatório detalhado e personalizado.

Use EXATAMENTE esta estrutura Markdown (os cabeçalhos são obrigatórios):

## Diagnóstico Geral
Interprete o desempenho global em 2-3 frases. Não repita os números brutos — diga o que eles significam clinicamente e para o aprendizado. Seja honesto e encorajador.

## Pontos Fortes
Liste os eixos com ≥70% de acerto. Para cada um, uma frase de reforço positivo e por que esse domínio importa na prática. Se não houver nenhum, escreva uma frase motivacional.

## Lacunas Prioritárias
Liste os eixos com <50% de acerto em ordem decrescente de prioridade. Para cada um, explique brevemente por que é crítico na clínica e qual conceito central provavelmente está faltando.

## Estratégia de Estudo
Sugira 3 ações concretas e numeradas, personalizadas aos eixos fracos identificados. Seja específico: mencione os eixos, tipo de estudo (casos clínicos, tabelas, mnemônicos, questões comentadas).

## Próximo Passo
Uma única frase motivacional específica para nefrologia, personalizada ao perfil deste estudante.

Regras:
- Responda em português do Brasil
- Cada seção: no máximo 4 linhas
- Não use bullet points em Diagnóstico Geral e Próximo Passo
- Use listas com "- " em Pontos Fortes, Lacunas e Estratégia`;

// Input size limits
const MAX_AXES      = 20;
const MAX_AXIS_NAME = 100;
const MAX_COUNT     = 10_000;

async function checkAndIncrementQuota(
  supabaseUrl: string,
  serviceRoleKey: string,
  userToken: string,
): Promise<{ allowed: boolean; remaining: number; userId: string | null }> {
  const db = createClient(supabaseUrl, serviceRoleKey);

  const { data: { user }, error } = await db.auth.getUser(userToken);
  if (error || !user) return { allowed: false, remaining: 0, userId: null }; // block guests

  const isPremium =
    user.app_metadata?.premium === true ||
    user.app_metadata?.is_admin === true;
  if (isPremium) return { allowed: true, remaining: -1, userId: user.id };

  const today = new Date().toISOString().slice(0, 10);

  // Incremento atômico via RPC (INSERT ... ON CONFLICT DO UPDATE count = count + 1).
  // Substitui o upsert anterior, que sobrescrevia count para 1 e nunca aplicava
  // a cota. Requer a função increment_ai_usage (migration 014).
  const { data: newCount, error: rpcErr } = await db.rpc('increment_ai_usage', {
    p_user_id: user.id, p_feature: 'diagnosis', p_date: today,
  });

  if (rpcErr || typeof newCount !== 'number') {
    // Fail-closed: em erro de cota, bloqueia para não expor custo de IA.
    console.error('Quota RPC error (diagnosis):', rpcErr);
    return { allowed: false, remaining: 0, userId: user.id };
  }
  if (newCount > DIAG_LIMIT) {
    return { allowed: false, remaining: 0, userId: user.id };
  }
  return { allowed: true, remaining: DIAG_LIMIT - newCount, userId: user.id };
}

Deno.serve(async (req) => {
  const origin = req.headers.get('Origin');
  const cors   = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: cors });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  const apiKey         = Deno.env.get('ANTHROPIC_API_KEY');
  const supabaseUrl    = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'API key not configured' }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  const authHeader = req.headers.get('Authorization') ?? '';
  const userToken  = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

  // Server-side quota check
  if (!userToken || !supabaseUrl || !serviceRoleKey) {
    return new Response(
      JSON.stringify({ error: 'unauthorized', message: 'Acesso restrito. Faça login para usar o Diagnóstico de IA.' }),
      { status: 401, headers: { ...cors, 'Content-Type': 'application/json' } },
    );
  }

  try {
    const quota = await checkAndIncrementQuota(supabaseUrl, serviceRoleKey, userToken);
    if (!quota.allowed) {
      return new Response(
        JSON.stringify({
          error: quota.userId ? 'quota_exceeded' : 'unauthorized',
          message: quota.userId ? 'Limite diário atingido. Faça upgrade para Premium.' : 'Acesso restrito. Faça login para usar o Diagnóstico de IA.'
        }),
        { status: quota.userId ? 429 : 401, headers: { ...cors, 'Content-Type': 'application/json' } },
      );
    }
  } catch (err) {
    console.error('Quota check error:', err);
    return new Response(
      JSON.stringify({ error: 'unauthorized', message: 'Erro na autenticação de cota.' }),
      { status: 401, headers: { ...cors, 'Content-Type': 'application/json' } },
    );
  }

  let body: {
    axes?: { name: string; correct: number; wrong: number }[];
    totalCorrect?: number;
    totalWrong?: number;
    accuracy?: number;
  };

  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  const { axes = [], totalCorrect = 0, totalWrong = 0, accuracy = 0 } = body;

  // ── Input validation ────────────────────────────────────────────────────
  if (!Array.isArray(axes) || axes.length > MAX_AXES) {
    return new Response(JSON.stringify({ error: 'axes invalid' }), {
      status: 400, headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
  for (const a of axes) {
    if (
      typeof a.name !== 'string' || a.name.length > MAX_AXIS_NAME ||
      !Number.isFinite(a.correct) || a.correct < 0 || a.correct > MAX_COUNT ||
      !Number.isFinite(a.wrong)   || a.wrong   < 0 || a.wrong   > MAX_COUNT
    ) {
      return new Response(JSON.stringify({ error: 'axis data invalid' }), {
        status: 400, headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }
  }
  if (
    !Number.isFinite(totalCorrect) || totalCorrect < 0 || totalCorrect > MAX_COUNT ||
    !Number.isFinite(totalWrong)   || totalWrong   < 0 || totalWrong   > MAX_COUNT ||
    !Number.isFinite(accuracy)     || accuracy < 0     || accuracy > 100
  ) {
    return new Response(JSON.stringify({ error: 'session totals invalid' }), {
      status: 400, headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
  if (axes.length === 0 && totalCorrect + totalWrong === 0) {
    return new Response(JSON.stringify({ error: 'No session data provided' }), {
      status: 400, headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
  // ────────────────────────────────────────────────────────────────────────

  const axisLines = axes.length
    ? axes.map(a => {
        const total = a.correct + a.wrong;
        const pct   = total > 0 ? Math.round((a.correct / total) * 100) : 0;
        return `- ${a.name}: ${a.correct}/${total} acertos (${pct}%)`;
      }).join('\n')
    : '(dados por eixo não disponíveis)';

  const prompt = `Sessão de estudo concluída.

Resumo geral: ${totalCorrect + totalWrong} questões, ${totalCorrect} acertos, ${totalWrong} erros, ${accuracy}% de aproveitamento.

Desempenho por eixo temático:
${axisLines}

Gere um diagnóstico personalizado para este estudante.`;

  try {
    const response = await fetch(ANTHROPIC_API, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 900,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Anthropic API error:', response.status, errText);
      return new Response(JSON.stringify({ error: 'AI service unavailable' }), {
        status: 502,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const diagnosis = data.content?.[0]?.text ?? '';

    return new Response(JSON.stringify({ diagnosis }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Diagnosis function error:', err);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
});
