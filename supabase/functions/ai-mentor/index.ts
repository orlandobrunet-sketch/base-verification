/**
 * Supabase Edge Function: ai-mentor
 *
 * Recebe o contexto de uma questão errada e a dúvida do usuário,
 * retorna explicação personalizada gerada pelo Claude Haiku.
 *
 * Variáveis de ambiente necessárias:
 *   ANTHROPIC_API_KEY — chave da API da Anthropic
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'API key not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { questionText, options, correctOption, explanation, userQuestion, history = [] } = body;

  if (!userQuestion?.trim()) {
    return new Response(JSON.stringify({ error: 'userQuestion is required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Build context block
  const contextParts: string[] = [];
  if (questionText) contextParts.push(`**Questão:** ${questionText}`);
  if (options?.length) contextParts.push(`**Alternativas:**\n${options.map((o, i) => `${String.fromCharCode(65 + i)}) ${o}`).join('\n')}`);
  if (correctOption) contextParts.push(`**Resposta correta:** ${correctOption}`);
  if (explanation) contextParts.push(`**Explicação oficial:** ${explanation}`);

  const contextBlock = contextParts.length
    ? `Contexto da questão:\n${contextParts.join('\n\n')}\n\n---\n\n`
    : '';

  // Build message history for multi-turn
  const messages: { role: string; content: string }[] = [];

  // Inject context into first user message
  if (history.length === 0) {
    messages.push({ role: 'user', content: `${contextBlock}Dúvida do aluno: ${userQuestion}` });
  } else {
    // Prepend context to the first message in history if not already present
    const firstMsg = history[0];
    if (!firstMsg.content.startsWith('Contexto da questão:')) {
      messages.push({ role: firstMsg.role, content: `${contextBlock}${firstMsg.content}` });
      messages.push(...history.slice(1));
    } else {
      messages.push(...history);
    }
    messages.push({ role: 'user', content: userQuestion });
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
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const reply = data.content?.[0]?.text ?? '';

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Mentor function error:', err);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
