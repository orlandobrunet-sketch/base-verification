'use strict';
const {test}=require('node:test'),a=require('node:assert/strict');
const {createAuthority}=require('./owner-authority.cjs');
const {create}=require('../js/normal-authority.js');
const fp=require('../js/cloud-authority.js').fingerprint;
const keys=['nefroquest-stats','nefroquest-achievements','nefroquest-mastered','nq-unlocked-refs','nefroquest-arqui-defeated','nefroquest-hardcore-completed','nefroquest-detailed-stats','nq-acidbase-progress','nefroquest-sr-data','nefroquest-gold-milestone-shown'];
async function fixture(){
 const map=new Map(keys.map((k,i)=>[k,'old-'+i]));let failKey=null,throwAfter=false,owner='u',afterWrite=null;
 const storage={getItem:k=>map.get(k)??null,setItem(k,v){if(k===failKey&&!throwAfter)throw Error('quota');map.set(k,v);afterWrite?.(k);if(k===failKey&&throwAfter)throw Error('after');},removeItem(k){if(k===failKey&&!throwAfter)throw Error('quota');map.delete(k);if(k===failKey&&throwAfter)throw Error('after');}};
 const options={storage,locks:{request:async(k,o,fn)=>fn({})},owner:'u',currentOwner:()=>owner,validateSave:s=>s.saveOwner==='u'&&!!s.journeyId};
 const m=createAuthority(options);await m.acquire();m.initialize({saveOwner:'u',journeyId:'local',character:'nephros',score:30},{articles:[1],knowledge:3});
 const target=Object.fromEntries(keys.map((k,i)=>[k,i%2?null:JSON.stringify({remote:i})]));
 const remote=m.exportCloud().state;remote.save={...remote.save,journeyId:'remote',score:10};remote.collections={articles:[2],knowledge:1};
 const select=()=>m.selectRemoteBranch(remote,{expectedFingerprint:m.fingerprint(),expectedRemoteFingerprint:fp(remote),projection:target,archive:{localProgress:{stats:{gamesPlayed:30}},remoteProgress:{stats:{gamesPlayed:10}}}});
 return {m,map,storage,options,target,remote,select,set failKey(v){failKey=v;},set throwAfter(v){throwAfter=v;},set owner(v){owner=v;},set afterWrite(v){afterWrite=v;}};
}
test('selected remote auxiliary values replace false/empty fields, archive exact prior raw values and clear sync hold',async()=>{
 const f=await fixture();try{const before=Object.fromEntries(keys.map(k=>[k,f.map.get(k)]));const e=f.select();a.equal(e.save.score,10);a.deepEqual(e.collections,{articles:[2],knowledge:1});
  for(const k of keys)a.equal(f.storage.getItem(k),f.target[k]);
  a.deepEqual(e.source.authoritySelections[0].localAuxiliaryRaw,before);a.equal(e.source.auxiliaryProjection,undefined);a.equal(e.source.cloudSyncHold,undefined);a.equal(f.m.writable,true);
 }finally{await f.m.release();}
});
test('failure midway keeps durable intent, blocks game mutation, and reload completes idempotently',async()=>{
 const f=await fixture();try{f.failKey=keys[4];a.throws(f.select,e=>e.code==='AUXILIARY_PENDING');const pending=f.m.load();a.equal(pending.save.journeyId,'remote');a.ok(pending.source.auxiliaryProjection);a.equal(f.m.writable,false);
  a.throws(()=>f.m.commit(d=>d.save.score++),e=>e.code==='AUXILIARY_PENDING');
  f.failKey=null;await f.m.release();await f.m.acquire();const recovered=f.m.resumeAuxiliaryProjection();a.equal(recovered.save.score,10);a.equal(recovered.source.auxiliaryProjection,undefined);a.deepEqual(f.m.resumeAuxiliaryProjection(),recovered);for(const k of keys)a.equal(f.storage.getItem(k),f.target[k]);
 }finally{await f.m.release();}
});
test('throw after successful projection write is confirmed rather than replaying branch rewards',async()=>{
 const f=await fixture();try{f.failKey=keys[2];f.throwAfter=true;const e=f.select();a.equal(e.save.score,10);a.equal(e.collections.knowledge,1);a.equal(e.source.authoritySelections.length,1);}finally{await f.m.release();}
});
test('external auxiliary edit during interrupted projection is preserved and blocks recovery',async()=>{
 const f=await fixture();try{f.failKey=keys[4];a.throws(f.select);f.failKey=null;f.map.set(keys[1],'external-new-value');const before=[...f.map];a.throws(()=>f.m.resumeAuxiliaryProjection(),e=>e.code==='AUXILIARY_CONFLICT');a.deepEqual([...f.map],before);a.equal(f.m.writable,false);}finally{await f.m.release();}
});
test('account switch cannot finish projection for previous owner',async()=>{
 const f=await fixture();try{f.failKey=keys[4];a.throws(f.select);f.failKey=null;f.owner='other';const before=[...f.map];a.throws(()=>f.m.resumeAuxiliaryProjection());a.deepEqual([...f.map],before);}finally{await f.m.release();}
});
test('adapter bootstrap finishes pending projection before making game writable',async()=>{
 const f=await fixture();let normal;try{f.failKey=keys[4];a.throws(f.select);await f.m.release();f.failKey=null;normal=create({...f.options,createAuthority});const e=await normal.bootstrap();a.equal(e.source.auxiliaryProjection,undefined);a.equal(normal.writable,true);a.equal(normal.loadSave().journeyId,'remote');for(const k of keys)a.equal(f.storage.getItem(k),f.target[k]);}finally{if(normal)await normal.release();else await f.m.release();}
});
test('restore swaps archived branch and exact auxiliary bytes, never sums score, preserves current branch and holds upload',async()=>{
 const f=await fixture();try{const before=Object.fromEntries(keys.map(k=>[k,f.map.get(k)]));f.m.startJourney({saveOwner:'u',journeyId:'local-next',character:'nephros',score:5});f.select();
  const restored=f.m.restoreArchivedBranch(0,{expectedFingerprint:f.m.fingerprint(),currentProgress:{stats:{gamesPlayed:10}}});a.equal(restored.save.score,5);a.equal(restored.save.journeyId,'local-next');a.equal(restored.source.transitionJournal.length,1);a.deepEqual(restored.collections,{articles:[1],knowledge:3});for(const k of keys)a.equal(f.storage.getItem(k),before[k]);
  a.equal(restored.source.cloudSyncHold.reason,'restored-archive');a.equal(restored.source.authoritySelections.length,1);a.equal(restored.source.authoritySelections[0].local.save.journeyId,'remote');
  const back=f.m.restoreArchivedBranch(0,{expectedFingerprint:f.m.fingerprint(),currentProgress:{stats:{gamesPlayed:30}}});a.equal(back.save.score,10);a.equal(back.source.authoritySelections.length,1);for(const k of keys)a.equal(f.storage.getItem(k),f.target[k]);
 }finally{await f.m.release();}
});
test('stale or invalid restore and credential-key projection cannot mutate storage',async()=>{
 const f=await fixture();try{f.select();const before=[...f.map];a.throws(()=>f.m.restoreArchivedBranch(0,{expectedFingerprint:'stale',currentProgress:{}}));a.throws(()=>f.m.restoreArchivedBranch(99,{expectedFingerprint:f.m.fingerprint(),currentProgress:{}}));a.deepEqual([...f.map],before);
  a.throws(()=>f.m.selectRemoteBranch(f.remote,{expectedFingerprint:f.m.fingerprint(),expectedRemoteFingerprint:fp(f.remote),projection:{...f.target,token:'secret'}}),e=>e.code==='INVALID_PROJECTION');a.deepEqual([...f.map],before);
 }finally{await f.m.release();}
});

test('projection detects later-key external change and owner switch between writes instead of overwriting them',async()=>{
 for(const mode of ['external','owner']){const f=await fixture();try{
  f.afterWrite=k=>{if(k===keys[0]){if(mode==='external')f.map.set(keys[1],'external-concurrent-change');else f.owner='other';}};
  a.throws(f.select);a.equal(f.storage.getItem(keys[1]),mode==='external'?'external-concurrent-change':'old-1');
  a.equal(f.storage.getItem(keys[2]),'old-2');a.equal(f.m.writable,false);
 }finally{await f.m.release();}}
});
test('oversized old auxiliary snapshot refuses before installing remote or an unrecoverable intent',async()=>{
 const f=await fixture();try{f.map.set(keys[0],'x'.repeat(2000001));const before=[...f.map];a.throws(f.select,e=>e.code==='INVALID_PROJECTION');a.deepEqual([...f.map],before);a.equal(f.m.load().save.journeyId,'local');a.equal(f.m.load().source.auxiliaryProjection,undefined);}finally{await f.m.release();}
});
