/* Explicit authority divergence choice. Never writes cloud or combines branches. */
(function(root){
 'use strict';
 const copy=v=>JSON.parse(JSON.stringify(v));
 const fail=code=>{throw Object.assign(new Error(code),{code});};
 const fp=v=>Array.isArray(v)?'['+v.map(fp).join(',')+']':v&&typeof v==='object'?'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+fp(v[k])).join(',')+'}':JSON.stringify(v);
 const decisions=new WeakMap(),restorations=new WeakMap();
 function remoteState(remote,owner){
  const envelope=remote?.progress?.ownerAuthority;
  if(!Number.isSafeInteger(remote?.version)||remote.version<0||envelope?.format!=='nq-owner-authority-v1'||envelope.state?.owner!==owner)fail('INVALID_AUTHORITY_REMOTE');
  return envelope.state;
 }
 function prepare(authority,remote,{localProgress=null}={}){
  const local=authority.exportCloud().state,state=remoteState(remote,local.owner);
  const token=Object.freeze({local:copy(local),remote:copy(state),version:remote.version,
   warning:'Os progressos não serão somados. Continuar neste aparelho mantém a nuvem sem alterações. Ao usar a nuvem, a jornada local e seus baús ficam arquivados neste aparelho, sem reaplicar recompensas.'});
  decisions.set(token,{localFingerprint:authority.fingerprint(),auxiliaryFingerprint:authority.auxiliaryFingerprint(),remote:copy(remote),remoteFingerprint:fp(state),localProgress:copy(localProgress)});
  return token;
 }
 function choose(authority,token,choice,freshRemote,{project=root.NQAuxiliaryProgress?.project}={}){
  const saved=decisions.get(token);if(!saved)fail('UNKNOWN_AUTHORITY_DECISION');
  if(!['local','remote'].includes(choice))fail('INVALID_CHOICE');
  remoteState(freshRemote,token.local.owner);
  if(fp(freshRemote)!==fp(saved.remote))fail('STALE_AUTHORITY_DECISION');
  if(saved.completed && authority.fingerprint()===saved.remoteFingerprint)return authority.load();
  if(authority.fingerprint()!==saved.localFingerprint||authority.auxiliaryFingerprint()!==saved.auxiliaryFingerprint)fail('STALE_AUTHORITY_DECISION');
  if(choice==='local')return null; // No local/cloud mutation and no new cloud ancestor.
  if(typeof project!=='function')fail('PROJECTION_REQUIRED');
  const projection=project(copy(saved.remote.progress));
  const result=authority.selectRemoteBranch(copy(saved.remote.progress.ownerAuthority.state),{
   expectedFingerprint:saved.localFingerprint,expectedAuxiliaryFingerprint:saved.auxiliaryFingerprint,expectedRemoteFingerprint:saved.remoteFingerprint,projection,
   archive:{localProgress:copy(saved.localProgress),remoteProgress:copy(saved.remote.progress)}});
  saved.completed=true;return result;
 }
 function prepareRestore(authority,index,{currentProgress}={}){
  const state=authority.load(),entry=state.source.authoritySelections?.[index];
  if(!Number.isSafeInteger(index)||index<0||!entry?.local||(!entry.localAuxiliaryRaw&&!entry.progress?.localProgress)||!currentProgress)fail('ARCHIVE_UNAVAILABLE');
  const token=Object.freeze({index,local:copy(entry.local),
   warning:'Restaurar troca a jornada ativa por este arquivo, incluindo acervo, estatísticas e baús. O ramo atual ficará arquivado. Recompensas não serão reaplicadas e a nuvem não será substituída.'});
  restorations.set(token,{fingerprint:authority.fingerprint(),auxiliaryFingerprint:authority.auxiliaryFingerprint(),entry:fp(entry),currentProgress:copy(currentProgress)});
  return token;
 }
 function restore(authority,token,{project=root.NQAuxiliaryProgress?.project}={}){
  const saved=restorations.get(token);if(!saved)fail('UNKNOWN_ARCHIVE_DECISION');
  const entry=authority.load().source.authoritySelections?.[token.index];
  if(authority.fingerprint()!==saved.fingerprint||authority.auxiliaryFingerprint()!==saved.auxiliaryFingerprint||fp(entry)!==saved.entry)fail('STALE_AUTHORITY_DECISION');
  if(typeof project!=='function')fail('PROJECTION_REQUIRED');
  const result=authority.restoreArchivedBranch(token.index,{expectedFingerprint:saved.fingerprint,expectedAuxiliaryFingerprint:saved.auxiliaryFingerprint,
   projection:entry.localAuxiliaryRaw ? copy(entry.localAuxiliaryRaw) : project(copy(entry.progress.localProgress)),currentProgress:copy(saved.currentProgress)});
  restorations.delete(token);return result;
 }
 const api=Object.freeze({prepare,choose,prepareRestore,restore});
 if(typeof module==='object'&&module.exports)module.exports=api;else root.NQAuthorityCloudDecision=api;
})(typeof window==='undefined'?globalThis:window);
