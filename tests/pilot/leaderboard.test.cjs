const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../../js/leaderboard.js'), 'utf8');
const benefitsSource = fs.readFileSync(path.join(__dirname, '../../js/character-benefits.js'), 'utf8');
function fixture({pilot=false, online=true, user=null, benefitsModule=true}={}) {
  const values=new Map(), calls=[];
  const storage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,String(v)),removeItem:k=>values.delete(k)};
  const ctx={window:{NQPilot:{active:pilot}},state:{character:'clerigo',score:10,level:1},characters:{clerigo:{name:'Dr. Nephros'},maga:{name:'Dra. Aquaria'},nephros:{name:'Dr. Nephros'},aquaria:{name:'Dra. Aquaria'},glomerulus:{name:'Dr. Glomerulus'}},authUser:user,SUPA_URL:'https://fixture.invalid',SUPA_KEY:'public-fixture',_supaClient:null,navigator:{onLine:online},localStorage:storage,document:{readyState:'loading',addEventListener(){},body:{classList:{contains:()=>false}}},console:{log(){},warn(){}},setTimeout:()=>1,clearTimeout(){},_track(){},_toast(){},fetch:async(url,options)=>{calls.push({url,options,payload:options?.body?JSON.parse(options.body):null});return {ok:true,json:async()=>[]};}};
  vm.createContext(ctx);if(benefitsModule)vm.runInContext(benefitsSource,ctx);vm.runInContext(source,ctx);
  return {ctx,values,calls,storage};
}
function normalJourney(f,{character='nephros',difficulty='normal',owner=f.ctx.authUser?.id||null,journeyId='normal-benefits-1',expired=false}={}) {
  const ledger=f.ctx.window.NQCharacterBenefits.create({character,difficulty,owner,journeyId});
  if(expired){ledger.windowAnswers=20;ledger.seenQids=Array.from({length:20},(_,i)=>'q'+i);ledger.creditedEvents=ledger.seenQids.map((id,i)=>journeyId+':'+(i+1)+':'+id);}
  Object.assign(f.ctx.state,{character,difficulty,journeyDomain:'normal',classBenefits:ledger});
  return {domain:'normal',journeyId,character,difficulty,owner,classBenefits:JSON.parse(JSON.stringify(ledger))};
}
test('active pilot never posts or queues a score, preserving existing normal queue',async()=>{
  for(const online of [true,false]) {
    const f=fixture({pilot:true,online}), old='[{"score":5,"level":1}]';
    f.storage.setItem('nq-pending-leaderboard',old);
    await f.ctx.boardPush(30,2,'Synthetic');
    assert.equal(f.calls.length,0);assert.equal(f.storage.getItem('nq-pending-leaderboard'),old);
  }
});
test('permanent pilot origin blocks after leaving and after benefit expiry',async()=>{
  const f=fixture();
  await f.ctx.boardPush(30,2,'Synthetic',{domain:'pilot',journeyId:'expired-pilot'});
  f.ctx.state.journeyDomain='pilot';await f.ctx.boardPush(30,2,'Synthetic');
  delete f.ctx.state.journeyDomain;f.ctx.state.classBenefits={windowAnswers:20};await f.ctx.boardPush(30,2,'Synthetic');
  assert.equal(f.calls.length,0);assert.equal(f.storage.getItem('nq-pending-leaderboard'),null);
});
test('ordinary online score retains its public payload without local origin metadata',async()=>{
  const f=fixture();await f.ctx.boardPush(30,2,'Synthetic',{domain:'normal',journeyId:'normal-1'});
  assert.equal(f.calls.length,1);assert.equal(f.calls[0].payload.score,30);
  assert.equal(f.calls[0].payload.player_name,'Synthetic');
  assert.equal(f.calls[0].payload._nqJourney,undefined);assert.equal(f.calls[0].payload.origin,undefined);
});
test('ordinary offline score captures origin and replay strips metadata',async()=>{
  const f=fixture({online:false});await f.ctx.boardPush(30,2,'Synthetic',{domain:'normal',journeyId:'normal-1'});
  const queued=JSON.parse(f.storage.getItem('nq-pending-leaderboard'));
  assert.deepEqual(queued[0]._nqJourney,{domain:'normal',journeyId:'normal-1'});
  f.ctx.navigator.onLine=true;await f.ctx.syncPendingLeaderboard();
  assert.equal(f.calls.length,1);assert.equal(f.calls[0].payload._nqJourney,undefined);
});
test('replay accepts historical normal scores and rejects every assisted origin shape',async()=>{
  const f=fixture();
  f.storage.setItem('nq-pending-leaderboard',JSON.stringify([
    {score:1,level:1,player_name:'Legacy'},
    {score:2,level:1,player_name:'Pilot',_nqJourney:{domain:'pilot',journeyId:'p'}},
    {score:3,level:1,player_name:'Pilot',origin:{domain:'pilot'}},
    {score:4,level:1,player_name:'Pilot',journeyDomain:'pilot'},
    {score:5,level:1,player_name:'Pilot',classBenefits:{windowAnswers:20}},
    {score:6,level:1,player_name:'Normal',_nqJourney:{domain:'normal',journeyId:'n'}}]));
  await f.ctx.syncPendingLeaderboard();
  assert.deepEqual(f.calls.map(c=>c.payload.score),[1,6]);
  assert.ok(f.calls.every(c=>!('_nqJourney' in c.payload)));
});
test('profile/account/nickname push uses normal persisted totals while pilot is active',async()=>{
  const f=fixture({pilot:true,user:{id:'synthetic-user'}});
  f.ctx.state.character='maga';f.ctx.state.journeyDomain='pilot';
  f.ctx.getDetailedStats=()=>({totalCorrect:999});f.ctx.getGameStats=()=>({gamesPlayed:999,bestLevel:99});
  f.storage.setItem('nefroquest-detailed-stats','{"totalCorrect":123}');
  f.storage.setItem('nefroquest-stats','{"gamesPlayed":7,"bestLevel":8}');
  f.storage.setItem('nefroquest-save-v7','{"character":"clerigo"}');
  const before=JSON.stringify([...f.values]);await f.ctx.profileStatsPush();
  assert.equal(f.calls.length,1);
  assert.deepEqual({correct:f.calls[0].payload.total_correct,games:f.calls[0].payload.total_games,level:f.calls[0].payload.best_level,character:f.calls[0].payload.character_name},{correct:123,games:7,level:8,character:'Dr. Nephros'});
  assert.equal(JSON.stringify([...f.values]),before);
});

