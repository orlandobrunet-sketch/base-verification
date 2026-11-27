'use strict';
const {test}=require('node:test'),a=require('node:assert/strict'),fs=require('node:fs');
const {PGlite}=require('../tests/payments/node_modules/@electric-sql/pglite');
const {createAuthority}=require('../js/owner-authority.js');
async function authority(){const map=new Map(),m=createAuthority({storage:{getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)},locks:{request:async(k,o,fn)=>fn({})},owner:'u',currentOwner:()=> 'u',validateSave:s=>s.saveOwner==='u'&&!!s.journeyId});await m.acquire();m.initialize({saveOwner:'u',journeyId:'a',score:0});return m;}
test('actual browser authority export is accepted identically by SQL and another client, once only',async()=>{
 const db=new PGlite(),local=await authority(),other=await authority();try{
  await db.exec("CREATE ROLE anon;CREATE ROLE authenticated;CREATE TABLE profiles(id text PRIMARY KEY,game_progress jsonb DEFAULT '{}');INSERT INTO profiles VALUES('u','{}');");
  for(const file of ['20261111143230_protect_cloud_progress_version.sql','20261115150000_guard_owner_authority_progress.sql'])await db.exec(fs.readFileSync(require.resolve('../supabase/migrations/'+file),'utf8'));
  const initial=local.exportCloud();await db.query("UPDATE profiles SET game_progress=$1,game_progress_version=1 WHERE id='u'",[{ownerAuthority:initial}]);
  const base=local.fingerprint();
  local.startJourney({saveOwner:'u',journeyId:'b',score:0});
  local.commit(d=>{d.save.score=10;d.collections.knowledge=1;d.receipts.push({id:'b1',journeyId:'b',phase:'consumed',reward:{points:10}});});
  local.resetProgress();local.startJourney({saveOwner:'u',journeyId:'c',score:0});
  local.commit(d=>{d.save.score=20;d.collections.knowledge=2;d.receipts.push({id:'c1',journeyId:'c',phase:'consumed',reward:{points:20}});});
  const proof=local.exportCloud({base});a.equal(proof.transitionPath.length,7);
  for(const corrupt of [p=>p.transitionPath.splice(1,1),p=>p.transitionPath[1].owner='x',p=>p.transitionPath[p.transitionPath.length-1]=structuredClone(initial.state)]){
   const bad=structuredClone(proof);corrupt(bad);
   a.throws(()=>other.importCloud(bad));
   await a.rejects(db.query("UPDATE profiles SET game_progress=$1,game_progress_version=2 WHERE id='u'",[{ownerAuthority:bad}]));
  }
  await db.query("UPDATE profiles SET game_progress=$1,game_progress_version=2 WHERE id='u'",[{ownerAuthority:proof}]);
  other.importCloud(proof);a.deepEqual(other.exportCloud().state,proof.state);
  await db.query("UPDATE profiles SET game_progress=$1,game_progress_version=3 WHERE id='u'",[{ownerAuthority:proof}]);
  other.importCloud(proof);
  const row=(await db.query("SELECT game_progress FROM profiles WHERE id='u'")).rows[0];
  a.deepEqual(row.game_progress.ownerAuthority.state,other.exportCloud().state);
  a.equal(other.load().save.score,20);a.equal(other.load().collections.knowledge,2);a.equal(other.load().receipts.length,1);
 }finally{await local.release();await other.release();await db.close();}
});
