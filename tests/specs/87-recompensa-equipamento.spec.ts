import { test, expect, type Page } from '@playwright/test';
import { injectGameState } from '../helpers/game';
import { medirContraste } from '../helpers/contraste';
test.use({serviceWorkers:'block',reducedMotion:'reduce'});
type RewardItem = { n: string; rar: string; atk: number; def: number; kno: number; luck: number };
async function abrir(page:Page, epic=false, item?:RewardItem){
 await page.route('**/*',r=>new URL(r.request().url()).hostname==='localhost'?r.continue():r.abort());
 await page.goto('/jogar/',{waitUntil:'domcontentloaded'});await injectGameState(page);await page.waitForLoadState('load');
 await page.locator('#forgeBtn:visible, .mdock-btn.forge-item:visible').first().focus();
 await mostrar(page, item ?? (epic ? {n:'Espada Nefroprotetora',rar:'epic',atk:7,def:2,kno:3,luck:2} : {n:'Excalibur do Néfron',rar:'legendary',atk:11,def:3,kno:4,luck:3}));
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

async function mostrar(page: Page, item: RewardItem) {
 await page.evaluate(item => (0, eval)(`showForgePopup(${JSON.stringify(item)},'weapon',['bônus'],'Equipamento Encontrado!')`), item);
}

const recompensas: { item: RewardItem; label: string; image: string }[] = [
 {item:{n:'Cetro do Néfron Eterno',rar:'legendary',atk:12,def:2,kno:5,luck:4},label:'Lendário',image:'cetro_nefron.png'},
 {item:{n:'Espada Nefroprotetora',rar:'epic',atk:7,def:2,kno:3,luck:2},label:'Épico',image:'espada_nefroprotetora.png'},
 {item:{n:'Lança Glomerular',rar:'rare',atk:4,def:1,kno:2,luck:1},label:'Raro',image:'lanca_glomerular.png'},
 {item:{n:'Bisturi de Plantão',rar:'common',atk:1,def:0,kno:1,luck:0},label:'Comum',image:'bisturi_plantao.png'},
 // O componente também aceita Incomum; esta fixture cobre sua moldura sem alterar o catálogo.
 {item:{n:'Bisturi de Plantão',rar:'uncommon',atk:1,def:0,kno:1,luck:0},label:'Incomum',image:'bisturi_plantao.png'},
];

for (const viewport of [
 {width:1280,height:800,fontSize:16}, {width:390,height:844,fontSize:16},
 {width:320,height:568,fontSize:16}, {width:320,height:568,fontSize:32},
]) test(`moldura acompanha a arte inteira nas cinco raridades em ${viewport.width}px com texto a ${viewport.fontSize / 16 * 100}%`, async ({page}) => {
 await page.setViewportSize({width:viewport.width,height:viewport.height});
 let card = await abrir(page, false, recompensas[0].item);
 await page.evaluate(size => document.documentElement.style.fontSize = size + 'px', viewport.fontSize);
 const stateBefore = await page.evaluate(() => (0,eval)('JSON.stringify(state)'));
 for (let index = 0; index < recompensas.length; index++) {
  const {item,label,image} = recompensas[index];
  if (index) { await mostrar(page, item); card = page.locator('.nqreward-card'); }
  await expect(card).toHaveAttribute('data-rarity',item.rar);
  await expect(card.locator('.nqreward-rarity')).toHaveText(label);
  await expect(card.locator('h3')).toHaveText(item.n);
  expect(await card.locator('dd span').allTextContents()).toEqual([item.atk,item.def,item.kno,item.luck].map(String));
  const art = card.locator('.nqreward-art'), img = art.locator('img');
  await expect(img).toHaveAttribute('src',new RegExp('assets/items/' + image.replace('.', '\.') + '$'));
  await expect.poll(() => img.evaluate(el => (el as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  await art.scrollIntoViewIfNeeded();
  const geometry = await art.evaluate(el => {
   const img = el.querySelector('img')!;
   const frame = el.getBoundingClientRect(), image = img.getBoundingClientRect();
   const frameStyle = getComputedStyle(el), imageStyle = getComputedStyle(img);
   const number = (value: string) => parseFloat(value) || 0;
   const corner = (pseudo: string) => {
    const style = getComputedStyle(el,pseudo);
    const width = number(style.width) + (style.boxSizing === 'border-box' ? 0 : number(style.borderLeftWidth) + number(style.borderRightWidth));
    const height = number(style.height) + (style.boxSizing === 'border-box' ? 0 : number(style.borderTopWidth) + number(style.borderBottomWidth));
    const left = style.left !== 'auto' ? frame.left + number(frameStyle.borderLeftWidth) + number(style.left) : frame.right - number(frameStyle.borderRightWidth) - number(style.right) - width;
    const top = style.top !== 'auto' ? frame.top + number(frameStyle.borderTopWidth) + number(style.top) : frame.bottom - number(frameStyle.borderBottomWidth) - number(style.bottom) - height;
    return {left,top,right:left+width,bottom:top+height,content:style.content};
   };
   return {
    frame:{width:frame.width,height:frame.height,left:frame.left,right:frame.right},
    image:{width:image.width,height:image.height,left:image.left,right:image.right,top:image.top,bottom:image.bottom},
    insets:[image.left-frame.left,image.top-frame.top,frame.right-image.right,frame.bottom-image.bottom],
    natural:[img.naturalWidth,img.naturalHeight],fit:imageStyle.objectFit,position:imageStyle.objectPosition,
    corners:[corner('::before'),corner('::after')],
   };
  });
  expect(Math.abs(geometry.frame.width-geometry.frame.height),item.n + ': moldura quadrada').toBeLessThanOrEqual(1);
  expect(Math.abs(geometry.image.width-geometry.image.height),item.n + ': imagem sem faixa vertical').toBeLessThanOrEqual(1);
  expect(geometry.natural).toEqual([384,384]);
  expect(geometry.fit,item.n + ': arte inteira, sem recorte').toBe('contain');
  expect(geometry.position).toBe('50% 50%');
  expect(Math.max(...geometry.insets)-Math.min(...geometry.insets),item.n + ': moldura centrada na arte').toBeLessThanOrEqual(1);
  expect(Math.min(...geometry.insets)).toBeGreaterThanOrEqual(0);
  expect(Math.max(...geometry.insets),item.n + ': sem sobras alongadas').toBeLessThanOrEqual(8);
  expect(geometry.frame.left).toBeGreaterThanOrEqual(0);
  expect(geometry.frame.right).toBeLessThanOrEqual(viewport.width);
  for (const corner of geometry.corners) {
   expect(corner.content).not.toBe('none');
   expect(corner.left).toBeGreaterThanOrEqual(geometry.image.left-1);
   expect(corner.top).toBeGreaterThanOrEqual(geometry.image.top-1);
   expect(corner.right).toBeLessThanOrEqual(geometry.image.right+1);
   expect(corner.bottom).toBeLessThanOrEqual(geometry.image.bottom+1);
  }
  if (process.env.NQ_CAPTURE_DIR) await page.screenshot({path:`${process.env.NQ_CAPTURE_DIR}/recompensa-moldura-${test.info().project.name}-${viewport.width}-${viewport.fontSize}-${item.rar}.png`});
  await card.getByRole('button',{name:'Continuar'}).click();
  await expect(card).toHaveCount(0);
  expect(await page.evaluate(() => (0,eval)('JSON.stringify(state)'))).toBe(stateBefore);
 }
});
