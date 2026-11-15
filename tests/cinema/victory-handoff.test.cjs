const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

function fixture({mobile=false,evolution=false,pendingChest=false,rewardVisible=true,film=false,deferNative=false}={}){
 const observers=[],frames=[],timers=new Map();let overlay=rewardVisible,pending=pendingChest,nativePending=false,native=0,releases=0,serial=0,results=false,evolutionNode=null,evolutionCalls=0,lastEvolution=null,now=1,filmOpens=0,onFilmDone=null;
 const question={id:'technical-final'},answer={id:'accepted-final'};
 const state={character:'nephros',current:question,questionAnswer:answer,answered:true,correctTotal:100,
  gameCompleted:false,completedGame:false,gameOver:false,gameStarted:true,lives:3,level:10};
 const main={hidden:false,classList:{contains:()=>false},getClientRects:()=>[{}]};
 const reward={id:'autoChestPopup',hidden:false,getClientRects:()=>[{}]};
 const arena={prepareOutcome(){},outcome(){},holdNativeCompletion:()=>true,releaseNativeCompletion:()=>releases++};
 const noop=()=>{};
 const context={state,_progressEpoch:1,NQBossArena:arena,NQVictoryCinema:{cancelContext:noop,dispose:noop,
   open:film?request=>{filmOpens++;onFilmDone=request.onDone;return true;}:undefined},
  hasPendingChestReward:()=>pending,
  hasPendingVictoryResults:()=>nativePending,
  showGameCompletionModal:()=>{native++;if(deferNative)nativePending=true;else results=true;},getBossHP:()=>0,getBossProgress:()=>10,
  _captureJourneyBinding:()=>({epoch:1}),_matchesJourneyBinding:b=>b.epoch===context._progressEpoch,
  navigator:{maxTouchPoints:mobile?1:0},performance:{now:()=>now},
  matchMedia:q=>({matches:q.includes('any-pointer')?mobile:!mobile,addEventListener:noop,removeEventListener:noop}),
  MutationObserver:class{constructor(callback){this.callback=callback;this.connected=true;observers.push(this);}observe(){}disconnect(){this.connected=false;}},
  document:{readyState:'complete',hidden:false,body:{appendChild:node=>{evolutionNode=node;node.isConnected=true;return node;}},addEventListener:noop,removeEventListener:noop,
   getElementById:id=>id==='mainApp'?main:id==='victoryModal'&&results?{}:null,
   querySelector:selector=>selector==='.evolution-popup'?evolutionNode:null,querySelectorAll:()=>overlay?[reward]:[]},
  getComputedStyle:()=>({visibility:'visible'}),requestAnimationFrame:fn=>(frames.push(fn),frames.length),cancelAnimationFrame:noop,
  setTimeout:(fn,delay=0)=>{timers.set(++serial,{fn,at:now+delay});return serial;},clearTimeout:id=>timers.delete(id),
  addEventListener:noop,removeEventListener:noop,console};
 context.window=context;
 if(evolution)context.showEvolutionPopup=level=>{evolutionCalls++;const node={level,dataset:{},contains:()=>false,
  remove(){if(evolutionNode===this)evolutionNode=null;this.isConnected=false;}};lastEvolution=node;context.document.body.appendChild(node);return node;};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../../js/cinema-victory-bridge.js'),'utf8'),context);
 const event={answerIdentity:answer,accepted:true,wasBoss:true,correct:true,blocked:false,contextEpoch:1,
  progressBefore:9,progressAfter:10,hpBefore:10,hpAfter:0,gameCompleted:true,gameOver:false,livesAfter:3};
 arena.prepareOutcome(event);state.gameCompleted=true;context.showGameCompletionModal();arena.outcome(event);
 while(frames.length)frames.shift()();
 const notify=()=>{for(const o of observers)if(o.connected)o.callback();while(frames.length)frames.shift()();};
 const advance=ms=>{const end=now+ms;for(;;){const next=[...timers.entries()].filter(([,t])=>t.at<=end).sort((a,b)=>a[1].at-b[1].at||a[0]-b[0])[0];if(!next)break;timers.delete(next[0]);now=next[1].at;next[1].fn();while(frames.length)frames.shift()();}now=end;};
 return{context,state,native:()=>native,releases:()=>releases,evolutionCalls:()=>evolutionCalls,
  originalEvolution:()=>lastEvolution,visibleEvolution:()=>evolutionNode,
  announceEvolution(level=10){return context.showEvolutionPopup(level);},
  advance,filmOpens:()=>filmOpens,
  completeNativeResults(){nativePending=false;results=true;notify();},
  revealReward(){overlay=true;notify();},claimReward(){pending=false;notify();},finishFilm(){onFilmDone?.('ended');},
  closeReward(){overlay=false;notify();},closeResults(){results=false;notify();}};
}

