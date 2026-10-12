'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const answers = require('../../js/answer-presentation.js');
const source = fs.readFileSync(path.join(__dirname, '../../js/answer-presentation.js'), 'utf8');
const clone = value => JSON.parse(JSON.stringify(value));
const question = (extra = {}) => ({id: 'technical-fixture', q: 'Choose the marked token.',
  o: ['one token', 'two tokens', 'three tokens', 'four tokens'], a: 0,
  e: 'The designated token is correct.', refs: [{title: 'fixture only', tags: ['technical']}], ...extra});
const sortedJSON = value => Array.isArray(value) ? '[' + value.map(sortedJSON).join(',') + ']'
  : value !== null && typeof value === 'object' ? '{' + Object.keys(value).sort().map(key =>
    JSON.stringify(key) + ':' + sortedJSON(value[key])).join(',') + '}' : JSON.stringify(value);

function browser({randomValues, fallback} = {}) {
  const window = {};
  const math = Object.create(Math);
  if (fallback) math.random = fallback;
  const context = {window, Math: math};
  if (randomValues) context.crypto = {getRandomValues(buffer) { buffer[0] = randomValues(); return buffer; }};
  for (const key of ['localStorage', 'document', 'navigator', 'fetch']) {
    Object.defineProperty(context, key, {get() { throw Error('Unexpected persistence/browser access: ' + key); }});
    Object.defineProperty(window, key, {get() { throw Error('Unexpected persistence/browser access: ' + key); }});
  }
  vm.runInNewContext(source, context, {filename: 'answer-presentation.js'});
  return window.NQAnswers;
}

function seeded(seed = 0x61c88647) {
  let state = seed >>> 0;
  return () => {
    state ^= state << 13; state ^= state >>> 17; state ^= state << 5;
    return state >>> 0;
  };
}

test('browser global and CommonJS expose the same frozen technical API', () => {
  const api = browser();
  assert.equal(Object.isFrozen(api), true);
  assert.equal(api.VERSION, 1);
  assert.deepEqual(Object.keys(api).sort(), Object.keys(answers).sort());
  assert.deepEqual(clone(api.present(question(), {preserveOrder: true})), answers.present(question(), {preserveOrder: true}));
});

test('all 24 equally sized Fisher-Yates paths preserve every identity and correct answer', () => {
  const seen = new Set();
  for (let j3 = 0; j3 < 4; j3++) for (let j2 = 0; j2 < 3; j2++) for (let j1 = 0; j1 < 2; j1++) {
    const samples = [(j3 + 0.5) / 4, (j2 + 0.5) / 3, (j1 + 0.5) / 2];
    for (let correct = 0; correct < 4; correct++) {
      const authored = question({a: correct}), before = clone(authored);
      const draws = samples.slice();
      const presented = answers.present(authored, {random: () => draws.shift()});
      assert.equal(draws.length, 0);
      assert.deepEqual(authored, before);
      const order = presented._answerPresentation.order;
      seen.add(order.join(''));
      assert.deepEqual(order.slice().sort(), [0, 1, 2, 3]);
      assert.equal(presented.o[presented.a], authored.o[authored.a]);
      assert.equal(answers.originalIndex(presented, presented.a), correct);
      for (let display = 0; display < 4; display++) {
        assert.equal(presented.o[display], authored.o[order[display]]);
        assert.equal(answers.originalIndex(presented, display), order[display]);
        assert.equal(answers.optionId(presented, display), presented._answerPresentation.optionIds[order[display]]);
        assert.equal(display === presented.a, answers.originalIndex(presented, display) === authored.a);
      }
      assert.deepEqual(answers.restore(JSON.parse(JSON.stringify(presented)), authored), presented);
    }
  }
  assert.equal(seen.size, 24);
});

test('snapshots preserve the displayed mapping without further randomness', () => {
  const presented = answers.present(question(), {random: () => 0});
  const saved = answers.snapshot(presented);
  assert.deepEqual(saved, presented);
  assert.deepEqual(answers.present(saved, {random: () => { throw Error('must not reshuffle'); }}), presented);
  assert.deepEqual(answers.restore(saved), presented);
  saved.o.reverse();
  assert.notDeepEqual(saved.o, presented.o);
  assert.equal(answers.restore(saved), null);
});

