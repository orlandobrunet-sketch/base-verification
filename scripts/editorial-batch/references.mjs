import { createHash } from 'node:crypto';
import { validarEixos } from './editorial-axes.mjs';

const CARD_DECLARATION = /^\s*["']?([A-Za-z0-9_]+)["']?\s*:\s*\{/gm;
const CARD_FIELDS = ['label', 'url', 'journal', 'ano', 'tipo', 'badge', 'badgeColor', 'impacto', 'icon', 'resumo', 'conclusao', 'curiosidade'];
const ROLES = ['author_review', 'independent_review'];
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const sha256 = text => createHash('sha256').update(text, 'utf8').digest('hex');
const canonical = value => object(value)
  ? '{' + Object.keys(value).sort().map(key => JSON.stringify(key) + ':' + canonical(value[key])).join(',') + '}'
  : JSON.stringify(value);
export const referenceDigest = card => 'sha256:' + sha256(canonical(card));

// Read the data grammar, never execute JavaScript supplied by a pull request.
// Existing cards may have different field order; only changed cards get the full schema check.
export function parseReferenceCards(source, pathLabel = 'data/refs.js') {
  if (typeof source !== 'string' || source.length > 2 * 1024 * 1024) throw new Error(`${pathLabel}: reference source too large`);
  let cursor = 0;
  const fail = message => { throw new Error(`${pathLabel}:${cursor}: ${message}`); };
  const skip = () => {
    while (cursor < source.length) {
      if (/\s/.test(source[cursor])) { cursor++; continue; }
      if (source.startsWith('//', cursor)) { const end = source.indexOf('\n', cursor + 2); cursor = end < 0 ? source.length : end + 1; continue; }
      if (source.startsWith('/*', cursor)) {
        const end = source.indexOf('*/', cursor + 2);
        if (end < 0) fail('unterminated comment');
        cursor = end + 2; continue;
      }
      break;
    }
  };
  const consume = token => { skip(); if (!source.startsWith(token, cursor)) return false; cursor += token.length; return true; };
  const expect = token => { if (!consume(token)) fail(`expected ${token}`); };
  const string = () => {
    skip(); const start = cursor;
    if (source[cursor++] !== '"') fail('JSON string required');
    while (cursor < source.length) {
      const char = source[cursor++];
      if (char === '\\') { cursor++; continue; }
      if (char === '"') {
        try { return JSON.parse(source.slice(start, cursor)); } catch { fail('invalid JSON string'); }
      }
    }
    fail('unterminated string');
  };
  const key = () => {
    skip(); if (source[cursor] === '"') return string();
    const match = /^[A-Za-z_][A-Za-z_0-9]*/.exec(source.slice(cursor));
    if (!match) fail('literal property name required');
    cursor += match[0].length; return match[0];
  };
  const primitive = () => {
    skip(); if (source[cursor] === '"') return string();
    const match = /^(?:-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?|true|false|null)/.exec(source.slice(cursor));
    if (!match) fail('JSON primitive required');
    cursor += match[0].length;
    const value = JSON.parse(match[0]);
    if (typeof value === 'number' && !Number.isFinite(value)) fail('finite number required');
    return value;
  };
  const spans = new Map();
  const readObject = registry => {
    expect('{'); const entries = new Map();
    if (consume('}')) return entries;
    while (cursor < source.length) {
      const name = key();
      if (entries.has(name)) fail(`duplicate ${registry ? 'reference id' : 'card field'} ${name}`);
      expect(':'); skip(); const start = cursor;
      const value = registry ? Object.fromEntries(readObject(false)) : primitive();
      if (registry) {
        if (!/^[A-Za-z0-9_]+$/.test(name)) fail('invalid reference id');
        spans.set(name, [start, cursor]);
      }
      entries.set(name, value);
      if (consume('}')) return entries;
      expect(','); if (consume('}')) return entries;
    }
    fail('unterminated object');
  };
  skip();
  const wrapper = /^const\s+refsDB\s*=/.exec(source.slice(cursor));
  if (!wrapper) fail('expected const refsDB literal registry');
  cursor += wrapper[0].length;
  const cards = readObject(true);
  if (!cards.size) fail('no reference cards found');
  expect(';'); skip();
  if (cursor !== source.length) fail('unexpected code outside reference registry');
  return { cards, spans };
}

export function validateReferenceOnlyManifest(value, manifestPath) {
  const errors = [], prefix = `${manifestPath}: reference_only`;
  if (value.change_type !== 'medical_editorial' || value.refs_policy !== 'declared' || value.expected_question_delta !== 0) {
    errors.push(`${prefix}: requires medical_editorial, declared refs and zero question delta`);
  }
  if (!object(value.questions) || Object.keys(value.questions).length) errors.push(`${prefix}: questions must be empty; no question approval is implied`);
  if (!object(value.references) || !Object.keys(value.references).length) errors.push(`${prefix}: non-empty references required`);
  for (const [id, declaration] of Object.entries(value.references || {})) {
    if (!/^[A-Za-z0-9_]+$/.test(id) || !object(declaration) || declaration.action !== 'update') {
      errors.push(`${prefix}: ${id}: only an existing card update is supported`); continue;
    }
    for (const field of ['before_sha256', 'after_sha256']) if (typeof declaration[field] !== 'string' || !/^sha256:[a-f0-9]{64}$/.test(declaration[field])) errors.push(`${prefix}: ${id}: invalid ${field}`);
    if (declaration.before_sha256 === declaration.after_sha256) errors.push(`${prefix}: ${id}: card hashes must differ`);
    if (!Array.isArray(declaration.consumers) || declaration.consumers.some(qid => typeof qid !== 'string' || !/^[a-f0-9]{8}$/.test(qid)) ||
        new Set(declaration.consumers).size !== declaration.consumers.length) errors.push(`${prefix}: ${id}: unique consumer qids required`);
    for (const role of ROLES) {
      const review = declaration[role];
      const axes = validarEixos(`${id}/${role}`, review, manifestPath);
      errors.push(...axes.errors);
      if (axes.publicacao !== 'LIBERADA') errors.push(`${prefix}: ${id}/${role}: own card approval must be LIBERADA`);
      if (!object(review)) { errors.push(`${prefix}: ${id}/${role}: own review required`); continue; }
      const path = review.report_path;
      if (typeof path !== 'string' || !/^docs\/editorial\/reviews\/[A-Za-z0-9_./-]+\.json$/.test(path) ||
          path.split('/').some(part => part === '..' || part === '.')) errors.push(`${prefix}: ${id}/${role}: invalid report_path`);
      if (typeof review.report_sha256 !== 'string' || !/^[a-f0-9]{64}$/.test(review.report_sha256)) errors.push(`${prefix}: ${id}/${role}: invalid report_sha256`);
      for (const field of ['version_pointer', 'gate_pointer']) if (typeof review[field] !== 'string' || !review[field].startsWith('/')) errors.push(`${prefix}: ${id}/${role}: invalid ${field}`);
    }
    if (declaration.author_review?.report_path === declaration.independent_review?.report_path) errors.push(`${prefix}: ${id}: distinct own author and independent reports required`);
  }
  return errors;
}

export function referenceReviewPaths(manifest) {
  return [...new Set(Object.values(manifest.references || {}).flatMap(card => ROLES.map(role => card[role].report_path)))];
}

function pointer(document, path) {
  return path.split('/').slice(1).reduce((value, part) => {
    if (/~(?![01])/.test(part)) return undefined;
    const key = part.replaceAll('~1', '/').replaceAll('~0', '~');
    return object(value) && Object.hasOwn(value, key) ? value[key] : undefined;
  }, document);
}

function fullCard(card) {
  return object(card) && Object.keys(card).length === CARD_FIELDS.length && CARD_FIELDS.every(field =>
    Object.hasOwn(card, field) && (field === 'ano' ? Number.isInteger(card[field]) : typeof card[field] === 'string'));
}

function masked(source, spans, ids) {
  const ranges = ids.map(id => spans.get(id)).sort((left, right) => right[0] - left[0]);
  for (const [start, end] of ranges) source = source.slice(0, start) + '{DECLARED_CARD}' + source.slice(end);
  return source;
}

export function validateReferenceOnlyBatch(input) {
  const errors = [], error = (code, message) => errors.push({ code, message });
  const { manifest, beforeTopicsText, afterTopicsText, beforeRefsText, afterRefsText, beforeConsumers, afterConsumers,
    referenceReviewReports = new Map() } = input;
  if (typeof beforeTopicsText !== 'string' || beforeTopicsText !== afterTopicsText || input.changedPaths.includes('data/topics.js')) error('REFERENCE_ONLY_TOPICS', 'Reference-only updates must preserve topics.js bytes');
  if (!input.changedPaths.includes('data/refs.js')) error('REFERENCE_ONLY_SCOPE', 'Reference-only update requires a changed refs.js');
  const before = parseReferenceCards(beforeRefsText), after = parseReferenceCards(afterRefsText);
  const ids = Object.keys(manifest.references), union = new Set([...before.cards.keys(), ...after.cards.keys()]);
  const changed = [...union].filter(id => !before.cards.has(id) || !after.cards.has(id) || referenceDigest(before.cards.get(id)) !== referenceDigest(after.cards.get(id)));
  if ([...union].some(id => !before.cards.has(id) || !after.cards.has(id))) error('REFERENCE_ONLY_IDS', 'Reference-only update cannot add or remove reference IDs');
  if (changed.length !== ids.length || changed.some(id => !ids.includes(id))) error('REFERENCE_CARD_SCOPE', 'Changed reference cards must equal the declared updates');
  if (ids.every(id => before.spans.has(id) && after.spans.has(id)) && masked(beforeRefsText, before.spans, ids) !== masked(afterRefsText, after.spans, ids)) {
    error('REFERENCE_CARD_SCOPE', 'Bytes outside declared card literals changed');
  }
  for (const [id, declaration] of Object.entries(manifest.references)) {
    const old = before.cards.get(id), card = after.cards.get(id);
    if (!old || !card) continue;
    if (!fullCard(card)) error('REFERENCE_CARD_SCHEMA', `${id}: changed card must contain exactly the 12 typed fields`);
    if (referenceDigest(old) !== declaration.before_sha256 || referenceDigest(card) !== declaration.after_sha256) error('REFERENCE_CARD_HASH', `${id}: exact card hash mismatch`);
    const expected = [...declaration.consumers].sort(), previous = [...(beforeConsumers.get(id) || [])].sort(), current = [...(afterConsumers.get(id) || [])].sort();
    if (JSON.stringify(expected) !== JSON.stringify(previous) || JSON.stringify(expected) !== JSON.stringify(current)) error('REFERENCE_CONSUMERS', `${id}: consumer sets must be complete and unchanged`);
    const reviewers = [];
    for (const role of ROLES) {
      const review = declaration[role], raw = referenceReviewReports.get(review.report_path);
      if (typeof raw !== 'string' || raw.length > 1024 * 1024 || sha256(raw) !== review.report_sha256) { error('REFERENCE_REVIEW_FILE', `${id}/${role}: exact report file unavailable or hash mismatch`); continue; }
      let report;
      try { report = JSON.parse(raw); } catch { error('REFERENCE_REVIEW_FILE', `${id}/${role}: invalid report JSON`); continue; }
      const version = pointer(report, review.version_pointer), gate = pointer(report, review.gate_pointer);
      const declared = Object.fromEntries(['evidencia', 'pendencia', 'veredito', 'publicacao'].map(field => [field, review[field]]));
      const actual = { evidencia: gate?.evidence, pendencia: gate?.pending, veredito: gate?.verdict ?? gate?.v2, publicacao: gate?.publicationAuthorization };
      const axes = validarEixos(`${id}/${role}`, actual, review.report_path);
      if (axes.errors.length || axes.publicacao !== 'LIBERADA' || JSON.stringify(actual) !== JSON.stringify(declared)) error('REFERENCE_REVIEW_GATE', `${id}/${role}: own report gate does not match the approved declaration`);
      const sorted = version?.sortedCompactPythonSHA256 ?? version?.sortedSHA256;
      if ((report.referenceId ?? version?.referenceId) !== id || 'sha256:' + sorted !== declaration.after_sha256 ||
          version?.orderedCompactPythonSHA256 !== sha256(JSON.stringify(card))) error('REFERENCE_REVIEW_VERSION', `${id}/${role}: reviewed full card version does not match`);
      const coverage = report.wholeCardFieldCoverage ?? report.fieldCoverage;
      if (!Array.isArray(coverage) || coverage.length !== CARD_FIELDS.length || new Set(coverage.map(row => row.field)).size !== CARD_FIELDS.length ||
          CARD_FIELDS.some(field => !coverage.some(row => row.field === field))) error('REFERENCE_REVIEW_SCOPE', `${id}/${role}: full 12-field card coverage required`);
      if (role === 'independent_review' && (!fullCard(version?.fullLiteral) || JSON.stringify(version.fullLiteral) !== JSON.stringify(card))) error('REFERENCE_REVIEW_VERSION', `${id}/${role}: independent full literal differs`);
      if (typeof report.reviewer !== 'string' || !report.reviewer.trim()) error('REFERENCE_REVIEW_SCOPE', `${id}/${role}: reviewer identity required`);
      else reviewers.push(report.reviewer.trim());
    }
    if (reviewers.length === 2 && reviewers[0] === reviewers[1]) error('REFERENCE_REVIEW_SCOPE', `${id}: distinct author and independent reviewers required`);
  }
  return errors;
}

export function parseReferenceIds(source, pathLabel = 'data/refs.js') {
  const ids = new Set();
  for (const match of source.matchAll(CARD_DECLARATION)) {
    const id = match[1];
    if (ids.has(id)) throw new Error(`${pathLabel}: duplicate reference id ${id}`);
    ids.add(id);
  }
  if (ids.size === 0) throw new Error(`${pathLabel}: no reference cards found`);
  return ids;
}

export function referenceConsumers(questionMap) {
  const consumers = new Map();
  for (const [qid, question] of questionMap) {
    if (!Array.isArray(question.refs)) continue;
    for (const referenceId of question.refs) {
      if (!consumers.has(referenceId)) consumers.set(referenceId, new Set());
      consumers.get(referenceId).add(qid);
    }
  }
  return consumers;
}
