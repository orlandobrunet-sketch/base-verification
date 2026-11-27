'use strict';
const {test}=require('node:test'),a=require('node:assert/strict');const {createAuthority}=require('./owner-authority.cjs');
function fixture(){const f={op:0,fail:null},map=new Map();const save={schemaVersion:7,saveOwner:'u',character:'nephros',journeyId:'j',score:45};map.set('nefroquest-save-v7',JSON.stringify(save));map.set('nefroquest-save',JSON.stringify(save));map.set('unlockedArticles','[1,2]');map.set('nefroquest_total_accumulated_knowledge','9');
 const change=fn=>{f.op++;if(f.fail?.at===f.op&&f.fail.when==='before')throw Error('quota');fn();if(f.fail?.at===f.op&&f.fail.when==='after'){f.readFail=true;throw Error('crash after mutation');}};
 const storage={getItem(k){if(f.readFail)throw Error('readback unavailable');return map.get(k)??null;},setItem:(k,v)=>change(()=>map.set(k,v)),removeItem:k=>change(()=>map.delete(k))};
 let held=false;const locks={async request(k,o,fn){if(held)return fn(null);held=true;try{return await fn({});}finally{held=false;}}};
 f.make=(owner='u')=>createAuthority({storage,locks,owner,currentOwner:()=>owner,validateSave:s=>s.character==='nephros'});return Object.assign(f,{map});}
for(let at=1;at<=6;at++)for(const when of ['before','after'])test(`retirement failpoint ${at}/${when} reload recovers without losing save or collections`,async()=>{const f=fixture(),m=f.make();await m.acquire();const original=m.migrate({});f.op=0;f.fail={at,when};a.throws(()=>m.retireLegacySources());f.fail=null;f.readFail=false;await m.release();const next=f.make();await next.acquire();const recovered=next.resumeLegacySources();a.equal(recovered.save.score,45);a.deepEqual(recovered.collections,{articles:[1,2],knowledge:9});a.equal(recovered.source.saveRaw,original.source.saveRaw);a.equal(recovered.source.articlesRaw,original.source.articlesRaw);a.equal(recovered.source.retirementIntent,undefined);a.equal(next.writable,true);await next.release();});
test('quota only on final retirement authority write recovers intent rather than source conflict',async()=>{const f=fixture(),m=f.make();await m.acquire();m.migrate({});f.op=0;f.fail={at:6,when:'before'};a.throws(()=>m.retireLegacySources(),e=>e.code==='REFUSED');a.equal(JSON.parse(f.map.get(m.key)).source.retirementIntent.owner,'u');a.equal(f.map.has('unlockedArticles'),false);f.fail=null;await m.release();const fresh=f.make();await fresh.acquire();const saved=fresh.resumeLegacySources();a.equal(saved.save.score,45);a.equal(saved.source.retirementIntent,undefined);a.equal(fresh.writable,true);await fresh.release();});
test('unrecorded source divergence during pending retirement is preserved and rejected',async()=>{const f=fixture(),m=f.make();await m.acquire();m.migrate({});f.op=0;f.fail={at:4,when:'before'};a.throws(()=>m.retireLegacySources());f.fail=null;await m.release();f.map.set('unlockedArticles','[999]');const before=[...f.map],fresh=f.make();await fresh.acquire();a.throws(()=>fresh.resumeLegacySources(),e=>e.code==='LEGACY_CONFLICT');a.deepEqual([...f.map],before);await fresh.release();});

function legacyLogout(version) {
 const f=fixture();
 f.map.clear();
 f.map.set('nefroquest-save-v7',JSON.stringify({schemaVersion:version,saveOwner:'u',
  saveRevision:'00000000-0000-4000-8000-000000000972',save:null,resetReason:'logout'}));
 return f;
}

for(const version of [7,9])test(`new owner can initialize after a clean legacy v${version} logout`,async()=>{
 const f=legacyLogout(version),next=f.make('next');
 const raw=f.map.get('nefroquest-save-v7');
 a.equal(await next.acquire(),true);
 try {
  const ready=next.resumeLegacySources() || next.migrate({});
  a.equal(ready.owner,'next');
  a.equal(ready.save,null);
  a.deepEqual(ready.collections,{articles:[],knowledge:0});
  a.deepEqual(ready.receipts,[]);
  a.equal(ready.source.saveRaw,raw);
  a.equal(f.map.has('nefroquest-owner-authority-v1:%22u%22'),false);
  a.equal(JSON.parse(f.map.get('nefroquest-save-v7')).saveOwner,'next');
  a.equal(next.writable,true);
 } finally { await next.release(); }
});

for(const [kind,key,value] of [
 ['old mirror','nefroquest-save','{"saveOwner":"u","score":80}'],
 ['old collection','unlockedArticles','[6]'],
 ['old knowledge','nefroquest_total_accumulated_knowledge','3'],
 ['unverified prior authority','nefroquest-owner-authority-v1:%22u%22','{"owner":"u"}'],
])test(`legacy logout with ${kind} cannot transfer or overwrite progress`,async()=>{
 const f=legacyLogout(7),next=f.make('next');
 f.map.set(key,value);
 const before=[...f.map];
 a.equal(await next.acquire(),true);
 try {
  a.throws(()=>next.resumeLegacySources() || next.migrate({}),e=>['LEGACY_CONFLICT','MIGRATION_REQUIRED'].includes(e.code));
  a.deepEqual([...f.map],before);
  a.equal(f.map.has(next.key),false);
 } finally { await next.release(); }
});
