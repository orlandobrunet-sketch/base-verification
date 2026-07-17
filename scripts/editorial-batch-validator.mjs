#!/usr/bin/env node
import { resolve } from 'node:path';
import { changedPaths, readAtRevision } from './editorial-batch/git-diff.mjs';
import { findChangedManifest, validateManifest } from './editorial-batch/manifest.mjs';
import { parseQuestions } from './editorial-batch/questions.mjs';
import { parseReferenceIds, referenceConsumers } from './editorial-batch/references.mjs';
import { extractVersions } from './editorial-batch/versions.mjs';
import { validateBatch } from './editorial-batch/rules.mjs';

function parseArgs(argv) {
  const options = { cwd: process.cwd() };
  for (let index = 0; index < argv.length; index += 2) {
    const flag = argv[index];
    const value = argv[index + 1];
    if (!value || !['--base', '--head', '--cwd'].includes(flag)) throw new Error('Usage: editorial-batch-validator --base <sha> --head <sha> [--cwd <path>]');
    options[flag.slice(2)] = value;
  }
  if (!options.base || !options.head) throw new Error('Both --base and --head are required');
  options.cwd = resolve(options.cwd);
  return options;
}

function loadVersions(revision, cwd) {
  return extractVersions({
    versionJson: readAtRevision(revision, 'version.json', cwd),
    serviceWorker: readAtRevision(revision, 'sw.js', cwd),
    indexHtml: readAtRevision(revision, 'index.html', cwd),
  });
}

function main() {
  const { base, head, cwd } = parseArgs(process.argv.slice(2));
  const paths = changedPaths(base, head, cwd);
  const hasMedicalDataChanges = paths.includes('data/topics.js') || paths.includes('data/refs.js');
  const hasEditorialManifest = paths.some((path) => /^docs\/editorial\/review-batches\/[^/]+\.json$/.test(path));
  if (!hasMedicalDataChanges && !hasEditorialManifest) {
    console.log('Editorial batch gate not activated: medical data files unchanged.');
    return;
  }

  const manifestPath = findChangedManifest(paths);
  const manifestSource = readAtRevision(head, manifestPath, cwd);
  let manifest;
  try { manifest = JSON.parse(manifestSource); } catch (error) { throw new Error(`${manifestPath}: invalid JSON: ${error.message}`); }
  const contract = validateManifest(manifest, manifestPath);
  if (contract.errors.length) {
    for (const message of contract.errors) console.error(`ERROR [MANIFEST] ${message}`);
    process.exitCode = 1;
    return;
  }

  const beforeTopics = readAtRevision(base, 'data/topics.js', cwd);
  const afterTopics = readAtRevision(head, 'data/topics.js', cwd);
  const beforeRefsText = readAtRevision(base, 'data/refs.js', cwd);
  const afterRefsText = readAtRevision(head, 'data/refs.js', cwd);
  const beforeQuestions = parseQuestions(beforeTopics, `${base}:data/topics.js`);
  const afterQuestions = parseQuestions(afterTopics, `${head}:data/topics.js`);
  const beforeReferenceIds = parseReferenceIds(beforeRefsText, `${base}:data/refs.js`);
  const afterReferenceIds = parseReferenceIds(afterRefsText, `${head}:data/refs.js`);
  const errors = validateBatch({
    manifest, manifestPath, changedPaths: paths,
    beforeQuestions, afterQuestions, beforeReferenceIds, afterReferenceIds,
    beforeConsumers: referenceConsumers(beforeQuestions),
    afterConsumers: referenceConsumers(afterQuestions),
    beforeRefsText, afterRefsText,
    beforeVersions: loadVersions(base, cwd), afterVersions: loadVersions(head, cwd),
  });
  if (errors.length) {
    for (const error of errors) console.error(`ERROR [${error.code}] ${error.message}`);
    process.exitCode = 1;
    return;
  }
  console.log(`Editorial batch validation passed: ${manifest.batch}; qids=${Object.keys(manifest.questions).sort().join(',')}; delta=${manifest.expected_question_delta}; version=${manifest.expected_version}`);
}

try { main(); } catch (error) {
  console.error(`FATAL [EDITORIAL_BATCH] ${error.message}`);
  process.exitCode = 1;
}
