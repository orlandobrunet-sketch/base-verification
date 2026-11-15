#!/usr/bin/env node
'use strict';

// Bounded integration planner. Default and --dry-run write nothing.
// No medical approval is inferred from author candidates or this utility.
// Root must configure the immutable gate-bundle pin after reviewing this draft.
// A separate, independently reviewed receipt must then bind the final utility
// bytes and exact plan. There is no command-line override for missing authority.
//
// TRUSTED_AUTHORITY format:
// { gateBundlePath: 'docs/editorial/reviews/.../independent-gates.json',
//   gateBundleSHA256: '<64 lowercase hex>' }
//
// Gate bundle format:
// { schema:'NQ_1725_INDEPENDENT_GATE_BUNDLE_v1', baseCommit:BASE,
//   baseRelease:'17.24', release:'17.25', candidateFiles:{path:sha256,...},
//   questions:{qid:declaration,...}, references:{referenceId:declaration,...} }
//
// Every declaration binds before_sha256 (null for add), after_sha256,
// action ('update' for questions; 'add'/'update' for cards), independent_report,
// independent_report_sha256, reviewer_pointer, version_pointer and gate_pointer.
// Pointers are absolute JSON pointers into the hash-pinned independent report.
// version_pointer resolves to the real {sha256,fullLiteral} version object.
// gate_pointer resolves to the real four-field gate:
// { evidence,pending,verdict,publicationAuthorization }.
// For SUSTAIN questions, eliminatories_pointer resolves to ten numbered rows;
// appeal_pointer resolves to the actual nonempty advogadoDoRecurso.result text;
// preserve_fsrs_pointer resolves to the review's actual preserveFSRS boolean.
// For sodium A4 only, reviewer_pointer is /reviewer/id; eliminatories_pointer
// resolves to /questions/<qid>/eliminatories/checks, an object keyed 1..10 with
// {criterion,triggered}; appeal_pointer targets advogadoDoRecurso/outcome;
// preserve_fsrs_pointer targets implementationObservation/fsrs ("PRESERVAR").
// Sodium card coverage is an object keyed by the exact 12 fields with
// {reviewed:true,supported:true,finding:"..."}; SUSTAIN coverage remains an array.
// These two explicit adapters reject other structural forms.
// The utility preserves and records the appeal text without inventing a custom
// "remaining" field or interpreting prose as a new clinical verdict.
// Card declarations additionally
// require coverage_pointer resolving to all 12 distinct {field:...} rows and
// before_consumers/after_consumers containing the exact unique question IDs.
// Real report findings must populate these fields; this file creates no gates.
//
// Operational receipt format, passed with --receipt and --receipt-sha256:
// { schema:'NQ_1725_OPERATIONAL_APPROVAL_v1', authorization:'APROVADA',
// independent:true,reviewer:'<independent reviewer>',baseCommit:BASE,
// baseRelease:'17.24',release:'17.25',utilitySHA256:'...',planSHA256:'...',
// gateBundleSHA256:'...',plannedDataFiles:{path:{sha256,bytes},...},
// unresolvedConditions:[],boundedScopeReviewed:true,
// historyPreservationReviewed:true }
//
// Final application writes only the four data files. Root must still make the
// canonical version/SW/index bump, declare the actual batch, run final checks and
// independently review the real diff before committing.

const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');

const BASE = 'ca1184916b53cddfc7581df17ed75ff3a029c14f';
const BASE_RELEASE = '17.24';
const RELEASE = '17.25';
const DOC = 'docs/editorial/reviews/2026-11-15-editorial-continuation';
const AUTHOR = 'reference_metadata_1725';
const TRUSTED_AUTHORITY = Object.freeze({
  gateBundlePath: DOC + '/independent-gate-bundle-1725.json',
  gateBundleSHA256: '439985a5eaf2f64e06814a6abedaf4032624920d598133dfa0e85ea8c9802e59'
});
const CANDIDATE_PINS = Object.freeze({
  [DOC + '/sodium-candidates-A4.json']: '670876c2661fb3dc70606db583214d89badf62352bfcb58617ecafdad9bd0695',
  [DOC + '/sodium-author-A4.json']: '119a757901790aa5b0c84b0d085977260e4fa8581c94ae5241d5bd02750ff318',
  [DOC + '/sustain6-candidates-A1.json']: 'ba59d60f13a6bb8aa1026bf73c2ba4dd3caaa46b8c39ab3ada7d97eac01d487e'
});
const QIDS = ['a4c85d32', '3fa2737c', 'e94a6488', 'd9257155', '21a99f07', 'e2aae4c7', '1a93346d', '516ec2a6'];
const REFIDS = ['sustain6', 'hyponatremia_verbalis2013'];
const PROFILES = ['main', 'exam', 'study', 'offline'];
const CARD_FIELDS = ['label', 'url', 'journal', 'ano', 'tipo', 'badge', 'badgeColor', 'impacto', 'icon', 'resumo', 'conclusao', 'curiosidade'];
const DATA = ['data/topics.js', 'data/refs.js', 'data/question-revision-history.js', 'data/question-revision-manifest.js'];
const sha = value => crypto.createHash('sha256').update(value).digest('hex');
const clone = value => JSON.parse(JSON.stringify(value));
const same = (a, b, label) => assert.deepEqual(clone(a), clone(b), label);
const sorted = value => [...value].sort();
const lf = value => value.replace(/\r\n?/g, '\n');
const plain = value => value && typeof value === 'object' && !Array.isArray(value);

