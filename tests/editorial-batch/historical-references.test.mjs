import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { parsePublishedSnapshot, historicalReferenceReviewPaths, validateHistoricalReferenceRetention } from '../../scripts/editorial-batch/historical-references.mjs';
import { referenceConsumers } from '../../scripts/editorial-batch/references.mjs';
import { validateBatch } from '../../scripts/editorial-batch/rules.mjs';
import { validateManifest } from '../../scripts/editorial-batch/manifest.mjs';
const require=createRequire(import.meta.url),b=require('../../tools/build-question-revision-manifest.cjs');
const copy=value=>JSON.parse(JSON.stringify(value)),rawHash=value=>createHash('sha256').update(value).digest('hex');
const fields=['label','url','journal','ano','tipo','badge','badgeColor','impacto','icon','resumo','conclusao','curiosidade'];
const card=()=>({label:'Technical fixture',url:'https://example.test/fixture',journal:'Test',ano:2026,tipo:'Test',badge:'TEST',badgeColor:'#123456',impacto:'Test',icon:'test',resumo:'Test summary',conclusao:'Test conclusion',curiosidade:''});
const q=(qid,refs)=>({qid,q:'Technical fixture question',opts:['A','B','C','D'],ans:0,exp:'Technical fixture explanation',cat:'fixture',diff:'medium',refs});
const wrap=(name,value)=>`/* Fixture data, not a medical review. */\n(function(root){\n'use strict';\nconst ${name}=${JSON.stringify(value)};\nif(typeof module==='object'&&module.exports)module.exports=${name};\nroot.${name==='manifest'?'NQQuestionRevisionManifest':'NQQuestionRevisionHistory'}=${name};\n})(typeof globalThis!=='undefined'?globalThis:this);\n`;
const refsSource=refs=>'const refsDB = {\n'+Object.entries(refs).map(([id,value])=>'  '+JSON.stringify(id)+':'+JSON.stringify(value)).join(',\n')+'\n};\n';
const versions=value=>({json:value,cache:value,comment:value,sentry:value});
function fixture(){
  const refs={ref_a:card(),ref_b:card()},author=q('11111111',['ref_a']),other=q('22222222',['ref_b']);
  const base=b.build([author,other],refs,'17.27');
  const archived={qid:author.qid,release:'17.27',author,sources:b.sources(author,0),references:{ref_a:refs.ref_a},policy:{material:true,pending:'update-required'},...base.current[author.qid]};
  const manifestPath='docs/editorial/review-batches/RETENTION-TECHNICAL.json';
  const paths=['data/topics.js','data/question-revision-history.js','version.json','sw.js','index.html',manifestPath];
  return {manifestPath,manifest:{batch:'RETENTION-TECHNICAL',change_type:'medical_editorial',expected_version:'17.28',allowed_files:paths,questions:{'11111111':{action:'retire',preserve_fsrs:false}},expected_question_delta:-1,refs_policy:'unchanged',external_review:{greptile:'required'},historical_reference_retention:{version:1,references:{ref_a:{qid:author.qid,release:'17.27',record_sha256:archived.recordRevision,reference_sha256:b.digest(refs.ref_a),current_sha256:b.digest(refs.ref_a)}}}},
    changedPaths:paths,beforeQuestions:new Map([[author.qid,author],[other.qid,other]]),afterQuestions:new Map([[other.qid,other]]),
    beforeReferenceIds:new Set(Object.keys(refs)),afterReferenceIds:new Set(Object.keys(refs)),
    beforeConsumers:referenceConsumers(new Map([[author.qid,author],[other.qid,other]])),afterConsumers:referenceConsumers(new Map([[other.qid,other]])),
    beforeRefsText:refsSource(refs),afterRefsText:refsSource(refs),beforeVersions:versions('17.27'),afterVersions:versions('17.28'),
    baseRevisionManifestText:wrap('manifest',base),baseRevisionHistoryText:wrap('history',[]),afterRevisionHistoryText:wrap('history',[archived]),referenceReviewReports:new Map()};
}
function editHistory(input,change){const value=parsePublishedSnapshot(input.afterRevisionHistoryText,'history');change(value);input.afterRevisionHistoryText=wrap('history',value);}
function editCurrentCard(input){const refs=JSON.parse(input.afterRefsText.slice('const refsDB = '.length,-2));refs.ref_a.resumo+=' repaired';input.afterRefsText=refsSource(refs);input.manifest.historical_reference_retention.references.ref_a.current_sha256=b.digest(refs.ref_a);return refs.ref_a;}
function addReviews(input,current){
  const decl=input.manifest.historical_reference_retention.references.ref_a;
  const axes={evidencia:'VERIFICADA',pendencia:'NENHUMA',veredito:'aprovada',publicacao:'LIBERADA'};
  for(const[role,who]of[['author_review','fixture-author'],['independent_review','fixture-peer']]){
    const path='docs/editorial/reviews/2026-11-15/'+who+'.json';
    const report={reviewer:who,referenceId:'ref_a',version:{referenceId:'ref_a',sortedCompactPythonSHA256:b.digest(current).slice(7),orderedCompactPythonSHA256:rawHash(JSON.stringify(current)),fullLiteral:current},gate:{evidence:axes.evidencia,pending:axes.pendencia,verdict:axes.veredito,publicationAuthorization:axes.publicacao},wholeCardFieldCoverage:fields.map(field=>({field}))};
    const raw=JSON.stringify(report);input.referenceReviewReports.set(path,raw);
    decl[role]={...axes,report_path:path,report_sha256:rawHash(raw),version_pointer:'/version',gate_pointer:'/gate'};
  }
}
function editReview(input,role,change){const descriptor=input.manifest.historical_reference_retention.references.ref_a[role],report=JSON.parse(input.referenceReviewReports.get(descriptor.report_path));change(report);const raw=JSON.stringify(report);input.referenceReviewReports.set(descriptor.report_path,raw);descriptor.report_sha256=rawHash(raw);}
function addTransport(input,role){
  const descriptor=input.manifest.historical_reference_retention.references.ref_a[role],receipt=JSON.parse(input.referenceReviewReports.get(descriptor.report_path));
  const sourcePath=descriptor.report_path.replace('.json','-frozen-source.json');
  const source={reviewer:receipt.reviewer,cards:[{id:'ref_a',card:receipt.version.fullLiteral,gate:receipt.gate}]},raw=JSON.stringify(source);
  input.referenceReviewReports.set(sourcePath,raw);
  editReview(input,role,report=>{report.transport={report_path:sourcePath,report_sha256:rawHash(raw),record_pointer:'/cards/0',card_pointer:'/cards/0/card',gate_pointer:'/cards/0/gate'};});
  return sourcePath;
}
const codes=input=>validateBatch(input).map(error=>error.code);

