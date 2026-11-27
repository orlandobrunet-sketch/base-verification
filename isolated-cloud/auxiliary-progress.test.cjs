'use strict';
const {test}=require('node:test'),a=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const api=require('../js/auxiliary-progress.js');
const rejects=fn=>a.throws(fn,e=>e.code==='INVALID_AUXILIARY_PROGRESS');
test('complete branch projection replaces false, empty arrays and objects rather than unioning',()=>{
 const input={stats:{gamesPlayed:2},achievements:[],mastered:['q1'],unlockedRefs:[],arquiDefeated:false,hardcoreCompleted:true,detailedStats:{total:1},acidBaseProgress:{completed:[]},srData:{q1:{reps:3}}};
 const before=structuredClone(input),projected=api.project(input);
 a.deepEqual(input,before);a.equal(projected['nefroquest-achievements'],'[]');a.equal(projected['nefroquest-arqui-defeated'],null);a.equal(projected['nefroquest-hardcore-completed'],'1');
 a.equal(projected['nefroquest-stats'],'{"gamesPlayed":2}');a.equal(projected['nefroquest-mastered'],'["q1"]');a.equal(projected['nefroquest-gold-milestone-shown'],null);
 a.deepEqual(Object.keys(projected),api.KEYS);a.ok(Object.isFrozen(projected));
 const storage=new Map([['nefroquest-achievements','["old"]'],['nefroquest-arqui-defeated','1']]);
 for(const [key,value] of Object.entries(projected))value===null?storage.delete(key):storage.set(key,value);
 a.equal(storage.get('nefroquest-achievements'),'[]');a.equal(storage.has('nefroquest-arqui-defeated'),false);
});
test('missing fields have deterministic defaults; owner/save/collections and unrelated fields are never projected',()=>{
 const p=api.project({ownerAuthority:{state:{owner:'u'}},save:{score:999},knowledge:900,unlockedArticles:[1],credential:'not copied'});
 a.equal(p['nefroquest-stats'],'{}');a.equal(p['nefroquest-achievements'],'[]');a.equal(p['nefroquest-detailed-stats'],'{}');a.equal(p['nefroquest-arqui-defeated'],null);
 a.deepEqual(Object.keys(p),api.KEYS);a.doesNotMatch(JSON.stringify(p),/credential|ownerAuthority|unlockedArticles|999/);
});
test('present invalid field types reject instead of silently defaulting',()=>{
 for(const v of [null,undefined,[],true,3,''])rejects(()=>api.project(v));
 for(const field of ['stats','detailedStats','acidBaseProgress','srData'])for(const value of [null,undefined,[],true,3,''])rejects(()=>api.project({[field]:value}));
 for(const field of ['achievements','mastered','unlockedRefs'])for(const value of [null,undefined,{},true,3,''])rejects(()=>api.project({[field]:value}));
 for(const field of ['arquiDefeated','hardcoreCompleted'])for(const value of [null,undefined,0,1,'false',{},[]])rejects(()=>api.project({[field]:value}));
});
test('nested non-JSON, nonfinite, cycles, accessors and dangerous keys reject without invoking getters',()=>{
 const cyclic={};cyclic.self=cyclic;
 for(const value of [NaN,Infinity,-Infinity,undefined,()=>{},1n,new Date(),new Map(),cyclic])rejects(()=>api.project({stats:{value}}));
 let reads=0;const getter={};Object.defineProperty(getter,'value',{enumerable:true,get(){reads++;return 1;}});rejects(()=>api.project({stats:getter}));
 const root={};Object.defineProperty(root,'stats',{enumerable:true,get(){reads++;return {};}});rejects(()=>api.project(root));a.equal(reads,0);
 const inherited=Object.create(Object.assign(Object.create(null),{toJSON(){reads++;return {};}}));rejects(()=>api.project({stats:inherited}));a.equal(reads,0);
 for(const key of ['__proto__','constructor','prototype'])rejects(()=>api.project({stats:JSON.parse('{"'+key+'":{}}')}));
 const symbol={};symbol[Symbol('hidden')]=1;rejects(()=>api.project({stats:symbol}));
 const sparse=[];sparse.length=2;rejects(()=>api.project({achievements:sparse}));
 const extra=[];extra.other=1;rejects(()=>api.project({achievements:extra}));
});
test('depth, node and aggregate UTF-8 byte limits fail closed',()=>{
 let nested={};for(let i=0;i<=api.LIMITS.depth;i++)nested={nested};rejects(()=>api.project({stats:nested}));
 rejects(()=>api.project({achievements:Array(api.LIMITS.nodes).fill(0)}));
 rejects(()=>api.project({stats:{large:'á'.repeat(api.LIMITS.bytes/2)},detailedStats:{more:'á'}}));
 rejects(()=>api.project({stats:{large:'x'.repeat(api.LIMITS.bytes+1)}}));
});
test('browser export matches CommonJS and tolerates ordinary cross-realm JSON',()=>{
 const ctx={TextEncoder};vm.createContext(ctx);vm.runInContext(fs.readFileSync(require.resolve('../js/auxiliary-progress.js'),'utf8'),ctx);
 a.equal(JSON.stringify(ctx.NQAuxiliaryProgress.project({stats:{n:2},mastered:[1]})),JSON.stringify(api.project({stats:{n:2},mastered:[1]})));
});
