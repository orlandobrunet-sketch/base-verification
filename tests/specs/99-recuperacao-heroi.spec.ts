import { test, expect, type Page } from '@playwright/test';
import { injectGameState } from '../helpers/game';
import { medirContraste } from '../helpers/contraste';
test.use({serviceWorkers:'block',reducedMotion:'reduce'});
async function abrir(page:Page){
 await page.route('**/*',r=>new URL(r.request().url()).hostname==='localhost'?r.continue():r.abort());
 await page.goto('/jogar/',{waitUntil:'domcontentloaded'});await injectGameState(page,{gold:0,correctTotal:98,level:12,score:45000,bossIntroShown:true,narrativeShown:93});
 await page.emulateMedia({reducedMotion:'reduce'});
 const expected=await page.evaluate(()=>(0,eval)('Object.assign(state.equipment.weapon,{atk:7,def:3,kno:2,luck:1});JSON.stringify(total())'));
 await page.evaluate(()=>(0,eval)('applyBossStun()'));
 expect(await page.evaluate(()=>(0,eval)('JSON.stringify(total())'))).not.toBe(expected);
 await page.locator('#forgeBtn:visible, .mdock-btn.forge-item:visible').first().focus();
 await page.evaluate(()=>(0,eval)('checkNarrative()'));
 const card=page.getByRole('dialog',{name:'A Chama dos Néfrons',exact:true});await expect(card).toBeVisible();
 await expect.poll(()=>page.evaluate(()=>(0,eval)('state.bossStunActive'))).toBe(false);return {card,expected};
}
test('recupera os atributos dos equipamentos em 98 e fecha sem avançar a questão',async({page})=>{
 const {card,expected}=await abrir(page);expect(await page.evaluate(()=>(0,eval)('JSON.stringify(total())'))).toBe(expected);
 await expect(card.locator('.nqrecover-effect')).toContainText('Equipamentos restaurados');
 await expect(card.locator('.nqnarr-story')).toHaveText(await page.evaluate(()=>(0,eval)('narrativeStages.find(s=>s.stunRecovery).text')));
 const snapshot=()=>page.evaluate(()=>(0,eval)('JSON.stringify({gold:state.gold,score:state.score,lives:state.lives,correct:state.correctTotal,current:state.current,idx:state.idx,equipment:state.equipment,stun:state.bossStunActive})'));
 const before=await snapshot(),button=card.getByRole('button',{name:'Retomar o combate!',exact:true});await expect(button).toBeFocused();
 for(const key of ['Tab','Tab','Tab','Shift+Tab']){await page.keyboard.press(key);expect(await card.evaluate(e=>e.contains(document.activeElement))).toBe(true)}
 expect(await page.evaluate(medirContraste,'.nqrecover-card')).toEqual([]);
 await button.click();await expect(card).toHaveCount(0);expect(await snapshot()).toBe(before);
 await expect(page.locator('#forgeBtn:visible, .mdock-btn.forge-item:visible').first()).toBeFocused();
});
for(const width of [320,390,1100])test('recuperação legível com texto a 200% em '+width,async({page})=>{
 await page.setViewportSize({width,height:700});const {card}=await abrir(page);await page.evaluate(()=>document.documentElement.style.fontSize='32px');
 expect(await card.evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);
 for(const button of await card.locator('button').all()){const b=(await button.boundingBox())!;expect(b.height).toBeGreaterThanOrEqual(44);expect(b.x).toBeGreaterThanOrEqual(0);expect(b.x+b.width).toBeLessThanOrEqual(width+1);expect(b.y+b.height).toBeLessThanOrEqual(700)}
 const region=card.getByRole('region');await region.focus();await page.keyboard.press('End');await expect.poll(()=>region.evaluate(e=>e.scrollHeight<=e.clientHeight||e.scrollTop>0)).toBe(true);
 expect(await card.locator('.halo').evaluate(e=>getComputedStyle(e).animationName)).toBe('none');
 if(width<600)expect(await region.evaluate(e=>getComputedStyle(e).scrollbarWidth)).toBe('none');
 await page.keyboard.press('Escape');await expect(card).toHaveCount(0);expect(await page.evaluate(()=>(0,eval)('state.bossStunActive'))).toBe(false);
});
