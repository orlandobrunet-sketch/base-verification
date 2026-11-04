import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {validateManifest} from '../../scripts/editorial-batch/manifest.mjs';
import {validateBatch} from '../../scripts/editorial-batch/rules.mjs';
import {referenceConsumers,referenceDigest} from '../../scripts/editorial-batch/references.mjs';
import {CHAMBER_CASES,CHAMBER_SOURCE,chamberLFDigest,parseChamberSources} from '../../scripts/editorial-batch/chamber.mjs';

// Technical fixtures: these are neither clinical reviews nor real approvals.
const axes={evidencia:'VERIFICADA',pendencia:'NENHUMA',veredito:'aprovada',publicacao:'LIBERADA'};
const card=label=>({label,url:'https://example.test/reference',journal:'Fixture',ano:2026,tipo:'Fixture',badge:'REVIEW',badgeColor:'#8b5cf6',impacto:'Fixture',icon:'Fixture',resumo:'Fixture',conclusao:'Fixture',curiosidade:'Fixture'});
const registry=cards=>'const refsDB = {\n'+Object.entries(cards).map(([id,card])=>'  '+JSON.stringify(id)+':'+JSON.stringify(card)+',').join('\n')+'\n};\n';
const source=()=>`const CASES = [\n${CHAMBER_CASES.map(id=>`{ id:'${id}', build:_buildFixture },`).join('\n')}\n];\nfunction _appendCaseSources(card, kase) {\n const ids = ['common'];\n if (kase.id === 'aldric') ids.push('new_card');\n const section = card.querySelector('.ab-refs');\n}`;
const versions=v=>({json:v,cache:v,comment:v,sentry:v});
function fixture(){
 const path='docs/editorial/review-batches/CHAMBER-FIXTURE.json',report='docs/superpowers/specs/chamber-fixture.md',js=source(),hash=chamberLFDigest(js);
 const cases=Object.fromEntries(CHAMBER_CASES.map(id=>[id,{...axes,references:['common',...(id==='aldric'?['new_card']:[])]}]));
 const questions=new Map([['11111111',{qid:'11111111',q:'Fixture',opts:['A','B','C','D'],ans:0,exp:'Fixture',cat:'fixture',diff:'medium',refs:['common']}]]);
 const allowed=[path,report,CHAMBER_SOURCE,'data/refs.js','version.json','sw.js','index.html'];
 const before={common:card('Existing')},after={...before,new_card:card('New')};
 const ownReview={reviewer:'Technical fixture only',source_lf_sha256:hash,references_lf_sha256:chamberLFDigest(registry(after)),cases};
 const reportText='Technical fixture only\n```nq-chamber-review\n'+JSON.stringify(ownReview)+'\n```\n';
 return {manifestPath:path,manifest:{batch:'CHAMBER-FIXTURE',chamber_only:true,change_type:'medical_editorial',expected_version:'16.66',allowed_files:allowed,questions:{},expected_question_delta:0,refs_policy:'declared',external_review:{greptile:'required',fallback_reviewer:null},references:{new_card:{action:'add',after_sha256:referenceDigest(after.new_card),consumers:['aldric']}},chamber:{source_lf_sha256:hash,report_path:report,report_lf_sha256:chamberLFDigest(reportText),cases}},changedPaths:allowed,beforeQuestions:questions,afterQuestions:questions,beforeReferenceIds:new Set(['common']),afterReferenceIds:new Set(['common','new_card']),beforeConsumers:referenceConsumers(questions),afterConsumers:referenceConsumers(questions),beforeTopicsText:'unchanged bytes',afterTopicsText:'unchanged bytes',beforeRefsText:registry(before),afterRefsText:registry(after),beforeVersions:versions('16.65'),afterVersions:versions('16.66'),chamberSource:js,chamberReport:reportText};
}
const codes=input=>validateBatch(input).map(e=>e.code);
test('Câmara additions require an explicit namespace and actual reviewed consumers, without approving main questions',()=>{
 const input=fixture();assert.deepEqual(validateManifest(input.manifest,input.manifestPath).errors,[]);assert.deepEqual(validateBatch(input),[]);assert.deepEqual(input.manifest.questions,{});
 delete input.manifest.chamber_only;assert.notDeepEqual(validateManifest(input.manifest,input.manifestPath).errors,[]);assert.ok(codes(input).includes('ORPHAN_REFERENCE'));
});
test('Câmara mode rejects mixed question/reference-only batches and incomplete or blocked own reviews',()=>{
 for(const change of [m=>m.reference_only=true,m=>m.change_type='technical_only',m=>m.expected_question_delta=1,m=>m.questions={'11111111':{action:'reviewed_unchanged',preserve_fsrs:true,...axes}},m=>delete m.chamber.cases.aldric,m=>m.chamber.cases.aldric.publicacao='BLOQUEADA',m=>m.chamber.cases.aldric.pendencia='DECISIVA',m=>m.references.new_card.action='update',m=>m.references.new_card.consumers=['aldric','aldric'],m=>m.chamber.report_path='../escape.md']){
  const input=fixture();change(input.manifest);assert.notDeepEqual(validateManifest(input.manifest,input.manifestPath).errors,[]);
 }
});
test('Câmara cannot change main-bank bytes or existing shared reference cards',()=>{
 const input=fixture();input.afterTopicsText+='\n';assert.ok(codes(input).includes('CHAMBER_SCOPE'));
 const changed=fixture();changed.afterRefsText=registry({common:card('Modified existing'),new_card:card('New')});assert.ok(codes(changed).includes('CHAMBER_SCOPE'));
});
test('Câmara requires exact source, report, case bindings, card hashes and all 12 typed fields',()=>{
 for(const change of [i=>i.chamberSource+='\n// changed',i=>i.chamberReport+='stale',i=>i.manifest.chamber.cases.aldric.references=['common'],i=>i.manifest.references.new_card.after_sha256='sha256:'+'0'.repeat(64),i=>i.manifest.references.new_card.consumers=['mara'],i=>{const c=card('New');delete c.curiosidade;i.afterRefsText=registry({common:card('Existing'),new_card:c});i.manifest.references.new_card.after_sha256=referenceDigest(c);}]){
  const input=fixture();change(input);assert.ok(codes(input).includes('CHAMBER_SCOPE'));
 }
});
test('Câmara refuses undeclared additions and missing, fictitious or unrendered references',()=>{
 const undeclared=fixture();undeclared.afterRefsText=registry({common:card('Existing'),new_card:card('New'),unused:card('Unused')});undeclared.afterReferenceIds.add('unused');assert.ok(codes(undeclared).includes('CHAMBER_SCOPE'));assert.ok(codes(undeclared).includes('ORPHAN_REFERENCE'));
 const missing=fixture();missing.afterRefsText=registry({new_card:card('New')});missing.afterReferenceIds.delete('common');assert.ok(codes(missing).includes('CHAMBER_SCOPE'));
 const fake=fixture();fake.manifest.references.new_card.consumers=['kael'];assert.ok(codes(fake).includes('CHAMBER_SCOPE'));
});
test('material card changes invalidate the own clinical report even when the manifest card hash is refreshed',()=>{
 const input=fixture(),changed=card('New');changed.resumo='Materially different claim';input.afterRefsText=registry({common:card('Existing'),new_card:changed});input.manifest.references.new_card.after_sha256=referenceDigest(changed);
 assert.ok(codes(input).includes('CHAMBER_SCOPE'));
});
test('own report must contain a unique structured approval for the exact source, registry and all case bindings',()=>{
 for(const change of [r=>r.source_lf_sha256='0'.repeat(64),r=>r.references_lf_sha256='0'.repeat(64),r=>r.cases.aldric.publicacao='BLOQUEADA',r=>r.cases.aldric.references=['common'],r=>delete r.cases.aldric]){
  const input=fixture(),r=JSON.parse(input.chamberReport.match(/```nq-chamber-review\n([\s\S]*?)\n```/)[1]);change(r);input.chamberReport='```nq-chamber-review\n'+JSON.stringify(r)+'\n```\n';input.manifest.chamber.report_lf_sha256=chamberLFDigest(input.chamberReport);assert.ok(codes(input).includes('CHAMBER_SCOPE'));
 }
 const arbitrary=fixture();arbitrary.chamberReport='Arbitrary text '+arbitrary.manifest.chamber.source_lf_sha256;arbitrary.manifest.chamber.report_lf_sha256=chamberLFDigest(arbitrary.chamberReport);assert.ok(codes(arbitrary).includes('CHAMBER_SCOPE'));
 const duplicate=fixture();duplicate.chamberReport+=duplicate.chamberReport;duplicate.manifest.chamber.report_lf_sha256=chamberLFDigest(duplicate.chamberReport);assert.ok(codes(duplicate).includes('CHAMBER_SCOPE'));
});
test('static consumer parser supports only the actual literal selection grammar and never executes code',()=>{
 const js=source().replace("if (kase.id === 'aldric') ids.push('new_card');", "if (['aldric', 'mara'].includes(kase.id)) ids.push('new_card');\n if (kase.id === 'kael' || kase.id === 'ivar') ids.push('other');");
 const parsed=parseChamberSources(js);assert.deepEqual(parsed.get('aldric'),['common','new_card']);assert.deepEqual(parsed.get('ivar'),['common','other']);
 for(const replacement of ["globalThis.chamberShouldNeverExecute=true;", "if (kase.id === 'unknown') ids.push('new_card');", "if (kase.id === 'aldric') ids.push('common');", "if (true) ids.push('new_card');"]){assert.throws(()=>parseChamberSources(source().replace("if (kase.id === 'aldric') ids.push('new_card');",replacement)));}
 assert.equal(globalThis.chamberShouldNeverExecute,undefined);
 assert.throws(()=>parseChamberSources(source().replace("id:'aldric'","id:'mara'")));
});
test('line-ending normalization preserves exact reviewed versions across checkout platforms',()=>{
 const input=fixture();input.chamberSource=input.chamberSource.replace(/\n/g,'\r\n');input.chamberReport=input.chamberReport.replace(/\n/g,'\r\n');assert.deepEqual(validateBatch(input),[]);
});
test('CLI reads the actual committed chamber and clinical report instead of accepting manifest-only consumer claims',async()=>{
 const input=fixture(),root=await mkdtemp(path.join(tmpdir(),'nq-chamber-gate-'));
 const put=async(file,text)=>{const target=path.join(root,file);await mkdir(path.dirname(target),{recursive:true});await writeFile(target,text);};
 const git=args=>{const r=spawnSync('git',args,{cwd:root,encoding:'utf8'});assert.equal(r.status,0,r.stderr);return r.stdout.trim();};
 const version=async(v)=>{await put('version.json',JSON.stringify({version:v}));await put('sw.js',`// NefroQuest Service Worker — v${v}\nconst CACHE = 'nefroquest-v${v}';\n`);await put('index.html',`release: 'nefroquest@${v}'\n`);};
 git(['init']);git(['config','user.email','test@example.com']);git(['config','user.name','Technical fixture']);
 await put('data/topics.js',`const topics = [\n${JSON.stringify([...input.beforeQuestions.values()][0])},\n];\n`);await put('data/refs.js',input.beforeRefsText);await version('16.65');git(['add','.']);git(['commit','-m','fixture base']);const base=git(['rev-parse','HEAD']);
 await put('data/refs.js',input.afterRefsText);await put(CHAMBER_SOURCE,input.chamberSource);await put(input.manifest.chamber.report_path,input.chamberReport);await put(input.manifestPath,JSON.stringify(input.manifest));await version('16.66');git(['add','.']);git(['commit','-m','fixture chamber']);
 const cli=fileURLToPath(new URL('../../scripts/editorial-batch-validator.mjs',import.meta.url));
 const run=()=>spawnSync(process.execPath,[cli,'--base',base,'--head',git(['rev-parse','HEAD']),'--cwd',root],{cwd:root,encoding:'utf8'});
 const accepted=run();assert.equal(accepted.status,0,accepted.stderr||accepted.stdout);assert.match(accepted.stdout,/Editorial batch validation passed/);
 await put(input.manifest.chamber.report_path,input.chamberReport+' changed');git(['add','.']);git(['commit','-m','fixture stale report']);const stale=run();assert.notEqual(stale.status,0);assert.match(stale.stderr,/CHAMBER_SCOPE/);
});