test('author arrays, refs, source snapshot and repeated presentations are detached', () => {
  const authored = question(), before = clone(authored);
  const one = answers.present(authored, {random: () => 0});
  const two = answers.present(authored, {random: () => 0.9});
  assert.notEqual(one.o, authored.o);
  assert.notEqual(one._answerPresentation.sourceQuestion.o, authored.o);
  assert.notEqual(one.refs, one._answerPresentation.sourceQuestion.refs);
  one.refs[0].tags.push('changed-display');
  one._answerPresentation.sourceQuestion.refs[0].tags.push('changed-source');
  assert.deepEqual(authored, before);
  assert.deepEqual(two.refs, before.refs);
  assert.equal(answers.restore(one), null);
});

test('duplicate labels retain distinct authored identities instead of text matching', () => {
  const authored = question({o: ['same label', 'same label', 'different label'], a: 1});
  const presented = answers.present(authored, {random: () => 0});
  assert.equal(answers.originalIndex(presented, presented.a), 1);
  assert.equal(new Set(presented._answerPresentation.optionIds).size, 3);
  const first = presented._answerPresentation.order.indexOf(0);
  assert.equal(presented.o[first], presented.o[presented.a]);
  assert.notEqual(answers.optionId(presented, first), answers.optionId(presented, presented.a));
});

test('content revision matches independent SHA256 of canonical authorial JSON', () => {
  for (const q of [question(), question({id: 123, q: 'Acentos: ação, Ω, 漢字, 🧪.', e: 'x'.repeat(1000)}),
    question({z: {b: 3, a: ['long text'.repeat(50)]}, q: 'Quoted "text" and\nnew line.'})]) {
    const expected = 'sha256:' + crypto.createHash('sha256').update(sortedJSON(q), 'utf8').digest('hex');
    const shown = answers.present(q, {preserveOrder: true});
    assert.equal(shown._answerPresentation.sourceRevision, expected);
    const reordered = Object.fromEntries(Object.entries(q).reverse());
    assert.equal(answers.present(reordered, {preserveOrder: true})._answerPresentation.sourceRevision, expected);
    assert.notEqual(answers.present({...q, e: q.e + 'new revision'}, {preserveOrder: true})._answerPresentation.sourceRevision, expected);
  }
});

test('legacy snapshots use authorial identity and never acquire a randomized restore', () => {
  const authored = question(), before = clone(authored);
  const restored = answers.restore(authored);
  assert.deepEqual(restored, before);
  assert.equal(Object.hasOwn(restored, '_answerPresentation'), false);
  for (let index = 0; index < authored.o.length; index++) {
    assert.equal(answers.originalIndex(restored, index), index);
    assert.equal(answers.optionId(restored, index), answers.present(authored, {preserveOrder: true})._answerPresentation.optionIds[index]);
  }
  assert.deepEqual(answers.restore(authored, clone(authored)), authored);
  assert.equal(answers.restore(authored, {...authored, e: 'changed'}), null);
  restored.o[0] = 'caller mutation';
  assert.deepEqual(authored, before);
});

test('strict restore rejects every missing metadata field, foreign version and extra fields', () => {
  const valid = answers.present(question(), {random: () => 0});
  for (const key of Object.keys(valid._answerPresentation)) {
    const bad = clone(valid); delete bad._answerPresentation[key];
    assert.equal(answers.restore(bad), null, key);
    assert.equal(answers.snapshot(bad), null, key);
    assert.equal(answers.originalIndex(bad, 0), null, key);
    assert.equal(answers.optionId(bad, 0), null, key);
    assert.equal(answers.present(bad), null, key);
  }
  for (const metadata of [null, [], 1, 'metadata', {...clone(valid._answerPresentation), version: 2},
    {...clone(valid._answerPresentation), extra: true}]) {
    assert.equal(answers.restore({...clone(valid), _answerPresentation: metadata}), null);
  }
});

