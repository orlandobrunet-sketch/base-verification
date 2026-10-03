import { test, expect, type Page } from '@playwright/test';
import { injectGameState } from '../helpers/game';
import { medirContraste } from '../helpers/contraste';
test.use({serviceWorkers:'block',reducedMotion:'reduce'});
async function abrir(page:Page, index=0){
 await page.route('**/*',r=>new URL(r.request().url()).hostname==='localhost'?r.continue():r.abort());
 await page.goto('/jogar/',{waitUntil:'domcontentloaded'});await injectGameState(page,{gold:0});
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.locator('#forgeBtn:visible, .mdock-btn.forge-item:visible').first().focus();
 await page.evaluate(i=>(0,eval)('showNarrativePopup(narrativeStages['+i+'])'),index);
 const card=page.locator('.nqnarr-card');await expect(card).toBeVisible();return card;
}
test('capítulo mostra o texto e progresso atuais; fechar devolve à questão sem mudar o jogo',async({page})=>{
 const card=await abrir(page);await expect(card).toHaveAccessibleName('O Chamado das Águas');
 await expect(card.locator('.nqnarr-story')).toHaveText(await page.evaluate(()=>(0,eval)('narrativeStages[0].text')));
 await expect(card.locator('.nqnarr-metric strong')).toHaveText(await page.evaluate(()=>(0,eval)('[state.correctTotal,state.level,state.queue.length-state.idx].map(String)')));
 const snapshot=()=>page.evaluate(()=>(0,eval)('JSON.stringify({gold:state.gold,score:state.score,lives:state.lives,correct:state.correctTotal,current:state.current,idx:state.idx,equipment:state.equipment})'));
 const before=await snapshot();const go=card.getByRole('button',{name:'Continuar a Jornada'});await expect(go).toBeFocused();
 for(const key of ['Tab','Tab','Tab','Shift+Tab']){await page.keyboard.press(key);expect(await card.evaluate(e=>e.contains(document.activeElement))).toBe(true)}
 expect(await page.evaluate(medirContraste,'.nqnarr-card')).toEqual([]);
 await go.click();await expect(card).toHaveCount(0);expect(await snapshot()).toBe(before);
 await expect(page.locator('#forgeBtn:visible, .mdock-btn.forge-item:visible').first()).toBeFocused();
 await page.evaluate(()=>(0,eval)('showNarrativePopup(narrativeStages[1])'));await page.keyboard.press('Escape');await expect(card).toHaveCount(0);expect(await snapshot()).toBe(before);
});
for(const width of [320,390,1100])test('narrativa longa legível com texto a 200% em '+width,async({page})=>{
 await page.setViewportSize({width,height:700});
 const card=await abrir(page,9);await page.evaluate(()=>document.documentElement.style.fontSize='32px');
 expect(await card.evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);
 for(const button of await card.locator('button').all()){const b=(await button.boundingBox())!;expect(b.height).toBeGreaterThanOrEqual(44);expect(b.x).toBeGreaterThanOrEqual(0);expect(b.x+b.width).toBeLessThanOrEqual(width+1);expect(b.y+b.height).toBeLessThanOrEqual(700)}
 const region=card.getByRole('region');await region.focus();await page.keyboard.press('End');await expect.poll(()=>region.evaluate(e=>e.scrollHeight<=e.clientHeight||e.scrollTop>0)).toBe(true);
 expect(await card.locator('.water').evaluate(e=>getComputedStyle(e).animationName)).toBe('none');
 if(width<600)expect(await region.evaluate(e=>getComputedStyle(e).scrollbarWidth)).toBe('none');
 if(process.env.NQ_CAPTURE_DIR)await page.screenshot({path:process.env.NQ_CAPTURE_DIR+'/capitulo-integrado-'+width+'-200.png'});
});
