'use strict';
const {test}=require('node:test'),a=require('node:assert/strict');
const {createAuthority}=require('../isolated-authority/owner-authority.cjs');
const decisionAPI=require('../js/authority-cloud-decision.js'),auxiliary=require('../js/auxiliary-progress.js');
const decisions={...decisionAPI,choose:(a,b,c,d,o={project:auxiliary.project})=>decisionAPI.choose(a,b,c,d,o)};
async function fixture(){
 const map=new Map();let owner='u',quota=false,failAux=false;
 const authority=createAuthority({storage:{getItem:k=>map.get(k)??null,setItem(k,v){if(failAux&&k==='nefroquest-stats')throw Error('aux write refused');if(quota)throw Error('quota');map.set(k,v);},removeItem(k){if(quota)throw Error('quota');map.delete(k);}},locks:{request:async(k,o,fn)=>fn({})},owner:'u',currentOwner:()=>owner,validateSave:s=>s.saveOwner==='u'&&!!s.journeyId});
 await authority.acquire();authority.initialize({saveOwner:'u',journeyId:'local',score:10},{articles:[1],knowledge:4});
 authority.commit(d=>d.receipts.push({id:'local-pending',journeyId:'local',phase:'prepared',reward:{kind:'article',articleIndex:2}}));
 const state=authority.exportCloud().state;state.save.journeyId='remote';state.save.score=20;state.receipts=[{id:'remote-consumed',journeyId:'remote',phase:'consumed',reward:{points:5},choice:'accept'}];state.collections={articles:[3],knowledge:7};
 const remote={version:9,progress:{ownerAuthority:{format:'nq-owner-authority-v1',base:'different',state},stats:{gamesPlayed:2}}};
 return {authority,map,remote,setQuota:v=>quota=v,setFailAux:v=>failAux=v,switchOwner:()=>owner='v'};
}
test('continue local does not change authority, ancestor, archives or remote branch',async()=>{
 const f=await fixture();try{const before=[...f.map],remote=structuredClone(f.remote),token=decisions.prepare(f.authority,f.remote);a.equal(decisions.choose(f.authority,token,'local',f.remote),null);a.deepEqual([...f.map],before);a.deepEqual(f.remote,remote);}finally{await f.authority.release();}
});
test('remote selection installs exact complete branch and archives prepared local receipt without replay',async()=>{
 const f=await fixture();try{const token=decisions.prepare(f.authority,f.remote),old=f.authority.exportCloud().state;decisions.choose(f.authority,token,'remote',f.remote);a.deepEqual(f.authority.exportCloud().state,f.remote.progress.ownerAuthority.state);const first=f.authority.load();a.ok(first.source.authoritySelections.some(x=>JSON.stringify(x.local)===JSON.stringify(old)));a.deepEqual(decisions.choose(f.authority,token,'remote',f.remote),first);await f.authority.release();await f.authority.acquire();a.deepEqual(f.authority.load(),first);}finally{await f.authority.release();}
});
test('changed remote version, stats or local work requires a fresh explicit choice',async()=>{
 for(const change of ['version','stats','local']){const f=await fixture();try{const token=decisions.prepare(f.authority,f.remote),fresh=structuredClone(f.remote);if(change==='version')fresh.version++;if(change==='stats')fresh.progress.stats.gamesPlayed++;if(change==='local')f.authority.commit(d=>d.save.score++);const before=[...f.map];a.throws(()=>decisions.choose(f.authority,token,'remote',fresh),e=>e.code==='STALE_AUTHORITY_DECISION');a.deepEqual([...f.map],before);}finally{await f.authority.release();}}
});
test('quota and account switch cannot replace either branch or consume local pending reward',async()=>{
 for(const change of ['quota','owner']){const f=await fixture();try{const token=decisions.prepare(f.authority,f.remote),before=[...f.map];if(change==='quota')f.setQuota(true);else f.switchOwner();a.throws(()=>decisions.choose(f.authority,token,'remote',f.remote));a.deepEqual([...f.map],before);}finally{await f.authority.release();}}
});
test('legacy and wrong-owner payloads cannot enter authority selection',async()=>{const f=await fixture();try{a.throws(()=>decisions.prepare(f.authority,{version:1,progress:{save:{}}}));const wrong=structuredClone(f.remote);wrong.progress.ownerAuthority.state.owner='other';a.throws(()=>decisions.prepare(f.authority,wrong));}finally{await f.authority.release();}});

