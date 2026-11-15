import {test,expect,type Page} from '@playwright/test';
import {routeTechnicalQuestionBank} from '../helpers/technical-question-bank';
import {startPilot,pilotState} from '../helpers/pilot';
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
  const req=route.request(),url=new URL(req.url());if(req.method()!=='GET'){audit.nonGET.push(req.method()+' '+url.pathname);return route.abort();}
  if(url.origin!==origin||['media','font'].includes(req.resourceType()))return route.abort();
  if(req.resourceType()==='image')return route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><rect width="16" height="16"/></svg>'});
  return route.continue();
 });
 await page.context().routeWebSocket('**/*',socket=>{audit.sockets++;socket.close();});
 await routeTechnicalQuestionBank(page,authors);
 await page.route('**/data/rapid-quiz.js*',route=>route.fulfill({status:200,contentType:'application/javascript',body:'const RAPID_QUIZ_QUESTIONS='+JSON.stringify(rapid)+';'}));
 await page.addInitScript(()=>localStorage.setItem('pwa-dismissed','1'));
 await page.goto('/jogar/',{waitUntil:'load'});await page.locator('[data-portal-route="guest"]').click();await expect(page.locator('#welcomeScreen')).toBeVisible();
 await startPilot(page,'nephros','easy');await page.waitForFunction(()=>(0,eval)('!_continueGamePending'));
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
test('a chest earned by five real answers must not cover a natively opened Rapid mode',async({page},info)=>{
 const evidence=await earnFirstChest(page);
 await page.locator('[data-action="goToWelcomeFromGame"]:visible').first().click();
 await page.locator('[data-atrium-route="modes"]').click();await page.locator('[data-mode-route="rapid"]:visible').click();
 await expect(page.locator('#mgSair')).toBeVisible();await page.clock.runFor(599);await expect(page.locator('#autoChestPopup')).toHaveCount(0);
 const beforeDeadline=await snapshot(page);await page.clock.runFor(1);const afterDeadline=await snapshot(page);
 await info.attach('native-pending-chest-boundary',{contentType:'application/json',body:JSON.stringify({evidence,beforeDeadline,afterDeadline})});
 expect(afterDeadline.at-evidence.earned.at).toBe(1200);expect(afterDeadline.state.correct).toBe(5);expect(afterDeadline.mainHidden).toBe(true);
 await expect(page.locator('#autoChestPopup')).toHaveCount(0);
 await page.locator('#mgSair').click();await expect(page.locator('#welcomeScreen')).toBeVisible();
});
test('the same earned chest is presented once when the campaign stays visible',async({page},info)=>{
 const evidence=await earnFirstChest(page);await page.clock.runFor(599);await expect(page.locator('#autoChestPopup')).toHaveCount(0);
 await page.clock.runFor(1);await expect(page.locator('#autoChestPopup')).toHaveCount(1);await expect(page.locator('#autoChestPopup .nqch-trigger')).toBeFocused();
 const afterDeadline=await snapshot(page);await info.attach('native-pending-chest-boundary',{contentType:'application/json',body:JSON.stringify({evidence,afterDeadline})});
 expect(afterDeadline.at-evidence.earned.at).toBe(1200);expect(afterDeadline.state.correct).toBe(5);expect(afterDeadline.mainHidden).toBe(false);
 await page.clock.runFor(3000);await expect(page.locator('#autoChestPopup')).toHaveCount(1);
});


test('an earned chest survives Rapid and valid same-pilot resume, then claims once through its native action',async({page},info)=>{
 const evidence=await earnFirstChest(page);
 const bindingBefore=await page.evaluate(()=>(window as any).NQPilot.captureBinding());
 await page.locator('[data-action="goToWelcomeFromGame"]:visible').first().click();
 await page.locator('[data-atrium-route="modes"]').click();await page.locator('[data-mode-route="rapid"]:visible').click();
 await page.clock.runFor(600);await expect(page.locator('#autoChestPopup')).toHaveCount(0);
 await page.locator('#mgSair').click();await expect(page.locator('#welcomeScreen')).toBeVisible();
 await page.locator('#resumePilotBtn').click();await expect(page.locator('#mainApp')).toBeVisible();
 await page.clock.runFor(1);await expect(page.locator('#autoChestPopup')).toHaveCount(1);
 await expect(page.locator('#autoChestPopup .nqch-trigger')).toBeFocused();
 const bindingAfter=await page.evaluate(()=>(window as any).NQPilot.captureBinding());
 expect(bindingAfter.owner).toBe(bindingBefore.owner);expect(bindingAfter.journeyId).toBe(bindingBefore.journeyId);
 expect(bindingAfter.generation).toBeGreaterThan(bindingBefore.generation);
 // Neither the reward draw nor its legitimate outcome is stubbed. A native
 // article, comparison or equipment output demonstrates that claim executed.
 await page.locator('#autoChestPopup .nqch-trigger').click();await page.clock.runFor(1);
 await expect(page.locator('#autoChestPopup')).toHaveCount(0);
 await expect(page.locator('#chestModal.show:visible,#equipCompareOverlay:visible,.forge-popup:visible')).toHaveCount(1);
 const output=await page.evaluate(()=>({article:document.getElementById('chestModal')?.classList.contains('show'),
  comparison:!!document.getElementById('equipCompareOverlay'),equipment:!!document.querySelector('.forge-popup'),
  pending:(0,eval)('_pendingChestRewards.length')}));
 expect(output.pending).toBe(0);
 await page.clock.runFor(3000);await expect(page.locator('#autoChestPopup')).toHaveCount(0);
 expect(await page.evaluate(()=>(0,eval)('_pendingChestRewards.length'))).toBe(0);
 expect((await snapshot(page)).randomSource).toBe(evidence.initial.randomSource);
 await info.attach('chest-native-retention-claim',{contentType:'application/json',body:JSON.stringify({bindingBefore,bindingAfter,output})});
});
