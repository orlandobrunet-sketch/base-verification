import { test, expect, type Locator, type Page } from '@playwright/test';
import { medirContraste } from '../helpers/contraste';
test.use({serviceWorkers:'block',reducedMotion:'reduce'});
async function abrir(page:Page,id='glomerulus'){
 await page.route('**/*',r=>new URL(r.request().url()).hostname==='localhost'?r.continue():r.abort());
 await page.goto('/jogar/',{waitUntil:'domcontentloaded'});await page.emulateMedia({reducedMotion:'reduce'});await page.waitForFunction(()=>typeof (window as any)._confirmDiff==='function');
 await page.evaluate(()=>(0,eval)('_pendingDiff="normal";_confirmDiff(false)'));
 await page.locator('#charSelectModal [data-arg="'+id+'"]').click();const card=page.locator('.nqinicio-card');await expect(card).toBeVisible();return card;
}
async function esperarLeituraEstavel(card:Locator,rootFont:number,normalType:{title:number,story:number}|null){
 // Dois RAF podem preceder o recálculo de rem dentro do container. End deve
 // alcançar a região já ampliada, não a geometria anterior que ainda cabia.
 await expect.poll(()=>card.evaluate(async(element,{rootFont,normalType})=>{
  const region=element.querySelector<HTMLElement>('[role="region"]')!;
  const title=element.querySelector<HTMLElement>('h2')!;
  const story=element.querySelector<HTMLElement>('.nqinicio-story')!;
  let previous='',stable=0;
  for(let frame=0;frame<4;frame++){
   await new Promise<void>(resolve=>requestAnimationFrame(()=>resolve()));
   const titleFont=parseFloat(getComputedStyle(title).fontSize);
   const storyFont=parseFloat(getComputedStyle(story).fontSize);
   const ready=parseFloat(getComputedStyle(document.documentElement).fontSize)===rootFont&&
    (!normalType||(titleFont>normalType.title&&storyFont>normalType.story));
   const geometry=JSON.stringify([titleFont,storyFont,region.scrollHeight,region.clientHeight,
    ...[region,title,story].map(node=>{const box=node.getBoundingClientRect();return[box.x,box.y,box.width,box.height]})]);
   stable=ready&&geometry===previous?stable+1:0;previous=geometry;
   if(stable>=2)return true;
  }
  return false;
 },{rootFont,normalType})).toBe(true);
}
for(const [id,name]of [['glomerulus','Dr. Glomerulus'],['aquaria','Dra. Aquaria'],['nephros','Dr. Nephros']])test('apresentação de '+id+' inicia a jornada com a escolha preservada',async({page})=>{
 const card=await abrir(page,id);await expect(card).toHaveAccessibleName(name);await expect(card.locator('.nqinicio-story')).toHaveText(await page.evaluate(i=>(0,eval)('CHARACTER_INTROS["'+i+'"].text'),id));
 await expect.poll(()=>card.locator('img').evaluate((e:HTMLImageElement)=>e.complete&&e.naturalWidth>0)).toBe(true);
 const button=card.getByRole('button',{name:'Iniciar Jornada',exact:true});await expect(button).toBeFocused();for(const key of ['Tab','Tab','Shift+Tab']){await page.keyboard.press(key);expect(await card.evaluate(e=>e.contains(document.activeElement))).toBe(true)}
 expect(await page.evaluate(medirContraste,'.nqinicio-card')).toEqual([]);await button.click();await expect(card).toHaveCount(0);await expect(page.locator('#question')).not.toBeEmpty();
 await expect.poll(()=>page.evaluate(()=>(0,eval)('state.gameStarted'))).toBe(true);expect(await page.evaluate(()=>(0,eval)('state.character'))).toBe(id);expect(await page.evaluate(()=>(0,eval)('state.correctTotal'))).toBe(0);
});
for(const width of [320,390,1100])test('nome sem letras partidas e leitura ampliada em '+width,async({page})=>{
 await page.setViewportSize({width,height:740});const card=await abrir(page);
 let normalType:{title:number,story:number}|null=null;
 for(const large of [false,true]){
  await page.evaluate(async big=>{document.documentElement.style.fontSize=big?'32px':'16px';await new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())));},large);const title=card.locator('h2');
  await esperarLeituraEstavel(card,large?32:16,large?normalType:null);
  if(!large)normalType=await card.evaluate(element=>({title:parseFloat(getComputedStyle(element.querySelector('h2')!).fontSize),story:parseFloat(getComputedStyle(element.querySelector('.nqinicio-story')!).fontSize)}));
  expect(await title.evaluate(e=>getComputedStyle(e).overflowWrap)).toBe('normal');expect(await title.evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);
  expect(await title.evaluate(e=>{const text=e.firstChild!,start=text.textContent!.indexOf('Glomerulus'),range=document.createRange();range.setStart(text,start);range.setEnd(text,start+10);return range.getClientRects().length})).toBe(1);
  const region=card.getByRole('region');await region.focus();await page.keyboard.press('End');await expect.poll(()=>region.evaluate(e=>e.scrollHeight<=e.clientHeight||e.scrollTop>0)).toBe(true);
  const rect=(await card.getByRole('button').boundingBox())!;expect(rect.height).toBeGreaterThanOrEqual(44);expect(rect.x).toBeGreaterThanOrEqual(0);expect(rect.x+rect.width).toBeLessThanOrEqual(width+1);expect(rect.y+rect.height).toBeLessThanOrEqual(740);
  expect(await card.locator('img').evaluate(e=>getComputedStyle(e).animationName)).toBe('none');
 }
});
