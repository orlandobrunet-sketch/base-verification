import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve, dirname, join, sep} from 'node:path';
import {execFileSync} from 'node:child_process';

test('a data-only release updates every real consumer and its loader without rebusting unchanged data', () => {
  const directory = mkdtempSync(join(tmpdir(), 'nq-data-release-'));
  const write = (file, body) => {mkdirSync(dirname(join(directory, file)), {recursive: true}); writeFileSync(join(directory, file), body);};
  const read = file => readFileSync(join(directory, file), 'utf8');
  const run = (command, args) => execFileSync(command, args, {cwd: directory, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe']});
  try {
    write('scripts/bump-release.mjs', readFileSync(new URL('../../scripts/bump-release.mjs', import.meta.url), 'utf8'));
    write('tools/build-question-revision-manifest.cjs', "require('fs').writeFileSync('data/question-revision-manifest.js','const manifest='+JSON.stringify({release:process.argv[2]})+';');");
    write('version.json', '{"version":"1.0"}\n');
    write('index.html', '<script>const release="nefroquest@1.0";</script>');
    write('jogar/index.html', '<script src="js/game.js?v=1.0"></script><script src="js/utils.js?v=1.0"></script><script src="data/question-revision-manifest.js?release=1.0"></script>');
    write('offline.html', '<script src="/data/topics.js?release=1.0"></script>');
    write('js/game.js', 'const questionURL="data/topics.js?release=1.0";');
    write('js/utils.js', 'const refsURL="data/refs.js?release=1.0", articleURL="data/articles.js?release=1.0";');
    write('data/topics.js', 'const topics=["old technical token"];');
    write('data/refs.js', 'const refs={};'); write('data/articles.js', 'const articles=[];');
    write('data/question-revision-manifest.js', 'const manifest={"release":"1.0"};');
    write('sw.js', "// v1.0\nconst CACHE='nefroquest-v1.0';\nconst STATIC_ASSETS = [\n'/js/game.js','/js/utils.js','/data/topics.js','/data/refs.js','/data/articles.js','/data/question-revision-manifest.js'\n];\n// bump-release:asset-versions:início\nconst ASSET_VERSIONS = {};\n// bump-release:asset-versions:fim\n");
    run('git', ['init', '--quiet']);run('git', ['config', 'user.email', 'technical-fixture@example.invalid']);run('git', ['config', 'user.name', 'Technical fixture']);run('git', ['add', '.']);run('git', ['commit', '--quiet', '-m', 'Fixture baseline']);
    write('data/topics.js', 'const topics=["new technical token"];');
    write('data/question-revision-manifest.js', 'const manifest={"release":"1.1"};');
    run(process.execPath, ['scripts/bump-release.mjs', '1.1', '--base', 'HEAD']);
    assert.match(read('js/game.js'), /data\/topics\.js\?release=1\.1/);
    assert.match(read('offline.html'), /data\/topics\.js\?release=1\.1/);
    assert.match(read('jogar/index.html'), /js\/game\.js\?v=1\.1/);
    assert.match(read('jogar/index.html'), /data\/question-revision-manifest\.js\?release=1\.1/);
    assert.match(read('js/utils.js'), /data\/refs\.js\?release=1\.0/);
    assert.match(read('js/utils.js'), /data\/articles\.js\?release=1\.0/);
    assert.match(read('jogar/index.html'), /js\/utils\.js\?v=1\.0/);
    const workerBeforeSync = read('sw.js');
    assert.match(workerBeforeSync, /'\/data\/topics\.js': '1\.1'/);
    assert.match(workerBeforeSync, /'\/data\/refs\.js': '1\.0'/);
    run(process.execPath, ['scripts/bump-release.mjs', '--sync', '--base', 'HEAD']);
    assert.equal(read('sw.js'), workerBeforeSync, 'sync must preserve the generated data release map');
    run(process.execPath, ['scripts/bump-release.mjs', '--check', '--base', 'HEAD']);
    // A matching SW map must not hide an accidentally stale data URL.
    write('js/game.js', read('js/game.js').replace('?release=1.1', '?release=1.0'));
    write('offline.html', read('offline.html').replace('?release=1.1', '?release=1.0'));
    run(process.execPath, ['scripts/bump-release.mjs', '--sync', '--base', 'HEAD']);
    assert.throws(() => run(process.execPath, ['scripts/bump-release.mjs', '--check', '--base', 'HEAD']),
      'check must reject changed data whose release URL still points to the baseline');
    write('js/game.js', read('js/game.js').replace('?release=1.0', '?release=1.1'));
    write('offline.html', read('offline.html').replace('?release=1.0', '?release=1.1'));
    run(process.execPath, ['scripts/bump-release.mjs', '--sync', '--base', 'HEAD']);
    run('git', ['add', '.']); run('git', ['commit', '--quiet', '-m', 'Reviewed1.1 fixture']);
    // A technical release regenerates manifest metadata even without new data.
    run(process.execPath, ['scripts/bump-release.mjs', '1.2', '--base', 'HEAD']);
    assert.match(read('jogar/index.html'), /data\/question-revision-manifest\.js\?release=1\.2/);
    assert.match(read('sw.js'), /'\/data\/question-revision-manifest\.js': '1\.2'/);
    assert.match(read('js/game.js'), /data\/topics\.js\?release=1\.1/);
    assert.match(read('jogar/index.html'), /js\/game\.js\?v=1\.1/);
  } finally {
    const absolute = resolve(directory), temporary = resolve(tmpdir()) + sep;
    assert(absolute.startsWith(temporary) && absolute.split(sep).at(-1).startsWith('nq-data-release-'));
    rmSync(absolute, {recursive: true, force: true});
  }
});