test('host remote adoption never calls cloud writer or legacy stat merger and completes exact auxiliary projection',async()=>{
 const fs=require('node:fs'),vm=require('node:vm'),source=fs.readFileSync(require.resolve('../js/game.js'),'utf8');
 const f=await fixture();try{
  const token=decisions.prepare(f.authority,f.remote,{localProgress:{stats:{gamesPlayed:6}}});
  const conflict={binding:{owner:'u'},remote:f.remote,authorityToken:token};
  const status={textContent:''},buttons=[{disabled:false},{disabled:false}];
  const dialog={isConnected:true,querySelector:()=>status,querySelectorAll:()=>buttons};
  let stopped=0,remembered=0,closed=0;
  const ctx={console,_legacyCloudResolutionPending:false,_cloudConflict:conflict,_authorityCloudDeferred:new Map(),_progressEpoch:1,
   NQNormalProgress:{authority:f.authority,get writable(){return f.authority.writable}},NQAuthorityCloudDecision:decisions,NQAuxiliaryProgress:auxiliary,NQ_OWNER_CLOUD_GUARD_VERIFIED:true,
   _cloudBindingCurrent:()=>true,_readCloudProgress:async()=>f.remote,_stopLocalJourney(){stopped++;ctx._progressEpoch++;},
   _rememberCloudProgress(){remembered++;},_reloadJourneyCollections(){},_invalidateStatsCache(){},refreshWelcomeSave(){},_closeCloudProgressConflict(){closed++;dialog.isConnected=false;},_cloudStatus(text){status.textContent=text;},
   _mergeCloudProgress(){throw Error('must not merge stats');},_commitCloudProgress(){throw Error('must not write cloud');},_canSyncLocalProgress(){throw Error('must not ask to sync local');}};
  ctx.window=ctx;vm.createContext(ctx);
  vm.runInContext(source.slice(source.indexOf('    async function _resolveCloudProgressConflict('),source.indexOf('    window._resetCloudSync =')),ctx);
  await ctx._resolveCloudProgressConflict(conflict,false,dialog);
  a.equal(stopped,1);a.equal(remembered,1);a.equal(closed,1);a.match(status.textContent,/estatísticas conferidas/);
  a.equal(f.authority.load().source.cloudSyncHold,undefined);
  a.equal(f.map.get('nefroquest-stats'),JSON.stringify({gamesPlayed:2}));
  a.deepEqual(f.authority.load().source.authoritySelections.at(-1).progress.localProgress,{stats:{gamesPlayed:6}});
  vm.runInContext(source.slice(source.indexOf('    function _buildCloudProgress()'),source.indexOf('    async function _commitCloudProgress(')),ctx);

 }finally{await f.authority.release();}
});

test('version-only CAS confirmation retains journal; exact reread permits cleanup without changing authority',async()=>{
 const fs=require('node:fs'),vm=require('node:vm'),source=fs.readFileSync(require.resolve('../js/game.js'),'utf8');
 const f=await fixture();try{
  f.authority.startJourney({saveOwner:'u',journeyId:'next',score:0},{discardPending:true});
  const before=f.authority.load(),payload=f.authority.exportCloud({base:null}),storage=new Map();
  const ctx={console,localStorage:{setItem:(k,v)=>storage.set(k,v)},NQNormalProgress:{authority:f.authority,get writable(){return f.authority.writable}},NQCloudAuthority:{fingerprint:()=> 'fingerprint'},_cloudJourneyFingerprint:()=>null,_cloudFingerprint:()=> 'payload'};
  ctx.window=ctx;vm.createContext(ctx);
  vm.runInContext(source.slice(source.indexOf('    function _cloudCheckpointKey('),source.indexOf('    async function _readCloudProgress(')),ctx);
  const remote={version:10,progress:{ownerAuthority:payload}};
  ctx._rememberCloudProgress('u',remote);a.deepEqual(f.authority.load(),before);
  ctx._rememberCloudProgress('u',remote,{confirmedRead:true});
  a.deepEqual(f.authority.exportCloud().state,payload.state);
  a.notDeepEqual(f.authority.load().source,before.source,'confirmed reread prunes the journal');
  a.ok(storage.has('nefroquest-authority-cloud-v1:u'));
 }finally{await f.authority.release();}
});

