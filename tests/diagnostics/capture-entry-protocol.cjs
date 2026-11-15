'use strict';
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const crypto = require('node:crypto');
const {lineFilter} = require('./protocol-projector.cjs');
const testsRoot = path.resolve(__dirname, '..'), repoRoot = path.resolve(testsRoot, '..');
const sha256 = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
function resolveCLI() {
  const packageFile = require.resolve('playwright/package.json', {paths: [testsRoot]});
  const packageData = JSON.parse(fs.readFileSync(packageFile, 'utf8'));
  const bin = typeof packageData.bin === 'string' ? packageData.bin : packageData.bin?.playwright;
  if (!bin) throw new Error('Installed Playwright has no declared CLI');
  return path.resolve(path.dirname(packageFile), bin);
}

function parseArguments(args) {
  const options = {};
  for (let index = 0; index < args.length; index++) {
    const name = args[index];
    if (!['--base-url', '--output'].includes(name) || !args[index + 1] || options[name])
      throw new Error('Use --base-url http://localhost:PORT --output NEW_DIRECTORY');
    options[name] = args[++index];
  }
  if (!options['--base-url'] || !options['--output'])
    throw new Error('Both --base-url and --output are required');
  const base = new URL(options['--base-url']);
  // Original226 intentionally allows localhost only. Never retarget this probe
  // at an account, AI, payment or public production service.
  if (base.protocol !== 'http:' || base.hostname !== 'localhost' || base.username || base.password ||
      base.pathname !== '/' || base.search || base.hash) throw new Error('A plain HTTP localhost origin is required');
  return {baseURL: base.origin, output: path.resolve(options['--output'])};
}
function projectionComplete(counters) {
  return !!counters && ['recordsDropped', 'otherRecordsDropped', 'oversizedLines',
    'parseFailures', 'pendingEvictions', 'malformedIdentifiers']
    .every(key => Number.isSafeInteger(counters[key]) && counters[key] === 0);
}

