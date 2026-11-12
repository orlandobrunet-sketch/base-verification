import {test,expect,type Page} from '@playwright/test';
test.use({serviceWorkers:'block',contextOptions: { reducedMotion:'reduce' }});
test.beforeEach(async({context,baseURL})=>{const origin=new URL(baseURL!).origin;await context.route('**/*',r=>r.request().method()==='GET'&&new URL(r.request().url()).origin===origin?r.continue():r.abort());await context.routeWebSocket('**/*',s=>s.close());});
async function openChoice(page:Page){await page.locator('[data-action="startNewFromWelcome"]').click();await page.locator('#diffConfirmBtn').click();await expect(page.locator('#charSelectModal')).toBeVisible();}
test('reabrir durante carga drena o início antigo e confirma a nova escolha pelo wrapper real',async({page})=>{
 // Two real selection/confirmation cycles around one deliberately deferred load.
 test.setTimeout(60_000);
 await page.goto('/jogar/',{waitUntil:'domcontentloaded'});await page.locator('[data-portal-route="guest"]').click();await openChoice(page);
 await page.evaluate(async()=>{const w=window as any;await w._loadTopics();w.__sceneBank=(0,eval)('questionBank');w.__sceneLoad=w._loadTopics;w.__sceneStarts=[];const native=w.startGameWithCharacter;w.startGameWithCharacter=async function(...args:any[]){const result=await native.apply(this,args);w.__sceneStarts.push(result===true);return result;};(0,eval)('questionBank=null;_loadTopics=()=>new Promise(resolve=>{window.__sceneRelease=resolve;window.__sceneWaiting=true})');w.__releaseScene=()=>{(0,eval)('questionBank=window.__sceneBank;window.questionBank=questionBank;_loadTopics=window.__sceneLoad');w.__sceneRelease?.();};});
 try{
  await page.locator('#charSelectModal [data-char="aquaria"]').click();await page.locator('[data-action="startCharacterPreview"]').click();await expect.poll(()=>page.evaluate(()=>(window as any).__sceneWaiting)).toBe(true);
  await openChoice(page);await page.locator('#charSelectModal [data-char="glomerulus"]').click();const start=page.locator('#charSelectModal [data-action="startCharacterPreview"]');
  await expect(start).toBeDisabled();await expect(page.locator('#charSelectModal')).toHaveAttribute('data-preview-character','glomerulus');
  await page.evaluate(()=>(window as any).__releaseScene());await expect.poll(()=>page.evaluate(()=>(window as any).__sceneStarts.length)).toBe(1);await expect(start).toBeEnabled();
  expect(await page.evaluate(()=>(0,eval)('state.gameStarted'))).toBe(false);expect(await page.evaluate(()=>(window as any).__sceneStarts)).toEqual([false]);await expect(page.locator('#nqEntryCinema[open]')).toHaveCount(0);
  await start.click();await expect.poll(()=>page.evaluate(()=>(window as any).__sceneStarts)).toEqual([false,true]);expect(await page.evaluate(()=>(0,eval)('state.character'))).toBe('glomerulus');
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('nefroquest-save-v7')||'null'));expect(saved).toMatchObject({character:'glomerulus',difficulty:'normal',gameStarted:true,classBenefits:{lockedClass:'glomerulus',windowAnswers:0}});
  if(await page.locator('#nqEntryCinema[open]').isVisible())await page.keyboard.press('Escape');
 }finally{await page.evaluate(()=>(window as any).__releaseScene?.()).catch(()=>{});}
});