async function choiceHost(f){
 const fs=require('node:fs'),vm=require('node:vm'),source=fs.readFileSync(require.resolve('../js/game.js'),'utf8');
 const initial={binding:{owner:'u'},remote:f.remote,authorityToken:decisions.prepare(f.authority,f.remote)};
 const counts={shown:0,stopped:0};let current=true;
 const ctx={console,_legacyCloudResolutionPending:false,_cloudConflict:initial,_authorityCloudDeferred:new Map(),_progressEpoch:1,
  NQNormalProgress:{authority:f.authority,get writable(){return f.authority.writable}},NQAuthorityCloudDecision:decisions,NQAuxiliaryProgress:auxiliary,NQ_OWNER_CLOUD_GUARD_VERIFIED:true,
  _cloudBindingCurrent:()=>current,_readCloudProgress:async()=>f.remote,_buildCloudProgress(options){a.equal(options.forLocalArchive,true);return {ownerAuthority:f.authority.exportCloud({base:null}),stats:{gamesPlayed:6}};},
  _showCloudProgressConflict(){counts.shown++;},_cloudStatus(){},_stopLocalJourney(){counts.stopped++;ctx._progressEpoch++;},
  _rememberCloudProgress(){},_reloadJourneyCollections(){},_invalidateStatsCache(){},refreshWelcomeSave(){},_closeCloudProgressConflict(){},
  _mergeCloudProgress(){throw Error('must not merge');},_commitCloudProgress(){throw Error('must not write');}};
 ctx.window=ctx;vm.createContext(ctx);
 vm.runInContext(source.slice(source.indexOf('    async function _reopenAuthorityCloudChoice('),source.indexOf('    function _showCloudProgressConflict()')),ctx);
 vm.runInContext(source.slice(source.indexOf('    async function _resolveCloudProgressConflict('),source.indexOf('    window._resetCloudSync =')),ctx);
 const dialog=()=>({isConnected:true,querySelector:()=>({textContent:''}),querySelectorAll:()=>[{disabled:false},{disabled:false}]});
 return {ctx,counts,initial,dialog,retire:()=>current=false};
}
test('playing after defer then reopening refreshes token and requires a new explicit remote choice',async()=>{
 const f=await fixture();try{
  const h=await choiceHost(f);decisions.choose(f.authority,h.initial.authorityToken,'local',f.remote);
  f.authority.commit(d=>d.save.score+=15);const before=f.authority.exportCloud().state;
  a.equal(await h.ctx._reopenAuthorityCloudChoice(h.initial),true);
  a.equal(h.counts.shown,1);a.notEqual(h.ctx._cloudConflict.authorityToken,h.initial.authorityToken);
  a.equal(h.ctx._cloudConflict.authorityToken.local.save.score,25);
  a.deepEqual(f.authority.exportCloud().state,before,'reopening never selects');a.equal(h.counts.stopped,0);
  await h.ctx._resolveCloudProgressConflict(h.ctx._cloudConflict,false,h.dialog());
  a.equal(h.counts.stopped,1);a.deepEqual(f.authority.exportCloud().state,f.remote.progress.ownerAuthority.state);
 }finally{await f.authority.release();}
});
test('stale submit refreshes dialog without adopting until the player confirms again',async()=>{
 const f=await fixture();try{
  const h=await choiceHost(f);f.authority.commit(d=>d.save.score++);const before=f.authority.exportCloud().state;
  await h.ctx._resolveCloudProgressConflict(h.initial,false,h.dialog());
  a.equal(h.counts.shown,1);a.equal(h.counts.stopped,0);a.deepEqual(f.authority.exportCloud().state,before);
  await h.ctx._resolveCloudProgressConflict(h.ctx._cloudConflict,false,h.dialog());a.equal(h.counts.stopped,1);
 }finally{await f.authority.release();}
});
test('account or dialog changes during refresh retire the late choice without modifying data',async()=>{
 for(const race of ['account','dialog','authority']){const f=await fixture();try{
  const h=await choiceHost(f);let finish;h.ctx._readCloudProgress=()=>new Promise(resolve=>finish=resolve);
  const before=[...f.map],pending=h.ctx._reopenAuthorityCloudChoice(h.initial);
  if(race==='account')h.retire();else if(race==='dialog')h.ctx._cloudConflict={};else h.ctx.NQNormalProgress={authority:f.authority};
  finish(f.remote);a.equal(await pending,false);a.equal(h.counts.shown,0);a.deepEqual([...f.map],before);
 }finally{await f.authority.release();}}
});

