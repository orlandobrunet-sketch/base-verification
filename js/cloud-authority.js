/* Owner authority cloud boundary. Host must enable only after server guard deployment. */
(function(root){
 'use strict';
 const fail=code=>{throw Object.assign(new Error(code),{code});};
 const copy=x=>JSON.parse(JSON.stringify(x));
 function build(authority,legacyProgress,{serverGuardVerified=false,base=null}={}){
  if(!serverGuardVerified)fail('CLOUD_GUARD_REQUIRED');
  const payload=authority.exportCloud({base});
  // Do not expose competing legacy copies of transactional collections/save.
  const result={...legacyProgress,ownerAuthority:payload};
  delete result.save;delete result.unlockedArticles;delete result.knowledge;
  return result;
 }
 function merge(authority,progress,{serverGuardVerified=false}={}){
  if(!serverGuardVerified)fail('CLOUD_GUARD_REQUIRED');
  if(!progress?.ownerAuthority)fail('CLOUD_LEGACY_BLOCKED');
  // Must run BEFORE any legacy merge side effects, so rejection preserves all data.
  const state=authority.importCloud(progress.ownerAuthority);
  const remaining=copy(progress);delete remaining.ownerAuthority;delete remaining.save;
  delete remaining.unlockedArticles;delete remaining.knowledge;
  return {state,remaining};
 }
 function fingerprint(v){if(Array.isArray(v))return '['+v.map(fingerprint).join(',')+']';if(v&&typeof v==='object')return '{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+fingerprint(v[k])).join(',')+'}';return JSON.stringify(v);}
 const api=Object.freeze({build,merge,fingerprint});
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.NQCloudAuthority=api;
})(typeof window==='undefined'?globalThis:window);
