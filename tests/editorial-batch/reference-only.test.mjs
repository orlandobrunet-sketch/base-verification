import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { validateManifest } from '../../scripts/editorial-batch/manifest.mjs';
import { parseReferenceCards, parseReferenceIds, referenceConsumers, referenceDigest } from '../../scripts/editorial-batch/references.mjs';
import { validateBatch } from '../../scripts/editorial-batch/rules.mjs';

// Technical fixtures only: these records are not medical reviews or production approvals.
const hash = text => createHash('sha256').update(text, 'utf8').digest('hex');
const fields = ['label', 'url', 'journal', 'ano', 'tipo', 'badge', 'badgeColor', 'impacto', 'icon', 'resumo', 'conclusao', 'curiosidade'];
const axes = { evidencia: 'VERIFICADA', pendencia: 'NENHUMA', veredito: 'aprovada', publicacao: 'LIBERADA' };
const card = label => ({ label, url: 'https://example.test/reference', journal: 'Technical fixture', ano: 2026,
  tipo: 'Technical fixture', badge: 'CONSENSUS', badgeColor: '#6366f1', impacto: 'Fixture impact', icon: 'fixture',
  resumo: 'Literal https://example.test/ has } and // and /* text */ and "quotes".', conclusao: 'Fixture conclusion', curiosidade: 'Fixture detail' });
const registry = (first, second = card('Unchanged card')) => `const refsDB = {\n// Outside literal\n  ref_a:${JSON.stringify(first)},\n  ref_b:${JSON.stringify(second)},\n};\n`;
const question = (qid, refs) => ({ qid, q: 'Technical fixture', opts: ['A', 'B', 'C', 'D'], ans: 0,
  exp: 'Fixture explanation', cat: 'fixture', diff: 'medium', refs });
const versions = version => ({ json: version, cache: version, comment: version, sentry: version });

function fixture() {
  const before = card('Before fixture'), after = card('After fixture');
  const version = { orderedCompactPythonSHA256: hash(JSON.stringify(after)), sortedCompactPythonSHA256: referenceDigest(after).slice(7) };
  const authorPath = 'docs/editorial/reviews/2026-10-21/technical-author.json';
  const peerPath = 'docs/editorial/reviews/2026-10-21/technical-peer.json';
  const author = { reviewer: 'technical-author', referenceId: 'ref_a', provenance: { after: version },
    afterOwnReview: { evidence: axes.evidencia, pending: axes.pendencia, verdict: axes.veredito, publicationAuthorization: axes.publicacao },
    wholeCardFieldCoverage: fields.map(field => ({ field })) };
  const peer = { reviewer: 'technical-peer', reviewedVariant: { referenceId: 'ref_a',
    orderedCompactPythonSHA256: version.orderedCompactPythonSHA256, sortedSHA256: version.sortedCompactPythonSHA256, fullLiteral: after },
    verdict: { evidence: axes.evidencia, pending: axes.pendencia, v2: axes.veredito, publicationAuthorization: axes.publicacao },
    fieldCoverage: fields.map(field => ({ field })) };
  const reports = new Map([[authorPath, JSON.stringify(author)], [peerPath, JSON.stringify(peer)]]);
  const questions = new Map([['11111111', question('11111111', ['ref_a'])], ['b933be69', question('b933be69', ['ref_b'])]]);
  const manifestPath = 'docs/editorial/review-batches/CARD-TECHNICAL.json';
  const allowed = ['data/refs.js', 'version.json', 'sw.js', 'index.html', manifestPath, authorPath, peerPath];
  return {
    manifestPath, manifest: { batch: 'CARD-TECHNICAL', reference_only: true, change_type: 'medical_editorial',
      expected_version: '16.20', allowed_files: allowed, questions: {}, expected_question_delta: 0, refs_policy: 'declared',
      references: { ref_a: { action: 'update', before_sha256: referenceDigest(before), after_sha256: referenceDigest(after), consumers: ['11111111'],
        author_review: { ...axes, report_path: authorPath, report_sha256: hash(reports.get(authorPath)), version_pointer: '/provenance/after', gate_pointer: '/afterOwnReview' },
        independent_review: { ...axes, report_path: peerPath, report_sha256: hash(reports.get(peerPath)), version_pointer: '/reviewedVariant', gate_pointer: '/verdict' } } },
      external_review: { greptile: 'unavailable', fallback_reviewer: 'Technical fixture reviewer' } },
    changedPaths: allowed, beforeQuestions: questions, afterQuestions: questions,
    beforeConsumers: referenceConsumers(questions), afterConsumers: referenceConsumers(questions),
    beforeTopicsText: 'unchanged authored bytes', afterTopicsText: 'unchanged authored bytes',
    beforeRefsText: registry(before), afterRefsText: registry(after),
    beforeReferenceIds: new Set(['ref_a', 'ref_b']), afterReferenceIds: new Set(['ref_a', 'ref_b']),
    beforeVersions: versions('16.19'), afterVersions: versions('16.20'), referenceReviewReports: reports,
  };
}
const codes = input => validateBatch(input).map(error => error.code);
function editReport(input, role, change) {
  const review = input.manifest.references.ref_a[role];
  const document = JSON.parse(input.referenceReviewReports.get(review.report_path));
  change(document);
  const raw = JSON.stringify(document);
  input.referenceReviewReports.set(review.report_path, raw); review.report_sha256 = hash(raw);
}
function afterRefs(input, source) { input.afterRefsText = source; input.afterReferenceIds = parseReferenceIds(source); }

