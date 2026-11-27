'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const {parseArguments, resolveCLI, projectionComplete} = require('./capture-entry-protocol.cjs');
const Reporter = require('./protocol-summary-reporter.cjs');
test('launcher accepts a portable output directory and local origin only', () => {
  const parsed = parseArguments(['--base-url', 'http://localhost:5513', '--output', 'diagnostic-output']);
  assert.equal(parsed.baseURL, 'http://localhost:5513'); assert(path.isAbsolute(parsed.output));
  for (const base of ['https://nefroquest.com', 'http://127.0.0.1:5513', 'http://localhost/path',
    'http://user:password@localhost:5513', 'http://localhost:5513/?secret=value'])
    assert.throws(() => parseArguments(['--base-url', base, '--output', 'diagnostic-output']));
});
test('missing, duplicate and arbitrary launcher switches fail before spawning anything', () => {
  for (const args of [[], ['--output', 'x'], ['--base-url', 'http://localhost:5513'],
    ['--base-url', 'http://localhost:5513', '--output', 'x', '--output', 'y'], ['--retries', '2']])
    assert.throws(() => parseArguments(args));
});
test('CLI is resolved from the installed package bin without assuming an exported subpath', () => {
  assert(require('node:fs').existsSync(resolveCLI())); assert(resolveCLI().endsWith('cli.js'));
});
test('configuration import is idempotent and selects original source paths with exact limits', () => {
  const previousOutput = process.env.NQ_PROTOCOL_OUTPUT, previousBase = process.env.NQ_PROTOCOL_BASE_URL;
  process.env.NQ_PROTOCOL_OUTPUT = path.resolve('output-that-need-not-exist');
  process.env.NQ_PROTOCOL_BASE_URL = 'http://localhost:5513';
  const file = require.resolve('./entry-protocol.config.cjs');
  try {
    delete require.cache[file]; const first = require(file);
    delete require.cache[file]; const second = require(file);
    assert.equal(first.outputDir, second.outputDir); assert.equal(first.workers, 1);
    assert.equal(first.retries, 0); assert.equal(first.timeout, 20000);
    assert.equal(first.projects.length, 3);
    assert.equal(first.projects[1].testMatch, '**/specs/226-streak-multiplier-display.spec.ts');
    assert.equal(first.projects[2].testMatch, '**/specs/279-starter-image-fallback.spec.ts');
    assert(first.projects[2].grep.test('equipamento inicial de glomerulus mantém nomes e atributos quando a imagem falha'));
    assert(first.projects[2].grep.test('entry-279-chromium 279-starter-image-fallback.spec.ts equipamento inicial de glomerulus mantém nomes e atributos quando a imagem falha'));
    assert(!first.projects[2].grep.test('equipamento inicial de aquaria mantém nomes e atributos quando a imagem falha'));
    assert.equal(first.reporter.length, 1);
    assert(first.reporter[0][0].endsWith('protocol-summary-reporter.cjs'));
    assert.deepEqual([first.use.trace, first.use.screenshot, first.use.video], ['off', 'off', 'off']);
  } finally {
    delete require.cache[file];
    if (previousOutput === undefined) delete process.env.NQ_PROTOCOL_OUTPUT; else process.env.NQ_PROTOCOL_OUTPUT = previousOutput;
    if (previousBase === undefined) delete process.env.NQ_PROTOCOL_BASE_URL; else process.env.NQ_PROTOCOL_BASE_URL = previousBase;
  }
});
test('reporter duplication of worker protocol/stdout is discarded before any result serialization', () => {
  const secret = 'reporter-sensitive-sentinel';
  const reporter = new Reporter();
  reporter.onStdErr('pw:protocol SEND ► ' + JSON.stringify({id: 1, method: 'Runtime.evaluate', params: {expression: secret}}));
  reporter.onStdOut('ordinary output ' + secret);
  reporter.onError({message: secret});
  reporter.onTestEnd({title: 'Technical title', parent: {project: () => ({name: 'technical'})},
    location: {file: __filename}, expectedStatus: 'passed'}, {
    status: 'failed', retry: 0, duration: 1, errors: [{message: secret}],
    attachments: [{name: 'technical-audit', contentType: 'application/json', body: Buffer.from(secret)}]
  });
  assert(!JSON.stringify(reporter.summary).includes(secret));
  reporter.sink.finish();
  assert.equal(reporter.protocolRows.length, 1);
  assert(!JSON.stringify({protocol: reporter.protocolRows, other: reporter.otherRows}).includes(secret));
  assert.equal(reporter.summary.rawChildOutputRetained, false);
  assert.equal(reporter.summary.tests[0].errors[0].originalMessageOmitted, true);
});
test('missing counters, malformed identifiers or output loss cannot certify a complete collector', () => {
  const complete = {recordsDropped: 0, otherRecordsDropped: 0, oversizedLines: 0,
    parseFailures: 0, pendingEvictions: 0, malformedIdentifiers: 0};
  assert.equal(projectionComplete(complete), true);
  assert.equal(projectionComplete(null), false); assert.equal(projectionComplete({}), false);
  for (const key of Object.keys(complete)) {
    assert.equal(projectionComplete({...complete, [key]: 1}), false);
    assert.equal(projectionComplete({...complete, [key]: undefined}), false);
  }
});

