'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'../..'),source=fs.readFileSync(path.join(root,'js/game.js'),'utf8');
const {create}=require('../../js/normal-authority.js'),{createAuthority}=require('../../js/owner-authority.js'),cloud=require('../../js/cloud-authority.js');
const copy=x=>JSON.parse(JSON.stringify(x));
function section(start,end){const a=source.indexOf(start),b=source.indexOf(end,a+start.length);assert.ok(a>=0&&b>a);return source.slice(a,b);}
async function fixture({canonicalRaw}={}){
 const map=new Map(),held=new Set();const initial={schemaVersion:7,saveOwner:'u',character:'nephros',difficulty:'normal',score:10,correctTotal:1,timestamp:1};
 map.set('nefroquest-save-v7',canonicalRaw===undefined?JSON.stringify(initial):canonicalRaw);map.set('unlockedArticles','[3]');map.set('nefroquest_total_accumulated_knowledge','5');
 const storage={getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,String(v)),removeItem:k=>map.delete(k)};
 const locks={async request(k,o,fn){if(held.has(k))return fn(null);held.add(k);try{return await fn({});}finally{held.delete(k);}}};
 const n=create({storage,locks,createAuthority,owner:'u',currentOwner:()=> 'u',validateSave:s=>s.character==='nephros',newJourneyId:()=> 'j'});await n.bootstrap();
 const counts={stopped:0,reloaded:0,refreshed:0};
 const ctx={console,clearTimeout,Date,JSON,Map,Set,Math,Number,NQNormalProgress:n,NQCloudAuthority:cloud,NQ_OWNER_CLOUD_GUARD_VERIFIED:true,
 NQQuestionRevisions:{digest:cloud.fingerprint},localStorage:storage,authUser:{id:'u'},state:{gameStarted:true},_progressEpoch:1,_saveTimer:null,_autoSaveTimer:null,_saveCleanupBlocked:false,
 CANONICAL_SAVE_KEY:'nefroquest-save-v7',SAVE_KEY:'nefroquest-save',MASTERED_KEY:'mastered',STATS_KEY:'stats',STATS_STORAGE_KEY:'details',
 isCharacterPilot:()=>false,_currentSaveOwner:()=> 'u',_migrateSave:copy,_isSaveTombstone:r=>r===null||r?.save===null,_canonicalSaveRecord:()=>JSON.parse(storage.getItem('nefroquest-save-v7')),
 _cloudBindingCurrent:b=>b.owner==='u'&&b.progressEpoch===ctx._progressEpoch,_cloudStatus:()=>{},_readQuestionSaveExtras:()=>({}),
 getNormalGameStats:()=>({gamesPlayed:0}),getGameStats:()=>({}),_invalidateStatsCache:()=>{},_mergeDetailedStats:(a,b)=>({...a,...b}),
 _stopLocalJourney(){counts.stopped++;ctx.state.gameStarted=false;ctx._progressEpoch++;},_reloadJourneyCollections(){counts.reloaded++;},refreshWelcomeSave(){counts.refreshed++;}};
 ctx.window=ctx;vm.createContext(ctx);
 for(const [start,end] of [
 ['    const _hardcoreCorrect =', '    function _persistHardcoreBest('],
 ['    function _cloudJourneyFingerprint(', '    async function _readCloudProgress('],
 ['    function _reconcileCloudProgress(', '    function _closeCloudProgressConflict('],
 ['    function _buildCloudProgress()', '    async function _commitCloudProgress('],
 ['    async function _commitCloudProgress(', '    async function _syncProgressToCloud('],
 ['    function _mergeCloudProgress(', '    window._mergeCloudProgress =']])vm.runInContext(section(start,end),ctx);
 const binding=()=>({owner:'u',progressEpoch:ctx._progressEpoch});
 return {map,storage,n,ctx,counts,initial,binding,build:()=>ctx._buildCloudProgress(),remember:remote=>ctx._rememberCloudProgress('u',remote),reconcile:remote=>ctx._reconcileCloudProgress(binding(),remote)};
}
test('real game reconciliation preserves newer local work when remote ancestor is unchanged, builds push',async()=>{const f=await fixture();try{const remote={version:1,progress:f.build()};f.remember(remote);const before=f.n.loadSave();f.n.save({...before,score:50});assert.equal(f.reconcile(remote),true);assert.equal(f.n.loadSave().score,50);assert.equal(f.counts.stopped,0);const push=f.build();assert.equal(push.ownerAuthority.state.save.score,50);assert.equal(push.ownerAuthority.base,cloud.fingerprint(remote.progress.ownerAuthority.state));assert.equal('save' in push,false);assert.equal('unlockedArticles' in push,false);}finally{await f.n.release();}});
test('a 17.34 tab can refresh its checkpoint while the protected journey keeps its verified ancestor',async()=>{
 const f=await fixture();
 try{
  const remote={version:3,progress:f.build()};
  f.remember(remote);
  const ancestor=cloud.fingerprint(remote.progress.ownerAuthority.state);
  f.n.save({...f.n.loadSave(),score:50});
  const legacy=JSON.stringify({version:3,journey:null,payload:'legacy-reader'});
  f.map.set('nefroquest-cloud:u',legacy);
  assert.equal(f.ctx._cloudCheckpoint('u').authorityBase,ancestor);
  assert.equal(f.reconcile(remote),true);
  assert.equal(f.build().ownerAuthority.base,ancestor);
  assert.equal(f.n.loadSave().score,50);
  assert.equal(f.map.get('nefroquest-cloud:u'),legacy);
 }finally{await f.n.release();}
});
test('real game reconciliation imports direct descendant and retires live memory',async()=>{const f=await fixture();try{const ancestor=f.build(),remote=copy(ancestor);remote.ownerAuthority.base=cloud.fingerprint(ancestor.ownerAuthority.state);remote.ownerAuthority.state.save.score=70;remote.ownerAuthority.state.collections.articles.push(4);assert.equal(f.reconcile({version:2,progress:remote}),true);assert.equal(f.n.loadSave().score,70);assert.deepEqual(f.n.envelope().collections.articles,[3,4]);assert.equal(f.counts.stopped,1);assert.equal(f.counts.reloaded,1);assert.equal(f.ctx.state.gameStarted,false);}finally{await f.n.release();}});
test('real game divergence refuses before legacy stats or collections side effects',async()=>{const f=await fixture();try{const ancestor=f.build();f.remember({version:1,progress:ancestor});f.n.save({...f.n.loadSave(),score:60});const remote=copy(ancestor);remote.ownerAuthority.base=cloud.fingerprint(ancestor.ownerAuthority.state);remote.ownerAuthority.state.save.score=80;remote.stats={gamesPlayed:999};remote.achievements=['injected'];const before=[...f.map];assert.equal(f.reconcile({version:2,progress:remote}),false);assert.deepEqual([...f.map],before);assert.equal(f.counts.stopped,0);}finally{await f.n.release();}});
test('real game identical legacy ancestor permits first authority migration push',async()=>{const f=await fixture();try{assert.equal(f.reconcile({version:4,progress:{save:copy(f.initial),unlockedArticles:[3]}}),true);assert.equal(f.build().ownerAuthority.state.save.journeyId,'j');assert.equal(f.n.loadSave().score,10);}finally{await f.n.release();}});
test('real game divergent legacy first migration is refused without effects',async()=>{const f=await fixture();try{const before=[...f.map];assert.equal(f.reconcile({version:4,progress:{save:{...f.initial,score:11},unlockedArticles:[3],stats:{gamesPlayed:999}}}),false);assert.deepEqual([...f.map],before);}finally{await f.n.release();}});
test('real game offers a legacy cloud journey on a cold page before the library has loaded', async () => {
 const f = await fixture();
 try {
  let shown = 0;
  Object.assign(f.ctx, {NQLegacyCloudDecision: require('../../js/legacy-cloud-decision.js'),
   _cloudConflict: null, _showCloudProgressConflict() { shown++; }});
  const save = {...f.initial, journeyId: 'existing-cloud-journey', score: 29};
  const before = [...f.map];
  assert.equal(f.reconcile({version: 4, progress: {save, unlockedArticles: [3, 12]}}), false);
  assert.equal(shown, 1, 'valid saved discovery indices do not depend on a loaded library');
  const token = f.ctx._cloudConflict.legacyToken;
  assert.equal(token.remote.save.journeyId, save.journeyId);
  assert.deepEqual(token.remote.collections, {articles: [3, 12], knowledge: 5});
  assert.deepEqual([...f.map], before, 'showing the choice must not migrate local or remote progress');
 } finally { await f.n.release(); }
});
test('real game cloud fingerprint ignores transport base and save timestamps',async()=>{const f=await fixture();try{const first=f.build(),second=copy(first);second.ownerAuthority.base='new-ancestor';second.ownerAuthority.state.save.timestamp=555;second.ownerAuthority.state.save.saveRevision='new';assert.equal(f.ctx._cloudFingerprint(first),f.ctx._cloudFingerprint(second));}finally{await f.n.release();}});

