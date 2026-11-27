'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
require('../../js/answer-presentation.js');
const revisions=require('../../js/question-revisions.js'),builder=require('../../tools/build-question-revision-manifest.cjs');
const source=fs.readFileSync(path.join(__dirname,'../../js/utils.js'),'utf8'),start=source.indexOf('function _unlockRefsFromQuestion('),end=source.indexOf('function _buildBibItems()',start);
function fixture(){
  const author={qid:'a1111111',q:'Choose a technical token.',opts:['Round','Square','Flat','Sharp'],ans:0,exp:'Technical explanation.',cat:'technical',diff:'medium',refs:['legitimate','missing-body']};
  const refs={legitimate:{label:'Technical card',resumo:'Technical fixture'}},manifest=builder.build([author],refs,'17.28'),projections=builder.sources(author,0);
  const catalog=revisions.createCatalog({manifest,history:[],authors:[author],sources:Object.fromEntries(Object.entries(projections).map(([profile,q])=>[profile,[q]])),references:refs});
  const owned=new Set(),writes=[],ctx={Set,console,window:{NQQuestionRevisionManifest:manifest,NQQuestionRevisions:revisions,questionRevisionCatalog:catalog},_getUnlockedRefs:()=>owned,_nqUtilsProgressStorage:()=>({setItem:(key,value)=>writes.push({key,value})}),UNLOCKED_REFS_KEY:'nq-unlocked-refs',_bibItems:[]};
  vm.createContext(ctx);vm.runInContext(source.slice(start,end)+'\n;globalThis.unlock=_unlockRefsFromQuestion;',ctx);
  return{ctx,manifest,owned,writes,qid:author.qid};
}
test('a committed current answer synchronously retains only its published non-null reference discoveries without a library module',()=>{
  const f=fixture();f.ctx.unlock(['legitimate','cmv_kdigo_tx','forged','missing-body'],f.qid);
  assert.deepEqual([...f.owned],['legitimate']);assert.equal(f.writes.length,1);assert.deepEqual(JSON.parse(f.writes[0].value),['legitimate']);
  f.ctx.unlock(['legitimate'],f.qid);assert.equal(f.writes.length,1);
});
test('missing manifest, validated runtime catalog, digest API or current question identity never grants discovery',()=>{
  for(const change of [f=>{delete f.ctx.window.NQQuestionRevisionManifest;},f=>{delete f.ctx.window.questionRevisionCatalog;},f=>{delete f.ctx.window.NQQuestionRevisions;},f=>{f.qid='retired-old-qid';},f=>{delete f.qid;}]){
    const f=fixture();change(f);f.ctx.unlock(['legitimate','cmv_kdigo_tx'],f.qid);assert.deepEqual([...f.owned],[]);assert.deepEqual(f.writes,[]);
  }
});
test('a forged reference injected into the public manifest cannot inherit the separately validated catalog binding',()=>{
  for(const recompute of [false,true]){
    const f=fixture(),record=f.manifest.current[f.qid];record.referenceRevisions.forged='sha256:'+'a'.repeat(64);
    if(recompute)record.recordRevision=revisions.digest({authorRevision:record.authorRevision,referenceRevisions:record.referenceRevisions});
    f.ctx.unlock(['legitimate','forged'],f.qid);assert.deepEqual([...f.owned],[]);assert.deepEqual(f.writes,[]);
  }
});
test('the native accepted-answer callback captures the question identity before a later current-question change',()=>{
  const game=fs.readFileSync(path.join(__dirname,'../../js/game.js'),'utf8'),a=game.indexOf('// Desbloquear refs do Grimório ao acertar'),z=game.indexOf('const st=total();',a),callbacks=[],calls=[];
  const ctx=vm.createContext({recordsProgress:true,isCorrect:true,state:{current:{id:'original-id',r:['legitimate']}},_recordCharacterProgress:fn=>callbacks.push(fn),_unlockRefsFromQuestion:(keys,qid)=>calls.push({keys,qid})});
  vm.runInContext(game.slice(a,z),ctx);ctx.state.current={id:'later-id',r:['forged']};assert.deepEqual(calls,[]);callbacks[0]();assert.deepEqual(calls,[{keys:['legitimate'],qid:'original-id'}]);
});
