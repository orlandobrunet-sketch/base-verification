import { createRequire } from 'node:module';
import { parseReferenceCards, referenceDigest, fullCard, validateFullCardReviews } from './references.mjs';

const require = createRequire(import.meta.url);
const revisions = require('../../js/question-revisions.js');
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const hash = value => typeof value === 'string' && /^sha256:[a-f0-9]{64}$/.test(value);
const profiles = ['main', 'exam', 'study', 'offline'];

// Parse data, never execute the JavaScript wrappers supplied by a PR.
export function parsePublishedSnapshot(source, kind) {
  const name = kind === 'manifest' ? 'manifest' : kind === 'history' ? 'history' : null;
  if (!name || typeof source !== 'string' || source.length > 32 * 1024 * 1024) throw Error('Published snapshot unavailable or too large');
  const globalName = kind === 'manifest' ? 'NQQuestionRevisionManifest' : 'NQQuestionRevisionHistory';
  const prefix = new RegExp("^(?:/\\*[\\s\\S]*?\\*/\\s*)?\\(function\\(root\\)\\{\\s*'use strict';\\s*const " + name + '=');
  const head = prefix.exec(source);
  const suffix = ";\nif(typeof module==='object'&&module.exports)module.exports=" + name + ';\nroot.' + globalName + '=' + name + ";\n})(typeof globalThis!=='undefined'?globalThis:this);";
  const text = source.trimEnd();
  if (!head || !text.endsWith(suffix)) throw Error('Invalid published snapshot wrapper');
  const value = JSON.parse(text.slice(head[0].length, -suffix.length));
  if (kind === 'history' ? !Array.isArray(value) : !object(value)) throw Error('Invalid published snapshot data');
  return value;
}

export function historicalReferenceReviewPaths(manifest) {
  return [...new Set(Object.values(manifest.historical_reference_retention?.references || {}).flatMap(declaration =>
    ['author_review', 'independent_review'].map(role => declaration?.[role]?.report_path).filter(path => typeof path === 'string')))];
}

export function validateHistoricalRetentionManifest(manifest, manifestPath) {
  if (!Object.hasOwn(manifest, 'historical_reference_retention')) return [];
  const errors = [], value = manifest.historical_reference_retention;
  if (!object(value) || value.version !== 1 || !object(value.references) || !Object.keys(value.references).length) {
    return [`${manifestPath}: historical_reference_retention requires version 1 and non-empty references`];
  }
  for (const [id, declaration] of Object.entries(value.references)) {
    if (!/^[A-Za-z0-9_]+$/.test(id) || !object(declaration) || !/^[a-f0-9]{8}$/.test(declaration.qid || '') ||
        typeof declaration.release !== 'string' || !/^\d+\.\d+$/.test(declaration.release) ||
        !['record_sha256', 'reference_sha256', 'current_sha256'].every(field => hash(declaration[field]))) {
      errors.push(`${manifestPath}: ${id}: invalid authenticated historical retention identity`);
    }
  }
  return errors;
}

function authenticatedIdentity(entry) {
  if (!object(entry) || !object(entry.author) || entry.author.qid !== entry.qid ||
      !Array.isArray(entry.author.refs) || !object(entry.references) || !object(entry.referenceRevisions) ||
      !object(entry.sources) || !object(entry.sourceRevisions) || profiles.some(profile => !Object.hasOwn(entry.sources, profile)) ||
      Object.keys(entry.sources).length !== profiles.length || Object.keys(entry.sourceRevisions).length !== profiles.length) throw Error('Incomplete historical record or source profiles');
  const authorRevision = revisions.digest(entry.author);
  const referenceRevisions = Object.fromEntries(entry.author.refs.map(id => [id, entry.references[id] ? revisions.digest(entry.references[id]) : null]));
  const recordRevision = revisions.digest({ authorRevision, referenceRevisions });
  if (authorRevision !== entry.authorRevision || recordRevision !== entry.recordRevision ||
      revisions.digest(referenceRevisions) !== revisions.digest(entry.referenceRevisions) ||
      profiles.some(profile => revisions.digest(entry.sources[profile]) !== entry.sourceRevisions[profile])) throw Error('Historical author, reference, record or source hash mismatch');
  return { authorRevision, referenceRevisions, recordRevision };
}

