import { test, expect, type Page } from '@playwright/test';
import { injectGameState } from '../helpers/game';
import { medirContraste } from '../helpers/contraste';
test.use({serviceWorkers:'block',reducedMotion:'reduce'});
const personagens={
 nephros:{title:'Mestre das Glomerulopatias',image:'assets/classes/clerigo_renal/nivel_08.jpg',lore:'As Catacumbas das Glomerulopatias se abrem. Você decifra biopsias como um arquélogo do rim.'},
 aquaria:{title:'Mestra das Glomerulopatias',image:'assets/classes/maga_metabolica/nivel_08.jpg',lore:'As águas profundas da síndrome nefrótica revelam seus segredos. Você é a guaraniã da barreira de filtração.'},
 glomerulus:{title:'Doutor das Glomerulopatias',image:'assets/classes/guerreiro_glomerular/nivel_08.png',lore:'Seus estudos sobre podocitopatas são citados em todo o reino. A ciência renal te deve uma dívida.'}
};
async function abrir(page:Page,id:keyof typeof personagens='nephros',level=8){
 await page.route('**/*',r=>new URL(r.request().url()).hostname==='localhost'?r.continue():r.abort());
 await page.goto('/jogar/',{waitUntil:'domcontentloaded'});await injectGameState(page,{character:id});await page.waitForLoadState('load');
 const origin=page.locator('#forgeBtn:visible, .mdock-btn.forge-item:visible').first();await origin.focus();
 const before=await page.evaluate(()=>(0,eval)('JSON.stringify(state)'));
 await page.evaluate(({level,char})=>(0,eval)(`showEvolutionPopup(${level},${JSON.stringify(char.title)},${JSON.stringify(char.image)})`),{level,char:personagens[id]});
 return {card:page.locator('.nqevo-card'),before,origin};
}
for(const id of Object.keys(personagens) as (keyof typeof personagens)[])test('evolução preserva retrato, título e narrativa '+id,async({page})=>{
 const {card,before,origin}=await abrir(page,id);await expect(page.getByRole('dialog',{name:personagens[id].title})).toBeVisible();await expect(card.locator('.nqevo-level')).toHaveText('Nível 8 alcançado');await expect(card.locator('.nqevo-description')).toHaveText(personagens[id].lore);
 await expect.poll(()=>card.locator('img').evaluate(el=>(el as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);const button=card.getByRole('button',{name:'Continuar'});await expect(button).toBeFocused();expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(48);
 for(const key of ['Tab','Tab','Shift+Tab']){await page.keyboard.press(key);expect(await card.evaluate(el=>el.contains(document.activeElement))).toBe(true);}
 if(process.env.NQ_CAPTURE_DIR)await page.screenshot({path:process.env.NQ_CAPTURE_DIR+'/evolucao-integrada-'+test.info().project.name+'-'+id+'.png'});
 if(id==='aquaria')await page.keyboard.press('Escape');else await button.click();await expect(card).toHaveCount(0);await expect(origin).toBeFocused();expect(await page.evaluate(()=>(0,eval)('JSON.stringify(state)'))).toBe(before);
});
test('nível sem narrativa específica conserva o texto de fallback',async({page})=>{const {card}=await abrir(page,'nephros',16);await expect(card.locator('.nqevo-description')).toHaveText('Você evoluiu! Continue sua jornada rumo à maestria nefrológica.');});
for(const width of [320,390])test('evolução completa e botão acessível a 200% em '+width,async({page})=>{
 await page.setViewportSize({width,height:700});const {card}=await abrir(page,'glomerulus');await page.evaluate(()=>document.documentElement.style.fontSize='32px');
 const r=(await card.getByRole('button',{name:'Continuar'}).boundingBox())!;expect(r.x).toBeGreaterThanOrEqual(0);expect(r.x+r.width).toBeLessThanOrEqual(width);expect(r.y+r.height).toBeLessThanOrEqual(700);expect(r.height).toBeGreaterThanOrEqual(48);expect(await card.evaluate(el=>el.scrollWidth<=el.clientWidth)).toBe(true);
 const reading=card.getByRole('region');await reading.focus();await page.keyboard.press('End');await expect.poll(()=>reading.evaluate(el=>el.scrollTop)).toBeGreaterThan(0);expect(await page.evaluate(medirContraste,'.evolution-popup')).toEqual([]);
 await page.emulateMedia({reducedMotion:'reduce'});await expect(card.locator('.nqevo-light')).not.toBeVisible();
 if(process.env.NQ_CAPTURE_DIR)await page.screenshot({path:process.env.NQ_CAPTURE_DIR+'/evolucao-integrada-'+width+'-200.png'});
});
test('luz percorre somente uma vez e desaparece ao terminar',async({page})=>{const {card}=await abrir(page);await page.emulateMedia({reducedMotion:'no-preference'});const line=card.locator('.nqevo-light rect');expect(await line.evaluate(el=>getComputedStyle(el).animationIterationCount)).toBe('1');await expect.poll(()=>line.evaluate(el=>getComputedStyle(el).opacity)).toBe('0');});
