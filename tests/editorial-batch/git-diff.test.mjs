import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { readAtRevision } from '../../scripts/editorial-batch/git-diff.mjs';

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