test('published wrappers are parsed as JSON without executing PR code',()=>{
  assert.deepEqual(parsePublishedSnapshot(wrap('history',[]),'history'),[]);
  globalThis.__nqRetentionExecuted=false;
  assert.throws(()=>parsePublishedSnapshot(wrap('history',[]).replace('const history=[]','const history=(globalThis.__nqRetentionExecuted=true,[])'),'history'));
  assert.equal(globalThis.__nqRetentionExecuted,false);delete globalThis.__nqRetentionExecuted;
  assert.throws(()=>parsePublishedSnapshot(wrap('history',[]).replace("'use strict';","'use strict';dangerous();"),'history'));
});
test('authenticates an unchanged retained card against the base author, full card and four source profiles',()=>{
  const input=fixture(),proof=validateHistoricalReferenceRetention(input);
  assert.deepEqual(validateManifest(input.manifest,input.manifestPath).errors,[]);
  assert.deepEqual(proof.errors,[]);assert.equal(proof.consumers.get('ref_a').size,1);
  assert.deepEqual(validateBatch(input),[]);
  delete input.manifest.historical_reference_retention;
  assert.ok(codes(input).includes('ORPHAN_REFERENCE'));
});
test('a missing trusted base or head snapshot fails closed and never exempts an orphan',()=>{
  for(const key of['baseRevisionManifestText','baseRevisionHistoryText','afterRevisionHistoryText']){
    const input=fixture();delete input[key];
    assert.ok(codes(input).includes('HISTORICAL_REFERENCE'));assert.ok(codes(input).includes('ORPHAN_REFERENCE'));
    assert.equal(validateHistoricalReferenceRetention(input).consumers.size,0);
  }
});
test('a new reference cannot be disguised as retained history',()=>{
  const input=fixture();input.beforeReferenceIds.delete('ref_a');
  assert.ok(codes(input).includes('HISTORICAL_REFERENCE'));assert.ok(codes(input).includes('ORPHAN_REFERENCE'));
});
test('a forged head record with self-consistent author and card hashes is not a published base revision',()=>{
  const input=fixture();editHistory(input,history=>{const entry=history[0];entry.author.q+=' invented';entry.authorRevision=b.digest(entry.author);entry.recordRevision=b.digest({authorRevision:entry.authorRevision,referenceRevisions:entry.referenceRevisions});input.manifest.historical_reference_retention.references.ref_a.record_sha256=entry.recordRevision;});
  assert.match(validateHistoricalReferenceRetention(input).errors.map(e=>e.message).join('\n'),/not a literal published base revision/);
  assert.ok(codes(input).includes('ORPHAN_REFERENCE'));
});
test('all four source hashes and literal source profiles are required, not merely a record hash',()=>{
  for(const change of[entry=>{delete entry.sources.offline;},entry=>{entry.sources.study.a=1;},entry=>{entry.sources.study.a=1;entry.sourceRevisions.study=b.digest(entry.sources.study);},entry=>{entry.sourceRevisions.exam='sha256:'+'0'.repeat(64);}]){
    const input=fixture();editHistory(input,history=>change(history[0]));
    assert.notDeepEqual(validateHistoricalReferenceRetention(input).errors,[]);assert.ok(codes(input).includes('ORPHAN_REFERENCE'));
  }
});
test('a historical author must actually cite the declared complete reference card',()=>{
  for(const change of[entry=>{entry.author.refs=[];},entry=>{delete entry.references.ref_a.curiosidade;},entry=>{entry.referenceRevisions.ref_a='sha256:'+'0'.repeat(64);}]){
    const input=fixture();editHistory(input,history=>change(history[0]));assert.ok(codes(input).includes('HISTORICAL_REFERENCE'));
  }
});
test('a changed current card requires its own two approved complete exact current reviews',()=>{
  const input=fixture(),current=editCurrentCard(input);
  assert.ok(codes(input).includes('REFERENCE_REVIEW_GATE'));assert.ok(codes(input).includes('ORPHAN_REFERENCE'));
  addReviews(input,current);
  assert.deepEqual(validateHistoricalReferenceRetention(input).errors,[]);
  assert.equal(validateHistoricalReferenceRetention(input).consumers.get('ref_a').size,1);
  assert.equal(historicalReferenceReviewPaths(input.manifest).length,2);
});
test('old-card approval, omitted field coverage, identical reviewers or a blocked gate cannot approve a repaired card',()=>{
  for(const change of[report=>{report.version.sortedCompactPythonSHA256='0'.repeat(64);},report=>{report.version.fullLiteral.resumo='Wrong literal';},report=>{report.wholeCardFieldCoverage.pop();},report=>{report.reviewer='fixture-author';},report=>{report.gate.pending='DECISIVA';},report=>{report.gate.publicationAuthorization='BLOQUEADA';}]){
    const input=fixture(),current=editCurrentCard(input);addReviews(input,current);editReview(input,'independent_review',change);
    assert.notDeepEqual(validateHistoricalReferenceRetention(input).errors,[]);assert.equal(validateHistoricalReferenceRetention(input).consumers.size,0);assert.ok(codes(input).includes('ORPHAN_REFERENCE'));
  }
});
test('unsafe review paths, changed report bytes and current card edits after review fail closed',()=>{
  for(const change of[input=>{input.manifest.historical_reference_retention.references.ref_a.independent_review.report_path='../secret.json';},input=>{const review=input.manifest.historical_reference_retention.references.ref_a.independent_review;input.referenceReviewReports.set(review.report_path,input.referenceReviewReports.get(review.report_path)+' ');},input=>{editCurrentCard(input);}]){
    const input=fixture(),current=editCurrentCard(input);addReviews(input,current);change(input);
    assert.notDeepEqual(validateHistoricalReferenceRetention(input).errors,[]);assert.ok(codes(input).includes('ORPHAN_REFERENCE'));
  }
});
test('an invalid retention declaration grants no exemptions to other entries',()=>{
  const input=fixture();input.manifest.historical_reference_retention.references.ref_b=copy(input.manifest.historical_reference_retention.references.ref_a);
  assert.notDeepEqual(validateHistoricalReferenceRetention(input).errors,[]);assert.equal(validateHistoricalReferenceRetention(input).consumers.size,0);
});
test('transport receipts bind the exact frozen own-card literal and gate instead of inventing a new review',()=>{
  const input=fixture(),current=editCurrentCard(input);addReviews(input,current);addTransport(input,'author_review');addTransport(input,'independent_review');
  assert.deepEqual(validateHistoricalReferenceRetention(input).errors,[]);
  const source=addTransport(input,'independent_review');input.referenceReviewReports.delete(source);
  assert.ok(codes(input).includes('REFERENCE_REVIEW_TRANSPORT'));assert.ok(codes(input).includes('ORPHAN_REFERENCE'));
});
test('transport cannot replace a card gate with a question gate, change the source literal, or upgrade partial evidence',()=>{
  for(const change of[(input,sourcePath)=>{editReview(input,'independent_review',report=>{report.transport.gate_pointer='/questions/0/gate';});},(input,sourcePath)=>{const source=JSON.parse(input.referenceReviewReports.get(sourcePath));source.cards[0].card.conclusao+=' changed';const raw=JSON.stringify(source);input.referenceReviewReports.set(sourcePath,raw);editReview(input,'independent_review',report=>{report.transport.report_sha256=rawHash(raw);});},(input,sourcePath)=>{const source=JSON.parse(input.referenceReviewReports.get(sourcePath));source.cards[0].gate.evidence='PARCIALMENTE VERIFICADA';source.cards[0].gate.pending='NÃO DECISIVA';const raw=JSON.stringify(source);input.referenceReviewReports.set(sourcePath,raw);editReview(input,'independent_review',report=>{report.transport.report_sha256=rawHash(raw);});}]){
    const input=fixture(),current=editCurrentCard(input);addReviews(input,current);const source=addTransport(input,'independent_review');change(input,source);
    assert.ok(codes(input).includes('REFERENCE_REVIEW_TRANSPORT'));assert.ok(codes(input).includes('ORPHAN_REFERENCE'));
  }
});
test('two differently named transport receipts cannot manufacture independence from one original card gate',()=>{
  const input=fixture(),current=editCurrentCard(input);addReviews(input,current);const shared=addTransport(input,'author_review');
  const original=JSON.parse(input.referenceReviewReports.get(input.manifest.historical_reference_retention.references.ref_a.author_review.report_path));
  editReview(input,'independent_review',report=>{report.transport=copy(original.transport);});
  assert.ok(input.referenceReviewReports.has(shared));
  assert.ok(codes(input).includes('REFERENCE_REVIEW_SCOPE'));assert.ok(codes(input).includes('ORPHAN_REFERENCE'));
});
test('rolling back a changed base card to an older published historical literal still needs new exact full-card reviews',()=>{
  const input=fixture(),history=parsePublishedSnapshot(input.afterRevisionHistoryText,'history');history[0].release='17.26';
  input.baseRevisionHistoryText=wrap('history',history);input.afterRevisionHistoryText=wrap('history',history);
  input.manifest.historical_reference_retention.references.ref_a.release='17.26';
  const original=JSON.parse(input.beforeRefsText.slice('const refsDB = '.length,-2)),changed=copy(original);changed.ref_a.resumo+=' base repaired body';
  input.beforeRefsText=refsSource(changed);input.baseRevisionManifestText=wrap('manifest',b.build([...input.beforeQuestions.values()],changed,'17.27'));
  assert.ok(codes(input).includes('REFERENCE_REVIEW_GATE'));assert.ok(codes(input).includes('ORPHAN_REFERENCE'));
  addReviews(input,original.ref_a);
  assert.deepEqual(validateHistoricalReferenceRetention(input).errors,[]);
});