test('each class in easy/normal/hard uses the ordinary ranking with a valid normal ledger',async()=>{
  for(const character of ['nephros','aquaria','glomerulus'])for(const difficulty of ['easy','normal','hard']){
    const f=fixture(),origin=normalJourney(f,{character,difficulty});
    await f.ctx.boardPush(30,2,'Normal character',origin);
    assert.equal(f.calls.length,1,character+'/'+difficulty);
    assert.equal(f.calls[0].payload.character_name,f.ctx.characters[character].name);
    assert.equal(f.calls[0].payload.score,30);
    for(const field of ['_nqJourney','origin','classBenefits','difficulty','owner','journeyDomain'])assert.equal(field in f.calls[0].payload,false);
    await f.ctx.boardPush(31,2,'Duplicate',origin);assert.equal(f.calls.length,1,'session rate limit preserved');
  }
});
test('normal benefits remain eligible after their 20-answer window ends',async()=>{
  const f=fixture(),origin=normalJourney(f,{character:'aquaria',expired:true});
  assert.equal(f.ctx.window.NQCharacterBenefits.valid(origin.classBenefits,{character:origin.character,difficulty:origin.difficulty,owner:null}),true);
  await f.ctx.boardPush(40,3,'Expired normal',origin);
  assert.equal(f.calls.length,1);assert.equal(f.calls[0].payload.score,40);
});
test('pending normal dialog keeps its captured class and rejects a different owner',async()=>{
  const f=fixture({user:{id:'owner-a'}}),origin=normalJourney(f);
  f.ctx.state.character='maga';f.ctx.state.classBenefits=null;
  normalJourney(f,{character:'aquaria',journeyId:'normal-next-journey'});
  await f.ctx.boardPush(45,3,'Captured',origin);
  assert.equal(f.calls.length,1);assert.equal(f.calls[0].payload.character_name,'Dr. Nephros');assert.equal(f.calls[0].payload.user_id,'owner-a');
  const other=fixture({user:{id:'owner-b'}});
  await other.ctx.boardPush(45,3,'Wrong owner',origin);
  assert.equal(other.calls.length,0);assert.equal(other.storage.getItem('nq-pending-leaderboard'),null);
});
test('invalid normal ledgers fail closed before POST or queue',async()=>{
  const mutations=[
    ledger=>{ledger.ruleset='character-benefits-pilot-v1';},
    ledger=>{ledger.version=99;},
    ledger=>{ledger.owner='other-owner';},
    ledger=>{ledger.lockedClass='aquaria';},
    ledger=>{ledger.difficulty='hard';},
    ledger=>{ledger.windowAnswers=21;},
    ledger=>{ledger.xpGranted=1;},
    ledger=>{ledger.goldGranted=2;},
    ledger=>{ledger.shieldSpent=true;},
    ledger=>{ledger.creditedEvents=['foreign:1:q1'];ledger.windowAnswers=1;ledger.seenQids=['q1'];},
    ledger=>{ledger.seenQids=['uncredited'];},
  ];
  for(const online of [true,false])for(const mutate of mutations){
    const f=fixture({online}),origin=normalJourney(f);mutate(f.ctx.state.classBenefits);
    const before=JSON.stringify([...f.values]);await f.ctx.boardPush(30,2,'Invalid normal',origin);
    assert.equal(f.calls.length,0);assert.equal(JSON.stringify([...f.values]),before);
  }
  for(const invalid of [false,0,'invalid',{}]){
    const f=fixture();f.ctx.state.journeyDomain='normal';f.ctx.state.classBenefits=invalid;
    await f.ctx.boardPush(30,2,'Malformed');assert.equal(f.calls.length,0);
  }
});
test('Hardcore remains eligible without benefits and rejects even structurally valid benefits',async()=>{
  const plain=fixture();plain.ctx.state.difficulty='hardcore';plain.ctx.state.journeyDomain='normal';
  await plain.ctx.boardPush(30,2,'Hardcore',{domain:'normal',journeyId:null,character:'clerigo',difficulty:'hardcore',owner:null,classBenefits:null});
  assert.equal(plain.calls.length,1);
  const forged=fixture(),origin=normalJourney(forged,{difficulty:'hardcore'});
  assert.equal(forged.ctx.window.NQCharacterBenefits.valid(origin.classBenefits,{character:origin.character,difficulty:'hardcore',owner:null}),true,'pure module is structural');
  await forged.ctx.boardPush(30,2,'Forged Hardcore',origin);assert.equal(forged.calls.length,0);
});
test('a missing benefits module blocks new ledgers while historical ordinary scores work',async()=>{
  const f=fixture(),origin=normalJourney(f);delete f.ctx.window.NQCharacterBenefits;
  await f.ctx.boardPush(30,2,'Missing validator',origin);assert.equal(f.calls.length,0);
  const legacy=fixture({benefitsModule:false});await legacy.ctx.boardPush(30,2,'Historical');
  assert.equal(legacy.calls.length,1);
});
test('captured new origin must retain its journey identity and ledger together',async()=>{
  for(const mutate of [origin=>{origin.journeyId=undefined;},origin=>{origin.journeyId='another';},origin=>{origin.classBenefits=null;}]){
    const f=fixture(),origin=normalJourney(f);mutate(origin);
    await f.ctx.boardPush(30,2,'Broken snapshot',origin);assert.equal(f.calls.length,0);
  }
});
test('sandbox, study and explicitly noncompetitive origins cannot POST or alter the queue',async()=>{
  const variants=[
    f=>{f.ctx.window.isProgressSandbox=()=>true;},
    f=>{f.ctx.studyModeActive=true;},
    f=>{f.ctx.document.body.classList.contains=name=>name==='nq-studying';},
    f=>{f.ctx.state.journeyDomain='practice';},
  ];
  for(const apply of variants){
    const f=fixture({online:false});f.storage.setItem('nq-pending-leaderboard','[{"score":5}]');apply(f);
    await f.ctx.boardPush(30,2,'Excluded');assert.equal(f.calls.length,0);assert.equal(f.storage.getItem('nq-pending-leaderboard'),'[{"score":5}]');
  }
  for(const domain of ['study','practice','exam','ritual','rapid','minigame','sandbox','demo']){
    const f=fixture();await f.ctx.boardPush(30,2,'Excluded',{domain});assert.equal(f.calls.length,0,domain);
  }
});
test('offline normal score captures a deep ledger snapshot and replay is independent of the active pilot',async()=>{
  const f=fixture({online:false,user:{id:'normal-owner'}}),origin=normalJourney(f,{character:'glomerulus'});
  await f.ctx.boardPush(55,4,'Offline normal',origin);
  const queued=JSON.parse(f.storage.getItem('nq-pending-leaderboard'));
  assert.deepEqual(queued[0]._nqJourney,origin);assert.equal(queued[0].user_id,'normal-owner');
  origin.classBenefits.goldGranted=99;f.ctx.state.classBenefits.goldGranted=99;
  assert.equal(queued[0]._nqJourney.classBenefits.goldGranted,0,'snapshot retained');
  f.ctx.window.NQPilot.active=true;f.ctx.state.journeyDomain='pilot';f.ctx.state.character='maga';f.ctx.navigator.onLine=true;
  await f.ctx.syncPendingLeaderboard();
  assert.equal(f.calls.length,1);assert.equal(f.calls[0].payload.character_name,'Dr. Glomerulus');assert.equal(f.calls[0].payload.user_id,'normal-owner');
  for(const field of ['_nqJourney','origin','classBenefits','difficulty','owner','journeyDomain'])assert.equal(field in f.calls[0].payload,false);
});
test('offline direct normal call captures its validated state ledger when origin is historical',async()=>{
  const f=fixture({online:false});normalJourney(f);
  await f.ctx.boardPush(60,4,'Direct normal',{domain:'normal',journeyId:'normal-benefits-1'});
  const queued=JSON.parse(f.storage.getItem('nq-pending-leaderboard'));
  assert.equal(queued[0]._nqJourney.character,'nephros');assert.equal(queued[0]._nqJourney.difficulty,'normal');assert.equal(queued[0]._nqJourney.owner,null);
  assert.equal(queued[0]._nqJourney.classBenefits.ruleset,f.ctx.window.NQCharacterBenefits.RULESET);
  f.ctx.navigator.onLine=true;await f.ctx.syncPendingLeaderboard();assert.equal(f.calls.length,1);
});
test('replay rejects invalid new snapshots and noncompetitive tags but preserves historical normal entries',async()=>{
  const f=fixture(),good=normalJourney(f,{character:'aquaria'}),bad=JSON.parse(JSON.stringify(good)),wrongOwner=JSON.parse(JSON.stringify(good)),hardcore=normalJourney(f,{difficulty:'hardcore'});
  bad.classBenefits.windowAnswers=21;wrongOwner.owner='other';wrongOwner.classBenefits.owner='other';
  const incomplete={...good};delete incomplete.owner;
  f.storage.setItem('nq-pending-leaderboard',JSON.stringify([
    {score:1,level:1,player_name:'Historical'},
    {score:2,level:1,player_name:'Valid normal',_nqJourney:good},
    {score:3,level:1,player_name:'Tampered',_nqJourney:bad},
    {score:4,level:1,player_name:'Wrong owner',_nqJourney:wrongOwner},
    {score:5,level:1,player_name:'Incomplete',_nqJourney:incomplete},
    {score:6,level:1,player_name:'Hardcore forged',_nqJourney:hardcore},
    {score:7,level:1,player_name:'Malformed',_nqJourney:{domain:'normal',classBenefits:false}},
    {score:8,level:1,player_name:'Study',_nqJourney:{domain:'study'}},
    {score:9,level:1,player_name:'Practice',origin:{domain:'practice'}},
    {score:10,level:1,player_name:'Sandbox',journeyDomain:'sandbox'},
    {score:11,level:1,player_name:'Conflicting pilot origin',_nqJourney:good,origin:{domain:'pilot'}},
    {score:12,level:1,player_name:'Historical normal tagged',_nqJourney:{domain:'normal',journeyId:'old-normal'}},
    {score:13,level:1,player_name:'Top-level pilot domain',domain:'pilot'},
    {score:14,level:1,player_name:'Contradictory pilot tags',_nqJourney:{domain:'normal',journeyDomain:'pilot',journeyId:null,classBenefits:null}},
    {score:15,level:1,player_name:'Top-level historical normal',domain:'normal'},
  ]));
  await f.ctx.syncPendingLeaderboard();
  assert.deepEqual(f.calls.map(c=>c.payload.score),[1,2,12,15]);
  assert.ok(f.calls.every(c=>!('_nqJourney' in c.payload)&&!('classBenefits' in c.payload)&&!('domain' in c.payload)));
});
