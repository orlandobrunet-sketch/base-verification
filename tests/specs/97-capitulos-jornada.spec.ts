import { test, expect, type Page } from '@playwright/test';
import { injectGameState } from '../helpers/game';
import { medirContraste } from '../helpers/contraste';
import { attachFailureEvidence } from '../helpers/failure-evidence';
test.use({serviceWorkers:'block',contextOptions: { reducedMotion:'reduce' }});
test.afterEach(async ({ page }, info) => {
  if (info.status !== info.expectedStatus) await attachFailureEvidence(page, info);
});
async function abrir(page:Page, index=0){
 await page.route('**/*',r=>new URL(r.request().url()).hostname==='localhost'?r.continue():r.abort());
 await page.goto('/jogar/',{waitUntil:'domcontentloaded'});await injectGameState(page,{gold:0,correctTotal:index===0?5:0});
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.locator('#forgeBtn:visible, .mdock-btn.forge-item:visible').first().focus();
 await page.evaluate(i=>(0,eval)('showNarrativePopup(narrativeStages['+i+'])'),index);
 const card=page.locator('.nqnarr-card[data-nq-chapter]');await expect(card).toBeVisible();return card;
}
test('capítulo mostra o texto e progresso atuais; fechar devolve à questão sem mudar o jogo',async({page})=>{
 const card=await abrir(page);await expect(card).toHaveAccessibleName('O Chamado das Águas');
 await expect(card.locator('.nqnarr-chapter')).toHaveText('Capítulo I desbloqueado');
 await expect(card.locator('.nqchapter-art')).toBeVisible();
 await expect(card.locator('.nqchapter-scroll-paper')).toHaveCSS('animation-name','none');
 const path=card.getByRole('list',{name:'Marcos da jornada'});
 await expect(path.locator('[aria-current="step"]')).toHaveText(/Capítulo I.*5 acertos/);
 await expect(path.getByRole('listitem').nth(1)).toHaveText(/Capítulo II.*Faltam 5 acertos/);
 const story=card.locator('.nqnarr-story');
 await expect(story).toContainText('A próxima pista está nas Criptas da Creatinina.');
 await expect(story).not.toContainText('Sua jornada começa agora.');
 expect(await path.evaluate(e=>!!(e.compareDocumentPosition(document.querySelector('#nqNarrativeStory')!)&Node.DOCUMENT_POSITION_FOLLOWING))).toBe(true);
 const snapshot=()=>page.evaluate(()=>(0,eval)('JSON.stringify({gold:state.gold,score:state.score,lives:state.lives,correct:state.correctTotal,current:state.current,idx:state.idx,equipment:state.equipment})'));
 const before=await snapshot();const go=card.getByRole('button',{name:'Continuar a Jornada'});await expect(go).toBeFocused();
 for(const key of ['Tab','Tab','Tab','Shift+Tab']){await page.keyboard.press(key);expect(await card.evaluate(e=>e.contains(document.activeElement))).toBe(true)}
 expect(await page.evaluate(medirContraste,'.nqnarr-card[data-nq-chapter]')).toEqual([]);
 await go.click();await expect(card).toHaveCount(0);expect(await snapshot()).toBe(before);
 await expect(page.locator('#forgeBtn:visible, .mdock-btn.forge-item:visible').first()).toBeFocused();
 await page.evaluate(()=>(0,eval)('showNarrativePopup(narrativeStages[1])'));await page.keyboard.press('Escape');await expect(card).toHaveCount(0);expect(await snapshot()).toBe(before);
});
for(const width of [320,390,1100])test('narrativa longa legível com texto a 200% em '+width,async({page})=>{
 await page.setViewportSize({width,height:700});
 const card=await abrir(page,width===1100?9:0);await page.evaluate(()=>document.documentElement.style.fontSize='32px');
 expect(await card.evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);
 for(const button of await card.locator('button').all()){const b=(await button.boundingBox())!;expect(b.height).toBeGreaterThanOrEqual(44);expect(b.x).toBeGreaterThanOrEqual(0);expect(b.x+b.width).toBeLessThanOrEqual(width+1);expect(b.y+b.height).toBeLessThanOrEqual(700)}
 const region=card.getByRole('region');await region.focus();await page.keyboard.press('End');await expect.poll(()=>region.evaluate(e=>e.scrollHeight<=e.clientHeight||e.scrollTop>0)).toBe(true);
 expect(await card.locator('.water,.nqchapter-scroll-paper').evaluate(e=>getComputedStyle(e).animationName)).toBe('none');
 if(width<600)expect(await region.evaluate(e=>getComputedStyle(e).scrollbarWidth)).toBe('none');
 if(process.env.NQ_CAPTURE_DIR)await page.screenshot({path:process.env.NQ_CAPTURE_DIR+'/capitulo-integrado-'+width+'-200.png'});
});
