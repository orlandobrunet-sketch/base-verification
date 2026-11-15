/* Exact auxiliary branch projection. Pure: no storage, merge or cloud writes. */
(function(root){
 'use strict';
 const LIMITS=Object.freeze({depth:20,nodes:50000,bytes:1048576});
 const fields=Object.freeze([
  ['stats','nefroquest-stats','object'],
  ['achievements','nefroquest-achievements','array'],
  ['mastered','nefroquest-mastered','array'],
  ['unlockedRefs','nq-unlocked-refs','array'],
  ['arquiDefeated','nefroquest-arqui-defeated','boolean'],
  ['hardcoreCompleted','nefroquest-hardcore-completed','boolean'],
  ['detailedStats','nefroquest-detailed-stats','object'],
  ['acidBaseProgress','nq-acidbase-progress','object'],
  ['srData','nefroquest-sr-data','object']
 ]);
 const KEYS=Object.freeze([...fields.map(row=>row[1]),'nefroquest-gold-milestone-shown']);
 const forbidden=new Set(['__proto__','prototype','constructor']);
 const fail=()=>{throw Object.assign(new Error('Invalid auxiliary progress'),{code:'INVALID_AUXILIARY_PROGRESS'});};
 function plain(value){
  if(!value||typeof value!=='object'||Array.isArray(value))return false;
  const prototype=Object.getPrototypeOf(value);
  if(prototype===null)return true;
  const ctor=Object.getOwnPropertyDescriptor(prototype,'constructor');
  return Object.getPrototypeOf(prototype)===null&&ctor&&typeof ctor.value==='function'&&ctor.value.name==='Object'&&ctor.value.prototype===prototype;
 }
 function descriptors(value){
  const result=Object.getOwnPropertyDescriptors(value);
  if(Object.getOwnPropertySymbols(value).length)fail();
  for(const [key,d] of Object.entries(result)){
   if(forbidden.has(key)||!Object.prototype.hasOwnProperty.call(d,'value'))fail();
  }
  return result;
 }
 function project(progress){
  if(!plain(progress))fail();
  const own=descriptors(progress),active=new Set();let nodes=0,bytes=0;
  function finiteJSON(value,depth){
   if(++nodes>LIMITS.nodes||depth>LIMITS.depth)fail();
   if(value===null||typeof value==='boolean')return;
   if(typeof value==='string'){if(value.length>LIMITS.bytes)fail();return;}
   if(typeof value==='number'){if(!Number.isFinite(value))fail();return;}
   if(typeof value!=='object'||active.has(value))fail();
   const array=Array.isArray(value);if(!array&&!plain(value))fail();
   active.add(value);
   const props=descriptors(value);
   if(array){
    if(value.length>LIMITS.nodes||Object.keys(props).length!==value.length+1)fail();
    for(let i=0;i<value.length;i++){
     if(!Object.prototype.hasOwnProperty.call(props,String(i)))fail();
     finiteJSON(props[i].value,depth+1);
    }
   }else{
    for(const d of Object.values(props)){if(!d.enumerable)fail();finiteJSON(d.value,depth+1);}
   }
   active.delete(value);
  }
  const result={};
  for(const [field,key,type] of fields){
   const value=Object.prototype.hasOwnProperty.call(own,field)?own[field].value:type==='array'?[]:type==='object'?{}:false;
   if(type==='array'?!Array.isArray(value):type==='object'?!plain(value):typeof value!=='boolean')fail();
   finiteJSON(value,0);
   const raw=type==='boolean'?(value?'1':null):JSON.stringify(value);
   bytes+=raw===null?0:new TextEncoder().encode(raw).length;
   if(bytes>LIMITS.bytes)fail();
   result[key]=raw;
  }
  // This one-time presentation flag is local-only, not part of either cloud
  // branch. Reset it deterministically rather than borrowing the old branch.
  result['nefroquest-gold-milestone-shown']=null;
  return Object.freeze(result);
 }
 const api=Object.freeze({project,KEYS,LIMITS});
 if(typeof module==='object'&&module.exports)module.exports=api;else root.NQAuxiliaryProgress=api;
})(typeof window==='undefined'?globalThis:window);
