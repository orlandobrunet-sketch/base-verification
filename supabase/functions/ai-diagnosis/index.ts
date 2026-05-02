/**
 * Supabase Edge Function: ai-diagnosis
 *
 * Recebe estatísticas de uma sessão de estudo por eixo temático e retorna
 * um diagnóstico personalizado de lacunas de conhecimento gerado pelo Claude Haiku.
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

const SYSTEM_PROMPT = `Você é o Analisador NefroQuest, especialista em aprendizado médico adaptativo.
Analise o desempenho do estudante por eixo temático e gere um diagnóstico construtivo.

Diretrizes:
- Responda em português do Brasil
- Seja encorajador mas honesto
- Identifique os pontos fortes (eixos com ≥70% de acerto)
- Identifique as lacunas prioritárias (eixos com <50% de acerto)
- Sugira 1-2 ações concretas de estudo
- Use no máximo 4 parágrafos curtos
- Não repita os números que já foram mostrados ao usuário — acrescente interpretação
- Termine com uma frase motivacional curta e específica para nefrologia`;

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
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { axes = [], totalCorrect = 0, totalWrong = 0, accuracy = 0 } = body;

  if (axes.length === 0 && totalCorrect + totalWrong === 0) {
    return new Response(JSON.stringify({ error: 'No session data provided' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Build performance summary
  const axisLines = axes.length
    ? axes.map(a => {
        const total = a.correct + a.wrong;
        const pct = total > 0 ? Math.round((a.correct / total) * 100) : 0;
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
        max_tokens: 500,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: prompt }],
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
    const diagnosis = data.content?.[0]?.text ?? '';

    return new Response(JSON.stringify({ diagnosis }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Diagnosis function error:', err);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
