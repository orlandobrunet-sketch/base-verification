'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.resolve(__dirname,'../../js/auth.js'),'utf8');
const prefix='_supaClient.auth.getSession().then(',start=source.indexOf(prefix)+prefix.length;
assert(start>=prefix.length);
const open=source.indexOf('=> {',start)+3;let depth=0,quote=null,escaped=false,end=-1;
for(let index=open;index<source.length;index++){const char=source[index];
  if(quote){if(escaped)escaped=false;else if(char==='\\')escaped=true;else if(char===quote)quote=null;continue;}
  if(['"',"'",'`'].includes(char))quote=char;else if(char==='{')depth++;else if(char==='}'&&--depth===0){end=index+1;break;}}
assert(end>start);const callback=source.slice(start,end);
function environment({guest=false,epoch=1,initial=1}={}) {
  const calls=[];
  const ctx=vm.createContext({window:{_prepareProgressOwner:owner=>{calls.push(['prepare',owner]);return true;}},localStorage:{removeItem:key=>calls.push(['remove',key])},
    _acceptSessionUser:()=>true,_setAuthSessionUser:user=>{ctx.authUser=user;calls.push(['session',user?.id||null]);},
    _markExplicitLoginIntent:()=>calls.push(['intent']),_loadPremiumFromDB:()=>calls.push(['premium']),_loadProgressFromCloud:()=>calls.push(['cloud']),
    _invalidatePremiumCache:()=>calls.push(['invalidate']),updateWelcomeUserBadge:()=>calls.push(['badge']),_showSignedOutPortal:()=>calls.push(['portal']),
    _finishAuthStartup:()=>calls.push(['finish']),_consumeLoginIntent:()=>calls.push(['consume']),authUser:null,_guestMode:guest,
    _authSessionEpoch:epoch,initialSessionEpoch:initial,PREMIUM_KEY:'premium',WHITELIST_KEY:'whitelist'});
  vm.runInContext('globalThis.deliver='+callback,ctx);
  return {calls,deliver:user=>ctx.deliver({data:{session:user?{user}:null}}),setGuest:value=>ctx._guestMode=value};
}
test('actual initial null-session callback restores the signed-out Portal after owner preparation',()=>{
  const env=environment();env.deliver(null);
  assert.deepEqual(env.calls.filter(([name])=>['prepare','badge','portal','finish'].includes(name)),[['prepare',null],['badge'],['portal'],['finish']]);
});
test('Guest enabled while the initial session promise is pending is not redirected by its null delivery',()=>{
  const env=environment();env.setGuest(true);env.deliver(null);
  assert.equal(env.calls.filter(([name])=>name==='portal').length,0);assert.equal(env.calls.filter(([name])=>name==='finish').length,1);
});
test('accepted authenticated delivery retains premium/cloud preparation and does not enter signed-out Portal',()=>{
  const env=environment();env.deliver({id:'owner'});
  assert.deepEqual(env.calls.filter(([name])=>['prepare','premium','cloud','portal'].includes(name)),[['prepare','owner'],['premium'],['cloud']]);
});
test('stale initial-session epoch returns before owner preparation or presentation',()=>{
  const env=environment({epoch:2,initial:1});env.deliver(null);assert.deepEqual(env.calls,[]);
});
