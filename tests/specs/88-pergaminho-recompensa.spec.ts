import { test, expect, type Page } from '@playwright/test';
import { injectGameState } from '../helpers/game';
import { medirContraste } from '../helpers/contraste';
test.use({ serviceWorkers:'block',reducedMotion:'reduce' });
async function abrir(page:Page,index=0){
 await page.route('**/*',r=>new URL(r.request().url()).hostname==='localhost'?r.continue():r.abort());
 await page.goto('/jogar/',{waitUntil:'domcontentloaded'});await injectGameState(page);await page.waitForLoadState('load');
 await page.locator('#forgeBtn:visible, .mdock-btn.forge-item:visible').first().focus();
 const original=await page.evaluate(i=>(0,eval)(`JSON.stringify(nefroArticles[${i}])`),index);
 await page.evaluate(i=>(0,eval)(`showChestModal(nefroArticles[${i}],3,60)`),index);
 return {card:page.locator('#chestModal .nqscroll-dialog'),original:JSON.parse(original)};
}
for(const index of [0,2])test('pergaminho preserva todos os textos e recompensas '+index,async({page})=>{
 const {card,original}=await abrir(page,index);await expect(page.getByRole('dialog',{name:original.titulo+' ('+original.ano+')'})).toBeVisible();
 expect(await card.locator('.nqscroll-sections p').allTextContents()).toEqual(['resumo','conclusao','curiosidade','impacto'].map(k=>original[k]));
 await expect(card.locator('.nqscroll-authors')).toHaveText(original.autores);await expect(card.locator('.nqscroll-journal')).toHaveText(original.jornal);
 await expect(card.locator('.nqscroll-rarity')).toHaveText(index===0?'Lendário':'Épico');expect(await card.locator('.nqscroll-reward strong').allTextContents()).toEqual(['+3','+60']);
 const button=card.getByRole('button',{name:'Continuar'});await expect(button).toBeFocused();expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(48);
 const before=await page.evaluate(()=>(0,eval)('JSON.stringify(state)'));for(const key of ['Tab','Tab','Shift+Tab']){await page.keyboard.press(key);expect(await card.evaluate(el=>el.contains(document.activeElement))).toBe(true);}
 if(process.env.NQ_CAPTURE_DIR)await page.screenshot({path:process.env.NQ_CAPTURE_DIR+'/pergaminho-integrado-'+test.info().project.name+'-'+index+'.png'});
 if(index===0)await button.click();else await page.keyboard.press('Escape');await expect(page.locator('#chestModal')).not.toBeVisible();expect(await page.evaluate(()=>(0,eval)('JSON.stringify(state)'))).toBe(before);
 await expect(page.locator('#forgeBtn:visible, .mdock-btn.forge-item:visible').first()).toBeFocused();
 await page.evaluate(()=>(0,eval)('showChestModal(nefroArticles[2],1,40)'));await expect(card.getByRole('button',{name:'Continuar'})).toBeFocused();await expect(card).toHaveAttribute('data-rarity','epic');
});
for(const width of [320,390])test('pergaminho inteiro a 200% em '+width,async({page})=>{
 await page.setViewportSize({width,height:700});const {card}=await abrir(page);await page.evaluate(()=>document.documentElement.style.fontSize='32px');
 const r=(await card.getByRole('button',{name:'Continuar'}).boundingBox())!;expect(r.x).toBeGreaterThanOrEqual(0);expect(r.x+r.width).toBeLessThanOrEqual(width);expect(r.y+r.height).toBeLessThanOrEqual(700);expect(r.height).toBeGreaterThanOrEqual(48);expect(await card.evaluate(e=>e.scrollWidth<=e.clientWidth)).toBe(true);
 const reading=card.getByRole('region');await reading.focus();await page.keyboard.press('End');await expect.poll(()=>reading.evaluate(e=>e.scrollTop)).toBeGreaterThan(0);expect(await page.evaluate(medirContraste,'#chestModal')).toEqual([]);
 await page.emulateMedia({reducedMotion:'reduce'});expect(await card.locator('.nqscroll-seal path').evaluate(e=>getComputedStyle(e).animationName)).toBe('none');
 if(process.env.NQ_CAPTURE_DIR)await page.screenshot({path:process.env.NQ_CAPTURE_DIR+'/pergaminho-integrado-'+width+'-200.png'});
});
