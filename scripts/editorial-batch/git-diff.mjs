import { execFileSync } from 'node:child_process';

const GIT_MAX_BUFFER = 20 * 1024 * 1024;

export function runGit(args, cwd) {
  try {
    return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: GIT_MAX_BUFFER }).trimEnd();
  } catch (error) {
    const detail = error.stderr?.toString().trim() || error.message;
    throw new Error(`git ${args.join(' ')} failed: ${detail}`);
  }
}

export function changedPaths(base, head, cwd) {
  const output = runGit(['diff', '--name-only', base, head, '--'], cwd);
  return output ? output.split(/\r?\n/).map((path) => path.replaceAll('\\', '/')).sort() : [];
}

export function readAtRevision(revision, filePath, cwd, { optional = false } = {}) {
  try {
    return execFileSync('git', ['show', `${revision}:${filePath}`], { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: GIT_MAX_BUFFER });
  } catch (error) {
    if (optional) {
      try {
        runGit(['cat-file', '-e', `${revision}:${filePath}`], cwd);
      } catch {
        return null;
      }
    }
    const detail = error.stderr?.toString().trim() || error.message;
    throw new Error(`Cannot read ${filePath} at ${revision}: ${detail}`);
  }
}
