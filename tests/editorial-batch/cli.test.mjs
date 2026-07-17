import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const cliPath = fileURLToPath(new URL('../../scripts/editorial-batch-validator.mjs', import.meta.url));
const run = (command, args, cwd) => spawnSync(command, args, { cwd, encoding: 'utf8' });
const git = (args, cwd) => {
  const result = run('git', args, cwd);
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim();
};
const question = (qid, text, refs) => `  ${JSON.stringify({ qid, q: text, opts: ['A', 'B', 'C', 'D'], ans: 0, exp: 'E', cat: 'x', diff: 'medium', refs })},`;

async function writeVersionFiles(repo, version) {
  await writeFile(path.join(repo, 'version.json'), `{"version":"${version}"}\n`);
  await writeFile(path.join(repo, 'sw.js'), `// NefroQuest Service Worker — v${version}\nconst CACHE = 'nefroquest-v${version}';\n`);
  await writeFile(path.join(repo, 'index.html'), `release: 'nefroquest@${version}'\n`);
}

async function createRepository() {
  const repo = await mkdtemp(path.join(tmpdir(), 'nq-editorial-gate-'));
  await mkdir(path.join(repo, 'data'), { recursive: true });
  await mkdir(path.join(repo, 'docs', 'editorial', 'review-batches'), { recursive: true });
  git(['init'], repo);
  git(['config', 'user.email', 'test@example.com'], repo);
  git(['config', 'user.name', 'Test'], repo);
  await writeFile(path.join(repo, 'data', 'topics.js'), `const topics = [\n${question('11111111', 'old', ['ref_a'])}\n${question('22222222', 'retire', ['ref_b'])}\n];\n`);
  await writeFile(path.join(repo, 'data', 'refs.js'), "const REFS = {\n  ref_a:{},\n  ref_b:{}\n};\n");
  await writeVersionFiles(repo, '12.64');
  git(['add', '.'], repo); git(['commit', '-m', 'base'], repo);
  const base = git(['rev-parse', 'HEAD'], repo);

  await writeFile(path.join(repo, 'data', 'topics.js'), `const topics = [\n${question('11111111', 'new', ['ref_a', 'ref_b'])}\n];\n`);
  await writeVersionFiles(repo, '12.65');
  const manifestPath = 'docs/editorial/review-batches/FARM-4A.json';
  await writeFile(path.join(repo, ...manifestPath.split('/')), JSON.stringify({
    batch: 'FARM-4A', change_type: 'medical_editorial', expected_version: '12.65',
    allowed_files: ['data/topics.js', 'docs/editorial/review-batches/FARM-4A.json', 'index.html', 'sw.js', 'version.json'],
    questions: { '11111111': { action: 'rebuild', preserve_fsrs: true }, '22222222': { action: 'retire', preserve_fsrs: false } },
    expected_question_delta: -1, refs_policy: 'unchanged',
    external_review: { greptile: 'required', fallback_reviewer: null },
  }, null, 2));
  git(['add', '.'], repo); git(['commit', '-m', 'valid head'], repo);
  return { repo, base, head: git(['rev-parse', 'HEAD'], repo) };
}

test('CLI accepts a valid declared editorial batch', async () => {
  const { repo, base, head } = await createRepository();
  const result = run(process.execPath, [cliPath, '--base', base, '--head', head, '--cwd', repo], repo);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /Editorial batch validation passed/);
});

test('CLI accepts a manifest-only reviewed_unchanged batch', async () => {
  const { repo, base } = await createRepository();
  git(['checkout', base], repo);
  const manifestPath = 'docs/editorial/review-batches/FARM-4B.json';
  await mkdir(path.join(repo, 'docs', 'editorial', 'review-batches'), { recursive: true });
  await writeFile(path.join(repo, ...manifestPath.split('/')), JSON.stringify({
    batch: 'FARM-4B', change_type: 'medical_editorial', expected_version: '12.64',
    allowed_files: [manifestPath],
    questions: {
      '11111111': { action: 'reviewed_unchanged', preserve_fsrs: true },
      '22222222': { action: 'reviewed_unchanged', preserve_fsrs: true },
    },
    expected_question_delta: 0, refs_policy: 'unchanged',
    external_review: { greptile: 'unavailable', fallback_reviewer: 'Codex — revisar-nefroquest' },
  }, null, 2));
  git(['add', manifestPath], repo); git(['commit', '-m', 'manifest only review'], repo);
  const head = git(['rev-parse', 'HEAD'], repo);
  const result = run(process.execPath, [cliPath, '--base', base, '--head', head, '--cwd', repo], repo);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /Editorial batch validation passed/);
});

test('CLI rejects an undeclared qid', async () => {
  const { repo, base } = await createRepository();
  const topicsPath = path.join(repo, 'data', 'topics.js');
  await writeFile(topicsPath, `const topics = [\n${question('11111111', 'new', ['ref_a', 'ref_b'])}\n${question('33333333', 'extra', ['ref_a'])}\n];\n`);
  git(['add', 'data/topics.js'], repo); git(['commit', '-m', 'scope creep'], repo);
  const head = git(['rev-parse', 'HEAD'], repo);
  const result = run(process.execPath, [cliPath, '--base', base, '--head', head, '--cwd', repo], repo);
  assert.notEqual(result.status, 0);
  assert.match(result.stdout + result.stderr, /QID_SCOPE/);
});

test('CI and PR template expose the editorial gate', async () => {
  const workflow = await readFile(new URL('../../.github/workflows/ci.yml', import.meta.url), 'utf8');
  const template = await readFile(new URL('../../.github/PULL_REQUEST_TEMPLATE.md', import.meta.url), 'utf8');
  assert.match(workflow, /editorial-batch-validator\.mjs/);
  assert.match(workflow, /pull_request\.base\.sha/);
  assert.match(workflow, /pull_request\.head\.sha/);
  assert.match(template, /Autorização explícita/);
  assert.match(template, /Greptile indisponível/);
  assert.match(template, /zero threads não comprova/i);
});