test('accepts only the exact card with its own distinct full author and independent reviews', () => {
  const input = fixture();
  assert.deepEqual(validateManifest(input.manifest, input.manifestPath).errors, []);
  assert.deepEqual(validateBatch(input), []);
  assert.deepEqual(input.manifest.questions, {});
});

test('empty questions remain invalid without the explicit reference-only mode', () => {
  const input = fixture(); delete input.manifest.reference_only;
  assert.match(validateManifest(input.manifest, input.manifestPath).errors.join('\n'), /non-empty object/);
});

test('reference-only mode cannot disguise question approvals, technical-only changes or nonzero delta', () => {
  for (const change of [value => { value.questions = { '11111111': { action: 'reviewed_unchanged', preserve_fsrs: true, ...axes } }; },
    value => { value.change_type = 'technical_only'; }, value => { value.expected_question_delta = 1; }]) {
    const input = fixture(); change(input.manifest);
    assert.notDeepEqual(validateManifest(input.manifest, input.manifestPath).errors, []);
  }
});

test('requires compatible approved own axes and safe pinned report descriptors', () => {
  for (const change of [review => { review.evidencia = 'NÃO VERIFICADA'; }, review => { review.publicacao = 'BLOQUEADA'; },
    review => { review.report_path = '../private.json'; }, review => { review.report_sha256 = 'unverified'; }]) {
    const input = fixture(); change(input.manifest.references.ref_a.author_review);
    assert.notDeepEqual(validateManifest(input.manifest, input.manifestPath).errors, []);
  }
});

test('refuses extra changed cards and bytes outside the declared literal', () => {
  const input = fixture(); afterRefs(input, registry(card('After fixture'), card('Undeclared change')));
  assert.ok(codes(input).includes('REFERENCE_CARD_SCOPE'));
  const formatting = fixture(); formatting.afterRefsText = formatting.afterRefsText.replace('Outside literal', 'Changed outside literal');
  assert.ok(codes(formatting).includes('REFERENCE_CARD_SCOPE'));
});

test('reference-only updates cannot add or remove reference IDs', () => {
  const input = fixture(); afterRefs(input, input.afterRefsText.replace('\n};', '\n  ref_c:{label:"Extra"},\n};'));
  assert.ok(codes(input).includes('REFERENCE_ONLY_IDS'));
  const removed = fixture(); afterRefs(removed, `const refsDB={\n  ref_a:${JSON.stringify(card('After fixture'))}\n};`);
  assert.ok(codes(removed).includes('REFERENCE_ONLY_IDS'));
});

test('rejects altered topics bytes even when parsed question values are unchanged', () => {
  const input = fixture(); input.afterTopicsText += '\n';
  assert.ok(codes(input).includes('REFERENCE_ONLY_TOPICS'));
});

