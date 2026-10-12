const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../../js/leaderboard.js'), 'utf8');
function fixture({pilot=false, online=true, user=null}={}) {
  const values=new Map(), calls=[];
  const storage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,String(v)),removeItem:k=>values.delete(k)};
  const ctx={window:{NQPilot:{active:pilot}},state:{character:'clerigo',score:10,level:1},characters:{clerigo:{name:'Dr. Nephros'},maga:{name:'Dra. Aquaria'}},authUser:user,SUPA_URL:'https://fixture.invalid',SUPA_KEY:'public-fixture',_supaClient:null,navigator:{onLine:online},localStorage:storage,document:{readyState:'loading',addEventListener(){}},console:{log(){},warn(){}},setTimeout:()=>1,clearTimeout(){},_track(){},_toast(){},fetch:async(url,options)=>{calls.push({url,options,payload:options?.body?JSON.parse(options.body):null});return {ok:true,json:async()=>[]};}};
  vm.createContext(ctx);vm.runInContext(source,ctx);
  return {ctx,values,calls,storage};
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
