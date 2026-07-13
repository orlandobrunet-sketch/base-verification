import { changedQuestionIds, equalExceptRefs } from './questions.mjs';

const FORBIDDEN = [
  /(^|\/)\.playwright-mcp\//,
  /(^|\/)test-results\//,
  /(^|\/)tests\/report\//,
  /(^|\/)playwright-report\//,
  /(^|\/)trace\.zip$/,
  /\.zip$/i,
  /\.scratch\./i,
  /\.tmp$/i,
];

const diagnostic = (code, message) => ({ code, message });

function validateQuestion(qid, question, errors) {
  const textFields = ['q', 'exp', 'cat', 'diff'];
  if (!question || textFields.some((field) => typeof question[field] !== 'string') ||
      !Array.isArray(question.opts) || question.opts.length !== 4 ||
      !question.opts.every((option) => typeof option === 'string') ||
      !Number.isInteger(question.ans) || question.ans < 0 || question.ans > 3 ||
      !Array.isArray(question.refs) || !question.refs.every((ref) => typeof ref === 'string')) {
    errors.push(diagnostic('QUESTION_STRUCTURE', `Question ${qid} has invalid required fields, alternatives, answer, or refs`));
  }
}

function sameSet(left, right) {
  return left.size === right.size && [...left].every((value) => right.has(value));
}

export function validateBatch(input) {
  const errors = [];
  const {
    manifest, manifestPath, changedPaths, beforeQuestions, afterQuestions,
    beforeReferenceIds, afterReferenceIds, afterConsumers,
    beforeRefsText, afterRefsText, beforeVersions, afterVersions,
  } = input;

  for (const path of changedPaths) {
    if (FORBIDDEN.some((pattern) => pattern.test(path))) errors.push(diagnostic('FORBIDDEN_ARTIFACT', `Forbidden artifact changed: ${path}`));
    if (!manifest.allowed_files.includes(path)) errors.push(diagnostic('UNDECLARED_FILE', `Changed file is not allowed by manifest: ${path}`));
  }
  for (const path of manifest.allowed_files) {
    if (!changedPaths.includes(path)) errors.push(diagnostic('FILE_SCOPE', `Manifest allows a file that did not change: ${path}`));
  }
  if (!manifest.allowed_files.includes(manifestPath)) errors.push(diagnostic('MANIFEST_SCOPE', 'Manifest path is not allowed by its own declaration'));

  const changedQids = new Set(changedQuestionIds(beforeQuestions, afterQuestions));
  const declaredQids = new Set(Object.keys(manifest.questions));
  if (!sameSet(changedQids, declaredQids)) {
    errors.push(diagnostic('QID_SCOPE', `Changed qids [${[...changedQids]}] do not equal declared qids [${[...declaredQids]}]`));
  }

  for (const [qid, declaration] of Object.entries(manifest.questions)) {
    const before = beforeQuestions.get(qid);
    const after = afterQuestions.get(qid);
    if (declaration.action === 'add' && (before || !after)) errors.push(diagnostic('ACTION_MISMATCH', `${qid}: add does not match existence`));
    if (declaration.action === 'retire' && (!before || after)) errors.push(diagnostic('ACTION_MISMATCH', `${qid}: retire does not match existence`));
    if (['rebuild', 'refs_only', 'technical_only'].includes(declaration.action) && (!before || !after)) errors.push(diagnostic('ACTION_MISMATCH', `${qid}: ${declaration.action} requires before and after`));
    if (declaration.action === 'refs_only' && !equalExceptRefs(before, after)) errors.push(diagnostic('REFS_ONLY_SCOPE', `${qid}: refs_only changed fields outside refs`));
  }

  const delta = afterQuestions.size - beforeQuestions.size;
  if (delta !== manifest.expected_question_delta) errors.push(diagnostic('QUESTION_DELTA', `Question delta ${delta} does not equal expected ${manifest.expected_question_delta}`));
  for (const [qid, question] of afterQuestions) validateQuestion(qid, question, errors);

  for (const [qid, question] of afterQuestions) {
    if (!Array.isArray(question.refs)) continue;
    for (const ref of question.refs) if (!afterReferenceIds.has(ref)) errors.push(diagnostic('MISSING_REFERENCE', `${qid} consumes missing reference ${ref}`));
  }
  for (const ref of afterReferenceIds) {
    if (!afterConsumers.has(ref) || afterConsumers.get(ref).size === 0) errors.push(diagnostic('ORPHAN_REFERENCE', `Reference ${ref} has no consumers`));
  }

  if (manifest.refs_policy === 'unchanged' && beforeRefsText !== afterRefsText) errors.push(diagnostic('REFS_POLICY', 'data/refs.js changed despite refs_policy unchanged'));
  if (manifest.refs_policy === 'declared') {
    const declared = new Set(Object.keys(manifest.references || {}));
    const addedOrRemoved = new Set([...beforeReferenceIds, ...afterReferenceIds].filter((id) => beforeReferenceIds.has(id) !== afterReferenceIds.has(id)));
    if (![...addedOrRemoved].every((id) => declared.has(id))) errors.push(diagnostic('REFERENCE_SCOPE', 'Undeclared reference card addition or removal'));
  }

  const values = Object.values(afterVersions);
  if (!values.every((value) => value === manifest.expected_version) || beforeVersions.json === afterVersions.json) {
    errors.push(diagnostic('VERSION_MISMATCH', `Canonical versions must equal ${manifest.expected_version} and differ from base`));
  }
  return errors;
}
