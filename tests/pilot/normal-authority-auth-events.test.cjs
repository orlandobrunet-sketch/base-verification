'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require.resolve('../../js/auth.js'),'utf8');
function fixture(){
 const preparations=[],accepted=[],cloudOwners=[];let resolveInitial;
 const initial=new Promise(resolve=>resolveInitial=resolve);
 const ctx={console,window:{NQ_DURABLE_PROGRESS:true,
  _prepareProgressOwnerAsync:owner=>new Promise(resolve=>preparations.push({owner,resolve})),_stopLocalJourney(){}},
  authUser:null,_authSessionEpoch:0,_authSessionEventGeneration:0,_guestMode:false,
  _acceptSessionUser:()=>true,_setAuthSessionUser:user=>{ctx.authUser=user;accepted.push(user?.id??null);},
  _markExplicitLoginIntent(){},_loadPremiumFromDB(){},_loadProgressFromCloud(){cloudOwners.push(ctx.authUser?.id??null);},
  checkFirstTimeOnboarding(){},updateWelcomeUserBadge(){},_finishAuthStartup(){},_resumePaymentAfterLogin(){},
  _showSignedOutPortal(){},_consumeLoginIntent(){},showUpdatePasswordModal(){},
  localStorage:{removeItem(){}},_invalidatePremiumCache(){},PREMIUM_KEY:'premium',WHITELIST_KEY:'whitelist',
  _supaClient:{auth:{getSession:()=>initial}}};
 vm.createContext(ctx);
 vm.runInContext(source.slice(source.indexOf('      _authSessionHandler = async'),source.indexOf('      _supaClient.auth.onAuthStateChange')),ctx);
 const startInitial=()=>{
  const begin=source.indexOf('      const initialSessionEpoch ='),end=source.indexOf('    })();',begin);
  vm.runInContext(source.slice(begin,end).replace('_supaClient.auth.getSession().then','globalThis.initialFlight = _supaClient.auth.getSession().then'),ctx);
 };
 return {ctx,preparations,accepted,cloudOwners,startInitial,resolveInitial,
  event:owner=>ctx._authSessionHandler(owner===null?'SIGNED_OUT':'SIGNED_IN',{user:owner===null?null:{id:owner}})};
}
for(const order of [[0,1],[1,0]])test('latest auth event wins when prepare completions are '+order.join(' then '),async()=>{
 const f=fixture(),first=f.event('A'),second=f.event('B');
 assert.deepEqual(f.preparations.map(x=>x.owner),['A','B']);
 const flights=[first,second];for(const index of order){f.preparations[index].resolve(true);await flights[index];}
 assert.equal(f.ctx.authUser.id,'B');assert.deepEqual(f.accepted,['B']);assert.deepEqual(f.cloudOwners,['B']);
});
test('latest signout prevents late signin preparation from reopening account',async()=>{
 const f=fixture(),a=f.event('A'),b=f.event(null);f.preparations[0].resolve(true);await a;f.preparations[1].resolve(true);await b;
 assert.equal(f.ctx.authUser,null);assert.deepEqual(f.accepted,[null]);assert.deepEqual(f.cloudOwners,[]);
});
test('older failed preparation cannot clear a newer accepted account',async()=>{
 const f=fixture(),a=f.event('A'),b=f.event('B');f.preparations[1].resolve(true);await b;f.preparations[0].resolve(false);await a;
 assert.equal(f.ctx.authUser.id,'B');assert.deepEqual(f.accepted,['B']);
});
test('initial getSession response arriving after an auth event does not prepare or publish stale owner',async()=>{
 const f=fixture();f.startInitial();const b=f.event('B');f.resolveInitial({data:{session:{user:{id:'A'}}}});await f.ctx.initialFlight;
 assert.deepEqual(f.preparations.map(x=>x.owner),['B']);f.preparations[0].resolve(true);await b;assert.deepEqual(f.accepted,['B']);
});
test('initial getSession preparation finishing after newer event cannot publish stale owner',async()=>{
 const f=fixture();f.startInitial();f.resolveInitial({data:{session:{user:{id:'A'}}}});await Promise.resolve();
 assert.equal(f.preparations[0].owner,'A');const b=f.event('B');f.preparations[0].resolve(true);await f.ctx.initialFlight;
 assert.deepEqual(f.accepted,[]);f.preparations[1].resolve(true);await b;assert.deepEqual(f.accepted,['B']);
});
