import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EVIDENCIA,
  PENDENCIA,
  VEREDITOS,
  VEREDITOS_DE_APROVACAO,
  combinacaoValida,
  derivarPublicacao,
  tetoDeVeredictoViolado,
  validarEixos,
} from '../../scripts/editorial-batch/editorial-axes.mjs';
import { validateManifest } from '../../scripts/editorial-batch/manifest.mjs';

const M = 'FARM-TESTE.json';

const loteBase = {
  batch: 'FARM-TESTE',
  change_type: 'medical_editorial',
  expected_version: '14.76',
  allowed_files: ['data/topics.js', 'version.json', 'sw.js', 'index.html', 'docs/editorial/review-batches/FARM-TESTE.json'],
  questions: {},
  expected_question_delta: 0,
  refs_policy: 'unchanged',
  external_review: { greptile: 'required', fallback_reviewer: null },
};

function lote(questions, extra = {}) {
  return { ...structuredClone(loteBase), questions, ...extra };
}

// ── Regra 7: a derivação é total e produz exatamente os 4 casos liberados ────

test('Regra 7 cobre as 63 combinações e libera exatamente quatro', () => {
  const liberadas = [];
  for (const evidencia of EVIDENCIA) {
    for (const pendencia of PENDENCIA) {
      for (const veredito of VEREDITOS) {
        const resultado = derivarPublicacao(evidencia, pendencia, veredito);
        assert.ok(['LIBERADA', 'BLOQUEADA'].includes(resultado), `${evidencia}/${pendencia}/${veredito} saiu do vocabulário`);
        if (resultado === 'LIBERADA') liberadas.push(`${evidencia}|${pendencia}|${veredito}`);
      }
    }
  }
  assert.deepEqual(liberadas.sort(), [
    'PARCIALMENTE VERIFICADA|NÃO DECISIVA|aprovada',
    'PARCIALMENTE VERIFICADA|NÃO DECISIVA|aprovada com pequenos ajustes',
    'VERIFICADA|NENHUMA|aprovada',
    'VERIFICADA|NENHUMA|aprovada com pequenos ajustes',
  ].sort());
});

test('toda combinação inválida entre eixos resulta em BLOQUEADA, com qualquer veredito', () => {
  for (const evidencia of EVIDENCIA) {
    for (const pendencia of PENDENCIA) {
      if (combinacaoValida(evidencia, pendencia)) continue;
      for (const veredito of VEREDITOS) {
        assert.equal(derivarPublicacao(evidencia, pendencia, veredito), 'BLOQUEADA', `${evidencia}/${pendencia}/${veredito}`);
      }
    }
  }
});

test('PARCIALMENTE VERIFICADA + NENHUMA é a combinação que o Handbook eliminou', () => {
  assert.equal(combinacaoValida('PARCIALMENTE VERIFICADA', 'NENHUMA'), false);
  const erros = validarEixos('11111111', {
    evidencia: 'PARCIALMENTE VERIFICADA', pendencia: 'NENHUMA', veredito: 'aprovada', publicacao: 'LIBERADA',
  }, M).errors.join('\n');
  assert.match(erros, /combinação inválida entre eixos/);
});

test('VERIFICADA só admite pendência NENHUMA', () => {
  assert.equal(combinacaoValida('VERIFICADA', 'NENHUMA'), true);
  assert.equal(combinacaoValida('VERIFICADA', 'NÃO DECISIVA'), false);
  assert.equal(combinacaoValida('VERIFICADA', 'DECISIVA'), false);
});

// ── Regra 5: teto do veredito por evidência ─────────────────────────────────

test('Regra 5 barra veredito de aprovação sob NÃO VERIFICADA, com qualquer pendência', () => {
  for (const pendencia of PENDENCIA) {
    for (const veredito of VEREDITOS_DE_APROVACAO) {
      assert.equal(tetoDeVeredictoViolado('NÃO VERIFICADA', pendencia, veredito), true, `${pendencia}/${veredito}`);
    }
  }
});

test('Regra 5 barra veredito de aprovação sob PARCIALMENTE VERIFICADA + DECISIVA', () => {
  for (const veredito of VEREDITOS_DE_APROVACAO) {
    assert.equal(tetoDeVeredictoViolado('PARCIALMENTE VERIFICADA', 'DECISIVA', veredito), true);
  }
  assert.equal(tetoDeVeredictoViolado('PARCIALMENTE VERIFICADA', 'NÃO DECISIVA', 'aprovada'), false);
});

test('Regra 5 não interfere em veredito que já não é de aprovação', () => {
  for (const veredito of VEREDITOS.filter((v) => !VEREDITOS_DE_APROVACAO.includes(v))) {
    assert.equal(tetoDeVeredictoViolado('NÃO VERIFICADA', 'DECISIVA', veredito), false);
  }
});

// ── Regra 10: publicação é derivada, nunca atribuída ────────────────────────

