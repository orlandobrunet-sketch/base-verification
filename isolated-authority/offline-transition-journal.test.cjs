'use strict';
const {test}=require('node:test'),a=require('node:assert/strict');
const {createAuthority}=require('./owner-authority.cjs');
const copy=v=>structuredClone(v);
async function fixture(){
 const map=new Map();let mode='normal';
 const storage={getItem:k=>map.get(k)??null,setItem(k,v){if(mode==='quota')throw Error('quota');map.set(k,v);if(mode==='after')throw Error('after write');}};
 const make=()=>createAuthority({storage,locks:{request:async(k,o,fn)=>fn({})},owner:'u',currentOwner:()=> 'u',validateSave:s=>s.saveOwner==='u'&&typeof s.journeyId==='string'});
 const m=make();await m.acquire();m.initialize({saveOwner:'u',journeyId:'j0',score:0},{articles:[],knowledge:0});
 return {m,map,make,set mode(v){mode=v;}};
}
function reward(m,id){m.commit(d=>{d.save.score+=10;d.collections.knowledge++;d.collections.articles.push(id);d.receipts.push({id:'reward-'+id,journeyId:d.save.journeyId,phase:'consumed',reward:{article:id,score:10},choice:'accept'});});}
function journey(m,id){m.startJourney({saveOwner:'u',journeyId:id,score:0});}
test('two offline journeys and consumed rewards import in one snapshot without replay; retry/reload stable',async()=>{
 const local=await fixture(),remote=await fixture();try{
  const base=remote.m.fingerprint();reward(local.m,1);journey(local.m,'j1');reward(local.m,2);journey(local.m,'j2');reward(local.m,3);
  const payload=local.m.exportCloud({base});a.equal(payload.transitionPath.length,5);
  const state=remote.m.importCloud(payload);a.equal(state.save.score,10);a.equal(state.collections.knowledge,3);a.deepEqual(state.collections.articles,[1,2,3]);a.equal(state.receipts.length,1);
  a.deepEqual(remote.m.importCloud(payload),state);
  await remote.m.release();await remote.m.acquire();a.deepEqual(remote.m.load(),state);
  a.equal(local.m.load().source.transitionJournal.length,2,'export does not discard evidence');
  a.equal(local.m.acknowledgeCloud(payload.state),true);a.deepEqual(local.m.load().source.transitionJournal,[]);
 }finally{await local.m.release();await remote.m.release();}
});
test('offline reset, new journey and reward never resurrect old collections',async()=>{
 const local=await fixture(),remote=await fixture();try{
  reward(local.m,1);remote.m.importCloud(local.m.exportCloud({base:remote.m.fingerprint()}));
  const base=remote.m.fingerprint();local.m.resetProgress();journey(local.m,'after-reset');reward(local.m,2);
  const result=remote.m.importCloud(local.m.exportCloud({base}));a.deepEqual(result.collections,{articles:[2],knowledge:1});a.equal(result.resetEpoch,2);a.equal(result.receipts[0].id,'reward-2');
 }finally{await local.m.release();await remote.m.release();}
});
test('quota and throw-after-write keep transition and its journal atomic',async()=>{
 const f=await fixture();try{
  const old=f.m.load();f.mode='quota';a.throws(()=>journey(f.m,'new'),e=>e.code==='REFUSED');a.deepEqual(f.m.load(),old);
  f.mode='after';journey(f.m,'new');f.mode='normal';const changed=f.m.load();a.equal(changed.resetEpoch,1);a.equal(changed.source.transitionJournal.length,1);
  a.deepEqual(changed.source.transitionJournal[0].before.save,old.save);a.equal(changed.source.transitionJournal[0].after.save.journeyId,'new');
  a.equal(f.m.acknowledgeCloud(old),false);a.equal(f.m.load().source.transitionJournal.length,1);
 }finally{await f.m.release();}
});
test('omitted, reordered, tampered, wrong-owner and excessive proofs leave entire local authority unchanged',async()=>{
 const local=await fixture(),remote=await fixture();try{
  const base=remote.m.fingerprint();journey(local.m,'one');reward(local.m,1);journey(local.m,'two');reward(local.m,2);
  const proof=local.m.exportCloud({base});
  const variants=[p=>delete p.transitionPath,p=>p.transitionPath.reverse(),p=>p.transitionPath.splice(1,1),p=>p.transitionPath[1].owner='other',p=>p.transitionPath[1].collections.knowledge=999,p=>p.transitionPath.push(copy(p.transitionPath[0])),p=>p.transitionPath=Array(130).fill(copy(p.state))];
  for(const change of variants){const bad=copy(proof);change(bad);const before=[...remote.map];a.throws(()=>remote.m.importCloud(bad));a.deepEqual([...remote.map],before);}
 }finally{await local.m.release();await remote.m.release();}
});
test('journal bound refuses new transition without silently deleting proof; exact acknowledgement unblocks',async()=>{
 const f=await fixture();try{
  for(let i=0;i<64;i++)journey(f.m,'j'+(i+1));const before=f.m.load();a.equal(before.source.transitionJournal.length,64);
  a.throws(()=>journey(f.m,'overflow'),e=>e.code==='OFFLINE_JOURNAL_FULL');a.deepEqual(f.m.load(),before);
  const proof=f.m.exportCloud({base:JSON.stringify(before.source.transitionJournal[0].before)});a.ok(proof.transitionPath.length<=129);
  a.equal(f.m.acknowledgeCloud(proof.state),true);journey(f.m,'after-confirmed-sync');a.equal(f.m.load().source.transitionJournal.length,1);
 }finally{await f.m.release();}
});
test('real divergence cannot be disguised as an offline descendant or new base',async()=>{
 const local=await fixture(),remote=await fixture();try{
  const base=remote.m.fingerprint();reward(remote.m,4);journey(local.m,'offline');reward(local.m,5);
  const before=remote.m.load();a.throws(()=>remote.m.importCloud(local.m.exportCloud({base})),e=>e.code==='CLOUD_CONFLICT');a.deepEqual(remote.m.load(),before);
  a.throws(()=>local.m.exportCloud({base:remote.m.fingerprint()}),e=>e.code==='CLOUD_CONFLICT');
 }finally{await local.m.release();await remote.m.release();}
});
