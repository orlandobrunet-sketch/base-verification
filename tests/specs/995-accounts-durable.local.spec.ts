import {openPilotChoice} from '../helpers/pilot';
import {confirmCharacterStart} from '../helpers/cinema';
import {test,expect,type Page} from '@playwright/test';
import {routeTechnicalQuestionBank} from '../helpers/technical-question-bank';
import {startNormalCharacter,pilotState} from '../helpers/pilot';
const CLOCK=Date.UTC(2026,10,14,15);
const authors=Array.from({length:120},(_,n)=>({qid:`pilot-tech-${String(n+1).padStart(3,'0')}`,t:'Interface técnica',cat:'geral',
 q:'Marcador técnico '+(n+1),opts:['A','B','C','D'],ans:0,exp:'Explicação exclusivamente técnica.',diff:['easy','medium','hard'][n%3],refs:[]}));
const rapid=Array.from({length:12},(_,n)=>({qid:'pending-chest-rapid-'+n,q:'Afirmação técnica '+n,ans:true,cat:'geral',exp:'Explicação técnica.'}));
const audits=new WeakMap<Page,{errors:string[],nonGET:string[],sockets:number}>();
test.use({serviceWorkers:'block',contextOptions:{reducedMotion:'reduce'}});
test.beforeEach(async({page,baseURL})=>{
 const audit={errors:[] as string[],nonGET:[] as string[],sockets:0};audits.set(page,audit);const origin=new URL(baseURL!).origin;
 page.on('pageerror',error=>audit.errors.push(error.message));
 await page.route('**/*',route=>{
  const req=route.request(),url=new URL(req.url());if(url.pathname.includes('/assets/vendor/supabase-'))return route.abort();if(req.method()!=='GET'){audit.nonGET.push(req.method()+' '+url.pathname);return route.abort();}
  if(url.origin!==origin||['media','font'].includes(req.resourceType()))return route.abort();
  if(req.resourceType()==='image')return route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><rect width="16" height="16"/></svg>'});
  return route.continue();
 });
 await page.context().routeWebSocket('**/*',socket=>{audit.sockets++;socket.close();});
 await routeTechnicalQuestionBank(page,authors);
 await page.route('**/data/rapid-quiz.js*',route=>route.fulfill({status:200,contentType:'application/javascript',body:'const RAPID_QUIZ_QUESTIONS='+JSON.stringify(rapid)+';'}));
  await page.addInitScript(()=>{
 const w=window as any;let handler:any;let user:any={id:'00000000-0000-4000-8000-000000009951',email:'a@example.test',user_metadata:{nickname:'Account A'},app_metadata:{}};
 const from=(table:string)=>{let columns='';const result=()=>Promise.resolve({data:columns.includes('game_progress')?{game_progress:null,game_progress_version:0}:{is_premium:false},error:null});const chain:any={select(c:string){columns=c;return chain},eq(){return chain},update(){return chain},insert(){return chain},upsert(){return chain},order(){return chain},limit(){return chain},single:result,maybeSingle:result,then(a:any,b:any){return result().then(a,b)}};return chain;};
 w.__fakeLogin=(id:string)=>{sessionStorage.setItem('nq-auth-login-intent','1');user={id,email:'test@example.test',user_metadata:{nickname:'Technical'},app_metadata:{}};handler('SIGNED_IN',{user});};
 w.supabase={createClient:()=>({from,rpc:async()=>({data:null,error:null}),auth:{getSession:async()=>({data:{session:user?{user}:null},error:null}),onAuthStateChange:(fn:any)=>{handler=fn;return{data:{subscription:{unsubscribe(){}}}}},signOut:async()=>{user=null;handler('SIGNED_OUT',null);return{error:null}}}})};
 });
 await page.addInitScript(()=>{localStorage.setItem('pwa-dismissed','1');(window as any).NQ_DURABLE_PROGRESS=true;});
 await page.goto('/jogar/',{waitUntil:'load'});await expect(page.locator('#welcomeScreen')).toBeVisible();
 await startNormalCharacter(page,'nephros','easy');await page.waitForFunction(()=>(0,eval)('!_continueGamePending'));
 await page.clock.install({time:CLOCK-1000});await page.clock.pauseAt(CLOCK);
});
async function snapshot(page:Page){return page.evaluate(()=>{
 const button=document.getElementById('mgSair'),rect=button?.getBoundingClientRect();
 const hit=rect?document.elementFromPoint(rect.left+rect.width/2,rect.top+rect.height/2):null;
 return{at:Date.now(),state:(0,eval)('({correct:state.correctTotal,chestCount:state.chestCorrectCount,chestTarget:state.chestTarget,started:state.gameStarted,gold:state.gold,score:state.score,xp:state.xp,epoch:_progressEpoch,pilot:isCharacterPilot()})'),
  mainHidden:document.getElementById('mainApp')?.classList.contains('hidden'),rapid:!!document.getElementById('mgSair'),chests:document.querySelectorAll('#autoChestPopup').length,
  active:{tag:document.activeElement?.tagName,id:document.activeElement?.id},exitHit:hit&&{tag:hit.tagName,id:hit.id,blockedByChest:!!hit.closest('#autoChestPopup')},
  randomSource:Math.random.toString()};
});}
test.afterEach(async({page},info)=>{
 await info.attach('native-pending-chest-final',{contentType:'application/json',body:JSON.stringify(await snapshot(page))});
 await info.attach('chest-lifecycle-audit',{contentType:'application/json',body:JSON.stringify(audits.get(page))});
 expect(audits.get(page)).toEqual({errors:[],nonGET:[],sockets:0});
});
async function closeDisplayedNotices(page:Page){
 for(let n=0;n<8;n++){
  const notices=page.locator('.narrative-popup:not(#autoChestPopup):visible,.evolution-popup:visible,#goldMilestonePopup:visible,.forge-popup:visible');
  if(!await notices.count())return;
  const order=await notices.evaluateAll(elements=>elements.map((element,index)=>({index,z:Number.parseFloat(getComputedStyle(element).zIndex)||0})).sort((a,b)=>a.z-b.z||a.index-b.index));
  const top=notices.nth(order.at(-1)!.index);
  await top.locator('[data-close-closest],[data-remove-id]').first().click();
 }
 throw Error('More than8native notices remained.');
}
async function earnFirstChest(page:Page){
 const initial=await snapshot(page);expect(initial.state.chestTarget).toBe(5);expect(initial.state.chestCount).toBe(0);expect(initial.state.correct).toBe(0);
 for(let index=1;index<=5;index++){
  if(index>1){
   await page.clock.runFor(1000);await closeDisplayedNotices(page);
   await page.locator('#nextBtn:visible,[data-action="renderQuestion"]:visible').first().click();await page.clock.runFor(500);
   expect(await page.evaluate(()=>(0,eval)('!state.answered&&!_loadingNextQuestion'))).toBe(true);
  }
  const correct=await page.evaluate(()=>(0,eval)('state.current.a'));
  await page.locator('#options .option').nth(correct).click();expect((await pilotState(page)).correctTotal).toBe(index);
 }
 const earned=await snapshot(page);expect(earned.state.chestCount).toBe(0);expect(earned.chests).toBe(0);
 // Resolve any gold/evolution notice really earned at this answer, then leave
 //600ms of the actual1200mschest delay. No resource or RNG value is rewritten.
 await page.clock.runFor(600);await closeDisplayedNotices(page);
 const before=await snapshot(page);expect(before.at-earned.at).toBe(600);expect(before.chests).toBe(0);expect(before.randomSource).toBe(initial.randomSource);
 return{initial,earned,before};
}

