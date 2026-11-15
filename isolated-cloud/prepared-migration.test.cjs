'use strict';
const {test}=require('node:test'),a=require('node:assert/strict'),fs=require('node:fs');
const {PGlite}=require('../tests/payments/node_modules/@electric-sql/pglite');
const read=p=>fs.readFileSync(require.resolve(p),'utf8');
const migration=read('../supabase/migrations/20261115150000_guard_owner_authority_progress.sql');
test('prepared migration contains exactly the separately audited guard',()=>{
 a.ok(migration.includes(read('./owner-authority-guard.sql')));
 a.match(migration,/^COMMIT;$/m);
});
test('prepared migration refuses missing CAS and leaves no partial guard after rollback',async()=>{
 const db=new PGlite();try{
  await db.exec('CREATE ROLE anon;CREATE ROLE authenticated;CREATE TABLE profiles(id text PRIMARY KEY,game_progress jsonb);');
  await a.rejects(db.exec(migration),/requires enabled progress version CAS trigger/);
  await db.exec('ROLLBACK;');
  const rows=(await db.query("SELECT oid FROM pg_proc WHERE proname='guard_owner_authority_progress'")).rows;
  a.equal(rows.length,0);
 }finally{await db.close();}
});
test('prepared migration installs after CAS and rejects offline multi-epoch/reward transitions without changing remote data',async()=>{
 const db=new PGlite();try{
  await db.exec("CREATE ROLE anon;CREATE ROLE authenticated;CREATE TABLE profiles(id text PRIMARY KEY,game_progress jsonb DEFAULT '{}');INSERT INTO profiles VALUES('u','{}');");
  await db.exec(read('../supabase/migrations/20261111143230_protect_cloud_progress_version.sql'));
  await db.exec(migration);
  const initial={protocol:1,owner:'u',resetEpoch:0,save:{saveOwner:'u',journeyId:'a'},collections:{articles:[1],knowledge:2},receipts:[],tombstone:null};
  const payload=(state,base)=>({ownerAuthority:{format:'nq-owner-authority-v1',state,base}});
  await db.query("UPDATE profiles SET game_progress=$1,game_progress_version=1 WHERE id='u'",[payload(initial,null)]);
  for(const scenario of ['multi-journey','reset-and-new-journey','transition-and-reward']){
   const state=structuredClone(initial);state.resetEpoch=scenario==='transition-and-reward'?1:2;
   state.save.journeyId='b';state.tombstone={reason:'journey',epoch:state.resetEpoch};
   if(scenario==='reset-and-new-journey')state.collections={articles:[],knowledge:0};
   if(scenario==='transition-and-reward')state.receipts=[{id:'pending',journeyId:'b',phase:'earned'}];
   await a.rejects(db.query("UPDATE profiles SET game_progress=$1,game_progress_version=2 WHERE id='u'",[payload(state,JSON.stringify(initial))]),e=>e.code==='40001',scenario);
   const row=(await db.query("SELECT game_progress,game_progress_version FROM profiles WHERE id='u'")).rows[0];
   a.deepEqual(row.game_progress,payload(initial,null));a.equal(row.game_progress_version,1);
  }
 }finally{await db.close();}
});
