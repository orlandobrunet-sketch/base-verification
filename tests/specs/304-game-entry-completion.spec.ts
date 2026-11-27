import {test, expect, type Page, type TestInfo} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
import {enterGame} from '../helpers/game';

test.use({serviceWorkers:'block'});
test.beforeEach(async ({page,context,baseURL}) => {
  const origin=new URL(baseURL!).origin;
  await context.route('**/*',r=>r.request().method()==='GET'&&new URL(r.request().url()).origin===origin?r.continue():r.abort());
  await context.routeWebSocket('**/*',s=>s.close());
  await page.goto('/version.json');
  expect(await page.evaluate(()=>typeof (window as any).questionBank)).toBe('undefined');
});

async function isolated(page:Page,visible=true) {
  await page.evaluate(visible=>{
    const w=window as any;
    document.body.innerHTML='<div id="landingScreen"></div><div id="welcomeScreen"></div><main id="mainApp"><p id="question">technical question</p></main>';
    document.getElementById('mainApp')!.hidden=!visible;
    w.__technicalCalls=0;
    w.continueGame=function(){
      w.__technicalCalls++;
      let resolve:any,reject:any;
      const pending:any=new Promise((yes,no)=>{resolve=yes;reject=no;});
      pending.complete=()=>{document.getElementById('mainApp')!.hidden=false;resolve();};
      pending.reject=()=>reject(new TypeError('controlled continuation rejection'));
      w.__weakContinuation=new WeakRef(pending);
      return pending;
    };
    w.__releaseTechnical=(kind:string)=>{
      const pending=w.__weakContinuation.deref();
      if(!pending)return false;
      pending[kind]();return true;
    };
  },visible);
}
async function audit(info:TestInfo,value:unknown){
  const file=info.outputPath('continuation-audit.json');
  await writeFile(file,JSON.stringify(value,null,2));
  await info.attach('continuation-contract',{path:file,contentType:'application/json'});
}
function observed(pending:Promise<unknown>){
  let settled=false;
  const outcome=pending.then(()=>({kind:'fulfilled',name:'',message:''}),e=>({kind:'rejected',name:String(e.name),message:String(e.message)}))
    .then(value=>{settled=true;return value;});
  return {outcome,isSettled:()=>settled};
}
async function entered(page:Page){await page.waitForFunction(()=>(window as any).__technicalCalls===1);}

test('raw CDP can collect an unreachable awaited Promise without retiring its document',async({page,context},info)=>{
  await isolated(page);
  let navigations=0;page.on('framenavigated',f=>{if(f===page.mainFrame())navigations++;});
  const cdp=await context.newCDPSession(page),gc=await context.newCDPSession(page);
  const outcome=cdp.send('Runtime.evaluate',{expression:'window.continueGame()',awaitPromise:true,returnByValue:true})
    .then(()=>({kind:'fulfilled',message:''}),e=>({kind:'rejected',message:String(e.message)}));
  let timer:ReturnType<typeof setTimeout>|undefined;
  try{
    await entered(page);await gc.send('HeapProfiler.collectGarbage');
    const result=await Promise.race([outcome,new Promise<{kind:string;message:string}>(r=>{timer=setTimeout(()=>r({kind:'bounded-timeout',message:''}),1500);})]);
    const state=await page.evaluate(()=>({ready:document.readyState,calls:(window as any).__technicalCalls,alive:!!(window as any).__weakContinuation.deref()}));
    await audit(info,{result,state,navigations});
    expect(result.kind).toBe('rejected');expect(result.message).toContain('Promise was collected');
    expect(state).toEqual({ready:'complete',calls:1,alive:false});expect(navigations).toBe(0);
  }finally{if(timer)clearTimeout(timer);await cdp.detach();await gc.detach();}
});

test('entry retains its pending action through GC and waits after the game is already visible',async({page,context},info)=>{
  await isolated(page);
  const run=observed(enterGame(page));await entered(page);
  await expect(page.locator('#mainApp')).toBeVisible();
  const before=run.isSettled();const gc=await context.newCDPSession(page);
  try{await gc.send('HeapProfiler.collectGarbage');}finally{await gc.detach();}
  const alive=await page.evaluate(()=>!!(window as any).__weakContinuation.deref());
  await audit(info,{phase:'after-gc',beforeSettled:before,alive,outcomeIfSettled:run.isSettled()?await run.outcome:null});
  expect(before).toBe(false);expect(alive).toBe(true);expect(run.isSettled()).toBe(false);
  expect(await page.evaluate(()=>(window as any).__releaseTechnical('complete'))).toBe(true);
  expect(await run.outcome).toEqual({kind:'fulfilled',name:'',message:''});
  expect(await page.evaluate(()=>(window as any).__technicalCalls)).toBe(1);
});

test('entry does not accept visible content before a delayed action actually completes',async({page},info)=>{
  await isolated(page,true);const run=observed(enterGame(page));await entered(page);
  await expect(page.locator('#question')).toHaveText('technical question');
  expect(run.isSettled()).toBe(false);
  expect(await page.evaluate(()=>(window as any).__releaseTechnical('complete'))).toBe(true);
  const result=await run.outcome;await audit(info,{result,calls:await page.evaluate(()=>(window as any).__technicalCalls)});
  expect(result.kind).toBe('fulfilled');expect(await page.evaluate(()=>(window as any).__technicalCalls)).toBe(1);
});

test('entry propagates a genuine action rejection with its name and message',async({page},info)=>{
  await isolated(page);const run=observed(enterGame(page));await entered(page);
  expect(await page.evaluate(()=>(window as any).__releaseTechnical('reject'))).toBe(true);
  const result=await run.outcome;await audit(info,result);
  expect(result.kind).toBe('rejected');expect(result.name).toBe('TypeError');expect(result.message).toContain('controlled continuation rejection');
});

test('entry rejects a replaced document rather than accepting the new document as completion',async({page},info)=>{
  await isolated(page);const run=observed(enterGame(page));await entered(page);
  await page.goto('/version.json');const result=await run.outcome;await audit(info,result);
  expect(result.kind).toBe('rejected');expect(result.message).toMatch(/context|document|navigation/i);
});

test('entry rejects a changed action source even when the old action resolves into visible content',async({page},info)=>{
  await isolated(page);const run=observed(enterGame(page));await entered(page);
  await page.evaluate(()=>{const w=window as any;w.continueGame=()=>undefined;w.__releaseTechnical('complete');});
  const result=await run.outcome;await audit(info,result);
  expect(result.kind).toBe('rejected');expect(result.message).toMatch(/source|changed/i);
});

test('entry preserves the previous handling of a fulfilled false result and invokes the action once',async({page},info)=>{
  await isolated(page);await page.evaluate(()=>{const w=window as any;w.continueGame=()=>{w.__technicalCalls++;return false;};});
  await enterGame(page);const calls=await page.evaluate(()=>(window as any).__technicalCalls);await audit(info,{calls});
  expect(calls).toBe(1);await expect(page.locator('#mainApp')).toBeVisible();
});