test('publicacao declarada divergente da derivada é erro', () => {
  const erros = validarEixos('11111111', {
    evidencia: 'NÃO VERIFICADA', pendencia: 'NENHUMA', veredito: 'reprovada', publicacao: 'LIBERADA',
  }, M).errors.join('\n');
  assert.match(erros, /publicacao declarada LIBERADA diverge da derivada BLOQUEADA/);
});

test('os quatro campos são obrigatórios', () => {
  const erros = validarEixos('11111111', { action: 'rebuild' }, M).errors.join('\n');
  for (const campo of ['evidencia', 'pendencia', 'veredito', 'publicacao']) {
    assert.match(erros, new RegExp(`missing ${campo}`));
  }
});

test('valor fora do vocabulário é recusado, e a mensagem diz o que era esperado', () => {
  const erros = validarEixos('11111111', {
    evidencia: 'estruturalmente pronta', pendencia: 'NENHUMA', veredito: 'aprovada', publicacao: 'LIBERADA',
  }, M).errors.join('\n');
  assert.match(erros, /invalid evidencia/);
  assert.match(erros, /VERIFICADA \| PARCIALMENTE VERIFICADA/);
});

test('acento e caixa não mudam o veredito do portão', () => {
  const comAcento = validarEixos('11111111', {
    evidencia: 'NÃO VERIFICADA', pendencia: 'DECISIVA', veredito: 'reprovada', publicacao: 'BLOQUEADA',
  }, M);
  const semAcento = validarEixos('11111111', {
    evidencia: 'nao verificada', pendencia: 'decisiva', veredito: 'REPROVADA', publicacao: 'bloqueada',
  }, M);
  assert.deepEqual(comAcento.errors, []);
  assert.deepEqual(semAcento.errors, []);
  assert.equal(comAcento.publicacao, semAcento.publicacao);
});

// ── Integração com o manifest: o merge trava ────────────────────────────────

test('item com publicação BLOQUEADA não pode ser escrito em data/topics.js', () => {
  const erros = validateManifest(lote({
    '11111111': {
      action: 'rebuild', preserve_fsrs: true,
      evidencia: 'PARCIALMENTE VERIFICADA', pendencia: 'DECISIVA', veredito: 'revisão maior', publicacao: 'BLOQUEADA',
    },
  }), M).errors.join('\n');
  assert.match(erros, /publicação BLOQUEADA não pode ser escrita em data\/topics\.js/);
});

test('pendência decisiva trava mesmo com veredito rebaixado corretamente', () => {
  const { errors } = validateManifest(lote({
    '11111111': {
      action: 'add', preserve_fsrs: false,
      evidencia: 'PARCIALMENTE VERIFICADA', pendencia: 'DECISIVA', veredito: 'revisão maior', publicacao: 'BLOQUEADA',
    },
  }), M);
  assert.ok(errors.length > 0, 'lote com pendência decisiva deveria falhar');
});

test('lote medical_editorial sem os eixos é recusado', () => {
  const erros = validateManifest(lote({
    '11111111': { action: 'rebuild', preserve_fsrs: true },
  }), M).errors.join('\n');
  assert.match(erros, /missing evidencia/);
});

test('lote válido e liberado passa', () => {
  const { errors } = validateManifest(lote({
    '11111111': {
      action: 'rebuild', preserve_fsrs: true,
      evidencia: 'VERIFICADA', pendencia: 'NENHUMA', veredito: 'aprovada', publicacao: 'LIBERADA',
    },
  }), M);
  assert.deepEqual(errors, []);
});

test('mudança técnica não exige eixos editoriais', () => {
  const { errors } = validateManifest(lote(
    { '11111111': { action: 'technical_only', preserve_fsrs: true } },
    { change_type: 'technical_only' },
  ), M);
  assert.deepEqual(errors, []);
});

test('retire não exige eixos — não há publicação a autorizar', () => {
  const { errors } = validateManifest(lote({
    '11111111': { action: 'retire', preserve_fsrs: false },
  }), M);
  assert.deepEqual(errors, []);
});

// ── O gate técnico não afirma aprovação clínica ─────────────────────────────

test('o portão nunca produz aprovação por conta própria: sem declaração, nada é liberado', () => {
  const { publicacao } = validarEixos('11111111', {}, M);
  assert.equal(publicacao, null, 'sem os eixos declarados o portão não deriva publicação alguma');
});

test('nenhum caminho do portão devolve LIBERADA sem veredito de aprovação declarado', () => {
  for (const evidencia of EVIDENCIA) {
    for (const pendencia of PENDENCIA) {
      for (const veredito of VEREDITOS) {
        if (derivarPublicacao(evidencia, pendencia, veredito) !== 'LIBERADA') continue;
        assert.ok(VEREDITOS_DE_APROVACAO.includes(veredito), `${veredito} liberou publicação sem ser veredito de aprovação`);
      }
    }
  }
});
