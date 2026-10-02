import { test, expect, type Page } from '@playwright/test';
import { injectGameState } from '../helpers/game';
import { medirContraste } from '../helpers/contraste';
test.use({serviceWorkers:'block',reducedMotion:'reduce'});
async function abrir(page:Page, epic=false){
 await page.route('**/*',r=>new URL(r.request().url()).hostname==='localhost'?r.continue():r.abort());
 await page.goto('/jogar/',{waitUntil:'domcontentloaded'});await injectGameState(page);await page.waitForLoadState('load');
 await page.locator('#forgeBtn:visible, .mdock-btn.forge-item:visible').first().focus();
 await page.evaluate(epic=>(0,eval)(`showForgePopup(${JSON.stringify(epic?{n:'Espada Nefroprotetora',rar:'epic',atk:7,def:2,kno:3,luck:2}:{n:'Excalibur do Néfron',rar:'legendary',atk:11,def:3,kno:4,luck:3})},'weapon',['bônus'],'🛡️ Equipamento Encontrado!')`),epic);
 return page.locator('.nqreward-card');
}
for(const epic of [false,true])test('recompensa identifica item, raridade e bônus '+(epic?'épicos':'lendários'),async({page})=>{
 const card=await abrir(page,epic);await expect(page.getByRole('dialog',{name:epic?'Espada Nefroprotetora':'Excalibur do Néfron'})).toBeVisible();
 await expect(card.locator('.nqreward-rarity')).toHaveText(epic?'Épico':'Lendário');
 expect(await card.locator('dd span').allTextContents()).toEqual(epic?['7','2','3','2']:['11','3','4','3']);
 await expect.poll(()=>card.locator('img').evaluate(el=>(el as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
 await expect(card.getByRole('button',{name:'Continuar'})).toBeFocused();
 expect((await card.getByRole('button',{name:'Continuar'}).boundingBox())!.height).toBeGreaterThanOrEqual(48);
 const stateBefore=await page.evaluate(()=>(0,eval)('JSON.stringify(state)'));
 for(const key of ['Tab','Tab','Shift+Tab']){await page.keyboard.press(key);expect(await card.evaluate(el=>el.contains(document.activeElement))).toBe(true);}
 if(process.env.NQ_CAPTURE_DIR)await page.screenshot({path:process.env.NQ_CAPTURE_DIR+'/recompensa-integrada-'+test.info().project.name+'-'+(epic?'epic':'legendary')+'.png'});
 if(epic)await page.keyboard.press('Escape');else await card.getByRole('button',{name:'Continuar'}).click();
 await expect(card).toHaveCount(0);expect(await page.evaluate(()=>(0,eval)('JSON.stringify(state)'))).toBe(stateBefore);
 await expect(page.locator('#forgeBtn:visible, .mdock-btn.forge-item:visible').first()).toBeFocused();
});
for(const width of [320,390])test('leitura completa e botão acessível a 200% em '+width,async({page})=>{
 await page.setViewportSize({width,height:700});const card=await abrir(page);await page.evaluate(()=>document.documentElement.style.fontSize='32px');
 const button=card.getByRole('button',{name:'Continuar'}),r=(await button.boundingBox())!;expect(r.x).toBeGreaterThanOrEqual(0);expect(r.x+r.width).toBeLessThanOrEqual(width);expect(r.y+r.height).toBeLessThanOrEqual(700);expect(r.height).toBeGreaterThanOrEqual(48);
 expect(await card.evaluate(el=>el.scrollWidth<=el.clientWidth)).toBe(true);
 const reading=card.getByRole('region');await reading.focus();await page.keyboard.press('End');await expect.poll(()=>reading.evaluate(el=>el.scrollTop)).toBeGreaterThan(0);
 expect(await page.evaluate(medirContraste,'.nqreward-card')).toEqual([]);
 await page.emulateMedia({reducedMotion:'reduce'});
 expect(await card.locator('img').evaluate(el=>getComputedStyle(el).animationName)).toBe('none');
 if(process.env.NQ_CAPTURE_DIR)await page.screenshot({path:process.env.NQ_CAPTURE_DIR+'/recompensa-integrada-'+width+'-200.png'});
 await button.click();await expect(card).toHaveCount(0);
});