test('requires exactly the real unchanged consumers and does not fabricate a b933be69 link', () => {
  const omitted = fixture(); omitted.manifest.references.ref_a.consumers = [];
  assert.ok(codes(omitted).includes('REFERENCE_CONSUMERS'));
  const fabricated = fixture(); fabricated.manifest.references.ref_a.consumers.push('b933be69');
  assert.ok(codes(fabricated).includes('REFERENCE_CONSUMERS'));
  const moved = fixture(); moved.afterQuestions = new Map(moved.beforeQuestions);
  moved.afterQuestions.set('11111111', question('11111111', ['ref_b'])); moved.afterConsumers = referenceConsumers(moved.afterQuestions);
  assert.ok(codes(moved).includes('REFERENCE_CONSUMERS'));
  assert.ok(codes(moved).includes('QID_SCOPE'));
});

test('refuses wrong exact card hashes and changed-card schema loss', () => {
  const wrongHash = fixture(); wrongHash.manifest.references.ref_a.after_sha256 = 'sha256:' + 'f'.repeat(64);
  assert.ok(codes(wrongHash).includes('REFERENCE_CARD_HASH'));
  const missing = fixture(), value = card('After fixture'); delete value.curiosidade; afterRefs(missing, registry(value));
  assert.ok(codes(missing).includes('REFERENCE_CARD_SCHEMA'));
});

test('requires actual report bytes, not merely a declared approval', () => {
  const input = fixture(), descriptor = input.manifest.references.ref_a.author_review;
  input.referenceReviewReports.set(descriptor.report_path, input.referenceReviewReports.get(descriptor.report_path) + '\n');
  assert.ok(codes(input).includes('REFERENCE_REVIEW_FILE'));
  const missing = fixture(); missing.referenceReviewReports.clear();
  assert.ok(codes(missing).includes('REFERENCE_REVIEW_FILE'));
});

test('checks the own report gate and exact version instead of borrowing another approval', () => {
  const gate = fixture(); editReport(gate, 'author_review', report => { report.afterOwnReview.publicationAuthorization = 'BLOQUEADA'; });
  assert.ok(codes(gate).includes('REFERENCE_REVIEW_GATE'));
  const version = fixture(); editReport(version, 'author_review', report => { report.provenance.after.sortedCompactPythonSHA256 = '0'.repeat(64); });
  assert.ok(codes(version).includes('REFERENCE_REVIEW_VERSION'));
  const literal = fixture(); editReport(literal, 'independent_review', report => { report.reviewedVariant.fullLiteral.resumo = 'Different literal'; });
  assert.ok(codes(literal).includes('REFERENCE_REVIEW_VERSION'));
});

test('requires full-field coverage and distinct actual reviewers', () => {
  const coverage = fixture(); editReport(coverage, 'independent_review', report => { report.fieldCoverage[0] = report.fieldCoverage[1]; });
  assert.ok(codes(coverage).includes('REFERENCE_REVIEW_SCOPE'));
  for (const reviewer of ['technical-author', ' technical-author ']) {
    const identity = fixture(); editReport(identity, 'independent_review', report => { report.reviewer = reviewer; });
    assert.ok(codes(identity).includes('REFERENCE_REVIEW_SCOPE'));
  }
});

test('static reader preserves strings with URL slashes, braces, escapes and comment-like text', () => {
  const value = card('Literal "quote"'), source = registry(value);
  assert.deepEqual(parseReferenceCards(source).cards.get('ref_a'), value);
});

for (const [label, source] of [
  ['duplicate IDs', 'const refsDB={a:{label:"A"},"a":{label:"B"}};'],
  ['decoded duplicate fields', 'const refsDB={a:{label:"A","\\u006cabel":"B"}};'],
  ['function expression', 'const refsDB={a:{resumo:(()=>"A")()}};'],
  ['getter', 'const refsDB={a:{get resumo(){return "A";}}};'],
  ['template literal', 'const refsDB={a:{resumo:`A`}};'],
  ['nested expression', 'const refsDB={a:{resumo:{text:"A"}}};'],
  ['trailing executable code', 'const refsDB={a:{label:"A"}};globalThis.sideEffect=true;'],
  ['invalid JSON escape', 'const refsDB={a:{label:"\\q"}};'],
  ['unterminated comment', 'const refsDB={a:{label:"A"}};/*'],
  ['leading-zero number', 'const refsDB={a:{ano:02017}};'],
]) test(`static reader rejects ${label}`, () => assert.throws(() => parseReferenceCards(source)));
