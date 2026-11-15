'use strict';
const {test}=require('node:test'),a=require('node:assert/strict'),fs=require('node:fs');
const {PGlite}=require('../tests/payments/node_modules/@electric-sql/pglite');
const helper=require('../js/cloud-authority.js');
const clone=x=>JSON.parse(JSON.stringify(x));
test('real embedded PostgreSQL guard rejects downgrade, receipt rewriting, stale reset, malformed data and divergent ancestor',async()=>{
 const db=new PGlite();try{
 await db.exec(`CREATE ROLE anon;CREATE ROLE authenticated;CREATE TABLE public.profiles(id text PRIMARY KEY,game_progress jsonb DEFAULT '{}');INSERT INTO profiles VALUES('u','{}');`);
 await db.exec(fs.readFileSync(require.resolve('../supabase/migrations/20261111143230_protect_cloud_progress_version.sql'),'utf8'));
 await db.exec(fs.readFileSync(require.resolve('./owner-authority-guard.sql'),'utf8'));
 await db.exec(`ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;CREATE POLICY owner_only ON profiles FOR ALL TO authenticated USING(id=current_setting('app.owner')) WITH CHECK(id=current_setting('app.owner'));GRANT SELECT,UPDATE ON profiles TO authenticated;SET ROLE authenticated;SET app.owner='u';`);
 let version=0,prior=null;
 const envelope=state=>({ownerAuthority:{format:'nq-owner-authority-v1',base:prior===null?null:JSON.stringify(prior),state}});
 const write=async payload=>{await db.query('UPDATE profiles SET game_progress=$1,game_progress_version=$2 WHERE id=$3',[payload,version+1,'u']);version++;prior=clone(payload.ownerAuthority.state);};
 let state={protocol:1,owner:'u',resetEpoch:0,save:{saveOwner:'u',journeyId:'j',character:'nephros',difficulty:'normal',gold:20},collections:{articles:[1],knowledge:2},receipts:[{id:'r',journeyId:'j',phase:'earned'}],tombstone:null};
 await write(envelope(state));
 await a.rejects(write({save:{}}),e=>e.code==='40001');
 for(const change of [s=>s.owner='other',s=>s.receipts.push(clone(s.receipts[0])),s=>s.collections.articles=[1,1],s=>s.collections.knowledge=-1,s=>s.collections.knowledge='2',s=>s.resetEpoch='0',s=>s.receipts[0].id=1]){const bad=clone(state);change(bad);await a.rejects(write(envelope(bad)),e=>e.code==='22023');}
 state.receipts[0]={...state.receipts[0],phase:'prepared',reward:{kind:'article',articleIndex:2}};await write(envelope(state));
 let bad=clone(state);bad.receipts[0].reward.articleIndex=3;await a.rejects(write(envelope(bad)),e=>e.code==='40001');
 state.receipts[0].phase='consumed';state.receipts[0].choice='accept';state.collections.articles.push(2);state.collections.knowledge=3;await write(envelope(state));
 for(const change of [s=>s.receipts=[],s=>s.receipts[0].phase='prepared',s=>s.receipts[0].choice='sell',s=>s.collections.articles=[1],s=>s.save.journeyId='other']){bad=clone(state);change(bad);await a.rejects(write(envelope(bad)),e=>e.code==='40001');}
 const divergent=envelope({...state,save:{...state.save,gold:21}});divergent.ownerAuthority.base='{}';await a.rejects(write(divergent),e=>e.code==='40001');
 const old=clone(state);state={...state,resetEpoch:1,save:null,collections:{articles:[],knowledge:0},receipts:[],tombstone:{reason:'reset',epoch:1}};await write(envelope(state));
 await a.rejects(write(envelope(old)),e=>e.code==='40001');
 const row=(await db.query('SELECT game_progress,game_progress_version FROM profiles')).rows[0];a.equal(row.game_progress_version,version);a.deepEqual(row.game_progress.ownerAuthority.state,state);
 await a.rejects(db.query('UPDATE profiles SET game_progress_version=$1 WHERE id=$2',[version+2,'u']),e=>e.code==='40001');
 await db.exec("SET app.owner='other'");a.equal((await db.query('UPDATE profiles SET game_progress_version=$1 WHERE id=$2 RETURNING id',[version+1,'u'])).rows.length,0);
 }finally{await db.close();}
});
test('browser cloud boundary fails closed by default and strips competing legacy data',()=>{
 let imported=0;const authority={exportCloud:()=>({format:'nq-owner-authority-v1',base:null,state:{}}),importCloud:()=>{imported++;return {save:null}}};
 a.throws(()=>helper.build(authority,{}),e=>e.code==='CLOUD_GUARD_REQUIRED');
 a.throws(()=>helper.merge(authority,{}),e=>e.code==='CLOUD_GUARD_REQUIRED');
 a.throws(()=>helper.merge(authority,{save:{}},{serverGuardVerified:true}),e=>e.code==='CLOUD_LEGACY_BLOCKED');a.equal(imported,0);
 const payload=helper.build(authority,{save:{},unlockedArticles:[1],knowledge:4,stats:{count:2}},{serverGuardVerified:true});a.equal(payload.save,undefined);a.equal(payload.unlockedArticles,undefined);a.deepEqual(payload.stats,{count:2});
 const result=helper.merge(authority,payload,{serverGuardVerified:true});a.equal(imported,1);a.equal(result.remaining.ownerAuthority,undefined);
});
