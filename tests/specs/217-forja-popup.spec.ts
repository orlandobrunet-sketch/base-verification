import { test, expect, type Page } from '@playwright/test';
import { injectGameState } from '../helpers/game';
test.use({serviceWorkers:'block',reducedMotion:'reduce'});
test.beforeEach(async({context,baseURL})=>{
  const origin=new URL(baseURL!).origin;
  await context.route('**/*',r=>r.request().method()==='GET'&&new URL(r.request().url()).origin===origin?r.continue():r.abort());
  await context.routeWebSocket('**/*',socket=>socket.close());
});
async function openForge(page:Page,rarity='epic',occupied=false){
  await page.goto('/jogar/',{waitUntil:'domcontentloaded'});
  const empty=Object.fromEntries(['helmet','glove','armor','weapon','relic','boot'].map(s=>[s,{n:'Vazio',rar:'common',atk:0,def:0,kno:0,luck:0}]));
  await injectGameState(page,{gold:5000,equipment:empty,obtainedItems:[]});
  await page.waitForFunction(()=>!(0,eval)('_loadingNextQuestion'));
  const item=await page.evaluate(({rarity,occupied})=>{
    // Incomum permanece aceito em saves legados, mas não consta do sorteio atual.
    const candidate=(0,eval)(`Object.entries(items).flatMap(([slot,list])=>list.map(item=>({slot,item}))).find(x=>x.item.rar===${JSON.stringify(rarity==='uncommon'?'common':rarity)})`);
    if(!candidate)throw Error('Fixture rarity unavailable');
    if(rarity==='uncommon')candidate.item={...candidate.item,rar:'uncommon'};
    (window as any).__forgePopupRoll=candidate;
    (0,eval)('rollItem = () => ({slot:window.__forgePopupRoll.slot,item:{...window.__forgePopupRoll.item}})');
    if(occupied)(0,eval)(`state.equipment[${JSON.stringify(candidate.slot)}]={n:'Equipamento anterior',rar:'common',atk:1,def:1,kno:1,luck:1}`);
    return {slot:candidate.slot,name:candidate.item.n};
  },{rarity,occupied});
  await page.locator('#forgeBtn:visible,.mdock-btn.forge-item:visible').first().click();
  await expect(page.locator('#forjaPage')).toBeVisible();return item;
}
const geometry=(page:Page)=>page.locator('.nq-forja-opcoes').evaluate(e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height}});
test('resultado abre em diálogo real sem deslocar as opções de forja',async({page})=>{
  await openForge(page);const before=await geometry(page);
  await page.getByRole('button',{name:'Forjar item aleatório',exact:true}).click();
  const dialog=page.locator('#forjaResultDialog');await expect(dialog).toBeVisible();
  expect(await dialog.evaluate(e=>(e as HTMLDialogElement).open&&e.matches(':modal'))).toBe(true);
  const after=await geometry(page);for(const key of Object.keys(before) as (keyof typeof before)[])expect(Math.abs(before[key]-after[key]),key).toBeLessThanOrEqual(1);
  await expect(dialog.getByRole('heading',{name:'Forja concluída'})).toBeVisible();
  await page.keyboard.press('Escape');await expect(dialog).toHaveCount(0);await expect(page.locator('#forjaPage')).toBeVisible();
  await expect(page.getByRole('button',{name:'Forjar item aleatório',exact:true})).toBeFocused();
  expect(await page.evaluate(()=>(0,eval)('state.gold'))).toBe(4700);
});
for(const [rarity,bg] of [['common','rgb(28, 37, 48)'],['uncommon','rgb(16, 44, 35)'],['rare','rgb(17, 40, 63)'],['epic','rgb(39, 25, 53)'],['legendary','rgb(53, 41, 20)']]){
  test(`card ${rarity} usa fundo da raridade e preserva o item realmente equipado`,async({page})=>{
    const item=await openForge(page,rarity);await page.getByRole('button',{name:'Forjar item aleatório',exact:true}).click();
    const card=page.locator('#forjaResultDialog .nq-forja-item-final');await expect(card).toHaveAttribute('data-rarity',rarity);
    await expect(card).toHaveCSS('background-color',bg);await expect(card.getByRole('heading')).toHaveText(item.name);
    expect(await page.evaluate(slot=>(0,eval)(`state.equipment[${JSON.stringify(slot)}].n`),item.slot)).toBe(item.name);
  });
}
test('decisão permanece modal até escolher, resolve uma vez e devolve foco à Forja',async({page})=>{
  const item=await openForge(page,'legendary',true);await page.getByRole('button',{name:'Forjar item aleatório',exact:true}).click();
  const dialog=page.locator('#forjaResultDialog');await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape');await expect(dialog).toBeVisible();
  const choices=dialog.locator('[data-action="decidirForja"]');await expect(choices.first()).toBeEnabled();
  await choices.first().focus();await page.keyboard.press('Shift+Tab');await expect(choices.last()).toBeFocused();
  await page.keyboard.press('Tab');await expect(choices.first()).toBeFocused();await choices.first().click();
  expect(await page.evaluate(()=>(0,eval)('state.forjaPending'))).toBeNull();
  expect(await page.evaluate(()=>(0,eval)('state.gold'))).toBe(4720);
  expect(await page.evaluate(slot=>(0,eval)(`state.equipment[${JSON.stringify(slot)}].n`),item.slot)).toBe(item.name);
  await page.keyboard.press('Escape');await expect(page.locator('#forjaResultDialog')).toHaveCount(0);
  await expect(page.locator('#forjaPage')).toBeVisible();
});

