'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const ROOT = path.resolve(__dirname, '..');
const canonical = value => Array.isArray(value) ? '[' + value.map(canonical).join(',') + ']'
  : value && typeof value === 'object' ? '{' + Object.keys(value).sort().map(key => JSON.stringify(key) + ':' + canonical(value[key])).join(',') + '}'
    : JSON.stringify(value);
const digest = value => 'sha256:' + crypto.createHash('sha256').update(canonical(value), 'utf8').digest('hex');
function load(relative, name) {
  const context = vm.createContext({});
  vm.runInContext(fs.readFileSync(path.join(ROOT, relative), 'utf8') + '\n;globalThis.result=' + name + ';', context,
    { filename: relative, timeout: 1000 });
  return JSON.parse(JSON.stringify(context.result));
}
function sources(topic, index) {
  const main = {
    id: topic.qid || String(index + 1),
    d: topic.diff === 'hard' ? Math.min(12, 8 + Math.floor(index / 30)) : Math.min(12, 4 + Math.floor(index / 25)),
    _d: topic.diff || topic.d || 'medium', q: topic.q,
    o: (topic.opts || topic.o || []).slice(),
    a: topic.ans !== undefined ? topic.ans : topic.a !== undefined ? topic.a : 0,
    e: topic.exp || topic.e || '', r: topic.refs || topic.r || [], c: topic.cat || topic.c || 'geral',
  };
  return { main, exam: main,
    study: { id: topic.qid || topic.id || topic.q.substring(0, 40), q: topic.q, o: [...topic.opts], a: topic.ans,
      e: topic.exp || '', refs: [...(topic.refs || [])] },
    offline: { id: topic.qid, q: topic.q, o: [...topic.opts], a: topic.ans, e: topic.exp || topic.e || '' } };
}
function build(topics, references, release) {
  assert.equal(topics.length, 741);
  const current = {};
  topics.forEach((author, index) => {
    assert.equal(typeof author.qid, 'string');
    assert(author.qid && !Object.hasOwn(current, author.qid));
    const referenceRevisions = {};
    for (const id of author.refs || author.r || []) referenceRevisions[id] = references[id] ? digest(references[id]) : null;
    const authorRevision = digest(author);
    current[author.qid] = { authorRevision, recordRevision: digest({ authorRevision, referenceRevisions }),
      sourceRevisions: Object.fromEntries(Object.entries(sources(author, index)).map(([profile, source]) => [profile, digest(source)])),
      referenceRevisions };
  });
  return { version: 1, release, current };
}
if (require.main === module) {
  const release = process.argv[2];
  assert(/^\d+\.\d+$/.test(release), 'Pass the technical release explicitly.');
  const topics = load('data/topics.js', 'topics');
  const references = load('data/refs.js', 'refsDB');
  const manifest = build(topics, references, release);
  const answers = require('../js/answer-presentation.js');
  for (const [index, author] of topics.entries()) for (const [profile, source] of Object.entries(sources(author, index))) {
    const presentation = answers.present(source, { preserveOrder: true });
    assert(presentation, author.qid + ':' + profile);
    assert.equal(presentation._answerPresentation.sourceRevision, manifest.current[author.qid].sourceRevisions[profile]);
  }
  const file = path.join(ROOT, 'data/question-revision-manifest.js');
  const body = '/* Generated from the authored bank and reference registry; never from browser saves. */\n'
    + '(function(root){\n\'use strict\';\nconst manifest=' + JSON.stringify(manifest) + ';\n'
    + 'if(typeof module===\'object\'&&module.exports)module.exports=manifest;\n'
    + 'root.NQQuestionRevisionManifest=manifest;\n})(typeof globalThis!==\'undefined\'?globalThis:this);\n';
  fs.writeFileSync(file, body);
  console.log(JSON.stringify({ file: 'data/question-revision-manifest.js', release, questions: topics.length,
    profiles: topics.length * 4, bytes: Buffer.byteLength(body), sha256: crypto.createHash('sha256').update(body).digest('hex'),
    allProfileDigestsMatchRealAnswerHelper: true }));
}
module.exports = { canonical, digest, sources, build, load };