test('reset/logout clears deferred session choices so another account never inherits a hidden pause',()=>{
 const fs=require('node:fs'),vm=require('node:vm'),source=fs.readFileSync(require.resolve('../js/game.js'),'utf8');
 const ctx={_cloudConflict:{binding:{owner:'u'}},_authorityCloudDeferred:new Map([['u','old-remote'],['previous-account','old-remote']]),_closeCloudProgressConflict(){},_closeArchivedAuthorityBranches(){},_cloudStatus(){}};
 ctx.window=ctx;vm.createContext(ctx);
 vm.runInContext(source.slice(source.indexOf('    window._resetCloudSync ='),source.indexOf('    function _scheduleCloudSync()')),ctx);
 ctx._resetCloudSync();a.equal(ctx._cloudConflict,null);a.equal(ctx._authorityCloudDeferred.size,0);
 ctx._resetCloudSync();a.equal(ctx._authorityCloudDeferred.size,0,'repeat logout/reset is harmless');
});

test('real host multi-epoch divergence opens a fresh choice using local-only archive, never a forced upload base',async()=>{
 const fs=require('node:fs'),vm=require('node:vm'),cloud=require('../js/cloud-authority.js'),source=fs.readFileSync(require.resolve('../js/game.js'),'utf8');
 const f=await fixture();try{
  f.authority.startJourney({saveOwner:'u',journeyId:'next-1',score:0},{discardPending:true});
  f.authority.startJourney({saveOwner:'u',journeyId:'next-2',score:0});
  let shown=0;
  const ctx={console,clearTimeout,Date,JSON,Map,Set,_saveTimer:null,_autoSaveTimer:null,state:{gameStarted:false},_progressEpoch:1,_cloudConflict:null,
   _authorityCloudDeferred:new Map(),NQNormalProgress:{authority:f.authority,exportCloud:o=>f.authority.exportCloud(o)},NQCloudAuthority:cloud,NQAuthorityCloudDecision:decisions,NQAuxiliaryProgress:auxiliary,NQ_OWNER_CLOUD_GUARD_VERIFIED:true,
   localStorage:{getItem:()=>null},MASTERED_KEY:'mastered',STATS_STORAGE_KEY:'stats',CANONICAL_SAVE_KEY:'save',SAVE_KEY:'old-save',
   getNormalGameStats:()=>({gamesPlayed:4}),_isSaveTombstone:()=>true,_currentSaveOwner:()=> 'u',
   _cloudBindingCurrent:()=>true,_cloudCheckpoint:()=>({version:f.remote.version,authorityBase:cloud.fingerprint(f.remote.progress.ownerAuthority.state)}),
   _mergeCloudProgress:()=>false,_showCloudProgressConflict(){shown++;},_cloudStatus(){}};
  ctx.window=ctx;vm.createContext(ctx);
  const hardcoreStart=source.indexOf('    const _hardcoreCorrect =');
  const hardcoreEnd=source.indexOf('    function _persistHardcoreBest(',hardcoreStart);
  a.ok(hardcoreStart>=0 && hardcoreEnd>hardcoreStart,'the actual Hardcore record helpers must be loaded');
  vm.runInContext(source.slice(hardcoreStart,hardcoreEnd),ctx);
  vm.runInContext(source.slice(source.indexOf('    function _buildCloudProgress()'),source.indexOf('    async function _commitCloudProgress(')),ctx);
  vm.runInContext(source.slice(source.indexOf('    function _reconcileCloudProgress('),source.indexOf('    function _closeCloudProgressConflict(')),ctx);
  const before=[...f.map];a.equal(ctx._reconcileCloudProgress({owner:'u'},f.remote),false);
  a.equal(shown,1);a.equal(ctx._cloudConflict.authorityToken.local.resetEpoch,2);a.deepEqual([...f.map],before);
  a.equal(ctx._buildCloudProgress({forLocalArchive:true}).ownerAuthority.base,null);
  a.throws(()=>ctx._buildCloudProgress(),'ordinary upload must not replace its ancestor to force a conflict through');
 }finally{await f.authority.release();}
});