function safeRelative(value) {
  assert(typeof value === 'string' && value.length && !value.includes('\\'), 'Unsafe relative path');
  assert(!path.isAbsolute(value) && !path.win32.isAbsolute(value), 'Absolute path forbidden here');
  assert(!value.split('/').some(part => !part || part === '.' || part === '..'), 'Traversal forbidden');
  return value;
}

function confined(repo, relative) {
  safeRelative(relative);
  let current = repo;
  for (const part of relative.split('/')) {
    current = path.join(current, part);
    if (fs.existsSync(current)) assert(!fs.lstatSync(current).isSymbolicLink(), 'Symlink/junction forbidden: ' + relative);
  }
  const rel = path.relative(repo, current);
  assert(rel && rel !== '..' && !rel.startsWith('..' + path.sep) && !path.isAbsolute(rel), 'Path outside repository');
  return current;
}

function parseArgs(argv) {
  const options = { repo: path.resolve(__dirname, '../../../..'), apply: false };
  let selectedMode = false;
  for (let index = 0; index < argv.length; index++) {
    const option = argv[index];
    if (option === '--dry-run' || option === '--apply') {
      assert(!selectedMode, 'Choose at most one execution mode');
      selectedMode = true;
      options.apply = option === '--apply';
      continue;
    }
    assert(['--repo', '--receipt', '--receipt-sha256'].includes(option), 'Unknown option: ' + option);
    assert(argv[index + 1] && !argv[index + 1].startsWith('--'), 'Missing option value: ' + option);
    const key = option === '--receipt-sha256' ? 'receiptSHA256' : option.slice(2);
    assert(!Object.hasOwn(options, key) || key === 'repo', 'Repeated option: ' + option);
    options[key] = argv[++index];
  }
  options.repo = fs.realpathSync(path.resolve(options.repo));
  assert(!!options.receipt === !!options.receiptSHA256, 'Receipt path and explicit SHA256 are both required');
  if (options.receiptSHA256) assert(/^[a-f0-9]{64}$/.test(options.receiptSHA256), 'Invalid receipt hash');
  return options;
}

function pointer(document, value) {
  assert(typeof value === 'string' && value.startsWith('/'), 'Absolute JSON pointer required');
  return value.slice(1).split('/').reduce((current, part) => {
    assert(!/~(?![01])/.test(part), 'Invalid JSON pointer escape');
    const key = part.replace(/~1/g, '/').replace(/~0/g, '~');
    assert(current !== null && typeof current === 'object' && Object.hasOwn(current, key), 'JSON pointer not found: ' + value);
    return current[key];
  }, document);
}

function wrappedArray(text, name) {
  const expression = new RegExp('const ' + name + '=(\\[[^\\r\\n]*\\]);\\r?\\nif\\(typeof module');
  const match = expression.exec(text);
  assert(match, 'Published array wrapper changed: ' + name);
  const start = match.index + ('const ' + name + '=').length;
  return { array: JSON.parse(match[1]), closingIndex: start + match[1].length - 1 };
}

function renderManifest(manifest) {
  return '/* Generated from the authored bank and reference registry; never from browser saves. */\n'
    + '(function(root){\n\'use strict\';\nconst manifest=' + JSON.stringify(manifest) + ';\n'
    + "if(typeof module==='object'&&module.exports)module.exports=manifest;\n"
    + 'root.NQQuestionRevisionManifest=manifest;\n})(typeof globalThis!==\'undefined\'?globalThis:this);\n';
}

function cardLiteral(card, eol) {
  return '{' + eol + Object.entries(card).map(([key, value]) =>
    '    ' + key + ':' + JSON.stringify(value)).join(',' + eol) + eol + '  }';
}

function changedCardText(text, operations, spans) {
  const eol = text.includes('\r\n') ? '\r\n' : '\n';
  const update = operations.find(row => row.id === 'sustain6');
  const span = spans.get(update.id);
  assert(span && update.action === 'update');
  text = text.slice(0, span[0]) + cardLiteral(update.after, eol) + text.slice(span[1]);
  const add = operations.find(row => row.id === 'hyponatremia_verbalis2013');
  assert(add.action === 'add' && !spans.has(add.id));
  const end = /\};\s*$/.exec(text);
  assert(end && /,\s*$/.test(text.slice(0, end.index)), 'Reference append boundary changed');
  return text.slice(0, end.index) + '  ' + add.id + ':' + cardLiteral(add.after, eol) + ',' + eol + text.slice(end.index);
}