test('CLI reads the authenticated snapshots from the selected git base and head, not working-tree data',async()=>{
  const input=fixture(),repo=await mkdtemp(path.join(tmpdir(),'nq-history-retention-'));
  const git=args=>{const result=spawnSync('git',args,{cwd:repo,encoding:'utf8'});assert.equal(result.status,0,result.stderr);return result.stdout.trim();};
  const write=async(relative,text)=>{const file=path.join(repo,relative);await mkdir(path.dirname(file),{recursive:true});await writeFile(file,text);};
  const versionFiles=async version=>{await write('version.json',JSON.stringify({version}));await write('sw.js',`// NefroQuest Service Worker — v${version}\nconst CACHE = 'nefroquest-v${version}';\n`);await write('index.html',`release: 'nefroquest@${version}'\n`);};
  const topicText=questions=>'const topics = [\n'+[...questions.values()].map(q=>'  '+JSON.stringify(q)+',').join('\n')+'\n];\n';
  git(['init']);git(['config','user.email','test@example.test']);git(['config','user.name','Technical fixture']);
  await write('data/topics.js',topicText(input.beforeQuestions));await write('data/refs.js',input.beforeRefsText);
  await write('data/question-revision-manifest.js',input.baseRevisionManifestText);await write('data/question-revision-history.js',input.baseRevisionHistoryText);await versionFiles('17.27');
  git(['add','.']);git(['commit','-m','trusted base']);const base=git(['rev-parse','HEAD']);
  await write('data/topics.js',topicText(input.afterQuestions));await write('data/question-revision-history.js',input.afterRevisionHistoryText);await versionFiles('17.28');await write(input.manifestPath,JSON.stringify(input.manifest));
  git(['add','.']);git(['commit','-m','preserve historical consumer']);const head=git(['rev-parse','HEAD']);
  await write('data/question-revision-history.js','working tree deliberately invalid');
  const cli=fileURLToPath(new URL('../../scripts/editorial-batch-validator.mjs',import.meta.url));
  const run=()=>spawnSync(process.execPath,[cli,'--base',base,'--head',git(['rev-parse','HEAD']),'--cwd',repo],{cwd:repo,encoding:'utf8'});
  const good=run();assert.equal(good.status,0,good.stderr||good.stdout);assert.match(good.stdout,/validation passed/);
  editHistory(input,history=>{history[0].sources.study.a=1;});await write('data/question-revision-history.js',input.afterRevisionHistoryText);git(['add','.']);git(['commit','-m','tampered archived profile']);
  const bad=run();assert.equal(bad.status,1);assert.match(bad.stderr,/HISTORICAL_REFERENCE/);assert.match(bad.stderr,/ORPHAN_REFERENCE/);
  assert.notEqual(git(['rev-parse','HEAD']),head);
});