test('transient refresh failure leaves an immediate retry and the retry only presents a new decision',async()=>{
 const f=await fixture();try{
  const h=await choiceHost(f);let retryOffered=0;
  h.ctx._offerDeferredAuthorityChoice=message=>{a.match(message,/Rever escolha/);retryOffered++;};
  h.ctx._readCloudProgress=async()=>{throw Error('offline');};const before=[...f.map];
  a.equal(await h.ctx._reopenAuthorityCloudChoice(h.initial),false);a.equal(retryOffered,1);a.deepEqual([...f.map],before);
  h.ctx._readCloudProgress=async()=>f.remote;
  a.equal(await h.ctx._reopenAuthorityCloudChoice(h.initial),true);a.equal(h.counts.shown,1);a.equal(h.counts.stopped,0);a.deepEqual([...f.map],before);
 }finally{await f.authority.release();}
});

test('partial auxiliary projection stops gameplay and reload resumes exact targets without duplicate reward',async()=>{
 const f=await fixture();try{
  const h=await choiceHost(f);f.setFailAux(true);
  await h.ctx._resolveCloudProgressConflict(h.initial,false,h.dialog());
  a.equal(h.counts.stopped,1);a.equal(f.authority.writable,false);
  a.ok(f.authority.load().source.auxiliaryProjection);a.equal(f.authority.load().source.authoritySelections.length,1);
  f.setFailAux(false);await f.authority.release();await f.authority.acquire();
  f.authority.resumeAuxiliaryProjection();
  a.equal(f.authority.writable,true);a.equal(f.authority.load().source.cloudSyncHold,undefined);
  a.deepEqual(f.authority.exportCloud().state,f.remote.progress.ownerAuthority.state);
  a.equal(f.map.get('nefroquest-stats'),JSON.stringify({gamesPlayed:2}));
 }finally{await f.authority.release();}
});
test('archive restore requires explicit token, swaps exact branch+auxiliary values and retains upload hold',async()=>{
 const f=await fixture();try{
  f.map.set('nefroquest-stats','{"gamesPlayed":41}');const original=f.authority.exportCloud().state;
  const choose=decisions.prepare(f.authority,f.remote,{localProgress:{stats:{gamesPlayed:41}}});
  decisions.choose(f.authority,choose,'remote',f.remote);
  const before=[...f.map],token=decisions.prepareRestore(f.authority,0,{currentProgress:f.remote.progress});
  a.deepEqual([...f.map],before,'preview does not restore');
  decisions.restore(f.authority,token,{project:auxiliary.project});
  a.deepEqual(f.authority.exportCloud().state,original);a.equal(f.map.get('nefroquest-stats'),'{"gamesPlayed":41}');
  a.equal(f.authority.load().source.cloudSyncHold.reason,'restored-archive');
  a.equal(f.authority.load().source.authoritySelections.length,1);a.deepEqual(f.authority.load().source.authoritySelections[0].local,f.remote.progress.ownerAuthority.state);
  a.throws(()=>decisions.restore(f.authority,token,{project:auxiliary.project}),e=>e.code==='UNKNOWN_ARCHIVE_DECISION');
 }finally{await f.authority.release();}
});
test('stale archive preview cannot replace gameplay completed after preview or cross account',async()=>{
 for(const change of ['progress','account']){const f=await fixture();try{
  decisions.choose(f.authority,decisions.prepare(f.authority,f.remote),'remote',f.remote);
  const token=decisions.prepareRestore(f.authority,0,{currentProgress:f.remote.progress});
  if(change==='progress')f.authority.commit(d=>d.save.score++);else f.switchOwner();
  const before=[...f.map];a.throws(()=>decisions.restore(f.authority,token,{project:auxiliary.project}));a.deepEqual([...f.map],before);
 }finally{await f.authority.release();}}
});

