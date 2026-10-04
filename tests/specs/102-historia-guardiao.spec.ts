import { test, expect, type Page } from '@playwright/test';
import { injectGameState } from '../helpers/game';
import { medirContraste } from '../helpers/contraste';
test.use({serviceWorkers:'block',reducedMotion:'reduce'});
test.beforeEach(({},info)=>test.skip(info.project.name!=='chromium','Cenários fixam a própria viewport.'));
async function abrir(page:Page,id='glomerulus',width=1100){
 await page.setViewportSize({width:1100,height:740});await page.route('**/*',r=>new URL(r.request().url()).hostname==='localhost'?r.continue():r.abort());await page.goto('/jogar/',{waitUntil:'domcontentloaded'});await injectGameState(page,{character:id});
 await page.evaluate(()=>(0,eval)('state.equipment.weapon={...state.equipment.weapon,atk:7,def:3,kno:5,luck:2};'));
 const before=await page.evaluate(()=>(0,eval)('JSON.stringify({state,lore:heroLores[state.character],stats:total(),image:ui.heroImg.src})'));
 await page.emulateMedia({reducedMotion:'reduce'});const origin=page.getByRole('button',{name:'Ver história do personagem'});await origin.click();await page.setViewportSize({width,height:740});const card=page.locator('.nqlore-card');await expect(card).toBeVisible();return {card,before,origin};
}
for(const [id,name]of [['glomerulus','Dr. Glomerulus'],['aquaria','Dra. Aquaria'],['nephros','Dr. Nephros']])test('história de '+id+' preserva retrato, texto, atributos e jornada',async({page})=>{
 const {card,before,origin}=await abrir(page,id);const source=JSON.parse(before);await expect(card).toHaveAccessibleName(name);await expect(card.locator('.nqlore-story p')).toHaveText([source.lore.p1,source.lore.p2]);await expect(card.locator('.nqlore-stats dd')).toHaveText(['atk','def','kno','luck'].map(k=>String(source.stats[k])));await expect(card.locator('img')).toHaveAttribute('src',source.image);await expect.poll(()=>card.locator('img').evaluate((e:HTMLImageElement)=>e.complete&&e.naturalWidth>0)).toBe(true);
 const close=card.getByRole('button',{name:'Voltar à Jornada'});await expect(close).toBeFocused();for(const key of ['Tab','Tab','Shift+Tab']){await page.keyboard.press(key);expect(await card.evaluate(e=>e.contains(document.activeElement))).toBe(true);}expect(await page.evaluate(medirContraste,'.nqlore-card')).toEqual([]);
 await close.click();await expect(card).toHaveCount(0);await expect(origin).toBeFocused();expect(await page.evaluate(()=>(0,eval)('JSON.stringify({state,lore:heroLores[state.character],stats:total(),image:ui.heroImg.src})'))).toBe(before);
 await origin.click();await page.keyboard.press('Escape');await expect(card).toHaveCount(0);await expect(origin).toBeFocused();
});
for(const width of [320,390,1100])test('história acessível com fonte ampliada em '+width,async({page})=>{
 const {card}=await abrir(page,'glomerulus',width);await page.evaluate(async()=>{document.documentElement.style.fontSize='32px';await new Promise<void>(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r())));});expect(await card.locator('h2').evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);
 expect(await card.locator('.nqlore-stats>div').evaluateAll(els=>els.every(e=>[...e.querySelectorAll('dt,dd')].every(n=>n.scrollWidth<=n.clientWidth+1)))).toBe(true);const texts=await card.evaluate(el=>{const out:string[]=[];const walk=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);for(let n=walk.nextNode();n;n=walk.nextNode()){if(!n.textContent?.trim())continue;const range=document.createRange();range.selectNodeContents(n);if([...range.getClientRects()].some(r=>r.width&&(r.left<0||r.right>innerWidth+1)))out.push(n.textContent!);}return out;});expect(texts).toEqual([]);
 const region=card.getByRole('region');await region.focus();await page.keyboard.press('End');await expect.poll(()=>region.evaluate(e=>e.scrollHeight<=e.clientHeight||e.scrollTop>0)).toBe(true);const button=(await card.getByRole('button').boundingBox())!;expect(button.height).toBeGreaterThanOrEqual(44);expect(button.y+button.height).toBeLessThanOrEqual(740);expect(await card.locator('img').evaluate(e=>getComputedStyle(e).animationName)).toBe('none');
});
