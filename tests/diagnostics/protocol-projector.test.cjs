'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const {projector, lineFilter} = require('./protocol-projector.cjs');
const send = object => 'pw:protocol SEND ► ' + JSON.stringify(object);
const receive = object => 'pw:protocol ◀ RECV ' + JSON.stringify(object);
const secret = 'controlled-sensitive-sentinel';

test('parameters and values are omitted before persistence', () => {
  const capture = projector();
  const rows = [capture.consume(send({id: 1, method: 'Runtime.callFunctionOn', params: {functionDeclaration: secret}})),
    capture.consume(receive({id: 1, result: {result: {value: secret}}}))].flatMap(item => item.rows);
  assert.equal(rows.length, 2); assert(!JSON.stringify(rows).includes(secret));
  assert.equal(rows[1].status, 'protocol-success');
});
test('known protocol errors retain their original code and allowlisted message only', () => {
  const capture = projector(); capture.consume(send({id: 1, method: 'Runtime.evaluate'}));
  const row = capture.consume(receive({id: 1, error: {code: -32000,
    message: 'Execution context was destroyed.', data: secret}})).rows[0];
  assert.equal(row.status, 'protocol-error'); assert.equal(row.errorCode, -32000);
  assert.equal(row.allowedMessage, 'Execution context was destroyed.');
  assert(!JSON.stringify(row).includes(secret));
});
test('unknown protocol messages are hashed instead of retained', () => {
  const capture = projector(); capture.consume(send({id: 2, method: 'Runtime.evaluate'}));
  const row = capture.consume(receive({id: 2, error: {code: -32000, message: secret, data: secret}})).rows[0];
  assert.equal(row.allowedMessage, null); assert.equal(row.messageBytes, Buffer.byteLength(secret));
  assert.equal(row.messageSHA256, crypto.createHash('sha256').update(secret).digest('hex'));
  assert(!JSON.stringify(row).includes(secret)); assert.equal(capture.counters.unclassifiedErrors, 1);
});
test('a JavaScript exception is not described as application success and exposes no details', () => {
  const capture = projector(); capture.consume(send({id: 3, method: 'Runtime.callFunctionOn'}));
  const row = capture.consume(receive({id: 3, result: {exceptionDetails: {text: secret,
    exception: {description: secret}}, result: {description: secret}}})).rows[0];
  assert.equal(row.status, 'protocol-success'); assert.equal(row.javascriptExceptionPresent, true);
  assert(!JSON.stringify(row).includes(secret));
});
test('context and navigation metadata omit query, hash, names, origins and remote objects', () => {
  const capture = projector();
  const rows = [capture.consume(receive({method: 'Runtime.executionContextCreated', params: {context: {
    id: 4, name: secret, origin: secret, uniqueId: secret, auxData: {frameId: 'frame-4', isDefault: true}}}})),
    capture.consume(receive({method: 'Page.frameNavigated', params: {frame: {id: 'frame-4', loaderId: 'loader-4',
      url: 'http://localhost:5513/version.json?' + secret + '#' + secret}}}))].flatMap(item => item.rows);
  assert.equal(rows[0].contextId, 4); assert.equal(rows[0].isDefault, true);
  assert.equal(rows[1].url, 'http://localhost:5513/version.json'); assert(!JSON.stringify(rows).includes(secret));
});
test('identical request ids are paired independently per session', () => {
  const capture = projector();
  capture.consume(send({id: 1, sessionId: 'a', method: 'Runtime.evaluate'}));
  capture.consume(send({id: 1, sessionId: 'b', method: 'Runtime.callFunctionOn'}));
  assert.equal(capture.consume(receive({id: 1, sessionId: 'b', result: {}})).rows[0].method, 'Runtime.callFunctionOn');
  assert.equal(capture.consume(receive({id: 1, sessionId: 'a', result: {}})).rows[0].method, 'Runtime.evaluate');
});
test('untracked protocol messages and ordinary stderr never become protocol evidence', () => {
  const capture = projector();
  assert.deepEqual(capture.consume(send({id: 9, method: 'Network.getResponseBody', params: {secret}})).rows, []);
  assert.deepEqual(capture.consume(receive({id: 9, result: {secret}})).rows, []);
  assert.deepEqual(capture.consume(secret), {protocol: false, rows: []});
});
test('malformed input is counted without throwing or exposing its contents', () => {
  const capture = projector();
  assert.deepEqual(capture.consume('pw:protocol ◀ RECV {' + secret).rows, []);
  assert.equal(capture.counters.parseFailures, 1);
});
test('pending request bookkeeping is bounded and loss is explicit', () => {
  const capture = projector();
  for (let id = 0; id < 2050; id++) capture.consume(send({id, method: 'Runtime.evaluate', params: {secret}}));
  assert.equal(capture.counters.pendingEvictions, 2);
  assert.deepEqual(capture.consume(receive({id: 0, result: {secret}})).rows, []);
  assert.equal(capture.consume(receive({id: 2049, result: {}})).rows.length, 1);
});
test('the persistence boundary filters both split streams and omits raw nonprotocol stderr', () => {
  const protocol = [], other = [];
  const sink = lineFilter({writeProtocol: row => protocol.push(row), writeOther: row => other.push(row)});
  const command = send({id: 7, method: 'Runtime.evaluate', params: {expression: secret}});
  sink.push('stderr', command.slice(0, 20)); sink.push('stderr', command.slice(20) + '\n');
  sink.push('stderr', receive({id: 7, error: {code: -32000, message: secret, data: secret}}) + '\n');
  sink.push('stderr', 'ordinary stderr ' + secret + '\n'); sink.push('stdout', 'stdout ' + secret);
  sink.finish();
  assert.equal(protocol.length, 2); assert.equal(other.length, 2);
  assert(other.every(row => row.contentOmitted && row.sha256.length === 64));
  assert(!JSON.stringify({protocol, other}).includes(secret));
});
test('bounded output and oversized line losses are explicit and never expose fragments', () => {
  const protocol = [], other = [];
  const sink = lineFilter({writeProtocol: row => protocol.push(row), writeOther: row => other.push(row),
    maxRecords: 1, maxLineBytes: 256});
  sink.push('stderr', send({id: 8, method: 'Runtime.evaluate'}) + '\n');
  sink.push('stderr', receive({id: 8, result: {}}) + '\n');
  sink.push('stderr', secret.repeat(20)); sink.push('stderr', secret + '\n');
  sink.finish();
  assert.equal(sink.counters.recordsWritten, 1); assert.equal(sink.counters.recordsDropped, 1);
  assert.equal(sink.counters.oversizedLines, 1); assert.equal(other.length, 0);
  assert(!JSON.stringify(protocol).includes(secret));
});
test('malformed command and session identifiers never copy objects or arbitrary values', () => {
  for (const id of [{payload: secret}, -1, 0.5, Number.MAX_SAFE_INTEGER + 1, secret]) {
    const capture = projector();
    const projected = capture.consume(send({id, method: 'Runtime.evaluate'}));
    assert.deepEqual(projected.rows, []); assert.equal(capture.counters.malformedIdentifiers, 1);
    assert(!JSON.stringify(projected).includes(secret));
  }
  const capture = projector();
  assert.deepEqual(capture.consume(send({id: 1, sessionId: {payload: secret}, method: 'Runtime.evaluate'})).rows, []);
  assert.equal(capture.counters.malformedIdentifiers, 1);
});
test('opaque session/frame/loader identifiers are bounded hashes, not arbitrary strings', () => {
  const capture = projector();
  const command = capture.consume(send({id: 1, sessionId: secret, method: 'Runtime.evaluate'})).rows[0];
  assert.match(command.sessionId, /^sha256:[a-f0-9]{64}$/);
  const row = capture.consume(receive({method: 'Page.frameNavigated', sessionId: secret,
    params: {frame: {id: secret, parentId: secret, loaderId: secret, url: 'about:blank'}}})).rows[0];
  assert.equal(row.frameId, command.sessionId); assert.equal(row.loaderId, command.sessionId);
  assert(!JSON.stringify(row).includes(secret));
  assert.deepEqual(capture.consume(send({id: 2, sessionId: 'x'.repeat(129), method: 'Runtime.evaluate'})).rows, []);
  assert.equal(capture.counters.malformedIdentifiers, 1);
});
test('malformed lifecycle identifiers are omitted and counted without payload copies', () => {
  const capture = projector();
  const rows = [capture.consume(receive({method: 'Runtime.executionContextCreated', params: {context: {
    id: {payload: secret}, auxData: {frameId: {payload: secret}, isDefault: true}}}})),
  capture.consume(receive({method: 'Page.frameNavigated', params: {frame: {id: {payload: secret},
    loaderId: {payload: secret}, url: 'about:blank'}}})),
  capture.consume(receive({method: 'Target.detachedFromTarget', params: {sessionId: {payload: secret}}}))]
    .flatMap(item => item.rows);
  assert.equal(rows[0].contextId, null); assert.equal(rows[0].frameId, null);
  assert.equal(rows[1].loaderId, null); assert.equal(rows[2].detachedSessionId, null);
  assert.equal(capture.counters.malformedIdentifiers, 5); assert(!JSON.stringify(rows).includes(secret));
});
test('context identifiers accept safe nonnegative integers and reject unsafe numbers', () => {
  for (const id of [0, 1, Number.MAX_SAFE_INTEGER]) {
    const capture = projector();
    assert.equal(capture.consume(receive({method: 'Runtime.executionContextDestroyed', params: {executionContextId: id}})).rows[0].contextId, id);
    assert.equal(capture.counters.malformedIdentifiers, 0);
  }
  for (const id of [-1, 0.5, Number.MAX_SAFE_INTEGER + 1]) {
    const capture = projector();
    assert.equal(capture.consume(receive({method: 'Runtime.executionContextDestroyed', params: {executionContextId: id}})).rows[0].contextId, null);
    assert.equal(capture.counters.malformedIdentifiers, 1);
  }
});
test('one combined output budget bounds ordinary stderr metadata and protocol metadata', () => {
  const other = [], protocol = [];
  const sink = lineFilter({maxRecords: 1, writeProtocol: row => protocol.push(row), writeOther: row => other.push(row)});
  sink.push('stderr', 'ordinary-one\nordinary-two\nordinary-three\n');
  sink.push('stdout', send({id: 1, method: 'Runtime.evaluate'}) + '\n');
  sink.finish();
  assert.equal(other.length, 1); assert.equal(protocol.length, 0);
  assert.equal(sink.counters.otherLines, 3); assert.equal(sink.counters.otherRecordsWritten, 1);
  assert.equal(sink.counters.otherRecordsDropped, 2); assert.equal(sink.counters.recordsDropped, 1);
});
