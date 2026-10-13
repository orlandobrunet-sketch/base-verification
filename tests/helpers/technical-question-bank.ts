import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { createContext, runInContext } from 'node:vm';
import type { Page } from '@playwright/test';

type Author = {
  qid: string; q: string; opts: string[]; ans: number; exp?: string;
  diff?: string; cat?: string; refs?: string[]; [key: string]: unknown;
};

// One actual module evaluation per worker; source pins remain frozen throughout a run.
const moduleSources = ['answer-presentation.js', 'question-revisions.js'].map(file => ({
  file, code: readFileSync(resolve(__dirname, '../../js', file), 'utf8'),
}));
const moduleSourceHash = createHash('sha256').update(JSON.stringify(moduleSources)).digest('hex');
const runtime = createContext({ TextEncoder });
for (const {file,code} of moduleSources) runInContext(code,runtime,{filename:file});
const revisions = runtime.NQQuestionRevisions;
const preparedFixtures = new Map<string,string>();

// This registry describes authored technical fixtures, never a saved payload.
// The browser still loads the actual identity and presentation modules.
export function technicalQuestionBundle(authors: Author[], references: Record<string, unknown> = {}, history: unknown[] = []) {
  // The real digest rejects non-JSON/getter inputs, even on a cache lookup.
  const key = moduleSourceHash + ':' + revisions.digest({authors,references,history});
  const cached = preparedFixtures.get(key);
  if (cached !== undefined) return JSON.parse(cached);
  const sources = { main: [] as any[], exam: [] as any[], study: [] as any[], offline: [] as any[] };
  const current: Record<string, unknown> = {};
  authors.forEach((author, index) => {
    const plain = { id: author.qid, q: author.q, o: [...author.opts], a: author.ans, e: author.exp || '' };
    const main = { ...plain,
      d: author.diff === 'hard' ? Math.min(12, 8 + Math.floor(index / 30)) : Math.min(12, 4 + Math.floor(index / 25)),
      _d: author.diff || 'medium', r: [...(author.refs || [])], c: author.cat || 'geral' };
    const profiles = { main, exam: { ...main }, study: { ...plain, refs: [...(author.refs || [])] }, offline: plain };
    const authorRevision = revisions.digest(author);
    const referenceRevisions = Object.fromEntries((author.refs || []).map(id =>
      [id, references[id] === undefined || references[id] === null ? null : revisions.digest(references[id])]));
    current[author.qid] = { authorRevision, referenceRevisions,
      recordRevision: revisions.digest({ authorRevision, referenceRevisions }),
      sourceRevisions: Object.fromEntries(Object.entries(profiles).map(([profile, source]) => [profile, revisions.digest(source)])) };
    for (const profile of Object.keys(sources) as (keyof typeof sources)[]) sources[profile].push(profiles[profile]);
  });
  const manifest = { version: 1, release: 'technical-fixture', current };
  revisions.createCatalog({ manifest, history, authors, sources, references });
  // Only an immutable serialization is retained. Every caller owns fresh copies.
  const encoded = JSON.stringify({ authors, references, sources, manifest, history });
  preparedFixtures.set(key,encoded);
  return JSON.parse(encoded);
}

export async function routeTechnicalQuestionBank(page: Page, authors: Author[], references: Record<string, unknown> = {}, history: unknown[] = []) {
  const bundle = technicalQuestionBundle(authors, references, history);
  const respond = (body: string) => ({ status: 200, contentType: 'application/javascript', body });
  await page.route('**/data/topics.js*', route => route.fulfill(respond(`const topics = ${JSON.stringify(authors)};`)));
  await page.route('**/data/question-revision-manifest.js*', route => route.fulfill(respond(
    `window.NQQuestionRevisionManifest = ${JSON.stringify(bundle.manifest)};`)));
  await page.route('**/data/question-revision-history.js*', route => route.fulfill(respond(
    `window.NQQuestionRevisionHistory = ${JSON.stringify(bundle.history)};`)));
  return bundle;
}
