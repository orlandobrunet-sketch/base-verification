import { test, expect, type Page } from '@playwright/test';
import { injectGameState } from '../helpers/game';
import { medirContraste } from '../helpers/contraste';
test.use({serviceWorkers:'block',reducedMotion:'reduce'});
async function abrir(page:Page){
 await page.route('**/*',r=>new URL(r.request().url()).hostname==='localhost'?r.continue():r.abort());
 await page.goto('/jogar/',{waitUntil:'domcontentloaded'});
 await injectGameState(page,{gold:0,correctTotal:93,level:12,score:45000,bossIntroShown:true,narrativeShown:90});
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.locator('#forgeBtn:visible, .mdock-btn.forge-item:visible').first().focus();
 await page.evaluate(()=>(0,eval)('checkNarrative()'));
 const card=page.getByRole('dialog',{name:'A Névoa da Azotemia',exact:true});await expect(card).toBeVisible();
 await expect.poll(()=>page.evaluate(()=>(0,eval)('state.bossStunActive'))).toBe(true);return card;
}
test('feitiço preserva bloqueio 93–97, estado e retorno à questão; recuperação ocorre em 98',async({page})=>{
 const card=await abrir(page);await expect(card.locator('.nqstun-effect')).toContainText('Durante as questões 93 a 97.');
 await expect(card.locator('.nqnarr-story')).toHaveText(await page.evaluate(()=>(0,eval)('narrativeStages.find(s=>s.stun).text')));
 const before=await page.evaluate(()=>(0,eval)('JSON.stringify({gold:state.gold,score:state.score,lives:state.lives,correct:state.correctTotal,current:state.current,idx:state.idx,equipment:state.equipment})'));
 const button=card.getByRole('button',{name:'Suportar o impacto…'});await expect(button).toBeFocused();
 for(const key of ['Tab','Tab','Tab','Shift+Tab']){await page.keyboard.press(key);expect(await card.evaluate(e=>e.contains(document.activeElement))).toBe(true)}
 expect(await page.evaluate(medirContraste,'.nqstun-card')).toEqual([]);
 await button.click();await expect(card).toHaveCount(0);
 expect(await page.evaluate(()=>(0,eval)('JSON.stringify({gold:state.gold,score:state.score,lives:state.lives,correct:state.correctTotal,current:state.current,idx:state.idx,equipment:state.equipment})'))).toBe(before);
 expect(await page.evaluate(()=>(0,eval)('state.bossStunActive'))).toBe(true);
 await expect(page.locator('#forgeBtn:visible, .mdock-btn.forge-item:visible').first()).toBeFocused();
 await page.evaluate(()=>(0,eval)('state.correctTotal=97;checkNarrative()'));
 await expect(page.locator('.narrative-popup')).toHaveCount(0);expect(await page.evaluate(()=>(0,eval)('state.bossStunActive'))).toBe(true);
 await page.evaluate(()=>(0,eval)('state.correctTotal=98;checkNarrative()'));
 await expect.poll(()=>page.evaluate(()=>(0,eval)('state.bossStunActive'))).toBe(false);
 await expect(page.getByRole('dialog')).toContainText('A Chama dos Néfrons');
});
for(const width of [320,390,1100])test('aviso legível com texto a 200% em '+width,async({page})=>{
 await page.setViewportSize({width,height:700});const card=await abrir(page);await page.evaluate(()=>document.documentElement.style.fontSize='32px');
 expect(await card.evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);
 for(const button of await card.locator('button').all()){const b=(await button.boundingBox())!;expect(b.height).toBeGreaterThanOrEqual(44);expect(b.x).toBeGreaterThanOrEqual(0);expect(b.x+b.width).toBeLessThanOrEqual(width+1);expect(b.y+b.height).toBeLessThanOrEqual(700)}
 const region=card.getByRole('region');await region.focus();await page.keyboard.press('End');await expect.poll(()=>region.evaluate(e=>e.scrollHeight<=e.clientHeight||e.scrollTop>0)).toBe(true);
 expect(await card.locator('.mist').evaluate(e=>getComputedStyle(e).animationName)).toBe('none');
 if(width<600)expect(await region.evaluate(e=>getComputedStyle(e).scrollbarWidth)).toBe('none');
 await page.keyboard.press('Escape');await expect(card).toHaveCount(0);expect(await page.evaluate(()=>(0,eval)('state.bossStunActive'))).toBe(true);
});
