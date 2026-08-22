// Handbook §18.4 — os três eixos editoriais, em código.
//
// Este módulo NÃO emite juízo clínico e NÃO aprova nada. Ele lê o que a revisão
// editorial declarou e verifica duas coisas: que os valores existem no
// vocabulário canônico, e que a autorização de publicação declarada é
// exatamente a que a Regra 7 deriva. Um gate técnico que "aprovasse" por conta
// própria seria pior que gate nenhum, porque pareceria revisão sem ser.
//
// A fonte da verdade é docs/editorial/NQ_EDITORIAL_HANDBOOK_v1.md §18.4. Se as
// duas divergirem, o Handbook vence e este arquivo é que está errado.

export const EVIDENCIA = ['VERIFICADA', 'PARCIALMENTE VERIFICADA', 'NÃO VERIFICADA'];
export const PENDENCIA = ['NENHUMA', 'NÃO DECISIVA', 'DECISIVA'];
export const PUBLICACAO = ['LIBERADA', 'BLOQUEADA'];

// Os sete vereditos do Cap. 19. Só os dois primeiros são de aprovação (Regra 7c).
export const VEREDITOS = [
  'aprovada',
  'aprovada com pequenos ajustes',
  'revisão maior',
  'reprovada',
  'fundir',
  'redirecionar',
  'aposentar',
];
export const VEREDITOS_DE_APROVACAO = ['aprovada', 'aprovada com pequenos ajustes'];

// Comparação tolerante a acento e caixa: 'NAO VERIFICADA' e 'não verificada'
// chegam ao mesmo lugar canônico. Isso não afrouxa o portão — o conjunto de
// valores aceitos é o mesmo; só evita que um til perdido vire falso negativo.
function canonizar(texto) {
  if (typeof texto !== 'string') return null;
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toUpperCase().replace(/\s+/g, ' ');
}

function resolver(valor, vocabulario) {
  const alvo = canonizar(valor);
  if (alvo === null) return null;
  return vocabulario.find((candidato) => canonizar(candidato) === alvo) ?? null;
}

/**
 * Tabela de compatibilidade obrigatória entre Eixo 1 e Eixo 2 (§18.4).
 * NÃO VERIFICADA aceita qualquer pendência: o eixo 2 é irrelevante ali, porque
 * a publicação fica BLOQUEADA de qualquer forma (Regra 7a).
 */
export function combinacaoValida(evidencia, pendencia) {
  if (evidencia === 'VERIFICADA') return pendencia === 'NENHUMA';
  if (evidencia === 'PARCIALMENTE VERIFICADA') return pendencia === 'NÃO DECISIVA' || pendencia === 'DECISIVA';
  if (evidencia === 'NÃO VERIFICADA') return true;
  return false;
}

/** Regra 5 — teto do veredito por evidência. */
export function tetoDeVeredictoViolado(evidencia, pendencia, veredito) {
  if (!VEREDITOS_DE_APROVACAO.includes(veredito)) return false;
  if (evidencia === 'NÃO VERIFICADA') return true;
  if (evidencia === 'PARCIALMENTE VERIFICADA' && pendencia === 'DECISIVA') return true;
  return false;
}

/**
 * Regra 7 — autorização de publicação, sempre derivada, nunca livre.
 * Função total: toda combinação produz exatamente LIBERADA ou BLOQUEADA.
 */
export function derivarPublicacao(evidencia, pendencia, veredito) {
  if (!combinacaoValida(evidencia, pendencia)) return 'BLOQUEADA';        // 7d / Regra 6
  if (evidencia === 'NÃO VERIFICADA') return 'BLOQUEADA';                  // 7a
  if (evidencia === 'PARCIALMENTE VERIFICADA' && pendencia === 'DECISIVA') return 'BLOQUEADA'; // 7b
  if (!VEREDITOS_DE_APROVACAO.includes(veredito)) return 'BLOQUEADA';      // 7c
  return 'LIBERADA';
}

/**
 * Valida a declaração editorial de um item e devolve os erros encontrados.
 * Devolve também a publicação derivada, para quem precisa decidir se o item
 * pode ser escrito em data/topics.js.
 */
export function validarEixos(qid, declaration, manifestPath) {
  const errors = [];
  const prefixo = `${manifestPath}: ${qid}`;

  const evidencia = resolver(declaration?.evidencia, EVIDENCIA);
  const pendencia = resolver(declaration?.pendencia, PENDENCIA);
  const publicacaoDeclarada = resolver(declaration?.publicacao, PUBLICACAO);
  const veredito = resolver(declaration?.veredito, VEREDITOS);

  if (declaration?.evidencia === undefined) errors.push(`${prefixo}: missing evidencia`);
  else if (!evidencia) errors.push(`${prefixo}: invalid evidencia ${JSON.stringify(declaration.evidencia)} (esperado: ${EVIDENCIA.join(' | ')})`);

  if (declaration?.pendencia === undefined) errors.push(`${prefixo}: missing pendencia`);
  else if (!pendencia) errors.push(`${prefixo}: invalid pendencia ${JSON.stringify(declaration.pendencia)} (esperado: ${PENDENCIA.join(' | ')})`);

  if (declaration?.veredito === undefined) errors.push(`${prefixo}: missing veredito`);
  else if (!veredito) errors.push(`${prefixo}: invalid veredito ${JSON.stringify(declaration.veredito)} (esperado: ${VEREDITOS.join(' | ')})`);

  if (declaration?.publicacao === undefined) errors.push(`${prefixo}: missing publicacao`);
  else if (!publicacaoDeclarada) errors.push(`${prefixo}: invalid publicacao ${JSON.stringify(declaration.publicacao)} (esperado: ${PUBLICACAO.join(' | ')})`);

  if (!evidencia || !pendencia || !veredito) return { errors, publicacao: null };

  if (!combinacaoValida(evidencia, pendencia)) {
    errors.push(`${prefixo}: combinação inválida entre eixos — ${evidencia} + ${pendencia} (Handbook §18.4, Regra 6); publicação permanece BLOQUEADA até corrigir os campos`);
  }

  if (tetoDeVeredictoViolado(evidencia, pendencia, veredito)) {
    errors.push(`${prefixo}: veredito "${veredito}" excede o teto permitido por ${evidencia}${pendencia === 'DECISIVA' ? ' + DECISIVA' : ''} (Handbook §18.4, Regra 5)`);
  }

  const derivada = derivarPublicacao(evidencia, pendencia, veredito);
  if (publicacaoDeclarada && publicacaoDeclarada !== derivada) {
    errors.push(`${prefixo}: publicacao declarada ${publicacaoDeclarada} diverge da derivada ${derivada} (Handbook §18.4, Regra 10 — o campo é derivado, nunca atribuído)`);
  }

  return { errors, publicacao: derivada };
}