function requireClinicalGate(gate, reviewer, author, id) {
  assert(plain(gate), 'Missing actual independent gate: ' + id);
  assert(typeof reviewer === 'string' && reviewer.trim() && reviewer !== author, 'Reviewer is absent or is the author: ' + id);
  assert(['aprovada', 'aprovada com pequenos ajustes'].includes(gate.verdict), 'Nonapproval gate: ' + id);
  assert.equal(gate.publicationAuthorization, 'LIBERADA', 'Publication is not LIBERADA: ' + id);
  assert((gate.evidence === 'VERIFICADA' && gate.pending === 'NENHUMA') ||
    (gate.evidence === 'PARCIALMENTE VERIFICADA' && gate.pending === 'NÃO DECISIVA'), 'Invalid evidence/pending axes: ' + id);
}

function validateQuestionAudit(report, declaration, id) {
  const sodiumFormat = QIDS.slice(0, 6).includes(id);
  const root = '/questions/' + id;
  assert.equal(declaration.reviewer_pointer, sodiumFormat ? '/reviewer/id' : '/reviewer');
  assert.equal(declaration.version_pointer, root + '/version');
  assert.equal(declaration.gate_pointer, root + '/gate');
  assert.equal(declaration.eliminatories_pointer, root + (sodiumFormat ? '/eliminatories/checks' : '/eliminatories'));
  assert.equal(declaration.appeal_pointer, root + (sodiumFormat ? '/advogadoDoRecurso/outcome' : '/advogadoDoRecurso/result'));
  assert.equal(declaration.preserve_fsrs_pointer, root + (sodiumFormat ? '/implementationObservation/fsrs' : '/preserveFSRS'));
  const checks = pointer(report, declaration.eliminatories_pointer);
  if (sodiumFormat) {
    assert(plain(checks), 'Sodium A4 requires the actual keyed eliminatory checks object');
    same(sorted(Object.keys(checks)), sorted(Array.from({ length: 10 }, (_, index) => String(index + 1))));
    for (const row of Object.values(checks)) {
      assert(plain(row));
      same(sorted(Object.keys(row)), ['criterion', 'triggered']);
      assert(typeof row.criterion === 'string' && row.criterion.trim());
      assert.equal(row.triggered, false, 'Sodium A4 eliminatory triggered: ' + id);
    }
  } else {
    assert(Array.isArray(checks) && checks.length === 10, 'SUSTAIN requires ten actual audit rows');
    same(sorted(checks.map(row => row.number)), sorted([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]));
    for (const row of checks) {
      assert(plain(row));
      same(sorted(Object.keys(row)), sorted(['number', 'name', 'triggered']));
      assert(typeof row.name === 'string' && row.name.trim());
      assert.equal(row.triggered, false, 'SUSTAIN eliminatory triggered: ' + id);
    }
  }
  const appealResult = pointer(report, declaration.appeal_pointer);
  assert(typeof appealResult === 'string' && appealResult.trim(), 'Actual adversarial result text required: ' + id);
  assert.equal(pointer(report, declaration.preserve_fsrs_pointer), sodiumFormat ? 'PRESERVAR' : true);
  return { format: sodiumFormat ? 'sodium-A4-keyed' : 'sustain6-A1-array', appealResult };
}

function validateCardCoverage(report, declaration, id) {
  const sodiumFormat = id === 'hyponatremia_verbalis2013';
  const root = sodiumFormat ? '/references/' + id : '/reference';
  assert.equal(declaration.reviewer_pointer, sodiumFormat ? '/reviewer/id' : '/reviewer');
  assert.equal(declaration.version_pointer, root + '/version');
  assert.equal(declaration.gate_pointer, root + '/gate');
  assert.equal(declaration.coverage_pointer, root + '/wholeCardFieldCoverage');
  const coverage = pointer(report, declaration.coverage_pointer);
  if (sodiumFormat) {
    assert(plain(coverage), 'Sodium A4 requires coverage keyed by the twelve fields');
    same(sorted(Object.keys(coverage)), sorted(CARD_FIELDS));
    for (const row of Object.values(coverage)) {
      assert(plain(row));
      same(sorted(Object.keys(row)), sorted(['reviewed', 'supported', 'finding']));
      assert.equal(row.reviewed, true);
      assert.equal(row.supported, true);
      assert(typeof row.finding === 'string' && row.finding.trim());
    }
  } else {
    assert(Array.isArray(coverage) && coverage.length === 12, 'SUSTAIN requires twelve coverage rows');
    same(sorted(coverage.map(row => row.field)), sorted(CARD_FIELDS));
    assert(coverage.every(row => plain(row) && typeof row.assessment === 'string' && row.assessment.trim()));
  }
  return { format: sodiumFormat ? 'sodium-A4-keyed' : 'sustain6-A1-array', fields: 12 };
}