test('invalid mapping, source, IDs and display cannot be silently corrected', () => {
  const valid = answers.present(question(), {random: () => 0});
  const mutations = [
    q => { q._answerPresentation.order = [0, 0, 2, 3]; },
    q => { q._answerPresentation.order = [0, 1, 2]; },
    q => { q._answerPresentation.order = [0, 1, 2, 4]; },
    q => { q._answerPresentation.order = [0, 1, 2, 0.5]; },
    q => { q._answerPresentation.order[1] = '1'; },
    q => { q._answerPresentation.optionIds.reverse(); },
    q => { q._answerPresentation.optionIds[0] += 'foreign'; },
    q => { q._answerPresentation.sourceRevision = 'sha256:wrong'; },
    q => { q._answerPresentation.sourceQuestion.id = 'foreign'; },
    q => { q._answerPresentation.sourceQuestion.a = 2; },
    q => { q._answerPresentation.sourceQuestion.o[0] = 'foreign'; },
    q => { q._answerPresentation.sourceQuestion._answerPresentation = {}; },
    q => { q.id = 'foreign'; }, q => { q.a = (q.a + 1) % 4; },
    q => { q.o.reverse(); }, q => { q.o[0] = 'foreign'; },
    q => { q.q += 'edited'; }, q => { q.e += 'edited'; },
    q => { q.refs[0].title = 'foreign'; }, q => { q.chosen = 2; }
  ];
  for (let index = 0; index < mutations.length; index++) {
    const bad = clone(valid); mutations[index](bad);
    assert.equal(answers.restore(bad), null, String(index));
    assert.equal(answers.present(bad), null, String(index));
  }
  for (const key of ['id', 'q', 'o', 'a', 'e']) {
    const authored = question(); authored[key] = key === 'a' ? 1 : key === 'o' ? ['x', 'y', 'z', 'w'] : 'new';
    assert.equal(answers.restore(valid, authored), null, 'authorial ' + key);
  }
});

test('non-JSON snapshots, accessors, cycles and sparse arrays fail closed', () => {
  const cyclic = question(); cyclic.refs.push(cyclic);
  const getter = question(); Object.defineProperty(getter, 'e', {enumerable: true, get() { throw Error('getter'); }});
  const sparse = question(); delete sparse.o[1];
  const undefinedValue = question({extra: undefined});
  const date = question({date: new Date()});
  for (const q of [null, undefined, [], 'q', {}, Object.create(question()), cyclic, getter, sparse,
    undefinedValue, date, question({id: ''}), question({id: NaN}), question({q: ''})]) {
    assert.equal(answers.present(q), null);
    assert.equal(answers.restore(q), null);
  }
  for (const display of [-1, 4, 1.5, '0', NaN, Infinity, undefined, null]) {
    assert.equal(answers.originalIndex(question(), display), null);
    assert.equal(answers.optionId(question(), display), null);
  }
});

test('explicit formats, boolean pairs and purely numeric choices are not shuffled', () => {
  for (const format of ['vf', 'boolean', 'numeric', 'num', 'multiselect']) {
    const q = question();
    assert.equal(answers.eligibility(q, {format}).eligible, false);
    assert.deepEqual(answers.present(q, {format, random: () => { throw Error('excluded RNG'); }}), q);
  }
  for (const o of [['Verdadeiro', 'Falso'], ['true', 'false'], ['V', 'F'], ['Sim', 'Não'], ['Certo', 'Errado'], ['Yes', 'No'],
    ['1', '2', '3', '4'], ['2 mg', '5 mg', '10 mg', '20 mg'], ['−1,5', '2.7', '30%', '4/5']]) {
    const q = question({o});
    assert.equal(answers.eligibility(q).eligible, false);
    const shown = answers.present(q, {random: () => { throw Error('excluded RNG'); }});
    assert.deepEqual(shown.o, o);
    assert.equal(shown.a, 0);
    assert.deepEqual(shown._answerPresentation.order, Array.from({length: o.length}, (_, i) => i));
    assert.deepEqual(answers.restore(shown), shown);
  }
  assert.equal(answers.present(question({a: [0, 1]})), null);
  assert.deepEqual(answers.present(question({a: [0, 1]}), {format: 'multiselect'}).a, [0, 1]);
});

