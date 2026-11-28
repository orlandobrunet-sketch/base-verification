'use strict';
const {test}=require('node:test'),a=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'../..'),game=fs.readFileSync(path.join(root,'js/game.js'),'utf8'),auth=fs.readFileSync(path.join(root,'js/auth.js'),'utf8');
const normal=require('../../js/normal-authority.js'),{createAuthority}=require('../../js/owner-authority.js');
function section(source,start,end){const i=source.indexOf(start),j=source.indexOf(end,i+start.length);a.ok(i>=0&&j>i);return source.slice(i,j);}
async function fixture(){const map=new Map(),held=new Set(),events=[];const seed={schemaVersion:7,saveOwner:'a',character:'nephros',journeyId:'a-j',score:100};map.set('nefroquest-save-v7',JSON.stringify(seed));map.set('unlockedArticles','[3]');map.set('nefroquest_total_accumulated_knowledge','5');
 let ctx;const f={failMarker:false};const storage={getItem:k=>map.get(k)??null,setItem(k,v){if(k==='nefroquest-save-v7'){events.push({action:'marker',epoch:ctx._authSessionEpoch,value:v});if(f.failMarker)throw Error('quota');}map.set(k,String(v));},removeItem:k=>map.delete(k)};
 const locks={async request(k,o,fn){if(held.has(k))return fn(null);held.add(k);try{return await fn({});}finally{held.delete(k);}}};
 ctx={console,JSON,Set,Math,localStorage:storage,NQNormalAuthority:normal,NQ_DURABLE_PROGRESS:true,authUser:{id:'a'},_authSessionEpoch:1,_supaClient:null,
 SAVE_KEY:'nefroquest-save',CANONICAL_SAVE_KEY:'nefroquest-save-v7',STATS_KEY:'stats',MASTERED_KEY:'mastered',PREMIUM_KEY:'premium',WHITELIST_KEY:'whitelist',
 _saveCleanupBlocked:false,_characterCloudConflict:false,_guestMode:false,_guestHookShown:false,_progressEpoch:1,document:{body:{dataset:{}},getElementById:()=>null},
 isCharacterPilot:()=>false,_currentSaveOwner:()=>ctx.authUser?.id||null,_canonicalSaveRecord:()=>JSON.parse(storage.getItem('nefroquest-save-v7')||'null'),
 _stopLocalJourney(){ctx._progressEpoch++;},_toast:()=>{},_invalidateStatsCache:()=>{},_invalidatePremiumCache:()=>{},updateWelcomeUserBadge:()=>{},_markExplicitLoginIntent:()=>{},
 _setAuthSessionUser(user){events.push({action:'setUser',epoch:ctx._authSessionEpoch,id:user?.id||null});ctx.authUser=user;},
 _writeSaveTombstone(reason,owner){storage.setItem('nefroquest-save-v7',JSON.stringify({schemaVersion:7,saveOwner:owner,save:null,resetReason:reason,saveRevision:'rewritten'}));}};
 ctx.window=ctx;vm.createContext(ctx);
 vm.runInContext(section(game,'    function _prepareProgressOwner(', '    window._prepareProgressOwner ='),ctx);
 vm.runInContext(section(game,"    function clearLocalProgress(reason = 'reset'",'    window.clearLocalProgress ='),ctx);
 vm.runInContext(section(auth,'    async function authLogout(', '    function playAsGuest()'),ctx);
 const make=()=>normal.create({storage,locks,createAuthority,owner:ctx.authUser?.id||null,currentOwner:()=>ctx.authUser?.id||null,identityGeneration:()=>ctx._authSessionEpoch,validateSave:(s,o)=>s.saveOwner===o&&s.character==='nephros',newJourneyId:()=>ctx.authUser.id+'-j'});
 const boot=async()=>{const n=make();await n.bootstrap();ctx.NQNormalProgress=n;return n;};return Object.assign(f,{map,ctx,events,storage,boot});}