test('a reward finishes before native results; completion stays resolved and results appear once',()=>{
 const f=fixture();assert.equal(f.native(),0);assert.equal(f.state.gameCompleted,true);
 assert.equal(f.context.NQVictoryBridge.inspection.records[0].status,'waiting-native-overlay');
 const state=JSON.stringify(f.state);f.closeReward();f.closeReward();
 assert.equal(f.native(),1);assert.equal(JSON.stringify(f.state),state);
 assert.equal(f.context.NQVictoryBridge.inspection.deliveredCount,1);
});
test('disposing while a reward is open cannot strand the native results',()=>{
 const f=fixture();assert.equal(f.native(),0);f.context.NQVictoryBridge.dispose();
 assert.equal(f.native(),1);f.closeReward();assert.equal(f.native(),1);
 assert.equal(f.context.NQVictoryBridge.inspection.disposed,true);
});
test('a stale journey cannot receive queued results',()=>{
 const f=fixture();f.context._progressEpoch++;f.closeReward();
 assert.equal(f.native(),0);assert.equal(f.context.NQVictoryBridge.inspection.records[0].cancelled,true);
 assert.ok(f.releases()>0);
});
test('mobile keeps immediate native presentation',()=>{
 const f=fixture({mobile:true});assert.equal(f.native(),1);
 assert.equal(f.context.NQVictoryBridge.inspection.records.length,0);
});
test('final evolution preserves the actual native node and appears only after rewards and results',()=>{
 const f=fixture({evolution:true}),state=JSON.stringify(f.state),node=f.announceEvolution();
 assert.equal(f.evolutionCalls(),1);assert.equal(f.visibleEvolution(),null);
 f.closeReward();assert.equal(f.native(),1);assert.equal(f.visibleEvolution(),null);
 f.closeResults();assert.equal(f.visibleEvolution(),node);assert.equal(f.originalEvolution(),node);
 assert.equal(f.evolutionCalls(),1);assert.equal(JSON.stringify(f.state),state);
 assert.equal(f.context.NQVictoryBridge.inspection.evolution.released,1);
});
test('queued evolution cannot leak into a different journey',()=>{
 const f=fixture({evolution:true});f.announceEvolution();f.context._progressEpoch++;f.closeReward();
 assert.equal(f.visibleEvolution(),null);assert.equal(f.context.NQVictoryBridge.inspection.evolution.pending,0);
 assert.equal(f.evolutionCalls(),1);
});
test('later unrelated evolution delegates to native rendering',()=>{
 const f=fixture({evolution:true});f.announceEvolution();f.closeReward();f.closeResults();
 f.visibleEvolution().remove();const later=f.announceEvolution(11);
 assert.equal(f.visibleEvolution(),later);assert.equal(f.evolutionCalls(),2);
 assert.equal(f.context.NQVictoryBridge.inspection.evolution.held,1);
});

test('the final earned chest holds film before1200ms and through its native result, then delivers once',()=>{
 const f=fixture({pendingChest:true,rewardVisible:false,film:true}),resolved=JSON.stringify(f.state);
 f.advance(350);assert.equal(f.filmOpens(),0);assert.equal(f.native(),0);
 assert.equal(f.context.NQVictoryBridge.inspection.records[0].status,'waiting-native-overlay');
 f.advance(849);assert.equal(f.filmOpens(),0);assert.equal(f.native(),0);
 f.advance(1);f.revealReward();assert.equal(f.filmOpens(),0);
 f.claimReward();assert.equal(f.filmOpens(),0);assert.equal(f.native(),0);
 f.closeReward();assert.equal(f.filmOpens(),1);assert.equal(f.native(),0);
 f.closeReward();assert.equal(f.filmOpens(),1);
 f.finishFilm();f.finishFilm();assert.equal(f.native(),1);
 assert.equal(f.context.NQVictoryBridge.inspection.deliveredCount,1);
 assert.equal(JSON.stringify(f.state),resolved);
});

test('desktop evolution stays held across a native deferred handback and actual results',()=>{
 const f=fixture({evolution:true,deferNative:true});f.closeReward();assert.equal(f.native(),1);
 const node=f.announceEvolution();assert.equal(f.visibleEvolution(),null);
 f.completeNativeResults();assert.equal(f.visibleEvolution(),null);
 f.closeResults();assert.equal(f.visibleEvolution(),node);assert.equal(f.evolutionCalls(),1);
 assert.equal(f.context.NQVictoryBridge.inspection.evolution.released,1);assert.equal(f.native(),1);
});

test('mobile evolution retains native presentation without manufacturing a desktop record',()=>{
 const f=fixture({mobile:true,evolution:true,deferNative:true}),node=f.announceEvolution();
 assert.equal(f.visibleEvolution(),node);assert.equal(f.native(),1);
 assert.equal(f.context.NQVictoryBridge.inspection.records.length,0);
});
