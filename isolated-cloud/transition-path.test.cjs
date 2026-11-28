'use strict';
const {test}=require('node:test'),a=require('node:assert/strict'),fs=require('node:fs');
const {PGlite}=require('../tests/payments/node_modules/@electric-sql/pglite');
const copy=x=>structuredClone(x);
const initial=()=>({protocol:1,owner:'u',resetEpoch:0,save:{saveOwner:'u',journeyId:'a',character:'nephros',difficulty:'normal',score:0},collections:{articles:[1],knowledge:2},receipts:[],tombstone:null});
function journey(s,id){const n=copy(s);n.resetEpoch++;n.save={saveOwner:'u',journeyId:id,character:'nephros',difficulty:'normal',score:0};n.receipts=[];n.tombstone={reason:'journey',epoch:n.resetEpoch};return n;}
function reward(s,id){const n=copy(s);n.save.score+=10;n.collections.articles.push(id);n.collections.knowledge++;n.receipts.push({id:'r'+id,journeyId:n.save.journeyId,phase:'consumed',reward:{kind:'article',articleIndex:id},choice:'accept'});return n;}
function reset(s){const n=copy(s);n.resetEpoch++;n.save=null;n.collections={articles:[],knowledge:0};n.receipts=[];n.tombstone={reason:'reset',epoch:n.resetEpoch};return n;}
function payload(state,base,path){return {ownerAuthority:{format:'nq-owner-authority-v1',base:base===null?null:JSON.stringify(base),state,...(path===undefined?{}:{transitionPath:path})}};}
async function fixture(fn){const db=new PGlite();try{
 await db.exec("CREATE ROLE anon;CREATE ROLE authenticated;CREATE TABLE profiles(id text PRIMARY KEY,game_progress jsonb DEFAULT '{}');INSERT INTO profiles VALUES('u','{}');");
 await db.exec(fs.readFileSync(require.resolve('../supabase/migrations/20261111143230_protect_cloud_progress_version.sql'),'utf8'));
 await db.exec(fs.readFileSync(require.resolve('../supabase/migrations/20261115150000_guard_owner_authority_progress.sql'),'utf8'));
 let version=0;const read=async()=>(await db.query("SELECT game_progress,game_progress_version FROM profiles WHERE id='u'")).rows[0];
 const write=async p=>{await db.query("UPDATE profiles SET game_progress=$1,game_progress_version=$2 WHERE id='u' AND game_progress_version=$3",[p,version+1,version]);version++;};
 const base=initial();await write(payload(base,null));await fn({db,base,write,read});
 }finally{await db.close();}}
test('SQL validates multiple offline journeys and rewards atomically, exact response-loss replay is harmless',async()=>fixture(async({base,write,read})=>{
 const first=journey(base,'b'),won=reward(first,2),second=journey(won,'c'),last=reward(second,3);
 const p=payload(last,base,[first,won,second,last]);await write(p);
 let row=await read();a.deepEqual(row.game_progress,p);a.equal(row.game_progress_version,2);
 await write(p);row=await read();a.equal(row.game_progress_version,3);a.deepEqual(row.game_progress,p);a.equal(row.game_progress.ownerAuthority.state.collections.knowledge,4);
}));
test('SQL validates reset then new journey then reward, never resurrecting reset collections',async()=>fixture(async({base,write,read})=>{
 const cleared=reset(base),fresh=journey(cleared,'after-reset'),last=reward(fresh,8);
 await write(payload(last,base,[cleared,fresh,last]));const s=(await read()).game_progress.ownerAuthority.state;
 a.deepEqual(s.collections,{articles:[8],knowledge:1});a.equal(s.resetEpoch,2);a.equal(s.receipts.length,1);
}));
test('SQL rejects malformed or divergent chains without partial progress/version effects',async()=>fixture(async({base,write,read})=>{
 const first=journey(base,'b'),won=reward(first,2),second=journey(won,'c');
 const valid=payload(second,base,[first,won,second]),before=await read();
 const mutations=[
 p=>p.ownerAuthority.transitionPath=null,
 p=>p.ownerAuthority.transitionPath=[],
 p=>p.ownerAuthority.transitionPath=Array(130).fill(second),
 p=>p.ownerAuthority.transitionPath=[first,won],
 p=>p.ownerAuthority.transitionPath=[second],
 p=>p.ownerAuthority.transitionPath=[won,first,second],
 p=>p.ownerAuthority.transitionPath[0].owner='other',
 p=>p.ownerAuthority.transitionPath[0].collections.knowledge=-1,
 p=>p.ownerAuthority.transitionPath[0].receipts=[{id:'bad',journeyId:'b',phase:'consumed'}],
 p=>p.ownerAuthority.base='{}',
 p=>p.ownerAuthority.base=null,
 p=>p.ownerAuthority.transitionPath[1].receipts.push(copy(p.ownerAuthority.transitionPath[1].receipts[0])),
 ];
 for(const mutate of mutations){const p=copy(valid);mutate(p);await a.rejects(write(p));a.deepEqual(await read(),before);}
}));
test('SQL cannot use a later good snapshot to hide receipt regression within a chain',async()=>fixture(async({base,write,read})=>{
 const won=reward(base,2);await write(payload(won,base));const before=await read();
 const regressed=copy(won);regressed.receipts[0].phase='earned';const last=copy(won);last.save.score++;
 await a.rejects(write(payload(last,won,[regressed,last])),e=>e.code==='40001');a.deepEqual(await read(),before);
}));
test('SQL accepts 129 validated no-op boundary states, but rejects path without authority ancestor',async()=>fixture(async({db,base,write,read})=>{
 await write(payload(base,base,Array(129).fill(base)));a.equal((await read()).game_progress_version,2);
 await db.exec("INSERT INTO profiles VALUES('new','{}',0)");
 const other={...base,owner:'new',save:{...base.save,saveOwner:'new'}};
 await a.rejects(db.query("UPDATE profiles SET game_progress=$1,game_progress_version=1 WHERE id='new'",[payload(other,null,[other])]),e=>e.code==='40001');
 a.equal((await db.query("SELECT game_progress_version FROM profiles WHERE id='new'")).rows[0].game_progress_version,0);
}));
test('SQL chain update still respects authenticated owner RLS and CAS row predicates',async()=>fixture(async({db,base,write,read})=>{
 await db.exec("ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;CREATE POLICY owner_only ON profiles FOR ALL TO authenticated USING(id=current_setting('app.owner')) WITH CHECK(id=current_setting('app.owner'));GRANT SELECT,UPDATE ON profiles TO authenticated;SET ROLE authenticated;SET app.owner='other';");
 const next=journey(base,'b'),p=payload(next,base,[base,next]);
 const denied=await db.query("UPDATE profiles SET game_progress=$1,game_progress_version=1 WHERE id='u' AND game_progress_version=0 RETURNING id",[p]);a.equal(denied.rows.length,0);
 await db.exec("SET app.owner='u';");
 const before=await read();
 const stale=await db.query("UPDATE profiles SET game_progress=$1,game_progress_version=1 WHERE id='u' AND game_progress_version=0 RETURNING id",[p]);a.equal(stale.rows.length,0);a.deepEqual(await read(),before);
 await write(p);a.deepEqual((await read()).game_progress,p);
}));
