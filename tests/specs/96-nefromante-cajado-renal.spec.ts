import { test, expect, type Page } from '@playwright/test';
import { injectGameState } from '../helpers/game';
test.use({serviceWorkers:'block',reducedMotion:'reduce'});
async function abrir(page: Page){
 await page.route('**/*',r=>new URL(r.request().url()).hostname==='localhost'?r.continue():r.abort());
 await page.goto('/jogar/',{waitUntil:'domcontentloaded'});await injectGameState(page,{gold:0});
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.locator('#forgeBtn:visible, .mdock-btn.forge-item:visible').first().focus();
 await page.evaluate(()=>(0,eval)('showBossIntroPopup()'));
 const card=page.getByRole('dialog',{name:'O Confronto Derradeiro',exact:true});await expect(card).toBeVisible();return card;
}
test('chegada avança ao desafio com dados reais e fecha sem alterar progresso',async({page})=>{
 const card=await abrir(page);
 await expect(card.locator('#bossIntroArrival')).toContainText('Após noventa batalhas');
 const before=await page.evaluate(()=>(0,eval)('JSON.stringify({gold:state.gold,score:state.score,lives:state.lives,correct:state.correctTotal})'));
 const next=card.getByRole('button',{name:'Avançar',exact:true});await expect(next).toBeFocused();
 await next.click();await expect(card.locator('#bossIntroChallenge')).toBeVisible();
 await expect(card.locator('.nqboss-stats dd')).toHaveText(['15','5','2.500']);
 await expect(card.getByRole('button',{name:'Iniciar batalha final',exact:true})).toBeFocused();
 for(const key of ['Tab','Tab','Tab','Shift+Tab']){await page.keyboard.press(key);expect(await card.evaluate(e=>e.contains(document.activeElement))).toBe(true)}
 await card.getByRole('button',{name:'Iniciar batalha final',exact:true}).click();
 await expect(page.locator('#bossIntroPopup')).toHaveCount(0);
 expect(await page.evaluate(()=>(0,eval)('JSON.stringify({gold:state.gold,score:state.score,lives:state.lives,correct:state.correctTotal})'))).toBe(before);
 await expect(page.locator('#forgeBtn:visible, .mdock-btn.forge-item:visible').first()).toBeFocused();
 await page.evaluate(()=>(0,eval)('showBossIntroPopup()'));await page.keyboard.press('Escape');await expect(page.locator('#bossIntroPopup')).toHaveCount(0);
});
for(const width of [320,390,1100])test('duas etapas legíveis a 200% em '+width,async({page})=>{
 await page.setViewportSize({width,height:700});const card=await abrir(page);await page.evaluate(()=>document.documentElement.style.fontSize='32px');
 for(const stage of [1,2]){
  expect(await card.evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);
  for(const button of await card.locator('button').all()){const b=(await button.boundingBox())!;expect(b.height).toBeGreaterThanOrEqual(44);expect(b.x).toBeGreaterThanOrEqual(0);expect(b.x+b.width).toBeLessThanOrEqual(width+1);expect(b.y+b.height).toBeLessThanOrEqual(700)}
  const region=card.getByRole('region');await region.focus();await page.keyboard.press('End');await expect.poll(()=>region.evaluate(e=>e.scrollHeight<=e.clientHeight||e.scrollTop>0)).toBe(true);
  expect(await card.locator('img').evaluate(e=>getComputedStyle(e).animationName)).toBe('none');
  if(process.env.NQ_CAPTURE_DIR)await page.screenshot({path:process.env.NQ_CAPTURE_DIR+'/boss-renal-'+width+'-'+stage+'-200.png'});
  if(stage===1)await card.getByRole('button',{name:'Avançar',exact:true}).click();
 }
});
test('home mantém a nova arte carregada e o texto sem transbordar',async({page})=>{
 await page.route('**/*',r=>new URL(r.request().url()).hostname==='localhost'?r.continue():r.abort());
 for(const width of [1100,390]){
  await page.setViewportSize({width,height:800});await page.goto('/',{waitUntil:'domcontentloaded'});
  const art=page.locator('.boss-backdrop');await art.scrollIntoViewIfNeeded();
  await expect.poll(()=>art.evaluate((e:HTMLImageElement)=>e.complete&&e.naturalWidth>0)).toBe(true);
  await expect(art).toHaveAttribute('src','/landing/assets/nefromancer-cajado-renal.jpg');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  if(process.env.NQ_CAPTURE_DIR)await page.screenshot({path:process.env.NQ_CAPTURE_DIR+'/home-cajado-renal-'+width+'.png'});
 }
});