function validateAuthority(repo, operations, referenceOperations, consumers, digest) {
  if (TRUSTED_AUTHORITY === null) {
    return { ready: false, bundleSHA256: null, verified: [],
      blockedReason: 'Draft: immutable paths/hashes of the ten independent gates have not been configured by root.' };
  }
  const readPinned = (relative, expected) => {
    assert(/^[a-f0-9]{64}$/.test(expected), 'Invalid independent report pin');
    const bytes = fs.readFileSync(confined(repo, relative));
    assert.equal(sha(bytes), expected, 'Independent report bytes changed: ' + relative);
    return JSON.parse(bytes);
  };
  const bundle = readPinned(TRUSTED_AUTHORITY.gateBundlePath, TRUSTED_AUTHORITY.gateBundleSHA256);
  assert.equal(bundle.schema, 'NQ_1725_INDEPENDENT_GATE_BUNDLE_v1');
  assert.equal(bundle.baseCommit, BASE);
  assert.equal(bundle.baseRelease, BASE_RELEASE);
  assert.equal(bundle.release, RELEASE);
  same(bundle.candidateFiles, CANDIDATE_PINS, 'Gate bundle candidate-file pins');
  same(sorted(Object.keys(bundle.questions || {})), sorted(QIDS), 'Exactly eight question gates required');
  same(sorted(Object.keys(bundle.references || {})), sorted(REFIDS), 'Exactly two card gates required');
  const verified = [];
  for (const operation of [...operations, ...referenceOperations]) {
    const isCard = REFIDS.includes(operation.id);
    const declaration = (isCard ? bundle.references : bundle.questions)[operation.id];
    assert.equal(declaration.action, operation.action);
    assert.equal(declaration.before_sha256, operation.before === null ? null : digest(operation.before));
    assert.equal(declaration.after_sha256, digest(operation.after));
    const report = readPinned(declaration.independent_report, declaration.independent_report_sha256);
    const version = pointer(report, declaration.version_pointer);
    assert(plain(version) && plain(version.fullLiteral), 'Actual full version object required: ' + operation.id);
    same(version.fullLiteral, operation.after, 'Independently reviewed literal: ' + operation.id);
    assert.equal(version.sha256, digest(version.fullLiteral), 'Independent canonical version hash: ' + operation.id);
    const gate = pointer(report, declaration.gate_pointer);
    const reviewer = pointer(report, declaration.reviewer_pointer);
    requireClinicalGate(gate, reviewer, operation.author, operation.id);
    let audit;
    if (isCard) {
      audit = validateCardCoverage(report, declaration, operation.id);
      same(declaration.before_consumers, consumers[operation.id].before);
      same(declaration.after_consumers, consumers[operation.id].after);
    } else audit = validateQuestionAudit(report, declaration, operation.id);
    verified.push({ id: operation.id, reviewer, report: declaration.independent_report,
      reportSHA256: declaration.independent_report_sha256, candidateSHA256: digest(operation.after), audit });
  }
  return { ready: true, bundleSHA256: TRUSTED_AUTHORITY.gateBundleSHA256, verified, blockedReason: null };
}

