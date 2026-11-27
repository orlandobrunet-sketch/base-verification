/* First legacy-cloud migration only. Not a resolver for two authority envelopes. */
(function(root){
 'use strict';
 const copy=v=>JSON.parse(JSON.stringify(v));
 const fail=code=>{throw Object.assign(new Error(code),{code});};
 const fp=v=>Array.isArray(v)?'['+v.map(fp).join(',')+']':v&&typeof v==='object'?'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+fp(v[k])).join(',')+'}':JSON.stringify(v);
 const prepared=new WeakMap(),selected=new WeakMap();
 function legacy(remote){
  if(!remote||!Number.isSafeInteger(remote.version)||remote.version<0||!remote.progress||typeof remote.progress!=='object'||Array.isArray(remote.progress))fail('INVALID_REMOTE');
  if(Object.prototype.hasOwnProperty.call(remote.progress,'ownerAuthority'))fail('AUTHORITY_REMOTE_NOT_LEGACY');
 }
 function prepare(authority,remote,{normalizeLegacy}={}){
  legacy(remote);if(typeof normalizeLegacy!=='function')fail('LEGACY_VALIDATOR_REQUIRED');
  const local=authority.exportCloud().state,normalized=normalizeLegacy(copy(remote.progress),local.owner);
  // Host validates the legacy presentation/catalog/owner and explicitly supplies
  // missing knowledge policy. This boundary never invents an old chest receipt.
  if(!normalized||!Object.prototype.hasOwnProperty.call(normalized,'save')||!normalized.collections||typeof normalized.knowledgePolicy!=='string'||!normalized.knowledgePolicy)fail('INVALID_LEGACY_SELECTION');
  const token=Object.freeze({version:remote.version,local:copy(local),remote:copy(normalized),
   warning:'A escolha substitui a jornada e o acervo como um conjunto. Dados e baús pendentes do ramo não escolhido não serão somados; uma cópia local será preservada.'});
  prepared.set(token,{localFingerprint:authority.fingerprint(),local:copy(local),remote:copy(remote),normalized:copy(normalized)});
  return token;
 }
 function choose(authority,token,choice,freshRemote){
  const saved=prepared.get(token);if(!saved)fail('UNKNOWN_DECISION');
  if(!['local','remote'].includes(choice))fail('INVALID_CHOICE');legacy(freshRemote);
  if(authority.fingerprint()!==saved.localFingerprint||freshRemote.version!==saved.remote.version||fp(freshRemote.progress)!==fp(saved.remote.progress))fail('STALE_DECISION');
  const state=copy(saved.local);
  if(choice==='remote'){
   state.resetEpoch++;if(!Number.isSafeInteger(state.resetEpoch))fail('INVALID_EPOCH');
   state.save=copy(saved.normalized.save);state.collections=copy(saved.normalized.collections);state.receipts=[];
   state.tombstone={reason:'legacy-selection',epoch:state.resetEpoch};
  }
  const payload={format:'nq-owner-authority-v1',base:null,state:copy(state)};
  authority.archiveLegacySelection({expectedFingerprint:saved.localFingerprint,legacyProgress:saved.remote.progress,legacyVersion:saved.remote.version,
   intent:{choice,localFingerprint:saved.localFingerprint,expectedVersion:freshRemote.version+1,payload}});
  const plan=Object.freeze({expectedVersion:freshRemote.version,ownerAuthority:{format:'nq-owner-authority-v1',base:null,state},choice});
  selected.set(plan,{...saved,choice,state:copy(state),expectedVersion:plan.expectedVersion,payload:copy(plan.ownerAuthority)});
  return plan;
 }
 function finalize(authority,plan,confirmedRemote){
  const saved=selected.get(plan);if(!saved)fail('UNKNOWN_SELECTION');
  if(!confirmedRemote||confirmedRemote.version!==saved.expectedVersion+1||fp(confirmedRemote.progress?.ownerAuthority)!==fp(saved.payload))fail('CLOUD_CONFIRMATION_REQUIRED');
  if(authority.fingerprint()!==saved.localFingerprint)fail('LOCAL_CHANGED_AFTER_CLOUD_COMMIT');
  let state;
  if(saved.choice==='local')state=authority.load();
  else state=authority.installLegacySelection(saved.state,{expectedFingerprint:saved.localFingerprint,
   legacyProgress:saved.remote.progress,legacyVersion:saved.remote.version});
  selected.delete(plan);return state;
 }
 function recover(authority,confirmedRemote){
  const archive=authority.load()?.source?.legacySelection,intent=archive?.intent;
  if(!intent||!['local','remote'].includes(intent.choice))fail('NO_PENDING_LEGACY_SELECTION');
  if(confirmedRemote?.version!==intent.expectedVersion||fp(confirmedRemote.progress?.ownerAuthority)!==fp(intent.payload))fail('CLOUD_CONFIRMATION_REQUIRED');
  if(authority.fingerprint()===fp(intent.payload.state))return authority.load();
  if(authority.fingerprint()!==intent.localFingerprint)fail('LOCAL_CHANGED_AFTER_CLOUD_COMMIT');
  return authority.installLegacySelection(intent.payload.state,{expectedFingerprint:intent.localFingerprint,legacyProgress:archive.remote,legacyVersion:archive.version});
 }
 const api=Object.freeze({prepare,choose,finalize,recover});
 if(typeof module==='object'&&module.exports)module.exports=api;else root.NQLegacyCloudDecision=api;
})(typeof window==='undefined'?globalThis:window);