test('account A pending chest survives logout B independent journey logout A resume',async({page},info)=>{
 const A='00000000-0000-4000-8000-000000009951',B='00000000-0000-4000-8000-000000009952';
 await earnFirstChest(page);const a=await page.evaluate(()=>(window as any).NQNormalProgress.envelope());const aKey=await page.evaluate(()=>(window as any).NQNormalProgress.authority.key);
 expect(a.receipts.filter((r:any)=>r.phase!=='consumed')).toHaveLength(1);
 // Keep the earned-but-not-presented deadline paused until logout commits.
 await page.getByRole('button',{name:'Menu da conta',exact:true}).click();await page.locator('[data-action="authLogout"]:visible').click();
 await expect.poll(()=>page.evaluate(()=>(window as any).authUser)).toBeNull();
 await page.clock.resume();
 expect(await page.evaluate(()=>!!(window as any).NQNormalProgress?.writable)).toBe(false);
 await page.evaluate(id=>(window as any).__fakeLogin(id),B);await expect(page.locator('#welcomeScreen')).toBeVisible();
 await startNormalCharacter(page,'aquaria','easy');
 const b=await page.evaluate(()=>(window as any).NQNormalProgress.envelope());expect(b.save.saveOwner).toBe(B);expect(b.save.score).toBe(0);expect(b.collections).toEqual({articles:[],knowledge:0});expect(b.receipts).toEqual([]);
 expect(b.save.journeyId).not.toBe(a.save.journeyId);
 await page.getByRole('button',{name:'Menu da conta',exact:true}).click();await page.locator('[data-action="authLogout"]:visible').click();await expect.poll(()=>page.evaluate(()=>(window as any).authUser)).toBeNull();
 await page.evaluate(id=>(window as any).__fakeLogin(id),A);await expect(page.locator('#welcomeContinueBtn')).toBeVisible();await page.locator('#welcomeContinueBtn').click();await expect(page.locator('#mainApp')).toBeVisible();
 const resumed=await page.evaluate(()=>(window as any).NQNormalProgress.envelope());expect(resumed.save.saveOwner).toBe(A);expect(resumed.save.score).toBe(a.save.score);expect(resumed.save.journeyId).toBe(a.save.journeyId);expect(resumed.collections).toEqual(a.collections);expect(resumed.receipts.map((r:any)=>r.id)).toEqual(a.receipts.map((r:any)=>r.id));
 await expect(page.locator('#autoChestPopup')).toBeVisible();await page.locator('#autoChestPopup .nqch-trigger').click();if(await page.locator('#ecpKeep').isVisible())await page.locator('#ecpKeep').click();
 await expect.poll(()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)!).receipts[0].phase,aKey)).toBe('consumed');
 await info.attach('accounts-durability',{contentType:'application/json',body:JSON.stringify({a,b,resumed})});
});
test('global source lease prevents second account tab from replacing live A',async({page,baseURL})=>{
 await page.clock.resume();const before=await page.evaluate(()=>({a:(window as any).NQNormalProgress.envelope(),source:localStorage.getItem('nefroquest-save-v7')}));
 const second=await page.context().newPage();
 try{
  const origin=new URL(baseURL!).origin;
  await second.route('**/*',route=>{const r=route.request(),u=new URL(r.url());return u.origin===origin&&r.method()==='GET'&&!u.pathname.includes('/assets/vendor/supabase-')?route.continue():route.abort()});
  await routeTechnicalQuestionBank(second,authors);
  await second.addInitScript(()=>{
   const w=window as any;w.NQ_DURABLE_PROGRESS=true;const user={id:'00000000-0000-4000-8000-000000009952',email:'b@example.test',user_metadata:{nickname:'B'},app_metadata:{}};
   const from=()=>{let columns='';const result=()=>Promise.resolve({data:columns.includes('game_progress')?{game_progress:null,game_progress_version:0}:{is_premium:false},error:null});const chain:any={select(c:string){columns=c;return chain},eq(){return chain},update(){return chain},upsert(){return chain},order(){return chain},limit(){return chain},single:result,maybeSingle:result,then(a:any,b:any){return result().then(a,b)}};return chain};
   w.supabase={createClient:()=>({from,rpc:async()=>({data:null,error:null}),auth:{getSession:async()=>({data:{session:{user}},error:null}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})}})};
  });
  await second.goto('/jogar/',{waitUntil:'load'});await expect(second.locator('#welcomeScreen')).toBeVisible();
  await openPilotChoice(second,'easy');await second.locator('#diffConfirmBtn').click();await expect(second.locator('#charSelectModal')).not.toHaveClass(/show/);
  await second.waitForTimeout(300);await expect(second.locator('#mainApp')).toBeHidden();expect(await second.evaluate(()=>!!(window as any).NQNormalProgress?.writable)).toBe(false);
  expect(await page.evaluate(()=>({a:(window as any).NQNormalProgress.envelope(),source:localStorage.getItem('nefroquest-save-v7')}))).toEqual(before);
 }finally{await second.close();}
});
test('logout refuses changed legacy source without deleting foreign bytes',async({page})=>{
 await page.clock.resume();
 const key=await page.evaluate(()=>(window as any).NQNormalProgress.authority.key);const authority=await page.evaluate(k=>localStorage.getItem(k),key);
 const foreign=JSON.stringify({schemaVersion:7,saveOwner:'00000000-0000-4000-8000-000000009952',save:null,resetReason:'technical-conflict'});
 // Deliberate local fixture corruption: emulate an older client writing shared source.
 await page.evaluate(v=>localStorage.setItem('nefroquest-save-v7',v),foreign);
 await page.getByRole('button',{name:'Menu da conta',exact:true}).click();await page.locator('[data-action="authLogout"]:visible').click();
 await expect.poll(()=>page.evaluate(()=>(window as any)._authLogoutPending)).toBe(false);
 expect(await page.evaluate(()=>(window as any).authUser?.id)).toBe('00000000-0000-4000-8000-000000009951');
 expect(await page.evaluate(()=>localStorage.getItem('nefroquest-save-v7'))).toBe(foreign);expect(await page.evaluate(k=>localStorage.getItem(k),key)).toBe(authority);
});