async function prepare(options) {
  const repo = options.repo;
  const git = (...args) => cp.execFileSync('git', args, { cwd: repo, encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] });
  const at = relative => git('show', BASE + ':' + safeRelative(relative));
  assert.equal(git('rev-parse', BASE + '^{commit}').trim(), BASE);
  assert.equal(fs.realpathSync(git('rev-parse', '--show-toplevel').trim()), repo);
  const trustedModules = ['tools/build-question-revision-manifest.cjs', 'js/answer-presentation.js',
    'js/question-revisions.js', 'scripts/editorial-batch/references.mjs', 'scripts/editorial-batch/editorial-axes.mjs'];
  for (const relative of trustedModules) assert.equal(lf(fs.readFileSync(confined(repo, relative), 'utf8')), lf(at(relative)), 'Helper differs from base: ' + relative);
  const builder = require(confined(repo, trustedModules[0]));
  const answers = require(confined(repo, 'js/answer-presentation.js'));
  const revisions = require(confined(repo, 'js/question-revisions.js'));
  const { parseReferenceCards } = await import(pathToFileURL(confined(repo, 'scripts/editorial-batch/references.mjs')).href);
  const originalBytes = Object.fromEntries(DATA.map(relative => [relative, fs.readFileSync(confined(repo, relative))]));
  const beforeText = Object.fromEntries(DATA.map(relative => [relative, originalBytes[relative].toString('utf8')]));
  for (const relative of DATA) assert.equal(lf(beforeText[relative]), lf(at(relative)), 'Data source differs from published base: ' + relative);
  assert.equal(JSON.parse(at('version.json')).version, BASE_RELEASE);
  assert.equal(JSON.parse(fs.readFileSync(confined(repo, 'version.json'))).version, BASE_RELEASE);
  const before = builder.load('data/topics.js', 'topics');
  const refsBefore = builder.load('data/refs.js', 'refsDB');
  const oldManifest = builder.load('data/question-revision-manifest.js', 'NQQuestionRevisionManifest');
  const oldHistory = builder.load('data/question-revision-history.js', 'NQQuestionRevisionHistory');
  assert.equal(before.length, 741);
  assert.equal(oldHistory.length, 169);
  assert.equal(oldManifest.release, BASE_RELEASE);
  same(builder.build(before, refsBefore, BASE_RELEASE), oldManifest, 'Real published manifest must match authored sources');
  const packets = {};
  for (const [relative, expected] of Object.entries(CANDIDATE_PINS)) {
    const bytes = fs.readFileSync(confined(repo, relative));
    assert.equal(sha(bytes), expected, 'Candidate packet changed: ' + relative);
    packets[relative] = JSON.parse(bytes);
  }
  const sodium = packets[DOC + '/sodium-candidates-A4.json'];
  const sodiumAuthor = packets[DOC + '/sodium-author-A4.json'];
  const sustain = packets[DOC + '/sustain6-candidates-A1.json'];
  assert.equal(sodium.integrationBase, BASE);
  assert.equal(sodiumAuthor.integrationBase, BASE);
  assert.equal(sodiumAuthor.reviewer, sodium.author);
  assert.equal(sustain.base.commit, BASE);
  same(sorted(Object.keys(sodium.questions)), sorted(QIDS.slice(0, 6)));
  same(sorted(sustain.questions.map(row => row.qid)), sorted(QIDS.slice(6)));
  const operations = [];
  const declaredVersion = (value, label) => {
    const expected = value.sha256 || 'sha256:' + value.sortedCompactPythonSHA256;
    assert.equal(builder.digest(value.fullLiteral), expected, 'Packet canonical hash mismatch: ' + label);
    if (value.orderedCompactPythonSHA256) assert.equal(sha(JSON.stringify(value.fullLiteral)), value.orderedCompactPythonSHA256);
    return clone(value.fullLiteral);
  };
  for (const [qid, row] of Object.entries(sodium.questions)) {
    assert.equal(row.preserveFSRS, true);
    operations.push({ id: qid, action: 'update', author: sodium.author,
      before: declaredVersion(row.before, qid + '/before'), after: declaredVersion(row.candidate, qid + '/after') });
    same(declaredVersion(sodiumAuthor.questions[qid].version, qid + '/author-A4'), row.candidate.fullLiteral);
  }
  for (const row of sustain.questions) operations.push({ id: row.qid, action: 'update', author: sustain.reviewer,
    before: declaredVersion(row.before, row.qid + '/before'), after: declaredVersion(row.candidate, row.qid + '/after') });
  same(sorted(operations.map(row => row.id)), sorted(QIDS));
  const after = clone(before);
  for (const operation of operations) {
    const index = before.findIndex(row => row.qid === operation.id);
    assert(index >= 0);
    same(before[index], operation.before, 'Candidate must replace the actually published author object');
    for (const field of ['qid', 't', 'ans', 'cat']) same(operation.after[field], operation.before[field], operation.id + '/' + field);
    if (operation.id === 'a4c85d32') {
      assert.equal(operation.before.diff, 'hard');
      assert.equal(operation.after.diff, 'medium', 'Only reviewed a4c85d32 hard-to-medium exception is allowed');
    } else same(operation.after.diff, operation.before.diff, 'Difficulty outside explicit a4c85d32 exception');
    same(sorted(Object.keys(operation.after)), sorted(Object.keys(operation.before)), 'Unexpected question fields');
    assert.equal(operation.after.opts.length, 4);
    assert(operation.after.opts.every(value => typeof value === 'string' && value.trim()));
    assert.equal(new Set(operation.after.opts).size, 4);
    assert.notEqual(builder.digest(operation.before), builder.digest(operation.after), 'No-op candidate');
    operation.index = index;
    after[index] = clone(operation.after);
  }
  same(before.map(row => row.qid), after.map(row => row.qid), 'Stable bank order and qid/FSRS identity');
  for (let index = 0; index < before.length; index++) if (!QIDS.includes(before[index].qid)) same(before[index], after[index], 'Question outside the eight changed');
  const added = sodium.references.hyponatremia_verbalis2013;
  assert.equal(added.action, 'add');
  assert(!Object.hasOwn(refsBefore, 'hyponatremia_verbalis2013'));
  assert.equal(sustain.reference.referenceId, 'sustain6');
  const referenceOperations = [
    { id: 'sustain6', action: 'update', author: sustain.reviewer, before: declaredVersion(sustain.reference.before, 'sustain6/before'),
      after: declaredVersion(sustain.reference.candidate, 'sustain6/after') },
    { id: 'hyponatremia_verbalis2013', action: 'add', author: sodium.author, before: null,
      after: declaredVersion(added.candidate, 'hyponatremia_verbalis2013/after') }
  ];
  same(declaredVersion(sodiumAuthor.references.hyponatremia_verbalis2013.version, 'hyponatremia_verbalis2013/author-A4'),
    referenceOperations.find(row => row.id === 'hyponatremia_verbalis2013').after);
  const refsAfter = clone(refsBefore);
  for (const operation of referenceOperations) {
    if (operation.before !== null) same(refsBefore[operation.id], operation.before);
    same(sorted(Object.keys(operation.after)), sorted(CARD_FIELDS));
    assert(CARD_FIELDS.every(field => field === 'ano' ? Number.isInteger(operation.after[field]) : typeof operation.after[field] === 'string'));
    refsAfter[operation.id] = clone(operation.after);
  }
  for (const id of Object.keys(refsBefore)) if (!REFIDS.includes(id)) same(refsBefore[id], refsAfter[id], 'Reference outside the two changed');
  same(sorted(Object.keys(refsAfter)), sorted([...Object.keys(refsBefore), 'hyponatremia_verbalis2013']));
  for (const question of after) for (const id of question.refs) assert(Object.hasOwn(refsAfter, id), 'Orphan reference: ' + question.qid + '/' + id);
  const consumers = Object.fromEntries(REFIDS.map(id => [id, {
    before: sorted(before.filter(row => row.refs.includes(id)).map(row => row.qid)),
    after: sorted(after.filter(row => row.refs.includes(id)).map(row => row.qid))
  }]));
  same(consumers.sustain6.before, sorted(QIDS.slice(6)));
  same(consumers.sustain6.after, sorted(QIDS.slice(6)));
  assert(consumers.hyponatremia_verbalis2013.after.length > 0);
  assert(consumers.hyponatremia_verbalis2013.after.every(qid => QIDS.includes(qid)));
  const authority = validateAuthority(repo, operations, referenceOperations, consumers, builder.digest);
  let changedLines = 0;
  const topicsText = beforeText['data/topics.js'].replace(/^([ \t]*)(\{[^\r\n]*\})(,?)(\r?)$/gm,
    (line, indent, literal, comma, cr) => {
      const question = JSON.parse(literal);
      const operation = operations.find(row => row.id === question.qid);
      if (!operation) return line;
      same(question, operation.before);
      changedLines++;
      return indent + JSON.stringify(operation.after) + comma + cr;
    });
  assert.equal(changedLines, 8);
  const rebuilt = topicsText.split(/\r\n|\r|\n/).filter(line => line.trim().startsWith('{')).map(line => JSON.parse(line.trim().replace(/,$/, '')));
  same(rebuilt, after, 'Projected question serialization');
  const refsText = changedCardText(beforeText['data/refs.js'], referenceOperations, parseReferenceCards(beforeText['data/refs.js']).spans);
  same(Object.fromEntries(parseReferenceCards(refsText).cards), refsAfter, 'Projected reference serialization');
  const newManifest = builder.build(after, refsAfter, RELEASE);
  assert.equal(Object.keys(newManifest.current).length, 741);
  const affected = after.filter(row => oldManifest.current[row.qid].recordRevision !== newManifest.current[row.qid].recordRevision).map(row => row.qid);
  same(sorted(affected), sorted(QIDS), 'Affected record identities must be exactly the eight questions');
  const archives = affected.map(qid => {
    const index = before.findIndex(row => row.qid === qid);
    const author = clone(before[index]);
    const record = clone(oldManifest.current[qid]);
    assert(!oldHistory.some(row => row.qid === qid && row.recordRevision === record.recordRevision), 'Published version already archived');
    return { qid, release: BASE_RELEASE, author, sources: builder.sources(author, index),
      references: Object.fromEntries(author.refs.map(id => [id, clone(refsBefore[id])])),
      policy: { material: true, pending: 'update-required' }, ...record,
      bindings: Object.fromEntries(PROFILES.map(profile => [profile, { version: 1, qid, profile, recordRevision: record.recordRevision }])) };
  });
  assert.equal(archives.length, 8);
  const historyBoundary = wrappedArray(beforeText['data/question-revision-history.js'], 'history');
  same(historyBoundary.array, oldHistory);
  const insertion = ',' + archives.map(row => JSON.stringify(row)).join(',');
  const historyText = beforeText['data/question-revision-history.js'].slice(0, historyBoundary.closingIndex) + insertion
    + beforeText['data/question-revision-history.js'].slice(historyBoundary.closingIndex);
  assert.equal(historyText.slice(0, historyBoundary.closingIndex), beforeText['data/question-revision-history.js'].slice(0, historyBoundary.closingIndex));
  assert.equal(historyText.slice(historyBoundary.closingIndex + insertion.length), beforeText['data/question-revision-history.js'].slice(historyBoundary.closingIndex));
  const history = wrappedArray(historyText, 'history').array;
  same(history.slice(0, 169), oldHistory, 'All previous historical records preserved canonically');
  assert.equal(history.length, 177);
  const sourceMap = bank => Object.fromEntries(PROFILES.map(profile => [profile,
    bank.map((question, index) => builder.sources(question, index)[profile])]));
  const oldCatalog = revisions.createCatalog({ manifest: oldManifest, history: oldHistory, authors: before, sources: sourceMap(before), references: refsBefore });
  const catalog = revisions.createCatalog({ manifest: newManifest, history, authors: after, sources: sourceMap(after), references: refsAfter });
  let oldHistoricalBindings = 0;
  let oldAmbiguitiesPreserved = 0;
  let newHistoricalBindings = 0;
  const newAmbiguities = [];
  for (const archived of oldHistory) for (const profile of Object.keys(archived.sources)) {
    const binding = archived.bindings && archived.bindings[profile] ||
      { version: 1, qid: archived.qid, profile, recordRevision: archived.recordRevision };
    const previous = oldCatalog.inspect(archived.sources[profile], { profile, binding });
    const current = catalog.inspect(archived.sources[profile], { profile, binding });
    assert.equal(previous.status, 'known');
    assert.equal(current.status, 'known');
    assert.equal(current.value.historical, true);
    same(current.value.references, previous.value.references);
    oldHistoricalBindings++;
    if (oldCatalog.inspect(archived.sources[profile], { profile }).status === 'ambiguous') {
      assert.equal(catalog.inspect(archived.sources[profile], { profile }).status, 'ambiguous');
      oldAmbiguitiesPreserved++;
    }
  }
  for (const archived of archives) for (const profile of PROFILES) {
    const found = catalog.inspect(archived.sources[profile], { profile, binding: archived.bindings[profile] });
    assert.equal(found.status, 'known');
    assert.equal(found.value.historical, true);
    assert.equal(found.value.policy.pending, 'update-required');
    assert.equal(found.value.policy.answered, 'historical');
    same(found.value.references, archived.references);
    same(catalog.current(archived.qid, profile).author, after.find(row => row.qid === archived.qid));
    newHistoricalBindings++;
    const unbound = catalog.inspect(archived.sources[profile], { profile });
    if (unbound.status === 'ambiguous') newAmbiguities.push({ qid: archived.qid, profile });
    if (builder.digest(archived.sources[profile]) === newManifest.current[archived.qid].sourceRevisions[profile]) assert.equal(unbound.status, 'ambiguous', 'Reference-only source ambiguity must not be guessed');
  }
  assert.equal(newHistoricalBindings, 32);
  let presentations = 0;
  for (const [index, question] of after.entries()) for (const [profile, source] of Object.entries(builder.sources(question, index))) {
    const shown = answers.present(source, { preserveOrder: true });
    assert(shown);
    assert.equal(shown._answerPresentation.sourceRevision, newManifest.current[question.qid].sourceRevisions[profile]);
    presentations++;
  }
  assert.equal(presentations, 2964);
  const writes = new Map([
    ['data/topics.js', Buffer.from(topicsText)],
    ['data/refs.js', Buffer.from(refsText)],
    ['data/question-revision-history.js', Buffer.from(historyText)],
    ['data/question-revision-manifest.js', Buffer.from(renderManifest(newManifest))]
  ]);
  same(sorted([...writes.keys()]), sorted(DATA));
  const plannedDataFiles = Object.fromEntries([...writes].map(([relative, bytes]) => [relative, { sha256: sha(bytes), bytes: bytes.length }]));
  const proof = {
    schema: 'NQ_1725_BOUNDED_INTEGRATION_PLAN_v1', baseCommit: BASE, baseRelease: BASE_RELEASE, release: RELEASE,
    utilitySHA256: sha(fs.readFileSync(__filename)), candidateFiles: CANDIDATE_PINS,
    sourceDataFiles: Object.fromEntries(DATA.map(relative => [relative, { sha256: sha(originalBytes[relative]), bytes: originalBytes[relative].length }])),
    questionOperations: operations.map(row => ({ qid: row.id, index: row.index, beforeSHA256: builder.digest(row.before), afterSHA256: builder.digest(row.after), preserveFSRS: true })),
    referenceOperations: referenceOperations.map(row => ({ id: row.id, action: row.action,
      beforeSHA256: row.before === null ? null : builder.digest(row.before), afterSHA256: builder.digest(row.after), consumers: consumers[row.id] })),
    unchangedQuestions: 733, unchangedReferences: Object.keys(refsBefore).length - 1,
    unchangedReferenceIdsOutsideScope: Object.keys(refsBefore).filter(id => !REFIDS.includes(id)).length,
    stableQuestionOrder: true, explicitDifficultyException: { qid: 'a4c85d32', before: 'hard', after: 'medium' },
    previousHistoryRecordsPreserved: 169, previousHistoryBytesPreserved: true,
    historyInsertionCharacterOffset: historyBoundary.closingIndex, historyInsertionSHA256: sha(insertion),
    newPublishedArchives: archives.map(row => ({ qid: row.qid, release: row.release, recordRevision: row.recordRevision, archiveSHA256: builder.digest(row) })),
    totalHistoryRecords: 177, oldHistoricalBindings, oldAmbiguitiesPreserved, newHistoricalBindings, newAmbiguities,
    manifestQuestions: 741, answerPresentations: presentations, gateBundleSHA256: authority.bundleSHA256,
    plannedDataFiles
  };
  return { repo, git, writes, originalBytes, authority, proof, planSHA256: builder.digest(proof) };
}

