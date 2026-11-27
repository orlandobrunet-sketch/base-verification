import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { changedPaths, readAtRevision } from '../../scripts/editorial-batch/git-diff.mjs';

const cliPath = fileURLToPath(new URL('../../scripts/editorial-batch-validator.mjs', import.meta.url));

const run = (command, args, cwd) => spawnSync(command, args, { cwd, encoding: 'utf8' });
const git = (args, cwd) => {
  const result = run('git', args, cwd);
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim();
};

test('reads large repository files without the default exec buffer limit', async () => {
  const repo = await mkdtemp(path.join(tmpdir(), 'nq-git-large-'));
  git(['init'], repo);
  git(['config', 'user.email', 'test@example.com'], repo);
  git(['config', 'user.name', 'Test'], repo);
  await writeFile(path.join(repo, 'large.txt'), `start\n${'x'.repeat(2 * 1024 * 1024)}\nend\n`);
  git(['add', 'large.txt'], repo);
  git(['commit', '-m', 'large file'], repo);

  const head = git(['rev-parse', 'HEAD'], repo);
  const content = readAtRevision(head, 'large.txt', repo);
  assert.match(content, /^start/);
  assert.match(content, /end\n$/);
});

async function createQuotedPathRepository(t) {
  const repo = await mkdtemp(path.join(tmpdir(), 'nq-git-utf8-'));
  t.after(async () => {
    const resolved = path.resolve(repo);
    assert.equal(path.dirname(resolved), path.resolve(tmpdir()));
    assert.ok(path.basename(resolved).startsWith('nq-git-utf8-'));
    await rm(resolved, { recursive: true, force: true });
  });
  git(['init'], repo);
  git(['config', 'user.email', 'test@example.com'], repo);
  git(['config', 'user.name', 'Test'], repo);
  git(['config', 'core.quotePath', 'true'], repo);
  await mkdir(path.join(repo, 'data'), { recursive: true });
  const question = { qid: '11111111', q: 'Technical prompt', opts: ['A', 'B', 'C', 'D'], ans: 0,
    exp: 'Technical explanation', cat: 'technical', diff: 'easy', refs: ['technical_ref'] };
  await writeFile(path.join(repo, 'data/topics.js'), `const topics = [\n  ${JSON.stringify(question)},\n];\n`);
  await writeFile(path.join(repo, 'data/refs.js'), 'const REFS = {\n  technical_ref:{}\n};\n');
  await writeFile(path.join(repo, 'version.json'), '{"version":"12.64"}\n');
  await writeFile(path.join(repo, 'sw.js'), "// NefroQuest Service Worker — v12.64\nconst CACHE = 'nefroquest-v12.64';\n");
  await writeFile(path.join(repo, 'index.html'), "release: 'nefroquest@12.64'\n");
  git(['add', '.'], repo);
  git(['commit', '-m', 'technical baseline'], repo);
  const base = git(['rev-parse', 'HEAD'], repo);

  const manifestPath = 'docs/editorial/review-batches/UTF8-PATHS.json';
  const files = ['docs/editorial/reviews/eletrólitos-A1.json', 'docs/editorial/reviews/litíase e cistos.json',
    'docs/editorial/reviews/notes with spaces.txt'];
  for (const file of [manifestPath, ...files]) await mkdir(path.dirname(path.join(repo, file)), { recursive: true });
  for (const file of files) await writeFile(path.join(repo, file), 'Technical review fixture\n');
  await writeFile(path.join(repo, manifestPath), JSON.stringify({
    batch: 'UTF8-PATHS', change_type: 'technical_only', expected_version: '12.64',
    allowed_files: [manifestPath, ...files],
    questions: { '11111111': { action: 'reviewed_unchanged', preserve_fsrs: true } },
    expected_question_delta: 0, refs_policy: 'unchanged', external_review: { greptile: 'required' },
  }));
  git(['add', '.'], repo);
  git(['commit', '-m', 'declared UTF-8 paths'], repo);
  return { repo, base, head: git(['rev-parse', 'HEAD'], repo), manifestPath, files };
}

test('real Git preserves UTF-8 and spaced paths with core.quotePath enabled', async (t) => {
  const { repo, base, head, manifestPath, files } = await createQuotedPathRepository(t);
  assert.equal(git(['config', 'core.quotePath'], repo), 'true');
  assert.ok(git(['diff', '--name-only', base, head, '--'], repo).includes('\\303\\263'));
  assert.deepEqual(changedPaths(base, head, repo), [manifestPath, ...files].sort());
  assert.deepEqual(changedPaths(head, head, repo), []);
});

test('the real CLI accepts declared UTF-8 and spaced paths without weakening manifest scope', async (t) => {
  const { repo, base, head } = await createQuotedPathRepository(t);
  const result = run(process.execPath, [cliPath, '--base', base, '--head', head, '--cwd', repo], repo);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /Editorial batch validation passed/);
});

test('the real CLI still rejects an undeclared UTF-8 and spaced path by its exact name', async (t) => {
  const { repo, base } = await createQuotedPathRepository(t);
  const undeclared = 'docs/editorial/reviews/eletrólitos não declarado.json';
  await writeFile(path.join(repo, undeclared), 'Undeclared technical fixture\n');
  git(['add', '.'], repo);
  git(['commit', '-m', 'undeclared UTF-8 path'], repo);
  const head = git(['rev-parse', 'HEAD'], repo);
  const result = run(process.execPath, [cliPath, '--base', base, '--head', head, '--cwd', repo], repo);
  assert.notEqual(result.status, 0);
  assert.match(result.stdout + result.stderr, /UNDECLARED_FILE/);
  assert.ok((result.stdout + result.stderr).includes(`Changed file is not allowed by manifest: ${undeclared}`));
  assert.doesNotMatch(result.stdout + result.stderr, /FILE_SCOPE/);
});
