/**
 * Supabase Edge Function: ai-mentor
 *
 * Recebe o contexto de uma questão errada e a dúvida do usuário,
 * retorna explicação personalizada gerada pelo Claude Haiku.
 *
 * Variáveis de ambiente necessárias:
 *   ANTHROPIC_API_KEY — chave da API da Anthropic
 */

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

const SYSTEM_PROMPT = `Você é o Mentor NefroQuest, um tutor especializado em nefrologia clínica.
Seu papel é ajudar estudantes de medicina e residentes a entenderem questões de nefrologia que erraram.

Diretrizes:
- Responda em português do Brasil, linguagem clara e didática
- Use analogias quando útil para fixar o conceito
- Seja direto: responda em 3-5 parágrafos curtos no máximo
- Foque no conceito fisiológico/clínico por trás da resposta correta
- Se o aluno fizer uma pergunta fora do contexto da questão, redirecione gentilmente
- Nunca forneça apenas a resposta — explique o raciocínio`;

// Input size limits
const MAX_USER_QUESTION  = 500;
const MAX_QUESTION_TEXT  = 2000;
const MAX_OPTION_TEXT    = 300;
const MAX_OPTIONS        = 5;
const MAX_EXPLANATION    = 2000;
const MAX_HISTORY_TURNS  = 10;
const MAX_HISTORY_CONTENT = 2000;

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

  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'API key not configured' }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  let body: {
    questionText?: string;
    options?: string[];
    correctOption?: string;
    explanation?: string;
    userQuestion?: string;
    history?: { role: string; content: string }[];
  };

  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  const {
    questionText,
    options,
    correctOption,
    explanation,
    userQuestion,
    history = [],
  } = body;

  // ── Input validation ────────────────────────────────────────────────────
  const uq = userQuestion?.trim() ?? '';
  if (!uq || uq.length > MAX_USER_QUESTION) {
    return new Response(
      JSON.stringify({ error: `userQuestion must be 1–${MAX_USER_QUESTION} characters` }),
      { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } },
    );
  }
  if (questionText && questionText.length > MAX_QUESTION_TEXT) {
    return new Response(
      JSON.stringify({ error: 'questionText too long' }),
      { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } },
    );
  }
  if (options) {
    if (!Array.isArray(options) || options.length > MAX_OPTIONS ||
        options.some(o => typeof o !== 'string' || o.length > MAX_OPTION_TEXT)) {
      return new Response(
        JSON.stringify({ error: 'options invalid' }),
        { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } },
      );
    }
  }
  if (explanation && explanation.length > MAX_EXPLANATION) {
    return new Response(
      JSON.stringify({ error: 'explanation too long' }),
      { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } },
    );
  }
  if (!Array.isArray(history) || history.length > MAX_HISTORY_TURNS * 2) {
    return new Response(
      JSON.stringify({ error: 'history too long' }),
      { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } },
    );
  }
  for (const msg of history) {
    if (
      typeof msg.role !== 'string' || !['user', 'assistant'].includes(msg.role) ||
      typeof msg.content !== 'string' || msg.content.length > MAX_HISTORY_CONTENT
    ) {
      return new Response(
        JSON.stringify({ error: 'history message invalid' }),
        { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } },
      );
    }
  }
  // ────────────────────────────────────────────────────────────────────────

  const contextParts: string[] = [];
  if (questionText) contextParts.push(`**Questão:** ${questionText}`);
  if (options?.length) {
    contextParts.push(
      `**Alternativas:**\n${options.map((o, i) => `${String.fromCharCode(65 + i)}) ${o}`).join('\n')}`,
    );
  }
  if (correctOption) contextParts.push(`**Resposta correta:** ${correctOption}`);
  if (explanation)   contextParts.push(`**Explicação oficial:** ${explanation}`);

  const contextBlock = contextParts.length
    ? `Contexto da questão:\n${contextParts.join('\n\n')}\n\n---\n\n`
    : '';

  const messages: { role: string; content: string }[] = [];

  if (history.length === 0) {
    messages.push({ role: 'user', content: `${contextBlock}Dúvida do aluno: ${uq}` });
  } else {
    const firstMsg = history[0];
    if (!firstMsg.content.startsWith('Contexto da questão:')) {
      messages.push({ role: firstMsg.role, content: `${contextBlock}${firstMsg.content}` });
      messages.push(...history.slice(1));
    } else {
      messages.push(...history);
    }
    messages.push({ role: 'user', content: uq });
  }

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
        max_tokens: 600,
        system: SYSTEM_PROMPT,
        messages,
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
    const reply = data.content?.[0]?.text ?? '';

    return new Response(JSON.stringify({ reply }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Mentor function error:', err);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
});