test('real game push reaches CAS write after reconciling unchanged remote ancestor',async()=>{const f=await fixture();try{
 const remote={version:2,progress:f.build()};f.remember(remote);f.n.save({...f.n.loadSave(),score:99});
 const writes=[];const client={from(){return {update(value){writes.push(value);return this;},eq(){return this;},select(){return this;},async maybeSingle(){return {data:{game_progress_version:3},error:null};}};}};
 Object.assign(f.ctx,{_authSessionEpoch:1,_characterCloudConflict:false,_canSyncLocalProgress:()=>true,_scheduleCloudSync:()=>{},
 _cloudBinding:()=>({...f.binding(),authEpoch:1,client}),_loadProgressFromCloud:async()=>f.reconcile(remote)});
 assert.equal(await f.ctx._pushCloudProgress({...f.binding(),authEpoch:1,client}),true);
 assert.equal(writes.length,1);assert.equal(writes[0].game_progress_version,3);assert.equal(writes[0].game_progress.ownerAuthority.state.save.score,99);
 }finally{await f.n.release();}});

test('real game rereads the cloud checkpoint after PT409 before retrying local progress', async () => {
 const f = await fixture();
 try {
  const ancestor = f.build();
  f.remember({version: 2, progress: ancestor});
  f.n.save({...f.n.loadSave(), score: 99});
  const writes = [];
  const guards = [];
  let reads = 0;
  const client = {from() { return {
   update(value) { writes.push(value); return this; },
   eq(field, value) { if (field === 'game_progress_version') guards.push(value); return this; },
   select() { return this; },
   async maybeSingle() {
    return writes.length === 1
     ? {data: null, error: {code: 'PT409'}}
     : {data: {game_progress_version: 4}, error: null};
   },
  }; }};
  const binding = () => ({...f.binding(), authEpoch: 1, client});
  Object.assign(f.ctx, {_authSessionEpoch: 1, _characterCloudConflict: false, _canSyncLocalProgress: () => true,
   _scheduleCloudSync() {}, _cloudBinding: binding,
   async _loadProgressFromCloud() { return f.reconcile({version: 1 + ++reads, progress: ancestor}); },
  });
  assert.equal(await f.ctx._pushCloudProgress(binding()), true);
  assert.equal(reads, 2);
  assert.deepEqual(guards, [2, 3]);
  assert.deepEqual(writes.map(value => value.game_progress_version), [3, 4]);
  assert.deepEqual(writes.map(value => value.game_progress.ownerAuthority.state.save.score), [99, 99]);
  assert.equal(f.ctx._cloudCheckpoint('u').version, 4);
 } finally { await f.n.release(); }
});