test('archive dialog lists and previews without mutation; only explicit confirmation restores then requests read-only choice',async()=>{
 const fs=require('node:fs'),vm=require('node:vm'),source=fs.readFileSync(require.resolve('../js/game.js'),'utf8');
 const f=await fixture();try{
  decisions.choose(f.authority,decisions.prepare(f.authority,f.remote),'remote',f.remote);
  const before=[...f.map],nodes=new Map();
  class Element{
   constructor(){this.children=[];this.selectors=new Map();this.dataset={};this.isConnected=false;}
   setAttribute(){} querySelector(selector){if(!this.selectors.has(selector))this.selectors.set(selector,new Element());return this.selectors.get(selector);}
   appendChild(child){this.children.push(child);child.isConnected=true;if(child.id)nodes.set(child.id,child);return child;}
   replaceChildren(){this.children=[];}remove(){this.isConnected=false;nodes.delete(this.id);}
  }
  let stopped=0,reads=0,focusReleased=0;
  const ctx={console,_archiveDialogFocus:null,NQNormalProgress:{authority:f.authority,get writable(){return f.authority.writable;}},NQAuthorityCloudDecision:decisions,NQAuxiliaryProgress:auxiliary,
   _authSessionEpoch:1,_progressEpoch:1,_currentSaveOwner:()=> 'u',isCharacterPilot:()=>false,
   _cloudBinding:()=>({owner:'u',authEpoch:1,progressEpoch:1}),_cloudBindingCurrent:()=>true,document:{getElementById:id=>nodes.get(id),createElement:()=>new Element(),body:new Element()},manageDialogFocus:()=>()=>{focusReleased++;},
   _buildCloudProgress:()=>f.remote.progress,_stopLocalJourney(){stopped++;},_invalidateStatsCache(){},_reloadJourneyCollections(){},refreshWelcomeSave(){},_cloudStatus(){},
   _loadProgressFromCloud(){reads++;a.equal(f.authority.load().source.cloudSyncHold.reason,'restored-archive');return Promise.resolve(false);}};
  ctx.window=ctx;vm.createContext(ctx);
  vm.runInContext(source.slice(source.indexOf('    function _closeArchivedAuthorityBranches('),source.indexOf('    function _offerDeferredAuthorityChoice(')),ctx);
  ctx._showArchivedAuthorityBranches();const dialog=nodes.get('authorityArchiveDialog');a.ok(dialog);
  a.deepEqual([...f.map],before);dialog.querySelector('[data-archive-list]').children[0].onclick();a.deepEqual([...f.map],before);
  const confirm=dialog.querySelector('[data-archive-preview]').children[1];a.match(confirm.textContent,/Confirmar restauração/);confirm.onclick();
  a.equal(stopped,1);a.equal(reads,1);a.equal(f.authority.load().save.journeyId,'local');a.equal(f.authority.load().receipts[0].phase,'prepared');
  a.equal(focusReleased,1);
  ctx._showArchivedAuthorityBranches();a.ok(nodes.has('authorityArchiveDialog'));
  Object.assign(ctx,{_cloudConflict:null,_authorityCloudDeferred:new Map(),_closeCloudProgressConflict(){}});
  vm.runInContext(source.slice(source.indexOf('    window._resetCloudSync ='),source.indexOf('    function _scheduleCloudSync()')),ctx);
  ctx._resetCloudSync();a.equal(nodes.has('authorityArchiveDialog'),false);a.equal(focusReleased,2,'account reset releases focus trap immediately');
  ctx._resetCloudSync();a.equal(focusReleased,2,'repeated reset does not release twice');
 }finally{await f.authority.release();}
});