function approveReceipt(options, prepared) {
  assert(prepared.authority.ready, prepared.authority.blockedReason);
  assert(options.receipt && options.receiptSHA256, 'Exact independent operational receipt is required for --apply');
  const selectedReceiptPath = path.resolve(options.receipt);
  assert(!fs.lstatSync(selectedReceiptPath).isSymbolicLink(), 'Receipt may not be a symlink');
  const receiptPath = fs.realpathSync(selectedReceiptPath);
  const bytes = fs.readFileSync(receiptPath);
  assert.equal(sha(bytes), options.receiptSHA256, 'Operational receipt bytes changed');
  const receipt = JSON.parse(bytes);
  assert.equal(receipt.schema, 'NQ_1725_OPERATIONAL_APPROVAL_v1');
  assert.equal(receipt.authorization, 'APROVADA');
  assert.equal(receipt.independent, true);
  assert(typeof receipt.reviewer === 'string' && receipt.reviewer.trim() && receipt.reviewer !== AUTHOR);
  assert.equal(receipt.baseCommit, BASE);
  assert.equal(receipt.baseRelease, BASE_RELEASE);
  assert.equal(receipt.release, RELEASE);
  assert.equal(receipt.utilitySHA256, prepared.proof.utilitySHA256);
  assert.equal(receipt.planSHA256, prepared.planSHA256);
  assert.equal(receipt.gateBundleSHA256, prepared.authority.bundleSHA256);
  same(receipt.plannedDataFiles, prepared.proof.plannedDataFiles);
  same(receipt.unresolvedConditions, []);
  assert.equal(receipt.boundedScopeReviewed, true);
  assert.equal(receipt.historyPreservationReviewed, true);
  return { path: receiptPath, sha256: sha(bytes), reviewer: receipt.reviewer };
}