test('raw-null migration cannot use unowned source collections to overwrite legacy cloud',async()=>{const f=await fixture({canonicalRaw:'null'});try{const before=[...f.map];assert.equal(f.reconcile({version:4,progress:{save:null,unlockedArticles:[3]}}),false,'Unowned source articles are not proof of an identical cloud ancestor');assert.deepEqual([...f.map],before);}finally{await f.n.release();}});
test('real game cloud guard remains fail-closed when deployment gate is off',async()=>{const f=await fixture();try{const remote=f.build(),before=[...f.map];f.ctx.NQ_OWNER_CLOUD_GUARD_VERIFIED=false;assert.throws(()=>f.build(),e=>e.code==='CLOUD_GUARD_REQUIRED');assert.equal(f.reconcile({version:1,progress:remote}),false);assert.deepEqual([...f.map],before);}finally{await f.n.release();}});
test('real cloud loader acquires retired authority before any legacy reconcile or empty marker write',async()=>{
 const f=await fixture();let resumed;
 try {
  f.n.retireLegacySources();await f.n.release();delete f.ctx.NQNormalProgress;
  let acquired=0,remoteReads=0;
  Object.assign(f.ctx,{NQ_DURABLE_PROGRESS:true,NQ_OWNER_CLOUD_GUARD_VERIFIED:false,_supaClient:{},_authSessionEpoch:1,_normalJourneyStaging:false,_pilotAnswerTransaction:null,
   async _ensureNormalAuthority(){acquired++;resumed=create({storage:f.storage,locks:{request:async(k,o,fn)=>fn({})},createAuthority,owner:'u',currentOwner:()=> 'u',validateSave:s=>s.character==='nephros',newJourneyId:()=> 'j'});await resumed.bootstrap();f.ctx.NQNormalProgress=resumed;return true;},
   async _readCloudProgress(){remoteReads++;throw Error('must not use legacy cloud');},_writeSaveTombstone(){throw Error('must not overwrite retired custody');}});
  vm.runInContext(section('    async function _loadProgressFromCloud(', '    // Atualiza o bloco'),f.ctx);
  assert.equal(await f.ctx._loadProgressFromCloud(),false);assert.equal(acquired,1);assert.equal(remoteReads,0);
  assert.equal(resumed.loadSave().score,10);
  assert.equal(f.storage.getItem('nefroquest-save-v7'),resumed.envelope().source.guard.saveRaw);
  assert.equal(JSON.parse(f.storage.getItem('nefroquest-save-v7')).saveRevision,undefined);
 } finally {if(resumed)await resumed.release();else await f.n.release();}
});