test('letter/order references in stem, labels and explanations keep authored order', () => {
  const snippets = [
    ['q', 'Selecione a alternativa C.'], ['q', 'São válidas A e B.'], ['q', 'Selecione a primeira alternativa.'],
    ['e', 'A opção correta é D.'], ['e', 'Alternativas A e B são aplicáveis.'], ['e', 'Gabarito: C.'],
    ['e', 'A opção (B) é a correta.'], ['e', 'B é incorreta.'], ['e', 'A correta e C incorreta.'],
    ['e', 'A) Token errado.\nB) Token correto.'], ['e', 'A) Token errado.<br>C) Token correto.'],
    ['e', 'a) Token errado.\nb) Token correto.'],
    ['o', 'Todas as anteriores'], ['o', 'Nenhuma das opções acima'], ['o', 'Ambas as anteriores'],
    ['o', 'A e B'], ['o', 'A/B'], ['o', 'A ou C']
  ];
  for (const [field, text] of snippets) {
    const q = question(field === 'o' ? {o: [text, 'other', 'third', 'fourth']} : {[field]: text});
    const eligibility = answers.eligibility(q);
    assert.equal(eligibility.eligible, false, text);
    assert.ok(eligibility.reasons.some(reason => ['order_reference', 'letter_reference'].includes(reason)), text);
    const shown = answers.present(q, {random: () => { throw Error('guard RNG'); }});
    assert.deepEqual(shown.o, q.o, text);
    assert.equal(shown.a, q.a, text);
    assert.deepEqual(answers.restore(shown), shown, text);
    const forged = clone(shown), order = [1, 0, 2, 3];
    forged._answerPresentation.order = order;
    forged.o = order.map(index => q.o[index]); forged.a = order.indexOf(q.a);
    assert.equal(answers.restore(forged), null, text);
  }
  assert.equal(answers.eligibility(question({q: 'A terapia inicial foi descrita.', e: 'A resposta reduz o risco.'})).eligible, true);
});

test('real-bank parenthesized letter regressions remain ordered without changing explanation text', () => {
  // Exact short lexical excerpts, not clinical assertions or a copied medical bank.
  const excerpts = [
    ['9545bb60', 'o diurético de alça isolado (A) pode causar hipovolemia; a amifostina (C) tem uso limitado'],
    ['586405f9', 'Afirmar que não há nefrotoxicidade (A), contraindicar de forma absoluta em qualquer doença renal crônica (C)'],
    ['b9e26e47', 'o bicarbonato não é superior (C); nenhum fármaco reduz consistentemente o risco, incluindo a N-acetilcisteína (B)']
  ];
  for (const [id, e] of excerpts) {
    const q = question({id, e}), before = clone(q);
    assert.deepEqual(answers.eligibility(q).reasons, ['letter_reference']);
    const shown = answers.present(q, {random: () => { throw Error('positional reference must not shuffle'); }});
    assert.deepEqual(shown._answerPresentation.order, [0, 1, 2, 3]);
    assert.equal(shown.e, e);
    assert.deepEqual(q, before);
    assert.deepEqual(answers.restore(shown), shown);
  }
});