test('compra com saldo exato fecha sem perder foco nem estilos de rolagem',async({page})=>{
  await openForge(page,'common');
  await page.evaluate(()=>{(0,eval)('state.gold=300;_renderForja()');document.body.style.overflow='auto';document.body.style.paddingRight='3px'});
  await page.getByRole('button',{name:'Forjar item aleatório',exact:true}).click();
  await expect(page.locator('#forjaResultDialog')).toBeVisible();
  expect(await page.evaluate(()=>(0,eval)('state.gold'))).toBe(0);
  await page.keyboard.press('Escape');await expect(page.locator('#forjaResultDialog')).toHaveCount(0);
  await expect(page.getByRole('button',{name:'Voltar à jornada',exact:false})).toBeFocused();
  expect(await page.evaluate(()=>({overflow:document.body.style.overflow,padding:document.body.style.paddingRight}))).toEqual({overflow:'auto',padding:'3px'});
  await page.keyboard.press('Escape');await expect(page.locator('#forjaPage')).toHaveCount(0);
});

test('comparação em320px e fonte200% mantém texto e a última escolha alcançáveis',async({page})=>{
  await openForge(page,'epic',true);await page.setViewportSize({width:320,height:740});
  await page.evaluate(()=>{document.documentElement.style.fontSize='32px'});
  await page.getByRole('button',{name:'Forjar item aleatório',exact:true}).click();
  const dialog=page.locator('#forjaResultDialog');await expect(dialog).toBeVisible();
  const box=(await dialog.boundingBox())!;expect(box.x).toBeGreaterThanOrEqual(0);expect(box.x+box.width).toBeLessThanOrEqual(321);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(1);
  const clipped=await dialog.evaluate(root=>[...root.querySelectorAll('p,h2,h3,dt,dd,button')].filter(e=>{const r=e.getBoundingClientRect(),a=root.getBoundingClientRect();return r.width&&(r.left<a.left-1||r.right>a.right+1)}).map(e=>e.textContent));
  expect(clipped).toEqual([]);
  const last=dialog.locator('[data-action="decidirForja"]').last();await expect(last).toBeEnabled();await last.scrollIntoViewIfNeeded();await last.focus();await expect(last).toBeFocused();
  const target=(await last.boundingBox())!;expect(target.height).toBeGreaterThanOrEqual(44);expect(target.y).toBeGreaterThanOrEqual(0);expect(target.y+target.height).toBeLessThanOrEqual(741);
  await last.click();expect(await page.evaluate(()=>(0,eval)('state.gold'))).toBe(4850);
});