// Offline transitions are deliberately conservative. These regressions must stay
// blocking until a versioned, server-verified epoch journal replaces rejection.
test('offline multiple journeys preserve local state after ancestor reads, reload and remote divergence',async()=>{
 const f=await fixture();try{
  const ancestor={version:3,progress:f.build()};f.remember(ancestor);
  f.n.startJourney({...f.n.loadSave(),journeyId:'offline-1'});
  f.n.startJourney({...f.n.loadSave(),journeyId:'offline-2'});
  const current=f.n.envelope(),before=[...f.map];
  assert.equal(current.resetEpoch,2);
  assert.equal(f.reconcile(ancestor),true,'unchanged remote ancestor leaves offline progress intact');
  assert.deepEqual(f.n.envelope(),current);
  const exported=f.build();assert.equal(exported.ownerAuthority.state.resetEpoch,2);
  assert.equal(exported.ownerAuthority.base,cloud.fingerprint(ancestor.progress.ownerAuthority.state));
  await f.n.release();await f.n.bootstrap();
  assert.deepEqual(f.n.envelope(),current,'reload preserves all offline epochs');
  const changed=copy(ancestor);changed.version++;changed.progress.ownerAuthority.base=cloud.fingerprint(ancestor.progress.ownerAuthority.state);
  changed.progress.ownerAuthority.state.save.score=999;
  assert.equal(f.reconcile(changed),false);assert.deepEqual(f.n.envelope(),current);
 }finally{await f.n.release();}
});
test('offline reset plus new journey remains owner-bound and stale cloud cannot restore discarded acervo',async()=>{
 const f=await fixture();try{
  const ancestor={version:5,progress:f.build()};f.remember(ancestor);
  const save=f.n.loadSave();f.n.reset();f.n.startJourney({...save,journeyId:'after-reset',score:0});
  const reset=f.n.envelope();assert.equal(reset.resetEpoch,2);assert.deepEqual(reset.collections,{articles:[],knowledge:0});
  assert.equal(f.reconcile(ancestor),true);assert.deepEqual(f.n.envelope(),reset);
  const changed=copy(ancestor);changed.version++;
  changed.progress.ownerAuthority.base=cloud.fingerprint(ancestor.progress.ownerAuthority.state);
  changed.progress.ownerAuthority.state.collections.articles.push(9);
  const before=[...f.map];assert.equal(f.reconcile(changed),false);assert.deepEqual([...f.map],before);
  await f.n.release();await f.n.bootstrap();
  assert.deepEqual(f.n.envelope(),reset);
 }finally{await f.n.release();}
});
test('multi-epoch remote and transition-with-reward fail before stats, collections or receipt effects',async()=>{
 for(const scenario of ['multiple-journeys','reset-and-journey','journey-and-reward']){
  const f=await fixture();try{
   const initial=f.build(),remote=copy(initial);remote.ownerAuthority.base=cloud.fingerprint(initial.ownerAuthority.state);
   const s=remote.ownerAuthority.state;s.resetEpoch=scenario==='journey-and-reward'?1:2;
   s.tombstone={reason:'journey',epoch:s.resetEpoch};s.save.journeyId='offline-next';
   if(scenario==='reset-and-journey')s.collections={articles:[],knowledge:0};
   if(scenario==='journey-and-reward'){s.receipts.push({id:'synthetic-pending',journeyId:'offline-next',phase:'earned'});s.collections.knowledge++;}
   remote.stats={gamesPlayed:999};remote.achievements=['must-not-import'];
   const before=[...f.map];assert.equal(f.reconcile({version:2,progress:remote}),false,scenario);
   assert.deepEqual([...f.map],before,scenario);assert.equal(f.counts.stopped,0);
  }finally{await f.n.release();}
 }
});