export function validateHistoricalReferenceRetention(input) {
  const errors = [], consumers = new Map(), error = message => errors.push({ code: 'HISTORICAL_REFERENCE', message });
  if (!Object.hasOwn(input.manifest, 'historical_reference_retention')) return { errors, consumers };
  const contract = validateHistoricalRetentionManifest(input.manifest, input.manifestPath);
  if (contract.length) return { errors: contract.map(message => ({ code: 'HISTORICAL_REFERENCE', message })), consumers };
  let baseManifest, baseHistory, afterHistory, beforeCards, afterCards;
  try {
    baseManifest = parsePublishedSnapshot(input.baseRevisionManifestText, 'manifest');
    baseHistory = parsePublishedSnapshot(input.baseRevisionHistoryText, 'history');
    afterHistory = parsePublishedSnapshot(input.afterRevisionHistoryText, 'history');
    if (baseManifest.release !== input.beforeVersions?.json) throw Error('Base release differs from the trusted base version');
    revisions.createVerifier({ manifest: baseManifest, history: baseHistory });
    beforeCards = parseReferenceCards(input.beforeRefsText).cards;
    afterCards = parseReferenceCards(input.afterRefsText).cards;
  } catch (cause) { error('Trusted base/head snapshots unavailable or invalid: ' + cause.message); return { errors, consumers }; }

  for (const [id, declaration] of Object.entries(input.manifest.historical_reference_retention.references)) {
    const countBefore = errors.length;
    try {
      const card = afterCards.get(id);
      if (!beforeCards.has(id) || !card || !input.beforeReferenceIds.has(id) || !input.afterReferenceIds.has(id)) throw Error('Reference must pre-exist in the trusted base and remain present');
      if (!fullCard(card) || referenceDigest(card) !== declaration.current_sha256) throw Error('Current 12-field card hash mismatch');
      if (input.afterConsumers.get(id)?.size) throw Error('Historical retention is only for a card without current question consumers');
      const matches = afterHistory.filter(entry => entry.qid === declaration.qid && entry.release === declaration.release && entry.recordRevision === declaration.record_sha256);
      if (matches.length !== 1) throw Error('One exact archived consumer is required');
      const archived = matches[0], identity = authenticatedIdentity(archived);
      if (!archived.author.refs.includes(id) || !fullCard(archived.references[id]) || identity.referenceRevisions[id] !== declaration.reference_sha256) throw Error('Archived author does not consume the declared exact card');

      const published = baseManifest.current?.[archived.qid];
      if (published?.recordRevision === identity.recordRevision && baseManifest.release === archived.release) {
        const author = input.beforeQuestions.get(archived.qid);
        if (!author || revisions.digest(author) !== identity.authorRevision || published.authorRevision !== identity.authorRevision ||
            revisions.digest(published.referenceRevisions) !== revisions.digest(identity.referenceRevisions) ||
            profiles.some(profile => published.sourceRevisions?.[profile] !== archived.sourceRevisions[profile]) ||
            author.refs.some(ref => !beforeCards.has(ref) || referenceDigest(beforeCards.get(ref)) !== identity.referenceRevisions[ref])) throw Error('Archived record differs from the published base author, references or profiles');
      } else {
        const previous = baseHistory.find(entry => entry.qid === archived.qid && entry.release === archived.release && entry.recordRevision === identity.recordRevision);
        if (!previous || revisions.digest(previous) !== revisions.digest(archived)) throw Error('Archived consumer is not a literal published base revision');
        authenticatedIdentity(previous);
      }
      // Native source restoration catches malformed option/answer snapshots in
      // addition to the four base-published source hash checks above.
      revisions.createVerifier({ manifest: baseManifest, history: [...baseHistory, archived] });
      if (declaration.current_sha256 !== declaration.reference_sha256 || declaration.current_sha256 !== referenceDigest(beforeCards.get(id))) {
        errors.push(...validateFullCardReviews(id, card, { ...declaration, after_sha256: declaration.current_sha256 }, input.referenceReviewReports));
      }
      if (errors.length === countBefore) consumers.set(id, new Set(['history:' + archived.qid + ':' + identity.recordRevision]));
    } catch (cause) { error(id + ': ' + cause.message); }
  }
  // A malformed proof for any declared retention grants no exemptions.
  if (errors.length) consumers.clear();
  return { errors, consumers };
}