test('real authLogout retires sources before incrementing generation and clearing identity',async()=>{const f=await fixture();await f.boot();await f.ctx.authLogout();a.equal(f.ctx.authUser,null);a.equal(f.ctx._authSessionEpoch,2);a.equal(f.events.find(e=>e.action==='marker').epoch,1);a.equal(f.events.find(e=>e.action==='setUser').epoch,2);a.equal(normal.retiredSourcesMatch({storage:f.storage,owner:'a'}),true);a.equal(f.ctx.NQNormalProgress,null);});
test('real prepare/clear preserves already-retired proof without an instance, and A-B-A bootstrap restores saves',async()=>{const f=await fixture();const first=await f.boot();await f.ctx.authLogout();const markerA=f.storage.getItem('nefroquest-save-v7');a.equal(f.ctx._prepareProgressOwner('b'),true);a.equal(f.storage.getItem('nefroquest-save-v7'),markerA);f.ctx.authUser={id:'b'};f.ctx._authSessionEpoch++;const b=await f.boot();b.startJourney({schemaVersion:7,saveOwner:'b',character:'nephros',journeyId:'b-j',score:200});b.storage.setItem('unlockedArticles','[9]');await f.ctx.authLogout();const markerB=f.storage.getItem('nefroquest-save-v7');f.map.set('stats','{"gamesPlayed":99}');a.equal(f.ctx.NQNormalProgress,null);a.equal(f.ctx._prepareProgressOwner('a'),true);a.equal(f.storage.getItem('nefroquest-save-v7'),markerB);a.equal(f.map.has('stats'),false);a.equal(normal.retiredSourcesMatch({storage:f.storage,owner:'b'}),true);f.ctx.authUser={id:'a'};f.ctx._authSessionEpoch++;const returned=await f.boot();a.equal(returned.loadSave().score,100);a.deepEqual(returned.envelope().collections,{articles:[3],knowledge:5});a.equal(first.writable,false);await returned.release();});
test('failed cleanup keeps auth identity and generation unchanged',async()=>{const f=await fixture(),n=await f.boot();f.failMarker=true;a.equal(await f.ctx.authLogout(),false);a.equal(f.ctx.authUser.id,'a');a.equal(f.ctx._authSessionEpoch,1);a.equal(f.ctx._authLogoutPending,false);f.failMarker=false;await n.release();});
test('retired source divergence must not be erased by host fallback cleanup',async()=>{const f=await fixture();await f.boot();await f.ctx.authLogout();f.map.set('unlockedArticles','[3,99]');const before=[...f.map];a.equal(f.ctx._prepareProgressOwner('b'),false,'A persisted authority with divergent sources needs recovery, not legacy cleanup');a.deepEqual([...f.map],before);});
test('concurrent cloud and Continue share one authority bootstrap for same identity',async()=>{
 let resolve,opens=0;const ctx={NQ_DURABLE_PROGRESS:true,_authSessionEpoch:1,_currentSaveOwner:()=> 'a',_openNormalAuthority:()=>{opens++;return new Promise(r=>{resolve=r;});}};ctx.window=ctx;vm.createContext(ctx);
 vm.runInContext(section(game,'    let _normalAuthorityOpening = null;','    async function _openNormalAuthority()'),ctx);
 const cloud=ctx._ensureNormalAuthority(),continuation=ctx._ensureNormalAuthority();a.equal(opens,1);resolve(true);a.deepEqual(await Promise.all([cloud,continuation]),[true,true]);
});
test('a same-account refresh keeps the session while an old tab pauses protected progress',async()=>{
 const f=await fixture();const current=await f.boot();
 try{
  f.map.set('unlockedArticles','[3,99]');
  a.equal(current.writable,false);
  f.ctx._legacyTabIssue={owner:'a',generation:1};
  vm.runInContext(section(game,'    window._prepareProgressOwnerAsync =','    function _signedOutSaveNeedsLogin('),f.ctx);
  const before=[...f.map];
  a.equal(await f.ctx._prepareProgressOwnerAsync('a'),true);
  a.equal(await f.ctx._prepareProgressOwnerAsync('b'),false);
  a.equal(f.ctx.authUser.id,'a');
  a.deepEqual([...f.map],before);
 }finally{await current.release();}
});
