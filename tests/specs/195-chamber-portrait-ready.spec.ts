import {test,expect,type Page} from '@playwright/test';
test.use({serviceWorkers:'block',reducedMotion:'reduce'});
test.beforeEach(async({page})=>{test.skip(!await page.evaluate(()=>matchMedia('(pointer:fine)').matches),'Desktop portrait decoding; touch uses the native layout without portraits.');});
async function enter(page:Page){
 await page.route('**/*',r=>new URL(r.request().url()).hostname==='localhost'?r.continue():r.abort());
 await page.goto('/jogar/',{waitUntil:'load'});
 await page.evaluate(()=>{document.getElementById('landingScreen')?.classList.add('hidden');document.getElementById('welcomeScreen')?.classList.add('hidden');(window as any).showAcidBaseMinigame();});
 const cinema=page.locator('#nqEntryCinema[open]');if(await cinema.count())await page.keyboard.press('Escape');
 await page.locator('[data-ab-next="aldric"]:visible').click();
}
test('portrait is revealed only after its pixels are decoded',async({page})=>{
 await page.addInitScript(()=>{
  const original=HTMLImageElement.prototype.decode;(window as any).__portraitGate=[];
  HTMLImageElement.prototype.decode=function(){return original.call(this).then(()=>this.closest('[data-ab-portrait]')?new Promise<void>(resolve=>(window as any).__portraitGate.push(resolve)):undefined);};
 });
 await enter(page);await page.waitForFunction(()=>(window as any).__portraitGate.length>0);
 await expect(page.locator('[data-ab-portrait]')).toBeHidden();
 await expect(page.locator('.ab-patient-identity')).toBeVisible();
 await page.evaluate(()=>(window as any).__portraitGate.splice(0).forEach((r:()=>void)=>r()));
 await expect(page.locator('[data-ab-portrait]')).toBeVisible();
 const boxes=await page.locator('.ab-patient-heading').evaluate(el=>{const p=el.querySelector('figure')!.getBoundingClientRect(),n=el.querySelector('.ab-patient-identity')!.getBoundingClientRect();return{p:p.toJSON(),n:n.toJSON()};});
 expect(boxes.p.right<=boxes.n.left||boxes.p.bottom<=boxes.n.top).toBe(true);
});
test('failed portrait decoding leaves the case identity and navigation usable',async({page})=>{
 await page.addInitScript(()=>{
  const original=HTMLImageElement.prototype.decode;
  HTMLImageElement.prototype.decode=function(){return this.closest('[data-ab-portrait]')?Promise.reject(new Error('decode fixture')):original.call(this);};
 });
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await enter(page);await expect(page.locator('[data-ab-portrait]')).toHaveCount(0);
 await expect(page.locator('.ab-title')).toHaveText('Ferreiro Aldric');await page.locator('[data-ab-start-acts]').click();
 await expect(page.locator('.ab-prompt')).toBeVisible();expect(errors).toEqual([]);
});
test('late portrait decoding cannot restore a case after leaving it',async({page})=>{
 await page.addInitScript(()=>{
  const original=HTMLImageElement.prototype.decode;(window as any).__portraitGate=[];
  HTMLImageElement.prototype.decode=function(){return original.call(this).then(()=>this.closest('[data-ab-portrait]')?new Promise<void>(resolve=>(window as any).__portraitGate.push(resolve)):undefined);};
 });
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await enter(page);await page.waitForFunction(()=>(window as any).__portraitGate.length>0);
 await page.locator('[data-ab-close]').click();await page.evaluate(()=>(window as any).__portraitGate.splice(0).forEach((r:()=>void)=>r()));
 await expect(page.locator('#acidBaseOverlay')).toHaveCount(0);expect(errors).toEqual([]);
});
