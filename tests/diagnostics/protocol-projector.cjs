'use strict';
const crypto = require('node:crypto');
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const allowedErrors = new Set(['Promise was collected', 'Cannot find context with specified id',
  'Cannot find object with given id', 'Could not find object with given id', 'Invalid remote object id',
  'Execution context was destroyed.', 'Execution context was destroyed',
  'Inspected target navigated or closed', 'Internal error']);
const tracked = new Set(['Runtime.callFunctionOn', 'Runtime.evaluate']);
const lifecycle = new Set(['Runtime.executionContextCreated', 'Runtime.executionContextDestroyed',
  'Runtime.executionContextsCleared', 'Page.frameNavigated', 'Page.navigatedWithinDocument',
  'Page.frameDetached', 'Target.detachedFromTarget']);
const safeURL = raw => {
  try {
    const url = new URL(String(raw));
    return ['http:', 'https:'].includes(url.protocol) ? url.origin + url.pathname
      : url.href === 'about:blank' ? 'about:blank' : url.protocol;
  } catch { return 'unavailable'; }
};

// Parse in memory, then project. No protocol parameters, scripts, result values,
// exception details, error data or unknown error messages leave this function.
function projector() {
  const pending = new Map();
  const counters = {protocolLines: 0, parseFailures: 0, unclassifiedErrors: 0,
    pendingEvictions: 0, malformedIdentifiers: 0};
  const integerID = value => {
    if (Number.isSafeInteger(value) && value >= 0) return value;
    counters.malformedIdentifiers++; return null;
  };
  const opaqueID = value => {
    if (value === undefined || value === null) return null;
    if (typeof value !== 'string' || value.length === 0 || value.length > 128) {
      counters.malformedIdentifiers++; return null;
    }
    return 'sha256:' + hash(value);
  };
  const remember = (key, method) => {
    if (pending.size >= 2048 && !pending.has(key)) {
      pending.delete(pending.keys().next().value); counters.pendingEvictions++;
    }
    pending.set(key, method);
  };
  return {counters, consume(line) {
    const clean = line.replace(/\u001b\[[0-9;]*m/g, '');
    const send = clean.indexOf('SEND ► '), receive = clean.indexOf('◀ RECV ');
    if (!clean.includes('pw:protocol') && send < 0 && receive < 0) return {protocol: false, rows: []};
    counters.protocolLines++;
    const marker = send >= 0 ? send : receive;
    if (marker < 0) { counters.parseFailures++; return {protocol: true, rows: []}; }
    const text = clean.slice(marker + (send >= 0 ? 'SEND ► '.length : '◀ RECV '.length));
    const jsonText = text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1);
    let message;
    try { message = JSON.parse(jsonText); }
    catch {
      counters.parseFailures++;
      if (send >= 0) {
        const header = /^\{"id":(\d+),"method":"([^"]+)"/.exec(jsonText);
        const session = /,"sessionId":"([^"]+)"\}$/.exec(jsonText.trim());
        if (header && tracked.has(header[2])) {
          const id = integerID(Number(header[1])), sessionId = opaqueID(session?.[1]);
          if (id === null || (session && sessionId === null)) return {protocol: true, rows: []};
          remember(id + ':' + (sessionId || ''), header[2]);
          return {protocol: true, rows: [{kind: 'send', id,
            sessionId, method: header[2], parametersOmitted: true, truncatedInput: true}]};
        }
      }
      return {protocol: true, rows: []};
    }
    const session = opaqueID(message.sessionId);
    if (message.sessionId !== undefined && message.sessionId !== null && session === null)
      return {protocol: true, rows: []};
    if (send >= 0) {
      if (!tracked.has(message.method)) return {protocol: true, rows: []};
      const id = integerID(message.id);
      if (id === null) return {protocol: true, rows: []};
      const key = id + ':' + (session || '');
      remember(key, message.method);
      return {protocol: true, rows: [{kind: 'send', id, sessionId: session,
        method: message.method, parametersOmitted: true}]};
    }
    if (message.id !== undefined) {
      const id = integerID(message.id);
      if (id === null) return {protocol: true, rows: []};
      const key = id + ':' + (session || '');
      const method = pending.get(key); pending.delete(key);
      if (!method) return {protocol: true, rows: []};
      const row = {kind: 'reply', id, sessionId: session, method,
        status: message.error ? 'protocol-error' : 'protocol-success', resultOmitted: true};
      // CDP success can still contain a JavaScript exception. Record only the
      // distinction, never exception text, stack, description or remote object.
      if (!message.error) row.javascriptExceptionPresent = !!message.result?.exceptionDetails;
      if (message.error) {
        const errorMessage = String(message.error.message || '');
        row.errorCode = typeof message.error.code === 'number' ? message.error.code : null;
        row.allowedMessage = allowedErrors.has(errorMessage) ? errorMessage : null;
        row.messageSHA256 = hash(errorMessage); row.messageBytes = Buffer.byteLength(errorMessage);
        row.dataOmitted = true;
        if (!row.allowedMessage) counters.unclassifiedErrors++;
      }
      return {protocol: true, rows: [row]};
    }
    if (!lifecycle.has(message.method)) return {protocol: true, rows: []};
    const params = message.params || {}, row = {kind: 'lifecycle', method: message.method, sessionId: session};
    if (message.method === 'Runtime.executionContextCreated') {
      row.contextId = integerID(params.context?.id); row.frameId = opaqueID(params.context?.auxData?.frameId);
      row.isDefault = params.context?.auxData?.isDefault === true;
    }
    if (message.method === 'Runtime.executionContextDestroyed') row.contextId = integerID(params.executionContextId);
    if (message.method === 'Page.frameNavigated') {
      row.frameId = opaqueID(params.frame?.id); row.parentId = opaqueID(params.frame?.parentId);
      row.loaderId = opaqueID(params.frame?.loaderId); row.url = safeURL(params.frame?.url);
    }
    if (message.method === 'Page.navigatedWithinDocument') { row.frameId = opaqueID(params.frameId); row.url = safeURL(params.url); }
    if (message.method === 'Page.frameDetached') row.frameId = opaqueID(params.frameId);
    if (message.method === 'Target.detachedFromTarget') row.detachedSessionId = opaqueID(params.sessionId);
    return {protocol: true, rows: [row]};
  }};
}
// The launcher uses this sink for BOTH child streams. Nonprotocol output is
// represented by a digest/length only; raw stderr is never written or relayed.
function lineFilter({writeProtocol, writeOther, maxRecords = 10000, maxLineBytes = 1048576}) {
  const capture = projector(), buffers = {stdout: '', stderr: ''};
  const discarding = {stdout: false, stderr: false};
  const counters = {recordsWritten: 0, recordsDropped: 0, oversizedLines: 0,
    otherLines: 0, otherRecordsWritten: 0, otherRecordsDropped: 0};
  const budgetExhausted = () => counters.recordsWritten + counters.otherRecordsWritten >= maxRecords;
  const consume = (stream, line) => {
    const projected = capture.consume(line);
    if (!projected.protocol) {
      counters.otherLines++;
      if (budgetExhausted()) { counters.otherRecordsDropped++; return; }
      writeOther({stream, bytes: Buffer.byteLength(line), sha256: hash(line), contentOmitted: true});
      counters.otherRecordsWritten++;
      return;
    }
    for (const row of projected.rows) {
      if (budgetExhausted()) { counters.recordsDropped++; continue; }
      writeProtocol(row); counters.recordsWritten++;
    }
  };
  return {counters, projectionCounters: capture.counters,
    push(stream, chunk) {
      if (!(stream in buffers)) throw new Error('Unknown child stream');
      const parts = chunk.split('\n');
      for (let index = 0; index < parts.length; index++) {
        const part = parts[index], complete = index < parts.length - 1;
        if (!discarding[stream]) {
          buffers[stream] += part;
          if (Buffer.byteLength(buffers[stream]) > maxLineBytes) {
            counters.oversizedLines++; buffers[stream] = ''; discarding[stream] = true;
          }
        }
        if (complete) {
          if (!discarding[stream]) consume(stream, buffers[stream].replace(/\r$/, ''));
          buffers[stream] = ''; discarding[stream] = false;
        }
      }
    },
    finish() {
      for (const stream of Object.keys(buffers)) {
        if (buffers[stream] && !discarding[stream]) consume(stream, buffers[stream]);
        buffers[stream] = '';
      }
    }
  };
}
module.exports = {projector, lineFilter};