test('Portuguese articles and verbs after answer/option cues are not authored option letters', () => {
  for (const e of ['resposta à desmopressina', 'A resposta é variável.', 'A resposta correta é acidose.',
    'A alternativa correta é a opção mais adequada.', 'Qual opção é apropriada?',
    'A alternativa correta é o bloqueio.', 'A resposta a essa intervenção foi descrita.',
    'AEE associado a ferro.', 'Resposta aos AEE.', 'Uso de AEE (agente estimulador).']) {
    const q = question({e});
    assert.equal(answers.eligibility(q).eligible, true, e);
    const shown = answers.present(q, {random: () => 0});
    assert.deepEqual(shown._answerPresentation.order, [1, 2, 3, 0]);
    assert.equal(shown.o[shown.a], q.o[q.a]);
    assert.equal(shown.e, e);
  }
  for (const e of ['A alternativa correta é C.', 'A RESPOSTA CORRETA É A.', 'A opção B é a correta.']) {
    assert.equal(answers.eligibility(question({e})).eligible, false, e);
  }
});

test('MC with two through six choices, including Câmara labels, preserve correctness', () => {
  for (let count = 2; count <= 6; count++) for (let correct = 0; correct < count; correct++) {
    const q = question({id: 'camera-case:act-' + count, o: Array.from({length: count}, (_, index) => 'token-' + index), a: correct});
    assert.equal(answers.eligibility(q).eligible, true);
    const shown = answers.present(q, {random: () => 0});
    assert.equal(shown.o[shown.a], q.o[correct]);
    assert.equal(answers.originalIndex(shown, shown.a), correct);
    assert.deepEqual(answers.restore(shown, q), shown);
  }
  for (const o of [['only'], Array.from({length: 7}, (_, i) => 'token-' + i)]) {
    assert.equal(answers.eligibility(question({o})).eligible, false);
    assert.equal(answers.present(question({o})), null);
  }
});

test('crypto uint32 rejection occurs before modulo and never uses floating fallback', () => {
  const values = [0, 0xffffffff, 4, 1], consumed = [];
  const api = browser({randomValues: () => { const value = values.shift(); consumed.push(value); return value; },
    fallback: () => { throw Error('Crypto fallback must not run.'); }});
  const shown = api.present(question());
  assert.deepEqual(clone(shown._answerPresentation.order), [3, 2, 1, 0]);
  assert.deepEqual(consumed, [0, 0xffffffff, 4, 1]);
  assert.equal(values.length, 0);
});

test('Math.random fallback uses the same rejection rule when crypto is unavailable', () => {
  const values = [0, 0xffffffff, 4, 1];
  const api = browser({fallback: () => values.shift() / 0x100000000});
  const shown = api.present(question());
  assert.deepEqual(clone(shown._answerPresentation.order), [3, 2, 1, 0]);
  assert.equal(values.length, 0);
});

test('invalid injected RNG cannot create a snapshot or silently assign an answer', () => {
  for (const random of [0, null, () => -0.1, () => 1, () => NaN, () => Infinity,
    () => { throw Error('RNG error'); }]) {
    assert.equal(answers.present(question(), {random}), null);
  }
  assert.ok(answers.present(question(), {random: () => 0}));
  assert.ok(answers.present(question(), {random: () => 0.999999999}));
});

test('deterministic seeded crypto sampling covers all permutations without a positional preference or cycle', t => {
  const next = seeded(), api = browser({randomValues: next});
  const q = question(), trials = 24000;
  const permutations = new Map(), position = [0, 0, 0, 0];
  let previous = null, repeated = 0;
  for (let index = 0; index < trials; index++) {
    const shown = api.present(q), key = shown._answerPresentation.order.join('');
    permutations.set(key, (permutations.get(key) || 0) + 1);
    position[shown.a]++;
    if (key === previous) repeated++;
    previous = key;
  }
  assert.equal(permutations.size, 24);
  for (const count of permutations.values()) assert.ok(Math.abs(count - trials / 24) < 160, 'permutation frequency ' + count);
  for (const count of position) assert.ok(Math.abs(count - trials / 4) < 280, 'answer position frequency ' + count);
  assert.ok(repeated > 500 && repeated < 1500, 'independent repetitions permitted: ' + repeated);
  t.diagnostic(JSON.stringify({trials, correctPositionCounts: position,
    permutationCount: permutations.size, permutationMin: Math.min(...permutations.values()),
    permutationMax: Math.max(...permutations.values()), consecutiveSamePermutation: repeated}));
});