function applyPrepared(options, prepared) {
  const receipt = approveReceipt(options, prepared);
  assert.equal(prepared.git('rev-parse', 'HEAD').trim(), BASE, '--apply requires HEAD at the exact reviewed base');
  assert(prepared.git('branch', '--show-current').trim().startsWith('codex/'), 'Named codex task branch required');
  for (const relative of DATA) assert.equal(sha(fs.readFileSync(confined(prepared.repo, relative))), sha(prepared.originalBytes[relative]), 'Source changed before application');
  // Four-file replacement is not a filesystem transaction. Preflight completes
  // before any write; synchronous failures trigger restoration of original bytes.
  const changed = [];
  try {
    for (const [relative, bytes] of prepared.writes) {
      changed.push(relative);
      fs.writeFileSync(confined(prepared.repo, relative), bytes);
      assert.equal(sha(fs.readFileSync(confined(prepared.repo, relative))), sha(bytes), 'Written bytes differ');
    }
  } catch (error) {
    const rollbackErrors = [];
    for (const relative of changed.reverse()) {
      try { fs.writeFileSync(confined(prepared.repo, relative), prepared.originalBytes[relative]); }
      catch (failure) { rollbackErrors.push(relative + ': ' + String(failure)); }
    }
    if (rollbackErrors.length) error.message += '\nRollback needs manual attention: ' + rollbackErrors.join('; ');
    throw error;
  }
  return receipt;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const prepared = await prepare(options);
  let receipt = options.receipt ? approveReceipt(options, prepared) : null;
  if (options.apply) receipt = applyPrepared(options, prepared);
  else for (const relative of DATA) assert.equal(sha(fs.readFileSync(confined(prepared.repo, relative))), sha(prepared.originalBytes[relative]), 'Dry-run modified source data');
  console.log(JSON.stringify({
    mode: options.apply ? 'apply' : 'dry-run', repositoryDataWritten: options.apply,
    independentGatesReady: prepared.authority.ready,
    applyBlockedReason: prepared.authority.blockedReason || (receipt ? null :
      'Independent operational receipt bound to this exact utility and plan is still required.'),
    independentGateEntriesVerified: prepared.authority.verified.length,
    operationalReceipt: receipt, planSHA256: prepared.planSHA256, proof: prepared.proof,
    limitations: [
      'Author drafts and this planner never grant clinical publication approval.',
      'This draft cannot apply until root configures the immutable real gate-bundle path/hash and supplies an independently reviewed exact receipt.',
      'Dry-run projects the four data files only; version.json, sw.js, index.html, actual batch declaration, final tests and Git review remain root work.',
      'No commits, staging, hooks, remote operations, browser or database actions are performed.',
      'Future application uses synchronous writes and rollback on caught errors; it is not a cross-file filesystem transaction.'
    ]
  }, null, 2));
}

if (require.main === module) main().catch(error => {
  console.error(error.stack || String(error));
  process.exitCode = 1;
});
module.exports = { prepare };