function main(args) {
  const options = parseArguments(args);
  const cli = resolveCLI();
  // Preflight is parent-only. Workers import the config again after outputDir
  // exists; the configuration must remain idempotent at every import.
  fs.mkdirSync(path.dirname(options.output), {recursive: true});
  fs.mkdirSync(options.output); // EEXIST preserves every previous run, even empty ones.
  const protocolFile = fs.openSync(path.join(options.output, 'protocol-metadata.jsonl'), 'wx');
  const otherFile = fs.openSync(path.join(options.output, 'child-output-metadata.jsonl'), 'wx');
  const started = performance.now();
  const sink = lineFilter({
    writeProtocol: row => fs.writeSync(protocolFile, JSON.stringify({
      timeMs: Math.round((performance.now() - started) * 1000) / 1000, ...row}) + '\n'),
    writeOther: row => fs.writeSync(otherFile, JSON.stringify(row) + '\n')
  });
  const inputNames = ['diagnostics/capture-entry-protocol.cjs', 'diagnostics/protocol-projector.cjs',
    'diagnostics/entry-protocol.config.cjs', 'diagnostics/protocol-summary-reporter.cjs',
    'probes/entry-protocol-controls.spec.ts',
    'specs/226-streak-multiplier-display.spec.ts', 'specs/279-starter-image-fallback.spec.ts'];
  const inputs = inputNames.map(file => ({file: 'tests/' + file,
    sha256: sha256(fs.readFileSync(path.join(testsRoot, file)))}));
  const env = {...process.env, NQ_PROTOCOL_OUTPUT: options.output,
    NQ_PROTOCOL_BASE_URL: options.baseURL, DEBUG: 'pw:protocol', DEBUG_COLORS: '0', FORCE_COLOR: '0'};
  delete env.NO_COLOR;
  const child = cp.spawn(process.execPath, [cli, 'test', '--config', path.join(__dirname, 'entry-protocol.config.cjs'),
    '--workers=1', '--retries=0'], {cwd: repoRoot, env, stdio: ['ignore', 'pipe', 'pipe']});
  for (const stream of ['stdout', 'stderr']) {
    child[stream].setEncoding('utf8'); child[stream].on('data', chunk => sink.push(stream, chunk));
  }
  let launchErrorCode = null;
  child.on('error', error => { launchErrorCode = /^[A-Z0-9_]+$/.test(error.code || '') ? error.code : 'LAUNCH_FAILED'; });
  child.on('close', (exitCode, signal) => {
    sink.finish(); fs.closeSync(protocolFile); fs.closeSync(otherFile);
    let workerResults = null;
    try { workerResults = JSON.parse(fs.readFileSync(path.join(options.output, 'results-summary.json'), 'utf8')); }
    catch { /* Missing results are explicit below; never invent a passing run. */ }
    const worker = workerResults?.protocol;
    const parentCounters = {...sink.counters, ...sink.projectionCounters};
    const tests = workerResults?.tests;
    const resultShapeValid = workerResults?.collected === 4 && Array.isArray(tests) && tests.length === 4 &&
      Array.isArray(workerResults.runnerErrors) && tests.every(test => test.retry === 0 &&
        test.expectedStatus === 'passed' && ['passed', 'failed', 'timedOut', 'interrupted'].includes(test.status));
    const unexpectedResult = resultShapeValid && (tests.some(test => test.status !== test.expectedStatus) ||
      workerResults.runnerErrors.length > 0);
    const resultsStatusConsistent = !!resultShapeValid &&
      (workerResults.status === 'passed' ? !unexpectedResult :
        ['failed', 'timedout', 'interrupted'].includes(workerResults.status) && unexpectedResult);
    const resultsValid = resultsStatusConsistent && (worker?.recordsWritten > 0 || sink.counters.recordsWritten > 0);
    const resultsSucceeded = resultsValid && workerResults.status === 'passed';
    const exitedNormally = Number.isInteger(exitCode) && exitCode >= 0 && !signal;
    const summary = {schema: 1, testExitCode: exitCode, signal, launchErrorCode,
      collectorStatus: launchErrorCode || !resultsValid || !projectionComplete(parentCounters) ||
        !projectionComplete(worker) ? 'incomplete' : 'complete',
      ...sink.counters, ...sink.projectionCounters, workerProtocol: worker || null, resultsValid,
      resultsStatus: workerResults?.status || null, resultsStatusConsistent, exitedNormally, inputs,
      baseURL: options.baseURL, expectedCases: 4, workers: 1, retries: 0, timeoutMs: 20000,
      originalSpecFilesUsed: true, transformedCopiesUsed: false,
      rawProtocolWritten: false, rawChildOutputWritten: false, filterBeforePersistence: true,
      resultsFile: 'results-summary.json', resultsKind: 'sanitized-reporter-metadata',
      uploadFiles: ['collector-summary.json', 'results-summary.json', 'protocol-metadata.jsonl', 'child-output-metadata.jsonl',
        'worker-protocol-metadata.jsonl', 'worker-output-metadata.jsonl'],
      nativeRunnerArtifactLimit: 'Playwright may independently write artifacts/.../error-context.md on failure, including an error, page snapshot and source code frame. The stream filter does not control that native file. No claim is made that every native runner artifact is metadata-only.',
      uploadBoundary: 'Only the six files in uploadFiles may be uploaded. Do not upload the artifacts directory or native error-context.md.',
      limits: ['Protocol success is distinct from JavaScript/application success.',
        'Diagnostic logging can affect timing. Negative entries do not resolve the historical causes.',
        'Unknown protocol messages and ordinary child output are hashed, never retained verbatim.',
        'Opaque session/frame/loader identifiers are bounded hashes. Malformed identifiers and any output loss make the collector incomplete.',
        'Only one226 mobile case and one279 chromium/glomerulus case are selected, plus two technical controls.']};
    // A complete diagnostic capture can describe a real failed test. Preserve
    // its positive exit code, but never turn signal/null termination or a
    // contradictory passing code/result pair into a successful process.
    summary.effectiveExitCode = Number.isInteger(exitCode) && exitCode > 0 ? exitCode :
      exitedNormally && exitCode === 0 && resultsSucceeded && summary.collectorStatus === 'complete' ? 0 : 70;
    fs.writeFileSync(path.join(options.output, 'collector-summary.json'), JSON.stringify(summary, null, 2) + '\n', {flag: 'wx'});
    process.stdout.write('Entry protocol capture finished: testExitCode=' + exitCode + ', collector=' + summary.collectorStatus + '\n');
    process.exitCode = summary.effectiveExitCode;
  });
}
if (require.main === module) {
  if (process.argv.slice(2).includes('--help')) process.stdout.write(
    'node tests/diagnostics/capture-entry-protocol.cjs --base-url http://localhost:PORT --output NEW_DIRECTORY\n' +
    'Runs 2 controls + original226/mobile + original279/chromium/glomerulus; 1 worker, 0 retry, 20s.\n' +
    'Playwright browsers/dependencies and a local preview must already be available. Never reuses an output directory.\n');
  else {
    try { main(process.argv.slice(2)); }
    catch (error) { process.stderr.write('Entry capture preflight failed: ' + error.message + '\n'); process.exitCode = 70; }
  }
}
module.exports = {parseArguments, resolveCLI, projectionComplete};
