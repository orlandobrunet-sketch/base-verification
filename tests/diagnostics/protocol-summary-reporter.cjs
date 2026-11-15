'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {lineFilter} = require('./protocol-projector.cjs');
const digest = value => crypto.createHash('sha256').update(value).digest('hex');
function errorMetadata(error) {
  const message = String(error?.message || error?.value || '');
  return {kind: message.includes('Execution context was destroyed') ? 'context-destroyed'
    : message.includes('Invalid remote object id') ? 'invalid-object-id' : 'other',
  messageSHA256: digest(message), messageBytes: Buffer.byteLength(message), originalMessageOmitted: true};
}
class ProtocolSummaryReporter {
  constructor(options = {}) {
    this.outputFile = options.outputFile;
    this.summary = {schema: 1, collected: 0, status: 'not-finished', tests: [], runnerErrors: [],
      rawChildOutputRetained: false, errorMessagesRetained: false};
    this.protocolRows = []; this.otherRows = [];
    const started = performance.now();
    this.sink = lineFilter({writeProtocol: row => this.protocolRows.push({
      timeMs: Math.round((performance.now() - started) * 1000) / 1000, ...row}),
    writeOther: row => this.otherRows.push(row)});
  }
  // Worker DEBUG can be routed through reporter events. Do not retain, print or
  // serialize the chunks. Project here BEFORE persistence as well as in the
  // launcher: otherwise suppressing the reporter would lose worker CDP events.
  onStdOut(chunk) { this.sink.push('stdout', String(chunk)); }
  onStdErr(chunk) { this.sink.push('stderr', String(chunk)); }
  onBegin(_config, suite) { this.summary.collected = suite.allTests().length; }
  onError(error) { this.summary.runnerErrors.push(errorMetadata(error)); }
  onTestEnd(test, result) {
    const attachments = result.attachments.map(attachment => ({name: attachment.name,
      contentType: attachment.contentType, bodyOmitted: true}));
    this.summary.tests.push({title: test.title, project: test.parent.project()?.name || null,
      file: path.relative(process.cwd(), test.location.file).replaceAll('\\', '/'),
      expectedStatus: test.expectedStatus, status: result.status, retry: result.retry,
      durationMs: result.duration, errors: result.errors.map(errorMetadata), attachments});
  }
  onEnd(result) {
    this.sink.finish();
    this.summary.status = result.status;
    this.summary.protocol = {...this.sink.counters, ...this.sink.projectionCounters};
    const directory = path.dirname(this.outputFile);
    fs.writeFileSync(path.join(directory, 'worker-protocol-metadata.jsonl'),
      this.protocolRows.map(row => JSON.stringify(row) + '\n').join(''), {flag: 'wx'});
    fs.writeFileSync(path.join(directory, 'worker-output-metadata.jsonl'),
      this.otherRows.map(row => JSON.stringify(row) + '\n').join(''), {flag: 'wx'});
    fs.writeFileSync(this.outputFile, JSON.stringify(this.summary, null, 2) + '\n', {flag: 'wx'});
  }
}
module.exports = ProtocolSummaryReporter;
module.exports.errorMetadata = errorMetadata;