// Exercise the actual launcher's close callback with controlled Node process/FS
// boundaries. No Playwright API/controller is patched and no child is spawned.
function controlledChildClose(exitCode, signal, resultChanges = {}) {
  const fs = require('node:fs'), vm = require('node:vm'), {EventEmitter} = require('node:events');
  const file = require.resolve('./capture-entry-protocol.cjs');
  const results = {collected: 4, status: 'passed', runnerErrors: [],
    tests: Array.from({length: 4}, () => ({retry: 0, status: 'passed', expectedStatus: 'passed'})),
    protocol: {recordsWritten: 1, recordsDropped: 0, otherRecordsDropped: 0, oversizedLines: 0,
      parseFailures: 0, pendingEvictions: 0, malformedIdentifiers: 0}, ...resultChanges};
  const child = new EventEmitter(), writes = new Map();
  for (const stream of ['stdout', 'stderr']) { child[stream] = new EventEmitter(); child[stream].setEncoding = () => {}; }
  let spawned = false;
  const fakeFS = {...fs, mkdirSync() {}, openSync() { return 1; }, closeSync() {}, writeSync() {},
    readFileSync(fileName, encoding) {
      if (String(fileName).endsWith('results-summary.json')) return JSON.stringify(results);
      return fs.readFileSync(fileName, encoding);
    },
    writeFileSync(fileName, value) { writes.set(path.basename(fileName), String(value)); }};
  const fakeProcess = {argv: [process.execPath, file, '--base-url', 'http://localhost:5513', '--output', 'unit-output'],
    execPath: process.execPath, env: {}, stdout: {write() {}}, stderr: {write() {}}, exitCode: undefined};
  const moduleBoundary = {exports: {}};
  const load = name => name === 'node:fs' ? fakeFS : name === 'node:child_process'
    ? {spawn() { spawned = true; return child; }} : require(name);
  load.resolve = require.resolve; load.main = moduleBoundary;
  vm.runInNewContext(fs.readFileSync(file, 'utf8'), {require: load, module: moduleBoundary,
    __dirname: path.dirname(file), process: fakeProcess, performance, Buffer, URL}, {filename: file});
  assert.equal(spawned, true);
  child.emit('close', exitCode, signal);
  assert(writes.has('collector-summary.json'));
  return {effectiveExitCode: fakeProcess.exitCode, summary: JSON.parse(writes.get('collector-summary.json'))};
}
test('signal/null close cannot become success after all passing metadata has been written', () => {
  const outcome = controlledChildClose(null, 'SIGTERM');
  assert.notEqual(outcome.effectiveExitCode, 0);
  assert.equal(outcome.summary.testExitCode, null); assert.equal(outcome.summary.signal, 'SIGTERM');
});
test('a zero child code cannot certify a failed test result status', () => {
  const outcome = controlledChildClose(0, null, {status: 'failed',
    tests: Array.from({length: 4}, () => ({retry: 0, status: 'failed', expectedStatus: 'passed'}))});
  assert.notEqual(outcome.effectiveExitCode, 0); assert.equal(outcome.summary.testExitCode, 0);
});
test('an overall passed label cannot conceal an unexpected individual test failure', () => {
  const outcome = controlledChildClose(0, null, {
    tests: Array.from({length: 4}, () => ({retry: 0, status: 'failed', expectedStatus: 'passed'}))});
  assert.notEqual(outcome.effectiveExitCode, 0);
});
test('a normal passing close stays zero and a normal failed close preserves its real code', () => {
  assert.equal(controlledChildClose(0, null).effectiveExitCode, 0);
  const outcome = controlledChildClose(1, null, {status: 'failed',
    tests: Array.from({length: 4}, () => ({retry: 0, status: 'failed', expectedStatus: 'passed'}))});
  assert.equal(outcome.effectiveExitCode, 1); assert.equal(outcome.summary.testExitCode, 1);
  assert.equal(outcome.summary.collectorStatus, 'complete');
});