test('old-tab copy downloads exact archived strings only while its dialog owner remains current', () => {
 const fs=require('node:fs'),vm=require('node:vm'),source=fs.readFileSync(require.resolve('../js/game.js'),'utf8');
 const nodes=new Map(),payloads=[],downloads=[];
 class Element {
  constructor(){this.children=[];this.selectors=new Map();this.dataset={};this.isConnected=false;}
  setAttribute(){} querySelector(selector){if(!this.selectors.has(selector))this.selectors.set(selector,new Element());return this.selectors.get(selector);}
  appendChild(child){this.children.push(child);child.isConnected=true;if(child.id)nodes.set(child.id,child);return child;}
  remove(){this.isConnected=false;nodes.delete(this.id);}
  click(){downloads.push(this.download);}
 }
 let owner='u';
 const archive={index:0,archivedAt:1760000000000,saveRaw:'{ "saveOwner": "u" }',legacyRaw:null,articlesRaw:'[ 1, 2 ]',knowledgeRaw:'5'};
 const ctx={console,_archiveDialogFocus:null,_authSessionEpoch:1,_progressEpoch:1,
  _currentSaveOwner:()=>owner,isCharacterPilot:()=>false,_cloudBinding:()=>({owner,authEpoch:ctx._authSessionEpoch,progressEpoch:ctx._progressEpoch}),
  _cloudBindingCurrent:()=>true,NQNormalProgress:{writable:true,legacySourceArchives:()=>[archive]},
  document:{getElementById:id=>nodes.get(id),createElement:()=>new Element(),body:new Element()},manageDialogFocus:()=>()=>{},
  Blob:class {constructor(parts){this.parts=parts;}},URL:{createObjectURL(blob){payloads.push(...blob.parts);return 'blob:technical';},revokeObjectURL(){}},
  setTimeout:fn=>fn()};
 ctx.window=ctx;vm.createContext(ctx);
 vm.runInContext(source.slice(source.indexOf('    function _closeArchivedAuthorityBranches('),source.indexOf('    function _offerDeferredAuthorityChoice(')),ctx);
 ctx._showArchivedAuthorityBranches();
 const dialog=nodes.get('authorityArchiveDialog');
 const download=dialog.querySelector('[data-archive-older-tab]').children[1];
 download.onclick();
 a.deepEqual(payloads.map(JSON.parse),[archive]);
 a.deepEqual(downloads,['nefroquest-copia-aba-antiga-1.json']);

 owner='other-account';ctx._authSessionEpoch++;
 download.onclick();
 a.equal(payloads.length,1,'an old control cannot create a download for a different owner');
 a.equal(nodes.has('authorityArchiveDialog'),false);
});

test('auxiliary-only study/minigame changes invalidate remote selection without authority mutation',async()=>{
 const f=await fixture();try{
  const token=decisions.prepare(f.authority,f.remote),authorityBefore=f.authority.fingerprint();
  f.map.set('nefroquest-stats','{"gamesPlayed":99}');const before=[...f.map];
  a.equal(f.authority.fingerprint(),authorityBefore);
  a.throws(()=>decisions.choose(f.authority,token,'remote',f.remote),e=>e.code==='STALE_AUTHORITY_DECISION');a.deepEqual([...f.map],before);
 }finally{await f.authority.release();}
});
test('auxiliary-only changes after archive preview require new confirmation and preserve both branches',async()=>{
 const f=await fixture();try{
  decisions.choose(f.authority,decisions.prepare(f.authority,f.remote),'remote',f.remote);
  const token=decisions.prepareRestore(f.authority,0,{currentProgress:f.remote.progress});
  f.map.set('nq-acidbase-progress','{"completed":["new-case"]}');const before=[...f.map];
  a.throws(()=>decisions.restore(f.authority,token,{project:auxiliary.project}),e=>e.code==='STALE_AUTHORITY_DECISION');a.deepEqual([...f.map],before);
 }finally{await f.authority.release();}
});
