'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const positions=require('../../data/question-source-positions.js'),builder=require('../../tools/build-question-revision-manifest.cjs');
test('retiring an earlier question cannot lower the source difficulty of a surviving authored identity',()=>{
  const bank=builder.load('data/topics.js','topics'),question=bank.find(q=>q.qid==='051a5d1b');assert(question);
  const originalPosition=positions.position(question.qid,-1);assert(originalPosition>0);
  const a=builder.sources(question,originalPosition),b=builder.sources(question,originalPosition-1);
  assert.deepEqual(b,a);
  const expected=question.diff==='hard'?Math.min(12,8+Math.floor(originalPosition/30)):Math.min(12,4+Math.floor(originalPosition/25));
  assert.equal(a.main.d,expected);
});
test('every current authored identity has an explicit unique source position without compacting retired identities',()=>{
  const bank=builder.load('data/topics.js','topics');
  assert.equal(new Set(positions.ids).size,positions.ids.length);
  for(const q of bank)assert(positions.position(q.qid,-1)>=0,q.qid);
  for(const qid of ['4c7d3db3','50166346','d10de245','13e53210'])assert(positions.ids.includes(qid));
  assert.equal(positions.position('technical-fixture',26),26);
  assert(Object.isFrozen(positions)&&Object.isFrozen(positions.ids));
});
