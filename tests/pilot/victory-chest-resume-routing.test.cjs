'use strict';
const{test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const src=fs.readFileSync(require.resolve('../../js/game.js'),'utf8');
const begin=src.indexOf('        _flushChestRewards(); // Fresh documents');
assert.ok(begin>=0);const end=src.indexOf('      } catch (error)',begin);assert.ok(end>begin);
function resume(store,overrides={}){let flushes=0,results=0;vm.runInNewContext(src.slice(begin,end),{state:{gameCompleted:true,correctTotal:100,...overrides},_durableChestStore:()=>store,_flushChestRewards:()=>flushes++,_requestVictoryResults:()=>results++});return{flushes,results};}
test('legacy completed victory stays manually reopenable after reload',()=>assert.deepEqual(resume(null),{flushes:1,results:0}));
test('consumed durable chest does not reopen dismissed victory',()=>assert.deepEqual(resume({chestReceipts:()=>[{phase:'consumed'}]}),{flushes:1,results:0}));
for(const phase of ['earned','prepared'])test('unfinished '+phase+' durable chest defers restored victory to reward scheduler',()=>assert.deepEqual(resume({chestReceipts:()=>[{phase}]}),{flushes:1,results:1}));
test('incomplete journey does not request victory for pending chest',()=>assert.deepEqual(resume({chestReceipts:()=>[{phase:'earned'}]},{gameCompleted:false,correctTotal:5}),{flushes:1,results:0}));
